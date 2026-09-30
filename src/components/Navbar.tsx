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
  FolderKanban
} from 'lucide-react';
import { CITATION_STYLES } from '../services/citationFormatter';
import type { CitationOptions } from '../types/citation';
import { getCartPapers } from '../services/cartService';
import { getBinderItems } from '../services/binderService';

export type AcademicPillar = 'literature' | 'studio' | 'claims' | 'verify' | 'scholars' | 'journal' | 'methodology' | 'synthetic';

export type WorkflowLensId = 'full' | 'review' | 'drafting' | 'methods' | 'submission';

export interface WorkflowLensDef {
  id: WorkflowLensId;
  label: string;
  icon: string;
  pillars: AcademicPillar[];
  description: string;
}

export const WORKFLOW_LENSES: WorkflowLensDef[] = [
  {
    id: 'full',
    label: 'All Tools',
    icon: '🔭',
    pillars: ['literature', 'studio', 'claims', 'verify', 'scholars', 'journal', 'methodology', 'synthetic'],
    description: 'Full suite with all 8 pillars visible'
  },
  {
    id: 'review',
    label: 'Review',
    icon: '📖',
    pillars: ['literature', 'claims', 'verify'],
    description: 'Literature search, PICO matrix, PRISMA, and DOI auditing'
  },
  {
    id: 'drafting',
    label: 'Drafting',
    icon: '✍️',
    pillars: ['studio', 'claims', 'verify'],
    description: 'Manuscript writing, claim validation, and citation styling'
  },
  {
    id: 'methods',
    label: 'Methods & Data',
    icon: '📊',
    pillars: ['methodology', 'synthetic', 'claims'],
    description: 'Methodology compass and Monte Carlo synthetic data simulation'
  },
  {
    id: 'submission',
    label: 'Pre-Flight',
    icon: '🚀',
    pillars: ['journal', 'verify', 'scholars'],
    description: 'Desk-rejection triage, Scopus journal matching, and reviewer outreach'
  }
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
  onOpenSpotlight,
  onOpenToolbelt,
  onOpenBinder,
  activePillar = 'literature',
  onSelectPillar,
  activeLens = 'full',
  onSelectLens,
}) => {
  const [showStyleMenu, setShowStyleMenu] = useState(false);
  const [showLensMenu, setShowLensMenu] = useState(false);
  const [cartCount, setCartCount] = useState<number>(() => getCartPapers().length);
  const [binderCount, setBinderCount] = useState<number>(() => getBinderItems().length);

  useEffect(() => {
    const handleUpdate = () => setCartCount(getCartPapers().length);
    window.addEventListener('scholarforge_cart_updated', handleUpdate);
    return () => window.removeEventListener('scholarforge_cart_updated', handleUpdate);
  }, []);

  useEffect(() => {
    const handleBinderUpdate = () => setBinderCount(getBinderItems().length);
    window.addEventListener('scholarforge_binder_updated', handleBinderUpdate);
    return () => window.removeEventListener('scholarforge_binder_updated', handleBinderUpdate);
  }, []);

  const currentStyle = CITATION_STYLES.find((s) => s.id === options.style) || CITATION_STYLES[0];
  const currentLens = WORKFLOW_LENSES.find((l) => l.id === activeLens) || WORKFLOW_LENSES[0];
  const visiblePillars = currentLens.pillars;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-4 lg:px-8 py-3 shadow-xs">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        
        {/* Brand Logo & Academic Header */}
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-blue-900 dark:bg-blue-800 flex items-center justify-center text-white shadow-xs">
            <Library className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <span className="font-serif text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                Scholar<span className="text-blue-800 dark:text-blue-400">Forge</span>
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-900 dark:text-blue-300 border border-blue-200 dark:border-blue-800 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400" />
                Suite
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 hidden xl:block font-sans">
              Unified Academic Research &amp; Empirical Synthesis Suite
            </p>
          </div>
        </div>

        {/* Workflow Lens & Pillar Navigation */}
        <div className="hidden md:flex items-center gap-2">
          {/* Workflow Lens Selector */}
          <div className="relative">
            <button
              onClick={() => setShowLensMenu(!showLensMenu)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold border border-slate-300 dark:border-slate-700 transition cursor-pointer"
              title="Filter pillars by current workflow phase"
            >
              <span>{currentLens.icon}</span>
              <span className="hidden lg:inline">{currentLens.label}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showLensMenu && (
              <div className="absolute left-0 mt-2 w-64 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Select Workflow Lens
                </div>
                <div className="mt-1 space-y-1">
                  {WORKFLOW_LENSES.map((lens) => (
                    <button
                      key={lens.id}
                      onClick={() => {
                        onSelectLens?.(lens.id);
                        if (onSelectPillar && !lens.pillars.includes(activePillar)) {
                          onSelectPillar(lens.pillars[0]);
                        }
                        setShowLensMenu(false);
                      }}
                      className={`w-full text-left p-2 rounded-xl flex items-center justify-between gap-2 transition cursor-pointer ${
                        activeLens === lens.id
                          ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-900 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-900/60'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{lens.icon}</span>
                        <div>
                          <div className="text-xs font-bold leading-tight">{lens.label}</div>
                          <div className="text-[10px] text-slate-500 line-clamp-1">{lens.description}</div>
                        </div>
                      </div>
                      {activeLens === lens.id && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Filtered Pillar Navigation Tabs */}
          {onSelectPillar && (
            <nav className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl text-xs font-semibold">
              {visiblePillars.includes('literature') && (
                <button
                  onClick={() => onSelectPillar('literature')}
                  className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer ${
                    activePillar === 'literature'
                      ? 'bg-white dark:bg-slate-900 text-blue-900 dark:text-blue-400 shadow-xs font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Literature</span>
                </button>
              )}

              {visiblePillars.includes('studio') && (
                <button
                  onClick={() => onSelectPillar('studio')}
                  className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer ${
                    activePillar === 'studio'
                      ? 'bg-white dark:bg-slate-900 text-blue-900 dark:text-blue-400 shadow-xs font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Studio</span>
                </button>
              )}

              {visiblePillars.includes('claims') && (
                <button
                  onClick={() => onSelectPillar('claims')}
                  className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer ${
                    activePillar === 'claims'
                      ? 'bg-white dark:bg-slate-900 text-blue-900 dark:text-blue-400 shadow-xs font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Claims</span>
                </button>
              )}

              {visiblePillars.includes('verify') && (
                <button
                  onClick={() => onSelectPillar('verify')}
                  className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer ${
                    activePillar === 'verify'
                      ? 'bg-white dark:bg-slate-900 text-emerald-800 dark:text-emerald-400 shadow-xs font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Audit</span>
                </button>
              )}

              {visiblePillars.includes('scholars') && (
                <button
                  onClick={() => onSelectPillar('scholars')}
                  className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer ${
                    activePillar === 'scholars'
                      ? 'bg-white dark:bg-slate-900 text-indigo-900 dark:text-indigo-400 shadow-xs font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Users className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>Scholars</span>
                </button>
              )}

              {visiblePillars.includes('journal') && (
                <button
                  onClick={() => onSelectPillar('journal')}
                  className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer ${
                    activePillar === 'journal'
                      ? 'bg-white dark:bg-slate-900 text-teal-800 dark:text-teal-400 shadow-xs font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <FileCheck className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                  <span>Journal</span>
                </button>
              )}

              {visiblePillars.includes('methodology') && (
                <button
                  onClick={() => onSelectPillar('methodology')}
                  className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer ${
                    activePillar === 'methodology'
                      ? 'bg-white dark:bg-slate-900 text-red-900 dark:text-red-400 shadow-xs font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Compass className="w-3.5 h-3.5 text-red-700 dark:text-red-400" />
                  <span>Methods</span>
                </button>
              )}

              {visiblePillars.includes('synthetic') && (
                <button
                  onClick={() => onSelectPillar('synthetic')}
                  className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer ${
                    activePillar === 'synthetic'
                      ? 'bg-white dark:bg-slate-900 text-blue-900 dark:text-blue-400 shadow-xs font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Database className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400" />
                  <span>Synthetic Data</span>
                </button>
              )}
            </nav>
          )}
        </div>

        {/* Controls & Selectors */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          
          {/* Spotlight Button */}
          <button
            onClick={onOpenSpotlight}
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 text-xs font-semibold transition cursor-pointer"
            title="Open Scholar Spotlight Command Palette (Ctrl+K)"
          >
            <Search className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span className="hidden xl:inline">Spotlight</span>
            <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-500">
              Ctrl K
            </kbd>
          </button>

          {/* Academic Toolbelt Button */}
          <button
            onClick={onOpenToolbelt}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/60 dark:hover:bg-purple-900/60 text-purple-900 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-xs font-bold transition cursor-pointer"
            title="Academic Toolbelt (Double-Blind Anonymizer, Word Budgeter, BibTeX Cleaner, Title Polisher)"
          >
            <Wrench className="w-4 h-4 text-purple-700 dark:text-purple-400" />
            <span className="hidden xl:inline">Toolbelt</span>
          </button>

          {/* Universal Research Binder Button */}
          <button
            onClick={onOpenBinder}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-900 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-bold transition cursor-pointer relative"
            title="Universal Research Binder & Dossier Synthesizer"
          >
            <FolderKanban className="w-4 h-4 text-blue-700 dark:text-blue-400" />
            <span className="hidden xl:inline">Binder</span>
            <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-blue-600 text-white leading-none">
              {binderCount}
            </span>
          </button>

          
          {/* Citation Style Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowStyleMenu(!showStyleMenu)}
              className="flex items-center gap-2.5 px-3.5 py-2 rounded-lg bg-blue-900 hover:bg-blue-800 dark:bg-blue-800 dark:hover:bg-blue-700 text-white shadow-xs transition cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-blue-200" />
              <div className="text-left">
                <span className="text-[11px] uppercase font-semibold tracking-wider text-blue-200 block leading-none">
                  Citation Format
                </span>
                <span className="text-sm font-semibold text-white leading-tight">
                  {currentStyle.shortName}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-blue-200 ml-1" />
            </button>

            {showStyleMenu && (
              <div 
                className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150"
              >
                <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Select Citation Style</span>
                  <span className="text-xs text-blue-700 dark:text-blue-400 font-normal">Live Dynamic Styler</span>
                </div>
                <div className="mt-2 max-h-[400px] overflow-y-auto space-y-1.5 pr-1">
                  {CITATION_STYLES.map((style) => {
                    const isSelected = style.id === options.style;
                    return (
                      <button
                        key={style.id}
                        onClick={() => {
                          setOptions((prev) => ({ ...prev, style: style.id }));
                          setShowStyleMenu(false);
                        }}
                        className={`w-full text-left p-3 rounded-lg border transition cursor-pointer ${
                          isSelected
                            ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-600 dark:border-blue-500 text-slate-900 dark:text-white'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold flex items-center gap-1.5 text-slate-900 dark:text-slate-100">
                            {style.name}
                            {isSelected && <CheckCircle2 className="w-4 h-4 text-blue-700 dark:text-blue-400" />}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 font-mono">
                            {style.category}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-1">
                          {style.description}
                        </p>
                        <div className="mt-1.5 pt-1.5 border-t border-slate-100 dark:border-slate-800 font-mono text-xs text-blue-800 dark:text-blue-300 flex items-center gap-1">
                          <span className="text-slate-500 text-xs">In-text:</span>
                          <span className="truncate">{style.inTextExample}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Citation & Quality Rules Footer */}
                <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-800 space-y-1.5 px-2 text-xs">
                  <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Citation &amp; Quality Rules:
                  </div>
                  <label className="flex items-center justify-between gap-2 p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer text-slate-700 dark:text-slate-300">
                    <span>Include Clickable DOI URLs</span>
                    <input
                      type="checkbox"
                      checked={options.includeDoi}
                      onChange={(e) => setOptions((prev) => ({ ...prev, includeDoi: e.target.checked }))}
                      className="rounded border-slate-300 text-blue-800 focus:ring-blue-700 cursor-pointer"
                    />
                  </label>
                  <label className="flex items-center justify-between gap-2 p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer text-slate-700 dark:text-slate-300">
                    <span>Exclude Preprints (Peer-reviewed only)</span>
                    <input
                      type="checkbox"
                      checked={options.excludePreprints}
                      onChange={(e) => setOptions((prev) => ({ ...prev, excludePreprints: e.target.checked }))}
                      className="rounded border-slate-300 text-blue-800 focus:ring-blue-700 cursor-pointer"
                    />
                  </label>
                  <label className="flex items-center justify-between gap-2 p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer text-slate-700 dark:text-slate-300">
                    <span>Require Verified DOI</span>
                    <input
                      type="checkbox"
                      checked={options.requireDoi}
                      onChange={(e) => setOptions((prev) => ({ ...prev, requireDoi: e.target.checked }))}
                      className="rounded border-slate-300 text-blue-800 focus:ring-blue-700 cursor-pointer"
                    />
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Research Literature Cart Button */}
          <button
            onClick={onOpenCart}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-900 dark:text-blue-300 border border-blue-200 dark:border-blue-800 transition cursor-pointer relative"
            title="Open Research Literature Cart"
          >
            <ShoppingCart className="w-4 h-4 text-blue-700 dark:text-blue-400" />
            <span className="text-xs font-bold hidden sm:inline">Cart</span>
            <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-blue-600 text-white leading-none">
              {cartCount}
            </span>
          </button>

          {/* Consolidated Master Settings Button */}
          <button
            onClick={onOpenSettings}
            className="p-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 transition cursor-pointer"
            title="Consolidated Studio Settings (LLM Engine, Quality Filters, Citation Options)"
          >
            <Settings className="w-4 h-4 text-slate-700 dark:text-slate-300" />
          </button>

          {/* Dark / Light Mode Switcher */}
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 transition cursor-pointer"
            title={isDarkMode ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>

          {/* Help button */}
          <button
            onClick={onOpenHelp}
            className="p-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 transition cursor-pointer"
            title="How it works & Documentation"
          >
            <HelpCircle className="w-4 h-4 text-blue-800 dark:text-blue-400" />
          </button>

        </div>
      </div>

      {/* Mobile Pillar Sub-Navigation Bar */}
      {onSelectPillar && (
        <div className="md:hidden flex items-center justify-between gap-1 px-4 py-2 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold overflow-x-auto">
          {visiblePillars.includes('literature') && (
            <button
              onClick={() => onSelectPillar('literature')}
              className={`px-2.5 py-1 rounded-md flex items-center gap-1 shrink-0 transition ${
                activePillar === 'literature'
                  ? 'bg-blue-900 text-white font-bold'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <Search className="w-3 h-3" />
              <span>Literature</span>
            </button>
          )}
          {visiblePillars.includes('studio') && (
            <button
              onClick={() => onSelectPillar('studio')}
              className={`px-2.5 py-1 rounded-md flex items-center gap-1 shrink-0 transition ${
                activePillar === 'studio'
                  ? 'bg-blue-900 text-white font-bold'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <BookOpen className="w-3 h-3" />
              <span>Studio</span>
            </button>
          )}
          {visiblePillars.includes('claims') && (
            <button
              onClick={() => onSelectPillar('claims')}
              className={`px-2.5 py-1 rounded-md flex items-center gap-1 shrink-0 transition ${
                activePillar === 'claims'
                  ? 'bg-blue-900 text-white font-bold'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <CheckCircle2 className="w-3 h-3" />
              <span>Claims</span>
            </button>
          )}
          {visiblePillars.includes('verify') && (
            <button
              onClick={() => onSelectPillar('verify')}
              className={`px-2.5 py-1 rounded-md flex items-center gap-1 shrink-0 transition ${
                activePillar === 'verify'
                  ? 'bg-emerald-800 text-white font-bold'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <ShieldCheck className="w-3 h-3" />
              <span>Audit</span>
            </button>
          )}
          {visiblePillars.includes('scholars') && (
            <button
              onClick={() => onSelectPillar('scholars')}
              className={`px-2.5 py-1 rounded-md flex items-center gap-1 shrink-0 transition ${
                activePillar === 'scholars'
                  ? 'bg-indigo-900 text-white font-bold'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <Users className="w-3 h-3" />
              <span>Scholars</span>
            </button>
          )}
          {visiblePillars.includes('journal') && (
            <button
              onClick={() => onSelectPillar('journal')}
              className={`px-2.5 py-1 rounded-md flex items-center gap-1 shrink-0 transition ${
                activePillar === 'journal'
                  ? 'bg-teal-800 text-white font-bold'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <FileCheck className="w-3 h-3" />
              <span>Journal</span>
            </button>
          )}
          {visiblePillars.includes('methodology') && (
            <button
              onClick={() => onSelectPillar('methodology')}
              className={`px-2.5 py-1 rounded-md flex items-center gap-1 shrink-0 transition ${
                activePillar === 'methodology'
                  ? 'bg-red-800 text-white font-bold'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <Compass className="w-3 h-3" />
              <span>Methods</span>
            </button>
          )}
          {visiblePillars.includes('synthetic') && (
            <button
              onClick={() => onSelectPillar('synthetic')}
              className={`px-2.5 py-1 rounded-md flex items-center gap-1 shrink-0 transition ${
                activePillar === 'synthetic'
                  ? 'bg-blue-800 text-white font-bold'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <Database className="w-3 h-3" />
              <span>Synthetic Data</span>
            </button>
          )}
        </div>
      )}
    </header>
  );
};
