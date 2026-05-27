import * as Phaser from "phaser";
import { AssetLoader } from "../utils/asset-loader";
import { CheckpointNode, CheckpointStatus } from "../entities/Checkpoint";
import { Persona, PersonaGender } from "../entities/Persona";
import {
  ContributorCompanion,
  type ContributorData,
} from "../entities/ContributorCompanion";
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
import { gameplayIntegration } from "../integration/gameplayIntegration";
import { getTemplate, type TemplateId } from "@/config/templates";

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
  | "capital"
  | "dungeon";
  colors: {
    sky: number;
    ground: number;
    accent1: number;
    accent2: number;
    path: number;
  };
}

interface StageLayout {
  id: number;
  name: string;
  checkpoints: number;
  monsterName?: string;
}

const VENTURE_STAGE_LAYOUTS: StageLayout[] = VENTURE_STAGES.map((stage) => ({
  id: stage.id,
  name: stage.name,
  checkpoints: stage.checkpoints,
}));

const TEMPLATE_VISUAL_THEME_MAP: Record<
  Exclude<TemplateId, "venture">,
  Array<BiomeConfig["visualTheme"]>
> = {
  academic: ["village", "forest", "mine", "artisan", "crossroads", "capital"],
  lab: [
    "arena",
    "forest",
    "artisan",
    "mine",
    "crossroads",
    "village",
    "capital",
  ],
  creative: ["forest", "village", "arena", "crossroads", "artisan", "harbour"],
};

function hexToColorNumber(hex: string): number {
  return Number.parseInt(hex.replace("#", ""), 16);
}

function buildTemplateBiomeConfigs(templateId: TemplateId): BiomeConfig[] {
  if (templateId === "venture") {
    return BIOME_CONFIGS;
  }

  const template = getTemplate(templateId);
  const visualThemes = TEMPLATE_VISUAL_THEME_MAP[templateId];

  return template.stages.map((stage, index) => {
    const visualTheme = visualThemes[index] ?? "village";
    const background = hexToColorNumber(stage.biomeTheme.bgColor);

    return {
      id: stage.id,
      name: stage.biomeName,
      theme: stage.name,
      visualTheme,
      colors: {
        sky: background,
        ground: stage.biomeTheme.secondaryColor,
        accent1: stage.biomeTheme.primaryColor,
        accent2: stage.biomeTheme.secondaryColor,
        path: stage.biomeTheme.secondaryColor,
      },
    };
  });
}

