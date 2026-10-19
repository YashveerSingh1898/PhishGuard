import React from 'react';
import {
  Send,
  RotateCcw,
  Sparkles,
  Link as LinkIcon,
  Mail,
  FileText,
  ShieldCheck,
  AlertTriangle,
  ShieldAlert,
  ArrowRight,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { DetectionRequest, DetectionResponse } from '../types';

interface AnalyzeEmailViewProps {
  request: DetectionRequest;
  onChange: (field: keyof DetectionRequest, value: string) => void;
  onAnalyze: () => void;
  onClear: () => void;
  isLoading: boolean;
  error: string | null;
  result: DetectionResponse | null;
  onViewAutomataLab: () => void;
  onViewNLPAnalysis: () => void;
  onViewRiskFusion: () => void;
}

const DEMO_PRESETS = [
  {
    name: 'Scenario A: Legitimate Portal',
    badge: 'Legitimate',
    badgeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/20',
    sender: 'registrar@university.edu',
    url: 'https://portal.university.edu/student/grades',
    subject: 'Semester Grade Report Available',
    body: 'Your semester grade report is now ready for viewing on the student self-service portal at https://portal.university.edu/student/grades.',
  },
  {
    name: 'Scenario B: Suspicious Notice',
    badge: 'Suspicious',
    badgeColor: 'text-amber-400 bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/20',
    sender: 'admin@university-portal-verify.net',
    url: 'http://university-portal-verify.net/notice',
    subject: 'Important Notification: Verify Enrollment Status',
    body: 'Important notification regarding your course enrollment status. Please review your courses on the portal.',
  },
  {
    name: 'Scenario C: Brand Squatting & TLD',
    badge: 'Brand Phishing',
    badgeColor: 'text-rose-400 bg-rose-500/10 border-rose-500/30 hover:bg-rose-500/20',
    sender: 'Security Team <security@paypal.com>',
    url: 'http://paypal-security.xyz/login',
    subject: 'URGENT: Your account has been suspended',
    body: 'URGENT: Your account has been suspended due to suspicious activity. Verify your identity within 24 hours to prevent permanent closure.',
  },
  {
    name: 'Scenario D: Direct IPv4 Host',
    badge: 'Direct IP Phishing',
    badgeColor: 'text-purple-400 bg-purple-500/10 border-purple-500/30 hover:bg-purple-500/20',
    sender: 'Apple Security <security@apple.com>',
    url: 'http://192.168.1.55/auth/verify',
    subject: 'Security Alert: Apple ID Locked',
    body: 'Your Apple ID was locked due to unauthorized logins. Re-authenticate immediately at http://192.168.1.55/auth/verify.',
  },
];

export const AnalyzeEmailView: React.FC<AnalyzeEmailViewProps> = ({
  request,
  onChange,
  onAnalyze,
  onClear,
  isLoading,
  error,
  result,
  onViewAutomataLab,
  onViewNLPAnalysis,
  onViewRiskFusion,
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAnalyze();
  };

  const handleApplyPreset = (preset: typeof DEMO_PRESETS[0]) => {
    onChange('sender', preset.sender);
    onChange('url', preset.url);
    onChange('subject', preset.subject);
    onChange('body', preset.body);
  };

  const isPhishing = result?.verdict === 'Phishing';
  const isSuspicious = result?.verdict === 'Suspicious';

  const verdictBadgeColor = isPhishing
    ? 'text-rose-400 bg-rose-500/10 border-rose-500/30'
    : isSuspicious
    ? 'text-amber-400 bg-amber-500/10 border-amber-500/30'
    : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';

  const verdictIcon = isPhishing ? (
    <ShieldAlert className="w-5 h-5 text-rose-400" />
  ) : isSuspicious ? (
    <AlertTriangle className="w-5 h-5 text-amber-400" />
  ) : (
    <ShieldCheck className="w-5 h-5 text-emerald-400" />
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 1. Email Analysis Input Form */}
      <div className="p-6 sm:p-7 rounded-2xl glass-card space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/5">
          <div>
            <h2 className="text-lg font-bold text-white font-sans tracking-tight">
              Email Threat Analysis
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Submit email attributes or choose a demo scenario to run through the automata and NLP pipeline.
            </p>
          </div>

          {/* Demonstration Preset Selector */}
          <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs">
            <span className="text-[11px] text-slate-500 mr-1 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-teal-400" />
              <span>Demos:</span>
            </span>
            {DEMO_PRESETS.map((preset) => (
              <button
                key={preset.name}
                type="button"
                onClick={() => handleApplyPreset(preset)}
                disabled={isLoading}
                className={`px-2.5 py-1 rounded-md text-[11px] border transition-all ${preset.badgeColor}`}
                title={preset.name}
              >
                {preset.badge}
              </button>
            ))}
          </div>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Sender */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-slate-300 font-medium flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-teal-400" />
                <span>Sender Header:</span>
              </label>
              <input
                type="text"
                value={request.sender || ''}
                onChange={(e) => onChange('sender', e.target.value)}
                placeholder="e.g. Security Team <security@paypal.com>"
                className="w-full px-3.5 py-2 rounded-lg bg-navy-950/80 border border-white/10 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 text-xs font-mono text-white placeholder:text-slate-600 transition-colors"
              />
            </div>

            {/* URL */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-slate-300 font-medium flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <LinkIcon className="w-3.5 h-3.5 text-teal-400" />
                  <span>Destination Link (URL):</span>
                </span>
                <span className="text-[10px] text-slate-500 font-normal">Extracted or explicit</span>
              </label>
              <input
                type="text"
                value={request.url || ''}
                onChange={(e) => onChange('url', e.target.value)}
                placeholder="e.g. http://paypal-security.xyz/login"
                className="w-full px-3.5 py-2 rounded-lg bg-navy-950/80 border border-white/10 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 text-xs font-mono text-white placeholder:text-slate-600 transition-colors"
              />
            </div>
          </div>

          {/* Subject */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono text-slate-300 font-medium flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-teal-400" />
              <span>Subject Line:</span>
            </label>
            <input
              type="text"
              value={request.subject || ''}
              onChange={(e) => onChange('subject', e.target.value)}
              placeholder="e.g. URGENT: Your account has been suspended"
              className="w-full px-3.5 py-2 rounded-lg bg-navy-950/80 border border-white/10 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 text-xs font-mono text-white placeholder:text-slate-600 transition-colors"
            />
          </div>

          {/* Email Body */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono text-slate-300 font-medium flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-teal-400" />
                <span>Email Body Content:</span>
              </span>
              <span className="text-[10px] text-slate-500 font-normal">
                {request.body?.length || 0} characters
              </span>
            </label>
            <textarea
              rows={4}
              value={request.body || ''}
              onChange={(e) => onChange('body', e.target.value)}
              placeholder="Paste email message body text here..."
              className="w-full px-3.5 py-2.5 rounded-lg bg-navy-950/80 border border-white/10 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 text-xs font-sans text-white placeholder:text-slate-600 leading-relaxed resize-y transition-colors"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={onClear}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-mono text-slate-400 hover:text-white bg-navy-950/60 hover:bg-navy-900 border border-white/10 transition-all disabled:opacity-50"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>

            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-teal-400 hover:from-teal-400 hover:to-teal-300 text-navy-950 font-bold text-xs font-mono transition-all shadow-lg shadow-teal-500/20 active:scale-95 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <span className="w-3.5 h-3.5 rounded-full border-2 border-navy-950 border-t-transparent animate-spin" />
                  <span>Evaluating Automata &amp; NLP...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Analyze Email</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Error message */}
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono">
            {error}
          </div>
        )}
      </div>

      {/* 2. Compact Result Summary (Only shown after real analysis) */}
      {result && (
        <div className="p-6 sm:p-7 rounded-2xl glass-card space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-navy-950/80 border border-white/10">
                {verdictIcon}
              </div>
              <div>
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                  Threat Classification Verdict
                </span>
                <div className="flex items-center gap-2.5 mt-0.5">
                  <span className="text-xl font-bold text-white font-sans">
                    {result.verdict}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold border ${verdictBadgeColor}`}>
                    {result.final_score.toFixed(1)} / 100
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>{result.execution_time_ms} ms</span>
            </div>
          </div>

          {/* Scores Overview Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
            <div className="p-3.5 rounded-xl bg-navy-950/80 border border-white/5">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Final Risk Score</span>
              <div className="flex items-baseline gap-1 mt-0.5">
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
                <span className="text-[10px] text-slate-500">/ 100</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-navy-950/80 border border-white/5">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Structural Score (60%)</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-2xl font-extrabold text-cyan-400">
                  {result.structural_score.toFixed(1)}
                </span>
                <span className="text-[10px] text-slate-500">/ 100</span>
                <span className="text-[10px] text-slate-400 ml-1">
                  ({result.structural_contribution.toFixed(1)} pts)
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-navy-950/80 border border-white/5">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block">NLP Score (40%)</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-2xl font-extrabold text-emerald-400">
                  {result.nlp_score.toFixed(1)}
                </span>
                <span className="text-[10px] text-slate-500">/ 100</span>
                <span className="text-[10px] text-slate-400 ml-1">
                  ({result.nlp_contribution.toFixed(1)} pts)
                </span>
              </div>
            </div>
          </div>

          {/* View Full Analysis Action Links */}
          <div className="p-4 rounded-xl bg-navy-950/80 border border-white/5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-slate-300 font-semibold flex items-center gap-1.5">
                <ExternalLink className="w-3.5 h-3.5 text-teal-400" />
                <span>View Full Analysis:</span>
              </span>
              <span className="text-[11px] text-slate-500 font-mono">
                {result.evaluated_rules?.length || 0} automata rules evaluated
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={onViewAutomataLab}
                className="p-3 rounded-lg bg-navy-900/80 hover:bg-navy-850 border border-white/5 hover:border-cyan-500/30 text-left transition-all group"
              >
                <div className="flex items-center justify-between text-xs font-mono text-cyan-400 font-semibold">
                  <span>1. Automata Lab</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
                <p className="text-[11px] text-slate-400 mt-1 font-sans">
                  NFA, DFA, MinDFA diagrams &amp; URL execution tape.
                </p>
              </button>

              <button
                type="button"
                onClick={onViewNLPAnalysis}
                className="p-3 rounded-lg bg-navy-900/80 hover:bg-navy-850 border border-white/5 hover:border-emerald-500/30 text-left transition-all group"
              >
                <div className="flex items-center justify-between text-xs font-mono text-emerald-400 font-semibold">
                  <span>2. NLP Analysis</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
                <p className="text-[11px] text-slate-400 mt-1 font-sans">
                  TF-IDF, Naive Bayes posterior probabilities &amp; tokens.
                </p>
              </button>

              <button
                type="button"
                onClick={onViewRiskFusion}
                className="p-3 rounded-lg bg-navy-900/80 hover:bg-navy-850 border border-white/5 hover:border-teal-500/30 text-left transition-all group"
              >
                <div className="flex items-center justify-between text-xs font-mono text-teal-400 font-semibold">
                  <span>3. Risk Fusion</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
                <p className="text-[11px] text-slate-400 mt-1 font-sans">
                  60:40 weighted formula synthesis &amp; decision reasons.
                </p>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
