import React, { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Cpu,
  Layers,
  CheckCircle2,
  XCircle,
  AlertOctagon,
  Code2,
  Table,
  ExternalLink,
} from 'lucide-react';
import {
  EvaluatedRule,
  DFAExecutionTrace,
} from '../types';
import { nfaToGraph, dfaToGraph, minDfaToGraph } from '../automata';
import { AutomataGraphViewer } from './AutomataGraphViewer';
import { TransitionTable } from './TransitionTable';
import { ConversionTracePanel } from './ConversionTracePanel';

interface AutomataExecutionViewerProps {
  evaluatedRules: EvaluatedRule[];
  originalUrl: string;
  extractedUrl: string;
  onInspectInStudio?: (pattern: string) => void;
}

export const AutomataExecutionViewer: React.FC<AutomataExecutionViewerProps> = ({
  evaluatedRules,
  originalUrl,
  extractedUrl,
  onInspectInStudio,
}) => {
  const [selectedRuleIndex, setSelectedRuleIndex] = useState<number>(0);
  const [simulationTarget, setSimulationTarget] = useState<'candidate' | 'url'>('candidate');
  const [stepIndex, setStepIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [viewTab, setViewTab] = useState<'execution' | 'minimized_dfa' | 'dfa' | 'nfa' | 'conversion_trace' | 'transitions'>('execution');

  const currentRule = evaluatedRules[selectedRuleIndex] || evaluatedRules[0];

  // Pick the active trace depending on candidate token or full URL simulation
  const activeTrace: DFAExecutionTrace =
    simulationTarget === 'candidate'
      ? currentRule?.candidate_trace || { input_string: '', steps: [], final_state: 'M0', is_accepted: false, total_steps: 0 }
      : currentRule?.url_trace || { input_string: '', steps: [], final_state: 'M0', is_accepted: false, total_steps: 0 };

  const totalSteps = activeTrace.steps.length;

  // Reset step index when rule or target changes
  useEffect(() => {
    setStepIndex(0);
    setIsPlaying(false);
  }, [selectedRuleIndex, simulationTarget]);

  // Auto-player loop
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
      }, 700);
    }
    return () => clearInterval(timer);
  }, [isPlaying, totalSteps]);

  if (!evaluatedRules || evaluatedRules.length === 0) {
    return null;
  }

  const currentStep = activeTrace.steps[stepIndex] || null;

  // Build graphs from the rule's compiled automata
  const automataData = currentRule?.automata;
  const nfaGraph = automataData?.nfa ? nfaToGraph(automataData.nfa) : { nodes: [], edges: [] };
  const dfaGraph = automataData?.dfa ? dfaToGraph(automataData.dfa) : { nodes: [], edges: [] };
  const minDfaGraph = automataData?.minimized_dfa ? minDfaToGraph(automataData.minimized_dfa) : { nodes: [], edges: [] };

  return (
    <div className="rounded-xl border border-navy-800 bg-navy-900/60 p-6 shadow-xl space-y-6">
      {/* 1. Header & Evaluated URL Context Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-navy-800">
        <div>
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-teal-400" />
            <h3 className="text-lg font-bold text-white tracking-tight">
              Real-Time Automata Execution & Structural Rule Verification
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Formal Model of Computation (MOC) execution: inspect each structural detection rule's
            compiled NFA, DFA, Minimized DFA, and step-by-step input string consumption.
          </p>
        </div>

        {/* URL Context badge */}
        <div className="p-2.5 rounded-lg bg-navy-950 border border-navy-800 text-xs font-mono max-w-md">
          <div className="text-[10px] text-slate-500 uppercase">Evaluated Link Artifact:</div>
          <div className="text-teal-300 font-semibold truncate" title={extractedUrl || originalUrl || 'N/A'}>
            {extractedUrl || originalUrl || 'No URL Provided'}
          </div>
          {originalUrl && extractedUrl && originalUrl !== extractedUrl && (
            <div className="text-[10px] text-slate-500 truncate mt-0.5">
              Original: {originalUrl}
            </div>
          )}
        </div>
      </div>

      {/* 2. Structural Rule Selector Tabs */}
      <div className="space-y-2">
        <div className="text-xs font-mono text-slate-400 uppercase font-semibold">
          Evaluated Structural Detection Rules ({evaluatedRules.length}):
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {evaluatedRules.map((rule, idx) => {
            const isSelected = idx === selectedRuleIndex;
            return (
              <button
                key={rule.rule_id}
                type="button"
                onClick={() => setSelectedRuleIndex(idx)}
                className={`p-3 rounded-lg border text-left transition-all flex flex-col justify-between gap-2 ${
                  isSelected
                    ? 'bg-navy-800 border-teal-500 shadow-md ring-1 ring-teal-500/30'
                    : 'bg-navy-950/70 border-navy-800 hover:border-navy-700 hover:bg-navy-900/50'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="text-xs font-semibold text-white truncate" title={rule.rule_name}>
                    {rule.rule_name}
                  </div>
                  {rule.matched ? (
                    <span className="shrink-0 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
                      MATCH (+{rule.weight}p)
                    </span>
                  ) : (
                    <span className="shrink-0 px-2 py-0.5 rounded text-[10px] font-mono text-slate-400 bg-navy-900 border border-navy-800">
                      NO MATCH
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-slate-400 truncate text-[10px]">
                    <code className="text-teal-400">{rule.regex_pattern}</code>
                  </span>
                  <span className="text-[10px] text-slate-500">{rule.target_field}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Selected Rule Inspection Card */}
      <div className="p-4 rounded-xl bg-navy-950 border border-navy-800 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-navy-850">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white">{currentRule.rule_name}</span>
              <span className="text-xs font-mono text-slate-500">[{currentRule.rule_id}]</span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">{currentRule.description}</p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onInspectInStudio && (
              <button
                type="button"
                onClick={() => onInspectInStudio(currentRule.regex_pattern)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-teal-300 bg-teal-500/10 border border-teal-500/30 hover:bg-teal-500/20 transition-all"
              >
                <span>Open in Automata Studio</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Rule metadata bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
          <div className="p-2.5 rounded bg-navy-900 border border-navy-800">
            <span className="text-[10px] text-slate-500 uppercase block">Formal Regex:</span>
            <code className="text-teal-400 font-bold break-all">{currentRule.regex_pattern}</code>
          </div>
          <div className="p-2.5 rounded bg-navy-900 border border-navy-800">
            <span className="text-[10px] text-slate-500 uppercase block">Extracted Target Token:</span>
            <span className="text-white font-bold">{currentRule.candidate_input || 'None extracted'}</span>
          </div>
          <div className="p-2.5 rounded bg-navy-900 border border-navy-800">
            <span className="text-[10px] text-slate-500 uppercase block">Rule Acceptance:</span>
            <span className={currentRule.matched ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
              {currentRule.matched ? `Triggered (+${currentRule.weight} pts)` : 'Not Triggered (0 pts)'}
            </span>
          </div>
          <div className="p-2.5 rounded bg-navy-900 border border-navy-800">
            <span className="text-[10px] text-slate-500 uppercase block">Automaton Complexity:</span>
            <span className="text-cyan-400 font-bold">
              {automataData?.minimized_dfa?.state_count || 0} MinDFA States
            </span>
          </div>
        </div>
      </div>

      {/* 4. Inspection View Switcher (Execution vs Automata Stages) */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex rounded-lg bg-navy-950 p-1 border border-navy-800 text-xs font-mono">
          <button
            type="button"
            onClick={() => setViewTab('execution')}
            className={`px-3 py-1.5 rounded transition-all flex items-center gap-1.5 ${
              viewTab === 'execution'
                ? 'bg-teal-500/20 text-teal-300 font-bold shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            <span>Step-by-Step DFA Simulation</span>
          </button>
          <button
            type="button"
            onClick={() => setViewTab('minimized_dfa')}
            className={`px-3 py-1.5 rounded transition-all flex items-center gap-1.5 ${
              viewTab === 'minimized_dfa'
                ? 'bg-teal-500/20 text-teal-300 font-bold shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Minimized DFA</span>
          </button>
          <button
            type="button"
            onClick={() => setViewTab('dfa')}
            className={`px-3 py-1.5 rounded transition-all flex items-center gap-1.5 ${
              viewTab === 'dfa'
                ? 'bg-teal-500/20 text-teal-300 font-bold shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Subset DFA</span>
          </button>
          <button
            type="button"
            onClick={() => setViewTab('nfa')}
            className={`px-3 py-1.5 rounded transition-all flex items-center gap-1.5 ${
              viewTab === 'nfa'
                ? 'bg-teal-500/20 text-teal-300 font-bold shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Thompson NFA</span>
          </button>
          <button
            type="button"
            onClick={() => setViewTab('conversion_trace')}
            className={`px-3 py-1.5 rounded transition-all flex items-center gap-1.5 ${
              viewTab === 'conversion_trace'
                ? 'bg-teal-500/20 text-teal-300 font-bold shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Conversion Trace</span>
          </button>
          <button
            type="button"
            onClick={() => setViewTab('transitions')}
            className={`px-3 py-1.5 rounded transition-all flex items-center gap-1.5 ${
              viewTab === 'transitions'
                ? 'bg-teal-500/20 text-teal-300 font-bold shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            <span>Transition Table</span>
          </button>
        </div>

        {/* If in execution view, show simulation target switcher (Candidate Token vs Full URL) */}
        {viewTab === 'execution' && (
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-slate-400 text-[11px]">Input String to Simulate:</span>
            <div className="flex rounded-lg bg-navy-950 p-1 border border-navy-800">
              <button
                type="button"
                onClick={() => setSimulationTarget('candidate')}
                className={`px-2.5 py-1 rounded text-xs transition-all ${
                  simulationTarget === 'candidate'
                    ? 'bg-teal-500/20 text-teal-300 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Target Token ({currentRule.candidate_input ? `"${currentRule.candidate_input}"` : 'None'})
              </button>
              <button
                type="button"
                onClick={() => setSimulationTarget('url')}
                className={`px-2.5 py-1 rounded text-xs transition-all ${
                  simulationTarget === 'url'
                    ? 'bg-teal-500/20 text-teal-300 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Full Extracted URL
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 5. View Content Rendered */}
      {viewTab === 'execution' && (
        <div className="space-y-4">
          {/* Simulation Player Box */}
          <div className="p-5 rounded-xl bg-navy-950 border border-navy-800 space-y-5">
            {/* Player Controls & Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-navy-850">
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-slate-400 uppercase">Automaton Stepper:</span>
                <span className="text-xs font-mono text-teal-400 font-bold">
                  Step {totalSteps > 0 ? stepIndex + 1 : 0} of {totalSteps}
                </span>
              </div>

              {/* Control Buttons */}
              <div className="flex items-center gap-2 font-mono">
                <button
                  type="button"
                  disabled={stepIndex <= 0}
                  onClick={() => setStepIndex((prev) => Math.max(0, prev - 1))}
                  className="p-1.5 rounded-lg bg-navy-900 border border-navy-800 text-slate-300 hover:text-white hover:bg-navy-850 disabled:opacity-40 transition-all"
                  title="Previous Step"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  disabled={totalSteps === 0}
                  onClick={() => setIsPlaying(!isPlaying)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    isPlaying
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-teal-500/20 text-teal-300 border-teal-500/40 hover:bg-teal-500/30'
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
                      <span>Auto Play</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  disabled={stepIndex >= totalSteps - 1}
                  onClick={() => setStepIndex((prev) => Math.min(totalSteps - 1, prev + 1))}
                  className="p-1.5 rounded-lg bg-navy-900 border border-navy-800 text-slate-300 hover:text-white hover:bg-navy-850 disabled:opacity-40 transition-all"
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
                  className="p-1.5 rounded-lg bg-navy-900 border border-navy-800 text-slate-400 hover:text-white hover:bg-navy-850 transition-all"
                  title="Reset to Start"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Input String Tape Visualization */}
            <div className="space-y-1.5">
              <div className="text-[11px] font-mono text-slate-400">
                Input Tape: <span className="text-slate-500 font-sans">({activeTrace.input_string.length} characters)</span>
              </div>
              <div className="p-3 rounded-lg bg-navy-900 border border-navy-800 overflow-x-auto">
                {activeTrace.input_string.length === 0 ? (
                  <span className="text-xs text-slate-500 font-mono italic">Empty input string ε</span>
                ) : (
                  <div className="flex items-center gap-1 font-mono text-xs">
                    {activeTrace.input_string.split('').map((char, idx) => {
                      const isCurrent = idx === stepIndex;
                      const isConsumed = idx < stepIndex;
                      return (
                        <div
                          key={idx}
                          className={`flex flex-col items-center justify-center min-w-[28px] h-12 rounded border transition-all ${
                            isCurrent
                              ? 'bg-teal-500/30 border-teal-400 text-teal-200 font-bold scale-105 shadow-md shadow-teal-500/20'
                              : isConsumed
                              ? 'bg-navy-950 border-navy-800 text-slate-400'
                              : 'bg-navy-950/50 border-navy-850 text-slate-600'
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

            {/* Current Step State Transition Card */}
            {currentStep ? (
              <div className="p-4 rounded-xl bg-navy-900 border border-navy-800 space-y-3 font-mono">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">Transition at Pos {currentStep.position}:</span>
                    <span className="px-2 py-0.5 rounded bg-navy-950 text-teal-300 font-bold border border-navy-800">
                      δ({currentStep.from_state}, '{currentStep.symbol}') → {currentStep.to_state}
                    </span>
                  </div>

                  {currentStep.is_dead ? (
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1">
                      <AlertOctagon className="w-3.5 h-3.5" />
                      <span>Dead State / Trap Transition</span>
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Valid Deterministic Transition</span>
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-200 font-sans leading-relaxed bg-navy-950 p-2.5 rounded border border-navy-850">
                  {currentStep.explanation}
                </p>
              </div>
            ) : (
              <div className="p-4 rounded bg-navy-900 text-xs text-slate-400 italic font-mono text-center">
                Automaton at initial state M0 prior to input consumption.
              </div>
            )}

            {/* Final Execution Outcome Summary */}
            <div className="p-3.5 rounded-lg bg-navy-900/80 border border-navy-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
              <div>
                <span className="text-slate-400">Simulation Status upon String Termination:</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-slate-300">Final State Reached:</span>
                  <span className="font-bold text-white px-2 py-0.5 rounded bg-navy-950 border border-navy-850">
                    {activeTrace.final_state}
                  </span>
                  <span className="text-slate-500">
                    ({activeTrace.is_accepted ? 'State is in Accepting Set F' : 'State is NOT in Accepting Set F'})
                  </span>
                </div>
              </div>

              <div>
                {activeTrace.is_accepted ? (
                  <div className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>ACCEPTED BY MINIMIZED DFA</span>
                  </div>
                ) : (
                  <div className="px-3 py-1.5 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold flex items-center gap-1.5">
                    <XCircle className="w-4 h-4" />
                    <span>REJECTED BY MINIMIZED DFA</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Full Step-by-Step Transition Trace Table */}
          <div className="p-4 rounded-xl bg-navy-950 border border-navy-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-slate-400 uppercase font-semibold">
                Complete Execution Trace Table ({activeTrace.steps.length} Steps):
              </span>
              <span className="text-[11px] font-mono text-slate-500">
                Click any row to jump stepper
              </span>
            </div>

            <div className="overflow-x-auto max-h-64 overflow-y-auto border border-navy-800 rounded-lg">
              <table className="w-full text-left text-xs font-mono border-collapse">
                <thead className="bg-navy-900 text-slate-400 sticky top-0 border-b border-navy-800">
                  <tr>
                    <th className="p-2.5">Pos</th>
                    <th className="p-2.5">Symbol</th>
                    <th className="p-2.5">From State</th>
                    <th className="p-2.5">To State</th>
                    <th className="p-2.5">Status</th>
                    <th className="p-2.5">Formal Execution Step</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy-850">
                  {activeTrace.steps.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-4 text-center text-slate-500 italic">
                        No steps recorded for this trace.
                      </td>
                    </tr>
                  ) : (
                    activeTrace.steps.map((st) => {
                      const isRowSelected = st.position === stepIndex;
                      return (
                        <tr
                          key={st.position}
                          onClick={() => setStepIndex(st.position)}
                          className={`cursor-pointer transition-colors ${
                            isRowSelected
                              ? 'bg-teal-500/20 text-white font-semibold'
                              : 'hover:bg-navy-900/60 text-slate-300'
                          }`}
                        >
                          <td className="p-2.5 text-slate-500">{st.position}</td>
                          <td className="p-2.5 font-bold text-teal-300">'{st.char}'</td>
                          <td className="p-2.5">{st.from_state}</td>
                          <td className="p-2.5">{st.to_state}</td>
                          <td className="p-2.5">
                            {st.is_dead ? (
                              <span className="text-rose-400 text-[10px]">DEAD TRAP</span>
                            ) : (
                              <span className="text-emerald-400 text-[10px]">VALID</span>
                            )}
                          </td>
                          <td className="p-2.5 font-sans text-[11px] text-slate-300 truncate max-w-xs" title={st.explanation}>
                            {st.explanation}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Minimized DFA View */}
      {viewTab === 'minimized_dfa' && (
        <div className="space-y-4">
          <AutomataGraphViewer
            graph={minDfaGraph}
            title={`${currentRule.rule_name} — Minimized DFA`}
            stageName="Stage 3: Minimized DFA (Canonical Minimal Form)"
          />
        </div>
      )}

      {/* Subset DFA View */}
      {viewTab === 'dfa' && (
        <div className="space-y-4">
          <AutomataGraphViewer
            graph={dfaGraph}
            title={`${currentRule.rule_name} — Subset Construction DFA`}
            stageName="Stage 2: Deterministic Finite Automaton (DFA)"
          />
        </div>
      )}

      {/* Thompson NFA View */}
      {viewTab === 'nfa' && (
        <div className="space-y-4">
          <AutomataGraphViewer
            graph={nfaGraph}
            title={`${currentRule.rule_name} — Thompson NFA`}
            stageName="Stage 1: Non-Deterministic Finite Automaton (NFA)"
          />
        </div>
      )}

      {/* Conversion Trace View */}
      {viewTab === 'conversion_trace' && automataData && (
        <div className="space-y-4">
          <ConversionTracePanel
            subsetTrace={automataData.dfa?.trace || []}
            minimizationSteps={automataData.minimized_dfa?.refinement_steps || []}
            initialPartitions={automataData.minimized_dfa?.initial_partitions || []}
          />
        </div>
      )}

      {/* Transition Table View */}
      {viewTab === 'transitions' && automataData && (
        <div className="space-y-4">
          <TransitionTable
            transitions={automataData.minimized_dfa?.transitions || []}
            title={`${currentRule.rule_name} — Minimized Transition Table`}
          />
        </div>
      )}
    </div>
  );
};
