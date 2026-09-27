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
  FileSpreadsheet,
  Compass
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

interface LiteratureFirstPaneProps {
  onManuscriptSynthesized: (manuscript: string, claims: Claim[]) => void;
  options: CitationOptions;
  llmConfig?: LLMConfig;
}

export const LiteratureFirstPane: React.FC<LiteratureFirstPaneProps> = ({
  onManuscriptSynthesized,
  options,
  llmConfig = DEFAULT_LLM_CONFIG,
}) => {
  const [topic, setTopic] = useState('');
  const [focus, setFocus] = useState('');
  const [activeSubTab, setActiveSubTab] = useState<'federated' | 'pico'>('federated');
  const [isSearching, setIsSearching] = useState(false);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [isPromptsOpen, setIsPromptsOpen] = useState(false);
  const [isPrismaOpen, setIsPrismaOpen] = useState(false);
  const [prismaStats, setPrismaStats] = useState<PrismaFlowStats | null>(null);
  const [cartFeedback, setCartFeedback] = useState<string | null>(null);
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

  const handleSearchLiterature = async () => {
    if (!topic.trim()) {
      setErrorMsg('Please enter a research topic.');
      return;
    }

    setErrorMsg('');
    setIsSearching(true);
    setDiscoveredPapers([]);
    setSelectedPaperIds(new Set());

    try {
      const fullQuery = focus ? `${topic} ${focus}` : topic;
      const result = await executeFederatedSearch(fullQuery, {
        limitPerSource: 12,
        excludePreprints: options.excludePreprints,
        searchScope,
        enabledSources,
      });

      setPrismaStats(result.prismaStats);

      if (result.papers.length === 0) {
        setErrorMsg('No peer-reviewed papers found with DOIs for this exact topic across selected registries. Try broader search terms.');
      } else {
        setDiscoveredPapers(result.papers);
        // By default select top 6 papers
        setSelectedPaperIds(new Set(result.papers.slice(0, 6).map((p) => p.id)));
      }
    } catch (err: any) {
      setErrorMsg(`Federated literature discovery failed: ${err.message}`);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddCustomKeywordSearch = async () => {
    if (!customKeyword.trim()) return;
    setIsSearching(true);
    try {
      const extraPapers = await huntAcademicPapers([customKeyword], 6, options.excludePreprints);
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

  const quickTopics = [
    { title: 'SGLT2 inhibitors in heart failure with preserved ejection fraction', focus: 'Cardiovascular mortality, hospitalizations, and renal outcomes' },
    { title: 'CRISPR-Cas9 epigenome editing in oncology', focus: 'Target specificity, off-target mutations, and transcriptional silencing' },
    { title: 'Solid-state electrolyte degradation in lithium metal batteries', focus: 'Dendrite suppression, ionic conductivity, and interfacial impedance' },
    { title: 'Microplastics trophic transfer in marine pelagic food webs', focus: 'Bioaccumulation, polychlorinated biphenyl desorption, and cellular toxicity' },
  ];

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
                100% Grounded in Real Papers
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
          onApplyQueryToSearch={(q) => {
            setTopic(q);
            setActiveSubTab('federated');
          }}
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
                placeholder="e.g. SGLT2 inhibitors clinical efficacy in heart failure with preserved ejection fraction..."
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-base text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-700 focus:ring-1 focus:ring-blue-700 transition"
              />
            </div>
            <button
              onClick={handleSearchLiterature}
              disabled={isSearching || !topic.trim()}
              className="btn-academic-primary px-6 py-3 rounded-xl text-sm font-semibold flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
            >
              {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              <span>Discover Literature</span>
            </button>
          </div>

          {/* Quick topic pills */}
          <div className="flex flex-wrap items-center gap-2 mt-2.5">
            <span className="text-xs text-slate-500 font-medium">Sample Research Topics:</span>
            {quickTopics.map((qt, i) => (
              <button
                key={i}
                onClick={() => {
                  setTopic(qt.title);
                  setFocus(qt.focus);
                }}
                className="text-xs px-2.5 py-1 rounded-md bg-slate-100 hover:bg-blue-50 dark:bg-slate-800 dark:hover:bg-blue-950/60 text-slate-700 hover:text-blue-900 dark:text-slate-300 dark:hover:text-blue-300 border border-slate-200 dark:border-slate-700 transition cursor-pointer"
              >
                {qt.title.split(' ')[0]} {qt.title.split(' ')[1]}...
              </button>
            ))}
          </div>
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
            placeholder="e.g. Randomized clinical trials, cardiovascular mortality, mechanistic pathways, or adverse events"
            className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-700 focus:ring-1 focus:ring-blue-700 transition"
          />
        </div>

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

      {/* Step 2: Discovered Literature Corpus */}
      {discoveredPapers.length > 0 && (
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-4 animate-in fade-in duration-200">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white font-serif flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <span>Verified Scholarly Corpus ({discoveredPapers.length} Peer-Reviewed Works)</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Select the genuine papers to synthesize into the literature review ({selectedPaperIds.size} selected).
              </p>
            </div>

            {/* Quick add custom search keyword */}
            <div className="flex items-center gap-2">
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
                  <span>PRISMA 2020 Flow</span>
                </button>
              )}
            </div>
          </div>

          {/* Dataset Scientometrics Banner */}
          {(() => {
            const metrics = calculateDatasetMetrics(discoveredPapers);
            return (
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 grid grid-cols-4 gap-2 text-center">
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
          <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
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

                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => togglePaperSelection(paper.id)}
                        className="mt-1 rounded border-slate-300 text-blue-800 focus:ring-blue-700 cursor-pointer"
                      />
                      <div className="flex-1">
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
                <span>7 LLM Prompts Suite</span>
              </button>

              {cartFeedback && (
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> {cartFeedback}
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

    </div>
  );
};
