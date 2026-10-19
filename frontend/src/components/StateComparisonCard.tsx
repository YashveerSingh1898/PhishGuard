import React from 'react';
import { GitFork, Cpu, Minimize2, TrendingDown, MinusCircle, CheckCircle2 } from 'lucide-react';
import { MinimizationComparison } from '../types';

interface StateComparisonCardProps {
  nfaCount: number;
  dfaCount: number;
  minDfaCount: number;
  comparison: MinimizationComparison;
}

export const StateComparisonCard: React.FC<StateComparisonCardProps> = ({
  nfaCount,
  dfaCount,
  minDfaCount,
  comparison,
}) => {
  return (
    <div className="rounded-xl border border-navy-800 bg-navy-900/50 p-5 shadow-lg">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-navy-800">
        <div>
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <Minimize2 className="w-4 h-4 text-teal-400" />
            <span>State Complexity &amp; Minimization Comparison</span>
          </h3>
          <p className="text-xs text-slate-400">
            Real state counts and equivalence reduction reported by the backend engine.
          </p>
        </div>

        {/* Reduction Status Badge */}
        {comparison.is_reduced ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <TrendingDown className="w-3.5 h-3.5" />
            <span>Reduced by {comparison.reduction_count} States ({comparison.reduction_percentage}%)</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/20">
            <MinusCircle className="w-3.5 h-3.5" />
            <span>DFA was Already Minimal (0 Reductions)</span>
          </span>
        )}
      </div>

      {/* Grid of 4 cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Thompson NFA */}
        <div className="p-3.5 rounded-lg bg-navy-950 border border-navy-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Thompson ε-NFA</span>
            <GitFork className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold font-mono text-white">{nfaCount}</span>
            <span className="text-xs text-slate-500 font-mono">states</span>
          </div>
          <div className="text-[10px] font-mono text-slate-500 mt-2">
            Includes inductive intermediate &amp; ε-states
          </div>
        </div>

        {/* Card 2: Subset DFA */}
        <div className="p-3.5 rounded-lg bg-navy-950 border border-navy-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Subset DFA</span>
            <Cpu className="w-4 h-4 text-teal-400" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold font-mono text-white">{dfaCount}</span>
            <span className="text-xs text-slate-500 font-mono">states</span>
          </div>
          <div className="text-[10px] font-mono text-slate-500 mt-2">
            Powerset construction reachable subsets
          </div>
        </div>

        {/* Card 3: Minimized DFA */}
        <div className="p-3.5 rounded-lg bg-navy-950 border border-navy-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Minimized DFA</span>
            <Minimize2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold font-mono text-emerald-300">{minDfaCount}</span>
            <span className="text-xs text-slate-500 font-mono">states</span>
          </div>
          <div className="text-[10px] font-mono text-slate-500 mt-2">
            Myhill-Nerode canonical minimum states
          </div>
        </div>

        {/* Card 4: Algorithmic Efficiency */}
        <div className="p-3.5 rounded-lg bg-navy-950 border border-navy-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Equivalence Reduction</span>
            <CheckCircle2 className="w-4 h-4 text-teal-400" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold font-mono text-teal-300">
              {comparison.is_reduced ? `-${comparison.reduction_count}` : '0'}
            </span>
            <span className="text-xs text-slate-500 font-mono">
              ({comparison.reduction_percentage}%)
            </span>
          </div>
          <div className="text-[10px] font-mono text-slate-500 mt-2">
            {comparison.is_reduced
              ? 'Equivalent DFA states merged successfully'
              : 'Strictly distinguishable partitions preserved'}
          </div>
        </div>
      </div>
    </div>
  );
};
