import React, { useState } from 'react';
import { 
  BookOpen, 
  Settings, 
  HelpCircle, 
  ChevronDown, 
  CheckCircle2, 
  Library,
  ShieldCheck,
  Moon,
  Sun
} from 'lucide-react';
import { CITATION_STYLES } from '../services/citationFormatter';
import type { CitationOptions } from '../types/citation';

interface NavbarProps {
  options: CitationOptions;
  setOptions: React.Dispatch<React.SetStateAction<CitationOptions>>;
  isDarkMode: boolean;
  setIsDarkMode: (dark: boolean) => void;
  onOpenHelp: () => void;
  onOpenSettings: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  options,
  setOptions,
  isDarkMode,
  setIsDarkMode,
  onOpenHelp,
  onOpenSettings,
}) => {
  const [showStyleMenu, setShowStyleMenu] = useState(false);

  const currentStyle = CITATION_STYLES.find((s) => s.id === options.style) || CITATION_STYLES[0];

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
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-900 dark:text-blue-300 border border-blue-200 dark:border-blue-800 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400" />
                Scholarly Registry
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block font-sans">
              Unified Scholarly Intelligence • Manuscript Grounding, PICO Matrix & Scientometrics
            </p>
          </div>
        </div>

        {/* Controls & Selectors */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          
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
              </div>
            )}
          </div>

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
    </header>
  );
};
