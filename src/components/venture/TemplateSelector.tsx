"use client";

/**
 * TemplateSelector.tsx
 *
 * Phase 18 — Template Selection UI
 *
 * Allows users to choose which template (Venture/Academic/Lab/Creative)
 * they want to use for their project.
 */

import { useState } from "react";
import { motion } from "framer-motion";
import { getTemplate, type TemplateId } from "@/config/templates";

interface TemplateSelectorProps {
  selected: TemplateId;
  onSelect: (templateId: TemplateId) => void;
  disabled?: boolean;
}

const TEMPLATE_CARDS: Record<
  TemplateId,
  {
    emoji: string;
    title: string;
    subtitle: string;
    description: string;
    color: string;
    gradient: string;
  }
> = {
  venture: {
    emoji: "🚀",
    title: "Business Venture",
    subtitle: "Build a startup or business",
    description:
      "Transform your idea into a real business. Track valuation, complete investor-ready tasks, and conquer the entrepreneurial journey.",
    color: "#6366f1",
    gradient: "from-indigo-500 to-purple-600",
  },
  academic: {
    emoji: "📚",
    title: "Academic Research",
    subtitle: "Publish a research paper",
    description:
      "Navigate the scholarly path from literature review to publication. Track JIF score, build rigorous methodology, and earn citations.",
    color: "#d4a853",
    gradient: "from-amber-600 to-yellow-700",
  },
  lab: {
    emoji: "⚗️",
    title: "Lab Experiment",
    subtitle: "Run a scientific study",
    description:
      "Design and execute a hypothesis-driven experiment. Track p-values, validate results, and achieve statistical significance.",
    color: "#06d6a0",
    gradient: "from-teal-500 to-cyan-600",
  },
  creative: {
    emoji: "🎨",
    title: "Creative Project",
    subtitle: "Launch art or content",
    description:
      "Bring your creative vision to life. Track fan score, refine your craft, and share your work with the world.",
    color: "#ffd166",
    gradient: "from-yellow-400 to-orange-500",
  },
};

export function TemplateSelector({
  selected,
  onSelect,
  disabled = false,
}: TemplateSelectorProps) {
  const [hoveredId, setHoveredId] = useState<TemplateId | null>(null);

  const templates: TemplateId[] = ["venture", "academic", "lab", "creative"];

  return (
    <div className="w-full">
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold text-white mb-2">
          Choose Your Template
        </h2>
        <p className="text-gray-400 text-sm">
          Select the framework that best matches your project type
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {templates.map((templateId) => {
          const card = TEMPLATE_CARDS[templateId];
          const template = getTemplate(templateId);
          const isSelected = selected === templateId;
          const isHovered = hoveredId === templateId;

          return (
            <motion.button
              key={templateId}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(templateId)}
              onMouseEnter={() => setHoveredId(templateId)}
              onMouseLeave={() => setHoveredId(null)}
              className="relative overflow-hidden rounded-xl border-2 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                borderColor: isSelected ? card.color : "rgba(255,255,255,0.1)",
                background: isSelected
                  ? `linear-gradient(135deg, ${card.color}22, ${card.color}11)`
                  : "rgba(0,0,0,0.3)",
              }}
              whileHover={!disabled ? { scale: 1.02 } : {}}
              whileTap={!disabled ? { scale: 0.98 } : {}}
            >
              {/* Selection indicator */}
              {isSelected && (
                <motion.div
                  className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center"
                  style={{ background: card.color }}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                >
                  <span className="text-white text-sm">✓</span>
                </motion.div>
              )}

              {/* Hover glow effect */}
              {(isHovered || isSelected) && (
                <motion.div
                  className="absolute inset-0 opacity-20 blur-xl"
                  style={{
                    background: `linear-gradient(135deg, ${card.color}, transparent)`,
                  }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: isSelected ? 0.3 : 0.2 }}
                />
              )}

              <div className="relative p-6">
                {/* Emoji icon */}
                <div
                  className="text-5xl mb-3 transition-transform"
                  style={{
                    transform: isHovered ? "scale(1.1)" : "scale(1)",
                  }}
                >
                  {card.emoji}
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold text-white mb-1">
                  {card.title}
                </h3>

                {/* Subtitle */}
                <p
                  className="text-sm font-medium mb-3"
                  style={{ color: card.color }}
                >
                  {card.subtitle}
                </p>

                {/* Description */}
                <p className="text-gray-300 text-sm mb-4 leading-relaxed">
                  {card.description}
                </p>

                {/* Stats */}
                <div className="flex items-center gap-4 text-xs text-gray-400">
                  <div className="flex items-center gap-1">
                    <span>📊</span>
                    <span>{template.qualityMetric.label}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span>🗺️</span>
                    <span>
                      {template.stages.length} stages,{" "}
                      {template.totalCheckpoints} checkpoints
                    </span>
                  </div>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Selected template details */}
      {selected && (
        <motion.div
          className="mt-6 p-4 rounded-lg border border-white/10 bg-white/5"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-start gap-3">
            <div className="text-3xl">{TEMPLATE_CARDS[selected].emoji}</div>
            <div className="flex-1">
              <h4 className="text-white font-semibold mb-1">
                {TEMPLATE_CARDS[selected].title} Selected
              </h4>
              <p className="text-gray-300 text-sm">
                Your project will progress through{" "}
                {getTemplate(selected).stages.length} stages, completing{" "}
                {getTemplate(selected).totalCheckpoints} checkpoints to master
                the {TEMPLATE_CARDS[selected].subtitle.toLowerCase()}.
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
