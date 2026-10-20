import React, { useState } from 'react';
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
  Clock,
  Layers,
  ChevronDown,
  ChevronUp,
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
    name: 'Benign: University Portal',
    badge: 'Legitimate',
    badgeStyle: 'text-cipher-green bg-cipher-green/10 border-cipher-green/30 hover:bg-cipher-green/20',
    sender: 'registrar@university.edu',
    url: 'https://portal.university.edu/student/grades',
    subject: 'Semester Grade Report Available',
    body: 'Your semester grade report is now ready for viewing on the student self-service portal at https://portal.university.edu/student/grades.',
  },
  {
    name: 'Suspicious: Urgent Verification',
    badge: 'Suspicious',
    badgeStyle: 'text-cipher-amber bg-cipher-amber/10 border-cipher-amber/30 hover:bg-cipher-amber/20',
    sender: 'admin@university-portal-verify.net',
    url: 'http://university-portal-verify.net/notice',
    subject: 'Important Notification: Verify Enrollment Status',
    body: 'Important notification regarding your course enrollment status. Please review your courses on the portal immediately to avoid cancellation.',
  },
  {
    name: 'Phishing: Brand Squatting',
    badge: 'Phishing',
    badgeStyle: 'text-cipher-danger bg-cipher-danger/10 border-cipher-danger/30 hover:bg-cipher-danger/20',
    sender: 'Security Team <security@paypal.com>',
    url: 'http://paypal-security.xyz/login',
    subject: 'URGENT: Your account has been suspended',
    body: 'URGENT: Your account has been suspended due to suspicious activity. Verify your identity within 24 hours to prevent permanent closure.',
  },
  {
    name: 'Phishing: Direct IP Host',
    badge: 'Direct IP',
    badgeStyle: 'text-cipher-terracotta bg-cipher-terracotta/10 border-cipher-terracotta/30 hover:bg-cipher-terracotta/20',
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
  const [showTechnicalDetails, setShowTechnicalDetails] = useState<boolean>(false);
  const [formValidation, setFormValidation] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormValidation(null);

    // Light field validation: ensure at least one field is provided
    if (!request.sender && !request.url && !request.subject && !request.body) {
      setFormValidation('Please provide at least an email body, destination URL, or subject to analyze.');
      return;
    }
    onAnalyze();
  };

  const handleApplyPreset = (preset: typeof DEMO_PRESETS[0]) => {
    setFormValidation(null);
    onChange('sender', preset.sender);
    onChange('url', preset.url);
    onChange('subject', preset.subject);
    onChange('body', preset.body);
  };

  const isPhishing = result?.verdict === 'Phishing';
  const isSuspicious = result?.verdict === 'Suspicious';

  const verdictBadgeColor = isPhishing
    ? 'text-cipher-danger bg-cipher-danger/10 border-cipher-danger/30'
    : isSuspicious
    ? 'text-cipher-amber bg-cipher-amber/10 border-cipher-amber/30'
    : 'text-cipher-green bg-cipher-green/10 border-cipher-green/30';

  const verdictIcon = isPhishing ? (
    <ShieldAlert className="w-5 h-5 text-cipher-danger" />
  ) : isSuspicious ? (
    <AlertTriangle className="w-5 h-5 text-cipher-amber" />
  ) : (
    <ShieldCheck className="w-5 h-5 text-cipher-green" />
  );

  return (
    <div className="space-y-6">
      {/* 2-Column Responsive Layout: Left Input Form (7 cols), Right Live Analysis Summary (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Input Form */}
        <section className="lg:col-span-7 cipher-surface rounded-2xl border border-cipher-border p-6 sm:p-7 space-y-5">
          {/* Header & Presets */}
          <div className="space-y-3 pb-4 border-b border-cipher-border">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-lg font-bold text-cipher-text font-sans tracking-tight">
                  Analyze Email Threat
                </h2>
                <p className="text-xs text-cipher-muted mt-0.5 font-sans">
                  Submit email headers, URL, or body to execute the automata and NLP pipeline.
                </p>
              </div>
            </div>

            {/* Demonstration Preset Selector */}
            <div className="pt-2 flex flex-wrap items-center gap-1.5 font-mono text-xs">
              <span className="text-[11px] text-cipher-muted mr-1 flex items-center gap-1 font-semibold">
                <Sparkles className="w-3 h-3 text-cipher-terracotta" />
                <span>Samples:</span>
              </span>
              {DEMO_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => handleApplyPreset(preset)}
                  disabled={isLoading}
                  className={`px-2.5 py-1 rounded-lg text-[11px] border font-medium transition-all ${preset.badgeStyle}`}
                  title={preset.name}
                >
                  {preset.badge}
                </button>
              ))}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Sender */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-cipher-muted font-medium flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-cipher-terracotta" />
                  <span>Sender Header:</span>
                </label>
                <input
                  type="text"
                  value={request.sender || ''}
                  onChange={(e) => onChange('sender', e.target.value)}
                  placeholder="e.g. security@paypal.com"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-cipher-elevated border border-cipher-border focus:border-cipher-terracotta focus:outline-none focus:ring-1 focus:ring-cipher-terracotta text-xs font-mono text-cipher-text placeholder:text-cipher-muted/60 transition-colors"
                />
              </div>

              {/* Destination URL */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-cipher-muted font-medium flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <LinkIcon className="w-3.5 h-3.5 text-cipher-sage" />
                    <span>Destination Link (URL):</span>
                  </span>
                  <span className="text-[10px] text-cipher-muted font-normal">Optional</span>
                </label>
                <input
                  type="text"
                  value={request.url || ''}
                  onChange={(e) => onChange('url', e.target.value)}
                  placeholder="e.g. http://paypal-security.xyz/login"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-cipher-elevated border border-cipher-border focus:border-cipher-sage focus:outline-none focus:ring-1 focus:ring-cipher-sage text-xs font-mono text-cipher-text placeholder:text-cipher-muted/60 transition-colors"
                />
              </div>
            </div>

            {/* Subject */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-cipher-muted font-medium flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-cipher-terracotta" />
                <span>Subject Line:</span>
              </label>
              <input
                type="text"
                value={request.subject || ''}
                onChange={(e) => onChange('subject', e.target.value)}
                placeholder="e.g. URGENT: Your account has been suspended"
                className="w-full px-3.5 py-2.5 rounded-xl bg-cipher-elevated border border-cipher-border focus:border-cipher-terracotta focus:outline-none focus:ring-1 focus:ring-cipher-terracotta text-xs font-mono text-cipher-text placeholder:text-cipher-muted/60 transition-colors"
              />
            </div>

            {/* Email Body */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono text-cipher-muted font-medium flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-cipher-sage" />
                  <span>Email Body Content:</span>
                </label>
                <span className="text-[10px] font-mono text-cipher-muted">
                  {request.body?.length || 0} chars
                </span>
              </div>
              <textarea
                rows={5}
                value={request.body || ''}
                onChange={(e) => onChange('body', e.target.value)}
                placeholder="Paste the email message body text here..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-cipher-elevated border border-cipher-border focus:border-cipher-sage focus:outline-none focus:ring-1 focus:ring-cipher-sage text-xs font-sans text-cipher-text placeholder:text-cipher-muted/60 leading-relaxed resize-y transition-colors"
              />
            </div>

            {/* Validation warning */}
            {formValidation && (
              <div className="p-3 rounded-xl bg-cipher-amber/10 border border-cipher-amber/30 text-cipher-amber text-xs font-mono">
                {formValidation}
              </div>
            )}

            {/* API error */}
            {error && (
              <div className="p-3 rounded-xl bg-cipher-danger/10 border border-cipher-danger/30 text-cipher-danger text-xs font-mono">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => {
                  setFormValidation(null);
                  onClear();
                }}
                disabled={isLoading}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-mono text-cipher-muted hover:text-cipher-text bg-cipher-elevated hover:bg-[#201F1C] border border-cipher-border transition-all disabled:opacity-50"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>

              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cipher-terracotta hover:bg-[#C85331] text-cipher-text font-bold text-xs font-mono transition-all shadow-md shadow-cipher-terracotta/20 active:scale-95 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <span className="w-3.5 h-3.5 rounded-full border-2 border-cipher-text border-t-transparent animate-spin" />
                    <span>Evaluating Pipeline...</span>
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
        </section>

        {/* Right Column: Live Analysis Summary */}
        <section className="lg:col-span-5 space-y-4">
          {isLoading ? (
            /* Loading State */
            <div className="cipher-surface rounded-2xl border border-cipher-border p-8 text-center space-y-4">
              <div className="w-10 h-10 mx-auto rounded-full border-2 border-cipher-terracotta border-t-transparent animate-spin" />
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-cipher-text font-sans">
                  Running Verification Pipeline
                </h3>
                <p className="text-xs text-cipher-muted font-mono">
                  Tracing URL through Thompson NFA, Subset DFA, and running Naive Bayes on tokens...
                </p>
              </div>
            </div>
          ) : result ? (
            /* Analysis Result Card */
            <div className="cipher-surface rounded-2xl border border-cipher-border p-6 space-y-4">
              {/* Verdict Header */}
              <div className="flex items-center justify-between pb-3 border-b border-cipher-border">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-cipher-elevated border border-cipher-border">
                    {verdictIcon}
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-cipher-muted uppercase tracking-wider block">
                      Verdict
                    </span>
                    <span className="text-lg font-extrabold text-cipher-text font-sans">
                      {result.verdict}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-mono font-bold border inline-block ${verdictBadgeColor}`}
                  >
                    {result.final_score.toFixed(1)} / 100
                  </span>
                  <div className="text-[10px] font-mono text-cipher-muted mt-1 flex items-center justify-end gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{result.execution_time_ms} ms</span>
                  </div>
                </div>
              </div>

              {/* Component Scores */}
              <div className="grid grid-cols-2 gap-3 font-mono text-xs">
                <div className="p-3 rounded-xl bg-cipher-elevated border border-cipher-border">
                  <span className="text-[10px] text-cipher-muted uppercase tracking-wider block">
                    Structural Score
                  </span>
                  <div className="text-xl font-bold text-cipher-sage mt-0.5">
                    {result.structural_score.toFixed(1)}
                  </div>
                  <span className="text-[10px] text-cipher-muted">
                    60% weight ({result.structural_contribution.toFixed(1)} pts)
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-cipher-elevated border border-cipher-border">
                  <span className="text-[10px] text-cipher-muted uppercase tracking-wider block">
                    NLP Score
                  </span>
                  <div className="text-xl font-bold text-cipher-terracotta mt-0.5">
                    {result.nlp_score.toFixed(1)}
                  </div>
                  <span className="text-[10px] text-cipher-muted">
                    40% weight ({result.nlp_contribution.toFixed(1)} pts)
                  </span>
                </div>
              </div>

              {/* Matched Structural Rules */}
              <div className="p-3 rounded-xl bg-cipher-elevated border border-cipher-border space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-[11px] text-cipher-muted uppercase font-semibold">
                    Structural Rules Matched:
                  </span>
                  <span className="px-2 py-0.5 rounded bg-cipher-surface text-[10px] text-cipher-text font-bold border border-cipher-border">
                    {result.matched_indicators.length} rule(s)
                  </span>
                </div>

                {result.matched_indicators.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {result.matched_indicators.map((rule, idx) => (
                      <span
                        key={`${rule.pattern_name}-${idx}`}
                        className="px-2 py-0.5 rounded-md bg-cipher-danger/10 border border-cipher-danger/25 text-cipher-danger text-[11px] font-mono font-medium"
                      >
                        {rule.pattern_name}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-[11px] font-mono text-cipher-green block">
                    No threat patterns matched by structural automata.
                  </span>
                )}
              </div>

              {/* Short Evidence-Based Reasons */}
              <div className="p-3 rounded-xl bg-cipher-elevated border border-cipher-border space-y-1.5">
                <span className="text-[11px] font-mono uppercase font-semibold text-cipher-muted block">
                  Key Evidence:
                </span>
                <ul className="space-y-1 text-xs font-mono text-cipher-text">
                  {result.reasons.slice(0, 3).map((reason, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-cipher-terracotta mt-0.5">&bull;</span>
                      <span className="text-[11px] leading-relaxed text-cipher-muted">
                        {reason}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Expandable Technical Details */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-cipher-elevated hover:bg-[#201F1C] border border-cipher-border text-xs font-mono text-cipher-muted transition-all"
                >
                  <span>Technical Breakdown Details</span>
                  {showTechnicalDetails ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>

                {showTechnicalDetails && (
                  <div className="mt-2 p-3 rounded-xl bg-cipher-elevated border border-cipher-border text-xs font-mono space-y-2 animate-in fade-in duration-150">
                    <div>
                      <span className="text-cipher-muted block text-[10px] uppercase">
                        Extracted Link Tested:
                      </span>
                      <code className="text-cipher-sage break-all font-bold block text-[11px]">
                        {result.input_summary.extracted_url ||
                          result.input_summary.url ||
                          'None'}
                      </code>
                    </div>
                    <div>
                      <span className="text-cipher-muted block text-[10px] uppercase">
                        NLP Class Probability:
                      </span>
                      <span className="text-cipher-text text-[11px]">
                        Phishing: {(result.class_probabilities['Phishing'] * 100).toFixed(1)}% | Legitimate: {(result.class_probabilities['Legitimate'] * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Workspace Navigation Deep Links */}
              <div className="grid grid-cols-3 gap-2 pt-1 font-mono text-[11px]">
                <button
                  type="button"
                  onClick={onViewAutomataLab}
                  className="py-2 px-2.5 rounded-xl bg-cipher-sage/10 hover:bg-cipher-sage/20 border border-cipher-sage/25 text-cipher-sage text-center transition-all truncate"
                >
                  Automata Lab &rarr;
                </button>
                <button
                  type="button"
                  onClick={onViewNLPAnalysis}
                  className="py-2 px-2.5 rounded-xl bg-cipher-terracotta/10 hover:bg-cipher-terracotta/20 border border-cipher-terracotta/25 text-cipher-terracotta text-center transition-all truncate"
                >
                  NLP Layer &rarr;
                </button>
                <button
                  type="button"
                  onClick={onViewRiskFusion}
                  className="py-2 px-2.5 rounded-xl bg-cipher-elevated hover:bg-[#201F1C] border border-cipher-border text-cipher-text text-center transition-all truncate"
                >
                  Risk Fusion &rarr;
                </button>
              </div>
            </div>
          ) : (
            /* Empty State */
            <div className="cipher-surface rounded-2xl border border-dashed border-cipher-border p-8 text-center space-y-3">
              <div className="p-3 w-12 h-12 mx-auto rounded-full bg-cipher-elevated border border-cipher-border text-cipher-muted flex items-center justify-center">
                <Layers className="w-5 h-5 text-cipher-terracotta" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-cipher-text">
                  Awaiting Threat Analysis
                </h3>
                <p className="text-xs text-cipher-muted font-sans leading-relaxed">
                  Enter email content on the left or select a sample preset to view real-time score synthesis, matched rules, and automata traces.
                </p>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
