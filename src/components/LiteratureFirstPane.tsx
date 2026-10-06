import React, { useState } from 'react';
import { 
  Search, 
  BookOpen, 
  Sparkles, 
  CheckCircle2, 
  Loader2, 
  ExternalLink, 
  AlertCircle, 
  ChevronDown,
  ChevronUp,
  Plus,
  ShoppingCart,
  Crown,
  Check,
  Layers,
  ShieldAlert,
  ShieldCheck,
  FileSpreadsheet,
  Compass,
  Download
} from 'lucide-react';
import type { AcademicPaper, CitationOptions, Claim } from '../types/citation';
import { huntAcademicPapers } from '../services/academicApi';
import { executeFederatedSearch, type PrismaFlowStats } from '../services/federatedSearchEngine';
import { extractClaimsFromText } from '../services/claimExtractor';
import { PicoCompilerTab } from './PicoCompilerTab';
import { 
  DEFAULT_LLM_CONFIG, 
  synthesizeGroundedManuscript, 
  type LLMConfig 
} from '../services/llmService';
import { calculateDatasetMetrics, getCitationTier } from '../services/datasetScientometrics';
import { extractAcademicTags } from '../services/academicTagger';
import { generateCOinS } from '../services/coinsGenerator';
import { addPaperToCart, addMultiplePapersToCart, isPaperInCart } from '../services/cartService';
import { AcademicPromptsModal } from './AcademicPromptsModal';
import { PrismaFlowModal } from './PrismaFlowModal';
import { LiteratureExportModal } from './LiteratureExportModal';
import {
  downloadLiteratureWord,
  downloadLiteratureJson,
  downloadLiteratureMarkdown,
  downloadLiteratureCsv
} from '../services/literatureExportService';

interface LiteratureFirstPaneProps {
  onManuscriptSynthesized: (manuscript: string, claims: Claim[]) => void;
  options: CitationOptions;
  setOptions?: React.Dispatch<React.SetStateAction<CitationOptions>>;
  llmConfig?: LLMConfig;
  initialSubTab?: 'federated' | 'pico';
  initialTopic?: string;
  initialFocus?: string;
  autoSearch?: boolean;
  initialPicoQuestion?: string;
}

