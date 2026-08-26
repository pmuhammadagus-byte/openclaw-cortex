/**
 * Cortex Lifecycle Hooks — adapted to OpenClaw 2026.7.1 (InternalHookEvent API)
 *
 * In 2026.7.1, hook handlers receive a unified `InternalHookEvent` and must
 * return void. Response-mutating hooks (before_agent_finalize revise,
 * before_prompt_build prepend) are no longer supported by the public API, so
 * Cortex runs its cognition as *observational monitoring*: it logs entropy
 * drift, tracks sessions, and records knowledge — surfaced through the
 * `cortex_*` tools and CLI. This keeps the plugin safe, public-API compliant,
 * and breakage-free.
 */
import { checkEntropy, getEntropyTrend } from "../memory/entropy.js";
import { extractAndStore } from "../memory/knowledge-graph.js";
// Session state tracking
const sessionMessages = new Map();
export function registerLifecycleHooks(api, config) {
    // ═══════════════════════════════════════════════════════════════
    // HOOK: agent lifecycle — track entropy + learn
    // ═══════════════════════════════════════════════════════════════
    api.registerHook(["agent_end"], async (event) => {
        const sessionKey = event.sessionKey || "default";
        const ctx = event.context || {};
        const prompt = String(ctx.prompt || ctx.query || "");
        const response = String(ctx.response || "");
        const text = `${prompt} ${response}`.trim();
        if (!text)
            return;
        if (!sessionMessages.has(sessionKey))
            sessionMessages.set(sessionKey, []);
        const messages = sessionMessages.get(sessionKey);
        messages.push(text);
        if (messages.length > 10)
            messages.splice(0, messages.length - 10);
        const entropy = checkEntropy({
            sessionId: sessionKey,
            recentMessages: messages,
            entropyThreshold: config.entropyThreshold,
        });
        if (entropy.driftDetected) {
            api.logger.warn(`[Cortex] Drift detected in ${sessionKey}. Entropy: ${entropy.entropyScore}`);
        }
        if (config.knowledgeGraphEnabled && text.length > 0) {
            extractAndStore({ text, sessionId: sessionKey });
        }
    }, { name: "cortex-agent-end", description: "Track entropy and learn from agent responses" });
    // ═══════════════════════════════════════════════════════════════
    // HOOK: gateway ready — announce
    // ═══════════════════════════════════════════════════════════════
    api.registerHook(["gateway:ready"], async () => {
        api.logger.info("[Cortex] 🧠 Cognitive engine online (monitoring mode).");
    }, { name: "cortex-gateway-ready", description: "Announce cortex online" });
    // ═══════════════════════════════════════════════════════════════
    // HOOK: heartbeat — surface drift as an informational message
    // ═══════════════════════════════════════════════════════════════
    api.registerHook(["heartbeat"], async (event) => {
        const trend = getEntropyTrend();
        if (trend.increasing && trend.average > config.entropyThreshold * 0.8) {
            event.messages.push();
        }
    }, { name: "cortex-heartbeat", description: "Surface cognitive drift on heartbeat" });
}
//# sourceMappingURL=lifecycle.js.map