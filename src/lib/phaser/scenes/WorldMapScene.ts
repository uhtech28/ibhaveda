import * as Phaser from "phaser";
import { AssetLoader } from "../utils/asset-loader";
import { CheckpointNode, CheckpointStatus } from "../entities/Checkpoint";
import { Persona, PersonaGender } from "../entities/Persona";
import { BossSilhouette } from "../entities/Boss";
import { brightnessToPhaser } from "../utils/brightness-calculator";
import { eventBridge, type CheckpointState } from "../utils/event-bridge";
import { VENTURE_STAGES } from "@convex/ventureConstants";

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

  /** Container for interactive game elements (checkpoints, persona, bosses) */
  private gameLayer!: Phaser.GameObjects.Container;

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
  };

  /** Spaceship map layout constants (Among Us style) */
  private readonly SPACESHIP_WIDTH = 2400;
  private readonly SPACESHIP_HEIGHT = 1600;
  private readonly ROOM_PADDING = 80;

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

  /** Among Us "The Skeld" vivid room definitions — brighter, high-contrast */
  private readonly VENTURE_ROOMS = [
    {
      id: 1,
      name: "CAFETERIA",
      subtitle: "Ideation Headquarters",
      x: 1000, y: 100, width: 500, height: 400,
      color: 0x3d2b55,          // deep purple base
      brightColor: 0x7c5fa0,    // vivid purple fill
      borderColor: 0xc084fc,    // bright purple glow
      headerColor: 0x9333ea,
      checkpoints: 4, icon: "💡", type: "cafeteria",
    },
    {
      id: 2,
      name: "MEDBAY",
      subtitle: "Research & Analysis",
      x: 600, y: 200, width: 300, height: 350,
      color: 0x1a3d3e,
      brightColor: 0x2d7d82,
      borderColor: 0x06b6d4,    // cyan glow
      headerColor: 0x0891b2,
      checkpoints: 5, icon: "🔬", type: "medbay",
    },
    {
      id: 3,
      name: "REACTOR",
      subtitle: "Validation Chamber",
      x: 100, y: 500, width: 350, height: 350,
      color: 0x1e3040,
      brightColor: 0x2e5f7a,
      borderColor: 0x38bdf8,    // sky blue
      headerColor: 0x0369a1,
      checkpoints: 4, icon: "✓", type: "reactor",
    },
    {
      id: 4,
      name: "SECURITY",
      subtitle: "Design Studio",
      x: 600, y: 600, width: 250, height: 250,
      color: 0x3d2010,
      brightColor: 0x7a4020,
      borderColor: 0xf97316,    // vivid orange
      headerColor: 0xea580c,
      checkpoints: 5, icon: "🎨", type: "security",
    },
    {
      id: 5,
      name: "ELECTRICAL",
      subtitle: "Dev Station",
      x: 1000, y: 850, width: 350, height: 400,
      color: 0x2a1a10,
      brightColor: 0x5a3520,
      borderColor: 0xfbbf24,    // bright amber
      headerColor: 0xd97706,
      checkpoints: 6, icon: "⚙️", type: "electrical",
    },
    {
      id: 6,
      name: "NAVIGATION",
      subtitle: "Launch Pad",
      x: 1800, y: 500, width: 300, height: 350,
      color: 0x0c2a3d,
      brightColor: 0x155e75,
      borderColor: 0x22d3ee,    // bright cyan
      headerColor: 0x0891b2,
      checkpoints: 3, icon: "🚀", type: "navigation",
    },
    {
      id: 7,
      name: "ADMIN",
      subtitle: "Iteration Hub",
      x: 1300, y: 550, width: 350, height: 250,
      color: 0x152535,
      brightColor: 0x1e3a4a,
      borderColor: 0x94a3b8,    // steel blue
      headerColor: 0x475569,
      checkpoints: 4, icon: "🔄", type: "admin",
    },
    {
      id: 8,
      name: "COMMUNICATIONS",
      subtitle: "Scale Command",
      x: 1600, y: 900, width: 400, height: 250,
      color: 0x2a1a45,
      brightColor: 0x5b3d8b,
      borderColor: 0xa78bfa,    // bright violet
      headerColor: 0x7c3aed,
      checkpoints: 5, icon: "👑", type: "comms",
    },
  ];

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
    // Initialize layer containers
    this.backgroundLayer = this.add.container(0, 0);
    this.backgroundLayer.setDepth(0);

    this.gameLayer = this.add.container(0, 0);
    this.gameLayer.setDepth(10);

    // Create spaceship background with stars
    this.createSpaceshipBackground();

    // Create spaceship rooms (replaces biome zones)
    this.createSpaceshipRooms();

    // Draw red dotted path connecting rooms (Among Us style)
    this.createSpaceshipPath();

    // Bind event handlers
    this.boundHandlers.updateBrightness =
      this.handleUpdateBrightness.bind(this);
    this.boundHandlers.updateCheckpoints =
      this.handleUpdateCheckpoints.bind(this);
    this.boundHandlers.setActiveVenture =
      this.handleSetActiveVenture.bind(this);
    this.boundHandlers.scrollToCheckpoint =
      this.handleScrollToCheckpoint.bind(this);

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

    // Setup camera for spaceship map (top-down view)
    this.cameras.main.setBounds(
      0,
      0,
      this.SPACESHIP_WIDTH,
      this.SPACESHIP_HEIGHT,
    );
    this.cameras.main.setZoom(0.6); // Zoom out to see whole spaceship
    this.cameras.main.centerOn(
      this.SPACESHIP_WIDTH / 2,
      this.SPACESHIP_HEIGHT / 2,
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
      const boost = 0.95 + rawBrightness * 0.1;    // 0.95 → 1.05
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
   * Calculate checkpoint position using snake path through 8 biomes
   *
   * The path flows left-to-right through biome zones with alternating
   * up/down sine wave pattern for visual interest.
   */
  private calculateCheckpointPosition(
    stage: number,
    checkpoint: number,
    _globalIndex: number,
  ): { x: number; y: number } {
    const room = this.VENTURE_ROOMS[stage - 1];
    if (!room) return { x: 0, y: 0 };

    // Arrange checkpoints in a grid inside the room
    const cols = Math.ceil(Math.sqrt(room.checkpoints));
    const row = Math.floor((checkpoint - 1) / cols);
    const col = (checkpoint - 1) % cols;

    // Spacing
    const spacingX = (room.width - 100) / (cols + 1);
    const spacingY =
      (room.height - 180) / (Math.ceil(room.checkpoints / cols) + 1);

    const x = room.x + 50 + (col + 1) * spacingX;
    const y = room.y + 120 + (row + 1) * spacingY;

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
   * Create Among Us style spaceship rooms with metallic industrial aesthetic
   */
  private createSpaceshipRooms(): void {
    this.VENTURE_ROOMS.forEach((room: any) => {
      const roomContainer = this.add.container(room.x, room.y);
      this.backgroundLayer.add(roomContainer);

      // ── Layer 1: Solid opaque base fill ─────────────────────────────────────
      const base = this.add.graphics();
      base.fillStyle(room.color, 1);                      // dark base
      base.fillRoundedRect(0, 0, room.width, room.height, 18);
      roomContainer.add(base);

      // ── Layer 2: Metallic floor texture (tinted with bright room color) ────
      if (this.textures.exists("skeld_floor")) {
        const floor = this.add.tileSprite(0, 0, room.width, room.height, "skeld_floor");
        floor.setOrigin(0, 0);
        floor.setAlpha(0.25);                             // subtle overlay only
        floor.setTint(room.brightColor ?? room.color);
        roomContainer.add(floor);
      }

      // ── Layer 3: Bright inner fill gives the room solid visual weight ───────
      const innerFill = this.add.graphics();
      innerFill.fillStyle(room.brightColor ?? room.color, 0.55);
      innerFill.fillRoundedRect(6, 6, room.width - 12, room.height - 12, 14);
      roomContainer.add(innerFill);

      // ── Layer 4: Colored header strip ────────────────────────────────────────
      const header = this.add.graphics();
      header.fillStyle(room.headerColor ?? room.borderColor, 0.9);
      header.fillRoundedRect(0, 0, room.width, 56, { tl: 18, tr: 18, bl: 0, br: 0 });
      roomContainer.add(header);

      // ── Layer 5: Borders & glow ───────────────────────────────────────────────
      const roomGfx = this.add.graphics();

      // Outer glow (wide, semi-transparent)
      roomGfx.lineStyle(8, room.borderColor, 0.35);
      roomGfx.strokeRoundedRect(-2, -2, room.width + 4, room.height + 4, 20);

      // Main border (crisp)
      roomGfx.lineStyle(3, room.borderColor, 1.0);
      roomGfx.strokeRoundedRect(0, 0, room.width, room.height, 18);

      // Inner inset border
      roomGfx.lineStyle(1, 0xffffff, 0.15);
      roomGfx.strokeRoundedRect(8, 8, room.width - 16, room.height - 16, 13);

      // Metallic rivets
      this.addRivets(roomGfx, room.width, room.height);

      roomContainer.add(roomGfx);

      // ── Layer 6: Room-specific decorations ────────────────────────────────────
      this.addRoomDecorations(roomContainer, room);

      // ── Layer 7: Room name (in header) ───────────────────────────────────────
      const label = this.add.text(room.width / 2, 14, room.name, {
        fontSize: "20px",
        fontFamily: '"Courier New", Courier, monospace',
        color: "#FFFFFF",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 2,
        letterSpacing: 2,
      });
      label.setOrigin(0.5, 0);
      roomContainer.add(label);

      // Subtitle below header
      const subtitle = this.add.text(room.width / 2, 38, room.subtitle, {
        fontSize: "11px",
        fontFamily: "Arial, sans-serif",
        color: "rgba(255,255,255,0.8)",
        stroke: "#000000",
        strokeThickness: 1,
      });
      subtitle.setOrigin(0.5, 0);
      roomContainer.add(subtitle);

      // ── Layer 8: Large background icon (tasteful opacity) ─────────────────────
      const icon = this.add.text(room.width / 2, room.height / 2 + 30, room.icon, {
        fontSize: "72px",
      });
      icon.setOrigin(0.5);
      icon.setAlpha(0.18);
      roomContainer.add(icon);
    });
  }

  /**
   * Add room-specific decorations like tables, vents, and consoles
   */
  private addRoomDecorations(container: Phaser.GameObjects.Container, room: any): void {
    const { width, height, type } = room;

    // 1. Add vents (common in many rooms)
    if (["security", "medbay", "electrical", "admin", "reactor"].includes(type)) {
      const vent = this.add.image(20, height - 20, "skeld_vent");
      vent.setScale(0.8);
      vent.setOrigin(0, 1);
      container.add(vent);
    }

    // 2. Add room-specific furniture
    switch (type) {
      case "cafeteria":
        // Central tables
        this.addTable(container, width / 2, height / 2);
        this.addTable(container, width / 2 - 120, height / 2 - 80);
        this.addTable(container, width / 2 + 120, height / 2 - 80);
        this.addTable(container, width / 2 - 120, height / 2 + 80);
        this.addTable(container, width / 2 + 120, height / 2 + 80);
        break;
      case "medbay":
        // Beds
        for (let y = 120; y < height - 60; y += 80) {
          const bed = this.add.rectangle(width - 40, y, 60, 40, 0xbdc3c7);
          bed.setStrokeStyle(2, 0x95a5a6);
          container.add(bed);
        }
        break;
      case "security":
        // Monitors console
        const console = this.add.rectangle(width / 2, 80, width - 40, 20, 0x2c3e50);
        container.add(console);
        for (let x = 60; x < width - 40; x += 60) {
          const screen = this.add.rectangle(x, 75, 40, 10, 0x3498db);
          container.add(screen);
        }
        break;
      case "reactor":
        // Central reactor core
        const core = this.add.circle(width / 2, height / 2 + 20, 40, 0x2ecc71);
        core.setAlpha(0.6);
        container.add(core);
        this.tweens.add({
          targets: core,
          alpha: 0.2,
          duration: 1000,
          yoyo: true,
          repeat: -1
        });
        break;
      case "admin":
        // Admin table
        this.addTable(container, width / 2, height / 2 + 30);
        break;
    }
  }

  /**
   * Helper to add a table decoration
   */
  private addTable(container: Phaser.GameObjects.Container, x: number, y: number): void {
    const table = this.add.image(x, y, "skeld_table");
    container.add(table);
  }

  /**
   * Add metallic rivets to room borders (Among Us style)
   */
  private addRivets(
    graphics: Phaser.GameObjects.Graphics,
    width: number,
    height: number,
  ): void {
    graphics.fillStyle(0x4a5a62, 1);

    // Corner rivets
    const rivetSize = 6;
    const offset = 15;

    graphics.fillCircle(offset, offset, rivetSize);
    graphics.fillCircle(width - offset, offset, rivetSize);
    graphics.fillCircle(offset, height - offset, rivetSize);
    graphics.fillCircle(width - offset, height - offset, rivetSize);

    // Edge rivets (every 80px)
    for (let x = 80; x < width; x += 80) {
      graphics.fillCircle(x, offset, rivetSize);
      graphics.fillCircle(x, height - offset, rivetSize);
    }
    for (let y = 80; y < height; y += 80) {
      graphics.fillCircle(offset, y, rivetSize);
      graphics.fillCircle(width - offset, y, rivetSize);
    }
  }

  /**
   * Add floor grid pattern (Among Us style)
   */
  private addFloorGrid(
    graphics: Phaser.GameObjects.Graphics,
    width: number,
    height: number,
    baseColor: number,
  ): void {
    // Lighter version of base color for grid
    const gridColor = Phaser.Display.Color.IntegerToColor(baseColor);
    gridColor.lighten(10);

    graphics.lineStyle(1, gridColor.color, 0.2);

    // Vertical lines
    for (let x = 40; x < width; x += 40) {
      graphics.lineBetween(x, 20, x, height - 20);
    }

    // Horizontal lines
    for (let y = 40; y < height; y += 40) {
      graphics.lineBetween(20, y, width - 20, y);
    }
  }

  /**
   * Create spaceship background with stars (Among Us style)
   */
  private createSpaceshipBackground(): void {
    // Rich deep-space background — dark navy, not pure black
    const bg = this.add.graphics();
    bg.fillStyle(0x080c18, 1);
    bg.fillRect(0, 0, this.SPACESHIP_WIDTH, this.SPACESHIP_HEIGHT);
    // Subtle blue-purple nebula gradient overlay in the center
    bg.fillStyle(0x1a1040, 0.4);
    bg.fillEllipse(
      this.SPACESHIP_WIDTH / 2, this.SPACESHIP_HEIGHT / 2,
      this.SPACESHIP_WIDTH * 0.9, this.SPACESHIP_HEIGHT * 0.8
    );
    bg.fillStyle(0x0d1a30, 0.3);
    bg.fillEllipse(
      this.SPACESHIP_WIDTH * 0.3, this.SPACESHIP_HEIGHT * 0.6,
      600, 500
    );
    bg.setDepth(-200);
    this.backgroundLayer.add(bg);

    // Stars: three sizes for depth
    const stars = this.add.graphics();
    // Tiny distant stars
    stars.fillStyle(0xffffff, 0.5);
    for (let i = 0; i < 350; i++) {
      stars.fillCircle(
        Math.random() * this.SPACESHIP_WIDTH,
        Math.random() * this.SPACESHIP_HEIGHT,
        Math.random() * 0.8,
      );
    }
    // Medium stars
    stars.fillStyle(0xdde8ff, 0.7);
    for (let i = 0; i < 100; i++) {
      stars.fillCircle(
        Math.random() * this.SPACESHIP_WIDTH,
        Math.random() * this.SPACESHIP_HEIGHT,
        Math.random() * 1.2 + 0.5,
      );
    }
    // Bright large stars
    stars.fillStyle(0xfff5e4, 1.0);
    for (let i = 0; i < 25; i++) {
      const sx = Math.random() * this.SPACESHIP_WIDTH;
      const sy = Math.random() * this.SPACESHIP_HEIGHT;
      stars.fillCircle(sx, sy, Math.random() * 1.5 + 1);
      // Tiny cross sparkle on bright stars
      stars.fillRect(sx - 3, sy, 6, 1);
      stars.fillRect(sx, sy - 3, 1, 6);
    }
    stars.setDepth(-190);
    this.backgroundLayer.add(stars);
  }

  /**
   * Create red dotted path connecting all rooms (Among Us style)
   */
  private createSpaceshipPath(): void {
    const pathGraphics = this.add.graphics();

    // Red color like Among Us
    const RED_PATH = 0xe74c3c;

    // Calculate center points of each room
    const roomCenters = this.VENTURE_ROOMS.map((room) => ({
      x: room.x + room.width / 2,
      y: room.y + room.height / 2,
      id: room.id,
    }));

    // Draw path between consecutive rooms
    for (let i = 0; i < roomCenters.length - 1; i++) {
      const start = roomCenters[i];
      const end = roomCenters[i + 1];

      this.drawDottedPath(
        pathGraphics,
        start.x,
        start.y,
        end.x,
        end.y,
        RED_PATH,
      );
    }

    pathGraphics.setDepth(-10);
    this.backgroundLayer.add(pathGraphics);
  }

  /**
   * Draw dotted path line (Among Us style)
   */
  private drawDottedPath(
    graphics: Phaser.GameObjects.Graphics,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    color: number,
  ): void {
    const distance = Phaser.Math.Distance.Between(x1, y1, x2, y2);
    const dotCount = Math.floor(distance / 18);

    for (let i = 0; i <= dotCount; i++) {
      const t = i / dotCount;
      const x = x1 + (x2 - x1) * t;
      const y = y1 + (y2 - y1) * t;

      // Glow halo
      graphics.fillStyle(0xff2200, 0.2);
      graphics.fillCircle(x, y, 10);

      // Outer dot — vivid red
      graphics.fillStyle(color, 1.0);
      graphics.fillCircle(x, y, 6);

      // Hot bright center
      graphics.fillStyle(0xff8888, 1.0);
      graphics.fillCircle(x, y, 3);
    }
  }

  /**
   * Update loop for scene (simplified for spaceship map)
   */
  update(): void {
    // Spaceship map is static - no parallax or crossfade needed
  }

  /**
   * Cleanup when scene is shutdown
   *
   * @remarks
   * Removes all event listeners to prevent memory leaks
   * Called automatically by Phaser when scene is stopped
   */
  shutdown(): void {
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

    this.boundHandlers = {};
  }
}
