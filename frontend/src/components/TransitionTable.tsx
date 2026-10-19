import React, { useState, useMemo } from 'react';
import { Table, Search, Filter } from 'lucide-react';
import { NFATransition, DFATransition } from '../types';

interface TransitionTableProps {
  transitions: (NFATransition | DFATransition)[];
  title: string;
  isNFA?: boolean;
}

export const TransitionTable: React.FC<TransitionTableProps> = ({
  transitions,
  title,
  isNFA = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSymbol, setSelectedSymbol] = useState<string>('all');

  // Extract unique symbols for filtering
  const uniqueSymbols = useMemo(() => {
    const syms = new Set<string>();
    transitions.forEach((t) => syms.add(t.symbol));
    return Array.from(syms).sort();
  }, [transitions]);

  // Filtered rows
  const filteredTransitions = useMemo(() => {
    return transitions.filter((t) => {
      const matchesSearch =
        searchQuery === '' ||
        t.from_state.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.to_state.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.symbol.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesSymbol = selectedSymbol === 'all' || t.symbol === selectedSymbol;

      return matchesSearch && matchesSymbol;
    });
  }, [transitions, searchQuery, selectedSymbol]);

  return (
    <div className="rounded-xl border border-navy-800 bg-navy-900/40 p-4 shadow-md flex flex-col h-full">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 pb-3 border-b border-navy-800">
        <div className="flex items-center gap-2">
          <Table className="w-4 h-4 text-teal-400" />
          <h3 className="text-sm font-semibold text-white">{title}</h3>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-navy-800 text-slate-400 border border-navy-700">
            {filteredTransitions.length} of {transitions.length} transitions
          </span>
        </div>

        {/* Filter bar */}
        <div className="flex items-center gap-2">
          {/* Symbol Filter */}
          <div className="flex items-center gap-1 text-xs">
            <Filter className="w-3 h-3 text-slate-500" />
            <select
              value={selectedSymbol}
              onChange={(e) => setSelectedSymbol(e.target.value)}
              className="bg-navy-950 text-slate-300 text-xs px-2 py-1 rounded border border-navy-750 focus:outline-none focus:border-teal-500 font-mono"
            >
              <option value="all">All Symbols</option>
              {uniqueSymbols.map((sym) => (
                <option key={sym} value={sym}>
                  {sym === 'ε' ? 'ε (Epsilon)' : `'${sym}'`}
                </option>
              ))}
            </select>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter states..."
              className="bg-navy-950 text-slate-200 text-xs pl-8 pr-2.5 py-1 rounded border border-navy-750 focus:outline-none focus:border-teal-500 placeholder:text-slate-500 font-mono w-28 sm:w-36"
            />
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto max-h-64 overflow-y-auto rounded-lg border border-navy-800 bg-navy-950/60">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-navy-900/90 text-slate-400 border-b border-navy-800 sticky top-0 z-10">
            <tr>
              <th className="py-2 px-3 font-semibold">#</th>
              <th className="py-2 px-3 font-semibold">Source State (q)</th>
              <th className="py-2 px-3 font-semibold">Input Symbol (a)</th>
              <th className="py-2 px-3 font-semibold">Destination State (δ)</th>
              <th className="py-2 px-3 font-semibold">Transition Type</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy-850 text-slate-300">
            {filteredTransitions.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-6 text-center text-slate-500">
                  No transitions match the current filter.
                </td>
              </tr>
            ) : (
              filteredTransitions.map((t, idx) => {
                const isEpsilon = isNFA && ('is_epsilon' in t ? t.is_epsilon : t.symbol === 'ε');

                return (
                  <tr key={idx} className="hover:bg-navy-850/50 transition-colors">
                    <td className="py-2 px-3 text-slate-500">{idx + 1}</td>
                    <td className="py-2 px-3 font-bold text-teal-300">{t.from_state}</td>
                    <td className="py-2 px-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded font-bold ${
                          isEpsilon
                            ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                            : 'bg-navy-800 text-white border border-navy-700'
                        }`}
                      >
                        {t.symbol}
                      </span>
                    </td>
                    <td className="py-2 px-3 font-bold text-teal-300">{t.to_state}</td>
                    <td className="py-2 px-3 text-[11px] text-slate-400">
                      {isEpsilon ? (
                        <span className="text-cyan-400">Spontaneous (ε-move)</span>
                      ) : (
                        <span className="text-slate-400">Deterministic symbol read</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
