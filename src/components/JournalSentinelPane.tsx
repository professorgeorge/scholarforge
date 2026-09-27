import React, { useState, useEffect, useMemo } from 'react';
import {
  Compass,
  Target,
  Award,
  DollarSign,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ExternalLink,
  Copy,
  Check,
  Sparkles,
  ShieldCheck,
  FileText,
  Clock,
  TrendingUp,
  RefreshCw,
  ArrowRight,
  Sliders,
  CheckCheck
} from 'lucide-react';
import {
  matchJournalsForManuscript,
  auditManuscriptPreFlight,
  type JournalCandidate,
  type PreFlightAuditReport,
  type JournalFilterCriteria,
  BASELINE_JOURNALS_REGISTRY
} from '../services/journalMatchmakerService';
import type { LLMConfig } from '../services/llmService';

interface JournalSentinelPaneProps {
  initialTitle?: string;
  initialAbstract?: string;
  initialFullDraft?: string;
  initialReferences?: string[];
  llmConfig: LLMConfig;
  onAppendToDraft?: (textToAppend: string) => void;
  onNavigateToStudio?: () => void;
}

const SAMPLE_MANUSCRIPTS = [
  {
    label: 'Health Economics & Oncology (Clinical)',
    title: 'Cost-Effectiveness of First-Line Immunotherapy Regimens in Advanced Non-Small Cell Lung Cancer',
    abstract: 'Background: Immune checkpoint inhibitors have transformed first-line therapeutic paradigms for advanced non-small cell lung cancer (NSCLC), yet their pharmacoeconomic sustainability remains contentious. Methods: We developed a partitioned survival Markov model across a 10-year horizon from a healthcare payer perspective, comparing pembrolizumab plus chemotherapy against platinum-doublet chemotherapy alone. Transition probabilities, utilities, and adverse event costs were calibrated from Phase III clinical trials. Results: Immunotherapy combination yielded an incremental gain of 1.42 quality-adjusted life years (QALYs) at an incremental cost of $98,400, resulting in an incremental cost-effectiveness ratio (ICER) of $69,295 per QALY. Sensitivity analyses indicated that biomarker stratification with PD-L1 TPS >= 50% substantially improved value metrics. Conclusion: Pembrolizumab plus platinum-doublet chemotherapy represents a cost-effective intervention within conventional willingness-to-pay thresholds for advanced NSCLC.',
    draft: `Title: Cost-Effectiveness of First-Line Immunotherapy Regimens in Advanced Non-Small Cell Lung Cancer

Introduction:
Non-small cell lung cancer accounts for approximately 85% of all malignant pulmonary neoplasms worldwide. While targeted biological therapies and programmed death ligand-1 (PD-L1) checkpoint inhibitors have substantially prolonged progression-free survival, their budgetary impact poses significant resource allocation dilemmas for public health systems.

Methods:
We implemented a Markov cohort decision-analytic simulation modeled in monthly cycles over a lifetime horizon. Clinical efficacy parameters and hazard ratios were extracted from published randomized controlled trials (NCT02578680 and NCT02775435). Costs were evaluated in 2024 US Dollars. Probabilistic sensitivity analyses with 10,000 Monte Carlo iterations evaluated parameter uncertainty.

Results:
In base-case simulations, first-line combination therapy yielded an average survival of 3.86 life-years compared to 2.14 life-years in conventional chemotherapy. At a willingness-to-pay threshold of $100,000 per QALY, the probability of cost-effectiveness exceeded 82%.

Discussion:
Our empirical model demonstrates favorable economic value for immunotherapy in biomarker-enriched cohorts. Value-based pricing mechanisms remain paramount to preserve healthcare accessibility.

Data Availability Statement:
The datasets generated during and analyzed during the current study are available in the Harvard Dataverse repository (DOI: 10.7910/DVN/LUNG2025) or from the corresponding author upon reasonable academic request.

Conflict of Interest:
The authors declare no competing financial or non-financial conflicts of interest.

Ethical Approval:
This study analyzed secondary de-identified clinical trial data and was exempted from Institutional Review Board review by the University Health Research Ethics Committee (Exemption Ref: IRB-2024-HE-089).`,
    references: [
      'Gandhi L, et al. Pembrolizumab plus Chemotherapy in Metastatic Non-Small-Cell Lung Cancer. N Engl J Med. 2023;378(22):2078-2092.',
      'Reck M, et al. Five-Year Outcomes With Pembrolizumab Versus Chemotherapy for Metastatic Non-Small-Cell Lung Cancer. J Clin Oncol. 2024;39(21):2339-2349.',
      'Verma V, et al. Cost-effectiveness of checkpoint inhibition in oncology. Lancet Oncol. 2022;23(8):1011-1024.',
      'Sanders GD, et al. Recommendations for Conduct, Methodological Practices, and Reporting of Cost-effectiveness Analyses. JAMA. 2023;316(10):1093-1103.',
      'World Health Organization. Global Cancer Observatory: Lung Cancer Fact Sheet. Geneva: WHO; 2024.'
    ]
  },
  {
    label: 'Computer Science & AI (Machine Learning)',
    title: 'Hierarchical Multi-Agent Orchestration for Verifiable Fact-Checking in Dense Scientific Literature',
    abstract: 'Automated claim verification across vast academic corpuses poses significant challenges due to domain vocabulary drift, nuanced evidential qualifications, and citation hallucinations. In this paper, we introduce a hierarchical multi-agent framework comprising specialized literature-mining, semantic-alignment, and counter-evidence retrieval subagents. We evaluate our architecture across 50,000 biomedical claims from PubMed Central. Our empirical benchmarks show a 14.8% increase in verifiable entailment accuracy over state-of-the-art retrieval-augmented generation baselines, with sub-second latency per claim. Our findings confirm that decoupling claim decomposition from evidential arbitration drastically minimizes speculative reasoning.',
    draft: `Title: Hierarchical Multi-Agent Orchestration for Verifiable Fact-Checking in Dense Scientific Literature

Abstract:
Automated claim verification across vast academic corpuses poses significant challenges due to domain vocabulary drift, nuanced evidential qualifications, and citation hallucinations.

1. Introduction
Large language models demonstrate strong linguistic fluency but frequently hallucinate non-existent literature citations. In scientific research, rigorous factual verification is mandatory to prevent dissemination of ungrounded hypotheses.

2. Architecture
Our system decouples verification into three autonomous modules: (1) syntactic claim parsing, (2) hybrid lexical-vector literature hunting via OpenAlex and CrossRef APIs, and (3) natural language inference arbitration.

3. Results
Evaluation on the SciFact and BioCite benchmarks demonstrates 89.2% precision and 84.1% recall.`,
    references: [
      'Wadden D, et al. Fact or Fiction: Verifying Scientific Claims with SciFact. EMNLP 2022.',
      'Lewis P, et al. Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks. NeurIPS 2020.',
      'Karpukhin V, et al. Dense Passage Retrieval for Open-Domain Question Answering. EMNLP 2020.'
    ]
  }
];

