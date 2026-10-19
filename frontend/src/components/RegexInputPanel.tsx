import React, { useState } from 'react';
import { Play, Sparkles, AlertOctagon, HelpCircle, Code2 } from 'lucide-react';
import { AutomataApiError } from '../services/api';

interface RegexInputPanelProps {
  currentPattern: string;
  onPatternChange: (pattern: string) => void;
  onConvert: (pattern: string) => void;
  isLoading: boolean;
  error: AutomataApiError | Error | null;
  onClearError: () => void;
}

const SAMPLE_PATTERNS = [
  { label: '(a|b)*abb', desc: 'Classic subset construction with state reduction', category: 'Benchmark' },
  { label: 'a|b', desc: 'Thompson alternation with epsilon branches', category: 'Alternation' },
  { label: 'ab', desc: 'Thompson sequential concatenation', category: 'Concat' },
  { label: 'a*', desc: 'Kleene star zero-or-more loop', category: 'Star' },
  { label: 'a', desc: 'Single literal transition', category: 'Literal' },
  { label: '(a|b)+', desc: 'One-or-more repetition', category: 'Plus' },
  { label: 'a?b', desc: 'Optional prefix branch', category: 'Optional' },
  { label: '(0|1)*00', desc: 'Binary ending in 00', category: 'Binary' },
];

export const RegexInputPanel: React.FC<RegexInputPanelProps> = ({
  currentPattern,
  onPatternChange,
  onConvert,
  isLoading,
  error,
  onClearError,
}) => {
  const [showSyntaxGuide, setShowSyntaxGuide] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentPattern.trim()) {
      onConvert(currentPattern.trim());
    }
  };

  const handleSelectSample = (sample: string) => {
    onPatternChange(sample);
    onClearError();
    onConvert(sample);
  };

  const apiError = error instanceof AutomataApiError ? error : null;

  return (
    <div className="rounded-xl border border-navy-800 bg-navy-900/50 p-5 shadow-lg">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-4">
        <div>
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <Code2 className="w-4 h-4 text-teal-400" />
            <span>Regular Expression Input</span>
          </h2>
          <p className="text-xs text-slate-400">
            Specify a regular expression to construct its Thompson ε-NFA, Subset DFA, and Minimized DFA.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowSyntaxGuide(!showSyntaxGuide)}
          className="inline-flex items-center gap-1.5 text-xs text-teal-400 hover:text-teal-300 transition-colors w-fit"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>{showSyntaxGuide ? 'Hide Syntax Guide' : 'Syntax Guide'}</span>
        </button>
      </div>

      {/* Syntax Guide Dropdown / Accordion */}
      {showSyntaxGuide && (
        <div className="mb-4 p-3.5 rounded-lg bg-navy-950 border border-navy-800 text-xs text-slate-300 font-mono">
          <div className="font-semibold text-teal-300 mb-2">Supported Academic Grammar &amp; Precedence:</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-[11px]">
            <div className="p-2 rounded bg-navy-900/60 border border-navy-800">
              <span className="text-teal-400 font-bold">1. Grouping:</span> <code className="text-white">( ... )</code>
              <p className="text-slate-400 text-[10px] mt-0.5">Overrides operator precedence</p>
            </div>
            <div className="p-2 rounded bg-navy-900/60 border border-navy-800">
              <span className="text-teal-400 font-bold">2. Postfix:</span> <code className="text-white">*</code>, <code className="text-white">+</code>, <code className="text-white">?</code>
              <p className="text-slate-400 text-[10px] mt-0.5">Kleene star, one-or-more, optional</p>
            </div>
            <div className="p-2 rounded bg-navy-900/60 border border-navy-800">
              <span className="text-teal-400 font-bold">3. Concat:</span> <code className="text-white">ab</code>
              <p className="text-slate-400 text-[10px] mt-0.5">Implicit concatenation</p>
            </div>
            <div className="p-2 rounded bg-navy-900/60 border border-navy-800">
              <span className="text-teal-400 font-bold">4. Alternation:</span> <code className="text-white">|</code>
              <p className="text-slate-400 text-[10px] mt-0.5">Union / OR branch</p>
            </div>
            <div className="p-2 rounded bg-navy-900/60 border border-navy-800">
              <span className="text-teal-400 font-bold">5. Escapes:</span> <code className="text-white">\\*</code>, <code className="text-white">\\|</code>
              <p className="text-slate-400 text-[10px] mt-0.5">Backslash escapes for symbols</p>
            </div>
            <div className="p-2 rounded bg-navy-900/60 border border-navy-800">
              <span className="text-teal-400 font-bold">6. Literals:</span> <code className="text-white">a-z, 0-9, .</code>
              <p className="text-slate-400 text-[10px] mt-0.5">Alphabet characters</p>
            </div>
          </div>
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-stretch gap-3 mb-4">
        <div className="relative flex-1">
          <input
            type="text"
            value={currentPattern}
            onChange={(e) => {
              onPatternChange(e.target.value);
              if (error) onClearError();
            }}
            placeholder="e.g. (a|b)*abb"
            className="w-full h-11 px-4 font-mono text-sm bg-navy-950 text-white border border-navy-700 rounded-lg focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors placeholder:text-slate-500"
            disabled={isLoading}
            aria-label="Regular expression input"
            autoComplete="off"
            spellCheck="false"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading || !currentPattern.trim()}
          className="h-11 px-6 rounded-lg font-medium text-sm bg-teal-500 hover:bg-teal-400 disabled:bg-navy-800 disabled:text-slate-500 disabled:cursor-not-allowed text-navy-950 flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-teal-500/20"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-navy-950 border-t-transparent rounded-full animate-spin" />
              <span>Compiling...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              <span>Convert to Automata</span>
            </>
          )}
        </button>
      </form>

      {/* Error Callout */}
      {error && (
        <div className="mb-4 p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-3">
          <AlertOctagon className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-semibold text-rose-200">
              {apiError?.errorType || 'Syntax or Conversion Error'}
            </div>
            <p className="mt-0.5 leading-relaxed">{error.message}</p>
            {apiError?.position !== undefined && (
              <div className="mt-2 font-mono text-[11px] bg-navy-950/80 p-2 rounded border border-rose-500/20">
                <span className="text-slate-400">Position: {apiError.position}</span>
                <div className="mt-1 text-white">
                  {currentPattern}
                </div>
                <div className="text-rose-400 font-bold">
                  {' '.repeat(Math.max(0, apiError.position))}↑ (Error occurred here)
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sample Regular Expressions */}
      <div>
        <div className="text-xs text-slate-400 font-medium mb-2 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-teal-400" />
          <span>Preset Verification Patterns:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {SAMPLE_PATTERNS.map((sample) => (
            <button
              key={sample.label}
              type="button"
              onClick={() => handleSelectSample(sample.label)}
              disabled={isLoading}
              className={`px-2.5 py-1 rounded-md text-xs font-mono transition-all border ${
                currentPattern === sample.label
                  ? 'bg-teal-500/20 text-teal-300 border-teal-500/50'
                  : 'bg-navy-950 hover:bg-navy-800 text-slate-300 border-navy-800 hover:border-slate-600'
              }`}
              title={sample.desc}
            >
              {sample.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
