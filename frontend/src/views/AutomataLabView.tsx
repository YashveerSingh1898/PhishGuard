import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  Sparkles,
  AlertOctagon,
  Code2,
} from 'lucide-react';
import {
  EvaluatedRule,
  DFAExecutionTrace,
  DFAExecutionStep,
  AutomataConvertResponse,
  MinimizedDFAData,
} from '../types';
import { nfaToGraph, dfaToGraph, minDfaToGraph } from '../automata';
import { AutomataGraphViewer } from '../components/AutomataGraphViewer';
import { TransitionTable } from '../components/TransitionTable';
import { ConversionTracePanel } from '../components/ConversionTracePanel';
import { convertRegex, AutomataApiError } from '../services/api';

interface AutomataLabViewProps {
  evaluatedRules: EvaluatedRule[];
  originalUrl: string;
  extractedUrl: string;
  customAutomataData: AutomataConvertResponse | null;
  onConvertCustomRegex?: (pattern: string) => void;
  isCustomLoading?: boolean;
}

// 6 Default structural rules for academic demonstration if no email has been evaluated yet
const DEFAULT_STRUCTURAL_RULES: EvaluatedRule[] = [
  {
    rule_id: 'RULE_IP_HOST',
    rule_name: 'Direct IPv4 Host Octets',
    regex_pattern: '(0|1|2|3|4|5|6|7|8|9)+',
    description:
      'Identifies numeric IP address octets used directly in URL hosts to bypass domain registration history.',
    target_field: 'url.hostname',
    weight: 35.0,
    candidate_input: '192',
    matched: true,
    score_contribution: 35.0,
    explanation: 'URL host contains direct numeric IP octet, parsed by automaton.',
  },
  {
    rule_id: 'RULE_SUSPICIOUS_TLD',
    rule_name: 'High-Abuse Top-Level Domain (TLD)',
    regex_pattern: '(xyz|top|work|click|fit|live|ru)',
    description:
      'Matches high-abuse disposable top-level domains commonly registered for short-lived phishing campaigns.',
    target_field: 'url.tld',
    weight: 20.0,
    candidate_input: 'xyz',
    matched: true,
    score_contribution: 20.0,
    explanation: 'Domain uses high-abuse TLD .xyz.',
  },
  {
    rule_id: 'RULE_CREDENTIAL_KEYWORD',
    rule_name: 'Credential Harvesting Path Keyword',
    regex_pattern: '(login|verify|security|update|banking|auth)',
    description:
      'Detects sensitive credential or authentication target keywords located in URL paths or query strings.',
    target_field: 'url.path',
    weight: 25.0,
    candidate_input: 'login',
    matched: true,
    score_contribution: 25.0,
    explanation: 'Sensitive credential keyword login detected in URL path.',
  },
  {
    rule_id: 'RULE_BRAND_SQUATTING',
    rule_name: 'Deceptive Brand Squatting Prefix',
    regex_pattern: '(paypal|google|apple|microsoft|chase)-(login|verify|security|update)',
    description:
      'Detects hyphenated brand-squatted host prefixes combining enterprise brands with urgency tokens.',
    target_field: 'url.hostname',
    weight: 25.0,
    candidate_input: 'paypal-login',
    matched: true,
    score_contribution: 25.0,
    explanation: 'Deceptive brand squatting prefix detected in host.',
  },
  {
    rule_id: 'RULE_INSECURE_HTTP',
    rule_name: 'Insecure HTTP Transport Protocol',
    regex_pattern: 'http',
    description:
      'Detects unencrypted HTTP cleartext transport on URLs that solicit authentication or security verification.',
    target_field: 'url.scheme',
    weight: 15.0,
    candidate_input: 'http',
    matched: true,
    score_contribution: 15.0,
    explanation: 'Unencrypted cleartext HTTP transport protocol.',
  },
  {
    rule_id: 'RULE_SENDER_MISMATCH',
    rule_name: 'Sender Brand Spoofing Mismatch',
    regex_pattern: '(paypal|google|apple|microsoft|chase)',
    description:
      'Detects recognized brand identities in the sender address when the email links to external domain infrastructure.',
    target_field: 'sender_vs_url',
    weight: 30.0,
    candidate_input: 'paypal',
    matched: true,
    score_contribution: 30.0,
    explanation: 'Sender claims recognized enterprise brand identity.',
  },
];

const PRESET_PATTERNS = [
  { label: '(a|b)*abb', desc: 'Classic subset construction with state reduction (Hopcroft & Ullman)', sampleInput: 'ababb' },
  { label: 'a|b', desc: 'Thompson alternation with parallel epsilon branches', sampleInput: 'a' },
  { label: 'ab', desc: 'Thompson sequential concatenation', sampleInput: 'ab' },
  { label: 'a*', desc: 'Kleene star zero-or-more inductive loop', sampleInput: 'aaa' },
  { label: 'a+', desc: 'One-or-more repetition (non-empty language)', sampleInput: 'aaaa' },
  { label: 'a?b', desc: 'Optional prefix branch', sampleInput: 'b' },
  { label: '(ab|c)+', desc: 'Grouped alternation with repetition', sampleInput: 'abcab' },
  { label: '(0|1)*00', desc: 'Binary string ending in double zero 00', sampleInput: '10100' },
  { label: '[0-9]+', desc: 'Numeric digit character class', sampleInput: '192' },
];

