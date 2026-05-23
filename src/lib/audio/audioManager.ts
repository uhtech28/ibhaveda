/**
 * audioManager.ts
 *
 * Interactive Ideas — Howler.js Audio Manager
 *
 * Manages all game audio across four categories:
 *   1. Ambience  — 8 biome loops (crossfade 800ms on stage transition)
 *   2. Music     — Boss entrance/stage themes
 *   3. SFX       — Checkpoint animations, level-up, badge awards
 *   4. UI        — Click, confirm, error, hover
 *
 * Key behaviours:
 *   - Defers initialisation until first user gesture (browser autoplay policy)
 *   - Volume settings persisted to localStorage
 *   - Crossfade system: fades out current track while fading in next
 *   - All methods are safe to call before init (queued or silently ignored)
 *   - Singleton export `audioManager` — import it anywhere
 */

import { Howl, Howler } from "howler";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface VolumeSettings {
  master: number; // 0–1
  music: number; // 0–1 (ambience + boss themes)
  sfx: number; // 0–1 (checkpoints, level-up, badges)
  ui: number; // 0–1 (click, confirm, error)
  muted: boolean;
}

export type BiomeId =
  // ── Venture template biomes (existing — unchanged)
  | "village"
  | "forest"
  | "arena"
  | "artisan"
  | "mine"
  | "harbour"
  | "crossroads"
  | "capital"
  // ── Academic template biomes (Phase 16)
  | "reading_room"       // Stage 1: Literature Review
  | "archive_hall"       // Stage 2: Research Design
  | "monastery_scriptorium"  // Stage 3: Data Collection
  | "cartographers_den"  // Stage 4: Analysis
  | "council_chamber"    // Stage 5: Writing & Synthesis
  | "grand_archive"      // Stage 6: Publication
  // ── Lab template biomes (Phase 16)
  | "circuit_nexus"      // Stage 1: Hypothesis
  | "clean_room"         // Stage 2: Protocol Design
  | "field_station"      // Stage 3: Experimentation
  | "data_vault"         // Stage 4: Analysis
  | "review_chamber"     // Stage 5: Peer Review
  | "publishing_reactor" // Stage 6: Publication
  | "replication_engine" // Stage 7: Replication & Impact
  // ── Creative template biomes (Phase 16)
  | "sacred_grove"       // Stage 1: Concept
  | "dreamscape"         // Stage 2: Creation
  | "artisan_market"     // Stage 3: Craft & Iteration
  | "gallery_entrance"   // Stage 4: Release
  | "audience_sea"       // Stage 5: Engagement
  | "festival_pinnacle"; // Stage 6: Legacy

export type CheckpointSFXId =
  | "seal_break_standard"
  | "seal_break_gold"
  | "rune_inscription_standard"
  | "rune_inscription_gold"
  | "beacon_lighting_standard"
  | "beacon_lighting_gold"
  | "bridge_repair_standard"
  | "bridge_repair_gold"
  | "compass_calibration_standard"
  | "compass_calibration_gold"
  | "ward_placement_standard"
  | "ward_placement_gold";

export type BadgeRarity = "common" | "uncommon" | "rare" | "epic" | "legendary";

export type UISound = "click" | "confirm" | "error" | "hover";

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const STORAGE_KEY = "interactiveideas_audio_settings";
const CROSSFADE_DURATION = 1000; // ms — PRD §10 specifies 1s crossfade on stage transition

/**
 * Default volume levels.
 * All values are 0–1 floats; master is applied as a multiplier.
 */
const DEFAULT_VOLUME: VolumeSettings = {
  master: 0.8,
  music: 0.7,
  sfx: 0.9,
  ui: 0.6,
  muted: false,
};

/**
 * Audio file paths.
 * These are relative to /public — swap for real files when delivered by design.
 * Format: MP3 primary, OGG fallback (per tech guide spec).
 *
 * Currently pointing to placeholder paths. The audio manager will silently
 * handle missing files via Howler's onloaderror callback.
 */
