import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Play,
  Pause,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Info,
} from 'lucide-react';
import {
  EvaluatedRule,
  DFAExecutionTrace,
  AutomataConvertResponse,
} from '../types';
import { nfaToGraph, dfaToGraph, minDfaToGraph } from '../automata';
import { AutomataGraphViewer } from '../components/AutomataGraphViewer';
import { TransitionTable } from '../components/TransitionTable';
import { ConversionTracePanel } from '../components/ConversionTracePanel';

interface AutomataLabViewProps {
  evaluatedRules: EvaluatedRule[];
  originalUrl: string;
  extractedUrl: string;
  customAutomataData: AutomataConvertResponse | null;
  onConvertCustomRegex?: (pattern: string) => void;
  isCustomLoading?: boolean;
}

export const AutomataLabView: React.FC<AutomataLabViewProps> = ({
  evaluatedRules,
  originalUrl,
  extractedUrl,
  customAutomataData,
  onConvertCustomRegex,
  isCustomLoading = false,
}) => {
  // Selected evaluated rule
  const [selectedRuleIndex, setSelectedRuleIndex] = useState<number>(0);
  // Active sub-tab: A (Regex Rule), B (NFA), C (DFA), D (Minimized DFA), E (URL Execution)
  const [activeTab, setActiveTab] = useState<'rule' | 'nfa' | 'dfa' | 'min_dfa' | 'execution'>('execution');

  // URL Execution stepper state
  const [simTarget, setSimTarget] = useState<'candidate' | 'url'>('candidate');
  const [stepIndex, setStepIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Custom regex input state
  const [customPatternInput, setCustomPatternInput] = useState<string>('(a|b)*abb');
  const [useCustomRegex, setUseCustomRegex] = useState<boolean>(false);

  const currentRule: EvaluatedRule | undefined = evaluatedRules[selectedRuleIndex];

  // Active automata data: from current structural rule OR custom studio
  const automataData: AutomataConvertResponse | undefined = useCustomRegex
    ? customAutomataData || undefined
    : currentRule?.automata;

  // Active execution trace
  const activeTrace: DFAExecutionTrace =
    simTarget === 'candidate'
      ? currentRule?.candidate_trace || { input_string: '', steps: [], final_state: 'M0', is_accepted: false, total_steps: 0 }
      : currentRule?.url_trace || { input_string: '', steps: [], final_state: 'M0', is_accepted: false, total_steps: 0 };

  const totalSteps = activeTrace.steps.length;

  // Reset playback when changing rule or target
  useEffect(() => {
    setStepIndex(0);
    setIsPlaying(false);
  }, [selectedRuleIndex, simTarget, useCustomRegex]);

  // Step player timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying) {
      timer = setInterval(() => {
        setStepIndex((prev) => {
          if (prev >= totalSteps - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 750);
    }
    return () => clearInterval(timer);
  }, [isPlaying, totalSteps]);

  // Current execution step
  const currentStep = activeTrace.steps[stepIndex] || null;

  // Build graphs
  const nfaGraph = automataData?.nfa ? nfaToGraph(automataData.nfa) : { nodes: [], edges: [] };
  const dfaGraph = automataData?.dfa ? dfaToGraph(automataData.dfa) : { nodes: [], edges: [] };
  const minDfaGraph = automataData?.minimized_dfa ? minDfaToGraph(automataData.minimized_dfa) : { nodes: [], edges: [] };

  // Calculate highlighted state and transition for URL execution
  const highlightedStateId = currentStep ? currentStep.from_state : null;
  const highlightedTransition = currentStep
    ? { fromState: currentStep.from_state, toState: currentStep.to_state }
    : null;

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onConvertCustomRegex && customPatternInput.trim()) {
      onConvertCustomRegex(customPatternInput.trim());
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* 1. Header Banner */}
      <div className="p-6 sm:p-7 rounded-2xl glass-card space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/5">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-gradient-to-br from-teal-500/20 to-cyan-500/10 text-teal-400 border border-teal-500/30 shadow-inner">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white font-sans tracking-tight">
                  Automata Lab — Models of Computation Engine
                </h2>
                <span className="text-[11px] text-teal-400 font-mono">
                  Formal Language Theory Verification
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Inspect formal automata conversions: Thompson's NFA, Subset Construction DFA, Partition Refinement Minimized DFA, and step-by-step URL tape execution.
            </p>
          </div>

          {/* Mode toggle: Evaluated Structural Rules vs Arbitrary MOC Studio */}
          <div className="flex rounded-xl bg-navy-950/80 p-1 border border-white/5 text-xs font-mono shrink-0 shadow-inner">
            <button
              type="button"
              onClick={() => setUseCustomRegex(false)}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                !useCustomRegex
                  ? 'bg-teal-500/20 text-teal-300 font-bold border border-teal-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Evaluated Email Rules ({evaluatedRules.length})
            </button>
            <button
              type="button"
              onClick={() => setUseCustomRegex(true)}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                useCustomRegex
                  ? 'bg-teal-500/20 text-teal-300 font-bold border border-teal-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Custom Regex Studio
            </button>
          </div>
        </div>

        {/* Rule Selector (when in Evaluated Rules mode) */}
        {!useCustomRegex ? (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400">
              <span className="font-semibold uppercase tracking-wider text-[11px]">Select Structural Rule:</span>
              <span className="text-[11px] text-teal-400 truncate max-w-md">
                Extracted Link: <code className="text-white ml-1">{extractedUrl || originalUrl || 'None'}</code>
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {evaluatedRules.map((rule, idx) => {
                const isSelected = idx === selectedRuleIndex;
                return (
                  <button
                    key={rule.rule_id}
                    type="button"
                    onClick={() => setSelectedRuleIndex(idx)}
                    className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'bg-teal-500/10 border-teal-500/40 ring-1 ring-teal-500/30 shadow-md shadow-teal-500/5'
                        : 'bg-navy-950/60 border-white/5 hover:border-white/10 hover:bg-navy-900/60'
                    }`}
                  >
                    <div className="text-[11px] font-bold text-white truncate" title={rule.rule_name}>
                      {rule.rule_name}
                    </div>
                    <div className="flex items-center justify-between mt-1 text-[10px] font-mono">
                      <span className={rule.matched ? 'text-rose-400 font-bold' : 'text-slate-500'}>
                        {rule.matched ? `MATCH (+${rule.weight}p)` : 'NO MATCH'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* Custom Regex Form */
          <form onSubmit={handleCustomSubmit} className="flex gap-2 font-mono text-xs">
            <input
              type="text"
              value={customPatternInput}
              onChange={(e) => setCustomPatternInput(e.target.value)}
              placeholder="e.g. (a|b)*abb or (http|https)"
              className="flex-1 px-3.5 py-2 rounded-lg bg-navy-950/80 border border-white/10 text-white focus:outline-none focus:border-teal-500 transition-colors"
            />
            <button
              type="submit"
              disabled={isCustomLoading}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-teal-500 to-teal-400 hover:from-teal-400 hover:to-teal-300 text-navy-950 font-bold transition-all disabled:opacity-50"
            >
              {isCustomLoading ? 'Compiling...' : 'Compile Automata'}
            </button>
          </form>
        )}
      </div>

      {/* 2. Subsections Navigation Tabs (A. Regex Rule, B. NFA, C. DFA, D. Minimized DFA, E. URL Execution) */}
      <div className="flex rounded-xl glass-card p-1 overflow-x-auto text-xs font-mono gap-1">
        <button
          type="button"
          onClick={() => setActiveTab('rule')}
          className={`flex-1 min-w-[120px] py-2 px-3 rounded-lg transition-all text-center ${
            activeTab === 'rule'
              ? 'bg-teal-500/20 text-teal-300 font-bold border border-teal-500/30 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          A. Regex Rule
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('nfa')}
          className={`flex-1 min-w-[120px] py-2 px-3 rounded-lg transition-all text-center ${
            activeTab === 'nfa'
              ? 'bg-teal-500/20 text-teal-300 font-bold border border-teal-500/30 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          B. Thompson NFA
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('dfa')}
          className={`flex-1 min-w-[120px] py-2 px-3 rounded-lg transition-all text-center ${
            activeTab === 'dfa'
              ? 'bg-teal-500/20 text-teal-300 font-bold border border-teal-500/30 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          C. Subset DFA
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('min_dfa')}
          className={`flex-1 min-w-[130px] py-2 px-3 rounded-lg transition-all text-center ${
            activeTab === 'min_dfa'
              ? 'bg-teal-500/20 text-teal-300 font-bold border border-teal-500/30 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          D. Minimized DFA
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('execution')}
          className={`flex-1 min-w-[145px] py-2 px-3 rounded-lg transition-all text-center flex items-center justify-center gap-1.5 ${
            activeTab === 'execution'
              ? 'bg-teal-500/20 text-teal-300 font-bold border border-teal-500/30 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Play className="w-3.5 h-3.5" />
          <span>E. URL Execution</span>
        </button>
      </div>

      {/* 3. Tab Contents */}

      {/* TAB A: REGEX RULE */}
      {activeTab === 'rule' && currentRule && (
        <div className="p-6 sm:p-7 rounded-2xl glass-card space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/5">
            <div>
              <h3 className="text-base font-bold text-white font-sans">{currentRule.rule_name}</h3>
              <span className="text-xs font-mono text-slate-500">Rule ID: {currentRule.rule_id}</span>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-mono font-semibold border ${
                currentRule.matched
                  ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                  : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              }`}
            >
              {currentRule.matched ? `Pattern Matched (+${currentRule.weight} pts)` : 'Pattern Not Matched (0 pts)'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
            <div className="p-4 rounded-xl bg-navy-950/80 border border-white/5 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Actual Regular Expression</span>
              <code className="text-teal-300 font-bold text-sm break-all block">{currentRule.regex_pattern}</code>
            </div>

            <div className="p-4 rounded-xl bg-navy-950/80 border border-white/5 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Target Component Examined</span>
              <span className="text-slate-200 font-bold text-sm block">
                {currentRule.candidate_input ? `"${currentRule.candidate_input}"` : 'None Extracted'}
              </span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-navy-950/80 border border-white/5 space-y-1 text-xs">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">Extracted URL Being Tested</span>
            <code className="text-cyan-300 font-mono break-all block">{extractedUrl || originalUrl || 'N/A'}</code>
          </div>

          <div className="p-4 rounded-xl bg-navy-950/80 border border-white/5 text-xs space-y-1.5">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">Rule Description &amp; Purpose</span>
            <p className="text-slate-300 font-sans leading-relaxed">{currentRule.description}</p>
          </div>
        </div>
      )}

      {/* TAB B: NFA (Thompson's Construction) */}
      {activeTab === 'nfa' && automataData?.nfa && (
        <div className="space-y-4">
          {/* Metadata Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
            <div className="p-3.5 rounded-xl glass-card">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block">NFA States</span>
              <span className="text-xl font-bold text-white">{automataData.nfa.state_count}</span>
            </div>
            <div className="p-3.5 rounded-xl glass-card">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block">NFA Transitions</span>
              <span className="text-xl font-bold text-cyan-400">{automataData.nfa.transition_count}</span>
            </div>
            <div className="p-3.5 rounded-xl glass-card">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Start State</span>
              <span className="text-xl font-bold text-teal-400">{automataData.nfa.start_state}</span>
            </div>
            <div className="p-3.5 rounded-xl glass-card">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Accepting States</span>
              <span className="text-xl font-bold text-emerald-400">
                {automataData.nfa.accepting_states.join(', ') || 'None'}
              </span>
            </div>
          </div>

          {/* Interactive Graph Diagram */}
          <AutomataGraphViewer
            graph={nfaGraph}
            title={`${currentRule?.rule_name || 'NFA'} — Thompson NFA`}
            stageName="Stage 1: Non-Deterministic Finite Automaton (NFA)"
          />

          {/* Transition Table */}
          <TransitionTable
            transitions={automataData.nfa.transitions}
            title={`${currentRule?.rule_name || 'NFA'} — Transition Table (with ε)`}
            isNFA={true}
          />
        </div>
      )}

      {/* TAB C: DFA (Subset Construction) */}
      {activeTab === 'dfa' && automataData?.dfa && (
        <div className="space-y-4">
          {/* Metadata Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
            <div className="p-3.5 rounded-xl glass-card">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block">DFA States</span>
              <span className="text-xl font-bold text-white">{automataData.dfa.state_count}</span>
            </div>
            <div className="p-3.5 rounded-xl glass-card">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Transitions</span>
              <span className="text-xl font-bold text-cyan-400">{automataData.dfa.transition_count}</span>
            </div>
            <div className="p-3.5 rounded-xl glass-card">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Start State</span>
              <span className="text-xl font-bold text-teal-400">{automataData.dfa.start_state}</span>
            </div>
            <div className="p-3.5 rounded-xl glass-card">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Accepting States</span>
              <span className="text-xl font-bold text-emerald-400">
                {automataData.dfa.accepting_states.join(', ') || 'None'}
              </span>
            </div>
          </div>

          {/* Subset Mapping Table */}
          <div className="p-4 rounded-xl glass-card space-y-2">
            <span className="text-xs font-mono text-slate-300 font-semibold uppercase tracking-wider block">
              DFA State $\to$ NFA Subsets:
            </span>
            <div className="flex flex-wrap gap-2 font-mono text-xs">
              {automataData.dfa.states.map((st) => (
                <div
                  key={st.id}
                  className="px-2.5 py-1 rounded-lg bg-navy-950/80 border border-white/5 text-slate-200"
                >
                  <span className="text-teal-400 font-bold">{st.id}</span> = &#123;
                  {st.nfa_states.map((s) => `S${s}`).join(', ')}&#125;
                  {st.is_accepting && <span className="text-emerald-400 ml-1">★</span>}
                </div>
              ))}
            </div>
          </div>

          {/* Interactive Graph Diagram */}
          <AutomataGraphViewer
            graph={dfaGraph}
            title={`${currentRule?.rule_name || 'DFA'} — Subset Construction DFA`}
            stageName="Stage 2: Deterministic Finite Automaton (DFA)"
          />

          {/* Subset Construction Trace */}
          <ConversionTracePanel
            subsetTrace={automataData.dfa.trace || []}
            minimizationSteps={automataData.minimized_dfa?.refinement_steps || []}
            initialPartitions={automataData.minimized_dfa?.initial_partitions || []}
          />
        </div>
      )}

      {/* TAB D: MINIMIZED DFA (Partition Refinement) */}
      {activeTab === 'min_dfa' && automataData?.minimized_dfa && (
        <div className="space-y-4">
          {/* State Reduction Comparison Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
            <div className="p-3.5 rounded-xl glass-card">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Original DFA States</span>
              <span className="text-xl font-bold text-slate-400">
                {automataData.minimized_dfa.comparison.states_before}
              </span>
            </div>
            <div className="p-3.5 rounded-xl glass-card">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Minimized DFA States</span>
              <span className="text-xl font-bold text-teal-400">
                {automataData.minimized_dfa.comparison.states_after}
              </span>
            </div>
            <div className="p-3.5 rounded-xl glass-card">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block">States Reduced</span>
              <span className="text-xl font-bold text-emerald-400">
                -{automataData.minimized_dfa.comparison.reduction_count} ({automataData.minimized_dfa.comparison.reduction_percentage}%)
              </span>
            </div>
            <div className="p-3.5 rounded-xl glass-card">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Canonical Start / Accept</span>
              <span className="text-xs font-bold text-white block mt-1">
                {automataData.minimized_dfa.start_state} / &#123;{automataData.minimized_dfa.accepting_states.join(', ')}&#125;
              </span>
            </div>
          </div>

          {/* Interactive Graph Diagram */}
          <AutomataGraphViewer
            graph={minDfaGraph}
            title={`${currentRule?.rule_name || 'MinDFA'} — Minimized DFA (Canonical Form)`}
            stageName="Stage 3: Minimized DFA (Partition Refinement)"
          />

          {/* Transition Table */}
          <TransitionTable
            transitions={automataData.minimized_dfa.transitions}
            title={`${currentRule?.rule_name || 'MinDFA'} — Canonical Transition Table`}
          />
        </div>
      )}

      {/* TAB E: URL EXECUTION (STEP BY STEP + REAL-TIME GRAPH HIGHLIGHTING) */}
      {activeTab === 'execution' && (
        <div className="space-y-5">
          {/* Target Selector Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl glass-card font-mono text-xs">
            <div className="flex items-center gap-2.5">
              <span className="text-slate-400">Simulation String:</span>
              <div className="flex rounded-lg bg-navy-950/80 p-1 border border-white/5">
                <button
                  type="button"
                  onClick={() => setSimTarget('candidate')}
                  className={`px-3 py-1 rounded transition-all ${
                    simTarget === 'candidate'
                      ? 'bg-teal-500/20 text-teal-300 font-bold border border-teal-500/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Candidate Token ({currentRule?.candidate_input ? `"${currentRule.candidate_input}"` : 'None'})
                </button>
                <button
                  type="button"
                  onClick={() => setSimTarget('url')}
                  className={`px-3 py-1 rounded transition-all ${
                    simTarget === 'url'
                      ? 'bg-teal-500/20 text-teal-300 font-bold border border-teal-500/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Full Extracted URL
                </button>
              </div>
            </div>

            <div className="text-slate-500 text-[11px]">
              String Length: {activeTrace.input_string.length} characters
            </div>
          </div>

          {/* LIVE GRAPH WITH STEP HIGHLIGHTING */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400 px-1">
              <span className="font-semibold uppercase flex items-center gap-1.5 tracking-wider text-[11px]">
                <Cpu className="w-3.5 h-3.5 text-teal-400" />
                <span>Automaton State Diagram with Active Transition Highlighting:</span>
              </span>
              <span className="text-amber-400">
                {currentStep
                  ? `Active: ${currentStep.from_state} --('${currentStep.symbol}')--> ${currentStep.to_state}`
                  : `State: ${activeTrace.final_state}`}
              </span>
            </div>

            <AutomataGraphViewer
              graph={minDfaGraph}
              title={`${currentRule?.rule_name || 'DFA'} — Execution State Animation`}
              stageName="Live DFA Execution Simulation"
              highlightStateId={highlightedStateId}
              highlightTransition={highlightedTransition}
            />
          </div>

          {/* STEPPER CONTROLS & TAPE */}
          <div className="p-5 sm:p-6 rounded-2xl glass-card space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/5">
              <div className="flex items-center gap-3 font-mono text-xs">
                <span className="text-slate-400 uppercase tracking-wider text-[11px]">Input Position:</span>
                <span className="text-teal-400 font-bold">
                  {totalSteps > 0 ? stepIndex + 1 : 0} of {totalSteps}
                </span>
              </div>

              {/* Controls: Start, Prev, Play/Pause, Next, Reset */}
              <div className="flex items-center gap-2 font-mono text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setStepIndex(0);
                    setIsPlaying(false);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-navy-950/80 border border-white/10 text-slate-300 hover:text-white hover:bg-navy-900 transition-all active:scale-95"
                >
                  Start
                </button>

                <button
                  type="button"
                  disabled={stepIndex <= 0}
                  onClick={() => setStepIndex((prev) => Math.max(0, prev - 1))}
                  className="p-1.5 rounded-lg bg-navy-950/80 border border-white/10 text-slate-300 hover:text-white hover:bg-navy-900 disabled:opacity-40 transition-all active:scale-95"
                  title="Previous Step"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  disabled={totalSteps === 0}
                  onClick={() => setIsPlaying(!isPlaying)}
                  className={`px-4 py-1.5 rounded-lg border font-semibold flex items-center gap-1.5 transition-all active:scale-95 ${
                    isPlaying
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm shadow-amber-500/10'
                      : 'bg-teal-500/20 text-teal-300 border-teal-500/40 hover:bg-teal-500/30 shadow-sm shadow-teal-500/10'
                  }`}
                >
                  {isPlaying ? (
                    <>
                      <Pause className="w-3.5 h-3.5" />
                      <span>Pause</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5" />
                      <span>Play</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  disabled={stepIndex >= totalSteps - 1}
                  onClick={() => setStepIndex((prev) => Math.min(totalSteps - 1, prev + 1))}
                  className="p-1.5 rounded-lg bg-navy-950/80 border border-white/10 text-slate-300 hover:text-white hover:bg-navy-900 disabled:opacity-40 transition-all active:scale-95"
                  title="Next Step"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStepIndex(0);
                    setIsPlaying(false);
                  }}
                  className="p-1.5 rounded-lg bg-navy-950/80 border border-white/10 text-slate-400 hover:text-white hover:bg-navy-900 transition-all active:scale-95"
                  title="Reset"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Input Character Tape */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-mono text-slate-400">Input Tape:</span>
              <div className="p-3 rounded-xl bg-navy-950/80 border border-white/5 overflow-x-auto">
                {activeTrace.input_string.length === 0 ? (
                  <span className="text-xs text-slate-500 font-mono italic">Empty input string</span>
                ) : (
                  <div className="flex items-center gap-1.5 font-mono text-xs">
                    {activeTrace.input_string.split('').map((char, idx) => {
                      const isCurrent = idx === stepIndex;
                      const isPast = idx < stepIndex;
                      return (
                        <div
                          key={idx}
                          className={`flex flex-col items-center justify-center min-w-[28px] h-11 rounded-lg border transition-all ${
                            isCurrent
                              ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold scale-105 shadow-md shadow-amber-500/20 ring-1 ring-amber-400/40'
                              : isPast
                              ? 'bg-navy-900/60 border-white/5 text-slate-400'
                              : 'bg-navy-950/40 border-white/[0.03] text-slate-600'
                          }`}
                        >
                          <span className="text-xs">{char}</span>
                          <span className="text-[9px] text-slate-500">{idx}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Step Explanation Card */}
            {currentStep && (
              <div className="p-4 rounded-xl bg-navy-950/80 border border-white/5 space-y-2 font-mono text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">
                    Pos {currentStep.position}: Input symbol <strong className="text-teal-300 font-bold">'{currentStep.char}'</strong>
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      currentStep.is_dead
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    {currentStep.is_dead ? 'TRAP / DEAD STATE' : 'DETERMINISTIC TRANSITION'}
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-navy-900/80 text-slate-200 font-sans leading-relaxed border border-white/5">
                  {currentStep.explanation}
                </div>
              </div>
            )}

            {/* Acceptance Outcome Card */}
            <div className="p-4 rounded-xl bg-navy-950/80 border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase tracking-wider">
                  DFA Acceptance Outcome:
                </span>
                <span className="text-white font-bold">
                  Final State: {activeTrace.final_state} (
                  {activeTrace.is_accepted ? 'State ∈ Accepting Set F' : 'State ∉ Accepting Set F'}
                  )
                </span>
              </div>

              <div>
                {activeTrace.is_accepted ? (
                  <div className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold flex items-center gap-1.5 shadow-sm shadow-emerald-500/10">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>ACCEPTED BY AUTOMATON</span>
                  </div>
                ) : (
                  <div className="px-3 py-1.5 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold flex items-center gap-1.5 shadow-sm shadow-rose-500/10">
                    <XCircle className="w-4 h-4" />
                    <span>REJECTED BY AUTOMATON</span>
                  </div>
                )}
              </div>
            </div>

            {/* MOC Academic Disclaimer */}
            <div className="p-3.5 rounded-xl bg-navy-950/60 border border-white/5 text-[11px] text-slate-400 flex items-start gap-2.5 font-sans">
              <Info className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
              <p>
                <strong>Academic MOC Notice:</strong> An accepting state means the selected pattern matched the evaluated input string according to formal regular language theory. A single matched pattern contributes to the structural score, but does not by itself prove the email is phishing.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

