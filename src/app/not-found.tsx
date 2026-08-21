/**
 * @file src/app/not-found.tsx
 * @description Custom 404 page. Opts OUT of static prerender via
 *   `export const dynamic = 'force-dynamic'` so the build doesn't try to
 *   prerender it against ClerkProvider — which requires a valid
 *   `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` env var. Aryan's CI does not set
 *   that key, and Clerk's key-format validator rejects any placeholder,
 *   so the only way to unblock the build without changing the CI env is
 *   to make this page dynamic (rendered per-request at runtime, when the
 *   real Clerk key is available).
 *
 *   Vercel prod: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is set → this page
 *   still renders correctly at runtime. Aryan CI: no key → build succeeds
 *   because this page is skipped in the static-prerender pass.
 */

import Link from "next/link";

export const dynamic = "force-dynamic";

export default function NotFound() {
  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        padding: 24,
        background: "#070a0f",
        color: "#f8fafc",
        fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
        textAlign: "center",
      }}
    >
      <h1 style={{ fontSize: 48, margin: 0, fontWeight: 800 }}>404</h1>
      <p style={{ fontSize: 18, opacity: 0.7, margin: 0 }}>
        This page doesn't exist.
      </p>
      <Link
        href="/"
        style={{
          marginTop: 12,
          padding: "10px 20px",
          background: "#f7d66d",
          color: "#070a0f",
          borderRadius: 999,
          fontWeight: 700,
          textDecoration: "none",
        }}
      >
        Go home
      </Link>
    </main>
  );
}
