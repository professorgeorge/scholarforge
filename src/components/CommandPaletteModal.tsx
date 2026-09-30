import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  BookOpen,
  FileText,
  ShieldCheck,
  Compass,
  Database,
  Users,
  Settings,
  HelpCircle,
  Moon,
  Sun,
  ShoppingCart,
  Calculator,
  ArrowRight,
  Sparkles,
  Command,
  Check,
  CheckCircle2,
  Layers,
  FileCheck,
  Target,
  Wrench,
  ShieldAlert
} from 'lucide-react';
import type { AcademicPillar } from './Navbar';
import { CITATION_STYLES } from '../services/citationFormatter';
import type { CitationOptions } from '../types/citation';

export interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPillar: (pillar: AcademicPillar) => void;
  onOpenSettings: () => void;
  onOpenHelp: () => void;
  onOpenCart?: () => void;
  isDarkMode: boolean;
  setIsDarkMode: (dark: boolean) => void;
  citationOptions: CitationOptions;
  setCitationOptions: React.Dispatch<React.SetStateAction<CitationOptions>>;
  onOpenToolbelt?: (toolId?: string) => void;
  onSelectWorkflowLens?: (lensId: string) => void;
}

interface CommandItem {
  id: string;
  title: string;
  description: string;
  category: '1. Discover' | '2. Design & Data' | '3. Draft & Ground' | '4. Audit & Publish' | 'Tools & Features' | 'Workflow Lenses' | 'Calculators' | 'System & Preferences';
  icon: React.ReactNode;
  keywords: string[];
  shortcutBadge?: string;
  action: () => void;
}

