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
import { brightnessToPhaser } from "../utils/brightness-calculator";

/**
 * Biome configuration for the 8 venture stages
 * Following PRD specifications for visual themes
 */
interface BiomeConfig {
  id: number;
  name: string;
  theme: string;
  visualTheme:
    | "village"
    | "forest"
    | "arena"
    | "artisan"
    | "mine"
    | "harbour"
    | "crossroads"
    | "capital";
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
    visualTheme: "village",
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
    visualTheme: "forest",
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
    visualTheme: "arena",
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
    visualTheme: "artisan",
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
    visualTheme: "mine",
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
    visualTheme: "harbour",
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
    visualTheme: "crossroads",
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
    visualTheme: "capital",
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
  private persona: Persona | null;
  private selectedCheckpointIndex = 0;
  private selectionGlow: Phaser.GameObjects.Arc | null = null;
  private bosses: Map<string, BossSilhouette>;
  private miniBosses: Map<number, MiniBoss>;
  /** Stages whose mini-boss has already played the retreat animation this session */
  private retreatedStages: Set<number> = new Set();
  /** Stages whose mini-boss defeat animation has already started this session */
  private slainMiniBossStages: Set<number> = new Set();
  /** Residual path markers for partially completed stages */
  private residualMarkers: Map<number, Phaser.GameObjects.Container> =
    new Map();
  /** Maps Convex checkpoint document IDs to Phaser node keys (`stage-checkpoint`) */
  private checkpointIdAliases: Map<string, string> = new Map();
  private lastPersonaCheckpointId: string | null = null;
  private currentSuperBossSlug: string | null = null;
  private currentSuperBossName: string | null = null;
  private lastSuperBossDefeatStatus: "active" | "retreated" | "slain" | null =
    null;

  // Scene layers
  private map!: Phaser.Tilemaps.Tilemap;
  private backgroundLayer!: Phaser.GameObjects.Container;
  private midgroundLayer!: Phaser.GameObjects.Container;
  private gameLayer!: Phaser.GameObjects.Container;
  private animationLayer!: Phaser.GameObjects.Container;

  // Animation state
  private currentAnimation: BaseCheckpointAnimation | null = null;

  // Brightness system (PRD two-layer formula)
  private brightnessFilter: Phaser.FX.ColorMatrix | null = null;
  private currentBrightness: number = 0;
  private brightnessTween: Phaser.Tweens.Tween | null = null;

