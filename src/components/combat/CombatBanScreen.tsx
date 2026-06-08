"use client";

/**
 * Full-screen block shown when the user has an active suspension.
 *
 * Two rendering modes:
 *
 *   - Permanent (`isPermanent=true`): no countdown. Account is suspended
 *     platform-wide and only support can lift it. Rendered with stark
 *     copy and a contact link.
 *
 *   - Temporary (`isPermanent=false`): countdown to `banEndAt`. Rest of
 *     the platform remains accessible; only the game route is gated.
 *     The countdown is wall-clock-accurate even if the tab is left open
 *     across the expiry boundary, and fires `onBanExpired` exactly once.
 *
 * The permanent path is the v1 default created by the combat anti-cheat
 * layer on a second offense. The temporary path is kept in the component
 * so future, lower-severity bans (e.g. abuse cool-downs) can share this
 * screen without code changes.
 */

import React, { useEffect, useRef, useState } from "react";

interface Props {
  reason: string;
  /** True for the account-suspension policy; false for time-bounded bans. */
  isPermanent: boolean;
  /** Wall-clock ms timestamp at which the ban lifts. Ignored when permanent. */
  banEndAt: number;
  /** Fires once when a temporary ban's `banEndAt` elapses. */
  onBanExpired?: () => void;
  /** Optional support contact URL surfaced for permanent suspensions. */
  supportUrl?: string;
}

export function CombatBanScreen({
  reason,
  isPermanent,
  banEndAt,
  onBanExpired,
  supportUrl = "/contact",
}: Props) {
  if (isPermanent) {
    return <PermanentSuspensionView reason={reason} supportUrl={supportUrl} />;
  }
  return (
    <TemporaryBanView
      reason={reason}
      banEndAt={banEndAt}
      onBanExpired={onBanExpired}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────
// Permanent suspension — no countdown.
// ─────────────────────────────────────────────────────────────────────

function PermanentSuspensionView({
  reason,
  supportUrl,
}: {
  reason: string;
  supportUrl: string;
}) {
  return (
    <div className="flex min-h-[60vh] w-full items-center justify-center p-8">
      <div className="w-full max-w-md rounded-lg border border-red-700/60 bg-[#1a0a14] p-8 text-center">
        <h1 className="text-xl font-semibold text-red-300">
          Account suspended
        </h1>
        <p className="mt-3 text-sm text-white/80">{reason}</p>

        <div className="mt-6 rounded-md border border-red-700/40 bg-black/30 p-4 text-left">
          <p className="text-xs uppercase tracking-wider text-red-300/80">
            What this means
          </p>
          <ul className="mt-2 space-y-1 text-sm text-white/70">
            <li>• Your access to the platform has been revoked.</li>
            <li>
              • This action followed a documented prior warning and is
              not subject to automatic reinstatement.
            </li>
            <li>
              • If you believe this is a false positive, contact support
              for a manual review.
            </li>
          </ul>
        </div>

        <a
          href={supportUrl}
          className="mt-6 inline-block rounded-md border border-red-500/60 bg-red-600/20 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-600/40"
        >
          Contact support
        </a>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Temporary ban — countdown to banEndAt.
// ─────────────────────────────────────────────────────────────────────

function TemporaryBanView({
  reason,
  banEndAt,
  onBanExpired,
}: {
  reason: string;
  banEndAt: number;
  onBanExpired?: () => void;
}) {
  const [remainingMs, setRemainingMs] = useState(() =>
    Math.max(0, banEndAt - Date.now()),
  );
  const firedRef = useRef(false);

  useEffect(() => {
    if (remainingMs <= 0) {
      if (!firedRef.current) {
        firedRef.current = true;
        onBanExpired?.();
      }
      return;
    }
    const id = setInterval(() => {
      const r = Math.max(0, banEndAt - Date.now());
      setRemainingMs(r);
      if (r <= 0) {
        clearInterval(id);
        if (!firedRef.current) {
          firedRef.current = true;
          onBanExpired?.();
        }
      }
    }, 1000);
    return () => clearInterval(id);
  }, [banEndAt, remainingMs, onBanExpired]);

  const parts = breakdown(remainingMs);

  return (
    <div className="flex min-h-[60vh] w-full items-center justify-center p-8">
      <div className="w-full max-w-md rounded-lg border border-red-600/40 bg-[#1a0a14] p-8 text-center">
        <h1 className="text-xl font-semibold text-red-300">
          Game access paused
        </h1>
        <p className="mt-3 text-sm text-white/80">{reason}</p>

        <div className="mt-6 grid grid-cols-3 gap-2">
          <Cell label="Days" value={parts.days} />
          <Cell label="Hours" value={parts.hours} />
          <Cell label="Mins" value={parts.minutes} />
        </div>

        <p className="mt-6 text-xs text-white/40">
          You can keep using the rest of the platform. The game will unlock
          automatically when the timer reaches zero.
        </p>
      </div>
    </div>
  );
}

function Cell({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-white/10 bg-black/30 px-3 py-2">
      <div className="text-2xl font-bold text-white">
        {String(value).padStart(2, "0")}
      </div>
      <div className="font-mono text-[10px] uppercase tracking-wider text-white/40">
        {label}
      </div>
    </div>
  );
}

function breakdown(ms: number) {
  const totalMinutes = Math.floor(ms / 60_000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;
  return { days, hours, minutes };
}
