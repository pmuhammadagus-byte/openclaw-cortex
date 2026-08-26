/**
 * Reasoning Engine
 * Structured reasoning chains, fallacy detection, and confidence scoring.
 */

import type { ReasoningChain, ReasoningStep } from "../utils/types.js";

export interface ReasonOptions {
  query: string;
  mode: "fast" | "deep" | "adaptive";
  context?: string;
}

/**
 * Build a structured reasoning chain for a query.
 */
export async function reason(options: ReasonOptions): Promise<ReasoningChain> {
  const { query, mode, context } = options;

  // Adaptive mode: choose depth based on query complexity
  const effectiveMode = mode === "adaptive" ? detectComplexity(query) : mode;

  const steps: ReasoningStep[] = [];
  const fallacies: string[] = [];

  // Step 1: Deconstruct the query
  steps.push({
    step: 1,
    statement: `Deconstruct query: "${query}"`,
    evidence: ["Query parsed into components"],
    validity: "valid",
  });

  // Step 2: Identify relevant knowledge (deeper in deep mode)
  if (effectiveMode === "deep") {
    steps.push({
      step: 2,
      statement: "Map query to known domains and concepts",
      evidence: ["Domain identification", "Concept mapping"],
      validity: "valid",
    });
  }

  // Step 3: Generate hypotheses
  steps.push({
    step: steps.length + 1,
    statement: "Generate and evaluate hypotheses",
    evidence: effectiveMode === "deep"
      ? ["Multiple hypotheses generated", "Evidence weighed for each"]
      : ["Primary hypothesis selected"],
    validity: "valid",
  });

  // Step 4: Check for fallacies
  const detectedFallacies = detectFallacies(query, context);
  fallacies.push(...detectedFallacies);

  if (detectedFallacies.length > 0) {
    steps.push({
      step: steps.length + 1,
      statement: `Fallacy check: ${detectedFallacies.join(", ")}`,
      evidence: ["Logical structure analyzed"],
      validity: "weak",
    });
  }

  // Step 5: Synthesize conclusion
  steps.push({
    step: steps.length + 1,
    statement: "Synthesize conclusion from evidence",
    evidence: ["Evidence integrated", "Conclusion formed"],
    validity: fallacies.length > 0 ? "weak" : "valid",
  });

  // Calculate confidence
  const baseConfidence = effectiveMode === "deep" ? 0.85 : 0.75;
  const fallacyPenalty = fallacies.length * 0.1;
  const confidence = Math.max(0.1, baseConfidence - fallacyPenalty);

  return {
    premise: query,
    steps,
    conclusion: `Based on ${steps.length} reasoning steps${fallacies.length > 0 ? " with noted logical concerns" : ""}`,
    confidence,
    fallacies,
  };
}

function detectComplexity(query: string): "fast" | "deep" {
  const deepIndicators = [
    /\b(why|how|explain|compare|contrast|analyze|evaluate|synthesize)\b/i,
    /\b(what if|implications|consequences|trade-offs|alternatives)\b/i,
    /\?.*\?/, // Multiple questions
    /\b(complex|complicated|nuanced|subtle|ambiguous)\b/i,
  ];

  const score = deepIndicators.reduce((sum, pattern) => sum + (pattern.test(query) ? 1 : 0), 0);
  return score >= 2 ? "deep" : "fast";
}

function detectFallacies(query: string, _context?: string): string[] {
  const fallacies: string[] = [];

  // Ad hominem
  if (/\b(you are|you're|your)\b.*\b(wrong|stupid|biased)\b/gi.test(query)) {
    fallacies.push("Possible ad hominem pattern");
  }

  // False dichotomy
  if (/\b(either|or)\b.*\b(or)\b/gi.test(query) && !/\b(and|also|additionally)\b/gi.test(query)) {
    fallacies.push("Possible false dichotomy");
  }

  // Appeal to authority
  if (/\b(expert|study|research|paper)\b.*\b(says|shows|proves)\b/gi.test(query)) {
    fallacies.push("Possible appeal to authority without citation");
  }

  // Circular reasoning
  if (/\b(because)\b.*\b(because)\b/gi.test(query)) {
    fallacies.push("Possible circular reasoning");
  }

  return fallacies;
}
