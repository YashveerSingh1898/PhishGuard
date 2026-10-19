import React from 'react';
import {
  Shield,
  ArrowRight,
  Cpu,
  Calculator,
  ShieldAlert,
  Mail,
  CheckCircle2,
} from 'lucide-react';
import { DetectionResponse } from '../types';

interface OverviewViewProps {
  backendStatus: 'checking' | 'healthy' | 'error';
  backendVersion: string;
  recentAnalysis: DetectionResponse | null;
  onNavigateToAnalyze: () => void;
  onNavigateToAutomata: () => void;
  onNavigateToNLP: () => void;
  onNavigateToFusion: () => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  backendStatus,
  backendVersion,
  recentAnalysis,
  onNavigateToAnalyze,
  onNavigateToAutomata,
  onNavigateToNLP,
  onNavigateToFusion,
}) => {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 1. Header Banner */}
      <div className="p-6 sm:p-8 rounded-2xl glass-card space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-teal-500/20 to-cyan-500/10 border border-teal-500/30 text-teal-400 shadow-inner">
              <Shield className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white font-sans">
                PhishGuard
              </h1>
              <p className="text-xs text-slate-400 font-sans mt-0.5">
                Phishing Detection using Automata + NLP
              </p>
            </div>
          </div>

          {/* Backend Status Badge */}
          <div className="flex items-center gap-2">
            <div
              className={`px-3 py-1.5 rounded-full text-xs font-mono border flex items-center gap-2 ${
                backendStatus === 'healthy'
                  ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                  : backendStatus === 'checking'
                  ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                  : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  backendStatus === 'healthy'
                    ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50'
                    : backendStatus === 'checking'
                    ? 'bg-amber-400 animate-pulse'
                    : 'bg-rose-400'
                }`}
              />
              <span>
                Backend:{' '}
                {backendStatus === 'healthy'
                  ? `Connected (${backendVersion || 'v0.1.0'})`
                  : backendStatus === 'checking'
                  ? 'Connecting...'
                  : 'Disconnected'}
              </span>
            </div>
          </div>
        </div>

        {/* Primary Call to Action Button */}
        <div className="pt-1">
          <button
            type="button"
            onClick={onNavigateToAnalyze}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-teal-400 hover:from-teal-400 hover:to-teal-300 text-navy-950 font-bold text-xs font-mono transition-all shadow-lg shadow-teal-500/20 active:scale-95"
          >
            <Mail className="w-4 h-4" />
            <span>Analyze Email</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Compact Pipeline Progression Indicator */}
      <div className="p-4 rounded-xl glass-card space-y-2.5">
        <div className="text-[11px] font-mono uppercase text-slate-400 font-semibold tracking-wider">
          Pipeline Flow:
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          <div className="px-3 py-1.5 rounded-lg bg-navy-950/80 border border-white/5 text-slate-200 flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5 text-slate-400" />
            <span>Email</span>
          </div>
          <span className="text-slate-600">→</span>
          <div className="px-3 py-1.5 rounded-lg bg-navy-950/80 border border-teal-500/20 text-cyan-300 flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span>Automata + NLP</span>
          </div>
          <span className="text-slate-600">→</span>
          <div className="px-3 py-1.5 rounded-lg bg-navy-950/80 border border-white/5 text-teal-300 flex items-center gap-1.5">
            <Calculator className="w-3.5 h-3.5 text-teal-400" />
            <span>Risk Fusion</span>
          </div>
          <span className="text-slate-600">→</span>
          <div className="px-3 py-1.5 rounded-lg bg-navy-950/80 border border-teal-500/30 text-white font-bold flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            <span>Verdict</span>
          </div>
        </div>
      </div>

      {/* 3. Most Recent Analysis Summary (if real analysis exists) */}
      {recentAnalysis ? (
        <div className="p-6 rounded-2xl glass-card space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/5">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-400" />
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
                Most Recent Analysis Summary
              </h2>
            </div>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold border ${
                recentAnalysis.verdict === 'Phishing'
                  ? 'text-rose-400 bg-rose-500/10 border-rose-500/30'
                  : recentAnalysis.verdict === 'Suspicious'
                  ? 'text-amber-400 bg-amber-500/10 border-amber-500/30'
                  : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
              }`}
            >
              {recentAnalysis.verdict}
            </span>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
            <div className="p-3.5 rounded-xl bg-navy-950/80 border border-white/5">
              <span className="text-[10px] text-slate-500 uppercase block tracking-wider">Final Risk Score</span>
              <span
                className={`text-xl font-bold ${
                  recentAnalysis.final_score >= 70
                    ? 'text-rose-400'
                    : recentAnalysis.final_score >= 35
                    ? 'text-amber-400'
                    : 'text-emerald-400'
                }`}
              >
                {recentAnalysis.final_score.toFixed(1)}
              </span>
              <span className="text-[10px] text-slate-500"> / 100</span>
            </div>

            <div className="p-3.5 rounded-xl bg-navy-950/80 border border-white/5">
              <span className="text-[10px] text-slate-500 uppercase block tracking-wider">Structural Score</span>
              <span className="text-xl font-bold text-cyan-400">
                {recentAnalysis.structural_score.toFixed(1)}
              </span>
              <span className="text-[10px] text-slate-500"> (60% weight)</span>
            </div>

            <div className="p-3.5 rounded-xl bg-navy-950/80 border border-white/5">
              <span className="text-[10px] text-slate-500 uppercase block tracking-wider">NLP Score</span>
              <span className="text-xl font-bold text-emerald-400">
                {recentAnalysis.nlp_score.toFixed(1)}
              </span>
              <span className="text-[10px] text-slate-500"> (40% weight)</span>
            </div>

            <div className="p-3.5 rounded-xl bg-navy-950/80 border border-white/5">
              <span className="text-[10px] text-slate-500 uppercase block tracking-wider">Rules Matched</span>
              <span className="text-xl font-bold text-white">
                {recentAnalysis.matched_indicators.length}
              </span>
              <span className="text-[10px] text-slate-500"> indicator(s)</span>
            </div>
          </div>

          {/* Target Artifact Details */}
          <div className="p-3.5 rounded-xl bg-navy-950/80 border border-white/5 text-xs font-mono space-y-1">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Target Link Tested:</div>
            <code className="text-teal-300 font-bold break-all block">
              {recentAnalysis.input_summary.extracted_url || recentAnalysis.input_summary.url || 'N/A'}
            </code>
          </div>

          {/* Deep link actions */}
          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            <button
              type="button"
              onClick={onNavigateToAutomata}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 hover:bg-cyan-500/20 transition-all"
            >
              <span>Inspect in Automata Lab</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={onNavigateToNLP}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all"
            >
              <span>View NLP Details</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={onNavigateToFusion}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium text-teal-300 bg-teal-500/10 border border-teal-500/20 hover:bg-teal-500/20 transition-all"
            >
              <span>View Risk Fusion</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <div className="p-8 rounded-2xl glass-card border-dashed border-white/10 text-center space-y-2">
          <p className="text-xs text-slate-400 font-mono">
            No email analysis has been performed yet in this session.
          </p>
          <button
            type="button"
            onClick={onNavigateToAnalyze}
            className="text-xs font-mono text-teal-400 hover:text-teal-300 underline"
          >
            Submit an email to evaluate real-time automata and NLP results →
          </button>
        </div>
      )}
    </div>
  );
};
