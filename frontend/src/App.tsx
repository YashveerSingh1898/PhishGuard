import { useState, useEffect, useCallback } from 'react';
import {
  LayoutDashboard,
  Mail,
  Cpu,
  Brain,
  Scale,
  Menu,
  X,
  BookOpen,
  Shield,
} from 'lucide-react';
import {
  checkBackendHealth,
  convertRegex,
  analyzeThreat,
} from './services/api';
import {
  AutomataConvertResponse,
  DetectionRequest,
  DetectionResponse,
} from './types';
import { TheoryModal } from './components/TheoryModal';
import { OverviewView } from './views/OverviewView';
import { AnalyzeEmailView } from './views/AnalyzeEmailView';
import { AutomataLabView } from './views/AutomataLabView';
import { NLPAnalysisView } from './views/NLPAnalysisView';
import { RiskFusionView } from './views/RiskFusionView';

export type NavigationSection = 'overview' | 'analyze' | 'automata' | 'nlp' | 'fusion';

const DEFAULT_DETECTION_REQUEST: DetectionRequest = {
  sender: 'Security Team <security@paypal.com>',
  url: 'http://paypal-security.xyz/login',
  subject: 'URGENT: Your account has been suspended',
  body: 'URGENT: Your account has been suspended due to suspicious activity. Verify your identity within 24 hours to prevent permanent closure.',
};

