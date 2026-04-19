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
    <div className="flex items-center gap-2">
      <motion.button
        onClick={toggleMute}
        className="relative w-8 h-8 rounded-lg bg-[#1e293b] border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        title={audioSettings.muted ? "Unmute audio" : "Mute audio"}
        aria-label={audioSettings.muted ? "Unmute audio" : "Mute audio"}
      >
        {getVolumeIcon()}
        {audioSettings.muted && (
          <div className="absolute inset-0 bg-red-500/20 rounded-lg" />
        )}
      </motion.button>

      <div className="hidden md:flex items-center gap-1.5">
        <Music className="w-3 h-3 text-gray-500" />
        {/* Master volume slider */}
        <div className="relative w-16 h-4 flex items-center">
          <div className="w-full h-1.5 bg-[#1e293b] rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] rounded-full"
              animate={{ width: `${getVolumePercentage()}%` }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
            />
          </div>
          {/* Invisible range input for accessibility and interaction */}
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
                // Auto-unmute when user drags the slider up
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