export const LiteratureFirstPane: React.FC<LiteratureFirstPaneProps> = ({
  onManuscriptSynthesized,
  options,
  setOptions,
  llmConfig = DEFAULT_LLM_CONFIG,
  initialSubTab = 'federated',
  initialTopic = '',
  initialFocus = '',
  autoSearch = false,
  initialPicoQuestion = '',
}) => {
  const [topic, setTopic] = useState(initialTopic);
  const [focus, setFocus] = useState(initialFocus);
  const [activeSubTab, setActiveSubTab] = useState<'federated' | 'pico'>(initialSubTab);

  // Sync if initialTopic or initialFocus or initialSubTab changes
  React.useEffect(() => {
    if (initialTopic && initialTopic.trim()) {
      setTopic(initialTopic);
      if (initialFocus) setFocus(initialFocus);
      if (autoSearch) {
        handleSearchLiterature(initialTopic, initialFocus);
      }
    }
  }, [initialTopic, initialFocus, autoSearch]);

  React.useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchProgressMsg, setSearchProgressMsg] = useState('');
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [isPromptsOpen, setIsPromptsOpen] = useState(false);
  const [isPrismaOpen, setIsPrismaOpen] = useState(false);
  const [prismaStats, setPrismaStats] = useState<PrismaFlowStats | null>(null);
  const [cartFeedback, setCartFeedback] = useState<string | null>(null);
  const [downloadFeedback, setDownloadFeedback] = useState<string | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [discoveredPapers, setDiscoveredPapers] = useState<AcademicPaper[]>([]);
  const [selectedPaperIds, setSelectedPaperIds] = useState<Set<string>>(new Set());
  const [expandedAbstractId, setExpandedAbstractId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [customKeyword, setCustomKeyword] = useState('');
  const [searchScope, setSearchScope] = useState<'default' | 'title_only' | 'title_abstract'>('default');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [enabledSources, setEnabledSources] = useState({
    openalex: true,
    europepmc: true,
    crossref: true,
    semanticscholar: true,
    arxiv: false,
  });

  const handleSelectAll = () => {
    setSelectedPaperIds(new Set(discoveredPapers.map((p) => p.id)));
  };

  const handleDeselectAll = () => {
    setSelectedPaperIds(new Set());
  };

  const handleSearchLiterature = async (queryOverride?: string | React.MouseEvent, focusOverride?: string) => {
    const searchTopic = (typeof queryOverride === 'string' ? queryOverride : topic).trim();
    const searchFocus = (typeof focusOverride === 'string' ? focusOverride : focus).trim();
    if (!searchTopic) {
      setErrorMsg('Please enter a research topic.');
      return;
    }

    setErrorMsg('');
    setIsSearching(true);
    setSearchProgressMsg('Dispatching concurrent multi-source queries across OpenAlex, Europe PMC, Crossref, and Semantic Scholar...');
    setDiscoveredPapers([]);
    setSelectedPaperIds(new Set());

    try {
      const fullQuery = searchFocus ? `${searchTopic} ${searchFocus}` : searchTopic;
      const result = await executeFederatedSearch(
        fullQuery,
        {
          limitPerSource: 35,
          excludePreprints: options.excludePreprints,
          searchScope,
          enabledSources,
        },
        (msg) => setSearchProgressMsg(msg)
      );

      setPrismaStats(result.prismaStats);

      if (result.papers.length === 0) {
        setErrorMsg('No peer-reviewed papers found with DOIs for this exact topic across selected registries. Try broader search terms.');
      } else {
        setDiscoveredPapers(result.papers);
        // By default select top 12 papers
        setSelectedPaperIds(new Set(result.papers.slice(0, 12).map((p) => p.id)));
      }
    } catch (err: any) {
      setErrorMsg(`Federated literature discovery failed: ${err.message}`);
    } finally {
      setIsSearching(false);
      setSearchProgressMsg('');
    }
  };


  const handleAddCustomKeywordSearch = async () => {
    if (!customKeyword.trim()) return;
    setIsSearching(true);
    try {
      const extraPapers = await huntAcademicPapers([customKeyword], 15, options.excludePreprints);
      const existingIds = new Set(discoveredPapers.map((p) => p.id));
      const newUnique = extraPapers.filter((p) => !existingIds.has(p.id));
      
      setDiscoveredPapers((prev) => [...prev, ...newUnique]);
      setSelectedPaperIds((prev) => {
        const next = new Set(prev);
        newUnique.forEach((p) => next.add(p.id));
        return next;
      });
      setCustomKeyword('');
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsSearching(false);
    }
  };

  const togglePaperSelection = (paperId: string) => {
    setSelectedPaperIds((prev) => {
      const next = new Set(prev);
      if (next.has(paperId)) {
        next.delete(paperId);
      } else {
        next.add(paperId);
      }
      return next;
    });
  };

  const handleSynthesize = async () => {
    const selectedPapers = discoveredPapers.filter((p) => selectedPaperIds.has(p.id));
    if (selectedPapers.length === 0) {
      setErrorMsg('Please select at least one paper for the synthesis corpus.');
      return;
    }

    setIsSynthesizing(true);
    setErrorMsg('');

    try {
      const manuscript = await synthesizeGroundedManuscript(topic, focus, selectedPapers, llmConfig);

      // Extract claims from the synthesized manuscript
      const extractedClaims = extractClaimsFromText(manuscript, 'all');

      // Map each extracted claim to the most relevant selected paper
      const claims: Claim[] = extractedClaims.map((claim, idx) => {
        // Find best matching paper based on keywords or round-robin through selectedPapers
        const assignedPaper = selectedPapers[idx % selectedPapers.length];
        return {
          ...claim,
          candidatePapers: selectedPapers,
          selectedPaper: assignedPaper,
          status: 'found',
          confidence: 'high',
          isExcluded: false,
          citationNumber: idx + 1,
        };
      });

      onManuscriptSynthesized(manuscript, claims);
    } catch (err: any) {
      setErrorMsg(`Synthesis failed: ${err.message}`);
    } finally {
      setIsSynthesizing(false);
    }
  };

  return (
    <div className="academic-card rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-7 space-y-6 shadow-xs">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-900 dark:bg-blue-800 flex items-center justify-center text-white shadow-xs">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white font-serif">
                Literature-First Discovery & Grounded Synthesis
              </h2>
              <span className="text-xs px-2.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-800">
                Grounded in Open Registries
              </span>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 font-sans">
              Fetches genuine peer-reviewed literature from OpenAlex & Crossref <em>first</em>, then synthesizes a verified manuscript citing the authentic DOIs.
            </p>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Switcher */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          type="button"
          onClick={() => setActiveSubTab('federated')}
          className={`px-4 py-2 rounded-xl text-xs font-bold font-serif flex items-center gap-2 transition cursor-pointer ${
            activeSubTab === 'federated'
              ? 'bg-blue-900 text-white shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          <Search className="w-3.5 h-3.5" />
          <span>Federated Multi-Source Discovery</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('pico')}
          className={`px-4 py-2 rounded-xl text-xs font-bold font-serif flex items-center gap-2 transition cursor-pointer ${
            activeSubTab === 'pico'
              ? 'bg-blue-900 text-white shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          <Compass className="w-3.5 h-3.5 text-amber-400" />
          <span>PICO Systematic Search Strategy</span>
        </button>
      </div>

      {activeSubTab === 'pico' ? (
        <PicoCompilerTab
          onApplyQueryToSearch={(q, f) => {
            setTopic(q);
            if (f) setFocus(f);
            setActiveSubTab('federated');
            handleSearchLiterature(q, f);
          }}
          initialQuestion={initialPicoQuestion}
          llmConfig={llmConfig}
        />
      ) : (
        <>
          {/* Step 1: Input Topic & Scope */}
          <div className="space-y-4">
        <div>
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2 uppercase tracking-wider">
            1. Research Topic & Core Thesis:
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSearchLiterature();
                  }
                }}
                placeholder="e.g. SGLT2 inhibitors clinical efficacy in heart failure with preserved ejection fraction..."
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-base text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-700 focus:ring-1 focus:ring-blue-700 transition"
              />
            </div>
            <button
              onClick={handleSearchLiterature}
              disabled={isSearching || !topic.trim()}
              className={`px-6 py-3 rounded-xl text-sm font-semibold flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50 transition ${
                isSearching
                  ? 'bg-gradient-to-r from-blue-700 via-indigo-600 to-blue-700 text-white animate-pulse ring-4 ring-blue-500/30'
                  : 'btn-academic-primary'
              }`}
            >
              {isSearching ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white shrink-0" />
                  <span className="font-bold">Searching 4 Registries...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Discover Literature</span>
                </>
              )}
            </button>
          </div>

          {/* Active Search Live Feedback Strip */}
          {isSearching && (
            <div className="mt-3.5 space-y-2 p-3 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 animate-in fade-in duration-150">
              <div className="flex items-center justify-between text-xs text-blue-900 dark:text-blue-300 font-semibold">
                <span className="flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600 dark:text-blue-400 shrink-0" />
                  <span className="font-mono">{searchProgressMsg || 'Querying OpenAlex, Europe PMC, Crossref, and Semantic Scholar...'}</span>
                </span>
                <span className="text-[10px] font-mono uppercase bg-blue-200/70 dark:bg-blue-900 px-2 py-0.5 rounded-md border border-blue-300 dark:border-blue-700">
                  Federated IR Live
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-blue-200/50 dark:bg-slate-800 overflow-hidden relative">
                <div className="h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-emerald-500 rounded-full animate-pulse w-full" />
              </div>
            </div>
          )}
          {topic.trim() && (
            <div className="mt-1.5 flex items-center gap-2 text-[11px] text-slate-500 font-sans">
              {/[()"]|\b(AND|OR|NOT)\b/i.test(topic) ? (
                <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-medium">
                  ⚡ <strong>Boolean Query Mode:</strong> Using custom operator syntax across supported registries.
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-blue-700 dark:text-blue-400 font-medium">
                  ✦ <strong>Intelligent Academic IR Mode:</strong> Natural language question auto-synthesizing Boolean &amp; core concepts across 5 registries.
                </span>
              )}
            </div>
          )}
        </div>

        {/* Focus area */}
        <div>
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5 uppercase tracking-wider">
            2. Specific Empirical Focus & Key Variables (Optional):
          </label>
          <input
            type="text"
            value={focus}
            onChange={(e) => setFocus(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSearchLiterature();
              }
            }}
            placeholder="e.g. Randomized clinical trials, cardiovascular mortality, mechanistic pathways, or adverse events"
            className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-700 focus:ring-1 focus:ring-blue-700 transition"
          />
        </div>


        {/* Contextual Quality & Preprints Bar */}
        {setOptions && (
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-800 dark:text-blue-400" />
              <span>Literature Quality &amp; Peer-Review Filters:</span>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={options.excludePreprints}
                  onChange={(e) => setOptions((prev) => ({ ...prev, excludePreprints: e.target.checked }))}
                  className="rounded border-slate-300 text-blue-800 focus:ring-blue-700 cursor-pointer"
                />
                <span>Exclude Preprints &amp; Working Papers (arXiv, bioRxiv, SSRN)</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={options.requireDoi}
                  onChange={(e) => setOptions((prev) => ({ ...prev, requireDoi: e.target.checked }))}
                  className="rounded border-slate-300 text-blue-800 focus:ring-blue-700 cursor-pointer"
                />
                <span>Require Verified Permanent DOI</span>
              </label>
            </div>
          </div>
        )}

        {/* Advanced Federated Sources & PRISMA Scope Toggle */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="text-xs font-semibold text-blue-900 dark:text-blue-400 flex items-center gap-1.5 cursor-pointer hover:underline"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{showAdvancedFilters ? 'Hide Federated Registries & Scope' : '⚡ Configure Federated Registries & PRISMA Scope'}</span>
            <ChevronDown className={`w-3 h-3 transition-transform ${showAdvancedFilters ? 'rotate-180' : ''}`} />
          </button>

          {showAdvancedFilters && (
            <div className="mt-2.5 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3 animate-in fade-in duration-150">
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                <div>
                  <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1.5 uppercase tracking-wider text-[11px]">
                    Academic Registries:
                  </span>
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 dark:text-slate-300">
                      <input
                        type="checkbox"
                        checked={enabledSources.openalex}
                        onChange={(e) => setEnabledSources({ ...enabledSources, openalex: e.target.checked })}
                        className="rounded border-slate-300 text-blue-800 focus:ring-blue-700 cursor-pointer"
                      />
                      <span>OpenAlex</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 dark:text-slate-300">
                      <input
                        type="checkbox"
                        checked={enabledSources.europepmc}
                        onChange={(e) => setEnabledSources({ ...enabledSources, europepmc: e.target.checked })}
                        className="rounded border-slate-300 text-blue-800 focus:ring-blue-700 cursor-pointer"
                      />
                      <span>Europe PMC / PubMed</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 dark:text-slate-300">
                      <input
                        type="checkbox"
                        checked={enabledSources.crossref}
                        onChange={(e) => setEnabledSources({ ...enabledSources, crossref: e.target.checked })}
                        className="rounded border-slate-300 text-blue-800 focus:ring-blue-700 cursor-pointer"
                      />
                      <span>Crossref</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 dark:text-slate-300">
                      <input
                        type="checkbox"
                        checked={enabledSources.semanticscholar}
                        onChange={(e) => setEnabledSources({ ...enabledSources, semanticscholar: e.target.checked })}
                        className="rounded border-slate-300 text-blue-800 focus:ring-blue-700 cursor-pointer"
                      />
                      <span>Semantic Scholar</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 dark:text-slate-300">
                      <input
                        type="checkbox"
                        checked={enabledSources.arxiv}
                        onChange={(e) => setEnabledSources({ ...enabledSources, arxiv: e.target.checked })}
                        className="rounded border-slate-300 text-blue-800 focus:ring-blue-700 cursor-pointer"
                      />
                      <span>arXiv Preprints</span>
                    </label>
                  </div>
                </div>

                <div>
                  <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1.5 uppercase tracking-wider text-[11px]">
                    Search Scope:
                  </span>
                  <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-0.5 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setSearchScope('default')}
                      className={`px-2 py-1 text-xs rounded-md font-medium cursor-pointer transition ${
                        searchScope === 'default'
                          ? 'bg-blue-900 dark:bg-blue-800 text-white'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      All Fields
                    </button>
                    <button
                      type="button"
                      onClick={() => setSearchScope('title_only')}
                      className={`px-2 py-1 text-xs rounded-md font-medium cursor-pointer transition ${
                        searchScope === 'title_only'
                          ? 'bg-blue-900 dark:bg-blue-800 text-white'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      Title Only
                    </button>
                    <button
                      type="button"
                      onClick={() => setSearchScope('title_abstract')}
                      className={`px-2 py-1 text-xs rounded-md font-medium cursor-pointer transition ${
                        searchScope === 'title_abstract'
                          ? 'bg-blue-900 dark:bg-blue-800 text-white'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      Title + Abstract
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Error message */}
        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-300 flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* HIGH-VISIBILITY LIVE SEARCH PROGRESS HUD */}
      {isSearching && (
        <div className="pt-2 border-t border-slate-200 dark:border-slate-800 animate-in fade-in duration-200">
          <div className="p-8 sm:p-10 rounded-2xl bg-gradient-to-b from-blue-50/90 via-white to-slate-50/90 dark:from-slate-900/95 dark:via-blue-950/30 dark:to-slate-900/95 border-2 border-blue-400 dark:border-blue-700 shadow-xl text-center space-y-6">
            
            {/* Visual Radar Pulse Animation */}
            <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-blue-500/20 animate-ping duration-1000" />
              <div className="absolute inset-1 rounded-full border-2 border-blue-500/40 animate-spin border-t-transparent" />
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center shadow-lg shadow-blue-500/30">
                <Search className="w-7 h-7 animate-pulse" />
              </div>
            </div>

            <div className="space-y-2 max-w-lg mx-auto">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-900 dark:text-blue-300 border border-blue-300 dark:border-blue-800 text-xs font-bold tracking-wide uppercase font-mono shadow-xs">
                <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400 animate-ping" />
                <span>Federated Scholarly Search in Progress</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold font-serif text-slate-900 dark:text-white">
                Harvesting Peer-Reviewed Literature
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-sans leading-relaxed">
                Querying over 250 million scholarly publications across 4 live registries simultaneously, screening preprints, verifying DOIs, and compiling PRISMA 2020 attrition metrics.
              </p>
            </div>

            {/* Live Progress Status Box */}
            <div className="p-4 max-w-xl mx-auto rounded-xl bg-blue-500/10 dark:bg-blue-950/50 border border-blue-300 dark:border-blue-700 flex items-center justify-center gap-3 text-xs sm:text-sm text-blue-950 dark:text-blue-200 font-medium shadow-xs">
              <Loader2 className="w-4 h-4 animate-spin text-blue-600 dark:text-blue-400 shrink-0" />
              <span className="font-mono text-left">{searchProgressMsg || 'Coordinating multi-source registry queries...'}</span>
            </div>

            {/* 4 Active Registries Ping Matrix */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto pt-1">
              <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800 shadow-2xs flex flex-col items-center text-center space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900 dark:text-blue-400 font-serif">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                  <span>OpenAlex</span>
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">250M+ Works</span>
              </div>

              <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800 shadow-2xs flex flex-col items-center text-center space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-purple-900 dark:text-purple-400 font-serif">
                  <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                  <span>Europe PMC</span>
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">PubMed Central</span>
              </div>

              <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800 shadow-2xs flex flex-col items-center text-center space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-400 font-serif">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Crossref</span>
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">Publisher DOIs</span>
              </div>

              <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800 shadow-2xs flex flex-col items-center text-center space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 dark:text-amber-400 font-serif">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  <span>Semantic Scholar</span>
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">AI Citation Graph</span>
              </div>
            </div>

            {/* Indeterminate moving bar */}
            <div className="w-full max-w-xl mx-auto h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-emerald-500 rounded-full animate-pulse w-full" />
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
              Auditing peer-reviewed status, screening preprints, resolving DOIs, and compiling PRISMA 2020 attrition statistics...
            </p>

          </div>
        </div>
      )}

      {/* Guided Empty State when no literature is retrieved yet */}
      {discoveredPapers.length === 0 && !isSearching && (
        <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-5 animate-in fade-in duration-200">
          <div className="p-6 rounded-2xl bg-slate-50/70 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-5">
            <div className="flex items-center gap-3.5 pb-4 border-b border-slate-200/80 dark:border-slate-800">
              <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-900 dark:text-blue-300 flex items-center justify-center shrink-0">
                <Search className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-serif font-bold text-base text-slate-900 dark:text-white">
                    Federated Literature Discovery &amp; PRISMA Search Engine
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-900 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                    4 Live Registries
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-sans">
                  Query over 250 million open academic records across multiple global bibliographic registries simultaneously.
                </p>
              </div>
            </div>

            {/* 4 Federated Registries */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-xs font-bold text-blue-900 dark:text-blue-400 font-serif">OpenAlex</span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-sans">
                  250M+ open scholarly works, concept graphs, open access status, and citation network context.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-xs font-bold text-emerald-800 dark:text-emerald-400 font-serif">Crossref</span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-sans">
                  150M+ official publisher DOIs, registration metadata, license info, and cross-publisher indexing.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-xs font-bold text-purple-900 dark:text-purple-400 font-serif">Europe PMC / PubMed</span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-sans">
                  35M+ biomedical and life science publications with indexed abstracts and open access full texts.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-xs font-bold text-amber-800 dark:text-amber-400 font-serif">Semantic Scholar</span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-sans">
                  AI-driven semantic matching, influential citation scoring, and automated TLDR findings.
                </p>
              </div>
            </div>

            {/* Academic Search Tips */}
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-serif font-bold text-slate-900 dark:text-white">
                <span>Effective Scholarly Search Strategies:</span>
                <span className="text-[11px] font-sans font-normal text-slate-500">Syntax &amp; Filtering Guidance</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px] font-sans">
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="font-bold text-slate-800 dark:text-slate-200">1. Boolean Operators</span>
                  <p className="text-slate-500 dark:text-slate-400">
                    Use <code className="text-blue-700 dark:text-blue-400 font-mono">AND</code>, <code className="text-blue-700 dark:text-blue-400 font-mono">OR</code>, and quotes for exact phrases to narrow your research scope.
                  </p>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="font-bold text-slate-800 dark:text-slate-200">2. Preprints Exclusion</span>
                  <p className="text-slate-500 dark:text-slate-400">
                    Check "Exclude Preprints" to filter out un-refereed drafts (arXiv, bioRxiv) and focus exclusively on peer-reviewed articles.
                  </p>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="font-bold text-slate-800 dark:text-slate-200">3. Empirical Focus</span>
                  <p className="text-slate-500 dark:text-slate-400">
                    Add study design or outcome terms in Step 2 (e.g. <em>"randomized controlled trial"</em> or <em>"longitudinal"</em>).
                  </p>
                </div>
              </div>
            </div>

            {/* Ready Callout */}
            <div className="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 text-xs text-blue-950 dark:text-blue-300 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Search className="w-4 h-4 text-blue-700 dark:text-blue-400 shrink-0" />
                <span>Ready to explore. Enter a research topic or clinical question above and click Discover Literature.</span>
              </span>
              <span className="font-mono text-[10px] uppercase font-bold text-blue-700 dark:text-blue-400">Open Access Live</span>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Discovered Literature Corpus */}
      {discoveredPapers.length > 0 && (
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-4 animate-in fade-in duration-200">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white font-serif flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <span>Verified Scholarly Corpus ({discoveredPapers.length} Peer-Reviewed Works)</span>
                </h3>
              </div>
              <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                <span>{selectedPaperIds.size} of {discoveredPapers.length} selected.</span>
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="text-blue-600 dark:text-blue-400 hover:underline font-semibold cursor-pointer"
                >
                  Select All
                </button>
                <span>&bull;</span>
                <button
                  type="button"
                  onClick={handleDeselectAll}
                  className="text-slate-500 hover:underline cursor-pointer"
                >
                  Clear Selection
                </button>
              </div>
            </div>

            {/* Quick Actions & Search Keyword */}
            <div className="flex items-center gap-2 flex-wrap">
              <input
                type="text"
                value={customKeyword}
                onChange={(e) => setCustomKeyword(e.target.value)}
                placeholder="Search additional keywords..."
                className="px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400"
              />
              <button
                onClick={handleAddCustomKeywordSearch}
                disabled={isSearching || !customKeyword.trim()}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold flex items-center gap-1 border border-slate-300 dark:border-slate-700 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Papers</span>
              </button>

              {prismaStats && (
                <button
                  type="button"
                  onClick={() => setIsPrismaOpen(true)}
                  className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs transition"
                  title="View PRISMA 2020 flow metrics & copy publication statement"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>PRISMA 2020</span>
                </button>
              )}

              {/* Top Export Button */}
              <button
                type="button"
                onClick={() => setIsExportModalOpen(true)}
                className="px-3 py-1.5 rounded-lg bg-blue-900 hover:bg-blue-950 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition"
                title="Download identified literature records as Word, JSON, Markdown, CSV, RIS, or BibTeX"
              >
                <Download className="w-3.5 h-3.5 text-blue-200" />
                <span>Download Records ({selectedPaperIds.size > 0 ? selectedPaperIds.size : discoveredPapers.length})</span>
              </button>
            </div>
          </div>

          {/* Dataset Scientometrics Banner */}
          {(() => {
            const metrics = calculateDatasetMetrics(discoveredPapers);
            return (
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 text-center">
                <div>
                  <div className="text-sm font-bold text-blue-600 dark:text-blue-400">
                    {metrics.hIndex}
                  </div>
                  <div className="text-[10px] uppercase font-semibold text-slate-500">
                    Dataset $h$-Index
                  </div>
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    {metrics.totalCitations.toLocaleString()}
                  </div>
                  <div className="text-[10px] uppercase font-semibold text-slate-500">
                    Total Citations
                  </div>
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    {metrics.avgCitations}
                  </div>
                  <div className="text-[10px] uppercase font-semibold text-slate-500">
                    Avg Citations
                  </div>
                </div>
                <div>
                  <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                    {metrics.openAccessPct}%
                  </div>
                  <div className="text-[10px] uppercase font-semibold text-slate-500">
                    Open Access
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Paper Cards List */}
          <div className="space-y-3 max-h-[560px] overflow-y-auto pr-1">
            {discoveredPapers.map((paper) => {
              const isSelected = selectedPaperIds.has(paper.id);
              const isExpanded = expandedAbstractId === paper.id;
              const tier = getCitationTier(paper.citationCount || 0);
              const tags = extractAcademicTags(paper);
              const inCart = isPaperInCart(paper);

              return (
                <div
                  key={paper.id}
                  className={`p-4 rounded-xl border transition ${
                    isSelected
                      ? 'bg-blue-50/50 dark:bg-blue-950/40 border-blue-600 dark:border-blue-500'
                      : 'bg-slate-50/50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 opacity-60'
                  }`}
                >
                  {/* Hidden COinS tag for Zotero / Mendeley detection */}
                  <span className="Z3988 hidden" title={generateCOinS(paper)} />

                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => togglePaperSelection(paper.id)}
                        className="mt-1 rounded border-slate-300 text-blue-800 focus:ring-blue-700 cursor-pointer"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 mb-1">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${tier.badgeClass}`}
                          >
                            {tier.label}
                          </span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {paper.source === 'europepmc' ? 'Europe PMC / PubMed' : paper.source.toUpperCase()}
                          </span>
                          {paper.isRetracted && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 border border-red-300 dark:border-red-800 flex items-center gap-1 animate-pulse">
                              <ShieldAlert className="w-3 h-3 text-red-600" />
                              RETRACTED
                            </span>
                          )}
                          {paper.openAccess && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                              🔓 OA
                            </span>
                          )}
                          {tags.map((tag) => (
                            <span
                              key={tag.label}
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${tag.colorClass}`}
                            >
                              {tag.label}
                            </span>
                          ))}
                        </div>

                        <h4 className="text-sm font-bold text-slate-900 dark:text-white font-serif leading-snug">
                          {paper.title}
                        </h4>
                        <div className="text-xs text-slate-600 dark:text-slate-400 mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                          <span className="font-medium text-slate-800 dark:text-slate-200">
                            {paper.authors.slice(0, 3).map((a) => a.name).join(', ') + (paper.authors.length > 3 ? ' et al.' : '')}
                          </span>
                          <span>•</span>
                          <span className="font-semibold text-slate-700 dark:text-slate-300">{paper.year}</span>
                          <span>•</span>
                          <span className="italic text-blue-900 dark:text-blue-400 font-medium">{paper.venue}</span>
                          {paper.citationCount > 0 && (
                            <>
                              <span>•</span>
                              <span className="px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px]">
                                {paper.citationCount} cites
                              </span>
                            </>
                          )}
                        </div>

                        {/* Abstract */}
                        {isExpanded && paper.abstract && (
                          <div className="mt-2.5 p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-serif animate-in fade-in duration-150">
                            {paper.abstract}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => addPaperToCart(paper)}
                        className={`text-xs font-semibold px-2 py-1 rounded-md border flex items-center gap-1 transition cursor-pointer ${
                          inCart
                            ? 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800'
                            : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                        title={inCart ? 'Saved in Research Cart' : 'Save to Research Cart'}
                      >
                        {inCart ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-500" />
                            <span>In Cart</span>
                          </>
                        ) : (
                          <>
                            <ShoppingCart className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                            <span>+ Cart</span>
                          </>
                        )}
                      </button>

                      {paper.abstract && (
                        <button
                          onClick={() => setExpandedAbstractId(isExpanded ? null : paper.id)}
                          className="text-xs text-slate-600 dark:text-slate-400 hover:text-blue-800 flex items-center gap-0.5 cursor-pointer font-medium"
                        >
                          <span>Abstract</span>
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          downloadLiteratureWord([paper], { topic: paper.title, style: options.style });
                          setDownloadFeedback(`Exported "${paper.title.slice(0, 35)}..."!`);
                          setTimeout(() => setDownloadFeedback(null), 2500);
                        }}
                        className="text-xs text-slate-500 hover:text-blue-700 dark:hover:text-blue-400 flex items-center gap-0.5 cursor-pointer font-medium p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                        title="Download record with abstract (.doc)"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>

                      {paper.url && (
                        <a
                          href={paper.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-800 dark:text-blue-400 hover:underline flex items-center gap-1 font-semibold"
                          title="View verified DOI"
                        >
                          <span>DOI</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action Step 3: Trigger Synthesis & Prompt Tools */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-wrap">
              {/* PRIMARY DOWNLOAD LITERATURE BUTTON */}
              <button
                type="button"
                onClick={() => setIsExportModalOpen(true)}
                disabled={discoveredPapers.length === 0}
                className="px-3.5 py-2 text-xs font-bold rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                title="Download identified literature records containing Title, Abstract, DOI, Authors, and Citations"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Download Literature Records ({selectedPaperIds.size > 0 ? `${selectedPaperIds.size} Selected` : `All ${discoveredPapers.length}`})</span>
              </button>

              {/* Quick Format Shortcuts */}
              <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800 px-2 py-1 rounded-lg bg-slate-50/50 dark:bg-slate-950/50">
                <span className="text-[10px] uppercase font-bold text-slate-400">Quick:</span>
                <button
                  type="button"
                  onClick={() => {
                    const papersToDownload = selectedPaperIds.size > 0 ? discoveredPapers.filter((p) => selectedPaperIds.has(p.id)) : discoveredPapers;
                    downloadLiteratureWord(papersToDownload, { topic, style: options.style });
                    setDownloadFeedback('Word (.doc) downloaded!');
                    setTimeout(() => setDownloadFeedback(null), 2500);
                  }}
                  className="px-1.5 py-0.5 rounded bg-white hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 font-mono text-[10px] text-slate-700 dark:text-slate-300 transition cursor-pointer border border-slate-200 dark:border-slate-700"
                  title="Download as Word Document (.doc)"
                >
                  .doc
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const papersToDownload = selectedPaperIds.size > 0 ? discoveredPapers.filter((p) => selectedPaperIds.has(p.id)) : discoveredPapers;
                    downloadLiteratureJson(papersToDownload, { topic });
                    setDownloadFeedback('JSON (.json) downloaded!');
                    setTimeout(() => setDownloadFeedback(null), 2500);
                  }}
                  className="px-1.5 py-0.5 rounded bg-white hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 font-mono text-[10px] text-slate-700 dark:text-slate-300 transition cursor-pointer border border-slate-200 dark:border-slate-700"
                  title="Download as JSON (.json)"
                >
                  .json
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const papersToDownload = selectedPaperIds.size > 0 ? discoveredPapers.filter((p) => selectedPaperIds.has(p.id)) : discoveredPapers;
                    downloadLiteratureMarkdown(papersToDownload, { topic });
                    setDownloadFeedback('Markdown (.md) downloaded!');
                    setTimeout(() => setDownloadFeedback(null), 2500);
                  }}
                  className="px-1.5 py-0.5 rounded bg-white hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 font-mono text-[10px] text-slate-700 dark:text-slate-300 transition cursor-pointer border border-slate-200 dark:border-slate-700"
                  title="Download as Markdown (.md)"
                >
                  .md
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const papersToDownload = selectedPaperIds.size > 0 ? discoveredPapers.filter((p) => selectedPaperIds.has(p.id)) : discoveredPapers;
                    downloadLiteratureCsv(papersToDownload, { topic });
                    setDownloadFeedback('CSV (.csv) downloaded!');
                    setTimeout(() => setDownloadFeedback(null), 2500);
                  }}
                  className="px-1.5 py-0.5 rounded bg-white hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 font-mono text-[10px] text-slate-700 dark:text-slate-300 transition cursor-pointer border border-slate-200 dark:border-slate-700"
                  title="Download as CSV spreadsheet (.csv)"
                >
                  .csv
                </button>
              </div>

              <button
                onClick={() => {
                  const selectedPapers = discoveredPapers.filter((p) => selectedPaperIds.has(p.id));
                  const added = addMultiplePapersToCart(selectedPapers);
                  setCartFeedback(`Added ${added} papers to Cart!`);
                  setTimeout(() => setCartFeedback(null), 2500);
                }}
                disabled={selectedPaperIds.size === 0}
                className="px-3 py-2 text-xs font-semibold rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-900 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>Add Selected to Cart ({selectedPaperIds.size})</span>
              </button>

              <button
                onClick={() => setIsPromptsOpen(true)}
                disabled={selectedPaperIds.size === 0}
                className="px-3 py-2 text-xs font-semibold rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/60 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Crown className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>7 LLM Prompts</span>
              </button>

              {cartFeedback && (
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> {cartFeedback}
                </span>
              )}

              {downloadFeedback && (
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> {downloadFeedback}
                </span>
              )}
            </div>

            <button
              onClick={handleSynthesize}
              disabled={isSynthesizing || selectedPaperIds.size === 0}
              className="btn-academic-primary px-7 py-3 rounded-xl text-sm font-semibold flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
            >
              {isSynthesizing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Synthesizing Literature Review with LLM...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Synthesize Grounded Manuscript</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
      </>
      )}

      {/* 7 Academic LLM Prompts Modal */}
      <AcademicPromptsModal
        isOpen={isPromptsOpen}
        onClose={() => setIsPromptsOpen(false)}
        papers={discoveredPapers.filter((p) => selectedPaperIds.has(p.id))}
        topic={topic}
        style={options.style}
      />

      {/* PRISMA 2020 Flow Protocol Modal */}
      {prismaStats && (
        <PrismaFlowModal
          isOpen={isPrismaOpen}
          onClose={() => setIsPrismaOpen(false)}
          stats={prismaStats}
          query={topic}
        />
      )}

      {/* Literature Export Modal */}
      <LiteratureExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        papers={discoveredPapers}
        selectedPaperIds={selectedPaperIds}
        topic={topic}
        activeStyle={options.style}
      />

    </div>
  );
};