const AUDIO_PATHS = {
  ambience: {
    // ── Venture biomes (existing paths)
    village: ["/audio/ambience/village.mp3", "/audio/ambience/village.ogg"],
    forest: ["/audio/ambience/forest.mp3", "/audio/ambience/forest.ogg"],
    arena: ["/audio/ambience/arena.mp3", "/audio/ambience/arena.ogg"],
    artisan: ["/audio/ambience/artisan.mp3", "/audio/ambience/artisan.ogg"],
    mine: ["/audio/ambience/mine.mp3", "/audio/ambience/mine.ogg"],
    harbour: ["/audio/ambience/harbour.mp3", "/audio/ambience/harbour.ogg"],
    crossroads: ["/audio/ambience/crossroads.mp3", "/audio/ambience/crossroads.ogg"],
    capital: ["/audio/ambience/capital.mp3", "/audio/ambience/capital.ogg"],
    // ── Academic template biomes
    reading_room: ["/audio/ambience/academic/reading_room.mp3", "/audio/ambience/forest.ogg"],
    archive_hall: ["/audio/ambience/academic/archive_hall.mp3", "/audio/ambience/artisan.ogg"],
    monastery_scriptorium: ["/audio/ambience/academic/monastery_scriptorium.mp3", "/audio/ambience/mine.ogg"],
    cartographers_den: ["/audio/ambience/academic/cartographers_den.mp3", "/audio/ambience/harbour.ogg"],
    council_chamber: ["/audio/ambience/academic/council_chamber.mp3", "/audio/ambience/crossroads.ogg"],
    grand_archive: ["/audio/ambience/academic/grand_archive.mp3", "/audio/ambience/capital.ogg"],
    // ── Lab template biomes
    circuit_nexus: ["/audio/ambience/lab/circuit_nexus.mp3", "/audio/ambience/village.ogg"],
    clean_room: ["/audio/ambience/lab/clean_room.mp3", "/audio/ambience/arena.ogg"],
    field_station: ["/audio/ambience/lab/field_station.mp3", "/audio/ambience/forest.ogg"],
    data_vault: ["/audio/ambience/lab/data_vault.mp3", "/audio/ambience/mine.ogg"],
    review_chamber: ["/audio/ambience/lab/review_chamber.mp3", "/audio/ambience/harbour.ogg"],
    publishing_reactor: ["/audio/ambience/lab/publishing_reactor.mp3", "/audio/ambience/crossroads.ogg"],
    replication_engine: ["/audio/ambience/lab/replication_engine.mp3", "/audio/ambience/capital.ogg"],
    // ── Creative template biomes
    sacred_grove: ["/audio/ambience/creative/sacred_grove.mp3", "/audio/ambience/forest.ogg"],
    dreamscape: ["/audio/ambience/creative/dreamscape.mp3", "/audio/ambience/artisan.ogg"],
    artisan_market: ["/audio/ambience/creative/artisan_market.mp3", "/audio/ambience/harbour.ogg"],
    gallery_entrance: ["/audio/ambience/creative/gallery_entrance.mp3", "/audio/ambience/capital.ogg"],
    audience_sea: ["/audio/ambience/creative/audience_sea.mp3", "/audio/ambience/arena.ogg"],
    festival_pinnacle: ["/audio/ambience/creative/festival_pinnacle.mp3", "/audio/ambience/crossroads.ogg"],
  } as Record<BiomeId, string[]>,

  sfx: {
    seal_break_standard: [
      "/audio/sfx/seal_break_standard.mp3",
      "/audio/sfx/seal_break_standard.ogg",
    ],
    seal_break_gold: [
      "/audio/sfx/seal_break_gold.mp3",
      "/audio/sfx/seal_break_gold.ogg",
    ],
    rune_inscription_standard: [
      "/audio/sfx/rune_inscription_standard.mp3",
      "/audio/sfx/rune_inscription_standard.ogg",
    ],
    rune_inscription_gold: [
      "/audio/sfx/rune_inscription_gold.mp3",
      "/audio/sfx/rune_inscription_gold.ogg",
    ],
    beacon_lighting_standard: [
      "/audio/sfx/beacon_lighting_standard.mp3",
      "/audio/sfx/beacon_lighting_standard.ogg",
    ],
    beacon_lighting_gold: [
      "/audio/sfx/beacon_lighting_gold.mp3",
      "/audio/sfx/beacon_lighting_gold.ogg",
    ],
    bridge_repair_standard: [
      "/audio/sfx/bridge_repair_standard.mp3",
      "/audio/sfx/bridge_repair_standard.ogg",
    ],
    bridge_repair_gold: [
      "/audio/sfx/bridge_repair_gold.mp3",
      "/audio/sfx/bridge_repair_gold.ogg",
    ],
    compass_calibration_standard: [
      "/audio/sfx/compass_calibration_standard.mp3",
      "/audio/sfx/compass_calibration_standard.ogg",
    ],
    compass_calibration_gold: [
      "/audio/sfx/compass_calibration_gold.mp3",
      "/audio/sfx/compass_calibration_gold.ogg",
    ],
    ward_placement_standard: [
      "/audio/sfx/ward_placement_standard.mp3",
      "/audio/sfx/ward_placement_standard.ogg",
    ],
    ward_placement_gold: [
      "/audio/sfx/ward_placement_gold.mp3",
      "/audio/sfx/ward_placement_gold.ogg",
    ],
    level_up: ["/audio/sfx/level_up.mp3"],
    badge_common: ["/audio/sfx/badge_common.mp3"],
    badge_uncommon: ["/audio/sfx/badge_uncommon.mp3"],
    badge_rare: ["/audio/sfx/badge_rare.mp3"],
    badge_epic: ["/audio/sfx/badge_epic.mp3"],
    badge_legendary: ["/audio/sfx/badge_legendary.mp3"],
    gold_gain: ["/audio/sfx/gold_gain.mp3"],
  } as Record<string, string[]>,

  ui: {
    click: ["/audio/ui/click.mp3"],
    confirm: ["/audio/ui/confirm.mp3"],
    error: ["/audio/ui/error.mp3"],
    hover: ["/audio/ui/hover.mp3"],
  } as Record<UISound, string[]>,

  music: {
    boss_unraveller: [
      "/audio/music/boss_unraveller.mp3",
      "/audio/music/boss_unraveller.ogg",
    ],
    boss_pale_architect: [
      "/audio/music/boss_pale_architect.mp3",
      "/audio/music/boss_pale_architect.ogg",
    ],
    boss_gravemind: [
      "/audio/music/boss_gravemind.mp3",
      "/audio/music/boss_gravemind.ogg",
    ],
    stage_1: [
      "/audio/music/stage_village.mp3",
      "/audio/music/stage_village.ogg",
    ],
    stage_2: ["/audio/music/stage_forest.mp3", "/audio/music/stage_forest.ogg"],
    stage_3: ["/audio/music/stage_arena.mp3", "/audio/music/stage_arena.ogg"],
    stage_4: [
      "/audio/music/stage_artisan.mp3",
      "/audio/music/stage_artisan.ogg",
    ],
    stage_5: ["/audio/music/stage_mine.mp3", "/audio/music/stage_mine.ogg"],
    stage_6: [
      "/audio/music/stage_harbour.mp3",
      "/audio/music/stage_harbour.ogg",
    ],
    stage_7: [
      "/audio/music/stage_crossroads.mp3",
      "/audio/music/stage_crossroads.ogg",
    ],
    stage_8: [
      "/audio/music/stage_capital.mp3",
      "/audio/music/stage_capital.ogg",
    ],
  } as Record<string, string[]>,
} as const;

