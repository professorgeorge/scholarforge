import React, { useState } from 'react';
import { 
  Sparkles, 
  Copy, 
  Check, 
  ExternalLink, 
  FileCode2, 
  Search, 
  ArrowRight
} from 'lucide-react';
import { 
  compilePicoQueries, 
  buildPlatformUrls, 
  SAMPLE_PICO_PRESETS, 
  type PicoQueryState 
} from '../services/picoQueryService';

interface PicoCompilerTabProps {
  onApplyQueryToSearch?: (queryText: string) => void;
}

export const PicoCompilerTab: React.FC<PicoCompilerTabProps> = ({
  onApplyQueryToSearch
}) => {
  const [picoState, setPicoState] = useState<PicoQueryState>({
    population: 'ICU nurses, critical care staff, healthcare providers',
    intervention: 'resilience training, mindfulness programs, peer debriefing',
    comparison: 'standard shifts, conventional staffing, no intervention',
    outcome: 'burnout rates, turnover intention, medical errors',
  });

  const [copiedKey, setCopiedKey] = useState<string | null>(null);

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
          <input
            type="text"
            value={picoState.population}
            onChange={(e) => setPicoState({ ...picoState, population: e.target.value })}
            placeholder="e.g. ICU nurses, critical care staff, healthcare workers"
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-blue-700 font-sans"
          />
          <span className="text-[11px] text-slate-500 block">Separate terms or synonyms with commas or OR</span>
        </div>

        {/* I: Intervention */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 shadow-xs">
          <label className="font-bold text-emerald-900 dark:text-emerald-300 uppercase tracking-wider block font-serif flex items-center justify-between">
            <span>I: Intervention / Treatment / Exposure</span>
            <span className="text-[10px] font-sans text-slate-400 font-normal">Primary protocol</span>
          </label>
          <input
            type="text"
            value={picoState.intervention}
            onChange={(e) => setPicoState({ ...picoState, intervention: e.target.value })}
            placeholder="e.g. resilience training, mindfulness, peer support programs"
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-blue-700 font-sans"
          />
          <span className="text-[11px] text-slate-500 block">Investigational drug, intervention, or clinical policy</span>
        </div>

        {/* C: Comparison */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 shadow-xs">
          <label className="font-bold text-purple-900 dark:text-purple-300 uppercase tracking-wider block font-serif flex items-center justify-between">
            <span>C: Comparison / Control (Optional)</span>
            <span className="text-[10px] font-sans text-slate-400 font-normal">Baseline comparison</span>
          </label>
          <input
            type="text"
            value={picoState.comparison}
            onChange={(e) => setPicoState({ ...picoState, comparison: e.target.value })}
            placeholder="e.g. standard shifts, conventional staffing, placebo"
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-blue-700 font-sans"
          />
          <span className="text-[11px] text-slate-500 block">Baseline comparison group or standard of care</span>
        </div>

        {/* O: Outcome */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 shadow-xs">
          <label className="font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wider block font-serif flex items-center justify-between">
            <span>O: Outcomes / Endpoints / Metrics</span>
            <span className="text-[10px] font-sans text-slate-400 font-normal">Dependent variable</span>
          </label>
          <input
            type="text"
            value={picoState.outcome}
            onChange={(e) => setPicoState({ ...picoState, outcome: e.target.value })}
            placeholder="e.g. burnout rates, medication errors, turnover intention"
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-blue-700 font-sans"
          />
          <span className="text-[11px] text-slate-500 block">Safety events, symptom remission, or quantifiable outcomes</span>
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
              onClick={() => handleCopy(compiledPico.prismaSummary, 'prisma-doc')}
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1 border border-slate-300 dark:border-slate-700 cursor-pointer shadow-2xs transition"
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
                    onClick={() => handleCopy(item.query, item.platform)}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-200 flex items-center gap-1 cursor-pointer shadow-2xs transition"
                  >
                    {copiedKey === item.platform ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedKey === item.platform ? 'Copied' : 'Copy Query'}</span>
                  </button>

                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1 rounded-lg bg-blue-900 hover:bg-blue-950 text-white text-xs font-semibold flex items-center gap-1 shadow-2xs transition"
                  >
                    <span>Launch in {item.name.split(' ')[0]}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-xs text-slate-800 dark:text-slate-200 break-all select-all leading-relaxed">
                {item.query || '<Fill PICO terms above to generate syntax>'}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
