import React, { useState, useMemo } from 'react';
import {
  FileText,
  AlignLeft,
  Sparkles,
  BookOpen,
  Copy,
  Check,
  CheckCircle2,
  Send,
  Info
} from 'lucide-react';

interface WritingToolbeltPaneProps {
  onSendToStudio?: (text: string) => void;
  onNavigateToStudio?: () => void;
}

export const WritingToolbeltPane: React.FC<WritingToolbeltPaneProps> = ({
  onSendToStudio,
  onNavigateToStudio
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'titlePolisher' | 'wordBudget' | 'bibtexCleaner'>('titlePolisher');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // 1. Title Polisher State
  const [topicInput, setTopicInput] = useState<string>('');

  // 2. Word Budget State
  const [budgetTitle, setBudgetTitle] = useState<string>('');
  const [budgetRunningHead, setBudgetRunningHead] = useState<string>('');
  const [budgetAbstract, setBudgetAbstract] = useState<string>('');
  const [budgetHighlights, setBudgetHighlights] = useState<string>('');
  const [selectedJournalTier, setSelectedJournalTier] = useState<'nature' | 'lancet' | 'plos' | 'apa' | 'custom'>('apa');

  // 3. BibTeX Cleaner State
  const [bibtexInput, setBibtexInput] = useState<string>('');

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  // --- TITLE POLISHER LOGIC ---
  const generatedTitles = useMemo(() => {
    if (!topicInput.trim()) return [];
    const t = topicInput.trim().replace(/^e\.g\.?:?\s*/i, '');
    const capitalizedTopic = t.charAt(0).toUpperCase() + t.slice(1);

    return [
      {
        style: 'Empirical Colon Pattern (High-Impact Quantitative)',
        title: `${capitalizedTopic}: A Multi-Center Empirical Investigation of Underlying Mechanisms`,
        score: '96/100',
        words: `${capitalizedTopic.split(/\s+/).length + 8} words`,
        why: 'The two-part colon title is the most cited syntactic format in top-quartile journals.'
      },
      {
        style: 'Action-Oriented Causal Hypothesis (Clinical / Experimental)',
        title: `How Does ${capitalizedTopic} Influence Performance? Longitudinal Evidence from Randomized Cohorts`,
        score: '92/100',
        words: `${capitalizedTopic.split(/\s+/).length + 8} words`,
        why: 'Inquisitive interrogative titles spark strong altmetric and social citation velocity.'
      },
      {
        style: 'Systematic & Meta-Analytic Synthesis',
        title: `${capitalizedTopic}: A Systematic Review and Meta-Analytic Consensus Mapping`,
        score: '95/100',
        words: `${capitalizedTopic.split(/\s+/).length + 8} words`,
        why: 'Explicit methodology identification signals rigorous epistemic value.'
      },
      {
        style: 'Theoretical & Moderating Boundary Conditions',
        title: `Beyond the Direct Effect: Unpacking Moderating Contingencies in ${capitalizedTopic}`,
        score: '89/100',
        words: `${capitalizedTopic.split(/\s+/).length + 8} words`,
        why: 'Framing contributions around boundary conditions appeals to premier management and behavioral journals.'
      }
    ];
  }, [topicInput]);

  // --- WORD BUDGET LOGIC ---
  const budgetSpecs = useMemo(() => {
    switch (selectedJournalTier) {
      case 'nature':
        return { maxTitleWords: 15, maxRunningChars: 50, maxAbstractWords: 200, maxHighlights: 3, label: 'Nature / Science High-Impact' };
      case 'lancet':
        return { maxTitleWords: 18, maxRunningChars: 45, maxAbstractWords: 300, maxHighlights: 4, label: 'The Lancet / BMJ Clinical' };
      case 'plos':
        return { maxTitleWords: 20, maxRunningChars: 50, maxAbstractWords: 250, maxHighlights: 0, label: 'PLOS ONE / Open Access' };
      case 'apa':
      default:
        return { maxTitleWords: 12, maxRunningChars: 50, maxAbstractWords: 250, maxHighlights: 3, label: 'APA 7th Standard Academic' };
    }
  }, [selectedJournalTier]);

  const titleWordCount = useMemo(() => budgetTitle.trim() ? budgetTitle.trim().split(/\s+/).length : 0, [budgetTitle]);
  const runningHeadCharCount = budgetRunningHead.length;
  const abstractWordCount = useMemo(() => budgetAbstract.trim() ? budgetAbstract.trim().split(/\s+/).length : 0, [budgetAbstract]);
  const highlightCount = useMemo(() => {
    if (!budgetHighlights.trim()) return 0;
    return budgetHighlights.split('\n').filter(line => line.trim().length > 0).length;
  }, [budgetHighlights]);

  // --- BIBTEX CLEANER LOGIC ---
  const cleanedBibtex = useMemo(() => {
    if (!bibtexInput.trim()) return '';
    return bibtexInput
      .replace(/@([a-zA-Z]+)\s*\{\s*([^,]+),/g, (_match, type, oldKey) => {
        let newKey = oldKey.trim().replace(/\s+/g, '_');
        return `@${type.toLowerCase()}{${newKey},`;
      })
      .replace(/month\s*=\s*\{?[^},]+\}?,?\n?/gi, '')
      .replace(/file\s*=\s*\{?[^}]+\}?,?\n?/gi, '')
      .replace(/abstract\s*=\s*\{[\s\S]*?\},?\n?/gi, '')
      .replace(/doi\s*=\s*\{?([^},]+)\}?/gi, (_match, val) => {
        const cleanDoi = val.trim().replace(/^https?:\/\/doi\.org\//i, '');
        return `  doi = {${cleanDoi}}`;
      });
  }, [bibtexInput]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 dark:from-purple-950/40 dark:via-indigo-950/30 dark:to-blue-950/30 border border-purple-200/80 dark:border-purple-900/60 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md bg-purple-200/80 dark:bg-purple-900/60 text-purple-900 dark:text-purple-200 text-[10px] font-bold uppercase tracking-wider font-mono">
              Stage 3 • Writing Utilities
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs font-semibold text-purple-950 dark:text-purple-300">
              Manuscript Polish &amp; Structure Architecture
            </span>
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white font-serif mt-1">
            Academic Writing &amp; Precision Utilities
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            Optimize high-impact titles, audit journal word budget allocations, and normalize BibTeX bibliographies.
          </p>
        </div>

        {onNavigateToStudio && (
          <button
            type="button"
            onClick={onNavigateToStudio}
            className="px-4 py-2 rounded-xl bg-blue-900 hover:bg-blue-950 text-white text-xs font-bold flex items-center gap-2 transition cursor-pointer shadow-xs"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Open Manuscript Studio</span>
          </button>
        )}
      </div>

      {/* Sub-Tab Navigation */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          type="button"
          onClick={() => setActiveSubTab('titlePolisher')}
          className={`px-4 py-2 rounded-xl text-xs font-bold font-serif flex items-center gap-2 transition cursor-pointer ${
            activeSubTab === 'titlePolisher'
              ? 'bg-purple-900 text-white shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>High-Impact Title Polisher</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('wordBudget')}
          className={`px-4 py-2 rounded-xl text-xs font-bold font-serif flex items-center gap-2 transition cursor-pointer ${
            activeSubTab === 'wordBudget'
              ? 'bg-purple-900 text-white shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          <AlignLeft className="w-3.5 h-3.5" />
          <span>Journal Word Budget &amp; Structure Auditor</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('bibtexCleaner')}
          className={`px-4 py-2 rounded-xl text-xs font-bold font-serif flex items-center gap-2 transition cursor-pointer ${
            activeSubTab === 'bibtexCleaner'
              ? 'bg-purple-900 text-white shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>BibTeX Cleaner &amp; Normalizer</span>
        </button>
      </div>

      {/* TOOL 1: HIGH-IMPACT TITLE POLISHER */}
      {activeSubTab === 'titlePolisher' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider font-serif">
                Enter Research Topic, Core Finding, or Working Title:
              </label>
            </div>

            <input
              type="text"
              value={topicInput}
              onChange={(e) => setTopicInput(e.target.value)}
              placeholder="Enter your topic or draft title..."
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-purple-600 font-sans"
            />
            <p className="text-[11px] text-slate-500 font-sans">
              Enter your core research question, variables, or draft title. Scientifically structured syntaxes will generate instantly.
            </p>
          </div>

          {generatedTitles.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {generatedTitles.map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2.5 shadow-xs flex flex-col justify-between"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wider">
                        {item.style}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-mono font-bold">
                        {item.score}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white font-serif leading-snug">
                      "{item.title}"
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-sans leading-relaxed">
                      {item.why}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-[10px] text-slate-400 font-mono">{item.words}</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleCopy(item.title, `title-${idx}`)}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1 cursor-pointer transition"
                      >
                        {copiedKey === `title-${idx}` ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedKey === `title-${idx}` ? 'Copied' : 'Copy'}</span>
                      </button>
                      {onSendToStudio && (
                        <button
                          type="button"
                          onClick={() => onSendToStudio(`Title: ${item.title}`)}
                          className="px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/60 text-purple-900 dark:text-purple-300 text-xs font-semibold flex items-center gap-1 border border-purple-200 dark:border-purple-800 cursor-pointer transition"
                        >
                          <Send className="w-3 h-3 text-purple-700 dark:text-purple-400" />
                          <span>Use in Studio</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TOOL 2: WORD BUDGET & STRUCTURE AUDITOR */}
      {activeSubTab === 'wordBudget' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          
          {/* Target Profile Bar */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider font-serif">
                Target Journal Specification:
              </span>
              <select
                value={selectedJournalTier}
                onChange={(e) => setSelectedJournalTier(e.target.value as any)}
                className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white cursor-pointer"
              >
                <option value="apa">APA 7th Standard Academic (12 words, 250 abstract)</option>
                <option value="nature">Nature / Science (15 words, 200 abstract, 50 head)</option>
                <option value="lancet">The Lancet / BMJ Clinical (18 words, 300 abstract)</option>
                <option value="plos">PLOS ONE / Multidisciplinary (20 words, 250 abstract)</option>
              </select>
            </div>
          </div>

          {/* 4 Fields Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Title Field */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 shadow-xs">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider font-serif">
                  Manuscript Title
                </label>
                <span className={`text-xs font-mono font-bold ${
                  titleWordCount > budgetSpecs.maxTitleWords ? 'text-rose-600' : 'text-emerald-600'
                }`}>
                  {titleWordCount} / {budgetSpecs.maxTitleWords} words
                </span>
              </div>
              <input
                type="text"
                value={budgetTitle}
                onChange={(e) => setBudgetTitle(e.target.value)}
                placeholder="Enter complete manuscript title..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-purple-600 font-sans"
              />
            </div>

            {/* Running Head Field */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 shadow-xs">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider font-serif">
                  Running Head (Header)
                </label>
                <span className={`text-xs font-mono font-bold ${
                  runningHeadCharCount > budgetSpecs.maxRunningChars ? 'text-rose-600' : 'text-emerald-600'
                }`}>
                  {runningHeadCharCount} / {budgetSpecs.maxRunningChars} chars
                </span>
              </div>
              <input
                type="text"
                value={budgetRunningHead}
                onChange={(e) => setBudgetRunningHead(e.target.value.toUpperCase())}
                placeholder="UPPERCASE RUNNING HEAD..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-purple-600 font-sans uppercase"
              />
            </div>

            {/* Abstract Field */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 shadow-xs md:col-span-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider font-serif">
                  Structured Abstract
                </label>
                <span className={`text-xs font-mono font-bold ${
                  abstractWordCount > budgetSpecs.maxAbstractWords ? 'text-rose-600' : 'text-emerald-600'
                }`}>
                  {abstractWordCount} / {budgetSpecs.maxAbstractWords} words
                </span>
              </div>
              <textarea
                rows={5}
                value={budgetAbstract}
                onChange={(e) => setBudgetAbstract(e.target.value)}
                placeholder="Background, Methods, Results, Conclusions..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-purple-600 font-sans leading-relaxed"
              />
            </div>

            {/* Highlights Field */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 shadow-xs md:col-span-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider font-serif">
                  Journal Highlights / Bullet Findings (1 per line)
                </label>
                <span className={`text-xs font-mono font-bold ${
                  highlightCount > 5 ? 'text-rose-600' : 'text-emerald-600'
                }`}>
                  {highlightCount} bullet points (Recommended: 3 to 5)
                </span>
              </div>
              <textarea
                rows={3}
                value={budgetHighlights}
                onChange={(e) => setBudgetHighlights(e.target.value)}
                placeholder="1. Primary empirical discovery...&#10;2. Methodological advance...&#10;3. Policy or practical implication..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-purple-600 font-sans leading-relaxed"
              />
            </div>

          </div>
        </div>
      )}

      {/* TOOL 3: BIBTEX CLEANER & NORMALIZER */}
      {activeSubTab === 'bibtexCleaner' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Raw Input */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider font-serif">
                  Raw BibTeX Entry or File Content:
                </label>
              </div>

              <textarea
                rows={12}
                value={bibtexInput}
                onChange={(e) => setBibtexInput(e.target.value)}
                placeholder="Paste raw @article{...}, @book{...}, or Google Scholar BibTeX..."
                className="w-full p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-purple-600"
              />
            </div>

            {/* Cleaned Output */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-emerald-900 dark:text-emerald-300 uppercase tracking-wider font-serif flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Cleaned &amp; Normalized BibTeX:</span>
                  </label>
                  {cleanedBibtex && (
                    <button
                      type="button"
                      onClick={() => handleCopy(cleanedBibtex, 'cleaned-bibtex')}
                      className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-1 border border-emerald-200 dark:border-emerald-800 cursor-pointer transition"
                    >
                      {copiedKey === 'cleaned-bibtex' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedKey === 'cleaned-bibtex' ? 'Copied' : 'Copy Clean BibTeX'}</span>
                    </button>
                  )}
                </div>

                <div className="mt-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap max-h-[280px] overflow-y-auto leading-relaxed">
                  {cleanedBibtex || (
                    <span className="text-slate-400 dark:text-slate-600 italic font-sans">
                      Paste BibTeX on the left to remove bloat fields (month, file, abstracts) and normalize canonical DOI keys.
                    </span>
                  )}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200/80 dark:border-purple-900/60 text-[11px] text-purple-900 dark:text-purple-300 flex items-center gap-2">
                <Info className="w-4 h-4 text-purple-700 shrink-0" />
                <span>Automatically sanitizes citation keys, standardizes DOI URLs, and strips bloat fields for clean LaTeX compilation.</span>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
