import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Settings, 
  HelpCircle, 
  ChevronDown, 
  CheckCircle2, 
  Library,
  ShieldCheck, 
  Moon, 
  Sun, 
  ShoppingCart, 
  Users, 
  Compass, 
  Search, 
  FileCheck, 
  Database,
  Wrench,
  ShieldAlert,
  ArrowRight,
  LayoutGrid
} from 'lucide-react';
import { CITATION_STYLES } from '../services/citationFormatter';
import type { CitationOptions } from '../types/citation';
import { getCartPapers } from '../services/cartService';

export type AcademicPillar = 
  | 'hub'
  | 'literature' 
  | 'pico' 
  | 'studio' 
  | 'claims' 
  | 'verify' 
  | 'scholars' 
  | 'journal' 
  | 'methodology' 
  | 'synthetic' 
  | 'irb' 
  | 'writing' 
  | 'anonymizer';

export type ResearchStage = 'discover' | 'design' | 'draft' | 'publish';

export interface StageToolDef {
  id: AcademicPillar;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

export interface StageDef {
  id: ResearchStage;
  stepNumber: string;
  label: string;
  shortLabel: string;
  tagline: string;
  icon: string;
  defaultPillar: AcademicPillar;
  tools: StageToolDef[];
}

export const RESEARCH_STAGES: StageDef[] = [
  {
    id: 'discover',
    stepNumber: '1',
    label: 'Discover',
    shortLabel: '1. Discover',
    tagline: 'Literature & Search Strategy',
    icon: '🔍',
    defaultPillar: 'literature',
    tools: [
      { id: 'literature', label: 'Federated Search', icon: Search, description: 'Search OpenAlex, PubMed, Semantic Scholar, Crossref & ArXiv' },
      { id: 'pico', label: 'PICO Systematic Strategy', icon: Compass, description: 'Formulate PRISMA queries for PubMed, Scopus, WOS, IEEE' },
    ]
  },
  {
    id: 'design',
    stepNumber: '2',
    label: 'Design & Data',
    shortLabel: '2. Design',
    tagline: 'Methods, Simulation & Ethics',
    icon: '📐',
    defaultPillar: 'methodology',
    tools: [
      { id: 'methodology', label: 'Methodology Compass', icon: Compass, description: 'Quantitative, qualitative & mixed-method design wizard' },
      { id: 'synthetic', label: 'Synthetic Data Forge', icon: Database, description: 'Monte Carlo data generator & interview discourse simulation' },
      { id: 'irb', label: 'IRB Ethics Protocol', icon: ShieldCheck, description: 'Ethics exemption determination, risk analysis & consent drafting' },
    ]
  },
  {
    id: 'draft',
    stepNumber: '3',
    label: 'Draft & Ground',
    shortLabel: '3. Draft',
    tagline: 'Manuscript, Claims & Writing',
    icon: '✍️',
    defaultPillar: 'studio',
    tools: [
      { id: 'studio', label: 'Manuscript Studio', icon: BookOpen, description: 'Interactive writing canvas, file import & AI drafting' },
      { id: 'claims', label: 'Claims Workbench', icon: CheckCircle2, description: 'Sentence-by-sentence claim extraction & evidence consensus' },
      { id: 'writing', label: 'Writing Utilities', icon: Wrench, description: 'Title Polisher, Journal Word Budget & BibTeX Cleaner' },
    ]
  },
  {
    id: 'publish',
    stepNumber: '4',
    label: 'Audit & Publish',
    shortLabel: '4. Publish',
    tagline: 'Fact-Check, Journals & Reviewers',
    icon: '🛡️',
    defaultPillar: 'verify',
    tools: [
      { id: 'verify', label: 'DOI & Retraction Audit', icon: ShieldCheck, description: 'Retraction Watch detection, Crossref DOI health & verification' },
      { id: 'journal', label: 'Journal Fit Sentinel', icon: FileCheck, description: 'Scopus/WoS journal matcher & desk-rejection risk audit' },
      { id: 'scholars', label: 'Scholar & Reviewer Finder', icon: Users, description: 'Find peer reviewers, co-authors & calculate scientometrics' },
      { id: 'anonymizer', label: 'Double-Blind Anonymizer', icon: ShieldAlert, description: 'Redact self-citations, author names & affiliations' },
    ]
  }
];

export function getStageForPillar(pillar: AcademicPillar): ResearchStage | null {
  if (pillar === 'hub') return null;
  if (pillar === 'literature' || pillar === 'pico') return 'discover';
  if (pillar === 'methodology' || pillar === 'synthetic' || pillar === 'irb') return 'design';
  if (pillar === 'studio' || pillar === 'claims' || pillar === 'writing') return 'draft';
  if (pillar === 'verify' || pillar === 'scholars' || pillar === 'journal' || pillar === 'anonymizer') return 'publish';
  return null;
}

// Backwards compatibility alias for WorkflowLens
export type WorkflowLensId = 'full' | 'review' | 'drafting' | 'methods' | 'submission';
export interface WorkflowLensDef {
  id: WorkflowLensId;
  label: string;
  icon: string;
  pillars: AcademicPillar[];
  description: string;
}
export const WORKFLOW_LENSES: WorkflowLensDef[] = [
  { id: 'full', label: 'All Stages', icon: '🔭', pillars: ['literature', 'studio', 'claims', 'verify', 'scholars', 'journal', 'methodology', 'synthetic'], description: 'All 4 research lifecycle stages' },
  { id: 'review', label: 'Literature & Search', icon: '📖', pillars: ['literature', 'claims', 'verify'], description: 'Literature search, PICO matrix, and DOI auditing' },
  { id: 'drafting', label: 'Manuscript Drafting', icon: '✍️', pillars: ['studio', 'claims', 'verify'], description: 'Manuscript writing, claim validation, and citation styling' },
  { id: 'methods', label: 'Methods & Simulation', icon: '📊', pillars: ['methodology', 'synthetic', 'claims'], description: 'Methodology compass, IRB ethics triage, and synthetic data' },
  { id: 'submission', label: 'Journal Pre-Flight', icon: '🚀', pillars: ['journal', 'verify', 'scholars'], description: 'Desk-rejection triage, journal matching, and reviewer outreach' }
];

interface NavbarProps {
  options: CitationOptions;
  setOptions: React.Dispatch<React.SetStateAction<CitationOptions>>;
  isDarkMode: boolean;
  setIsDarkMode: (dark: boolean) => void;
  onOpenHelp: () => void;
  onOpenSettings: () => void;
  onOpenCart?: () => void;
  onOpenSpotlight?: () => void;
  onOpenToolbelt?: () => void;
  onOpenBinder?: () => void;
  activePillar?: AcademicPillar;
  onSelectPillar?: (pillar: AcademicPillar) => void;
  activeLens?: WorkflowLensId;
  onSelectLens?: (lens: WorkflowLensId) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  options,
  setOptions,
  isDarkMode,
  setIsDarkMode,
  onOpenHelp,
  onOpenSettings,
  onOpenCart,
  activePillar = 'literature',
  onSelectPillar,
}) => {
  const [showStyleMenu, setShowStyleMenu] = useState(false);
  const [cartCount, setCartCount] = useState<number>(() => getCartPapers().length);

  useEffect(() => {
    const handleUpdate = () => setCartCount(getCartPapers().length);
    window.addEventListener('scholarforge_cart_updated', handleUpdate);
    return () => window.removeEventListener('scholarforge_cart_updated', handleUpdate);
  }, []);

  const currentStyle = CITATION_STYLES.find((s) => s.id === options.style) || CITATION_STYLES[0];
  const activeStageId = getStageForPillar(activePillar);
  const activeStage = RESEARCH_STAGES.find((s) => s.id === activeStageId) || RESEARCH_STAGES[0];

  const handleStageClick = (stage: StageDef) => {
    if (!onSelectPillar) return;
    // If on the hub or currently in a different stage, navigate to the stage's default pillar
    if (activePillar === 'hub' || getStageForPillar(activePillar) !== stage.id) {
      onSelectPillar(stage.defaultPillar);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-xs">
      
      {/* ROW 1: Brand & Academic Command Utilities */}
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 px-4 lg:px-8 py-2.5">
        
        {/* Brand Logo & Academic Header */}
        <button
          type="button"
          onClick={() => onSelectPillar && onSelectPillar('hub')}
          className="flex items-center gap-3 text-left cursor-pointer group transition"
          title="Return to ScholarForge Utilities Hub"
        >
          <div className="w-9 h-9 rounded-xl bg-blue-900 dark:bg-blue-800 flex items-center justify-center text-white shadow-xs shrink-0 group-hover:scale-105 transition-transform">
            <Library className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                Scholar<span className="text-blue-800 dark:text-blue-400">Forge</span>
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-900 dark:text-blue-300 border border-blue-200 dark:border-blue-800 flex items-center gap-1 font-mono uppercase tracking-wider">
                <ShieldCheck className="w-3 h-3 text-blue-700 dark:text-blue-400" />
                Suite
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden xl:block font-sans -mt-0.5">
              Empirical Research Lifecycle &amp; Manuscript Synthesis Suite
            </p>
          </div>
        </button>

        {/* Right-Hand Controls & Selectors */}
        <div className="flex items-center gap-1.5 sm:gap-2">

          {/* Citation Style Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowStyleMenu(!showStyleMenu)}
              className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-blue-900 hover:bg-blue-800 dark:bg-blue-800 dark:hover:bg-blue-700 text-white shadow-xs transition cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5 text-blue-200" />
              <div className="text-left hidden sm:block">
                <span className="text-[9px] uppercase font-semibold tracking-wider text-blue-200 block leading-none">
                  Format
                </span>
                <span className="text-xs font-semibold text-white leading-tight">
                  {currentStyle.shortName}
                </span>
              </div>
              <ChevronDown className="w-3 h-3 text-blue-200" />
            </button>

            {showStyleMenu && (
              <div 
                className="absolute right-0 mt-2 w-80 sm:w-96 max-w-[calc(100vw-1.5rem)] rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150"
              >
                <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Select Citation Style</span>
                  <span className="text-xs text-blue-700 dark:text-blue-400 font-normal">Live Dynamic Styler</span>
                </div>
                <div className="mt-2 max-h-[360px] overflow-y-auto space-y-1.5 pr-1">
                  {CITATION_STYLES.map((style) => {
                    const isSelected = style.id === options.style;
                    return (
                      <button
                        key={style.id}
                        onClick={() => {
                          setOptions((prev) => ({ ...prev, style: style.id }));
                          setShowStyleMenu(false);
                        }}
                        className={`w-full text-left p-2.5 rounded-xl border transition cursor-pointer ${
                          isSelected
                            ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-600 dark:border-blue-500 text-slate-900 dark:text-white'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold flex items-center gap-1.5 text-slate-900 dark:text-slate-100">
                            {style.name}
                            {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400" />}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 font-mono">
                            {style.category}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 line-clamp-1">
                          {style.description}
                        </p>
                        <div className="mt-1 pt-1 border-t border-slate-100 dark:border-slate-800 font-mono text-[10px] text-blue-800 dark:text-blue-300 flex items-center gap-1">
                          <span className="text-slate-500 text-[10px]">In-text:</span>
                          <span className="truncate">{style.inTextExample}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Citation Rules */}
                <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-800 space-y-1 px-2 text-xs">
                  <div className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Quality Rules:
                  </div>
                  <label className="flex items-center justify-between gap-2 p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer text-slate-700 dark:text-slate-300 text-xs">
                    <span>Include Clickable DOI URLs</span>
                    <input
                      type="checkbox"
                      checked={options.includeDoi}
                      onChange={(e) => setOptions((prev) => ({ ...prev, includeDoi: e.target.checked }))}
                      className="rounded border-slate-300 text-blue-800 focus:ring-blue-700 cursor-pointer"
                    />
                  </label>
                  <label className="flex items-center justify-between gap-2 p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer text-slate-700 dark:text-slate-300 text-xs">
                    <span>Exclude Preprints (Peer-reviewed only)</span>
                    <input
                      type="checkbox"
                      checked={options.excludePreprints}
                      onChange={(e) => setOptions((prev) => ({ ...prev, excludePreprints: e.target.checked }))}
                      className="rounded border-slate-300 text-blue-800 focus:ring-blue-700 cursor-pointer"
                    />
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Research Literature Cart Button */}
          {onOpenCart && (
            <button
              onClick={onOpenCart}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-900 dark:text-blue-300 border border-blue-200 dark:border-blue-800 transition cursor-pointer relative"
              title="Open Research Literature Cart"
            >
              <ShoppingCart className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400" />
              <span className="text-xs font-bold hidden md:inline">Cart</span>
              <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-blue-600 text-white leading-none">
                {cartCount}
              </span>
            </button>
          )}

          {/* Master Settings Button */}
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 transition cursor-pointer"
            title="Consolidated Studio Settings"
          >
            <Settings className="w-4 h-4 text-slate-700 dark:text-slate-300" />
          </button>

          {/* Dark / Light Mode Switcher */}
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 transition cursor-pointer"
            title={isDarkMode ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>

          {/* Help Button */}
          <button
            onClick={onOpenHelp}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 transition cursor-pointer"
            title="How it works &amp; Documentation"
          >
            <HelpCircle className="w-4 h-4 text-blue-800 dark:text-blue-400" />
          </button>

        </div>
      </div>

      {/* ROW 2: TIER 1 - The 4 Research Lifecycle Stages */}
      {onSelectPillar && (
        <div className="w-full border-t border-slate-200/80 dark:border-slate-800/80 bg-slate-50/95 dark:bg-slate-950/90 backdrop-blur-sm px-3 sm:px-4 lg:px-8 py-2">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5">
            
            {/* Steppers: Utilities Hub + 4 Stages */}
            <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar py-0.5">
              
              {/* Home Hub Button */}
              <button
                type="button"
                onClick={() => onSelectPillar('hub')}
                className={`px-3 py-1.5 rounded-xl flex items-center gap-2 transition-all duration-200 cursor-pointer text-left shrink-0 ${
                  activePillar === 'hub'
                    ? 'bg-blue-900 text-white shadow-xs font-bold ring-2 ring-blue-500/20'
                    : 'bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 font-semibold'
                }`}
                title="ScholarForge Home & Utilities Hub"
              >
                <span className={`w-5 h-5 rounded-lg flex items-center justify-center text-[11px] font-mono font-bold shrink-0 ${
                  activePillar === 'hub'
                    ? 'bg-blue-800 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}>
                  <LayoutGrid className="w-3.5 h-3.5" />
                </span>
                <div className="leading-tight">
                  <div className="text-xs font-serif flex items-center gap-1">
                    <span>Utilities Hub</span>
                  </div>
                  <div className={`text-[10px] hidden lg:block ${
                    activePillar === 'hub' ? 'text-blue-200' : 'text-slate-400'
                  }`}>
                    12 Tools
                  </div>
                </div>
              </button>

              <span className="hidden sm:inline text-slate-300 dark:text-slate-700 text-xs font-mono shrink-0 select-none">
                |
              </span>

              {RESEARCH_STAGES.map((stage, idx) => {
                const isCurrentStage = activePillar !== 'hub' && activeStageId === stage.id;
                return (
                  <React.Fragment key={stage.id}>
                    <button
                      type="button"
                      onClick={() => handleStageClick(stage)}
                      className={`px-3 py-1.5 rounded-xl flex items-center gap-2 transition-all duration-200 cursor-pointer text-left shrink-0 ${
                        isCurrentStage
                          ? 'bg-blue-900 text-white shadow-xs font-bold ring-2 ring-blue-500/20'
                          : 'bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 font-semibold'
                      }`}
                      title={stage.tagline}
                    >
                      <span className={`w-5 h-5 rounded-lg flex items-center justify-center text-[11px] font-mono font-bold shrink-0 ${
                        isCurrentStage
                          ? 'bg-blue-800 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}>
                        {stage.stepNumber}
                      </span>
                      <div className="leading-tight">
                        <div className="text-xs font-serif flex items-center gap-1">
                          <span>{stage.label}</span>
                        </div>
                        <div className={`text-[10px] hidden lg:block ${
                          isCurrentStage ? 'text-blue-200' : 'text-slate-400'
                        }`}>
                          {stage.tagline}
                        </div>
                      </div>
                    </button>

                    {idx < RESEARCH_STAGES.length - 1 && (
                      <span className="hidden sm:inline text-slate-300 dark:text-slate-700 text-xs font-mono shrink-0 select-none">
                        →
                      </span>
                    )}
                  </React.Fragment>
                );
              })}
            </div>

            {/* Stage Summary / Orientation Tag */}
            <div className="hidden xl:flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 font-sans shrink-0">
              {activePillar === 'hub' ? (
                <>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Utilities Hub:</span>
                  <span>Select any research utility below or enter a stage</span>
                </>
              ) : (
                <>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Phase {activeStage.stepNumber} of 4:</span>
                  <span>{activeStage.tagline}</span>
                </>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ROW 3: TIER 2 - Clustered Secondary Sub-Tools within Active Stage (Hidden on Hub) */}
      {onSelectPillar && activePillar !== 'hub' && (
        <div className="w-full border-t border-slate-200 dark:border-slate-800/60 bg-white/80 dark:bg-slate-900/80 px-3 sm:px-4 lg:px-8 py-1.5 overflow-hidden shadow-2xs">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
            
            <nav className="flex items-center gap-1.5 text-xs font-semibold py-0.5 overflow-x-auto no-scrollbar flex-nowrap sm:flex-wrap max-w-full">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mr-1 hidden sm:inline">
                {activeStage.label} Tools:
              </span>

              {activeStage.tools.map((tool) => {
                const isSelected = activePillar === tool.id;
                const IconComponent = tool.icon;
                return (
                  <button
                    key={tool.id}
                    type="button"
                    onClick={() => onSelectPillar(tool.id)}
                    className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all duration-150 cursor-pointer active:scale-95 shrink-0 ${
                      isSelected
                        ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-950 dark:text-blue-300 border border-blue-300 dark:border-blue-800 font-bold shadow-2xs ring-1 ring-blue-500/20'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80'
                    }`}
                    title={tool.description}
                  >
                    <IconComponent className={`w-3.5 h-3.5 ${
                      isSelected ? 'text-blue-700 dark:text-blue-400' : 'text-slate-400'
                    }`} />
                    <span>{tool.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Right Side Status / Next Stage */}
            {activeStage.id !== 'publish' && (
              <div className="hidden lg:flex items-center gap-1.5 text-[11px] text-slate-500 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    const nextStageIdx = RESEARCH_STAGES.findIndex((s) => s.id === activeStage.id) + 1;
                    if (nextStageIdx < RESEARCH_STAGES.length) {
                      handleStageClick(RESEARCH_STAGES[nextStageIdx]);
                    }
                  }}
                  className="flex items-center gap-1 text-blue-700 dark:text-blue-400 hover:underline font-semibold cursor-pointer"
                >
                  <span>Next: {RESEARCH_STAGES[RESEARCH_STAGES.findIndex((s) => s.id === activeStage.id) + 1].label}</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            )}

          </div>
        </div>
      )}

    </header>
  );
};
