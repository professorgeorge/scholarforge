import React, { useState } from 'react';
import { 
  Sparkles, 
  Copy, 
  Check, 
  ExternalLink, 
  FileCode2, 
  Search, 
  ArrowRight,
  Loader2,
  Wand2,
  AlertCircle,
  X
} from 'lucide-react';
import { 
  compilePicoQueries, 
  buildPlatformUrls, 
  buildPicoFederatedQuery,
  type PicoQueryState 
} from '../services/picoQueryService';
import type { LLMConfig } from '../services/llmService';
import { DEFAULT_LLM_CONFIG } from '../services/llmService';
import { generatePicoFromQuestion, isLlmConfigured } from '../services/aiScholarExtensions';
import { executeFederatedSearch, type PrismaFlowStats } from '../services/federatedSearchEngine';
import type { AcademicPaper } from '../types/citation';
import { BookOpen, ChevronDown, ChevronUp } from 'lucide-react';

interface PicoCompilerTabProps {
  onApplyQueryToSearch?: (queryText: string, focusText?: string) => void;
  llmConfig?: LLMConfig;
  initialQuestion?: string;
}

export const PicoCompilerTab: React.FC<PicoCompilerTabProps> = ({
  onApplyQueryToSearch,
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

  // In-tab Live Federated Search Results State
  const [isFederatedSearching, setIsFederatedSearching] = useState(false);
  const [picoSearchProgress, setPicoSearchProgress] = useState('');
  const [discoveredPapers, setDiscoveredPapers] = useState<AcademicPaper[]>([]);
  const [prismaStats, setPrismaStats] = useState<PrismaFlowStats | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [expandedAbstractId, setExpandedAbstractId] = useState<string | null>(null);

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
  };

  const handleExecuteInTabFederatedSearch = async () => {
    const payload = buildPicoFederatedQuery(picoState);
    const queryToRun = payload.federatedQuery || payload.topic;
    if (!queryToRun) {
      setSearchError('Please enter at least Population or Intervention terms to execute search.');
      return;
    }

    setIsFederatedSearching(true);
    setPicoSearchProgress('Dispatching live PICO queries across OpenAlex, Europe PMC, Crossref, and Semantic Scholar...');
    setSearchError(null);
    setDiscoveredPapers([]);

    try {
      const result = await executeFederatedSearch(
        queryToRun,
        {
          limitPerSource: 30,
          excludePreprints: true,
        },
        (msg) => setPicoSearchProgress(msg)
      );
      setPrismaStats(result.prismaStats);
      if (result.papers.length === 0) {
        setSearchError('No peer-reviewed papers found across selected registries for this strategy. Try broader synonyms.');
      } else {
        setDiscoveredPapers(result.papers);
      }
    } catch (err: any) {
      setSearchError(err.message || 'Federated search failed.');
    } finally {
      setIsFederatedSearching(false);
      setPicoSearchProgress('');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header & Controls Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/60 shadow-xs">
        <div>
          <h3 className="text-sm font-bold text-amber-950 dark:text-amber-200 font-serif flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-600" />
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
              onClick={handleExecuteInTabFederatedSearch}
              disabled={isFederatedSearching}
              className="btn-academic-primary px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
            >
              {isFederatedSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
              <span>Execute Live PICO Search</span>
            </button>
          )}

          {onApplyQueryToSearch && hasPicoTerms && (
            <button
              type="button"
              onClick={() => {
                const payload = buildPicoFederatedQuery(picoState);
                onApplyQueryToSearch(payload.federatedQuery || payload.topic, payload.focus);
              }}
              className="px-3 py-1.5 rounded-xl bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/60 dark:hover:bg-blue-900 text-blue-900 dark:text-blue-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer border border-blue-300 dark:border-blue-800"
              title="Transfer query and open in Federated Discovery Studio"
            >
              <span>Transfer to Federated Tab</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          {hasPicoTerms && (
            <button
              type="button"
              onClick={handleClearPico}
              className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-xs font-bold text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900 cursor-pointer transition flex items-center gap-1"
              title="Clear all fields"
            >
              <X className="w-3 h-3" />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>


      {/* AI Assistant Question-to-PICO Box */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50/70 via-indigo-50/50 to-purple-50/60 dark:from-blue-950/40 dark:via-indigo-950/30 dark:to-purple-950/40 border border-blue-200/80 dark:border-blue-900/60 shadow-xs space-y-2.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-blue-950 dark:text-blue-200 uppercase tracking-wider font-serif flex items-center gap-1.5">
            <Wand2 className="w-4 h-4 text-blue-700 dark:text-blue-400" />
            <span>AI Natural Language Question to PICO Formulator</span>
          </label>
          <span className="text-[11px] text-slate-500 font-sans">
            Powered by active LLM engine
          </span>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={questionInput}
              onChange={(e) => setQuestionInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleGenerateFromQuestion()}
              placeholder="Enter your clinical or research question..."
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

        <p className="text-[11px] text-slate-500 font-sans italic">
          Example question: "Do SGLT2 inhibitors lower cardiovascular mortality in heart failure patients without diabetes?"
        </p>

        {llmNotice && (
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>{llmNotice}</span>
          </div>
        )}
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
              placeholder="Enter population / cohort terms..."
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
            Separate terms or synonyms with commas or OR (e.g. ICU nurses, critical care staff)
          </span>
        </div>

        {/* I: Intervention */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 shadow-xs">
          <label className="font-bold text-emerald-900 dark:text-emerald-300 uppercase tracking-wider block font-serif flex items-center justify-between">
            <span>I: Intervention / Treatment / Exposure</span>
            <span className="text-[10px] font-sans text-slate-400 font-normal">Primary protocol</span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={picoState.intervention}
              onChange={(e) => setPicoState({ ...picoState, intervention: e.target.value })}
              placeholder="Enter intervention or protocol terms..."
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
            Investigational drug, intervention, or clinical policy (e.g. resilience training, mindfulness)
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
              placeholder="Enter comparison / control terms (optional)..."
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
            Baseline comparison group or standard of care (e.g. standard shifts, placebo)
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
              placeholder="Enter measured endpoints or outcome terms..."
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
            Safety events, symptom remission, or quantifiable outcomes (e.g. burnout rates, turnover intention)
          </span>
        </div>

      </div>

      {/* Compiled Queries Section */}
      <div className="space-y-4 pt-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider font-serif flex items-center gap-1.5">
            <FileCode2 className="w-4 h-4 text-blue-700" />
            <span>Target Platform Boolean Formulations & 1-Click Launchers</span>
          </h4>

          <div className="flex items-center gap-2">
            {hasPicoTerms && (
              <button
                type="button"
                onClick={handleExecuteInTabFederatedSearch}
                disabled={isFederatedSearching}
                className="btn-academic-primary px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition cursor-pointer disabled:opacity-50"
                title="Execute multi-source federated search directly in this view"
              >
                {isFederatedSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                <span>Execute Federated Strategy</span>
              </button>
            )}

            {onApplyQueryToSearch && hasPicoTerms && (
              <button
                type="button"
                onClick={() => {
                  const payload = buildPicoFederatedQuery(picoState);
                  onApplyQueryToSearch(payload.federatedQuery || payload.topic, payload.focus);
                }}
                className="px-3.5 py-1.5 rounded-lg bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/60 dark:hover:bg-blue-900 text-blue-950 dark:text-blue-200 text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition cursor-pointer border border-blue-300 dark:border-blue-800"
                title="Transfer structured query and switch to Federated Discovery Tab"
              >
                <span>Transfer to Federated Tab</span>
                <ArrowRight className="w-3 h-3" />
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

        {/* LIVE IN-TAB FEDERATED SEARCH RESULTS */}
        {(isFederatedSearching || searchError || discoveredPapers.length > 0) && (
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm animate-in fade-in duration-200">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-blue-600" />
                <h4 className="text-sm font-bold text-slate-900 dark:text-white font-serif">
                  Live Federated Evidence Results
                </h4>
                {discoveredPapers.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 text-xs font-bold font-mono">
                    {discoveredPapers.length} Studies Included
                  </span>
                )}
              </div>

              {discoveredPapers.length > 0 && onApplyQueryToSearch && (
                <button
                  type="button"
                  onClick={() => {
                    const payload = buildPicoFederatedQuery(picoState);
                    onApplyQueryToSearch(payload.federatedQuery || payload.topic, payload.focus);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-blue-900 hover:bg-blue-950 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Open in Discovery Studio & Synthesize Manuscript</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* PRISMA flow indicator */}
            {prismaStats && (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
                <div className="flex items-center gap-4 text-slate-700 dark:text-slate-300">
                  <span><strong>Identified:</strong> {prismaStats.identification.totalIdentified}</span>
                  <span><strong>Deduplicated:</strong> {prismaStats.identification.duplicatesRemoved} removed</span>
                  <span><strong>Screened:</strong> {prismaStats.screening.recordsScreened}</span>
                  <span className="text-emerald-700 dark:text-emerald-400 font-bold"><strong>Included:</strong> {prismaStats.included.totalIncluded}</span>
                </div>
              </div>
            )}

            {isFederatedSearching && (
              <div className="p-8 rounded-2xl bg-gradient-to-b from-blue-50/90 via-white to-slate-50/90 dark:from-slate-900/95 dark:via-blue-950/30 dark:to-slate-900/95 border-2 border-blue-400 dark:border-blue-700 shadow-xl text-center space-y-5 animate-in fade-in duration-200">
                <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full bg-blue-500/20 animate-ping duration-1000" />
                  <div className="absolute inset-1 rounded-full border-2 border-blue-500/40 animate-spin border-t-transparent" />
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center shadow-lg shadow-blue-500/30">
                    <Search className="w-6 h-6 animate-pulse" />
                  </div>
                </div>

                <div className="space-y-1.5 max-w-md mx-auto">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-900 dark:text-blue-300 border border-blue-300 dark:border-blue-800 text-xs font-bold tracking-wide uppercase font-mono">
                    <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400 animate-ping" />
                    <span>Executing Live PICO Search</span>
                  </div>
                  <h4 className="text-base font-bold font-serif text-slate-900 dark:text-white">
                    Federated Multi-Registry Querying Active
                  </h4>
                </div>

                <div className="p-3 max-w-lg mx-auto rounded-xl bg-blue-500/10 dark:bg-blue-950/50 border border-blue-300 dark:border-blue-700 flex items-center justify-center gap-3 text-xs text-blue-950 dark:text-blue-200 font-medium">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600 dark:text-blue-400 shrink-0" />
                  <span className="font-mono text-left">{picoSearchProgress || 'Querying OpenAlex, Europe PMC / PubMed, Crossref, and Semantic Scholar...'}</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-w-xl mx-auto pt-1">
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800 text-center space-y-0.5">
                    <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-blue-900 dark:text-blue-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                      <span>OpenAlex</span>
                    </div>
                    <span className="text-[10px] text-slate-500">250M+ Works</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800 text-center space-y-0.5">
                    <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-purple-900 dark:text-purple-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
                      <span>Europe PMC</span>
                    </div>
                    <span className="text-[10px] text-slate-500">PubMed</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800 text-center space-y-0.5">
                    <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span>Crossref</span>
                    </div>
                    <span className="text-[10px] text-slate-500">DOIs</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800 text-center space-y-0.5">
                    <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-amber-800 dark:text-amber-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                      <span>S2 Graph</span>
                    </div>
                    <span className="text-[10px] text-slate-500">Citations</span>
                  </div>
                </div>

                <div className="w-full max-w-lg mx-auto h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-emerald-500 rounded-full animate-pulse w-full" />
                </div>
              </div>
            )}

            {searchError && (
              <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{searchError}</span>
              </div>
            )}

            {discoveredPapers.length > 0 && !isFederatedSearching && (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {discoveredPapers.map((paper) => {
                  const isExpanded = expandedAbstractId === paper.id;
                  return (
                    <div
                      key={paper.id}
                      className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-2 hover:border-blue-400 transition"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1 min-w-0">
                          <h5 className="text-xs font-bold text-slate-900 dark:text-white leading-snug">
                            {paper.title}
                          </h5>
                          <div className="text-[11px] text-slate-600 dark:text-slate-400 flex flex-wrap items-center gap-x-2 gap-y-1">
                            <span>{paper.authors.slice(0, 3).map((a) => a.name).join(', ')}{paper.authors.length > 3 ? ' et al.' : ''}</span>
                            <span>•</span>
                            <span className="font-semibold">{paper.venue}</span>
                            <span>•</span>
                            <span>{paper.year}</span>
                            {paper.citationCount !== undefined && (
                              <>
                                <span>•</span>
                                <span className="font-mono text-blue-700 dark:text-blue-300 font-semibold">{paper.citationCount} citations</span>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {paper.doi && (
                            <a
                              href={`https://doi.org/${paper.doi}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-[10px] font-mono hover:underline flex items-center gap-1"
                            >
                              <span>DOI</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}
                        </div>
                      </div>

                      {paper.abstract && (
                        <div>
                          <p className={`text-xs text-slate-600 dark:text-slate-400 font-sans leading-relaxed ${isExpanded ? '' : 'line-clamp-2'}`}>
                            {paper.abstract}
                          </p>
                          {paper.abstract.length > 140 && (
                            <button
                              type="button"
                              onClick={() => setExpandedAbstractId(isExpanded ? null : paper.id)}
                              className="text-[11px] text-blue-700 dark:text-blue-400 font-semibold hover:underline mt-1 cursor-pointer flex items-center gap-0.5"
                            >
                              <span>{isExpanded ? 'Show less' : 'Read abstract'}</span>
                              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}


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
