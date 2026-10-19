import React from 'react';
import { ArrowRight, CheckCircle2, Binary, GitFork, Cpu, Minimize2 } from 'lucide-react';
import { AutomataConvertResponse } from '../types';

interface PipelineProgressProps {
  data: AutomataConvertResponse | null;
  activeTab: 'nfa' | 'dfa' | 'minimized_dfa';
  onSelectTab: (tab: 'nfa' | 'dfa' | 'minimized_dfa') => void;
}

export const PipelineProgress: React.FC<PipelineProgressProps> = ({
  data,
  activeTab,
  onSelectTab,
}) => {
  const steps = [
    {
      id: 'regex',
      title: 'Regex Pattern',
      desc: data ? `/${data.regex}/` : 'Input Pattern',
      icon: Binary,
      badge: data ? `Alphabet: {${data.alphabet.join(', ')}}` : 'Formal Syntax',
      clickable: false,
    },
    {
      id: 'nfa',
      title: 'Thompson NFA',
      desc: data ? `${data.nfa.state_count} States, ${data.nfa.transition_count} Transitions` : 'Inductive ε-Construction',
      icon: GitFork,
      badge: 'Non-Deterministic',
      clickable: true,
      tab: 'nfa' as const,
    },
    {
      id: 'dfa',
      title: 'Subset DFA',
      desc: data ? `${data.dfa.state_count} States, ${data.dfa.transition_count} Transitions` : 'Powerset Construction',
      icon: Cpu,
      badge: 'Deterministic',
      clickable: true,
      tab: 'dfa' as const,
    },
    {
      id: 'minimized_dfa',
      title: 'Minimized DFA',
      desc: data
        ? `${data.minimized_dfa.state_count} States (${data.minimized_dfa.comparison.reduction_count > 0 ? `-${data.minimized_dfa.comparison.reduction_count}` : '0'} reduction)`
        : 'Partition Refinement',
      icon: Minimize2,
      badge: 'Canonical Minimal',
      clickable: true,
      tab: 'minimized_dfa' as const,
    },
  ];

  return (
    <div className="rounded-xl border border-navy-800 bg-navy-900/40 p-4 shadow-md">
      <div className="text-xs font-mono text-slate-400 mb-3 flex items-center justify-between">
        <span className="flex items-center gap-1.5 font-semibold text-slate-300">
          <span>Formal Conversion Pipeline:</span>
        </span>
        {data && (
          <span className="text-teal-400 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Compilation Complete</span>
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {steps.map((step, idx) => {
          const isSelected = step.clickable && step.tab === activeTab;
          const Icon = step.icon;

          return (
            <div
              key={step.id}
              onClick={() => {
                if (step.clickable && step.tab) {
                  onSelectTab(step.tab);
                }
              }}
              className={`p-3.5 rounded-lg border transition-all relative ${
                step.clickable ? 'cursor-pointer' : 'cursor-default'
              } ${
                isSelected
                  ? 'bg-navy-850 border-teal-500/70 shadow-md ring-1 ring-teal-500/30'
                  : 'bg-navy-950/60 border-navy-800 hover:border-navy-700'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div
                  className={`p-2 rounded-md ${
                    isSelected
                      ? 'bg-teal-500/20 text-teal-300'
                      : 'bg-navy-900 text-slate-400'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-navy-900 text-slate-400 border border-navy-800">
                  Step {idx + 1}
                </span>
              </div>

              <div className="font-semibold text-sm text-white">{step.title}</div>
              <div className="text-xs text-slate-400 font-mono mt-0.5 truncate" title={step.desc}>
                {step.desc}
              </div>

              <div className="mt-2.5 pt-2 border-t border-navy-850 flex items-center justify-between text-[11px] font-mono text-slate-500">
                <span className="text-teal-400/90">{step.badge}</span>
                {idx < steps.length - 1 && (
                  <ArrowRight className="w-3.5 h-3.5 text-navy-700 hidden lg:block absolute -right-2 top-1/2 -translate-y-1/2 z-10" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
