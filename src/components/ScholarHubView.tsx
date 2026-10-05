import React, { useState, useMemo } from 'react';
import {
  Search,
  ShieldCheck,
  Database,
  Users,
  BookOpen,
  CheckCircle2,
  FileCheck,
  Compass,
  ShieldAlert,
  SlidersHorizontal,
  Wrench,
  Sparkles,
  ArrowRight,
  Library,
  FileText,
  Layers,
  LayoutGrid,
  Zap,
  Check
} from 'lucide-react';
import type { AcademicPillar, ResearchStage } from './Navbar';

export interface UtilityTileDef {
  id: AcademicPillar;
  simpleTitle: string;
  subTitle: string;
  categoryLabel: string;
  stageId: ResearchStage;
  stageNumber: string;
  stageName: string;
  description: string;
  popular: boolean;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: {
    bgLight: string;
    bgDark: string;
    borderLight: string;
    borderDark: string;
    iconBgLight: string;
    iconBgDark: string;
    iconColorLight: string;
    iconColorDark: string;
    badgeBgLight: string;
    badgeBgDark: string;
    badgeTextLight: string;
    badgeTextDark: string;
    ringColor: string;
  };
  tags: string[];
  primaryActionLabel: string;
}

export const UTILITY_TILES: UtilityTileDef[] = [
  {
    id: 'literature',
    simpleTitle: 'Literature Search',
    subTitle: 'Federated Multi-Registry Search',
    categoryLabel: 'Literature & Discovery',
    stageId: 'discover',
    stageNumber: '1',
    stageName: 'Discover',
    description: 'Simultaneously query OpenAlex, PubMed Central, Europe PMC, Crossref, Semantic Scholar, and arXiv with real-time deduplication and PRISMA 2020 protocol tracking.',
    popular: true,
    icon: Search,
    accentColor: {
      bgLight: 'hover:bg-blue-50/50',
      bgDark: 'dark:hover:bg-blue-950/20',
      borderLight: 'hover:border-blue-300',
      borderDark: 'dark:hover:border-blue-700',
      iconBgLight: 'bg-blue-100',
      iconBgDark: 'dark:bg-blue-900/60',
      iconColorLight: 'text-blue-700',
      iconColorDark: 'dark:text-blue-300',
      badgeBgLight: 'bg-blue-50',
      badgeBgDark: 'dark:bg-blue-950/60',
      badgeTextLight: 'text-blue-700',
      badgeTextDark: 'dark:text-blue-300',
      ringColor: 'focus:ring-blue-500/20'
    },
    tags: ['5 Registries', 'PRISMA 2020', 'Retraction Alert', 'h-Index'],
    primaryActionLabel: 'Search Literature'
  },
  {
    id: 'verify',
    simpleTitle: 'Reference & DOI Audits',
    subTitle: 'Pre-Submission Integrity & Hallucination Auditor',
    categoryLabel: 'Citation & DOI Audit',
    stageId: 'publish',
    stageNumber: '4',
    stageName: 'Publish & Audit',
    description: 'Audit pasted bibliographies against Crossref, OpenAlex, and PubMed. Detect AI-hallucinated citations, broken DOIs, Retraction Watch flags, and fix typos with 1-click.',
    popular: true,
    icon: ShieldCheck,
    accentColor: {
      bgLight: 'hover:bg-emerald-50/50',
      bgDark: 'dark:hover:bg-emerald-950/20',
      borderLight: 'hover:border-emerald-300',
      borderDark: 'dark:hover:border-emerald-700',
      iconBgLight: 'bg-emerald-100',
      iconBgDark: 'dark:bg-emerald-900/60',
      iconColorLight: 'text-emerald-700',
      iconColorDark: 'dark:text-emerald-300',
      badgeBgLight: 'bg-emerald-50',
      badgeBgDark: 'dark:bg-emerald-950/60',
      badgeTextLight: 'text-emerald-700',
      badgeTextDark: 'dark:text-emerald-300',
      ringColor: 'focus:ring-emerald-500/20'
    },
    tags: ['DOI Verification', 'Retraction Watch', 'AI Hallucination Flag', 'Auto-Fix'],
    primaryActionLabel: 'Audit References'
  },
  {
    id: 'synthetic',
    simpleTitle: 'Synthetic Data Generator',
    subTitle: 'Monte Carlo Engine & Qualitative Simulation',
    categoryLabel: 'Data & Simulation',
    stageId: 'design',
    stageNumber: '2',
    stageName: 'Design & Data',
    description: 'Synthesize statistical datasets for moderation, mediation (Hayes Model 4), factorial ANOVA, and Likert scales, plus realistic semi-structured interview transcripts with codebooks.',
    popular: true,
    icon: Database,
    accentColor: {
      bgLight: 'hover:bg-indigo-50/50',
      bgDark: 'dark:hover:bg-indigo-950/20',
      borderLight: 'hover:border-indigo-300',
      borderDark: 'dark:hover:border-indigo-700',
      iconBgLight: 'bg-indigo-100',
      iconBgDark: 'dark:bg-indigo-900/60',
      iconColorLight: 'text-indigo-700',
      iconColorDark: 'dark:text-indigo-300',
      badgeBgLight: 'bg-indigo-50',
      badgeBgDark: 'dark:bg-indigo-950/60',
      badgeTextLight: 'text-indigo-700',
      badgeTextDark: 'dark:text-indigo-300',
      ringColor: 'focus:ring-indigo-500/20'
    },
    tags: ['Monte Carlo', 'Hayes Process 4', 'R / Python / SPSS', 'Interview Discourse'],
    primaryActionLabel: 'Generate Data'
  },
  {
    id: 'scholars',
    simpleTitle: 'Scholar & Reviewer Finder',
    subTitle: 'Peer Reviewers & Scientometrics Network',
    categoryLabel: 'Peer Reviewers',
    stageId: 'publish',
    stageNumber: '4',
    stageName: 'Publish & Audit',
    description: 'Discover relevant peer reviewers, co-authors, and grant panelists using OpenAlex graph queries. Calculate author h-index, g-index, m-quotient, and screen for Conflicts of Interest (COI).',
    popular: true,
    icon: Users,
    accentColor: {
      bgLight: 'hover:bg-rose-50/50',
      bgDark: 'dark:hover:bg-rose-950/20',
      borderLight: 'hover:border-rose-300',
      borderDark: 'dark:hover:border-rose-700',
      iconBgLight: 'bg-rose-100',
      iconBgDark: 'dark:bg-rose-900/60',
      iconColorLight: 'text-rose-700',
      iconColorDark: 'dark:text-rose-300',
      badgeBgLight: 'bg-rose-50',
      badgeBgDark: 'dark:bg-rose-950/60',
      badgeTextLight: 'text-rose-700',
      badgeTextDark: 'dark:text-rose-300',
      ringColor: 'focus:ring-rose-500/20'
    },
    tags: ['Reviewer Matching', 'Scientometrics', 'COI Detection', 'Outreach Drafter'],
    primaryActionLabel: 'Find Reviewers'
  },
  {
    id: 'studio',
    simpleTitle: 'Manuscript Studio',
    subTitle: 'Grounded Writing Canvas & R&R Overhaul',
    categoryLabel: 'Manuscript Studio',
    stageId: 'draft',
    stageNumber: '3',
    stageName: 'Draft & Ground',
    description: 'Draft academic manuscripts with an interactive evidence drawer, 1-click citation cart injection, and an automated Point-by-Point Author Response Letter engine for peer review revisions.',
    popular: true,
    icon: BookOpen,
    accentColor: {
      bgLight: 'hover:bg-amber-50/50',
      bgDark: 'dark:hover:bg-amber-950/20',
      borderLight: 'hover:border-amber-300',
      borderDark: 'dark:hover:border-amber-700',
      iconBgLight: 'bg-amber-100',
      iconBgDark: 'dark:bg-amber-900/60',
      iconColorLight: 'text-amber-800',
      iconColorDark: 'dark:text-amber-300',
      badgeBgLight: 'bg-amber-50',
      badgeBgDark: 'dark:bg-amber-950/60',
      badgeTextLight: 'text-amber-800',
      badgeTextDark: 'dark:text-amber-300',
      ringColor: 'focus:ring-amber-500/20'
    },
    tags: ['Split-Screen Writing', 'Evidence Drawer', 'R&R Overhaul', 'Dynamic Citations'],
    primaryActionLabel: 'Open Studio'
  },
  {
    id: 'claims',
    simpleTitle: 'Claims & Evidence Workbench',
    subTitle: 'Linguistic Claim Extraction & Consensus',
    categoryLabel: 'Evidence & Fact-Checking',
    stageId: 'draft',
    stageNumber: '3',
    stageName: 'Draft & Ground',
    description: 'Extract factual, empirical claims sentence-by-sentence from your thesis or draft. Validate assertions against the literature with visual consensus meters (Supported / Contradicted).',
    popular: false,
    icon: CheckCircle2,
    accentColor: {
      bgLight: 'hover:bg-teal-50/50',
      bgDark: 'dark:hover:bg-teal-950/20',
      borderLight: 'hover:border-teal-300',
      borderDark: 'dark:hover:border-teal-700',
      iconBgLight: 'bg-teal-100',
      iconBgDark: 'dark:bg-teal-900/60',
      iconColorLight: 'text-teal-700',
      iconColorDark: 'dark:text-teal-300',
      badgeBgLight: 'bg-teal-50',
      badgeBgDark: 'dark:bg-teal-950/60',
      badgeTextLight: 'text-teal-700',
      badgeTextDark: 'dark:text-teal-300',
      ringColor: 'focus:ring-teal-500/20'
    },
    tags: ['Claim Extraction', 'Consensus Meter', 'Evidence Injection', 'Fact-Checking'],
    primaryActionLabel: 'Extract Claims'
  },
  {
    id: 'journal',
    simpleTitle: 'Journal Matchmaker & Pre-Flight',
    subTitle: 'Scopus/WoS Fit & Desk-Rejection Audit',
    categoryLabel: 'Journal Pre-Flight',
    stageId: 'publish',
    stageNumber: '4',
    stageName: 'Publish & Audit',
    description: 'Match manuscripts to indexed journals by Scopus CiteScore, acceptance rate, review speed, and open-access costs. Run pre-flight audits on word counts, citation recency, and ethics.',
    popular: false,
    icon: FileCheck,
    accentColor: {
      bgLight: 'hover:bg-purple-50/50',
      bgDark: 'dark:hover:bg-purple-950/20',
      borderLight: 'hover:border-purple-300',
      borderDark: 'dark:hover:border-purple-700',
      iconBgLight: 'bg-purple-100',
      iconBgDark: 'dark:bg-purple-900/60',
      iconColorLight: 'text-purple-700',
      iconColorDark: 'dark:text-purple-300',
      badgeBgLight: 'bg-purple-50',
      badgeBgDark: 'dark:bg-purple-950/60',
      badgeTextLight: 'text-purple-700',
      badgeTextDark: 'dark:text-purple-300',
      ringColor: 'focus:ring-purple-500/20'
    },
    tags: ['Scopus & WoS Match', 'Desk-Rejection Audit', 'Diamond OA / APC', 'Word Limits'],
    primaryActionLabel: 'Match Journals'
  },
  {
    id: 'methodology',
    simpleTitle: 'Methodology Compass',
    subTitle: 'Epistemic Coherence & Statistical Code',
    categoryLabel: 'Research Design',
    stageId: 'design',
    stageNumber: '2',
    stageName: 'Design & Data',
    description: 'Validate epistemic alignment across Ontology → Epistemology → Paradigm → Methodology → Method → Analysis. Get interactive design recommendations and ready-to-run R, Python, and SPSS code.',
    popular: false,
    icon: Compass,
    accentColor: {
      bgLight: 'hover:bg-sky-50/50',
      bgDark: 'dark:hover:bg-sky-950/20',
      borderLight: 'hover:border-sky-300',
      borderDark: 'dark:hover:border-sky-700',
      iconBgLight: 'bg-sky-100',
      iconBgDark: 'dark:bg-sky-900/60',
      iconColorLight: 'text-sky-700',
      iconColorDark: 'dark:text-sky-300',
      badgeBgLight: 'bg-sky-50',
      badgeBgDark: 'dark:bg-sky-950/60',
      badgeTextLight: 'text-sky-700',
      badgeTextDark: 'dark:text-sky-300',
      ringColor: 'focus:ring-sky-500/20'
    },
    tags: ['6-Layer Epistemics', 'Design Wizard', 'R / Python / SPSS Code', 'Coherence Check'],
    primaryActionLabel: 'Design Methods'
  },
  {
    id: 'irb',
    simpleTitle: 'IRB & Ethics Protocol Triage',
    subTitle: 'Common Rule Exemption & Consent Drafter',
    categoryLabel: 'Ethics & Compliance',
    stageId: 'design',
    stageNumber: '2',
    stageName: 'Design & Data',
    description: 'Determine Institutional Review Board (IRB) exemption eligibility, stratify human subject risk levels, and generate publication-ready informed consent and ethics declarations.',
    popular: false,
    icon: ShieldAlert,
    accentColor: {
      bgLight: 'hover:bg-emerald-50/50',
      bgDark: 'dark:hover:bg-emerald-950/20',
      borderLight: 'hover:border-emerald-300',
      borderDark: 'dark:hover:border-emerald-700',
      iconBgLight: 'bg-emerald-100',
      iconBgDark: 'dark:bg-emerald-900/60',
      iconColorLight: 'text-emerald-700',
      iconColorDark: 'dark:text-emerald-300',
      badgeBgLight: 'bg-emerald-50',
      badgeBgDark: 'dark:bg-emerald-950/60',
      badgeTextLight: 'text-emerald-700',
      badgeTextDark: 'dark:text-emerald-300',
      ringColor: 'focus:ring-emerald-500/20'
    },
    tags: ['Common Rule Tree', 'Risk Stratification', 'Informed Consent', 'Ethics Clause'],
    primaryActionLabel: 'Triage Ethics'
  },
  {
    id: 'pico',
    simpleTitle: 'PICO Search Strategy',
    subTitle: 'PRISMA-Compliant Query Formulator',
    categoryLabel: 'Search Strategy',
    stageId: 'discover',
    stageNumber: '1',
    stageName: 'Discover',
    description: 'Formulate structured Population, Intervention, Comparison, and Outcome search strategies with boolean syntax optimized for PubMed, Scopus, Web of Science, and IEEE.',
    popular: false,
    icon: SlidersHorizontal,
    accentColor: {
      bgLight: 'hover:bg-cyan-50/50',
      bgDark: 'dark:hover:bg-cyan-950/20',
      borderLight: 'hover:border-cyan-300',
      borderDark: 'dark:hover:border-cyan-700',
      iconBgLight: 'bg-cyan-100',
      iconBgDark: 'dark:bg-cyan-900/60',
      iconColorLight: 'text-cyan-700',
      iconColorDark: 'dark:text-cyan-300',
      badgeBgLight: 'bg-cyan-50',
      badgeBgDark: 'dark:bg-cyan-950/60',
      badgeTextLight: 'text-cyan-700',
      badgeTextDark: 'dark:text-cyan-300',
      ringColor: 'focus:ring-cyan-500/20'
    },
    tags: ['PICO Framework', 'PRISMA Strategy', 'Multi-Database Boolean', 'MeSH Terms'],
    primaryActionLabel: 'Formulate PICO'
  },
  {
    id: 'anonymizer',
    simpleTitle: 'Double-Blind Anonymizer',
    subTitle: 'Self-Citation & Affiliation Redaction',
    categoryLabel: 'Blind Peer Review',
    stageId: 'publish',
    stageNumber: '4',
    stageName: 'Publish & Audit',
    description: 'Redact self-citations ("(Author, 2022)"), university affiliations, lab locations, and grant numbers for blind peer review, with one-click reversible de-anonymization.',
    popular: false,
    icon: Wrench,
    accentColor: {
      bgLight: 'hover:bg-slate-100/60',
      bgDark: 'dark:hover:bg-slate-800/40',
      borderLight: 'hover:border-slate-400',
      borderDark: 'dark:hover:border-slate-600',
      iconBgLight: 'bg-slate-200',
      iconBgDark: 'dark:bg-slate-800',
      iconColorLight: 'text-slate-800',
      iconColorDark: 'dark:text-slate-200',
      badgeBgLight: 'bg-slate-100',
      badgeBgDark: 'dark:bg-slate-800',
      badgeTextLight: 'text-slate-700',
      badgeTextDark: 'dark:text-slate-300',
      ringColor: 'focus:ring-slate-500/20'
    },
    tags: ['Regex Anonymizer', 'Self-Citation Stripper', 'Affiliation Mask', 'Blind Review'],
    primaryActionLabel: 'Anonymize Paper'
  },
  {
    id: 'writing',
    simpleTitle: 'Academic Writing Utilities',
    subTitle: 'Title Polisher, Word Budget & BibTeX Cleaner',
    categoryLabel: 'Writing Utilities',
    stageId: 'draft',
    stageNumber: '3',
    stageName: 'Draft & Ground',
    description: 'Generate 4 peer-review title styles and strict 50-character running heads, monitor journal word/character limits in real time, and standardize messy BibTeX keys.',
    popular: false,
    icon: Sparkles,
    accentColor: {
      bgLight: 'hover:bg-yellow-50/50',
      bgDark: 'dark:hover:bg-yellow-950/20',
      borderLight: 'hover:border-yellow-300',
      borderDark: 'dark:hover:border-yellow-700',
      iconBgLight: 'bg-yellow-100',
      iconBgDark: 'dark:bg-yellow-900/60',
      iconColorLight: 'text-yellow-800',
      iconColorDark: 'dark:text-yellow-300',
      badgeBgLight: 'bg-yellow-50',
      badgeBgDark: 'dark:bg-yellow-950/60',
      badgeTextLight: 'text-yellow-800',
      badgeTextDark: 'dark:text-yellow-300',
      ringColor: 'focus:ring-yellow-500/20'
    },
    tags: ['Title Polisher', '50-Char Running Head', 'Word Budget', 'BibTeX Cleaner'],
    primaryActionLabel: 'Open Utilities'
  }
];

