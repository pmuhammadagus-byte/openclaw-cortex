/**
 * Cortex — Cognitive Enhancement Engine
 * Shared type definitions
 */

export interface CortexConfig {
  reflectionDepth: number;
  reasoningMode: "fast" | "deep" | "adaptive";
  entropyThreshold: number;
  autoContemplate: boolean;
  knowledgeGraphEnabled: boolean;
  memoryDir: string;
}

export interface ReflectionResult {
  originalThought: string;
  critique: string;
  improvements: string[];
  confidence: number;
  revisedThought: string;
}

export interface ReasoningChain {
  premise: string;
  steps: ReasoningStep[];
  conclusion: string;
  confidence: number;
  fallacies: string[];
}

export interface ReasoningStep {
  step: number;
  statement: string;
  evidence: string[];
  validity: "valid" | "weak" | "fallacious";
}

export interface SynthesisResult {
  sources: string[];
  unifiedInsight: string;
  conflicts: ConflictResolution[];
  gaps: string[];
  confidence: number;
}

export interface ConflictResolution {
  sourceA: string;
  sourceB: string;
  conflict: string;
  resolution: string;
}

export interface ContemplationResult {
  inquiry: string;
  passes: ContemplationPass[];
  finalSynthesis: string;
  certainty: number;
  openQuestions: string[];
}

export interface ContemplationPass {
  pass: number;
  mode: "explore" | "reflect" | "synthesize";
  output: string;
  insights: string[];
}

export interface EntropySnapshot {
  timestamp: string;
  sessionId: string;
  entropyScore: number;
  driftDetected: boolean;
  coherenceScore: number;
  focusTopics: string[];
  anomalies: string[];
}

export interface KnowledgeNode {
  id: string;
  entity: string;
  type: "concept" | "person" | "place" | "event" | "tool" | "skill";
  confidence: number;
  firstSeen: string;
  lastSeen: string;
  frequency: number;
}

export interface KnowledgeEdge {
  source: string;
  target: string;
  relation: string;
  confidence: number;
  evidence: string[];
}

export interface KnowledgeGraph {
  nodes: KnowledgeNode[];
  edges: KnowledgeEdge[];
}

export interface CognitiveStatus {
  healthy: boolean;
  entropyLevel: "low" | "moderate" | "high" | "critical";
  reflectionCount: number;
  contemplationQueue: number;
  knowledgeNodes: number;
  knowledgeEdges: number;
  lastReflection: string;
  lastContemplation: string;
}

export interface GrowthVector {
  id: string;
  domain: string;
  observation: string;
  implication: string;
  createdAt: string;
  validated: boolean;
  strength: number;
}
