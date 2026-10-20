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
      <div className="cipher-surface rounded-2xl border border-dashed border-cipher-border p-8 text-center space-y-3">
        <Calculator className="w-8 h-8 text-cipher-muted mx-auto" />
        <h3 className="text-base font-bold text-cipher-text font-sans">No Risk Fusion Analysis Available</h3>
        <p className="text-xs text-cipher-muted font-mono">
          Submit an email in the "Analyze Email" section to evaluate dual-layer risk fusion.
        </p>
      </div>
    );
  }

  const isPhishing = result.verdict === 'Phishing';
  const isSuspicious = result.verdict === 'Suspicious';

  const verdictBadgeColor = isPhishing
    ? 'text-cipher-danger bg-cipher-danger/10 border-cipher-danger/30'
    : isSuspicious
    ? 'text-cipher-amber bg-cipher-amber/10 border-cipher-amber/30'
    : 'text-cipher-green bg-cipher-green/10 border-cipher-green/30';

  const verdictIcon = isPhishing ? (
    <ShieldAlert className="w-6 h-6 text-cipher-danger" />
  ) : isSuspicious ? (
    <AlertTriangle className="w-6 h-6 text-cipher-amber" />
  ) : (
    <ShieldCheck className="w-6 h-6 text-cipher-green" />
  );

  // Filter 2-3 concise reasons from real detection output
  const conciseReasons = result.reasons.slice(0, 3);

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="cipher-surface rounded-2xl border border-cipher-border p-6 sm:p-7 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-cipher-border">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-cipher-terracotta/10 text-cipher-terracotta border border-cipher-terracotta/30 shadow-inner">
                <Scale className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-cipher-text font-sans tracking-tight">
                  Dual-Layer Risk Fusion Engine
                </h2>
                <span className="text-[11px] text-cipher-sage font-mono">
                  Calibrated Mathematical Synthesis
                </span>
              </div>
            </div>
            <p className="text-xs text-cipher-muted mt-1 font-sans">
              Linear combination of structural automata verification (60%) and linguistic NLP classification (40%).
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cipher-elevated border border-cipher-border">
              {verdictIcon}
            </div>
            <div>
              <span className="text-[10px] font-mono text-cipher-muted uppercase tracking-wider block">
                Final Verdict:
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold border ${verdictBadgeColor}`}>
                {result.verdict} ({result.final_score.toFixed(1)}/100)
              </span>
            </div>
          </div>
        </div>

        {/* 2. Visual Formula Synthesis Card */}
        <div className="p-4 rounded-xl bg-cipher-elevated border border-cipher-border space-y-3 font-mono">
          <div className="text-[11px] text-cipher-muted font-semibold uppercase tracking-wider flex items-center gap-1.5">
            <Calculator className="w-3.5 h-3.5 text-cipher-terracotta" />
            <span>Mathematical Risk Fusion Formula:</span>
          </div>

          <div className="p-4 rounded-xl bg-cipher-surface border border-cipher-border flex flex-wrap items-center justify-between gap-3 text-xs">
            {/* Structural Component (60%) */}
            <div className="flex items-center gap-2.5">
              <Cpu className="w-4 h-4 text-cipher-sage" />
              <div>
                <span className="text-[10px] text-cipher-muted uppercase tracking-wider block">Structural Score (60%)</span>
                <span className="text-cipher-sage font-bold">
                  0.6 &times; {result.structural_score.toFixed(1)}
                </span>
                <span className="text-cipher-muted text-[10px] ml-1">
                  = {result.structural_contribution.toFixed(1)} pts
                </span>
              </div>
            </div>

            <span className="text-cipher-border text-base font-bold">+</span>

            {/* NLP Component (40%) */}
            <div className="flex items-center gap-2.5">
              <Brain className="w-4 h-4 text-cipher-terracotta" />
              <div>
                <span className="text-[10px] text-cipher-muted uppercase tracking-wider block">NLP Layer (40%)</span>
                <span className="text-cipher-terracotta font-bold">
                  0.4 &times; {result.nlp_score.toFixed(1)}
                </span>
                <span className="text-cipher-muted text-[10px] ml-1">
                  = {result.nlp_contribution.toFixed(1)} pts
                </span>
              </div>
            </div>

            <span className="text-cipher-border text-base font-bold">=</span>

            {/* Final Outcome */}
            <div className="text-right">
              <span className="text-[10px] text-cipher-muted uppercase tracking-wider block">Final Unified Score</span>
              <span
                className={`text-2xl font-extrabold ${
                  isPhishing
                    ? 'text-cipher-danger'
                    : isSuspicious
                    ? 'text-cipher-amber'
                    : 'text-cipher-green'
                }`}
              >
                {result.final_score.toFixed(1)}
              </span>
              <span className="text-[10px] text-cipher-muted"> / 100</span>
            </div>
          </div>
        </div>

        {/* 3. Clean Horizontal Score Bar with Calibrated Scale */}
        <div className="p-4 rounded-xl bg-cipher-elevated border border-cipher-border space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between text-[11px] text-cipher-muted">
            <span className="tracking-wider uppercase text-[10px]">Calibrated Threat Scale:</span>
            <span className="font-bold text-cipher-text">
              Score: {result.final_score.toFixed(1)} / 100
            </span>
          </div>

          {/* Progress bar container */}
          <div className="relative w-full h-3.5 bg-cipher-surface rounded-full overflow-hidden border border-cipher-border">
            {/* Score fill */}
            <div
              className={`h-full transition-all duration-700 ${
                isPhishing
                  ? 'bg-cipher-danger'
                  : isSuspicious
                  ? 'bg-cipher-amber'
                  : 'bg-cipher-green'
              }`}
              style={{ width: `${Math.min(100, Math.max(0, result.final_score))}%` }}
            />
          </div>

          {/* Threshold markers */}
          <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
            <div
              className={`p-2.5 rounded-lg border transition-colors ${
                result.final_score < 35
                  ? 'bg-cipher-green/10 border-cipher-green/40 text-cipher-green font-bold'
                  : 'bg-cipher-surface border-cipher-border text-cipher-muted'
              }`}
            >
              Legitimate (&lt; 35.0)
            </div>
            <div
              className={`p-2.5 rounded-lg border transition-colors ${
                result.final_score >= 35 && result.final_score < 70
                  ? 'bg-cipher-amber/10 border-cipher-amber/40 text-cipher-amber font-bold'
                  : 'bg-cipher-surface border-cipher-border text-cipher-muted'
              }`}
            >
              Suspicious (35.0 – 69.9)
            </div>
            <div
              className={`p-2.5 rounded-lg border transition-colors ${
                result.final_score >= 70
                  ? 'bg-cipher-danger/10 border-cipher-danger/40 text-cipher-danger font-bold'
                  : 'bg-cipher-surface border-cipher-border text-cipher-muted'
              }`}
            >
              Phishing (&ge; 70.0)
            </div>
          </div>
        </div>
      </div>

      {/* 4. Real Synthesis Decision Rationale */}
      <div className="p-6 sm:p-7 rounded-2xl cipher-surface border border-cipher-border space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-cipher-border text-xs font-mono font-bold text-cipher-text">
          <Info className="w-4 h-4 text-cipher-sage" />
          <span className="uppercase tracking-wider text-[11px]">Real Evaluation Output Rationale:</span>
        </div>

        <ul className="space-y-2 text-xs font-sans text-cipher-text/90">
          {conciseReasons.map((reason, idx) => (
            <li key={idx} className="flex items-start gap-2.5 leading-relaxed">
              <span className="w-1.5 h-1.5 rounded-full bg-cipher-terracotta mt-1.5 shrink-0" />
              <span>{reason}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* 5. Calibrated Policy Notice */}
      <div className="p-3.5 rounded-xl bg-cipher-elevated/70 border border-cipher-border text-[11px] text-cipher-muted flex items-start gap-2.5 font-sans">
        <Info className="w-4 h-4 text-cipher-sage shrink-0 mt-0.5" />
        <p>
          <strong className="text-cipher-sage font-medium">Calibrated Policy Notice:</strong> Configured weights (60% structural, 40% NLP) prioritize formal automata-verified structural signals while mitigating single-point false positives through multi-signal Bayesian fusion.
        </p>
      </div>
    </div>
  );
};