/** Map stage number (1–8) to BiomeId */
const STAGE_TO_BIOME: Record<number, BiomeId> = {
  1: "village",
  2: "forest",
  3: "arena",
  4: "artisan",
  5: "mine",
  6: "harbour",
  7: "crossroads",
  8: "capital",
};

// ─────────────────────────────────────────────────────────────────────────────
// AUDIO MANAGER CLASS
// ─────────────────────────────────────────────────────────────────────────────

class AudioManager {
  // ── State ──────────────────────────────────────────────────────────────────

  private initialized = false;
  private unlocked = false;

  private volumes: VolumeSettings = { ...DEFAULT_VOLUME };

  /** Currently playing ambience Howl */
  private currentAmbience: Howl | null = null;
  private currentAmbienceId: BiomeId | null = null;

  /** Currently playing music track */
  private currentMusic: Howl | null = null;
  private currentMusicVolumeScale = 1;

  /** Cache of loaded Howl instances keyed by path group */
  private ambienceCache: Partial<Record<BiomeId, Howl>> = {};
  private sfxCache: Partial<Record<string, Howl>> = {};
  private uiCache: Partial<Record<UISound, Howl>> = {};
  private musicCache: Partial<Record<string, Howl>> = {};

  /** Pending crossfade tween handles (setTimeout IDs) */
  private crossfadeTimer: ReturnType<typeof setTimeout> | null = null;

