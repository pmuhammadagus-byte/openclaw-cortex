/**
 * Self-Reflection Engine
 * Enables AI to critique and improve its own reasoning before finalizing responses.
 */

import type { ReflectionResult } from "../utils/types.js";

export interface ReflectOptions {
  thought: string;
  depth: number;
  context?: string;
}

/**
 * Perform multi-pass self-reflection on a thought or response.
 * Each pass critiques from a different angle.
 */
export async function reflect(options: ReflectOptions): Promise<ReflectionResult> {
  const { thought, depth, context } = options;

  let currentThought = thought;
  const allImprovements: string[] = [];
  let confidence = 0.8;

  // Pass 1: Factual accuracy & logic check
  const critique1 = critiqueFactualAccuracy(currentThought, context);
  if (critique1.issues.length > 0) {
    currentThought = applyFixes(currentThought, critique1.issues);
    allImprovements.push(...critique1.issues);
    confidence -= 0.05 * critique1.issues.length;
  }

  // Pass 2: Completeness & edge cases (if depth >= 2)
  let critique2: Critique | undefined;
  if (depth >= 2) {
    critique2 = critiqueCompleteness(currentThought, context);
    if (critique2.issues.length > 0) {
      currentThought = applyFixes(currentThought, critique2.issues);
      allImprovements.push(...critique2.issues);
      confidence -= 0.03 * critique2.issues.length;
    }
  }

  // Pass 3: Bias & assumption check (if depth >= 3)
  let critique3: Critique | undefined;
  if (depth >= 3) {
    critique3 = critiqueBiasAndAssumptions(currentThought, context);
    if (critique3.issues.length > 0) {
      currentThought = applyFixes(currentThought, critique3.issues);
      allImprovements.push(...critique3.issues);
      confidence -= 0.02 * critique3.issues.length;
    }
  }

  confidence = Math.max(0.1, Math.min(0.99, confidence));

  return {
    originalThought: thought,
    critique: [critique1?.summary, critique2?.summary, critique3?.summary]
      .filter(Boolean)
      .join("; "),
    improvements: allImprovements,
    confidence,
    revisedThought: currentThought,
  };
}

interface Critique {
  issues: string[];
  summary: string;
}

function critiqueFactualAccuracy(thought: string, _context?: string): Critique {
  const issues: string[] = [];

  // Check for absolute statements without qualification
  const absolutePatterns = [
    /\b(always|never|all|none|every|impossible|certainly)\b/gi,
    /\b(definitely|undoubtedly|without question)\b/gi,
  ];

  for (const pattern of absolutePatterns) {
    const matches = thought.match(pattern);
    if (matches && matches.length > 2) {
      issues.push(`Too many absolute statements (${matches.length}). Consider adding qualifiers.`);
    }
  }

  // Check for unsupported claims
  if (/\b(it is known that|everyone knows|obviously)\b/gi.test(thought)) {
    issues.push("Contains unsupported authoritative claims. Add evidence or rephrase.");
  }

  return {
    issues,
    summary: issues.length > 0
      ? `Factual critique: ${issues.length} issues found`
      : "Factual accuracy check passed",
  };
}

function critiqueCompleteness(thought: string, _context?: string): Critique {
  const issues: string[] = [];

  // Check for missing edge cases
  if (!/\b(however|but|except|unless|if not|edge case)\b/gi.test(thought)) {
    issues.push("No counter-arguments or edge cases addressed.");
  }

  // Check for missing alternatives
  if (!/\b(alternative|another approach|or|option)\b/gi.test(thought)) {
    issues.push("No alternative approaches mentioned.");
  }

  // Check length — too short might be incomplete
  if (thought.split(/\s+/).length < 30) {
    issues.push("Response seems brief. Consider expanding on key points.");
  }

  return {
    issues,
    summary: issues.length > 0
      ? `Completeness critique: ${issues.length} gaps found`
      : "Completeness check passed",
  };
}

function critiqueBiasAndAssumptions(thought: string, _context?: string): Critique {
  const issues: string[] = [];

  // Check for assumptions
  if (/\b(assume|assuming|presumably|likely)\b/gi.test(thought)) {
    issues.push("Contains unstated assumptions. Make them explicit or verify.");
  }

  // Check for recency bias
  if (/\b(the latest|the newest|recently|nowadays|today)\b/gi.test(thought)) {
    issues.push("Possible recency bias. Consider historical context.");
  }

  return {
    issues,
    summary: issues.length > 0
      ? `Bias critique: ${issues.length} concerns found`
      : "Bias check passed",
  };
}

function applyFixes(thought: string, issues: string[]): string {
  if (issues.length === 0) return thought;
  return `${thought}\n\n[Self-corrected: ${issues.join("; ")}]`;
}
