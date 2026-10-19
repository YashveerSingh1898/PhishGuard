import React from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  ShieldAlert,
  Cpu,
  Brain,
  Calculator,
  ExternalLink,
  Info,
  CheckCircle2,
  Clock,
  Mail,
  Link as LinkIcon,
  FileText,
} from 'lucide-react';
import { DetectionResponse } from '../types';
import { AutomataExecutionViewer } from './AutomataExecutionViewer';

interface DetectionResultsCardProps {
  result: DetectionResponse;
  onInspectAutomataPattern: (pattern: string) => void;
}

export const DetectionResultsCard: React.FC<DetectionResultsCardProps> = ({
  result,
  onInspectAutomataPattern,
}) => {
  const isPhishing = result.verdict === 'Phishing';
  const isSuspicious = result.verdict === 'Suspicious';

  const verdictColor = isPhishing
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

  const origUrl = result.input_summary.url;
  const extractedUrl = result.input_summary.extracted_url || origUrl;

  return (
    <div className="space-y-6">
      {/* 1. Verdict & Final Score Header */}
      <div className="rounded-xl border border-navy-800 bg-navy-900/60 p-6 shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-xl bg-navy-950 border border-navy-800">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-navy-900 border border-navy-800">
              {verdictIcon}
            </div>
            <div>
              <div className="text-xs font-mono text-slate-400 uppercase tracking-wider">
                Dual-Layer Threat Verdict
              </div>
              <div className="flex items-center gap-2.5 mt-0.5">
                <span className="text-2xl font-bold tracking-tight text-white">
                  {result.verdict === 'Phishing'
                    ? 'Phishing Threat'
                    : result.verdict === 'Suspicious'
                    ? 'Suspicious Vector'
                    : 'Legitimate Vector'}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold border ${verdictColor}`}>
                  {result.verdict}
                </span>
              </div>
            </div>
          </div>

          {/* Score and Timing */}
          <div className="flex items-center gap-6">
            <div className="text-right">
              <div className="text-xs font-mono text-slate-400 uppercase">Unified Risk Score</div>
              <div className="flex items-baseline justify-end gap-1 mt-0.5">
                <span
                  className={`text-3xl font-extrabold font-mono ${
                    isPhishing
                      ? 'text-rose-400'
                      : isSuspicious
                      ? 'text-amber-400'
                      : 'text-emerald-400'
                  }`}
                >
                  {result.final_score.toFixed(1)}
                </span>
                <span className="text-xs text-slate-500 font-mono">/ 100</span>
              </div>
            </div>

            <div className="hidden sm:flex flex-col items-end text-[11px] font-mono text-slate-500 pl-4 border-l border-navy-850">
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" />
                <span>{result.execution_time_ms} ms</span>
              </div>
              <span className="text-teal-400/80">Deterministic O(n)</span>
            </div>
          </div>
        </div>

        {/* 2. Submitted Email & Extracted URL Banner */}
        <div className="p-4 rounded-xl bg-navy-950 border border-navy-800 space-y-2 text-xs font-mono">
          <div className="text-[11px] text-slate-400 font-semibold uppercase flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5 text-teal-400" />
            <span>Submitted Email Artifact &amp; Extracted Target:</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            <div className="p-2.5 rounded bg-navy-900 border border-navy-850 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase block">Sender Identity:</span>
              <span className="text-slate-200 font-bold truncate block">{result.input_summary.sender || 'N/A'}</span>
            </div>
            <div className="p-2.5 rounded bg-navy-900 border border-navy-850 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase block">Subject Line:</span>
              <span className="text-slate-200 font-bold truncate block">{result.input_summary.subject || 'N/A'}</span>
            </div>
          </div>

          <div className="p-2.5 rounded bg-navy-900 border border-navy-850 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-500 uppercase flex items-center gap-1">
                <LinkIcon className="w-3 h-3 text-teal-400" />
                <span>Extracted URL Evaluated by Automata Engine:</span>
              </span>
              {origUrl !== extractedUrl && origUrl && (
                <span className="text-[10px] text-slate-500 italic">Extracted from email message body</span>
              )}
            </div>
            <code className="text-teal-300 font-bold break-all block text-xs">{extractedUrl || 'None extracted'}</code>
          </div>
        </div>

        {/* 3. Mathematical Risk Fusion Formula Callout */}
        <div className="p-4 rounded-lg bg-navy-950/80 border border-navy-800 font-mono text-xs space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="flex items-center gap-1.5 font-semibold text-slate-300">
              <Calculator className="w-3.5 h-3.5 text-teal-400" />
              <span>Mathematical Risk Fusion Synthesis:</span>
            </span>
            <span className="text-[11px] text-teal-400">
              Final Score = 0.6 × Structural + 0.4 × NLP
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-200 bg-navy-900 p-2.5 rounded border border-navy-800">
            <span className="text-cyan-400 font-bold">
              0.6 × {result.structural_score.toFixed(1)}
            </span>
            <span className="text-slate-500">({result.structural_contribution.toFixed(1)})</span>
            <span className="text-slate-500">+</span>
            <span className="text-emerald-400 font-bold">
              0.4 × {result.nlp_score.toFixed(1)}
            </span>
            <span className="text-slate-500">({result.nlp_contribution.toFixed(1)})</span>
            <span className="text-slate-500">=</span>
            <span
              className={`font-extrabold ${
                isPhishing
                  ? 'text-rose-400'
                  : isSuspicious
                  ? 'text-amber-400'
                  : 'text-emerald-400'
              }`}
            >
              {result.final_score.toFixed(1)}
            </span>
            <span className="text-slate-500">→ Verdict:</span>
            <span className="font-semibold text-white">{result.verdict}</span>
          </div>

          {/* Threshold markers */}
          <div className="grid grid-cols-3 gap-2 text-center text-[10px] pt-1 text-slate-400">
            <div className={`p-1.5 rounded border ${result.final_score < 35 ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300 font-bold' : 'bg-navy-900 border-navy-850'}`}>
              Legitimate (&lt; 35.0)
            </div>
            <div className={`p-1.5 rounded border ${result.final_score >= 35 && result.final_score < 70 ? 'bg-amber-500/10 border-amber-500/40 text-amber-300 font-bold' : 'bg-navy-900 border-navy-850'}`}>
              Suspicious (35.0 – 69.9)
            </div>
            <div className={`p-1.5 rounded border ${result.final_score >= 70 ? 'bg-rose-500/10 border-rose-500/40 text-rose-300 font-bold' : 'bg-navy-900 border-navy-850'}`}>
              Phishing (≥ 70.0)
            </div>
          </div>
        </div>

        {/* 4. Layer Contributions Breakdown Summary Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Layer 1: Structural Automata Summary */}
          <div className="p-4 rounded-xl bg-navy-950 border border-navy-800 space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-navy-850">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-cyan-400" />
                <span className="font-semibold text-sm text-white">Structural Layer (Automata Engine)</span>
              </div>
              <div className="text-right font-mono">
                <span className="text-base font-bold text-cyan-400">
                  {result.structural_score.toFixed(1)}
                </span>
                <span className="text-xs text-slate-500">/100</span>
                <span className="text-[10px] text-slate-400 ml-1.5">(60% weight)</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-[11px] font-mono text-slate-400 font-semibold uppercase">
                Matched Structural Indicators ({result.matched_indicators.length}):
              </div>

              {result.matched_indicators.length === 0 ? (
                <div className="p-3 rounded bg-navy-900/60 border border-navy-800 text-xs text-slate-400 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>No structural URL anomalies or spoofed domain patterns detected.</span>
                </div>
              ) : (
                result.matched_indicators.map((ind, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded bg-navy-900/80 border border-navy-800 text-xs font-mono space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-teal-300">{ind.pattern_name}</span>
                      <span className="px-2 py-0.5 rounded bg-navy-950 text-cyan-400 text-[10px] border border-cyan-500/20">
                        +{ind.weight} pts
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                      {ind.explanation}
                    </p>
                    {ind.regex_pattern && (
                      <div className="pt-1 flex items-center justify-between text-[10px]">
                        <span className="text-slate-500">
                          Automaton: <code className="text-teal-400">{ind.regex_pattern}</code>
                        </span>
                        <button
                          type="button"
                          onClick={() => onInspectAutomataPattern(ind.regex_pattern!)}
                          className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 underline"
                        >
                          <span>MOC Studio</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Layer 2: NLP Linguistic Summary */}
          <div className="p-4 rounded-xl bg-navy-950 border border-navy-800 space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-navy-850">
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-emerald-400" />
                <span className="font-semibold text-sm text-white">Linguistic Layer (NLP TF-IDF / Naive Bayes)</span>
              </div>
              <div className="text-right">
                <span className="text-base font-bold text-emerald-400">
                  {result.nlp_score.toFixed(1)}
                </span>
                <span className="text-xs text-slate-500">/100</span>
                <span className="text-[10px] text-slate-400 ml-1.5">(40% weight)</span>
              </div>
            </div>

            {/* Model Outputs */}
            <div className="p-3 rounded bg-navy-900 border border-navy-800 flex items-center justify-between">
              <span className="text-slate-400">Predicted Class:</span>
              <span
                className={`font-bold px-2 py-0.5 rounded text-xs ${
                  result.predicted_class === 'Phishing'
                    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                    : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                }`}
              >
                {result.predicted_class}
              </span>
            </div>

            {/* Posterior probabilities */}
            <div className="p-3 rounded bg-navy-900 border border-navy-800 space-y-2">
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>Posterior Class Distribution:</span>
                <span>P(C | d)</span>
              </div>

              {Object.entries(result.class_probabilities).map(([cls, prob]) => (
                <div key={cls} className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-300">{cls}:</span>
                    <span className="text-white font-bold">{(prob * 100).toFixed(1)}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-navy-950 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        cls === 'Phishing' ? 'bg-rose-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, prob * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* NLP Preprocessed Tokens */}
            {result.nlp_tokens && result.nlp_tokens.length > 0 && (
              <div className="p-3 rounded bg-navy-900 border border-navy-800 space-y-1.5">
                <div className="text-[10px] text-slate-500 uppercase flex items-center gap-1">
                  <FileText className="w-3 h-3 text-teal-400" />
                  <span>Filtered Lexical Tokens ({result.nlp_tokens.length}):</span>
                </div>
                <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                  {result.nlp_tokens.slice(0, 20).map((tok, i) => (
                    <span key={i} className="px-1.5 py-0.5 rounded bg-navy-950 text-slate-300 text-[10px] border border-navy-800">
                      {tok}
                    </span>
                  ))}
                  {result.nlp_tokens.length > 20 && (
                    <span className="text-[10px] text-slate-500">+{result.nlp_tokens.length - 20} more</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 5. Synthesis Reasons List */}
        <div className="p-4 rounded-xl bg-navy-950 border border-navy-800 text-xs">
          <div className="font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-teal-400" />
            <span>Evaluation Summary &amp; Decision Rationale:</span>
          </div>
          <ul className="list-disc list-inside space-y-1.5 text-slate-300 font-sans">
            {result.reasons.map((reason, idx) => (
              <li key={idx} className="leading-relaxed">
                {reason}
              </li>
            ))}
          </ul>
        </div>

        {/* 6. Limitations Callout */}
        <div className="p-3 rounded-lg bg-navy-950/70 border border-navy-800 text-[11px] text-slate-400 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed font-mono">
            <strong className="text-amber-300">Demonstration Model Notice:</strong> {result.limitations_note}
          </p>
        </div>
      </div>

      {/* 7. Dedicated Deep-Dive: Real Automata Execution Viewer */}
      {result.evaluated_rules && result.evaluated_rules.length > 0 && (
        <AutomataExecutionViewer
          evaluatedRules={result.evaluated_rules}
          originalUrl={result.input_summary.url}
          extractedUrl={extractedUrl}
          onInspectInStudio={onInspectAutomataPattern}
        />
      )}
    </div>
  );
};