export const CommandPaletteModal: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onSelectPillar,
  onOpenSettings,
  onOpenHelp,
  onOpenCart,
  isDarkMode,
  setIsDarkMode,
  citationOptions,
  setCitationOptions,
  onOpenToolbelt,
  onSelectWorkflowLens
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Focus input automatically on open
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Scientific / Scientometric In-Place Calculator detection
  const inlineCalcResult = useMemo(() => {
    const q = query.trim().toLowerCase();

    // Check for m-quotient computation (e.g. "m=..." or "h=18 span=10" or "h=18 s=10")
    const mMatch = q.match(/h\s*=\s*(\d+).*?(?:span|years?|y|s)\s*=\s*(\d+)/i) ||
                   q.match(/(?:span|years?|y|s)\s*=\s*(\d+).*?h\s*=\s*(\d+)/i);
    if (mMatch) {
      const h = parseInt(mMatch[1], 10);
      const span = parseInt(mMatch[2], 10);
      if (span > 0) {
        const m = Number((h / span).toFixed(2));
        const tier = m >= 2.0 ? 'Exceptional Scientific Leader (Top 1%)' :
                     m >= 1.0 ? 'Successful Established Academic' :
                     m >= 0.5 ? 'Moderate Steady Trajectory' : 'Emerging Scholar';
        return {
          label: `Hirsch m-quotient Calculation: m = ${m}`,
          detail: `h-index = ${h}, Career Span = ${span} yrs • Interpretation: ${tier}`,
          value: `m-quotient: ${m} (${tier})`
        };
      }
    }

    // Check for DOI quick lookup (e.g. "doi:10.1038/..." or "10.1000/...")
    const doiMatch = q.match(/10\.\d{4,9}\/[-._;()/:A-Za-z0-9]+/i);
    if (doiMatch) {
      const doi = doiMatch[0];
      return {
        label: `Direct DOI Resolver & Audit: ${doi}`,
        detail: `Press Enter to resolve across Crossref, OpenAlex, and verify retraction status`,
        isDoi: true,
        doi
      };
    }

    // Check for basic arithmetic expression (e.g. "250 - 180" or "50 * 12")
    if (/^[0-9+\-*/^().\s]{3,}$/.test(q) && /[+\-*/]/.test(q)) {
      try {
        // Safe math evaluator for arithmetic
        // eslint-disable-next-line no-eval
        const cleanExpr = q.replace(/[^0-9+\-*/().]/g, '');
        const res = Function(`"use strict"; return (${cleanExpr})`)();
        if (typeof res === 'number' && !isNaN(res) && isFinite(res)) {
          return {
            label: `Calculation Result = ${res}`,
            detail: `Expression: ${cleanExpr}`,
            value: String(res)
          };
        }
      } catch {
        // Ignore math parse errors
      }
    }

    return null;
  }, [query]);

  // Master command registry
  const commands: CommandItem[] = useMemo(() => {
    return [
      // --- STAGE 1: DISCOVER ---
      {
        id: 'pillar-literature',
        title: 'Stage 1: Federated Literature Discovery',
        description: 'Multi-source federated search across OpenAlex, PubMed, Semantic Scholar, Crossref & arXiv',
        category: '1. Discover',
        icon: <Search className="w-4 h-4 text-blue-600" />,
        keywords: ['literature', 'search', 'discovery', 'papers', 'citations', 'pubmed', 'openalex', 'crossref', 'arxiv'],
        shortcutBadge: '1',
        action: () => onSelectPillar('literature')
      },
      {
        id: 'pillar-pico',
        title: 'Stage 1: PICO Systematic Search Strategy',
        description: 'PRISMA-compliant boolean queries compiled for PubMed, Scopus, Web of Science & IEEE',
        category: '1. Discover',
        icon: <Compass className="w-4 h-4 text-blue-600" />,
        keywords: ['pico', 'systematic', 'review', 'prisma', 'boolean', 'mesh', 'scopus', 'web of science'],
        action: () => onSelectPillar('pico')
      },

      // --- STAGE 2: DESIGN & DATA ---
      {
        id: 'pillar-methodology',
        title: 'Stage 2: Methodology & Epistemic Compass',
        description: 'Ontology to Analysis epistemic matrix, guided quantitative/qualitative wizard & code blocks',
        category: '2. Design & Data',
        icon: <Compass className="w-4 h-4 text-red-600" />,
        keywords: ['methodology', 'methods', 'compass', 'epistemic', 'ontology', 'epistemology', 'qualitative', 'quantitative'],
        shortcutBadge: '2',
        action: () => onSelectPillar('methodology')
      },
      {
        id: 'pillar-synthetic',
        title: 'Stage 2: Synthetic Data Forge & Applied Simulation',
        description: 'Monte Carlo models (moderation, mediation, SEM, ANOVA, regression) & qualitative discourse',
        category: '2. Design & Data',
        icon: <Database className="w-4 h-4 text-blue-600" />,
        keywords: ['synthetic', 'data', 'forge', 'monte carlo', 'simulation', 'moderation', 'mediation', 'likert', 'interviews'],
        action: () => onSelectPillar('synthetic')
      },
      {
        id: 'pillar-irb',
        title: 'Stage 2: IRB Ethics Protocol & Exemption Triage',
        description: 'Determine IRB exemption, evaluate participant risk, and generate formal ethics statements',
        category: '2. Design & Data',
        icon: <ShieldCheck className="w-4 h-4 text-emerald-600" />,
        keywords: ['irb', 'ethics', 'exemption', 'protocol', 'consent', 'human subjects', 'triage'],
        action: () => onSelectPillar('irb')
      },

      // --- STAGE 3: DRAFT & GROUND ---
      {
        id: 'pillar-studio',
        title: 'Stage 3: Grounded Manuscript Studio',
        description: 'Interactive manuscript editor, section writing, citation insertion, and file import',
        category: '3. Draft & Ground',
        icon: <FileText className="w-4 h-4 text-indigo-600" />,
        keywords: ['studio', 'manuscript', 'write', 'draft', 'editor', 'r&r', 'revision', 'apa', 'mla'],
        shortcutBadge: '3',
        action: () => onSelectPillar('studio')
      },
      {
        id: 'pillar-claims',
        title: 'Stage 3: Empirical Claims & Consensus Workbench',
        description: 'Extract factual assertions from text and validate against peer-reviewed consensus',
        category: '3. Draft & Ground',
        icon: <CheckCircle2 className="w-4 h-4 text-teal-600" />,
        keywords: ['claims', 'workbench', 'empirical', 'verify', 'consensus', 'evidence', 'assertions'],
        action: () => onSelectPillar('claims')
      },
      {
        id: 'pillar-writing',
        title: 'Stage 3: Academic Writing Utilities',
        description: 'High-Impact Title Polisher, Journal Word Budget Auditor, and BibTeX Cleaner',
        category: '3. Draft & Ground',
        icon: <Wrench className="w-4 h-4 text-purple-600" />,
        keywords: ['writing', 'title', 'polisher', 'word budget', 'running head', 'bibtex', 'cleaner'],
        action: () => onSelectPillar('writing')
      },

      // --- STAGE 4: AUDIT & PUBLISH ---
      {
        id: 'pillar-verify',
        title: 'Stage 4: DOI Verifier & Retraction Audit',
        description: 'Retraction Watch detection, Crossref metadata integrity check, and citation health',
        category: '4. Audit & Publish',
        icon: <ShieldCheck className="w-4 h-4 text-amber-600" />,
        keywords: ['verify', 'bibliography', 'doi', 'references', 'audit', 'hallucination', 'retraction', 'bibtex'],
        shortcutBadge: '4',
        action: () => onSelectPillar('verify')
      },
      {
        id: 'pillar-journal',
        title: 'Stage 4: Journal Sentinel & Pre-Flight Triage',
        description: 'Scopus Q1-Q4 matching, $0 Diamond OA discovery, and desk-rejection risk audit',
        category: '4. Audit & Publish',
        icon: <FileCheck className="w-4 h-4 text-emerald-600" />,
        keywords: ['journal', 'sentinel', 'scopus', 'q1', 'q2', 'diamond oa', 'apc', 'desk rejection', 'cover letter'],
        action: () => onSelectPillar('journal')
      },
      {
        id: 'pillar-scholars',
        title: 'Stage 4: Scholar & Reviewer Finder',
        description: 'Reviewer discovery, Google Scholar profile analysis, h-index, and scientometrics',
        category: '4. Audit & Publish',
        icon: <Users className="w-4 h-4 text-purple-600" />,
        keywords: ['scholars', 'reviewers', 'google scholar', 'profile', 'tenure', 'bio', 'h-index', 'co-authors'],
        action: () => onSelectPillar('scholars')
      },
      {
        id: 'pillar-anonymizer',
        title: 'Stage 4: Double-Blind Peer Review Anonymizer',
        description: 'Sanitize self-citations, author identifiers, university affiliations, and grant numbers',
        category: '4. Audit & Publish',
        icon: <ShieldAlert className="w-4 h-4 text-rose-600" />,
        keywords: ['anonymizer', 'double-blind', 'peer review', 'sanitize', 'redact', 'self-citation', 'blind review'],
        action: () => onSelectPillar('anonymizer')
      },

      // --- WORKFLOW LENSES ---
      {
        id: 'lens-full',
        title: 'Workflow Lens: Full Suite (All 8 Pillars)',
        description: 'Display all research tools and pillars simultaneously',
        category: 'Workflow Lenses',
        icon: <Layers className="w-4 h-4 text-blue-600" />,
        keywords: ['lens', 'workflow', 'all', 'full', 'suite', 'reset'],
        action: () => onSelectWorkflowLens?.('full')
      },
      {
        id: 'lens-review',
        title: 'Workflow Lens: Systematic Review',
        description: 'Focused on Literature Search, PICO Formulation, PRISMA Flow, and DOI Verification',
        category: 'Workflow Lenses',
        icon: <Search className="w-4 h-4 text-emerald-600" />,
        keywords: ['lens', 'systematic review', 'meta-analysis', 'pico', 'prisma', 'literature'],
        action: () => onSelectWorkflowLens?.('review')
      },
      {
        id: 'lens-drafting',
        title: 'Workflow Lens: Manuscript Drafting',
        description: 'Focused on Grounded Manuscript Studio, Claims Workbench, and Citation Styler',
        category: 'Workflow Lenses',
        icon: <FileText className="w-4 h-4 text-indigo-600" />,
        keywords: ['lens', 'manuscript', 'drafting', 'writing', 'claims', 'authoring'],
        action: () => onSelectWorkflowLens?.('drafting')
      },
      {
        id: 'lens-methods',
        title: 'Workflow Lens: Methodology & Data Planning',
        description: 'Focused on Epistemic Compass, Methodology Wizard, and Synthetic Data Simulation',
        category: 'Workflow Lenses',
        icon: <Compass className="w-4 h-4 text-rose-600" />,
        keywords: ['lens', 'methodology', 'data', 'simulation', 'monte carlo', 'research design'],
        action: () => onSelectWorkflowLens?.('methods')
      },
      {
        id: 'lens-submission',
        title: 'Workflow Lens: Submission Pre-Flight',
        description: 'Focused on Journal Sentinel, Desk-Rejection Audit, and Reviewer Outreach',
        category: 'Workflow Lenses',
        icon: <Target className="w-4 h-4 text-teal-600" />,
        keywords: ['lens', 'submission', 'journal', 'pre-flight', 'audit', 'reviewers'],
        action: () => onSelectWorkflowLens?.('submission')
      },

      // --- ACADEMIC MICRO-BLADES & TOOLS ---
      {
        id: 'tool-anonymizer',
        title: 'Micro-Blade: Double-Blind Peer Review Anonymizer',
        description: 'Scrub self-citations, author names, university affiliations, and grant acknowledgments',
        category: 'Tools & Features',
        icon: <ShieldCheck className="w-4 h-4 text-purple-600" />,
        keywords: ['anonymize', 'blind', 'peer review', 'scrub', 'redact', 'double-blind', 'toolbelt'],
        action: () => onOpenToolbelt?.('anonymizer')
      },
      {
        id: 'tool-word-budget',
        title: 'Micro-Blade: Word & Character Budget Sentinel',
        description: 'Check Title (15w), Abstract (250w), Highlights (85c), and Running Head limits',
        category: 'Tools & Features',
        icon: <Check className="w-4 h-4 text-amber-600" />,
        keywords: ['word count', 'character count', 'budget', 'limit', 'abstract', 'highlights', 'running head'],
        action: () => onOpenToolbelt?.('wordBudget')
      },
      {
        id: 'tool-bibtex-cleaner',
        title: 'Micro-Blade: BibTeX Key Cleaner & Normalizer',
        description: 'Standardize messy citation keys into clean academic conventions (e.g. AuthorYear)',
        category: 'Tools & Features',
        icon: <BookOpen className="w-4 h-4 text-blue-600" />,
        keywords: ['bibtex', 'cleaner', 'keys', 'normalize', 'format', 'references'],
        action: () => onOpenToolbelt?.('bibtexCleaner')
      },
      {
        id: 'tool-title-polisher',
        title: 'Micro-Blade: Academic Title & Running Head Polisher',
        description: 'Generate high-impact titles (Catchy Metaphor: Methodological Subtitle) and running heads',
        category: 'Tools & Features',
        icon: <Sparkles className="w-4 h-4 text-emerald-600" />,
        keywords: ['title', 'running head', 'polisher', 'metaphor', 'generator', 'headline'],
        action: () => onOpenToolbelt?.('titlePolisher')
      },
      {
        id: 'tool-irb-triage',
        title: 'Micro-Blade: The IRB & Research Ethics Sentinel',
        description: 'Prospective review track triage (Exempt, Expedited, Full Board), committee checklist, and post-approval amendments',
        category: 'Tools & Features',
        icon: <ShieldCheck className="w-4 h-4 text-emerald-500" />,
        keywords: ['irb', 'ethics', 'triage', 'human subjects', 'exempt', 'expedited', 'full board', 'helsinki', 'cope', 'icmje', 'amendment', 'deviation', 'adverse event', 'george'],
        action: () => onOpenToolbelt?.('irbTriage')
      },

      // --- SCIENTOMETRIC CALCULATORS ---
      {
        id: 'calc-mquotient',
        title: 'Scientometric Calculator: Hirsch m-quotient',
        description: 'Type "h=15 span=10" in the command bar to compute career-normalized citation velocity',
        category: 'Calculators',
        icon: <Calculator className="w-4 h-4 text-teal-600" />,
        keywords: ['m-quotient', 'hirsch', 'career span', 'velocity', 'h-index', 'calculator'],
        action: () => {
          setQuery('h=15 span=10');
          inputRef.current?.focus();
        }
      },

      // --- SYSTEM & PREFERENCES ---
      {
        id: 'action-theme-toggle',
        title: isDarkMode ? 'Switch to Light Theme' : 'Switch to Dark Theme',
        description: `Currently active: ${isDarkMode ? 'Dark Mode' : 'Light Mode'}`,
        category: 'System & Preferences',
        icon: isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />,
        keywords: ['dark', 'light', 'theme', 'mode', 'color', 'appearance'],
        action: () => setIsDarkMode(!isDarkMode)
      },
      {
        id: 'action-open-cart',
        title: 'Open Research Literature Cart',
        description: 'View pinned papers, export BibTeX, or transfer to Manuscript Studio',
        category: 'System & Preferences',
        icon: <ShoppingCart className="w-4 h-4 text-blue-600" />,
        keywords: ['cart', 'literature cart', 'saved papers', 'drawer', 'basket'],
        action: () => onOpenCart?.()
      },
      {
        id: 'action-open-settings',
        title: 'Open Studio Settings & LLM Configuration',
        description: 'Configure Gemini, Groq, OpenAI, or local WebLLM keys and scientometric thresholds',
        category: 'System & Preferences',
        icon: <Settings className="w-4 h-4 text-slate-600" />,
        keywords: ['settings', 'config', 'api key', 'llm', 'gemini', 'groq', 'openai', 'claude', 'webllm'],
        action: () => onOpenSettings()
      },
      {
        id: 'action-open-help',
        title: 'Open Documentation & Research Architecture Guide',
        description: 'Full reference manual for the 8 Pillars of ScholarForge Suite',
        category: 'System & Preferences',
        icon: <HelpCircle className="w-4 h-4 text-blue-600" />,
        keywords: ['help', 'docs', 'guide', 'manual', 'documentation', 'faq'],
        action: () => onOpenHelp()
      },

      // --- CITATION STYLES ---
      ...CITATION_STYLES.map((style) => ({
        id: `style-${style.id}`,
        title: `Format: Switch to ${style.name} (${style.shortName})`,
        description: `Currently ${citationOptions.style === style.id ? 'Active' : 'Available'}: ${style.inTextExample}`,
        category: 'System & Preferences' as const,
        icon: <BookOpen className="w-4 h-4 text-blue-600" />,
        keywords: ['citation', 'style', 'format', style.id, style.name.toLowerCase(), style.shortName.toLowerCase(), 'in-text', 'apa', 'mla', 'ieee'],
        action: () => setCitationOptions((prev) => ({ ...prev, style: style.id }))
      }))
    ];
  }, [isDarkMode, onSelectPillar, onSelectWorkflowLens, onOpenToolbelt, setIsDarkMode, onOpenCart, onOpenSettings, onOpenHelp, citationOptions, setCitationOptions]);

  // Filter commands by query
  const filteredCommands = useMemo(() => {
    if (!query.trim()) return commands;
    const q = query.toLowerCase().trim();

    return commands.filter((cmd) => {
      if (cmd.title.toLowerCase().includes(q)) return true;
      if (cmd.description.toLowerCase().includes(q)) return true;
      if (cmd.category.toLowerCase().includes(q)) return true;
      return cmd.keywords.some((kw) => kw.toLowerCase().includes(q));
    });
  }, [commands, query]);

  // Ensure selected index stays in bounds
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Keyboard navigation inside modal
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1 < filteredCommands.length ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 >= 0 ? prev - 1 : filteredCommands.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (inlineCalcResult) {
        if (inlineCalcResult.isDoi && inlineCalcResult.doi) {
          onSelectPillar('verify');
          onClose();
          return;
        }
        if (inlineCalcResult.value) {
          navigator.clipboard.writeText(inlineCalcResult.value);
          onClose();
          return;
        }
      }
      if (filteredCommands[selectedIndex]) {
        filteredCommands[selectedIndex].action();
        onClose();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      
      <div 
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150"
        onKeyDown={handleKeyDown}
      >
        
        {/* Search Input Bar */}
        <div className="relative border-b border-slate-200 dark:border-slate-800 px-4 py-3.5 flex items-center gap-3 bg-slate-50/50 dark:bg-slate-950/50">
          <Search className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command, tool, pillar, or formula (e.g., 'synthetic', 'doi 10.1038...', 'h=15 span=8')..."
            className="flex-1 bg-transparent border-none text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none"
          />
          <div className="flex items-center gap-1 text-[10px] font-mono text-slate-400 bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded-md">
            <span>ESC to close</span>
          </div>
        </div>

        {/* Inline Calculator / DOI Resolver Result Card */}
        {inlineCalcResult && (
          <div className="p-3.5 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 border-b border-blue-200 dark:border-blue-900/60 flex items-center justify-between text-xs text-slate-800 dark:text-slate-200">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
              <div>
                <span className="font-bold block text-blue-950 dark:text-blue-200 font-serif">
                  {inlineCalcResult.label}
                </span>
                <span className="text-[11px] text-slate-600 dark:text-slate-400">
                  {inlineCalcResult.detail}
                </span>
              </div>
            </div>
            <button
              onClick={() => {
                if (inlineCalcResult.isDoi) {
                  onSelectPillar('verify');
                  onClose();
                } else if (inlineCalcResult.value) {
                  navigator.clipboard.writeText(inlineCalcResult.value);
                  onClose();
                }
              }}
              className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer shrink-0 transition"
            >
              <span>{inlineCalcResult.isDoi ? 'Audit DOI' : 'Copy'}</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Command Items List */}
        <div ref={listRef} className="overflow-y-auto p-2 space-y-1 divide-y divide-slate-100 dark:divide-slate-800/60">
          {filteredCommands.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              <Command className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
              <p>No matching commands or tools found for &ldquo;{query}&rdquo;</p>
              <p className="text-[11px] text-slate-400 mt-1">Try searching for &quot;literature&quot;, &quot;synthetic&quot;, &quot;anonymize&quot;, or &quot;review&quot;</p>
            </div>
          ) : (
            filteredCommands.map((cmd, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={cmd.id}
                  onClick={() => {
                    cmd.action();
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`p-2.5 rounded-xl flex items-center justify-between gap-3 cursor-pointer transition text-xs ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}>
                      {cmd.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`font-semibold truncate ${isSelected ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                          {cmd.title}
                        </span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                          isSelected
                            ? 'bg-white/20 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                        }`}>
                          {cmd.category}
                        </span>
                      </div>
                      <p className={`text-[11px] truncate mt-0.5 ${isSelected ? 'text-blue-100' : 'text-slate-500 dark:text-slate-400'}`}>
                        {cmd.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {cmd.shortcutBadge && (
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                        isSelected
                          ? 'border-white/30 text-white bg-white/10'
                          : 'border-slate-200 dark:border-slate-700 text-slate-400 bg-slate-50 dark:bg-slate-800'
                      }`}>
                        {cmd.shortcutBadge}
                      </span>
                    )}
                    <ArrowRight className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Shortcut Hints */}
        <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <div className="flex items-center gap-3">
            <span>&uarr;&darr; Navigate</span>
            <span>&crarr; Select</span>
            <span>ESC Close</span>
          </div>
          <div className="flex items-center gap-1 text-slate-500">
            <Sparkles className="w-3 h-3 text-blue-600" />
            <span>Scholar Spotlight Pro</span>
          </div>
        </div>

      </div>
    </div>
  );
};
