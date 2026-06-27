"use client";

/**
 * DEPRECATED - STUB.
 *
 * The pre-Sahit feed/world-map tutorial has been retired in favour
 * of the v2 Sparky flow (src/components/tutorial/v2). This module
 * is a no-op shim because legacy callers on origin/main still
 * import { FeedTutorial } and pass props to it.
 */
interface FeedTutorialProps {
  show?: boolean;
  initialStep?: number;
  onClose?: () => void;
  myIdeaCount?: number | undefined;
}

export function FeedTutorial(_props: FeedTutorialProps): null {
  return null;
}
