import * as Phaser from "phaser";
import { AssetLoader } from "../utils/asset-loader";
import { CheckpointNode, CheckpointStatus } from "../entities/Checkpoint";
import { Persona, PersonaGender } from "../entities/Persona";
import { BossSilhouette } from "../entities/Boss";
import { MiniBoss } from "../entities/MiniBoss";
import { BIOME_PALETTES } from "../utils/biome-textures";
import { audioManager, type CheckpointSFXId } from "../../audio/audioManager";

import { eventBridge, type CheckpointState } from "../utils/event-bridge";
import { VENTURE_STAGES } from "@convex/ventureConstants";
import {
  createCheckpointAnimation,
  getAnimationTypeForStage,
  type AnimationVariant,
  type BaseCheckpointAnimation,
} from "./animations";
import {
  VENTURE_BIOMES,
  getBiomeForStage,
  getTotalMapWidth,
  getTotalMapHeight,
  type VentureBiome,
} from "../config/venture-biomes";

/**
 * Main world map scene that displays the venture journey
 * with checkpoints, persona character, and boss silhouettes.
 *
 * @remarks
 * This scene manages:
 * - Checkpoint node visualization and layout
 * - Persona character animation and movement
 * - Boss silhouettes and their status
 * - Dynamic brightness adjustments based on venture progress
 * - Camera panning and scrolling
 * - Two-way communication with React via event bridge
 *
 * @example
 * ```typescript
 * // Scene is automatically instantiated by Phaser
 * // Communicate via event bridge:
 * eventBridge.dispatchToPhaser({
 *   type: 'UPDATE_CHECKPOINTS',
 *   checkpoints: [...]
 * })
 * ```
 */
export class WorldMapScene extends Phaser.Scene {
  /** Map of checkpoint IDs to their visual node instances */
  private checkpointNodes: Map<string, CheckpointNode>;

  /** The player's persona character */
  private persona: Persona | null;

  /** Map of boss IDs to their silhouette instances */
  private bosses: Map<string, BossSilhouette>;

  /** Map of stage numbers to their mini-boss instances */
  private miniBosses: Map<number, MiniBoss>;

  /** Container for static background elements */
  private backgroundLayer!: Phaser.GameObjects.Container;

  /** Container for midground parallax layer */
  private midgroundLayer!: Phaser.GameObjects.Container;

  /** Container for interactive game elements (checkpoints, persona, bosses) */
  private gameLayer!: Phaser.GameObjects.Container;

  /** Container for animation overlays (displayed on top of everything) */
  private animationLayer!: Phaser.GameObjects.Container;

  /** Currently playing checkpoint animation instance */
  private currentAnimation: BaseCheckpointAnimation | null = null;

  /** Current brightness filter applied to the scene */
  private brightnessFilter: unknown;

  /** Currently active venture ID */
  private currentVentureId: string | null;

  /** Bound event handler references for cleanup */
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

  /** Adventure map layout constants */
  private readonly MAP_WIDTH = getTotalMapWidth();
  private readonly MAP_HEIGHT = getTotalMapHeight();
  private readonly BIOME_PADDING = 100;

  /** Vivid Among Us room colors (brighter, more saturated) */
  private readonly ROOM_BRIGHT_COLORS: Record<number, number> = {};

  /** Camera state tracking */
  private cameraTarget: { x: number; y: number } | null = null;
  private cameraFollowSpeed = 0.05;

  /** Biome background system with enhanced colors */
  private biomeBackgrounds: Phaser.GameObjects.TileSprite[] = [];

  /** Biome crossfade tracking */
  private currentBiome: number = 1;
  private previousBiome: number = 1;
  private crossfadeTween: Phaser.Tweens.Tween | null = null;

  /** Lazy loading system for biomes */
  private loadedBiomes: Set<number> = new Set();
  private biomeContainers: Map<number, Phaser.GameObjects.Container> =
    new Map();

  /**
   * Creates a new WorldMapScene instance
   */
  constructor() {
    super({ key: "WorldMap" });
    this.checkpointNodes = new Map();
    this.persona = null;
    this.bosses = new Map();
    this.miniBosses = new Map();
    this.currentVentureId = null;
    this.boundHandlers = {};
  }

  /**
   * Preload phase - loads all required assets
   *
   * @remarks
   * Uses AssetLoader to procedurally generate all textures
   * instead of loading from files for better performance
   */
  preload(): void {
    AssetLoader.preloadAssets(this);
    AssetLoader.createAllTextures(this);
    this.load.image("bg_garage", "/assets/maps/garage.png");
    this.load.image("bg_summit", "/assets/maps/summit.png");
  }

