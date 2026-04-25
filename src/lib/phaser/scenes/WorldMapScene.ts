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
      accent1: 0x22c55e, // Emerald 500
      accent2: 0xf59e0b, // Amber 500
      path: 0xd2b48c,
    },
  },
  {
    id: 2,
    name: "The Forest",
    theme: "Research",
    colors: {
      sky: 0x065f46, // Teal 800
      ground: 0x064e3b, // Teal 900
      accent1: 0x14532d, // Green 900
      accent2: 0x4ade80, // Green 400
      path: 0x8b7355,
    },
  },
  {
    id: 3,
    name: "The Arena",
    theme: "Validation",
    colors: {
      sky: 0x450a0a, // Red 950
      ground: 0x7f1d1d, // Red 900
      accent1: 0x991b1b, // Red 800
      accent2: 0xf87171, // Red 400
      path: 0xdaa520,
    },
  },
  {
    id: 4,
    name: "The Artisan's Quarter",
    theme: "Offer Design",
    colors: {
      sky: 0x312e81, // Indigo 900
      ground: 0x1e1b4b, // Indigo 950
      accent1: 0x4338ca, // Indigo 700
      accent2: 0x818cf8, // Indigo 400
      path: 0xc0c0c0,
    },
  },
  {
    id: 5,
    name: "The Mine",
    theme: "Build & Deliver",
    colors: {
      sky: 0x18181b, // Zinc 900
      ground: 0x09090b, // Zinc 950
      accent1: 0x27272a, // Zinc 800
      accent2: 0x71717a, // Zinc 500
      path: 0x808080,
    },
  },
  {
    id: 6,
    name: "The Harbour",
    theme: "Launch",
    colors: {
      sky: 0x0c4a6e, // Cyan 900
      ground: 0x082f49, // Cyan 950
      accent1: 0x075985, // Cyan 800
      accent2: 0x38bdf8, // Cyan 400
      path: 0xc0c0c0,
    },
  },
  {
    id: 7,
    name: "The Crossroads Town",
    theme: "Iteration",
    colors: {
      sky: 0x4c1d95, // Violet 900
      ground: 0x2e1065, // Violet 950
      accent1: 0x5b21b6, // Violet 800
      accent2: 0xa78bfa, // Violet 400
      path: 0xbc8f8f,
    },
  },
  {
    id: 8,
    name: "The Capital",
    theme: "Scale",
    colors: {
      sky: 0x713f12, // Yellow 900 (Goldish)
      ground: 0x422006, // Yellow 950
      accent1: 0x854d0e, // Yellow 800
      accent2: 0xfacc15, // Yellow 400
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
  private selectedCheckpointIndex = 0;
  private selectionGlow: Phaser.GameObjects.Arc | null = null;
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

  private particleEmitters: Phaser.GameObjects.Particles.ParticleEmitter[] = [];

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
    this.createWaterRipples();
    this.createShorelineFoam();
    this.createSnakePath();
    this.createClouds();
    this.createAtmosphericEffects();
    this.createVolumetricLighting();
    this.createSuperBoss();
    this.createMiniBosses();
    
    this.setupGamepadListeners();
    
    // Initial selection
    this.updateGamepadSelection();

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
   * Draws premium background for a biome zone with gradients and depth
   */
  private drawBiomeBackground(
    container: Phaser.GameObjects.Container,
    biome: BiomeConfig,
  ): void {
    const graphics = this.add.graphics();

    // Sky (premium solid color with atmosphere layers below)
    graphics.fillStyle(biome.colors.sky, 1);
    graphics.fillRect(0, 0, this.BIOME_WIDTH, this.MAP_HEIGHT * 0.6);

    // Atmospheric depth layers (distant hills/mountains)
    for (let layer = 0; layer < 3; layer++) {
      const layerY = this.MAP_HEIGHT * (0.45 + layer * 0.05);
      const layerAlpha = 0.15 - layer * 0.05;
      graphics.fillStyle(0x000000, layerAlpha);

      for (let x = 0; x < this.BIOME_WIDTH; x += 100) {
        const height = 40 + Math.sin(x * 0.01 + layer) * 20;
        graphics.beginPath();
        graphics.moveTo(x, layerY);
        graphics.lineTo(x + 50, layerY - height);
        graphics.lineTo(x + 100, layerY);
        graphics.closePath();
        graphics.fillPath();
      }
    }

    // Ground (solid base layer)
    graphics.fillStyle(biome.colors.ground, 1);
    graphics.fillRect(
      0,
      this.MAP_HEIGHT * 0.6,
      this.BIOME_WIDTH,
      this.MAP_HEIGHT * 0.4,
    );

    // Ground texture with premium details
    graphics.fillStyle(biome.colors.accent1, 0.08);
    for (let i = 0; i < 50; i++) {
      const x = Math.random() * this.BIOME_WIDTH;
      const y = this.MAP_HEIGHT * 0.6 + Math.random() * (this.MAP_HEIGHT * 0.4);
      const size = Math.random() * 8 + 2;
      graphics.fillCircle(x, y, size);
    }

    // Ground edge highlight (gives 3D depth)
    graphics.lineStyle(3, biome.colors.accent2, 0.3);
    graphics.beginPath();
    graphics.moveTo(0, this.MAP_HEIGHT * 0.6);

    for (let x = 0; x < this.BIOME_WIDTH; x += 20) {
      const waveY = this.MAP_HEIGHT * 0.6 + Math.sin(x * 0.02) * 2;
      graphics.lineTo(x, waveY);
    }
    graphics.strokePath();

    // Atmospheric fog overlay (creates depth and mood)
    graphics.fillStyle(0xffffff, 0.05);
    for (let i = 0; i < 5; i++) {
      const fogX = (i * this.BIOME_WIDTH) / 5;
      const fogY = this.MAP_HEIGHT * 0.5;
      const fogRadius = 150;
      graphics.fillCircle(fogX, fogY, fogRadius);
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
      
      // Shadow
      graphics.fillStyle(0x000000, 0.2);
      graphics.fillRect(x + 5, y + 5, 80, 60);

      // House body
      graphics.fillStyle(biome.colors.accent1, 1);
      graphics.fillRect(x, y, 80, 60);
      
      // Roof
      graphics.fillStyle(biome.colors.accent2, 1);
      graphics.fillTriangle(x - 10, y, x + 90, y, x + 40, y - 40);
      graphics.lineStyle(2, 0xffffff, 0.3);
      graphics.strokeTriangle(x - 10, y, x + 90, y, x + 40, y - 40);

      // Door and Windows
      graphics.fillStyle(0x000000, 0.3);
      graphics.fillRect(x + 30, y + 30, 20, 30); // Door
      graphics.fillStyle(0xfde68a, 0.8); // Amber window light
      graphics.fillRect(x + 10, y + 10, 15, 15);
      graphics.fillRect(x + 55, y + 10, 15, 15);
    }
  }

  private drawForestDecorations(
    graphics: Phaser.GameObjects.Graphics,
    biome: BiomeConfig,
  ): void {
    for (let i = 0; i < 8; i++) {
      const x = 100 + i * 150;
      const y = this.MAP_HEIGHT * 0.6;
      
      // Trunk
      graphics.fillStyle(0x3e2723, 1);
      graphics.fillRect(x + 20, y, 10, 80);
      
      // Layered Canopy (3 tiers for premium look)
      graphics.fillStyle(biome.colors.accent1, 1);
      graphics.fillCircle(x + 25, y, 40);
      graphics.fillStyle(biome.colors.accent2, 0.8);
      graphics.fillCircle(x + 25, y - 20, 30);
      graphics.fillStyle(0xffffff, 0.2);
      graphics.fillCircle(x + 15, y - 10, 15); // Highlight
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
   * Creates atmospheric particles and ambient effects for premium feel
   */
  private createAtmosphericEffects(): void {
    // Floating dust motes across the map
    const dustParticles = this.add.particles(0, 0, "white", {
      x: { min: 0, max: this.MAP_WIDTH },
      y: { min: 0, max: this.MAP_HEIGHT * 0.7 },
      speedX: { min: -10, max: 10 },
      speedY: { min: -20, max: -5 },
      scale: { start: 0.1, end: 0 },
      alpha: { start: 0.3, end: 0 },
      lifespan: 4000,
      frequency: 200,
      blendMode: "ADD",
      tint: 0xffffff,
    });
    this.backgroundLayer.add(dustParticles);

    // Light rays from top (god rays effect)
    for (let i = 0; i < 8; i++) {
      const rayX = (i * this.MAP_WIDTH) / 8 + Math.random() * 200;
      const rayGraphics = this.add.graphics();
      rayGraphics.fillStyle(0xffffff, 0.08);
      rayGraphics.fillTriangle(
        rayX,
        0,
        rayX - 30,
        this.MAP_HEIGHT * 0.5,
        rayX + 30,
        this.MAP_HEIGHT * 0.5,
      );
      this.backgroundLayer.add(rayGraphics);

      // Animate light rays slowly
      this.tweens.add({
        targets: rayGraphics,
        alpha: { from: 0.08, to: 0.15 },
        duration: 3000 + Math.random() * 2000,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    }

    // Ambient glow orbs floating in background
    for (let i = 0; i < 12; i++) {
      const orbX = Math.random() * this.MAP_WIDTH;
      const orbY = Math.random() * (this.MAP_HEIGHT * 0.6);
      const orb = this.add.circle(orbX, orbY, 3, 0x6366f1, 0.4);
      this.backgroundLayer.add(orb);

      // Float animation
      this.tweens.add({
        targets: orb,
        y: orbY + (Math.random() * 60 - 30),
        x: orbX + (Math.random() * 40 - 20),
        alpha: { from: 0.2, to: 0.6 },
        scale: { from: 0.8, to: 1.2 },
        duration: 3000 + Math.random() * 2000,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
        delay: Math.random() * 2000,
      });
    }

    // Biome-specific particle systems
    BIOME_CONFIGS.forEach((biome, index) => {
      const biomeX = index * this.BIOME_WIDTH;
      
      let particleConfig: any = null;
      
      switch (biome.id) {
        case 2: // Forest - Falling leaves
          particleConfig = {
            x: { min: biomeX, max: biomeX + this.BIOME_WIDTH },
            y: -50,
            speedY: { min: 40, max: 80 },
            speedX: { min: -20, max: 20 },
            scale: { start: 0.15, end: 0.05 },
            alpha: { start: 0.6, end: 0 },
            lifespan: 12000,
            frequency: 150,
            tint: [0x4ade80, 0x14532d, 0x22c55e],
            rotate: { min: 0, max: 360 }
          };
          break;
        case 5: // Mine - Floating sparks/embers
          particleConfig = {
            x: { min: biomeX, max: biomeX + this.BIOME_WIDTH },
            y: { min: 400, max: 1000 },
            speedY: { min: -20, max: -40 },
            speedX: { min: -10, max: 10 },
            scale: { start: 0.1, end: 0 },
            alpha: { start: 0.8, end: 0 },
            lifespan: 3000,
            frequency: 100,
            tint: [0xf59e0b, 0xef4444, 0xfab005],
            blendMode: "ADD"
          };
          break;
        case 8: // Scaling - Glowing petals/magic
          particleConfig = {
            x: { min: biomeX, max: biomeX + this.BIOME_WIDTH },
            y: { min: 200, max: 800 },
            speedY: { min: -10, max: 10 },
            speedX: { min: -10, max: 10 },
            scale: { start: 0.2, end: 0.1 },
            alpha: { start: 0.4, end: 0 },
            lifespan: 5000,
            frequency: 120,
            tint: [0xffffff, 0xfde68a, 0x6366f1],
            blendMode: "ADD"
          };
          break;
      }
      
      if (particleConfig) {
        const emitter = this.add.particles(0, 0, "white", particleConfig);
        this.midgroundLayer.add(emitter);
        this.particleEmitters.push(emitter);
      }
    });

    // Shimmering stars in the distance (top sky area)
    for (let i = 0; i < 30; i++) {
      const starX = Math.random() * this.MAP_WIDTH;
      const starY = Math.random() * (this.MAP_HEIGHT * 0.3);
      const star = this.add.circle(starX, starY, 1, 0xffffff, 0.8);
      this.backgroundLayer.add(star);

      // Twinkle effect
      this.tweens.add({
        targets: star,
        alpha: { from: 0.3, to: 1.0 },
        scale: { from: 0.5, to: 1.5 },
        duration: 1000 + Math.random() * 2000,
        yoyo: true,
        repeat: -1,
        ease: "Quad.easeInOut",
        delay: Math.random() * 3000,
      });
    }
  }

  /**
   * Creates animated water ripples around biome edges and islands
   */
  private createWaterRipples(): void {
    const rippleCount = 20;
    for (let i = 0; i < rippleCount; i++) {
      const x = Math.random() * this.MAP_WIDTH;
      const y = Math.random() * this.MAP_HEIGHT;
      
      const ripple = this.add.graphics();
      ripple.lineStyle(2, 0xffffff, 0.2);
      ripple.strokeCircle(0, 0, 10);
      ripple.x = x;
      ripple.y = y;
      
      this.backgroundLayer.add(ripple);

      this.tweens.add({
        targets: ripple,
        scale: { from: 0.5, to: 4.0 },
        alpha: { from: 0.3, to: 0 },
        duration: 2000 + Math.random() * 2000,
        repeat: -1,
        ease: "Cubic.easeOut",
        delay: Math.random() * 4000
      });
    }
  }

  /**
   * Creates animated foam rings at the base of every island (checkpoint)
   */
  private createShorelineFoam(): void {
    // We'll get positions after path generation or hardcoded/procedural
    // For now, let's add them based on the snake path positions
    const positions = this.getSnakePathPositions();
    
    positions.forEach((pos, i) => {
      // Draw 2-3 rings per island
      for (let r = 0; r < 2; r++) {
        const ripple = this.add.graphics();
        ripple.lineStyle(2, 0xffffff, 0.4);
        ripple.strokeCircle(0, 0, 42); // Just outside the checkpoint radius
        ripple.x = pos.x;
        ripple.y = pos.y;
        
        this.backgroundLayer.add(ripple);

        this.tweens.add({
          targets: ripple,
          scale: { from: 1.0, to: 1.15 },
          alpha: { from: 0.4, to: 0.1 },
          duration: 3000 + Math.random() * 2000,
          repeat: -1,
          yoyo: true,
          ease: "Sine.easeInOut",
          delay: Math.random() * 2000
        });
      }
    });
  }

  /**
   * Creates angled cinematic 'God Rays' that drift across the screen
   */
  private createVolumetricLighting(): void {
    const rayCount = 6;
    for (let i = 0; i < rayCount; i++) {
      const x = Math.random() * this.MAP_WIDTH;
      const ray = this.add.graphics();
      
      this.backgroundLayer.add(ray);
      
      const updateRay = () => {
        ray.clear();
        // Modern palette: Use biome-specific colors or a safe premium white-gold
        ray.fillStyle(0xffffff, 0.05);
        
        const width = 100 + Math.random() * 200;
        const height = 1500;
        const angle = 0.2; // slight tilt
        
        ray.beginPath();
        ray.moveTo(x, -200);
        ray.lineTo(x + width, -200);
        ray.lineTo(x + width - height * angle, height);
        ray.lineTo(x - height * angle, height);
        ray.closePath();
        ray.fillPath();
      };
      
      updateRay();

      this.tweens.add({
        targets: ray,
        alpha: { from: 0.02, to: 0.08 },
        x: "+=50",
        duration: 8000 + Math.random() * 4000,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut"
      });
    }
  }
  private createClouds(): void {
    // Distant Parallax Mountains
    const mountainColors = [0x1e1b4b, 0x312e81, 0x4338ca]; // Indigo-950, 900, 700
    for (let layer = 0; layer < 3; layer++) {
      const g = this.add.graphics();
      g.fillStyle(mountainColors[layer], 0.4 - layer * 0.1);
      
      const speed = 0.02 * (layer + 1);
      const yBase = 200 + layer * 50;
      
      g.beginPath();
      g.moveTo(0, 1000);
      for (let x = 0; x <= this.MAP_WIDTH; x += 100) {
        const h = 150 - layer * 40 + Math.sin(x * 0.005 + layer) * 50;
        g.lineTo(x, yBase - h);
      }
      g.lineTo(this.MAP_WIDTH, 1000);
      g.closePath();
      g.fillPath();
      
      this.backgroundLayer.add(g);
      
      // Parallax scroll effect (slow drift)
      this.events.on("update", () => {
        g.x -= speed;
        if (g.x < -200) g.x = 0; // Simple loop
      });
    }

    const cloudCount = 12;
    for (let i = 0; i < cloudCount; i++) {
      const x = Math.random() * this.MAP_WIDTH;
      const y = 100 + Math.random() * 300;
      const cloud = this.add.container(x, y);

      const graphics = this.add.graphics();
      graphics.fillStyle(0xffffff, 0.15); // Very soft translucent white

      // Draw a "fluffy" cloud using multiple circles
      const parts = 5 + Math.floor(Math.random() * 5);
      for (let j = 0; j < parts; j++) {
        const ox = j * 40 - (parts * 20) / 2;
        const oy = Math.sin(j) * 10;
        const radius = 40 + Math.random() * 40;
        graphics.fillCircle(ox, oy, radius);
      }

      cloud.add(graphics);
      this.midgroundLayer.add(cloud);

      // Drifting animation
      const speed = 0.05 + Math.random() * 0.1;
      this.events.on("update", () => {
        cloud.x += speed;
        if (cloud.x > this.MAP_WIDTH + 200) {
          cloud.x = -200;
        }
      });

      // Subtle float up/down
      this.tweens.add({
        targets: cloud,
        y: y + 30,
        duration: 4000 + Math.random() * 3000,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    }
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

    // Draw premium path with depth and glow effects

    // Layer 1: Deep shadow (creates depth)
    const shadowGraphics = this.add.graphics();
    shadowGraphics.lineStyle(20, 0x000000, 0.3);
    shadowGraphics.beginPath();
    shadowGraphics.moveTo(positions[0].x + 3, positions[0].y + 5);
    for (let i = 1; i < positions.length; i++) {
      shadowGraphics.lineTo(positions[i].x + 3, positions[i].y + 5);
    }
    shadowGraphics.strokePath();
    this.midgroundLayer.add(shadowGraphics);

    // Layer 2: Outer glow (premium feel)
    const glowGraphics = this.add.graphics();
    glowGraphics.lineStyle(24, 0xfbbf24, 0.15);
    glowGraphics.beginPath();
    glowGraphics.moveTo(positions[0].x, positions[0].y);
    for (let i = 1; i < positions.length; i++) {
      glowGraphics.lineTo(positions[i].x, positions[i].y);
    }
    glowGraphics.strokePath();
    this.midgroundLayer.add(glowGraphics);

    // Layer 3: Main path body (textured brown)
    pathGraphics.lineStyle(16, 0x8b7355, 1);
    pathGraphics.beginPath();
    pathGraphics.moveTo(positions[0].x, positions[0].y);
    for (let i = 1; i < positions.length; i++) {
      pathGraphics.lineTo(positions[i].x, positions[i].y);
    }
    pathGraphics.strokePath();

    // Layer 4: Top highlight (3D effect)
    const highlightGraphics = this.add.graphics();
    highlightGraphics.lineStyle(10, 0xd2b48c, 0.6);
    highlightGraphics.beginPath();
    highlightGraphics.moveTo(positions[0].x, positions[0].y - 2);
    for (let i = 1; i < positions.length; i++) {
      highlightGraphics.lineTo(positions[i].x, positions[i].y - 2);
    }
    highlightGraphics.strokePath();

    // Layer 5: Inner glow line (premium accent)
    const innerGlowGraphics = this.add.graphics();
    innerGlowGraphics.lineStyle(3, 0xfcd34d, 0.4);
    innerGlowGraphics.beginPath();
    innerGlowGraphics.moveTo(positions[0].x, positions[0].y);
    for (let i = 1; i < positions.length; i++) {
      innerGlowGraphics.lineTo(positions[i].x, positions[i].y);
    }
    innerGlowGraphics.strokePath();

    // Layer 6: Wooden Planks (PRD premium bridge style)
    const plankGraphics = this.add.graphics();
    plankGraphics.lineStyle(2, 0x5d4037, 0.5);
    
    // Draw planks perpendicular to the path direction
    for (let i = 0; i < positions.length - 1; i++) {
      const start = positions[i];
      const end = positions[i + 1];
      const dist = Phaser.Math.Distance.Between(start.x, start.y, end.x, end.y);
      const angle = Phaser.Math.Angle.Between(start.x, start.y, end.x, end.y);
      
      const plankSpacing = 15;
      const plankWidth = 10;
      const bridgeWidth = 30;
      
      for (let d = 0; d < dist; d += plankSpacing) {
        const px = start.x + Math.cos(angle) * d;
        const py = start.y + Math.sin(angle) * d;
        
        // Calculate perpendicular points for the plank
        const perpAngle = angle + Math.PI / 2;
        const x1 = px + Math.cos(perpAngle) * (bridgeWidth / 2);
        const y1 = py + Math.sin(perpAngle) * (bridgeWidth / 2);
        const x2 = px - Math.cos(perpAngle) * (bridgeWidth / 2);
        const y2 = py - Math.sin(perpAngle) * (bridgeWidth / 2);
        
        plankGraphics.fillStyle(0x795548, 1);
        plankGraphics.lineStyle(1.5, 0x3e2723, 0.8);
        
        // Draw the plank as a thin rectangle
        plankGraphics.strokeLineShape(new Phaser.Geom.Line(x1, y1, x2, y2));
        
        // Add nail heads
        plankGraphics.fillStyle(0x3e2723, 0.6);
        plankGraphics.fillCircle(x1, y1, 2);
        plankGraphics.fillCircle(x2, y2, 2);
      }
    }

    // Add all path layers to scene
    this.midgroundLayer.add(pathGraphics);
    this.midgroundLayer.add(highlightGraphics);
    this.midgroundLayer.add(innerGlowGraphics);
    this.midgroundLayer.add(plankGraphics);

    // Add decorative post markers every 3 checkpoints
    for (let i = 0; i < positions.length; i += 3) {
      const post = this.add.graphics();
      // Base post shadow
      post.fillStyle(0x000000, 0.3);
      post.fillRect(positions[i].x - 6, positions[i].y - 20, 12, 40);
      
      // Post body
      post.fillStyle(0x5d4037, 1);
      post.fillRect(positions[i].x - 4, positions[i].y - 25, 8, 35);
      
      // Post top cap
      post.fillStyle(0xfbbf24, 0.8);
      post.fillCircle(positions[i].x, positions[i].y - 25, 6);
      post.lineStyle(1.5, 0xffffff, 0.4);
      post.strokeCircle(positions[i].x, positions[i].y - 25, 6);
      
      this.gameLayer.add(post);
    }

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

        node.setInteractive();
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

    // Handle checkpoint clicks (emitted by CheckpointNode)
    this.events.on(
      "checkpoint_clicked",
      (data: { id: string; stage: number; checkpoint: number }) => {
        console.log("[Phaser] Checkpoint clicked:", data);
        eventBridge.dispatchToReact({
          type: "CHECKPOINT_CLICKED",
          checkpointId: data.id,
          stage: data.stage,
          checkpoint: data.checkpoint,
        });
      },
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
      // Camera pan animation
      this.cameras.main.pan(
        targetX,
        targetY,
        1000, // 1 second duration
        "Sine.easeInOut",
        false,
      );

      // Sync persona walk animation with camera scroll
      // Position persona 80px above checkpoint node (at character's feet)
      if (this.persona) {
        this.persona.moveToPosition(targetX, targetY - 80, 1000);
      }
    } else {
      this.cameras.main.centerOn(targetX, targetY);

      // Instantly position persona without animation
      if (this.persona) {
        this.persona.setPosition(targetX, targetY - 80);
      }
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

  /**
   * Listens for CustomEvents from the VirtualGamepad component
   */
  private setupGamepadListeners(): void {
    if (typeof window === "undefined") return;

    window.addEventListener("phaser-input", (e: any) => {
      const { type } = e.detail;
      
      switch (type) {
        case "DIR_LEFT":
          this.changeSelection(-1);
          break;
        case "DIR_RIGHT":
          this.changeSelection(1);
          break;
        case "ACTION_A": // Select
          this.handleGamepadConfirm();
          break;
        case "ACTION_Y": // Interact
          this.showCheckpointInfo(this.selectedCheckpointIndex);
          break;
      }
    });

    // Create selection highlight
    this.selectionGlow = this.add.arc(0, 0, 65, 0, 360, false, 0xffffff, 0);
    this.selectionGlow.setStrokeStyle(4, 0x6366f1, 0.6);
    this.backgroundLayer.add(this.selectionGlow);
    
    this.tweens.add({
      targets: this.selectionGlow,
      alpha: { from: 0.2, to: 0.6 },
      scale: 1.1,
      duration: 1000,
      yoyo: true,
      repeat: -1
    });
  }

  private changeSelection(delta: number): void {
    const newIndex = Phaser.Math.Clamp(this.selectedCheckpointIndex + delta, 0, this.TOTAL_CHECKPOINTS - 1);
    if (newIndex !== this.selectedCheckpointIndex) {
      this.selectedCheckpointIndex = newIndex;
      this.updateGamepadSelection();
      audioManager.playUI("hover");
    }
  }

  private updateGamepadSelection(): void {
    const cp = this.getCheckpointByIndex(this.selectedCheckpointIndex);
    if (cp && this.selectionGlow) {
      this.selectionGlow.setPosition(cp.x, cp.y);
      this.cameras.main.pan(cp.x, cp.y, 500, "Power2");
    }
  }

  private getCheckpointByIndex(index: number): CheckpointNode | null {
    for (const [id, node] of this.checkpointNodes.entries()) {
      if ((node as any).checkpointId.includes(String(index + 1)) || (node as any).globalIndex === index + 1) {
        return node;
      }
    }
    // Fallback: check all nodes for globalIndex property
    return Array.from(this.checkpointNodes.values()).find(n => (n as any).globalIndex === index + 1) || null;
  }

  private handleGamepadConfirm(): void {
    const node = this.getCheckpointByIndex(this.selectedCheckpointIndex);
    if (node && node.status !== 'locked') {
      this.events.emit("checkpoint_clicked", {
        id: node.checkpointId,
        stage: node.stage,
        checkpoint: node.checkpoint
      });
    }
  }

  private showCheckpointInfo(index: number): void {
    console.log("Showing info for checkpoint", index);
  }

  /**
   * Helper to get all checkpoint positions along the snake path
   */
  private getSnakePathPositions(): { x: number; y: number }[] {
    const positions: { x: number; y: number }[] = [];
    let globalIndex = 0;

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

    return positions;
  }
}
