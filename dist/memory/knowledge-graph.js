/**
 * Knowledge Graph Engine
 * Extracts entities and relationships from conversations,
 * building a navigable graph of knowledge.
 */
// In-memory knowledge graph
let graph = { nodes: [], edges: [] };
/**
 * Extract entities and relationships from text and add to knowledge graph.
 */
export function extractAndStore(options) {
    const { text, sessionId, confidence = 0.8 } = options;
    const entities = extractEntities(text);
    const relations = extractRelations(text, entities);
    const now = new Date().toISOString();
    for (const entity of entities) {
        const existing = graph.nodes.find((n) => n.entity.toLowerCase() === entity.toLowerCase());
        if (existing) {
            existing.lastSeen = now;
            existing.frequency++;
            existing.confidence = Math.min(0.99, existing.confidence + 0.01);
        }
        else {
            graph.nodes.push({
                id: `${sessionId}-${entity.replace(/\s+/g, "-")}`,
                entity,
                type: inferEntityType(entity, text),
                confidence,
                firstSeen: now,
                lastSeen: now,
                frequency: 1,
            });
        }
    }
    for (const rel of relations) {
        const sourceNode = graph.nodes.find((n) => n.entity.toLowerCase() === rel.source.toLowerCase());
        const targetNode = graph.nodes.find((n) => n.entity.toLowerCase() === rel.target.toLowerCase());
        if (sourceNode && targetNode) {
            const existing = graph.edges.find((e) => e.source === sourceNode.id && e.target === targetNode.id && e.relation === rel.relation);
            if (existing) {
                existing.confidence = Math.min(0.99, existing.confidence + 0.02);
                if (!existing.evidence.includes(sessionId)) {
                    existing.evidence.push(sessionId);
                }
            }
            else {
                graph.edges.push({
                    source: sourceNode.id,
                    target: targetNode.id,
                    relation: rel.relation,
                    confidence,
                    evidence: [sessionId],
                });
            }
        }
    }
    return graph;
}
/**
 * Query the knowledge graph for related concepts.
 */
export function queryGraph(entity, depth = 1) {
    const node = graph.nodes.find((n) => n.entity.toLowerCase() === entity.toLowerCase()) || null;
    if (!node || depth <= 0) {
        return { node, related: [] };
    }
    const relatedIds = new Set();
    for (const edge of graph.edges) {
        if (edge.source === node.id)
            relatedIds.add(edge.target);
        if (edge.target === node.id)
            relatedIds.add(edge.source);
    }
    const related = graph.nodes.filter((n) => relatedIds.has(n.id));
    return { node, related };
}
/**
 * Get full knowledge graph statistics.
 */
export function getGraphStats() {
    const sorted = [...graph.nodes].sort((a, b) => b.frequency - a.frequency);
    return {
        nodes: graph.nodes.length,
        edges: graph.edges.length,
        topEntities: sorted.slice(0, 10),
    };
}
/**
 * Get the current knowledge graph.
 */
export function getGraph() {
    return graph;
}
function extractEntities(text) {
    const entities = [];
    // Capitalized phrases (potential proper nouns)
    const capitalized = text.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g);
    if (capitalized) {
        entities.push(...capitalized.filter((e) => e.length > 2 && !isStopWord(e)));
    }
    // Quoted terms
    const quoted = text.match(/"([^"]{3,50})"/g);
    if (quoted) {
        entities.push(...quoted.map((q) => q.replace(/"/g, "")));
    }
    // Technical terms
    const technical = text.match(/\b[A-Za-z]+(?:[-_][A-Za-z]+)+\b/g);
    if (technical) {
        entities.push(...technical);
    }
    return [...new Set(entities)];
}
function extractRelations(text, entities) {
    const relations = [];
    const relationPatterns = [
        { pattern: /\b(is|are|was|were)\b/g, relation: "is-a" },
        { pattern: /\b(uses|using|utilizes)\b/g, relation: "uses" },
        { pattern: /\b(depends on|requires|needs)\b/g, relation: "depends-on" },
        { pattern: /\b(creates|generates|produces)\b/g, relation: "creates" },
        { pattern: /\b(part of|component of|subset of)\b/g, relation: "part-of" },
    ];
    for (let i = 0; i < entities.length; i++) {
        for (let j = i + 1; j < entities.length; j++) {
            const source = entities[i];
            const target = entities[j];
            // Check if they appear close together in text
            const regex = new RegExp(`${source}.*${target}|${target}.*${source}`, "i");
            if (regex.test(text)) {
                for (const rp of relationPatterns) {
                    if (rp.pattern.test(text)) {
                        relations.push({ source, target, relation: rp.relation });
                        break;
                    }
                }
            }
        }
    }
    return relations;
}
function inferEntityType(entity, context) {
    const lower = entity.toLowerCase();
    const ctx = context.toLowerCase();
    if (/\b(skill|plugin|tool|api|framework|library)\b/.test(ctx) && ctx.indexOf(lower) > -1) {
        return "tool";
    }
    if (/\b(person|author|developer|researcher|founder)\b/.test(ctx)) {
        return "person";
    }
    if (/\b(city|country|place|location|region)\b/.test(ctx)) {
        return "place";
    }
    if (/\b(event|conference|launch|release|update)\b/.test(ctx)) {
        return "event";
    }
    if (/\b(concept|theory|principle|pattern|architecture)\b/.test(ctx)) {
        return "concept";
    }
    return "concept";
}
function isStopWord(word) {
    const stopWords = new Set([
        "the", "a", "an", "is", "are", "was", "were", "be", "been", "being",
        "have", "has", "had", "do", "does", "did", "will", "would", "could", "should",
        "i", "you", "he", "she", "it", "we", "they", "this", "that", "these", "those",
    ]);
    return stopWords.has(word.toLowerCase());
}
//# sourceMappingURL=knowledge-graph.js.map