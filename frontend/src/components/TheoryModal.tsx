import React from 'react';
import { X, BookOpen, GitFork, Cpu, Minimize2, ShieldCheck } from 'lucide-react';

interface TheoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TheoryModal: React.FC<TheoryModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-navy-900 border border-navy-750 rounded-2xl shadow-2xl overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-navy-900/95 backdrop-blur-md px-6 py-4 border-b border-navy-800 flex items-center justify-between z-10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-teal-500/10 text-teal-400 rounded-lg border border-teal-500/20">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">How It Works: Formal Language Foundations</h2>
              <p className="text-xs text-slate-400">Models of Computation (MOC) Compilation Pipeline</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-navy-800 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 text-sm text-slate-300">
          {/* Overview */}
          <div className="p-4 rounded-xl bg-navy-950 border border-navy-800">
            <h3 className="font-semibold text-white text-sm mb-1.5 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-teal-400" />
              <span>Academic Purpose &amp; Cybersecurity Application</span>
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              PhishGuard uses formal automata to detect phishing URL structures with mathematical guarantees.
              Unlike backtracking regex engines vulnerable to Regular Expression Denial of Service (ReDoS),
              a minimal DFA scans any input URL in guaranteed deterministic <strong className="text-teal-300">O(n)</strong> time,
              where <strong className="text-teal-300">n</strong> is the length of the string.
            </p>
          </div>

          {/* Stage 1: Thompson NFA */}
          <div className="flex gap-4 items-start">
            <div className="p-2.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shrink-0 mt-0.5">
              <GitFork className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">1. Thompson's Inductive ε-NFA Construction (1968)</h4>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                The regular expression AST is recursively transformed into a Non-Deterministic Finite Automaton
                with epsilon (ε) transitions. Each sub-expression yields an automaton fragment with strictly one
                start state and one accepting state. Alternation (<code className="text-teal-300 font-mono">|</code>) forks via ε-transitions,
                concatenation links fragments in series, and Kleene star (<code className="text-teal-300 font-mono">*</code>) introduces forward bypass and backward loop ε-transitions.
              </p>
            </div>
          </div>

          {/* Stage 2: Subset Construction */}
          <div className="flex gap-4 items-start">
            <div className="p-2.5 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20 shrink-0 mt-0.5">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">2. Powerset / Subset Construction (NFA → DFA)</h4>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Because an NFA can exist in multiple states simultaneously via ε-transitions, Subset Construction
                models each reachable state of the deterministic machine as a <em>set of NFA states</em> (a subset of the powerset).
                The start state is <code className="text-teal-300 font-mono">ε-closure(q0)</code>. For each discovered subset and alphabet symbol,
                it computes <code className="text-teal-300 font-mono">ε-closure(move(subset, symbol))</code> until no new subsets are discovered.
              </p>
            </div>
          </div>

          {/* Stage 3: DFA Minimization */}
          <div className="flex gap-4 items-start">
            <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0 mt-0.5">
              <Minimize2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">3. DFA Minimization via Partition Refinement (Moore / Myhill-Nerode)</h4>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                DFA Minimization creates the unique canonical minimal automaton by merging computationally equivalent states:
              </p>
              <ul className="list-disc list-inside text-xs text-slate-400 mt-2 space-y-1 font-mono">
                <li><span className="text-slate-300">Reachability Pruning:</span> Discards all states unreachable from the start state.</li>
                <li><span className="text-slate-300">Initial Partition:</span> Divides states into two blocks: non-accepting states and accepting states.</li>
                <li><span className="text-slate-300">Iterative Refinement:</span> Splits any partition group whose members transition to different groups on any alphabet symbol.</li>
                <li><span className="text-slate-300">Equivalence Classes:</span> Stops when partitions stabilize; each final partition group becomes a single state in the minimal DFA.</li>
              </ul>
            </div>
          </div>

          {/* Academic Verification Checklist */}
          <div className="p-4 rounded-xl bg-navy-950/70 border border-navy-800 text-xs font-mono text-slate-400">
            <div className="font-semibold text-white mb-2">Demonstration Checklist for Professor:</div>
            <ol className="list-decimal list-inside space-y-1 text-slate-300">
              <li>Enter sample <code className="text-teal-300">(a|b)*abb</code> and click Convert.</li>
              <li>Observe Thompson's NFA layout with explicit ε-transitions and start/accept indicators.</li>
              <li>Switch to Subset DFA to inspect powerset identifiers (<code className="text-teal-300">D0, D1...</code>) and their NFA subset mapping.</li>
              <li>Advance step-by-step through the Subset Construction trace.</li>
              <li>Inspect the Minimized DFA and confirm equivalent state merging and partition refinement history.</li>
            </ol>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-navy-950/90 border-t border-navy-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-medium bg-teal-500 hover:bg-teal-400 text-navy-950 font-semibold transition-colors"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