/**
 * Simulates string consumption deterministically on a Minimized DFA,
 * recording every character transition and trap/dead state entry.
 */
function simulateStringOnMinDFA(minDfa: MinimizedDFAData | undefined, inputStr: string): DFAExecutionTrace {
  if (!minDfa || !minDfa.start_state) {
    return {
      input_string: inputStr,
      steps: [],
      final_state: 'M0',
      is_accepted: false,
      total_steps: 0,
    };
  }

  let current = minDfa.start_state;
  const steps: DFAExecutionStep[] = [];

  for (let i = 0; i < inputStr.length; i++) {
    const char = inputStr[i];

    if (current === 'DEAD') {
      steps.push({
        position: i,
        char,
        from_state: 'DEAD',
        symbol: char,
        to_state: 'DEAD',
        is_dead: true,
        explanation: `Pos ${i}: Automaton remains in Dead / Trap state on symbol '${char}'.`,
      });
      continue;
    }

    const trans = minDfa.transitions.find((t) => t.from_state === current && t.symbol === char);

    if (!trans) {
      const inAlpha = minDfa.alphabet.includes(char);
      const reason = inAlpha
        ? `No transition defined from state ${current} on symbol '${char}'`
        : `Symbol '${char}' is outside alphabet Σ`;
      steps.push({
        position: i,
        char,
        from_state: current,
        symbol: char,
        to_state: 'DEAD',
        is_dead: true,
        explanation: `Pos ${i}: ${reason} → transitions to Dead state.`,
      });
      current = 'DEAD';
    } else {
      steps.push({
        position: i,
        char,
        from_state: current,
        symbol: char,
        to_state: trans.to_state,
        is_dead: false,
        explanation: `Pos ${i}: State ${current} consumes '${char}' → transitions to ${trans.to_state}.`,
      });
      current = trans.to_state;
    }
  }

  const is_accepted = minDfa.accepting_states.includes(current);
  return {
    input_string: inputStr,
    steps,
    final_state: current,
    is_accepted,
    total_steps: steps.length,
  };
}

