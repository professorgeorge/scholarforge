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
  Library,
  FileText,
  Zap,
  UploadCloud,
  RefreshCw
} from 'lucide-react';
import type { AcademicPillar, ResearchStage } from './Navbar';
import { extractTextFromManuscriptFile } from '../services/fileImportService';

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

export interface IntentDetectionResult {
  type: 'doi' | 'bibliography' | 'manuscript' | 'statistical_model' | 'pico' | 'research_query';
  confidence: 'high' | 'medium';
  title: string;
  description: string;
  badgeLabel: string;
  badgeColor: string;
  targetPillar: AcademicPillar;
  primaryActionLabel: string;
  secondaryActions?: { label: string; pillar: AcademicPillar }[];
}

export function detectResearchIntent(rawText: string): IntentDetectionResult | null {
  const text = rawText.trim();
  if (!text) return null;

  // 1. Detect DOI or DOI URL
  const doiRegex = /(10\.\d{4,9}\/[-._;()/:A-Za-z0-9]+)/i;
  const doiMatch = text.match(doiRegex);
  if (doiMatch && text.length < 300) {
    return {
      type: 'doi',
      confidence: 'high',
      title: 'DOI Identifier Detected',
      description: `Target DOI: "${doiMatch[1]}". Verify publication health, DOI registration, and Retraction Watch alerts.`,
      badgeLabel: 'DOI Reference',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      targetPillar: 'verify',
      primaryActionLabel: 'Audit DOI & Check Retractions'
    };
  }

  // 2. Detect Bibliography / Reference List (multiple citations)
  const citationMarkers = (text.match(/(\(\d{4}\)|\[\d+\]|doi:|https?:\/\/doi\.org|et al\.)/gi) || []).length;
  const hasMultipleLines = text.split('\n').filter(l => l.trim().length > 15).length >= 2;
  if ((citationMarkers >= 2 && hasMultipleLines) || (text.toLowerCase().includes('references') && citationMarkers >= 1)) {
    return {
      type: 'bibliography',
      confidence: 'high',
      title: 'Bibliography / Reference List Detected',
      description: `Detected formatted citations (${citationMarkers}+ citation markers). Audit for broken DOIs, Retraction Watch flags, and AI hallucinations.`,
      badgeLabel: 'Reference List',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      targetPillar: 'verify',
      primaryActionLabel: 'Audit Entire Bibliography'
    };
  }

  // 3. Detect Full Manuscript / Draft Document
  const words = text.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const hasAcademicStructure = /abstract|introduction|methodology|participants|results|discussion|conclusion/i.test(text);

  if (wordCount >= 120 || (wordCount >= 60 && hasAcademicStructure)) {
    return {
      type: 'manuscript',
      confidence: 'high',
      title: `Draft Manuscript Detected (${wordCount} words)`,
      description: 'Your text looks like an academic draft or section. You can ground it with verified citations, extract empirical claims, audit journal fit, or anonymize it for blind review.',
      badgeLabel: 'Manuscript Draft',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      targetPillar: 'studio',
      primaryActionLabel: 'Ground & Draft in Studio',
      secondaryActions: [
        { label: 'Extract Claims', pillar: 'claims' },
        { label: 'Check Journal Fit', pillar: 'journal' },
        { label: 'Double-Blind Anonymize', pillar: 'anonymizer' }
      ]
    };
  }

  // 4. Detect Statistical / Empirical Hypothesis
  const statisticalTerms = /moderation|mediation|hayes|process model|likert|cronbach|anova|ancova|regression|factor loading|sem|sample size|cohen's d/i;
  if (statisticalTerms.test(text)) {
    return {
      type: 'statistical_model',
      confidence: 'high',
      title: 'Statistical / Empirical Design Detected',
      description: 'Detected moderation, mediation, Likert scale, or ANOVA modeling keywords. Simulate realistic Monte Carlo datasets or generate R/Python/SPSS code.',
      badgeLabel: 'Statistical Model',
      badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
      targetPillar: 'synthetic',
      primaryActionLabel: 'Generate Synthetic Dataset'
    };
  }

  // 5. Detect PICO or Systematic Review Boolean
  const picoTerms = /pico|prisma|mesh|systematic review|(and\s+.*\s+or)/i;
  if (picoTerms.test(text)) {
    return {
      type: 'pico',
      confidence: 'medium',
      title: 'Systematic Review / PICO Strategy Detected',
      description: 'Formulate PRISMA 2020-compliant queries across PubMed, Scopus, Web of Science, and IEEE.',
      badgeLabel: 'PICO Query',
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
      targetPillar: 'pico',
      primaryActionLabel: 'Formulate PICO Strategy'
    };
  }

  // 6. Default to Research Query / Literature Search
  return {
    type: 'research_query',
    confidence: 'medium',
    title: 'Research Topic / Query',
    description: `Execute federated multi-source search for "${text.slice(0, 70)}${text.length > 70 ? '...' : ''}" across OpenAlex, PubMed, Crossref, and arXiv.`,
    badgeLabel: 'Federated Search',
    badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
    targetPillar: 'literature',
    primaryActionLabel: 'Search Across 5 Registries'
  };
}

