import React, { useState, useMemo, useRef } from 'react';
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
  FileText,
  Zap,
  UploadCloud,
  RefreshCw
} from 'lucide-react';
import type { AcademicPillar, ResearchStage } from './Navbar';
import { extractTextFromManuscriptFile } from '../services/fileImportService';
import { RESEARCH_START_OPTIONS, prepareResearchStart, type ResearchStartMode, type ResearchStartRequest } from '../services/researchStartService';

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

const CORE_UTILITY_TILES: UtilityTileDef[] = [
  // --- STAGE 1: DISCOVER ---
  {
    id: 'literature',
    simpleTitle: 'Literature Search',
    subTitle: 'Federated Multi-Registry Search',
    categoryLabel: 'Literature & Discovery',
    stageId: 'discover',
    stageNumber: '1',
    stageName: 'Discover',
    description: 'Search OpenAlex, Crossref, Europe PMC, PubMed, and DataCite. Import Zotero or Publish or Perish records, merge duplicates, and inspect source availability.',
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
    tags: ['Multiple Sources', 'Zotero / RIS Import', 'Source Status', 'Deduplication'],
    primaryActionLabel: 'Search Literature'
  },
  {
    id: 'pico',
    simpleTitle: 'PICO Search Strategy',
    subTitle: 'Structured Search Query Formulator',
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

  // --- STAGE 2: DESIGN & DATA ---
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
    id: 'irb',
    simpleTitle: 'IRB & Ethics Protocol Triage',
    subTitle: 'Common Rule Exemption & Consent Drafter',
    categoryLabel: 'Ethics & Compliance',
    stageId: 'design',
    stageNumber: '2',
    stageName: 'Design & Data',
    description: 'Prepare questions for Institutional Review Board (IRB) assessment, stratify human subject risk levels, and generate publication-ready informed consent and ethics declarations.',
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

  // --- STAGE 3: DRAFT & GROUND ---
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
  },

  // --- STAGE 4: AUDIT & PUBLISH ---
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
    id: 'journal',
    simpleTitle: 'Journal Matchmaker & Pre-Flight',
    subTitle: 'Journal Discovery & Submission Checks',
    categoryLabel: 'Journal Pre-Flight',
    stageId: 'publish',
    stageNumber: '4',
    stageName: 'Publish & Audit',
    description: 'Discover candidate journals using open metadata; verify policies and unavailable metrics at the publisher. Run pre-flight audits on word counts, citation recency, and ethics.',
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
    tags: ['Open Metadata Discovery', 'Desk-Rejection Audit', 'Diamond OA / APC', 'Word Limits'],
    primaryActionLabel: 'Match Journals'
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
  }
];

export const UTILITY_TILES: UtilityTileDef[] = ([...CORE_UTILITY_TILES,
  { ...CORE_UTILITY_TILES[0], id: 'funding', simpleTitle: 'Funding Opportunity Finder', subTitle: 'From research idea to funding shortlist', categoryLabel: 'Funding & Opportunities', description: 'Search Grants.gov, EU funding topics, and the UKRI recent feed. Review applicant requirements, dates, and amounts; retain opportunities and fit notes with your project.', tags: ['Grants', 'Applicant eligibility', 'International funding', 'Proposal'], icon: Search, popular: true, primaryActionLabel: 'Find funding opportunities' },
  { ...CORE_UTILITY_TILES[0], id: 'concept', simpleTitle: 'Concept & Theory Studio', subTitle: 'From puzzle to research pathway', categoryLabel: 'Conceptualization & Theory', description: 'Clarify a puzzling situation, compare framings, examine evidence for a gap, build a conceptual model and compare study pathways.', tags: ['Theory building', 'Research gaps', 'Conceptual framework', 'Proposal'], icon: Compass, popular: true, primaryActionLabel: 'Develop a research idea' },
  { ...CORE_UTILITY_TILES[0], id: 'counterevidence', simpleTitle: 'Null Findings & Counterevidence', subTitle: 'Challenge an idea', description: 'Search across sources for null findings, replications and contrary evidence. Record comparable outcomes, source quotations and your interpretation.', tags: ['Null results', 'Replication', 'Evidence review'], popular: false, primaryActionLabel: 'Examine a proposition' },
  { ...CORE_UTILITY_TILES[2], id: 'instruments', simpleTitle: 'Measurement & Instrument Finder', subTitle: 'Measure with a clear basis', stageId: 'design', stageNumber: '2', stageName: 'Design & Data', categoryLabel: 'Measurement & Methods', description: 'Find candidate scales and protocols. Compare population fit, validation evidence, scoring, burden and permissions.', tags: ['Scales', 'Validation', 'Permissions'], icon: Compass, popular: false, primaryActionLabel: 'Find a measure' },
  { ...CORE_UTILITY_TILES[5], id: 'applications', simpleTitle: 'Research Applications Studio', subTitle: 'Findings into practice', stageId: 'draft', stageNumber: '3', stageName: 'Draft & Ground', categoryLabel: 'Research into Practice', description: 'Connect findings to stakeholders, proposed actions, boundary conditions, risks and a pilot evaluation plan.', tags: ['Practical implications', 'Translation', 'Pilot plan'], icon: BookOpen, popular: false, primaryActionLabel: 'Develop applications' },
] satisfies UtilityTileDef[]).sort((a,b) => Number(a.stageNumber) - Number(b.stageNumber));