export const AutomataLabView: React.FC<AutomataLabViewProps> = ({
  evaluatedRules,
  originalUrl,
  extractedUrl,
  customAutomataData: _customAutomataData,
  onConvertCustomRegex,
  isCustomLoading: _isCustomLoading = false,
}) => {
  // Use active rules or fall back to default structural set
  const activeRulesList = evaluatedRules.length > 0 ? evaluatedRules : DEFAULT_STRUCTURAL_RULES;

  // Mode: 'evaluated' (email rules), 'preset' (benchmark patterns), 'custom' (arbitrary input)
  const [mode, setMode] = useState<'evaluated' | 'preset' | 'custom'>('evaluated');

  // Selected indices & inputs
  const [selectedRuleIndex, setSelectedRuleIndex] = useState<number>(0);
  const [selectedPresetIndex, setSelectedPresetIndex] = useState<number>(0);
  const [customPatternInput, setCustomPatternInput] = useState<string>('(a|b)*abb');

  // Active automata data state (holds the real compiled data for the current regex)
  const [activeAutomata, setActiveAutomata] = useState<AutomataConvertResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<AutomataApiError | null>(null);

  // Active sub-tab: A (Regex Rule), B (NFA), C (DFA), D (Minimized DFA), E (URL Execution)
  const [activeTab, setActiveTab] = useState<'rule' | 'nfa' | 'dfa' | 'min_dfa' | 'execution'>('execution');

  // URL Execution stepper state
  const [simTarget, setSimTarget] = useState<'candidate' | 'url' | 'custom'>('candidate');
  const [customSimString, setCustomSimString] = useState<string>('ababb');
  const [stepIndex, setStepIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Current active rule reference (when in evaluated mode)
  const currentRule: EvaluatedRule | undefined = activeRulesList[selectedRuleIndex];

  // Determine current active regex
  const currentRegex = useMemo(() => {
    if (mode === 'evaluated') {
      return currentRule?.regex_pattern || '(0|1|2|3|4|5|6|7|8|9)+';
    }
    if (mode === 'preset') {
      return PRESET_PATTERNS[selectedPresetIndex]?.label || '(a|b)*abb';
    }
    return customPatternInput.trim();
  }, [mode, currentRule, selectedPresetIndex, customPatternInput]);

  // Load and compile automata whenever currentRegex changes
  const loadAutomataForRegex = useCallback(
    async (pattern: string) => {
      const trimmed = pattern.trim();
      if (!trimmed) {
        setError(new AutomataApiError('Regular expression cannot be empty.'));
        return;
      }

      // Check if current evaluated rule already has pre-compiled automata
      if (mode === 'evaluated' && currentRule && currentRule.automata && currentRule.regex_pattern === trimmed) {
        setActiveAutomata(currentRule.automata as AutomataConvertResponse);
        setError(null);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const response = await convertRegex(trimmed);
        setActiveAutomata(response);
        if (onConvertCustomRegex) {
          onConvertCustomRegex(trimmed);
        }
      } catch (err: unknown) {
        if (err instanceof AutomataApiError) {
          setError(err);
        } else {
          setError(new AutomataApiError(err instanceof Error ? err.message : 'Compilation failed.'));
        }
      } finally {
        setIsLoading(false);
      }
    },
    [mode, currentRule, onConvertCustomRegex]
  );

  // Trigger compilation whenever the mode or selected pattern changes
  useEffect(() => {
    loadAutomataForRegex(currentRegex);
  }, [currentRegex, loadAutomataForRegex]);

  // Determine the input string to be simulated in Tab E
  const activeInputString = useMemo(() => {
    if (simTarget === 'candidate') {
      if (mode === 'evaluated') {
        return currentRule?.candidate_input || '';
      }
      if (mode === 'preset') {
        return PRESET_PATTERNS[selectedPresetIndex]?.sampleInput || '';
      }
      return customSimString;
    }
    if (simTarget === 'url') {
      return extractedUrl || originalUrl || 'http://paypal-security.xyz/login';
    }
    return customSimString;
  }, [simTarget, mode, currentRule, selectedPresetIndex, customSimString, extractedUrl, originalUrl]);

  // Compute the execution trace dynamically on the active Minimized DFA
  const activeTrace: DFAExecutionTrace = useMemo(() => {
    return simulateStringOnMinDFA(activeAutomata?.minimized_dfa, activeInputString);
  }, [activeAutomata, activeInputString]);

  const totalSteps = activeTrace.steps.length;

  // Reset stepper playback whenever input or rule changes
  useEffect(() => {
    setStepIndex(0);
    setIsPlaying(false);
  }, [currentRegex, simTarget, activeInputString]);

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
      }, 700);
    }
    return () => clearInterval(timer);
  }, [isPlaying, totalSteps]);

  // Current execution step
  const currentStep = activeTrace.steps[stepIndex] || null;

  // Build graphs from active computed automata data
  const nfaGraph = useMemo(
    () => (activeAutomata?.nfa ? nfaToGraph(activeAutomata.nfa) : { nodes: [], edges: [] }),
    [activeAutomata]
  );
  const dfaGraph = useMemo(
    () => (activeAutomata?.dfa ? dfaToGraph(activeAutomata.dfa) : { nodes: [], edges: [] }),
    [activeAutomata]
  );
  const minDfaGraph = useMemo(
    () => (activeAutomata?.minimized_dfa ? minDfaToGraph(activeAutomata.minimized_dfa) : { nodes: [], edges: [] }),
    [activeAutomata]
  );

  // Calculate highlighted state and transition for simulation stepper
  const highlightedStateId = currentStep ? currentStep.from_state : null;
  const highlightedTransition = currentStep
    ? { fromState: currentStep.from_state, toState: currentStep.to_state }
    : null;

  // Custom regex form submit handler
  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadAutomataForRegex(customPatternInput);
  };

  // State reduction stats safe calculation
  const statesBefore = activeAutomata?.minimized_dfa?.comparison?.states_before || activeAutomata?.dfa?.state_count || 0;
  const statesAfter = activeAutomata?.minimized_dfa?.comparison?.states_after || activeAutomata?.minimized_dfa?.state_count || 0;
  const reductionCount = Math.max(0, statesBefore - statesAfter);
  const reductionPct = statesBefore > 0 ? (((statesBefore - statesAfter) / statesBefore) * 100).toFixed(1) : '0.0';

  return (
    <div className="space-y-6">
      {/* 1. Header Banner & Mode Selector */}
      <div className="cipher-surface rounded-2xl border border-cipher-border p-6 sm:p-7 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-cipher-border">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-cipher-terracotta/10 text-cipher-terracotta border border-cipher-terracotta/30 shadow-inner">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-cipher-text font-sans tracking-tight">
                  Automata Lab — Models of Computation
                </h2>
                <span className="text-[11px] text-cipher-sage font-mono">
                  Formal Language Theory Verification
                </span>
              </div>
            </div>
            <p className="text-xs text-cipher-muted mt-1 font-sans">
              Inspect dynamic automata construction: Thompson NFA (ε-transitions), Subset Construction DFA, and Partition Refinement Minimized DFA.
            </p>
          </div>

          {/* 3-Way Mode Toggle */}
          <div className="flex rounded-xl bg-cipher-elevated p-1 border border-cipher-border text-xs font-mono shrink-0">
            <button
              type="button"
              onClick={() => setMode('evaluated')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                mode === 'evaluated'
                  ? 'bg-cipher-terracotta/20 text-cipher-text font-bold border border-cipher-terracotta/40 shadow-sm'
                  : 'text-cipher-muted hover:text-cipher-text'
              }`}
            >
              Evaluated Email Rules ({activeRulesList.length})
            </button>
            <button
              type="button"
              onClick={() => setMode('preset')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                mode === 'preset'
                  ? 'bg-cipher-terracotta/20 text-cipher-text font-bold border border-cipher-terracotta/40 shadow-sm'
                  : 'text-cipher-muted hover:text-cipher-text'
              }`}
            >
              Preset Benchmarks
            </button>
            <button
              type="button"
              onClick={() => setMode('custom')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                mode === 'custom'
                  ? 'bg-cipher-terracotta/20 text-cipher-text font-bold border border-cipher-terracotta/40 shadow-sm'
                  : 'text-cipher-muted hover:text-cipher-text'
              }`}
            >
              Custom Regex
            </button>
          </div>
        </div>

        {/* MODE A: Evaluated Email Rules Selector */}
        {mode === 'evaluated' && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs font-mono text-cipher-muted">
              <span className="font-semibold uppercase tracking-wider text-[11px]">Select Structural Rule:</span>
              <span className="text-[11px] text-cipher-sage truncate max-w-md">
                Active Artifact:{' '}
                <code className="text-cipher-text ml-1">
                  {extractedUrl || originalUrl || 'http://paypal-security.xyz/login'}
                </code>
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {activeRulesList.map((rule, idx) => {
                const isSelected = idx === selectedRuleIndex;
                return (
                  <button
                    key={rule.rule_id}
                    type="button"
                    onClick={() => {
                      setSelectedRuleIndex(idx);
                      setError(null);
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'bg-cipher-terracotta/15 border-cipher-terracotta/50 ring-1 ring-cipher-terracotta/40 shadow-sm'
                        : 'bg-cipher-elevated/70 border-cipher-border hover:border-cipher-muted/40 hover:bg-cipher-elevated'
                    }`}
                  >
                    <div className="text-[11px] font-bold text-cipher-text truncate" title={rule.rule_name}>
                      {rule.rule_name}
                    </div>
                    <div className="flex items-center justify-between mt-1 text-[10px] font-mono">
                      <span className={rule.matched ? 'text-cipher-danger font-bold' : 'text-cipher-muted'}>
                        {rule.matched ? `MATCH (+${rule.weight}p)` : 'NO MATCH'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* MODE B: Preset Verification Patterns */}
        {mode === 'preset' && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs font-mono text-cipher-muted">
              <span className="font-semibold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cipher-terracotta" />
                <span>Select Verification Pattern:</span>
              </span>
              <span className="text-[11px] text-cipher-muted">
                {PRESET_PATTERNS[selectedPresetIndex]?.desc}
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {PRESET_PATTERNS.map((preset, idx) => {
                const isSelected = idx === selectedPresetIndex;
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      setSelectedPresetIndex(idx);
                      setError(null);
                    }}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-mono transition-all ${
                      isSelected
                        ? 'bg-cipher-terracotta/20 text-cipher-text border-cipher-terracotta/50 font-bold shadow-sm'
                        : 'bg-cipher-elevated border-cipher-border text-cipher-muted hover:text-cipher-text hover:bg-cipher-elevated/90'
                    }`}
                    title={preset.desc}
                  >
                    <code>{preset.label}</code>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* MODE C: Custom Regex Input */}
        {mode === 'custom' && (
          <div className="space-y-3 font-mono text-xs">
            <form onSubmit={handleCustomSubmit} className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={customPatternInput}
                  onChange={(e) => {
                    setCustomPatternInput(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="e.g. (a|b)*abb, a|b, [0-9]+, (ab|c)+"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-cipher-elevated border border-cipher-border text-cipher-text focus:outline-none focus:border-cipher-terracotta transition-colors placeholder:text-cipher-muted"
                  disabled={isLoading}
                />
              </div>
              <button
                type="submit"
                disabled={isLoading || !customPatternInput.trim()}
                className="px-5 py-2.5 rounded-xl bg-cipher-terracotta hover:bg-[#C85331] text-cipher-text font-bold transition-all disabled:opacity-50 shadow-md shadow-cipher-terracotta/20 active:scale-95 shrink-0"
              >
                {isLoading ? 'Compiling...' : 'Compile Automata'}
              </button>
            </form>

            <div className="text-[11px] text-cipher-muted flex items-center gap-1.5">
              <Code2 className="w-3.5 h-3.5 text-cipher-sage" />
              <span>Supported: concatenation, alternation (<code className="text-cipher-text">|</code>), star (<code className="text-cipher-text">*</code>), plus (<code className="text-cipher-text">+</code>), optional (<code className="text-cipher-text">?</code>), grouping (<code className="text-cipher-text">( )</code>), brackets (<code className="text-cipher-text">[0-9]</code>).</span>
            </div>
          </div>
        )}

        {/* Error Callout (if malformed regex) */}
        {error && (
          <div className="p-4 rounded-xl bg-cipher-danger/10 border border-cipher-danger/30 text-cipher-danger text-xs flex items-start gap-3">
            <AlertOctagon className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1 font-mono">
              <div className="font-bold">{error.errorType || 'RegexSyntaxError'}</div>
              <p className="mt-0.5 leading-relaxed font-sans">{error.message}</p>
              {error.position !== undefined && (
                <div className="mt-2 p-2 rounded bg-cipher-surface/80 border border-cipher-danger/20">
                  <span className="text-cipher-muted">Index {error.position}:</span>
                  <div className="text-cipher-text font-bold mt-0.5">{currentRegex}</div>
                  <div className="text-cipher-danger font-bold">
                    {' '.repeat(Math.max(0, error.position))}↑ (Syntax error here)
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 2. Subsections Navigation Tabs (A. Regex Rule, B. NFA, C. DFA, D. Minimized DFA, E. URL Execution) */}
      <div className="flex rounded-xl cipher-surface border border-cipher-border p-1 overflow-x-auto text-xs font-mono gap-1">
        <button
          type="button"
          onClick={() => setActiveTab('rule')}
          className={`flex-1 min-w-[120px] py-2 px-3 rounded-lg transition-all text-center ${
            activeTab === 'rule'
              ? 'bg-cipher-terracotta/20 text-cipher-text font-bold border border-cipher-terracotta/40 shadow-sm'
              : 'text-cipher-muted hover:text-cipher-text'
          }`}
        >
          A. Regex Rule
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('nfa')}
          className={`flex-1 min-w-[120px] py-2 px-3 rounded-lg transition-all text-center ${
            activeTab === 'nfa'
              ? 'bg-cipher-terracotta/20 text-cipher-text font-bold border border-cipher-terracotta/40 shadow-sm'
              : 'text-cipher-muted hover:text-cipher-text'
          }`}
        >
          B. Thompson NFA
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('dfa')}
          className={`flex-1 min-w-[120px] py-2 px-3 rounded-lg transition-all text-center ${
            activeTab === 'dfa'
              ? 'bg-cipher-terracotta/20 text-cipher-text font-bold border border-cipher-terracotta/40 shadow-sm'
              : 'text-cipher-muted hover:text-cipher-text'
          }`}
        >
          C. Subset DFA
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('min_dfa')}
          className={`flex-1 min-w-[130px] py-2 px-3 rounded-lg transition-all text-center ${
            activeTab === 'min_dfa'
              ? 'bg-cipher-terracotta/20 text-cipher-text font-bold border border-cipher-terracotta/40 shadow-sm'
              : 'text-cipher-muted hover:text-cipher-text'
          }`}
        >
          D. Minimized DFA
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('execution')}
          className={`flex-1 min-w-[145px] py-2 px-3 rounded-lg transition-all text-center flex items-center justify-center gap-1.5 ${
            activeTab === 'execution'
              ? 'bg-cipher-terracotta/20 text-cipher-text font-bold border border-cipher-terracotta/40 shadow-sm'
              : 'text-cipher-muted hover:text-cipher-text'
          }`}
        >
          <Play className="w-3.5 h-3.5 text-cipher-terracotta" />
          <span>E. String Execution</span>
        </button>
      </div>

      {/* 3. Subsections Views */}

      {/* TAB A: REGEX RULE */}
      {activeTab === 'rule' && (
        <div className="p-6 sm:p-7 rounded-2xl cipher-surface border border-cipher-border space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-cipher-border">
            <div>
              <h3 className="text-base font-bold text-cipher-text font-sans">
                {mode === 'evaluated'
                  ? currentRule?.rule_name
                  : mode === 'preset'
                  ? `Preset: ${PRESET_PATTERNS[selectedPresetIndex]?.desc}`
                  : 'Custom Regular Expression'}
              </h3>
              <span className="text-xs font-mono text-cipher-muted">
                {mode === 'evaluated' ? `Rule ID: ${currentRule?.rule_id}` : `Grammar Mode: ${mode.toUpperCase()}`}
              </span>
            </div>
            {mode === 'evaluated' && currentRule && (
              <span
                className={`px-3 py-1 rounded-full text-xs font-mono font-semibold border ${
                  currentRule.matched
                    ? 'bg-cipher-danger/10 text-cipher-danger border-cipher-danger/30'
                    : 'bg-cipher-green/10 text-cipher-green border-cipher-green/30'
                }`}
              >
                {currentRule.matched
                  ? `Pattern Matched (+${currentRule.weight} pts)`
                  : 'Pattern Not Matched (0 pts)'}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
            <div className="p-4 rounded-xl bg-cipher-elevated border border-cipher-border space-y-1">
              <span className="text-[10px] text-cipher-muted uppercase tracking-wider block">
                Actual Regular Expression
              </span>
              <code className="text-cipher-terracotta font-bold text-sm break-all block">{currentRegex}</code>
            </div>

            <div className="p-4 rounded-xl bg-cipher-elevated border border-cipher-border space-y-1">
              <span className="text-[10px] text-cipher-muted uppercase tracking-wider block">
                Constructed Alphabet Σ ({activeAutomata?.alphabet.length || 0} symbols)
              </span>
              <span className="text-cipher-text font-bold text-sm block truncate">
                &#123;{activeAutomata?.alphabet.join(', ') || 'None'}&#125;
              </span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-cipher-elevated border border-cipher-border space-y-1 text-xs font-mono">
            <span className="text-[10px] text-cipher-muted uppercase tracking-wider block">
              Automata Complexity Summary
            </span>
            <div className="text-cipher-sage text-sm font-bold">
              {activeAutomata?.nfa.state_count || 0} NFA States &rarr; {activeAutomata?.dfa.state_count || 0} DFA States &rarr; {statesAfter} Minimized DFA States ({reductionPct}% reduction)
            </div>
          </div>

          <div className="p-4 rounded-xl bg-cipher-elevated border border-cipher-border text-xs space-y-1.5">
            <span className="text-[10px] font-mono text-cipher-muted uppercase tracking-wider block">
              Theoretical Context &amp; Purpose
            </span>
            <p className="text-cipher-text/90 font-sans leading-relaxed">
              {mode === 'evaluated'
                ? currentRule?.description
                : mode === 'preset'
                ? PRESET_PATTERNS[selectedPresetIndex]?.desc
                : 'Custom regular expressions are compiled directly into an NFA via Thompson\'s Construction, determinized via Subset Construction, and minimized via Partition Refinement.'}
            </p>
          </div>
        </div>
      )}

      {/* TAB B: NFA (Thompson's Construction) */}
      {activeTab === 'nfa' && activeAutomata?.nfa && (
        <div className="space-y-4">
          {/* Metadata Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
            <div className="p-3.5 rounded-xl cipher-surface border border-cipher-border">
              <span className="text-[10px] text-cipher-muted uppercase tracking-wider block">NFA States</span>
              <span className="text-xl font-bold text-cipher-text">{activeAutomata.nfa.state_count}</span>
            </div>
            <div className="p-3.5 rounded-xl cipher-surface border border-cipher-border">
              <span className="text-[10px] text-cipher-muted uppercase tracking-wider block">NFA Transitions</span>
              <span className="text-xl font-bold text-cipher-sage">{activeAutomata.nfa.transition_count}</span>
            </div>
            <div className="p-3.5 rounded-xl cipher-surface border border-cipher-border">
              <span className="text-[10px] text-cipher-muted uppercase tracking-wider block">Start State</span>
              <span className="text-xl font-bold text-cipher-terracotta">{activeAutomata.nfa.start_state}</span>
            </div>
            <div className="p-3.5 rounded-xl cipher-surface border border-cipher-border">
              <span className="text-[10px] text-cipher-muted uppercase tracking-wider block">Accepting States</span>
              <span className="text-xl font-bold text-cipher-green">
                {activeAutomata.nfa.accepting_states.join(', ') || 'None'}
              </span>
            </div>
          </div>

          {/* Interactive Graph Diagram */}
          <AutomataGraphViewer
            graph={nfaGraph}
            title={`${currentRegex} — Thompson NFA`}
            stageName="Stage 1: Non-Deterministic Finite Automaton (NFA)"
          />

          {/* Transition Table */}
          <TransitionTable
            transitions={activeAutomata.nfa.transitions}
            title={`${currentRegex} — NFA Transition Table (with ε)`}
            isNFA={true}
          />
        </div>
      )}

      {/* TAB C: DFA (Subset Construction) */}
      {activeTab === 'dfa' && activeAutomata?.dfa && (
        <div className="space-y-4">
          {/* Metadata Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
            <div className="p-3.5 rounded-xl cipher-surface border border-cipher-border">
              <span className="text-[10px] text-cipher-muted uppercase tracking-wider block">DFA States</span>
              <span className="text-xl font-bold text-cipher-text">{activeAutomata.dfa.state_count}</span>
            </div>
            <div className="p-3.5 rounded-xl cipher-surface border border-cipher-border">
              <span className="text-[10px] text-cipher-muted uppercase tracking-wider block">Transitions</span>
              <span className="text-xl font-bold text-cipher-sage">{activeAutomata.dfa.transition_count}</span>
            </div>
            <div className="p-3.5 rounded-xl cipher-surface border border-cipher-border">
              <span className="text-[10px] text-cipher-muted uppercase tracking-wider block">Start State</span>
              <span className="text-xl font-bold text-cipher-terracotta">{activeAutomata.dfa.start_state}</span>
            </div>
            <div className="p-3.5 rounded-xl cipher-surface border border-cipher-border">
              <span className="text-[10px] text-cipher-muted uppercase tracking-wider block">Accepting States</span>
              <span className="text-xl font-bold text-cipher-green">
                {activeAutomata.dfa.accepting_states.join(', ') || 'None'}
              </span>
            </div>
          </div>

          {/* Subset Mapping Table */}
          <div className="p-4 rounded-xl cipher-surface border border-cipher-border space-y-2">
            <span className="text-xs font-mono text-cipher-text font-semibold uppercase tracking-wider block">
              DFA State &rarr; NFA Subsets:
            </span>
            <div className="flex flex-wrap gap-2 font-mono text-xs">
              {activeAutomata.dfa.states.map((st) => (
                <div
                  key={st.id}
                  className="px-2.5 py-1 rounded-lg bg-cipher-elevated border border-cipher-border text-cipher-text"
                >
                  <span className="text-cipher-terracotta font-bold">{st.id}</span> = &#123;
                  {st.nfa_states.map((s) => `S${s}`).join(', ')}&#125;
                  {st.is_accepting && <span className="text-cipher-green ml-1">★</span>}
                </div>
              ))}
            </div>
          </div>

          {/* Interactive Graph Diagram */}
          <AutomataGraphViewer
            graph={dfaGraph}
            title={`${currentRegex} — Subset Construction DFA`}
            stageName="Stage 2: Deterministic Finite Automaton (DFA)"
          />

          {/* Subset Construction Trace */}
          <ConversionTracePanel
            subsetTrace={activeAutomata.dfa.trace || []}
            minimizationSteps={activeAutomata.minimized_dfa?.refinement_steps || []}
            initialPartitions={activeAutomata.minimized_dfa?.initial_partitions || []}
          />
        </div>
      )}

      {/* TAB D: MINIMIZED DFA (Partition Refinement) */}
      {activeTab === 'min_dfa' && activeAutomata?.minimized_dfa && (
        <div className="space-y-4">
          {/* State Reduction Comparison Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
            <div className="p-3.5 rounded-xl cipher-surface border border-cipher-border">
              <span className="text-[10px] text-cipher-muted uppercase tracking-wider block">Original DFA States</span>
              <span className="text-xl font-bold text-cipher-muted">{statesBefore}</span>
            </div>
            <div className="p-3.5 rounded-xl cipher-surface border border-cipher-border">
              <span className="text-[10px] text-cipher-muted uppercase tracking-wider block">Minimized DFA States</span>
              <span className="text-xl font-bold text-cipher-sage">{statesAfter}</span>
            </div>
            <div className="p-3.5 rounded-xl cipher-surface border border-cipher-border">
              <span className="text-[10px] text-cipher-muted uppercase tracking-wider block">States Reduced</span>
              <span className="text-xl font-bold text-cipher-green">
                -{reductionCount} ({reductionPct}%)
              </span>
            </div>
            <div className="p-3.5 rounded-xl cipher-surface border border-cipher-border">
              <span className="text-[10px] text-cipher-muted uppercase tracking-wider block">Canonical Start / Accept</span>
              <span className="text-xs font-bold text-cipher-text block mt-1">
                {activeAutomata.minimized_dfa.start_state} / &#123;
                {activeAutomata.minimized_dfa.accepting_states.join(', ')}&#125;
              </span>
            </div>
          </div>

          {/* Interactive Graph Diagram */}
          <AutomataGraphViewer
            graph={minDfaGraph}
            title={`${currentRegex} — Minimized DFA (Canonical Form)`}
            stageName="Stage 3: Minimized DFA (Partition Refinement)"
          />

          {/* Transition Table */}
          <TransitionTable
            transitions={activeAutomata.minimized_dfa.transitions}
            title={`${currentRegex} — Canonical Transition Table`}
          />
        </div>
      )}

      {/* TAB E: STRING / URL EXECUTION (STEP BY STEP + REAL-TIME GRAPH HIGHLIGHTING) */}
      {activeTab === 'execution' && (
        <div className="space-y-5">
          {/* Target Selector Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl cipher-surface border border-cipher-border font-mono text-xs">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-cipher-muted">Simulation Target:</span>
              <div className="flex rounded-lg bg-cipher-elevated p-1 border border-cipher-border gap-1">
                <button
                  type="button"
                  onClick={() => setSimTarget('candidate')}
                  className={`px-3 py-1 rounded-md transition-all ${
                    simTarget === 'candidate'
                      ? 'bg-cipher-terracotta/20 text-cipher-text font-bold border border-cipher-terracotta/40'
                      : 'text-cipher-muted hover:text-cipher-text'
                  }`}
                >
                  Candidate Token ({mode === 'evaluated' ? `"${currentRule?.candidate_input || 'None'}"` : `"${PRESET_PATTERNS[selectedPresetIndex]?.sampleInput || 'ababb'}"`})
                </button>
                <button
                  type="button"
                  onClick={() => setSimTarget('url')}
                  className={`px-3 py-1 rounded-md transition-all ${
                    simTarget === 'url'
                      ? 'bg-cipher-terracotta/20 text-cipher-text font-bold border border-cipher-terracotta/40'
                      : 'text-cipher-muted hover:text-cipher-text'
                  }`}
                >
                  Full URL Artifact
                </button>
                <button
                  type="button"
                  onClick={() => setSimTarget('custom')}
                  className={`px-3 py-1 rounded-md transition-all ${
                    simTarget === 'custom'
                      ? 'bg-cipher-terracotta/20 text-cipher-text font-bold border border-cipher-terracotta/40'
                      : 'text-cipher-muted hover:text-cipher-text'
                  }`}
                >
                  Custom Test String
                </button>
              </div>
            </div>

            <div className="text-cipher-muted text-[11px]">
              Input String Length: <strong className="text-cipher-text">{activeInputString.length}</strong> characters
            </div>
          </div>

          {/* Custom Simulation String Input (when simTarget === 'custom') */}
          {simTarget === 'custom' && (
            <div className="p-4 rounded-xl cipher-surface border border-cipher-border space-y-2 font-mono text-xs">
              <span className="text-cipher-muted block text-[10px] uppercase tracking-wider">
                Custom Test String Input:
              </span>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customSimString}
                  onChange={(e) => setCustomSimString(e.target.value)}
                  placeholder="Enter characters to simulate against current automaton..."
                  className="flex-1 px-3.5 py-2 rounded-xl bg-cipher-elevated border border-cipher-border text-cipher-text focus:outline-none focus:border-cipher-terracotta transition-colors"
                />
                <button
                  type="button"
                  onClick={() => {
                    setStepIndex(0);
                    setIsPlaying(false);
                  }}
                  className="px-4 py-2 rounded-xl bg-cipher-elevated border border-cipher-border text-cipher-text font-bold hover:bg-[#201F1C] transition-all"
                >
                  Reset Stepper
                </button>
              </div>
            </div>
          )}

          {/* LIVE GRAPH WITH STEP HIGHLIGHTING */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-cipher-muted px-1">
              <span className="font-semibold uppercase flex items-center gap-1.5 tracking-wider text-[11px]">
                <Cpu className="w-3.5 h-3.5 text-cipher-terracotta" />
                <span>Automaton State Diagram with Active Transition Highlighting:</span>
              </span>
              <span className="text-cipher-amber">
                {currentStep
                  ? `Active: ${currentStep.from_state} --('${currentStep.symbol}')--> ${currentStep.to_state}`
                  : `State: ${activeTrace.final_state}`}
              </span>
            </div>

            <AutomataGraphViewer
              graph={minDfaGraph}
              title={`${currentRegex} — Execution State Animation`}
              stageName="Live DFA Execution Simulation"
              highlightStateId={highlightedStateId}
              highlightTransition={highlightedTransition}
            />
          </div>

          {/* STEPPER CONTROLS & TAPE */}
          <div className="p-5 sm:p-6 rounded-2xl cipher-surface border border-cipher-border space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-cipher-border">
              <div className="flex items-center gap-3 font-mono text-xs">
                <span className="text-cipher-muted uppercase tracking-wider text-[11px]">Input Position:</span>
                <span className="text-cipher-terracotta font-bold">
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
                  className="px-3 py-1.5 rounded-lg bg-cipher-elevated border border-cipher-border text-cipher-muted hover:text-cipher-text hover:bg-[#201F1C] transition-all active:scale-95"
                >
                  Start
                </button>

                <button
                  type="button"
                  disabled={stepIndex <= 0}
                  onClick={() => setStepIndex((prev) => Math.max(0, prev - 1))}
                  className="p-1.5 rounded-lg bg-cipher-elevated border border-cipher-border text-cipher-muted hover:text-cipher-text hover:bg-[#201F1C] disabled:opacity-40 transition-all active:scale-95"
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
                      ? 'bg-cipher-amber/20 text-cipher-amber border-cipher-amber/40 shadow-sm'
                      : 'bg-cipher-terracotta/20 text-cipher-text border-cipher-terracotta/40 hover:bg-cipher-terracotta/30 shadow-sm'
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
                  className="p-1.5 rounded-lg bg-cipher-elevated border border-cipher-border text-cipher-muted hover:text-cipher-text hover:bg-[#201F1C] disabled:opacity-40 transition-all active:scale-95"
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
                  className="p-1.5 rounded-lg bg-cipher-elevated border border-cipher-border text-cipher-muted hover:text-cipher-text hover:bg-[#201F1C] transition-all active:scale-95"
                  title="Reset"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Input Character Tape */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-mono text-cipher-muted">Input Tape:</span>
              <div className="p-3 rounded-xl bg-cipher-elevated border border-cipher-border overflow-x-auto">
                {activeInputString.length === 0 ? (
                  <span className="text-xs text-cipher-muted font-mono italic">Empty input string</span>
                ) : (
                  <div className="flex items-center gap-1.5 font-mono text-xs">
                    {activeInputString.split('').map((char, idx) => {
                      const isCurrent = idx === stepIndex;
                      const isPast = idx < stepIndex;
                      return (
                        <div
                          key={idx}
                          className={`flex flex-col items-center justify-center min-w-[28px] h-11 rounded-lg border transition-all ${
                            isCurrent
                              ? 'bg-cipher-terracotta/25 border-cipher-terracotta text-cipher-text font-bold scale-105 shadow-md shadow-cipher-terracotta/20 ring-1 ring-cipher-terracotta/50'
                              : isPast
                              ? 'bg-cipher-surface border-cipher-border text-cipher-muted'
                              : 'bg-cipher-elevated/40 border-cipher-border/50 text-cipher-muted/40'
                          }`}
                        >
                          <span className="text-xs">{char}</span>
                          <span className="text-[9px] text-cipher-muted">{idx}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Step Explanation Card */}
            {currentStep && (
              <div className="p-4 rounded-xl bg-cipher-elevated border border-cipher-border space-y-2 font-mono text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-cipher-muted">
                    Pos {currentStep.position}: Input symbol{' '}
                    <strong className="text-cipher-terracotta font-bold">'{currentStep.char}'</strong>
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      currentStep.is_dead
                        ? 'bg-cipher-danger/20 text-cipher-danger border border-cipher-danger/30'
                        : 'bg-cipher-green/20 text-cipher-green border border-cipher-green/30'
                    }`}
                  >
                    {currentStep.is_dead ? 'TRAP / DEAD STATE' : 'DETERMINISTIC TRANSITION'}
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-cipher-surface text-cipher-text/90 font-sans leading-relaxed border border-cipher-border">
                  {currentStep.explanation}
                </div>
              </div>
            )}

            {/* Acceptance Outcome Card */}
            <div className="p-4 rounded-xl bg-cipher-elevated border border-cipher-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
              <div>
                <span className="text-cipher-muted block text-[10px] uppercase tracking-wider">
                  DFA Acceptance Outcome:
                </span>
                <span className="text-cipher-text font-bold">
                  Final State: {activeTrace.final_state} (
                  {activeTrace.is_accepted ? 'State ∈ Accepting Set F' : 'State ∉ Accepting Set F'}
                  )
                </span>
              </div>

              <div>
                {activeTrace.is_accepted ? (
                  <div className="px-3 py-1.5 rounded-lg bg-cipher-green/20 text-cipher-green border border-cipher-green/40 font-bold flex items-center gap-1.5 shadow-sm">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>ACCEPTED BY AUTOMATON</span>
                  </div>
                ) : (
                  <div className="px-3 py-1.5 rounded-lg bg-cipher-danger/20 text-cipher-danger border border-cipher-danger/40 font-bold flex items-center gap-1.5 shadow-sm">
                    <XCircle className="w-4 h-4" />
                    <span>REJECTED BY AUTOMATON</span>
                  </div>
                )}
              </div>
            </div>

            {/* MOC Academic Disclaimer */}
            <div className="p-3.5 rounded-xl bg-cipher-elevated/70 border border-cipher-border text-[11px] text-cipher-muted flex items-start gap-2.5 font-sans">
              <Info className="w-4 h-4 text-cipher-sage shrink-0 mt-0.5" />
              <p>
                <strong>Academic MOC Notice:</strong> An accepting state means the selected pattern matched the evaluated input string according to formal regular language theory. A single matched pattern contributes to the structural score, but does not independently prove the email is phishing.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
