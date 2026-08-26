/**
 * Knowledge Synthesis Engine
 * Combines multiple information sources into unified insights,
 * resolves conflicts, and identifies knowledge gaps.
 */

import type { SynthesisResult, ConflictResolution } from "../utils/types.js";

export interface SynthesizeOptions {
  sources: string[];
  query?: string;
  context?: string;
}

/**
 * Synthesize multiple sources into a unified insight.
 */
export async function synthesize(options: SynthesizeOptions): Promise<SynthesisResult> {
  const { sources, query, context } = options;

  if (sources.length === 0) {
    return {
      sources: [],
      unifiedInsight: "No sources provided for synthesis.",
      conflicts: [],
      gaps: ["No data to synthesize"],
      confidence: 0,
    };
  }

  if (sources.length === 1) {
    return {
      sources,
      unifiedInsight: sources[0],
      conflicts: [],
      gaps: identifyGaps(sources[0], query, context),
      confidence: 0.6,
    };
  }

  // Detect conflicts between sources
  const conflicts = detectConflicts(sources);

  // Resolve conflicts where possible
  const resolvedConflicts = conflicts.map((c) => ({
    ...c,
    resolution: attemptResolution(c),
  }));

  // Build unified insight
  const unifiedInsight = buildUnifiedInsight(sources, resolvedConflicts);

  // Identify remaining gaps
  const gaps = identifyGaps(unifiedInsight, query, context);

  // Calculate confidence
  const baseConfidence = Math.min(0.95, 0.5 + sources.length * 0.1);
  const conflictPenalty = conflicts.length * 0.05;
  const gapPenalty = gaps.length * 0.03;
  const confidence = Math.max(0.1, baseConfidence - conflictPenalty - gapPenalty);

  return {
    sources,
    unifiedInsight,
    conflicts: resolvedConflicts,
    gaps,
    confidence,
  };
}

function detectConflicts(sources: string[]): ConflictResolution[] {
  const conflicts: ConflictResolution[] = [];

  for (let i = 0; i < sources.length; i++) {
    for (let j = i + 1; j < sources.length; j++) {
      const a = sources[i].toLowerCase();
      const b = sources[j].toLowerCase();

      // Check for direct contradictions
      const contradictionPatterns = [
        { a: /\b(is|are|was|were)\b.*\b(not|never|no)\b/, b: /\b(is|are|was|were)\b(?!.*\b(not|never|no)\b)/ },
        { a: /\b(increases|grows|rises)\b/, b: /\b(decreases|falls|drops)\b/ },
        { a: /\b(positive|beneficial|good)\b/, b: /\b(negative|harmful|bad)\b/ },
      ];

      for (const pattern of contradictionPatterns) {
        if (pattern.a.test(a) && pattern.b.test(b)) {
          conflicts.push({
            sourceA: `Source ${i + 1}`,
            sourceB: `Source ${j + 1}`,
            conflict: "Direct contradiction detected",
            resolution: "",
          });
        }
      }
    }
  }

  return conflicts;
}

function attemptResolution(conflict: ConflictResolution): string {
  // Simple resolution strategies
  if (conflict.conflict.includes("contradiction")) {
    return "Both sources may be context-dependent. Verify conditions under which each applies.";
  }
  return "Manual review required.";
}

function buildUnifiedInsight(sources: string[], conflicts: ConflictResolution[]): string {
  if (conflicts.length === 0) {
    return `Synthesized from ${sources.length} sources: ${sources.join(" | ")}`;
  }

  const nonConflicting = sources.filter((_, i) => {
    return !conflicts.some((c) => c.sourceA === `Source ${i + 1}` || c.sourceB === `Source ${i + 1}`);
  });

  return `Synthesized from ${sources.length} sources with ${conflicts.length} noted conflicts. ` +
    `Consensus areas: ${nonConflicting.join(" | ") || "None without conflict"}. ` +
    `Conflicting areas require further verification.`;
}

function identifyGaps(insight: string, query?: string, _context?: string): string[] {
  const gaps: string[] = [];

  // Check if query was fully answered
  if (query && !insight.toLowerCase().includes(query.toLowerCase().split(" ")[0])) {
    gaps.push("Core query terms may not be fully addressed");
  }

  // Check for missing quantification
  if (!/\b(\d+%?|\d+\.\d+|many|few|most|some|all)\b/g.test(insight)) {
    gaps.push("No quantitative or proportional data found");
  }

  // Check for missing causality
  if (!/\b(because|therefore|thus|causes|leads to|results in)\b/gi.test(insight)) {
    gaps.push("Causal relationships not explicitly stated");
  }

  // Check for missing timeframe
  if (!/\b(in \d{4}|since|until|now|currently|recently|future)\b/gi.test(insight)) {
    gaps.push("Temporal context not specified");
  }

  return gaps;
}
