import * as Phaser from "phaser";
import { AssetLoader } from "../utils/asset-loader";
import { CheckpointNode, CheckpointStatus } from "../entities/Checkpoint";
import { Persona, PersonaGender } from "../entities/Persona";
import { BossSilhouette } from "../entities/Boss";
import { MiniBoss, type MiniBossType } from "../entities/MiniBoss";
import { audioManager, type CheckpointSFXId } from "../../audio/audioManager";
import { eventBridge, type CheckpointState } from "../utils/event-bridge";
import { VENTURE_STAGES } from "@convex/ventureConstants";
import {
  createCheckpointAnimation,
  getAnimationTypeForStage,
  type AnimationVariant,
  type BaseCheckpointAnimation,
} from "./animations";

/**
 * Biome configuration for the 8 venture stages
 * Following PRD specifications for visual themes
 */
interface BiomeConfig {
  id: number;
  name: string;
  theme: string;
  colors: {
    sky: number;
    ground: number;
    accent1: number;
    accent2: number;
    path: number;
  };
}

const BIOME_CONFIGS: BiomeConfig[] = [
  {
    id: 1,
    name: "The Village",
    theme: "Ideation",
    colors: {
      sky: 0x87ceeb,
      ground: 0x90ee90,
      accent1: 0x8b4513,
      accent2: 0xffd700,
      path: 0xd2b48c,
    },
  },
  {
    id: 2,
    name: "The Forest",
    theme: "Research",
    colors: {
      sky: 0x6b8e23,
      ground: 0x228b22,
      accent1: 0x2f4f2f,
      accent2: 0x98fb98,
      path: 0x8b7355,
    },
  },
  {
    id: 3,
    name: "The Arena",
    theme: "Validation",
    colors: {
      sky: 0xff8c00,
      ground: 0xd2691e,
      accent1: 0xb22222,
      accent2: 0xffd700,
      path: 0xdaa520,
    },
  },
  {
    id: 4,
    name: "The Artisan's Quarter",
    theme: "Offer Design",
    colors: {
      sky: 0x9370db,
      ground: 0xdda0dd,
      accent1: 0x4b0082,
      accent2: 0xffa500,
      path: 0xc0c0c0,
    },
  },
  {
    id: 5,
    name: "The Mine",
    theme: "Build & Deliver",
    colors: {
      sky: 0x2f4f4f,
      ground: 0x696969,
      accent1: 0x000000,
      accent2: 0xffa500,
      path: 0x808080,
    },
  },
  {
    id: 6,
    name: "The Harbour",
    theme: "Launch",
    colors: {
      sky: 0x1e90ff,
      ground: 0xf0e68c,
      accent1: 0x4682b4,
      accent2: 0xffffff,
      path: 0xc0c0c0,
    },
  },
  {
    id: 7,
    name: "The Crossroads Town",
    theme: "Iteration",
    colors: {
      sky: 0xffa07a,
      ground: 0xdeb887,
      accent1: 0xcd853f,
      accent2: 0xff6347,
      path: 0xbc8f8f,
    },
  },
  {
    id: 8,
    name: "The Capital",
    theme: "Scale",
    colors: {
      sky: 0xffd700,
      ground: 0xfffacd,
      accent1: 0xdaa520,
      accent2: 0xffff00,
      path: 0xf0e68c,
    },
  },
];

/**
 * WorldMapScene - PRD-compliant implementation
 *
 * Features:
 * - Snake-path overworld across 8 biome zones (left to right)
 * - Two-layer brightness system (accumulated base + stage layer)
 * - 36 checkpoint nodes across 8 stages
 * - Persona sprite floating above active checkpoint
 * - Super Boss + 8 mini-bosses
 */
export class WorldMapScene extends Phaser.Scene {
  // Core entities
  private checkpointNodes: Map<string, CheckpointNode>;
  private persona: Persona | null;
  private bosses: Map<string, BossSilhouette>;
  private miniBosses: Map<number, MiniBoss>;

  // Scene layers
  private backgroundLayer!: Phaser.GameObjects.Container;
  private midgroundLayer!: Phaser.GameObjects.Container;
  private gameLayer!: Phaser.GameObjects.Container;
  private animationLayer!: Phaser.GameObjects.Container;

  // Animation state
  private currentAnimation: BaseCheckpointAnimation | null = null;

