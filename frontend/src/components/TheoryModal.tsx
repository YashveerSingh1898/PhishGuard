import React from 'react';
import { X, BookOpen, GitFork, Cpu, Minimize2, ShieldCheck } from 'lucide-react';

interface TheoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TheoryModal: React.FC<TheoryModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#060504]/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-3xl max-h-[90vh] cipher-surface border border-cipher-border rounded-2xl shadow-2xl overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-cipher-surface/95 backdrop-blur-md px-6 py-4 border-b border-cipher-border flex items-center justify-between z-10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-cipher-terracotta/10 text-cipher-terracotta rounded-xl border border-cipher-terracotta/30">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-cipher-text font-sans">Formal Language Theory Foundations</h2>
              <p className="text-xs text-cipher-muted font-sans">Models of Computation (MOC) Compilation Pipeline</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-cipher-muted hover:text-cipher-text hover:bg-cipher-elevated transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 text-sm text-cipher-text">
          {/* Overview */}
          <div className="p-4 rounded-xl bg-cipher-elevated border border-cipher-border">
            <h3 className="font-semibold text-cipher-text text-sm mb-1.5 flex items-center gap-2 font-sans">
              <ShieldCheck className="w-4 h-4 text-cipher-sage" />
              <span>Academic Purpose &amp; Cybersecurity Application</span>
            </h3>
            <p className="text-xs text-cipher-muted leading-relaxed font-sans">
              PhishGuard uses formal automata to detect phishing URL structures with mathematical guarantees.
              Unlike backtracking regex engines vulnerable to Regular Expression Denial of Service (ReDoS),
              a minimal DFA scans any input URL in guaranteed deterministic <strong className="text-cipher-sage font-mono">O(n)</strong> time,
              where <strong className="text-cipher-sage font-mono">n</strong> is the length of the string.
            </p>
          </div>

          {/* Stage 1: Thompson NFA */}
          <div className="flex gap-4 items-start">
            <div className="p-2.5 rounded-xl bg-cipher-sage/15 text-cipher-sage border border-cipher-sage/30 shrink-0 mt-0.5">
              <GitFork className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-cipher-text text-sm font-sans">1. Thompson's Inductive ε-NFA Construction (1968)</h4>
              <p className="text-xs text-cipher-muted mt-1 leading-relaxed font-sans">
                The regular expression AST is recursively transformed into a Non-Deterministic Finite Automaton
                with epsilon (ε) transitions. Each sub-expression yields an automaton fragment with strictly one
                start state and one accepting state. Alternation (<code className="text-cipher-terracotta font-mono">|</code>) forks via ε-transitions,
                concatenation links fragments in series, and Kleene star (<code className="text-cipher-terracotta font-mono">*</code>) introduces forward bypass and backward loop ε-transitions.
              </p>
            </div>
          </div>

          {/* Stage 2: Subset Construction */}
          <div className="flex gap-4 items-start">
            <div className="p-2.5 rounded-xl bg-cipher-terracotta/15 text-cipher-terracotta border border-cipher-terracotta/30 shrink-0 mt-0.5">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-cipher-text text-sm font-sans">2. Powerset / Subset Construction (NFA &rarr; DFA)</h4>
              <p className="text-xs text-cipher-muted mt-1 leading-relaxed font-sans">
                Because an NFA can exist in multiple states simultaneously via ε-transitions, Subset Construction
                models each reachable state of the deterministic machine as a <em>set of NFA states</em> (a subset of the powerset).
                The start state is <code className="text-cipher-terracotta font-mono">ε-closure(q0)</code>. For each discovered subset and alphabet symbol,
                it computes <code className="text-cipher-terracotta font-mono">ε-closure(move(subset, symbol))</code> until no new subsets are discovered.
              </p>
            </div>
          </div>

          {/* Stage 3: DFA Minimization */}
          <div className="flex gap-4 items-start">
            <div className="p-2.5 rounded-xl bg-cipher-sage/15 text-cipher-sage border border-cipher-sage/30 shrink-0 mt-0.5">
              <Minimize2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-cipher-text text-sm font-sans">3. DFA Minimization via Partition Refinement (Moore / Myhill-Nerode)</h4>
              <p className="text-xs text-cipher-muted mt-1 leading-relaxed font-sans">
                DFA Minimization creates the unique canonical minimal automaton by merging computationally equivalent states:
              </p>
              <ul className="list-disc list-inside text-xs text-cipher-muted mt-2 space-y-1 font-mono">
                <li><span className="text-cipher-text font-sans">Reachability Pruning:</span> Discards all states unreachable from the start state.</li>
                <li><span className="text-cipher-text font-sans">Initial Partition:</span> Divides states into two blocks: non-accepting states and accepting states.</li>
                <li><span className="text-cipher-text font-sans">Iterative Refinement:</span> Splits any partition group whose members transition to different groups on any alphabet symbol.</li>
                <li><span className="text-cipher-text font-sans">Equivalence Classes:</span> Stops when partitions stabilize; each final partition group becomes a single state in the minimal DFA.</li>
              </ul>
            </div>
          </div>

          {/* Academic Verification Checklist */}
          <div className="p-4 rounded-xl bg-cipher-elevated border border-cipher-border text-xs font-mono text-cipher-muted">
            <div className="font-semibold text-cipher-text mb-2 font-sans">Demonstration Checklist for Professor:</div>
            <ol className="list-decimal list-inside space-y-1 text-cipher-text/90">
              <li>Enter sample <code className="text-cipher-terracotta font-bold">(a|b)*abb</code> and click Compile.</li>
              <li>Observe Thompson's NFA layout with explicit ε-transitions and start/accept indicators.</li>
              <li>Switch to Subset DFA to inspect powerset identifiers (<code className="text-cipher-sage font-bold">D0, D1...</code>) and their NFA subset mapping.</li>
              <li>Advance step-by-step through the Subset Construction trace.</li>
              <li>Inspect the Minimized DFA and confirm equivalent state merging and partition refinement history.</li>
            </ol>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-cipher-elevated border-t border-cipher-border flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-mono bg-cipher-terracotta hover:bg-[#C85331] text-cipher-text font-bold transition-all shadow-md shadow-cipher-terracotta/20 active:scale-95"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