  /** Pending actions queued before user interaction unlocks audio */
  private pendingBiome: BiomeId | null = null;
  private pendingMusicTrack: string | null = null;
  private pendingMusicVolumeScale = 1;

  // Boss / heartbeat state
  private lastStageNum = 1;
  private lastTemplateId: "venture" | "academic" | "lab" | "creative" = "venture";
  private playingBossTheme = false;
  private lastCorruptionLevel = 0;
  private heartbeatGain: GainNode | null = null;
  private heartbeatInterval: any = null;

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  constructor() {
    // Load persisted settings immediately (no DOM required)
    this.loadFromStorage();
  }

  /**
   * Initialise the audio system.
   *
   * MUST be called once after first user interaction to satisfy browser
   * autoplay policy. Calling it before interaction is a no-op (safe).
   *
   * Call this from a click/keydown handler, or from the map page
   * `useEffect` that listens for the first pointer event.
   */
  init(): void {
    if (this.initialized) return;
    this.initialized = true;

    // Apply persisted volume state to Howler global
    this.applyMasterVolume();

    console.info("[AudioManager] Initialised.");

    // If a biome was requested before init, play it now
    if (this.pendingBiome) {
      this.playAmbience(this.pendingBiome);
      this.pendingBiome = null;
    }

    if (this.pendingMusicTrack) {
      this.playMusic(this.pendingMusicTrack, this.pendingMusicVolumeScale);
      this.pendingMusicTrack = null;
      this.pendingMusicVolumeScale = 1;
    }
  }

  /**
   * Called on any user gesture to unlock audio context.
   * Wire this to `document.addEventListener('click', ...)` once.
   */
  unlock(): void {
    if (this.unlocked) return;
    this.unlocked = true;
    this.init();
  }

  // ── Volume Controls ────────────────────────────────────────────────────────

  /** Current volume snapshot */
  getVolumes(): Readonly<VolumeSettings> {
    return { ...this.volumes };
  }

  setMasterVolume(value: number): void {
    this.volumes.master = clamp(value);
    this.applyMasterVolume();
    this.persist();
  }

  setMusicVolume(value: number): void {
    this.volumes.music = clamp(value);
    this.updateAmbienceVolume();
    this.updateMusicVolume();
    this.persist();
  }

  setSFXVolume(value: number): void {
    this.volumes.sfx = clamp(value);
    this.persist();
  }