  // Venture state
  private currentVentureId: string | null;
  private currentStage: number = 1;
  private currentCorruptionLevel: number = 0;
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
      corruptionLevel?: number;
      superBoss?: {
        bossSlug: string;
        bossName: string;
        visualStatus: "silhouette" | "present" | "foreground";
        status?: "active" | "retreated" | "slain";
        defeatVariant?: "standard" | "gold";
      };
    }) => void;
    scrollToCheckpoint?: (event: { checkpointId: string }) => void;
    focusStage?: (event: { stage: number; checkpointId?: string }) => void;
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
  private readonly MAP_PANEL_SCALE = 2;

  // Snake path configuration
  private readonly CHECKPOINT_SPACING = 220;
  private readonly SNAKE_AMPLITUDE = 180;
  private readonly PATH_Y_CENTER = this.MAP_HEIGHT / 2;

  // Biome containers
  private biomeContainers: Map<number, Phaser.GameObjects.Container> =
    new Map();
  private stageFogOverlays: Map<number, Phaser.GameObjects.Container> =
    new Map();
  private revealedStages: Set<number> = new Set([1]);
  private stageEntryInProgress: Set<number> = new Set();

  private particleEmitters: Phaser.GameObjects.Particles.ParticleEmitter[] = [];
  private resizeHandler?: (
    gameSize: Phaser.Structs.Size,
    baseSize: Phaser.Structs.Size,
    displaySize: Phaser.Structs.Size,
    resolution: number,
  ) => void;

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
    AssetLoader.createPersonaAnimations(this);

    // Build world
    this.createBiomeZones();
    this.createTilemap();
    this.createSnakePath();
    this.createBiomeLandmarks();
    this.createSuperBoss();
    this.createMiniBosses();
    this.createAtmosphericEffects();
    this.createStageFogOverlays();
    this.updateStageVisibility(1, false);

    this.setupGamepadListeners();

    // Initial selection
    this.updateGamepadSelection();

    // Set up event listeners
    this.setupEventListeners();

    // Apply initial brightness (0%)
    this.updateBrightnessFilter(0);

    // Camera setup with responsive zoom
    this.cameras.main.roundPixels = true;
    this.applyResponsiveCamera(true);
    this.resizeHandler = () => {
      this.applyResponsiveCamera(false);
    };
    this.scale.on("resize", this.resizeHandler);

    // Detect mobile/touch device
    const isTouchDevice =
      "ontouchstart" in window || navigator.maxTouchPoints > 0;
    const isMobile = this.scale.width < 768;

    // Enable camera drag with mobile optimization
    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      audioManager.unlock();

      // Store initial camera position for drag
      this.registry.set("dragStartX", this.cameras.main.scrollX);
      this.registry.set("dragStartY", this.cameras.main.scrollY);
      this.registry.set("pointerStartX", pointer.x);
      this.registry.set("pointerStartY", pointer.y);
    });

    this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      if (pointer.isDown) {
        const dragStartX =
          this.registry.get("dragStartX") || this.cameras.main.scrollX;
        const dragStartY =
          this.registry.get("dragStartY") || this.cameras.main.scrollY;
        const pointerStartX = this.registry.get("pointerStartX") || pointer.x;
        const pointerStartY = this.registry.get("pointerStartY") || pointer.y;

        // Smooth drag with momentum on mobile
        const dragSensitivity = isMobile ? 1.2 : 1.0;
        const deltaX =
          ((pointerStartX - pointer.x) / this.cameras.main.zoom) *
          dragSensitivity;
        const deltaY =
          ((pointerStartY - pointer.y) / this.cameras.main.zoom) *
          dragSensitivity;

        this.cameras.main.scrollX = dragStartX + deltaX;
        this.cameras.main.scrollY = dragStartY + deltaY;
      }
    });

    // Add pinch-to-zoom for mobile
    if (isTouchDevice) {
      let initialDistance = 0;
      let initialZoom = 1;

      this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
        if (this.input.pointer2.isDown) {
          const dx = this.input.pointer1.x - this.input.pointer2.x;
          const dy = this.input.pointer1.y - this.input.pointer2.y;
          initialDistance = Math.sqrt(dx * dx + dy * dy);
          initialZoom = this.cameras.main.zoom;
        }
      });

      this.input.on("pointermove", () => {
        if (this.input.pointer1.isDown && this.input.pointer2.isDown) {
          const dx = this.input.pointer1.x - this.input.pointer2.x;
          const dy = this.input.pointer1.y - this.input.pointer2.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (initialDistance > 0) {
            const scale = distance / initialDistance;
            const newZoom = Phaser.Math.Clamp(initialZoom * scale, 0.3, 1.5);
            this.cameras.main.setZoom(newZoom);
          }
        }
      });
    }

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

  private applyResponsiveCamera(initial: boolean): void {
    const width = this.scale.width;
    const height = this.scale.height;
    const aspectRatio = width / height;
    const isPortrait = height > width;
    const isMobile = width < 768;
    const isTablet = width >= 768 && width < 1024;
    const isSmallMobile = width < 480;

    let zoom = 1;

    // Mobile portrait (phones)
    if (isSmallMobile && isPortrait) {
      zoom = 0.38;
    } else if (isMobile && isPortrait) {
      zoom = 0.48;
    }
    // Mobile landscape
    else if (isMobile && !isPortrait) {
      zoom = 0.58;
    }
    // Tablet portrait
    else if (isTablet && isPortrait) {
      zoom = 0.62;
    }
    // Tablet landscape
    else if (isTablet && !isPortrait) {
      zoom = 0.72;
    }
    // Desktop small
    else if (width < 1280) {
      zoom = 0.78;
    }
    // Desktop medium
    else if (width < 1600) {
      zoom = 0.88;
    }
    // Desktop large
    else if (width < 1920) {
      zoom = 0.95;
    }
    // Desktop XL
    else {
      zoom = 1.0;
    }

    // Additional adjustment for very short screens
    if (height < 500) {
      zoom *= 0.82;
    } else if (height < 600) {
      zoom *= 0.88;
    }

    // Adjust for extreme aspect ratios
    if (aspectRatio < 0.6) {
      // Very tall screens
      zoom *= 0.92;
    } else if (aspectRatio > 2.2) {
      // Very wide screens
      zoom *= 1.08;
    }

    // Keep a focused stage wide enough to own the viewport instead of showing
    // the next biome beside it.
    const stageFillZoom = width / this.BIOME_WIDTH;
    if (width >= 768) {
      zoom = Math.max(zoom, stageFillZoom);
    }

    this.cameras.main.setZoom(zoom);

    if (initial) {
      this.cameras.main.centerOn(this.BIOME_WIDTH / 2, this.MAP_HEIGHT / 2);
    }

    // Store zoom for UI scaling
    this.registry.set("cameraZoom", zoom);
    this.registry.set("isMobile", isMobile);
    this.registry.set("isTablet", isTablet);
  }

  /**
   * Creates all 8 biome visual zones left to right
   */
  /**
   * Creates the Tiled map and its layers, integrated into the background.
   */
  private createTilemap(): void {
    this.map = this.make.tilemap({ key: "beginning_fields" });

    const tilesetMapping = [
      { name: "Atlas_Buildings", key: "Buildings" },
      { name: "Buildings", key: "House_Hay_1" },
      { name: "Objects_Props", key: "Sign_1" },
      { name: "Objects_Rocks", key: "Rock_Brown_1" },
      { name: "Objects_Trees", key: "Tree_Emerald_1" },
      { name: "Atlas_Props", key: "Props" },
      { name: "Atlas_Rocks", key: "Rocks" },
      { name: "Tileset_Ground", key: "Tileset_Ground" },
      { name: "Tileset_RockSlope", key: "Tileset_RockSlope" },
      { name: "Tileset_RockSlope_Simple", key: "Tileset_RockSlope_Simple" },
      { name: "Tileset_Water", key: "Tileset_Water" },
      { name: "Road", key: "Tileset_Road" },
      { name: "Atlas_Trees_Bushes", key: "Trees_Bushes" },
      { name: "Animation_Flowers_Red", key: "Animation_Flowers_Red" },
      { name: "Animation_Flowers_White", key: "Animation_Flowers_White" },
      { name: "Campfire", key: "Animation_Campfire" },
      { name: "Tileset_Shadow", key: "Tileset_Shadow" },
      { name: "Objects_Shadows", key: "Shadow_Round_16x16_Flat_Black" },
    ];

    const phaserTilesets = tilesetMapping
      .map((tileset) => this.map.addTilesetImage(tileset.name, tileset.key))
      .filter(
        (tileset): tileset is Phaser.Tilemaps.Tileset => tileset !== null,
      );

    const scale = this.MAP_PANEL_SCALE;
    const layerNames = [
      "Ground",
      "Flowers",
      "Road",
      "RockSlopes",
      "RockSlopes_Auto",
      "Water",
      "Shadows",
    ];
    const panelWidth = this.map.widthInPixels * scale;
    const panelHeight = this.map.heightInPixels * scale;
    const panelOffsetX = (this.BIOME_WIDTH - panelWidth) / 2;
    const panelOffsetY = this.MAP_HEIGHT - panelHeight + 120;
    const objectLayer = this.map.getObjectLayer("Object Layer 1");

    for (let i = 0; i < BIOME_CONFIGS.length; i++) {
      const biome = BIOME_CONFIGS[i];
      const panelX = i * this.BIOME_WIDTH + panelOffsetX;
      if (biome.visualTheme === "forest") {
        this.createForestTilePanel(panelX, panelOffsetY, scale, biome, i);
        continue;
      }
      if (biome.visualTheme === "arena") {
        this.createArenaTilePanel(panelX, panelOffsetY, scale, biome, i);
        continue;
      }
      if (biome.visualTheme === "artisan") {
        this.createArtisanTilePanel(panelX, panelOffsetY, scale, biome, i);
        continue;
      }
      if (biome.visualTheme === "mine") {
        this.createMineTilePanel(panelX, panelOffsetY, scale, biome, i);
        continue;
      }
      if (biome.visualTheme === "harbour") {
        this.createHarbourTilePanel(panelX, panelOffsetY, scale, biome, i);
        continue;
      }
      if (biome.visualTheme === "crossroads") {
        this.createCrossroadsTilePanel(panelX, panelOffsetY, scale, biome, i);
        continue;
      }
      if (biome.visualTheme === "capital") {
        this.createCapitalTilePanel(panelX, panelOffsetY, scale, biome, i);
        continue;
      }

      layerNames.forEach((name) => {
        const layer = this.map.createLayer(name, phaserTilesets, panelX, 0);
        if (!layer) return;

        layer.setScale(scale);
        layer.setY(panelOffsetY);
        layer.setAlpha(name === "Shadows" ? 0.35 : 1);
        layer.setDepth(name === "Shadows" ? 4 : 3);

        if (name === "Water") {
          layer.setAlpha(0.9);
        }

        this.backgroundLayer.add(layer);
      });

      if (objectLayer) {
        this.renderMapObjects(objectLayer.objects, panelX, panelOffsetY, scale);
      }
    }
  }

  private createForestTilePanel(
    panelX: number,
    panelOffsetY: number,
    scale: number,
    biome: BiomeConfig,
    biomeIndex: number,
  ): void {
    const tileSize = 16 * scale;
    const cols = this.map.width;
    const rows = this.map.height;
    const style =
      biome.id === 2
        ? {
            baseTint: 0xc2ea7b,
            shadeTint: 0x7dbb49,
            canopyTint: 0x21532f,
            mistTint: 0xe9ffd8,
            waterTint: 0x83d7e5,
            pathTint: 0xb78b5a,
            hillTint: 0xffffff,
          }
        : biome.id === 5
          ? {
              baseTint: 0xa5c56d,
              shadeTint: 0x6c8748,
              canopyTint: 0x2f2a22,
              mistTint: 0xf4efd9,
              waterTint: 0x6fb7cb,
              pathTint: 0x9a7a53,
              hillTint: 0xf3efe0,
            }
          : {
              baseTint: 0xb8de7c,
              shadeTint: 0x6d9157,
              canopyTint: 0x39455a,
              mistTint: 0xf2f7fb,
              waterTint: 0x74aeca,
              pathTint: 0xaa7d60,
              hillTint: 0xf6f1e9,
            };
    const grassFrames = [0, 3, 12, 13, 14, 23, 24, 33, 34, 44, 55, 66];
    const grassAccentFrames = [7, 8, 18, 19, 41, 42, 63, 64, 75];
    const hillFrames = [0, 1, 2, 11, 12, 13, 22, 23, 24, 33, 34, 35, 88, 89];
    const waterFrames = [0, 1, 2, 3];
    const pathFrames = [0, 1, 4, 5, 10, 11, 12, 15];
    const fenceFrames = [0, 1, 2, 4, 5, 6, 8, 9, 10];
    const treeFrames = [0, 1, 2, 9];
    const shrubFrames = [27, 28, 29, 30, 31, 32];
    const flowerFrames = [3, 4, 5, 6, 7];
    const groundFrames = [21, 22, 23, 24, 33, 34, 35, 36, 37, 40, 41, 42];
    const plantFrames = [0, 1, 2, 3, 4, 5, 7, 8, 10, 11];
    const bridgeRow = 19 + (biomeIndex % 3);
    const upperPathRow = bridgeRow - 5;
    const lowerPathRow = bridgeRow + 6;
    const treeDepth = 8;
    const detailDepth = 9;

    const riverCenterAtRow = (row: number) =>
      20 +
      Math.sin((row + biomeIndex * 2) / 6.3) * 3.6 +
      Math.cos((row + biomeIndex * 5) / 11.5) * 1.2;

    const riverWidthAtRow = (row: number) =>
      1.15 +
      Math.max(0, 1.2 - Math.abs(row - 12) * 0.12) +
      Math.max(0, 0.95 - Math.abs(row - 29) * 0.16);

    const inEllipse = (
      x: number,
      y: number,
      centerX: number,
      centerY: number,
      radiusX: number,
      radiusY: number,
    ) =>
      ((x - centerX) * (x - centerX)) / (radiusX * radiusX) +
        ((y - centerY) * (y - centerY)) / (radiusY * radiusY) <
      1;

    const addFrameSprite = (
      texture: string,
      frame: number,
      x: number,
      y: number,
      depth: number,
      tint = 0xffffff,
      alpha = 1,
    ) => {
      const tile = this.add.sprite(
        panelX + x * tileSize + tileSize / 2,
        panelOffsetY + y * tileSize + tileSize / 2,
        texture,
        frame,
      );
      tile.setOrigin(0.5);
      tile.setScale(scale);
      tile.setTint(tint);
      tile.setAlpha(alpha);
      tile.setDepth(depth);
      this.backgroundLayer.add(tile);
    };

    const addForestProp = (
      texture: string,
      frame: number,
      x: number,
      y: number,
      propScale: number,
      depth = 8,
      alpha = 1,
    ) => {
      const shadow = this.add.image(
        x + 6,
        y + 10,
        "Shadow_Round_48x24_Flat_Black",
      );
      shadow.setOrigin(0.5, 0.5);
      shadow.setScale(propScale * 0.82);
      shadow.setAlpha(0.18);
      shadow.setDepth(depth - 1);
      this.midgroundLayer.add(shadow);

      const sprite = this.add.sprite(x, y, texture, frame);
      sprite.setOrigin(0.5, 1);
      sprite.setScale(propScale);
      sprite.setAlpha(alpha);
      sprite.setDepth(depth);
      this.midgroundLayer.add(sprite);
    };

    const ground = this.add.graphics();
    ground.fillStyle(style.baseTint, 0.98);
    ground.fillRect(panelX, panelOffsetY, cols * tileSize, rows * tileSize);
    ground.setDepth(1);
    this.backgroundLayer.add(ground);

    for (let row = 0; row < rows; row += 1) {
      const riverCenter = riverCenterAtRow(row);
      const riverHalfWidth = riverWidthAtRow(row);
      const corridorCenter =
        row < bridgeRow
          ? 13 + Math.sin((row + biomeIndex) / 6) * 2.5
          : 27 + Math.cos((row + biomeIndex) / 5) * 2.3;

      for (let col = 0; col < cols; col += 1) {
        const distToMainRiver = Math.abs(col - riverCenter);
        const inWater = riverHalfWidth > 0 && distToMainRiver <= riverHalfWidth;
        const onBank = !inWater && distToMainRiver <= riverHalfWidth + 1.05;
        const onWetBank = !inWater && distToMainRiver <= riverHalfWidth + 1.7;
        const inUpperGlade = inEllipse(col, row, 10.5, 11.5, 6.2, 4.8);
        const inBridgeGlade = inEllipse(
          col,
          row,
          20,
          bridgeRow + 0.5,
          7.4,
          5.6,
        );
        const inLowerGlade = inEllipse(col, row, 29, 29, 7.1, 5.2);
        const inSideGlade = inEllipse(col, row, corridorCenter, row, 4.8, 2.6);
        const inGlade =
          inUpperGlade || inBridgeGlade || inLowerGlade || inSideGlade;
        const inForestMass =
          (col < 8 && row > 5 && row < rows - 4) ||
          (col > cols - 9 && row > 4 && row < rows - 5) ||
          inEllipse(col, row, 8, 14, 5.8, 7.2) ||
          inEllipse(col, row, 31, 22, 6.2, 7.8) ||
          inEllipse(col, row, 14, 27, 5.4, 6.5) ||
          inEllipse(col, row, 27, 10, 5.2, 6.1);
        const inDeepForest = inForestMass && !inGlade;
        const edgeBand = row < 3 || row > rows - 4 || col < 2 || col > cols - 3;

        if (inWater) {
          addFrameSprite(
            "sprout_water_sheet",
            waterFrames[(row + col + biome.id) % waterFrames.length],
            col,
            row,
            3,
            style.waterTint,
          );
          continue;
        }

        if (onBank) {
          addFrameSprite(
            "sprout_grass_sheet",
            grassFrames[(col * 5 + row * 3 + biome.id) % grassFrames.length],
            col,
            row,
            2,
            style.shadeTint,
            0.96,
          );
        } else if (
          inDeepForest ||
          edgeBand ||
          (col + row + biomeIndex) % 4 === 0
        ) {
          addFrameSprite(
            "sprout_grass_sheet",
            grassFrames[(col * 7 + row * 5 + biome.id) % grassFrames.length],
            col,
            row,
            2,
            inDeepForest ? style.shadeTint : 0xffffff,
            inDeepForest ? 0.96 : 0.9,
          );
        }

        if (
          !inGlade &&
          !onWetBank &&
          ((col + row * 2 + biomeIndex) % 9 === 0 || inDeepForest)
        ) {
          addFrameSprite(
            "sprout_grass_sheet",
            grassAccentFrames[
              (col + row + biome.id) % grassAccentFrames.length
            ],
            col,
            row,
            3,
            0xffffff,
            inDeepForest ? 0.72 : 0.84,
          );
        }
        if (
          (row <= 2 || row >= rows - 3) &&
          col > 1 &&
          col < cols - 2 &&
          (col + row + biomeIndex) % 2 === 0
        ) {
          addFrameSprite(
            "sprout_hills_sheet",
            hillFrames[(col + row + biome.id) % hillFrames.length],
            col,
            row,
            4,
            style.hillTint,
          );
        }
      }
    }

    const humidShade = this.add.graphics();
    humidShade.fillStyle(style.canopyTint, 0.06);
    humidShade.fillRect(panelX, panelOffsetY, cols * tileSize, rows * tileSize);
    humidShade.setDepth(1);
    this.backgroundLayer.add(humidShade);

    const canopy = this.add.graphics();
    canopy.fillStyle(style.canopyTint, 0.1);
    canopy.fillEllipse(panelX + 180, panelOffsetY + 122, 360, 108);
    canopy.fillEllipse(panelX + 700, panelOffsetY + 108, 580, 128);
    canopy.fillEllipse(panelX + 1184, panelOffsetY + 150, 330, 108);
    canopy.fillEllipse(panelX + 248, panelOffsetY + 1090, 410, 122);
    canopy.fillEllipse(panelX + 988, panelOffsetY + 1082, 470, 128);
    canopy.setDepth(2);
    this.backgroundLayer.add(canopy);

    const mist = this.add.graphics();
    mist.fillStyle(style.mistTint, 0.05);
    mist.fillEllipse(panelX + 312, panelOffsetY + 506, 250, 56);
    mist.fillEllipse(panelX + 1002, panelOffsetY + 820, 310, 62);
    mist.setDepth(6);
    this.backgroundLayer.add(mist);

    const bridgeCenter = Math.round(riverCenterAtRow(bridgeRow));
    for (let frame = 0; frame < 5; frame += 1) {
      addFrameSprite(
        "sprout_bridge_sheet",
        frame,
        bridgeCenter - 2 + frame,
        bridgeRow,
        6,
      );
    }

    [
      { row: upperPathRow, start: 6, end: bridgeCenter - 3 },
      { row: bridgeRow, start: bridgeCenter - 4, end: bridgeCenter + 4 },
      { row: lowerPathRow, start: bridgeCenter + 3, end: cols - 7 },
    ].forEach(({ row, start, end }, bandIndex) => {
      for (let col = start; col <= end; col += 1) {
        addFrameSprite(
          "sprout_paths_sheet",
          pathFrames[(col + bandIndex * 3 + biome.id) % pathFrames.length],
          col,
          row,
          5,
          style.pathTint,
          0.92,
        );
      }
    });

    [
      { row: upperPathRow - 1, x1: 7, x2: 12 },
      { row: lowerPathRow + 1, x1: cols - 13, x2: cols - 8 },
      { row: bridgeRow + 4, x1: bridgeCenter - 6, x2: bridgeCenter - 2 },
    ].forEach(({ row, x1, x2 }, index) => {
      for (let col = x1; col <= x2; col += 1) {
        addFrameSprite(
          "sprout_fences_sheet",
          fenceFrames[(col + index + biome.id) % fenceFrames.length],
          col,
          row,
          6,
        );
      }
    });

    // Top tree line - evenly spaced, avoiding checkpoints
    for (let i = 0; i < 10; i += 1) {
      const col = 4 + i * 3.6;
      if (col > 18 && col < 22) continue; // Skip checkpoint area
      addForestProp(
        "sprout_forest_decor_sheet",
        treeFrames[i % treeFrames.length],
        panelX + col * tileSize,
        panelOffsetY + 2.8 * tileSize,
        1.48 + (i % 2) * 0.06,
        treeDepth,
        0.96,
      );
    }

    // Bottom tree line - evenly spaced, avoiding checkpoints
    for (let i = 0; i < 10; i += 1) {
      const col = 4 + i * 3.6;
      if (col > 18 && col < 22) continue; // Skip checkpoint area
      addForestProp(
        "sprout_forest_decor_sheet",
        treeFrames[(i + 2) % treeFrames.length],
        panelX + col * tileSize,
        panelOffsetY + (rows - 2.8) * tileSize,
        1.52 + (i % 2) * 0.06,
        treeDepth,
        0.96,
      );
    }

    // Left side trees - vertical arrangement
    for (let i = 0; i < 5; i += 1) {
      const row = 8 + i * 5;
      if (row > bridgeRow - 3 && row < bridgeRow + 3) continue; // Skip bridge area
      addForestProp(
        "sprout_forest_decor_sheet",
        treeFrames[i % treeFrames.length],
        panelX + 2.5 * tileSize,
        panelOffsetY + row * tileSize,
        1.54 + (i % 2) * 0.08,
        treeDepth,
        0.95,
      );
    }

    // Right side trees - vertical arrangement
    for (let i = 0; i < 5; i += 1) {
      const row = 8 + i * 5;
      if (row > bridgeRow - 3 && row < bridgeRow + 3) continue; // Skip bridge area
      addForestProp(
        "sprout_forest_decor_sheet",
        treeFrames[(i + 1) % treeFrames.length],
        panelX + (cols - 2.5) * tileSize,
        panelOffsetY + row * tileSize,
        1.56 + (i % 2) * 0.08,
        treeDepth,
        0.95,
      );
    }

    // Feature trees in clearings - carefully placed
    [
      [8.5, 11.5, 1.72, treeFrames[0]],
      [11.5, 13.2, 1.68, treeFrames[1]],
      [30.5, 11.8, 1.74, treeFrames[2]],
      [33.2, 13.5, 1.7, treeFrames[3]],
      [9.2, 28.5, 1.66, treeFrames[1]],
      [12.5, 30.2, 1.72, treeFrames[0]],
      [29.8, 28.8, 1.68, treeFrames[2]],
      [32.5, 30.5, 1.7, treeFrames[3]],
    ].forEach(([x, y, spriteScale, frame], index) => {
      addForestProp(
        "sprout_forest_decor_sheet",
        frame as number,
        panelX + (x as number) * tileSize,
        panelOffsetY + (y as number) * tileSize,
        spriteScale as number,
        treeDepth - 1,
      );
    });

    // Shrubs and bushes - organized placement around clearings
    [
      [7.5, 10.2, 1.12, shrubFrames[0]],
      [13.5, 10.5, 1.1, shrubFrames[2]],
      [15.5, bridgeRow + 5, 1.08, shrubFrames[4]],
      [25.5, bridgeRow - 4, 1.1, shrubFrames[1]],
      [31.5, 27.5, 1.12, shrubFrames[5]],
      [28.5, 31.2, 1.08, shrubFrames[3]],
      [6.5, 29.5, 1.06, shrubFrames[2]],
      [34.5, 10.8, 1.1, shrubFrames[4]],
    ].forEach(([x, y, spriteScale, frame], index) => {
      addForestProp(
        "sprout_forest_decor_sheet",
        frame as number,
        panelX + (x as number) * tileSize,
        panelOffsetY + (y as number) * tileSize,
        spriteScale as number,
        detailDepth,
      );
    });

    // Rocks - strategic placement
    [
      [6.2, 15.5, 1.08, groundFrames[2]],
      [14.8, 9.2, 1.06, groundFrames[7]],
      [26.5, 32.5, 1.1, groundFrames[5]],
      [35.2, 16.8, 1.08, groundFrames[3]],
    ].forEach(([x, y, spriteScale, frame]) => {
      addForestProp(
        "sprout_forest_decor_sheet",
        frame as number,
        panelX + (x as number) * tileSize,
        panelOffsetY + (y as number) * tileSize,
        spriteScale as number,
        detailDepth,
      );
    });

    // Plants and flowers - organized in clearings, avoiding paths and river
    for (let row = 7; row < rows - 7; row += 2) {
      for (let col = 5; col < cols - 5; col += 3) {
        const distToRiver = Math.abs(col - riverCenterAtRow(row));

        // Define clear zones
        const inUpperClearing = inEllipse(col, row, 10.5, 11.5, 5.5, 4.2);
        const inBridgeClearing = inEllipse(
          col,
          row,
          20,
          bridgeRow + 0.5,
          6.5,
          5.0,
        );
        const inLowerClearing = inEllipse(col, row, 29, 29, 6.0, 4.5);
        const inClearing =
          inUpperClearing || inBridgeClearing || inLowerClearing;

        // Skip river, banks, and paths
        if (distToRiver < 3.5) continue;
        if (Math.abs(row - upperPathRow) < 2) continue;
        if (Math.abs(row - bridgeRow) < 2) continue;
        if (Math.abs(row - lowerPathRow) < 2) continue;

        // Only place in clearings
        if (!inClearing) continue;

        // Varied placement pattern
        if ((col + row + biome.id) % 3 !== 0) continue;

        // Add plants
        addFrameSprite(
          "sprout_plants_sheet",
          plantFrames[(col + row + biome.id) % plantFrames.length],
          col,
          row,
          6,
          0xffffff,
          0.94,
        );

        // Add flowers less frequently
        if ((col + row + biomeIndex) % 5 === 0) {
          addFrameSprite(
            "sprout_forest_decor_sheet",
            flowerFrames[(col + row) % flowerFrames.length],
            col + 0.3,
            row + 0.1,
            7,
            0xffffff,
            0.88,
          );
        }
      }
    }

    // Flower clusters in specific clearings - organized groups
    [
      // Upper clearing cluster
      [9.5, 11.2],
      [10.2, 11.8],
      [11.0, 11.5],
      [10.5, 12.5],
      // Bridge clearing cluster
      [19.5, bridgeRow + 2.5],
      [20.5, bridgeRow + 2.8],
      [21.2, bridgeRow + 2.2],
      // Lower clearing cluster
      [28.5, 28.8],
      [29.5, 29.2],
      [30.2, 28.5],
      [29.8, 30.0],
    ].forEach(([x, y], index) => {
      addFrameSprite(
        "sprout_forest_decor_sheet",
        flowerFrames[index % flowerFrames.length],
        x,
        y,
        7,
        0xffffff,
        0.9,
      );
    });
  }

  private createArenaTilePanel(
    panelX: number,
    panelOffsetY: number,
    scale: number,
    biome: BiomeConfig,
    biomeIndex: number,
  ): void {
    const tileSize = 16 * scale;
    const cols = this.map.width;
    const rows = this.map.height;

    const style = {
      baseTint: 0x6f1b16,
      shadeTint: 0x4a0e0d,
      floorTint: 0xb66a32,
      sandTint: 0xd39a50,
      wallTint: 0x2b0a09,
      pathTint: 0xc88a36,
      chalkTint: 0xffe0a3,
      emberTint: 0xf87136,
    };

    const dirtFrames = [0, 3, 12, 13, 14, 23, 24, 33, 34, 44, 55, 66];
    const standFrames = [0, 1, 2, 11, 12, 13, 22, 23, 24, 33, 34, 35, 88, 89];
    const pathFrames = [0, 1, 4, 5, 10, 11, 12, 15];

    const addFrameSprite = (
      texture: string,
      frame: number,
      x: number,
      y: number,
      depth: number,
      tint = 0xffffff,
      alpha = 1,
    ) => {
      const tile = this.add.sprite(
        panelX + x * tileSize + tileSize / 2,
        panelOffsetY + y * tileSize + tileSize / 2,
        texture,
        frame,
      );
      tile.setOrigin(0.5);
      tile.setScale(scale);
      tile.setTint(tint);
      tile.setAlpha(alpha);
      tile.setDepth(depth);
      this.backgroundLayer.add(tile);
    };

    const addProp = (
      texture: string,
      x: number,
      y: number,
      depth: number,
      tint = 0xffffff,
      spriteScale = 1,
    ) => {
      if (this.textures.exists(texture)) {
        const sprite = this.add.sprite(
          panelX + x * tileSize,
          panelOffsetY + y * tileSize,
          texture,
        );
        sprite.setOrigin(0.5, 1);
        sprite.setScale(scale * spriteScale);
        sprite.setTint(tint);
        sprite.setDepth(depth);
        this.midgroundLayer.add(sprite);
      }
    };

    const inEllipse = (
      x: number,
      y: number,
      centerX: number,
      centerY: number,
      radiusX: number,
      radiusY: number,
    ) =>
      ((x - centerX) * (x - centerX)) / (radiusX * radiusX) +
        ((y - centerY) * (y - centerY)) / (radiusY * radiusY) <
      1;

    const toWorldX = (tileX: number) => panelX + tileX * tileSize;
    const toWorldY = (tileY: number) => panelOffsetY + tileY * tileSize;

    const ground = this.add.graphics();
    ground.fillStyle(style.baseTint, 1);
    ground.fillRect(panelX, panelOffsetY, cols * tileSize, rows * tileSize);
    ground.setDepth(1);
    this.backgroundLayer.add(ground);

    const arenaCenterX = 20.2;
    const arenaCenterY = 21.2;
    const isMainApproach = (col: number, row: number) => {
      const leftRamp = col < 11 && row >= 29 && row <= 33;
      const rightRamp = col > 28 && row >= 23 && row <= 27;
      const upperStair = col >= 17 && col <= 23 && row >= 6 && row <= 14;
      const lowerStair = col >= 17 && col <= 23 && row >= 29 && row <= 36;
      return leftRamp || rightRamp || upperStair || lowerStair;
    };

    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        const inArenaFloor = inEllipse(
          col,
          row,
          arenaCenterX,
          arenaCenterY,
          9.9,
          6.8,
        );
        const inInnerStand =
          inEllipse(col, row, arenaCenterX, arenaCenterY, 14.2, 10.0) &&
          !inArenaFloor;
        const inOuterStand =
          inEllipse(col, row, arenaCenterX, arenaCenterY, 18.2, 13.1) &&
          !inEllipse(col, row, arenaCenterX, arenaCenterY, 14.0, 9.9);
        const inEdgeWall =
          row < 3 || row > rows - 4 || col < 2 || col > cols - 3;
        const onApproach = isMainApproach(col, row);

        if (inArenaFloor || onApproach) {
          addFrameSprite(
            "sprout_paths_sheet",
            pathFrames[(col * 3 + row + biome.id) % pathFrames.length],
            col,
            row,
            3,
            inArenaFloor ? style.floorTint : style.pathTint,
            inArenaFloor ? 0.92 : 0.96,
          );
          continue;
        }

        if (inInnerStand || inOuterStand || inEdgeWall) {
          addFrameSprite(
            "sprout_hills_sheet",
            standFrames[(col + row * 2 + biomeIndex) % standFrames.length],
            col,
            row,
            inEdgeWall ? 5 : 4,
            inOuterStand || inEdgeWall ? style.wallTint : style.shadeTint,
            inOuterStand ? 0.9 : 0.95,
          );
          continue;
        }

        const tint =
          (col + row + biomeIndex) % 5 === 0
            ? 0x8f2b20
            : (col * 2 + row) % 7 === 0
              ? 0x5b1512
              : style.baseTint;
        addFrameSprite(
          "sprout_grass_sheet",
          dirtFrames[(col * 7 + row * 5 + biome.id) % dirtFrames.length],
          col,
          row,
          2,
          tint,
          0.84,
        );
      }
    }

    const arenaInk = this.add.graphics();
    arenaInk.fillStyle(0x000000, 0.2);
    arenaInk.fillEllipse(toWorldX(20.2) + 6, toWorldY(22.2) + 12, 700, 420);
    arenaInk.fillStyle(0x2b0a09, 0.34);
    arenaInk.fillEllipse(toWorldX(20.2), toWorldY(20.8), 680, 430);
    arenaInk.fillStyle(style.shadeTint, 0.5);
    arenaInk.fillEllipse(toWorldX(20.2), toWorldY(20.9), 540, 340);
    arenaInk.fillStyle(style.sandTint, 0.32);
    arenaInk.fillEllipse(toWorldX(20.2), toWorldY(21.2), 390, 230);
    arenaInk.lineStyle(7, 0xf2bb63, 0.44);
    arenaInk.strokeEllipse(toWorldX(20.2), toWorldY(21.2), 390, 230);
    arenaInk.lineStyle(3, style.chalkTint, 0.38);
    arenaInk.strokeEllipse(toWorldX(20.2), toWorldY(21.2), 245, 138);
    arenaInk.lineStyle(4, style.chalkTint, 0.35);
    arenaInk.lineBetween(toWorldX(10.4), toWorldY(21.2), toWorldX(30.0), toWorldY(21.2));
    arenaInk.lineBetween(toWorldX(20.2), toWorldY(14.1), toWorldX(20.2), toWorldY(28.2));

    for (let i = 0; i < 18; i += 1) {
      const angle = (Math.PI * 2 * i) / 18;
      const innerX = toWorldX(20.2) + Math.cos(angle) * 212;
      const innerY = toWorldY(20.9) + Math.sin(angle) * 126;
      const outerX = toWorldX(20.2) + Math.cos(angle) * 318;
      const outerY = toWorldY(20.9) + Math.sin(angle) * 202;
      arenaInk.lineStyle(2, 0xf8c56e, i % 3 === 0 ? 0.34 : 0.2);
      arenaInk.lineBetween(innerX, innerY, outerX, outerY);
    }

    const trialPoints = [
      [5.3, 31.1, 20.2, 21.2],
      [20.2, 21.2, 20.2, 7.4],
      [20.2, 21.2, 34.7, 25.2],
      [20.2, 21.2, 34.7, 13.4],
    ] as Array<[number, number, number, number]>;
    trialPoints.forEach(([x1, y1, x2, y2], index) => {
      const dashCount = 12;
      for (let dash = 0; dash < dashCount; dash += 2) {
        const start = dash / dashCount;
        const end = (dash + 1) / dashCount;
        arenaInk.lineStyle(5, index === 3 ? 0x60a5fa : style.chalkTint, 0.42);
        arenaInk.lineBetween(
          Phaser.Math.Linear(toWorldX(x1), toWorldX(x2), start),
          Phaser.Math.Linear(toWorldY(y1), toWorldY(y2), start),
          Phaser.Math.Linear(toWorldX(x1), toWorldX(x2), end),
          Phaser.Math.Linear(toWorldY(y1), toWorldY(y2), end),
        );
      }
    });

    arenaInk.setDepth(5.5);
    this.backgroundLayer.add(arenaInk);

    const structures = this.add.graphics();
    structures.fillStyle(0x35100d, 0.86);
    structures.fillRect(toWorldX(3.4), toWorldY(28.6), 144, 74);
    structures.fillRect(toWorldX(33.1), toWorldY(22.5), 118, 86);
    structures.fillRect(toWorldX(17.0), toWorldY(5.2), 206, 64);
    structures.fillStyle(0x8b2a1e, 0.86);
    structures.fillRect(toWorldX(4.0), toWorldY(29.2), 112, 48);
    structures.fillRect(toWorldX(33.6), toWorldY(23.0), 86, 56);
    structures.fillRect(toWorldX(17.7), toWorldY(5.8), 164, 38);
    structures.lineStyle(3, 0xf2bb63, 0.48);
    structures.strokeRect(toWorldX(4.0), toWorldY(29.2), 112, 48);
    structures.strokeRect(toWorldX(33.6), toWorldY(23.0), 86, 56);
    structures.strokeRect(toWorldX(17.7), toWorldY(5.8), 164, 38);
    structures.setDepth(6);
    this.backgroundLayer.add(structures);

    const addTorch = (x: number, y: number, delay: number) => {
      const flame = this.add.circle(toWorldX(x), toWorldY(y), 10, style.emberTint, 0.52);
      flame.setDepth(8);
      flame.setBlendMode(Phaser.BlendModes.ADD);
      this.midgroundLayer.add(flame);
      this.tweens.add({
        targets: flame,
        alpha: { from: 0.32, to: 0.74 },
        scale: { from: 0.84, to: 1.22 },
        duration: 900 + delay,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    };

    [
      [8.0, 29.1],
      [12.4, 16.1],
      [19.0, 11.5],
      [26.4, 14.4],
      [32.0, 24.0],
      [29.8, 31.1],
    ].forEach(([x, y], index) => addTorch(x, y, index * 80));

    addProp("Banner_Stick_1_Purple", 7.5, 28.8, 9, 0xffffff, 1.45);
    addProp("Banner_Stick_1_Purple", 32.4, 22.3, 9, 0xffffff, 1.45);
    addProp("Fireplace_1", arenaCenterX, arenaCenterY + 1.3, 8, 0xffffff, 1.35);
    addProp("BulletinBoard_1", 18.8, 7.6, 9, 0xffe1a1, 1.05);
    addProp("Sign_2", 35.2, 25.8, 9, 0xffe1a1, 0.95);

    [
      [7.2, 34.0, "Rock_Brown_4", 1.2],
      [10.0, 33.2, "Rock_Brown_6", 1.05],
      [30.4, 27.8, "Rock_Brown_4", 1.0],
      [35.8, 28.5, "Rock_Brown_6", 1.06],
      [16.0, 10.2, "Rock_Brown_9", 1.12],
      [25.3, 10.6, "Rock_Brown_9", 1.08],
    ].forEach(([x, y, key, propScale]) =>
      addProp(key as string, x as number, y as number, 8, 0x9a3412, propScale as number),
    );
  }

  private createArtisanTilePanel(
    panelX: number,
    panelOffsetY: number,
    scale: number,
    biome: BiomeConfig,
    biomeIndex: number,
  ): void {
    const tileSize = 16 * scale;
    const cols = this.map.width;
    const rows = this.map.height;

    const style = {
      baseTint: 0x2b2f63,
      shadeTint: 0x1e1b4b,
      plazaTint: 0x505882,
      pathTint: 0x9ca3af,
      pathShadeTint: 0x6b7280,
      roofTint: 0x8b7bd7,
      glowTint: 0x9ddcff,
      warmLightTint: 0xffd166,
    };

    const stoneFrames = [0, 3, 12, 13, 14, 23, 24, 33, 34, 44, 55, 66];
    const pathFrames = [0, 1, 4, 5, 10, 11, 12, 15];
    const fenceFrames = [0, 1, 2, 4, 5, 6, 8, 9, 10];

    const addFrameSprite = (
      texture: string,
      frame: number,
      x: number,
      y: number,
      depth: number,
      tint = 0xffffff,
      alpha = 1,
    ) => {
      const tile = this.add.sprite(
        panelX + x * tileSize + tileSize / 2,
        panelOffsetY + y * tileSize + tileSize / 2,
        texture,
        frame,
      );
      tile.setOrigin(0.5);
      tile.setScale(scale);
      tile.setTint(tint);
      tile.setAlpha(alpha);
      tile.setDepth(depth);
      this.backgroundLayer.add(tile);
    };

    const addProp = (
      texture: string,
      x: number,
      y: number,
      depth: number,
      tint = 0xffffff,
      spriteScale = 1,
    ) => {
      if (this.textures.exists(texture)) {
        const sprite = this.add.sprite(
          panelX + x * tileSize,
          panelOffsetY + y * tileSize,
          texture,
        );
        sprite.setOrigin(0.5, 1);
        sprite.setScale(scale * spriteScale);
        sprite.setTint(tint);
        sprite.setDepth(depth);
        this.midgroundLayer.add(sprite);
      }
    };

    const toWorldX = (tileX: number) => panelX + tileX * tileSize;
    const toWorldY = (tileY: number) => panelOffsetY + tileY * tileSize;

    const drawWorkshopPath = (
      points: Array<[number, number]>,
      width: number,
      color: number,
      alpha = 0.86,
    ) => {
      const shadow = this.add.graphics();
      shadow.lineStyle(width + 18, 0x000000, 0.16);
      shadow.beginPath();
      shadow.moveTo(toWorldX(points[0][0]) + 4, toWorldY(points[0][1]) + 8);
      points.slice(1).forEach(([x, y]) =>
        shadow.lineTo(toWorldX(x) + 4, toWorldY(y) + 8),
      );
      shadow.strokePath();
      shadow.setDepth(3.2);
      this.backgroundLayer.add(shadow);

      const path = this.add.graphics();
      path.lineStyle(width, color, alpha);
      path.beginPath();
      path.moveTo(toWorldX(points[0][0]), toWorldY(points[0][1]));
      points.slice(1).forEach(([x, y]) => path.lineTo(toWorldX(x), toWorldY(y)));
      path.strokePath();
      path.lineStyle(Math.max(3, width * 0.16), 0xffffff, 0.2);
      path.beginPath();
      path.moveTo(toWorldX(points[0][0]), toWorldY(points[0][1]) - 4);
      points.slice(1).forEach(([x, y]) =>
        path.lineTo(toWorldX(x), toWorldY(y) - 4),
      );
      path.strokePath();
      path.setDepth(3.8);
      this.backgroundLayer.add(path);

      const samples = this.samplePolyline(
        points.map(([x, y]) => ({ x: toWorldX(x), y: toWorldY(y) })),
        42,
      );
      samples.forEach((sample, index) => {
        const seam = this.add.rectangle(
          sample.x,
          sample.y,
          width * 0.48,
          3,
          0xffffff,
          index % 2 === 0 ? 0.18 : 0.1,
        );
        seam.setRotation(sample.angle + Math.PI / 2);
        seam.setDepth(4.1);
        this.backgroundLayer.add(seam);
      });
    };

    const ground = this.add.graphics();
    ground.fillStyle(style.baseTint, 1);
    ground.fillRect(panelX, panelOffsetY, cols * tileSize, rows * tileSize);
    ground.setDepth(1);
    this.backgroundLayer.add(ground);

    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        const isBlockEdge =
          row % 10 === 0 || col % 10 === 0 || row % 10 === 1 || col % 10 === 1;
        const isPlaza =
          (col >= 17 && col <= 27 && row >= 13 && row <= 23) ||
          (col >= 4 && col <= 12 && row >= 27 && row <= 34) ||
          (col >= 29 && col <= 37 && row >= 26 && row <= 35);

        if (isBlockEdge) {
          addFrameSprite(
            "sprout_paths_sheet",
            pathFrames[(col + row) % pathFrames.length],
            col,
            row,
            3,
            style.pathShadeTint,
            0.84,
          );
          continue;
        }

        if (isPlaza) {
          addFrameSprite(
            "sprout_paths_sheet",
            pathFrames[(col * 3 + row + biome.id) % pathFrames.length],
            col,
            row,
            3,
            style.plazaTint,
            0.9,
          );
          continue;
        }

        addFrameSprite(
          "sprout_grass_sheet",
          stoneFrames[(col * 7 + row * 5 + biome.id) % stoneFrames.length],
          col,
          row,
          2,
          (col + row + biomeIndex) % 4 === 0 ? 0x353a70 : style.shadeTint,
          0.78,
        );

        if ((col + row * 2 + biomeIndex) % 13 === 0) {
          addFrameSprite(
            "sprout_fences_sheet",
            fenceFrames[(col + row + biome.id) % fenceFrames.length],
            col,
            row,
            5,
            0x6f66a9,
            0.44,
          );
        }
      }
    }

    drawWorkshopPath(
      [
        [4.5, 30.5],
        [10.6, 25.4],
        [17.0, 21.0],
        [24.6, 17.0],
        [31.8, 21.2],
        [36.8, 29.0],
      ],
      46,
      style.pathTint,
      0.82,
    );
    drawWorkshopPath(
      [
        [12.0, 33.0],
        [18.0, 27.2],
        [22.2, 20.5],
        [22.0, 11.0],
      ],
      28,
      0xb8c1d7,
      0.58,
    );
    drawWorkshopPath(
      [
        [8.0, 14.0],
        [16.0, 17.0],
        [22.0, 20.5],
        [32.0, 16.0],
      ],
      24,
      0x8994bf,
      0.48,
    );

    const districts = this.add.graphics();
    const drawPad = (
      x: number,
      y: number,
      width: number,
      height: number,
      fill: number,
      stroke: number,
      alpha = 0.72,
    ) => {
      districts.fillStyle(fill, alpha);
      districts.fillRect(toWorldX(x), toWorldY(y), width * tileSize, height * tileSize);
      districts.lineStyle(3, stroke, 0.46);
      districts.strokeRect(toWorldX(x), toWorldY(y), width * tileSize, height * tileSize);
    };

    drawPad(6.0, 8.0, 8.6, 5.2, 0x46407a, style.glowTint);
    drawPad(26.0, 7.0, 8.0, 5.6, 0x3b376f, style.warmLightTint);
    drawPad(6.0, 27.5, 8.6, 5.6, 0x504777, 0xf2b560);
    drawPad(27.8, 27.2, 8.7, 6.0, 0x504777, style.glowTint);
    districts.setDepth(5);
    this.backgroundLayer.add(districts);

    const blueprint = this.add.graphics();
    [
      [7.0, 8.9, 3.2, 2.3],
      [27.0, 8.0, 3.4, 2.5],
      [29.2, 28.2, 3.6, 2.5],
    ].forEach(([x, y, w, h], index) => {
      blueprint.fillStyle(0x0f2358, 0.82);
      blueprint.fillRect(toWorldX(x), toWorldY(y), w * tileSize, h * tileSize);
      blueprint.lineStyle(2, style.glowTint, 0.58);
      blueprint.strokeRect(toWorldX(x), toWorldY(y), w * tileSize, h * tileSize);
      blueprint.lineBetween(toWorldX(x + 0.4), toWorldY(y + 0.7), toWorldX(x + w - 0.4), toWorldY(y + 0.7));
      blueprint.lineBetween(toWorldX(x + 0.6), toWorldY(y + 1.4), toWorldX(x + w - 0.8), toWorldY(y + h - 0.5));
      blueprint.strokeCircle(toWorldX(x + w - 0.8), toWorldY(y + h - 0.8), 9 + index * 2);
    });

    [
      [8.0, 29.0],
      [8.9, 29.0],
      [9.8, 29.0],
      [10.7, 29.0],
      [11.6, 29.0],
    ].forEach(([x, y], index) => {
      const colors = [0xf87171, 0xfbbf24, 0x34d399, 0x60a5fa, 0xc084fc];
      blueprint.fillStyle(colors[index], 0.95);
      blueprint.fillRect(toWorldX(x), toWorldY(y), 18, 18);
      blueprint.lineStyle(1, 0xffffff, 0.35);
      blueprint.strokeRect(toWorldX(x), toWorldY(y), 18, 18);
    });
    blueprint.setDepth(7);
    this.backgroundLayer.add(blueprint);

    const workshopGlow = this.add.graphics();
    workshopGlow.fillStyle(style.glowTint, 0.08);
    workshopGlow.fillEllipse(toWorldX(22.0), toWorldY(19.2), 380, 220);
    workshopGlow.fillStyle(style.warmLightTint, 0.08);
    workshopGlow.fillEllipse(toWorldX(10.0), toWorldY(30.0), 250, 150);
    workshopGlow.setDepth(6.4);
    workshopGlow.setBlendMode(Phaser.BlendModes.ADD);
    this.backgroundLayer.add(workshopGlow);

    addProp("House_Hay_4_Purple", 11.0, 11.4, 8, style.roofTint, 0.82);
    addProp("House_Hay_2", 30.4, 11.4, 8, 0xa9a1e8, 0.78);
    addProp("House_Hay_3", 11.0, 34.2, 8, 0xa9a1e8, 0.78);
    addProp("House_Hay_1", 32.8, 34.0, 8, 0xb9b0f0, 0.74);
    addProp("Well_Hay_1", 21.8, 20.6, 8, 0xffffff, 0.78);
    addProp("Table_Medium_1", 19.4, 25.8, 9, 0xffffff, 1.28);
    addProp("Table_Medium_1", 25.1, 16.1, 9, 0xffffff, 1.18);
    addProp("Bench_1", 23.5, 24.6, 9, 0xffffff, 1.05);
    addProp("BulletinBoard_1", 28.7, 29.7, 9, 0xe0d7ff, 1.05);
    addProp("Crate_Medium_Closed", 15.6, 24.2, 9, 0xffffff, 0.9);
    addProp("Crate_Large_Empty", 30.8, 27.6, 9, 0xffffff, 0.7);

    [
      [8.2, 25.2],
      [16.7, 20.0],
      [22.2, 12.9],
      [29.2, 20.1],
      [35.4, 27.9],
    ].forEach(([x, y], index) => {
      addProp("LampPost_3", x, y, 10, 0xffffff, 0.86);
      const glow = this.add.circle(toWorldX(x), toWorldY(y) - 54, 24, style.warmLightTint, 0.14);
      glow.setDepth(9);
      glow.setBlendMode(Phaser.BlendModes.ADD);
      this.midgroundLayer.add(glow);
      this.tweens.add({
        targets: glow,
        alpha: { from: 0.08, to: 0.24 },
        scale: { from: 0.9, to: 1.16 },
        duration: 1500 + index * 120,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    });
  }

  private createMineTilePanel(
    panelX: number,
    panelOffsetY: number,
    scale: number,
    biome: BiomeConfig,
    biomeIndex: number,
  ): void {
    const tileSize = 16 * scale;
    const cols = this.map.width;
    const rows = this.map.height;

    const style = {
      baseTint: 0x18181b,
      shadeTint: 0x09090b,
      pathTint: 0x27272a,
      hillTint: 0x3f3f46,
    };
    const ground = this.add.graphics();
    ground.fillStyle(style.baseTint, 0.98);
    ground.fillRect(panelX, panelOffsetY, cols * tileSize, rows * tileSize);
    ground.setDepth(1);
    this.backgroundLayer.add(ground);

    const rockFrames = [0, 1, 2, 11, 12, 13, 22, 23, 24];
    const pathFrames = [0, 1, 4, 5, 10, 11, 12, 15];

    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        const isPath = (row > 15 && row < 19) || (col > 15 && col < 19);
        const isWall = col < 4 || col > cols - 5 || row < 4 || row > rows - 5;

        if (isPath) {
          const tile = this.add.sprite(
            panelX + col * tileSize + tileSize / 2,
            panelOffsetY + row * tileSize + tileSize / 2,
            "sprout_paths_sheet",
            pathFrames[(col + row) % pathFrames.length],
          );
          tile.setOrigin(0.5);
          tile.setScale(scale);
          tile.setTint(style.pathTint);
          tile.setDepth(3);
          this.backgroundLayer.add(tile);
        } else if (isWall) {
          const tile = this.add.sprite(
            panelX + col * tileSize + tileSize / 2,
            panelOffsetY + row * tileSize + tileSize / 2,
            "sprout_hills_sheet",
            rockFrames[(col + row) % rockFrames.length],
          );
          tile.setOrigin(0.5);
          tile.setScale(scale);
          tile.setTint(style.hillTint);
          tile.setDepth(4);
          this.backgroundLayer.add(tile);
        } else {
          const tile = this.add.sprite(
            panelX + col * tileSize + tileSize / 2,
            panelOffsetY + row * tileSize + tileSize / 2,
            "sprout_grass_sheet",
            0,
          );
          tile.setOrigin(0.5);
          tile.setScale(scale);
          tile.setTint(style.shadeTint);
          tile.setDepth(2);
          this.backgroundLayer.add(tile);
        }
      }
    }
  }

  private createHarbourTilePanel(
    panelX: number,
    panelOffsetY: number,
    scale: number,
    biome: BiomeConfig,
    biomeIndex: number,
  ): void {
    const tileSize = 16 * scale;
    const cols = this.map.width;
    const rows = this.map.height;

    const style = {
      baseTint: 0x0284c7,
      shadeTint: 0x0369a1,
      dockTint: 0x78350f,
      landTint: 0xfde047,
    };
    const ground = this.add.graphics();
    ground.fillStyle(style.baseTint, 0.98);
    ground.fillRect(panelX, panelOffsetY, cols * tileSize, rows * tileSize);
    ground.setDepth(1);
    this.backgroundLayer.add(ground);

    const waterFrames = [0, 1, 2, 3];
    const pathFrames = [0, 1, 4, 5];

    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        const isLand = row < 12;
        const isDock = col > 15 && col < 20 && row >= 12 && row < 25;

        if (isLand) {
          const tile = this.add.sprite(
            panelX + col * tileSize + tileSize / 2,
            panelOffsetY + row * tileSize + tileSize / 2,
            "sprout_grass_sheet",
            0,
          );
          tile.setOrigin(0.5);
          tile.setScale(scale);
          tile.setTint(style.landTint);
          tile.setDepth(2);
          this.backgroundLayer.add(tile);
        } else if (isDock) {
          const tile = this.add.sprite(
            panelX + col * tileSize + tileSize / 2,
            panelOffsetY + row * tileSize + tileSize / 2,
            "sprout_paths_sheet",
            pathFrames[(col + row) % pathFrames.length],
          );
          tile.setOrigin(0.5);
          tile.setScale(scale);
          tile.setTint(style.dockTint);
          tile.setDepth(4);
          this.backgroundLayer.add(tile);
        } else {
          const tile = this.add.sprite(
            panelX + col * tileSize + tileSize / 2,
            panelOffsetY + row * tileSize + tileSize / 2,
            "sprout_water_sheet",
            waterFrames[(col + row) % waterFrames.length],
          );
          tile.setOrigin(0.5);
          tile.setScale(scale);
          tile.setDepth(3);
          this.backgroundLayer.add(tile);
        }
      }
    }
  }

  private createCrossroadsTilePanel(
    panelX: number,
    panelOffsetY: number,
    scale: number,
    biome: BiomeConfig,
    biomeIndex: number,
  ): void {
    const tileSize = 16 * scale;
    const cols = this.map.width;
    const rows = this.map.height;

    const style = {
      baseTint: 0x047857,
      shadeTint: 0x065f46,
      pathTint: 0xd97706,
    };
    const ground = this.add.graphics();
    ground.fillStyle(style.baseTint, 0.98);
    ground.fillRect(panelX, panelOffsetY, cols * tileSize, rows * tileSize);
    ground.setDepth(1);
    this.backgroundLayer.add(ground);

    const pathFrames = [0, 1, 4, 5, 10, 11, 12, 15];

    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        const isPath =
          Math.abs(col - row) < 3 || Math.abs(col - (cols - row)) < 3;

        if (isPath) {
          const tile = this.add.sprite(
            panelX + col * tileSize + tileSize / 2,
            panelOffsetY + row * tileSize + tileSize / 2,
            "sprout_paths_sheet",
            pathFrames[(col + row) % pathFrames.length],
          );
          tile.setOrigin(0.5);
          tile.setScale(scale);
          tile.setTint(style.pathTint);
          tile.setDepth(3);
          this.backgroundLayer.add(tile);
        } else {
          const tile = this.add.sprite(
            panelX + col * tileSize + tileSize / 2,
            panelOffsetY + row * tileSize + tileSize / 2,
            "sprout_grass_sheet",
            0,
          );
          tile.setOrigin(0.5);
          tile.setScale(scale);
          tile.setTint(style.shadeTint);
          tile.setDepth(2);
          this.backgroundLayer.add(tile);
        }
      }
    }
  }

  private createCapitalTilePanel(
    panelX: number,
    panelOffsetY: number,
    scale: number,
    biome: BiomeConfig,
    biomeIndex: number,
  ): void {
    const tileSize = 16 * scale;
    const cols = this.map.width;
    const rows = this.map.height;

    const style = {
      baseTint: 0xfef08a,
      shadeTint: 0xfde047,
      pathTint: 0xffffff,
      wallTint: 0xeab308,
    };
    const ground = this.add.graphics();
    ground.fillStyle(style.baseTint, 0.98);
    ground.fillRect(panelX, panelOffsetY, cols * tileSize, rows * tileSize);
    ground.setDepth(1);
    this.backgroundLayer.add(ground);

    const pathFrames = [0, 1, 4, 5, 10, 11, 12, 15];
    const hillFrames = [0, 1, 2, 11, 12, 13, 22, 23, 24];

    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        const isPath = row > 16 && row < 22;
        const isWall = row === 12 || row === 26;

        if (isPath) {
          const tile = this.add.sprite(
            panelX + col * tileSize + tileSize / 2,
            panelOffsetY + row * tileSize + tileSize / 2,
            "sprout_paths_sheet",
            pathFrames[(col + row) % pathFrames.length],
          );
          tile.setOrigin(0.5);
          tile.setScale(scale);
          tile.setTint(style.pathTint);
          tile.setDepth(3);
          this.backgroundLayer.add(tile);
        } else if (isWall) {
          const tile = this.add.sprite(
            panelX + col * tileSize + tileSize / 2,
            panelOffsetY + row * tileSize + tileSize / 2,
            "sprout_hills_sheet",
            hillFrames[(col + row) % hillFrames.length],
          );
          tile.setOrigin(0.5);
          tile.setScale(scale);
          tile.setTint(style.wallTint);
          tile.setDepth(4);
          this.backgroundLayer.add(tile);
        } else {
          const tile = this.add.sprite(
            panelX + col * tileSize + tileSize / 2,
            panelOffsetY + row * tileSize + tileSize / 2,
            "sprout_grass_sheet",
            0,
          );
          tile.setOrigin(0.5);
          tile.setScale(scale);
          tile.setTint(style.shadeTint);
          tile.setDepth(2);
          this.backgroundLayer.add(tile);
        }
      }
    }
  }

  private renderMapObjects(
    objects: Phaser.Types.Tilemaps.TiledObject[],
    panelX: number,
    panelOffsetY: number,
    scale: number,
  ): void {
    objects.forEach((obj) => {
      if (!obj.visible || typeof obj.gid !== "number") return;

      const assetKey = this.resolveObjectAssetKey(obj.gid);
      if (!assetKey || !this.textures.exists(assetKey)) return;

      const textureSource = this.textures.get(assetKey).getSourceImage() as {
        width?: number;
        height?: number;
      };
      const textureWidth = textureSource.width ?? obj.width ?? 1;
      const textureHeight = textureSource.height ?? obj.height ?? 1;
      const objectX = obj.x ?? 0;
      const objectY = obj.y ?? 0;

      const image = this.add.image(
        panelX + objectX * scale,
        panelOffsetY + objectY * scale,
        assetKey,
      );
      image.setOrigin(0, 1);
      image.setScale(
        ((obj.width ?? textureWidth) / textureWidth) * scale,
        ((obj.height ?? textureHeight) / textureHeight) * scale,
      );
      image.setAlpha(assetKey.startsWith("Shadow_") ? 0.32 : 1);
      image.setDepth(assetKey.startsWith("Shadow_") ? 5 : 6 + objectY * 0.01);
      this.midgroundLayer.add(image);
    });
  }

  private resolveObjectAssetKey(gid: number): string | null {
    const collections = [
      {
        firstGid: 477,
        keys: [
          "House_Hay_1",
          "House_Hay_2",
          "House_Hay_3",
          "House_Hay_4_Purple",
          "CityWall_Gate_1",
          "Well_Hay_1",
        ],
      },
      {
        firstGid: 484,
        keys: [
          "Bench_1",
          "Bench_3",
          "BulletinBoard_1",
          "Chopped_Tree_1",
          "Crate_Large_Empty",
          "Crate_Medium_Closed",
          "LampPost_3",
          "Plant_2",
          "Sack_3",
          "Sign_1",
          "Sign_2",
          "Banner_Stick_1_Purple",
          "Crate_Water_1",
          "Fireplace_1",
          "HayStack_2",
          "Barrel_Small_Empty",
          "Basket_Empty",
          "Table_Medium_1",
        ],
      },
      {
        firstGid: 502,
        keys: [
          "Rock_Brown_1",
          "Rock_Brown_2",
          "Rock_Brown_4",
          "Rock_Brown_6",
          "Rock_Brown_9",
        ],
      },
      {
        firstGid: 507,
        keys: [
          "Bush_Emerald_1",
          "Bush_Emerald_2",
          "Bush_Emerald_3",
          "Bush_Emerald_4",
          "Bush_Emerald_5",
          "Bush_Emerald_6",
          "Bush_Emerald_7",
          "Tree_Emerald_1",
          "Tree_Emerald_2",
          "Tree_Emerald_3",
          "Tree_Emerald_4",
        ],
      },
    ];

    for (const collection of collections) {
      const index = gid - collection.firstGid;
      if (index >= 0 && index < collection.keys.length) {
        return collection.keys[index];
      }
    }

    return null;
  }

  private createBiomeZones(): void {
    BIOME_CONFIGS.forEach((biome, index) => {
      const container = this.add.container(index * this.BIOME_WIDTH, 0);
      this.biomeContainers.set(biome.id, container);
      this.backgroundLayer.add(container);

      // Draw biome background
      this.drawBiomeBackground(container, biome);

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
    const sky = this.add.graphics();
    sky.fillStyle(biome.colors.sky, 0.78);
    sky.fillRect(0, 0, this.BIOME_WIDTH, this.MAP_HEIGHT);
    sky.fillStyle(biome.colors.ground, 0.24);
    sky.fillEllipse(
      this.BIOME_WIDTH / 2,
      this.MAP_HEIGHT * 0.84,
      this.BIOME_WIDTH * 1.1,
      this.MAP_HEIGHT * 0.7,
    );
    container.add(sky);

    const glow = this.add.graphics();
    glow.fillStyle(biome.colors.accent2, 0.1);
    glow.fillCircle(this.BIOME_WIDTH * 0.22, 170, 150);
    glow.fillCircle(this.BIOME_WIDTH * 0.78, 235, 120);
    container.add(glow);
  }

  private addBiomeDecorations(
    container: Phaser.GameObjects.Container,
    biome: BiomeConfig,
  ): void {
    const addShadowedImage = (
      key: string,
      x: number,
      y: number,
      scale: number,
      alpha = 1,
    ) => {
      const shadow = this.add.image(
        x + 6,
        y + 16,
        "Shadow_Round_48x24_Flat_Black",
      );
      shadow.setOrigin(0.5, 0.5);
      shadow.setScale(scale * 0.9);
      shadow.setAlpha(0.2);
      container.add(shadow);

      const image = this.add.image(x, y, key);
      image.setOrigin(0.5, 1);
      image.setScale(scale);
      image.setAlpha(alpha);
      container.add(image);
    };

    const treeKeys = [
      "Tree_Emerald_1",
      "Tree_Emerald_2",
      "Tree_Emerald_3",
      "Tree_Emerald_4",
    ];

    [
      [160, 760, 1.4],
      [320, 700, 1.08],
      [1080, 725, 1.28],
      [1230, 675, 1.04],
    ].forEach(([x, y, scale], index) => {
      addShadowedImage(
        treeKeys[(biome.id + index) % treeKeys.length],
        x,
        y,
        scale,
        biome.visualTheme === "forest" ? 1 : 0.88,
      );
    });

    [
      ["Bush_Emerald_1", 240, 875, 0.8],
      ["Bush_Emerald_3", 540, 850, 0.85],
      ["Bush_Emerald_5", 840, 872, 0.8],
      ["Bush_Emerald_7", 1120, 856, 0.9],
    ].forEach(([key, x, y, scale]) => {
      addShadowedImage(
        key as string,
        x as number,
        y as number,
        scale as number,
      );
    });

    if (biome.visualTheme === "village") {
      addShadowedImage("House_Hay_1", 500, 648, 1.45);
      addShadowedImage("House_Hay_3", 760, 620, 1.42);
      addShadowedImage("Well_Hay_1", 920, 680, 1.08);
      addShadowedImage("LampPost_3", 665, 708, 1.08);
      addShadowedImage("BulletinBoard_1", 610, 742, 1);
      addShadowedImage("HayStack_2", 855, 770, 1);
    } else {
      addShadowedImage("Rock_Brown_1", 515, 808, 1.08);
      addShadowedImage("Rock_Brown_4", 690, 770, 1.03);
      addShadowedImage("Rock_Brown_9", 875, 810, 1.04);
      addShadowedImage("Animation_Campfire", 755, 748, 0.9);
      addShadowedImage("Sign_2", 955, 742, 1);

      const mist = this.add.graphics();
      mist.fillStyle(0xffffff, 0.06);
      mist.fillEllipse(this.BIOME_WIDTH / 2, 830, 760, 180);
      mist.fillEllipse(this.BIOME_WIDTH / 2 + 180, 780, 480, 130);
      container.add(mist);
    }
  }
  private addBiomeLabel(
    container: Phaser.GameObjects.Container,
    biome: BiomeConfig,
  ): void {
    const label = this.add.text(this.BIOME_WIDTH / 2, 64, biome.name, {
      fontFamily: "Georgia, serif",
      fontSize: "26px",
      fontStyle: "bold",
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 4,
    });
    label.setOrigin(0.5);
    container.add(label);

    const themeLabel = this.add.text(
      this.BIOME_WIDTH / 2,
      98,
      `(${biome.theme})`,
      {
        fontFamily: "Georgia, serif",
        fontSize: "16px",
        fontStyle: "italic",
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 2,
      },
    );
    themeLabel.setOrigin(0.5);
    container.add(themeLabel);
  }

  private createBiomeLandmarks(): void {
    this.createVillageLandmarks(1); // Stage 1: The Village ✅
    this.createForestLandmarks(2); // Stage 2: The Forest ✅
    this.createArenaLandmarks(3); // Stage 3: The Arena
    this.createArtisanLandmarks(4); // Stage 4: The Artisan's Quarter
    this.createMineLandmarks(5); // Stage 5: The Mine
    this.createHarbourLandmarks(6); // Stage 6: The Harbour
    this.createCrossroadsLandmarks(7); // Stage 7: The Crossroads Town
    this.createCapitalLandmarks(8); // Stage 8: The Capital
  }

  private getStageNodes(stageId: number): CheckpointNode[] {
    return Array.from(this.checkpointNodes.values())
      .filter((node) => node.stage === stageId)
      .sort((a, b) => a.globalIndex - b.globalIndex);
  }

  private addLandmarkSprite(
    key: string,
    x: number,
    y: number,
    scale: number,
    alpha = 1,
  ): void {
    const shadow = this.add.image(
      x + 8,
      y + 14,
      "Shadow_Round_48x24_Flat_Black",
    );
    shadow.setOrigin(0.5, 0.5);
    shadow.setScale(scale * 0.92);
    shadow.setAlpha(0.22);
    shadow.setDepth(18);
    this.midgroundLayer.add(shadow);

    const sprite = this.add.image(x, y, key);
    sprite.setOrigin(0.5, 1);
    sprite.setScale(scale);
    sprite.setAlpha(alpha);
    sprite.setDepth(19 + y * 0.001);
    this.midgroundLayer.add(sprite);
  }

  private addForestLandmarkSprite(
    frame: number,
    x: number,
    y: number,
    scale: number,
    alpha = 1,
    depth = 15,
  ): void {
    const shadow = this.add.image(
      x + 6,
      y + 10,
      "Shadow_Round_48x24_Flat_Black",
    );
    shadow.setOrigin(0.5, 0.5);
    shadow.setScale(scale * 0.7);
    shadow.setAlpha(0.16);
    shadow.setDepth(depth - 1);
    this.midgroundLayer.add(shadow);

    const sprite = this.add.sprite(x, y, "sprout_forest_decor_sheet", frame);
    sprite.setOrigin(0.5, 1);
    sprite.setScale(scale);
    sprite.setAlpha(alpha);
    sprite.setDepth(depth);
    this.midgroundLayer.add(sprite);
  }

  private createVillageLandmarks(stageId: number): void {
    const nodes = this.getStageNodes(stageId);
    if (nodes.length === 0) return;

    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    const centerX = (first.x + last.x) / 2;
    const centerY = (first.y + last.y) / 2;

    this.addLandmarkSprite("House_Hay_1", centerX - 150, centerY + 150, 1.55);
    this.addLandmarkSprite("House_Hay_3", centerX + 110, centerY + 115, 1.45);
    this.addLandmarkSprite("Well_Hay_1", centerX + 250, centerY + 155, 1.05);
    this.addLandmarkSprite("BulletinBoard_1", centerX - 20, centerY + 185, 1);
    this.addLandmarkSprite("LampPost_3", centerX + 25, centerY + 165, 1.05);
    this.addLandmarkSprite("HayStack_2", centerX + 175, centerY + 205, 1);

    nodes.forEach((node, index) => {
      const bushKey = `Bush_Emerald_${(index % 4) * 2 + 1}`;
      this.addLandmarkSprite(bushKey, node.x - 70, node.y + 135, 0.82, 0.95);
      this.addLandmarkSprite(bushKey, node.x + 76, node.y + 128, 0.76, 0.9);
    });
  }

  private createVillageWoodenTrackNetwork(
    nodes: { x: number; y: number }[],
  ): void {
    if (nodes.length < 2) return;

    const plankPalette = [0x8a5a2b, 0x9f6f37, 0x72451f, 0xb47a3b];
    const routePoints = this.buildVillageRoutePoints(nodes);

    this.drawVillageTrack(routePoints, {
      plankWidth: 34,
      plankHeight: 9,
      spacing: 20,
      tint: plankPalette,
      rope: true,
      elevatedFromIndex: 999,
    });

    const hub = this.getPointOnPolyline(routePoints, 0.43);
    this.drawWoodenHub(hub.x, hub.y, 58, 0x8b5a2b, "hub");

    nodes.forEach((node, index) => {
      const platformTint = [0xa36932, 0x8a5629, 0x9b6731, 0x70461f][index % 4];
      this.drawWoodenHub(
        node.x,
        node.y,
        66 + index * 4,
        platformTint,
        `lv${index + 1}`,
      );
    });

    const minorRoutes = [
      [
        { x: nodes[0].x - 112, y: nodes[0].y + 74 },
        { x: nodes[0].x - 38, y: nodes[0].y + 52 },
        { x: nodes[0].x + 22, y: nodes[0].y + 88 },
      ],
      [
        { x: hub.x - 12, y: hub.y + 10 },
        { x: hub.x + 92, y: hub.y + 74 },
        { x: hub.x + 180, y: hub.y + 62 },
      ],
      [
        { x: nodes[3].x - 22, y: nodes[3].y + 34 },
        { x: nodes[3].x + 88, y: nodes[3].y + 88 },
        { x: nodes[3].x + 158, y: nodes[3].y + 76 },
      ],
    ];
    minorRoutes.forEach((points) => {
      this.drawVillageTrack(points, {
        plankWidth: 26,
        plankHeight: 7,
        spacing: 28,
        tint: [0x76502a, 0x8b6237, 0x5f3d20],
        rope: false,
      });
    });

    this.addVillageTrackStoryProps(nodes, hub);
  }

  private buildVillageRoutePoints(nodes: { x: number; y: number }[]): {
    x: number;
    y: number;
  }[] {
    return [
      { x: nodes[0].x - 36, y: nodes[0].y + 32 },
      { x: nodes[0].x + 48, y: nodes[0].y + 54 },
      { x: nodes[1].x - 96, y: nodes[1].y + 64 },
      { x: nodes[1].x - 22, y: nodes[1].y + 50 },
      { x: nodes[1].x + 88, y: nodes[1].y + 18 },
      { x: nodes[2].x - 122, y: nodes[2].y - 20 },
      { x: nodes[2].x - 22, y: nodes[2].y - 8 },
      { x: nodes[2].x + 86, y: nodes[2].y + 24 },
      { x: nodes[3].x - 120, y: nodes[3].y + 64 },
      { x: nodes[3].x - 10, y: nodes[3].y + 38 },
    ];
  }

  private drawVillageTrack(
    points: { x: number; y: number }[],
    options: {
      plankWidth: number;
      plankHeight: number;
      spacing: number;
      tint: number[];
      rope: boolean;
      elevatedFromIndex?: number;
    },
  ): void {
    const sampled = this.samplePolyline(points, options.spacing);
    if (sampled.length === 0) return;

    const shadow = this.add.graphics();
    shadow.lineStyle(options.plankHeight + 16, 0x000000, 0.08);
    shadow.beginPath();
    shadow.moveTo(points[0].x + 4, points[0].y + 7);
    points.slice(1).forEach((point) => shadow.lineTo(point.x + 4, point.y + 7));
    shadow.strokePath();
    shadow.setDepth(3.2);
    this.midgroundLayer.add(shadow);

    const groundBlend = this.add.graphics();
    groundBlend.lineStyle(options.plankWidth + 10, 0x8b6b3d, 0.16);
    groundBlend.beginPath();
    groundBlend.moveTo(points[0].x, points[0].y);
    points.slice(1).forEach((point) => groundBlend.lineTo(point.x, point.y));
    groundBlend.strokePath();
    groundBlend.lineStyle(options.plankWidth + 20, 0x5f8b45, 0.07);
    groundBlend.beginPath();
    groundBlend.moveTo(points[0].x, points[0].y);
    points.slice(1).forEach((point) => groundBlend.lineTo(point.x, point.y));
    groundBlend.strokePath();
    groundBlend.setDepth(3.1);
    this.midgroundLayer.add(groundBlend);

    const edge = this.add.graphics();
    const edgeOffset = options.plankWidth * 0.34;
    edge.lineStyle(4, 0x4c3219, 0.62);
    this.drawOffsetPolyline(edge, points, -edgeOffset);
    this.drawOffsetPolyline(edge, points, edgeOffset);
    edge.setDepth(3.4);
    this.midgroundLayer.add(edge);

    if (options.rope) {
      const rope = this.add.graphics();
      rope.lineStyle(2, 0xd6b16c, 0.7);
      this.drawOffsetPolyline(rope, points, -(edgeOffset + 8));
      this.drawOffsetPolyline(rope, points, edgeOffset + 8);
      rope.setDepth(4.1);
      this.midgroundLayer.add(rope);

      this.tweens.add({
        targets: rope,
        alpha: { from: 0.74, to: 0.96 },
        y: { from: -1, to: 1 },
        duration: 2100,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    }

    sampled.forEach((sample, index) => {
      const plank = this.add.rectangle(
        sample.x,
        sample.y,
        options.plankWidth + ((index % 3) - 1) * 5,
        options.plankHeight,
        options.tint[index % options.tint.length],
        1,
      );
      plank.setRotation(sample.angle + (index % 2 === 0 ? 0.05 : -0.04));
      plank.setStrokeStyle(1, 0x3a2412, 0.58);
      plank.setAlpha(0.92);
      plank.setDepth(3.8 + index * 0.0005);
      this.midgroundLayer.add(plank);

      const grain = this.add.rectangle(
        sample.x,
        sample.y - 3,
        options.plankWidth * 0.68,
        2,
        0xd5a15f,
        0.22,
      );
      grain.setRotation(plank.rotation);
      grain.setDepth(plank.depth + 0.01);
      grain.setAlpha(0.65);
      this.midgroundLayer.add(grain);

      if (index % 7 === 0) {
        const beam = this.add.rectangle(
          sample.x,
          sample.y + 11,
          8,
          20,
          0x4a2c14,
          0.55,
        );
        beam.setRotation(sample.angle);
        beam.setDepth(3.5);
        this.midgroundLayer.add(beam);
      }

      if (
        typeof options.elevatedFromIndex === "number" &&
        index >= options.elevatedFromIndex &&
        index % 3 === 0
      ) {
        const support = this.add.rectangle(
          sample.x + Math.sin(sample.angle) * 24,
          sample.y - Math.cos(sample.angle) * 24,
          7,
          28,
          0x5b381b,
          0.55,
        );
        support.setRotation(sample.angle + Math.PI / 2);
        support.setDepth(3.3);
        this.midgroundLayer.add(support);
      }
    });
  }

  private drawWoodenHub(
    x: number,
    y: number,
    radius: number,
    tint: number,
    label: string,
  ): void {
    const shadow = this.add.ellipse(
      x + 8,
      y + 18,
      radius + 18,
      radius * 0.42,
      0x000000,
      0.18,
    );
    shadow.setDepth(3.3);
    this.midgroundLayer.add(shadow);

    const base = this.add.graphics();
    base.fillStyle(0x3f2612, 1);
    base.fillCircle(x, y, radius * 0.46);
    base.lineStyle(3, 0x6f451f, 0.88);
    base.strokeCircle(x, y, radius * 0.43);
    base.lineStyle(1, 0xd29b55, 0.38);
    base.strokeCircle(x, y, radius * 0.31);
    for (let i = 0; i < 9; i += 1) {
      const angle = (Math.PI * 2 * i) / 9;
      base.lineStyle(2, tint, 0.7);
      base.lineBetween(
        x + Math.cos(angle) * radius * 0.14,
        y + Math.sin(angle) * radius * 0.14,
        x + Math.cos(angle) * radius * 0.42,
        y + Math.sin(angle) * radius * 0.42,
      );
    }
    base.setDepth(3.9);
    this.midgroundLayer.add(base);

    const text = this.add.text(x, y + radius * 0.24, label.toUpperCase(), {
      fontSize: "8px",
      fontFamily: '"VT323", "Courier New", monospace',
      color: "#f8e6bd",
      stroke: "#2b190c",
      strokeThickness: 2,
    });
    text.setOrigin(0.5);
    text.setDepth(4.2);
    this.midgroundLayer.add(text);
  }

  private addVillageTrackStoryProps(
    nodes: { x: number; y: number }[],
    hub: { x: number; y: number },
  ): void {
    const props: Array<[string, number, number, number]> = [
      ["LampPost_3", nodes[0].x - 96, nodes[0].y + 102, 0.86],
      ["Sign_1", nodes[0].x + 96, nodes[0].y + 92, 0.92],
      ["Crate_Medium_Closed", hub.x + 70, hub.y + 82, 0.82],
      ["Barrel_Small_Empty", hub.x + 104, hub.y + 76, 0.82],
      ["LampPost_3", nodes[1].x + 108, nodes[1].y + 82, 0.86],
      ["Sign_2", nodes[2].x - 104, nodes[2].y + 92, 0.9],
      ["Crate_Large_Empty", nodes[2].x + 98, nodes[2].y + 74, 0.72],
      ["LampPost_3", nodes[3].x - 118, nodes[3].y + 112, 0.9],
      ["BulletinBoard_1", nodes[3].x + 122, nodes[3].y + 108, 0.82],
    ];

    props.forEach(([key, x, y, scale], index) => {
      this.addLandmarkSprite(key, x, y, scale, index % 3 === 0 ? 0.96 : 0.9);
      if (key === "LampPost_3") {
        const glow = this.add.circle(x, y - 54, 18, 0xffd27a, 0.14);
        glow.setDepth(16);
        this.midgroundLayer.add(glow);
        this.tweens.add({
          targets: glow,
          alpha: { from: 0.08, to: 0.22 },
          scale: { from: 0.9, to: 1.12 },
          duration: 1600 + index * 180,
          yoyo: true,
          repeat: -1,
          ease: "Sine.easeInOut",
        });
      }
    });

    const detailPoints = [
      [nodes[0].x - 42, nodes[0].y + 124, 0xfff0a5],
      [nodes[1].x + 34, nodes[1].y + 116, 0xe86c72],
      [hub.x - 86, hub.y + 74, 0xffffff],
      [nodes[2].x + 54, nodes[2].y + 110, 0xded38a],
      [nodes[3].x + 64, nodes[3].y + 126, 0xf49cc1],
    ];

    detailPoints.forEach(([x, y, color], index) => {
      const flowers = this.add.graphics();
      flowers.fillStyle(color as number, 0.95);
      flowers.fillCircle(x as number, y as number, 4);
      flowers.fillCircle((x as number) + 9, (y as number) + 3, 3);
      flowers.fillStyle(0x5e8d3e, 0.9);
      flowers.fillCircle((x as number) + 4, (y as number) + 7, 3);
      flowers.setDepth(13);
      this.midgroundLayer.add(flowers);

      const pebble = this.add.ellipse(
        (x as number) + 32,
        (y as number) - 12,
        10,
        6,
        0x6e675b,
        0.48,
      );
      pebble.setDepth(13);
      this.midgroundLayer.add(pebble);

      if (index % 2 === 0) {
        const mushroom = this.add.graphics();
        mushroom.fillStyle(0xb8423b, 1);
        mushroom.fillCircle((x as number) - 24, (y as number) - 8, 7);
        mushroom.fillStyle(0xf7e0bd, 1);
        mushroom.fillRect((x as number) - 27, (y as number) - 7, 6, 10);
        mushroom.setDepth(13);
        this.midgroundLayer.add(mushroom);
      }
    });
  }

  private samplePolyline(
    points: { x: number; y: number }[],
    spacing: number,
  ): Array<{ x: number; y: number; angle: number }> {
    const samples: Array<{ x: number; y: number; angle: number }> = [];
    for (let i = 0; i < points.length - 1; i += 1) {
      const start = points[i];
      const end = points[i + 1];
      const dx = end.x - start.x;
      const dy = end.y - start.y;
      const distance = Math.hypot(dx, dy);
      const steps = Math.max(1, Math.floor(distance / spacing));
      const angle = Math.atan2(dy, dx);
      for (let step = 0; step < steps; step += 1) {
        const t = step / steps;
        const wave = Math.sin((samples.length + t) * 1.7) * 4;
        samples.push({
          x: Phaser.Math.Linear(start.x, end.x, t) + Math.sin(angle) * wave,
          y: Phaser.Math.Linear(start.y, end.y, t) - Math.cos(angle) * wave,
          angle,
        });
      }
    }
    const last = points[points.length - 1];
    const prev = points[points.length - 2] ?? last;
    samples.push({
      x: last.x,
      y: last.y,
      angle: Math.atan2(last.y - prev.y, last.x - prev.x),
    });
    return samples;
  }

  private drawOffsetPolyline(
    graphics: Phaser.GameObjects.Graphics,
    points: { x: number; y: number }[],
    offset: number,
  ): void {
    if (points.length < 2) return;
    const offsetPoints = points.map((point, index) => {
      const previous = points[Math.max(0, index - 1)];
      const next = points[Math.min(points.length - 1, index + 1)];
      const angle = Math.atan2(next.y - previous.y, next.x - previous.x);
      return {
        x: point.x + Math.sin(angle) * offset,
        y: point.y - Math.cos(angle) * offset,
      };
    });
    graphics.beginPath();
    graphics.moveTo(offsetPoints[0].x, offsetPoints[0].y);
    offsetPoints.slice(1).forEach((point) => graphics.lineTo(point.x, point.y));
    graphics.strokePath();
  }

  private getPointOnPolyline(
    points: { x: number; y: number }[],
    ratio: number,
  ): { x: number; y: number } {
    const lengths: number[] = [];
    let total = 0;
    for (let i = 0; i < points.length - 1; i += 1) {
      const length = Math.hypot(
        points[i + 1].x - points[i].x,
        points[i + 1].y - points[i].y,
      );
      lengths.push(length);
      total += length;
    }
    let target = total * Phaser.Math.Clamp(ratio, 0, 1);
    for (let i = 0; i < lengths.length; i += 1) {
      if (target <= lengths[i]) {
        const t = lengths[i] === 0 ? 0 : target / lengths[i];
        return {
          x: Phaser.Math.Linear(points[i].x, points[i + 1].x, t),
          y: Phaser.Math.Linear(points[i].y, points[i + 1].y, t),
        };
      }
      target -= lengths[i];
    }
    return points[points.length - 1];
  }

  private createForestLandmarks(stageId: number): void {
    const nodes = this.getStageNodes(stageId);
    if (nodes.length === 0) return;

    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    const centerX = (first.x + last.x) / 2;
    const centerY = (first.y + last.y) / 2;

    this.addForestLandmarkSprite(2, first.x - 130, first.y + 128, 2.1, 0.96);
    this.addForestLandmarkSprite(0, centerX - 160, centerY + 144, 2.2, 0.94);
    this.addForestLandmarkSprite(9, centerX + 170, centerY + 138, 2.05, 0.94);
    this.addForestLandmarkSprite(21, centerX - 56, centerY + 204, 1.7);
    this.addForestLandmarkSprite(24, centerX + 82, centerY + 196, 1.75);
    this.addForestLandmarkSprite(28, centerX + 18, centerY + 176, 1.48);

    nodes.forEach((node, index) => {
      this.addForestLandmarkSprite(index % 3, node.x - 118, node.y + 130, 1.96);
      this.addForestLandmarkSprite(
        (index % 3) + 1,
        node.x + 118,
        node.y + 120,
        1.84,
        0.96,
      );
      this.addForestLandmarkSprite(
        27 + (index % 6),
        node.x + (index % 2 === 0 ? 52 : -48),
        node.y + 138,
        1.32,
        0.92,
      );
    });
  }

  private createArenaLandmarks(stageId: number): void {
    const nodes = this.getStageNodes(stageId);
    if (nodes.length === 0) return;
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    const centerX = (first.x + last.x) / 2;
    const centerY = (first.y + last.y) / 2;

    const trialGraphics = this.add.graphics();
    trialGraphics.lineStyle(6, 0xffd37a, 0.24);
    trialGraphics.strokeEllipse(centerX, centerY + 110, 500, 280);

    const addPillar = (x: number, y: number, tint: number) => {
      trialGraphics.fillStyle(0x1b0908, 0.42);
      trialGraphics.fillEllipse(x + 6, y + 18, 58, 20);
      trialGraphics.fillStyle(tint, 0.82);
      trialGraphics.fillRect(x - 18, y - 52, 36, 72);
      trialGraphics.fillStyle(0xffd37a, 0.42);
      trialGraphics.fillRect(x - 14, y - 44, 28, 7);
      trialGraphics.fillRect(x - 14, y - 28, 28, 7);
      trialGraphics.fillRect(x - 14, y - 12, 28, 7);
    };

    const addEvidenceBoard = (
      x: number,
      y: number,
      bars: Array<[number, number, number]>,
    ) => {
      trialGraphics.fillStyle(0x19090a, 0.82);
      trialGraphics.fillRect(x - 42, y - 54, 84, 58);
      trialGraphics.lineStyle(2, 0xffd37a, 0.45);
      trialGraphics.strokeRect(x - 42, y - 54, 84, 58);
      bars.forEach(([offsetX, height, color]) => {
        trialGraphics.fillStyle(color, 0.86);
        trialGraphics.fillRect(x - 26 + offsetX, y - 8 - height, 12, height);
      });
    };

    trialGraphics.setDepth(14);
    this.midgroundLayer.add(trialGraphics);

    this.addLandmarkSprite("Banner_Stick_1_Purple", first.x - 112, first.y + 96, 1.36);
    this.addLandmarkSprite("Banner_Stick_1_Purple", last.x + 84, last.y + 94, 1.32);
    this.addLandmarkSprite("Fireplace_1", centerX + 14, centerY + 162, 1.08);
    this.addLandmarkSprite("Rock_Brown_4", centerX - 180, centerY + 190, 1.22);
    this.addLandmarkSprite("Rock_Brown_6", centerX + 184, centerY + 186, 1.12);
    this.addLandmarkSprite("Rock_Brown_9", centerX + 260, centerY + 138, 1.0);

    nodes.forEach((node, index) => {
      const leftSide = index % 2 === 0;
      const markerX = node.x + (leftSide ? -82 : 84);
      const markerY = node.y + 104;
      if (index === 0) {
        addPillar(markerX, markerY, 0x7c2d12);
      } else if (index === 1) {
        addEvidenceBoard(markerX, markerY, [
          [0, 18, 0xef4444],
          [18, 30, 0xf59e0b],
          [36, 24, 0x22c55e],
        ]);
      } else if (index === 2) {
        this.addLandmarkSprite("Crate_Medium_Closed", markerX - 12, markerY + 12, 0.86);
        this.addLandmarkSprite("BulletinBoard_1", markerX + 28, markerY + 12, 0.82);
      } else {
        trialGraphics.lineStyle(8, 0xffd37a, 0.26);
        trialGraphics.lineBetween(markerX - 58, markerY - 24, markerX + 16, markerY + 24);
        trialGraphics.lineBetween(markerX + 16, markerY + 24, markerX + 90, markerY - 28);
        this.addLandmarkSprite("Sign_2", markerX + 90, markerY + 12, 0.9);
      }

      this.addLandmarkSprite("Rock_Brown_4", node.x - 58, node.y + 124, 0.72, 0.92);
      this.addLandmarkSprite("Rock_Brown_6", node.x + 58, node.y + 118, 0.68, 0.9);
    });
  }

  private createArtisanLandmarks(stageId: number): void {
    const nodes = this.getStageNodes(stageId);
    if (nodes.length === 0) return;
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    const centerX = (first.x + last.x) / 2;
    const centerY = (first.y + last.y) / 2;

    const studioGraphics = this.add.graphics();
    studioGraphics.fillStyle(0x071a3f, 0.74);
    studioGraphics.fillRect(centerX - 54, centerY + 72, 108, 70);
    studioGraphics.lineStyle(2, 0x9ddcff, 0.54);
    studioGraphics.strokeRect(centerX - 54, centerY + 72, 108, 70);
    studioGraphics.lineBetween(centerX - 36, centerY + 92, centerX + 32, centerY + 92);
    studioGraphics.lineBetween(centerX - 36, centerY + 112, centerX + 12, centerY + 130);
    studioGraphics.strokeCircle(centerX + 32, centerY + 118, 11);

    [
      [centerX - 210, centerY + 168, 0xf87171],
      [centerX - 184, centerY + 168, 0xfbbf24],
      [centerX - 158, centerY + 168, 0x34d399],
      [centerX - 132, centerY + 168, 0x60a5fa],
      [centerX - 106, centerY + 168, 0xc084fc],
    ].forEach(([x, y, color]) => {
      studioGraphics.fillStyle(color as number, 0.92);
      studioGraphics.fillRect(x as number, y as number, 20, 20);
      studioGraphics.lineStyle(1, 0xffffff, 0.35);
      studioGraphics.strokeRect(x as number, y as number, 20, 20);
    });

    studioGraphics.setDepth(14);
    this.midgroundLayer.add(studioGraphics);

    this.addLandmarkSprite("House_Hay_4_Purple", centerX - 256, centerY + 96, 1.22);
    this.addLandmarkSprite("House_Hay_2", centerX + 242, centerY + 90, 1.16);
    this.addLandmarkSprite("Well_Hay_1", centerX + 134, centerY + 150, 0.86);
    this.addLandmarkSprite("Table_Medium_1", centerX - 24, centerY + 166, 1.24);
    this.addLandmarkSprite("Bench_1", centerX + 76, centerY + 166, 0.98);
    this.addLandmarkSprite("Crate_Medium_Closed", centerX - 112, centerY + 198, 0.86);
    this.addLandmarkSprite("BulletinBoard_1", centerX + 186, centerY + 160, 0.9);

    nodes.forEach((node, index) => {
      const side = index % 2 === 0 ? -1 : 1;
      const propX = node.x + side * 78;
      const propY = node.y + 118;

      if (index === 0) {
        this.addLandmarkSprite("Sign_1", propX, propY, 0.88, 0.92);
      } else if (index === 1) {
        this.addLandmarkSprite("Table_Medium_1", propX, propY, 0.92, 0.94);
      } else if (index === 2) {
        this.addLandmarkSprite("BulletinBoard_1", propX, propY, 0.84, 0.92);
      } else if (index === 3) {
        this.addLandmarkSprite("Bench_3", propX, propY, 0.9, 0.92);
      } else {
        this.addLandmarkSprite("Crate_Water_1", propX, propY, 0.78, 0.92);
      }

      this.addLandmarkSprite("LampPost_3", node.x - side * 68, node.y + 126, 0.76, 0.88);
    });
  }

  private createMineLandmarks(stageId: number): void {
    const nodes = this.getStageNodes(stageId);
    if (nodes.length === 0) return;
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    const centerX = (first.x + last.x) / 2;
    const centerY = (first.y + last.y) / 2;

    // Mine entrance and mining props (rocks + campfire for lanterns)
    this.addLandmarkSprite("Rock_Brown_9", centerX - 170, centerY + 110, 1.7);
    this.addLandmarkSprite("Rock_Brown_6", centerX + 150, centerY + 105, 1.6);
    this.addLandmarkSprite("Rock_Brown_4", centerX - 60, centerY + 170, 1.3);
    this.addLandmarkSprite("Rock_Brown_1", centerX + 80, centerY + 175, 1.2);
    this.addLandmarkSprite("Fireplace_1", centerX, centerY + 155, 1.0);
    this.addLandmarkSprite("HayStack_2", centerX - 230, centerY + 155, 1.0);
    this.addLandmarkSprite(
      "Crate_Medium_Closed",
      centerX + 210,
      centerY + 160,
      1.0,
    );

    nodes.forEach((node) => {
      this.addLandmarkSprite("Rock_Brown_1", node.x - 55, node.y + 130, 0.9);
      this.addLandmarkSprite("Rock_Brown_4", node.x + 60, node.y + 125, 0.85);
    });
  }

  private createHarbourLandmarks(stageId: number): void {
    const nodes = this.getStageNodes(stageId);
    if (nodes.length === 0) return;
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    const centerX = (first.x + last.x) / 2;
    const centerY = (first.y + last.y) / 2;

    // Harbour dock props — barrels, crates, signs
    this.addLandmarkSprite("HayStack_2", centerX - 180, centerY + 130, 1.2);
    this.addLandmarkSprite(
      "Crate_Medium_Closed",
      centerX - 100,
      centerY + 155,
      1.1,
    );
    this.addLandmarkSprite(
      "Crate_Medium_Closed",
      centerX - 80,
      centerY + 145,
      1.0,
    );
    this.addLandmarkSprite("Sign_2", centerX + 20, centerY + 165, 1.2);
    this.addLandmarkSprite("LampPost_3", centerX + 140, centerY + 155, 1.1);
    this.addLandmarkSprite("Rock_Brown_1", centerX + 240, centerY + 160, 1.0);
    this.addLandmarkSprite(
      "BulletinBoard_1",
      centerX - 240,
      centerY + 165,
      1.0,
    );

    nodes.forEach((node, index) => {
      this.addLandmarkSprite(
        "Crate_Medium_Closed",
        node.x - 55,
        node.y + 135,
        0.85,
      );
      if (index % 2 === 0) {
        this.addLandmarkSprite(
          "LampPost_3",
          node.x + 70,
          node.y + 128,
          0.9,
          0.9,
        );
      }
    });
  }

  private createCrossroadsLandmarks(stageId: number): void {
    const nodes = this.getStageNodes(stageId);
    if (nodes.length === 0) return;
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    const centerX = (first.x + last.x) / 2;
    const centerY = (first.y + last.y) / 2;

    // Crossroads market props — signs, benches, bulletin boards
    this.addLandmarkSprite("Sign_2", centerX - 20, centerY + 155, 1.3);
    this.addLandmarkSprite("Sign_2", centerX + 50, centerY + 150, 1.2);
    this.addLandmarkSprite(
      "BulletinBoard_1",
      centerX - 160,
      centerY + 145,
      1.2,
    );
    this.addLandmarkSprite("Bench_1", centerX + 160, centerY + 158, 1.1);
    this.addLandmarkSprite("Bench_1", centerX + 200, centerY + 155, 1.1);
    this.addLandmarkSprite("Well_Hay_1", centerX - 240, centerY + 155, 1.0);
    this.addLandmarkSprite("LampPost_3", centerX - 100, centerY + 160, 1.1);
    this.addLandmarkSprite("LampPost_3", centerX + 100, centerY + 160, 1.1);

    nodes.forEach((node) => {
      this.addLandmarkSprite(
        "BulletinBoard_1",
        node.x - 68,
        node.y + 132,
        0.85,
        0.9,
      );
    });
  }

  private createCapitalLandmarks(stageId: number): void {
    const nodes = this.getStageNodes(stageId);
    if (nodes.length === 0) return;
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    const centerX = (first.x + last.x) / 2;
    const centerY = (first.y + last.y) / 2;

    // Capital city grand architecture — gates, walls, grand buildings
    this.addLandmarkSprite("CityWall_Gate_1", centerX, centerY + 100, 1.8);
    this.addLandmarkSprite("House_Hay_1", centerX - 200, centerY + 125, 1.6);
    this.addLandmarkSprite("House_Hay_3", centerX + 180, centerY + 120, 1.55);
    this.addLandmarkSprite("LampPost_3", centerX - 80, centerY + 165, 1.3);
    this.addLandmarkSprite("LampPost_3", centerX + 80, centerY + 165, 1.3);
    this.addLandmarkSprite("LampPost_3", centerX - 250, centerY + 158, 1.1);
    this.addLandmarkSprite("LampPost_3", centerX + 250, centerY + 158, 1.1);
    this.addLandmarkSprite("Well_Hay_1", centerX - 330, centerY + 160, 1.0);
    this.addLandmarkSprite(
      "BulletinBoard_1",
      centerX + 310,
      centerY + 165,
      1.0,
    );

    nodes.forEach((node, index) => {
      this.addLandmarkSprite(
        "LampPost_3",
        node.x - 72,
        node.y + 128,
        1.0,
        0.95,
      );
      this.addLandmarkSprite(
        "LampPost_3",
        node.x + 76,
        node.y + 122,
        0.95,
        0.92,
      );
    });
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

      let particleConfig: Phaser.Types.GameObjects.Particles.ParticleEmitterConfig | null =
        null;

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
            rotate: { min: 0, max: 360 },
          };
          break;
        case 3: // Arena - ember sparks and chalk dust from validation trials
          particleConfig = {
            x: { min: biomeX + 160, max: biomeX + this.BIOME_WIDTH - 120 },
            y: { min: 420, max: 980 },
            speedY: { min: -34, max: -10 },
            speedX: { min: -18, max: 18 },
            scale: { start: 0.12, end: 0 },
            alpha: { start: 0.72, end: 0 },
            lifespan: 2600,
            frequency: 130,
            tint: [0xf59e0b, 0xffd37a, 0xef4444],
            blendMode: "ADD",
          };
          break;
        case 4: // Artisan - blueprint glints and warm workshop motes
          particleConfig = {
            x: { min: biomeX + 120, max: biomeX + this.BIOME_WIDTH - 120 },
            y: { min: 360, max: 930 },
            speedY: { min: -18, max: 8 },
            speedX: { min: -12, max: 12 },
            scale: { start: 0.11, end: 0.02 },
            alpha: { start: 0.42, end: 0 },
            lifespan: 4200,
            frequency: 170,
            tint: [0x9ddcff, 0xffd166, 0xc4b5fd],
            blendMode: "ADD",
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
            blendMode: "ADD",
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
            blendMode: "ADD",
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
        delay: Math.random() * 4000,
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
          delay: Math.random() * 2000,
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
        ease: "Sine.easeInOut",
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

    this.drawSnakePathConnectors(positions);
    this.createVillageWoodenTrackNetwork(positions.slice(0, 4));

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
          globalIndex: globalIndex + 1,
        });

        node.setInteractive();
        this.checkpointNodes.set(checkpointId, node);
        this.gameLayer.add(node);

        globalIndex++;
      }
    });
  }

  private drawSnakePathConnectors(positions: { x: number; y: number }[]): void {
    let offset = 0;

    VENTURE_STAGES.forEach((stage) => {
      const stagePositions = positions.slice(
        offset,
        offset + stage.checkpoints,
      );
      const biome = BIOME_CONFIGS[stage.id - 1];
      if (stagePositions.length > 1 && biome) {
        this.drawStagePathConnector(stagePositions, biome.colors.path);
      }

      const nextPosition = positions[offset + stage.checkpoints];
      const lastPosition = stagePositions[stagePositions.length - 1];
      if (lastPosition && nextPosition) {
        this.drawStagePathConnector(
          [lastPosition, nextPosition],
          biome?.colors.accent2 ?? 0x818cf8,
          0.28,
        );
      }

      offset += stage.checkpoints;
    });
  }

  private createStageFogOverlays(): void {
    for (const biome of BIOME_CONFIGS) {
      if (biome.id === 1) continue;

      const x = (biome.id - 1) * this.BIOME_WIDTH;
      const fog = this.add.container(x, 0);
      fog.setDepth(90);

      const veil = this.add.graphics();
      veil.fillGradientStyle(0x020617, 0x07111f, 0x050816, 0x020617, 1, 1, 1, 1);
      veil.fillRect(-80, 0, this.BIOME_WIDTH + 160, this.MAP_HEIGHT);
      veil.fillStyle(0x0f172a, 1);
      veil.fillRect(-80, this.MAP_HEIGHT * 0.58, this.BIOME_WIDTH + 160, this.MAP_HEIGHT * 0.42);
      veil.lineStyle(5, 0x38bdf8, 0.38);
      veil.beginPath();
      veil.moveTo(-24, 0);
      veil.lineTo(-24, this.MAP_HEIGHT);
      veil.strokePath();
      veil.lineStyle(2, 0xfacc15, 0.32);
      veil.beginPath();
      veil.moveTo(16, 0);
      veil.lineTo(16, this.MAP_HEIGHT);
      veil.strokePath();

      const distantShapes = this.add.graphics();
      distantShapes.fillStyle(0x111827, 1);
      for (let i = 0; i < 10; i += 1) {
        distantShapes.fillTriangle(
          i * 180 - 120,
          this.MAP_HEIGHT,
          i * 180 + 40,
          420 + Phaser.Math.Between(-80, 70),
          i * 180 + 230,
          this.MAP_HEIGHT,
        );
      }
      distantShapes.fillStyle(0x1e293b, 0.75);
      for (let i = 0; i < 8; i += 1) {
        distantShapes.fillTriangle(
          i * 210 - 70,
          this.MAP_HEIGHT,
          i * 210 + 72,
          560 + Phaser.Math.Between(-40, 90),
          i * 210 + 260,
          this.MAP_HEIGHT,
        );
      }

      const cloudBands = this.add.graphics();
      cloudBands.fillStyle(0xe0f2fe, 0.1);
      for (let i = 0; i < 12; i += 1) {
        cloudBands.fillEllipse(
          90 + i * 130,
          135 + Phaser.Math.Between(-20, 36),
          Phaser.Math.Between(170, 290),
          Phaser.Math.Between(46, 82),
        );
        cloudBands.fillEllipse(
          60 + i * 145,
          740 + Phaser.Math.Between(-50, 60),
          Phaser.Math.Between(210, 360),
          Phaser.Math.Between(58, 110),
        );
      }

      const stars = this.add.graphics();
      stars.fillStyle(0xffffff, 0.65);
      for (let i = 0; i < 70; i += 1) {
        stars.fillCircle(
          Phaser.Math.Between(70, this.BIOME_WIDTH - 70),
          Phaser.Math.Between(44, 430),
          Phaser.Math.Between(1, 2),
        );
      }

      const seal = this.add.container(this.BIOME_WIDTH / 2, 270);
      const sealGlow = this.add.circle(0, 0, 92, biome.colors.accent2, 0.1);
      sealGlow.setStrokeStyle(5, biome.colors.accent2, 0.32);
      const sealCore = this.add.circle(0, 0, 58, 0x0f172a, 0.98);
      sealCore.setStrokeStyle(3, 0xfacc15, 0.65);
      const sealBar = this.add.rectangle(0, 8, 76, 18, 0xfacc15, 0.82);
      sealBar.setAngle(-18);
      const sealCap = this.add.circle(0, -20, 18, 0x38bdf8, 0.86);
      sealCap.setStrokeStyle(3, 0xdbeafe, 0.7);
      seal.add([sealGlow, sealCore, sealBar, sealCap]);

      const lockText = this.add.text(
        this.BIOME_WIDTH / 2,
        394,
        `STAGE ${biome.id} SEALED`,
        {
          fontSize: "34px",
          fontFamily: '"VT323", "Courier New", monospace',
          color: "#f8fafc",
          align: "center",
          stroke: "#020617",
          strokeThickness: 7,
        },
      );
      lockText.setOrigin(0.5);

      const hintText = this.add.text(
        this.BIOME_WIDTH / 2,
        438,
        `Complete Stage ${biome.id - 1} final checkpoint to reveal the path`,
        {
          fontSize: "20px",
          fontFamily: '"VT323", "Courier New", monospace',
          color: "#93c5fd",
          align: "center",
          stroke: "#020617",
          strokeThickness: 5,
        },
      );
      hintText.setOrigin(0.5);

      fog.add([veil, distantShapes, stars, cloudBands, seal, lockText, hintText]);
      this.animationLayer.add(fog);
      this.stageFogOverlays.set(biome.id, fog);

      this.tweens.add({
        targets: cloudBands,
        x: 42,
        alpha: { from: 0.72, to: 1 },
        duration: 4800,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
        delay: biome.id * 180,
      });

      this.tweens.add({
        targets: sealGlow,
        alpha: { from: 0.12, to: 0.28 },
        scale: { from: 1, to: 1.12 },
        duration: 1500,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    }
  }

  private updateStageVisibility(
    activeStage: number,
    animateReveal: boolean,
  ): void {
    const maxVisibleStage = Phaser.Math.Clamp(
      activeStage,
      1,
      BIOME_CONFIGS.length,
    );

    for (const node of this.checkpointNodes.values()) {
      const isVisible = node.stage <= maxVisibleStage;
      node.setVisible(isVisible);
      node.setActive(isVisible);
    }

    for (const [stage, miniBoss] of this.miniBosses.entries()) {
      const isVisible = stage <= maxVisibleStage;
      miniBoss.setVisible(isVisible);
      miniBoss.setActive(isVisible);
    }

    for (const [stage, overlay] of this.stageFogOverlays.entries()) {
      if (stage <= maxVisibleStage) {
        if (!this.revealedStages.has(stage)) {
          this.revealedStages.add(stage);
          if (animateReveal) {
            this.playStageEntryReveal(stage);
            continue;
          }
        }
        overlay.setVisible(false);
        overlay.setAlpha(0);
      } else {
        overlay.setVisible(true);
        overlay.setAlpha(1);
      }
    }
  }

  private playStageEntryReveal(stage: number): void {
    if (this.stageEntryInProgress.has(stage)) return;
    this.stageEntryInProgress.add(stage);

    const overlay = this.stageFogOverlays.get(stage);
    overlay?.setVisible(true);
    overlay?.setAlpha(1);

    const stageX = (stage - 1) * this.BIOME_WIDTH;
    const centerX = stageX + this.BIOME_WIDTH / 2;
    const centerY = this.MAP_HEIGHT / 2;
    const biome = BIOME_CONFIGS[stage - 1];
    const accent = biome?.colors.accent2 ?? 0xdff5ff;

    const sweep = this.add.rectangle(
      stageX - 120,
      centerY,
      260,
      this.MAP_HEIGHT * 1.2,
      0xffffff,
      0.18,
    );
    sweep.setDepth(125);
    sweep.setAngle(-10);
    this.animationLayer.add(sweep);

    this.tweens.add({
      targets: sweep,
      x: stageX + this.BIOME_WIDTH + 160,
      alpha: { from: 0.2, to: 0 },
      duration: 1450,
      ease: "Cubic.easeInOut",
      onComplete: () => sweep.destroy(),
    });

    if (overlay) {
      this.tweens.add({
        targets: overlay,
        alpha: 0,
        x: stageX + 120,
        duration: 1500,
        ease: "Cubic.easeInOut",
        onComplete: () => {
          overlay.setVisible(false);
          overlay.setAlpha(0);
          overlay.setX(stageX);
        },
      });
    }

    this.playStageEntryWeather(centerX, centerY, stage, accent);

    this.time.delayedCall(1550, () => {
      this.stageEntryInProgress.delete(stage);
    });
  }

  private playStageEntryWeather(
    centerX: number,
    centerY: number,
    stage: number,
    accent: number,
  ): void {
    const stageX = (stage - 1) * this.BIOME_WIDTH;

    for (let i = 0; i < 18; i += 1) {
      const cloud = this.add.container(
        stageX + Phaser.Math.Between(80, this.BIOME_WIDTH - 80),
        Phaser.Math.Between(120, 360),
      );
      cloud.setDepth(124);

      const puff = this.add.graphics();
      puff.fillStyle(0xffffff, 0.2);
      puff.fillCircle(-38, 4, 36);
      puff.fillCircle(0, -8, 48);
      puff.fillCircle(44, 6, 34);
      puff.fillEllipse(4, 18, 132, 44);
      cloud.add(puff);
      cloud.setScale(0.72 + Math.random() * 0.46);
      this.animationLayer.add(cloud);

      this.tweens.add({
        targets: cloud,
        x: cloud.x + Phaser.Math.Between(90, 180),
        y: cloud.y + Phaser.Math.Between(-16, 28),
        alpha: 0,
        duration: Phaser.Math.Between(1300, 2100),
        ease: "Sine.easeOut",
        onComplete: () => cloud.destroy(),
      });
    }

    for (let i = 0; i < 90; i += 1) {
      const flake = this.add.circle(
        stageX + Phaser.Math.Between(40, this.BIOME_WIDTH - 40),
        Phaser.Math.Between(80, 420),
        Phaser.Math.Between(2, 5),
        i % 5 === 0 ? accent : 0xffffff,
        0.9,
      );
      flake.setDepth(126);
      this.animationLayer.add(flake);

      this.tweens.add({
        targets: flake,
        x: flake.x + Phaser.Math.Between(-90, 90),
        y: flake.y + Phaser.Math.Between(180, 360),
        alpha: 0,
        scale: 0.35,
        duration: Phaser.Math.Between(1200, 2400),
        ease: "Sine.easeIn",
        onComplete: () => flake.destroy(),
      });
    }

    const ring = this.add.circle(centerX, centerY, 80, accent, 0.16);
    ring.setStrokeStyle(5, 0xffffff, 0.42);
    ring.setDepth(123);
    this.animationLayer.add(ring);

    this.tweens.add({
      targets: ring,
      scale: 5,
      alpha: 0,
      duration: 1350,
      ease: "Cubic.easeOut",
      onComplete: () => ring.destroy(),
    });
  }

  private drawStagePathConnector(
    points: { x: number; y: number }[],
    color: number,
    alpha = 0.55,
  ): void {
    const shadow = this.add.graphics();
    shadow.lineStyle(24, 0x000000, 0.14);
    shadow.beginPath();
    shadow.moveTo(points[0].x + 4, points[0].y + 8);
    points.slice(1).forEach((point) => shadow.lineTo(point.x + 4, point.y + 8));
    shadow.strokePath();
    shadow.setDepth(2.4);
    this.midgroundLayer.add(shadow);

    const path = this.add.graphics();
    path.lineStyle(13, color, alpha);
    path.beginPath();
    path.moveTo(points[0].x, points[0].y);
    points.slice(1).forEach((point) => path.lineTo(point.x, point.y));
    path.strokePath();
    path.lineStyle(4, 0xffffff, 0.18);
    path.beginPath();
    path.moveTo(points[0].x, points[0].y - 3);
    points.slice(1).forEach((point) => path.lineTo(point.x, point.y - 3));
    path.strokePath();
    path.setDepth(2.7);
    this.midgroundLayer.add(path);
  }

  /**
   * Calculates snake-path position for a checkpoint
   * Snake winds up and down as it progresses left to right through biomes
   */
  private calculateSnakePosition(
    index: number,
    _total: number,
  ): { x: number; y: number } {
    let stageStartIndex = 0;

    for (const stage of VENTURE_STAGES) {
      const stageEndIndex = stageStartIndex + stage.checkpoints;
      if (index < stageEndIndex) {
        return this.calculateStageCheckpointPosition(
          stage.id,
          index - stageStartIndex,
          stage.checkpoints,
        );
      }
      stageStartIndex = stageEndIndex;
    }

    return this.calculateStageCheckpointPosition(1, 0, 1);
  }

  private calculateStageCheckpointPosition(
    stageId: number,
    checkpointIndex: number,
    checkpointTotal: number,
  ): { x: number; y: number } {
    const panelWidth = this.map.widthInPixels * this.MAP_PANEL_SCALE;
    const panelHeight = this.map.heightInPixels * this.MAP_PANEL_SCALE;
    const panelOffsetX = (this.BIOME_WIDTH - panelWidth) / 2;
    const panelOffsetY = this.MAP_HEIGHT - panelHeight + 120;
    const biomeOffsetX = (stageId - 1) * this.BIOME_WIDTH + panelOffsetX;

    const stageOneVillageAnchors = [
      { x: 154, y: 438 },
      { x: 332, y: 366 },
      { x: 486, y: 286 },
      { x: 620, y: 350 },
    ];
    if (stageId === 1) {
      const anchor =
        stageOneVillageAnchors[
          Math.min(checkpointIndex, stageOneVillageAnchors.length - 1)
        ];
      return {
        x: biomeOffsetX + anchor.x * this.MAP_PANEL_SCALE,
        y: panelOffsetY + anchor.y * this.MAP_PANEL_SCALE,
      };
    }

    if (stageId === 3) {
      const arenaAnchors = [
        { x: 138, y: 505 },
        { x: 284, y: 392 },
        { x: 464, y: 276 },
        { x: 638, y: 392 },
      ];
      const anchor =
        arenaAnchors[Math.min(checkpointIndex, arenaAnchors.length - 1)];
      return {
        x: biomeOffsetX + anchor.x * this.MAP_PANEL_SCALE,
        y: panelOffsetY + anchor.y * this.MAP_PANEL_SCALE,
      };
    }

    if (stageId === 4) {
      const artisanAnchors = [
        { x: 122, y: 492 },
        { x: 252, y: 386 },
        { x: 390, y: 292 },
        { x: 526, y: 348 },
        { x: 650, y: 474 },
      ];
      const anchor =
        artisanAnchors[Math.min(checkpointIndex, artisanAnchors.length - 1)];
      return {
        x: biomeOffsetX + anchor.x * this.MAP_PANEL_SCALE,
        y: panelOffsetY + anchor.y * this.MAP_PANEL_SCALE,
      };
    }

    const anchors = [
      { x: 126, y: 445 },
      { x: 285, y: 318 },
      { x: 470, y: 252 },
      { x: 650, y: 350 },
      { x: 780, y: 448 },
      { x: 980, y: 540 },
    ];

    const segmentTarget =
      checkpointTotal === 1
        ? 0
        : (checkpointIndex / (checkpointTotal - 1)) * (anchors.length - 1);
    const leftIndex = Math.floor(segmentTarget);
    const rightIndex = Math.min(leftIndex + 1, anchors.length - 1);
    const t = segmentTarget - leftIndex;
    const left = anchors[leftIndex];
    const right = anchors[rightIndex];

    const localX =
      Phaser.Math.Linear(left.x, right.x, t) * this.MAP_PANEL_SCALE;
    const localY =
      Phaser.Math.Linear(left.y, right.y, t) * this.MAP_PANEL_SCALE;

    return {
      x: biomeOffsetX + localX,
      y: panelOffsetY + localY,
    };
  }

  /**
   * Creates the Super Boss silhouette visible across entire map
   */
  private createSuperBoss(
    bossSlug: string = "the_gravemind",
    bossName: string = "The Gravemind",
    status: "silhouette" | "present" | "foreground" = "silhouette",
  ): void {
    const existingBoss = this.bosses.get("super_boss");
    if (
      existingBoss?.active &&
      this.currentSuperBossSlug === bossSlug &&
      this.currentSuperBossName === bossName
    ) {
      existingBoss.updateStatus(status);
      return;
    }

    if (existingBoss) {
      existingBoss.destroy();
      this.bosses.delete("super_boss");
    }

    const superBossX = this.MAP_WIDTH - 400;
    const superBossY = this.MAP_HEIGHT / 2;

    const superBoss = new BossSilhouette(this, {
      bossId: bossSlug,
      bossName,
      status,
      x: superBossX,
      y: superBossY,
    });

    this.bosses.set("super_boss", superBoss);
    this.gameLayer.add(superBoss);
    this.currentSuperBossSlug = bossSlug;
    this.currentSuperBossName = bossName;
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
    this.boundHandlers.focusStage = this.handleFocusStage.bind(this);
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
    eventBridge.onPhaser("FOCUS_STAGE", this.boundHandlers.focusStage);
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
  private handleUpdateBrightness(event?: { brightness: number }): void {
    if (typeof event?.brightness === "number") {
      this.interpolateBrightnessTo(event.brightness);
      return;
    }

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

    this.interpolateBrightnessTo(finalBrightness);

    console.log(
      `[WorldMapScene] Brightness: ${finalBrightness.toFixed(2)}% (Base: ${accumulatedBase.toFixed(2)}% + Stage: ${stageLayer.toFixed(2)}%)`,
    );
  }

  /**
   * Updates the brightness filter based on percentage (0-100)
   */
  private updateBrightnessFilter(brightnessPercent: number): void {
    if (!this.brightnessFilter) return;

    const fx = brightnessToPhaser(brightnessPercent);
    this.brightnessFilter.brightness(fx.brightness);
    this.brightnessFilter.contrast(fx.contrast);
  }

  private interpolateBrightnessTo(brightnessPercent: number): void {
    const targetBrightness = Math.max(0, Math.min(100, brightnessPercent));

    if (!this.brightnessFilter) {
      this.currentBrightness = targetBrightness;
      return;
    }

    if (this.brightnessTween) {
      this.brightnessTween.stop();
      this.brightnessTween = null;
    }

    const state = { value: this.currentBrightness };
    this.brightnessTween = this.tweens.add({
      targets: state,
      value: targetBrightness,
      duration: 800,
      ease: "Linear",
      onUpdate: () => {
        this.currentBrightness = state.value;
        this.updateBrightnessFilter(state.value);
      },
      onComplete: () => {
        this.currentBrightness = targetBrightness;
        this.updateBrightnessFilter(targetBrightness);
        this.brightnessTween = null;
      },
    });
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
      const nodeKey = `${cp.stage}-${cp.checkpoint}`;
      this.checkpointIdAliases.set(cp.id, nodeKey);
      const node = this.checkpointNodes.get(nodeKey);

      if (node) {
        node.updateStatus(cp.status);
      }
    });

    // Calculate stage progress for brightness
    const activeCheckpoint = checkpoints.find(
      (cp) => cp.status === "active" || cp.status === "in_progress",
    );
    if (activeCheckpoint) {
      const previousStage = this.currentStage;
      this.currentStage = activeCheckpoint.stage;
      this.updateStageVisibility(
        this.currentStage,
        previousStage !== this.currentStage,
      );

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
      const stageCheckpoints = checkpoints
        .filter((cp) => cp.stage === stage)
        .sort((a, b) => a.checkpoint - b.checkpoint);
      const finalCheckpoint = stageCheckpoints[stageCheckpoints.length - 1];
      const finalCheckpointCompleted =
        finalCheckpoint?.status === "completed" ||
        finalCheckpoint?.status === "gold";
      const halfComplete = total > 0 && completed >= Math.ceil(total / 2);

      // Check if stage is fully complete
      const stageComplete = completed === total && total > 0;

      const playerMovedPast = stage < this.currentStage;
      const finalCheckpointGold =
        finalCheckpoint?.status === "gold" ||
        !!finalCheckpoint?.goldBonusEarned;

      if (stageComplete && !this.slainMiniBossStages.has(stage)) {
        // Slay the boss when stage is complete
        if (miniBoss && miniBoss.active) {
          // Use gold slay if final checkpoint is gold
          if (finalCheckpointGold) {
            miniBoss.slayGold();
            this.transformBiomeGold(stage);
          } else {
            miniBoss.slay();
            this.restoreBiome(stage);
          }
          this.slainMiniBossStages.add(stage);
          this.retreatedStages.delete(stage); // slay supersedes retreat
          // Remove residual marker if it exists
          this.removeResidualMarker(stage);
        }
      } else if (
        playerMovedPast &&
        halfComplete &&
        !finalCheckpointCompleted &&
        !this.retreatedStages.has(stage)
      ) {
        if (miniBoss && miniBoss.active) {
          miniBoss.retreat();
          this.retreatedStages.add(stage);
          // Create residual marker at boss position
          this.createResidualMarker(stage, miniBoss.x, miniBoss.y);
          console.log(
            `[WorldMapScene] 🌑 Mini-boss Stage ${stage} retreated (partial progress: ${completed}/${total})`,
          );
        }
      } else if (!playerMovedPast && !stageComplete) {
        // Still on this stage — keep weakening based on progress
        if (miniBoss && miniBoss.active) {
          miniBoss.weaken(completed, total);
        }
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
    corruptionLevel?: number;
    superBoss?: {
      bossSlug: string;
      bossName: string;
      visualStatus: "silhouette" | "present" | "foreground";
      status?: "active" | "retreated" | "slain";
      defeatVariant?: "standard" | "gold";
    };
  }): void {
    try {
      const ventureChanged = this.currentVentureId !== event.ventureId;
      this.currentVentureId = event.ventureId;
      this.currentCorruptionLevel = event.corruptionLevel ?? 0;

      if (ventureChanged) {
        this.retreatedStages.clear();
        this.slainMiniBossStages.clear();
        this.checkpointIdAliases.clear();
        this.lastPersonaCheckpointId = null;
        this.revealedStages.clear();
        for (let stage = 1; stage <= (event.currentStage ?? 1); stage += 1) {
          this.revealedStages.add(stage);
        }
        this.lastSuperBossDefeatStatus = null;
        this.currentSuperBossSlug = null;
        this.currentSuperBossName = null;
      }

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
        this.updateStageVisibility(event.currentStage, !ventureChanged);

        // Play ambience for the current stage
        audioManager.playAmbienceForStage(event.currentStage);
        console.log(
          `[WorldMapScene] Playing ambience for stage ${event.currentStage}`,
        );
      }

      const nextBossStatus = event.superBoss?.visualStatus ?? "silhouette";
      const superBossProgressStatus = event.superBoss?.status ?? "active";
      const alreadyPlayedDefeat =
        superBossProgressStatus !== "active" &&
        this.lastSuperBossDefeatStatus === superBossProgressStatus;

      if (!alreadyPlayedDefeat) {
        this.createSuperBoss(
          event.superBoss?.bossSlug ?? "the_gravemind",
          event.superBoss?.bossName ?? "The Gravemind",
          nextBossStatus,
        );

        if (superBossProgressStatus === "active") {
          if (this.currentCorruptionLevel >= 90) {
            this.bosses.get("super_boss")?.entrance();
          }
          this.lastSuperBossDefeatStatus = "active";
        } else {
          this.playSuperBossDefeat(
            superBossProgressStatus,
            event.superBoss?.defeatVariant ?? "standard",
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

  private playSuperBossDefeat(
    status: "retreated" | "slain",
    variant: "standard" | "gold",
  ): void {
    if (this.lastSuperBossDefeatStatus === status) return;

    const boss = this.bosses.get("super_boss");
    if (!boss?.active) return;

    this.lastSuperBossDefeatStatus = status;
    if (status === "slain") {
      boss.slay(variant);
      return;
    }

    boss.retreat();
  }

  private getPersonaMarkerPosition(node: CheckpointNode): {
    x: number;
    y: number;
  } {
    return {
      x: node.x - 54,
      y: node.y + 38,
    };
  }

  private getCheckpointNode(checkpointId: string): CheckpointNode | null {
    return (
      this.checkpointNodes.get(checkpointId) ??
      this.checkpointNodes.get(
        this.checkpointIdAliases.get(checkpointId) ?? "",
      ) ??
      null
    );
  }

  /**
   * Position persona beside the active checkpoint on a walkable map tile.
   */
  private positionPersonaOnActiveCheckpoint(): void {
    if (!this.persona) return;

    // Find active checkpoint
    for (const node of this.checkpointNodes.values()) {
      const status = node.status;
      if (status === "active" || status === "in_progress") {
        const pos = this.getPersonaMarkerPosition(node);
        const nextCheckpointId = node.checkpointId;
        if (!this.lastPersonaCheckpointId) {
          this.persona.setPosition(pos.x, pos.y);
          this.persona.playIdle();
          this.lastPersonaCheckpointId = nextCheckpointId;
          return;
        }

        if (this.lastPersonaCheckpointId !== nextCheckpointId) {
          const previousNode = this.checkpointNodes.get(
            this.lastPersonaCheckpointId,
          );
          const route = this.getPersonaWalkingRoute(
            this.lastPersonaCheckpointId,
            nextCheckpointId,
          );
          const destination = route[route.length - 1] ?? pos;
          this.persona.moveAlongPath(
            route,
            this.getPersonaMoveDuration(destination.x, destination.y),
          );
          if (previousNode && previousNode.stage !== node.stage) {
            this.playStageEntryWeather(
              node.x,
              node.y - 120,
              node.stage,
              BIOME_CONFIGS[node.stage - 1]?.colors.accent2 ?? 0xdff5ff,
            );
          }
          this.lastPersonaCheckpointId = nextCheckpointId;
          return;
        }

        this.persona.setPosition(pos.x, pos.y);
        this.persona.playIdle();
        return;
      }
    }

    // Default: position on first checkpoint if no active found
    const firstNode = Array.from(this.checkpointNodes.values())[0];
    if (firstNode) {
      const pos = this.getPersonaMarkerPosition(firstNode);
      this.persona.setPosition(pos.x, pos.y);
      this.persona.playIdle();
      this.lastPersonaCheckpointId = firstNode.checkpointId;
    }
  }

  private getPersonaWalkingRoute(
    fromCheckpointId: string,
    toCheckpointId: string,
  ): { x: number; y: number }[] {
    const toNode = this.checkpointNodes.get(toCheckpointId);
    if (!toNode) return [];

    const toMarker = this.getPersonaMarkerPosition(toNode);
    const fromNode = this.checkpointNodes.get(fromCheckpointId);
    if (!fromNode || fromNode.stage !== 1 || toNode.stage !== 1) {
      return [toMarker];
    }

    const nodes = this.getStageNodes(1);
    const fromIndex = nodes.findIndex(
      (node) => node.checkpointId === fromCheckpointId,
    );
    const toIndex = nodes.findIndex(
      (node) => node.checkpointId === toCheckpointId,
    );
    if (fromIndex < 0 || toIndex < 0) return [toMarker];

    const fromMarker = this.getPersonaMarkerPosition(nodes[fromIndex]);
    const direction = fromIndex < toIndex ? 1 : -1;
    const route: { x: number; y: number }[] = [];
    for (
      let index = fromIndex + direction;
      direction > 0 ? index <= toIndex : index >= toIndex;
      index += direction
    ) {
      const node = nodes[index];
      const marker = this.getPersonaMarkerPosition(node);
      const prevX = route.length > 0 ? route[route.length - 1].x : fromMarker.x;
      const waypointX = marker.x - direction * 32;

      // Only add waypoint if it doesn't cause a backtrack
      if (direction > 0 ? waypointX > prevX : waypointX < prevX) {
        route.push({
          x: waypointX,
          y: marker.y + (index % 2 === 0 ? 18 : -10),
        });
      }
      route.push(marker);
    }
    return route;
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

  private handleFocusStage(event: {
    stage: number;
    checkpointId?: string;
  }): void {
    try {
      this.focusStage(event.stage, event.checkpointId, true);
    } catch (error) {
      console.warn("[WorldMapScene] Failed to focus stage:", error);
    }
  }

  /**
   * Scroll camera to show a specific checkpoint
   */
  private scrollToCheckpoint(checkpointId: string, smooth = true): void {
    const node = this.getCheckpointNode(checkpointId);
    if (!node) return;

    const { x: targetX, y: targetY } = this.getStageCameraTarget(
      node.stage,
      node.x,
      node.y,
    );
    const personaTarget = this.getPersonaMarkerPosition(node);

    if (smooth) {
      // Camera pan animation
      this.cameras.main.pan(targetX, targetY, 800, "Sine.easeInOut", false);

      // Sync persona walk animation with camera scroll
      // Position persona 80px above checkpoint node (at character's feet)
      if (this.persona) {
        this.persona.moveToPosition(
          personaTarget.x,
          personaTarget.y,
          this.getPersonaMoveDuration(personaTarget.x, personaTarget.y),
        );
      }
    } else {
      this.cameras.main.centerOn(targetX, targetY);

      // Instantly position persona without animation
      if (this.persona) {
        this.persona.setPosition(personaTarget.x, personaTarget.y);
      }
    }
  }

  private focusStage(
    stage: number,
    checkpointId?: string,
    smooth = true,
  ): void {
    const focusStage = Phaser.Math.Clamp(stage, 1, this.currentStage);
    const requestedNode = checkpointId ? this.getCheckpointNode(checkpointId) : null;
    const node = requestedNode?.stage === focusStage ? requestedNode : null;
    const activeNode = node ?? this.getCurrentActiveCheckpointNode();
    const stageCenterX =
      (focusStage - 1) * this.BIOME_WIDTH + this.BIOME_WIDTH / 2;
    const stageCenterY = this.MAP_HEIGHT / 2;
    const { x, y } = this.getStageCameraTarget(
      focusStage,
      activeNode?.x ?? stageCenterX,
      activeNode?.y ?? stageCenterY,
    );

    if (smooth) {
      this.cameras.main.pan(x, y, 800, "Sine.easeInOut", false);
      if (activeNode && this.persona) {
        const personaTarget = this.getPersonaMarkerPosition(activeNode);
        this.persona.moveToPosition(
          personaTarget.x,
          personaTarget.y,
          this.getPersonaMoveDuration(personaTarget.x, personaTarget.y),
        );
      }
      return;
    }

    this.cameras.main.centerOn(x, y);
    if (activeNode && this.persona) {
      const personaTarget = this.getPersonaMarkerPosition(activeNode);
      this.persona.setPosition(personaTarget.x, personaTarget.y);
    }
  }

  private getCurrentActiveCheckpointNode(): CheckpointNode | null {
    return (
      Array.from(this.checkpointNodes.values()).find(
        (node) =>
          node.stage === this.currentStage &&
          (node.status === "active" || node.status === "in_progress"),
      ) ?? null
    );
  }

  private getStageCameraTarget(
    stage: number,
    preferredX: number,
    preferredY: number,
  ): { x: number; y: number } {
    const stageStartX = (stage - 1) * this.BIOME_WIDTH;
    const stageEndX = stageStartX + this.BIOME_WIDTH;
    const visibleWorldWidth = this.scale.width / this.cameras.main.zoom;
    const visibleWorldHeight = this.scale.height / this.cameras.main.zoom;
    const halfWidth = visibleWorldWidth / 2;
    const halfHeight = visibleWorldHeight / 2;

    const x =
      visibleWorldWidth >= this.BIOME_WIDTH
        ? stageStartX + this.BIOME_WIDTH / 2
        : Phaser.Math.Clamp(
            preferredX,
            stageStartX + halfWidth,
            stageEndX - halfWidth,
          );
    const y = Phaser.Math.Clamp(
      preferredY,
      halfHeight,
      this.MAP_HEIGHT - halfHeight,
    );

    return { x, y };
  }

  private getPersonaMoveDuration(targetX: number, targetY: number): number {
    if (!this.persona) return 800;

    const distance = Phaser.Math.Distance.Between(
      this.persona.x,
      this.persona.y,
      targetX,
      targetY,
    );

    return Phaser.Math.Clamp(distance * 2.2, 650, 1800);
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
    const node = this.getCheckpointNode(checkpointId);
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
    // Intentionally left blank: all map layers stay in world space so the HUD
    // overlay, checkpoint interactions, and the tiled backdrop remain aligned.
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
    this.slainMiniBossStages.clear();
    this.retreatedStages.clear();
    this.checkpointIdAliases.clear();

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
    if (this.boundHandlers.focusStage) {
      eventBridge.off("FOCUS_STAGE", this.boundHandlers.focusStage);
    }
    if (this.boundHandlers.playCheckpointAnimation) {
      eventBridge.off(
        "PLAY_CHECKPOINT_ANIMATION",
        this.boundHandlers.playCheckpointAnimation,
      );
    }
    if (this.resizeHandler) {
      this.scale.off("resize", this.resizeHandler);
      this.resizeHandler = undefined;
    }

    this.boundHandlers = {};
  }

  /**
   * Listens for CustomEvents from the VirtualGamepad component
   */
  private setupGamepadListeners(): void {
    if (typeof window === "undefined") return;

    window.addEventListener("phaser-input", (e: Event) => {
      const customEvent = e as CustomEvent<{ type: string }>;
      const { type } = customEvent.detail;

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
    this.animationLayer.add(this.selectionGlow);

    this.tweens.add({
      targets: this.selectionGlow,
      alpha: { from: 0.2, to: 0.6 },
      scale: 1.1,
      duration: 1000,
      yoyo: true,
      repeat: -1,
    });
  }

  private changeSelection(delta: number): void {
    const newIndex = Phaser.Math.Clamp(
      this.selectedCheckpointIndex + delta,
      0,
      this.TOTAL_CHECKPOINTS - 1,
    );
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
    for (const node of this.checkpointNodes.values()) {
      if (node.globalIndex === index + 1) {
        return node;
      }
    }
    return null;
  }

  private handleGamepadConfirm(): void {
    const node = this.getCheckpointByIndex(this.selectedCheckpointIndex);
    if (node && node.status !== "locked") {
      audioManager.playUI("click");
      this.events.emit("checkpoint_clicked", {
        id: node.checkpointId,
        stage: node.stage,
        checkpoint: node.checkpoint,
      });
      return;
    }

    audioManager.playUI("error");
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

  /**
   * Transform biome with gold completion effects - color floods, particles, elevation
   */
  private transformBiomeGold(stage: number): void {
    const stageBiome = BIOME_CONFIGS[stage - 1];
    if (!stageBiome) return;

    // Get stage bounds
    const stageCheckpoints = Array.from(this.checkpointNodes.values()).filter(
      (node) => node.stage === stage,
    );
    if (stageCheckpoints.length === 0) return;

    const minX = Math.min(...stageCheckpoints.map((n) => n.x));
    const maxX = Math.max(...stageCheckpoints.map((n) => n.x));
    const centerX = (minX + maxX) / 2;
    const centerY = 400;

    // Gold particle burst
    for (let i = 0; i < 50; i++) {
      const angle = (Math.PI * 2 * i) / 50;
      const distance = Phaser.Math.Between(100, 300);
      const particle = this.add.circle(
        centerX,
        centerY,
        Phaser.Math.Between(3, 8),
        0xfbbf24,
        1,
      );
      this.animationLayer.add(particle);

      this.tweens.add({
        targets: particle,
        x: centerX + Math.cos(angle) * distance,
        y: centerY + Math.sin(angle) * distance,
        alpha: 0,
        scale: 0,
        duration: 2000,
        ease: "Cubic.easeOut",
        onComplete: () => {
          particle.destroy();
        },
      });
    }

    // Color flood effect - golden wave
    const colorFlood = this.add.rectangle(
      centerX,
      centerY,
      maxX - minX + 400,
      800,
      0xfbbf24,
      0,
    );
    this.animationLayer.add(colorFlood);

    this.tweens.add({
      targets: colorFlood,
      alpha: { from: 0, to: 0.4 },
      scaleX: { from: 0.5, to: 1.2 },
      scaleY: { from: 0.5, to: 1.2 },
      duration: 1200,
      ease: "Sine.easeOut",
      onComplete: () => {
        this.tweens.add({
          targets: colorFlood,
          alpha: 0,
          duration: 1300,
          ease: "Sine.easeIn",
          onComplete: () => {
            colorFlood.destroy();
          },
        });
      },
    });

    // Sparkle particles
    for (let i = 0; i < 30; i++) {
      setTimeout(() => {
        const x = Phaser.Math.Between(minX - 100, maxX + 100);
        const y = Phaser.Math.Between(200, 600);
        const sparkle = this.add.star(
          x,
          y,
          5,
          Phaser.Math.Between(4, 10),
          Phaser.Math.Between(8, 20),
          0xfacc15,
          1,
        );
        this.animationLayer.add(sparkle);

        this.tweens.add({
          targets: sparkle,
          alpha: 0,
          y: y - 100,
          angle: 360,
          duration: 1500,
          ease: "Cubic.easeOut",
          onComplete: () => {
            sparkle.destroy();
          },
        });
      }, i * 50);
    }

    console.log(
      `[WorldMapScene] 🌟 Gold biome transformation for stage ${stage}`,
    );
  }

  /**
   * Restore biome visually after standard stage completion
   */
  private restoreBiome(stage: number): void {
    const stageBiome = BIOME_CONFIGS[stage - 1];
    if (!stageBiome) return;

    // Get stage bounds
    const stageCheckpoints = Array.from(this.checkpointNodes.values()).filter(
      (node) => node.stage === stage,
    );
    if (stageCheckpoints.length === 0) return;

    const minX = Math.min(...stageCheckpoints.map((n) => n.x));
    const maxX = Math.max(...stageCheckpoints.map((n) => n.x));
    const centerX = (minX + maxX) / 2;
    const centerY = 400;

    // Restoration particle effect
    for (let i = 0; i < 20; i++) {
      const angle = (Math.PI * 2 * i) / 20;
      const distance = Phaser.Math.Between(80, 200);
      const particle = this.add.circle(
        centerX,
        centerY,
        Phaser.Math.Between(2, 5),
        stageBiome.colors.accent2,
        0.8,
      );
      this.animationLayer.add(particle);

      this.tweens.add({
        targets: particle,
        x: centerX + Math.cos(angle) * distance,
        y: centerY + Math.sin(angle) * distance,
        alpha: 0,
        duration: 1500,
        ease: "Cubic.easeOut",
        onComplete: () => {
          particle.destroy();
        },
      });
    }

    // Gentle color wash
    const colorWash = this.add.rectangle(
      centerX,
      centerY,
      maxX - minX + 300,
      700,
      stageBiome.colors.accent1,
      0,
    );
    this.animationLayer.add(colorWash);

    this.tweens.add({
      targets: colorWash,
      alpha: { from: 0, to: 0.2 },
      duration: 1000,
      ease: "Sine.easeOut",
      onComplete: () => {
        this.tweens.add({
          targets: colorWash,
          alpha: 0,
          duration: 1000,
          ease: "Sine.easeIn",
          onComplete: () => {
            colorWash.destroy();
          },
        });
      },
    });

    console.log(`[WorldMapScene] ✨ Biome restored for stage ${stage}`);
  }

  /**
   * Create residual path marker when boss retreats
   */
  private createResidualMarker(
    stage: number,
    bossX: number,
    bossY: number,
  ): void {
    // Remove existing marker if present
    this.removeResidualMarker(stage);

    const container = this.add.container(bossX, bossY);
    this.midgroundLayer.add(container);

    // Faded silhouette
    const silhouette = this.add.circle(0, 0, 30, 0x6b7280, 0.3);
    container.add(silhouette);

    // Crack/scar in the ground
    const crack = this.add.graphics();
    crack.lineStyle(2, 0x52525b, 0.5);
    crack.beginPath();
    crack.moveTo(-20, 40);
    crack.lineTo(-10, 50);
    crack.moveTo(0, 40);
    crack.lineTo(0, 55);
    crack.moveTo(10, 40);
    crack.lineTo(15, 50);
    crack.strokePath();
    container.add(crack);

    // Lingering fog particles
    for (let i = 0; i < 3; i++) {
      const fogParticle = this.add.circle(
        Phaser.Math.Between(-15, 15),
        Phaser.Math.Between(-10, 10),
        Phaser.Math.Between(3, 6),
        0x9ca3af,
        0.2,
      );
      container.add(fogParticle);

      this.tweens.add({
        targets: fogParticle,
        alpha: { from: 0.2, to: 0.05 },
        y: fogParticle.y - 5,
        duration: 2000,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    }

    // Pulse effect
    this.tweens.add({
      targets: silhouette,
      alpha: { from: 0.3, to: 0.15 },
      scale: { from: 1, to: 1.1 },
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    this.residualMarkers.set(stage, container);

    console.log(
      `[WorldMapScene] 🌫️ Residual marker created for stage ${stage}`,
    );
  }

  /**
   * Remove residual marker when stage is completed
   */
  private removeResidualMarker(stage: number): void {
    const marker = this.residualMarkers.get(stage);
    if (marker) {
      this.tweens.add({
        targets: marker,
        alpha: 0,
        duration: 1000,
        onComplete: () => {
          marker.destroy();
        },
      });
      this.residualMarkers.delete(stage);
      console.log(
        `[WorldMapScene] 🌟 Residual marker removed for stage ${stage}`,
      );
    }
  }
}
