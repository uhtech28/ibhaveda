"use client";

/**
 * @file MapSettingsDialog.tsx
 * @description In-map settings modal. Opens from the LeftSidebar
 *  Settings gear at the bottom of the map. Groups the user-facing
 *  settings a player is likely to want mid-session:
 *   - Persona swap (8-persona grid, same asset pack used everywhere)
 *   - Social connections (connect / disconnect LinkedIn, X, Facebook,
 *     Instagram) — same OAuth pipe as CrossPostSettingsDialog
 *   - Audio (music + SFX volume)
 *
 * Deliberately compact — this is a game-menu overlay, not a full
 * settings page. Anything more elaborate (profile, notifications,
 * billing) should live on /settings and open in a new tab.
 */

import React, { useState } from "react";
import {
  Instagram,
  Linkedin,
  Facebook,
  Loader2,
  Volume2,
  User as UserIcon,
  Share2,
} from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { SharePlatform } from "@/lib/share/types";
import { useCrossPostPreferences } from "@/lib/share/useCrossPostPreferences";
import { PERSONAS, type PersonaId } from "@/config/personas";
import { audioManager } from "@/lib/audio/audioManager";

function XLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M18.244 2H21.5l-7.5 8.57L22.5 22h-6.91l-5.42-7.09L4.27 22H1l8.02-9.17L1.5 2h7.09l4.9 6.49L18.24 2Zm-1.21 18h1.91L7.06 4H5.07l11.96 16Z" />
    </svg>
  );
}

const PLATFORMS: ReadonlyArray<{
  id: SharePlatform;
  label: string;
  icon: React.ReactNode;
  accent: string;
}> = [
  { id: "linkedin", label: "LinkedIn", icon: <Linkedin className="h-4 w-4" fill="currentColor" />, accent: "text-sky-300" },
  { id: "twitter", label: "X", icon: <XLogo className="h-4 w-4" />, accent: "text-white" },
  { id: "facebook", label: "Facebook", icon: <Facebook className="h-4 w-4" fill="currentColor" />, accent: "text-blue-300" },
  { id: "instagram", label: "Instagram", icon: <Instagram className="h-4 w-4" />, accent: "text-pink-300" },
];

