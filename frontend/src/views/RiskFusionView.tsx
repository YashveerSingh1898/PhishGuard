import React from 'react';
import {
  Calculator,
  Scale,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Cpu,
  Brain,
  Info,
} from 'lucide-react';
import { DetectionResponse } from '../types';

interface RiskFusionViewProps {
  result: DetectionResponse | null;
}

export const RiskFusionView: React.FC<RiskFusionViewProps> = ({ result }) => {
  if (!result) {
    return (
      <div className="max-w-4xl mx-auto p-8 rounded-2xl bg-navy-900/40 border border-navy-800 text-center space-y-3">
        <Calculator className="w-8 h-8 text-slate-500 mx-auto" />
        <h3 className="text-base font-bold text-white font-sans">No Risk Fusion Analysis Available</h3>
        <p className="text-xs text-slate-400 font-mono">
          Submit an email in the "Analyze Email" section to evaluate dual-layer risk fusion.
        </p>
      </div>
    );
  }

  const isPhishing = result.verdict === 'Phishing';
  const isSuspicious = result.verdict === 'Suspicious';

  const verdictBadgeColor = isPhishing
    ? 'text-rose-400 bg-rose-500/10 border-rose-500/30'
    : isSuspicious
    ? 'text-amber-400 bg-amber-500/10 border-amber-500/30'
    : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';

  const verdictIcon = isPhishing ? (
    <ShieldAlert className="w-6 h-6 text-rose-400" />
  ) : isSuspicious ? (
    <AlertTriangle className="w-6 h-6 text-amber-400" />
  ) : (
    <ShieldCheck className="w-6 h-6 text-emerald-400" />
  );

  // Filter 2-3 concise reasons from real detection output
  const conciseReasons = result.reasons.slice(0, 3);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 1. Header Banner */}
      <div className="p-6 sm:p-7 rounded-2xl glass-card space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-gradient-to-br from-teal-500/20 to-cyan-500/10 text-teal-400 border border-teal-500/30 shadow-inner">
                <Scale className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white font-sans tracking-tight">
                  Dual-Layer Risk Fusion Engine
                </h2>
                <span className="text-[11px] text-teal-400 font-mono">
                  Calibrated Mathematical Synthesis
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Linear combination of structural automata verification (60%) and linguistic NLP classification (40%).
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-navy-950/80 border border-white/10">
              {verdictIcon}
            </div>
            <div>
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                Final Verdict:
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold border ${verdictBadgeColor}`}>
                {result.verdict} ({result.final_score.toFixed(1)}/100)
              </span>
            </div>
          </div>
        </div>

        {/* 2. Visual Formula Synthesis Card */}
        <div className="p-4 rounded-xl bg-navy-950/80 border border-white/5 space-y-3 font-mono">
          <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
            <Calculator className="w-3.5 h-3.5 text-teal-400" />
            <span>Mathematical Risk Fusion Formula:</span>
          </div>

          <div className="p-4 rounded-xl bg-navy-900/80 border border-white/5 flex flex-wrap items-center justify-between gap-3 text-xs">
            {/* Structural Component */}
            <div className="flex items-center gap-2.5">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <div>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Structural (60%)</span>
                <span className="text-cyan-300 font-bold">
                  0.6 × {result.structural_score.toFixed(1)}
                </span>
                <span className="text-slate-500 text-[10px] ml-1">
                  = {result.structural_contribution.toFixed(1)} pts
                </span>
              </div>
            </div>

            <span className="text-slate-500 text-base font-bold">+</span>

            {/* NLP Component */}
            <div className="flex items-center gap-2.5">
              <Brain className="w-4 h-4 text-emerald-400" />
              <div>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block">NLP Layer (40%)</span>
                <span className="text-emerald-300 font-bold">
                  0.4 × {result.nlp_score.toFixed(1)}
                </span>
                <span className="text-slate-500 text-[10px] ml-1">
                  = {result.nlp_contribution.toFixed(1)} pts
                </span>
              </div>
            </div>

            <span className="text-slate-500 text-base font-bold">=</span>

            {/* Final Outcome */}
            <div className="text-right">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Final Unified Score</span>
              <span
                className={`text-2xl font-extrabold ${
                  isPhishing
                    ? 'text-rose-400'
                    : isSuspicious
                    ? 'text-amber-400'
                    : 'text-emerald-400'
                }`}
              >
                {result.final_score.toFixed(1)}
              </span>
              <span className="text-[10px] text-slate-500"> / 100</span>
            </div>
          </div>
        </div>

        {/* 3. Clean Horizontal Score Bar with Threshold Markers */}
        <div className="p-4 rounded-xl bg-navy-950/80 border border-white/5 space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span className="tracking-wider uppercase text-[10px]">Calibrated Threat Scale:</span>
            <span className="font-bold text-white">
              Score: {result.final_score.toFixed(1)} / 100
            </span>
          </div>

          {/* Progress bar container */}
          <div className="relative w-full h-3.5 bg-navy-900 rounded-full overflow-hidden border border-white/5">
            {/* Score fill */}
            <div
              className={`h-full transition-all duration-700 ${
                isPhishing
                  ? 'bg-rose-500'
                  : isSuspicious
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, Math.max(0, result.final_score))}%` }}
            />
          </div>

          {/* Threshold markers */}
          <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
            <div
              className={`p-2.5 rounded-lg border transition-colors ${
                result.final_score < 35
                  ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300 font-bold'
                  : 'bg-navy-900/50 border-white/5 text-slate-500'
              }`}
            >
              Legitimate (&lt; 35.0)
            </div>
            <div
              className={`p-2.5 rounded-lg border transition-colors ${
                result.final_score >= 35 && result.final_score < 70
                  ? 'bg-amber-500/10 border-amber-500/40 text-amber-300 font-bold'
                  : 'bg-navy-900/50 border-white/5 text-slate-500'
              }`}
            >
              Suspicious (35.0 – 69.9)
            </div>
            <div
              className={`p-2.5 rounded-lg border transition-colors ${
                result.final_score >= 70
                  ? 'bg-rose-500/10 border-rose-500/40 text-rose-300 font-bold'
                  : 'bg-navy-900/50 border-white/5 text-slate-500'
              }`}
            >
              Phishing (≥ 70.0)
            </div>
          </div>
        </div>
      </div>

      {/* 4. Real Synthesis Decision Rationale */}
      <div className="p-6 sm:p-7 rounded-2xl glass-card space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-white/5 text-xs font-mono font-bold text-slate-200">
          <Info className="w-4 h-4 text-teal-400" />
          <span className="uppercase tracking-wider text-[11px]">Real Evaluation Output Rationale:</span>
        </div>

        <ul className="space-y-2 text-xs font-sans text-slate-300">
          {conciseReasons.map((reason, idx) => (
            <li key={idx} className="flex items-start gap-2.5 leading-relaxed">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 mt-1.5 shrink-0 shadow-sm shadow-teal-400/50" />
              <span>{reason}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* 5. Model Limitations Notice */}
      <div className="p-3.5 rounded-xl bg-navy-950/60 border border-white/5 text-[11px] text-slate-400 flex items-start gap-2.5 font-sans">
        <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <p>
          <strong className="text-amber-300 font-medium">Calibrated Policy Notice:</strong> Configured weights (60% structural, 40% NLP) prioritize formal automata-verified structural signals while mitigating single-point false positives through multi-signal Bayesian fusion.
        </p>
      </div>
    </div>
  );
};

