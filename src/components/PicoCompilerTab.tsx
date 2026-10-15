import React, { useState } from 'react';
import { 
  Sparkles, 
  Copy, 
  Check, 
  ExternalLink, 
  FileCode2, 
  Search, 
  Loader2,
  Wand2,
  AlertCircle,
  X,
  ArrowDown,
  Layers
} from 'lucide-react';
import { 
  compilePicoQueries, 
  buildPlatformUrls, 
  buildPicoFederatedQuery,
  SAMPLE_PICO_PRESETS,
  type PicoQueryState 
} from '../services/picoQueryService';
import type { LLMConfig } from '../services/llmService';
import { DEFAULT_LLM_CONFIG } from '../services/llmService';
import { generatePicoFromQuestion, isLlmConfigured } from '../services/aiScholarExtensions';

interface PicoCompilerTabProps {
  onExecuteSearch?: (queryText: string, focusText?: string) => void;
  onApplyQueryToSearch?: (queryText: string, focusText?: string) => void;
  isSearching?: boolean;
  searchProgressMsg?: string;
  hasDiscoveredPapers?: boolean;
  discoveredCount?: number;
  onScrollToResults?: () => void;
  llmConfig?: LLMConfig;
  initialQuestion?: string;
}

export const PicoCompilerTab: React.FC<PicoCompilerTabProps> = ({
  onExecuteSearch,
  onApplyQueryToSearch,
  isSearching = false,
  searchProgressMsg = '',
  hasDiscoveredPapers = false,
  discoveredCount = 0,
  onScrollToResults,
  llmConfig = DEFAULT_LLM_CONFIG,
  initialQuestion = '',
}) => {
  const [picoState, setPicoState] = useState<PicoQueryState>({
    population: '',
    intervention: '',
    comparison: '',
    outcome: '',
  });

  const [questionInput, setQuestionInput] = useState(initialQuestion);
  const [isGeneratingWithLlm, setIsGeneratingWithLlm] = useState(false);
  const [llmNotice, setLlmNotice] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Sync initialQuestion if provided from Intelligent Scholarly Workbench
  React.useEffect(() => {
    if (initialQuestion && initialQuestion.trim() && !questionInput) {
      setQuestionInput(initialQuestion);
    }
  }, [initialQuestion]);

  const handleGenerateFromQuestion = async () => {
    if (!questionInput.trim()) return;

    if (!isLlmConfigured(llmConfig)) {
      setLlmNotice('Optional LLM is not configured. You can configure an OpenAI, Gemini, Claude, or local Ollama engine in Master Settings (gear icon in navbar).');
      return;
    }

    setIsGeneratingWithLlm(true);
    setLlmNotice(null);
    setValidationError(null);

    try {
      const result = await generatePicoFromQuestion(questionInput, llmConfig);
      if (result) {
        setPicoState(result);
      } else {
        setLlmNotice('Could not parse question into PICO framework. Please check model response or use manual presets.');
      }
    } catch (err: any) {
      setLlmNotice(err.message || 'AI generation failed.');
    } finally {
      setIsGeneratingWithLlm(false);
    }
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const compiledPico = compilePicoQueries(picoState);
  const platformUrls = buildPlatformUrls(compiledPico);
  const hasPicoTerms = Boolean(
    picoState.population || 
    picoState.intervention || 
    picoState.comparison || 
    picoState.outcome ||
    questionInput
  );

  const handleClearPico = () => {
    setPicoState({ population: '', intervention: '', comparison: '', outcome: '' });
    setQuestionInput('');
    setValidationError(null);
  };

  const handleApplyPreset = (preset: typeof SAMPLE_PICO_PRESETS[0]) => {
    setPicoState({
      population: preset.population,
      intervention: preset.intervention,
      comparison: preset.comparison,
      outcome: preset.outcome,
    });
    setQuestionInput(preset.label);
    setValidationError(null);
  };

  const handleTriggerSearch = () => {
    const payload = buildPicoFederatedQuery(picoState);
    const queryToRun = payload.federatedQuery || payload.topic;
    if (!queryToRun || (!picoState.population && !picoState.intervention)) {
      setValidationError('Please enter at least Population or Intervention terms to execute federated discovery.');
      return;
    }
    setValidationError(null);

    if (onExecuteSearch) {
      onExecuteSearch(queryToRun, payload.focus);
    } else if (onApplyQueryToSearch) {
      onApplyQueryToSearch(queryToRun, payload.focus);
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      
      {/* Header & Controls Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/60 shadow-xs">
        <div>
          <h3 className="text-sm font-bold text-amber-950 dark:text-amber-200 font-serif flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
            <span>PICO Systematic Search Strategy Formulator</span>
          </h3>
          <p className="text-xs text-amber-800/80 dark:text-amber-400 mt-0.5 font-sans">
            Build rigorous, PRISMA-compliant boolean queries across PubMed, Embase, Cochrane Library, and Web of Science.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {hasPicoTerms && (
            <button
              type="button"
              onClick={handleTriggerSearch}
              disabled={isSearching}
              className={`btn-academic-primary px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50 transition ${
                isSearching ? 'animate-pulse' : ''
              }`}
            >
              {isSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
              <span>{isSearching ? (searchProgressMsg || 'Searching Registries...') : 'Execute Federated Discovery'}</span>
            </button>
          )}

          {hasPicoTerms && (
            <button
              type="button"
              onClick={() => handleCopy(compiledPico.prismaSummary, 'prisma-strategy-top')}
              className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 border border-slate-300 dark:border-slate-700 cursor-pointer transition shadow-2xs"
              title="Copy PRISMA 2020 Search Strategy Document"
            >
              {copiedKey === 'prisma-strategy-top' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedKey === 'prisma-strategy-top' ? 'Strategy Copied' : 'Copy PRISMA Strategy'}</span>
            </button>
          )}

          {hasPicoTerms && (
            <button
              type="button"
              onClick={handleClearPico}
              className="px-2.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-xs font-bold text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900 cursor-pointer transition flex items-center gap-1"
              title="Clear all fields"
            >
              <X className="w-3 h-3" />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* Validation or LLM Alert */}
      {validationError && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      {/* AI Assistant Question-to-PICO Box */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50/70 via-indigo-50/50 to-purple-50/60 dark:from-blue-950/40 dark:via-indigo-950/30 dark:to-purple-950/40 border border-blue-200/80 dark:border-blue-900/60 shadow-xs space-y-2.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-blue-950 dark:text-blue-200 uppercase tracking-wider font-serif flex items-center gap-1.5">
            <Wand2 className="w-4 h-4 text-blue-700 dark:text-blue-400" />
            <span>AI Natural Language Question to PICO Formulator</span>
          </label>
          <span className="text-[11px] text-slate-500 font-sans">
            Auto-parses clinical and empirical questions
          </span>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={questionInput}
              onChange={(e) => setQuestionInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleGenerateFromQuestion()}
              placeholder="e.g. Do SGLT2 inhibitors lower cardiovascular mortality in heart failure patients with preserved ejection fraction?"
              className="w-full px-3.5 py-2.5 pr-8 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-700 font-sans"
            />
            {questionInput && (
              <button
                type="button"
                onClick={() => setQuestionInput('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
                title="Clear question"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={handleGenerateFromQuestion}
            disabled={isGeneratingWithLlm || !questionInput.trim()}
            className="btn-academic-primary px-5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50"
          >
            {isGeneratingWithLlm ? <Loader2 className="w-3.5 h-3.5 animate-spin text-white" /> : <Sparkles className="w-3.5 h-3.5 text-amber-300" />}
            <span>Auto-Formulate PICO</span>
          </button>
        </div>

        {llmNotice && (
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>{llmNotice}</span>
          </div>
        )}

        {/* 1-Click Interactive Discipline Presets */}
        <div className="pt-1 flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1 mr-1">
            <Layers className="w-3 h-3 text-blue-600" />
            <span>Presets:</span>
          </span>
          {SAMPLE_PICO_PRESETS.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleApplyPreset(preset)}
              className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-white/80 dark:bg-slate-900/80 hover:bg-blue-50 dark:hover:bg-blue-950/60 text-slate-700 dark:text-slate-300 hover:text-blue-900 dark:hover:text-blue-200 border border-slate-200 dark:border-slate-800 transition cursor-pointer shadow-2xs"
            >
              {preset.label.split('(')[0].trim()}
            </button>
          ))}
        </div>
      </div>

      {/* 4 PICO Structured Input Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        
        {/* P: Population */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 shadow-xs">
          <label className="font-bold text-blue-900 dark:text-blue-300 uppercase tracking-wider block font-serif flex items-center justify-between">
            <span>P: Population / Problem / Cohort</span>
            <span className="text-[10px] font-sans text-slate-400 font-normal">Target demographic</span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={picoState.population}
              onChange={(e) => setPicoState({ ...picoState, population: e.target.value })}
              placeholder="e.g. HFpEF patients, heart failure with preserved ejection fraction"
              className="w-full px-3.5 py-2.5 pr-8 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-blue-700 font-sans"
            />
            {picoState.population && (
              <button
                type="button"
                onClick={() => setPicoState({ ...picoState, population: '' })}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
                title="Clear field"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <span className="text-[11px] text-slate-500 block">
            Separate synonyms with commas or OR (e.g. ICU nurses, critical care staff)
          </span>
        </div>

        {/* I: Intervention */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 shadow-xs">
          <label className="font-bold text-emerald-900 dark:text-emerald-300 uppercase tracking-wider block font-serif flex items-center justify-between">
            <span>I: Intervention / Exposure / Treatment</span>
            <span className="text-[10px] font-sans text-slate-400 font-normal">Primary protocol</span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={picoState.intervention}
              onChange={(e) => setPicoState({ ...picoState, intervention: e.target.value })}
              placeholder="e.g. SGLT2 inhibitors, empagliflozin, dapagliflozin"
              className="w-full px-3.5 py-2.5 pr-8 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-blue-700 font-sans"
            />
            {picoState.intervention && (
              <button
                type="button"
                onClick={() => setPicoState({ ...picoState, intervention: '' })}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
                title="Clear field"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <span className="text-[11px] text-slate-500 block">
            Investigational drug, intervention, or clinical policy
          </span>
        </div>

        {/* C: Comparison */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 shadow-xs">
          <label className="font-bold text-purple-900 dark:text-purple-300 uppercase tracking-wider block font-serif flex items-center justify-between">
            <span>C: Comparison / Control (Optional)</span>
            <span className="text-[10px] font-sans text-slate-400 font-normal">Baseline comparison</span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={picoState.comparison}
              onChange={(e) => setPicoState({ ...picoState, comparison: e.target.value })}
              placeholder="e.g. placebo, standard care, conventional therapy"
              className="w-full px-3.5 py-2.5 pr-8 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-blue-700 font-sans"
            />
            {picoState.comparison && (
              <button
                type="button"
                onClick={() => setPicoState({ ...picoState, comparison: '' })}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
                title="Clear field"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <span className="text-[11px] text-slate-500 block">
            Baseline comparison group or standard of care
          </span>
        </div>

        {/* O: Outcome */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 shadow-xs">
          <label className="font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wider block font-serif flex items-center justify-between">
            <span>O: Outcomes / Endpoints / Metrics</span>
            <span className="text-[10px] font-sans text-slate-400 font-normal">Dependent variable</span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={picoState.outcome}
              onChange={(e) => setPicoState({ ...picoState, outcome: e.target.value })}
              placeholder="e.g. cardiovascular death, hospitalization, quality of life"
              className="w-full px-3.5 py-2.5 pr-8 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-blue-700 font-sans"
            />
            {picoState.outcome && (
              <button
                type="button"
                onClick={() => setPicoState({ ...picoState, outcome: '' })}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
                title="Clear field"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <span className="text-[11px] text-slate-500 block">
            Quantifiable outcomes, adverse events, or mortality endpoints
          </span>
        </div>

      </div>

      {/* Discovered Evidence Quick-Jump Banner if papers already exist */}
      {hasDiscoveredPapers && discoveredCount > 0 && onScrollToResults && (
        <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-blue-950/40 border border-emerald-300 dark:border-emerald-800 flex flex-wrap items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-950 dark:text-emerald-200">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span><strong>{discoveredCount}</strong> peer-reviewed papers discovered for this research line.</span>
          </div>
          <button
            type="button"
            onClick={onScrollToResults}
            className="px-3.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs transition"
          >
            <span>Review Discovered Papers in Workspace Below</span>
            <ArrowDown className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Target Platform Boolean Formulations & 1-Click Launchers */}
      <div className="space-y-4 pt-1">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider font-serif flex items-center gap-1.5">
            <FileCode2 className="w-4 h-4 text-blue-700" />
            <span>Target Platform Boolean Formulations & 1-Click External Launchers</span>
          </h4>

          <div className="flex items-center gap-2">
            {hasPicoTerms && (
              <button
                type="button"
                onClick={handleTriggerSearch}
                disabled={isSearching}
                className="btn-academic-primary px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition cursor-pointer disabled:opacity-50"
                title="Execute multi-source federated search across OpenAlex, Europe PMC, Crossref, and Semantic Scholar"
              >
                {isSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                <span>Execute Federated Discovery</span>
              </button>
            )}

            <button
              type="button"
              disabled={!hasPicoTerms}
              onClick={() => handleCopy(compiledPico.prismaSummary, 'prisma-doc')}
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1 border border-slate-300 dark:border-slate-700 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs transition"
            >
              {copiedKey === 'prisma-doc' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>Copy Full PRISMA Strategy</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {platformUrls.map((item) => (
            <div
              key={item.platform}
              className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2.5 shadow-xs"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-blue-950 dark:text-blue-200 font-serif">
                    {item.name}
                  </span>
                  <span className="text-[10px] text-slate-500 hidden sm:inline">
                    {item.description}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={!item.query}
                    onClick={() => handleCopy(item.query, item.platform)}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-200 flex items-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs transition"
                  >
                    {copiedKey === item.platform ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedKey === item.platform ? 'Copied' : 'Copy Query'}</span>
                  </button>

                  {item.query ? (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1 rounded-lg bg-blue-900 hover:bg-blue-950 text-white text-xs font-semibold flex items-center gap-1 shadow-2xs transition"
                    >
                      <span>Launch in {item.name.split(' ')[0]}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/60 text-slate-400 dark:text-slate-600 text-xs font-semibold flex items-center gap-1 cursor-not-allowed opacity-50 border border-slate-200 dark:border-slate-800"
                    >
                      <span>Launch in {item.name.split(' ')[0]}</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {item.query ? (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-xs text-slate-800 dark:text-slate-200 break-all select-all leading-relaxed">
                  {item.query}
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-slate-50/60 dark:bg-slate-950/40 border border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-400 dark:text-slate-500 italic select-none">
                  No query compiled yet. Enter terms in the boxes above to generate {item.name} syntax.
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