  setUIVolume(value: number): void {
    this.volumes.ui = clamp(value);
    this.persist();
  }

  toggleMute(): void {
    this.volumes.muted = !this.volumes.muted;
    this.applyMasterVolume();
    this.persist();
  }

  setMuted(muted: boolean): void {
    this.volumes.muted = muted;
    this.applyMasterVolume();
    this.persist();
  }

  get isMuted(): boolean {
    return this.volumes.muted;
  }

  // ── Ambience ───────────────────────────────────────────────────────────────

  /**
   * Play the biome ambient loop for the given biome.
   * Crossfades 800ms from any currently playing ambience.
   *
   * Safe to call before init — the biome is queued and plays once unlocked.
   */
  playAmbience(biome: BiomeId): void {
    if (!this.initialized) {
      this.pendingBiome = biome;
      return;
    }

    // Already playing this biome
    if (this.currentAmbienceId === biome && this.currentAmbience?.playing()) {
      return;
    }

    const incoming = this.getAmbience(biome);
    if (!incoming) return;

    const outgoing = this.currentAmbience;

    // Fade out outgoing
    if (outgoing && outgoing.playing()) {
      outgoing.fade(outgoing.volume(), 0, CROSSFADE_DURATION);
      this.crossfadeTimer = setTimeout(() => {
        outgoing.stop();
      }, CROSSFADE_DURATION + 50);
    }

    // Fade in incoming
    const targetVol = this.musicEffectiveVolume();
    incoming.volume(0);
    incoming.play();
    incoming.fade(0, targetVol, CROSSFADE_DURATION);

    this.currentAmbience = incoming;
    this.currentAmbienceId = biome;
  }

  /** Convenience: play ambience for a stage number (1–8) */
  playAmbienceForStage(stage: number): void {
    const biome = STAGE_TO_BIOME[stage];
    if (biome) this.playAmbience(biome);
  }

  stopAmbience(): void {
    if (this.currentAmbience?.playing()) {
      this.currentAmbience.fade(
        this.currentAmbience.volume(),
        0,
        CROSSFADE_DURATION,
      );
      setTimeout(() => this.currentAmbience?.stop(), CROSSFADE_DURATION + 50);
    }
    this.currentAmbience = null;
    this.currentAmbienceId = null;
  }

  // ── Music ──────────────────────────────────────────────────────────────────

  /**
   * Play a boss entrance theme or stage music track.
   * Crossfades from current music track.
   */
  playMusic(trackId: string, volumeScale = 1): void {
    if (!this.initialized) {
      this.pendingMusicTrack = trackId;
      this.pendingMusicVolumeScale = clamp(volumeScale);
      return;
    }

    const paths = AUDIO_PATHS.music[trackId];
    if (!paths) return;

    const incoming = this.getOrCreateHowl(
      this.musicCache as Record<string, Howl>,
      trackId,
      paths,
      { loop: true, volume: 0 },
    );
    if (!incoming) return;

    // Fade out current
    if (this.currentMusic?.playing()) {
      const outgoing = this.currentMusic;
      outgoing.fade(outgoing.volume(), 0, CROSSFADE_DURATION);
      setTimeout(() => outgoing.stop(), CROSSFADE_DURATION + 50);
    }

    this.currentMusicVolumeScale = clamp(volumeScale);
    const targetVol = this.musicEffectiveVolume() * this.currentMusicVolumeScale;
    incoming.volume(0);
    incoming.play();
    incoming.fade(0, targetVol, CROSSFADE_DURATION);
    this.currentMusic = incoming;
  }

  stopMusic(): void {
    if (this.currentMusic?.playing()) {
      this.currentMusic.fade(this.currentMusic.volume(), 0, CROSSFADE_DURATION);
      setTimeout(() => this.currentMusic?.stop(), CROSSFADE_DURATION + 50);
    }
    this.currentMusic = null;
  }

  // ── SFX ───────────────────────────────────────────────────────────────────

