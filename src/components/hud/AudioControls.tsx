"use client";

import { useAtom } from "jotai";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Volume2, VolumeX, Volume1 } from "lucide-react";
import { audioSettingsAtom } from "@/lib/stores/hudStore";
import { audioManager } from "@/lib/audio/audioManager";

export function AudioControls() {
  const [audioSettings, setAudioSettings] = useAtom(audioSettingsAtom);
  const [isSystemMuted, setIsSystemMuted] = useState(false);

  // Keep audioManager in sync with the Jotai atom
  useEffect(() => {
    audioManager.setMuted(audioSettings.muted);
  }, [audioSettings.muted]);

  useEffect(() => {
    audioManager.setMasterVolume(audioSettings.masterVolume);
  }, [audioSettings.masterVolume]);

  // Check system mute state on mount and periodically
  useEffect(() => {
    const checkSystemMute = async () => {
      try {
        // Check if audio context is suspended (indicates system mute or no audio)
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContext) {
          const ctx = new AudioContext();
          const isSuspended = ctx.state === 'suspended';
          setIsSystemMuted(isSuspended);
          
          // If system is muted, sync our app state
          if (isSuspended && !audioSettings.muted) {
            setAudioSettings((prev) => ({ ...prev, muted: true }));
          }
          
          ctx.close();
        }
      } catch (error) {
        // Fallback: assume not muted if we can't detect
        console.log('Could not detect system mute state');
      }
    };

    // Check on mount
    checkSystemMute();

    // Check periodically (every 2 seconds)
    const interval = setInterval(checkSystemMute, 2000);

    // Listen for visibility change (when user switches tabs)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkSystemMute();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [audioSettings.muted, setAudioSettings]);

  const toggleMute = () => {
    setAudioSettings((prev) => ({ ...prev, muted: !prev.muted }));
  };

  const getVolumeIcon = () => {
    const isMuted = audioSettings.muted || isSystemMuted || audioSettings.masterVolume === 0;
    
    if (isMuted) {
      return <VolumeX className="w-4 h-4 sm:w-5 sm:h-5" />;
    }
    if (audioSettings.masterVolume < 0.5) {
      return <Volume1 className="w-4 h-4 sm:w-5 sm:h-5" />;
    }
    return <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" />;
  };

  const isMuted = audioSettings.muted || isSystemMuted;

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
      {isSystemMuted && (
        <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border border-zinc-900" 
             title="System audio is muted" />
      )}
    </motion.button>
  );
}
