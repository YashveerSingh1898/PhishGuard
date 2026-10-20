import React, { useState } from 'react';
import {
  Brain,
  FileText,
  Filter,
  BarChart2,
  ChevronDown,
  ChevronUp,
  Info,
  Scale,
} from 'lucide-react';
import { DetectionResponse } from '../types';

interface NLPAnalysisViewProps {
  result: DetectionResponse | null;
}

export const NLPAnalysisView: React.FC<NLPAnalysisViewProps> = ({ result }) => {
  // Expandable panel toggles
  const [expandedPanels, setExpandedPanels] = useState<{
    preprocessed: boolean;
    tokens: boolean;
    tfidf: boolean;
    probabilities: boolean;
  }>({
    preprocessed: true,
    tokens: true,
    tfidf: false,
    probabilities: true,
  });

  const togglePanel = (key: keyof typeof expandedPanels) => {
    setExpandedPanels((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (!result) {
    return (
      <div className="cipher-surface rounded-2xl border border-dashed border-cipher-border p-8 text-center space-y-3">
        <Brain className="w-8 h-8 text-cipher-muted mx-auto" />
        <h3 className="text-base font-bold text-cipher-text font-sans">No NLP Analysis Available</h3>
        <p className="text-xs text-cipher-muted font-mono">
          Submit an email in the "Analyze Email" section to view real linguistic classification.
        </p>
      </div>
    );
  }

  const isPhishing = result.predicted_class === 'Phishing';
  const probPhishing = result.class_probabilities['Phishing'] || (result.nlp_score / 100);
  const probLegitimate = result.class_probabilities['Legitimate'] || (1 - probPhishing);

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="cipher-surface rounded-2xl border border-cipher-border p-6 sm:p-7 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-cipher-border">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-cipher-terracotta/10 text-cipher-terracotta border border-cipher-terracotta/30 shadow-inner">
                <Brain className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-cipher-text font-sans tracking-tight">
                  NLP Linguistic Analysis Layer
                </h2>
                <span className="text-[11px] text-cipher-terracotta font-mono">
                  Multinomial Naive Bayes + TF-IDF Vectorizer
                </span>
              </div>
            </div>
            <p className="text-xs text-cipher-muted mt-1 font-sans">
              Evaluates email body text for psychological urgency, credential phishing triggers, and coerced compliance patterns.
            </p>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="text-cipher-muted">NLP Score:</span>
            <span className="text-2xl font-extrabold text-cipher-terracotta">{result.nlp_score.toFixed(1)}</span>
            <span className="text-[10px] text-cipher-muted">/ 100</span>
          </div>
        </div>

        {/* 2. Compact Horizontal Progression */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-mono uppercase text-cipher-muted font-semibold tracking-wider block">
            Linguistic Processing Pipeline:
          </span>
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
            <div className="px-3 py-1.5 rounded-lg bg-cipher-elevated border border-cipher-border text-cipher-text flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-cipher-muted" />
              <span>1. Raw Text</span>
            </div>
            <span className="text-cipher-border">&rarr;</span>
            <div className="px-3 py-1.5 rounded-lg bg-cipher-elevated border border-cipher-sage/30 text-cipher-sage flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-cipher-sage" />
              <span>2. Preprocessing</span>
            </div>
            <span className="text-cipher-border">&rarr;</span>
            <div className="px-3 py-1.5 rounded-lg bg-cipher-elevated border border-cipher-terracotta/30 text-cipher-terracotta flex items-center gap-1.5">
              <BarChart2 className="w-3.5 h-3.5 text-cipher-terracotta" />
              <span>3. TF-IDF</span>
            </div>
            <span className="text-cipher-border">&rarr;</span>
            <div className="px-3 py-1.5 rounded-lg bg-cipher-elevated border border-cipher-border text-cipher-text font-bold flex items-center gap-1.5">
              <Brain className="w-3.5 h-3.5 text-cipher-terracotta" />
              <span>4. Naive Bayes</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Core Classification Summary Card */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
        <div className="p-4 rounded-xl cipher-surface border border-cipher-border">
          <span className="text-[10px] text-cipher-muted uppercase tracking-wider block">Predicted Class</span>
          <span
            className={`text-xl font-bold mt-1 block ${
              isPhishing ? 'text-cipher-danger' : 'text-cipher-green'
            }`}
          >
            {result.predicted_class}
          </span>
          <span className="text-[10px] text-cipher-muted mt-0.5 block">
            P(Phishing) = {(probPhishing * 100).toFixed(1)}%
          </span>
        </div>

        <div className="p-4 rounded-xl cipher-surface border border-cipher-border">
          <span className="text-[10px] text-cipher-muted uppercase tracking-wider block">NLP Risk Score</span>
          <span className="text-xl font-bold text-cipher-terracotta mt-1 block">
            {result.nlp_score.toFixed(1)} <span className="text-xs text-cipher-muted">/ 100</span>
          </span>
          <span className="text-[10px] text-cipher-muted mt-0.5 block">
            Weighted Contribution: {result.nlp_contribution.toFixed(1)} pts
          </span>
        </div>

        <div className="p-4 rounded-xl cipher-surface border border-cipher-border">
          <span className="text-[10px] text-cipher-muted uppercase tracking-wider block">Classification Margin</span>
          <span className="text-xl font-bold text-cipher-text mt-1 block">
            {(Math.abs(probPhishing - probLegitimate) * 100).toFixed(1)}%
          </span>
          <span className="text-[10px] text-cipher-muted mt-0.5 block">
            Laplace Smoothing (&alpha; = 1.0)
          </span>
        </div>
      </div>

      {/* 4. Individually Expandable Panels */}
      <div className="space-y-3">
        {/* Panel 1: Preprocessed Text */}
        <div className="rounded-xl cipher-surface border border-cipher-border overflow-hidden">
          <button
            type="button"
            onClick={() => togglePanel('preprocessed')}
            className="w-full p-4 text-left flex items-center justify-between hover:bg-cipher-elevated transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <Filter className="w-4 h-4 text-cipher-sage" />
              <span className="text-xs font-mono font-bold text-cipher-text">
                1. Cleaned &amp; Normalized Text Representation
              </span>
            </div>
            {expandedPanels.preprocessed ? (
              <ChevronUp className="w-4 h-4 text-cipher-muted" />
            ) : (
              <ChevronDown className="w-4 h-4 text-cipher-muted" />
            )}
          </button>

          {expandedPanels.preprocessed && (
            <div className="p-4 pt-0 border-t border-cipher-border space-y-2 text-xs font-mono">
              <p className="text-[11px] text-cipher-muted font-sans mt-2">
                Normalized text after case-folding, URL tokenization, and punctuation removal:
              </p>
              <div className="p-3.5 rounded-lg bg-cipher-elevated border border-cipher-border text-cipher-text leading-relaxed break-words">
                {result.nlp_preprocessed_text || 'No text content available.'}
              </div>
            </div>
          )}
        </div>

        {/* Panel 2: Filtered Lexical Tokens */}
        <div className="rounded-xl cipher-surface border border-cipher-border overflow-hidden">
          <button
            type="button"
            onClick={() => togglePanel('tokens')}
            className="w-full p-4 text-left flex items-center justify-between hover:bg-cipher-elevated transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <FileText className="w-4 h-4 text-cipher-terracotta" />
              <span className="text-xs font-mono font-bold text-cipher-text">
                2. Filtered Lexical Tokens ({result.nlp_tokens?.length || 0})
              </span>
            </div>
            {expandedPanels.tokens ? (
              <ChevronUp className="w-4 h-4 text-cipher-muted" />
            ) : (
              <ChevronDown className="w-4 h-4 text-cipher-muted" />
            )}
          </button>

          {expandedPanels.tokens && (
            <div className="p-4 pt-0 border-t border-cipher-border space-y-2 text-xs font-mono">
              <p className="text-[11px] text-cipher-muted font-sans mt-2">
                Lexical tokens isolated for vocabulary matching and TF-IDF feature weighting:
              </p>
              {result.nlp_tokens && result.nlp_tokens.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 p-3 rounded-lg bg-cipher-elevated border border-cipher-border max-h-36 overflow-y-auto">
                  {result.nlp_tokens.map((tok, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-md bg-cipher-surface text-cipher-sage text-[11px] border border-cipher-border font-mono"
                    >
                      {tok}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="p-3 rounded-lg bg-cipher-elevated text-cipher-muted italic">No tokens found.</div>
              )}
            </div>
          )}
        </div>

        {/* Panel 3: TF-IDF Configuration */}
        <div className="rounded-xl cipher-surface border border-cipher-border overflow-hidden">
          <button
            type="button"
            onClick={() => togglePanel('tfidf')}
            className="w-full p-4 text-left flex items-center justify-between hover:bg-cipher-elevated transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <BarChart2 className="w-4 h-4 text-cipher-amber" />
              <span className="text-xs font-mono font-bold text-cipher-text">
                3. TF-IDF Vectorizer Parameters &amp; Feature Model
              </span>
            </div>
            {expandedPanels.tfidf ? (
              <ChevronUp className="w-4 h-4 text-cipher-muted" />
            ) : (
              <ChevronDown className="w-4 h-4 text-cipher-muted" />
            )}
          </button>

          {expandedPanels.tfidf && (
            <div className="p-4 pt-0 border-t border-cipher-border space-y-2 text-xs font-mono">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center pt-3">
                <div className="p-2.5 rounded-lg bg-cipher-elevated border border-cipher-border">
                  <span className="text-[10px] text-cipher-muted uppercase tracking-wider block">N-gram Range</span>
                  <span className="text-cipher-text font-bold text-xs mt-0.5 block">(1, 2) Uni + Bi</span>
                </div>
                <div className="p-2.5 rounded-lg bg-cipher-elevated border border-cipher-border">
                  <span className="text-[10px] text-cipher-muted uppercase tracking-wider block">Sublinear TF</span>
                  <span className="text-cipher-sage font-bold text-xs mt-0.5 block">1 + log(TF)</span>
                </div>
                <div className="p-2.5 rounded-lg bg-cipher-elevated border border-cipher-border">
                  <span className="text-[10px] text-cipher-muted uppercase tracking-wider block">Vector Norm</span>
                  <span className="text-cipher-terracotta font-bold text-xs mt-0.5 block">L2 Euclidean</span>
                </div>
                <div className="p-2.5 rounded-lg bg-cipher-elevated border border-cipher-border">
                  <span className="text-[10px] text-cipher-muted uppercase tracking-wider block">Smoothing</span>
                  <span className="text-cipher-green font-bold text-xs mt-0.5 block">Laplace (&alpha;=1.0)</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Panel 4: Naive Bayes Class Probabilities */}
        <div className="rounded-xl cipher-surface border border-cipher-border overflow-hidden">
          <button
            type="button"
            onClick={() => togglePanel('probabilities')}
            className="w-full p-4 text-left flex items-center justify-between hover:bg-cipher-elevated transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <Scale className="w-4 h-4 text-cipher-sage" />
              <span className="text-xs font-mono font-bold text-cipher-text">
                4. Bayesian Posterior Class Probability Distribution
              </span>
            </div>
            {expandedPanels.probabilities ? (
              <ChevronUp className="w-4 h-4 text-cipher-muted" />
            ) : (
              <ChevronDown className="w-4 h-4 text-cipher-muted" />
            )}
          </button>

          {expandedPanels.probabilities && (
            <div className="p-4 pt-0 border-t border-cipher-border space-y-3 text-xs font-mono">
              <div className="space-y-2.5 pt-3">
                {Object.entries(result.class_probabilities).map(([cls, prob]) => (
                  <div key={cls} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-cipher-text font-medium">{cls}:</span>
                      <span className="text-cipher-text font-bold">{(prob * 100).toFixed(2)}%</span>
                    </div>
                    <div className="w-full h-2 bg-cipher-elevated rounded-full overflow-hidden border border-cipher-border">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          cls === 'Phishing' ? 'bg-cipher-danger' : 'bg-cipher-green'
                        }`}
                        style={{ width: `${Math.min(100, prob * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Textual interpretation */}
              <div className="p-3.5 rounded-lg bg-cipher-elevated border border-cipher-border text-cipher-text/90 font-sans text-xs leading-relaxed">
                {result.reasons.find((r) => r.includes('P(Phishing)') || r.includes('P(Legitimate)')) ||
                  `Linguistic model classified message as ${result.predicted_class} with posterior probability ${(probPhishing * 100).toFixed(1)}%.`}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 5. Demonstration Model Academic Notice */}
      <div className="p-3.5 rounded-xl bg-cipher-elevated/70 border border-cipher-border text-[11px] text-cipher-muted flex items-start gap-2.5 font-sans">
        <Info className="w-4 h-4 text-cipher-amber shrink-0 mt-0.5" />
        <p>
          <strong className="text-cipher-amber font-medium">Demonstration Model Notice:</strong> {result.limitations_note}
        </p>
      </div>
    </div>
  );
};