  /**
   * Create phase - initializes the scene and sets up event listeners
   *
   * @remarks
   * - Creates layered containers for depth sorting
   * - Sets up event bridge listeners for React communication
   * - Configures camera bounds and scrolling
   * - Starts FPS monitoring
   */
  create(): void {
    // Initialize AudioManager on game start
    audioManager.init();
    console.log("[WorldMapScene] AudioManager initialized");

    // Initialize layer containers for parallax scrolling system
    // Background layer (depth 0) - furthest, contains distant space elements
    this.backgroundLayer = this.add.container(0, 0);
    this.backgroundLayer.setDepth(0);

    // Midground layer (depth 5) - middle distance, contains medium-range stars
    this.midgroundLayer = this.add.container(0, 0);
    this.midgroundLayer.setDepth(5);

    // Game layer (depth 10) - foreground, contains interactive elements
    this.gameLayer = this.add.container(0, 0);
    this.gameLayer.setDepth(10);

    this.animationLayer = this.add.container(0, 0);
    this.animationLayer.setDepth(100);

    // Create premium space background with nebulas and stars
    this.createAdventureBackground();

    // Create biome zones (glassmorphism cards)
    this.createBiomeZones();

    // Draw modern connection paths between biomes
    this.createAdventurePath();

    // Create mini-bosses for venture stages
    this.createMiniBosses();

    // Bind event handlers
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

    // Setup event listeners from React
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

    // Setup camera for Level Devil horizontal map
    this.cameras.main.setBounds(0, 0, this.MAP_WIDTH, this.MAP_HEIGHT);
    this.cameras.main.setBackgroundColor("#f59e0b");
    this.cameras.main.setZoom(0.92);
    this.cameras.main.centerOn(this.MAP_WIDTH / 2, this.MAP_HEIGHT / 2);

    // Enable smooth camera lerp (no target object, just for lerp settings)
    // Note: We use pan() for actual camera movements
    this.cameras.main.setLerp(this.cameraFollowSpeed, this.cameraFollowSpeed);

    // Enable camera drag controls for better visibility
    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      this.cameras.main.stopFollow();
      // Unlock audio on first user interaction
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

    // Always fully bright — the brightness system controls scene overlays,
    // but we never dim the map itself below full visibility.
    if (this.cameras.main.postFX) {
      this.cameras.main.postFX.clear();
      // Slight contrast boost for richer colors
      this.cameras.main.postFX.addColorMatrix().contrast(0.15);
    }

    // Signal React that Phaser is ready
    eventBridge.dispatchToReact({ type: "PHASER_READY" });

    // FPS monitoring for performance tracking
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
   * Handles brightness update events from React
   *
   * @param event - Event containing brightness value (0-100)
   *
   * @remarks
   * Applies brightness and contrast adjustments to the main camera
   * using post-processing effects. Adds a base brightness of 0.8 to ensure
   * the map is always visible even at 0% progress.
   */
  private handleUpdateBrightness(event: { brightness: number }): void {
    try {
      // Brightness from React is 0–100. We only apply a slight tint for
      // dramatic effect at very low progress. Map is always fully visible.
      const rawBrightness = event.brightness / 100; // 0.0 → 1.0
      const boost = 0.95 + rawBrightness * 0.1; // 0.95 → 1.05
      if (this.cameras.main.postFX) {
        this.cameras.main.postFX.clear();
        this.cameras.main.postFX.addColorMatrix().contrast(0.15);
        // At very low brightness (< 10%) add a slight desaturation only
        if (rawBrightness < 0.1) {
          this.cameras.main.postFX.addColorMatrix().saturate(-0.3, false);
        }
      }
    } catch (error) {
      console.warn("[WorldMapScene] Failed to update brightness:", error);
    }
  }

  /**
   * Handles checkpoint update events from React
   *
   * @param event - Event containing array of checkpoint states
   *
   * @remarks
   * - Destroys all existing checkpoint nodes
   * - Creates new nodes based on provided state
   * - Lays out checkpoints in a snake pattern
   * - Sets up click handlers for each checkpoint
   */
  private handleUpdateCheckpoints(event: {
    checkpoints: CheckpointState[];
  }): void {
    try {
      // Validate checkpoint data
      if (!Array.isArray(event.checkpoints)) {
        console.warn(
          "[WorldMapScene] Invalid checkpoint data - expected array",
        );
        return;
      }

      // Clear existing checkpoints
      this.checkpointNodes.forEach((node) => node.destroy());
      this.checkpointNodes.clear();

      // Create checkpoints in snake path layout
      event.checkpoints.forEach((cp, index) => {
        // Validate checkpoint structure
        if (
          !cp.id ||
          typeof cp.stage !== "number" ||
          typeof cp.checkpoint !== "number"
        ) {
          console.warn("[WorldMapScene] Invalid checkpoint structure:", cp);
          return;
        }

        const { x, y } = this.calculateCheckpointPosition(
          cp.stage,
          cp.checkpoint,
          index,
        );

        const node = new CheckpointNode(this, {
          id: cp.id,
          stage: cp.stage,
          checkpoint: cp.checkpoint,
          status: cp.status as CheckpointStatus,
          x,
          y,
          t1: cp.t1,
          t2: cp.t2,
          t3: cp.t3,
          globalIndex: index + 1,
        });

        // Setup click interaction
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

        this.gameLayer.add(node);
        this.checkpointNodes.set(cp.id, node);
      });

      // Update mini-boss weakness based on checkpoint completion
      this.updateMiniBossProgress(event.checkpoints);
    } catch (error) {
      console.warn("[WorldMapScene] Failed to update checkpoints:", error);
    }
  }

  /**
   * Update mini-boss weakness based on checkpoint completion in each stage.
   *
   * @param checkpoints - Array of all checkpoint states
   */
  private updateMiniBossProgress(checkpoints: CheckpointState[]): void {
    // Group checkpoints by stage and count completed ones
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

    // Update mini-bosses for stages 1 and 2
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
   *
   * @param event - Event containing venture ID and persona gender
   *
   * @remarks
   * Creates the persona character if it doesn't exist yet
   * Updates the current venture ID for tracking
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

      // Create bosses
      if (event.assignedBosses && event.assignedBosses.length > 0) {
        this.createBossSilhouettes(event.assignedBosses);

        // Update boss opacity based on current stage
        if (event.currentStage) {
          this.updateBossOpacity(event.currentStage);

          // Play ambience for the current stage
          audioManager.playAmbienceForStage(event.currentStage);
          console.log(
            `[WorldMapScene] Playing ambience for stage ${event.currentStage}`,
          );
        }
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
    for (const [id, node] of this.checkpointNodes.entries()) {
      const status = node.status; // Use public getter
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
   * Animate persona walking to next stage's first checkpoint
   *
   * @param fromCheckpointId - ID of the checkpoint to walk from
   * @param toCheckpointId - ID of the checkpoint to walk to
   */
  private animateStageTransition(
    fromCheckpointId: string,
    toCheckpointId: string,
  ): void {
    const fromNode = this.checkpointNodes.get(fromCheckpointId);
    const toNode = this.checkpointNodes.get(toCheckpointId);

    if (!fromNode || !toNode || !this.persona) return;

    const targetX = toNode.x;
    const targetY = toNode.y - 80; // 80px above checkpoint

    // Calculate duration based on distance
    const distance = Phaser.Math.Distance.Between(
      this.persona.x,
      this.persona.y,
      targetX,
      targetY,
    );
    const duration = Math.max(1000, distance * 2); // 2ms per pixel, min 1s

    // Walk to new checkpoint
    this.persona.moveToPosition(targetX, targetY, duration);

    // Pan camera to follow
    this.cameras.main.pan(targetX, targetY, duration, "Sine.easeInOut");
  }

  /**
   * Handles camera scroll requests to specific checkpoints
   *
   * @param event - Event containing checkpoint ID to scroll to
   *
   * @remarks
   * Smoothly pans the camera to center on the requested checkpoint
   * using a sine ease for natural movement
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
   *
   * @param checkpointId - ID of the checkpoint to scroll to
   * @param smooth - Whether to use smooth panning (default: true)
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
      // Use the public status getter
      if (node.status === "active" || node.status === "in_progress") {
        this.scrollToCheckpoint(id, true);
        break;
      }
    }
  }

  /**
   * Handles checkpoint animation requests from React
   *
   * @param event - Event containing checkpoint ID, stage, and variant
   *
   * @remarks
   * Triggers the appropriate animation based on stage number
   * and variant (standard blue or gold amber)
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
   * Create boss silhouettes at stage boundaries
   *
   * @param assignedBosses - Array of boss IDs assigned to this venture
   */
  private createBossSilhouettes(assignedBosses: string[]): void {
    // Clear existing bosses
    this.bosses.forEach((boss) => boss.destroy());
    this.bosses.clear();

    // Super Boss (at the very top of the map - the Final Island)
    if (assignedBosses.length > 0) {
      const superBossX = this.MAP_WIDTH / 2;
      const superBossY = 100; // Right at the finish line

      const superBoss = new BossSilhouette(this, {
        bossId: assignedBosses[0],
        bossName: this.getBossName(assignedBosses[0]),
        status: "silhouette",
        x: superBossX,
        y: superBossY,
      });

      this.gameLayer.add(superBoss);
      this.bosses.set("super_boss", superBoss);
    }

    // 8 Mini-bosses (one per stage, at stage boundaries)
    const miniBossNames = [
      "Fog of Vagueness",
      "Pathwarden Wraith",
      "Advocate of Comfortable Lies",
      "Unfinished Golem",
      "Collapse Specter",
      "Harbourmaster",
      "Babel Merchant",
      "Iron Bureaucrat",
    ];

    for (let stage = 1; stage <= 2; stage++) {
      // Position near the last checkpoint of this stage dynamically
      const lastCheckpoint = this.getCheckpointsForStage(stage);
      const cpPos = this.calculateCheckpointPosition(stage, lastCheckpoint, 0);

      const x = cpPos.x + 70; // Slightly past the last checkpoint
      const y = cpPos.y - 40; // Slightly above

      const miniBoss = new BossSilhouette(this, {
        bossId: `mini_boss_${stage}`,
        bossName: miniBossNames[stage - 1],
        status: "silhouette",
        x,
        y,
      });

      // Scale down mini-bosses
      miniBoss.setScale(0.6);

      this.gameLayer.add(miniBoss);
      this.bosses.set(`mini_boss_${stage}`, miniBoss);
    }
  }

  /**
   * Create mini-bosses for venture stages.
   *
   * Stage 1 (Ideation): Fog of Vagueness
   * Stage 2 (Research): Pathwarden Wraith
   */
  private createMiniBosses(): void {
    // Clear existing mini-bosses
    this.miniBosses.forEach((boss) => boss.destroy());
    this.miniBosses.clear();

    // Mini-boss definitions
    const miniBossConfigs = [
      {
        stage: 1,
        type: "fog_of_vagueness" as const,
        bossId: "fog_of_vagueness",
      },
      {
        stage: 2,
        type: "pathwarden_wraith" as const,
        bossId: "pathwarden_wraith",
      },
    ];

    for (const config of miniBossConfigs) {
      // Position mini-boss near the last checkpoint of its stage
      const lastCheckpoint = this.getCheckpointsForStage(config.stage);
      const cpPos = this.calculateCheckpointPosition(
        config.stage,
        lastCheckpoint,
        0,
      );

      const x = cpPos.x + 100; // Slightly past the last checkpoint
      const y = cpPos.y - 50; // Slightly above

      const miniBoss = new MiniBoss(this, {
        bossId: config.bossId,
        bossType: config.type,
        x,
        y,
        stage: config.stage,
      });

      this.gameLayer.add(miniBoss);
      this.miniBosses.set(config.stage, miniBoss);
    }
  }

  /**
   * Update boss opacity based on venture progress
   *
   * @param currentStage - Current active stage (1-8)
   */
  private updateBossOpacity(currentStage: number): void {
    // Super Boss opacity progression
    const superBoss = this.bosses.get("super_boss");
    if (superBoss) {
      if (currentStage >= 7) {
        superBoss.updateStatus("foreground");
      } else if (currentStage >= 5) {
        superBoss.updateStatus("present");
      } else {
        superBoss.updateStatus("silhouette");
      }
    }

    // Mini-boss opacity (becomes visible when stage is active)
    for (let stage = 1; stage <= 2; stage++) {
      const miniBoss = this.bosses.get(`mini_boss_${stage}`);
      if (miniBoss) {
        if (currentStage === stage) {
          miniBoss.updateStatus("present");
        } else if (currentStage > stage) {
          miniBoss.updateStatus("slain");
        } else {
          miniBoss.updateStatus("silhouette");
        }
      }
    }
  }

  /**
   * Get friendly boss name from ID
   *
   * @param bossId - The boss identifier
   * @returns Friendly display name
   */
  private getBossName(bossId: string): string {
    const names: Record<string, string> = {
      unraveller: "The Unraveller",
      pale_architect: "The Pale Architect",
      gravemind: "The Gravemind",
    };
    return names[bossId] || "???";
  }

  /**
   * Calculate checkpoint position using organic path through 8 biomes
   *
   * The path flows left-to-right through biome zones with natural
   * sine wave pattern for visual interest.
   */
  private calculateCheckpointPosition(
    stage: number,
    checkpoint: number,
    _globalIndex: number,
  ): { x: number; y: number } {
    // Calculate global checkpoint index
    let globalIndex = 0;
    for (let s = 1; s < stage; s++) {
      globalIndex += this.getCheckpointsForStage(s);
    }
    globalIndex += checkpoint - 1;

    // Dynamic snake-path layout for all 35 checkpoints
    const START_X = 200;
    const SPACING_X = 180;
    const CENTER_Y = 400;
    const WAVE_AMPLITUDE = 100;
    const WAVE_FREQUENCY = 0.6;

    const x = START_X + globalIndex * SPACING_X;
    const y =
      CENTER_Y + Math.sin(globalIndex * WAVE_FREQUENCY) * WAVE_AMPLITUDE;

    return { x, y };
  }

  /**
   * Gets the number of checkpoints for a given stage
   *
   * @param stage - Stage number (1-based)
   * @returns Number of checkpoints in that stage
   *
   * @remarks
   * Retrieves checkpoint counts from VENTURE_STAGES constant:
   * [4, 5, 4, 5, 6, 3, 4, 5] for stages 1-8
   */
  private getCheckpointsForStage(stage: number): number {
    const stageData = VENTURE_STAGES.find((s) => s.id === stage);
    return stageData?.checkpoints || 4;
  }

  /**
   * Draws a cubic bezier curve on a Graphics object using lineTo steps.
   * Phaser 3 Graphics has no native bezierCurveTo, so we approximate it.
   *
   * @param g      - The Phaser Graphics instance (path must already be open)
   * @param x0     - Start X (current pen position)
   * @param y0     - Start Y (current pen position)
   * @param cp1x   - Control point 1 X
   * @param cp1y   - Control point 1 Y
   * @param cp2x   - Control point 2 X
   * @param cp2y   - Control point 2 Y
   * @param x1     - End X
   * @param y1     - End Y
   * @param steps  - Number of line segments (higher = smoother)
   */
  private cubicBezierPath(
    g: Phaser.GameObjects.Graphics,
    x0: number,
    y0: number,
    cp1x: number,
    cp1y: number,
    cp2x: number,
    cp2y: number,
    x1: number,
    y1: number,
    steps = 14,
  ): void {
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const mt = 1 - t;
      const bx =
        mt * mt * mt * x0 +
        3 * mt * mt * t * cp1x +
        3 * mt * t * t * cp2x +
        t * t * t * x1;
      const by =
        mt * mt * mt * y0 +
        3 * mt * mt * t * cp1y +
        3 * mt * t * t * cp2y +
        t * t * t * y1;
      g.lineTo(bx, by);
    }
  }

  /**
   * Create Among Us style spaceship rooms with metallic industrial aesthetic
   */
  /**
   * LAZY LOADING INITIALIZATION (Week 2 Day 10)
   *
   * Instead of loading all 8 rooms at once, we only load the initial room
   * (stage 1). Additional rooms are loaded dynamically as the camera approaches
   * them via the checkBiomeLoading() method called in update().
   *
   * Performance improvement:
   * - Before: All 8 rooms created in create() = slower initial load
   * - After: Only 1 room created initially = much faster startup
   * - Additional rooms loaded on-demand = smooth, imperceptible loading
   */
  /**
   * Create adventure biome zones (replaces spaceship rooms)
   */
  private createBiomeZones(): void {
    // Load only the starting biome (stage 1, index 0)
    console.log("[LAZY LOADING] Initializing with only first biome (index 0)");
    this.loadBiomeForStage(0);
  }

  /**
   * LAZY LOADING ROOM CREATOR (Week 2 Day 10)
   *
   * Loads a single room by index. This is called both during initialization
   * and dynamically as the camera approaches new areas.
   *
   * @param index - Index into VENTURE_ROOMS array (0-7)
   */
  /**
   * LAZY LOADING BIOME CREATOR
   *
   * Loads a single biome by index. This is called both during initialization
   * and dynamically as the camera approaches new areas.
   *
   * @param index - Index into VENTURE_BIOMES array (0-7)
   */
  private loadBiomeForStage(index: number): void {
    // Prevent duplicate loading
    if (this.loadedBiomes.has(index)) {
      return;
    }

    // Validate index
    if (index < 0 || index >= VENTURE_BIOMES.length) {
      return;
    }

    const biome = VENTURE_BIOMES[index];
    console.log(
      `[LAZY LOADING] Loading biome ${index}: ${biome.biomeName} at (${biome.x}, ${biome.y})`,
    );
    const biomeContainer = this.add.container(biome.x, biome.y);
    this.backgroundLayer.add(biomeContainer);

    // Add biome-specific backgrounds
    if (index === 0) {
      // BIOME 1: Ideation Archipelago - Ocean theme
      this.createOceanBiomeBackground(biomeContainer, biome);
    } else if (index === 1) {
      // BIOME 2: Research Mountains - Mountain theme
      this.createMountainBiomeBackground(biomeContainer, biome);
    }

    // Track that this biome has been loaded
    this.loadedBiomes.add(index);
    this.biomeContainers.set(index, biomeContainer);
    console.log(
      `[LAZY LOADING] Biome ${index} loaded successfully. Total loaded: ${this.loadedBiomes.size}/8`,
    );
  }

  /**
   * Creates the Ocean Biome background with realistic wave layers
   *
   * IMPROVEMENTS (Visual Quality Fix):
   * - Replaced flat circles with smooth sine curve waves
   * - Added 3 wave layers with different opacities for depth
   * - Used continuous sine/cosine functions for natural wave shapes
   * - Waves create proper depth perception from back to front
   */
  private createOceanBiomeBackground(
    container: Phaser.GameObjects.Container,
    biome: VentureBiome,
  ): void {
    const graphics = this.add.graphics();

    // Deep ocean wave layer (back) - smooth sine curves
    graphics.fillStyle(0x0277bd, 0.5);
    graphics.beginPath();
    graphics.moveTo(0, 500);
    for (let x = 0; x <= biome.width; x += 10) {
      const y = 450 + Math.sin(x * 0.008) * 35 + Math.cos(x * 0.012) * 20;
      graphics.lineTo(x, y);
    }
    graphics.lineTo(biome.width, this.MAP_HEIGHT);
    graphics.lineTo(0, this.MAP_HEIGHT);
    graphics.closePath();
    graphics.fillPath();

    // Mid ocean wave layer - lighter blue
    graphics.fillStyle(0x0288d1, 0.6);
    graphics.beginPath();
    graphics.moveTo(0, 480);
    for (let x = 0; x <= biome.width; x += 10) {
      const y =
        420 + Math.sin(x * 0.01 + 1.5) * 30 + Math.cos(x * 0.015 - 0.8) * 18;
      graphics.lineTo(x, y);
    }
    graphics.lineTo(biome.width, this.MAP_HEIGHT);
    graphics.lineTo(0, this.MAP_HEIGHT);
    graphics.closePath();
    graphics.fillPath();

    // Surface wave layer (front) - brightest blue
    graphics.fillStyle(0x4fc3f7, 0.7);
    graphics.beginPath();
    graphics.moveTo(0, 450);
    for (let x = 0; x <= biome.width; x += 10) {
      const y =
        390 + Math.sin(x * 0.012 + 3) * 25 + Math.cos(x * 0.018 + 2) * 15;
      graphics.lineTo(x, y);
    }
    graphics.lineTo(biome.width, this.MAP_HEIGHT);
    graphics.lineTo(0, this.MAP_HEIGHT);
    graphics.closePath();
    graphics.fillPath();

    // Islands with palm trees
    graphics.fillStyle(0x8d6e63, 1);
    const islandPositions = [300, 700, 1100, 1400];
    for (const x of islandPositions) {
      const y = 500;
      graphics.fillEllipse(x, y, 120, 60);
      graphics.fillStyle(0x5d4037, 1);
      graphics.fillRect(x - 8, y - 50, 16, 50);
      graphics.fillStyle(0x558b2f, 1);
      graphics.fillCircle(x, y - 60, 30);
      graphics.fillStyle(0x8d6e63, 1);
    }

    // Lighthouse
    graphics.fillStyle(0xf5f5f5, 1);
    graphics.fillRect(280, 430, 20, 70);
    graphics.fillStyle(0xef5350, 1);
    graphics.fillTriangle(280, 430, 300, 430, 290, 410);

    graphics.setDepth(-50);
    container.add(graphics);
  }

  /**
   * Creates the Mountain Biome background with realistic peaks
   *
   * IMPROVEMENTS (Visual Quality Fix):
   * - Added jagged sub-peaks for more realistic mountain shapes
   * - Implemented proper shading on mountain sides (darker on left)
   * - Enhanced snow caps with larger, more prominent white triangles
   * - Made foreground mountains darker than background for depth
   * - Added snow highlights on right side of peaks
   */
  private createMountainBiomeBackground(
    container: Phaser.GameObjects.Container,
    biome: VentureBiome,
  ): void {
    const graphics = this.add.graphics();

    // Distant mountains (lighter, with jagged peaks)
    graphics.fillStyle(0x90a4ae, 0.6);
    for (let i = 0; i < 4; i++) {
      const x = i * 450 + 200;
      const peak = 250;
      const base = 500;
      // Main peak
      graphics.fillTriangle(x - 150, base, x + 150, base, x, peak);
      // Add jagged sub-peaks for realism
      graphics.fillTriangle(x - 80, base, x - 20, base, x - 50, peak + 40);
      graphics.fillTriangle(x + 20, base, x + 80, base, x + 50, peak + 35);
    }

    // Mid-range mountains (darker, sharper)
    graphics.fillStyle(0x68818f, 0.8);
    for (let i = 0; i < 5; i++) {
      const x = i * 360 + 100;
      const peak = 280;
      const base = 520;
      // Main mountain with sharper peak
      graphics.fillTriangle(x - 120, base, x + 120, base, x, peak);

      // Add shading on left side
      graphics.fillStyle(0x546e7a, 0.5);
      graphics.fillTriangle(x - 120, base, x, peak, x, base);
      graphics.fillStyle(0x68818f, 0.8);
    }

    // Foreground mountains (darkest, most detailed)
    for (let i = 0; i < 4; i++) {
      const x = i * 450 + 300;
      const peak = 300;
      const base = 550;

      // Main mountain body (darker)
      graphics.fillStyle(0x546e7a, 1);
      graphics.fillTriangle(x - 150, base, x + 150, base, x, peak);

      // Left side shading (even darker)
      graphics.fillStyle(0x455a64, 0.8);
      graphics.fillTriangle(x - 150, base, x, peak, x, base);

      // Snow cap (larger, more prominent)
      graphics.fillStyle(0xffffff, 0.95);
      graphics.fillTriangle(x - 60, peak + 40, x + 60, peak + 40, x, peak);

      // Snow highlights (brighter white on right side)
      graphics.fillStyle(0xffffff, 1);
      graphics.fillTriangle(x, peak, x + 60, peak + 40, x + 30, peak + 20);
    }

    // Cave entrances
    graphics.fillStyle(0x263238, 1);
    graphics.fillEllipse(400, 520, 60, 50);
    graphics.fillEllipse(1000, 530, 70, 55);
    graphics.fillEllipse(1500, 525, 65, 52);

    // Research flags
    graphics.lineStyle(3, 0x5d4037, 1);
    graphics.fillStyle(0x4caf50, 1);
    const flagPositions = [450, 1000, 1500];
    for (const x of flagPositions) {
      graphics.lineBetween(x, 300, x, 270);
      graphics.fillTriangle(x, 270, x, 290, x + 30, 280);
    }

    graphics.setDepth(-50);
    container.add(graphics);
  }

  /**
   * Add modern tech-themed decorations
   * (Disabled for RPG map styling overhaul)
   */
  private addBiomeDecorations(
    container: Phaser.GameObjects.Container,
    biome: VentureBiome,
  ): void {
    // Intentionally empty. We rely completely on the high fidelity
    // background images. Procedural strokes clash with pixel art.
  }

  /**
   * LAZY LOADING PROXIMITY CHECK (Week 2 Day 10)
   *
   * Checks camera position and loads any nearby rooms that aren't yet loaded.
   * Called every frame in update() to ensure smooth, just-in-time loading.
   *
   * Buffer zone: 800px - rooms load when camera gets within this distance
   * This ensures rooms appear before they're visible to the player.
   */
  private checkBiomeLoading(): void {
    const cam = this.cameras.main;
    const camX = cam.scrollX + cam.width / 2;
    const camY = cam.scrollY + cam.height / 2;

    // Check each biome to see if it's within loading distance
    for (let i = 0; i < VENTURE_BIOMES.length; i++) {
      // Skip if already loaded
      if (this.loadedBiomes.has(i)) {
        continue;
      }

      const biome = VENTURE_BIOMES[i];

      // Calculate distance from camera center to biome center
      const biomeCenterX = biome.x + biome.width / 2;
      const biomeCenterY = biome.y + biome.height / 2;
      const distance = Math.sqrt(
        Math.pow(camX - biomeCenterX, 2) + Math.pow(camY - biomeCenterY, 2),
      );

      // Load biome if within buffer zone (1000px for larger biomes)
      const LOAD_BUFFER = 1000;
      if (distance < LOAD_BUFFER) {
        console.log(
          `[LAZY LOADING] Biome ${i} (${biome.biomeName}) within range (${Math.round(distance)}px), loading...`,
        );
        this.loadBiomeForStage(i);
      }
    }
  }

  /**
   * Create spaceship background with stars (Among Us style)
   *
   * Implements 3-layer parallax system:
   * - Background layer (0.3x parallax): Distant stars, nebula gradients
   * - Midground layer (0.6x parallax): Medium stars, colored particles
   * - Foreground (1.0x, no parallax): Bright stars with sparkles
   */
  /**
   * Create premium game-like background with stunning visuals
   * Theme: Deep space with nebula clouds, stars, and dynamic lighting
   */
  /**
   * Creates the main adventure background with biome fills and decorations
   *
   * IMPROVEMENTS (Visual Quality Fix):
   * - Added 200px biome transition zone at x:1600 (ocean to mountain gradient)
   * - Reduced fire animation opacity to 20% (was too bright/distracting)
   * - Fire now subtle atmospheric element instead of focal point
   *
   * NOTE: If green debug square appears, check:
   * - React overlays in parent components (not in this Phaser scene)
   * - Phaser debug mode (currently disabled in game-config.ts)
   * - Browser dev tools element inspector
   * - Other Phaser scenes that might be active
   */
  private createAdventureBackground(): void {
    // 1. Biome-specific ground fills
    const ground = this.add.graphics();
    // Ocean section (biome 1: 0-1600px)
    ground.fillStyle(0x81d4fa, 1);
    ground.fillRect(0, 0, 1600, this.MAP_HEIGHT);

    // Biome transition zone (beach/rocky shore: 1600-1800px)
    const transitionWidth = 200;
    for (let x = 0; x < transitionWidth; x += 10) {
      const t = x / transitionWidth; // 0 to 1
      const r = Math.floor(129 + (176 - 129) * t); // 0x81 to 0xb0
      const g = Math.floor(212 + (190 - 212) * t); // 0xd4 to 0xbe
      const b = Math.floor(250 + (197 - 250) * t); // 0xfa to 0xc5
      const color = (r << 16) | (g << 8) | b;
      ground.fillStyle(color, 1);
      ground.fillRect(1600 + x, 0, 10, this.MAP_HEIGHT);
    }

    // Mountain section (biome 2: 1800-3400px)
    ground.fillStyle(0xb0bec5, 1);
    ground.fillRect(1800, 0, 1600, this.MAP_HEIGHT);

    // Future biomes (3400+)
    ground.fillStyle(0xf59e0b, 1);
    ground.fillRect(3400, 0, this.MAP_WIDTH - 3400, this.MAP_HEIGHT);
    ground.setDepth(-200);
    this.backgroundLayer.add(ground);

    // 2. Dark crimson top band
    const topBand = this.add.graphics();
    topBand.fillStyle(0x4a0505, 1);
    topBand.fillRect(0, 0, this.MAP_WIDTH, 180);
    topBand.setDepth(-195);
    this.backgroundLayer.add(topBand);

    // 3. Flame silhouettes - multiple layers of flames below the dark band (dimmed to 20% opacity)
    const flames = this.add.graphics();
    // Back flame layer (darker orange-red)
    flames.fillStyle(0xc2410c, 0.2);
    for (let x = -10; x < this.MAP_WIDTH + 20; x += 22) {
      const h = 60 + Math.sin(x * 0.12) * 30 + Math.cos(x * 0.07) * 20;
      flames.fillTriangle(x - 14, 180, x + 14, 180, x, 180 - h);
    }
    // Front flame layer (lighter orange)
    flames.fillStyle(0xf97316, 0.2);
    for (let x = 8; x < this.MAP_WIDTH + 10; x += 18) {
      const h = 40 + Math.sin(x * 0.15 + 1) * 20 + Math.cos(x * 0.09 + 2) * 15;
      flames.fillTriangle(x - 10, 180, x + 10, 180, x, 180 - h);
    }
    // Bright tips
    flames.fillStyle(0xfbbf24, 0.2);
    for (let x = 14; x < this.MAP_WIDTH; x += 30) {
      const h = 20 + Math.sin(x * 0.2) * 10;
      flames.fillTriangle(x - 5, 180, x + 5, 180, x, 180 - h);
    }
    flames.setDepth(-190);
    this.backgroundLayer.add(flames);

    // 4. Ground texture — subtle horizontal lines for depth
    const groundLines = this.add.graphics();
    groundLines.lineStyle(1, 0xe59e0b, 0.3);
    for (let y = 200; y < this.MAP_HEIGHT; y += 40) {
      groundLines.lineBetween(0, y, this.MAP_WIDTH, y);
    }
    groundLines.setDepth(-185);
    this.backgroundLayer.add(groundLines);

    // Title text in the dark top band
    const titleShadow = this.add
      .text(this.MAP_WIDTH / 2 + 4, 75, "INTERACTIVE IDEAS", {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: "36px",
        color: "#3d0505",
      })
      .setOrigin(0.5)
      .setDepth(-188);
    this.backgroundLayer.add(titleShadow);

    const titleText = this.add
      .text(this.MAP_WIDTH / 2, 70, "INTERACTIVE IDEAS", {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: "36px",
        color: "#ef4444",
      })
      .setOrigin(0.5)
      .setDepth(-187);
    this.backgroundLayer.add(titleText);

    const subText = this.add
      .text(this.MAP_WIDTH / 2, 110, "startup journey", {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: "14px",
        color: "#b45309",
      })
      .setOrigin(0.5)
      .setDepth(-187);
    this.backgroundLayer.add(subText);

    this.cameras.main.setBackgroundColor("#f59e0b");
  }

  /**
   * Procedural Island Generation
   * Draws wooden bridges connecting all checkpoints and draws a sandy
   * island base beneath each checkpoint coordinate.
   */
  private createAdventurePath(): void {
    // Calculate total checkpoints across all stages
    const TOTAL_CHECKPOINTS = VENTURE_STAGES.reduce(
      (sum, stage) => sum + stage.checkpoints,
      0,
    );

    // Generate positions dynamically using snake-path algorithm
    const POSITIONS: { x: number; y: number }[] = [];
    let globalIndex = 0;
    for (const stageData of VENTURE_STAGES) {
      for (let cp = 1; cp <= stageData.checkpoints; cp++) {
        const pos = this.calculateCheckpointPosition(
          stageData.id,
          cp,
          globalIndex,
        );
        POSITIONS.push(pos);
        globalIndex++;
      }
    }

    // Pre-compute path control points (same for both outline and inner)
    const pathSegs: {
      x0: number;
      y0: number;
      cp1x: number;
      cp1y: number;
      cp2x: number;
      cp2y: number;
      x1: number;
      y1: number;
    }[] = [];
    for (let i = 1; i < POSITIONS.length; i++) {
      const prev = POSITIONS[i - 1];
      const curr = POSITIONS[i];
      pathSegs.push({
        x0: prev.x,
        y0: prev.y,
        cp1x: prev.x + (curr.x - prev.x) * 0.3 + Math.sin(i * 1.7) * 60,
        cp1y: prev.y + (curr.y - prev.y) * 0.2 + Math.cos(i * 2.1) * 40,
        cp2x: prev.x + (curr.x - prev.x) * 0.7 + Math.sin(i * 2.3) * 60,
        cp2y: prev.y + (curr.y - prev.y) * 0.8 + Math.cos(i * 1.4) * 40,
        x1: curr.x,
        y1: curr.y,
      });
    }

    const pathGfx = this.add.graphics();

    // Outer dark path
    pathGfx.lineStyle(10, 0x78350f, 1);
    pathGfx.beginPath();
    pathGfx.moveTo(POSITIONS[0].x, POSITIONS[0].y);
    for (const seg of pathSegs) {
      this.cubicBezierPath(
        pathGfx,
        seg.x0,
        seg.y0,
        seg.cp1x,
        seg.cp1y,
        seg.cp2x,
        seg.cp2y,
        seg.x1,
        seg.y1,
      );
    }
    pathGfx.strokePath();

    // Inner lighter path
    pathGfx.lineStyle(6, 0xd97706, 1);
    pathGfx.beginPath();
    pathGfx.moveTo(POSITIONS[0].x, POSITIONS[0].y);
    for (const seg of pathSegs) {
      this.cubicBezierPath(
        pathGfx,
        seg.x0,
        seg.y0,
        seg.cp1x,
        seg.cp1y,
        seg.cp2x,
        seg.cp2y,
        seg.x1,
        seg.y1,
      );
    }
    pathGfx.strokePath();
    pathGfx.setDepth(-5);
    this.backgroundLayer.add(pathGfx);

    // Tombstones beneath each checkpoint
    const tombGfx = this.add.graphics();
    for (let i = 0; i < TOTAL_CHECKPOINTS; i++) {
      const { x, y } = POSITIONS[i];
      const w = 70;
      const h = 80;
      const bx = x - w / 2;
      const by = y - h / 2;

      // Shadow
      tombGfx.fillStyle(0x78350f, 0.5);
      tombGfx.fillEllipse(x + 4, y + h / 2 + 4, w + 10, 18);

      // Body fill
      tombGfx.fillStyle(0x92400e, 1);
      tombGfx.fillRect(bx, by + 28, w, h - 28);

      // Arch top
      tombGfx.fillStyle(0x92400e, 1);
      tombGfx.beginPath();
      tombGfx.arc(x, by + 28, w / 2, Math.PI, 0, false);
      tombGfx.fillPath();

      // Outline
      tombGfx.lineStyle(3, 0x78350f, 1);
      tombGfx.beginPath();
      tombGfx.moveTo(bx, by + h / 2);
      tombGfx.lineTo(bx, by + 28);
      tombGfx.arc(x, by + 28, w / 2, Math.PI, 0, false);
      tombGfx.lineTo(bx + w, by + h / 2);
      tombGfx.strokePath();

      // Cross on tombstone
      tombGfx.lineStyle(3, 0xfbbf24, 0.7);
      tombGfx.lineBetween(x, by + 10, x, by + 42);
      tombGfx.lineBetween(x - 12, by + 22, x + 12, by + 22);

      // Stage label near first checkpoint of each stage
      if (i === 0 || i === 4) {
        const label = i === 0 ? "IDEATION" : "RESEARCH";
        const labelGfx = this.add.graphics();
        labelGfx.fillStyle(i === 0 ? 0xef4444 : 0x3b82f6, 1);
        labelGfx.fillRoundedRect(x - 55, y - h / 2 - 38, 110, 30, 6);
        labelGfx.lineStyle(2, i === 0 ? 0x7f1d1d : 0x1e3a8a, 1);
        labelGfx.strokeRoundedRect(x - 55, y - h / 2 - 38, 110, 30, 6);
        labelGfx.setDepth(2);
        this.backgroundLayer.add(labelGfx);
        const labelTxt = this.add
          .text(x, y - h / 2 - 23, label, {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: "9px",
            color: "#ffffff",
          })
          .setOrigin(0.5)
          .setDepth(3);
        this.backgroundLayer.add(labelTxt);
      }
    }
    tombGfx.setDepth(-3);
    this.backgroundLayer.add(tombGfx);

    // START sign (green, left)
    const startGfx = this.add.graphics();
    startGfx.fillStyle(0x4d7c0f, 1);
    startGfx.fillRoundedRect(0, 0, 100, 40, 8);
    startGfx.lineStyle(2, 0x1a2e05, 1);
    startGfx.strokeRoundedRect(0, 0, 100, 40, 8);
    const startSign = this.add.container(
      POSITIONS[0].x - 120,
      POSITIONS[0].y + 50,
    );
    const startTxt = this.add
      .text(50, 20, "START", {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: "10px",
        color: "#ffffff",
      })
      .setOrigin(0.5);
    startSign.add([startGfx, startTxt]);
    startSign.setDepth(2);
    this.backgroundLayer.add(startSign);

    // FINISH arrow sign (blue, right)
    const finishGfx = this.add.graphics();
    finishGfx.fillStyle(0x1d4ed8, 1);
    finishGfx.fillRoundedRect(0, 0, 80, 40, 8);
    finishGfx.lineStyle(2, 0x1e3a8a, 1);
    finishGfx.strokeRoundedRect(0, 0, 80, 40, 8);
    const arrowGfx = this.add.graphics();
    arrowGfx.fillStyle(0xffffff, 1);
    arrowGfx.fillTriangle(55, 20, 35, 10, 35, 30);
    arrowGfx.fillRect(15, 15, 20, 10);
    const finishSign = this.add.container(
      POSITIONS[7].x + 50,
      POSITIONS[7].y - 10,
    );
    finishSign.add([finishGfx, arrowGfx]);
    finishSign.setDepth(2);
    this.backgroundLayer.add(finishSign);

    // Stage divider line between stage 1 and stage 2
    const divGfx = this.add.graphics();
    divGfx.lineStyle(3, 0x92400e, 0.4);
    divGfx.lineBetween(920, 180, 920, this.MAP_HEIGHT);
    divGfx.setDepth(-4);
    this.backgroundLayer.add(divGfx);
  }

  /**
   * Draw modern tech-style path with glow effect
   */
  private drawModernPath(
    graphics: Phaser.GameObjects.Graphics,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    color: number,
  ): void {
    const distance = Phaser.Math.Distance.Between(x1, y1, x2, y2);
    const segments = Math.floor(distance / 30);

    // Outer glow
    graphics.lineStyle(12, color, 0.08);
    graphics.beginPath();
    graphics.moveTo(x1, y1);

    for (let i = 1; i <= segments; i++) {
      const t = i / segments;
      const x = x1 + (x2 - x1) * t;
      const y = y1 + (y2 - y1) * t;

      // Subtle curve for visual interest
      const curve = Math.sin(t * Math.PI) * 20;
      const perpX = -(y2 - y1) / distance;
      const perpY = (x2 - x1) / distance;

      graphics.lineTo(x + perpX * curve, y + perpY * curve);
    }

    graphics.strokePath();

    // Middle glow
    graphics.lineStyle(6, color, 0.15);
    graphics.beginPath();
    graphics.moveTo(x1, y1);

    for (let i = 1; i <= segments; i++) {
      const t = i / segments;
      const x = x1 + (x2 - x1) * t;
      const y = y1 + (y2 - y1) * t;
      const curve = Math.sin(t * Math.PI) * 20;
      const perpX = -(y2 - y1) / distance;
      const perpY = (x2 - x1) / distance;
      graphics.lineTo(x + perpX * curve, y + perpY * curve);
    }

    graphics.strokePath();

    // Core line
    graphics.lineStyle(2, color, 0.5);
    graphics.beginPath();
    graphics.moveTo(x1, y1);

    for (let i = 1; i <= segments; i++) {
      const t = i / segments;
      const x = x1 + (x2 - x1) * t;
      const y = y1 + (y2 - y1) * t;
      const curve = Math.sin(t * Math.PI) * 20;
      const perpX = -(y2 - y1) / distance;
      const perpY = (x2 - x1) / distance;
      graphics.lineTo(x + perpX * curve, y + perpY * curve);
    }

    graphics.strokePath();

    // Add data nodes along the path
    for (let i = 0; i < distance / 100; i++) {
      const t = Math.random();
      const x = x1 + (x2 - x1) * t;
      const y = y1 + (y2 - y1) * t;
      const curve = Math.sin(t * Math.PI) * 20;
      const perpX = -(y2 - y1) / distance;
      const perpY = (x2 - x1) / distance;

      const nodeX = x + perpX * curve;
      const nodeY = y + perpY * curve;

      // Node glow
      graphics.fillStyle(color, 0.2);
      graphics.fillCircle(nodeX, nodeY, 8);

      // Node core
      graphics.fillStyle(color, 0.6);
      graphics.fillCircle(nodeX, nodeY, 4);
    }
  }

  /**
   * Play a checkpoint animation based on stage and variant
   *
   * @param checkpointId - ID of the checkpoint being animated
   * @param stage - Stage number (1-8) determines which animation pattern
   * @param variant - 'standard' (blue, 2s) or 'gold' (amber, 3s)
   *
   * @remarks
   * Animation patterns mapped per PRD:
   * - S1, S8: Seal Break
   * - S2: Rune Inscription
   * - S3, S7: Beacon Lighting
   * - S4: Bridge Repair
   * - S5: Compass Calibration
   * - S6: Ward Placement
   */
  playCheckpointAnimation(
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
   *
   * @remarks
   * Called automatically when a new animation starts or when
   * the current animation completes
   */
  private stopCurrentAnimation(): void {
    if (this.currentAnimation) {
      this.currentAnimation.destroy();
      this.currentAnimation = null;
    }
  }

  /**
   * Update loop for scene (simplified for spaceship map)
   */
  update(): void {
    /**
     * PARALLAX SCROLLING IMPLEMENTATION (Week 2 Day 10)
     *
     * Creates depth perception by moving background layers at different speeds
     * relative to camera movement. Slower movement = appears further away.
     *
     * Technical approach:
     * - We offset each layer's position based on camera scroll
     * - Negative values because we move layers opposite to camera scroll
     * - Lower multipliers = slower apparent movement = greater perceived distance
     *
     * Layer structure:
     * - Background: 0.3x speed (distant stars, nebulae) - furthest
     * - Midground: 0.6x speed (medium stars, particles) - middle distance
     * - Game layer: 1.0x speed (checkpoints, rooms, persona) - no parallax
     *
     * When camera scrolls right (+X), backgrounds scroll left (-X) at reduced speed,
     * creating the illusion that they're further away in 3D space.
     */
    const cam = this.cameras.main;

    // Background layer - slowest (0.3x camera speed, furthest away)
    // Contains: Deep space background, distant stars, large nebula gradients
    if (this.backgroundLayer) {
      this.backgroundLayer.x = -cam.scrollX * 0.3;
      this.backgroundLayer.y = -cam.scrollY * 0.3;
    }

    // Midground layer - medium speed (0.6x camera speed, middle distance)
    // Contains: Medium-sized stars, colored nebula particles
    if (this.midgroundLayer) {
      this.midgroundLayer.x = -cam.scrollX * 0.6;
      this.midgroundLayer.y = -cam.scrollY * 0.6;
    }

    // Game layer (foreground) - full speed (1.0x, no parallax multiplier)
    // Contains: Spaceship rooms, checkpoints, persona, bright foreground stars
    // These elements move naturally with the camera (no offset needed)

    /**
     * LAZY LOADING CHECK (Week 2 Day 10)
     *
     * Check if any nearby rooms need to be loaded based on camera position.
     * This ensures rooms are created just before they become visible, improving
     * initial load time and overall performance.
     */
    this.checkBiomeLoading();
  }

  /**
   * Cleanup when scene is shutdown
   *
   * @remarks
   * Removes all event listeners to prevent memory leaks
   * Called automatically by Phaser when scene is stopped
   */
  shutdown(): void {
    // Stop any playing animation
    this.stopCurrentAnimation();

    // Clean up mini-bosses
    this.miniBosses.forEach((boss) => boss.destroy());
    this.miniBosses.clear();

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
