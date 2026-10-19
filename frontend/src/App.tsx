import React from 'react';
import { Shield, GitCommit, Cpu, Binary, Brain, Layers } from 'lucide-react';

export default function App() {
  return (
    <div className="min-h-screen bg-navy-950 text-slate-100 flex flex-col justify-between">
      {/* Navigation / Header */}
      <header className="border-b border-navy-800 bg-navy-900/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-cyber-teal/10 border border-cyber-teal/30 rounded-lg text-cyber-teal">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <span className="font-semibold text-lg tracking-tight text-white">PhishGuard</span>
              <span className="text-xs text-slate-400 ml-2 hidden sm:inline-block">
                Automata Theory &amp; NLP Phishing Detection
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
              Phase 1: Project Scaffolding
            </span>
          </div>
        </div>
      </header>

      {/* Main Scaffold Display */}
      <main className="max-w-6xl mx-auto px-6 py-12 flex-1 w-full">
        {/* Academic Project Banner */}
        <div className="rounded-xl border border-navy-800 bg-navy-900/40 p-8 mb-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 text-xs font-mono text-cyber-teal mb-3">
              <Binary className="w-4 h-4" />
              <span>Model of Computation (MOC) Capstone Project</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white mb-3">
              Dual-Layer Phishing Threat Analysis
            </h1>
            <p className="text-slate-300 text-sm leading-relaxed mb-6">
              PhishGuard demonstrates the practical application of formal language theory combined with
              statistical NLP. High-speed structural parsing is guaranteed via minimal Deterministic Finite
              Automata (DFA), while message bodies are evaluated through tokenized Naive Bayes classification.
            </p>

            <div className="flex flex-wrap gap-3 text-xs font-mono">
              <div className="px-3 py-1.5 rounded-md bg-navy-850 border border-navy-750 text-slate-300">
                Decision: <span className="text-cyber-teal font-semibold">0.6 × Structural + 0.4 × NLP</span>
              </div>
              <div className="px-3 py-1.5 rounded-md bg-navy-850 border border-navy-750 text-slate-300">
                Pipeline: <span className="text-slate-200">RegEx → NFA → DFA → MinDFA</span>
              </div>
            </div>
          </div>
        </div>

        {/* Phase Overview Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="rounded-xl border border-navy-800 bg-navy-900/30 p-6">
            <div className="p-2.5 bg-sky-500/10 border border-sky-500/20 rounded-lg text-sky-400 w-fit mb-4">
              <Cpu className="w-5 h-5" />
            </div>
            <h2 className="text-base font-semibold text-white mb-2">Automata Theory Layer</h2>
            <p className="text-slate-400 text-xs leading-relaxed mb-4">
              Regular expression conversion to ε-NFA (Thompson), transformation to DFA (Subset Construction),
              and reduction via equivalence partitioning to Minimal DFA.
            </p>
            <div className="text-[11px] font-mono text-slate-500">Status: Structure Ready (Phase 2 Implementation)</div>
          </div>

          <div className="rounded-xl border border-navy-800 bg-navy-900/30 p-6">
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 w-fit mb-4">
              <Brain className="w-5 h-5" />
            </div>
            <h2 className="text-base font-semibold text-white mb-2">Linguistic NLP Layer</h2>
            <p className="text-slate-400 text-xs leading-relaxed mb-4">
              Text preprocessing, lexical tokenization, stopword exclusion, TF-IDF feature extraction,
              and Multinomial Naive Bayes posterior probability scoring.
            </p>
            <div className="text-[11px] font-mono text-slate-500">Status: Structure Ready (Phase 2 Implementation)</div>
          </div>

          <div className="rounded-xl border border-navy-800 bg-navy-900/30 p-6">
            <div className="p-2.5 bg-cyber-teal/10 border border-cyber-teal/20 rounded-lg text-cyber-teal w-fit mb-4">
              <Layers className="w-5 h-5" />
            </div>
            <h2 className="text-base font-semibold text-white mb-2">Risk Fusion &amp; Verdicts</h2>
            <p className="text-slate-400 text-xs leading-relaxed mb-4">
              Weighted risk synthesis producing explainable classification across three discrete tiers:
              Legitimate (&lt;0.35), Suspicious (0.35–0.70), and Phishing (&gt;0.70).
            </p>
            <div className="text-[11px] font-mono text-slate-500">Status: Structure Ready (Phase 2 Implementation)</div>
          </div>
        </div>

        {/* Scaffolding Verification Card */}
        <div className="rounded-xl border border-navy-800 bg-navy-900/20 p-6">
          <div className="flex items-center gap-2 mb-4">
            <GitCommit className="w-4 h-4 text-cyber-teal" />
            <h3 className="text-sm font-semibold text-white">Scaffolding Verification</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-300 font-mono">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>FastAPI Backend Shell: Configured</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>React + Vite + TS Pipeline: Configured</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>Automata &amp; NLP Modules: Outlined</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>Dark Cybersecurity Design System: Ready</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-navy-800 py-6 text-center text-xs text-slate-500">
        PhishGuard • Academic Model of Computation Project • Under Active Development
      </footer>
    </div>
  );
}