export type HubViewMode = 'hubs' | 'tiles' | 'comprehensive';
type CategoryFilter = 'all' | 'popular' | 'discover' | 'design' | 'draft' | 'publish';

interface ScholarHubViewProps {
  onSelectPillar: (pillar: AcademicPillar) => void;
  onOpenSpotlight?: () => void;
  onOpenToolbelt?: () => void;
  onOpenSettings?: () => void;
  onOpenCart?: () => void;
  onOpenBinder?: () => void;
  onInjectDraftText?: (text: string, destination: AcademicPillar, filename?: string) => void;
  currentManuscriptWordCount?: number;
  groundedClaimsCount?: number;
  totalClaimsCount?: number;
  uniquePapersCount?: number;
}

export const ScholarHubView: React.FC<ScholarHubViewProps> = ({
  onSelectPillar,
  onInjectDraftText,
}) => {
  const [omniboxInput, setOmniboxInput] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all');
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [importedFilename, setImportedFilename] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Real-time intent detection
  const detectedIntent = useMemo(() => {
    return detectResearchIntent(omniboxInput);
  }, [omniboxInput]);

  const handleProcessFile = async (file: File) => {
    try {
      setIsProcessingFile(true);
      const { text, filename } = await extractTextFromManuscriptFile(file);
      setOmniboxInput(text);
      setImportedFilename(filename);
      setIsProcessingFile(false);
      if (onInjectDraftText) {
        onInjectDraftText(text, 'hub', filename);
      }
    } catch (err) {
      console.error('Failed to import file', err);
      setIsProcessingFile(false);
      alert('Could not read file. Please ensure it is a valid .docx, .txt, or .md file.');
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

  // Execute detected intent
  const handleExecuteIntent = (targetPillar: AcademicPillar) => {
    if (onInjectDraftText && omniboxInput.trim()) {
      onInjectDraftText(omniboxInput.trim(), targetPillar, importedFilename || undefined);
    } else {
      onSelectPillar(targetPillar);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleTileClick = (pillar: AcademicPillar) => {
    if (onInjectDraftText && omniboxInput.trim()) {
      onInjectDraftText(omniboxInput.trim(), pillar, importedFilename || undefined);
    } else {
      onSelectPillar(pillar);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Filter tiles based on search query in omnibox (if in tiles view) or category
  const filteredTiles = useMemo(() => {
    return UTILITY_TILES.filter((tile) => {
      if (selectedCategory === 'popular' && !tile.popular) return false;
      if (selectedCategory === 'discover' && tile.stageId !== 'discover') return false;
      if (selectedCategory === 'design' && tile.stageId !== 'design') return false;
      if (selectedCategory === 'draft' && tile.stageId !== 'draft') return false;
      if (selectedCategory === 'publish' && tile.stageId !== 'publish') return false;

      // Filter by omnibox search only if user is actively searching
      if (omniboxInput.trim() && omniboxInput.length < 50 && !omniboxInput.includes('\n')) {
        const q = omniboxInput.toLowerCase();
        return (
          tile.simpleTitle.toLowerCase().includes(q) ||
          tile.subTitle.toLowerCase().includes(q) ||
          tile.description.toLowerCase().includes(q) ||
          tile.tags.some((t) => t.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [omniboxInput, selectedCategory]);

  return (
    <div className="space-y-8 animate-in fade-in duration-200 pb-16">
      
      {/* 1. GOOGLE-GRADE UNIFIED OMNIBOX & HERO SECTION */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 text-white p-6 sm:p-8 lg:p-10 shadow-2xl border border-blue-800/40">
        
        {/* Ambient atmospheric glows */}
        <div className="absolute top-0 right-0 -mr-24 -mt-24 w-96 h-96 rounded-full bg-blue-500/15 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 -mb-24 w-96 h-96 rounded-full bg-indigo-500/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto space-y-6">
          
          {/* Top Pill & Brand Tagline */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-800/70 text-blue-200 border border-blue-700/60 text-xs font-semibold tracking-wide uppercase font-mono">
                <Library className="w-3.5 h-3.5 text-blue-300" />
                ScholarForge Suite
              </span>
              <span className="text-xs text-blue-300/80 font-sans hidden sm:inline">
                By Professor Babu George
              </span>
            </div>
          </div>

          {/* Inspiring Headline */}
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-bold font-serif tracking-tight leading-tight text-white">
              Intelligent Scholarly Workbench
            </h1>
            <p className="text-sm sm:text-base text-blue-100/90 font-sans max-w-2xl leading-relaxed">
              Drop any manuscript, paste a DOI or bibliography, type a research question, or jump directly into any of the 12 specialized research utilities.
            </p>
          </div>

          {/* THE UNIFIED INTELLIGENT RESEARCH OMNIBOX & DROPZONE */}
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            className={`relative rounded-2xl bg-white/10 dark:bg-slate-900/80 backdrop-blur-md border transition-all duration-200 p-2 sm:p-3 shadow-lg ${
              isDragOver
                ? 'border-blue-400 bg-blue-900/40 ring-4 ring-blue-500/20 scale-[1.01]'
                : 'border-white/20 hover:border-white/30'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="pt-2 pl-2 text-blue-300 shrink-0">
                <Sparkles className="w-5 h-5 text-blue-400 animate-pulse" />
              </div>

              <div className="flex-1 min-w-0">
                <textarea
                  value={omniboxInput}
                  onChange={(e) => {
                    setOmniboxInput(e.target.value);
                    if (importedFilename) setImportedFilename(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey && omniboxInput.trim()) {
                      e.preventDefault();
                      handleExecuteIntent(detectedIntent?.targetPillar || 'literature');
                    }
                  }}
                  rows={omniboxInput.includes('\n') || omniboxInput.length > 80 ? 3 : 1}
                  placeholder="Drop a .docx file, paste any DOI (e.g. 10.1038/...), bibliography, draft snippet, or research question..."
                  className="w-full bg-transparent text-white placeholder-blue-200/60 text-sm sm:text-base outline-none resize-none py-1.5 leading-relaxed font-sans"
                />

                {importedFilename && (
                  <div className="mt-1 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-blue-500/20 border border-blue-400/40 text-xs text-blue-200 font-mono">
                    <FileText className="w-3 h-3 text-blue-300" />
                    <span>Loaded: {importedFilename}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons inside Omnibox */}
              <div className="flex items-center gap-1.5 shrink-0 pt-1">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".docx,.txt,.md,.rtf,.tex"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessingFile}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-blue-100 hover:text-white border border-white/15 transition cursor-pointer"
                  title="Upload .docx, .txt, or .md manuscript file"
                >
                  {isProcessingFile ? <RefreshCw className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                </button>

                {omniboxInput.trim() && (
                  <button
                    type="button"
                    onClick={() => handleExecuteIntent(detectedIntent?.targetPillar || 'literature')}
                    className="px-3 py-1.5 rounded-xl bg-blue-500 hover:bg-blue-400 text-slate-950 font-bold text-xs transition cursor-pointer flex items-center gap-1 shadow-md active:scale-95"
                    title="Run query across detected academic tools (or press Enter)"
                  >
                    <span>{detectedIntent?.badgeLabel === 'Federated Search' ? 'Search' : 'Run'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}

                {omniboxInput && (
                  <button
                    type="button"
                    onClick={() => { setOmniboxInput(''); setImportedFilename(null); }}
                    className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs text-blue-200 hover:text-white transition cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>


            {/* REAL-TIME INTENT DETECTION FLOATING BANNER */}
            {detectedIntent && (
              <div className="mt-3 pt-3 border-t border-white/15 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in duration-150">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${detectedIntent.badgeColor}`}>
                    {detectedIntent.badgeLabel}
                  </span>
                  <div className="text-xs text-blue-100 font-sans truncate">
                    <strong className="text-white">{detectedIntent.title}</strong>
                    <span className="hidden md:inline text-blue-200/80"> — {detectedIntent.description}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                  {detectedIntent.secondaryActions?.map((sec) => (
                    <button
                      key={sec.pillar}
                      type="button"
                      onClick={() => handleExecuteIntent(sec.pillar)}
                      className="px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-blue-100 hover:text-white text-xs font-semibold transition cursor-pointer"
                    >
                      {sec.label}
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={() => handleExecuteIntent(detectedIntent.targetPillar)}
                    className="px-3.5 py-1.5 rounded-xl bg-blue-500 hover:bg-blue-400 text-slate-950 text-xs font-bold transition flex items-center gap-1.5 shadow-md cursor-pointer active:scale-95"
                  >
                    <span>{detectedIntent.primaryActionLabel}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

          </div>

          {/* Clean Auto-Route Tip */}
          <div className="text-[11px] text-blue-200/70 font-sans pt-1">
            Tip: Paste any DOI, manuscript abstract, or drop a .docx/.txt anywhere above to auto-route
          </div>

        </div>
      </section>

      {/* 2. THE 12 INDIVIDUAL UTILITY TILES GRID */}
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Functional Domain Category Filter Buttons */}
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

        </div>
    </div>
  );
};
