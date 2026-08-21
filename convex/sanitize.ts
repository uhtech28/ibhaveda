// Pure helper for sanitizing user-supplied free-text before it is stored.
// No Convex runtime dependencies — safe to import anywhere.
//
// This is defense-in-depth, NOT the primary XSS defense. The primary defense is
// output encoding: React auto-escapes JSX text, and the email templates
// (emailTemplates.ts, emailWelcome.ts) escape user values before interpolating
// them into HTML. Stripping tags on write additionally ensures the database
// never accumulates active markup, protecting any future output sink that
// forgets to escape.
//
// It intentionally only strips *complete* HTML tags (`<...>`). Stray angle
// brackets in ordinary text ("a > b", "x < y", "<3") are preserved, so
// legitimate input is not mangled.

/**
 * Strip HTML tags and control characters from a user-supplied string.
 * Returns a trimmed, plain-text version safe to store.
 */
export function sanitizeUserText(input: string): string {
  return input
    .replace(/<[^>]*>/g, "") // remove complete HTML tags (<script>, <svg ...>, <img ...>, etc.)
    // eslint-disable-next-line no-control-regex
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "") // strip control chars (keep \t \n \r)
    .trim();
}

/** Sanitize an optional string field, preserving undefined. */
export function sanitizeOptionalText(
  input: string | undefined,
): string | undefined {
  return input === undefined ? undefined : sanitizeUserText(input);
}