type CategoryFilter = 'all' | 'popular' | 'discover' | 'design' | 'draft' | 'publish';

interface ScholarHubViewProps {
  onSelectPillar: (pillar: AcademicPillar) => void;
  onOpenSpotlight?: () => void;
  onOpenToolbelt?: () => void;
  onOpenSettings?: () => void;
  onOpenCart?: () => void;
  onOpenBinder?: () => void;
  onStartResearch: (request: ResearchStartRequest) => void;
  currentManuscriptWordCount?: number;
  groundedClaimsCount?: number;
  totalClaimsCount?: number;
  uniquePapersCount?: number;
}

export const ScholarHubView: React.FC<ScholarHubViewProps> = ({
  onSelectPillar,
  onStartResearch,
  onOpenSettings,
  currentManuscriptWordCount = 0,
}) => {
  const [mode, setMode] = useState<ResearchStartMode>('topic');
  const [inputs, setInputs] = useState<Record<ResearchStartMode, { text: string; filename?: string }>>({ concept: { text: '' }, topic: { text: '' }, manuscript: { text: '' }, references: { text: '' } });
  const [toolSearch, setToolSearch] = useState('');
  const [fileError, setFileError] = useState('');
  const input = inputs[mode];
  const option = RESEARCH_START_OPTIONS[mode];
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all');
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleProcessFile = async (file: File) => {
    setFileError('');
    setIsProcessingFile(true);
    try {
      const { text, filename } = await extractTextFromManuscriptFile(file);
      if (!text.trim()) throw new Error('This document has no readable text. Paste the text or choose another document.');
      setInputs(previous => ({ ...previous, [mode]: { text, filename } }));
    } catch (error) {
      setFileError(error instanceof Error ? error.message : 'Could not read this document. Try a DOCX or text file.');
    } finally {
      setIsProcessingFile(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await handleProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await handleProcessFile(e.target.files[0]);
    }
  };

  const handleContinue = (event: React.FormEvent) => {
    event.preventDefault();
    if (isProcessingFile || !input.text.trim()) return;
    onStartResearch(prepareResearchStart(mode, input.text, input.filename));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleTileClick = (pillar: AcademicPillar) => {
    onSelectPillar(pillar);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const filteredTiles = useMemo(() => {
    return UTILITY_TILES.filter((tile) => {
      if (selectedCategory === 'popular' && !tile.popular) return false;
      if (selectedCategory === 'discover' && tile.stageId !== 'discover') return false;
      if (selectedCategory === 'design' && tile.stageId !== 'design') return false;
      if (selectedCategory === 'draft' && tile.stageId !== 'draft') return false;
      if (selectedCategory === 'publish' && tile.stageId !== 'publish') return false;

      if (toolSearch.trim()) {
        const query = toolSearch.trim().toLowerCase();
        return [tile.simpleTitle, tile.subTitle, tile.description, ...tile.tags]
          .some(value => value.toLowerCase().includes(query));
      }
      return true;
    });
  }, [toolSearch, selectedCategory]);

  return (
    <div className="sf-hub space-y-8 animate-in fade-in duration-200 pb-6">
      
      <section className="sf-research-start rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-8" aria-labelledby="research-start-title">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-800 dark:text-blue-300">Start here</p>
            <h1 id="research-start-title" className="text-2xl sm:text-4xl font-semibold text-slate-900 dark:text-white">What would you like to do?</h1>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300">Choose a task, add your material, then continue to the right tool.</p>
          </div>

          <fieldset disabled={isProcessingFile} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <legend className="sr-only">Choose your starting task</legend>
            {(Object.keys(RESEARCH_START_OPTIONS) as ResearchStartMode[]).map((id) => {
              const task = RESEARCH_START_OPTIONS[id];
              return (
                <label key={id} className={`sf-start-choice flex items-start gap-3 rounded-xl border p-4 cursor-pointer ${mode === id ? 'border-blue-700 bg-blue-50 dark:border-blue-400 dark:bg-blue-950/40' : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                  <input type="radio" name="research-start-mode" value={id} checked={mode === id} onChange={() => { setMode(id); setFileError(''); }} className="mt-1 shrink-0 accent-blue-800" />
                  <span><span className="block text-sm font-semibold text-slate-900 dark:text-white">{task.label}</span><span className="block mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-400">{task.description}</span></span>
                </label>
              );
            })}
          </fieldset>

          <form onSubmit={handleContinue} className="space-y-4">
            <div onDragOver={(event) => { event.preventDefault(); if (mode !== 'topic' && !isProcessingFile) setIsDragOver(true); }} onDragLeave={() => setIsDragOver(false)} onDrop={(event) => { if (mode === 'topic' || isProcessingFile) { event.preventDefault(); return; } void handleDrop(event); }} className={`rounded-xl border p-4 sm:p-5 ${isDragOver ? 'border-blue-500 ring-2 ring-blue-200' : 'border-slate-200 dark:border-slate-700'}`}>
              <label htmlFor="research-start-input" className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">{option.inputLabel}</label>
              <textarea id="research-start-input" value={input.text} disabled={isProcessingFile} onChange={(event) => { setInputs(previous => ({ ...previous, [mode]: { text: event.target.value } })); setFileError(''); }} placeholder={option.placeholder} rows={mode === 'topic' ? 3 : 6} aria-describedby="research-start-next" className="w-full resize-y rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-950 p-3 text-sm leading-relaxed text-slate-900 dark:text-white" />
              <div className="flex flex-wrap items-center gap-3 mt-3">
                {mode !== 'topic' && <>
                  <input type="file" ref={fileInputRef} accept=".pdf,.docx,.txt,.md,.tex" className="hidden" onChange={(event) => { void handleFileChange(event); event.target.value = ''; }} />
                  <button type="button" disabled={isProcessingFile} onClick={() => fileInputRef.current?.click()} className="btn-academic-secondary px-3 py-2 inline-flex items-center gap-2 cursor-pointer disabled:opacity-50">{isProcessingFile ? <RefreshCw className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}{isProcessingFile ? 'Reading document…' : 'Choose document'}</button>
                  <span className="text-xs text-slate-500 dark:text-slate-400">or drop a PDF, DOCX, TXT, MD, or TEX file here</span>
                </>}
                {input.text && <button type="button" disabled={isProcessingFile} onClick={() => { setInputs(previous => ({ ...previous, [mode]: { text: '' } })); setFileError(''); }} className="text-xs font-semibold text-slate-600 dark:text-slate-300 underline cursor-pointer">Clear {mode === 'topic' ? 'topic' : mode === 'manuscript' ? 'draft' : 'references'}</button>}
              </div>
              {input.filename && <p role="status" className="mt-3 text-xs text-slate-600 dark:text-slate-300 flex items-center gap-2"><FileText className="w-4 h-4 shrink-0" />Ready to use: {input.filename}. Continue below to open it.</p>}
              {fileError && <p role="alert" className="mt-3 text-sm text-red-700 dark:text-red-300">{fileError}</p>}
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div id="research-start-next" className="max-w-xl text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                <p>{option.next}</p>
                {mode !== 'manuscript' && currentManuscriptWordCount > 0 && <p className="mt-1">Your current manuscript stays unchanged.</p>}
                {mode === 'manuscript' && currentManuscriptWordCount > 0 && <p className="mt-1 font-semibold text-amber-800 dark:text-amber-300">Continuing selects this draft as the current manuscript. The previous draft ({currentManuscriptWordCount.toLocaleString()} words) remains in saved versions.</p>}
              </div>
              <button type="submit" disabled={!input.text.trim() || isProcessingFile} className="btn-academic-primary px-4 py-3 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed sm:max-w-72">{option.action}<ArrowRight className="w-4 h-4" /></button>
            </div>
          </form>
        </div>
      </section>

      {/* 2. THE 15 INDIVIDUAL UTILITY TILES GRID */}
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Functional Domain Category Filter Buttons */}
          <div className="space-y-3">
            <div><h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Browse all tools</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Know what you need? Open any tool directly.</p><p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Every tool includes optional AI reviews. <button type="button" onClick={onOpenSettings} className="font-semibold text-blue-800 dark:text-blue-300 underline cursor-pointer">Configure your AI model</button> and invoke assistance when you choose.</p></div>
            <div className="max-w-md"><label htmlFor="tool-search" className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Find a tool</label><input id="tool-search" type="search" value={toolSearch} onChange={(event) => setToolSearch(event.target.value)} placeholder="Search tool names or capabilities" className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white" /></div>
            <div className="flex flex-wrap items-center gap-2 py-1 text-xs">
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

            <div className="text-xs text-slate-500 dark:text-slate-400">
              Showing <strong>{filteredTiles.length}</strong> of {UTILITY_TILES.length} utilities
            </div>
          </div>

          {filteredTiles.length === 0 && <div role="status" className="rounded-xl border border-slate-200 dark:border-slate-700 p-5 text-sm text-slate-600 dark:text-slate-300"><p>No tools match this search and category.</p><button type="button" onClick={() => { setToolSearch(''); setSelectedCategory('all'); }} className="mt-2 underline font-semibold cursor-pointer">Show all tools</button></div>}
          {/* TILES GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredTiles.map((tile) => {
              const IconComp = tile.icon;
              return (
                <button
                  type="button"
                  key={tile.id}
                  onClick={() => handleTileClick(tile.id)}
                  className={`sf-tool-card group relative flex w-full min-w-0 text-left flex-col justify-between p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md cursor-pointer ${tile.accentColor.bgLight} ${tile.accentColor.bgDark} ${tile.accentColor.borderLight} ${tile.accentColor.borderDark}`}
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
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-sans leading-relaxed">
                          {tile.subTitle}
                        </p>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
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

                  </div>

                </button>
              );
            })}
          </div>

        </div>
    </div>
  );
};