export const JournalSentinelPane: React.FC<JournalSentinelPaneProps> = ({
  initialTitle = '',
  initialAbstract = '',
  initialFullDraft = '',
  initialReferences = [],
  llmConfig: _llmConfig,
  onAppendToDraft,
  onNavigateToStudio
}) => {
  // Input States
  const [title, setTitle] = useState<string>(initialTitle);
  const [abstract, setAbstract] = useState<string>(initialAbstract);
  const [fullDraft, setFullDraft] = useState<string>(initialFullDraft);
  const [isInputExpanded, setIsInputExpanded] = useState<boolean>(!initialTitle && !initialAbstract);

  // Active Sub-Tab
  const [activeSubTab, setActiveSubTab] = useState<'matchmaker' | 'sentinel'>('matchmaker');

  // Filter States for Matchmaker
  const [filters, setFilters] = useState<JournalFilterCriteria>({
    searchQuery: '',
    oaModel: 'all',
    maxApc: null,
    minQuartile: 'all',
    publisher: 'all'
  });

  // Data & Results States
  const [journals, setJournals] = useState<JournalCandidate[]>(BASELINE_JOURNALS_REGISTRY);
  const [auditReport, setAuditReport] = useState<PreFlightAuditReport | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Copy Feedback States
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [appendedDeclaration, setAppendedDeclaration] = useState<string | null>(null);

  // Run initial match if title or abstract provided
  useEffect(() => {
    if (initialTitle || initialAbstract) {
      setTitle(initialTitle);
      setAbstract(initialAbstract);
      if (initialFullDraft) setFullDraft(initialFullDraft);
      runDiscoveryAndAudit(initialTitle, initialAbstract, initialFullDraft, initialReferences);
    }
  }, [initialTitle, initialAbstract]);

  // Main Discovery & Sentinel Audit Routine
  const runDiscoveryAndAudit = async (
    targetTitle: string = title,
    targetAbstract: string = abstract,
    targetDraft: string = fullDraft,
    targetRefs: string[] = initialReferences
  ) => {
    if (!targetTitle.trim() && !targetAbstract.trim()) {
      return;
    }

    setIsLoading(true);

    try {
      // 1. Run live journal matchmaker
      const matched = await matchJournalsForManuscript(targetTitle, targetAbstract, filters);
      setJournals(matched);

      // 2. Run pre-flight desk-rejection audit
      const report = auditManuscriptPreFlight(targetTitle, targetAbstract, targetDraft, targetRefs);
      setAuditReport(report);
    } catch (err) {
      console.error('Error during journal matching and pre-flight audit:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Re-run filter application locally or on change
  const handleFilterChange = (updates: Partial<JournalFilterCriteria>) => {
    const nextFilters = { ...filters, ...updates };
    setFilters(nextFilters);
    // Run instant re-query
    if (title || abstract) {
      matchJournalsForManuscript(title, abstract, nextFilters).then((res) => {
        setJournals(res);
      });
    }
  };

  const handleLoadSample = (sample: typeof SAMPLE_MANUSCRIPTS[0]) => {
    setTitle(sample.title);
    setAbstract(sample.abstract);
    setFullDraft(sample.draft);
    setIsInputExpanded(false);
    runDiscoveryAndAudit(sample.title, sample.abstract, sample.draft, sample.references);
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleAppendDeclarationToDraft = (declText: string, key: string) => {
    if (onAppendToDraft) {
      onAppendToDraft(declText);
      setAppendedDeclaration(key);
      setTimeout(() => setAppendedDeclaration(null), 3000);
    } else {
      handleCopyText(declText, key);
    }
  };

  // Filtered Count Stats
  const diamondCount = useMemo(() => {
    return journals.filter((j) => j.oaType === 'Diamond OA ($0 APC)').length;
  }, [journals]);

  const q1Count = useMemo(() => {
    return journals.filter((j) => j.scopusQuartile === 'Q1').length;
  }, [journals]);

  return (
    <div className="space-y-6">
      
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 border border-slate-800 text-white p-6 sm:p-8 shadow-xl">
        <div className="relative z-10 max-w-4xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold border border-blue-400/30 backdrop-blur-md">
            <Compass className="w-3.5 h-3.5 text-blue-400" />
            <span>Pillar 6 : Strategic Publishing Intelligence</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight">
            The Journal Fit &amp; Desk-Rejection Pre-Flight Sentinel
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-3xl">
            Match your manuscript against Scopus Q1-Q4 journals, filter by APC budgets (including $0 Diamond OA),
            and audit 7 mission-critical integrity signals before submission to prevent instantaneous desk rejections.
          </p>

          {/* Quick Stats Banner */}
          <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-slate-300">
            <div className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
              <Award className="w-4 h-4 text-emerald-400" />
              <span>Scopus Q1-Q4 Quartile Indexing</span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
              <DollarSign className="w-4 h-4 text-teal-400" />
              <span>Diamond Open Access ($0 APC) Discovery</span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
              <ShieldCheck className="w-4 h-4 text-blue-400" />
              <span>7-Point Desk-Rejection Pre-Flight Triage</span>
            </div>
          </div>
        </div>
      </div>

      {/* Manuscript Input Drawer / Editor */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition">
        <div className="p-4 sm:p-5 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 flex items-center justify-center font-bold">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Target Manuscript Context
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {title ? `Title: "${title.slice(0, 70)}${title.length > 70 ? '...' : ''}"` : 'Enter title and abstract to calculate journal fit and audit risk'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Exemplar Sample Dropdown */}
            <div className="hidden sm:flex items-center gap-1.5">
              <span className="text-xs text-slate-500 dark:text-slate-400">Sample:</span>
              {SAMPLE_MANUSCRIPTS.map((sample, idx) => (
                <button
                  key={idx}
                  onClick={() => handleLoadSample(sample)}
                  className="px-2.5 py-1 text-xs font-semibold rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition cursor-pointer"
                >
                  {sample.label.split(' ')[0]}
                </button>
              ))}
            </div>

            <button
              onClick={() => setIsInputExpanded(!isInputExpanded)}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer"
            >
              {isInputExpanded ? 'Collapse Input' : 'Edit Manuscript Text'}
            </button>
          </div>
        </div>

        {isInputExpanded && (
          <div className="p-4 sm:p-6 space-y-4 bg-slate-50/50 dark:bg-slate-950/40">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Manuscript Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Cost-Effectiveness of First-Line Immunotherapy Regimens in Advanced Non-Small Cell Lung Cancer"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600 dark:text-white"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Abstract
                </label>
                <span className="text-xs font-mono text-slate-500">
                  {abstract.trim() ? abstract.trim().split(/\s+/).length : 0} words (Target: 150-250)
                </span>
              </div>
              <textarea
                rows={4}
                value={abstract}
                onChange={(e) => setAbstract(e.target.value)}
                placeholder="Paste your manuscript abstract (Background, Methods, Results, Conclusion)..."
                className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600 dark:text-white font-sans"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Full Manuscript Text or Body Draft (Optional - Required for deep pre-flight integrity audit)
              </label>
              <textarea
                rows={4}
                value={fullDraft}
                onChange={(e) => setFullDraft(e.target.value)}
                placeholder="Paste Introduction, Methods, Declarations (Data Availability, Ethics, Conflicts of Interest) for automated compliance scanning..."
                className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600 dark:text-white font-mono"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => runDiscoveryAndAudit()}
                disabled={isLoading || (!title.trim() && !abstract.trim())}
                className="px-5 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-sm shadow-md flex items-center gap-2 transition cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Searching Journals &amp; Auditing...</span>
                  </>
                ) : (
                  <>
                    <Target className="w-4 h-4 text-blue-300" />
                    <span>Analyze Fit &amp; Run Sentinel Audit</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Primary Sub-Tab Switcher */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('matchmaker')}
            className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition cursor-pointer ${
              activeSubTab === 'matchmaker'
                ? 'bg-blue-900 dark:bg-blue-800 text-white shadow-sm'
                : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>Journal Matchmaker &amp; Impact Discovery</span>
            <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-blue-950/60 text-blue-200 border border-blue-700">
              {journals.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('sentinel')}
            className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition cursor-pointer ${
              activeSubTab === 'sentinel'
                ? 'bg-emerald-800 dark:bg-emerald-700 text-white shadow-sm'
                : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Desk-Rejection Pre-Flight Sentinel</span>
            {auditReport && (
              <span className={`ml-1 text-xs px-2 py-0.5 rounded-full font-bold ${
                auditReport.overallScore >= 80 
                  ? 'bg-emerald-950 text-emerald-200' 
                  : auditReport.overallScore >= 60 
                    ? 'bg-amber-950 text-amber-200' 
                    : 'bg-rose-950 text-rose-200'
              }`}>
                {auditReport.overallScore}/100
              </span>
            )}
          </button>
        </div>

        {onNavigateToStudio && (
          <button
            onClick={onNavigateToStudio}
            className="text-xs font-semibold text-blue-700 hover:text-blue-800 dark:text-blue-400 flex items-center gap-1 cursor-pointer"
          >
            <span>Manuscript Studio</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SUB-TAB 1: JOURNAL MATCHMAKER & IMPACT DISCOVERY */}
      {/* ========================================================================= */}
      {activeSubTab === 'matchmaker' && (
        <div className="space-y-5">
          
          {/* Interactive Multi-Criteria Filter Bar */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                <Sliders className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>Publishing &amp; Impact Filter Criteria</span>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Showing <strong>{journals.length}</strong> matching journals ({diamondCount} Diamond OA, {q1Count} Q1)
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              
              {/* Filter: Open Access Model */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  Open Access Model
                </label>
                <select
                  value={filters.oaModel}
                  onChange={(e) => handleFilterChange({ oaModel: e.target.value as any })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="all">All Publishing Models</option>
                  <option value="diamond">Diamond OA ($0 APC - Free for Author &amp; Reader)</option>
                  <option value="gold">Gold Open Access (DOAJ indexed)</option>
                  <option value="hybrid">Hybrid Journals (Subscription + OA option)</option>
                </select>
              </div>

              {/* Filter: Scopus Quartile */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  Scopus Quartile
                </label>
                <select
                  value={filters.minQuartile}
                  onChange={(e) => handleFilterChange({ minQuartile: e.target.value as any })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="all">All Quartiles (Q1 to Q4)</option>
                  <option value="Q1">Top 25% (Q1 Only)</option>
                  <option value="Q2">Top 50% (Q1 &amp; Q2)</option>
                </select>
              </div>

              {/* Filter: Maximum APC Budget */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  Max APC Budget (USD)
                </label>
                <select
                  value={filters.maxApc === null ? 'any' : filters.maxApc}
                  onChange={(e) => {
                    const val = e.target.value;
                    handleFilterChange({ maxApc: val === 'any' ? null : Number(val) });
                  }}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="any">Any APC Budget</option>
                  <option value="0">$0 Only (Diamond Open Access)</option>
                  <option value="1500">Under $1,500 USD</option>
                  <option value="2500">Under $2,500 USD</option>
                  <option value="3500">Under $3,500 USD</option>
                </select>
              </div>

              {/* Filter: Publisher Filter */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  Publisher / Society
                </label>
                <select
                  value={filters.publisher}
                  onChange={(e) => handleFilterChange({ publisher: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="all">All Publishers</option>
                  <option value="Elsevier">Elsevier</option>
                  <option value="Springer">Springer Nature</option>
                  <option value="Wiley">Wiley</option>
                  <option value="Oxford">Oxford University Press</option>
                  <option value="PLOS">Public Library of Science (PLOS)</option>
                  <option value="Frontiers">Frontiers</option>
                  <option value="MDPI">MDPI</option>
                  <option value="IEEE">IEEE</option>
                </select>
              </div>

            </div>
          </div>

          {/* Journal Match Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {journals.map((journal) => {
              const isDiamond = journal.oaType === 'Diamond OA ($0 APC)';
              const quartileColors = {
                Q1: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-800',
                Q2: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/80 dark:text-blue-300 dark:border-blue-800',
                Q3: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-800',
                Q4: 'bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
              };

              return (
                <div
                  key={journal.id}
                  className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-xs hover:shadow-md transition flex flex-col justify-between space-y-4 relative overflow-hidden"
                >
                  {/* Top Bar: Title, ISSN & Match Gauge */}
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${quartileColors[journal.scopusQuartile]}`}>
                            Scopus {journal.scopusQuartile}
                          </span>
                          {isDiamond ? (
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-teal-100 dark:bg-teal-950/80 text-teal-800 dark:text-teal-300 border border-teal-300 dark:border-teal-800 flex items-center gap-1">
                              <Sparkles className="w-3 h-3 text-teal-600 dark:text-teal-400" />
                              <span>Diamond OA ($0 APC)</span>
                            </span>
                          ) : journal.apcUsd !== null ? (
                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                              APC: ${journal.apcUsd.toLocaleString()} USD
                            </span>
                          ) : (
                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                              {journal.oaType}
                            </span>
                          )}
                        </div>

                        <h3 className="text-base font-serif font-bold text-slate-900 dark:text-white leading-snug">
                          {journal.title}
                        </h3>

                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                          <span className="font-semibold">{journal.publisher}</span>
                          <span>•</span>
                          <span className="font-mono text-[11px]">ISSN: {journal.issn}</span>
                        </div>
                      </div>

                      {/* Match Score Circular / Badge */}
                      <div className="shrink-0 text-right">
                        <div className="inline-flex flex-col items-center justify-center w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-800">
                          <span className="text-sm font-extrabold text-blue-900 dark:text-blue-300 leading-none">
                            {journal.matchScore}%
                          </span>
                          <span className="text-[9px] font-bold text-blue-600 dark:text-blue-400 uppercase mt-0.5">
                            Match
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Editorial & Impact Metrics Strip */}
                    <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
                      <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                        <div className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">
                          CiteScore
                        </div>
                        <div className="text-sm font-bold text-slate-900 dark:text-white mt-0.5 flex items-center justify-center gap-1">
                          <TrendingUp className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                          <span>{journal.citeScore}</span>
                        </div>
                      </div>

                      <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                        <div className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">
                          First Decision
                        </div>
                        <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-0.5 flex items-center justify-center gap-1">
                          <Clock className="w-3 h-3 text-slate-500" />
                          <span>{journal.reviewSpeedWeeks}</span>
                        </div>
                      </div>

                      <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                        <div className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">
                          Acceptance
                        </div>
                        <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                          {journal.acceptanceRateEstimated}
                        </div>
                      </div>
                    </div>

                    {/* Topics & Match Rationale */}
                    <div className="mt-3 space-y-2">
                      <p className="text-xs text-slate-600 dark:text-slate-300 italic">
                        {journal.matchRationale}
                      </p>

                      <div className="flex flex-wrap gap-1">
                        {journal.topics.map((t, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Actions: Direct Link & Copy */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleCopyText(`${journal.title} (ISSN: ${journal.issn})`, journal.id)}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition cursor-pointer"
                    >
                      {copiedId === journal.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Details</span>
                        </>
                      )}
                    </button>

                    <a
                      href={journal.homepageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 text-xs font-bold rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-900 dark:text-blue-300 border border-blue-200 dark:border-blue-800 flex items-center gap-1.5 transition"
                    >
                      <span>Guide for Authors</span>
                      <ExternalLink className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 2: DESK-REJECTION PRE-FLIGHT SENTINEL */}
      {/* ========================================================================= */}
      {activeSubTab === 'sentinel' && (
        <div className="space-y-6">
          
          {/* Pre-Flight Health Score Card */}
          {auditReport && (
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
              
              <div className="flex items-center gap-5">
                <div className={`w-20 h-20 rounded-2xl flex flex-col items-center justify-center font-serif font-extrabold text-2xl border shadow-inner ${
                  auditReport.overallScore >= 80
                    ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                    : auditReport.overallScore >= 60
                      ? 'bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                      : 'bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800'
                }`}>
                  <span>{auditReport.overallScore}</span>
                  <span className="text-[10px] font-sans font-bold uppercase tracking-wider -mt-1">/ 100</span>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                      auditReport.overallScore >= 80
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : auditReport.overallScore >= 60
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                    }`}>
                      {auditReport.status}
                    </span>
                    <span className="text-xs text-slate-500 font-sans">
                      Automated Pre-Flight Sentinel Audit
                    </span>
                  </div>
                  <h3 className="text-lg font-serif font-bold text-slate-900 dark:text-white">
                    Submission Readiness Assessment
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xl">
                    Leading journals (e.g. Elsevier, Nature, IEEE, PLOS) reject up to 45% of incoming manuscripts at desk triage due to technical non-compliance.
                  </p>
                </div>
              </div>

              {/* Triage Metrics Summary */}
              <div className="flex flex-wrap items-center gap-3 text-center w-full md:w-auto">
                <div className="px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex-1 md:flex-initial">
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Abstract Size</div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white">
                    {auditReport.abstractWordCount} / {auditReport.abstractMaxRecommended}w
                  </div>
                </div>
                <div className="px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex-1 md:flex-initial">
                  <div className="text-[10px] font-bold text-slate-500 uppercase">References</div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white">
                    {auditReport.referencesCount} cited
                  </div>
                </div>
                <div className="px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex-1 md:flex-initial">
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Recent (5yr)</div>
                  <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                    {auditReport.recentReferencesPercent}%
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* 7-Point Audit Checklist */}
          {auditReport && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Pre-Flight Checklist &amp; Integrity Diagnostics
                </h3>
                <span className="text-xs text-slate-500">
                  7 Critical Checks Evaluated
                </span>
              </div>

              <div className="space-y-3">
                {auditReport.checks.map((check) => {
                  const statusConfig = {
                    pass: {
                      icon: CheckCircle2,
                      iconColor: 'text-emerald-600 dark:text-emerald-400',
                      badgeBg: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
                      badgeText: 'Pass'
                    },
                    warning: {
                      icon: AlertTriangle,
                      iconColor: 'text-amber-500 dark:text-amber-400',
                      badgeBg: 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800',
                      badgeText: 'Review Needed'
                    },
                    fail: {
                      icon: XCircle,
                      iconColor: 'text-rose-600 dark:text-rose-400',
                      badgeBg: 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800',
                      badgeText: 'High Desk-Rejection Risk'
                    }
                  }[check.status];

                  const IconComponent = statusConfig.icon;

                  return (
                    <div
                      key={check.id}
                      className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-start justify-between gap-4"
                    >
                      <div className="flex items-start gap-3">
                        <IconComponent className={`w-5 h-5 shrink-0 mt-0.5 ${statusConfig.iconColor}`} />
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-bold text-slate-900 dark:text-white font-serif">
                              {check.title}
                            </span>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                              {check.category}
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${statusConfig.badgeBg}`}>
                              {statusConfig.badgeText}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-300">
                            {check.message}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-sans italic">
                            Action: {check.fixAdvice}
                          </p>

                          {check.autoFixContent && (
                            <div className="mt-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-800 dark:text-slate-200">
                              {check.autoFixContent}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 1-Click Fix Button */}
                      {check.autoFixContent && (
                        <div className="shrink-0 self-end sm:self-center">
                          <button
                            onClick={() => handleAppendDeclarationToDraft(check.autoFixContent!, check.id)}
                            className="px-3 py-1.5 text-xs font-bold rounded-lg bg-blue-900 hover:bg-blue-800 text-white flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                          >
                            {appendedDeclaration === check.id || copiedId === check.id ? (
                              <>
                                <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                                <span>{onAppendToDraft ? 'Appended to Draft!' : 'Copied!'}</span>
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-3.5 h-3.5 text-blue-300" />
                                <span>{onAppendToDraft ? 'Append to Draft' : 'Copy Declaration'}</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Standard Publisher Declarations Generator Box */}
          {auditReport && (
            <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-slate-900 dark:to-blue-950/20 border border-blue-200 dark:border-blue-900/60 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-700 dark:text-blue-400" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white font-serif">
                    Publisher-Ready Declarations Package
                  </h3>
                </div>
                <button
                  onClick={() => {
                    const combined = `${auditReport.generatedDeclarations.dataAvailability}\n\n${auditReport.generatedDeclarations.conflictOfInterest}\n\n${auditReport.generatedDeclarations.ethicalApproval}`;
                    if (onAppendToDraft) {
                      onAppendToDraft(combined);
                      setAppendedDeclaration('all');
                      setTimeout(() => setAppendedDeclaration(null), 3000);
                    } else {
                      handleCopyText(combined, 'all');
                    }
                  }}
                  className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-blue-900 hover:bg-blue-800 text-white flex items-center gap-1.5 transition cursor-pointer"
                >
                  {appendedDeclaration === 'all' || copiedId === 'all' ? (
                    <>
                      <CheckCheck className="w-3.5 h-3.5 text-emerald-300" />
                      <span>{onAppendToDraft ? 'Appended All to Draft!' : 'Copied All!'}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>{onAppendToDraft ? 'Append All to Manuscript Draft' : 'Copy All Declarations'}</span>
                    </>
                  )}
                </button>
              </div>

              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                  <div className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase">
                    Data Availability Statement
                  </div>
                  <p className="text-xs text-slate-800 dark:text-slate-200 font-mono">
                    {auditReport.generatedDeclarations.dataAvailability}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                  <div className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase">
                    Conflict of Interest Disclosure
                  </div>
                  <p className="text-xs text-slate-800 dark:text-slate-200 font-mono">
                    {auditReport.generatedDeclarations.conflictOfInterest}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                  <div className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase">
                    Ethical Approval &amp; Consent Statement
                  </div>
                  <p className="text-xs text-slate-800 dark:text-slate-200 font-mono">
                    {auditReport.generatedDeclarations.ethicalApproval}
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
};
