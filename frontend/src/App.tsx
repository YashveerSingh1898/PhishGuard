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
    },
    {
      id: 'analyze' as NavigationSection,
      label: 'Analyze Email',
      icon: Mail,
    },
    {
      id: 'automata' as NavigationSection,
      label: 'Automata Lab',
      icon: Cpu,
    },
    {
      id: 'nlp' as NavigationSection,
      label: 'NLP Analysis',
      icon: Brain,
    },
    {
      id: 'fusion' as NavigationSection,
      label: 'Risk Fusion',
      icon: Scale,
    },
  ];

  return (
    <div className="min-h-screen bg-cipher-bg text-cipher-text flex flex-col selection:bg-cipher-terracotta/25 selection:text-cipher-text">
      {/* 1. Compact Sticky Top Navigation Bar */}
      <header className="sticky top-0 z-40 w-full bg-cipher-surface/90 backdrop-blur-md border-b border-cipher-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Left: Brand Identity */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setActiveSection('overview')}
              className="flex items-center gap-2.5 text-left group"
            >
              <div className="p-2 rounded-xl bg-gradient-to-br from-cipher-terracotta/25 to-cipher-sage/20 border border-cipher-terracotta/30 text-cipher-terracotta group-hover:border-cipher-terracotta transition-all shadow-sm">
                <Shield className="w-5 h-5 text-[#F2F0EC]" />
              </div>
              <div>
                <span className="text-base font-bold text-cipher-text tracking-tight font-sans block group-hover:text-white transition-colors">
                  PhishGuard
                </span>
                <span className="text-[10px] text-cipher-muted font-mono tracking-tight block">
                  Automata + NLP
                </span>
              </div>
            </button>
          </div>

          {/* Center: Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 bg-cipher-bg/70 p-1 rounded-xl border border-cipher-border">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setActiveSection(item.id);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-cipher-terracotta/20 to-cipher-sage/20 text-cipher-text border border-cipher-terracotta/40 shadow-sm font-semibold'
                      : 'text-cipher-muted hover:text-cipher-text hover:bg-cipher-surface/60 border border-transparent'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cipher-terracotta' : 'text-cipher-muted'}`} />
                  <span className="font-sans text-[13px]">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right: Backend Connection Indicator & Theory Button */}
          <div className="flex items-center gap-2.5">
            {/* Backend Health indicator */}
            <div
              className={`hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full text-[11px] font-mono border ${
                backendStatus === 'healthy'
                  ? 'bg-cipher-green/10 text-cipher-green border-cipher-green/30'
                  : backendStatus === 'checking'
                  ? 'bg-cipher-amber/10 text-cipher-amber border-cipher-amber/30'
                  : 'bg-cipher-danger/10 text-cipher-danger border-cipher-danger/30'
              }`}
              title={`API Version: ${backendVersion || 'v0.1.0'}`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  backendStatus === 'healthy'
                    ? 'bg-cipher-green shadow-sm shadow-cipher-green/50'
                    : backendStatus === 'checking'
                    ? 'bg-cipher-amber animate-pulse'
                    : 'bg-cipher-danger'
                }`}
              />
              <span className="text-[10px] font-sans">
                {backendStatus === 'healthy' ? 'Connected' : backendStatus === 'checking' ? 'Connecting...' : 'Disconnected'}
              </span>
            </div>

            {/* Theory Guide button */}
            <button
              type="button"
              onClick={() => setIsTheoryOpen(true)}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cipher-elevated hover:bg-cipher-border text-cipher-muted hover:text-cipher-text border border-cipher-border text-xs font-mono transition-all"
              title="MOC Theory Reference"
            >
              <BookOpen className="w-3.5 h-3.5 text-cipher-sage" />
              <span className="font-sans text-xs">Theory Guide</span>
            </button>

            {/* Mobile Menu Toggle Button */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg bg-cipher-surface border border-cipher-border text-cipher-muted hover:text-cipher-text"
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden px-4 pt-2 pb-4 bg-cipher-surface border-b border-cipher-border space-y-1">
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
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-mono font-medium transition-all text-left ${
                    isActive
                      ? 'bg-cipher-terracotta/20 text-cipher-text border border-cipher-terracotta/40 font-semibold'
                      : 'text-cipher-muted hover:text-cipher-text hover:bg-cipher-elevated border border-transparent'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-cipher-terracotta' : 'text-cipher-muted'}`} />
                  <span className="font-sans text-sm">{item.label}</span>
                </button>
              );
            })}

            <div className="pt-2 flex items-center justify-between border-t border-cipher-border text-xs">
              <span className="text-cipher-muted font-sans">API Status:</span>
              <span className={backendStatus === 'healthy' ? 'text-cipher-green font-mono' : 'text-cipher-muted font-mono'}>
                {backendStatus === 'healthy' ? 'Connected' : 'Offline'}
              </span>
            </div>
          </div>
        )}
      </header>

      {/* 2. Main Workspace Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <div key={activeSection} className="fade-in-section">
          {/* Section 1: Overview */}
          {activeSection === 'overview' && (
            <OverviewView
              backendStatus={backendStatus}
              backendVersion={backendVersion}
              recentAnalysis={detectionResponse}
              isDetecting={isDetecting}
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