  // Brightness system (PRD two-layer formula)
  private brightnessFilter: Phaser.FX.ColorMatrix | null = null;
  private currentBrightness: number = 0;

  // Venture state
  private currentVentureId: string | null;
  private currentStage: number = 1;
  private completedStages: number = 0;
  private stageTasksCompleted: number = 0;
  private stageTasksTotal: number = 0;

  // Event handlers
  private boundHandlers: {
    updateBrightness?: (event: { brightness: number }) => void;
    updateCheckpoints?: (event: { checkpoints: CheckpointState[] }) => void;
    setActiveVenture?: (event: {
      ventureId: string;
      personaGender: "male" | "female";
      assignedBosses?: string[];
      currentStage?: number;
    }) => void;
    scrollToCheckpoint?: (event: { checkpointId: string }) => void;
    playCheckpointAnimation?: (event: {
      checkpointId: string;
      stage: number;
      variant: "standard" | "gold";
    }) => void;
  };

  // Map dimensions
  private readonly TOTAL_CHECKPOINTS = 36;
  private readonly BIOME_WIDTH = 1400;
  private readonly MAP_WIDTH = this.BIOME_WIDTH * 8;
  private readonly MAP_HEIGHT = 1200;

  // Snake path configuration
  private readonly CHECKPOINT_SPACING = 220;
  private readonly SNAKE_AMPLITUDE = 180;
  private readonly PATH_Y_CENTER = this.MAP_HEIGHT / 2;

  // Biome containers
  private biomeContainers: Map<number, Phaser.GameObjects.Container> =
    new Map();

  constructor() {
    super({ key: "WorldMap" });
    this.checkpointNodes = new Map();
    this.persona = null;
    this.bosses = new Map();
    this.miniBosses = new Map();
    this.currentVentureId = null;
    this.boundHandlers = {};
  }

  preload(): void {
    AssetLoader.preloadAssets(this);
    AssetLoader.createAllTextures(this);
  }

