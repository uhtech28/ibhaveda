import * as Phaser from "phaser";
import { AssetLoader } from "../utils/asset-loader";
import { CheckpointNode, CheckpointStatus } from "../entities/Checkpoint";
import { Persona, PersonaGender } from "../entities/Persona";
import { BossSilhouette } from "../entities/Boss";
import { BIOME_PALETTES } from "../utils/biome-textures";

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

    // Create adventure background with nature elements
    this.createAdventureBackground();

    // Create biome zones (replaces spaceship rooms)
    this.createBiomeZones();

    // Draw organic path connecting biomes
    this.createAdventurePath();

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

    // Setup camera for adventure map (side-scrolling view)
    this.cameras.main.setBounds(0, 0, this.MAP_WIDTH, this.MAP_HEIGHT);
    this.cameras.main.setZoom(0.8); // Zoom to see biome details
    this.cameras.main.centerOn(
      VENTURE_BIOMES[0].x + VENTURE_BIOMES[0].width / 2,
      VENTURE_BIOMES[0].y + VENTURE_BIOMES[0].height / 2,
    );

    // Enable smooth camera lerp (no target object, just for lerp settings)
    // Note: We use pan() for actual camera movements
    this.cameras.main.setLerp(this.cameraFollowSpeed, this.cameraFollowSpeed);

    // Enable camera drag controls for better visibility
    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      this.cameras.main.stopFollow();
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
    } catch (error) {
      console.warn("[WorldMapScene] Failed to update checkpoints:", error);
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

    // Super Boss (far right of map)
    if (assignedBosses.length > 0) {
      const superBossX = 3400; // Near end of map
      const superBossY = 360;

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

    for (let stage = 1; stage <= 8; stage++) {
      // Position at end of each biome
      const x = 200 + stage * 400 - 50; // Near right edge of biome
      const y = 250; // Upper portion of screen

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
    for (let stage = 1; stage <= 8; stage++) {
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
    const biome = VENTURE_BIOMES[stage - 1];
    if (!biome) return { x: 0, y: 0 };

    // Calculate position along organic path through biome
    const pathProgress = checkpoint / biome.checkpoints;
    const baseX = biome.x + biome.width * pathProgress;
    const baseY = biome.y + biome.height / 2;

    // Add sine wave for natural path curve
    const waveOffset = Math.sin(pathProgress * Math.PI) * 60;

    // Add slight randomization for organic feel
    const seed = stage * 100 + checkpoint;
    const randomX = (Math.sin(seed) * 0.5 + 0.5) * 20 - 10;
    const randomY = (Math.cos(seed) * 0.5 + 0.5) * 20 - 10;

    return {
      x: baseX + randomX,
      y: baseY + waveOffset + randomY,
    };
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

    // ── Layer 1: Biome base texture (organic, nature-themed) ────────────────
    const textureKey = `biome_${biome.biomeType}`;
    if (this.textures.exists(textureKey)) {
      const base = this.add.tileSprite(
        0,
        0,
        biome.width,
        biome.height,
        textureKey,
      );
      base.setOrigin(0, 0);
      biomeContainer.add(base);
    } else {
      // Fallback to solid color if texture not loaded
      const base = this.add.graphics();
      const palette = BIOME_PALETTES[biome.biomeType];
      base.fillStyle(palette?.primary ?? 0x2d5016, 1);
      base.fillRect(0, 0, biome.width, biome.height);
      biomeContainer.add(base);
    }

    // ── Layer 2: Organic border (grass/sand edges, not straight lines) ──────
    const borderGfx = this.add.graphics();
    borderGfx.lineStyle(6, biome.pathColor, 0.4);

    // Draw wavy organic border
    borderGfx.beginPath();
    borderGfx.moveTo(0, 0);

    // Top edge with waves
    for (let x = 0; x < biome.width; x += 20) {
      const wave = Math.sin(x * 0.05) * 8;
      borderGfx.lineTo(x, wave);
    }
    borderGfx.lineTo(biome.width, 0);

    // Right edge
    for (let y = 0; y < biome.height; y += 20) {
      const wave = Math.sin(y * 0.05) * 8;
      borderGfx.lineTo(biome.width + wave, y);
    }

    // Bottom edge
    for (let x = biome.width; x >= 0; x -= 20) {
      const wave = Math.sin(x * 0.05) * 8;
      borderGfx.lineTo(x, biome.height + wave);
    }

    // Left edge
    for (let y = biome.height; y >= 0; y -= 20) {
      const wave = Math.sin(y * 0.05) * 8;
      borderGfx.lineTo(wave, y);
    }

    borderGfx.closePath();
    borderGfx.strokePath();
    biomeContainer.add(borderGfx);

    // ── Layer 3: Header banner (wooden sign style) ──────────────────────────
    const headerBg = this.add.graphics();
    headerBg.fillStyle(0x3e2723, 0.85);
    headerBg.fillRoundedRect(20, 10, biome.width - 40, 70, 8);

    // Wood grain effect
    headerBg.lineStyle(2, 0x4e342e, 0.6);
    for (let i = 0; i < 3; i++) {
      headerBg.lineBetween(30, 25 + i * 20, biome.width - 30, 25 + i * 20);
    }
    biomeContainer.add(headerBg);

    // ── Layer 4: Biome name and subtitle ────────────────────────────────────
    const label = this.add.text(biome.width / 2, 20, biome.name, {
      fontSize: "22px",
      fontFamily: '"Georgia", serif',
      color: "#FFE082",
      fontStyle: "bold",
      stroke: "#1a1a1a",
      strokeThickness: 3,
      letterSpacing: 1,
    });
    label.setOrigin(0.5, 0);
    biomeContainer.add(label);

    const biomeName = this.add.text(biome.width / 2, 45, biome.biomeName, {
      fontSize: "16px",
      fontFamily: '"Georgia", serif',
      color: "#BCAAA4",
      fontStyle: "italic",
      stroke: "#000000",
      strokeThickness: 2,
    });
    biomeName.setOrigin(0.5, 0);
    biomeContainer.add(biomeName);

    const subtitle = this.add.text(biome.width / 2, 65, biome.subtitle, {
      fontSize: "11px",
      fontFamily: "Arial, sans-serif",
      color: "rgba(255,255,255,0.75)",
      stroke: "#000000",
      strokeThickness: 1,
    });
    subtitle.setOrigin(0.5, 0);
    biomeContainer.add(subtitle);

    // ── Layer 5: Large background icon (biome emoji) ────────────────────────
    const icon = this.add.text(
      biome.width / 2,
      biome.height / 2 + 40,
      biome.icon,
      {
        fontSize: "96px",
      },
    );
    icon.setOrigin(0.5);
    icon.setAlpha(0.12);
    biomeContainer.add(icon);

    // ── Layer 6: Biome decorations (trees, rocks, etc.) ─────────────────────
    this.addBiomeDecorations(biomeContainer, biome);

    // Track that this biome has been loaded
    this.loadedBiomes.add(index);
    this.biomeContainers.set(index, biomeContainer);
    console.log(
      `[LAZY LOADING] Biome ${index} loaded successfully. Total loaded: ${this.loadedBiomes.size}/8`,
    );
  }

  /**
   * Add biome-specific decorations (trees, rocks, crystals, etc.)
   */
  private addBiomeDecorations(
    container: Phaser.GameObjects.Container,
    biome: VentureBiome,
  ): void {
    const gfx = this.add.graphics();

    // Add decorations based on biome type
    switch (biome.biomeType) {
      case "forest":
        // Trees
        for (let i = 0; i < 8; i++) {
          const x = Math.random() * biome.width;
          const y = Math.random() * biome.height;
          gfx.fillStyle(0x4a7c2f, 0.6);
          gfx.fillCircle(x, y, 15);
          gfx.fillStyle(0x6b4423, 0.8);
          gfx.fillRect(x - 3, y + 10, 6, 15);
        }
        break;

      case "desert":
        // Rocks
        for (let i = 0; i < 12; i++) {
          const x = Math.random() * biome.width;
          const y = Math.random() * biome.height;
          gfx.fillStyle(0x8b7355, 0.7);
          gfx.fillRect(x, y, 8 + Math.random() * 8, 8 + Math.random() * 8);
        }
        break;

      case "dungeon":
        // Torches
        for (let i = 0; i < 6; i++) {
          const x = 50 + i * (biome.width / 6);
          const y = 100;
          gfx.fillStyle(0x3a3a4a, 1);
          gfx.fillRect(x - 2, y, 4, 25);
          gfx.fillStyle(0xff6f00, 0.7);
          gfx.fillCircle(x, y - 5, 6);
        }
        break;

      case "tundra":
        // Ice crystals
        for (let i = 0; i < 10; i++) {
          const x = Math.random() * biome.width;
          const y = Math.random() * biome.height;
          gfx.fillStyle(0x7fb3d5, 0.6);
          gfx.fillRect(x, y, 4, 8);
          gfx.fillRect(x - 2, y + 4, 8, 4);
        }
        break;

      case "mine":
        // Gem veins
        for (let i = 0; i < 15; i++) {
          const x = Math.random() * biome.width;
          const y = Math.random() * biome.height;
          gfx.fillStyle(0xffa726, 0.5);
          gfx.fillCircle(x, y, 8);
          gfx.fillStyle(0xff6f00, 1);
          gfx.fillRect(x - 2, y - 2, 4, 4);
        }
        break;

      case "harbour":
        // Barrels and crates
        for (let i = 0; i < 8; i++) {
          const x = 50 + Math.random() * (biome.width - 100);
          const y = 150 + Math.random() * (biome.height - 200);
          gfx.fillStyle(0x795548, 0.8);
          gfx.fillRect(x, y, 20, 25);
          gfx.lineStyle(1, 0x3e2723, 1);
          gfx.strokeRect(x, y, 20, 25);
        }
        break;

      case "floatingIsle":
        // Rune stones
        for (let i = 0; i < 6; i++) {
          const x = Math.random() * biome.width;
          const y = Math.random() * biome.height;
          gfx.fillStyle(0x9e9e9e, 0.7);
          gfx.fillRect(x, y, 12, 18);
          gfx.fillStyle(0xb39ddb, 0.6);
          gfx.fillCircle(x + 6, y + 9, 4);
        }
        break;

      case "capital":
        // Golden pillars
        for (let i = 0; i < 5; i++) {
          const x = 100 + i * (biome.width / 5);
          const y = biome.height - 80;
          gfx.fillStyle(0xffd54f, 0.8);
          gfx.fillRect(x - 8, y, 16, 60);
          gfx.fillStyle(0xffb300, 1);
          gfx.fillRect(x - 10, y - 5, 20, 5);
        }
        break;
    }

    container.add(gfx);
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
   * Create adventure-themed background with sky, clouds, and mountains
   */
  private createAdventureBackground(): void {
    // === BACKGROUND LAYER (0.3x parallax - furthest) ===
    // Sky gradient - changes from dawn to dusk based on progress
    const bg = this.add.graphics();

    // Sky gradient (blue to lighter blue)
    bg.fillGradientStyle(0x87ceeb, 0x87ceeb, 0xe0f6ff, 0xe0f6ff, 1);
    bg.fillRect(0, 0, this.MAP_WIDTH, this.MAP_HEIGHT);

    bg.setDepth(-200);
    this.backgroundLayer.add(bg);

    // Distant mountains (furthest layer - 0.3x parallax)
    const distantMountains = this.add.graphics();
    distantMountains.fillStyle(0x5a6d7e, 0.4);

    for (let x = 0; x < this.MAP_WIDTH; x += 400) {
      const height = 200 + Math.random() * 150;
      distantMountains.beginPath();
      distantMountains.moveTo(x, this.MAP_HEIGHT);
      distantMountains.lineTo(x + 200, this.MAP_HEIGHT - height);
      distantMountains.lineTo(x + 400, this.MAP_HEIGHT);
      distantMountains.closePath();
      distantMountains.fillPath();
    }

    distantMountains.setDepth(-190);
    this.backgroundLayer.add(distantMountains);

    // High clouds (background layer)
    const distantClouds = this.add.graphics();
    distantClouds.fillStyle(0xffffff, 0.3);
    for (let i = 0; i < 50; i++) {
      const x = Math.random() * this.MAP_WIDTH;
      const y = Math.random() * (this.MAP_HEIGHT * 0.4);
      const size = Math.random() * 40 + 30;
      distantClouds.fillEllipse(x, y, size * 2, size);
      distantClouds.fillEllipse(x + size, y, size * 1.5, size * 0.8);
    }
    distantClouds.setDepth(-180);
    this.backgroundLayer.add(distantClouds);

    // === MIDGROUND LAYER (0.6x parallax - medium distance) ===
    // Mid-range mountains
    const midMountains = this.add.graphics();
    midMountains.fillStyle(0x6b8e9e, 0.6);

    for (let x = 0; x < this.MAP_WIDTH; x += 350) {
      const height = 250 + Math.random() * 200;
      midMountains.beginPath();
      midMountains.moveTo(x, this.MAP_HEIGHT);
      midMountains.lineTo(x + 175, this.MAP_HEIGHT - height);
      midMountains.lineTo(x + 350, this.MAP_HEIGHT);
      midMountains.closePath();
      midMountains.fillPath();
    }

    midMountains.setDepth(-100);
    this.midgroundLayer.add(midMountains);

    // Medium clouds
    const midClouds = this.add.graphics();
    midClouds.fillStyle(0xffffff, 0.5);
    for (let i = 0; i < 40; i++) {
      const x = Math.random() * this.MAP_WIDTH;
      const y = Math.random() * (this.MAP_HEIGHT * 0.5);
      const size = Math.random() * 50 + 40;
      midClouds.fillEllipse(x, y, size * 2, size);
      midClouds.fillEllipse(x + size * 0.7, y - 10, size * 1.8, size * 0.9);
      midClouds.fillEllipse(x - size * 0.5, y + 5, size * 1.5, size * 0.7);
    }
    midClouds.setDepth(-90);
    this.midgroundLayer.add(midClouds);

    // === FOREGROUND LAYER (1.0x - closest elements, no parallax) ===
    // Foreground hills (at ground level with biomes)
    const foregroundHills = this.add.graphics();
    foregroundHills.fillStyle(0x4a7c2f, 0.3);

    for (let x = 0; x < this.MAP_WIDTH; x += 300) {
      const height = 100 + Math.random() * 80;
      foregroundHills.beginPath();
      foregroundHills.moveTo(x, this.MAP_HEIGHT);
      foregroundHills.lineTo(x + 150, this.MAP_HEIGHT - height);
      foregroundHills.lineTo(x + 300, this.MAP_HEIGHT);
      foregroundHills.closePath();
      foregroundHills.fillPath();
    }

    foregroundHills.setDepth(-50);
    this.gameLayer.add(foregroundHills);

    // Birds in the sky
    const birds = this.add.graphics();
    birds.lineStyle(2, 0x000000, 0.6);
    for (let i = 0; i < 15; i++) {
      const x = Math.random() * this.MAP_WIDTH;
      const y = Math.random() * (this.MAP_HEIGHT * 0.3);
      // Simple 'V' shape for birds
      birds.beginPath();
      birds.moveTo(x - 5, y);
      birds.lineTo(x, y - 3);
      birds.lineTo(x + 5, y);
      birds.strokePath();
    }
    birds.setDepth(-40);
    this.gameLayer.add(birds);
  }

  /**
   * Create organic dirt/grass path connecting biomes (adventure style)
   */
  private createAdventurePath(): void {
    const pathGraphics = this.add.graphics();

    // Calculate center points of each biome
    const biomeCenters = VENTURE_BIOMES.map((biome) => ({
      x: biome.x + biome.width / 2,
      y: biome.y + biome.height / 2,
      id: biome.id,
      pathColor: biome.pathColor,
    }));

    // Draw organic path between consecutive biomes
    for (let i = 0; i < biomeCenters.length - 1; i++) {
      const start = biomeCenters[i];
      const end = biomeCenters[i + 1];

      this.drawOrganicPath(
        pathGraphics,
        start.x,
        start.y,
        end.x,
        end.y,
        start.pathColor,
      );
    }

    pathGraphics.setDepth(-10);
    this.backgroundLayer.add(pathGraphics);
  }

  /**
   * Draw organic dirt path with natural edges (adventure style)
   */
  private drawOrganicPath(
    graphics: Phaser.GameObjects.Graphics,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    color: number,
  ): void {
    const distance = Phaser.Math.Distance.Between(x1, y1, x2, y2);
    const segments = Math.floor(distance / 40);

    // Path base (dirt)
    graphics.fillStyle(color, 0.8);

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const x = x1 + (x2 - x1) * t;
      const y = y1 + (y2 - y1) * t;

      // Natural wave variation
      const wave = Math.sin(t * Math.PI * 4) * 15;
      const perpX = -(y2 - y1) / distance;
      const perpY = (x2 - x1) / distance;

      // Draw path segment with organic width
      const width = 25 + Math.sin(t * Math.PI * 8) * 5;
      graphics.fillEllipse(
        x + perpX * wave,
        y + perpY * wave,
        width,
        width * 0.6,
      );
    }

    // Add edge grass tufts
    graphics.fillStyle(0x4a7c2f, 0.5);
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const x = x1 + (x2 - x1) * t;
      const y = y1 + (y2 - y1) * t;

      const wave = Math.sin(t * Math.PI * 4) * 15;
      const perpX = -(y2 - y1) / distance;
      const perpY = (x2 - x1) / distance;

      // Random grass on edges
      if (Math.random() > 0.7) {
        graphics.fillRect(
          x + perpX * (wave + 20),
          y + perpY * (wave + 20),
          3,
          6,
        );
      }
      if (Math.random() > 0.7) {
        graphics.fillRect(
          x + perpX * (wave - 20),
          y + perpY * (wave - 20),
          3,
          6,
        );
      }
    }

    // Add pebbles along path
    graphics.fillStyle(0x5a3a1a, 0.7);
    for (let i = 0; i < distance / 60; i++) {
      const t = Math.random();
      const x = x1 + (x2 - x1) * t;
      const y = y1 + (y2 - y1) * t;
      const wave = Math.sin(t * Math.PI * 4) * 15;
      const perpX = -(y2 - y1) / distance;
      const perpY = (x2 - x1) / distance;

      graphics.fillCircle(
        x + perpX * wave + (Math.random() - 0.5) * 20,
        y + perpY * wave + (Math.random() - 0.5) * 20,
        Math.random() * 3 + 1,
      );
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
