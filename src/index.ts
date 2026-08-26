/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  CORTEX — Cognitive Enhancement Engine for OpenClaw             ║
 * ║                                                                  ║
 * ║  Meta-cognition • Self-reflection • Reasoning boost             ║
 * ║  Knowledge synthesis • Entropy monitoring • Learning loop       ║
 * ╚══════════════════════════════════════════════════════════════════╝
 *
 * This plugin transforms OpenClaw from a reactive assistant into a
 * self-aware cognitive system. It monitors its own reasoning quality,
 * detects drift, synthesizes knowledge, and continuously improves.
 *
 * @module cortex
 * @version 1.0.0
 */

import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { Type } from "typebox";
import { reflect } from "./cognition/reflection.js";
import { reason } from "./cognition/reasoning.js";
import { synthesize } from "./cognition/synthesis.js";
import { contemplate } from "./cognition/contemplation.js";
import { getEntropyTrend, getLatestEntropy } from "./memory/entropy.js";
import { getGraphStats } from "./memory/knowledge-graph.js";
import { registerLifecycleHooks } from "./hooks/lifecycle.js";
import { registerCliCommands } from "./commands/cli.js";
import type { CortexConfig } from "./utils/types.js";

function resolveConfig(pluginConfig: Record<string, unknown> | undefined): CortexConfig {
  const cfg = pluginConfig || {};
  return {
    reflectionDepth: Math.min(3, Math.max(1, (cfg.reflectionDepth as number) || 2)),
    reasoningMode: (cfg.reasoningMode as "fast" | "deep" | "adaptive") || "adaptive",
    entropyThreshold: Math.min(1, Math.max(0, (cfg.entropyThreshold as number) || 0.7)),
    autoContemplate: (cfg.autoContemplate as boolean) ?? true,
    knowledgeGraphEnabled: (cfg.knowledgeGraphEnabled as boolean) ?? true,
    memoryDir: (cfg.memoryDir as string) || "",
  };
}

