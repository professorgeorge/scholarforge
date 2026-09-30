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
  SAMPLE_PICO_PRESETS, 
  type PicoQueryState 
} from '../services/picoQueryService';
import type { LLMConfig } from '../services/llmService';
import { DEFAULT_LLM_CONFIG } from '../services/llmService';
import { generatePicoFromQuestion, isLlmConfigured } from '../services/aiScholarExtensions';

interface PicoCompilerTabProps {
  onApplyQueryToSearch?: (queryText: string) => void;
  llmConfig?: LLMConfig;
}

export const PicoCompilerTab: React.FC<PicoCompilerTabProps> = ({
  onApplyQueryToSearch,
  llmConfig = DEFAULT_LLM_CONFIG
}) => {
  const [picoState, setPicoState] = useState<PicoQueryState>({
    population: '',
    intervention: '',
    comparison: '',
    outcome: '',
  });

  const [questionInput, setQuestionInput] = useState('');
  const [isGeneratingWithLlm, setIsGeneratingWithLlm] = useState(false);
  const [llmNotice, setLlmNotice] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

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

  const handleApplyPicoPreset = (preset: typeof SAMPLE_PICO_PRESETS[0]) => {
    setPicoState({
      population: preset.population,
      intervention: preset.intervention,
      comparison: preset.comparison,
      outcome: preset.outcome,
    });
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

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header & Presets Strip */}
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

        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-slate-500 font-semibold text-[11px] mr-1">Load Preset:</span>
          {SAMPLE_PICO_PRESETS.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleApplyPicoPreset(preset)}
              className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800/80 hover:bg-amber-100/70 text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer shadow-2xs transition"
            >
              {preset.label.split(' ')[0]}
            </button>
          ))}
          {hasPicoTerms && (
            <button
              type="button"
              onClick={handleClearPico}
              className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-xs font-bold text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900 cursor-pointer transition ml-1 flex items-center gap-1"
              title="Clear all fields"
            >
              <X className="w-3 h-3" />
              <span>Clear All</span>
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
            {onApplyQueryToSearch && compiledPico.pubMed && (
              <button
                type="button"
                onClick={() => onApplyQueryToSearch(`${picoState.population} ${picoState.intervention}`)}
                className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-900 dark:text-blue-300 text-xs font-semibold flex items-center gap-1.5 border border-blue-200 dark:border-blue-800 cursor-pointer shadow-2xs transition"
              >
                <Search className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400" />
                <span>Search in ScholarForge Federated Engine</span>
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
