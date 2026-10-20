import React, { useState } from 'react';
import {
  Shield,
  ArrowRight,
  Cpu,
  Calculator,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Mail,
  CheckCircle2,
  Brain,
  Binary,
} from 'lucide-react';
import { DetectionResponse } from '../types';

interface OverviewViewProps {
  backendStatus: 'checking' | 'healthy' | 'error';
  backendVersion: string;
  recentAnalysis: DetectionResponse | null;
  isDetecting?: boolean;
  onNavigateToAnalyze: () => void;
  onNavigateToAutomata: () => void;
  onNavigateToNLP: () => void;
  onNavigateToFusion: () => void;
}

interface PipelineNode {
  id: string;
  name: string;
  subtitle: string;
  angle: number; // degrees
  radius: number; // px from center
  color: string;
  activeColor: string;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  backendStatus,
  backendVersion,
  recentAnalysis,
  isDetecting = false,
  onNavigateToAnalyze,
  onNavigateToAutomata,
  onNavigateToNLP,
  onNavigateToFusion,
}) => {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  // 6 Real pipeline stages arranged in circular orbital pattern
  const pipelineNodes: PipelineNode[] = [
    {
      id: 'regex',
      name: 'Regex Rule',
      subtitle: 'Structural pattern extraction',
      angle: 210,
      radius: 145,
      color: '#878D6B',
      activeColor: '#B4492A',
    },
    {
      id: 'nfa',
      name: 'Thompson NFA',
      subtitle: 'ε-transitions via state composition',
      angle: 150,
      radius: 145,
      color: '#878D6B',
      activeColor: '#B4492A',
    },
    {
      id: 'dfa',
      name: 'Subset DFA',
      subtitle: 'Power set deterministic construction',
      angle: 90,
      radius: 145,
      color: '#878D6B',
      activeColor: '#B4492A',
    },
    {
      id: 'min_dfa',
      name: 'Minimized DFA',
      subtitle: 'Hopcroft partition refinement',
      angle: 30,
      radius: 145,
      color: '#878D6B',
      activeColor: '#B4492A',
    },
    {
      id: 'nlp',
      name: 'NLP Classifier',
      subtitle: 'TF-IDF + Naive Bayes semantics',
      angle: 330,
      radius: 145,
      color: '#878D6B',
      activeColor: '#B4492A',
    },
    {
      id: 'fusion',
      name: 'Risk Fusion',
      subtitle: '60% Structural + 40% NLP synthesis',
      angle: 270,
      radius: 145,
      color: '#878D6B',
      activeColor: '#B4492A',
    },
  ];

  const hasRecent = !!recentAnalysis;
  const isPhishing = recentAnalysis?.verdict === 'Phishing';
  const isSuspicious = recentAnalysis?.verdict === 'Suspicious';

  const verdictBadgeColor = isPhishing
    ? 'text-cipher-danger bg-cipher-danger/10 border-cipher-danger/30'
    : isSuspicious
    ? 'text-cipher-amber bg-cipher-amber/10 border-cipher-amber/30'
    : 'text-cipher-green bg-cipher-green/10 border-cipher-green/30';

  const verdictIcon = isPhishing ? (
    <ShieldAlert className="w-4 h-4 text-cipher-danger" />
  ) : isSuspicious ? (
    <AlertTriangle className="w-4 h-4 text-cipher-amber" />
  ) : (
    <ShieldCheck className="w-4 h-4 text-cipher-green" />
  );

  return (
    <div className="space-y-8">
      {/* 1. Two-Column Hero Inspired by Cipher */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center cipher-surface rounded-2xl border border-cipher-border p-6 sm:p-10 relative overflow-hidden">
        {/* Subtle background ambient gradients */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-cipher-terracotta/5 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-20 w-80 h-80 rounded-full bg-cipher-sage/5 blur-3xl pointer-events-none" />

        {/* Left Column: Headline, Description, CTAs, Pipeline stages */}
        <div className="lg:col-span-7 space-y-6 z-10">
          {/* Eyebrow Label and Backend Connection */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cipher-elevated border border-cipher-border">
              <span className="w-1.5 h-1.5 rounded-full bg-cipher-terracotta animate-pulse" />
              <span className="text-[11px] font-mono font-semibold tracking-wider text-cipher-terracotta uppercase">
                EMAIL THREAT ANALYSIS
              </span>
            </div>

            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cipher-elevated border border-cipher-border text-[10px] font-mono text-cipher-muted">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  backendStatus === 'healthy'
                    ? 'bg-cipher-green shadow-sm shadow-cipher-green/50'
                    : backendStatus === 'checking'
                    ? 'bg-cipher-amber animate-pulse'
                    : 'bg-cipher-danger'
                }`}
              />
              <span>
                {backendStatus === 'healthy'
                  ? `API Connected (${backendVersion || 'v0.1.0'})`
                  : backendStatus === 'checking'
                  ? 'Connecting...'
                  : 'Backend Disconnected'}
              </span>
            </div>
          </div>

          {/* Main Headline */}
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-cipher-text font-sans tracking-tight leading-[1.15]">
              Every signal.{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cipher-terracotta via-[#D97746] to-cipher-sage">
                Every transition.
              </span>
            </h1>
            <p className="text-sm sm:text-base text-cipher-muted leading-relaxed font-sans max-w-xl">
              Trace suspicious email patterns through finite automata, analyze language with NLP,
              and inspect the evidence behind every risk verdict.
            </p>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="button"
              onClick={onNavigateToAnalyze}
              className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-xl bg-cipher-terracotta hover:bg-[#C85331] text-cipher-text font-bold text-xs font-mono transition-all shadow-md shadow-cipher-terracotta/20 active:scale-95"
            >
              <Mail className="w-4 h-4" />
              <span>Analyze an Email</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onNavigateToAutomata}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cipher-elevated hover:bg-[#201F1C] text-cipher-muted hover:text-cipher-text font-semibold text-xs font-mono border border-cipher-border transition-all active:scale-95"
            >
              <Cpu className="w-4 h-4 text-cipher-sage" />
              <span>Explore Automata</span>
            </button>
          </div>

          {/* 3 Compact Pipeline Stages under headline */}
          <div className="pt-4 border-t border-cipher-border/80">
            <div className="text-[11px] font-mono uppercase tracking-wider text-cipher-muted mb-3">
              Computation Pipeline:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Stage 1 */}
              <div className="p-3 rounded-xl bg-cipher-elevated/70 border border-cipher-border flex items-center gap-3">
                <div className="p-2 rounded-lg bg-cipher-terracotta/10 border border-cipher-terracotta/30 text-cipher-terracotta shrink-0">
                  <Binary className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-cipher-text font-sans">
                    1. Structural Analysis
                  </div>
                  <div className="text-[11px] font-mono text-cipher-muted">
                    Regex &rarr; NFA &rarr; DFA
                  </div>
                </div>
              </div>

              {/* Stage 2 */}
              <div className="p-3 rounded-xl bg-cipher-elevated/70 border border-cipher-border flex items-center gap-3">
                <div className="p-2 rounded-lg bg-cipher-sage/15 border border-cipher-sage/30 text-cipher-sage shrink-0">
                  <Brain className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-cipher-text font-sans">
                    2. Language Analysis
                  </div>
                  <div className="text-[11px] font-mono text-cipher-muted">
                    TF-IDF + Naive Bayes
                  </div>
                </div>
              </div>

              {/* Stage 3 */}
              <div className="p-3 rounded-xl bg-cipher-elevated/70 border border-cipher-border flex items-center gap-3">
                <div className="p-2 rounded-lg bg-cipher-surface border border-cipher-border text-cipher-text shrink-0">
                  <Calculator className="w-4 h-4 text-cipher-terracotta" />
                </div>
                <div>
                  <div className="text-xs font-bold text-cipher-text font-sans">
                    3. Risk Fusion
                  </div>
                  <div className="text-[11px] font-mono text-cipher-muted">
                    0.6 &times; S + 0.4 &times; NLP
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Circular Signal Visualization */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center relative min-h-[360px] select-none">
          {/* Radial Waveform SVG */}
          <div className="relative w-[340px] h-[340px] sm:w-[380px] sm:h-[380px] flex items-center justify-center">
            <svg
              className="w-full h-full"
              viewBox="-190 -190 380 380"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                {/* Terracotta-to-Sage Radial Gradient */}
                <radialGradient id="cipher-radial" cx="0" cy="0" r="100%">
                  <stop offset="0%" stopColor="#B4492A" stopOpacity="0.25" />
                  <stop offset="45%" stopColor="#878D6B" stopOpacity="0.12" />
                  <stop offset="100%" stopColor="#121110" stopOpacity="0" />
                </radialGradient>

                <linearGradient id="orbit-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#B4492A" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="#878D6B" stopOpacity="0.6" />
                </linearGradient>

                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Background ambient radial fill */}
              <circle cx="0" cy="0" r="175" fill="url(#cipher-radial)" />

              {/* Concentric Signal Rings */}
              {/* Outer Ring 1 */}
              <circle
                cx="0"
                cy="0"
                r="170"
                fill="none"
                stroke="#262422"
                strokeWidth="1"
                strokeDasharray="4 6"
              />

              {/* Main Orbital Track 2 (holds the 6 nodes) */}
              <circle
                cx="0"
                cy="0"
                r="145"
                fill="none"
                stroke={isDetecting ? 'url(#orbit-grad)' : '#262422'}
                strokeWidth={isDetecting ? 2 : 1}
                className={isDetecting ? 'animate-spin' : ''}
                style={{ transformOrigin: '0 0', animationDuration: '24s' }}
              />

              {/* Mid Ring 3 */}
              <circle
                cx="0"
                cy="0"
                r="110"
                fill="none"
                stroke="#262422"
                strokeWidth="1"
                strokeDasharray="2 4"
                opacity="0.7"
              />

              {/* Inner Waveform Ring 4 */}
              <circle
                cx="0"
                cy="0"
                r="75"
                fill="none"
                stroke="#B4492A"
                strokeWidth="1"
                strokeOpacity="0.3"
              />

              {/* Connecting Radial Ray Lines */}
              {pipelineNodes.map((node) => {
                const rad = (node.angle * Math.PI) / 180;
                const x = Math.cos(rad) * node.radius;
                const y = Math.sin(rad) * node.radius;
                const isHovered = hoveredNode === node.id;
                return (
                  <line
                    key={`ray-${node.id}`}
                    x1="0"
                    y1="0"
                    x2={x}
                    y2={y}
                    stroke={isHovered ? '#B4492A' : '#262422'}
                    strokeWidth={isHovered ? 1.5 : 0.75}
                    strokeDasharray={isHovered ? undefined : '2 3'}
                    opacity={isHovered ? 0.9 : 0.4}
                  />
                );
              })}

              {/* Moving Signal Marker (Simulating real-time signal sweep) */}
              <circle
                cx="0"
                cy="0"
                r="3"
                fill="#B4492A"
                filter="url(#glow)"
              >
                <animateTransform
                  attributeName="transform"
                  type="rotate"
                  from="0"
                  to="360"
                  dur={isDetecting ? '2.5s' : '9s'}
                  repeatCount="indefinite"
                />
              </circle>

              {/* Counter-rotating subtle pulse marker */}
              <circle
                cx="110"
                cy="0"
                r="2"
                fill="#878D6B"
                opacity="0.8"
              >
                <animateTransform
                  attributeName="transform"
                  type="rotate"
                  from="360 0 0"
                  to="0 0 0"
                  dur="14s"
                  repeatCount="indefinite"
                />
              </circle>

              {/* 6 Pipeline Stage Nodes */}
              {pipelineNodes.map((node, index) => {
                const rad = (node.angle * Math.PI) / 180;
                const x = Math.cos(rad) * node.radius;
                const y = Math.sin(rad) * node.radius;
                const isHovered = hoveredNode === node.id;
                const isActive = isDetecting || isHovered;

                return (
                  <g
                    key={node.id}
                    transform={`translate(${x}, ${y})`}
                    className="cursor-pointer group"
                    onMouseEnter={() => setHoveredNode(node.id)}
                    onMouseLeave={() => setHoveredNode(null)}
                  >
                    {/* Outer halo */}
                    <circle
                      r={isHovered ? 20 : 16}
                      fill="#121110"
                      stroke={isActive ? '#B4492A' : '#262422'}
                      strokeWidth={isHovered ? 2 : 1}
                      className="transition-all duration-200"
                    />

                    {/* Node interior fill */}
                    <circle
                      r="10"
                      fill={isActive ? '#191816' : '#121110'}
                      stroke={isActive ? '#878D6B' : '#262422'}
                      strokeWidth="1"
                    />

                    {/* Index or dot */}
                    <text
                      x="0"
                      y="3.5"
                      textAnchor="middle"
                      fill={isActive ? '#F2F0EC' : '#A2A19F'}
                      fontSize="9"
                      fontFamily="JetBrains Mono, monospace"
                      fontWeight="700"
                    >
                      {index + 1}
                    </text>
                  </g>
                );
              })}

              {/* Central Core Signal Indicator */}
              <circle
                cx="0"
                cy="0"
                r="42"
                fill="#121110"
                stroke={hasRecent ? (isPhishing ? '#C74334' : isSuspicious ? '#C88A35' : '#4E8752') : '#262422'}
                strokeWidth="2"
              />

              <circle
                cx="0"
                cy="0"
                r="36"
                fill="#191816"
                stroke="#262422"
                strokeWidth="1"
              />
            </svg>

            {/* Central icon or metric positioned over SVG center */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
              <div className="p-2 rounded-full bg-cipher-surface border border-cipher-border text-cipher-terracotta">
                <Shield className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono font-bold text-cipher-text uppercase tracking-wider mt-1">
                PhishGuard
              </span>
              <span className="text-[9px] font-mono text-cipher-muted">
                {isDetecting ? 'Analyzing...' : hasRecent ? `${recentAnalysis.verdict}` : 'Ready'}
              </span>
            </div>
          </div>

          {/* Interactive Node Info Box underneath the ring */}
          <div className="h-12 flex items-center justify-center text-center">
            {hoveredNode ? (
              (() => {
                const node = pipelineNodes.find((n) => n.id === hoveredNode);
                return (
                  <div className="px-3.5 py-1.5 rounded-lg bg-cipher-elevated border border-cipher-border text-xs font-mono animate-in fade-in duration-150">
                    <span className="font-bold text-cipher-terracotta mr-1.5">{node?.name}:</span>
                    <span className="text-cipher-muted">{node?.subtitle}</span>
                  </div>
                );
              })()
            ) : (
              <div className="text-[11px] font-mono text-cipher-muted flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cipher-sage" />
                <span>Hover nodes to inspect pipeline components</span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 2. Below Hero: Functional Recent-Analysis Summary OR Useful Empty State */}
      {recentAnalysis ? (
        <section className="cipher-surface rounded-2xl border border-cipher-border p-6 sm:p-7 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-cipher-border">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-cipher-sage" />
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-cipher-text">
                Recent Analysis Summary
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`px-3 py-1 rounded-full text-xs font-mono font-semibold border flex items-center gap-1.5 ${verdictBadgeColor}`}
              >
                {verdictIcon}
                <span>{recentAnalysis.verdict}</span>
              </span>
              <span className="text-xs font-mono text-cipher-muted">
                ({recentAnalysis.execution_time_ms} ms)
              </span>
            </div>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
            {/* Final Risk Score */}
            <div className="p-3.5 rounded-xl bg-cipher-elevated border border-cipher-border">
              <span className="text-[10px] text-cipher-muted uppercase block tracking-wider">
                Final Risk Score
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span
                  className={`text-2xl font-extrabold ${
                    recentAnalysis.final_score >= 70
                      ? 'text-cipher-danger'
                      : recentAnalysis.final_score >= 35
                      ? 'text-cipher-amber'
                      : 'text-cipher-green'
                  }`}
                >
                  {recentAnalysis.final_score.toFixed(1)}
                </span>
                <span className="text-[10px] text-cipher-muted"> / 100</span>
              </div>
            </div>

            {/* Structural Score */}
            <div className="p-3.5 rounded-xl bg-cipher-elevated border border-cipher-border">
              <span className="text-[10px] text-cipher-muted uppercase block tracking-wider">
                Structural Score (60%)
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-2xl font-extrabold text-cipher-sage">
                  {recentAnalysis.structural_score.toFixed(1)}
                </span>
                <span className="text-[10px] text-cipher-muted"> / 100</span>
              </div>
            </div>

            {/* NLP Score */}
            <div className="p-3.5 rounded-xl bg-cipher-elevated border border-cipher-border">
              <span className="text-[10px] text-cipher-muted uppercase block tracking-wider">
                NLP Score (40%)
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-2xl font-extrabold text-cipher-terracotta">
                  {recentAnalysis.nlp_score.toFixed(1)}
                </span>
                <span className="text-[10px] text-cipher-muted"> / 100</span>
              </div>
            </div>

            {/* Rules Matched */}
            <div className="p-3.5 rounded-xl bg-cipher-elevated border border-cipher-border">
              <span className="text-[10px] text-cipher-muted uppercase block tracking-wider">
                Structural Rules
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-2xl font-extrabold text-cipher-text">
                  {recentAnalysis.matched_indicators.length}
                </span>
                <span className="text-[10px] text-cipher-muted"> matched</span>
              </div>
            </div>
          </div>

          {/* Tested URL details */}
          <div className="p-3.5 rounded-xl bg-cipher-elevated border border-cipher-border text-xs font-mono space-y-1">
            <span className="text-[10px] text-cipher-muted uppercase tracking-wider block">
              Destination URL Analyzed:
            </span>
            <code className="text-cipher-sage font-bold break-all block">
              {recentAnalysis.input_summary.extracted_url ||
                recentAnalysis.input_summary.url ||
                'N/A'}
            </code>
          </div>

          {/* Deep link actions to other sections */}
          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            <button
              type="button"
              onClick={onNavigateToAutomata}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium text-cipher-sage bg-cipher-sage/10 border border-cipher-sage/25 hover:bg-cipher-sage/20 transition-all"
            >
              <span>Inspect in Automata Lab</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={onNavigateToNLP}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium text-cipher-terracotta bg-cipher-terracotta/10 border border-cipher-terracotta/25 hover:bg-cipher-terracotta/20 transition-all"
            >
              <span>View NLP Details</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={onNavigateToFusion}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium text-cipher-text bg-cipher-elevated border border-cipher-border hover:bg-[#201F1C] transition-all"
            >
              <span>View Risk Fusion</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </section>
      ) : (
        <section className="cipher-surface rounded-2xl border border-dashed border-cipher-border p-8 text-center space-y-3">
          <p className="text-xs text-cipher-muted font-mono">
            No email analysis has been performed yet in this session.
          </p>
          <button
            type="button"
            onClick={onNavigateToAnalyze}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-mono text-cipher-terracotta hover:text-[#C85331] bg-cipher-terracotta/10 hover:bg-cipher-terracotta/20 border border-cipher-terracotta/30 transition-all"
          >
            <span>Submit an email to evaluate real-time automata and NLP results</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </section>
      )}
    </div>
  );
};
