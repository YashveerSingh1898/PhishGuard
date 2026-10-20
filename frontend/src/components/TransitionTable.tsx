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
    <div className="rounded-xl border border-cipher-border cipher-surface p-4 shadow-md flex flex-col h-full">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 pb-3 border-b border-cipher-border">
        <div className="flex items-center gap-2">
          <Table className="w-4 h-4 text-cipher-sage" />
          <h3 className="text-sm font-semibold text-cipher-text font-sans">{title}</h3>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-cipher-elevated text-cipher-muted border border-cipher-border">
            {filteredTransitions.length} of {transitions.length} transitions
          </span>
        </div>

        {/* Filter bar */}
        <div className="flex items-center gap-2">
          {/* Symbol Filter */}
          <div className="flex items-center gap-1 text-xs font-mono">
            <Filter className="w-3 h-3 text-cipher-muted" />
            <select
              value={selectedSymbol}
              onChange={(e) => setSelectedSymbol(e.target.value)}
              className="bg-cipher-elevated text-cipher-text text-xs px-2 py-1 rounded-lg border border-cipher-border focus:outline-none focus:border-cipher-terracotta font-mono"
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
            <Search className="w-3.5 h-3.5 text-cipher-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter states..."
              className="bg-cipher-elevated text-cipher-text text-xs pl-8 pr-2.5 py-1 rounded-lg border border-cipher-border focus:outline-none focus:border-cipher-terracotta placeholder:text-cipher-muted font-mono w-28 sm:w-36"
            />
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto max-h-64 overflow-y-auto rounded-lg border border-cipher-border bg-cipher-elevated/40">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-cipher-elevated text-cipher-muted border-b border-cipher-border sticky top-0 z-10">
            <tr>
              <th className="py-2 px-3 font-semibold">#</th>
              <th className="py-2 px-3 font-semibold">Source State (q)</th>
              <th className="py-2 px-3 font-semibold">Input Symbol (a)</th>
              <th className="py-2 px-3 font-semibold">Destination State (δ)</th>
              <th className="py-2 px-3 font-semibold">Transition Type</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-cipher-border text-cipher-text/90">
            {filteredTransitions.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-6 text-center text-cipher-muted">
                  No transitions match the current filter.
                </td>
              </tr>
            ) : (
              filteredTransitions.map((t, idx) => {
                const isEpsilon = isNFA && ('is_epsilon' in t ? t.is_epsilon : t.symbol === 'ε');

                return (
                  <tr key={idx} className="hover:bg-cipher-elevated/60 transition-colors">
                    <td className="py-2 px-3 text-cipher-muted">{idx + 1}</td>
                    <td className="py-2 px-3 font-bold text-cipher-terracotta">{t.from_state}</td>
                    <td className="py-2 px-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded font-bold ${
                          isEpsilon
                            ? 'bg-cipher-sage/15 text-cipher-sage border border-cipher-sage/30'
                            : 'bg-cipher-surface text-cipher-text border border-cipher-border'
                        }`}
                      >
                        {t.symbol}
                      </span>
                    </td>
                    <td className="py-2 px-3 font-bold text-cipher-terracotta">{t.to_state}</td>
                    <td className="py-2 px-3 text-[11px] text-cipher-muted">
                      {isEpsilon ? (
                        <span className="text-cipher-sage">Spontaneous (ε-move)</span>
                      ) : (
                        <span className="text-cipher-muted">Deterministic symbol read</span>
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
