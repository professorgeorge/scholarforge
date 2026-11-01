import { useProjectState } from './useProjectState';
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
import { executeFederatedSearch, type PrismaFlowStats } from '../services/federatedSearchEngine';
import { extractClaimsFromText } from '../services/claimExtractor';
import { rankPapersByRelevance } from '../services/relevanceScoringService';
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
import { ReferenceImportPanel } from './ReferenceImportPanel';
import { DEFAULT_SCHOLARLY_SOURCES, SCHOLARLY_SOURCES, scholarlySourceLabel, type ScholarlySourceId, type ScholarlySourceSelection } from '../services/scholarlySources';
import { mergeDiscoveryPapers } from '../services/discoveryMergeService';
import type { SearchRun } from '../services/projectService';
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
  onResetAutoSearch?: () => void;
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
  onResetAutoSearch,
}) => {
  const [topic, setTopic] = useProjectState('LiteratureFirstPane.topic', initialTopic);
  const [focus, setFocus] = useProjectState('LiteratureFirstPane.focus', initialFocus);
  const [activeSubTab, setActiveSubTab] = useState<'federated' | 'pico'>(initialSubTab);
  const resultsRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useProjectState('LiteratureFirstPane.hasSearched', false);
  const [searchProgressMsg, setSearchProgressMsg] = useState('');
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [isPromptsOpen, setIsPromptsOpen] = useState(false);
  const [isPrismaOpen, setIsPrismaOpen] = useState(false);
  const [prismaStats, setPrismaStats] = useProjectState<PrismaFlowStats | null>('LiteratureFirstPane.prismaStats', null);
  const [cartFeedback, setCartFeedback] = useState<string | null>(null);
  const [downloadFeedback, setDownloadFeedback] = useState<string | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [discoveredPapers, setDiscoveredPapers] = useProjectState<AcademicPaper[]>('LiteratureFirstPane.discoveredPapers', []);
  const [selectedPaperIds, setSelectedPaperIds] = useState<Set<string>>(new Set());
  const [expandedAbstractId, setExpandedAbstractId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [customKeyword, setCustomKeyword] = useState('');
  const [searchScope, setSearchScope] = useProjectState<'default' | 'title_only' | 'title_abstract'>('LiteratureFirstPane.searchScope', 'default');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(true);
  const [enabledSources, setEnabledSources] = useProjectState<ScholarlySourceSelection>('LiteratureFirstPane.enabledSources.v2', DEFAULT_SCHOLARLY_SOURCES);
  const [sourceStatuses, setSourceStatuses] = useProjectState<SearchRun['sources']>('LiteratureFirstPane.sourceStatuses', []);
  const [importNotice, setImportNotice] = useState('');
  const activeSources = (Object.entries(SCHOLARLY_SOURCES) as [ScholarlySourceId, typeof SCHOLARLY_SOURCES[ScholarlySourceId]][])
    .filter(([id]) => enabledSources[id] && (id !== 'arxiv' || !options.excludePreprints));

  const handleImport = (papers: AcademicPaper[], origin: string) => {
    const retrievedAt = new Date().toISOString();
    const annotated = papers.map(paper => ({ ...paper, registryProvenance: [...(paper.registryProvenance || []), { registry: origin, recordId: paper.id, retrievedAt, citationCount: paper.citationCount }] }));
    const merged = mergeDiscoveryPapers([...discoveredPapers, ...annotated]);
    const added = merged.papers.length - discoveredPapers.length;
    setDiscoveredPapers(merged.papers);
    setSelectedPaperIds(new Set(merged.papers.map(paper => paper.id)));
    setHasSearched(true);
    setPrismaStats(null);
    setSourceStatuses([]);
    setErrorMsg('');
    setImportNotice(`${added} new records added from ${origin}; ${papers.length - added} duplicates merged. This combined list is not a live-search retrieval count. Review metadata before citing.`);
  };

  const handleSelectAll = () => {
    setSelectedPaperIds(new Set(discoveredPapers.map((p) => p.id)));
  };

  const handleDeselectAll = () => {
    setSelectedPaperIds(new Set());
  };

  const handleSelectTopN = (n: number) => {
    setSelectedPaperIds(new Set(discoveredPapers.slice(0, n).map((p) => p.id)));
  };

  const handleSearchLiterature = React.useCallback(async (queryOverride?: string | React.MouseEvent, focusOverride?: string) => {
    const searchTopic = (typeof queryOverride === 'string' ? queryOverride : topic).trim();
    const searchFocus = (typeof focusOverride === 'string' ? focusOverride : focus).trim();
    if (!searchTopic) {
      setErrorMsg('Please enter a research topic.');
      return;
    }

    if (isSearching) return;
    if (!Object.entries(enabledSources).some(([source, enabled]) => enabled && (source !== 'arxiv' || !options.excludePreprints))) { setErrorMsg('Select at least one usable source. arXiv requires preprints to be enabled.'); return; }
    setErrorMsg('');
    setImportNotice('');
    setSourceStatuses([]);
    setPrismaStats(null);
    setIsSearching(true);
    setSearchProgressMsg('Searching the selected scholarly sources independently…');
    setDiscoveredPapers([]);
    setSelectedPaperIds(new Set());

    try {
      const hasBooleanInTopic = /["()]|\b(AND|OR|NOT)\b/i.test(searchTopic);
      let fullQuery = searchTopic;
      if (searchFocus) {
        if (hasBooleanInTopic) {
          if (!searchTopic.toLowerCase().includes(searchFocus.toLowerCase())) {
            fullQuery = `(${searchTopic}) AND (${searchFocus})`;
          }
        } else {
          fullQuery = `${searchTopic} ${searchFocus}`;
        }
      }
      const result = await executeFederatedSearch(
        fullQuery,
        {
          limitPerSource: 35,
          excludePreprints: options.excludePreprints,
          requireDoi: options.requireDoi,
          searchScope,
          enabledSources,
        },
        (msg) => setSearchProgressMsg(msg)
      );

      setPrismaStats(result.prismaStats);
      setSourceStatuses(result.sourceStatuses);
      setSearchProgressMsg(result.sourceStatuses.map(s => `${s.name}: ${s.status} (${s.count})`).join(' · '));
      const incomplete = result.sourceStatuses.filter(s => /timed out|unavailable|failed|rate limited|paused/.test(s.status));
      if (incomplete.length) setErrorMsg('Search coverage may be incomplete: ' + incomplete.map(s => `${s.name}: ${s.status}`).join('; '));
      setHasSearched(true);

      if (result.papers.length === 0) {
        setErrorMsg(incomplete.length ? 'No candidate records were retained, and some selected sources were unavailable. Review the source status below, or import references from another search tool.' : 'No candidate records were retained under the selected sources and filters. Try broader terms or change the filters.');
      } else {
        setDiscoveredPapers(result.papers);
        // Auto-select ALL discovered papers by default for download and review
        setSelectedPaperIds(new Set(result.papers.map((p) => p.id)));
      }
    } catch (err: any) {
      setErrorMsg(`Federated literature discovery failed: ${err.message}`);
      setHasSearched(true);
    } finally {
      setIsSearching(false);
      setSearchProgressMsg('');
    }
  }, [topic, focus, options.excludePreprints, options.requireDoi, searchScope, enabledSources, isSearching]);

  const hasAutoSearchedTopicRef = React.useRef<string>('');
  const lastSyncedTopicRef = React.useRef<string>(initialTopic);

  // Sync if initialTopic or initialFocus or initialSubTab changes
  React.useEffect(() => {
    if (initialTopic && initialTopic.trim() && initialTopic !== lastSyncedTopicRef.current) {
      lastSyncedTopicRef.current = initialTopic;
      setTopic(initialTopic);
      if (initialFocus) setFocus(initialFocus);
      if (autoSearch && hasAutoSearchedTopicRef.current !== initialTopic) {
        hasAutoSearchedTopicRef.current = initialTopic;
        onResetAutoSearch?.();
        handleSearchLiterature(initialTopic, initialFocus);
      }
    }
  }, [initialTopic, initialFocus, autoSearch, onResetAutoSearch, handleSearchLiterature]);

  React.useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);


  const handleAddCustomKeywordSearch = async () => {
    if (!customKeyword.trim() || isSearching) return;
    setIsSearching(true);
    setErrorMsg('');
    try {
      const result = await executeFederatedSearch(customKeyword, { limitPerSource: 15, excludePreprints: options.excludePreprints, requireDoi: options.requireDoi, searchScope, enabledSources }, setSearchProgressMsg);
      const merged = mergeDiscoveryPapers([...discoveredPapers, ...result.papers]);
      const existingIds = new Set(discoveredPapers.map(paper => paper.id));
      const added = merged.papers.filter(paper => !existingIds.has(paper.id));
      setDiscoveredPapers(merged.papers);
      setSelectedPaperIds(previous => new Set([...previous, ...added.map(paper => paper.id)]));
      setPrismaStats(null);
      setSourceStatuses(result.sourceStatuses);
      setImportNotice(`${added.length} additional records merged. The source counts below describe only the latest keyword search, not this combined list.`);
      const incomplete = result.sourceStatuses.filter(source => /timed out|unavailable|failed|rate limited|paused/.test(source.status));
      if (incomplete.length) setErrorMsg('Some sources were unavailable. Available results have been kept; inspect the source status below.');
      setCustomKeyword('');
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : 'Additional keyword search failed.');
    } finally {
      setIsSearching(false);
      setSearchProgressMsg('');
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

      // Map each extracted claim to the most authentically relevant selected paper
      const claims: Claim[] = extractedClaims.map((claim, idx) => {
        const ranked = rankPapersByRelevance(selectedPapers, claim.text, true);
        const assignedPaper = ranked[0] || selectedPapers[0] || null;
        return {
          ...claim,
          candidatePapers: ranked.length > 0 ? ranked : selectedPapers,
          selectedPaper: null,
          status: assignedPaper ? 'found' : 'not_found',
          confidence: 'low',
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
              Search independent scholarly sources, import your reference library, and review candidate records before writing. Registry indexing and DOI registration do not establish peer review.
            </p>
          </div>
        </div>
      </div>

      <ReferenceImportPanel disabled={isSearching || isSynthesizing} onImport={handleImport} />
      {importNotice && <p role="status" className="rounded-xl border border-blue-200 dark:border-blue-800 p-3 text-xs text-blue-900 dark:text-blue-200">{importNotice}</p>}

      {/* Search Mode Strategy Selector */}
      <div className="p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveSubTab('federated')}
            className={`px-4 py-2 rounded-xl text-xs font-bold font-serif flex items-center gap-2 transition cursor-pointer ${
              activeSubTab === 'federated'
                ? 'bg-white dark:bg-slate-800 text-blue-950 dark:text-white shadow-sm border border-slate-200/80 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Search className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400" />
            <span>Mode 1: Exploratory &amp; Narrative Search</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('pico')}
            className={`px-4 py-2 rounded-xl text-xs font-bold font-serif flex items-center gap-2 transition cursor-pointer ${
              activeSubTab === 'pico'
                ? 'bg-white dark:bg-slate-800 text-blue-950 dark:text-white shadow-sm border border-slate-200/80 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Compass className="w-3.5 h-3.5 text-amber-500" />
            <span>Mode 2: PICO Systematic Strategy (PRISMA)</span>
          </button>
        </div>

        {discoveredPapers.length > 0 && (
          <div className="flex items-center gap-2 px-3 py-1 text-xs font-medium text-slate-600 dark:text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span><strong>{discoveredPapers.length}</strong> papers active in workspace</span>
          </div>
        )}
      </div>

      {activeSubTab === 'pico' ? (
        <PicoCompilerTab
          onExecuteSearch={(q, f) => {
            setTopic(q);
            if (f) setFocus(f);
            handleSearchLiterature(q, f);
            setTimeout(() => {
              resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
          }}
          onApplyQueryToSearch={(q, f) => {
            setTopic(q);
            if (f) setFocus(f);
            setActiveSubTab('federated');
            handleSearchLiterature(q, f);
          }}
          isSearching={isSearching}
          searchProgressMsg={searchProgressMsg}
          hasDiscoveredPapers={discoveredPapers.length > 0}
          discoveredCount={discoveredPapers.length}
          onScrollToResults={() => {
            resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
          }}
          initialQuestion={initialPicoQuestion}
          llmConfig={llmConfig}
        />
      ) : (
        /* Step 1: Input Topic & Scope */
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
                className="w-full pl-10 pr-10 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-base text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-700 focus:ring-1 focus:ring-blue-700 transition"
              />
              {topic && (
                <button
                  type="button"
                  onClick={() => setTopic('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer text-xs rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition"
                  title="Clear topic query"
                >
                  ✕
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => handleSearchLiterature()}
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
                  <span className="font-bold">Searching selected sources…</span>
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
                  <span className="font-mono">{searchProgressMsg || 'Querying selected sources…'}</span>
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
                  ✦ <strong>Intelligent Academic IR Mode:</strong> Natural language questions are converted into source-specific search terms. Coverage and query syntax vary by provider.
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
              <span>Discovery Filters:</span>
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
                <span>Require DOI metadata</span>
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
            <span>{showAdvancedFilters ? 'Hide source selection & search scope' : 'Choose sources & search scope'}</span>
            <ChevronDown className={`w-3 h-3 transition-transform ${showAdvancedFilters ? 'rotate-180' : ''}`} />
          </button>

          {showAdvancedFilters && (
            <div className="mt-2.5 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3 animate-in fade-in duration-150">
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                <div>
                  <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1.5 uppercase tracking-wider text-[11px]">
                    Academic Registries:
                  </span>
                  <fieldset className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <legend className="sr-only">Choose scholarly sources</legend>
                    {(Object.entries(SCHOLARLY_SOURCES) as [ScholarlySourceId, typeof SCHOLARLY_SOURCES[ScholarlySourceId]][]).map(([id, source]) => <label key={id} className="flex items-start gap-2 rounded-lg border border-slate-200 dark:border-slate-700 p-3 cursor-pointer">
                      <input type="checkbox" checked={enabledSources[id]} disabled={isSearching || (id === 'arxiv' && options.excludePreprints)} onChange={event => setEnabledSources({ ...enabledSources, [id]: event.target.checked })} className="mt-0.5 shrink-0" />
                      <span><span className="block font-semibold">{source.label}</span><span className="block mt-1 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">{source.description}</span></span>
                    </label>)}
                  </fieldset>
                  <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">Semantic Scholar is off by default. Successful sources remain usable when another fails. Citation counts reflect the primary record provider and are never summed across sources.</p>
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
      )}

      {/* UNIVERSAL EVIDENCE & PRISMA WORKSPACE (Visible across both Narrative and PICO modes) */}
      <div ref={resultsRef} className="space-y-6 pt-2">

      {isSearching && <div role="status" className="rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/40 p-5 text-sm text-blue-900 dark:text-blue-200">
        <p className="flex items-center gap-2 font-semibold"><Loader2 className="w-4 h-4 animate-spin" />Searching {activeSources.length} selected sources</p>
        <p className="mt-2 text-xs">{searchProgressMsg}</p>
        <p className="mt-2 text-xs">{activeSources.map(([, source]) => source.label).join(' · ')}</p>
      </div>}

      {!isSearching && sourceStatuses.length > 0 && <section aria-label="Source availability and retrieval status" className="rounded-xl border border-slate-200 dark:border-slate-700 p-4 space-y-3">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Last live search: source status</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">These are bounded retrieval counts before combined deduplication and final filters. A failed source does not mean it has no matching records.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">{sourceStatuses.map(source => <details key={source.name} className="rounded-lg border border-slate-200 dark:border-slate-700 p-3 text-xs text-slate-700 dark:text-slate-300">
          <summary className="cursor-pointer"><strong>{scholarlySourceLabel(source.name)}</strong>: {source.status} · {source.count} records</summary>
          <p className="mt-2 break-words">Query input: {source.query}</p><p className="mt-1">{source.detail}</p>
        </details>)}</div>
      </section>}

      {/* Search completed with 0 results */}
      {discoveredPapers.length === 0 && !isSearching && hasSearched && (
        <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-4 animate-in fade-in duration-200">
          <div className="p-8 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 text-center space-y-4">
            <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 flex items-center justify-center mx-auto">
              <Search className="w-6 h-6" />
            </div>
            <div className="space-y-1.5 max-w-md mx-auto">
              <h4 className="text-base font-bold text-amber-950 dark:text-amber-200 font-serif">
                No Candidate Records Retained
              </h4>
              <p className="text-xs text-amber-900/80 dark:text-amber-300 font-sans">
                No candidate records remain under the selected sources and filters. Check source availability above; you can also import records from a reference manager.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  const broader = topic.replace(/[^\w\s]/g, ' ').split(/\s+/).filter(w => w.length > 2).slice(0, 3).join(' ');
                  if (broader) {
                    setTopic(broader);
                    handleSearchLiterature(broader);
                  }
                }}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition cursor-pointer shadow-xs"
              >
                Retry with Broad Keywords
              </button>
              <button
                type="button"
                onClick={() => setHasSearched(false)}
                className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-300 text-xs font-semibold hover:bg-amber-100 transition cursor-pointer"
              >
                Show Search Guide
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Guided Empty State when no search has been initiated yet */}
      {discoveredPapers.length === 0 && !isSearching && !hasSearched && (
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
                    {activeSources.length} Selected Sources
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-sans">
                  Combine independent scholarly registries and imported references. Sources can overlap and have different coverage, licensing, and access limits.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {activeSources.map(([id, source]) => <div key={id} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4"><a href={source.url} target="_blank" rel="noreferrer" className="text-xs font-semibold text-blue-900 dark:text-blue-300 hover:underline">{source.label}</a><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{source.description}</p></div>)}
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
                    Exclude records identified as preprints. Other indexed records may still include unreviewed material; verify publication status at the source.
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
              <span className="font-mono text-[10px] uppercase font-bold text-blue-700 dark:text-blue-400">Source availability varies</span>
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
                  <span>Candidate records ({discoveredPapers.length})</span>
                </h3>
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Review publication status and metadata before citing. Citation counts vary by provider; zero may mean unavailable. Imported records are not independently verified.</p>
              <div className="flex flex-wrap items-center gap-1.5 mt-1 text-xs text-slate-500 dark:text-slate-400">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {selectedPaperIds.size} of {discoveredPapers.length} selected:
                </span>
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold transition cursor-pointer border ${
                    selectedPaperIds.size === discoveredPapers.length
                      ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-200'
                  }`}
                  title="Select all identified papers"
                >
                  All ({discoveredPapers.length})
                </button>
                {discoveredPapers.length > 25 && (
                  <button
                    type="button"
                    onClick={() => handleSelectTopN(25)}
                    className={`px-2 py-0.5 rounded text-[11px] font-semibold transition cursor-pointer border ${
                      selectedPaperIds.size === 25
                        ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-200'
                    }`}
                    title="Select top 25 most relevant papers"
                  >
                    Top 25
                  </button>
                )}
                {discoveredPapers.length > 50 && (
                  <button
                    type="button"
                    onClick={() => handleSelectTopN(50)}
                    className={`px-2 py-0.5 rounded text-[11px] font-semibold transition cursor-pointer border ${
                      selectedPaperIds.size === 50
                        ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-200'
                    }`}
                    title="Select top 50 most relevant papers"
                  >
                    Top 50
                  </button>
                )}
                {discoveredPapers.length > 100 && (
                  <button
                    type="button"
                    onClick={() => handleSelectTopN(100)}
                    className={`px-2 py-0.5 rounded text-[11px] font-semibold transition cursor-pointer border ${
                      selectedPaperIds.size === 100
                        ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-200'
                    }`}
                    title="Select top 100 most relevant papers"
                  >
                    Top 100
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleDeselectAll}
                  className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:underline cursor-pointer text-[11px] ml-1"
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
                          {paper.relevanceExplanation && (
                            <span
                              className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100/90 text-blue-900 dark:bg-blue-950 dark:text-blue-300 border border-blue-300 dark:border-blue-800 shadow-2xs"
                              title={`Topical Match Score: ${paper.relevanceExplanation.matchPercentage}%\n• ${paper.relevanceExplanation.summary}\n• Title Similarity: ${paper.relevanceExplanation.titleSimilarity}%\n• Keyword Coverage: ${paper.relevanceExplanation.keywordCoveragePct}%`}
                            >
                              <Sparkles className="w-2.5 h-2.5 text-blue-600 dark:text-blue-400" />
                              <span>{paper.relevanceExplanation.matchPercentage}% Match</span>
                            </span>
                          )}
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${tier.badgeClass}`}
                          >
                            {tier.label}
                          </span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {scholarlySourceLabel(paper.source)}
                          </span>
                          {paper.documentType && <span className="text-[10px] text-slate-500 dark:text-slate-400">{paper.documentType}</span>}
                          {paper.registryProvenance && paper.registryProvenance.length > 0 && <span className="text-[10px] text-slate-500 dark:text-slate-400" title="Registry provenance">Retrieved from: {[...new Set(paper.registryProvenance.map(item => scholarlySourceLabel(item.registry)))].join(' · ')}</span>}
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
                          title="View DOI record"
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

      {/* Welcome state when no search has been executed yet */}
      {!hasSearched && !isSearching && discoveredPapers.length === 0 && (
        <div className="p-8 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-center space-y-3">
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 flex items-center justify-center mx-auto">
            <Compass className="w-6 h-6" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white font-serif">
              Ready for Scholarly Discovery
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-sans">
              Enter your research topic above or formulate a PICO systematic strategy. Discovered literature, PRISMA flow attrition, and citation rankings will appear here.
            </p>
          </div>
        </div>
      )}

      </div>

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
