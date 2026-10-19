import React from 'react';
import { Shield, RefreshCw, Activity, HelpCircle, CheckCircle2, AlertCircle } from 'lucide-react';

interface HeaderProps {
  backendStatus: 'checking' | 'healthy' | 'error';
  backendVersion?: string;
  onRefreshHealth: () => void;
  onReset: () => void;
  onOpenTheory: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  backendStatus,
  backendVersion,
  onRefreshHealth,
  onReset,
  onOpenTheory,
}) => {
  return (
    <header className="border-b border-navy-800 bg-navy-900/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand & Subtitle */}
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-teal-500/10 border border-teal-500/30 rounded-lg text-teal-400">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight text-white">PhishGuard</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono tracking-wider font-semibold uppercase bg-teal-500/10 text-teal-400 border border-teal-500/30">
                Phase 3: Automata Engine
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Automata-Based Phishing Pattern Analysis
            </p>
          </div>
        </div>

        {/* Status badges & Controls */}
        <div className="flex items-center space-x-3">
          {/* MOC Academic Badge */}
          <span className="hidden md:inline-flex items-center px-2.5 py-1 rounded-md text-xs font-mono bg-navy-800 text-slate-300 border border-navy-700">
            MOC Capstone Demonstration
          </span>

          {/* Backend Status Indicator */}
          <div
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono border transition-colors ${
              backendStatus === 'healthy'
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : backendStatus === 'checking'
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
            }`}
            title={
              backendStatus === 'healthy'
                ? `Connected to FastAPI Backend (${backendVersion || 'v0.1.0-alpha'})`
                : backendStatus === 'checking'
                ? 'Testing connection to http://127.0.0.1:8000/api/health...'
                : 'FastAPI Backend Disconnected. Ensure backend is running.'
            }
          >
            {backendStatus === 'healthy' ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Backend: Online</span>
              </>
            ) : backendStatus === 'checking' ? (
              <>
                <Activity className="w-3.5 h-3.5 animate-pulse" />
                <span>Connecting...</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Backend: Offline</span>
              </>
            )}

            <button
              onClick={onRefreshHealth}
              disabled={backendStatus === 'checking'}
              className="ml-1 text-slate-400 hover:text-white transition-colors"
              title="Re-check health"
              aria-label="Re-check backend health"
            >
              <RefreshCw className={`w-3 h-3 ${backendStatus === 'checking' ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* How It Works Button */}
          <button
            onClick={onOpenTheory}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-navy-800 hover:bg-navy-700 text-slate-200 border border-navy-700 hover:border-slate-600 transition-colors"
            title="Academic Theory & Automata Foundations"
          >
            <HelpCircle className="w-3.5 h-3.5 text-teal-400" />
            <span className="hidden sm:inline">How It Works</span>
          </button>

          {/* Reset / New Analysis */}
          <button
            onClick={onReset}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-navy-800 hover:bg-navy-700 text-slate-200 border border-navy-700 hover:border-slate-600 transition-colors"
            title="Reset to default pattern"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>
    </header>
  );
};
