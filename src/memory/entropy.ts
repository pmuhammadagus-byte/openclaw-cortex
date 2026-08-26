/**
 * Entropy Monitor
 * Tracks cognitive coherence, detects drift, and measures
 * information density across sessions.
 */

import type { EntropySnapshot } from "../utils/types.js";

// In-memory store for entropy history
const entropyHistory: EntropySnapshot[] = [];
const MAX_HISTORY = 100;

export interface EntropyCheckOptions {
  sessionId: string;
  recentMessages: string[];
  entropyThreshold: number;
}

/**
 * Calculate entropy score based on message coherence and topic drift.
 */
export function checkEntropy(options: EntropyCheckOptions): EntropySnapshot {
  const { sessionId, recentMessages, entropyThreshold } = options;

  const coherenceScore = calculateCoherence(recentMessages);
  const topicDrift = calculateTopicDrift(recentMessages);
  const anomalyCount = detectAnomalies(recentMessages);

  // Entropy = inverse of coherence + topic drift penalty
  const entropyScore = Math.min(1.0, (1 - coherenceScore) * 0.6 + topicDrift * 0.4);
  const driftDetected = entropyScore > entropyThreshold;

  const focusTopics = extractTopics(recentMessages);
  const anomalies = anomalyCount > 0 ? [`${anomalyCount} anomalies detected`] : [];

  const snapshot: EntropySnapshot = {
    timestamp: new Date().toISOString(),
    sessionId,
    entropyScore: Math.round(entropyScore * 100) / 100,
    driftDetected,
    coherenceScore: Math.round(coherenceScore * 100) / 100,
    focusTopics,
    anomalies,
  };

  // Store in history
  entropyHistory.push(snapshot);
  if (entropyHistory.length > MAX_HISTORY) {
    entropyHistory.shift();
  }

  return snapshot;
}

/**
 * Get entropy trend over time.
 */
export function getEntropyTrend(sessionId?: string): { increasing: boolean; average: number; peak: number } {
  const relevant = sessionId
    ? entropyHistory.filter((e) => e.sessionId === sessionId)
    : entropyHistory;

  if (relevant.length === 0) {
    return { increasing: false, average: 0, peak: 0 };
  }

  const scores = relevant.map((e) => e.entropyScore);
  const average = scores.reduce((a, b) => a + b, 0) / scores.length;
  const peak = Math.max(...scores);

  // Check if trend is increasing (last 3 vs first 3)
  const first3 = scores.slice(0, 3).reduce((a, b) => a + b, 0) / Math.min(3, scores.length);
  const last3 = scores.slice(-3).reduce((a, b) => a + b, 0) / Math.min(3, scores.length);

  return {
    increasing: last3 > first3 + 0.1,
    average: Math.round(average * 100) / 100,
    peak: Math.round(peak * 100) / 100,
  };
}

/**
 * Get latest entropy snapshot.
 */
export function getLatestEntropy(): EntropySnapshot | null {
  return entropyHistory.length > 0 ? entropyHistory[entropyHistory.length - 1] : null;
}

function calculateCoherence(messages: string[]): number {
  if (messages.length < 2) return 1.0;

  // Simple coherence: shared vocabulary between consecutive messages
  let totalCoherence = 0;
  for (let i = 1; i < messages.length; i++) {
    const prev = new Set(messages[i - 1].toLowerCase().split(/\s+/).filter((w) => w.length > 3));
    const curr = new Set(messages[i].toLowerCase().split(/\s+/).filter((w) => w.length > 3));

    if (prev.size === 0) continue;

    const intersection = new Set([...prev].filter((x) => curr.has(x)));
    totalCoherence += intersection.size / prev.size;
  }

  return totalCoherence / (messages.length - 1);
}

function calculateTopicDrift(messages: string[]): number {
  if (messages.length < 3) return 0;

  // Detect sudden topic changes
  const topicWords = ["about", "regarding", "concerning", "topic", "subject", "discussing"];
  let driftCount = 0;

  for (let i = 2; i < messages.length; i++) {
    const hasTopicShift = topicWords.some((w) =>
      messages[i].toLowerCase().includes(w) && !messages[i - 1].toLowerCase().includes(w)
    );
    if (hasTopicShift) driftCount++;
  }

  return Math.min(1.0, driftCount / messages.length);
}

function detectAnomalies(messages: string[]): number {
  let count = 0;

  for (const msg of messages) {
    // Detect repetitive patterns (possible loops)
    const words = msg.toLowerCase().split(/\s+/);
    const uniqueWords = new Set(words);
    if (uniqueWords.size / words.length < 0.3) {
      count++;
    }

    // Detect excessive length (possible rambling)
    if (msg.length > 2000) {
      count++;
    }
  }

  return count;
}

function extractTopics(messages: string[]): string[] {
  const allText = messages.join(" ").toLowerCase();
  const topicIndicators = [
    /\b(code|programming|software|development|bug|api)\b/g,
    /\b(data|analysis|statistics|machine learning|ai)\b/g,
    /\b(business|strategy|market|finance|investment)\b/g,
    /\b(science|research|physics|biology|chemistry)\b/g,
    /\b(health|medical|fitness|nutrition|wellness)\b/g,
  ];

  const topics: string[] = [];
  const topicNames = ["technology", "data-science", "business", "science", "health"];

  for (let i = 0; i < topicIndicators.length; i++) {
    const matches = allText.match(topicIndicators[i]);
    if (matches && matches.length >= 2) {
      topics.push(topicNames[i]);
    }
  }

  return topics.length > 0 ? topics : ["general"];
}
