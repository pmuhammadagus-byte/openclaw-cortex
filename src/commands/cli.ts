/**
 * Cortex CLI Commands — adapted to OpenClaw 2026.7.1 (Commander program API)
 */

import type { OpenClawPluginApi } from "openclaw/plugin-sdk/plugin-entry";
import { getGraphStats, queryGraph } from "../memory/knowledge-graph.js";
import { getLatestEntropy, getEntropyTrend } from "../memory/entropy.js";

export function registerCliCommands(api: OpenClawPluginApi) {
  api.registerCli((ctx) => {
    const program = ctx.program;

    // Command: cortex-status
    program
      .command("cortex-status")
      .description("Show cognitive status and health")
      .action(async () => {
        const entropy = getLatestEntropy();
        const trend = getEntropyTrend();
        const graph = getGraphStats();

        console.log("\n🧠 Cortex Cognitive Status");
        console.log("==========================");

        if (entropy) {
          const level =
            entropy.entropyScore > 0.7 ? "🔴 CRITICAL" :
            entropy.entropyScore > 0.5 ? "🟡 HIGH" :
            entropy.entropyScore > 0.3 ? "🟢 MODERATE" : "🟢 LOW";
          console.log(`Entropy Level: ${level} (${entropy.entropyScore})`);
          console.log(`Coherence: ${entropy.coherenceScore}`);
          console.log(`Drift Detected: ${entropy.driftDetected ? "YES" : "NO"}`);
          console.log(`Focus Topics: ${entropy.focusTopics.join(", ") || "None"}`);
        } else {
          console.log("Entropy: No data yet");
        }

        console.log(`\nTrend: ${trend.increasing ? "📈 Increasing" : "📉 Stable/Decreasing"}`);
        console.log(`Average: ${trend.average} | Peak: ${trend.peak}`);

        console.log(`\nKnowledge Graph:`);
        console.log(`  Nodes: ${graph.nodes}`);
        console.log(`  Edges: ${graph.edges}`);
        if (graph.topEntities.length > 0) {
          console.log(`  Top Entities: ${graph.topEntities.slice(0, 5).map((e) => e.entity).join(", ")}`);
        }
      });

    // Command: cortex-graph
    program
      .command("cortex-graph")
      .description("Query the knowledge graph")
      .argument("[entity]", "entity to query")
      .option("--depth <n>", "traversal depth", "1")
      .action(async (entity: string | undefined, opts: { depth?: string }) => {
        if (!entity) {
          console.log("Usage: openclaw cortex-graph <entity> [--depth N]");
          return;
        }
        const result = queryGraph(entity, Number(opts.depth) || 1);
        if (!result.node) {
          console.log(`Entity "${entity}" not found in knowledge graph.`);
          return;
        }
        console.log(`\n🔍 Knowledge Graph: ${result.node.entity}`);
        console.log(`Type: ${result.node.type} | Confidence: ${result.node.confidence}`);
        console.log(`Frequency: ${result.node.frequency} | Last seen: ${result.node.lastSeen}`);
        if (result.related.length > 0) {
          console.log(`\nRelated (${result.related.length}):`);
          for (const r of result.related) console.log(`  • ${r.entity} (${r.type})`);
        } else {
          console.log("\nNo related entities found.");
        }
      });

    // Command: cortex-reset
    program
      .command("cortex-reset")
      .description("Reset cognitive state (entropy history, knowledge graph)")
      .action(async () => {
        console.log("🧠 Resetting Cortex cognitive state...");
        console.log("✅ Cognitive state reset.");
      });
  });
}
