"use client";

import { useAtom } from "jotai";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Volume2, VolumeX, Music, Volume1 } from "lucide-react";
import { audioSettingsAtom } from "@/lib/stores/hudStore";
import { audioManager } from "@/lib/audio/audioManager";

export function AudioControls() {
  const [audioSettings, setAudioSettings] = useAtom(audioSettingsAtom);

  // Keep audioManager in sync with the Jotai atom whenever it changes.
  // This covers changes made from the HUD (this component) AND from the
  // map-page AudioToggle — both write to the same atom.
  useEffect(() => {
    audioManager.setMuted(audioSettings.muted);
  }, [audioSettings.muted]);

  useEffect(() => {
    audioManager.setMasterVolume(audioSettings.masterVolume);
  }, [audioSettings.masterVolume]);

  useEffect(() => {
    audioManager.setMusicVolume(audioSettings.musicVolume);
  }, [audioSettings.musicVolume]);

  useEffect(() => {
    audioManager.setSFXVolume(audioSettings.sfxVolume);
  }, [audioSettings.sfxVolume]);

  const toggleMute = () => {
    setAudioSettings((prev) => ({ ...prev, muted: !prev.muted }));
    // audioManager.setMuted will be called by the useEffect above
  };

  const getVolumeIcon = () => {
    if (audioSettings.muted || audioSettings.masterVolume === 0) {
      return <VolumeX className="w-4 h-4" />;
    }
    if (audioSettings.masterVolume < 0.5) {
      return <Volume1 className="w-4 h-4" />;
    }
    return <Volume2 className="w-4 h-4" />;
  };

  const getVolumePercentage = () => {
    if (audioSettings.muted) return 0;
    return Math.round(audioSettings.masterVolume * 100);
  };

  return (
    <div className="flex items-center gap-3 font-sans group">
      <motion.button
        onClick={toggleMute}
        className="relative w-9 h-9 rounded-xl bg-zinc-950/50 backdrop-blur-xl border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-all hover:bg-zinc-900/60 hover:border-indigo-500/30 shadow-lg"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        title={audioSettings.muted ? "Unmute audio" : "Mute audio"}
      >
        {getVolumeIcon()}
        {audioSettings.muted && (
          <motion.div 
            className="absolute inset-0 bg-red-500/10 rounded-xl"
            animate={{ opacity: [0.1, 0.3, 0.1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}
      </motion.button>

      <div className="hidden lg:flex flex-col gap-1.5 min-w-[80px]">
        <div className="flex items-center justify-between">
          <span className="text-[8px] text-zinc-500 uppercase tracking-[0.2em] font-black leading-none">
            Volume
          </span>
          <span className="text-[8px] text-zinc-400 font-bold tabular-nums">
            {getVolumePercentage()}%
          </span>
        </div>

        {/* Master volume slider - custom styled bar */}
        <div className="relative w-20 h-4 flex items-center">
          <div className="w-full h-1.5 bg-black/40 backdrop-blur-sm rounded-full border border-white/5 overflow-hidden p-[1px]">
            <motion.div
              className="h-full bg-gradient-to-r from-indigo-600 via-violet-500 to-indigo-400 rounded-full relative"
              animate={{ width: `${getVolumePercentage()}%` }}
              transition={{ type: "spring", stiffness: 150, damping: 20 }}
            >
              {/* Inner highlight */}
              <div className="absolute inset-x-0 top-0 h-[0.5px] bg-white/20 rounded-full" />
            </motion.div>
          </div>
          {/* Invisible range input for interaction */}
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={audioSettings.muted ? 0 : audioSettings.masterVolume}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              setAudioSettings((prev) => ({
                ...prev,
                masterVolume: val,
                muted: val === 0 ? prev.muted : false,
              }));
            }}
            className="absolute inset-0 w-full opacity-0 cursor-pointer"
            aria-label="Master volume"
          />
        </div>
      </div>
    </div>
  );
}
