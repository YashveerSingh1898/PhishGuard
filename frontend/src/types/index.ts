/**
 * Core type definitions for PhishGuard.
 * These interfaces define the contracts between frontend and backend.
 */

export type Verdict = 'Legitimate' | 'Suspicious' | 'Phishing';

export interface AutomataNode {
  id: string;
  label: string;
  isStart?: boolean;
  isAccepting?: boolean;
}

export interface AutomataEdge {
  id: string;
  source: string;
  target: string;
  label: string;
}

export interface AutomataGraph {
  nodes: AutomataNode[];
  edges: AutomataEdge[];
}

export interface DetectionResult {
  url: string;
  structuralScore: number;
  nlpScore: number;
  finalScore: number;
  verdict: Verdict;
  matchedRules: string[];
  automataGraph?: AutomataGraph;
  executionTimeMs: number;
}
