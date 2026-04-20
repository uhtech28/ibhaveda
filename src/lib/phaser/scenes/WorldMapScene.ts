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

    // ── Layer 1: Premium glassmorphism card with depth ──────────────────────
    const glassCard = this.add.graphics();
    
    // Multi-layer shadow for depth
    glassCard.fillStyle(0x000000, 0.3);
    glassCard.fillRoundedRect(8, 8, biome.width, biome.height, 16);
    
    // Main card with gradient
    glassCard.fillGradientStyle(
      0x1a1f35, 0x1a1f35, // Top: Dark with purple tint
      0x0f1420, 0x0f1420, // Bottom: Darker
      0.95 // High opacity for solid feel
    );
    glassCard.fillRoundedRect(0, 0, biome.width, biome.height, 16);
    
    // Inner highlight (top edge)
    glassCard.fillGradientStyle(
      0xffffff, 0xffffff,
      0xffffff, 0xffffff,
      0.08, 0.08, 0.02, 0.02
    );
    glassCard.fillRoundedRect(2, 2, biome.width - 4, biome.height / 3, 14);
    
    // Glowing border with theme color
    glassCard.lineStyle(2, biome.pathColor, 0.6);
    glassCard.strokeRoundedRect(1, 1, biome.width - 2, biome.height - 2, 15);
    
    // Outer subtle border
    glassCard.lineStyle(1, biome.pathColor, 0.2);
    glassCard.strokeRoundedRect(0, 0, biome.width, biome.height, 16);
    
    biomeContainer.add(glassCard);

    // ── Layer 2: Animated accent line with glow ─────────────────────────────
    const accentGlow = this.add.graphics();
    
    // Glow effect
    for (let i = 0; i < 5; i++) {
      const alpha = (5 - i) * 0.08;
      accentGlow.lineStyle(6 + i * 2, biome.pathColor, alpha);
      accentGlow.lineBetween(20, 0, biome.width - 20, 0);
    }
    
    // Main accent line
    accentGlow.lineStyle(4, biome.pathColor, 0.9);
    accentGlow.lineBetween(20, 0, biome.width - 20, 0);
    
    biomeContainer.add(accentGlow);

    // ── Layer 3: Premium header card with depth ─────────────────────────────
    const headerCard = this.add.graphics();
    
    // Header shadow
    headerCard.fillStyle(0x000000, 0.2);
    headerCard.fillRoundedRect(22, 17, biome.width - 44, 85, 12);
    
    // Header card with gradient
    headerCard.fillGradientStyle(
      0x1f2540, 0x1f2540, // Top
      0x151a2e, 0x151a2e, // Bottom
      0.9
    );
    headerCard.fillRoundedRect(20, 15, biome.width - 40, 85, 12);
    
    // Inner glow
    headerCard.lineStyle(1, biome.pathColor, 0.4);
    headerCard.strokeRoundedRect(21, 16, biome.width - 42, 83, 11);
    
    // Outer border
    headerCard.lineStyle(1, biome.pathColor, 0.2);
    headerCard.strokeRoundedRect(20, 15, biome.width - 40, 85, 12);
    
    biomeContainer.add(headerCard);

    // ── Layer 4: Stage name with glow effect ────────────────────────────────
    const labelGlow = this.add.text(biome.width / 2, 28, biome.name, {
      fontSize: "26px",
      fontFamily: '"Inter", "SF Pro Display", system-ui, sans-serif',
      color: "#ffffff",
      fontStyle: "900",
      stroke: `#${biome.pathColor.toString(16).padStart(6, '0')}`,
      strokeThickness: 6,
      letterSpacing: 3,
    });
    labelGlow.setOrigin(0.5, 0);
    labelGlow.setAlpha(0.4);
    biomeContainer.add(labelGlow);
    
    const label = this.add.text(biome.width / 2, 28, biome.name, {
      fontSize: "26px",
      fontFamily: '"Inter", "SF Pro Display", system-ui, sans-serif',
      color: "#F9FAFB",
      fontStyle: "900",
      strokeThickness: 0,
      letterSpacing: 3,
    });
    label.setOrigin(0.5, 0);
    biomeContainer.add(label);

    const biomeName = this.add.text(biome.width / 2, 58, biome.biomeName, {
      fontSize: "16px",
      fontFamily: '"Inter", system-ui, sans-serif',
      color: "#A5B4FC",
      fontStyle: "600",
      strokeThickness: 0,
      letterSpacing: 1,
    });
    biomeName.setOrigin(0.5, 0);
    biomeContainer.add(biomeName);

    const subtitle = this.add.text(biome.width / 2, 80, biome.subtitle, {
      fontSize: "12px",
      fontFamily: '"Inter", system-ui, sans-serif',
      color: "rgba(156, 163, 175, 0.9)",
      strokeThickness: 0,
      letterSpacing: 0.5,
    });
    subtitle.setOrigin(0.5, 0);
    biomeContainer.add(subtitle);

    // ── Layer 5: Large background icon with premium glow ────────────────────
    const iconGlow = this.add.graphics();
    const iconX = biome.width / 2;
    const iconY = biome.height / 2 + 60;
    
    // Multi-layer radial glow
    for (let r = 180; r > 0; r -= 12) {
      const alpha = (1 - r / 180) * 0.12;
      iconGlow.fillStyle(biome.pathColor, alpha);
      iconGlow.fillCircle(iconX, iconY, r);
    }
    
    // Bright center glow
    for (let r = 80; r > 0; r -= 8) {
      const alpha = (1 - r / 80) * 0.2;
      iconGlow.fillStyle(0xffffff, alpha);
      iconGlow.fillCircle(iconX, iconY, r);
    }
    
    biomeContainer.add(iconGlow);
    
    // Icon shadow
    const iconShadow = this.add.text(iconX + 3, iconY + 3, biome.icon, {
      fontSize: "110px",
    });
    iconShadow.setOrigin(0.5);
    iconShadow.setAlpha(0.3);
    iconShadow.setTint(0x000000);
    biomeContainer.add(iconShadow);
    
    // Main icon
    const icon = this.add.text(iconX, iconY, biome.icon, {
      fontSize: "110px",
    });
    icon.setOrigin(0.5);
    icon.setAlpha(0.25);
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
   * Add modern tech-themed decorations (data nodes, connection lines, etc.)
   * Matches Interactive Ideas platform aesthetic
   */
  private addBiomeDecorations(
    container: Phaser.GameObjects.Container,
    biome: VentureBiome,
  ): void {
    const gfx = this.add.graphics();

    // Add modern decorations based on biome type
    switch (biome.biomeType) {
      case "ideation":
        // Floating idea nodes with connections
        const nodes: { x: number; y: number }[] = [];
        for (let i = 0; i < 12; i++) {
          const x = Math.random() * biome.width;
          const y = 120 + Math.random() * (biome.height - 140);
          nodes.push({ x, y });
          
          // Node circle
          gfx.fillStyle(0x6366f1, 0.3);
          gfx.fillCircle(x, y, 8);
          gfx.fillStyle(0x6366f1, 0.6);
          gfx.fillCircle(x, y, 4);
        }
        
        // Connection lines between nearby nodes
        gfx.lineStyle(1, 0x6366f1, 0.15);
        for (let i = 0; i < nodes.length; i++) {
          for (let j = i + 1; j < nodes.length; j++) {
            const dist = Math.sqrt(
              Math.pow(nodes[i].x - nodes[j].x, 2) +
              Math.pow(nodes[i].y - nodes[j].y, 2)
            );
            if (dist < 150) {
              gfx.lineBetween(nodes[i].x, nodes[i].y, nodes[j].x, nodes[j].y);
            }
          }
        }
        break;

      case "research":
        // Data visualization bars
        for (let i = 0; i < 10; i++) {
          const x = 80 + i * (biome.width / 11);
          const height = 40 + Math.random() * 80;
          const y = biome.height - 100;
          
          gfx.fillStyle(0x10b981, 0.3);
          gfx.fillRoundedRect(x - 15, y - height, 30, height, 4);
          gfx.lineStyle(2, 0x10b981, 0.6);
          gfx.strokeRoundedRect(x - 15, y - height, 30, height, 4);
        }
        break;

      case "validation":
        // Checkmark patterns
        for (let i = 0; i < 8; i++) {
          const x = Math.random() * biome.width;
          const y = 120 + Math.random() * (biome.height - 140);
          
          gfx.lineStyle(3, 0x8b5cf6, 0.4);
          gfx.beginPath();
          gfx.moveTo(x - 10, y);
          gfx.lineTo(x - 3, y + 7);
          gfx.lineTo(x + 10, y - 10);
          gfx.strokePath();
        }
        break;

      case "design":
        // Design grid patterns
        gfx.lineStyle(1, 0xf59e0b, 0.2);
        for (let x = 50; x < biome.width - 50; x += 60) {
          for (let y = 120; y < biome.height - 50; y += 60) {
            gfx.strokeRect(x, y, 50, 50);
          }
        }
        break;

      case "development":
        // Code brackets
        for (let i = 0; i < 15; i++) {
          const x = Math.random() * biome.width;
          const y = 120 + Math.random() * (biome.height - 140);
          
          gfx.lineStyle(2, 0x3b82f6, 0.4);
          // Left bracket
          gfx.beginPath();
          gfx.moveTo(x, y - 8);
          gfx.lineTo(x - 5, y - 8);
          gfx.lineTo(x - 5, y + 8);
          gfx.lineTo(x, y + 8);
          gfx.strokePath();
          
          // Right bracket
          gfx.beginPath();
          gfx.moveTo(x + 20, y - 8);
          gfx.lineTo(x + 25, y - 8);
          gfx.lineTo(x + 25, y + 8);
          gfx.lineTo(x + 20, y + 8);
          gfx.strokePath();
        }
        break;

      case "launch":
        // Rocket trails
        for (let i = 0; i < 6; i++) {
          const x = 100 + i * (biome.width / 7);
          const y = biome.height - 80;
          
          gfx.lineStyle(3, 0xef4444, 0.5);
          gfx.lineBetween(x, y, x - 10, y + 30);
          gfx.lineStyle(2, 0xfbbf24, 0.6);
          gfx.lineBetween(x + 5, y, x - 5, y + 25);
        }
        break;

      case "growth":
        // Growth arrows
        for (let i = 0; i < 10; i++) {
          const x = Math.random() * biome.width;
          const y = 150 + Math.random() * (biome.height - 180);
          
          gfx.lineStyle(2, 0x06b6d4, 0.5);
          gfx.lineBetween(x, y + 20, x, y);
          // Arrow head
          gfx.lineBetween(x, y, x - 5, y + 8);
          gfx.lineBetween(x, y, x + 5, y + 8);
        }
        break;

      case "scale":
        // Star patterns (success)
        for (let i = 0; i < 12; i++) {
          const x = Math.random() * biome.width;
          const y = 120 + Math.random() * (biome.height - 140);
          const size = 6 + Math.random() * 4;
          
          gfx.fillStyle(0xfbbf24, 0.5);
          gfx.fillStar(x, y, 5, size, size * 0.5);
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
   * Create premium game-like background with stunning visuals
   * Theme: Deep space with nebula clouds, stars, and dynamic lighting
   */
  private createAdventureBackground(): void {
    // === LAYER 1: Deep Space Base (Darkest) ===
    const deepSpace = this.add.graphics();
    
    // Rich gradient from deep purple to dark blue
    deepSpace.fillGradientStyle(
      0x0f0520, // Top: Very dark purple
      0x0f0520,
      0x0a0d1f, // Bottom: Dark blue-black
      0x1a1535, // Bottom right: Purple tint
      1
    );
    deepSpace.fillRect(0, 0, this.MAP_WIDTH, this.MAP_HEIGHT);
    deepSpace.setDepth(-200);
    this.backgroundLayer.add(deepSpace);

    // === LAYER 2: Nebula Clouds (Massive, Colorful) ===
    const nebulaClouds = this.add.graphics();
    
    // Create 5 large nebula formations
    const nebulaColors = [
      { color: 0x6366f1, x: 0.15, y: 0.3 },      // Indigo
      { color: 0x8b5cf6, x: 0.35, y: 0.6 },      // Purple
      { color: 0xa855f7, x: 0.55, y: 0.4 },      // Bright purple
      { color: 0x4f46e5, x: 0.75, y: 0.5 },      // Deep indigo
      { color: 0x7c3aed, x: 0.90, y: 0.35 },     // Violet
    ];

    nebulaColors.forEach((nebula) => {
      const centerX = this.MAP_WIDTH * nebula.x;
      const centerY = this.MAP_HEIGHT * nebula.y;
      
      // Create massive nebula cloud with multiple layers
      for (let layer = 0; layer < 5; layer++) {
        const radius = 400 + layer * 120;
        const segments = 32;
        
        for (let i = 0; i < segments; i++) {
          const angle = (i / segments) * Math.PI * 2;
          const nextAngle = ((i + 1) / segments) * Math.PI * 2;
          
          // Irregular cloud shape
          const variation = Math.sin(angle * 3) * 80 + Math.cos(angle * 5) * 60;
          const r = radius + variation;
          
          const x1 = centerX + Math.cos(angle) * r;
          const y1 = centerY + Math.sin(angle) * r;
          const x2 = centerX + Math.cos(nextAngle) * r;
          const y2 = centerY + Math.sin(nextAngle) * r;
          
          const alpha = (0.12 - layer * 0.02) * (1 - i / segments * 0.3);
          nebulaClouds.fillStyle(nebula.color, alpha);
          nebulaClouds.fillTriangle(centerX, centerY, x1, y1, x2, y2);
        }
      }
    });
    
    nebulaClouds.setDepth(-190);
    this.backgroundLayer.add(nebulaClouds);

    // === LAYER 3: Star Field (Thousands of Stars) ===
    const starField = this.add.graphics();
    
    // Small distant stars
    for (let i = 0; i < 800; i++) {
      const x = Math.random() * this.MAP_WIDTH;
      const y = Math.random() * this.MAP_HEIGHT;
      const size = Math.random() * 1.5 + 0.5;
      const alpha = Math.random() * 0.6 + 0.2;
      
      starField.fillStyle(0xffffff, alpha);
      starField.fillCircle(x, y, size);
    }
    
    // Medium bright stars
    for (let i = 0; i < 200; i++) {
      const x = Math.random() * this.MAP_WIDTH;
      const y = Math.random() * this.MAP_HEIGHT;
      const size = Math.random() * 2 + 1;
      const alpha = Math.random() * 0.8 + 0.3;
      
      starField.fillStyle(0xffffff, alpha);
      starField.fillCircle(x, y, size);
      
      // Add glow to some stars
      if (Math.random() > 0.7) {
        starField.fillStyle(0x818cf8, alpha * 0.3);
        starField.fillCircle(x, y, size * 3);
      }
    }
    
    // Large prominent stars with cross flare
    for (let i = 0; i < 50; i++) {
      const x = Math.random() * this.MAP_WIDTH;
      const y = Math.random() * this.MAP_HEIGHT;
      const size = Math.random() * 3 + 2;
      
      // Star core
      starField.fillStyle(0xffffff, 0.9);
      starField.fillCircle(x, y, size);
      
      // Glow
      starField.fillStyle(0xa5b4fc, 0.4);
      starField.fillCircle(x, y, size * 2.5);
      
      // Cross flare
      starField.fillStyle(0xffffff, 0.6);
      starField.fillRect(x - size * 4, y - 0.5, size * 8, 1);
      starField.fillRect(x - 0.5, y - size * 4, 1, size * 8);
    }
    
    starField.setDepth(-180);
    this.backgroundLayer.add(starField);

    // === LAYER 4: Cosmic Dust Particles ===
    const cosmicDust = this.add.graphics();
    
    for (let i = 0; i < 300; i++) {
      const x = Math.random() * this.MAP_WIDTH;
      const y = Math.random() * this.MAP_HEIGHT;
      const size = Math.random() * 2 + 0.5;
      const alpha = Math.random() * 0.15 + 0.05;
      
      const colors = [0x6366f1, 0x8b5cf6, 0xa855f7, 0x818cf8];
      const color = colors[Math.floor(Math.random() * colors.length)];
      
      cosmicDust.fillStyle(color, alpha);
      cosmicDust.fillCircle(x, y, size);
    }
    
    cosmicDust.setDepth(-170);
    this.backgroundLayer.add(cosmicDust);

    // === MIDGROUND LAYER (0.6x parallax - medium distance) ===
    // Floating energy orbs with trails
    const energyOrbs = this.add.graphics();
    
    for (let i = 0; i < 60; i++) {
      const x = Math.random() * this.MAP_WIDTH;
      const y = Math.random() * this.MAP_HEIGHT;
      const size = Math.random() * 8 + 4;
      const alpha = Math.random() * 0.4 + 0.2;
      
      const colors = [0x6366f1, 0x8b5cf6, 0xa855f7, 0x818cf8];
      const color = colors[Math.floor(Math.random() * colors.length)];
      
      // Outer glow
      for (let r = size * 3; r > 0; r -= 2) {
        const glowAlpha = alpha * (1 - r / (size * 3)) * 0.3;
        energyOrbs.fillStyle(color, glowAlpha);
        energyOrbs.fillCircle(x, y, r);
      }
      
      // Core
      energyOrbs.fillStyle(color, alpha);
      energyOrbs.fillCircle(x, y, size);
      
      // Bright center
      energyOrbs.fillStyle(0xffffff, alpha * 0.8);
      energyOrbs.fillCircle(x, y, size * 0.4);
    }
    
    energyOrbs.setDepth(-100);
    this.midgroundLayer.add(energyOrbs);

    // Constellation lines (connecting bright points)
    const constellations = this.add.graphics();
    const constellationPoints: { x: number; y: number }[] = [];
    
    // Create constellation nodes
    for (let i = 0; i < 25; i++) {
      const x = Math.random() * this.MAP_WIDTH;
      const y = Math.random() * this.MAP_HEIGHT;
      constellationPoints.push({ x, y });
      
      // Draw node
      constellations.fillStyle(0x818cf8, 0.6);
      constellations.fillCircle(x, y, 3);
      constellations.fillStyle(0xa5b4fc, 0.3);
      constellations.fillCircle(x, y, 6);
    }
    
    // Connect nearby points
    constellations.lineStyle(1, 0x6366f1, 0.15);
    for (let i = 0; i < constellationPoints.length; i++) {
      for (let j = i + 1; j < constellationPoints.length; j++) {
        const dist = Math.sqrt(
          Math.pow(constellationPoints[i].x - constellationPoints[j].x, 2) +
          Math.pow(constellationPoints[i].y - constellationPoints[j].y, 2)
        );
        
        if (dist < 300) {
          constellations.lineBetween(
            constellationPoints[i].x,
            constellationPoints[i].y,
            constellationPoints[j].x,
            constellationPoints[j].y
          );
        }
      }
    }
    
    constellations.setDepth(-90);
    this.midgroundLayer.add(constellations);

    // === FOREGROUND LAYER (1.0x - closest elements, no parallax) ===
    // Atmospheric light rays (god rays effect)
    const lightRays = this.add.graphics();
    
    for (let i = 0; i < 8; i++) {
      const x = (i * this.MAP_WIDTH) / 7;
      const y = -100;
      const angle = (Math.random() - 0.5) * 0.3;
      const width = 150 + Math.random() * 100;
      const height = this.MAP_HEIGHT + 200;
      
      // Create light ray with gradient
      for (let j = 0; j < 10; j++) {
        const alpha = (0.08 - j * 0.008) * (1 - i / 8 * 0.3);
        const offset = j * 15;
        
        lightRays.fillStyle(0x6366f1, alpha);
        lightRays.save();
        lightRays.translateCanvas(x, y);
        lightRays.rotateCanvas(angle);
        lightRays.fillRect(-width / 2 - offset, 0, width + offset * 2, height);
        lightRays.restore();
      }
    }
    
    lightRays.setDepth(-50);
    this.gameLayer.add(lightRays);

    // Floating sparkles (closest layer)
    const sparkles = this.add.graphics();
    
    for (let i = 0; i < 100; i++) {
      const x = Math.random() * this.MAP_WIDTH;
      const y = Math.random() * this.MAP_HEIGHT;
      const size = Math.random() * 2 + 1;
      const alpha = Math.random() * 0.6 + 0.3;
      
      // Diamond sparkle shape
      sparkles.fillStyle(0xffffff, alpha);
      sparkles.fillTriangle(
        x, y - size * 2,
        x - size, y,
        x, y + size * 2
      );
      sparkles.fillTriangle(
        x, y - size * 2,
        x + size, y,
        x, y + size * 2
      );
      
      // Glow
      sparkles.fillStyle(0xa5b4fc, alpha * 0.3);
      sparkles.fillCircle(x, y, size * 2);
    }
    
    sparkles.setDepth(-40);
    this.gameLayer.add(sparkles);
  }

  /**
   * Create modern connection path between biomes (tech aesthetic)
   * Smooth gradient lines with glow effects
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

    // Draw modern connection lines between consecutive biomes
    for (let i = 0; i < biomeCenters.length - 1; i++) {
      const start = biomeCenters[i];
      const end = biomeCenters[i + 1];

      this.drawModernPath(
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