export default function App() {
  // Navigation section
  const [activeSection, setActiveSection] = useState<NavigationSection>('overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  // Backend Health
  const [backendStatus, setBackendStatus] = useState<'checking' | 'healthy' | 'error'>('checking');
  const [backendVersion, setBackendVersion] = useState<string>('');

  // Email Detection State
  const [detectionRequest, setDetectionRequest] = useState<DetectionRequest>(DEFAULT_DETECTION_REQUEST);
  const [isDetecting, setIsDetecting] = useState<boolean>(false);
  const [detectionError, setDetectionError] = useState<string | null>(null);
  const [detectionResponse, setDetectionResponse] = useState<DetectionResponse | null>(null);

  // Custom Automata Studio State
  const [customAutomataData, setCustomAutomataData] = useState<AutomataConvertResponse | null>(null);
  const [isCustomAutomataLoading, setIsCustomAutomataLoading] = useState<boolean>(false);

  // Theory Modal
  const [isTheoryOpen, setIsTheoryOpen] = useState<boolean>(false);

  // Health check
  const handleCheckHealth = useCallback(async () => {
    setBackendStatus('checking');
    try {
      const res = await checkBackendHealth();
      setBackendStatus('healthy');
      setBackendVersion(res.version || 'v0.1.0-alpha');
      return true;
    } catch {
      setBackendStatus('error');
      return false;
    }
  }, []);

  // Email Analysis trigger
  const handleAnalyzeThreat = useCallback(async () => {
    setIsDetecting(true);
    setDetectionError(null);
    try {
      const response = await analyzeThreat(detectionRequest);
      setDetectionResponse(response);
    } catch (err: unknown) {
      setDetectionResponse(null);
      setDetectionError(
        err instanceof Error ? err.message : 'Threat detection analysis failed.'
      );
    } finally {
      setIsDetecting(false);
    }
  }, [detectionRequest]);

  // Custom regex conversion in Automata Lab
  const handleConvertCustomRegex = useCallback(async (pattern: string) => {
    setIsCustomAutomataLoading(true);
    try {
      const response = await convertRegex(pattern);
      setCustomAutomataData(response);
    } catch (err: unknown) {
      console.error('Custom regex conversion failed:', err);
    } finally {
      setIsCustomAutomataLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    let mounted = true;
    (async () => {
      const isHealthy = await handleCheckHealth();
      if (mounted && isHealthy) {
        handleAnalyzeThreat();
        handleConvertCustomRegex('(a|b)*abb');
      }
    })();
    return () => {
      mounted = false;
    };
  }, [handleCheckHealth, handleAnalyzeThreat, handleConvertCustomRegex]);

  const handleClearRequest = () => {
    setDetectionRequest({ sender: '', url: '', subject: '', body: '' });
    setDetectionError(null);
  };

  const navItems = [
    {
      id: 'overview' as NavigationSection,
      label: 'Overview',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'analyze' as NavigationSection,
      label: 'Analyze Email',
      icon: Mail,
      badge: 'Input',
    },
    {
      id: 'automata' as NavigationSection,
      label: 'Automata Lab',
      icon: Cpu,
      badge: 'MOC',
    },
    {
      id: 'nlp' as NavigationSection,
      label: 'NLP Analysis',
      icon: Brain,
      badge: 'Bayes',
    },
    {
      id: 'fusion' as NavigationSection,
      label: 'Risk Fusion',
      icon: Scale,
      badge: '60:40',
    },
  ];

  return (
    <div className="min-h-screen bg-navy-950 text-slate-100 flex flex-col md:flex-row selection:bg-teal-500/25 selection:text-teal-200">
      {/* 1. Mobile Top Bar */}
      <div className="md:hidden flex items-center justify-between p-4 bg-navy-900/90 backdrop-blur-md border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-teal-500/20 to-cyan-500/10 text-teal-400 border border-teal-500/30 shadow-inner">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <span className="text-sm font-semibold text-white tracking-tight">PhishGuard</span>
            <span className="text-[10px] text-slate-400 block font-mono">Automata + NLP</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 rounded-lg bg-navy-950/80 border border-white/10 text-slate-300 hover:text-white"
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* 2. Compact Sidebar Navigation */}
      <aside
        className={`${
          isMobileMenuOpen ? 'block' : 'hidden'
        } md:flex flex-col justify-between w-full md:w-64 bg-navy-900/80 backdrop-blur-xl border-r border-white/5 p-4 shrink-0 transition-all z-20`}
      >
        <div className="space-y-6">
          {/* Logo / Title */}
          <div className="hidden md:flex items-center gap-3 px-2 py-2">
            <div className="p-2 rounded-xl bg-gradient-to-br from-teal-500/20 to-cyan-500/10 text-teal-400 border border-teal-500/30 shadow-inner">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <span className="text-sm font-bold text-white tracking-tight font-sans block">
                PhishGuard
              </span>
              <span className="text-[10px] text-slate-400 font-mono tracking-tight block">
                Automata + NLP Engine
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setActiveSection(item.id);
                    setIsMobileMenuOpen(false);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className={`w-full group flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-mono font-medium transition-all text-left relative ${
                    isActive
                      ? 'bg-teal-500/10 text-teal-300 border border-teal-500/25 shadow-sm shadow-teal-500/5'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.03] border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {/* Active Accent Indicator Bar */}
                    {isActive && (
                      <span className="absolute left-1.5 w-1 h-4 bg-teal-400 rounded-full" />
                    )}
                    <Icon className={`w-4 h-4 ml-1.5 ${isActive ? 'text-teal-400' : 'text-slate-400 group-hover:text-slate-300'}`} />
                    <span className="font-sans font-medium text-[13px]">{item.label}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded border transition-colors ${
                        isActive
                          ? 'bg-teal-500/20 text-teal-300 border-teal-500/30'
                          : 'bg-navy-950/60 text-slate-500 border-white/5 group-hover:text-slate-400'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="space-y-2.5 pt-4 border-t border-white/5 text-xs font-mono">
          {/* Backend Health indicator */}
          <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-navy-950/70 border border-white/5 text-[11px]">
            <span className="text-slate-400">Backend API</span>
            <div className="flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  backendStatus === 'healthy'
                    ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50'
                    : backendStatus === 'checking'
                    ? 'bg-amber-400 animate-pulse'
                    : 'bg-rose-400'
                }`}
              />
              <span
                className={
                  backendStatus === 'healthy'
                    ? 'text-emerald-400 font-semibold'
                    : 'text-slate-400'
                }
              >
                {backendStatus === 'healthy' ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>

          {/* MOC Theory Guide button */}
          <button
            type="button"
            onClick={() => setIsTheoryOpen(true)}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-navy-950/50 hover:bg-navy-850/80 border border-white/5 hover:border-teal-500/30 text-slate-400 hover:text-teal-300 transition-all text-xs"
          >
            <BookOpen className="w-3.5 h-3.5 text-teal-400" />
            <span className="font-sans">Theory Reference</span>
          </button>
        </div>
      </aside>

      {/* 3. Main Workspace Area */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
        <div key={activeSection} className="fade-in-section">
          {/* Section 1: Overview */}
          {activeSection === 'overview' && (
            <OverviewView
              backendStatus={backendStatus}
              backendVersion={backendVersion}
              recentAnalysis={detectionResponse}
              onNavigateToAnalyze={() => setActiveSection('analyze')}
              onNavigateToAutomata={() => setActiveSection('automata')}
              onNavigateToNLP={() => setActiveSection('nlp')}
              onNavigateToFusion={() => setActiveSection('fusion')}
            />
          )}

          {/* Section 2: Analyze Email */}
          {activeSection === 'analyze' && (
            <AnalyzeEmailView
              request={detectionRequest}
              onChange={(field, val) =>
                setDetectionRequest((prev) => ({ ...prev, [field]: val }))
              }
              onAnalyze={handleAnalyzeThreat}
              onClear={handleClearRequest}
              isLoading={isDetecting}
              error={detectionError}
              result={detectionResponse}
              onViewAutomataLab={() => setActiveSection('automata')}
              onViewNLPAnalysis={() => setActiveSection('nlp')}
              onViewRiskFusion={() => setActiveSection('fusion')}
            />
          )}

          {/* Section 3: Automata Lab */}
          {activeSection === 'automata' && (
            <AutomataLabView
              evaluatedRules={detectionResponse?.evaluated_rules || []}
              originalUrl={detectionResponse?.input_summary.url || detectionRequest.url || ''}
              extractedUrl={
                detectionResponse?.input_summary.extracted_url ||
                detectionResponse?.input_summary.url ||
                detectionRequest.url ||
                ''
              }
              customAutomataData={customAutomataData}
              onConvertCustomRegex={handleConvertCustomRegex}
              isCustomLoading={isCustomAutomataLoading}
            />
          )}

          {/* Section 4: NLP Analysis */}
          {activeSection === 'nlp' && (
            <NLPAnalysisView result={detectionResponse} />
          )}

          {/* Section 5: Risk Fusion */}
          {activeSection === 'fusion' && (
            <RiskFusionView result={detectionResponse} />
          )}
        </div>
      </main>

      {/* Theory Guide Modal */}
      <TheoryModal isOpen={isTheoryOpen} onClose={() => setIsTheoryOpen(false)} />
    </div>
  );
}