  /**
   * Play a checkpoint crossing sound effect.
   * @param sfxId  e.g. "seal_break_gold"
   */
  playCheckpointSFX(sfxId: CheckpointSFXId): void {
    this.playSFX(sfxId);
  }

  /** Play the level-up fanfare (2s) */
  playLevelUp(): void {
    this.playSFX("level_up");
  }

  /** Play the badge award SFX for the given rarity tier */
  playBadgeSFX(rarity: BadgeRarity): void {
    this.playSFX(`badge_${rarity}`);
  }

  /** Play the gold coin gain SFX (Gold Checkpoint popup, wallet increase) */
  playGoldGain(): void {
    this.playSFX("gold_gain");
  }

  /** Play stage music track (stage_1 … stage_N, template-specific tracks) */
  playStageMusic(stage: number): void {
    this.lastStageNum = stage;
    if (this.playingBossTheme) return; // Don't interrupt boss theme with stage theme
    this.playMiniBossStageTheme(stage);
  }

  /** Play the mini-boss stage theme track for the given venture stage. */
  playMiniBossStageTheme(stage: number): void {
    this.playMusic(`stage_${stage}`, 0.42);
  }

  /**
   * Play the template-specific ambience for a given template + stage.
   * Falls back to the Venture biome if the template audio file is missing.
   * Use this instead of playAmbienceForStage() on non-Venture templates.
   */
  playAmbienceForTemplate(templateId: "venture" | "academic" | "lab" | "creative", stage: number): void {
    this.lastTemplateId = templateId;
    const templateBiomeMap: Record<string, Record<number, BiomeId>> = {
      venture: { 1: "village", 2: "forest", 3: "arena", 4: "artisan", 5: "mine", 6: "harbour", 7: "crossroads", 8: "capital" },
      academic: { 1: "reading_room", 2: "archive_hall", 3: "monastery_scriptorium", 4: "cartographers_den", 5: "council_chamber", 6: "grand_archive" },
      lab: { 1: "circuit_nexus", 2: "clean_room", 3: "field_station", 4: "data_vault", 5: "review_chamber", 6: "publishing_reactor", 7: "replication_engine" },
      creative: { 1: "sacred_grove", 2: "dreamscape", 3: "artisan_market", 4: "gallery_entrance", 5: "audience_sea", 6: "festival_pinnacle" },
    };
    const biome = templateBiomeMap[templateId]?.[stage] ?? "village";
    this.playAmbience(biome);
  }