  create(): void {
    // Initialize audio
    audioManager.init();

    // Set up world bounds
    this.cameras.main.setBounds(0, 0, this.MAP_WIDTH, this.MAP_HEIGHT);
    this.physics.world.setBounds(0, 0, this.MAP_WIDTH, this.MAP_HEIGHT);

    // Create scene layers
    this.backgroundLayer = this.add.container(0, 0);
    this.midgroundLayer = this.add.container(0, 0);
    this.gameLayer = this.add.container(0, 0);
    this.animationLayer = this.add.container(0, 0);

    this.backgroundLayer.setDepth(0);
    this.midgroundLayer.setDepth(10);
    this.gameLayer.setDepth(20);
    this.animationLayer.setDepth(100);

    // Create brightness filter
    const camera = this.cameras.main;
    this.brightnessFilter = camera.postFX.addColorMatrix();

    // Build world
    this.createBiomeZones();
    this.createSnakePath();
    this.createSuperBoss();
    this.createMiniBosses();

    // Set up event listeners
    this.setupEventListeners();

    // Apply initial brightness (0%)
    this.updateBrightnessFilter(0);

    // Camera setup
    this.cameras.main.setZoom(0.8);
    this.cameras.main.centerOn(this.MAP_WIDTH / 2, this.MAP_HEIGHT / 2);

    // Enable camera drag
    this.input.on("pointerdown", () => {
      audioManager.unlock();
    });

    this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      if (pointer.isDown) {
        this.cameras.main.scrollX -=
          (pointer.x - pointer.prevPosition.x) / this.cameras.main.zoom;
        this.cameras.main.scrollY -=
          (pointer.y - pointer.prevPosition.y) / this.cameras.main.zoom;
      }
    });

    // Signal React that Phaser is ready
    eventBridge.dispatchToReact({ type: "PHASER_READY" });

    // FPS monitoring
    this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => {
        eventBridge.dispatchToReact({
          type: "FPS_UPDATE",
          fps: Math.round(this.game.loop.actualFps),
        });
      },
    });
  }

  /**
   * Creates all 8 biome visual zones left to right
   */
  private createBiomeZones(): void {
    BIOME_CONFIGS.forEach((biome, index) => {
      const container = this.add.container(index * this.BIOME_WIDTH, 0);
      this.biomeContainers.set(biome.id, container);
      this.backgroundLayer.add(container);

      // Draw biome background
      this.drawBiomeBackground(container, biome);

      // Add biome decorations
      this.addBiomeDecorations(container, biome);

      // Add biome label
      this.addBiomeLabel(container, biome);
    });
  }

  /**
   * Draws background for a biome zone
   */
  private drawBiomeBackground(
    container: Phaser.GameObjects.Container,
    biome: BiomeConfig,
  ): void {
    const graphics = this.add.graphics();

    // Sky
    graphics.fillStyle(biome.colors.sky, 1);
    graphics.fillRect(0, 0, this.BIOME_WIDTH, this.MAP_HEIGHT * 0.6);

    // Ground
    graphics.fillStyle(biome.colors.ground, 1);
    graphics.fillRect(
      0,
      this.MAP_HEIGHT * 0.6,
      this.BIOME_WIDTH,
      this.MAP_HEIGHT * 0.4,
    );

    // Add texture variation
    for (let i = 0; i < 20; i++) {
      const x = Math.random() * this.BIOME_WIDTH;
      const y = this.MAP_HEIGHT * 0.6 + Math.random() * this.MAP_HEIGHT * 0.4;
      const size = 10 + Math.random() * 20;
      graphics.fillStyle(biome.colors.accent1, 0.3);
      graphics.fillCircle(x, y, size);
    }

    container.add(graphics);
  }

  /**
   * Adds decorative elements specific to each biome
   */
  private addBiomeDecorations(
    container: Phaser.GameObjects.Container,
    biome: BiomeConfig,
  ): void {
    const decorations = this.add.graphics();

    switch (biome.id) {
      case 1: // The Village
        this.drawVillageDecorations(decorations, biome);
        break;
      case 2: // The Forest
        this.drawForestDecorations(decorations, biome);
        break;
      case 3: // The Arena
        this.drawArenaDecorations(decorations, biome);
        break;
      case 4: // The Artisan's Quarter
        this.drawArtisanDecorations(decorations, biome);
        break;
      case 5: // The Mine
        this.drawMineDecorations(decorations, biome);
        break;
      case 6: // The Harbour
        this.drawHarbourDecorations(decorations, biome);
        break;
      case 7: // The Crossroads
        this.drawCrossroadsDecorations(decorations, biome);
        break;
      case 8: // The Capital
        this.drawCapitalDecorations(decorations, biome);
        break;
    }

    container.add(decorations);
  }

  private drawVillageDecorations(
    graphics: Phaser.GameObjects.Graphics,
    biome: BiomeConfig,
  ): void {
    for (let i = 0; i < 5; i++) {
      const x = 200 + i * 200;
      const y = this.MAP_HEIGHT * 0.55;
      graphics.fillStyle(biome.colors.accent1, 1);
      graphics.fillRect(x, y, 80, 60);
      graphics.fillStyle(biome.colors.accent2, 1);
      graphics.fillTriangle(x - 10, y, x + 90, y, x + 40, y - 40);
    }
  }

  private drawForestDecorations(
    graphics: Phaser.GameObjects.Graphics,
    biome: BiomeConfig,
  ): void {
    for (let i = 0; i < 8; i++) {
      const x = 100 + i * 150;
      const y = this.MAP_HEIGHT * 0.6;
      graphics.fillStyle(biome.colors.accent1, 1);
      graphics.fillRect(x + 15, y, 20, 80);
      graphics.fillStyle(biome.colors.accent2, 1);
      graphics.fillCircle(x + 25, y - 10, 40);
    }
  }

  private drawArenaDecorations(
    graphics: Phaser.GameObjects.Graphics,
    biome: BiomeConfig,
  ): void {
    for (let i = 0; i < 6; i++) {
      const x = 150 + i * 200;
      const y = this.MAP_HEIGHT * 0.45;
      graphics.fillStyle(biome.colors.accent1, 1);
      graphics.fillRect(x, y, 40, 200);
      graphics.fillStyle(biome.colors.accent2, 1);
      graphics.fillRect(x - 10, y, 60, 20);
    }
  }

  private drawArtisanDecorations(
    graphics: Phaser.GameObjects.Graphics,
    biome: BiomeConfig,
  ): void {
    for (let i = 0; i < 4; i++) {
      const x = 250 + i * 280;
      const y = this.MAP_HEIGHT * 0.5;
      graphics.fillStyle(biome.colors.accent1, 1);
      graphics.fillRect(x, y, 100, 80);
      graphics.fillStyle(biome.colors.accent2, 1);
      graphics.fillRect(x - 20, y - 10, 140, 15);
    }
  }

  private drawMineDecorations(
    graphics: Phaser.GameObjects.Graphics,
    biome: BiomeConfig,
  ): void {
    for (let i = 0; i < 5; i++) {
      const x = 200 + i * 240;
      const y = this.MAP_HEIGHT * 0.65;
      graphics.fillStyle(biome.colors.accent2, 1);
      graphics.fillRect(x, y, 60, 40);
      graphics.fillStyle(0x000000, 1);
      graphics.fillCircle(x + 15, y + 40, 10);
      graphics.fillCircle(x + 45, y + 40, 10);
    }
  }

  private drawHarbourDecorations(
    graphics: Phaser.GameObjects.Graphics,
    biome: BiomeConfig,
  ): void {
    for (let i = 0; i < 3; i++) {
      const x = 350 + i * 400;
      const y = this.MAP_HEIGHT * 0.5;
      graphics.fillStyle(biome.colors.accent1, 1);
      graphics.fillTriangle(x, y, x + 100, y, x + 50, y + 60);
      graphics.fillStyle(biome.colors.accent2, 1);
      graphics.fillTriangle(x + 40, y - 80, x + 60, y - 80, x + 50, y);
    }
  }

  private drawCrossroadsDecorations(
    graphics: Phaser.GameObjects.Graphics,
    biome: BiomeConfig,
  ): void {
    for (let i = 0; i < 6; i++) {
      const x = 180 + i * 200;
      const y = this.MAP_HEIGHT * 0.55;
      graphics.fillStyle(biome.colors.accent1, 1);
      graphics.fillRect(x + 20, y, 10, 60);
      graphics.fillStyle(biome.colors.accent2, 1);
      graphics.fillRect(x - 20, y - 20, 80, 30);
    }
  }

  private drawCapitalDecorations(
    graphics: Phaser.GameObjects.Graphics,
    biome: BiomeConfig,
  ): void {
    for (let i = 0; i < 4; i++) {
      const x = 300 + i * 300;
      const y = this.MAP_HEIGHT * 0.35;
      graphics.fillStyle(biome.colors.accent1, 1);
      graphics.fillRect(x, y, 80, 250);
      graphics.fillStyle(biome.colors.accent2, 1);
      graphics.fillTriangle(x - 10, y, x + 90, y, x + 40, y - 60);
      graphics.fillStyle(0xffffff, 0.8);
      for (let w = 0; w < 3; w++) {
        graphics.fillRect(x + 20, y + 50 + w * 60, 15, 20);
        graphics.fillRect(x + 45, y + 50 + w * 60, 15, 20);
      }
    }
  }

  /**
   * Adds biome name label
   */
  private addBiomeLabel(
    container: Phaser.GameObjects.Container,
    biome: BiomeConfig,
  ): void {
    const label = this.add.text(this.BIOME_WIDTH / 2, 80, biome.name, {
      fontFamily: "Georgia, serif",
      fontSize: "36px",
      fontStyle: "bold",
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 4,
    });
    label.setOrigin(0.5);
    container.add(label);

    const themeLabel = this.add.text(
      this.BIOME_WIDTH / 2,
      120,
      `(${biome.theme})`,
      {
        fontFamily: "Georgia, serif",
        fontSize: "20px",
        fontStyle: "italic",
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 2,
      },
    );
    themeLabel.setOrigin(0.5);
    container.add(themeLabel);
  }

  /**
   * Creates the snake path with all 36 checkpoints
   * Path winds through all 8 biomes left to right
   */
  private createSnakePath(): void {
    const pathGraphics = this.add.graphics();
    const positions: { x: number; y: number }[] = [];

    let globalIndex = 0;

    // Calculate positions for all checkpoints
    VENTURE_STAGES.forEach((stage) => {
      for (let cp = 0; cp < stage.checkpoints; cp++) {
        const pos = this.calculateSnakePosition(
          globalIndex,
          this.TOTAL_CHECKPOINTS,
        );
        positions.push(pos);
        globalIndex++;
      }
    });

    // Draw the path
    pathGraphics.lineStyle(12, 0x8b7355, 1);
    pathGraphics.beginPath();
    pathGraphics.moveTo(positions[0].x, positions[0].y);

    for (let i = 1; i < positions.length; i++) {
      pathGraphics.lineTo(positions[i].x, positions[i].y);
    }
    pathGraphics.strokePath();
    this.midgroundLayer.add(pathGraphics);

    // Create checkpoint nodes
    globalIndex = 0;
    VENTURE_STAGES.forEach((stage) => {
      for (let cp = 0; cp < stage.checkpoints; cp++) {
        const pos = positions[globalIndex];
        const checkpointId = `${stage.id}-${cp + 1}`;

        const node = new CheckpointNode(this, {
          id: checkpointId,
          stage: stage.id,
          checkpoint: cp + 1,
          status: "locked" as CheckpointStatus,
          x: pos.x,
          y: pos.y,
          t1: false,
          t2: false,
          t3: false,
          globalIndex: globalIndex,
        });

        // Set up click handler
        node.setInteractive();
        node.on(
          "checkpoint_clicked",
          (data: { id: string; stage: number; checkpoint: number }) => {
            eventBridge.dispatchToReact({
              type: "CHECKPOINT_CLICKED",
              checkpointId: data.id,
              stage: data.stage,
              checkpoint: data.checkpoint,
            });
          },
        );

        this.checkpointNodes.set(checkpointId, node);
        this.gameLayer.add(node);

        globalIndex++;
      }
    });
  }

  /**
   * Calculates snake-path position for a checkpoint
   * Snake winds up and down as it progresses left to right through biomes
   */
  private calculateSnakePosition(
    index: number,
    total: number,
  ): { x: number; y: number } {
    const progressRatio = index / (total - 1);
    const x = 200 + progressRatio * (this.MAP_WIDTH - 400);

    // Snake wave - alternates every 4-5 checkpoints
    const segmentLength = 4;
    const segment = Math.floor(index / segmentLength);
    const isUp = segment % 2 === 0;
    const localProgress = (index % segmentLength) / segmentLength;

    const wavePhase = localProgress * Math.PI;
    let yOffset: number;

    if (isUp) {
      yOffset = -this.SNAKE_AMPLITUDE * Math.sin(wavePhase);
    } else {
      yOffset = this.SNAKE_AMPLITUDE * Math.sin(wavePhase);
    }

    const y = this.PATH_Y_CENTER + yOffset;

    return { x, y };
  }

  /**
   * Creates the Super Boss silhouette visible across entire map
   */
  private createSuperBoss(): void {
    const superBossX = this.MAP_WIDTH - 400;
    const superBossY = this.MAP_HEIGHT / 2;

    const superBoss = new BossSilhouette(this, {
      bossId: "super_boss",
      bossName: "The Gravemind",
      status: "silhouette",
      x: superBossX,
      y: superBossY,
    });

    this.bosses.set("super_boss", superBoss);
    this.gameLayer.add(superBoss);
  }

  /**
   * Creates 8 mini-bosses, one for each stage
   */
  private createMiniBosses(): void {
    const miniBossNames = [
      "Fog of Vagueness",
      "Pathwarden Wraith",
      "Advocate of Comfortable Lies",
      "Unfinished Golem",
      "Collapse Specter",
      "Harbourmaster of Hesitation",
      "Babel Merchant",
      "Iron Bureaucrat",
    ];

    VENTURE_STAGES.forEach((stage, index) => {
      // Place mini-boss at the end of each stage
      let globalIndex = 0;
      for (let s = 0; s < stage.id - 1; s++) {
        globalIndex += VENTURE_STAGES[s].checkpoints;
      }
      globalIndex += stage.checkpoints - 1;

      const pos = this.calculateSnakePosition(
        globalIndex,
        this.TOTAL_CHECKPOINTS,
      );
      const offsetX = 100;
      const offsetY = -120;

      const miniBoss = new MiniBoss(this, {
        bossId: `mini_boss_${stage.id}`,
        bossType: (miniBossNames[index] || "Fog of Vagueness") as MiniBossType,
        stage: stage.id,
        x: pos.x + offsetX,
        y: pos.y + offsetY,
      });

      this.miniBosses.set(stage.id, miniBoss);
      this.gameLayer.add(miniBoss);
    });
  }

  /**
   * Sets up event listeners for React communication
   */
  private setupEventListeners(): void {
    this.boundHandlers.updateBrightness =
      this.handleUpdateBrightness.bind(this);
    this.boundHandlers.updateCheckpoints =
      this.handleUpdateCheckpoints.bind(this);
    this.boundHandlers.setActiveVenture =
      this.handleSetActiveVenture.bind(this);
    this.boundHandlers.scrollToCheckpoint =
      this.handleScrollToCheckpoint.bind(this);
    this.boundHandlers.playCheckpointAnimation =
      this.handlePlayCheckpointAnimation.bind(this);

    eventBridge.onPhaser(
      "UPDATE_BRIGHTNESS",
      this.boundHandlers.updateBrightness,
    );
    eventBridge.onPhaser(
      "UPDATE_CHECKPOINTS",
      this.boundHandlers.updateCheckpoints,
    );
    eventBridge.onPhaser(
      "SET_ACTIVE_VENTURE",
      this.boundHandlers.setActiveVenture,
    );
    eventBridge.onPhaser(
      "SCROLL_TO_CHECKPOINT",
      this.boundHandlers.scrollToCheckpoint,
    );
    eventBridge.onPhaser(
      "PLAY_CHECKPOINT_ANIMATION",
      this.boundHandlers.playCheckpointAnimation,
    );
  }

  /**
   * Handles brightness updates using PRD two-layer formula
   * Accumulated base = completed stages × 8.57%, capped at 60%
   * Stage layer = (current stage tasks done / current stage tasks total) × 40%
   * World brightness = accumulated base + stage layer (0% to 100%)
   */
  private handleUpdateBrightness(): void {
    // Calculate accumulated base brightness from completed stages (7 stages max = 60%)
    const accumulatedBase = Math.min(this.completedStages * 8.57, 60);

    // Calculate stage layer brightness (current stage progress = 0-40%)
    const stageLayer =
      this.stageTasksTotal > 0
        ? (this.stageTasksCompleted / this.stageTasksTotal) * 40
        : 0;

    // Total world brightness
    const worldBrightness = accumulatedBase + stageLayer;

    // Clamp to 0-100%
    const finalBrightness = Math.max(0, Math.min(100, worldBrightness));

    this.currentBrightness = finalBrightness;
    this.updateBrightnessFilter(finalBrightness);

    console.log(
      `[WorldMapScene] Brightness: ${finalBrightness.toFixed(2)}% (Base: ${accumulatedBase.toFixed(2)}% + Stage: ${stageLayer.toFixed(2)}%)`,
    );
  }

  /**
   * Updates the brightness filter based on percentage (0-100)
   */
  private updateBrightnessFilter(brightnessPercent: number): void {
    if (!this.brightnessFilter) return;

    // Convert percentage to brightness multiplier
    const brightness = brightnessPercent / 100;

    // Start from very dark (0.1) and scale up to full brightness (1.0)
    const minBrightness = 0.1;
    const brightnessValue = minBrightness + brightness * (1.0 - minBrightness);

    this.brightnessFilter.brightness(brightnessValue);
  }

  /**
   * Handles checkpoint state updates
   */
  private handleUpdateCheckpoints(event: {
    checkpoints: CheckpointState[];
  }): void {
    const checkpoints = event.checkpoints;

    // Update checkpoint nodes
    checkpoints.forEach((cp) => {
      const checkpointId = `${cp.stage}-${cp.checkpoint}`;
      const node = this.checkpointNodes.get(checkpointId);

      if (node) {
        node.updateStatus(cp.status);
      }
    });

    // Calculate stage progress for brightness
    const activeCheckpoint = checkpoints.find(
      (cp) => cp.status === "active" || cp.status === "in_progress",
    );
    if (activeCheckpoint) {
      this.currentStage = activeCheckpoint.stage;

      // Count completed stages (all stages before current)
      this.completedStages = this.currentStage - 1;

      // Count tasks in current stage
      const currentStageCheckpoints = checkpoints.filter(
        (cp) => cp.stage === this.currentStage,
      );

      this.stageTasksTotal = currentStageCheckpoints.length * 3; // 3 tasks per checkpoint
      this.stageTasksCompleted = 0;

      currentStageCheckpoints.forEach((cp) => {
        if (cp.t1) this.stageTasksCompleted++;
        if (cp.t2) this.stageTasksCompleted++;
        if (cp.t3) this.stageTasksCompleted++;
      });

      // Update brightness
      this.handleUpdateBrightness();
    }

    // Position persona on active checkpoint
    this.positionPersonaOnActiveCheckpoint();

    // Update mini-boss progress
    this.updateMiniBossProgress(checkpoints);
  }

  /**
   * Updates mini-boss weakness based on checkpoint completion
   */
  private updateMiniBossProgress(checkpoints: CheckpointState[]): void {
    const stageProgress = new Map<
      number,
      { completed: number; total: number }
    >();

    checkpoints.forEach((cp) => {
      const stage = cp.stage;
      if (!stageProgress.has(stage)) {
        stageProgress.set(stage, { completed: 0, total: 0 });
      }

      const progress = stageProgress.get(stage)!;
      progress.total++;

      // Count as completed if status is 'completed' or 'gold'
      if (cp.status === "completed" || cp.status === "gold") {
        progress.completed++;
      }
    });

    // Update all mini-bosses
    for (const [stage, miniBoss] of this.miniBosses.entries()) {
      const progress = stageProgress.get(stage);
      if (!progress) continue;

      const { completed, total } = progress;

      // Check if stage is fully complete
      const stageComplete = completed === total && total > 0;

      if (stageComplete) {
        // Slay the boss when stage is complete
        miniBoss.slay();
      } else {
        // Weaken the boss based on progress
        miniBoss.weaken(completed, total);
      }
    }
  }

  /**
   * Handles active venture selection from React
   */
  private handleSetActiveVenture(event: {
    ventureId: string;
    personaGender: "male" | "female";
    assignedBosses?: string[];
    currentStage?: number;
  }): void {
    try {
      this.currentVentureId = event.ventureId;

      // Create persona if doesn't exist
      if (!this.persona) {
        this.persona = new Persona(
          this,
          0,
          0,
          event.personaGender as PersonaGender,
        );
        this.gameLayer.add(this.persona);
      }

      // Update current stage if provided
      if (event.currentStage) {
        this.currentStage = event.currentStage;

        // Play ambience for the current stage
        audioManager.playAmbienceForStage(event.currentStage);
        console.log(
          `[WorldMapScene] Playing ambience for stage ${event.currentStage}`,
        );
      }

      // Position persona on active checkpoint
      this.positionPersonaOnActiveCheckpoint();

      // Auto-scroll to active checkpoint after a short delay
      this.time.delayedCall(500, () => {
        this.autoScrollToActive();
      });
    } catch (error) {
      console.warn("[WorldMapScene] Failed to set active venture:", error);
    }
  }

  /**
   * Position persona above the active checkpoint
   */
  private positionPersonaOnActiveCheckpoint(): void {
    if (!this.persona) return;

    // Find active checkpoint
    for (const node of this.checkpointNodes.values()) {
      const status = node.status;
      if (status === "active" || status === "in_progress") {
        // Position persona 80px above the checkpoint
        this.persona.setPosition(node.x, node.y - 80);
        this.persona.playIdle();
        return;
      }
    }

    // Default: position on first checkpoint if no active found
    const firstNode = Array.from(this.checkpointNodes.values())[0];
    if (firstNode) {
      this.persona.setPosition(firstNode.x, firstNode.y - 80);
      this.persona.playIdle();
    }
  }

  /**
   * Handles camera scroll requests to specific checkpoints
   */
  private handleScrollToCheckpoint(event: { checkpointId: string }): void {
    try {
      this.scrollToCheckpoint(event.checkpointId, true);
    } catch (error) {
      console.warn("[WorldMapScene] Failed to scroll to checkpoint:", error);
    }
  }

  /**
   * Scroll camera to show a specific checkpoint
   */
  private scrollToCheckpoint(checkpointId: string, smooth = true): void {
    const node = this.checkpointNodes.get(checkpointId);
    if (!node) return;

    const targetX = node.x;
    const targetY = node.y;

    if (smooth) {
      this.cameras.main.pan(
        targetX,
        targetY,
        1000, // 1 second duration
        "Sine.easeInOut",
        false,
      );
    } else {
      this.cameras.main.centerOn(targetX, targetY);
    }
  }

  /**
   * Auto-scroll to active checkpoint when venture loads
   */
  private autoScrollToActive(): void {
    // Find the first active or in_progress checkpoint
    for (const [id, node] of this.checkpointNodes.entries()) {
      if (node.status === "active" || node.status === "in_progress") {
        this.scrollToCheckpoint(id, true);
        break;
      }
    }
  }

  /**
   * Handles checkpoint animation requests from React
   */
  private handlePlayCheckpointAnimation(event: {
    checkpointId: string;
    stage: number;
    variant: "standard" | "gold";
  }): void {
    try {
      this.playCheckpointAnimation(
        event.checkpointId,
        event.stage,
        event.variant,
      );
    } catch (error) {
      console.warn(
        "[WorldMapScene] Failed to play checkpoint animation:",
        error,
      );
    }
  }

  /**
   * Play a checkpoint animation based on stage and variant
   */
  private playCheckpointAnimation(
    checkpointId: string,
    stage: number,
    variant: AnimationVariant = "standard",
  ): void {
    // Stop any currently playing animation
    this.stopCurrentAnimation();

    // Get checkpoint node position for animation placement
    const node = this.checkpointNodes.get(checkpointId);
    if (!node) {
      console.warn(
        `[WorldMapScene] Cannot play animation - checkpoint ${checkpointId} not found`,
      );
      return;
    }

    // Get world position of checkpoint
    const worldPos = node.getWorldPosition();

    // Determine animation type from stage
    const animationType = getAnimationTypeForStage(stage);

    // Play checkpoint SFX based on animation type and variant
    const sfxId = `${animationType}_${variant}`;
    audioManager.playCheckpointSFX(sfxId as CheckpointSFXId);
    console.log(`[WorldMapScene] Playing checkpoint SFX: ${sfxId}`);

    // Create animation instance
    this.currentAnimation = createCheckpointAnimation(this, animationType, {
      x: worldPos.x,
      y: worldPos.y,
      variant,
      onComplete: () => {
        this.stopCurrentAnimation();
        // Notify React that animation completed
        eventBridge.dispatchToReact({
          type: "CHECKPOINT_ANIMATION_COMPLETE",
          checkpointId,
          stage,
        });
      },
      onSkip: () => {
        // User can skip after 500ms by clicking or pressing ESC
      },
    });

    // Play the animation
    this.currentAnimation.play();
  }

  /**
   * Stop and cleanup the currently playing animation
   */
  private stopCurrentAnimation(): void {
    if (this.currentAnimation) {
      this.currentAnimation.destroy();
      this.currentAnimation = null;
    }
  }

  /**
   * Update loop - handles parallax scrolling
   */
  update(): void {
    const cam = this.cameras.main;

    // Background layer - slowest parallax (0.3x camera speed, furthest away)
    if (this.backgroundLayer) {
      this.backgroundLayer.x = -cam.scrollX * 0.3;
      this.backgroundLayer.y = -cam.scrollY * 0.3;
    }

    // Midground layer - medium parallax (0.6x camera speed, middle distance)
    if (this.midgroundLayer) {
      this.midgroundLayer.x = -cam.scrollX * 0.6;
      this.midgroundLayer.y = -cam.scrollY * 0.6;
    }

    // Game layer moves naturally with camera (1.0x, no parallax)
  }

  /**
   * Cleanup when scene is shutdown
   */
  shutdown(): void {
    // Stop any playing animation
    this.stopCurrentAnimation();

    // Clean up mini-bosses
    this.miniBosses.forEach((boss) => boss.destroy());
    this.miniBosses.clear();

    // Clean up bosses
    this.bosses.forEach((boss) => boss.destroy());
    this.bosses.clear();

    // Clean up event listeners
    if (this.boundHandlers.updateBrightness) {
      eventBridge.off("UPDATE_BRIGHTNESS", this.boundHandlers.updateBrightness);
    }
    if (this.boundHandlers.updateCheckpoints) {
      eventBridge.off(
        "UPDATE_CHECKPOINTS",
        this.boundHandlers.updateCheckpoints,
      );
    }
    if (this.boundHandlers.setActiveVenture) {
      eventBridge.off(
        "SET_ACTIVE_VENTURE",
        this.boundHandlers.setActiveVenture,
      );
    }
    if (this.boundHandlers.scrollToCheckpoint) {
      eventBridge.off(
        "SCROLL_TO_CHECKPOINT",
        this.boundHandlers.scrollToCheckpoint,
      );
    }
    if (this.boundHandlers.playCheckpointAnimation) {
      eventBridge.off(
        "PLAY_CHECKPOINT_ANIMATION",
        this.boundHandlers.playCheckpointAnimation,
      );
    }

    this.boundHandlers = {};
  }
}
