/**
 * Core type definitions for PhishGuard.
 * These interfaces define the contracts between frontend and backend.
 */

export type Verdict = 'Legitimate' | 'Suspicious' | 'Phishing';

// --- Graph Visualizer Types ---

export interface AutomataNode {
  id: string;
  label: string;
  sublabel?: string;
  isStart?: boolean;
  isAccepting?: boolean;
  x?: number;
  y?: number;
}

export interface AutomataEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  isEpsilon?: boolean;
}

export interface AutomataGraph {
  nodes: AutomataNode[];
  edges: AutomataEdge[];
}

// --- Backend API Response Types for Automata Engine ---

export interface NFATransition {
  from_state: string;
  from_state_id: number;
  symbol: string;
  to_state: string;
  to_state_id: number;
  is_epsilon: boolean;
}

export interface NFAData {
  states: string[];
  state_ids: number[];
  start_state: string;
  start_state_id: number;
  accepting_states: string[];
  accepting_state_ids: number[];
  alphabet: string[];
  transitions: NFATransition[];
  transition_count: number;
  state_count: number;
}

export interface DFAState {
  id: string;
  nfa_states: number[];
  nfa_state_labels: string[];
  is_start: boolean;
  is_accepting: boolean;
}

export interface DFATransition {
  from_state: string;
  symbol: string;
  to_state: string;
}

export interface SubsetTraceStep {
  source: string;
  source_subset: number[];
  symbol: string;
  target: string;
  target_subset: number[];
  explanation: string;
}

export interface DFAData {
  states: DFAState[];
  state_count: number;
  start_state: string;
  accepting_states: string[];
  alphabet: string[];
  transitions: DFATransition[];
  transition_count: number;
  trace: SubsetTraceStep[];
}

export interface MinimizedState {
  id: string;
  original_dfa_states: string[];
  is_start: boolean;
  is_accepting: boolean;
}

export interface MinimizationStep {
  step: number;
  partition_count: number;
  partitions: string[][];
  description: string;
}

export interface InitialPartition {
  partition_index: number;
  group_type: string;
  states: string[];
}

export interface MinimizationComparison {
  states_before: number;
  states_after: number;
  reduction_count: number;
  reduction_percentage: number;
  is_reduced: boolean;
}

export interface MinimizedDFAData {
  states: MinimizedState[];
  state_count: number;
  start_state: string;
  accepting_states: string[];
  alphabet: string[];
  transitions: DFATransition[];
  transition_count: number;
  initial_partitions: InitialPartition[];
  refinement_steps: MinimizationStep[];
  comparison: MinimizationComparison;
}

export interface AutomataConvertResponse {
  success: boolean;
  regex: string;
  alphabet: string[];
  nfa: NFAData;
  dfa: DFAData;
  minimized_dfa: MinimizedDFAData;
}

export interface ApiErrorDetail {
  success?: boolean;
  error?: string;
  message?: string;
  position?: number;
}

// --- Dual-Layer Threat Detection Types ---

export interface DFAExecutionStep {
  position: number;
  char: string;
  from_state: string;
  symbol: string;
  to_state: string;
  is_dead: boolean;
  explanation: string;
}

export interface DFAExecutionTrace {
  input_string: string;
  steps: DFAExecutionStep[];
  final_state: string;
  is_accepted: boolean;
  total_steps: number;
}

export interface EvaluatedRule {
  rule_id: string;
  rule_name: string;
  regex_pattern: string;
  description: string;
  target_field: string;
  weight: number;
  candidate_input: string;
  matched: boolean;
  score_contribution: number;
  automata: AutomataConvertResponse;
  candidate_trace: DFAExecutionTrace;
  url_trace: DFAExecutionTrace;
  explanation: string;
}

export interface MatchedIndicator {
  pattern_name: string;
  field_examined: string;
  matched_indicator: string;
  explanation: string;
  weight: number;
  regex_pattern?: string | null;
}

export interface DetectionRequest {
  sender?: string;
  url?: string;
  subject?: string;
  body?: string;
}

export interface DetectionResponse {
  success: boolean;
  input_summary: {
    sender: string;
    url: string;
    extracted_url?: string;
    subject: string;
    body_preview: string;
  };
  structural_score: number;
  matched_indicators: MatchedIndicator[];
  evaluated_rules?: EvaluatedRule[];
  nlp_score: number;
  nlp_preprocessed_text?: string;
  nlp_tokens?: string[];
  predicted_class: string;
  class_probabilities: Record<string, number>;
  structural_weight: number;
  nlp_weight: number;
  structural_contribution: number;
  nlp_contribution: number;
  final_score: number;
  verdict: Verdict;
  reasons: string[];
  limitations_note: string;
  execution_time_ms: number;
}