export default definePluginEntry({
  id: "openclaw-cortex",
  name: "Cortex — Cognitive Enhancement Engine",
  description:
    "Meta-cognition, self-reflection, reasoning boost, knowledge synthesis, " +
    "and autonomous learning loop for OpenClaw agents.",

  register(api) {
    const config = resolveConfig(api.pluginConfig as Record<string, unknown> | undefined);

    api.logger.info(`[Cortex] Initializing cognitive engine...`);
    api.logger.info(`[Cortex] Mode: ${config.reasoningMode} | Reflection depth: ${config.reflectionDepth} | Entropy threshold: ${config.entropyThreshold}`);

    // ═══════════════════════════════════════════════════════════════
    // LIFECYCLE HOOKS
    // Self-reflection, entropy monitoring, knowledge extraction
    // ═══════════════════════════════════════════════════════════════
    registerLifecycleHooks(api, config);

    // ═══════════════════════════════════════════════════════════════
    // TOOL: cortex_reflect
    // Self-reflection on any thought or response
    // ═══════════════════════════════════════════════════════════════
    api.registerTool({
      name: "cortex_reflect",
      label: "Reflect",
      description:
        "Perform structured self-reflection on a thought, response, or plan. " +
        "Critiques factual accuracy, completeness, and bias. Returns improved version.",
      parameters: Type.Object({
        thought: Type.String({ description: "The thought or response to reflect on" }),
        depth: Type.Optional(Type.Integer({ description: "Reflection passes (1-3)", minimum: 1, maximum: 3 })),
        context: Type.Optional(Type.String({ description: "Additional context" })),
      }),
      async execute(_id: string, params: { thought: string; depth?: number; context?: string }) {
        const depth = params.depth || config.reflectionDepth;
        const result = await reflect({
          thought: params.thought,
          depth,
          context: params.context,
        });

        const lines = [
          `# 🪞 Self-Reflection Report`,
          ``,
          `**Confidence:** ${(result.confidence * 100).toFixed(1)}%`,
          `**Critique:** ${result.critique}`,
          ``,
        ];

        if (result.improvements.length > 0) {
          lines.push(`## Improvements Needed`);
          for (const imp of result.improvements) {
            lines.push(`- ${imp}`);
          }
          lines.push("");
        }

        lines.push(`## Revised Thought`);
        lines.push(result.revisedThought);

        return {
          details: "",
          content: [{ type: "text", text: lines.join("\n") }],
        };
      },
    });

    // ═══════════════════════════════════════════════════════════════
    // TOOL: cortex_reason
    // Structured reasoning chain with fallacy detection
    // ═══════════════════════════════════════════════════════════════
    api.registerTool({
      name: "cortex_reason",
      label: "Reason",
      description:
        "Build a structured reasoning chain for a query. Detects logical fallacies, " +
        "evaluates evidence, and returns confidence-scored conclusion. Supports fast/deep/adaptive modes.",
      parameters: Type.Object({
        query: Type.String({ description: "The question or problem to reason about" }),
        mode: Type.Optional(Type.String({ description: "fast | deep | adaptive", default: "adaptive" })),
        context: Type.Optional(Type.String({ description: "Additional context" })),
      }),
      async execute(_id: string, params: { query: string; mode?: string; context?: string }) {
        const mode = (params.mode as "fast" | "deep" | "adaptive") || config.reasoningMode;
        const result = await reason({
          query: params.query,
          mode,
          context: params.context,
        });

        const lines = [
          `# 🧠 Reasoning Chain [${mode.toUpperCase()}]`,
          ``,
          `**Premise:** ${result.premise}`,
          `**Confidence:** ${(result.confidence * 100).toFixed(1)}%`,
          ``,
          `## Steps`,
        ];

        for (const step of result.steps) {
          const icon = step.validity === "valid" ? "✅" : step.validity === "weak" ? "⚠️" : "❌";
          lines.push(`${icon} **Step ${step.step}:** ${step.statement}`);
          if (step.evidence.length > 0) {
            lines.push(`   Evidence: ${step.evidence.join(", ")}`);
          }
        }

        if (result.fallacies.length > 0) {
          lines.push("", `## ⚠️ Logical Concerns`);
          for (const f of result.fallacies) {
            lines.push(`- ${f}`);
          }
        }

        lines.push("", `## Conclusion`);
        lines.push(result.conclusion);

        return {
          details: "",
          content: [{ type: "text", text: lines.join("\n") }],
        };
      },
    });

    // ═══════════════════════════════════════════════════════════════
    // TOOL: cortex_synthesize
    // Combine multiple sources into unified insight
    // ═══════════════════════════════════════════════════════════════
    api.registerTool({
      name: "cortex_synthesize",
      label: "Synthesize",
      description:
        "Synthesize multiple information sources into a unified insight. " +
        "Detects conflicts, resolves them where possible, and identifies knowledge gaps.",
      parameters: Type.Object({
        sources: Type.Array(Type.String(), { description: "Array of source texts to synthesize" }),
        query: Type.Optional(Type.String({ description: "Original query being answered" })),
        context: Type.Optional(Type.String({ description: "Additional context" })),
      }),
      async execute(_id: string, params: { sources: string[]; query?: string; context?: string }) {
        const result = await synthesize({
          sources: params.sources,
          query: params.query,
          context: params.context,
        });

        const lines = [
          `# 🔗 Synthesis Report`,
          ``,
          `**Sources:** ${result.sources.length}`,
          `**Confidence:** ${(result.confidence * 100).toFixed(1)}%`,
          ``,
          `## Unified Insight`,
          result.unifiedInsight,
        ];

        if (result.conflicts.length > 0) {
          lines.push("", `## ⚔️ Conflicts Detected`);
          for (const c of result.conflicts) {
            lines.push(`- **${c.sourceA} vs ${c.sourceB}:** ${c.conflict}`);
            if (c.resolution) lines.push(`  → Resolution: ${c.resolution}`);
          }
        }

        if (result.gaps.length > 0) {
          lines.push("", `## 🔍 Knowledge Gaps`);
          for (const g of result.gaps) {
            lines.push(`- ${g}`);
          }
        }

        return {
          details: "",
          content: [{ type: "text", text: lines.join("\n") }],
        };
      },
    });

    // ═══════════════════════════════════════════════════════════════
    // TOOL: cortex_contemplate
    // Multi-pass reflective inquiry for complex questions
    // ═══════════════════════════════════════════════════════════════
    api.registerTool({
      name: "cortex_contemplate",
      label: "Contemplate",
      description:
        "Deep contemplation of a complex inquiry through multiple passes: " +
        "explore → reflect → synthesize. Best for philosophical, strategic, or ambiguous questions.",
      parameters: Type.Object({
        inquiry: Type.String({ description: "The complex question to contemplate" }),
        passes: Type.Optional(Type.Integer({ description: "Number of passes (1-3)", minimum: 1, maximum: 3, default: 3 })),
        context: Type.Optional(Type.String({ description: "Additional context" })),
      }),
      async execute(_id: string, params: { inquiry: string; passes?: number; context?: string }) {
        const passes = params.passes || 3;
        const result = await contemplate({
          inquiry: params.inquiry,
          passes,
          context: params.context,
        });

        const lines = [
          `# 🧘 Contemplation Report`,
          ``,
          `**Inquiry:** ${result.inquiry}`,
          `**Certainty:** ${(result.certainty * 100).toFixed(1)}%`,
          `**Passes:** ${result.passes.length}`,
          ``,
        ];

        for (const p of result.passes) {
          const icon = p.mode === "explore" ? "🔭" : p.mode === "reflect" ? "🪞" : "✨";
          lines.push(`## ${icon} Pass ${p.pass}: ${p.mode.toUpperCase()}`);
          lines.push(p.output);
          if (p.insights.length > 0) {
            lines.push("**Key Insights:**");
            for (const insight of p.insights) {
              lines.push(`- ${insight}`);
            }
          }
          lines.push("");
        }

        lines.push(`## Final Synthesis`);
        lines.push(result.finalSynthesis);

        if (result.openQuestions.length > 0) {
          lines.push("", `## Open Questions`);
          for (const q of result.openQuestions) {
            lines.push(`- ${q}`);
          }
        }

        return {
          details: "",
          content: [{ type: "text", text: lines.join("\n") }],
        };
      },
    });

    // ═══════════════════════════════════════════════════════════════
    // TOOL: cortex_status
    // Cognitive health dashboard
    // ═══════════════════════════════════════════════════════════════
    api.registerTool({
      name: "cortex_status",
      label: "Status",
      description:
        "Get current cognitive status: entropy level, knowledge graph stats, " +
        "drift detection, and overall cognitive health.",
      parameters: Type.Object({}),
      async execute(_id: string, _params: Record<string, never>) {
        const entropy = getLatestEntropy();
        const trend = getEntropyTrend();
        const graph = getGraphStats();

        const entropyLevel = entropy
          ? entropy.entropyScore > 0.7
            ? "critical"
            : entropy.entropyScore > 0.5
              ? "high"
              : entropy.entropyScore > 0.3
                ? "moderate"
                : "low"
          : "unknown";

        const healthy = entropyLevel !== "critical" && entropyLevel !== "high";

        const lines = [
          `# 🧠 Cortex Cognitive Status`,
          ``,
          `**Healthy:** ${healthy ? "✅ YES" : "❌ NO"}`,
          `**Entropy Level:** ${entropyLevel.toUpperCase()}`,
          ``,
          `## Entropy`,
        ];

        if (entropy) {
          lines.push(`- Score: ${entropy.entropyScore}`);
          lines.push(`- Coherence: ${entropy.coherenceScore}`);
          lines.push(`- Drift: ${entropy.driftDetected ? "🚨 DETECTED" : "✅ None"}`);
          lines.push(`- Topics: ${entropy.focusTopics.join(", ") || "None"}`);
        } else {
          lines.push(`- No entropy data yet`);
        }

        lines.push(
          ``,
          `## Trend`,
          `- Direction: ${trend.increasing ? "📈 Increasing" : "📉 Stable/Decreasing"}`,
          `- Average: ${trend.average}`,
          `- Peak: ${trend.peak}`,
          ``,
          `## Knowledge Graph`,
          `- Nodes: ${graph.nodes}`,
          `- Edges: ${graph.edges}`,
        );

        if (graph.topEntities.length > 0) {
          lines.push(`- Top Entities: ${graph.topEntities.slice(0, 5).map((e) => e.entity).join(", ")}`);
        }

        return {
          details: "",
          content: [{ type: "text", text: lines.join("\n") }],
        };
      },
    });

    // ═══════════════════════════════════════════════════════════════
    // CLI Commands (registered in lifecycle module)
    // ═══════════════════════════════════════════════════════════════
    registerCliCommands(api);
  },
});
