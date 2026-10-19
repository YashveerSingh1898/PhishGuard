import React from 'react';
import {
  ShieldAlert,
  Send,
  Link as LinkIcon,
  Mail,
  FileText,
  Sparkles,
  RotateCcw,
} from 'lucide-react';
import { DetectionRequest } from '../types';

interface DetectionScannerProps {
  request: DetectionRequest;
  onChange: (field: keyof DetectionRequest, value: string) => void;
  onAnalyze: () => void;
  onReset: () => void;
  isLoading: boolean;
}

const PRESET_SCENARIOS = [
  {
    name: 'Scenario A: Legitimate Portal',
    badge: 'Legitimate',
    badgeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    sender: 'registrar@university.edu',
    url: 'https://portal.university.edu/student/grades',
    subject: 'Semester Grade Report Available',
    body: 'Your semester grade report is now ready for viewing on the student self-service portal.',
  },
  {
    name: 'Scenario B: Suspicious Notification',
    badge: 'Suspicious',
    badgeColor: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    sender: 'admin@university-portal-verify.net',
    url: 'http://university-portal-verify.net/notice',
    subject: 'Important Notification: Verify Enrollment Status',
    body: 'Important notification regarding your course enrollment status. Please review your courses on the portal.',
  },
  {
    name: 'Scenario C: Brand Squatting & Abused TLD',
    badge: 'Brand Phishing',
    badgeColor: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
    sender: 'Security Team <security@paypal.com>',
    url: 'http://paypal-security.xyz/login',
    subject: 'URGENT: Your account has been suspended',
    body: 'URGENT: Your account has been suspended due to suspicious activity. Verify your identity within 24 hours to prevent permanent closure.',
  },
  {
    name: 'Scenario D: Direct IPv4 Host Phishing',
    badge: 'Direct IP Phishing',
    badgeColor: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
    sender: 'Apple Security <security@apple.com>',
    url: 'http://192.168.1.55/auth/verify',
    subject: 'Security Alert: Apple ID Locked',
    body: 'Your Apple ID was locked due to unauthorized logins. Re-authenticate immediately at http://192.168.1.55/auth/verify.',
  },
];

export const DetectionScanner: React.FC<DetectionScannerProps> = ({
  request,
  onChange,
  onAnalyze,
  onReset,
  isLoading,
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAnalyze();
  };

  const handleSelectScenario = (scenario: typeof PRESET_SCENARIOS[0]) => {
    onChange('sender', scenario.sender);
    onChange('url', scenario.url);
    onChange('subject', scenario.subject);
    onChange('body', scenario.body);
  };

  return (
    <div className="rounded-xl border border-navy-800 bg-navy-900/50 p-5 shadow-lg">
      {/* Title & Presets Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4 pb-3 border-b border-navy-800">
        <div>
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-teal-400" />
            <span>Dual-Layer Phishing Vector Input</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Submit an email vector for deterministic structural URL analysis and Naive Bayes NLP evaluation.
          </p>
        </div>

        {/* Quick Demo Preset Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-teal-400" />
            <span>Demo Scenarios:</span>
          </span>
          {PRESET_SCENARIOS.map((scenario) => (
            <button
              key={scenario.name}
              type="button"
              onClick={() => handleSelectScenario(scenario)}
              disabled={isLoading}
              className={`px-2.5 py-1 rounded text-xs font-mono border transition-all hover:brightness-110 ${scenario.badgeColor}`}
              title={scenario.name}
            >
              {scenario.badge}
            </button>
          ))}
        </div>
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Sender Address */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              <span>Sender Header / Display Address</span>
            </label>
            <input
              type="text"
              value={request.sender || ''}
              onChange={(e) => onChange('sender', e.target.value)}
              placeholder="e.g. PayPal Security <support@paypal.com>"
              className="w-full h-10 px-3 font-mono text-xs bg-navy-950 text-white border border-navy-750 rounded-lg focus:outline-none focus:border-teal-500 placeholder:text-slate-500"
              disabled={isLoading}
            />
          </div>

          {/* URL */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
              <LinkIcon className="w-3.5 h-3.5 text-teal-400" />
              <span>Target URL Link</span>
            </label>
            <input
              type="text"
              value={request.url || ''}
              onChange={(e) => onChange('url', e.target.value)}
              placeholder="e.g. http://192.168.1.55/update-banking-security-alert.xyz/auth"
              className="w-full h-10 px-3 font-mono text-xs bg-navy-950 text-white border border-navy-750 rounded-lg focus:outline-none focus:border-teal-500 placeholder:text-slate-500"
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Subject */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            <span>Email Subject Line</span>
          </label>
          <input
            type="text"
            value={request.subject || ''}
            onChange={(e) => onChange('subject', e.target.value)}
            placeholder="e.g. URGENT: Your account has been suspended"
            className="w-full h-10 px-3 font-mono text-xs bg-navy-950 text-white border border-navy-750 rounded-lg focus:outline-none focus:border-teal-500 placeholder:text-slate-500"
            disabled={isLoading}
          />
        </div>

        {/* Body */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            <span>Email Body Content (NLP Linguistic Evaluation)</span>
          </label>
          <textarea
            rows={3}
            value={request.body || ''}
            onChange={(e) => onChange('body', e.target.value)}
            placeholder="e.g. URGENT: Your account has been suspended due to suspicious activity. Verify your identity within 24 hours to prevent immediate closure."
            className="w-full p-3 font-mono text-xs bg-navy-950 text-white border border-navy-750 rounded-lg focus:outline-none focus:border-teal-500 placeholder:text-slate-500 resize-none"
            disabled={isLoading}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={onReset}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-400 hover:text-white bg-navy-950 hover:bg-navy-800 rounded-lg border border-navy-800 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Clear Fields</span>
          </button>

          <button
            type="submit"
            disabled={isLoading || (!request.url?.trim() && !request.body?.trim() && !request.subject?.trim())}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-xs font-semibold bg-teal-500 hover:bg-teal-400 text-navy-950 disabled:bg-navy-800 disabled:text-slate-500 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-teal-500/20"
          >
            {isLoading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-navy-950 border-t-transparent rounded-full animate-spin" />
                <span>Running Dual-Layer Analysis...</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5 fill-current" />
                <span>Analyze Phishing Threat</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
