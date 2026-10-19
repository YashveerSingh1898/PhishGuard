import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Header,
  RegexInputPanel,
  PipelineProgress,
  AutomataGraphViewer,
  TransitionTable,
  ConversionTracePanel,
  StateComparisonCard,
  TheoryModal,
  DetectionScanner,
  DetectionResultsCard,
} from './components';
import {
  checkBackendHealth,
  convertRegex,
  analyzeThreat,
  AutomataApiError,
} from './services/api';
import {
  AutomataConvertResponse,
  DetectionRequest,
  DetectionResponse,
} from './types';
import { nfaToGraph, dfaToGraph, minDfaToGraph } from './automata';
import { GitFork, Cpu, Minimize2, ShieldAlert, Sparkles, Layers } from 'lucide-react';

const DEFAULT_PATTERN = '(a|b)*abb';

const DEFAULT_DETECTION_REQUEST: DetectionRequest = {
  sender: 'Security Team <security@paypal.com>',
  url: 'http://paypal-verification.xyz/update-banking-auth',
  subject: 'URGENT: Your account has been suspended',
  body: 'URGENT: Your account has been suspended due to suspicious activity. Verify your identity within 24 hours to prevent immediate closure.',
};

export default function App() {
  // Navigation View: 'scanner' (Dual-Layer Threat Detection) or 'automata' (MOC Graph Studio)
  const [activeView, setActiveView] = useState<'scanner' | 'automata'>('scanner');

  // --- Automata Studio State ---
  const [currentPattern, setCurrentPattern] = useState<string>(DEFAULT_PATTERN);
  const [isAutomataLoading, setIsAutomataLoading] = useState<boolean>(false);
  const [automataError, setAutomataError] = useState<AutomataApiError | Error | null>(null);
  const [automataData, setAutomataData] = useState<AutomataConvertResponse | null>(null);
  const [activeAutomataTab, setActiveAutomataTab] = useState<'nfa' | 'dfa' | 'minimized_dfa'>('nfa');

  // --- Threat Scanner State ---
  const [detectionRequest, setDetectionRequest] = useState<DetectionRequest>(DEFAULT_DETECTION_REQUEST);
  const [isDetecting, setIsDetecting] = useState<boolean>(false);
  const [detectionError, setDetectionError] = useState<string | null>(null);
  const [detectionResponse, setDetectionResponse] = useState<DetectionResponse | null>(null);

  // --- Backend Health & Modal State ---
  const [backendStatus, setBackendStatus] = useState<'checking' | 'healthy' | 'error'>('checking');
  const [backendVersion, setBackendVersion] = useState<string>('');
  const [isTheoryOpen, setIsTheoryOpen] = useState<boolean>(false);

  // Perform backend health check
  const handleCheckHealth = useCallback(async () => {
    setBackendStatus('checking');
    try {
      const res = await checkBackendHealth();
      setBackendStatus('healthy');
      setBackendVersion(res.version || 'v0.1.0-alpha');
      return true;
    } catch {
      setBackendStatus('error');
      return false;
    }
  }, []);

  // Automata conversion trigger
  const handleConvert = useCallback(async (pattern: string) => {
    setIsAutomataLoading(true);
    setAutomataError(null);
    try {
      const response = await convertRegex(pattern);
      setAutomataData(response);
    } catch (err: unknown) {
      setAutomataData(null);
      if (err instanceof AutomataApiError || err instanceof Error) {
        setAutomataError(err);
      } else {
        setAutomataError(new Error('An unexpected error occurred during automata conversion.'));
      }
    } finally {
      setIsAutomataLoading(false);
    }
  }, []);

  // Threat Detection analysis trigger
  const handleAnalyzeThreat = useCallback(async () => {
    setIsDetecting(true);
    setDetectionError(null);
    try {
      const response = await analyzeThreat(detectionRequest);
      setDetectionResponse(response);
    } catch (err: unknown) {
      setDetectionResponse(null);
      setDetectionError(
        err instanceof Error ? err.message : 'Threat detection analysis failed.'
      );
    } finally {
      setIsDetecting(false);
    }
  }, [detectionRequest]);

  // Initial load: verify health, pre-run detection and automata compilation
  useEffect(() => {
    let mounted = true;
    (async () => {
      const isHealthy = await handleCheckHealth();
      if (mounted && isHealthy) {
        handleConvert(DEFAULT_PATTERN);
        handleAnalyzeThreat();
      }
    })();
    return () => {
      mounted = false;
    };
  }, [handleCheckHealth, handleConvert, handleAnalyzeThreat]);

  // Reset to default
  const handleReset = () => {
    setDetectionRequest(DEFAULT_DETECTION_REQUEST);
    setDetectionError(null);
    setCurrentPattern(DEFAULT_PATTERN);
    setAutomataError(null);
    handleConvert(DEFAULT_PATTERN);
    handleAnalyzeThreat();
  };

  // Switch to Automata Studio and inspect a specific pattern
  const handleInspectAutomataPattern = (pattern: string) => {
    setCurrentPattern(pattern);
    handleConvert(pattern);
    setActiveView('automata');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Convert graphs based on active tab
  const activeGraph = useMemo(() => {
    if (!automataData) return { nodes: [], edges: [] };
    switch (activeAutomataTab) {
      case 'nfa':
        return nfaToGraph(automataData.nfa);
      case 'dfa':
        return dfaToGraph(automataData.dfa);
      case 'minimized_dfa':
        return minDfaToGraph(automataData.minimized_dfa);
    }
  }, [automataData, activeAutomataTab]);

  return (
    <div className="min-h-screen bg-navy-950 text-slate-100 flex flex-col justify-between selection:bg-teal-500/30 selection:text-teal-200">
      {/* 1. Header */}
      <Header
        backendStatus={backendStatus}
        backendVersion={backendVersion}
        onRefreshHealth={handleCheckHealth}
        onReset={handleReset}
        onOpenTheory={() => setIsTheoryOpen(true)}
      />

      {/* 2. Main Dashboard Layout */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex-1 w-full space-y-6">
        {/* Navigation Mode Switcher Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-navy-900/60 border border-navy-800 shadow-md">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-mono text-teal-400 flex items-center gap-1.5 font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Capstone Evaluation Workspace</span>
              </div>
              <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                {activeView === 'scanner'
                  ? 'Dual-Layer Threat Detection & Risk Fusion'
                  : 'Automata Theory & Formal Language Studio'}
              </h1>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex rounded-lg bg-navy-950 p-1 border border-navy-800 shrink-0">
            <button
              type="button"
              onClick={() => setActiveView('scanner')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs font-mono font-medium transition-all ${
                activeView === 'scanner'
                  ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <span>1. Threat Scanner (Fusion)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveView('automata')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs font-mono font-medium transition-all ${
                activeView === 'automata'
                  ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Cpu className="w-4 h-4 text-teal-400" />
              <span>2. Automata Studio (MOC)</span>
            </button>
          </div>
        </div>

        {/* --- VIEW 1: DUAL-LAYER THREAT SCANNER --- */}
        {activeView === 'scanner' && (
          <div className="space-y-6 animate-fade-in">
            {/* Threat Vector Input Form */}
            <DetectionScanner
              request={detectionRequest}
              onChange={(field, val) =>
                setDetectionRequest((prev) => ({ ...prev, [field]: val }))
              }
              onAnalyze={handleAnalyzeThreat}
              onReset={() =>
                setDetectionRequest({ sender: '', url: '', subject: '', body: '' })
              }
              isLoading={isDetecting}
            />

            {/* Error Message Callout */}
            {detectionError && (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                <strong>Detection Pipeline Error:</strong> {detectionError}
              </div>
            )}

            {/* Results Presentation Card */}
            {detectionResponse && (
              <DetectionResultsCard
                result={detectionResponse}
                onInspectAutomataPattern={handleInspectAutomataPattern}
              />
            )}
          </div>
        )}

        {/* --- VIEW 2: AUTOMATA THEORY STUDIO (MOC) --- */}
        {activeView === 'automata' && (
          <div className="space-y-6 animate-fade-in">
            {/* Regex Input Panel */}
            <RegexInputPanel
              currentPattern={currentPattern}
              onPatternChange={setCurrentPattern}
              onConvert={handleConvert}
              isLoading={isAutomataLoading}
              error={automataError}
              onClearError={() => setAutomataError(null)}
            />

            {/* Conversion Pipeline Progress */}
            <PipelineProgress
              data={automataData}
              activeTab={activeAutomataTab}
              onSelectTab={setActiveAutomataTab}
            />

            {/* Automata Visualization Tabs & Graph View */}
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-navy-800 pb-2">
                <div className="flex rounded-lg bg-navy-900 p-1 border border-navy-800">
                  <button
                    type="button"
                    onClick={() => setActiveAutomataTab('nfa')}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-mono font-medium transition-all ${
                      activeAutomataTab === 'nfa'
                        ? 'bg-teal-500/20 text-teal-300 shadow-sm border border-teal-500/30 font-semibold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <GitFork className="w-3.5 h-3.5 text-cyan-400" />
                    <span>1. Thompson ε-NFA</span>
                    {automataData && (
                      <span className="px-1.5 py-0.2 rounded bg-navy-950 text-[10px] text-slate-400">
                        {automataData.nfa.state_count}
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveAutomataTab('dfa')}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-mono font-medium transition-all ${
                      activeAutomataTab === 'dfa'
                        ? 'bg-teal-500/20 text-teal-300 shadow-sm border border-teal-500/30 font-semibold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Cpu className="w-3.5 h-3.5 text-teal-400" />
                    <span>2. Subset DFA</span>
                    {automataData && (
                      <span className="px-1.5 py-0.2 rounded bg-navy-950 text-[10px] text-slate-400">
                        {automataData.dfa.state_count}
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveAutomataTab('minimized_dfa')}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-mono font-medium transition-all ${
                      activeAutomataTab === 'minimized_dfa'
                        ? 'bg-teal-500/20 text-teal-300 shadow-sm border border-teal-500/30 font-semibold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Minimize2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>3. Minimized DFA</span>
                    {automataData && (
                      <span className="px-1.5 py-0.2 rounded bg-navy-950 text-[10px] text-emerald-400">
                        {automataData.minimized_dfa.state_count}
                      </span>
                    )}
                  </button>
                </div>

                {automataData && (
                  <div className="text-xs font-mono text-slate-400">
                    Alphabet: <span className="text-white font-bold">&#123;{automataData.alphabet.join(', ')}&#125;</span>
                  </div>
                )}
              </div>

              {/* Graph Viewer Component */}
              <AutomataGraphViewer
                graph={activeGraph}
                title={
                  activeAutomataTab === 'nfa'
                    ? "Thompson's Non-Deterministic Finite Automaton (ε-NFA)"
                    : activeAutomataTab === 'dfa'
                    ? 'Subset Construction Deterministic Finite Automaton (DFA)'
                    : 'Canonical Minimized Deterministic Finite Automaton (MinDFA)'
                }
                stageName={
                  activeAutomataTab === 'nfa'
                    ? 'Thompson Inductive Compilation'
                    : activeAutomataTab === 'dfa'
                    ? 'Powerset Subset Construction'
                    : 'Partition Refinement Minimization'
                }
              />
            </div>

            {/* State Complexity Comparison Card */}
            {automataData && (
              <StateComparisonCard
                nfaCount={automataData.nfa.state_count}
                dfaCount={automataData.dfa.state_count}
                minDfaCount={automataData.minimized_dfa.state_count}
                comparison={automataData.minimized_dfa.comparison}
              />
            )}

            {/* Conversion Trace Panel & Transition Tables */}
            {automataData && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ConversionTracePanel
                  subsetTrace={automataData.dfa.trace}
                  minimizationSteps={automataData.minimized_dfa.refinement_steps}
                  initialPartitions={automataData.minimized_dfa.initial_partitions}
                />

                <TransitionTable
                  transitions={
                    activeAutomataTab === 'nfa'
                      ? automataData.nfa.transitions
                      : activeAutomataTab === 'dfa'
                      ? automataData.dfa.transitions
                      : automataData.minimized_dfa.transitions
                  }
                  title={
                    activeAutomataTab === 'nfa'
                      ? 'NFA Transition Function (δ: Q × (Σ ∪ {ε}) → 2^Q)'
                      : activeAutomataTab === 'dfa'
                      ? 'DFA Transition Function (δ: Q × Σ → Q)'
                      : 'Minimized DFA Transition Function (δ: Q_min × Σ → Q_min)'
                  }
                  isNFA={activeAutomataTab === 'nfa'}
                />
              </div>
            )}
          </div>
        )}
      </main>

      {/* 3. Footer */}
      <footer className="border-t border-navy-800 py-6 bg-navy-950 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <span className="font-semibold text-slate-400">PhishGuard</span> • Academic Model of Computation Capstone Project
          </div>
          <div className="flex items-center space-x-4 font-mono text-[11px]">
            <span>FastAPI Backend</span>
            <span>•</span>
            <span>Deterministic Minimal DFA (0.6)</span>
            <span>•</span>
            <span>Naive Bayes NLP (0.4)</span>
          </div>
        </div>
      </footer>

      {/* 4. Theory & How It Works Modal */}
      <TheoryModal isOpen={isTheoryOpen} onClose={() => setIsTheoryOpen(false)} />
    </div>
  );
}
