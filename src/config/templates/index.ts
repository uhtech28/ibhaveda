/**
 * index.ts
 *
 * Template registry and resolver.
 *
 * Usage:
 *   import { getTemplate, TEMPLATE_REGISTRY } from "@/config/templates";
 *   const template = getTemplate("academic");
 *
 * All four templates are registered here.
 * The rest of the codebase only imports from this file — never directly from individual configs.
 */

import type { ProjectTemplate, TemplateId } from "./templateTypes";
import { VENTURE_TEMPLATE } from "./venture.config";
import { ACADEMIC_TEMPLATE } from "./academic.config";
import { LAB_TEMPLATE } from "./lab.config";
import { CREATIVE_TEMPLATE } from "./creative.config";

// ─────────────────────────────────────────────────────────────────────────────
// REGISTRY
// ─────────────────────────────────────────────────────────────────────────────

export const TEMPLATE_REGISTRY: Record<TemplateId, ProjectTemplate> = {
  venture: VENTURE_TEMPLATE,
  academic: ACADEMIC_TEMPLATE,
  lab: LAB_TEMPLATE,
  creative: CREATIVE_TEMPLATE,
};

// ─────────────────────────────────────────────────────────────────────────────
// RESOLVER
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Resolve a template by ID. Throws if the ID is invalid.
 *
 * @example
 * const template = getTemplate("lab");
 * template.qualityMetric.direction // "lower_is_better"
 */
export function getTemplate(id: TemplateId): ProjectTemplate {
  const template = TEMPLATE_REGISTRY[id];
  if (!template) {
    throw new Error(`[TemplateEngine] Unknown template ID: "${id}"`);
  }
  return template;
}

/**
 * Resolve a template, falling back to "venture" if the ID is missing or unknown.
 * Safe to call with any string (e.g. from DB).
 */
export function getTemplateSafe(id: string | null | undefined): ProjectTemplate {
  if (id && id in TEMPLATE_REGISTRY) {
    return TEMPLATE_REGISTRY[id as TemplateId];
  }
  return VENTURE_TEMPLATE;
}

/**
 * Get all registered templates as an array (for template selection UI).
 */
export function getAllTemplates(): ProjectTemplate[] {
  return Object.values(TEMPLATE_REGISTRY);
}

/**
 * Check whether a string is a valid TemplateId.
 */
export function isValidTemplateId(id: string): id is TemplateId {
  return id in TEMPLATE_REGISTRY;
}

// ─────────────────────────────────────────────────────────────────────────────
// METRIC HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Determine the quality tier for a given metric value.
 * Handles both higher_is_better and lower_is_better directions.
 *
 * @returns "high" | "standard" | "low"
 */
export function getQualityTierForTemplate(
  templateId: TemplateId,
  metricValue: number,
): "high" | "standard" | "low" {
  const { qualityMetric } = getTemplate(templateId);
  const { direction, thresholds } = qualityMetric;

  if (direction === "lower_is_better") {
    // For Lab (p-value): lower is better
    // p <= 0.05 → High, p <= 0.5 → Standard, else Low
    if (metricValue <= thresholds.high) return "high";
    if (metricValue <= thresholds.standard) return "standard";
    return "low";
  } else {
    // For Venture/Academic/Creative: higher is better
    if (metricValue >= thresholds.high) return "high";
    if (metricValue >= thresholds.standard) return "standard";
    return "low";
  }
}

/**
 * Format a metric value for display in the HUD.
 * Returns a formatted string appropriate for the template.
 */
export function formatMetricValue(
  templateId: TemplateId,
  value: number,
): string {
  const { qualityMetric } = getTemplate(templateId);

  switch (qualityMetric.displayFormat) {
    case "currency":
      return `${qualityMetric.unit}${(value / 100_000).toFixed(1)}L`;
    case "decimal":
      return value.toFixed(3);
    case "percent":
      return `${(value * 100).toFixed(1)}%`;
    case "score":
      return value >= 1000
        ? `${(value / 1000).toFixed(1)}K ${qualityMetric.unit}`
        : `${value} ${qualityMetric.unit}`;
    default:
      return String(value);
  }
}

/**
 * Get the HUD color variables for a template.
 * Returns a class name to apply to the HUD container.
 */
export function getHUDThemeClass(templateId: TemplateId): string {
  return `hud-theme--${templateId}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// RE-EXPORTS
// ─────────────────────────────────────────────────────────────────────────────

export type { ProjectTemplate, TemplateId } from "./templateTypes";
export type {
  StageConfig,
  MonsterConfig,
  QualityMetricConfig,
  MetricDirection,
  BiomeThemeConfig,
  AudioProfile,
  AnimationProfile,
  ThemeConfig,
  AIScoringConfig,
  AIScoringDimension,
  SpecialToolConfig,
} from "./templateTypes";