type CategoryFilter = 'all' | 'popular' | 'discover' | 'design' | 'draft' | 'publish';

interface ScholarHubViewProps {
  onSelectPillar: (pillar: AcademicPillar) => void;
  onLoadSample?: () => void;
  onOpenSpotlight?: () => void;
  onOpenToolbelt?: () => void;
  onOpenSettings?: () => void;
}

export const ScholarHubView: React.FC<ScholarHubViewProps> = ({
  onSelectPillar,
  onLoadSample,
  onOpenSpotlight,
  onOpenToolbelt
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all');
  const [viewMode, setViewMode] = useState<'tiles' | 'comprehensive'>('tiles');
  const [quickDoi, setQuickDoi] = useState('');
  const [doiCopied, setDoiCopied] = useState(false);

  // Filter tiles based on search query and category
  const filteredTiles = useMemo(() => {
    return UTILITY_TILES.filter((tile) => {
      // Category filter
      if (selectedCategory === 'popular' && !tile.popular) return false;
      if (selectedCategory === 'discover' && tile.stageId !== 'discover') return false;
      if (selectedCategory === 'design' && tile.stageId !== 'design') return false;
      if (selectedCategory === 'draft' && tile.stageId !== 'draft') return false;
      if (selectedCategory === 'publish' && tile.stageId !== 'publish') return false;

      // Search query filter
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        tile.simpleTitle.toLowerCase().includes(q) ||
        tile.subTitle.toLowerCase().includes(q) ||
        tile.description.toLowerCase().includes(q) ||
        tile.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [searchQuery, selectedCategory]);

  const handleTileClick = (pillar: AcademicPillar) => {
    onSelectPillar(pillar);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleQuickDoiSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickDoi.trim()) return;
    // Save to clipboard for easy pasting into verifier, then navigate to verify
    navigator.clipboard.writeText(quickDoi.trim());
    setDoiCopied(true);
    setTimeout(() => {
      onSelectPillar('verify');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 400);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200 pb-12">
      
      {/* HERO SECTION */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-900 via-indigo-950 to-slate-950 text-white p-6 sm:p-8 lg:p-10 shadow-xl border border-blue-800/40">
        
        {/* Subtle decorative background glow */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-20 w-80 h-80 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-4xl space-y-4">
          
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-800/60 text-blue-200 border border-blue-700/60 text-xs font-semibold tracking-wide uppercase font-mono">
              <Library className="w-3.5 h-3.5 text-blue-300" />
              Unified Research Suite
            </span>
            <span className="text-xs text-blue-300 font-serif hidden sm:inline">•</span>
            <span className="text-xs text-blue-200 font-sans hidden sm:inline">
              By Professor Babu George
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-bold font-serif tracking-tight leading-tight text-white">
            What would you like to research today?
          </h1>

          <p className="text-sm sm:text-base text-blue-100/90 font-sans leading-relaxed max-w-2xl">
            Choose any specialized research utility below for quick focused work, or explore the comprehensive 4-stage academic lifecycle.
          </p>

          {/* Quick Search & Filter Controls */}
          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search utilities (e.g., audit references, synthetic data, reviewers, ANOVA, PICO)..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 focus:bg-white/20 text-white placeholder-blue-200/60 border border-white/15 focus:border-blue-400 text-xs sm:text-sm outline-none transition"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-blue-200 hover:text-white"
                >
                  Clear
                </button>
              )}
            </div>

            {/* View Mode Toggle: Simple Tiles vs Comprehensive Lifecycle View */}
            <div className="flex items-center rounded-xl bg-black/30 p-1 border border-white/15 shrink-0 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setViewMode('tiles')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  viewMode === 'tiles'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-blue-200 hover:text-white'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Utility Tiles</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('comprehensive')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  viewMode === 'comprehensive'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-blue-200 hover:text-white'
                }`}
                title="View the comprehensive 4-stage research lifecycle roadmap"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Comprehensive View</span>
              </button>
            </div>

          </div>

          {/* Quick Action Badges */}
          <div className="pt-1 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-blue-300 font-semibold text-[11px] uppercase tracking-wider mr-1">
              Quick launch:
            </span>
            {onLoadSample && (
              <button
                type="button"
                onClick={onLoadSample}
                className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-blue-100 hover:text-white border border-white/15 transition flex items-center gap-1 cursor-pointer"
                title="Load full exemplar study in Studio with pre-grounded citations"
              >
                <FileText className="w-3 h-3 text-amber-300" />
                <span>Load Exemplar Manuscript</span>
              </button>
            )}
            {onOpenSpotlight && (
              <button
                type="button"
                onClick={onOpenSpotlight}
                className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-blue-100 hover:text-white border border-white/15 transition flex items-center gap-1 cursor-pointer"
                title="Open Spotlight Command Palette (Ctrl+K)"
              >
                <Zap className="w-3 h-3 text-cyan-300" />
                <span>Spotlight Palette <kbd className="text-[10px] font-mono opacity-70">Ctrl+K</kbd></span>
              </button>
            )}
            {onOpenToolbelt && (
              <button
                type="button"
                onClick={onOpenToolbelt}
                className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-blue-100 hover:text-white border border-white/15 transition flex items-center gap-1 cursor-pointer"
                title="Quick Academic Toolbelt Modal"
              >
                <Wrench className="w-3 h-3 text-purple-300" />
                <span>Quick Toolbelt</span>
              </button>
            )}
          </div>

        </div>
      </section>

      {/* VIEW MODE 1: UTILITY TILES GRID */}
      {viewMode === 'tiles' && (
        <div className="space-y-6">
          
          {/* Category Filter Pills */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 text-xs">
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1.5 rounded-xl font-semibold transition cursor-pointer shrink-0 ${
                  selectedCategory === 'all'
                    ? 'bg-blue-900 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                All Utilities ({UTILITY_TILES.length})
              </button>
              <button
                type="button"
                onClick={() => setSelectedCategory('popular')}
                className={`px-3 py-1.5 rounded-xl font-semibold transition cursor-pointer flex items-center gap-1 shrink-0 ${
                  selectedCategory === 'popular'
                    ? 'bg-blue-900 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Zap className="w-3 h-3 text-amber-500" />
                <span>Most Popular</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedCategory('discover')}
                className={`px-3 py-1.5 rounded-xl font-semibold transition cursor-pointer shrink-0 ${
                  selectedCategory === 'discover'
                    ? 'bg-blue-900 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                Literature &amp; Search
              </button>
              <button
                type="button"
                onClick={() => setSelectedCategory('design')}
                className={`px-3 py-1.5 rounded-xl font-semibold transition cursor-pointer shrink-0 ${
                  selectedCategory === 'design'
                    ? 'bg-blue-900 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                Methods, Data &amp; Ethics
              </button>
              <button
                type="button"
                onClick={() => setSelectedCategory('draft')}
                className={`px-3 py-1.5 rounded-xl font-semibold transition cursor-pointer shrink-0 ${
                  selectedCategory === 'draft'
                    ? 'bg-blue-900 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                Drafting &amp; Writing
              </button>
              <button
                type="button"
                onClick={() => setSelectedCategory('publish')}
                className={`px-3 py-1.5 rounded-xl font-semibold transition cursor-pointer shrink-0 ${
                  selectedCategory === 'publish'
                    ? 'bg-blue-900 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                Publishing &amp; Audits
              </button>
            </div>

            {/* Quick status count */}
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Showing <strong>{filteredTiles.length}</strong> of {UTILITY_TILES.length} utilities
            </div>
          </div>

          {/* TILES GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredTiles.map((tile) => {
              const IconComp = tile.icon;
              return (
                <div
                  key={tile.id}
                  onClick={() => handleTileClick(tile.id)}
                  className={`group relative flex flex-col justify-between p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg cursor-pointer ${tile.accentColor.bgLight} ${tile.accentColor.bgDark} ${tile.accentColor.borderLight} ${tile.accentColor.borderDark}`}
                >
                  <div className="space-y-3.5">
                    
                    {/* Top Row: Functional Domain Badge & Popular Badge */}
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-[10px] font-semibold tracking-wide px-2.5 py-0.5 rounded-full ${tile.accentColor.badgeBgLight} ${tile.accentColor.badgeBgDark} ${tile.accentColor.badgeTextLight} ${tile.accentColor.badgeTextDark}`}>
                        {tile.categoryLabel}
                      </span>
                      {tile.popular && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex items-center gap-1">
                          <Zap className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />
                          Popular
                        </span>
                      )}
                    </div>

                    {/* Icon & Title */}
                    <div className="flex items-start gap-3.5">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${tile.accentColor.iconBgLight} ${tile.accentColor.iconBgDark} ${tile.accentColor.iconColorLight} ${tile.accentColor.iconColorDark} shadow-2xs group-hover:scale-105 transition-transform duration-200`}>
                        <IconComp className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-bold text-slate-900 dark:text-white font-serif group-hover:text-blue-900 dark:group-hover:text-blue-300 transition-colors">
                          {tile.simpleTitle}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-sans truncate">
                          {tile.subTitle}
                        </p>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed">
                      {tile.description}
                    </p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {tile.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 font-sans"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                  </div>

                  {/* Card Footer: Action Button */}
                  <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                    <span className="font-semibold text-blue-900 dark:text-blue-400 group-hover:underline flex items-center gap-1">
                      <span>{tile.primaryActionLabel}</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </span>
                    <span className="text-[11px] text-slate-400 dark:text-slate-500">
                      Open &rarr;
                    </span>
                  </div>

                </div>
              );
            })}
          </div>

          {/* Quick DOI Audit Bar */}
          <div className="mt-8 p-5 rounded-2xl bg-gradient-to-r from-emerald-50/80 via-teal-50/40 to-slate-50 dark:from-emerald-950/30 dark:via-teal-950/20 dark:to-slate-900 border border-emerald-200 dark:border-emerald-800/60 shadow-xs">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white font-serif">
                    Quick Reference &amp; DOI Health Audit
                  </h4>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Have a single DOI you want to quickly check? Paste it here to verify with Crossref &amp; Retraction Watch:
                </p>
              </div>

              <form onSubmit={handleQuickDoiSubmit} className="flex items-center gap-2 w-full md:w-auto">
                <input
                  type="text"
                  value={quickDoi}
                  onChange={(e) => setQuickDoi(e.target.value)}
                  placeholder="e.g., 10.1038/s41586-020-2649-2"
                  className="px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs w-full sm:w-72 outline-none focus:border-emerald-500 dark:text-white font-mono"
                />
                <button
                  type="submit"
                  disabled={!quickDoi.trim()}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs"
                >
                  {doiCopied ? <Check className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                  <span>{doiCopied ? 'Auditing...' : 'Audit DOI'}</span>
                </button>
              </form>
            </div>
          </div>

        </div>
      )}

      {/* VIEW MODE 2: COMPREHENSIVE 4-STAGE LIFECYCLE ROADMAP */}
      {viewMode === 'comprehensive' && (
        <div className="space-y-6">
          
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
            <h2 className="text-base font-bold text-slate-900 dark:text-white font-serif">
              Comprehensive 4-Stage Research Lifecycle Architecture
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              ScholarForge is designed around the authentic scholarly journey. Follow this linear pipeline from initial query discovery to empirical simulation, grounded manuscript drafting, and pre-submission audit.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            
            {/* STAGE 1: DISCOVER */}
            <div className="flex flex-col justify-between p-5 rounded-2xl bg-white dark:bg-slate-900 border-2 border-blue-500/40 shadow-xs space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="w-7 h-7 rounded-lg bg-blue-900 text-white font-mono font-bold text-xs flex items-center justify-center">
                    1
                  </span>
                  <span className="text-[11px] font-mono font-bold text-blue-600 dark:text-blue-400 uppercase">
                    Stage 1: Discover
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white font-serif">
                  Literature &amp; Search Strategy
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Formulate PRISMA-compliant PICO queries and run federated extractions across 5 registries with real-time deduplication.
                </p>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Included Utilities:
                  </div>
                  <button
                    type="button"
                    onClick={() => handleTileClick('literature')}
                    className="w-full text-left p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-xs font-semibold flex items-center justify-between group transition cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                      <Search className="w-3.5 h-3.5 text-blue-600" />
                      <span>Federated Literature Search</span>
                    </span>
                    <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-blue-600" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTileClick('pico')}
                    className="w-full text-left p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-xs font-semibold flex items-center justify-between group transition cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                      <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-600" />
                      <span>PICO Search Strategy</span>
                    </span>
                    <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-blue-600" />
                  </button>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => handleTileClick('literature')}
                  className="w-full py-2 rounded-xl bg-blue-900 hover:bg-blue-950 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <span>Enter Stage 1</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* STAGE 2: DESIGN & DATA */}
            <div className="flex flex-col justify-between p-5 rounded-2xl bg-white dark:bg-slate-900 border-2 border-indigo-500/40 shadow-xs space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="w-7 h-7 rounded-lg bg-indigo-900 text-white font-mono font-bold text-xs flex items-center justify-center">
                    2
                  </span>
                  <span className="text-[11px] font-mono font-bold text-indigo-600 dark:text-indigo-400 uppercase">
                    Stage 2: Design &amp; Data
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white font-serif">
                  Methods, Simulation &amp; Ethics
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Align epistemic research layers, simulate empirical datasets (R/Python/SPSS), and triage Common Rule IRB ethics protocols.
                </p>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Included Utilities:
                  </div>
                  <button
                    type="button"
                    onClick={() => handleTileClick('synthetic')}
                    className="w-full text-left p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-xs font-semibold flex items-center justify-between group transition cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                      <Database className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Synthetic Data Generator</span>
                    </span>
                    <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-indigo-600" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTileClick('methodology')}
                    className="w-full text-left p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-xs font-semibold flex items-center justify-between group transition cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                      <Compass className="w-3.5 h-3.5 text-sky-600" />
                      <span>Methodology Compass</span>
                    </span>
                    <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-indigo-600" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTileClick('irb')}
                    className="w-full text-left p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-xs font-semibold flex items-center justify-between group transition cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                      <ShieldAlert className="w-3.5 h-3.5 text-emerald-600" />
                      <span>IRB Ethics Protocol Triage</span>
                    </span>
                    <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-indigo-600" />
                  </button>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => handleTileClick('methodology')}
                  className="w-full py-2 rounded-xl bg-indigo-900 hover:bg-indigo-950 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <span>Enter Stage 2</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* STAGE 3: DRAFT & GROUND */}
            <div className="flex flex-col justify-between p-5 rounded-2xl bg-white dark:bg-slate-900 border-2 border-amber-500/40 shadow-xs space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="w-7 h-7 rounded-lg bg-amber-900 text-white font-mono font-bold text-xs flex items-center justify-center">
                    3
                  </span>
                  <span className="text-[11px] font-mono font-bold text-amber-600 dark:text-amber-400 uppercase">
                    Stage 3: Draft &amp; Ground
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white font-serif">
                  Manuscript, Claims &amp; Writing
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Write inside a split-screen canvas with live citations, extract and ground empirical claims, and handle peer review R&amp;R revisions.
                </p>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Included Utilities:
                  </div>
                  <button
                    type="button"
                    onClick={() => handleTileClick('studio')}
                    className="w-full text-left p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-xs font-semibold flex items-center justify-between group transition cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                      <BookOpen className="w-3.5 h-3.5 text-amber-600" />
                      <span>Manuscript Studio &amp; AI Drafter</span>
                    </span>
                    <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-amber-600" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTileClick('claims')}
                    className="w-full text-left p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-xs font-semibold flex items-center justify-between group transition cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                      <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                      <span>Claims &amp; Evidence Workbench</span>
                    </span>
                    <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-amber-600" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTileClick('writing')}
                    className="w-full text-left p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-xs font-semibold flex items-center justify-between group transition cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                      <Sparkles className="w-3.5 h-3.5 text-yellow-600" />
                      <span>Academic Writing Utilities</span>
                    </span>
                    <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-amber-600" />
                  </button>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => handleTileClick('studio')}
                  className="w-full py-2 rounded-xl bg-amber-900 hover:bg-amber-950 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <span>Enter Stage 3</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* STAGE 4: AUDIT & PUBLISH */}
            <div className="flex flex-col justify-between p-5 rounded-2xl bg-white dark:bg-slate-900 border-2 border-emerald-500/40 shadow-xs space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="w-7 h-7 rounded-lg bg-emerald-900 text-white font-mono font-bold text-xs flex items-center justify-center">
                    4
                  </span>
                  <span className="text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400 uppercase">
                    Stage 4: Audit &amp; Publish
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white font-serif">
                  Fact-Check, Journals &amp; Reviewers
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Pre-submission bibliography verification, desk-rejection pre-flight audit, reviewer matching, and double-blind anonymization.
                </p>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Included Utilities:
                  </div>
                  <button
                    type="button"
                    onClick={() => handleTileClick('verify')}
                    className="w-full text-left p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-xs font-semibold flex items-center justify-between group transition cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Reference &amp; DOI Audits</span>
                    </span>
                    <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-emerald-600" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTileClick('journal')}
                    className="w-full text-left p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-xs font-semibold flex items-center justify-between group transition cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                      <FileCheck className="w-3.5 h-3.5 text-purple-600" />
                      <span>Journal Fit &amp; Pre-Flight</span>
                    </span>
                    <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-emerald-600" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTileClick('scholars')}
                    className="w-full text-left p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-xs font-semibold flex items-center justify-between group transition cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                      <Users className="w-3.5 h-3.5 text-rose-600" />
                      <span>Scholar &amp; Reviewer Finder</span>
                    </span>
                    <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-emerald-600" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTileClick('anonymizer')}
                    className="w-full text-left p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-xs font-semibold flex items-center justify-between group transition cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                      <Wrench className="w-3.5 h-3.5 text-slate-600" />
                      <span>Double-Blind Anonymizer</span>
                    </span>
                    <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-emerald-600" />
                  </button>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => handleTileClick('verify')}
                  className="w-full py-2 rounded-xl bg-emerald-900 hover:bg-emerald-950 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <span>Enter Stage 4</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
};