type Tab = "persona" | "social" | "audio";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MapSettingsDialog({ open, onOpenChange }: Props) {
  const [tab, setTab] = useState<Tab>("persona");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-[#0a0d12] border border-white/10 text-white">
        <DialogHeader>
          <DialogTitle
            className="font-mono text-lg font-black tracking-widest text-white"
            style={{ fontFamily: "var(--font-pixel-display), monospace" }}
          >
            SETTINGS
          </DialogTitle>
        </DialogHeader>

        {/* Tab bar */}
        <div className="flex gap-1 border-b border-white/10 pb-2 mb-3">
          <TabButton active={tab === "persona"} onClick={() => setTab("persona")} icon={<UserIcon className="h-4 w-4" />} label="Persona" />
          <TabButton active={tab === "social"} onClick={() => setTab("social")} icon={<Share2 className="h-4 w-4" />} label="Social" />
          <TabButton active={tab === "audio"} onClick={() => setTab("audio")} icon={<Volume2 className="h-4 w-4" />} label="Audio" />
        </div>

        {tab === "persona" && <PersonaTab onClose={() => onOpenChange(false)} />}
        {tab === "social" && <SocialTab />}
        {tab === "audio" && <AudioTab />}
      </DialogContent>
    </Dialog>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition ${
        active
          ? "bg-white/10 text-white"
          : "text-white/50 hover:bg-white/5 hover:text-white/80"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

// ─── Persona tab ────────────────────────────────────────────────────────
function PersonaTab({ onClose }: { onClose: () => void }) {
  const currentUser = useQuery(api.users.getCurrentUser, {});
  const updatePersonaId = useMutation(api.users.updatePersonaId);
  const [submitting, setSubmitting] = useState<PersonaId | null>(null);
  const currentPersonaId = (currentUser?.personaId ?? null) as PersonaId | null;

  const handlePick = async (id: PersonaId) => {
    if (id === currentPersonaId) return;
    setSubmitting(id);
    try {
      await updatePersonaId({ personaId: id });
      // Reload so all Phaser scenes pick up the new persona sheets.
      // The scenes cache animation keys on create, so a soft state
      // update wouldn't swap the character mid-scene reliably.
      if (typeof window !== "undefined") window.location.reload();
      onClose();
    } finally {
      setSubmitting(null);
    }
  };

  return (
    <div>
      <p className="mb-3 text-xs text-white/60">
        Swap your character. Change takes effect after a quick reload.
      </p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {PERSONAS.map((p) => {
          const active = p.id === currentPersonaId;
          const isPending = submitting === p.id;
          return (
            <button
              key={p.id}
              type="button"
              disabled={submitting !== null}
              onClick={() => handlePick(p.id)}
              className={`group flex flex-col items-center gap-1.5 rounded-lg border p-2.5 text-center transition disabled:cursor-not-allowed disabled:opacity-60 ${
                active
                  ? "border-amber-400/70 bg-amber-500/10"
                  : "border-white/10 bg-white/[0.03] hover:border-white/30 hover:bg-white/[0.06]"
              }`}
            >
              <div
                className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-md bg-black/40 ring-1 ring-white/10"
                style={{ imageRendering: "pixelated" }}
              >
                <img
                  src={p.assets.portrait}
                  alt={p.displayName}
                  className="h-full w-full object-contain"
                  style={{ imageRendering: "pixelated" }}
                />
              </div>
              <div className="text-[11px] font-bold text-white truncate w-full">{p.displayName}</div>
              {active && (
                <div className="text-[9px] font-semibold uppercase tracking-wider text-amber-300">Current</div>
              )}
              {isPending && <Loader2 className="h-3 w-3 animate-spin text-white/60" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Social tab ─────────────────────────────────────────────────────────
function SocialTab() {
  const { prefs, setEnabled } = useCrossPostPreferences();
  const connections = useQuery(api.socialConnections.listMyConnections, {});
  const setAutoPost = useMutation(api.socialConnections.setAutoPost);
  const disconnect = useMutation(api.socialConnections.disconnect);
  const [pending, setPending] = useState<SharePlatform | null>(null);

  const byPlatform = React.useMemo(() => {
    const map = new Map<SharePlatform, NonNullable<typeof connections>[number]>();
    (connections ?? []).forEach((c) => map.set(c.platform as SharePlatform, c));
    return map;
  }, [connections]);

  const handleConnect = (platform: SharePlatform) => {
    setPending(platform);
    window.location.href = `/api/social/${platform}/connect`;
  };

  const handleDisconnect = async (
    connectionId: NonNullable<typeof connections>[number]["_id"],
    platform: SharePlatform,
  ) => {
    setPending(platform);
    try {
      await disconnect({ connectionId });
    } finally {
      setPending(null);
    }
  };

  return (
    <div>
      <div className="mb-3 rounded-lg border border-white/10 bg-[#0D1117] p-3">
        <label className="flex cursor-pointer items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-white">Cross-post to social</p>
            <p className="mt-0.5 text-[11px] text-white/50">Master switch for auto-posting your published ideas.</p>
          </div>
          <Switch checked={prefs.enabled} onChange={setEnabled} />
        </label>
      </div>

      <div className="space-y-1.5">
        {PLATFORMS.map((p) => {
          const conn = byPlatform.get(p.id);
          const isPending = pending === p.id;
          const isConnected = !!conn;
          return (
            <div
              key={p.id}
              className={`flex items-center justify-between gap-3 rounded-lg border border-white/10 px-3 py-2.5 transition ${
                prefs.enabled ? "bg-[#0D1117] hover:border-white/20" : "bg-[#080B10] opacity-60"
              }`}
            >
              <span className="flex min-w-0 items-center gap-3">
                <span className={`grid h-8 w-8 place-items-center rounded-md bg-white/[0.04] ${p.accent}`}>
                  {p.icon}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-white">{p.label}</span>
                  {isConnected ? (
                    <span className="block truncate text-[10px] text-emerald-300/85">
                      Connected{conn.providerDisplayName ? ` as ${conn.providerDisplayName}` : ""}
                    </span>
                  ) : (
                    <span className="block text-[10px] text-white/40">Not connected</span>
                  )}
                </span>
              </span>
              <div className="flex shrink-0 items-center gap-2">
                {isConnected && (
                  <Switch
                    checked={prefs.enabled && conn.autoPost}
                    disabled={!prefs.enabled || isPending}
                    onChange={(v) => setAutoPost({ connectionId: conn._id, autoPost: v })}
                  />
                )}
                {isConnected ? (
                  <button
                    type="button"
                    onClick={() => handleDisconnect(conn._id, p.id)}
                    disabled={isPending}
                    className="rounded-md border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-[11px] font-medium text-rose-200 transition hover:border-rose-400/40 hover:bg-rose-500/10 disabled:opacity-50"
                  >
                    {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Unbind"}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleConnect(p.id)}
                    disabled={isPending || !prefs.enabled}
                    className="rounded-md border border-[#6366F1]/40 bg-[#6366F1]/10 px-2.5 py-1.5 text-[11px] font-semibold text-[#C7D2FE] transition hover:border-[#6366F1] hover:bg-[#6366F1]/20 disabled:opacity-50"
                  >
                    {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Bind"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-[10px] leading-relaxed text-white/40">
        We only auto-post ideas you publish. Nothing else is shared. Unbind any time.
      </p>
    </div>
  );
}

// ─── Audio tab ──────────────────────────────────────────────────────────
function AudioTab() {
  const vols = audioManager.getVolumes?.() ?? { music: 0.5, sfx: 0.7, ui: 0.7, master: 0.8 };
  const [music, setMusic] = useState<number>(vols.music ?? 0.5);
  const [sfx, setSfx] = useState<number>(vols.sfx ?? 0.7);
  const [muted, setMuted] = useState<boolean>(audioManager.isMuted ?? false);

  const onMusic = (v: number) => {
    setMusic(v);
    audioManager.setMusicVolume?.(v);
  };
  const onSfx = (v: number) => {
    setSfx(v);
    audioManager.setSFXVolume?.(v);
  };
  const onMute = (v: boolean) => {
    setMuted(v);
    audioManager.setMuted?.(v);
  };

  return (
    <div className="space-y-4">
      <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-white/10 bg-[#0D1117] p-3">
        <div>
          <p className="text-sm font-semibold text-white">Mute all</p>
          <p className="mt-0.5 text-[11px] text-white/50">Silence music, SFX, and UI sounds.</p>
        </div>
        <Switch checked={muted} onChange={onMute} />
      </label>

      <div className="rounded-lg border border-white/10 bg-[#0D1117] p-3">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-semibold text-white">Music</p>
          <span className="text-xs text-white/50">{Math.round(music * 100)}%</span>
        </div>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={music}
          onChange={(e) => onMusic(Number(e.target.value))}
          disabled={muted}
          className="w-full accent-indigo-500 disabled:opacity-40"
        />
      </div>

      <div className="rounded-lg border border-white/10 bg-[#0D1117] p-3">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-semibold text-white">SFX</p>
          <span className="text-xs text-white/50">{Math.round(sfx * 100)}%</span>
        </div>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={sfx}
          onChange={(e) => onSfx(Number(e.target.value))}
          disabled={muted}
          className="w-full accent-indigo-500 disabled:opacity-40"
        />
      </div>
    </div>
  );
}

// ─── Local switch (kept local to avoid new dep) ─────────────────────────
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