function buildTemplateStageLayouts(templateId: TemplateId): StageLayout[] {
  if (templateId === "venture") {
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
    return VENTURE_STAGE_LAYOUTS.map((layout, idx) => ({
      ...layout,
      monsterName: miniBossNames[idx] || "Fog of Vagueness",
    }));
  }

  return getTemplate(templateId).stages.map((stage) => ({
    id: stage.id,
    name: stage.name,
    checkpoints: stage.checkpoints,
    monsterName: stage.monster?.name ?? "Anomaly",
  }));
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
    name: "The Deep Mine",
    theme: "Build & Deliver",
    visualTheme: "mine",
    colors: {
      sky: 0x1e1a14,
      ground: 0x2a2218,
      accent1: 0x6b4f28,
      accent2: 0xf97316, // ember orange
      path: 0x2a2218,
    },
  },
  {
    id: 6,
    name: "The Sunken Harbour",
    theme: "Launch",
    visualTheme: "harbour",
    colors: {
      sky: 0x083344,
      ground: 0x0d3d3a,
      accent1: 0x1a6b3a,
      accent2: 0x38bdf8, // ocean blue
      path: 0x1a4f48,
    },
  },
  {
    id: 7,
    name: "The Shadow Crossroads",
    theme: "Iteration",
    visualTheme: "crossroads",
    colors: {
      sky: 0x13082a,
      ground: 0x1e0d40,
      accent1: 0x7c3aed,
      accent2: 0xa78bfa, // lavender
      path: 0x1e0d40,
    },
  },
  {
    id: 8,
    name: "The Citadel",
    theme: "Scale",
    visualTheme: "capital",
    colors: {
      sky: 0x2a1200,
      ground: 0x3a1800,
      accent1: 0xb45309,
      accent2: 0xfbbf24, // golden
      path: 0x5c2800,
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
  private companions: Map<string, ContributorCompanion> = new Map();
  private bosses: Map<string, BossSilhouette>;
  private miniBosses: Map<number, MiniBoss>;
  /** Stages whose mini-boss has already played the retreat animation this session */
  private retreatedStages: Set<number> = new Set();
  /** Stages whose mini-boss defeat animation has already started this session */
  private slainMiniBossStages: Set<number> = new Set();
  /** Checkpoints that have already triggered a mini-boss combat sequence */
  private triggeredBossCheckpoints: Set<string> = new Set();
  private initializedBossTriggers: boolean = false;
  /** Wheel scroll handler reference for cleanup */
  private wheelHandler: ((e: WheelEvent) => void) | null = null;
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
  private lastEmitTime = 0;
  private lastEmitX = 0;
  private lastEmitY = 0;
  private lastEmitVisible = false;

  // Scene layers
  private map!: Phaser.Tilemaps.Tilemap;
  private backgroundLayer!: Phaser.GameObjects.Container;
  private midgroundLayer!: Phaser.GameObjects.Container;
  private environmentalCracksGraphics!: Phaser.GameObjects.Graphics;
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
  private currentTemplateId: TemplateId = "venture";
  private currentStage: number = 1;
  private currentCorruptionLevel: number = 0;
  private completedStages: number = 0;
  private stageTasksCompleted: number = 0;
  private stageTasksTotal: number = 0;
  private activeStages: StageLayout[] = VENTURE_STAGE_LAYOUTS;
  private activeBiomeConfigs: BiomeConfig[] = BIOME_CONFIGS;

  // Event handlers
  private boundHandlers: {
    updateBrightness?: (event: { brightness: number }) => void;
    updateCheckpoints?: (event: { checkpoints: CheckpointState[] }) => void;
    setActiveVenture?: (event: {
      ventureId: string;
      templateId?: TemplateId;
      personaGender: "male" | "female";
      userName?: string;
      userImageUrl?: string;
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
    updateContributors?: (event: { contributors: ContributorData[] }) => void;
    bossCombatRetreat?: (event: { stage: number; checkpoint: number }) => void;
    bossFinalOutcome?: (event: { stage: number; outcome: "slay_gold" | "retreat_permanent" }) => void;
  };

  // Map dimensions
  private TOTAL_CHECKPOINTS = 36;
  private readonly BIOME_WIDTH = 1400;
  private MAP_WIDTH = this.BIOME_WIDTH * 8;
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
  private loadedStages: Set<number> = new Set();
  private phaserTilesets: Phaser.Tilemaps.Tileset[] = [];
  private panelOffsetX = 0;
  private panelOffsetY = 0;
  private objectLayer: Phaser.Tilemaps.ObjectLayer | null = null;
  private latestCheckpointsState: CheckpointState[] | null = null;

  private particleEmitters: Phaser.GameObjects.Particles.ParticleEmitter[] = [];
  private updateHandlers: Array<() => void> = [];
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
    this.configureTemplateWorld("venture");
  }

  private configureTemplateWorld(templateId: TemplateId): void {
    this.currentTemplateId = templateId;
    this.activeStages = buildTemplateStageLayouts(templateId);
    this.activeBiomeConfigs = buildTemplateBiomeConfigs(templateId);
    this.TOTAL_CHECKPOINTS = this.activeStages.reduce(
      (sum, stage) => sum + stage.checkpoints,
      0,
    );
    this.MAP_WIDTH = this.BIOME_WIDTH * this.activeBiomeConfigs.length;
  }

  private initializeWorldLayers(): void {
    this.backgroundLayer = this.add.container(0, 0);
    this.midgroundLayer = this.add.container(0, 0);
    this.environmentalCracksGraphics = this.add.graphics();
    this.gameLayer = this.add.container(0, 0);
    this.animationLayer = this.add.container(0, 0);

    this.backgroundLayer.setDepth(0);
    this.midgroundLayer.setDepth(10);
    this.environmentalCracksGraphics.setDepth(15);
    this.gameLayer.setDepth(20);
    this.animationLayer.setDepth(100);
  }

  private buildWorldForCurrentTemplate(): void {
    // Extend vertical bounds to MAP_HEIGHT + 160 to make the bottom of all map panels fully visible under full zoom
    this.cameras.main.setBounds(0, 0, this.MAP_WIDTH, this.MAP_HEIGHT + 160);
    this.physics.world.setBounds(0, 0, this.MAP_WIDTH, this.MAP_HEIGHT + 160);

    // Initialize loaded stages tracking
    this.loadedStages.clear();

    // 1. Initialize tilemap metadata (load map and tileset imagery, but don't draw layers yet)
    this.initTilemap();

    // 2. Create the snake path and checkpoints (needed on startup so nodes are interactive and persona can be positioned)
    this.createSnakePath();

    // 3. Create the super boss
    this.createSuperBoss();

    // 4. Create global atmospheric effects (clouds, rays, motes, etc.)
    this.createAtmosphericEffects();

    // 5. Force load the current stage (active stage) immediately
    this.loadStage(this.currentStage);

    // 6. Run checkBiomeLoading to check camera proximity immediately
    this.checkBiomeLoading();
  }

  private rebuildWorldForTemplate(): void {
    this.currentAnimation = null;
    this.persona = null;

    this.updateHandlers.forEach((handler) =>
      this.events.off("update", handler),
    );
    this.updateHandlers = [];

    this.backgroundLayer?.destroy(true);
    this.midgroundLayer?.destroy(true);
    this.environmentalCracksGraphics?.destroy();
    this.gameLayer?.destroy(true);
    this.animationLayer?.destroy(true);

    this.checkpointNodes.clear();
    this.bosses.clear();
    this.miniBosses.clear();
    this.biomeContainers.clear();
    this.stageFogOverlays.clear();
    this.residualMarkers.clear();
    this.particleEmitters = [];

    this.initializeWorldLayers();
    this.buildWorldForCurrentTemplate();
    this.applyResponsiveCamera(true);
  }

  preload(): void {
    AssetLoader.preloadAssets(this);
    AssetLoader.createAllTextures(this);
  }

  create(): void {
    // Initialize audio
    audioManager.init();

    // Initialize gameplay integration audio
    gameplayIntegration.initializeAudio();

    // Create scene layers
    this.initializeWorldLayers();

    // Create brightness filter
    const camera = this.cameras.main;
    this.brightnessFilter = camera.postFX.addColorMatrix();
    AssetLoader.createPersonaAnimations(this);

    // Build world for current template (defaults to Venture until venture data arrives)
    this.buildWorldForCurrentTemplate();

    // Set up event listeners
    this.setupEventListeners();

    // Apply full brightness (100%) - no darkness
    this.updateBrightnessFilter(100);

    // Camera setup with responsive zoom
    this.cameras.main.roundPixels = true;
    this.applyResponsiveCamera(true);
    this.resizeHandler = () => {
      this.applyResponsiveCamera(false);
    };
    this.scale.on("resize", this.resizeHandler);

    // Device capabilities
    // NOTE: navigator.maxTouchPoints > 0 is unreliable — Chrome/Edge on Windows
    // reports 5 even on non-touch desktops. Use only "ontouchstart" in window for
    // real touch detection (pinch-to-zoom). Drag and wheel work on ALL devices.
    const hasTouchScreen = "ontouchstart" in window;
    const isMobile = this.scale.width < 768;
    const isTablet = this.scale.width >= 768 && this.scale.width < 1024;

    // ── 1. Audio unlock on first pointer interaction ──────────────────────────
    this.input.on("pointerdown", () => {
      audioManager.unlock();
    });

    // ── 2. Click-and-drag scroll (mouse OR touch — all devices) ──────────────
    let isDragging = false;
    let dragVelocityX = 0;
    let dragVelocityY = 0;

    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      isDragging = true;
      dragVelocityX = 0;
      dragVelocityY = 0;
      this.registry.set("dragStartX", this.cameras.main.scrollX);
      this.registry.set("dragStartY", this.cameras.main.scrollY);
      this.registry.set("pointerStartX", pointer.x);
      this.registry.set("pointerStartY", pointer.y);
      this.registry.set("lastPointerX", pointer.x);
      this.registry.set("lastPointerY", pointer.y);
    });

    this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      if (pointer.isDown && isDragging) {
        const dragStartX =
          this.registry.get("dragStartX") || this.cameras.main.scrollX;
        const dragStartY =
          this.registry.get("dragStartY") || this.cameras.main.scrollY;
        const pointerStartX = this.registry.get("pointerStartX") || pointer.x;
        const pointerStartY = this.registry.get("pointerStartY") || pointer.y;
        const lastPointerX = this.registry.get("lastPointerX") || pointer.x;
        const lastPointerY = this.registry.get("lastPointerY") || pointer.y;

        const dragSensitivity = isMobile ? 1.15 : isTablet ? 1.05 : 1.0;
        const deltaX =
          ((pointerStartX - pointer.x) / this.cameras.main.zoom) *
          dragSensitivity;
        const deltaY =
          ((pointerStartY - pointer.y) / this.cameras.main.zoom) *
          dragSensitivity;

        dragVelocityX = (lastPointerX - pointer.x) * dragSensitivity;
        dragVelocityY = (lastPointerY - pointer.y) * dragSensitivity;

        this.cameras.main.scrollX = dragStartX + deltaX;
        this.cameras.main.scrollY = dragStartY + deltaY;

        this.registry.set("lastPointerX", pointer.x);
        this.registry.set("lastPointerY", pointer.y);
      }
    });

    this.input.on("pointerup", () => {
      isDragging = false;
      // Momentum on mobile / tablet only (feels unnatural on desktop mouse)
      if (
        (isMobile || isTablet) &&
        (Math.abs(dragVelocityX) > 2 || Math.abs(dragVelocityY) > 2)
      ) {
        this.tweens.add({
          targets: this.cameras.main,
          scrollX: this.cameras.main.scrollX + dragVelocityX * 3,
          scrollY: this.cameras.main.scrollY + dragVelocityY * 3,
          duration: 400,
          ease: "Cubic.easeOut",
        });
      }
    });

    // ── 3. Mouse-wheel / trackpad scroll (all devices) ────────────────────────
    //   • Vertical wheel   → scrolls map LEFT / RIGHT (primary axis)
    //   • Horizontal swipe → scrolls map LEFT / RIGHT (trackpad two-finger)
    //   • Shift + wheel    → scrolls map UP / DOWN
    this.wheelHandler = (e: WheelEvent) => {
      e.preventDefault();
      const zoom = this.cameras.main.zoom;
      const scrollSpeed = 1.5;

      if (e.shiftKey) {
        this.cameras.main.scrollY += (e.deltaY / zoom) * scrollSpeed;
      } else {
        this.cameras.main.scrollX +=
          ((e.deltaX + e.deltaY) / zoom) * scrollSpeed;
      }
    };
    this.game.canvas.addEventListener("wheel", this.wheelHandler, {
      passive: false,
    });

    // ── 4. Pinch-to-zoom (real touchscreens only) ─────────────────────────────
    if (hasTouchScreen) {
      let initialDistance = 0;
      let initialZoom = 1;

      this.input.on("pointerdown", () => {
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
            const newZoom = Phaser.Math.Clamp(initialZoom * scale, 0.25, 1.8);
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
    const devicePixelRatio = window?.devicePixelRatio ?? 1;

    // ── Device categories ────────────────────────────────────────────────────
    const isSmallMobile = width < 480;
    const isMobile = width >= 480 && width < 768;
    const isTabletPortrait = width >= 768 && width < 1024 && isPortrait;
    const isTabletLandscape = width >= 768 && width < 1024 && !isPortrait;
    const isSmallDesktop = width >= 1024 && width < 1440;
    const isMediumDesktop = width >= 1440 && width < 1920;
    const isLargeDesktop = width >= 1920 && width < 2560;
    const is4KDisplay = width >= 2560;

    // ── Step 1 — Compute the "perfect fit" zoom for width AND height ─────────
    // Fit one stage (BIOME_WIDTH) horizontally with a comfortable side margin.
    const hMargin = isSmallMobile ? 0.88 : isMobile ? 0.9 : 0.93;
    const fitZoomW = (width * hMargin) / this.BIOME_WIDTH;

    // Fit the full rendered panel height (tiles * scale) vertically with margin.
    const panelH = this.map.heightInPixels * this.MAP_PANEL_SCALE;
    const vMargin = isSmallMobile
      ? 0.82
      : isMobile
        ? 0.85
        : isPortrait
          ? 0.88
          : 0.92;
    const fitZoomH = (height * vMargin) / panelH;

    // The base zoom is the smaller of the two fits — guarantees nothing is cut.
    let zoom = Math.min(fitZoomW, fitZoomH);

    // ── Step 2 — Per-device fine-tuning nudges ───────────────────────────────
    if (is4KDisplay) {
      // 4 K / ultra-HD monitors — map can afford to be slightly larger.
      zoom *= 1.1;
    } else if (isLargeDesktop) {
      zoom *= 1.05;
    } else if (isMediumDesktop) {
      zoom *= 1.0; // perfect fit, no nudge
    } else if (isSmallDesktop) {
      zoom *= 0.97; // tiny inset so stage label is visible
    } else if (isTabletLandscape) {
      zoom *= 0.95;
    } else if (isTabletPortrait) {
      zoom *= 0.9;
    } else if (isMobile) {
      zoom *= isPortrait ? 0.88 : 0.92;
    } else if (isSmallMobile) {
      zoom *= isPortrait ? 0.82 : 0.86;
    }

    // ── Step 3 — Aspect-ratio corrections ───────────────────────────────────
    if (aspectRatio < 0.55) {
      // Very narrow portrait (phone held upright) — compress a touch more.
      zoom *= 0.88;
    } else if (aspectRatio > 2.2) {
      // Ultra-wide monitors — a bit of extra zoom looks great.
      zoom *= 1.06;
    }

    // ── Step 4 — HiDPI / Retina correction ──────────────────────────────────
    // On retina screens CSS pixels are already doubled, so no extra scaling is
    // needed. But if somehow the game renders at physical resolution, pull back.
    if (devicePixelRatio >= 3) {
      zoom *= 0.95;
    }

    // Ensure that the visible world width is at most BIOME_WIDTH to prevent neighboring stages from bleeding in.
    const minZoomToFitStage = width / this.BIOME_WIDTH;
    if (zoom < minZoomToFitStage) {
      zoom = minZoomToFitStage;
    }

    // ── Step 5 — Hard clamp to safe range (increased max zoom to 3.0 to support QHD/4K) ───────────────────────────────────
    zoom = Phaser.Math.Clamp(zoom, 0.28, 3.0);

    // ── Step 6 — Compute camera target ──────────────────────────────────────
    const activeNode = this.getCurrentActiveCheckpointNode();
    const stageCenterX =
      (this.currentStage - 1) * this.BIOME_WIDTH + this.BIOME_WIDTH / 2;
    const stageCenterY = this.MAP_HEIGHT / 2;

    // Apply bounds for the current stage
    this.updateCameraBoundsForStage(this.currentStage);

    const { x: targetX, y: targetY } = this.getStageCameraTarget(
      this.currentStage,
      activeNode?.x ?? stageCenterX,
      activeNode?.y ?? stageCenterY,
      zoom,
    );

    // ── Step 7 — Apply zoom + center on current stage ────────────────────────
    if (initial) {
      this.cameras.main.setZoom(zoom);
      this.cameras.main.centerOn(targetX, targetY);
    } else {
      this.tweens.killTweensOf(this.cameras.main);
      this.tweens.add({
        targets: this.cameras.main,
        zoom,
        duration: 320,
        ease: "Sine.easeInOut",
      });
      this.cameras.main.pan(targetX, targetY, 320, "Sine.easeInOut", false);
    }

    // ── Step 8 — Publish values for React UI ────────────────────────────────
    this.registry.set("cameraZoom", zoom);
    this.registry.set("isMobile", isSmallMobile || isMobile);
    this.registry.set("isTablet", isTabletPortrait || isTabletLandscape);
    this.registry.set(
      "isDesktop",
      isSmallDesktop || isMediumDesktop || isLargeDesktop || is4KDisplay,
    );
  }

  /**
   * Creates all 8 biome visual zones left to right
   */
  /**
   * Initializes the Tiled map metadata (loads tilesets)
   */
  private initTilemap(): void {
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

    this.phaserTilesets = tilesetMapping
      .map((tileset) => this.map.addTilesetImage(tileset.name, tileset.key))
      .filter(
        (tileset): tileset is Phaser.Tilemaps.Tileset => tileset !== null,
      );

    const scale = this.MAP_PANEL_SCALE;
    const panelWidth = this.map.widthInPixels * scale;
    const panelHeight = this.map.heightInPixels * scale;
    this.panelOffsetX = (this.BIOME_WIDTH - panelWidth) / 2;
    this.panelOffsetY = this.MAP_HEIGHT - panelHeight + 120;
    this.objectLayer = this.map.getObjectLayer("Object Layer 1");
  }

  /**
   * Lazily loads the tile panel for stage index i (0-based)
   */
  private loadStageTilePanel(i: number): void {
    const biome = this.activeBiomeConfigs[i];
    if (!biome) return;

    const scale = this.MAP_PANEL_SCALE;
    const panelX = i * this.BIOME_WIDTH + this.panelOffsetX;
    const panelOffsetY = this.panelOffsetY;
    const phaserTilesets = this.phaserTilesets;
    const layerNames = [
      "Ground",
      "Flowers",
      "Road",
      "RockSlopes",
      "RockSlopes_Auto",
      "Water",
      "Shadows",
    ];

    if (biome.visualTheme === "forest") {
      this.createForestTilePanel(panelX, panelOffsetY, scale, biome, i);
      return;
    }
    if (biome.visualTheme === "arena") {
      this.createArenaTilePanel(panelX, panelOffsetY, scale, biome, i);
      return;
    }
    if (biome.visualTheme === "artisan") {
      this.createArtisanTilePanel(panelX, panelOffsetY, scale, biome, i);
      return;
    }
    if (biome.visualTheme === "mine") {
      this.createMineTilePanel(panelX, panelOffsetY, scale, biome, i);
      return;
    }
    if (biome.visualTheme === "harbour") {
      this.createHarbourTilePanel(panelX, panelOffsetY, scale, biome, i);
      return;
    }
    if (biome.visualTheme === "crossroads") {
      this.createCrossroadsTilePanel(panelX, panelOffsetY, scale, biome, i);
      return;
    }
    if (biome.visualTheme === "capital") {
      this.createCapitalTilePanel(panelX, panelOffsetY, scale, biome, i);
      return;
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

    if (this.objectLayer) {
      this.renderMapObjects(this.objectLayer.objects, panelX, panelOffsetY, scale);
    }
  }

  /**
   * Lazily loads the background and label for stage index i (0-based)
   */
  private loadStageBiomeBackgroundAndLabel(i: number): void {
    const biome = this.activeBiomeConfigs[i];
    if (!biome) return;

    const container = this.add.container(i * this.BIOME_WIDTH, 0);
    this.biomeContainers.set(biome.id, container);
    this.backgroundLayer.add(container);

    // Draw biome background
    this.drawBiomeBackground(container, biome);

    // Add biome label
    this.addBiomeLabel(container, biome);
  }

  /**
   * Lazily loads stage-specific landmarks
   */
  private loadStageLandmarks(stageId: number): void {
    if (this.currentTemplateId === "venture") {
      if (stageId === 1) this.createVillageLandmarks(1);
      else if (stageId === 2) this.createForestLandmarks(2);
      else if (stageId === 3) this.createArenaLandmarks(3);
      else if (stageId === 4) this.createArtisanLandmarks(4);
      else if (stageId === 5) this.createMineLandmarks(5);
      else if (stageId === 6) this.createHarbourLandmarks(6);
      else if (stageId === 7) this.createCrossroadsLandmarks(7);
      else if (stageId === 8) this.createCapitalLandmarks(8);
      return;
    }

    // Custom templates: Academic, Lab, Creative maps mapped dynamically
    const biome = this.activeBiomeConfigs[stageId - 1];
    if (biome) {
      const visualTheme = biome.visualTheme;
      if (visualTheme === "village") {
        this.createVillageLandmarks(stageId);
      } else if (visualTheme === "forest") {
        this.createForestLandmarks(stageId);
      } else if (visualTheme === "arena") {
        this.createArenaLandmarks(stageId);
      } else if (visualTheme === "artisan") {
        this.createArtisanLandmarks(stageId);
      } else if (visualTheme === "mine") {
        this.createMineLandmarks(stageId);
      } else if (visualTheme === "harbour") {
        this.createHarbourLandmarks(stageId);
      } else if (visualTheme === "crossroads") {
        this.createCrossroadsLandmarks(stageId);
      } else if (visualTheme === "capital") {
        this.createCapitalLandmarks(stageId);
      }
    }
  }

  /**
   * Lazily creates the mini-boss for a specific stage if not already slain
   */
  private createMiniBossForStage(stageId: number): void {
    if (this.slainMiniBossStages.has(stageId)) return;
    const stage = this.activeStages.find((s) => s.id === stageId);
    if (!stage) return;

    // Place mini-boss at the end of each stage
    let globalIndex = 0;
    for (let s = 0; s < stage.id - 1; s++) {
      globalIndex += this.activeStages[s].checkpoints;
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
      bossType: (stage.monsterName || "Fog of Vagueness") as MiniBossType,
      stage: stage.id,
      x: pos.x + offsetX,
      y: pos.y + offsetY,
    });

    this.miniBosses.set(stage.id, miniBoss);
    this.gameLayer.add(miniBoss);
  }

  /**
   * Loads a stage dynamically (called on startup and as camera approaches)
   */
  private loadStage(stageId: number): void {
    if (this.loadedStages.has(stageId)) return;
    const i = stageId - 1;
    if (i < 0 || i >= this.activeBiomeConfigs.length) return;

    this.loadedStages.add(stageId);

    // 1. Draw biome background and label
    this.loadStageBiomeBackgroundAndLabel(i);

    // 2. Load stage tile panel
    this.loadStageTilePanel(i);

    // 3. Load stage landmarks
    this.loadStageLandmarks(stageId);

    // 4. Create stage mini-boss
    this.createMiniBossForStage(stageId);

    // 5. Update the new mini-boss state if checkpoints have been loaded
    if (this.latestCheckpointsState) {
      this.updateMiniBossProgress(this.latestCheckpointsState);
    }
  }

  /**
   * Checks the camera scroll position and loads stages that are near the view
   */
  private checkBiomeLoading(): void {
    const cam = this.cameras.main;
    const camX = cam.scrollX + cam.width / 2;
    const loadBuffer = 2000; // Load buffer zone around the camera center

    for (let i = 0; i < this.activeBiomeConfigs.length; i++) {
      const stageId = i + 1;
      if (this.loadedStages.has(stageId)) {
        continue;
      }

      const stageCenterX = i * this.BIOME_WIDTH + this.BIOME_WIDTH / 2;
      const distance = Math.abs(camX - stageCenterX);

      if (distance < loadBuffer) {
        this.loadStage(stageId);
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
    if (this.currentTemplateId === "venture" && biome.id === 2) {
      this.createVentureStageTwoForestPanel(panelX, panelOffsetY, scale);
      return;
    }

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

  private createVentureStageTwoForestPanel(
    panelX: number,
    panelOffsetY: number,
    scale: number,
  ): void {
    const tileSize = 16 * scale;
    const cols = this.map.width;
    const rows = this.map.height;
    const panelW = cols * tileSize;
    const panelH = rows * tileSize;
    const grassFrames = [0, 3, 12, 13, 14, 23, 24, 33, 34, 44, 55, 66];
    const grassAccentFrames = [7, 8, 18, 19, 41, 42, 63, 64, 75];
    const pathFrames = [0, 1, 4, 5, 10, 11, 12, 15];
    const treeKeys = [
      "Tree_Emerald_1",
      "Tree_Emerald_2",
      "Tree_Emerald_3",
      "Tree_Emerald_4",
    ];
    const shrubFrames = [27, 28, 29, 30, 31, 32];
    const plantFrames = [0, 1, 2, 3, 4, 5, 7, 8, 10, 11];
    const flowerFrames = [3, 4, 5, 6, 7, 14, 15, 16, 17];
    const dirtPatches: Array<{
      cx: number;
      cy: number;
      rx: number;
      ry: number;
    }> = [
      { cx: -1.8, cy: 4.2, rx: 4.8, ry: 6.2 },
      { cx: 5.2, cy: 0.5, rx: 3.6, ry: 3.4 },
      { cx: 16.5, cy: 0.2, rx: 3.2, ry: 2.9 },
      { cx: 28.8, cy: 2.2, rx: 4.1, ry: 4.2 },
      { cx: 39.2, cy: 7.4, rx: 3.7, ry: 4.8 },
      { cx: 4.0, cy: 23.6, rx: 4.4, ry: 5.4 },
      { cx: 13.2, cy: 29.0, rx: 2.4, ry: 3.6 },
      { cx: 20.2, cy: 28.4, rx: 3.6, ry: 4.1 },
      { cx: 28.2, cy: 24.0, rx: 3.5, ry: 3.8 },
      { cx: 34.2, cy: 33.6, rx: 3.3, ry: 4.2 },
      { cx: 5.0, cy: 38.5, rx: 5.0, ry: 3.2 },
      { cx: 23.4, cy: 39.4, rx: 4.8, ry: 3.6 },
    ];
    const trail = [
      { x: 1, y: 11 },
      { x: 6, y: 11 },
      { x: 10, y: 11 },
      { x: 10, y: 14 },
      { x: 16, y: 14 },
      { x: 16, y: 18 },
      { x: 20, y: 18 },
      { x: 20, y: 19 },
      { x: 31, y: 19 },
      { x: 31, y: 22 },
      { x: 36, y: 22 },
      { x: 36, y: 28 },
      { x: 34, y: 28 },
      { x: 34, y: 35 },
      { x: 38, y: 35 },
    ];

    const tileKey = (col: number, row: number) => `${col},${row}`;
    const toX = (col: number) => panelX + col * tileSize;
    const toY = (row: number) => panelOffsetY + row * tileSize;
    const isInside = (col: number, row: number) =>
      col >= 0 && col < cols && row >= 0 && row < rows;

    const addFrameSprite = (
      texture: string,
      frame: number,
      col: number,
      row: number,
      depth: number,
      tint = 0xffffff,
      alpha = 1,
    ) => {
      const tile = this.add.sprite(
        toX(col) + tileSize / 2,
        toY(row) + tileSize / 2,
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

    const addGroundPatch = (
      x: number,
      y: number,
      radiusX: number,
      radiusY: number,
      color: number,
      alpha: number,
    ) => {
      const patch = this.add.graphics();
      patch.setDepth(1.25);
      patch.fillStyle(color, alpha);
      patch.fillEllipse(toX(x), toY(y), radiusX * tileSize, radiusY * tileSize);
      this.backgroundLayer.add(patch);
    };

    const addCanopyTree = (
      key: string,
      col: number,
      row: number,
      treeScale: number,
      alpha = 1,
    ) => {
      const x = toX(col) + tileSize / 2;
      const y = toY(row) + tileSize * 0.95;

      const shadow = this.add.image(
        x + 7,
        y + 11,
        "Shadow_Round_48x24_Flat_Black",
      );
      shadow.setOrigin(0.5, 0.5);
      shadow.setScale(treeScale * 0.9);
      shadow.setAlpha(0.2);
      shadow.setDepth(12);
      this.midgroundLayer.add(shadow);

      const tree = this.add.image(x, y, key);
      tree.setOrigin(0.5, 1);
      tree.setScale(treeScale);
      tree.setAlpha(alpha);
      tree.setDepth(13 + row * 0.01);
      this.midgroundLayer.add(tree);
    };

    const addForestFloorProp = (
      frame: number,
      col: number,
      row: number,
      propScale: number,
      depth: number,
      alpha = 1,
    ) => {
      const sprite = this.add.sprite(
        toX(col) + tileSize / 2,
        toY(row) + tileSize * 0.86,
        "sprout_forest_decor_sheet",
        frame,
      );
      sprite.setOrigin(0.5, 1);
      sprite.setScale(propScale);
      sprite.setAlpha(alpha);
      sprite.setDepth(depth + row * 0.005);
      this.midgroundLayer.add(sprite);
    };

    const patchContains = (col: number, row: number) =>
      dirtPatches.some((patch, index) => {
        const dx = (col + 0.5 - patch.cx) / patch.rx;
        const dy = (row + 0.5 - patch.cy) / patch.ry;
        const roughEdge =
          (((col * 37 + row * 19 + index * 23) % 17) - 8) * 0.018;
        return dx * dx + dy * dy < 1 + roughEdge;
      });

    const pathTiles = new Set<string>();
    trail.forEach(({ x, y }) => {
      for (let oy = -2; oy <= 2; oy += 1) {
        for (let ox = -2; ox <= 2; ox += 1) {
          if (Math.abs(ox) + Math.abs(oy) <= 3 && isInside(x + ox, y + oy)) {
            pathTiles.add(tileKey(x + ox, y + oy));
          }
        }
      }
    });

    const isNearPath = (col: number, row: number, radius = 3) => {
      for (let y = Math.floor(row - radius); y <= Math.ceil(row + radius); y += 1) {
        for (let x = Math.floor(col - radius); x <= Math.ceil(col + radius); x += 1) {
          if (!pathTiles.has(tileKey(x, y))) continue;
          const dx = col - x;
          const dy = row - y;
          if (dx * dx + dy * dy <= radius * radius) return true;
        }
      }
      return false;
    };

    const ground = this.add.graphics();
    ground.fillStyle(0x86c96b, 1);
    ground.fillRect(panelX, panelOffsetY, panelW, panelH);
    ground.setDepth(1);
    this.backgroundLayer.add(ground);

    addGroundPatch(4, 7, 9.5, 12.5, 0x3f7c45, 0.18);
    addGroundPatch(38, 10, 8.5, 11.5, 0x2f6f3e, 0.2);
    addGroundPatch(8, 34, 12, 9, 0x4d8542, 0.18);
    addGroundPatch(28, 34, 10, 9.5, 0x3f7c45, 0.18);
    addGroundPatch(24, 5, 11, 5.5, 0xaadf78, 0.12);
    addGroundPatch(20, 22, 9, 6.5, 0xb9ea88, 0.1);

    const dirtTiles = new Set<string>();
    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        if (patchContains(col, row)) {
          dirtTiles.add(tileKey(col, row));
        }
      }
    }

    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        const key = tileKey(col, row);
        const edgeShade =
          row < 4 || row > rows - 5 || col < 3 || col > cols - 4;
        const forestMass =
          edgeShade ||
          dirtTiles.has(key) ||
          (col < 10 && row > 18) ||
          (col > 29 && row < 14) ||
          (col > 24 && row > 28);

        const grassTint = forestMass
          ? (col + row) % 3 === 0
            ? 0x5eac52
            : 0x6fbb5d
          : (col * 7 + row * 5) % 5 === 0
            ? 0x9ddd72
            : 0x86cf68;

        addFrameSprite(
          "sprout_grass_sheet",
          grassFrames[(col * 11 + row * 3) % grassFrames.length],
          col,
          row,
          2,
          grassTint,
          forestMass ? 0.72 : 0.5,
        );

        if (!isNearPath(col, row, 2.2) && (col * 13 + row * 17) % 8 === 0) {
          addFrameSprite(
            "sprout_grass_sheet",
            grassAccentFrames[(col + row) % grassAccentFrames.length],
            col,
            row,
            3,
            forestMass ? 0x4c9b4c : 0x76b85d,
            forestMass ? 0.55 : 0.46,
          );
        }
      }
    }

    const pathShadow = this.add.graphics();
    pathShadow.setDepth(4);
    pathShadow.fillStyle(0x8e6c46, 0.24);

    const pathBase = this.add.graphics();
    pathBase.setDepth(5);
    pathBase.fillStyle(0xe9c486, 1);

    const pathInner = this.add.graphics();
    pathInner.setDepth(5.2);
    pathInner.fillStyle(0xf4d39a, 0.82);

    const pathEdge = this.add.graphics();
    pathEdge.setDepth(5.4);
    pathEdge.fillStyle(0xcfab70, 0.7);

    const drawSegment = (
      start: { x: number; y: number },
      end: { x: number; y: number },
    ) => {
      const startX = toX(start.x);
      const startY = toY(start.y);
      const endX = toX(end.x);
      const endY = toY(end.y);
      const horizontal = start.y === end.y;
      const minX = Math.min(startX, endX);
      const minY = Math.min(startY, endY);
      const length = horizontal
        ? Math.abs(endX - startX) + tileSize
        : Math.abs(endY - startY) + tileSize;
      const thickness = tileSize * 2.9;
      const innerThickness = tileSize * 2.08;
      const edgeThickness = tileSize * 3.28;

      if (horizontal) {
        const baseY = startY - tileSize * 1.05;
        pathShadow.fillRoundedRect(minX + 8, baseY + 10, length, thickness, 14);
        pathEdge.fillRoundedRect(minX, baseY, length, edgeThickness, 16);
        pathBase.fillRoundedRect(
          minX + tileSize * 0.12,
          baseY + tileSize * 0.12,
          length - tileSize * 0.24,
          thickness - tileSize * 0.24,
          14,
        );
        pathInner.fillRoundedRect(
          minX + tileSize * 0.35,
          baseY + tileSize * 0.35,
          length - tileSize * 0.7,
          innerThickness,
          12,
        );
      } else {
        const baseX = startX - tileSize * 1.05;
        pathShadow.fillRoundedRect(baseX + 8, minY + 10, thickness, length, 14);
        pathEdge.fillRoundedRect(baseX, minY, edgeThickness, length, 16);
        pathBase.fillRoundedRect(
          baseX + tileSize * 0.12,
          minY + tileSize * 0.12,
          thickness - tileSize * 0.24,
          length - tileSize * 0.24,
          14,
        );
        pathInner.fillRoundedRect(
          baseX + tileSize * 0.35,
          minY + tileSize * 0.35,
          innerThickness,
          length - tileSize * 0.7,
          12,
        );
      }
    };

    for (let i = 0; i < trail.length - 1; i += 1) {
      drawSegment(trail[i], trail[i + 1]);
    }

    trail.forEach(({ x, y }) => {
      const cx = toX(x) + tileSize / 2;
      const cy = toY(y) + tileSize / 2;
      pathShadow.fillCircle(cx + 8, cy + 10, tileSize * 1.46);
      pathEdge.fillCircle(cx, cy, tileSize * 1.55);
      pathBase.fillCircle(cx, cy, tileSize * 1.36);
      pathInner.fillCircle(cx, cy, tileSize * 0.96);
    });

    this.backgroundLayer.add(pathShadow);
    this.backgroundLayer.add(pathEdge);
    this.backgroundLayer.add(pathBase);
    this.backgroundLayer.add(pathInner);

    pathTiles.forEach((key) => {
      const [col, row] = key.split(",").map(Number);
      if ((col + row) % 3 !== 0) return;
      addFrameSprite(
        "sprout_paths_sheet",
        pathFrames[(col + row * 3) % pathFrames.length],
        col,
        row,
        5.6,
        0xd7a55f,
        0.12,
      );
    });

    const pathSpeckles = this.add.graphics();
    pathSpeckles.setDepth(5.8);
    pathSpeckles.fillStyle(0xc48f55, 0.34);
    pathTiles.forEach((key) => {
      const [col, row] = key.split(",").map(Number);
      if ((col * 5 + row * 7) % 9 !== 0) return;
      pathSpeckles.fillCircle(
        toX(col) + tileSize * 0.38,
        toY(row) + tileSize * 0.42,
        tileSize * 0.1,
      );
      pathSpeckles.fillCircle(
        toX(col) + tileSize * 0.68,
        toY(row) + tileSize * 0.62,
        tileSize * 0.07,
      );
    });
    this.backgroundLayer.add(pathSpeckles);

    const canopyWash = this.add.graphics();
    canopyWash.setDepth(6.1);
    canopyWash.fillStyle(0x113c25, 0.1);
    canopyWash.fillRect(panelX, panelOffsetY, panelW, tileSize * 4);
    canopyWash.fillRect(panelX, panelOffsetY + panelH - tileSize * 4, panelW, tileSize * 4);
    canopyWash.fillRect(panelX, panelOffsetY, tileSize * 3.2, panelH);
    canopyWash.fillRect(panelX + panelW - tileSize * 3.2, panelOffsetY, tileSize * 3.2, panelH);
    this.backgroundLayer.add(canopyWash);

    [
      [2.0, 5.2, 0, 0.86, 0.96],
      [5.5, 6.4, 1, 0.78, 0.94],
      [9.4, 5.6, 3, 0.78, 0.94],
      [14.8, 5.2, 2, 0.76, 0.92],
      [21.8, 5.6, 0, 0.82, 0.95],
      [27.5, 6.6, 1, 0.76, 0.93],
      [33.4, 5.4, 2, 0.78, 0.94],
      [38.1, 9.2, 3, 0.82, 0.95],
      [2.4, 18.4, 2, 0.78, 0.93],
      [4.8, 22.4, 0, 0.82, 0.95],
      [8.4, 25.6, 1, 0.72, 0.9],
      [2.6, 31.6, 3, 0.86, 0.95],
      [7.8, 35.2, 0, 0.82, 0.95],
      [13.4, 33.8, 2, 0.78, 0.92],
      [18.6, 35.8, 1, 0.74, 0.92],
      [23.6, 33.0, 3, 0.8, 0.94],
      [28.6, 30.8, 0, 0.78, 0.92],
      [30.8, 36.2, 1, 0.82, 0.95],
      [38.3, 37.1, 2, 0.88, 0.95],
    ].forEach(([col, row, keyIndex, treeScale, alpha]) => {
      if (isNearPath(col as number, row as number, 3.1)) return;
      addCanopyTree(
        treeKeys[(keyIndex as number) % treeKeys.length],
        col as number,
        row as number,
        treeScale as number,
        alpha as number,
      );
    });

    for (let row = 6; row < rows - 4; row += 3) {
      for (let col = 4; col < cols - 4; col += 4) {
        if (isNearPath(col, row, 3.1)) continue;
        if ((col * 19 + row * 11) % 5 !== 0) continue;

        addForestFloorProp(
          shrubFrames[(col + row) % shrubFrames.length],
          col + 0.25,
          row + 0.2,
          1.04 + ((col + row) % 3) * 0.08,
          11,
          0.86,
        );
      }
    }

    for (let row = 7; row < rows - 7; row += 2) {
      for (let col = 5; col < cols - 5; col += 3) {
        if (isNearPath(col, row, 2.2)) continue;
        if ((col * 23 + row * 17) % 7 !== 0) continue;

        addFrameSprite(
          "sprout_plants_sheet",
          plantFrames[(col + row) % plantFrames.length],
          col,
          row,
          6,
          0xffffff,
          0.82,
        );

        if ((col + row) % 4 === 0) {
          addFrameSprite(
            "sprout_forest_decor_sheet",
            flowerFrames[(col + row) % flowerFrames.length],
            col + 0.3,
            row + 0.2,
            6.2,
            0xffffff,
            0.8,
          );
        }
      }
    }
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
    const panelW = cols * tileSize;
    const panelH = rows * tileSize;
    const toX = (x: number) => panelX + x * tileSize;
    const toY = (y: number) => panelOffsetY + y * tileSize;
    const centerX = toX(cols / 2);
    const centerY = toY(rows / 2 + 0.8);

    const addProp = (
      texture: string,
      x: number,
      y: number,
      depth: number,
      tint = 0xffffff,
      spriteScale = 1,
    ) => {
      if (!this.textures.exists(texture)) return;
      const sprite = this.add.sprite(toX(x), toY(y), texture);
      sprite.setOrigin(0.5, 1);
      sprite.setScale(scale * spriteScale);
      sprite.setTint(tint);
      sprite.setDepth(depth);
      this.midgroundLayer.add(sprite);
    };

    // Premium coliseum base: restrained crimson stone with gold accents.
    const ground = this.add.graphics();
    ground.fillStyle(0x240b0a, 1);
    ground.fillRect(panelX, panelOffsetY, panelW, panelH);
    ground.setDepth(1);
    this.backgroundLayer.add(ground);

    // Clean checkerboard stone texture, less noisy than the old tile mix.
    const stone = this.add.graphics();
    stone.setDepth(2);
    for (let r = 0; r < rows; r += 1) {
      for (let c = 0; c < cols; c += 1) {
        const shade = (r + c) % 2 === 0 ? 0x2f100d : 0x1c0707;
        stone.fillStyle(shade, 0.74);
        stone.fillRect(toX(c), toY(r), tileSize, tileSize);
      }
    }
    this.backgroundLayer.add(stone);

    // Outer royal boundary wall.
    const wall = this.add.graphics();
    wall.setDepth(3);
    wall.fillStyle(0x120404, 0.86);
    wall.fillRect(panelX, panelOffsetY, panelW, tileSize * 2.2);
    wall.fillRect(
      panelX,
      panelOffsetY + panelH - tileSize * 2.2,
      panelW,
      tileSize * 2.2,
    );
    wall.fillRect(panelX, panelOffsetY, tileSize * 2.2, panelH);
    wall.fillRect(
      panelX + panelW - tileSize * 2.2,
      panelOffsetY,
      tileSize * 2.2,
      panelH,
    );
    // Removed the square strokeRect border to keep the arena floor clean.
    this.backgroundLayer.add(wall);

    // Central elite arena rings.
    const arena = this.add.graphics();
    arena.setDepth(5);
    arena.fillStyle(0x000000, 0.24);
    arena.fillEllipse(centerX + 8, centerY + 16, 620, 370);
    arena.fillStyle(0x3b130d, 1);
    arena.fillEllipse(centerX, centerY, 600, 360);
    arena.fillStyle(0x6f2d18, 1);
    arena.fillEllipse(centerX, centerY, 470, 278);
    arena.fillStyle(0xc17a36, 0.9);
    arena.fillEllipse(centerX, centerY, 330, 194);
    arena.lineStyle(8, 0xf6c76a, 0.72);
    arena.strokeEllipse(centerX, centerY, 600, 360);
    arena.lineStyle(5, 0xffe6a8, 0.46);
    arena.strokeEllipse(centerX, centerY, 470, 278);
    arena.lineStyle(3, 0xfff0c2, 0.38);
    arena.strokeEllipse(centerX, centerY, 230, 132);
    arena.lineStyle(3, 0xfff0c2, 0.34);
    arena.lineBetween(centerX - 165, centerY, centerX + 165, centerY);
    arena.lineBetween(centerX, centerY - 96, centerX, centerY + 96);

    // Radial gilded marks around the combat ring.
    for (let i = 0; i < 24; i += 1) {
      const angle = (Math.PI * 2 * i) / 24;
      const x1 = centerX + Math.cos(angle) * 210;
      const y1 = centerY + Math.sin(angle) * 124;
      const x2 = centerX + Math.cos(angle) * 285;
      const y2 = centerY + Math.sin(angle) * 172;
      arena.lineStyle(i % 4 === 0 ? 4 : 2, 0xf6c76a, i % 4 === 0 ? 0.42 : 0.22);
      arena.lineBetween(x1, y1, x2, y2);
    }
    this.backgroundLayer.add(arena);

    // Tiered spectator stands, kept to the corners so checkpoints stay readable.
    const stands = this.add.graphics();
    stands.setDepth(4.5);
    const standBlocks: Array<[number, number, number, number]> = [
      [5, 5, 8, 7],
      [28, 5, 8, 7],
      [5, 33, 8, 4],
      [28, 33, 8, 4],
    ];
    standBlocks.forEach(([x, y, w, h]) => {
      stands.fillStyle(0x3f1711, 0.92);
      stands.fillRect(toX(x), toY(y), tileSize * w, tileSize * h);
      stands.lineStyle(2, 0x8f5b2e, 0.42);
      for (let row = 0; row < h; row += 1.2) {
        stands.lineBetween(toX(x), toY(y + row), toX(x + w), toY(y + row));
      }
      stands.lineStyle(3, 0xf6c76a, 0.22);
      stands.strokeRect(toX(x), toY(y), tileSize * w, tileSize * h);
    });
    this.backgroundLayer.add(stands);

    // Royal banners positioned as checkpoint anchors.
    // Keep them in the midground so Stage 3 checkpoint nodes render on top.
    const decor = this.add.graphics();
    decor.setDepth(16);
    const bannerWidth = tileSize * 2.3;
    const bannerHeight = tileSize * 1.75;
    const bannerNotch = tileSize * 0.55;
    [
      // x, y, direction: left stands fly right; right stands fly left.
      [5.0, 12.0, 1],
      [36.0, 12.0, -1],
      [5.0, 31.0, 1],
      [36.0, 31.0, -1],
    ].forEach(([x, y, direction]) => {
      const poleX = toX(x);
      const poleY = toY(y);
      const poleWidth = 5;
      const attachmentX = direction === 1 ? poleX + poleWidth : poleX;
      const tipX = attachmentX + bannerWidth * direction;
      const notchX = tipX - bannerNotch * direction;
      const stripeY = poleY + tileSize * 0.64;
      const stripeStartX = direction === 1 ? attachmentX : tipX;

      decor.fillStyle(0xb7792a, 0.98);
      decor.fillRect(poleX, poleY, poleWidth, tileSize * 4.0);
      decor.fillStyle(0xd92626, 0.9);
      decor.fillPoints(
        [
          new Phaser.Geom.Point(attachmentX, poleY),
          new Phaser.Geom.Point(tipX, poleY),
          new Phaser.Geom.Point(notchX, poleY + bannerHeight * 0.5),
          new Phaser.Geom.Point(tipX, poleY + bannerHeight),
          new Phaser.Geom.Point(attachmentX, poleY + bannerHeight),
        ],
        true,
      );
      decor.fillStyle(0xf6c76a, 0.38);
      decor.fillRect(stripeStartX, stripeY, bannerWidth * 0.78, 4);
    });
    this.midgroundLayer.add(decor);

    // Stage hero structure: grounded with a shadow to prevent floating on the arena floor.
    const houseShadow = this.add.ellipse(
      centerX + 8,
      toY(13.4) - 10,
      160,
      50,
      0x000000,
      0.22,
    );
    houseShadow.setDepth(8.5);
    this.midgroundLayer.add(houseShadow);

    addProp("House_Hay_2", cols / 2, 13.4, 9, 0xffd37a, 1.0);
    addProp("LampPost_3", 14.2, 17.2, 10, 0xffd37a, 0.86);
    addProp("LampPost_3", 25.8, 17.2, 10, 0xffd37a, 0.86);
    addProp("LampPost_3", 14.2, 29.4, 10, 0xffd37a, 0.82);
    addProp("LampPost_3", 25.8, 29.4, 10, 0xffd37a, 0.82);
  }

  private createArtisanTilePanel(
    panelX: number,
    panelOffsetY: number,
    scale: number,
    _biome: BiomeConfig,
    _biomeIndex: number,
  ): void {
    void _biome;
    void _biomeIndex;

    const tileSize = 16 * scale;
    const cols = this.map.width;
    const rows = this.map.height;
    const panelW = cols * tileSize;
    const panelH = rows * tileSize;

    const toWorldX = (tileX: number) => panelX + tileX * tileSize;
    const toWorldY = (tileY: number) => panelOffsetY + tileY * tileSize;
    const centerX = toWorldX(cols / 2);

    const addProp = (
      texture: string,
      x: number,
      y: number,
      depth: number,
      tint = 0xffffff,
      spriteScale = 1,
      alpha = 1,
    ) => {
      if (!this.textures.exists(texture)) return;

      const shadow = this.add.image(
        panelX + x * tileSize + 6,
        panelOffsetY + y * tileSize + 9,
        "Shadow_Round_48x24_Flat_Black",
      );
      shadow.setOrigin(0.5, 0.5);
      shadow.setScale(scale * spriteScale * 0.66);
      shadow.setAlpha(0.2 * alpha);
      shadow.setDepth(depth - 1);
      this.midgroundLayer.add(shadow);

      const sprite = this.add.sprite(
        panelX + x * tileSize,
        panelOffsetY + y * tileSize,
        texture,
      );
      sprite.setOrigin(0.5, 1);
      sprite.setScale(scale * spriteScale);
      sprite.setTint(tint);
      sprite.setAlpha(alpha);
      sprite.setDepth(depth);
      this.midgroundLayer.add(sprite);
    };

    // Premium artisan quarter base: deep violet stone with a clean tiled finish.
    const ground = this.add.graphics();
    ground.setDepth(1);
    ground.fillGradientStyle(0x17143b, 0x1c1743, 0x2f2b66, 0x24205a, 1);
    ground.fillRect(panelX, panelOffsetY, panelW, panelH);
    this.backgroundLayer.add(ground);

    const stone = this.add.graphics();
    stone.setDepth(2);
    for (let row = 0; row < rows; row += 2) {
      for (let col = 0; col < cols; col += 2) {
        const alternate = (col / 2 + row / 2) % 2 === 0;
        const shade = alternate ? 0x34306b : 0x29265a;
        stone.fillStyle(shade, alternate ? 0.34 : 0.28);
        stone.fillRect(
          toWorldX(col),
          toWorldY(row),
          tileSize * 2,
          tileSize * 2,
        );
      }
    }
    // Removed the square strokeRect borders to keep the artisan plaza clean.
    this.backgroundLayer.add(stone);

    // Clean plaza network — intentional horizontal/vertical artisan streets,
    // with no random diagonal beams crossing the checkpoint area.
    const plaza = this.add.graphics();
    plaza.setDepth(3);
    const mainStreetY = toWorldY(26.5);
    const upperStreetY = toWorldY(19.4);
    const lowerStreetY = toWorldY(33.2);
    const streetLeft = toWorldX(6.0);
    const streetRight = toWorldX(cols - 6.0);

    plaza.fillStyle(0x46417f, 0.88);
    plaza.fillRoundedRect(
      streetLeft,
      mainStreetY - tileSize,
      streetRight - streetLeft,
      tileSize * 2,
      12,
    );
    plaza.fillRoundedRect(
      centerX - tileSize,
      toWorldY(12.0),
      tileSize * 2,
      toWorldY(35.2) - toWorldY(12.0),
      12,
    );
    plaza.fillStyle(0x332f70, 0.74);
    plaza.fillRoundedRect(
      toWorldX(10.0),
      upperStreetY - tileSize * 0.72,
      tileSize * 20.0,
      tileSize * 1.44,
      10,
    );
    plaza.fillRoundedRect(
      toWorldX(9.0),
      lowerStreetY - tileSize * 0.72,
      tileSize * 22.0,
      tileSize * 1.44,
      10,
    );

    // Central mosaic medallion.
    plaza.fillStyle(0x111033, 0.5);
    plaza.fillEllipse(
      centerX + 8,
      mainStreetY + 12,
      tileSize * 10.4,
      tileSize * 6.2,
    );
    plaza.fillStyle(0x24205b, 0.96);
    plaza.fillEllipse(centerX, mainStreetY, tileSize * 9.6, tileSize * 5.6);
    plaza.lineStyle(5, 0x9ddcff, 0.4);
    plaza.strokeEllipse(centerX, mainStreetY, tileSize * 9.6, tileSize * 5.6);
    plaza.lineStyle(3, 0xffd166, 0.28);
    plaza.strokeEllipse(centerX, mainStreetY, tileSize * 6.4, tileSize * 3.6);
    plaza.lineStyle(2, 0xffffff, 0.14);
    plaza.lineBetween(
      centerX - tileSize * 3.4,
      mainStreetY,
      centerX + tileSize * 3.4,
      mainStreetY,
    );
    plaza.lineBetween(
      centerX,
      mainStreetY - tileSize * 1.8,
      centerX,
      mainStreetY + tileSize * 1.8,
    );

    // Top workshop terrace, kept visually separate from checkpoint markers.
    plaza.fillStyle(0x141238, 0.52);
    plaza.fillRoundedRect(
      toWorldX(13.4),
      toWorldY(6.4),
      tileSize * 13.2,
      tileSize * 7.7,
      18,
    );
    plaza.lineStyle(3, 0xffd166, 0.2);
    plaza.strokeRoundedRect(
      toWorldX(13.4),
      toWorldY(6.4),
      tileSize * 13.2,
      tileSize * 7.7,
      18,
    );

    plaza.lineStyle(2, 0xffd166, 0.16);
    [upperStreetY, mainStreetY, lowerStreetY].forEach((y) => {
      plaza.lineBetween(
        streetLeft + tileSize * 1.2,
        y,
        streetRight - tileSize * 1.2,
        y,
      );
    });
    this.backgroundLayer.add(plaza);

    // Small premium details: tidy corners, not clutter.
    const details = this.add.graphics();
    details.setDepth(4);
    [
      [7.0, 9.0],
      [33.0, 9.0],
      [7.0, 35.0],
      [33.0, 35.0],
    ].forEach(([x, y]) => {
      details.fillStyle(0x0f0d2e, 0.32);
      details.fillRoundedRect(
        toWorldX(x) - tileSize * 1.4,
        toWorldY(y) - tileSize * 1.0,
        tileSize * 2.8,
        tileSize * 2.0,
        8,
      );
      details.lineStyle(2, 0x8fdcff, 0.12);
      details.strokeRoundedRect(
        toWorldX(x) - tileSize * 1.4,
        toWorldY(y) - tileSize * 1.0,
        tileSize * 2.8,
        tileSize * 2.0,
        8,
      );
    });
    this.backgroundLayer.add(details);

    // Hero workshop: grounded on a premium workshop terrace with shadow.
    const houseX = cols / 2;
    const houseY = 13.8;

    const houseShadow = this.add.ellipse(
      toWorldX(houseX) + 8,
      toWorldY(houseY) - 12,
      180,
      60,
      0x000000,
      0.28,
    );
    houseShadow.setDepth(8.5);
    this.midgroundLayer.add(houseShadow);

    addProp("House_Hay_4_Purple", houseX, houseY, 9, 0xa79cff, 1.16);

    // Lamp posts placed strictly on the 4 corner box details.
    addProp("LampPost_3", 7.0, 9.6, 10, 0xd0c8ff, 0.88);
    addProp("LampPost_3", 33.0, 9.6, 10, 0xd0c8ff, 0.88);
    addProp("LampPost_3", 7.0, 35.6, 10, 0xd0c8ff, 0.88);
    addProp("LampPost_3", 33.0, 35.6, 10, 0xd0c8ff, 0.88);
  }

  // ─────────────────────────────────────────────────────────────
  //  HELPER: draw a simple pixel tree (trunk + canopy)
  //  Call after graphics is created, before setDepth
  // ─────────────────────────────────────────────────────────────
  private drawPixelTree(
    g: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    trunkColor: number,
    canopyColor: number,
    shadowColor: number,
    size: number = 1,
  ): void {
    const t = 4 * size; // trunk width
    const th = 6 * size; // trunk height
    const cw = 14 * size; // canopy width
    const ch = 12 * size; // canopy height
    // Pixel shadow under canopy
    g.fillStyle(shadowColor, 0.28);
    g.fillRect(x - (cw + 4) / 2, y - th - size, cw + 4, 3 * size);
    // Trunk
    g.fillStyle(trunkColor, 1);
    g.fillRect(x - t / 2, y - th, t, th);
    // Canopy base (darker)
    g.fillStyle(shadowColor, 0.5);
    g.fillRect(x - cw / 2, y - th - ch + 2, cw, ch);
    // Canopy main
    g.fillStyle(canopyColor, 1);
    g.fillRect(x - cw / 2 + 2, y - th - ch, cw - 4, ch - 2);
    // Canopy highlight (top-left lighter patch)
    g.fillStyle(0xffffff, 0.1);
    g.fillRect(x - cw / 2 + 3, y - th - ch + 1, (cw - 6) / 2, (ch - 4) / 2);
  }

  // ─────────────────────────────────────────────────────────────
  //  HELPER: draw a simple pixel rock
  // ─────────────────────────────────────────────────────────────
  private drawPixelRock(
    g: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    color: number,
    size: number = 1,
  ): void {
    g.fillStyle(color, 0.8);
    g.fillEllipse(x, y, 10 * size, 7 * size);
    g.fillStyle(0xffffff, 0.12);
    g.fillEllipse(x - 2 * size, y - 1 * size, 5 * size, 3 * size);
  }

  // ─────────────────────────────────────────────────────────────
  //  HELPER: draw a fence segment (horizontal rail + posts)
  // ─────────────────────────────────────────────────────────────
  private drawFenceRow(
    g: Phaser.GameObjects.Graphics,
    startX: number,
    y: number,
    width: number,
    postColor: number,
    railColor: number,
    postStep: number = 24,
  ): void {
    // Rails
    g.fillStyle(railColor, 0.75);
    g.fillRect(startX, y + 4, width, 2);
    g.fillRect(startX, y + 9, width, 2);
    // Posts
    for (let px = startX; px < startX + width; px += postStep) {
      g.fillStyle(postColor, 0.9);
      g.fillRect(px - 2, y, 4, 15);
    }
  }

  // ─────────────────────────────────────────────────────────────
  //  STAGE 5 · MINE  —  Enhanced Dark Rocky Mine + Coal Outpost
  //  Ground: Ash-dark soil with coal seams  |  Props: Dead trees, mining carts, pickaxes, lanterns
  //  Mine shaft: Detailed timber frame  |  Atmosphere: Ember sparks, fog, warm lamplight
  // ─────────────────────────────────────────────────────────────
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
    const toX = (x: number) => panelX + x * tileSize;
    const toY = (y: number) => panelOffsetY + y * tileSize;
    const midRow = rows / 2;
    const panelW = cols * tileSize;
    const panelH = rows * tileSize;
    const midY = toY(midRow);

    // ── BASE GROUND: Dark ash soil with subtle coal streaking ────────────────────
    const ground = this.add.graphics();
    ground.fillStyle(0x1a1510, 1);
    ground.fillRect(panelX, panelOffsetY, panelW, panelH);
    // Add coal seam streaks
    ground.fillStyle(0x0d0a08, 0.7);
    for (let x = panelX; x < panelX + panelW; x += tileSize * 3) {
      ground.fillRect(x, panelOffsetY, tileSize * 1.5, panelH);
    }
    ground.setDepth(1);
    this.backgroundLayer.add(ground);

    // ── TILE TEXTURE: Subtle 16×16 grid with ore glints ──
    const tex = this.add.graphics();
    tex.setDepth(2);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const shade = (r + c) % 2 === 0 ? 0x221d16 : 0x1a1510;
        tex.fillStyle(shade, 0.45);
        tex.fillRect(toX(c), toY(r), tileSize, tileSize);
      }
    }
    this.backgroundLayer.add(tex);

    // ── DIRT PATH (horizontal band) with mining cart rails ─────────────────────────
    const path = this.add.graphics();
    path.fillStyle(0x2a2218, 1);
    path.fillRect(panelX, midY - 14, panelW, 28);
    // Cart rail ties with metallic shine
    path.fillStyle(0x3d2e1a, 0.8);
    for (let x = panelX + 8; x < panelX + panelW; x += 22) {
      path.fillRect(x, midY - 10, 14, 4);
      path.fillRect(x, midY + 6, 14, 4);
      // Metallic highlights on ties
      path.fillStyle(0xf59e0b, 0.4);
      path.fillRect(x + 2, midY - 9, 4, 2);
      path.fillRect(x + 2, midY + 7, 4, 2);
    }
    // Rails with metallic gradient
    const railGradient = [0x5a4a2a, 0x7a6a4a, 0x5a4a2a];
    railGradient.forEach((color, i) => {
      path.fillStyle(color, 0.7 - i * 0.1);
      path.fillRect(panelX, midY - 8 + i * 2, panelW, 2);
      path.fillRect(panelX, midY + 6 - i * 2, panelW, 2);
    });
    path.setDepth(4);
    this.backgroundLayer.add(path);

    // ── MINE SHAFT ENTRANCE (left) with detailed timber frame and lanterns ───────────────────
    const shaft = this.add.graphics();
    shaft.setDepth(5);
    // Main shaft structure
    shaft.fillStyle(0x2e2418, 0.95);
    shaft.fillRect(toX(4), toY(midRow - 5), tileSize * 5, tileSize * 4);
    // Dark interior
    shaft.fillStyle(0x080604, 0.95);
    shaft.fillRect(toX(4.6), toY(midRow - 4.5), tileSize * 3.5, tileSize * 3);
    // Timber frame - darker wood
    shaft.fillStyle(0x5a4220, 1);
    shaft.fillRect(toX(4.6), toY(midRow - 4.5), tileSize * 0.5, tileSize * 3);
    shaft.fillRect(toX(7.6), toY(midRow - 4.5), tileSize * 0.5, tileSize * 3);
    shaft.fillRect(toX(4.6), toY(midRow - 4.5), tileSize * 3.5, tileSize * 0.5);
    // Roof support beam
    shaft.fillRect(toX(5.8), toY(midRow - 5), tileSize * 1.9, tileSize * 0.6);
    // Lantern on shaft entrance
    const lanternX = toX(6.5);
    const lanternY = toY(midRow - 6);
    shaft.fillStyle(0xf59e0b, 0.8);
    shaft.fillRect(lanternX - 3, lanternY, 6, 4);
    shaft.fillStyle(0xfbbf24, 0.9);
    shaft.fillCircle(lanternX, lanternY + 2, 2);
    // Lantern glow
    const glow = this.add.circle(lanternX, lanternY - 8, 20, 0xf59e0b, 0.15);
    glow.setDepth(4.5);
    this.midgroundLayer.add(glow);
    this.tweens.add({
      targets: glow,
      alpha: { from: 0.1, to: 0.25 },
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
    this.backgroundLayer.add(shaft);

    // ── TOP FENCE (above path) ───────────────────────────────
    const fenceG = this.add.graphics();
    fenceG.setDepth(5);
    this.drawFenceRow(
      fenceG,
      toX(3),
      midY - 30,
      tileSize * (cols - 6),
      0x6b4f28,
      0x5a3e1e,
      24,
    );
    // ── BOTTOM FENCE ─────────────────────────────────────────
    this.drawFenceRow(
      fenceG,
      toX(3),
      midY + 18,
      tileSize * (cols - 6),
      0x6b4f28,
      0x5a3e1e,
      24,
    );
    this.backgroundLayer.add(fenceG);

    // ── SCATTERED PROPS: Dead trees + rocks + coal lumps + mining equipment ──────
    const props = this.add.graphics();
    props.setDepth(6);

    // Dead trees (bare trunk, grey-brown canopy)
    const deadTreePositions = [
      [6, midRow - 4],
      [11, midRow - 6],
      [18, midRow - 5],
      [34, midRow - 4],
      [40, midRow - 6],
      [46, midRow - 5],
      [8, midRow + 3],
      [14, midRow + 4],
      [30, midRow + 3],
      [38, midRow + 4],
      [44, midRow + 5],
    ];
    deadTreePositions.forEach(([c, r]) => {
      this.drawPixelTree(
        props,
        toX(c),
        toY(r),
        0x4a3520,
        0x3d3028,
        0x1e1810,
        scale,
      );
    });

    // Mining equipment - pickaxes stuck in ground
    [12, 25, 37].forEach((c) => {
      props.fillStyle(0x8b7355, 0.9);
      props.fillRect(toX(c) - 2, toY(midRow - 2), 4, 12);
      props.fillStyle(0xc2b280, 0.9);
      props.fillRect(toX(c) - 8, toY(midRow - 1), 12, 4);
    });

    // Coal/rock lumps
    [
      [9, midRow + 2],
      [22, midRow - 3],
      [28, midRow + 2],
      [36, midRow - 4],
      [42, midRow + 3],
    ].forEach(([c, r]) => {
      this.drawPixelRock(props, toX(c), toY(r), 0x2e2820, scale);
    });

    // Small coal seam glints with animated sparkle
    [
      [12, midRow - 2.5],
      [25, midRow + 1.5],
      [39, midRow - 2],
    ].forEach(([c, r]) => {
      props.fillStyle(0x1a1614, 0.9);
      props.fillRect(toX(c) - 4, toY(r) - 3, 14, 8);
      props.fillStyle(0x3d3428, 0.4);
      props.fillRect(toX(c) - 2, toY(r) - 2, 6, 4);
      // Animated sparkle
      const sparkle = this.add.rectangle(
        toX(c),
        toY(r) - 6,
        3,
        3,
        0xf59e0b,
        0.7,
      );
      sparkle.setDepth(7);
      this.animationLayer.add(sparkle);
      this.tweens.add({
        targets: sparkle,
        alpha: { from: 0.3, to: 0.9 },
        duration: 800 + Math.random() * 400,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    });

    // Lantern posts along the path
    [10, 22, 34, 46].forEach((c) => {
      const lx = toX(c);
      const ly = midY + 4;
      props.fillStyle(0x5a4a3a, 1);
      props.fillRect(lx - 1, ly, 2, 12);
      props.fillStyle(0xf59e0b, 0.8);
      props.fillCircle(lx, ly + 2, 3);
    });

    this.backgroundLayer.add(props);

    // ── SPRITES ───────────────────────────────────────────────
    if (this.textures.exists("House_Hay_3")) {
      const house = this.add.sprite(toX(21), toY(midRow - 5.2), "House_Hay_3");
      house.setOrigin(0.5, 1);
      house.setScale(scale);
      house.setTint(0x9a8870);
      house.setDepth(8);
      this.midgroundLayer.add(house);
    }

    // Mining cart sprite
    if (this.textures.exists("Barrel_Small_Empty")) {
      const cart = this.add.sprite(
        toX(8),
        toY(midRow - 1.5),
        "Barrel_Small_Empty",
      );
      cart.setOrigin(0.5, 1);
      cart.setScale(scale * 0.8);
      cart.setTint(0x5a4a30);
      cart.setAngle(-5);
      cart.setDepth(9);
      this.midgroundLayer.add(cart);
    }

    if (this.textures.exists("LampPost_3")) {
      [16, 26].forEach((cx) => {
        const lp = this.add.sprite(toX(cx), toY(midRow + 1.5), "LampPost_3");
        lp.setOrigin(0.5, 1);
        lp.setScale(scale);
        lp.setTint(0xf59e0b);
        lp.setDepth(9);
        this.midgroundLayer.add(lp);
      });
    }

    // Mine cart tracks extending from shaft
    const tracks = this.add.graphics();
    tracks.setDepth(3.5);
    tracks.lineStyle(3, 0x5a4a2a, 0.8);
    tracks.beginPath();
    tracks.moveTo(toX(9), midY - 10);
    tracks.lineTo(toX(18), midY - 5);
    tracks.strokePath();
    this.midgroundLayer.add(tracks);
  }

  // ─────────────────────────────────────────────────────────────
  //  STAGE 6 · HARBOUR  —  Coastal farm + fishing village
  //  Ground: muted teal-green  |  Props: palm/coastal trees, barrels
  //  Path: sandy boardwalk  |  Water strip at edges
  // ─────────────────────────────────────────────────────────────
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
    const toX = (x: number) => panelX + x * tileSize;
    const toY = (y: number) => panelOffsetY + y * tileSize;
    const midRow = rows / 2;
    const panelW = cols * tileSize;
    const panelH = rows * tileSize;
    const midY = toY(midRow);

    // ── BASE GROUND: coastal green-teal soil ──────────────────
    const ground = this.add.graphics();
    ground.fillStyle(0x0d3d3a, 1);
    ground.fillRect(panelX, panelOffsetY, panelW, panelH);
    ground.setDepth(1);
    this.backgroundLayer.add(ground);

    // ── TILE TEXTURE ──────────────────────────────────────────
    const tex = this.add.graphics();
    tex.setDepth(2);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const shade = (r + c) % 2 === 0 ? 0x0f4440 : 0x0b3835;
        tex.fillStyle(shade, 0.45);
        tex.fillRect(toX(c), toY(r), tileSize, tileSize);
      }
    }
    this.backgroundLayer.add(tex);

    // ── SHALLOW WATER STRIP: top + bottom edges ───────────────
    const water = this.add.graphics();
    water.setDepth(3);
    // Top water band
    water.fillStyle(0x083344, 1);
    water.fillRect(panelX, panelOffsetY, panelW, tileSize * 2.5);
    // Water ripple lines
    water.fillStyle(0x0e5a72, 0.4);
    for (let c = 0; c < cols; c += 5) {
      water.fillRect(
        toX(c),
        panelOffsetY + tileSize * 0.8,
        tileSize * 3,
        tileSize * 0.25,
      );
      water.fillRect(
        toX(c) + tileSize * 1.5,
        panelOffsetY + tileSize * 1.6,
        tileSize * 3,
        tileSize * 0.25,
      );
    }
    // Bottom water band
    water.fillStyle(0x083344, 1);
    water.fillRect(
      panelX,
      panelOffsetY + panelH - tileSize * 2.5,
      panelW,
      tileSize * 2.5,
    );
    water.fillStyle(0x0e5a72, 0.4);
    for (let c = 0; c < cols; c += 5) {
      water.fillRect(
        toX(c),
        panelOffsetY + panelH - tileSize * 1.8,
        tileSize * 3,
        tileSize * 0.25,
      );
    }
    // Sandy shore transitions
    water.fillStyle(0x1a5c42, 0.6);
    water.fillRect(panelX, panelOffsetY + tileSize * 2.5, panelW, tileSize * 1);
    water.fillRect(
      panelX,
      panelOffsetY + panelH - tileSize * 3.5,
      panelW,
      tileSize * 1,
    );
    this.backgroundLayer.add(water);

    // ── DIRT PATH: sandy boardwalk ────────────────────────────
    const path = this.add.graphics();
    path.fillStyle(0x1a4f48, 1);
    path.fillRect(panelX, midY - 14, panelW, 28);
    // Plank grain lines
    path.fillStyle(0x1e5e56, 0.4);
    for (let x = panelX; x < panelX + panelW; x += tileSize * 2) {
      path.fillRect(x, midY - 14, tileSize * 0.18, 28);
    }
    path.fillStyle(0x38bdf8, 0.08);
    path.fillRect(panelX, midY - 15, panelW, 2);
    path.fillRect(panelX, midY + 13, panelW, 2);
    path.setDepth(4);
    this.backgroundLayer.add(path);

    // ── WOODEN DOCK (left portion) ────────────────────────────
    const dock = this.add.graphics();
    dock.setDepth(5);
    dock.fillStyle(0x7c4a1e, 0.85);
    dock.fillRect(panelX, midY - 18, tileSize * 8, 36);
    dock.fillStyle(0x5a3412, 0.4);
    for (let c = 0; c < 8; c += 1.2) {
      dock.fillRect(toX(c), midY - 18, tileSize * 0.1, 36);
    }
    // Dock posts
    [1.5, 4, 6.5].forEach((cx) => {
      dock.fillStyle(0x6b3d12, 1);
      dock.fillRect(toX(cx), midY + 18, tileSize * 0.6, tileSize * 2.5);
    });
    this.backgroundLayer.add(dock);

    // ── BOAT SILHOUETTE (right side) ─────────────────────────
    const boat = this.add.graphics();
    boat.setDepth(5);
    boat.fillStyle(0x0e3a4f, 0.85);
    boat.fillRect(toX(35), midY - 8, tileSize * 9, tileSize * 2.2);
    // hull bottom
    boat.fillStyle(0x082a3a, 0.9);
    boat.fillRect(
      toX(35.5),
      midY + tileSize * 1.8,
      tileSize * 8,
      tileSize * 0.5,
    );
    // mast
    boat.fillStyle(0x4a3520, 1);
    boat.fillRect(
      toX(39.2),
      midY - tileSize * 6,
      tileSize * 0.35,
      tileSize * 6,
    );
    // sail
    boat.fillStyle(0xbae6fd, 0.1);
    boat.fillRect(
      toX(39.55),
      midY - tileSize * 5.5,
      tileSize * 3.5,
      tileSize * 4,
    );
    this.backgroundLayer.add(boat);

    // ── TOP FENCE ─────────────────────────────────────────────
    const fenceG = this.add.graphics();
    fenceG.setDepth(5);
    this.drawFenceRow(
      fenceG,
      toX(3),
      midY - 30,
      tileSize * (cols - 6),
      0x4a7a50,
      0x3a6040,
      24,
    );
    this.drawFenceRow(
      fenceG,
      toX(3),
      midY + 18,
      tileSize * (cols - 6),
      0x4a7a50,
      0x3a6040,
      24,
    );
    this.backgroundLayer.add(fenceG);

    // ── SCATTERED PROPS: coastal trees + barrels ───────────────
    const props = this.add.graphics();
    props.setDepth(6);

    // Coastal green trees
    [
      [5, midRow - 4],
      [10, midRow - 6],
      [17, midRow - 5],
      [32, midRow - 4],
      [39, midRow - 6],
      [45, midRow - 4],
      [7, midRow + 3],
      [13, midRow + 5],
      [29, midRow + 3],
      [37, midRow + 4],
      [44, midRow + 5],
    ].forEach(([c, r]) => {
      this.drawPixelTree(
        props,
        toX(c),
        toY(r),
        0x5c3a1a,
        0x1a6b3a,
        0x0f3d22,
        scale,
      );
    });

    // Barrels (small squat rectangles)
    [
      [9, midRow - 2],
      [11, midRow - 2.5],
      [28, midRow + 2],
      [33, midRow - 3],
    ].forEach(([c, r]) => {
      props.fillStyle(0x7c4a1e, 0.9);
      props.fillRect(toX(c) - 4, toY(r) - 8, 10, 10);
      props.fillStyle(0xd97706, 0.5);
      props.fillRect(toX(c) - 4, toY(r) - 5, 10, 2);
      props.fillRect(toX(c) - 4, toY(r) - 1, 10, 2);
    });

    // Water shimmer dots
    [
      [8, midRow - 1.5],
      [20, midRow + 1],
      [35, midRow - 1],
    ].forEach(([c, r]) => {
      props.fillStyle(0x38bdf8, 0.18);
      props.fillEllipse(toX(c), toY(r), 18, 6);
    });
    this.backgroundLayer.add(props);

    // ── SPRITES ───────────────────────────────────────────────
    if (this.textures.exists("House_Hay_1")) {
      const house = this.add.sprite(toX(21), toY(midRow - 5.2), "House_Hay_1");
      house.setOrigin(0.5, 1);
      house.setScale(scale);
      house.setTint(0x7dd3fc);
      house.setDepth(8);
      this.midgroundLayer.add(house);
    }
    if (this.textures.exists("LampPost_3")) {
      [16, 26].forEach((cx) => {
        const lp = this.add.sprite(toX(cx), toY(midRow + 1.5), "LampPost_3");
        lp.setOrigin(0.5, 1);
        lp.setScale(scale);
        lp.setTint(0xbae6fd);
        lp.setDepth(9);
        this.midgroundLayer.add(lp);
      });
    }
  }

  // ─────────────────────────────────────────────────────────────
  //  STAGE 7 · CROSSROADS  —  Enhanced Twilight Town
  //  Rich tilemap with houses, gardens, trees, flowers, and decorations
  //  Ground: twilight violet  |  Path: crossroads  |  Props: full town
  // ─────────────────────────────────────────────────────────────

  private createCrossroadsTilePanel(
    panelX: number,
    panelOffsetY: number,
    scale: number,
    biome: BiomeConfig,
    biomeIndex: number,
  ): void {
    const TILE_SIZE = 16 * scale;
    const COLS = this.map.width;
    const ROWS = this.map.height;
    const midRow = Math.floor(ROWS / 2);
    const midCol = Math.floor(COLS / 2);

    // Spectacular warm sunset orange & golden autumn theme
    const COLORS = {
      sky: 0x240f03, // Deepest velvety rich dark amber/chocolate
      ground: 0x2d1304, // Warm amber-brown ground
      groundAlt: 0x291103, // Slightly darker amber-brown
      grass: 0x451a03, // Warm autumn auburn/dark orange grass
      grassDark: 0x1c0700, // Deep autumn grass shadow
      path: 0x4a2708, // Sophisticated dark golden paths
      pathEdge: 0xb45309, // Glowing amber edges for paths
      accent: 0xd97706, // Vibrant amber/orange highlight
      highlight: 0xf59e0b, // Soft golden/orange glows
      glow: 0xfef08a, // Soft warm gold ambient light
      tree: 0x5c2b03, // Mystical dark redwood canopy
      treeDark: 0x271000, // Deep redwood shadow
      flower: 0xf97316, // Vibrant orange sunset flower
      flowerGlow: 0xffedd5, // Soft warm cream/peach glow
    };

    // Check if external tileset is loaded (optional enhancement)
    const hasExternalTileset = this.textures.exists("stage7-tileset");

    if (hasExternalTileset) {
      this.createCrossroadsWithExternalTileset(
        panelX,
        panelOffsetY,
        scale,
        TILE_SIZE,
        COLS,
        ROWS,
        COLORS,
      );
    } else {
      // Enhanced version with more details
      this.createEnhancedCrossroadsTown(
        panelX,
        panelOffsetY,
        scale,
        TILE_SIZE,
        COLS,
        ROWS,
        midRow,
        midCol,
        COLORS,
      );
    }
  }

  private createCrossroadsWithExternalTileset(
    panelX: number,
    panelOffsetY: number,
    scale: number,
    tileSize: number,
    cols: number,
    rows: number,
    colors: Record<string, number>,
  ): void {
    // Create tiled background using external tileset
    const tilemap = this.add.tileSprite(
      panelX,
      panelOffsetY,
      cols * tileSize,
      rows * tileSize,
      "stage7-tileset",
    );
    tilemap.setOrigin(0, 0);
    tilemap.setTint(colors.glow);
    tilemap.setDepth(1);
    this.backgroundLayer.add(tilemap);

    // Add crossroads paths
    const midRow = Math.floor(rows / 2);
    const midCol = Math.floor(cols / 2);

    // Horizontal road
    const hRoad = this.add.rectangle(
      panelX + (cols * tileSize) / 2,
      panelOffsetY + midRow * tileSize,
      cols * tileSize,
      tileSize * 3,
      colors.ground,
      1,
    );
    hRoad.setDepth(2);
    this.backgroundLayer.add(hRoad);

    // Vertical road
    const vRoad = this.add.rectangle(
      panelX + midCol * tileSize,
      panelOffsetY + (rows * tileSize) / 2,
      tileSize * 3,
      rows * tileSize,
      colors.ground,
      1,
    );
    vRoad.setDepth(2);
    this.backgroundLayer.add(vRoad);

    // Add buildings if available
    if (this.textures.exists("stage7-buildings")) {
      const buildingPositions = [
        { x: 5, y: 10 },
        { x: 15, y: 8 },
        { x: 25, y: 12 },
      ];

      buildingPositions.forEach((pos) => {
        const building = this.add.sprite(
          panelX + pos.x * tileSize,
          panelOffsetY + pos.y * tileSize,
          "stage7-buildings",
        );
        building.setOrigin(0.5, 1);
        building.setScale(scale);
        building.setTint(colors.glow);
        building.setDepth(8);
        this.midgroundLayer.add(building);
      });
    }

    // Intersection marker
    const marker = this.add.circle(
      panelX + midCol * tileSize,
      panelOffsetY + midRow * tileSize,
      tileSize * 0.8,
      colors.accent,
      0.5,
    );
    marker.setDepth(3);
    this.backgroundLayer.add(marker);
  }

  private createEnhancedCrossroadsTown(
    panelX: number,
    panelOffsetY: number,
    scale: number,
    tileSize: number,
    cols: number,
    rows: number,
    midRow: number,
    midCol: number,
    colors: Record<string, number>,
  ): void {
    const GROUND = 0,
      GRASS = 1,
      PATH_H = 2,
      PATH_V = 3,
      HOUSE = 4,
      GARDEN = 5,
      TREE = 6,
      FLOWER = 7,
      LAMP = 8,
      BUSH = 9,
      ROCK = 10,
      WELL = 11;

    const panelW = cols * tileSize;
    const panelH = rows * tileSize;

    // Draw high-fidelity gradient base ground for Crossroads Town
    const baseGround = this.add.graphics();
    baseGround.setDepth(1);

    const gradientSteps = 24;
    for (let i = 0; i < gradientSteps; i++) {
      const t = i / gradientSteps;
      const stepH = panelH / gradientSteps;
      const y = panelOffsetY + i * stepH;

      // Interpolate from deep dark space amber/black (0x140701) to rich glowing warm sunset orange (0x5a2003)
      const rStart = 20,
        gStart = 7,
        bStart = 1;
      const rEnd = 90,
        gEnd = 32,
        bEnd = 3;

      const r = Math.floor(rStart + (rEnd - rStart) * t);
      const g = Math.floor(gStart + (gEnd - gStart) * t);
      const b = Math.floor(bStart + (bEnd - bStart) * t);
      const color = (r << 16) | (g << 8) | b;

      baseGround.fillStyle(color, 1);
      baseGround.fillRect(panelX, y, panelW, stepH + 1);
    }
    this.backgroundLayer.add(baseGround);

    // Add floating magical twilight fireflies
    for (let i = 0; i < 20; i++) {
      const fx = panelX + Math.random() * panelW;
      const fy = panelOffsetY + Math.random() * panelH;
      const size = 1.5 + Math.random() * 1.5;

      const firefly = this.add.circle(fx, fy, size, 0xf59e0b, 0.85);
      firefly.setDepth(12);
      firefly.setBlendMode(Phaser.BlendModes.ADD);
      this.animationLayer.add(firefly);

      // Floating animation
      this.tweens.add({
        targets: firefly,
        x: fx + (Math.random() - 0.5) * 20,
        y: fy + (Math.random() - 0.5) * 20,
        alpha: { from: 0.2, to: 0.9 },
        scale: { from: 0.7, to: 1.3 },
        duration: 2000 + Math.random() * 2000,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    }

    // 8 beautifully planned estates with two trees each and exact checkpoint alignment
    const estates = [
      // --- TOP-LEFT QUADRANT (2 houses) ---
      {
        houseRow: 5,
        houseCol: 5,
        trees: [
          [4, 4],
          [4, 6],
        ],
        lawn: { minR: 3, maxR: 7, minC: 3, maxC: 7 },
        walkway: [
          [6, 5],
          [7, 5],
          [8, 5],
        ],
      },
      {
        houseRow: 5,
        houseCol: 12,
        trees: [
          [4, 11],
          [4, 13],
        ],
        lawn: { minR: 3, maxR: 7, minC: 10, maxC: 14 },
        walkway: [
          [6, 12],
          [7, 12],
          [8, 12],
        ],
      },

      // --- TOP-RIGHT QUADRANT (2 houses) ---
      {
        houseRow: 5,
        houseCol: 27,
        trees: [
          [4, 26],
          [4, 28],
        ],
        lawn: { minR: 3, maxR: 7, minC: 25, maxC: 29 },
        walkway: [
          [6, 27],
          [7, 27],
          [8, 27],
        ],
      },
      {
        houseRow: 5,
        houseCol: 34,
        trees: [
          [4, 33],
          [4, 35],
        ],
        lawn: { minR: 3, maxR: 7, minC: 32, maxC: 36 },
        walkway: [
          [6, 34],
          [7, 34],
          [8, 34],
        ],
      },

      // --- BOTTOM-LEFT QUADRANT (2 houses) ---
      // House 5: Aligns directly with Checkpoint 1 at (col 7, row 31)
      {
        houseRow: 29,
        houseCol: 7,
        trees: [
          [28, 6],
          [28, 8],
        ],
        lawn: { minR: 27, maxR: 31, minC: 5, maxC: 9 },
        walkway: [
          [30, 7],
          [31, 7],
          [32, 7],
        ],
      },
      // House 6: Perfectly positioned near the checkpoints with visible background trees
      {
        houseRow: 19,
        houseCol: 15,
        trees: [
          [16, 14],
          [16, 16],
        ],
        lawn: { minR: 17, maxR: 21, minC: 13, maxC: 17 },
        walkway: [
          [20, 15],
          [21, 15],
          [22, 15],
        ],
      },

      // --- BOTTOM-RIGHT QUADRANT (2 houses) ---
      // House 7: Perfectly positioned near the checkpoints with visible background trees
      {
        houseRow: 19,
        houseCol: 27,
        trees: [
          [16, 26],
          [16, 28],
        ],
        lawn: { minR: 17, maxR: 21, minC: 25, maxC: 29 },
        walkway: [
          [20, 27],
          [21, 27],
          [22, 27],
        ],
      },
      // House 8: Moved left to col 33 so Checkpoint 4 is completely visible and the house does not overlap
      {
        houseRow: 29,
        houseCol: 33,
        trees: [
          [26, 32],
          [26, 34],
        ],
        lawn: { minR: 27, maxR: 31, minC: 31, maxC: 35 },
        walkway: [
          [30, 33],
          [31, 33],
          [32, 33],
        ],
      },
    ];

    // Generate enhanced tilemap with beautiful town layout
    const levelData: number[][] = Array.from({ length: rows }, (_, row) =>
      Array.from({ length: cols }, (_, col) => {
        // 1. Check estate grids first
        for (const est of estates) {
          if (row === est.houseRow && col === est.houseCol) {
            return HOUSE;
          }
          for (const [tr, tc] of est.trees) {
            if (row === tr && col === tc) {
              return TREE;
            }
          }
          for (const [wr, wc] of est.walkway) {
            if (row === wr && col === wc) {
              return PATH_H; // paved stone walkway to main streets
            }
          }
          if (
            row >= est.lawn.minR &&
            row <= est.lawn.maxR &&
            col >= est.lawn.minC &&
            col <= est.lawn.maxC
          ) {
            return GRASS;
          }
        }

        // 2. Main crossroads paths (wider)
        if (row >= midRow - 1 && row <= midRow + 1) return PATH_H;
        if (col >= midCol - 1 && col <= midCol + 1) return PATH_V;

        // 3. Side paths creating town blocks
        if (row === 8 || row === 22) {
          if (col < midCol - 2 || col > midCol + 2) return PATH_H;
        }
        if (col === 8 || col === 22) {
          if (row < midRow - 2 || row > midRow + 2) return PATH_V;
        }

        // 4. Street Junction Lamp Posts (perfectly aligned at path intersections only)
        if (row === 7 && col === 7) return LAMP;
        if (row === 7 && col === midCol + 3) return LAMP;
        if (row === midRow + 3 && col === 7) return LAMP;
        if (row === midRow + 3 && col === midCol + 3) return LAMP;

        // 5. Symmetric Wells next to residential estates
        if (row === 8 && col === 2) return WELL;
        if (row === 8 && col === cols - 3) return WELL;
        if (row === midRow + 8 && col === 2) return WELL;
        if (row === midRow + 8 && col === cols - 3) return WELL;

        // Decorative rocks/benches next to roads (spaced regularly)
        if (row === midRow - 2 && (col === 4 || col === cols - 5)) return ROCK;
        if (row === midRow + 2 && (col === 4 || col === cols - 5)) return ROCK;

        // 6. Forest Borders (Beautiful outer framing tree lines)
        if (row === 1 && col % 4 === 0) return TREE;
        if (row === rows - 2 && col % 4 === 0) return TREE;
        if (col === 1 && row % 4 === 0) return TREE;
        if (col === cols - 2 && row % 4 === 0) return TREE;

        // Default to a perfectly clean background ground
        return GROUND;
      }),
    );

    // Render tiles from enhanced 2D array
    const toX = (col: number) => panelX + col * tileSize + tileSize / 2;
    const toY = (row: number) => panelOffsetY + row * tileSize + tileSize / 2;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const tileType = levelData[row][col];
        const x = toX(col);
        const y = toY(row);

        switch (tileType) {
          case GROUND: {
            // Let the gorgeous mystical twilight gradient base ground show through
            break;
          }

          case GRASS: {
            // Semi-transparent grass to blend with the glowing background gradient
            const tile = this.add.rectangle(
              x,
              y,
              tileSize,
              tileSize,
              colors.grass,
              0.75,
            );
            tile.setDepth(1);
            this.backgroundLayer.add(tile);

            // Add grass texture
            const grassDot = this.add.circle(
              x + (row % 3) - 1,
              y + (col % 3) - 1,
              1,
              colors.grassDark,
              0.5,
            );
            grassDot.setDepth(2);
            this.backgroundLayer.add(grassDot);
            break;
          }

          case PATH_H:
          case PATH_V: {
            const tile = this.add.rectangle(
              x,
              y,
              tileSize,
              tileSize,
              colors.path,
              1,
            );
            tile.setDepth(2);
            this.backgroundLayer.add(tile);

            // Path edge highlights
            if (
              tileType === PATH_H &&
              (row === midRow - 1 || row === midRow + 1)
            ) {
              const edge = this.add.rectangle(
                x,
                y,
                tileSize,
                2,
                colors.pathEdge,
                0.4,
              );
              edge.setDepth(3);
              this.backgroundLayer.add(edge);
            }
            break;
          }

          case HOUSE: {
            const ground = this.add.rectangle(
              x,
              y,
              tileSize,
              tileSize,
              colors.grass,
              1,
            );
            ground.setDepth(1);
            this.backgroundLayer.add(ground);

            // Use existing house sprites if available
            if (
              this.textures.exists("House_Hay_1") ||
              this.textures.exists("House_Hay_2")
            ) {
              const houseKey =
                (row + col) % 2 === 0 ? "House_Hay_1" : "House_Hay_2";
              if (this.textures.exists(houseKey)) {
                const house = this.add.sprite(x, y + tileSize / 2, houseKey);
                house.setOrigin(0.5, 1);
                house.setScale(scale * 0.9);
                house.setTint(colors.glow);
                house.setDepth(8);
                this.midgroundLayer.add(house);

                // Add shadow
                const shadow = this.add.ellipse(
                  x,
                  y + tileSize / 2,
                  tileSize * 0.8,
                  tileSize * 0.3,
                  0x000000,
                  0.3,
                );
                shadow.setDepth(7);
                this.midgroundLayer.add(shadow);
              }
            } else {
              // Fallback: simple house shape
              const houseBody = this.add.rectangle(
                x,
                y,
                tileSize * 0.8,
                tileSize * 0.8,
                0x8b7355,
                1,
              );
              houseBody.setDepth(8);
              this.midgroundLayer.add(houseBody);

              const roof = this.add.triangle(
                x,
                y - tileSize * 0.4,
                0,
                tileSize * 0.4,
                tileSize * 0.5,
                -tileSize * 0.2,
                -tileSize * 0.5,
                -tileSize * 0.2,
                0xd4a574,
              );
              roof.setDepth(9);
              this.midgroundLayer.add(roof);

              // Window glow
              const window1 = this.add.rectangle(
                x - 4,
                y,
                3,
                3,
                colors.highlight,
                0.8,
              );
              window1.setDepth(10);
              this.midgroundLayer.add(window1);
            }
            break;
          }

          case GARDEN: {
            const tile = this.add.rectangle(
              x,
              y,
              tileSize,
              tileSize,
              colors.grass,
              1,
            );
            tile.setDepth(1);
            this.backgroundLayer.add(tile);

            // Garden flowers
            const flowerColors = [
              colors.flower,
              colors.flowerGlow,
              colors.highlight,
            ];
            const flowerColor = flowerColors[(row + col) % 3];
            const flower = this.add.circle(x, y, 2, flowerColor, 0.7);
            flower.setDepth(4);
            this.backgroundLayer.add(flower);
            break;
          }

          case TREE: {
            const ground = this.add.rectangle(
              x,
              y,
              tileSize,
              tileSize,
              colors.grass,
              1,
            );
            ground.setDepth(1);
            this.backgroundLayer.add(ground);

            // Use existing tree sprites if available
            if (this.textures.exists("Tree_Emerald_1")) {
              const tree = this.add.sprite(
                x,
                y + tileSize / 2,
                "Tree_Emerald_1",
              );
              tree.setOrigin(0.5, 1);
              tree.setScale(scale * 0.8);
              tree.setTint(colors.tree);
              tree.setDepth(6);
              this.midgroundLayer.add(tree);

              // Shadow
              const shadow = this.add.ellipse(
                x,
                y + tileSize / 2,
                tileSize * 0.6,
                tileSize * 0.2,
                0x000000,
                0.3,
              );
              shadow.setDepth(5);
              this.midgroundLayer.add(shadow);
            } else {
              // Fallback tree
              const canopy = this.add.ellipse(
                x,
                y - 4,
                14,
                18,
                colors.tree,
                0.9,
              );
              canopy.setDepth(6);
              this.backgroundLayer.add(canopy);

              const trunk = this.add.rectangle(
                x,
                y + 4,
                4,
                10,
                colors.treeDark,
                1,
              );
              trunk.setDepth(5);
              this.backgroundLayer.add(trunk);
            }
            break;
          }

          case FLOWER: {
            const ground = this.add.rectangle(
              x,
              y,
              tileSize,
              tileSize,
              colors.grass,
              1,
            );
            ground.setDepth(1);
            this.backgroundLayer.add(ground);

            // Glowing flower
            const flower = this.add.circle(x, y, 3, colors.flower, 0.8);
            flower.setDepth(4);
            flower.setBlendMode(Phaser.BlendModes.ADD);
            this.backgroundLayer.add(flower);

            const glow = this.add.circle(x, y, 8, colors.flowerGlow, 0.2);
            glow.setDepth(4);
            glow.setBlendMode(Phaser.BlendModes.ADD);
            this.backgroundLayer.add(glow);
            break;
          }

          case LAMP: {
            const ground = this.add.rectangle(
              x,
              y,
              tileSize,
              tileSize,
              colors.path,
              1,
            );
            ground.setDepth(2);
            this.backgroundLayer.add(ground);

            // Use existing lamp post if available
            if (this.textures.exists("LampPost_3")) {
              const lamp = this.add.sprite(x, y + tileSize / 2, "LampPost_3");
              lamp.setOrigin(0.5, 1);
              lamp.setScale(scale);
              lamp.setTint(colors.glow);
              lamp.setDepth(9);
              this.midgroundLayer.add(lamp);

              // Lamp glow
              const lampGlow = this.add.circle(
                x,
                y - tileSize / 2,
                12,
                colors.highlight,
                0.3,
              );
              lampGlow.setDepth(10);
              lampGlow.setBlendMode(Phaser.BlendModes.ADD);
              this.midgroundLayer.add(lampGlow);
            } else {
              // Fallback lamp
              const post = this.add.rectangle(x, y, 2, tileSize, 0x4a4a4a, 1);
              post.setDepth(9);
              this.midgroundLayer.add(post);

              const light = this.add.circle(
                x,
                y - tileSize / 2,
                4,
                colors.highlight,
                0.9,
              );
              light.setDepth(10);
              light.setBlendMode(Phaser.BlendModes.ADD);
              this.midgroundLayer.add(light);
            }
            break;
          }

          case BUSH: {
            const ground = this.add.rectangle(
              x,
              y,
              tileSize,
              tileSize,
              colors.grass,
              1,
            );
            ground.setDepth(1);
            this.backgroundLayer.add(ground);

            // Decorative bush
            const bush = this.add.ellipse(x, y, 10, 8, colors.tree, 0.8);
            bush.setDepth(4);
            this.backgroundLayer.add(bush);

            const bushHighlight = this.add.ellipse(
              x - 2,
              y - 2,
              4,
              3,
              colors.grass,
              0.6,
            );
            bushHighlight.setDepth(5);
            this.backgroundLayer.add(bushHighlight);
            break;
          }

          case ROCK: {
            const ground = this.add.rectangle(
              x,
              y,
              tileSize,
              tileSize,
              colors.grass,
              1,
            );
            ground.setDepth(1);
            this.backgroundLayer.add(ground);

            // Use existing rock sprite if available
            if (this.textures.exists("Rock_Brown_1")) {
              const rock = this.add.sprite(x, y, "Rock_Brown_1");
              rock.setOrigin(0.5, 0.5);
              rock.setScale(scale * 0.6);
              rock.setTint(0x6a5a8a);
              rock.setDepth(4);
              this.backgroundLayer.add(rock);
            } else {
              // Fallback rock
              const rock = this.add.ellipse(x, y, 8, 6, 0x4a3a5a, 1);
              rock.setDepth(4);
              this.backgroundLayer.add(rock);
            }
            break;
          }

          case WELL: {
            const ground = this.add.rectangle(
              x,
              y,
              tileSize,
              tileSize,
              colors.path,
              1,
            );
            ground.setDepth(2);
            this.backgroundLayer.add(ground);

            // Town well/fountain
            const wellBase = this.add.circle(x, y, tileSize * 0.6, 0x6a5a4a, 1);
            wellBase.setDepth(7);
            this.backgroundLayer.add(wellBase);

            const wellTop = this.add.circle(
              x,
              y,
              tileSize * 0.4,
              colors.accent,
              0.8,
            );
            wellTop.setDepth(8);
            this.backgroundLayer.add(wellTop);

            // Water glow
            const waterGlow = this.add.circle(
              x,
              y,
              tileSize * 0.5,
              colors.highlight,
              0.3,
            );
            waterGlow.setDepth(9);
            waterGlow.setBlendMode(Phaser.BlendModes.ADD);
            this.backgroundLayer.add(waterGlow);
            break;
          }
        }
      }
    }

    // Add impressive center plaza with decorative elements
    const plazaSize = tileSize * 3;

    // Outer plaza circle
    const plazaOuter = this.add.circle(
      toX(midCol),
      toY(midRow),
      plazaSize / 2,
      colors.accent,
      0.2,
    );
    plazaOuter.setDepth(3);
    this.backgroundLayer.add(plazaOuter);

    // Middle plaza ring
    const plazaMiddle = this.add.circle(
      toX(midCol),
      toY(midRow),
      plazaSize / 3,
      colors.highlight,
      0.3,
    );
    plazaMiddle.setDepth(4);
    this.backgroundLayer.add(plazaMiddle);

    // Center fountain/monument
    const monumentBase = this.add.circle(
      toX(midCol),
      toY(midRow),
      tileSize * 0.8,
      0x6a5a4a,
      1,
    );
    monumentBase.setDepth(7);
    this.backgroundLayer.add(monumentBase);

    const monument = this.add.circle(
      toX(midCol),
      toY(midRow),
      tileSize * 0.6,
      colors.highlight,
      0.8,
    );
    monument.setDepth(8);
    this.backgroundLayer.add(monument);

    // Monument glow (pulsing effect)
    const monumentGlow = this.add.circle(
      toX(midCol),
      toY(midRow),
      tileSize * 1.2,
      colors.glow,
      0.3,
    );
    monumentGlow.setDepth(6);
    monumentGlow.setBlendMode(Phaser.BlendModes.ADD);
    this.backgroundLayer.add(monumentGlow);

    // Add decorative stars around monument
    const starPositions = [
      { angle: 0, dist: tileSize * 1.5 },
      { angle: 90, dist: tileSize * 1.5 },
      { angle: 180, dist: tileSize * 1.5 },
      { angle: 270, dist: tileSize * 1.5 },
    ];

    starPositions.forEach(({ angle, dist }) => {
      const rad = (angle * Math.PI) / 180;
      const starX = toX(midCol) + Math.cos(rad) * dist;
      const starY = toY(midRow) + Math.sin(rad) * dist;

      const star = this.add.circle(starX, starY, 3, colors.flower, 0.8);
      star.setDepth(5);
      star.setBlendMode(Phaser.BlendModes.ADD);
      this.backgroundLayer.add(star);

      const starGlow = this.add.circle(starX, starY, 8, colors.flowerGlow, 0.2);
      starGlow.setDepth(5);
      starGlow.setBlendMode(Phaser.BlendModes.ADD);
      this.backgroundLayer.add(starGlow);
    });
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
    const panelW = cols * tileSize;
    const panelH = rows * tileSize;
    const midRow = rows / 2;
    const midY = panelOffsetY + midRow * tileSize;

    void biome;
    void biomeIndex;

    const toX = (x: number) => panelX + x * tileSize;
    const toY = (y: number) => panelOffsetY + y * tileSize;

    // Rich tropical ground with gradient
    const ground = this.add.graphics();
    ground.setDepth(1);

    // Base sandy layer with vertical gradient effect using multiple rectangles
    const gradientSteps = 20;
    for (let i = 0; i < gradientSteps; i++) {
      const t = i / gradientSteps;
      const height = panelH / gradientSteps;
      const y = panelOffsetY + i * height;

      // Interpolate between colors
      const r = Math.floor(201 + (191 - 201) * Math.sin(t * Math.PI));
      const g = Math.floor(160 + (160 - 160) * Math.sin(t * Math.PI));
      const b = Math.floor(106 + (112 - 106) * Math.sin(t * Math.PI));
      const color = (r << 16) | (g << 8) | b;

      ground.fillStyle(color, 1);
      ground.fillRect(panelX, y, panelW, height + 1);
    }
    this.backgroundLayer.add(ground);

    // Detailed land texture with varied tiles
    const landTiles = this.add.graphics();
    landTiles.setDepth(2);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const noise = Math.sin(c * 0.5) * Math.cos(r * 0.3);
        const tileVariant = Math.floor((noise + 1) * 2) % 5;
        const colors = [0xc9a06a, 0xd4a574, 0xbf9660, 0xcca870, 0xb89968];
        const alphas = [0.3, 0.4, 0.35, 0.45, 0.38];

        landTiles.fillStyle(colors[tileVariant], alphas[tileVariant]);
        landTiles.fillRect(c * tileSize, r * tileSize, tileSize, tileSize);

        // Add subtle texture details
        if (Math.random() > 0.85) {
          landTiles.fillStyle(0xa08050, 0.2);
          landTiles.fillCircle(
            c * tileSize + tileSize * 0.5,
            r * tileSize + tileSize * 0.5,
            tileSize * 0.3,
          );
        }
      }
    }
    landTiles.setPosition(panelX, panelOffsetY);
    this.backgroundLayer.add(landTiles);

    // Enhanced main road with better details
    const road = this.add.graphics();
    road.setDepth(4);

    // Road base with gradient
    road.fillGradientStyle(0x8b6f47, 0x8b6f47, 0x7a5f3d, 0x7a5f3d, 1);
    road.fillRect(panelX, midY - 24, panelW, 48);

    // Cobblestone pattern with varied sizes
    for (let x = panelX; x < panelX + panelW; x += tileSize * 1.2) {
      for (let y = midY - 22; y < midY + 22; y += tileSize * 1.1) {
        const stoneSize = tileSize * (0.6 + Math.random() * 0.3);
        const offsetX = (Math.random() - 0.5) * tileSize * 0.3;
        const offsetY = (Math.random() - 0.5) * tileSize * 0.3;

        road.fillStyle(0x9d7d54, 0.35);
        road.fillRoundedRect(
          x + offsetX,
          y + offsetY,
          stoneSize,
          stoneSize * 0.8,
          2,
        );

        // Stone highlights
        road.fillStyle(0xb89968, 0.15);
        road.fillCircle(x + offsetX + 2, y + offsetY + 2, stoneSize * 0.2);
      }
    }

    // Road borders with decorative edge
    road.lineStyle(3, 0x6b5437, 0.9);
    road.strokeRect(panelX, midY - 24, panelW, 48);
    road.lineStyle(1, 0x9d7d54, 0.5);
    road.strokeRect(panelX + 2, midY - 22, panelW - 4, 44);
    this.backgroundLayer.add(road);

    // Add tropical building sprites with variety
    const buildingPositions: Array<[number, number, number, number]> = [
      [8, midRow - 7, 1, 0.85],
      [18, midRow - 6.5, 3, 0.9],
      [28, midRow - 7.2, 6, 0.88],
      [38, midRow - 6.8, 10, 0.92],
      [48, midRow - 7, 12, 0.87],
      [12, midRow + 5, 4, 0.83],
      [24, midRow + 5.5, 7, 0.86],
      [36, midRow + 5.2, 11, 0.89],
      [46, midRow + 5.8, 13, 0.84],
    ];

    buildingPositions.forEach(([c, r, buildingNum, scaleVal]) => {
      const buildingKey = `tropical_building_${buildingNum}`;
      if (this.textures.exists(buildingKey)) {
        const building = this.add.sprite(toX(c), toY(r), buildingKey);
        building.setOrigin(0.5, 1);
        building.setScale(scale * scaleVal);
        building.setTint(0xfff8f0);
        building.setDepth(6);
        building.setAlpha(0.95);
        this.backgroundLayer.add(building);
      }
    });

    // Enhanced tropical trees with variety
    const treePositions: Array<[number, number, number, number]> = [
      [5, midRow - 5, 1, 1.0],
      [14, midRow - 4.5, 2, 1.1],
      [22, midRow - 5.2, 1, 0.95],
      [32, midRow - 4.8, 2, 1.05],
      [41, midRow - 5, 1, 1.0],
      [50, midRow - 4.7, 2, 0.98],
      [9, midRow + 3.5, 2, 0.92],
      [19, midRow + 4, 1, 1.02],
      [30, midRow + 3.8, 2, 0.96],
      [40, midRow + 4.2, 1, 1.08],
      [49, midRow + 3.6, 2, 0.94],
    ];

    treePositions.forEach(([c, r, treeNum, scaleVal]) => {
      const treeKey = `tropical_tree_${treeNum}`;
      if (this.textures.exists(treeKey)) {
        const tree = this.add.sprite(toX(c), toY(r), treeKey);
        tree.setOrigin(0.5, 1);
        tree.setScale(scale * scaleVal);
        tree.setDepth(7);
        this.midgroundLayer.add(tree);
      }
    });

    // Add varied decorative elements
    const decorPositions: Array<[number, number, number, number]> = [
      [11, midRow - 2.5, 1, 0.7],
      [16, midRow + 2, 3, 0.65],
      [25, midRow - 2.8, 5, 0.72],
      [34, midRow + 2.2, 7, 0.68],
      [43, midRow - 2.6, 9, 0.7],
      [52, midRow + 2.5, 11, 0.66],
    ];

    decorPositions.forEach(([c, r, decorNum, scaleVal]) => {
      const decorKey = `tropical_decor_${decorNum}`;
      if (this.textures.exists(decorKey)) {
        const decor = this.add.sprite(toX(c), toY(r), decorKey);
        decor.setOrigin(0.5, 1);
        decor.setScale(scale * scaleVal);
        decor.setDepth(8);
        this.midgroundLayer.add(decor);
      }
    });

    // Add greenery clusters
    const greeneryPositions: Array<[number, number, number, number]> = [
      [7, midRow - 3, 1, 0.8],
      [13, midRow + 2.5, 2, 0.75],
      [21, midRow - 2.8, 3, 0.82],
      [29, midRow + 2.8, 4, 0.78],
      [37, midRow - 3.2, 5, 0.8],
      [45, midRow + 2.6, 1, 0.76],
      [53, midRow - 2.9, 2, 0.79],
    ];

    greeneryPositions.forEach(([c, r, greenNum, scaleVal]) => {
      const greenKey = `tropical_greenery_${greenNum}`;
      if (this.textures.exists(greenKey)) {
        const green = this.add.sprite(toX(c), toY(r), greenKey);
        green.setOrigin(0.5, 1);
        green.setScale(scale * scaleVal);
        green.setDepth(8);
        this.midgroundLayer.add(green);
      }
    });

    // Add atmospheric details - market stalls
    const props = this.add.graphics();
    props.setDepth(9);

    const stallPositions: Array<[number, number]> = [
      [26, midRow - 3.5],
      [35, midRow + 3],
      [44, midRow - 3.2],
    ];

    stallPositions.forEach(([c, r]) => {
      const x = toX(c);
      const y = toY(r);

      // Stall structure with depth
      props.fillStyle(0xa0826d, 1);
      props.fillRect(x - 10, y + 2, 20, 14);
      props.fillStyle(0x8b6f47, 0.8);
      props.fillRect(x - 9, y + 3, 2, 13);
      props.fillRect(x + 7, y + 3, 2, 13);

      // Colorful awning with stripes
      const awningColors = [0xd94f30, 0xe85d3a, 0xc44428];
      awningColors.forEach((color, i) => {
        props.fillStyle(color, 0.9);
        props.fillRect(x - 12 + i * 8, y - 6, 8, 10);
      });

      // Awning highlights
      props.fillStyle(0xffffff, 0.25);
      props.fillRect(x - 11, y - 5, 3, 8);
      props.fillRect(x - 3, y - 5, 3, 8);
      props.fillRect(x + 5, y - 5, 3, 8);

      // Goods on display
      props.fillStyle(0xfbbf24, 0.8);
      props.fillCircle(x - 5, y + 8, 3);
      props.fillCircle(x + 2, y + 8, 3);
      props.fillStyle(0x7bc99c, 0.8);
      props.fillCircle(x - 2, y + 10, 2.5);
      props.fillCircle(x + 5, y + 10, 2.5);
    });

    this.backgroundLayer.add(props);

    // Add ambient particles/details
    const ambient = this.add.graphics();
    ambient.setDepth(10);

    // Scattered tropical flowers/details
    for (let i = 0; i < 30; i++) {
      const x = panelX + Math.random() * panelW;
      const y = panelOffsetY + Math.random() * panelH;

      if (Math.abs(y - midY) > 30) {
        // Avoid road
        const flowerColors = [0xff6b9d, 0xfbbf24, 0x7bc99c, 0xe85d3a];
        const color =
          flowerColors[Math.floor(Math.random() * flowerColors.length)];
        ambient.fillStyle(color, 0.4);
        ambient.fillCircle(x, y, 2);
      }
    }

    this.midgroundLayer.add(ambient);
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
    // Handled lazily per stage in loadStage
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
    container.add(sky);
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
    // Handled lazily per stage in loadStage
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

    // Only keep essential village structures - remove clutter
    this.addLandmarkSprite("House_Hay_1", centerX - 150, centerY + 150, 1.55);
    this.addLandmarkSprite("House_Hay_3", centerX + 110, centerY + 115, 1.45);
    this.addLandmarkSprite("Well_Hay_1", centerX + 250, centerY + 155, 1.05);
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

    // Minimal story props - only essential markers
    this.addMinimalVillageProps(nodes);
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

    // Simple wooden track style matching the main paths
    const woodColor = 0x8b6f47;
    const darkWood = 0x5d4a37;

    // Shadow
    const shadow = this.add.graphics();
    shadow.lineStyle(options.plankWidth + 8, 0x000000, 0.1);
    shadow.beginPath();
    shadow.moveTo(points[0].x + 3, points[0].y + 5);
    points.slice(1).forEach((point) => shadow.lineTo(point.x + 3, point.y + 5));
    shadow.strokePath();
    shadow.setDepth(3.2);
    this.midgroundLayer.add(shadow);

    // Main wooden path
    const path = this.add.graphics();
    path.lineStyle(options.plankWidth, woodColor, 0.95);
    path.beginPath();
    path.moveTo(points[0].x, points[0].y);
    points.slice(1).forEach((point) => path.lineTo(point.x, point.y));
    path.strokePath();

    // Highlight
    path.lineStyle(2, 0xffffff, 0.15);
    path.beginPath();
    path.moveTo(points[0].x, points[0].y - options.plankWidth * 0.25);
    points
      .slice(1)
      .forEach((point) =>
        path.lineTo(point.x, point.y - options.plankWidth * 0.25),
      );
    path.strokePath();

    // Dark edge
    path.lineStyle(2, darkWood, 0.5);
    path.beginPath();
    path.moveTo(points[0].x, points[0].y + options.plankWidth * 0.3);
    points
      .slice(1)
      .forEach((point) =>
        path.lineTo(point.x, point.y + options.plankWidth * 0.3),
      );
    path.strokePath();

    path.setDepth(3.4);
    this.midgroundLayer.add(path);

    // Optional rope details for elevated sections
    if (options.rope) {
      const rope = this.add.graphics();
      const edgeOffset = options.plankWidth * 0.4;
      rope.lineStyle(2, 0xd6b16c, 0.6);
      this.drawOffsetPolyline(rope, points, -edgeOffset);
      this.drawOffsetPolyline(rope, points, edgeOffset);
      rope.setDepth(4.1);
      this.midgroundLayer.add(rope);
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

  private addMinimalVillageProps(nodes: { x: number; y: number }[]): void {
    // Only add essential lamp posts at checkpoints for visibility
    const props: Array<[string, number, number, number]> = [
      ["LampPost_3", nodes[0].x - 80, nodes[0].y + 90, 0.86],
      ["LampPost_3", nodes[1].x + 90, nodes[1].y + 70, 0.86],
      ["LampPost_3", nodes[2].x - 90, nodes[2].y + 80, 0.86],
      ["LampPost_3", nodes[3].x + 100, nodes[3].y + 90, 0.9],
    ];

    props.forEach(([key, x, y, scale], index) => {
      this.addLandmarkSprite(key, x, y, scale, 0.92);

      // Subtle lamp glow
      const glow = this.add.circle(x, y - 54, 16, 0xffd27a, 0.12);
      glow.setDepth(16);
      this.midgroundLayer.add(glow);
      this.tweens.add({
        targets: glow,
        alpha: { from: 0.08, to: 0.18 },
        scale: { from: 0.92, to: 1.08 },
        duration: 1800 + index * 200,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
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

    if (this.currentTemplateId === "venture" && stageId === 2) {
      this.createVentureStageTwoForestLandmarks(nodes);
      return;
    }

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

  private createVentureStageTwoForestLandmarks(
    nodes: CheckpointNode[],
  ): void {
    const shrubFrames = [27, 28, 29, 30, 31, 32];

    nodes.forEach((node, index) => {
      const side = index % 2 === 0 ? -1 : 1;
      this.addForestLandmarkSprite(
        shrubFrames[index % shrubFrames.length],
        node.x + side * 78,
        node.y + 96,
        1.16,
        0.84,
        14,
      );
    });

    [
      [nodes[0].x - 170, nodes[0].y - 34, 0, 1.22],
      [nodes[1].x + 142, nodes[1].y + 112, 1, 1.18],
      [nodes[2].x - 138, nodes[2].y - 88, 2, 1.16],
      [nodes[3].x - 124, nodes[3].y + 124, 9, 1.12],
      [nodes[nodes.length - 1].x - 170, nodes[nodes.length - 1].y + 88, 3, 1.18],
    ].forEach(([x, y, frame, spriteScale]) => {
      this.addForestLandmarkSprite(
        frame as number,
        x as number,
        y as number,
        spriteScale as number,
        0.78,
        13,
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

    // No extra oval tracker pads for Stage 3 — checkpoints sit behind flags.

    // Two subtle rocks near the lower arena edge for depth, not clutter.
    this.addLandmarkSprite(
      "Rock_Brown_4",
      centerX - 170,
      centerY + 180,
      0.9,
      0.72,
    );
    this.addLandmarkSprite(
      "Rock_Brown_6",
      centerX + 170,
      centerY + 176,
      0.86,
      0.72,
    );
  }

  private createArtisanLandmarks(stageId: number): void {
    const nodes = this.getStageNodes(stageId);
    if (nodes.length === 0) return;

    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    const centerX = (first.x + last.x) / 2;
    const centerY = (first.y + last.y) / 2;

    // Checkpoint pads — centered under each node so the actual node reads as
    // the clickable marker, not as a detached decoration.
    const pads = this.add.graphics();
    pads.setDepth(14);
    nodes.forEach((node, index) => {
      const padY = node.y + 42;
      const isTopNode = index === 2;

      pads.fillStyle(0x000000, 0.26);
      pads.fillEllipse(node.x + 5, padY + 12, 118, 38);
      pads.fillStyle(0x17143d, 0.78);
      pads.fillEllipse(node.x, padY, 104, 32);
      pads.lineStyle(4, 0x9ddcff, 0.74);
      pads.strokeEllipse(node.x, padY, 104, 32);
      pads.lineStyle(2, 0xffd166, 0.42);
      pads.strokeEllipse(node.x, padY, 72, 20);

      if (!isTopNode) {
        const lampOffset = index < 2 ? -48 : 48;
        this.addLandmarkSprite(
          "LampPost_3",
          node.x + lampOffset,
          padY + 48,
          0.74,
          0.86,
        );
      }
    });
    this.midgroundLayer.add(pads);

    // Supporting props tucked around the plaza edges so they do not compete
    // with checkpoint readability.
    this.addLandmarkSprite(
      "Rock_Brown_2",
      centerX - 250,
      centerY + 214,
      0.78,
      0.64,
    );
    this.addLandmarkSprite(
      "Rock_Brown_4",
      centerX + 250,
      centerY + 210,
      0.76,
      0.64,
    );
    this.addLandmarkSprite("Sign_2", centerX - 205, centerY + 96, 0.78, 0.76);
    this.addLandmarkSprite(
      "Barrel_Small_Empty",
      centerX + 204,
      centerY + 98,
      0.72,
      0.72,
    );
  }

  private createMineLandmarks(stageId: number): void {
    const nodes = this.getStageNodes(stageId);
    if (nodes.length === 0) return;

    // Stage 5 has highest checkpoint density, so use tighter ring sizes.
    const pads = this.add.graphics();
    pads.setDepth(14);
    nodes.forEach((node) => {
      pads.fillStyle(0x2a3a23, 0.24);
      pads.fillEllipse(node.x + 4, node.y + 72, 100, 34);
      pads.lineStyle(3, 0xb8d084, 0.34);
      pads.strokeEllipse(node.x, node.y + 61, 76, 24);

      // Enhanced lantern posts with warm glow
      [0, 1].forEach((offset, i) => {
        const lampX = node.x + (offset === 0 ? -52 : 52);
        const lampSprite = this.addLandmarkSprite(
          "LampPost_3",
          lampX,
          node.y + 114,
          0.76,
          0.88,
        );
        // Add warm lantern glow
        const glow = this.add.circle(lampX, node.y + 60, 18, 0xf59e0b, 0.18);
        glow.setDepth(16);
        this.midgroundLayer.add(glow);
        this.tweens.add({
          targets: glow,
          alpha: { from: 0.1, to: 0.25 },
          duration: 1600 + i * 200,
          yoyo: true,
          repeat: -1,
          ease: "Sine.easeInOut",
        });
      });
    });
    this.midgroundLayer.add(pads);

    // Add mining support beams near checkpoints
    nodes.forEach((node, index) => {
      if (index % 2 === 0) {
        const beam = this.add.graphics();
        beam.fillStyle(0x5a4220, 0.8);
        beam.fillRect(node.x - 2, node.y + 30, 4, 30);
        beam.lineStyle(1, 0x8b6f47, 0.6);
        beam.strokeRect(node.x - 2, node.y + 30, 4, 30);
        beam.setDepth(15);
        this.midgroundLayer.add(beam);
      }
    });
  }

  private createHarbourLandmarks(stageId: number): void {
    const nodes = this.getStageNodes(stageId);
    if (nodes.length === 0) return;

    // Stage 6 has fewer checkpoints, so make pads slightly wider.
    const pads = this.add.graphics();
    pads.setDepth(14);
    nodes.forEach((node) => {
      pads.fillStyle(0x23402b, 0.24);
      pads.fillEllipse(node.x + 4, node.y + 74, 114, 38);
      pads.lineStyle(3, 0xddc48f, 0.34);
      pads.strokeEllipse(node.x, node.y + 62, 88, 26);

      this.addLandmarkSprite(
        "LampPost_3",
        node.x - 58,
        node.y + 116,
        0.78,
        0.9,
      );
      this.addLandmarkSprite(
        "LampPost_3",
        node.x + 58,
        node.y + 116,
        0.78,
        0.9,
      );
    });
    this.midgroundLayer.add(pads);
  }

  private createCrossroadsLandmarks(stageId: number): void {
    const nodes = this.getStageNodes(stageId);
    if (nodes.length === 0) return;

    const pads = this.add.graphics();
    pads.setDepth(14);
    nodes.forEach((node) => {
      pads.fillStyle(0x264128, 0.24);
      pads.fillEllipse(node.x + 4, node.y + 74, 108, 36);
      pads.lineStyle(3, 0xd7b078, 0.34);
      pads.strokeEllipse(node.x, node.y + 62, 82, 25);

      this.addLandmarkSprite(
        "LampPost_3",
        node.x - 56,
        node.y + 115,
        0.78,
        0.9,
      );
      this.addLandmarkSprite(
        "LampPost_3",
        node.x + 56,
        node.y + 115,
        0.78,
        0.9,
      );
    });
    this.midgroundLayer.add(pads);
  }

  private createCapitalLandmarks(stageId: number): void {
    const nodes = this.getStageNodes(stageId);
    if (nodes.length === 0) return;

    // Stage 8 - Enhanced Tropical Medieval City landmarks
    nodes.forEach((node, index) => {
      // Create layered platform with depth
      const platform = this.add.graphics();
      platform.setDepth(14);

      // Shadow layer
      platform.fillStyle(0x8b6f47, 0.25);
      platform.fillEllipse(node.x + 6, node.y + 78, 120, 42);

      // Main sandy platform with gradient effect
      platform.fillStyle(0xd4a574, 0.45);
      platform.fillEllipse(node.x + 4, node.y + 73, 115, 40);
      platform.fillStyle(0xe0b080, 0.3);
      platform.fillEllipse(node.x + 2, node.y + 70, 110, 38);

      // Decorative stone border
      platform.lineStyle(4, 0xa0826d, 0.5);
      platform.strokeEllipse(node.x, node.y + 65, 95, 32);
      platform.lineStyle(2, 0xc9a06a, 0.6);
      platform.strokeEllipse(node.x, node.y + 63, 90, 30);

      // Tropical accent border
      platform.lineStyle(3, 0x5fa777, 0.45);
      platform.strokeEllipse(node.x, node.y + 62, 88, 28);

      this.midgroundLayer.add(platform);

      // Add varied tropical trees based on checkpoint index
      const treeType = (index % 2) + 1;
      const treeKey = `tropical_tree_${treeType}`;

      if (this.textures.exists(treeKey)) {
        // Left tree
        const leftTree = this.add.sprite(node.x - 62, node.y + 108, treeKey);
        leftTree.setOrigin(0.5, 1);
        leftTree.setScale(0.75);
        leftTree.setDepth(15);
        leftTree.setAlpha(0.95);
        this.midgroundLayer.add(leftTree);

        // Right tree (slightly different scale for variety)
        const rightTree = this.add.sprite(node.x + 62, node.y + 108, treeKey);
        rightTree.setOrigin(0.5, 1);
        rightTree.setScale(0.8);
        rightTree.setDepth(15);
        rightTree.setAlpha(0.95);
        this.midgroundLayer.add(rightTree);
      }

      // Add tropical greenery clusters
      const greeneryType = (index % 5) + 1;
      const greeneryKey = `tropical_greenery_${greeneryType}`;

      if (this.textures.exists(greeneryKey)) {
        // Multiple greenery positions for lush look
        const greeneryPositions = [
          [-35, 92, 0.65],
          [35, 92, 0.7],
          [-50, 98, 0.6],
          [50, 98, 0.62],
          [0, 88, 0.55],
        ];

        greeneryPositions.forEach(([offsetX, offsetY, scale]) => {
          const greenery = this.add.sprite(
            node.x + offsetX,
            node.y + offsetY,
            greeneryKey,
          );
          greenery.setOrigin(0.5, 1);
          greenery.setScale(scale);
          greenery.setDepth(14);
          greenery.setAlpha(0.9);
          this.midgroundLayer.add(greenery);
        });
      }

      // Add decorative elements
      const decorType = (index % 18) + 1;
      const decorKey = `tropical_decor_${decorType}`;

      if (this.textures.exists(decorKey)) {
        // Front decorations
        const frontDecor = this.add.sprite(node.x, node.y + 95, decorKey);
        frontDecor.setOrigin(0.5, 1);
        frontDecor.setScale(0.6);
        frontDecor.setDepth(16);
        frontDecor.setAlpha(0.85);
        this.midgroundLayer.add(frontDecor);
      }

      // Add atmospheric details with graphics
      const details = this.add.graphics();
      details.setDepth(13);

      // Scattered tropical flowers around platform
      const flowerColors = [0xff6b9d, 0xfbbf24, 0x7bc99c, 0xe85d3a, 0xa78bfa];
      for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2;
        const radius = 45 + Math.random() * 15;
        const x = node.x + Math.cos(angle) * radius;
        const y = node.y + 65 + Math.sin(angle) * radius * 0.3;

        const color = flowerColors[i % flowerColors.length];
        details.fillStyle(color, 0.5);
        details.fillCircle(x, y, 2.5);
        details.fillStyle(0xffffff, 0.3);
        details.fillCircle(x, y, 1);
      }

      // Small stones/pebbles for texture
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2 + Math.PI / 16;
        const radius = 38 + Math.random() * 8;
        const x = node.x + Math.cos(angle) * radius;
        const y = node.y + 68 + Math.sin(angle) * radius * 0.3;

        details.fillStyle(0xa0826d, 0.4);
        details.fillCircle(x, y, 3);
        details.fillStyle(0xc9a06a, 0.3);
        details.fillCircle(x - 1, y - 1, 1.5);
      }

      this.midgroundLayer.add(details);
    });
  }

  /**
   * Creates atmospheric particles and ambient effects for premium feel
   */
  private createAtmosphericEffects(): void {
    // Floating dust motes across the map - Throttled frequency to save performance
    const dustParticles = this.add.particles(0, 0, "white", {
      x: { min: 0, max: this.MAP_WIDTH },
      y: { min: 0, max: this.MAP_HEIGHT * 0.7 },
      speedX: { min: -5, max: 5 },
      speedY: { min: -10, max: -3 },
      scale: { start: 0.08, end: 0 },
      alpha: { start: 0.25, end: 0 },
      lifespan: 5000,
      frequency: 2000,
      blendMode: "ADD",
      tint: 0xffffff,
    });
    this.backgroundLayer.add(dustParticles);

    // Light rays from top (god rays effect) - static high performance
    for (let i = 0; i < 3; i++) {
      const rayX = (i * this.MAP_WIDTH) / 3 + Math.random() * 200;
      const rayGraphics = this.add.graphics();
      rayGraphics.fillStyle(0xffffff, 0.06);
      rayGraphics.fillTriangle(
        rayX,
        0,
        rayX - 30,
        this.MAP_HEIGHT * 0.5,
        rayX + 30,
        this.MAP_HEIGHT * 0.5,
      );
      this.backgroundLayer.add(rayGraphics);
    }

    // Ambient glow orbs floating in background - static orbs
    for (let i = 0; i < 4; i++) {
      const orbX = Math.random() * this.MAP_WIDTH;
      const orbY = Math.random() * (this.MAP_HEIGHT * 0.6);
      const orb = this.add.circle(orbX, orbY, 3, 0x6366f1, 0.3);
      this.backgroundLayer.add(orb);
    }

    // Biome-specific particle systems - Only active for current stage to save massive performance
    this.activeBiomeConfigs.forEach((biome, index) => {
      if (biome.id !== this.currentStage) return; // ONLY render active stage particles!
      const biomeX = index * this.BIOME_WIDTH;

      let particleConfig: Phaser.Types.GameObjects.Particles.ParticleEmitterConfig | null =
        null;

      switch (biome.visualTheme) {
        case "forest":
          particleConfig = {
            x: { min: biomeX, max: biomeX + this.BIOME_WIDTH },
            y: -50,
            speedY: { min: 40, max: 80 },
            speedX: { min: -20, max: 20 },
            scale: { start: 0.15, end: 0.05 },
            alpha: { start: 0.6, end: 0 },
            lifespan: 12000,
            frequency: 450,
            tint: [biome.colors.accent2, biome.colors.accent1, 0xffffff],
            rotate: { min: 0, max: 360 },
          };
          break;
        case "arena":
          particleConfig = {
            x: { min: biomeX + 160, max: biomeX + this.BIOME_WIDTH - 120 },
            y: { min: 420, max: 980 },
            speedY: { min: -34, max: -10 },
            speedX: { min: -18, max: 18 },
            scale: { start: 0.12, end: 0 },
            alpha: { start: 0.72, end: 0 },
            lifespan: 2600,
            frequency: 380,
            tint: [biome.colors.accent1, biome.colors.accent2, 0xffd37a],
            blendMode: "ADD",
          };
          break;
        case "artisan":
          particleConfig = {
            x: { min: biomeX + 120, max: biomeX + this.BIOME_WIDTH - 120 },
            y: { min: 360, max: 930 },
            speedY: { min: -18, max: 8 },
            speedX: { min: -12, max: 12 },
            scale: { start: 0.11, end: 0.02 },
            alpha: { start: 0.42, end: 0 },
            lifespan: 4200,
            frequency: 500,
            tint: [biome.colors.accent1, biome.colors.accent2, 0xffffff],
            blendMode: "ADD",
          };
          break;
        case "mine":
          particleConfig = {
            x: { min: biomeX, max: biomeX + this.BIOME_WIDTH },
            y: { min: 400, max: 1000 },
            speedY: { min: -20, max: -40 },
            speedX: { min: -10, max: 10 },
            scale: { start: 0.1, end: 0 },
            alpha: { start: 0.8, end: 0 },
            lifespan: 3000,
            frequency: 300,
            tint: [biome.colors.accent1, biome.colors.accent2, 0xffd37a],
            blendMode: "ADD",
          };
          break;
        case "capital":
          particleConfig = {
            x: { min: biomeX, max: biomeX + this.BIOME_WIDTH },
            y: { min: 200, max: 800 },
            speedY: { min: -10, max: 10 },
            speedX: { min: -10, max: 10 },
            scale: { start: 0.2, end: 0.1 },
            alpha: { start: 0.4, end: 0 },
            lifespan: 5000,
            frequency: 360,
            tint: [0xffffff, biome.colors.accent1, biome.colors.accent2],
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

    // Shimmering stars in the distance (top sky area) - mostly static, twinkle only 3 stars to avoid rendering overhead
    for (let i = 0; i < 30; i++) {
      const starX = Math.random() * this.MAP_WIDTH;
      const starY = Math.random() * (this.MAP_HEIGHT * 0.3);
      const star = this.add.circle(starX, starY, 1, 0xffffff, 0.7);
      this.backgroundLayer.add(star);

      if (i < 3) {
        // Twinkle only 3 stars for atmospheric feel without the performance cost of 30 active tweens
        this.tweens.add({
          targets: star,
          alpha: { from: 0.2, to: 0.9 },
          scale: { from: 0.5, to: 1.4 },
          duration: 1200 + Math.random() * 2000,
          yoyo: true,
          repeat: -1,
          ease: "Quad.easeInOut",
          delay: Math.random() * 3000,
        });
      }
    }
  }

  /**
   * Creates animated water ripples around biome edges and islands
   */
  private createWaterRipples(): void {
    const rippleCount = 4; // reduced from 20 to 4
    for (let i = 0; i < rippleCount; i++) {
      const x = Math.random() * this.MAP_WIDTH;
      const y = Math.random() * this.MAP_HEIGHT;

      const ripple = this.add.graphics();
      ripple.lineStyle(2, 0xffffff, 0.15);
      ripple.strokeCircle(0, 0, 10);
      ripple.x = x;
      ripple.y = y;

      this.backgroundLayer.add(ripple);

      this.tweens.add({
        targets: ripple,
        scale: { from: 0.5, to: 3.5 },
        alpha: { from: 0.2, to: 0 },
        duration: 3000 + Math.random() * 2000,
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
    const positions = this.getSnakePathPositions();

    positions.forEach((pos, i) => {
      // Find which stage this globalIndex belongs to:
      let tempIndex = 0;
      let targetStageId = 1;
      for (const stage of this.activeStages) {
        if (i >= tempIndex && i < tempIndex + stage.checkpoints) {
          targetStageId = stage.id;
          break;
        }
        tempIndex += stage.checkpoints;
      }

      // ONLY draw shoreline foam for checkpoints in the current active stage! Saves 70+ tweens!
      if (targetStageId !== this.currentStage) return;

      for (let r = 0; r < 2; r++) {
        const ripple = this.add.graphics();
        ripple.lineStyle(2, 0xffffff, 0.3);
        ripple.strokeCircle(0, 0, 42); // Just outside the checkpoint radius
        ripple.x = pos.x;
        ripple.y = pos.y;

        this.backgroundLayer.add(ripple);

        this.tweens.add({
          targets: ripple,
          scale: { from: 1.0, to: 1.15 },
          alpha: { from: 0.3, to: 0.05 },
          duration: 3500 + Math.random() * 2000,
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
    const rayCount = 2; // reduced from 6 to 2
    for (let i = 0; i < rayCount; i++) {
      const x = (i * this.MAP_WIDTH) / 2 + Math.random() * 400;
      const ray = this.add.graphics();
      this.backgroundLayer.add(ray);

      // Modern palette: Use biome-specific colors or a safe premium white-gold
      ray.fillStyle(0xffffff, 0.035);

      const width = 120 + Math.random() * 200;
      const height = 1500;
      const angle = 0.2; // slight tilt

      ray.beginPath();
      ray.moveTo(x, -200);
      ray.lineTo(x + width, -200);
      ray.lineTo(x + width - height * angle, height);
      ray.lineTo(x - height * angle, height);
      ray.closePath();
      ray.fillPath();
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
      const mountainUpdate = () => {
        g.x -= speed;
        if (g.x < -200) g.x = 0; // Simple loop
      };
      this.events.on("update", mountainUpdate);
      this.updateHandlers.push(mountainUpdate);
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
      const cloudUpdate = () => {
        cloud.x += speed;
        if (cloud.x > this.MAP_WIDTH + 200) {
          cloud.x = -200;
        }
      };
      this.events.on("update", cloudUpdate);
      this.updateHandlers.push(cloudUpdate);

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
    this.activeStages.forEach((stage) => {
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

    // Create checkpoint nodes
    globalIndex = 0;
    this.activeStages.forEach((stage) => {
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

    this.activeStages.forEach((stage) => {
      const stagePositions = positions.slice(
        offset,
        offset + stage.checkpoints,
      );
      const biome = this.activeBiomeConfigs[stage.id - 1];

      // Strict per-stage path only: do NOT draw connectors to another stage.
      // Venture stages 3 and 4 use bespoke plaza layouts, so skip the generic
      // wooden connector there. Stage 2 draws a tile trail inside the forest
      // panel. Stage 7 Crossroads does not need the wooden plank overlay.
      const shouldSkipGenericConnector =
        (this.currentTemplateId === "venture" &&
          [1, 2, 3, 4].includes(stage.id)) ||
        stage.id === 1 ||
        stage.id === 7;
      if (!shouldSkipGenericConnector && stagePositions.length > 1 && biome) {
        this.drawStagePathConnector(stagePositions, biome.colors.path, 0.9);
      }

      offset += stage.checkpoints;
    });
  }

  private createStageFogOverlays(): void {
    for (const biome of this.activeBiomeConfigs) {
      if (biome.id === 1) continue;

      const x = (biome.id - 1) * this.BIOME_WIDTH;
      const fog = this.add.container(x, 0);
      fog.setDepth(90);

      const veil = this.add.graphics();
      veil.fillStyle(0xffffff, 0.18);
      veil.fillRect(-80, 0, this.BIOME_WIDTH + 160, this.MAP_HEIGHT);
      veil.fillStyle(biome.colors.accent2, 0.06);
      veil.fillRect(-80, 0, this.BIOME_WIDTH + 160, this.MAP_HEIGHT);
      veil.lineStyle(4, 0xffffff, 0.16);
      veil.strokeRect(8, 28, this.BIOME_WIDTH - 16, this.MAP_HEIGHT - 56);

      fog.add([veil]);
      this.animationLayer.add(fog);
      this.stageFogOverlays.set(biome.id, fog);
    }
  }

  private updateStageVisibility(
    activeStage: number,
    animateReveal: boolean,
  ): void {
    const maxVisibleStage = Phaser.Math.Clamp(
      activeStage,
      1,
      this.activeBiomeConfigs.length,
    );

    for (const node of this.checkpointNodes.values()) {
      // Always show checkpoint nodes, even in future stages, so the full map
      // reads as a planned journey. Future nodes remain locked via their status
      // and sit under the stage fog overlay until the stage is unlocked.
      node.setVisible(true);
      node.setActive(true);
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
    const biome = this.activeBiomeConfigs[stage - 1];
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

    // Stage 5 (Mine) has special ember/fog effects
    if (stage === 5) {
      // Dark fog particles that swirl and dissipate
      for (let i = 0; i < 25; i += 1) {
        const fog = this.add.circle(
          stageX + Phaser.Math.Between(40, this.BIOME_WIDTH - 40),
          Phaser.Math.Between(100, 500),
          Phaser.Math.Between(30, 60),
          0x1a1510,
          0.4,
        );
        fog.setDepth(124);
        this.animationLayer.add(fog);

        this.tweens.add({
          targets: fog,
          x: fog.x + Phaser.Math.Between(-50, 50),
          y: fog.y + Phaser.Math.Between(-80, 80),
          alpha: 0,
          scale: { from: 1, to: 2 },
          duration: Phaser.Math.Between(2000, 3000),
          ease: "Cubic.easeOut",
          onComplete: () => fog.destroy(),
        });
      }

      // Glowing embers rising from the ground
      for (let i = 0; i < 40; i += 1) {
        const ember = this.add.circle(
          stageX + Phaser.Math.Between(40, this.BIOME_WIDTH - 40),
          600,
          Phaser.Math.Between(2, 4),
          Phaser.Math.Between(0, 2) === 0 ? 0xf59e0b : 0xef4444,
          0.8,
        );
        ember.setDepth(125);
        this.animationLayer.add(ember);

        this.tweens.add({
          targets: ember,
          y: ember.y - Phaser.Math.Between(200, 400),
          alpha: 0,
          scale: 0.3,
          duration: Phaser.Math.Between(1500, 2500),
          ease: "Sine.easeIn",
          onComplete: () => ember.destroy(),
        });
      }
    } else {
      // Default weather effect for other stages (clouds)
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
    }

    // Common flake effect
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
    // Clean, subtle, thin path connecting the nodes instead of a bulky trackpad
    const path = this.add.graphics();
    path.lineStyle(4, color, 0.65 * alpha);
    path.beginPath();
    path.moveTo(points[0].x, points[0].y);
    points.slice(1).forEach((point) => path.lineTo(point.x, point.y));
    path.strokePath();
    path.setDepth(2.5);
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

    for (const stage of this.activeStages) {
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
      { x: 80, y: 160 },
      { x: 270, y: 230 },
      { x: 460, y: 236 },
      { x: 532, y: 420 },
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

    if (stageId === 2) {
      // Venture Stage 2 uses a compact forest trail matching the sand route
      // drawn by createVentureStageTwoForestPanel().
      const forestAnchors = [
        { x: 88, y: 190 },
        { x: 266, y: 296 },
        { x: 466, y: 306 },
        { x: 560, y: 432 },
        { x: 574, y: 552 },
      ];
      const anchor =
        forestAnchors[Math.min(checkpointIndex, forestAnchors.length - 1)];
      const stageLeftX = (stageId - 1) * this.BIOME_WIDTH;
      const stageRightX = stageLeftX + this.BIOME_WIDTH;
      const nodePadding = 96;

      return {
        x: Phaser.Math.Clamp(
          biomeOffsetX + anchor.x * this.MAP_PANEL_SCALE,
          stageLeftX + nodePadding,
          stageRightX - nodePadding,
        ),
        y: panelOffsetY + anchor.y * this.MAP_PANEL_SCALE,
      };
    }

    if (stageId === 3) {
      const arenaAnchors = [
        { x: 110, y: 522 },
        { x: 110, y: 222 },
        { x: 548, y: 222 },
        { x: 548, y: 522 },
      ];
      const anchor =
        arenaAnchors[Math.min(checkpointIndex, arenaAnchors.length - 1)];
      return {
        x: biomeOffsetX + anchor.x * this.MAP_PANEL_SCALE,
        y: panelOffsetY + anchor.y * this.MAP_PANEL_SCALE,
      };
    }

    if (stageId === 4) {
      // Stage 4 is a bespoke artisan plaza. Checkpoints are placed exactly at
      // the four corner lamp-post boxes, with the final 5th point in the middle medallion.
      const artisanAnchors = [
        { x: 112, y: 560 }, // CP 1: Bottom-left corner
        { x: 112, y: 144 }, // CP 2: Top-left corner
        { x: 528, y: 144 }, // CP 3: Top-right corner
        { x: 528, y: 560 }, // CP 4: Bottom-right corner
        { x: 320, y: 424 }, // CP 5: Central medallion (Middle)
      ];
      const anchor =
        artisanAnchors[Math.min(checkpointIndex, artisanAnchors.length - 1)];
      return {
        x: biomeOffsetX + anchor.x * this.MAP_PANEL_SCALE,
        y: panelOffsetY + anchor.y * this.MAP_PANEL_SCALE,
      };
    }

    const lateStageAnchors: Record<number, Array<{ x: number; y: number }>> = {
      // Mine: follows the rail road, then climbs to the mine works.
      5: [
        { x: 104, y: 510 },
        { x: 188, y: 420 },
        { x: 292, y: 342 },
        { x: 420, y: 342 },
        { x: 532, y: 424 },
        { x: 614, y: 512 },
      ],
      // Harbour: three clear stops across the dock, market pier, and launch slip.
      6: [
        { x: 118, y: 500 },
        { x: 356, y: 330 },
        { x: 594, y: 500 },
      ],
      // Crossroads: CP1 & CP4 at bottom corners, CP2 directly in front of House 6 (col 15),
      // CP3 directly in front of House 7 (col 27). tile=16px, so col*16+8 = centre of tile column.
      7: [
        { x: 112, y: 500 }, // CP1 — bottom-left corner (House 5)
        { x: 248, y: 370 }, // CP2 — col 15 centre (15*16+8=248), row 23 (23*16+2=370)
        { x: 440, y: 370 }, // CP3 — col 27 centre (27*16+8=440), row 23
        { x: 528, y: 500 }, // CP4 — bottom-right corner (House 8)
      ],
      // Capital: a ceremonial approach up to the citadel, then back to the gate.
      8: [
        { x: 106, y: 510 },
        { x: 226, y: 410 },
        { x: 358, y: 320 },
        { x: 506, y: 410 },
        { x: 620, y: 510 },
      ],
    };

    const anchors = lateStageAnchors[stageId] ?? lateStageAnchors[5];

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

    const stageLeftX = (stageId - 1) * this.BIOME_WIDTH;
    const stageRightX = stageLeftX + this.BIOME_WIDTH;
    const nodePadding = 96;

    return {
      x: Phaser.Math.Clamp(
        biomeOffsetX + localX,
        stageLeftX + nodePadding,
        stageRightX - nodePadding,
      ),
      y: Phaser.Math.Clamp(
        panelOffsetY + localY,
        panelOffsetY + nodePadding,
        panelOffsetY + panelHeight - nodePadding,
      ),
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
    // Handled lazily per stage in loadStage
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
    this.boundHandlers.updateContributors =
      this.handleUpdateContributors.bind(this);
    this.boundHandlers.bossCombatRetreat =
      this.handleBossCombatRetreat.bind(this);
    this.boundHandlers.bossFinalOutcome =
      this.handleBossFinalOutcome.bind(this);

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
    eventBridge.onPhaser(
      "UPDATE_CONTRIBUTORS",
      this.boundHandlers.updateContributors,
    );
    eventBridge.onPhaser(
      "BOSS_COMBAT_RETREAT",
      this.boundHandlers.bossCombatRetreat,
    );
    eventBridge.onPhaser(
      "BOSS_FINAL_OUTCOME",
      this.boundHandlers.bossFinalOutcome,
    );

    // Handle checkpoint clicks (emitted by CheckpointNode)
    this.events.on(
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
  }

  /**
   * Handles BOSS_COMBAT_RETREAT — mid-stage boss animates back to stage end after player victory.
   */
  private handleBossCombatRetreat(event: { stage: number; checkpoint: number }): void {
    const miniBoss = this.miniBosses.get(event.stage);
    if (!miniBoss || !miniBoss.active) return;

    // Compute final position (end of this stage)
    let stageEndGlobalIndex = 0;
    for (let s = 0; s < event.stage; s++) {
      stageEndGlobalIndex += (this.activeStages[s]?.checkpoints ?? 0);
    }
    stageEndGlobalIndex -= 1;

    const finalPos = this.calculateSnakePosition(stageEndGlobalIndex, this.TOTAL_CHECKPOINTS);
    const offsetX = 100, offsetY = -120;

    this.tweens.killTweensOf(miniBoss);
    this.tweens.add({
      targets: miniBoss,
      x: finalPos.x + offsetX,
      y: finalPos.y + offsetY,
      duration: 1200,
      ease: "Cubic.easeInOut",
      onComplete: () => {
        miniBoss.retreat();
        this.retreatedStages.add(event.stage);
      },
    });
  }

  /**
   * Handles BOSS_FINAL_OUTCOME — permanent slay or retreat at stage completion.
   */
  private handleBossFinalOutcome(event: { stage: number; outcome: "slay_gold" | "retreat_permanent" }): void {
    const miniBoss = this.miniBosses.get(event.stage);
    if (!miniBoss || !miniBoss.active) return;

    this.tweens.killTweensOf(miniBoss);

    if (event.outcome === "slay_gold") {
      miniBoss.slayGold();
      this.transformBiomeGold(event.stage);
    } else {
      this.tweens.add({
        targets: miniBoss,
        y: miniBoss.y + 150,
        scaleX: 0,
        scaleY: 0,
        alpha: 0,
        duration: 1800,
        ease: "Cubic.easeIn",
        onComplete: () => miniBoss.destroy(),
      });
      this.restoreBiome(event.stage);
    }

    this.slainMiniBossStages.add(event.stage);
    this.retreatedStages.delete(event.stage);
    this.removeResidualMarker(event.stage);
  }


  private handleUpdateBrightness(event?: { brightness: number }): void {
    // Always keep full brightness - no darkness overlay
    this.updateBrightnessFilter(100);
  }

  /**
   * Updates contributor sprite personas orbiting the main player
   */
  private handleUpdateContributors(event?: {
    contributors: ContributorData[];
  }): void {
    if (!event || !event.contributors) return;

    // Limit to maximum 5 contributors visible at once
    const allowedContributors = event.contributors.slice(0, 5);
    const activeIds = new Set(allowedContributors.map((c) => c.userId));

    // 1. Remove companions that are no longer in the active list
    for (const [userId, companion] of this.companions.entries()) {
      if (!activeIds.has(userId)) {
        companion.destroy();
        this.companions.delete(userId);
      }
    }

    // 2. Add new contributors or update active ones
    allowedContributors.forEach((contributor) => {
      let companion = this.companions.get(contributor.userId);
      if (!companion) {
        // Spawn them slightly offset from player persona or center
        const startX = this.persona ? this.persona.x : 0;
        const startY = this.persona ? this.persona.y : 0;

        companion = new ContributorCompanion(this, startX, startY, contributor);

        // Add to the main gameLayer (same z-index context as player)
        if (this.gameLayer) {
          this.gameLayer.add(companion);
        }

        this.companions.set(contributor.userId, companion);
      } else {
        // Update its data reference
        companion.contributorData = contributor;
      }
    });
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
    this.latestCheckpointsState = checkpoints;

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

      // ── Phase 17: Biome integration ─────────────────────────────────────
      const stageChanged = previousStage !== this.currentStage;
      if (stageChanged) {
        gameplayIntegration.updateBiomeState(
          this,
          this.currentTemplateId,
          this.currentStage,
          this.currentCorruptionLevel,
        );
        gameplayIntegration.applyBiomeParticles(
          this,
          this.currentTemplateId,
          this.currentStage,
        );
      }

      // Fog overlays removed - all stages visible
      // this.updateStageVisibility(this.currentStage, stageChanged);
      this.updateCameraBoundsForStage(this.currentStage);

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

    if (!this.initializedBossTriggers) {
      checkpoints.forEach((cp) => {
        const doneTasks = (cp.t1 ? 1 : 0) + (cp.t2 ? 1 : 0) + (cp.t3 ? 1 : 0);
        if (doneTasks >= 2) {
          const cpKey = `${cp.stage}-${cp.checkpoint}`;
          this.triggeredBossCheckpoints.add(cpKey);

          // If a checkpoint in this stage has at least 2 completed tasks,
          // the mini-boss for this stage should start in the retreated state.
          this.retreatedStages.add(cp.stage);
        }
      });
      this.initializedBossTriggers = true;
    }

    // Make sure those bosses that are retreated start in the retreated visual state (ran outside initializedBossTriggers so newly lazy-loaded bosses get their state)
    for (const [stage, miniBoss] of this.miniBosses.entries()) {
      if (this.retreatedStages.has(stage) && !this.slainMiniBossStages.has(stage)) {
        if (miniBoss && miniBoss.active && !miniBoss.isRetreated) {
          miniBoss.retreat();
        }
      }
    }

    const stageProgress = new Map<
      number,
      { completed: number; total: number }
    >();

    let totalCompleted = 0;
    let totalCheckpoints = 0;

    checkpoints.forEach((cp) => {
      const stage = cp.stage;
      if (!stageProgress.has(stage)) {
        stageProgress.set(stage, { completed: 0, total: 0 });
      }

      const progress = stageProgress.get(stage)!;
      progress.total++;
      totalCheckpoints++;

      // Count as completed if status is 'completed' or 'gold'
      if (cp.status === "completed" || cp.status === "gold") {
        progress.completed++;
        totalCompleted++;
      }
    });

    const superBossObj = this.bosses.get("super_boss");
    if (superBossObj) {
      superBossObj.weaken(totalCompleted, totalCheckpoints);
      superBossObj.updateCorruptionAura(this.currentCorruptionLevel);
    }

    // Update all mini-bosses
    for (const [stage, miniBoss] of this.miniBosses.entries()) {
      const progress = stageProgress.get(stage);
      if (!progress) {
        continue;
      }

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
        // Slay or retreat permanently when stage is complete
        if (miniBoss && miniBoss.active) {
          if (finalCheckpointGold) {
            // Did all tasks -> Boss dies!
            miniBoss.slayGold();
            this.transformBiomeGold(stage);
          } else {
            // Did bare minimum (2 tasks) -> Boss retreats permanently!
            this.tweens.killTweensOf(miniBoss);
            this.tweens.add({
              targets: miniBoss,
              y: miniBoss.y + 150,
              scaleX: 0,
              scaleY: 0,
              alpha: 0,
              duration: 2000,
              ease: "Cubic.easeIn",
              onComplete: () => {
                miniBoss.destroy();
              }
            });
            this.restoreBiome(stage);
          }
          this.slainMiniBossStages.add(stage);
          this.retreatedStages.delete(stage); // slay/retreat-permanent supersedes temporary retreat
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
        }
      } else if (!playerMovedPast && !stageComplete) {
        // Check for 2/3 tasks completion on checkpoints in this active stage
        stageCheckpoints.forEach((cp) => {
          const doneTasks = (cp.t1 ? 1 : 0) + (cp.t2 ? 1 : 0) + (cp.t3 ? 1 : 0);
          const cpKey = `${cp.stage}-${cp.checkpoint}`;

          // Only trigger for mid-stage checkpoints (final checkpoint triggers final outcome)
          if (doneTasks >= 2 && cp.checkpoint < total && !this.triggeredBossCheckpoints.has(cpKey)) {
            this.triggeredBossCheckpoints.add(cpKey);

            if (miniBoss && miniBoss.active) {
              let globalIndexForCp = 0;
              for (let s = 0; s < cp.stage - 1; s++) {
                globalIndexForCp += this.activeStages[s].checkpoints;
              }
              globalIndexForCp += cp.checkpoint - 1;

              const cpPos = this.calculateSnakePosition(globalIndexForCp, this.TOTAL_CHECKPOINTS);
              const offsetX = 100;
              const offsetY = -120;

              // Move boss to the checkpoint where combat happens
              miniBoss.setPosition(cpPos.x + offsetX, cpPos.y + offsetY);
              miniBoss.setAlpha(1);

              // Play combat shake / attack visual
              this.tweens.killTweensOf(miniBoss);
              this.tweens.add({
                targets: miniBoss,
                x: miniBoss.x + 12,
                y: miniBoss.y - 12,
                duration: 70,
                yoyo: true,
                repeat: 6,
                onComplete: () => {
                  // Combat finished! Retreat back to the end of the stage
                  let stageEndGlobalIndex = 0;
                  for (let s = 0; s < cp.stage; s++) {
                    stageEndGlobalIndex += this.activeStages[s].checkpoints;
                  }
                  stageEndGlobalIndex -= 1;

                  const finalPos = this.calculateSnakePosition(stageEndGlobalIndex, this.TOTAL_CHECKPOINTS);

                  this.tweens.add({
                    targets: miniBoss,
                    x: finalPos.x + offsetX,
                    y: finalPos.y + offsetY,
                    duration: 1600,
                    ease: "Cubic.easeInOut",
                    onComplete: () => {
                      // Play standard retreat visual feedback
                      miniBoss.retreat();
                      this.retreatedStages.add(stage);
                    }
                  });
                }
              });
            }
          }
        });

        // Still on this stage — keep weakening based on progress if not retreated
        if (miniBoss && miniBoss.active && !this.retreatedStages.has(stage)) {
          miniBoss.weaken(completed, total);
        }
      }
    }

    this.drawEnvironmentalCracks(this.currentCorruptionLevel);
  }

  private drawEnvironmentalCracks(level: number): void {
    if (!this.environmentalCracksGraphics) return;
    this.environmentalCracksGraphics.clear();

    if (level < 20) return; // Only show cracks if corruption is at least 20%

    // Draw branching cracks across the biomes
    const numCracks = Math.floor(level / 10);
    this.environmentalCracksGraphics.lineStyle(
      2 + (level / 100) * 3,
      0x11081a,
      0.45 + (level / 100) * 0.4,
    );

    for (let i = 0; i < numCracks; i++) {
      // Seeded random positions across the map based on index i to keep them stable
      const seedX = (Math.sin(i * 12345.67) * 0.5 + 0.5) * this.MAP_WIDTH;
      const seedY = (Math.cos(i * 98765.43) * 0.5 + 0.5) * this.MAP_HEIGHT;

      this.environmentalCracksGraphics.beginPath();
      this.environmentalCracksGraphics.moveTo(seedX, seedY);

      // Create a branching jagged crack path
      let currX = seedX;
      let currY = seedY;
      const segments = 4 + Math.floor((level / 100) * 4);
      for (let s = 0; s < segments; s++) {
        const angle = Math.sin(i * 10 + s) * Math.PI * 2;
        const length = 20 + Math.floor(Math.cos(i * 5 + s) * 15) + level / 10;
        currX += Math.cos(angle) * length;
        currY += Math.sin(angle) * length;
        this.environmentalCracksGraphics.lineTo(currX, currY);
      }
      this.environmentalCracksGraphics.strokePath();
    }
  }

  /**
   * Handles active venture selection from React
   */
  private handleSetActiveVenture(event: {
    ventureId: string;
    templateId?: TemplateId;
    personaGender: "male" | "female";
    assignedBosses?: string[];
    currentStage?: number;
    corruptionLevel?: number;
    userName?: string;
    userImageUrl?: string;
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
      const nextTemplateId = event.templateId ?? "venture";
      const templateChanged = this.currentTemplateId !== nextTemplateId;
      this.currentVentureId = event.ventureId;
      const previousCorruption = this.currentCorruptionLevel;
      this.currentCorruptionLevel = event.corruptionLevel ?? 0;

      if (templateChanged) {
        this.configureTemplateWorld(nextTemplateId);
        this.rebuildWorldForTemplate();
      }

      // ── Phase 17: Update corruption visuals ────────────────────────────────
      if (Math.abs(previousCorruption - this.currentCorruptionLevel) > 5) {
        gameplayIntegration.updateBiomeState(
          this,
          this.currentTemplateId,
          this.currentStage,
          this.currentCorruptionLevel,
        );
      }

      if (ventureChanged) {
        this.retreatedStages.clear();
        this.slainMiniBossStages.clear();
        this.triggeredBossCheckpoints.clear();
        this.initializedBossTriggers = false;
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
          event.userName ?? "User",
          event.userImageUrl ??
          "https://api.dicebear.com/7.x/adventurer/png?seed=User&size=128&backgroundColor=transparent",
        );
        this.gameLayer.add(this.persona);
      }

      // Update current stage if provided
      if (event.currentStage) {
        this.currentStage = event.currentStage;
        // Fog overlays removed - all stages visible
        // this.updateStageVisibility(event.currentStage, !ventureChanged);
        this.updateCameraBoundsForStage(event.currentStage);

        // Play ambience for the current stage + template
        audioManager.playAmbienceForTemplate(
          this.currentTemplateId,
          event.currentStage,
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
      // Silently handle venture setup errors
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
      x: node.x,
      y: node.y,
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

  private getSortedCheckpointNodes(): CheckpointNode[] {
    return Array.from(this.checkpointNodes.values()).sort(
      (a, b) => a.globalIndex - b.globalIndex,
    );
  }

  private getPersonaIdleFacingRight(node: CheckpointNode): boolean {
    const ordered = this.getSortedCheckpointNodes();
    const currentIndex = ordered.findIndex(
      (checkpoint) => checkpoint.checkpointId === node.checkpointId,
    );
    if (currentIndex < 0) return true;

    const nextNode = ordered[currentIndex + 1] ?? null;
    if (nextNode) {
      return nextNode.x >= node.x;
    }

    const previousNode = ordered[currentIndex - 1] ?? null;
    if (previousNode) {
      return node.x >= previousNode.x;
    }

    return true;
  }

  /**
   * Position persona beside the active checkpoint on a walkable map tile.
   *
   * Selection rules (strictly forward):
   * 1. Collect all "active" and "in_progress" nodes (NOT "gold"/"completed" –
   *    those are done and must never pull the persona backward).
   * 2. Among candidates, pick the one with the HIGHEST globalIndex so the
   *    persona always advances to the current frontier checkpoint.
   * 3. If nothing is active yet, fall back to the highest completed/gold node
   *    (still highest-index only), and ultimately the very first node.
   */
  private positionPersonaOnActiveCheckpoint(): void {
    if (!this.persona || !this.persona.scene) return;

    const allNodes = Array.from(this.checkpointNodes.values());

    // ── 1. Find the furthest-forward node that the player has unlocked/accessed ──
    let targetNode =
      allNodes
        .filter((n) => n.status !== "locked")
        .sort((a, b) => b.globalIndex - a.globalIndex)[0] ?? null;

    if (!targetNode) {
      // Absolute fallback: very first checkpoint node
      targetNode =
        allNodes.sort((a, b) => a.globalIndex - b.globalIndex)[0] ?? null;
    }

    if (!targetNode) return; // no nodes exist at all

    const nextCheckpointId = targetNode.checkpointId;
    const pos = this.getPersonaMarkerPosition(targetNode);

    // ── 3. Initial placement (no previous position known) ─────────────────
    if (!this.lastPersonaCheckpointId) {
      this.persona.setPosition(pos.x, pos.y);
      this.persona.setIdleFacingRight(
        this.getPersonaIdleFacingRight(targetNode),
      );
      this.persona.playIdle();
      this.lastPersonaCheckpointId = nextCheckpointId;
      return;
    }

    // ── 4. Already at the correct checkpoint – idle in place ──────────────
    if (this.lastPersonaCheckpointId === nextCheckpointId) {
      // Keep persona alive at current position; only snap if not walking
      if (!this.persona.walking) {
        this.persona.setPosition(pos.x, pos.y);
        this.persona.setIdleFacingRight(
          this.getPersonaIdleFacingRight(targetNode),
        );
        this.persona.playIdle();
      }
      return;
    }

    // ── 5. New frontier – walk forward along path ──────────────────────────
    const previousNode = this.getCheckpointNode(this.lastPersonaCheckpointId);

    // Safety guard: never walk backward. If somehow the new target is behind
    // the last known position, just teleport forward silently.
    const lastNode = previousNode;
    if (lastNode && targetNode.globalIndex < lastNode.globalIndex) {
      // Prevent backward movement - just teleport to the new position
      this.persona.setPosition(pos.x, pos.y);
      this.persona.setIdleFacingRight(
        this.getPersonaIdleFacingRight(targetNode),
      );
      this.persona.playIdle();
      this.lastPersonaCheckpointId = nextCheckpointId;
      return;
    }

    const route = this.getPersonaWalkingRoute(
      this.lastPersonaCheckpointId,
      nextCheckpointId,
    );

    const destination = route[route.length - 1] ?? pos;
    this.persona.moveAlongPath(
      route,
      this.getPersonaMoveDuration(destination.x, destination.y),
    );

    // Stage-transition weather burst
    if (previousNode && previousNode.stage !== targetNode.stage) {
      this.playStageEntryWeather(
        targetNode.x,
        targetNode.y - 120,
        targetNode.stage,
        this.activeBiomeConfigs[targetNode.stage - 1]?.colors.accent2 ??
        0xdff5ff,
      );
    }

    this.lastPersonaCheckpointId = nextCheckpointId;
  }

  private getPersonaWalkingRoute(
    fromCheckpointId: string,
    toCheckpointId: string,
  ): { x: number; y: number }[] {
    const toNode = this.checkpointNodes.get(toCheckpointId);
    if (!toNode) return [];

    const toMarker = this.getPersonaMarkerPosition(toNode);
    const fromNode = this.checkpointNodes.get(fromCheckpointId);
    if (!fromNode) return [toMarker];

    const nodes = this.getSortedCheckpointNodes();
    const fromIndex = nodes.findIndex(
      (node) => node.checkpointId === fromCheckpointId,
    );
    const toIndex = nodes.findIndex(
      (node) => node.checkpointId === toCheckpointId,
    );
    if (fromIndex < 0 || toIndex < 0) return [toMarker];

    const direction = fromIndex < toIndex ? 1 : -1;
    const route: { x: number; y: number }[] = [];
    for (
      let index = fromIndex + direction;
      direction > 0 ? index <= toIndex : index >= toIndex;
      index += direction
    ) {
      const node = nodes[index];
      const marker = this.getPersonaMarkerPosition(node);
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
      // Silently handle scroll errors
    }
  }

  private handleFocusStage(event: {
    stage: number;
    checkpointId?: string;
  }): void {
    try {
      this.focusStage(event.stage, event.checkpointId, true);
    } catch (error) {
      // Silently handle focus errors
    }
  }

  /**
   * Scroll camera to show a specific checkpoint
   */
  private scrollToCheckpoint(checkpointId: string, smooth = true): void {
    const node = this.getCheckpointNode(checkpointId);
    if (!node) return;

    this.updateCameraBoundsForStage(node.stage);

    const { x: targetX, y: targetY } = this.getStageCameraTarget(
      node.stage,
      node.x,
      node.y,
    );

    if (smooth) {
      // Camera pan animation only.
      // Persona movement is handled exclusively by positionPersonaOnActiveCheckpoint
      // when the active checkpoint actually changes.
      this.cameras.main.pan(targetX, targetY, 800, "Sine.easeInOut", false);
    } else {
      this.cameras.main.centerOn(targetX, targetY);
    }
  }

  private focusStage(
    stage: number,
    checkpointId?: string,
    smooth = true,
  ): void {
    const focusStage = Phaser.Math.Clamp(stage, 1, this.currentStage);
    this.updateCameraBoundsForStage(focusStage);

    const requestedNode = checkpointId
      ? this.getCheckpointNode(checkpointId)
      : null;
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
      // Camera focus only. Persona should stay idle at its checkpoint unless
      // checkpoint progression explicitly changes the active node.
      this.cameras.main.pan(x, y, 800, "Sine.easeInOut", false);
      return;
    }

    this.cameras.main.centerOn(x, y);
  }

  private updateCameraBoundsForStage(stageId: number): void {
    if (
      !this.cameras ||
      !this.cameras.main ||
      !this.physics ||
      !this.physics.world
    ) {
      return; // Scene not fully initialized or being destroyed
    }
    const stageStartX = (stageId - 1) * this.BIOME_WIDTH;
    this.cameras.main.setBounds(
      stageStartX,
      0,
      this.BIOME_WIDTH,
      this.MAP_HEIGHT + 160,
    );
    this.physics.world.setBounds(
      stageStartX,
      0,
      this.BIOME_WIDTH,
      this.MAP_HEIGHT + 160,
    );
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
    zoom = this.cameras.main.zoom,
  ): { x: number; y: number } {
    const stageStartX = (stage - 1) * this.BIOME_WIDTH;
    const stageEndX = stageStartX + this.BIOME_WIDTH;
    const visibleWorldWidth = this.scale.width / zoom;
    const visibleWorldHeight = this.scale.height / zoom;
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
      this.MAP_HEIGHT + 160 - halfHeight,
    );

    return { x, y };
  }

  private getPersonaMoveDuration(targetX: number, targetY: number): number {
    if (!this.persona || !this.persona.scene) return 2000;

    const distance = Phaser.Math.Distance.Between(
      this.persona.x,
      this.persona.y,
      targetX,
      targetY,
    );

    // Slower, more organic human walking pace: ~125 pixels per second (8ms per pixel)
    // Clamped between 1500ms (minimum to show legs swinging) and 6000ms
    return Phaser.Math.Clamp(distance * 8.0, 1500, 6000);
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
      // Silently handle animation errors
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
      return;
    }

    // Get world position of checkpoint
    const worldPos = node.getWorldPosition();

    // Determine animation type from stage
    const animationType = getAnimationTypeForStage(stage);

    // Play checkpoint SFX based on animation type and variant
    const sfxId = `${animationType}_${variant}`;
    audioManager.playCheckpointSFX(sfxId as CheckpointSFXId);

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
    this.checkBiomeLoading();
    this.emitTutorialPulsePosition();

    // Update accepted contributor companion sprites follow tracking
    if (this.persona && this.companions && this.companions.size > 0) {
      const companionsArray = Array.from(this.companions.values());
      companionsArray.forEach((companion, index) => {
        companion.updateCompanion(
          this.persona!.x,
          this.persona!.y,
          index,
          companionsArray.length,
        );
      });
    }
  }

  private emitTutorialPulsePosition(): void {
    const firstNode = this.checkpointNodes.get("1-1");
    if (!firstNode) return;

    // Check if Stage 1 Checkpoint 1 pulse is active
    const isPulseActive =
      this.currentStage === 1 && firstNode.status === "active";
    if (!isPulseActive && !this.lastEmitVisible) {
      return;
    }

    const now = this.time.now;
    if (now - this.lastEmitTime < 100) {
      return;
    }
    this.lastEmitTime = now;

    const camera = this.cameras.main;
    const screenX = (firstNode.x - camera.worldView.x) * camera.zoom;
    const screenY = (firstNode.y - camera.worldView.y) * camera.zoom;

    // Only dispatch if coordinates or visibility actually changed
    if (
      Math.abs(screenX - this.lastEmitX) < 1 &&
      Math.abs(screenY - this.lastEmitY) < 1 &&
      isPulseActive === this.lastEmitVisible
    ) {
      return;
    }

    this.lastEmitX = screenX;
    this.lastEmitY = screenY;
    this.lastEmitVisible = isPulseActive;

    eventBridge.dispatchToReact({
      type: "TUTORIAL_PULSE_POSITION",
      x: screenX,
      y: screenY,
      visible: isPulseActive,
    });
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

    // Clean up companions
    this.companions.forEach((companion) => companion.destroy());
    this.companions.clear();

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
    if (this.boundHandlers.updateContributors) {
      eventBridge.off(
        "UPDATE_CONTRIBUTORS",
        this.boundHandlers.updateContributors,
      );
    }
    if (this.boundHandlers.bossCombatRetreat) {
      eventBridge.off("BOSS_COMBAT_RETREAT", this.boundHandlers.bossCombatRetreat);
    }
    if (this.boundHandlers.bossFinalOutcome) {
      eventBridge.off("BOSS_FINAL_OUTCOME", this.boundHandlers.bossFinalOutcome);
    }
    if (this.resizeHandler) {
      this.scale.off("resize", this.resizeHandler);
      this.resizeHandler = undefined;
    }

    // Remove wheel listener (desktop scroll)
    if (this.wheelHandler && this.game?.canvas) {
      this.game.canvas.removeEventListener("wheel", this.wheelHandler);
      this.wheelHandler = null;
    }

    this.updateHandlers.forEach((handler) =>
      this.events.off("update", handler),
    );
    this.updateHandlers = [];
    this.boundHandlers = {};
  }

  /**
   * Helper to get all checkpoint positions along the snake path
   */
  private getSnakePathPositions(): { x: number; y: number }[] {
    const positions: { x: number; y: number }[] = [];
    let globalIndex = 0;

    this.activeStages.forEach((stage) => {
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
    const stageBiome = this.activeBiomeConfigs[stage - 1];
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
  }

  /**
   * Restore biome visually after standard stage completion
   */
  private restoreBiome(stage: number): void {
    const stageBiome = this.activeBiomeConfigs[stage - 1];
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
    }
  }
}
