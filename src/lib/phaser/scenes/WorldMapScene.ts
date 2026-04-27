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
  visualTheme: "village" | "forest";
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
    visualTheme: "village",
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
    visualTheme: "village",
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
    visualTheme: "forest",
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
    visualTheme: "village",
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
    visualTheme: "forest",
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
    visualTheme: "village",
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
  private readonly MAP_PANEL_SCALE = 2;

  // Snake path configuration
  private readonly CHECKPOINT_SPACING = 220;
  private readonly SNAKE_AMPLITUDE = 180;
  private readonly PATH_Y_CENTER = this.MAP_HEIGHT / 2;

  // Biome containers
  private biomeContainers: Map<number, Phaser.GameObjects.Container> =
    new Map();

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
    this.createSuperBoss();
    this.createMiniBosses();
    
    this.setupGamepadListeners();
    
    // Initial selection
    this.updateGamepadSelection();

    // Set up event listeners
    this.setupEventListeners();

    // Apply initial brightness (0%)
    this.updateBrightnessFilter(100);

    // Camera setup
    this.cameras.main.roundPixels = true;
    this.applyResponsiveCamera(true);
    this.resizeHandler = () => {
      this.applyResponsiveCamera(false);
    };
    this.scale.on("resize", this.resizeHandler);

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

  private applyResponsiveCamera(initial: boolean): void {
    const width = this.scale.width;
    const height = this.scale.height;
    const shortest = Math.min(width, height);

    let zoom = 1;
    if (width < 640) {
      zoom = 0.52;
    } else if (width < 900) {
      zoom = 0.66;
    } else if (width < 1280) {
      zoom = 0.8;
    } else {
      zoom = 0.9;
    }

    if (shortest < 500) {
      zoom *= 0.92;
    }

    this.cameras.main.setZoom(zoom);

    if (initial) {
      this.cameras.main.centerOn(this.BIOME_WIDTH / 2, this.MAP_HEIGHT / 2);
    }
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
      { name: "Objects_Shadows", key: "Shadow_Round_16x16_Flat_Black" }
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
      const panelX = i * this.BIOME_WIDTH + panelOffsetX;
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
      const shadow = this.add.image(x + 6, y + 16, "Shadow_Round_48x24_Flat_Black");
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
      addShadowedImage(key as string, x as number, y as number, scale as number);
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
    this.createVillageLandmarks(1);
    this.createForestLandmarks(2);
    this.createVillageLandmarks(3);
    this.createVillageLandmarks(4);
    this.createForestLandmarks(5);
    this.createVillageLandmarks(6);
    this.createForestLandmarks(7);
    this.createVillageLandmarks(8);
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
    const shadow = this.add.image(x + 8, y + 14, "Shadow_Round_48x24_Flat_Black");
    shadow.setOrigin(0.5, 0.5);
    shadow.setScale(scale * 0.92);
    shadow.setAlpha(0.22);
    this.midgroundLayer.add(shadow);

    const sprite = this.add.image(x, y, key);
    sprite.setOrigin(0.5, 1);
    sprite.setScale(scale);
    sprite.setAlpha(alpha);
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

  private createForestLandmarks(stageId: number): void {
    const nodes = this.getStageNodes(stageId);
    if (nodes.length === 0) return;

    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    const centerX = (first.x + last.x) / 2;
    const centerY = (first.y + last.y) / 2;

    this.addLandmarkSprite("CityWall_Gate_1", first.x - 110, first.y + 96, 1.4, 0.92);
    this.addLandmarkSprite("Animation_Campfire", centerX, centerY + 165, 0.95);
    this.addLandmarkSprite("Sign_2", centerX + 145, centerY + 148, 1);
    this.addLandmarkSprite("Rock_Brown_1", centerX - 170, centerY + 196, 1.08);
    this.addLandmarkSprite("Rock_Brown_9", centerX + 205, centerY + 212, 1.02);

    nodes.forEach((node, index) => {
      const treeKey = `Tree_Emerald_${(index % 4) + 1}`;
      this.addLandmarkSprite(treeKey, node.x - 118, node.y + 130, 1.15);
      this.addLandmarkSprite(treeKey, node.x + 118, node.y + 120, 1.02, 0.96);
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
      { x: 292, y: 336 },
      { x: 486, y: 286 },
      { x: 720, y: 292 },
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

    const localX = Phaser.Math.Linear(left.x, right.x, t) * this.MAP_PANEL_SCALE;
    const localY = Phaser.Math.Linear(left.y, right.y, t) * this.MAP_PANEL_SCALE;

    return {
      x: biomeOffsetX + localX,
      y: panelOffsetY + localY,
    };
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

    this.currentBrightness = 100;
    this.updateBrightnessFilter(100);

    console.log(
      `[WorldMapScene] Brightness: 100% (Forced) Original: ${finalBrightness.toFixed(2)}% (Base: ${accumulatedBase.toFixed(2)}% + Stage: ${stageLayer.toFixed(2)}%)`,
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

  private getPersonaMarkerPosition(node: CheckpointNode): { x: number; y: number } {
    return {
      x: node.x - 54,
      y: node.y + 38,
    };
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
    const personaTarget = this.getPersonaMarkerPosition(node);

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
        this.persona.moveToPosition(personaTarget.x, personaTarget.y, 1000);
      }
    } else {
      this.cameras.main.centerOn(targetX, targetY);

      // Instantly position persona without animation
      if (this.persona) {
        this.persona.setPosition(personaTarget.x, personaTarget.y);
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
    this.animationLayer.add(this.selectionGlow);
    
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
      this.events.emit("checkpoint_clicked", {
        id: node.checkpointId,
        stage: node.stage,
        checkpoint: node.checkpoint,
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
