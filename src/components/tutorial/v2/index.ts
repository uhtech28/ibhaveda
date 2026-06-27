/**
 * Tutorial v2 — public surface area.
 *
 * Import from this barrel rather than from individual files so we can
 * refactor internals without breaking callers.
 *
 * Example:
 *   import { TutorialProvider, useTutorial, TutorialMascot } from "@/components/tutorial/v2";
 */

export { TutorialProvider } from "./TutorialProvider";
export {
  useTutorial,
  useTutorialOptional,
  TUTORIAL_TOTAL_STEPS,
  type TutorialStep,
  type TutorialBackendState,
  type TutorialState,
  type TutorialActions,
  type TutorialContextValue,
} from "./useTutorial";
export { TutorialMascot, type SparkyMood } from "./TutorialMascot";
export { TutorialSpeechBubble } from "./TutorialSpeechBubble";
export { TutorialProgressBar } from "./TutorialProgressBar";
export { TutorialHighlight } from "./TutorialHighlight";
