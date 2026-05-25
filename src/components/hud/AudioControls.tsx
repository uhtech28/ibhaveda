  "use client";

import { useAtom } from "jotai";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Volume2, VolumeX, Volume1 } from "lucide-react";
import { audioSettingsAtom } from "@/lib/stores/hudStore";
import { audioManager } from "@/lib/audio/audioManager";

export function AudioControls() {
  const [audioSettings, setAudioSettings] = useAtom(audioSettingsAtom);

  // Keep audioManager in sync with the Jotai atom
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

  useEffect(() => {
    audioManager.setUIVolume(audioSettings.uiVolume);
  }, [audioSettings.uiVolume]);

  // Unlock audio context on first user gesture anywhere on the page
  useEffect(() => {
    const handleGesture = () => {
      audioManager.unlock();
      // Remove listeners once unlocked
      document.removeEventListener("click", handleGesture);
      document.removeEventListener("keydown", handleGesture);
      document.removeEventListener("pointerdown", handleGesture);
    };

    document.addEventListener("click", handleGesture);
    document.addEventListener("keydown", handleGesture);
    document.addEventListener("pointerdown", handleGesture);

    return () => {
      document.removeEventListener("click", handleGesture);
      document.removeEventListener("keydown", handleGesture);
      document.removeEventListener("pointerdown", handleGesture);
    };
  }, []);

  const toggleMute = () => {
    const nextMuted = !audioSettings.muted;
    setAudioSettings((prev) => ({ ...prev, muted: nextMuted }));
    
    // Explicitly unlock and set status on click
    if (!nextMuted) {
      audioManager.unlock();
      audioManager.setMuted(false);
    } else {
      audioManager.setMuted(true);
    }
  };

  const getVolumeIcon = () => {
    const isMuted = audioSettings.muted || audioSettings.masterVolume === 0;
    
    if (isMuted) {
      return <VolumeX className="w-4 h-4 sm:w-5 sm:h-5" />;
    }
    if (audioSettings.masterVolume < 0.5) {
      return <Volume1 className="w-4 h-4 sm:w-5 sm:h-5" />;
    }
    return <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" />;
  };

  const isMuted = audioSettings.muted;

  return (
    <motion.button
      onClick={toggleMute}
      className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-zinc-950/50 backdrop-blur-xl border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-all hover:bg-zinc-900/60 hover:border-indigo-500/30 shadow-lg"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      title={isMuted ? "Unmute audio" : "Mute audio"}
    >
      {getVolumeIcon()}
      {isMuted && (
        <motion.div 
          className="absolute inset-0 bg-red-500/10 rounded-xl"
          animate={{ opacity: [0.1, 0.3, 0.1] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
    </motion.button>
  );
}
