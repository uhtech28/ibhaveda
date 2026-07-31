"use client";

/**
 * @file CrossPostSettingsDialog.tsx
 * @description Settings dialog for the "Double Posting" (cross-post)
 *  feature. Contains:
 *   - Per-platform Connect / Disconnect buttons backed by real OAuth
 *     (LinkedIn / X / Facebook / Instagram) — hits the
 *     `/api/social/[provider]/connect` route.
 *   - Per-connection Auto-post toggle so users can pause a specific
 *     platform without disconnecting.
 *   - Master on/off toggle for the whole feature (localStorage) —
 *     acts as an emergency-off; server still checks the per-connection
 *     `autoPost` flag.
 *
 * Preferences (master + defaults) persist via useCrossPostPreferences
 * (localStorage). Connection state lives in Convex (`socialConnections`
 * table) and is fetched via `api.socialConnections.listMyConnections`.
 */

import React from "react";
import { Instagram, Linkedin, Facebook, Radio, Loader2 } from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { SharePlatform } from "@/lib/share/types";
import { useCrossPostPreferences } from "@/lib/share/useCrossPostPreferences";

function XLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M18.244 2H21.5l-7.5 8.57L22.5 22h-6.91l-5.42-7.09L4.27 22H1l8.02-9.17L1.5 2h7.09l4.9 6.49L18.24 2Zm-1.21 18h1.91L7.06 4H5.07l11.96 16Z" />
    </svg>
  );
}

const PLATFORMS: ReadonlyArray<{
  id: SharePlatform;
  label: string;
  icon: React.ReactNode;
  accent: string;
  note?: string;
}> = [
  { id: "twitter", label: "X", icon: <XLogo className="h-4 w-4" />, accent: "text-white" },
  { id: "linkedin", label: "LinkedIn", icon: <Linkedin className="h-4 w-4" fill="currentColor" />, accent: "text-sky-300" },
  {
    id: "instagram",
    label: "Instagram",
    icon: <Instagram className="h-4 w-4" />,
    accent: "text-pink-300",
    note: "Caption is copied to clipboard — Instagram has no web composer.",
  },
  { id: "facebook", label: "Facebook", icon: <Facebook className="h-4 w-4" fill="currentColor" />, accent: "text-blue-300" },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CrossPostSettingsDialog({ open, onOpenChange }: Props) {
  const { prefs, setEnabled } = useCrossPostPreferences();
  // Live-fetched from Convex — reflects the actual OAuth connections
  // the user has. `undefined` = still loading, `[]` = signed-out or
  // no connections yet.
  const connections = useQuery(api.socialConnections.listMyConnections, {});
  const setAutoPost = useMutation(api.socialConnections.setAutoPost);
  const disconnect = useMutation(api.socialConnections.disconnect);

  // Look up a connection row by platform id — undefined if not connected.
  const byPlatform = React.useMemo(() => {
    const map = new Map<
      SharePlatform,
      NonNullable<typeof connections>[number]
    >();
    (connections ?? []).forEach((c) => map.set(c.platform as SharePlatform, c));
    return map;
  }, [connections]);

  const [pendingPlatform, setPendingPlatform] =
    React.useState<SharePlatform | null>(null);

  const handleConnect = (platform: SharePlatform) => {
    setPendingPlatform(platform);
    // Full-page redirect so cookies for OAuth state survive the round-trip.
    window.location.href = `/api/social/${platform}/connect`;
  };

  const handleDisconnect = async (
    connectionId: NonNullable<typeof connections>[number]["_id"],
    platform: SharePlatform,
  ) => {
    setPendingPlatform(platform);
    try {
      await disconnect({ connectionId });
    } finally {
      setPendingPlatform(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Radio className="h-5 w-5 text-amber-400" />
            Double Posting
          </DialogTitle>
          <DialogDescription>
            Connect your other profiles so every idea you publish here
            gets auto-posted to them too. Only the platforms you
            explicitly toggle on will fire.
          </DialogDescription>
        </DialogHeader>

        {/* Master toggle — emergency off. Server still checks per-
            connection autoPost flag, but this hides the whole feature. */}
        <div className="rounded-lg border border-white/10 bg-[#0D1117] p-4">
          <label className="flex items-center justify-between gap-3 cursor-pointer">
            <div>
              <p className="text-sm font-semibold text-white">
                Cross-post enabled
              </p>
              <p className="mt-1 text-xs text-[#9CA3AF]">
                Master switch. When off, no auto-posting happens even if
                individual platforms below are connected.
              </p>
            </div>
            <Switch checked={prefs.enabled} onChange={setEnabled} />
          </label>
        </div>

        {/* Per-platform grid — Connect button when not linked, chip +
            Disconnect + Auto-post switch when linked. */}
        <div className="mt-3 space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#9CA3AF]">
            Platforms
          </p>
          <div className="space-y-1.5">
            {PLATFORMS.map((p) => {
              const conn = byPlatform.get(p.id);
              const isPending = pendingPlatform === p.id;
              const isConnected = !!conn;
              return (
                <div
                  key={p.id}
                  className={`flex items-center justify-between gap-3 rounded-lg border border-white/10 px-3 py-2.5 transition ${
                    prefs.enabled
                      ? "bg-[#0D1117] hover:border-white/20"
                      : "bg-[#080B10] opacity-60"
                  }`}
                >
                  <span className="flex items-center gap-3 min-w-0">
                    <span
                      className={`grid h-8 w-8 place-items-center rounded-md bg-white/[0.04] ${p.accent}`}
                    >
                      {p.icon}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-white">
                        {p.label}
                      </span>
                      {isConnected ? (
                        <span className="block truncate text-[10px] text-emerald-300/85">
                          Connected
                          {conn.providerDisplayName
                            ? ` as ${conn.providerDisplayName}`
                            : ""}
                        </span>
                      ) : p.note ? (
                        <span className="block text-[10px] text-[#6B7280]">
                          {p.note}
                        </span>
                      ) : (
                        <span className="block text-[10px] text-[#6B7280]">
                          Not connected
                        </span>
                      )}
                    </span>
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    {isConnected && (
                      <Switch
                        checked={prefs.enabled && conn.autoPost}
                        disabled={!prefs.enabled || isPending}
                        onChange={(v) =>
                          setAutoPost({
                            connectionId: conn._id,
                            autoPost: v,
                          })
                        }
                      />
                    )}
                    {isConnected ? (
                      <button
                        type="button"
                        onClick={() => handleDisconnect(conn._id, p.id)}
                        disabled={isPending}
                        className="rounded-md border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-[11px] font-medium text-rose-200 transition hover:border-rose-400/40 hover:bg-rose-500/10 disabled:opacity-50"
                      >
                        {isPending ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          "Disconnect"
                        )}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleConnect(p.id)}
                        disabled={isPending || !prefs.enabled}
                        className="rounded-md border border-[#6366F1]/40 bg-[#6366F1]/10 px-2.5 py-1.5 text-[11px] font-semibold text-[#C7D2FE] transition hover:border-[#6366F1] hover:bg-[#6366F1]/20 disabled:opacity-50"
                      >
                        {isPending ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          "Connect"
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-[10px] leading-relaxed text-[#6B7280]">
            We only post the ideas you publish. Nothing else is shared —
            you can disconnect any time.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Small inline switch component — kept local so we don't pull in a new
 * dependency for a single settings dialog.
 */
function Switch({
  checked,
  onChange,
  disabled = false,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition ${
        checked ? "bg-[#6366F1]" : "bg-white/15"
      } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}
