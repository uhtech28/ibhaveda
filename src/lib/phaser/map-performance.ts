/**
 * Map interaction & animation speed tuning (production feel).
 * Increase values for snappier movement; decrease if motion feels too fast.
 */
export const MAP_PERF = {
  /** Global multiplier for Phaser tweens in WorldMapScene (ambient + movement). */
  SCENE_TWEEN_TIME_SCALE: 1.45,
  /** Camera pan when focusing checkpoints / stages (ms, before tween time scale). */
  CAMERA_PAN_MS: 320,
  /** Camera pan on viewport resize (ms). */
  CAMERA_RESIZE_MS: 180,
  /** Mouse wheel / trackpad scroll multiplier. */
  SCROLL_WHEEL_SPEED: 4.25,
  /** Touch drag inertia tween (ms). */
  DRAG_INERTIA_MS: 180,
  /** Touch drag inertia distance multiplier. */
  DRAG_INERTIA_MULT: 4.5,
  /** Persona jog speed along paths (world px / second). */
  PERSONA_JOG_PX_PER_SEC: 1050,
  PERSONA_JOG_MIN_MS: 140,
  PERSONA_JOG_MAX_MS: 850,
  /** Checkpoint celebration animations (0–1 duration factor). */
  CHECKPOINT_ANIM_FACTOR: 0.42,
  CHECKPOINT_SKIP_DELAY_MS: 280,
} as const;
