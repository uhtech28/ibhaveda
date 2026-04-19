"use client";

import { useAtom } from "jotai";
import { motion } from "framer-motion";
import { Volume2, VolumeX, Music, Volume1 } from "lucide-react";
import { audioSettingsAtom } from "@/lib/stores/hudStore";

export function AudioControls() {
  const [audioSettings, setAudioSettings] = useAtom(audioSettingsAtom);

  const toggleMute = () => {
    setAudioSettings((prev) => ({ ...prev, muted: !prev.muted }));
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
      >
        {getVolumeIcon()}
        {audioSettings.muted && (
          <div className="absolute inset-0 bg-red-500/20 rounded-lg" />
        )}
      </motion.button>

      <div className="hidden md:flex items-center gap-1.5">
        <Music className="w-3 h-3 text-gray-500" />
        <div className="w-16 h-1.5 bg-[#1e293b] rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] rounded-full"
            animate={{ width: `${getVolumePercentage()}%` }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
          />
        </div>
      </div>
    </div>
  );
}