  private startHeartbeat(): void {
    if (this.heartbeatInterval) return;

    try {
      const ctx = (Howler as any).ctx;
      if (!ctx || ctx.state === "suspended") return;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.connect(ctx.destination);
      this.heartbeatGain = gain;

      // Pulse the volume periodically to simulate a heartbeat
      this.heartbeatInterval = setInterval(() => {
        if (this.volumes.muted || this.volumes.sfx === 0) return;

        const now = ctx.currentTime;
        const levelFactor = (this.lastCorruptionLevel - 60) / 40; // 0 to 1
        const maxGain = 0.08 * levelFactor * this.volumes.sfx;

        // First thud (Lub)
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(maxGain, now + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

        // Second thud (Dub)
        const delay = 0.22;
        gain.gain.setValueAtTime(0, now + delay);
        gain.gain.linearRampToValueAtTime(maxGain * 0.7, now + delay + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.18);

        // Low frequency thud oscillator
        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.setValueAtTime(55, now); // low bass frequency
        osc.connect(gain);
        osc.start(now);
        osc.stop(now + 0.5);
      }, 1000);
    } catch (e) {
      console.warn("[AudioManager] Heartbeat synth initialization failed:", e);
    }
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    if (this.heartbeatGain) {
      try {
        this.heartbeatGain.disconnect();
      } catch (e) {}
      this.heartbeatGain = null;
    }
  }

  /**
   * Play a corruption-state-aware audio layer.
   * At critical corruption, lowers ambience and adds a tension layer.
   */
  setCorruptionAudioState(corruptionLevel: number): void {
    this.lastCorruptionLevel = corruptionLevel;
    const musicVol = corruptionLevel >= 80 ? 0.25 : corruptionLevel >= 60 ? 0.5 : corruptionLevel >= 40 ? 0.75 : 1.0;
    this.setMusicVolume(this.volumes.music * musicVol);

    // Dynamic Boss Music activation based on corruption level
    if (corruptionLevel >= 75) {
      if (!this.playingBossTheme) {
        this.playingBossTheme = true;
        let bossTheme = "boss_unraveller";
        if (this.lastTemplateId === "academic" || this.lastTemplateId === "creative") {
          bossTheme = "boss_pale_architect";
        } else if (this.lastTemplateId === "lab") {
          bossTheme = "boss_gravemind";
        }
        this.playMusic(bossTheme, 0.55);
      }
    } else {
      if (this.playingBossTheme) {
        this.playingBossTheme = false;
        this.playMiniBossStageTheme(this.lastStageNum);
      }
    }

    // Play synthesized heartbeat sound layer if corruption is threatening/critical (>= 60%)
    if (corruptionLevel >= 60) {
      this.startHeartbeat();
    } else {
      this.stopHeartbeat();
    }
  }

  // ── UI SFX ────────────────────────────────────────────────────────────────

  /** Play a UI interaction sound (click, confirm, error, hover) */
  playUI(sound: UISound): void {
    if (!this.initialized || this.volumes.muted) return;
    const paths = AUDIO_PATHS.ui[sound];
    if (!paths) return;

    const howl = this.getOrCreateHowl(
      this.uiCache as Record<string, Howl>,
      sound,
      paths,
      { volume: this.uiEffectiveVolume() },
    );
    howl?.play();
  }

  /** Unlock audio from a direct user gesture, then play UI feedback. */
  playTouch(sound: UISound = "click"): void {
    this.unlock();
    this.playUI(sound);
  }

  // ── Destroy ───────────────────────────────────────────────────────────────

  /**
   * Unload all Howl instances and clear caches.
   * Call this when leaving the map page.
   */
  destroy(): void {
    if (this.crossfadeTimer) clearTimeout(this.crossfadeTimer);

    const unloadAll = (cache: Partial<Record<string, Howl>>) => {
      Object.values(cache).forEach((h) => {
        try {
          h?.unload();
        } catch {}
      });
    };

    unloadAll(this.ambienceCache);
    unloadAll(this.sfxCache);
    unloadAll(this.uiCache);
    unloadAll(this.musicCache);

    this.ambienceCache = {};
    this.sfxCache = {};
    this.uiCache = {};
    this.musicCache = {};
    this.currentAmbience = null;
    this.currentMusic = null;
    this.currentAmbienceId = null;
    this.pendingBiome = null;
    this.pendingMusicTrack = null;

    console.info("[AudioManager] Destroyed.");
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private playSFX(id: string): void {
    if (!this.initialized || this.volumes.muted) return;
    const paths = AUDIO_PATHS.sfx[id];
    if (!paths) return;

    const howl = this.getOrCreateHowl(
      this.sfxCache as Record<string, Howl>,
      id,
      paths,
      { volume: this.sfxEffectiveVolume() },
    );
    howl?.play();
  }

  private getAmbience(biome: BiomeId): Howl | null {
    if (this.ambienceCache[biome]) return this.ambienceCache[biome]!;

    const paths = AUDIO_PATHS.ambience[biome];
    if (!paths) return null;

    const howl = new Howl({
      src: paths,
      loop: true,
      volume: 0, // starts silent; crossfade handles the fade-in
      html5: true, // stream long audio files
      preload: true,
      onloaderror: (id, err) => {
        console.warn(`[AudioManager] Ambience load error (${biome}):`, err);
      },
    });

    this.ambienceCache[biome] = howl;
    return howl;
  }

  private getOrCreateHowl(
    cache: Record<string, Howl>,
    key: string,
    src: string[],
    options: { loop?: boolean; volume?: number },
  ): Howl | null {
    if (cache[key]) {
      // Update volume for cached instances
      cache[key].volume(options.volume ?? 1);
      return cache[key];
    }

    try {
      const howl = new Howl({
        src,
        loop: options.loop ?? false,
        volume: options.volume ?? 1,
        preload: true,
        onloaderror: (_id, err) => {
          console.warn(`[AudioManager] Load error (${key}):`, err);
        },
      });
      cache[key] = howl;
      return howl;
    } catch (err) {
      console.warn(`[AudioManager] Failed to create Howl for ${key}:`, err);
      return null;
    }
  }

  private applyMasterVolume(): void {
    const effective = this.volumes.muted ? 0 : this.volumes.master;
    Howler.volume(effective);
  }

  private updateAmbienceVolume(): void {
    if (this.currentAmbience?.playing()) {
      this.currentAmbience.volume(this.musicEffectiveVolume());
    }
  }

  private updateMusicVolume(): void {
    if (this.currentMusic?.playing()) {
      this.currentMusic.volume(
        this.musicEffectiveVolume() * this.currentMusicVolumeScale,
      );
    }
  }

  /** Effective music volume = master × music (Howler global vol is master) */
  private musicEffectiveVolume(): number {
    return this.volumes.muted ? 0 : this.volumes.music;
  }

  private sfxEffectiveVolume(): number {
    return this.volumes.muted ? 0 : this.volumes.sfx;
  }

  private uiEffectiveVolume(): number {
    return this.volumes.muted ? 0 : this.volumes.ui;
  }

  // ── Persistence ───────────────────────────────────────────────────────────

  private persist(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.volumes));
    } catch {
      // localStorage may be unavailable in SSR or private mode
    }
  }

  private loadFromStorage(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as Partial<VolumeSettings>;
      this.volumes = {
        master: clamp(saved.master ?? DEFAULT_VOLUME.master),
        music: clamp(saved.music ?? DEFAULT_VOLUME.music),
        sfx: clamp(saved.sfx ?? DEFAULT_VOLUME.sfx),
        ui: clamp(saved.ui ?? DEFAULT_VOLUME.ui),
        muted: saved.muted ?? DEFAULT_VOLUME.muted,
      };
    } catch {
      // Ignore — use defaults
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// UTILITIES
// ─────────────────────────────────────────────────────────────────────────────

function clamp(v: number, min = 0, max = 1): number {
  return Math.max(min, Math.min(max, v));
}

// ─────────────────────────────────────────────────────────────────────────────
// SINGLETON EXPORT
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Application-wide AudioManager singleton.
 *
 * Usage:
 * ```ts
 * import { audioManager } from "@/lib/audio/audioManager";
 *
 * // On first user interaction:
 * audioManager.unlock();
 *
 * // Play ambience for stage 1:
 * audioManager.playAmbienceForStage(1);
 *
 * // Play a checkpoint SFX:
 * audioManager.playCheckpointSFX("seal_break_gold");
 *
 * // UI sound:
 * audioManager.playUI("click");
 * ```
 */
export const audioManager = new AudioManager();

// Automatically unlock on any user interaction (once)
if (typeof window !== "undefined") {
  const unlockOnce = () => {
    audioManager.unlock();
    window.removeEventListener("click", unlockOnce);
    window.removeEventListener("keydown", unlockOnce);
    window.removeEventListener("touchstart", unlockOnce);
  };
  window.addEventListener("click", unlockOnce);
  window.addEventListener("keydown", unlockOnce);
  window.addEventListener("touchstart", unlockOnce);
}
