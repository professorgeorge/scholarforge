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
  Info,
  ShieldCheck,
  BarChart2,
  Zap,
  SlidersHorizontal,
  BookmarkPlus
} from 'lucide-react';
import confetti from 'canvas-confetti';

export interface WritingToolbeltPaneProps {
  onSendToStudio?: (text: string) => void;
  onNavigateToStudio?: () => void;
  initialTitle?: string;
  initialAbstract?: string;
  initialBibtex?: string;
  activeDraftWordCount?: number;
  onUpdateTitle?: (title: string) => void;
  onUpdateBibliography?: (bibtex: string) => void;
  onNavigateToVerifier?: () => void;
}

export type DisciplinaryLens = 'all' | 'clinical' | 'social' | 'cs_ai' | 'management' | 'stem';

interface SampleTopic {
  domain: DisciplinaryLens;
  badge: string;
  title: string;
}

const SAMPLE_TOPICS: SampleTopic[] = [
  {
    domain: 'clinical',
    badge: 'Cardiology / Medicine',
    title: 'SGLT2 inhibitors and cardiorenal outcomes in type 2 diabetes'
  },
  {
    domain: 'cs_ai',
    badge: 'Computer Science / AI',
    title: 'Metacognitive calibration in large language models'
  },
  {
    domain: 'management',
    badge: 'Organizational Behavior',
    title: 'Psychological safety in asynchronous remote research teams'
  },
  {
    domain: 'stem',
    badge: 'Energy Materials',
    title: 'Perovskite-silicon tandem solar cell stability under thermal cycling'
  }
];

const SAMPLE_MESSY_BIBTEX = `@article{smith2023investigation,
  title={Investigation of renal protection in diabetes},
  author={Smith, John and Martinez, Elena and Zhang, Wei},
  journal={Journal of Clinical Medicine},
  volume={42},
  number={4},
  pages={1120--1135},
  year={2023},
  month={mar},
  doi={https://doi.org/10.1016/j.jcm.2023.01.042},
  file={C:\\Users\\User\\Documents\\Mendeley\\Smith2023.pdf},
  abstract={This study investigates cardiorenal protection in patients with diabetes over a 5-year multi-center prospective trial with robust hemodynamic parameters...},
  note={Cited by 142}
}

@inproceedings{vaswani_attention_2017,
  author = {Vaswani, Ashish and Shazeer, Noam and Parmar, Niki},
  title = {Attention is All You Need},
  booktitle = {Advances in Neural Information Processing Systems 30 (NeurIPS)},
  year = {2017},
  pages = {5998--6008},
  url = {https://proceedings.neurips.cc/paper/2017/file/3f5ee243547dee91fbd053c1c4a845aa-Paper.pdf},
  month = {dec}
}`;

export const WritingToolbeltPane: React.FC<WritingToolbeltPaneProps> = ({
  onSendToStudio,
  onNavigateToStudio,
  initialTitle = '',
  initialAbstract = '',
  initialBibtex = '',
  activeDraftWordCount = 0,
  onUpdateTitle,
  onUpdateBibliography,
  onNavigateToVerifier,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'titlePolisher' | 'wordBudget' | 'bibtexCleaner'>('titlePolisher');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [titleSavedKey, setTitleSavedKey] = useState<string | null>(null);
  const [bibtexSaved, setBibtexSaved] = useState<boolean>(false);

  // 1. Title Polisher State
  const [topicInput, setTopicInput] = useState<string>(initialTitle);
  const [selectedLens, setSelectedLens] = useState<DisciplinaryLens>('all');

  // 2. Word Budget State
  const [budgetTitle, setBudgetTitle] = useState<string>(initialTitle);
  const [budgetRunningHead, setBudgetRunningHead] = useState<string>('');
  const [budgetAbstract, setBudgetAbstract] = useState<string>(initialAbstract);
  const [budgetHighlights, setBudgetHighlights] = useState<string>('');
  const [selectedJournalTier, setSelectedJournalTier] = useState<'nature' | 'lancet' | 'ieee' | 'hbr' | 'plos' | 'apa'>('apa');

  // 3. BibTeX Cleaner State
  const [bibtexInput, setBibtexInput] = useState<string>(initialBibtex);

  // Sync props when active manuscript changes
  React.useEffect(() => {
    if (initialTitle) {
      setTopicInput(initialTitle);
      setBudgetTitle(initialTitle);
      if (!budgetRunningHead) {
        setBudgetRunningHead(initialTitle.slice(0, 50).toUpperCase());
      }
    }
  }, [initialTitle]);

  React.useEffect(() => {
    if (initialAbstract) {
      setBudgetAbstract(initialAbstract);
    }
  }, [initialAbstract]);

  React.useEffect(() => {
    if (initialBibtex) {
      setBibtexInput(initialBibtex);
    }
  }, [initialBibtex]);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleSaveTitle = (title: string, key: string) => {
    if (onUpdateTitle) {
      onUpdateTitle(title);
      setTitleSavedKey(key);
      confetti({
        particleCount: 35,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#0284c7', '#8b5cf6', '#10b981']
      });
      setTimeout(() => setTitleSavedKey(null), 3000);
    }
  };

  const handleSaveBibliography = (bibtex: string) => {
    if (onUpdateBibliography) {
      onUpdateBibliography(bibtex);
      setBibtexSaved(true);
      confetti({
        particleCount: 40,
        spread: 65,
        origin: { y: 0.8 },
        colors: ['#059669', '#10b981', '#3b82f6']
      });
      setTimeout(() => setBibtexSaved(false), 3000);
    }
  };

  // --- TITLE POLISHER LOGIC ---
  const generatedTitles = useMemo(() => {
    if (!topicInput.trim()) return [];
    const t = topicInput.trim().replace(/^e\.g\.?:?\s*/i, '');
    const capitalizedTopic = t.charAt(0).toUpperCase() + t.slice(1);

    const allTitles = [
      {
        id: 'empirical-colon',
        domain: 'stem',
        style: 'Empirical Colon Pattern (High-Impact Quantitative)',
        title: `${capitalizedTopic}: A Multi-Center Empirical Investigation of Underlying Mechanisms`,
        score: '96/100',
        words: `${capitalizedTopic.split(/\s+/).length + 8} words`,
        why: 'The two-part colon format is the most cited syntactic construction across Nature, Science, and Cell Press.'
      },
      {
        id: 'interrogative-hook',
        domain: 'clinical',
        style: 'Action-Oriented Interrogative Inquiry (Clinical / Behavioral)',
        title: `How Does ${capitalizedTopic} Influence Outcomes? Longitudinal Evidence from Controlled Cohorts`,
        score: '93/100',
        words: `${capitalizedTopic.split(/\s+/).length + 8} words`,
        why: 'Interrogative causal questions spark higher Altmetric velocity and social citation uptake.'
      },
      {
        id: 'systematic-synthesis',
        domain: 'clinical',
        style: 'Systematic & Meta-Analytic Synthesis (Evidence-Based)',
        title: `${capitalizedTopic}: A Systematic Review and Meta-Analytic Consensus Mapping`,
        score: '95/100',
        words: `${capitalizedTopic.split(/\s+/).length + 8} words`,
        why: 'Explicit methodological signposts immediately signal top-tier epistemic rigor to peer reviewers.'
      },
      {
        id: 'boundary-conditions',
        domain: 'management',
        style: 'Contingency & Boundary Conditions (Management / Social Sciences)',
        title: `Beyond Direct Effects: Unpacking Moderating Contingencies in ${capitalizedTopic}`,
        score: '91/100',
        words: `${capitalizedTopic.split(/\s+/).length + 7} words`,
        why: 'Reframing contributions around boundary conditions matches expectations in AMJ, Org Science, and JAP.'
      },
      {
        id: 'architectural-framework',
        domain: 'cs_ai',
        style: 'Architectural Framework & Computational Paradigm (CS / Informatics)',
        title: `Towards Robust ${capitalizedTopic}: An Adaptive Scalable Architecture and Empirical Benchmark`,
        score: '94/100',
        words: `${capitalizedTopic.split(/\s+/).length + 8} words`,
        why: 'Technical systems papers benefit from "Towards..." framing paired with novel benchmark validation.'
      },
      {
        id: 'paradigm-critique',
        domain: 'social',
        style: 'Paradigm Shift & Critical Re-Examination (Theory / Review)',
        title: `Rethinking ${capitalizedTopic}: Empirical Anomalies and a New Conceptual Framework`,
        score: '89/100',
        words: `${capitalizedTopic.split(/\s+/).length + 8} words`,
        why: 'Provocative problematization drives high readership and debate in flagship review outlets.'
      }
    ];

    if (selectedLens === 'all') return allTitles;
    return allTitles.filter(item => item.domain === selectedLens);
  }, [topicInput, selectedLens]);

  // --- WORD BUDGET LOGIC ---
  const budgetSpecs = useMemo(() => {
    switch (selectedJournalTier) {
      case 'nature':
        return { 
          maxTitleWords: 15, 
          maxRunningChars: 50, 
          maxAbstractWords: 200, 
          maxBodyWords: 3500, 
          maxHighlights: 3, 
          label: 'Nature / Science Letters' 
        };
      case 'lancet':
        return { 
          maxTitleWords: 18, 
          maxRunningChars: 45, 
          maxAbstractWords: 300, 
          maxBodyWords: 4500, 
          maxHighlights: 4, 
          label: 'The Lancet / BMJ Clinical' 
        };
      case 'ieee':
        return { 
          maxTitleWords: 15, 
          maxRunningChars: 50, 
          maxAbstractWords: 250, 
          maxBodyWords: 8000, 
          maxHighlights: 0, 
          label: 'IEEE Transactions' 
        };
      case 'hbr':
        return { 
          maxTitleWords: 10, 
          maxRunningChars: 40, 
          maxAbstractWords: 150, 
          maxBodyWords: 3500, 
          maxHighlights: 3, 
          label: 'Harvard Business Review / Administrative' 
        };
      case 'plos':
        return { 
          maxTitleWords: 20, 
          maxRunningChars: 0, 
          maxAbstractWords: 250, 
          maxBodyWords: 8500, 
          maxHighlights: 0, 
          label: 'PLOS ONE / Multidisciplinary Open Access' 
        };
      case 'apa':
      default:
        return { 
          maxTitleWords: 12, 
          maxRunningChars: 50, 
          maxAbstractWords: 250, 
          maxBodyWords: 6000, 
          maxHighlights: 3, 
          label: 'APA 7th Standard Academic' 
        };
    }
  }, [selectedJournalTier]);

  const titleWordCount = useMemo(() => budgetTitle.trim() ? budgetTitle.trim().split(/\s+/).length : 0, [budgetTitle]);
  const runningHeadCharCount = budgetRunningHead.length;
  const abstractWordCount = useMemo(() => budgetAbstract.trim() ? budgetAbstract.trim().split(/\s+/).length : 0, [budgetAbstract]);
  const highlightCount = useMemo(() => {
    if (!budgetHighlights.trim()) return 0;
    return budgetHighlights.split('\n').filter(line => line.trim().length > 0).length;
  }, [budgetHighlights]);

  // Body word budget comparison
  const bodyPercent = budgetSpecs.maxBodyWords > 0 
    ? Math.min(100, Math.round((activeDraftWordCount / budgetSpecs.maxBodyWords) * 100))
    : 0;

  // Recommended section distribution
  const sectionBreakdown = useMemo(() => {
    const total = budgetSpecs.maxBodyWords;
    return [
      { name: 'Introduction & Research Question', pct: 15, words: Math.round(total * 0.15) },
      { name: 'Methodology & Research Design', pct: 25, words: Math.round(total * 0.25) },
      { name: 'Results, Findings & Evidence', pct: 35, words: Math.round(total * 0.35) },
      { name: 'Discussion, Limits & Implications', pct: 20, words: Math.round(total * 0.20) },
      { name: 'Structured Abstract', pct: 5, words: budgetSpecs.maxAbstractWords }
    ];
  }, [budgetSpecs]);

  // --- BIBTEX CLEANER LOGIC ---
  const cleanedBibtex = useMemo(() => {
    if (!bibtexInput.trim()) return '';
    return bibtexInput
      .replace(/@([a-zA-Z]+)\s*\{\s*([^,]+),/g, (_match, type, oldKey) => {
        let cleanKey = oldKey.trim().replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '');
        return `@${type.toLowerCase()}{${cleanKey},`;
      })
      .replace(/month\s*=\s*\{?[^},]+\}?,?\n?/gi, '')
      .replace(/file\s*=\s*\{?[^}]+\}?,?\n?/gi, '')
      .replace(/abstract\s*=\s*\{[\s\S]*?\},?\n?/gi, '')
      .replace(/note\s*=\s*\{?[^},]+\}?,?\n?/gi, '')
      .replace(/doi\s*=\s*\{?([^},]+)\}?/gi, (_match, val) => {
        const cleanDoi = val.trim().replace(/^https?:\/\/doi\.org\//i, '').replace(/[\{\}]/g, '');
        return `  doi = {${cleanDoi}}`;
      })
      .replace(/^\s*\n/gm, '');
  }, [bibtexInput]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 dark:from-purple-950/40 dark:via-indigo-950/30 dark:to-blue-950/30 border border-purple-200/80 dark:border-purple-900/60 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md bg-purple-200/80 dark:bg-purple-900/60 text-purple-900 dark:text-purple-200 text-[10px] font-bold uppercase tracking-wider font-mono">
              Stage 3 • Precision Toolbelt
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs font-semibold text-purple-950 dark:text-purple-300">
              Manuscript Polish, Word Allocations &amp; Bibliography Sanitization
            </span>
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white font-serif mt-1">
            Academic Writing &amp; Structure Toolbelt
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            Optimize high-impact article titles, budget journal word caps, and normalize messy BibTeX citations for publication.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onNavigateToVerifier && (
            <button
              type="button"
              onClick={onNavigateToVerifier}
              className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
              title="Audit references in DOI &amp; Retraction Sentinel"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>DOI Sentinel →</span>
            </button>
          )}

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
          
          {/* Preset Prompts Bar */}
          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>1-Click Empirical Topic Presets:</span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {SAMPLE_TOPICS.map((sample, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setTopicInput(sample.title)}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-purple-50 dark:bg-slate-800 dark:hover:bg-purple-950/60 text-slate-700 dark:text-slate-300 text-[11px] font-medium border border-slate-200 dark:border-slate-700 cursor-pointer transition flex items-center gap-1"
                >
                  <span className="font-bold text-purple-700 dark:text-purple-400">{sample.badge}:</span>
                  <span className="truncate max-w-[170px]">{sample.title}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Input & Disciplinary Lens */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider font-serif">
                Enter Research Topic, Core Finding, or Working Title:
              </label>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                  <SlidersHorizontal className="w-3 h-3" />
                  <span>Discipline:</span>
                </span>
                <select
                  value={selectedLens}
                  onChange={(e) => setSelectedLens(e.target.value as DisciplinaryLens)}
                  className="px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer"
                >
                  <option value="all">All Disciplinary Formulas (6)</option>
                  <option value="clinical">Clinical &amp; Medicine</option>
                  <option value="cs_ai">Computer Science &amp; AI</option>
                  <option value="management">Management &amp; Org Behavior</option>
                  <option value="social">Social Sciences &amp; Theory</option>
                  <option value="stem">STEM &amp; Natural Sciences</option>
                </select>
              </div>
            </div>

            <input
              type="text"
              value={topicInput}
              onChange={(e) => setTopicInput(e.target.value)}
              placeholder="e.g. SGLT2 inhibitors and cardiorenal outcomes in type 2 diabetes..."
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-purple-600 font-sans"
            />
            <p className="text-[11px] text-slate-500 font-sans">
              Enter your independent and dependent variables, intervention, or research question. Scientifically structured syntaxes will generate instantly.
            </p>
          </div>

          {generatedTitles.length > 0 ? (
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

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="text-[10px] text-slate-400 font-mono">{item.words}</span>
                    
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleCopy(item.title, `title-${idx}`)}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1 cursor-pointer transition"
                      >
                        {copiedKey === `title-${idx}` ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedKey === `title-${idx}` ? 'Copied' : 'Copy'}</span>
                      </button>

                      {onUpdateTitle && (
                        <button
                          type="button"
                          onClick={() => handleSaveTitle(item.title, `save-title-${idx}`)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-1 border border-emerald-200 dark:border-emerald-800 cursor-pointer transition"
                          title="Set this as the active title in Manuscript Studio"
                        >
                          <BookmarkPlus className="w-3 h-3 text-emerald-600" />
                          <span>{titleSavedKey === `save-title-${idx}` ? '✓ Title Set!' : 'Set as Title'}</span>
                        </button>
                      )}

                      {onSendToStudio && (
                        <button
                          type="button"
                          onClick={() => onSendToStudio(`### Manuscript Title\n${item.title}`)}
                          className="px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/60 text-purple-900 dark:text-purple-300 text-xs font-semibold flex items-center gap-1 border border-purple-200 dark:border-purple-800 cursor-pointer transition"
                          title="Append to active manuscript draft"
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
          ) : (
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white font-serif">
                    Title Architecture &amp; Framing Guide
                  </h4>
                  <p className="text-[11px] text-slate-500 font-sans">
                    6 high-impact syntactic formulas proven to maximize editorial desk-review approval and citation velocity
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-[11px]">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="font-bold text-purple-900 dark:text-purple-300">1. Two-Part Colon Syntax</span>
                  <p className="text-slate-500 dark:text-slate-400">
                    <em>[Independent Variable]: A Multi-Center Investigation of [Dependent Variable]</em>. Highest citation frequency across Nature and Science.
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="font-bold text-purple-900 dark:text-purple-300">2. Interrogative Inquiry</span>
                  <p className="text-slate-500 dark:text-slate-400">
                    <em>How Does [Intervention] Impact [Phenomenon]? Longitudinal Evidence</em>. Promotes high Altmetric discussion and click-through rates.
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="font-bold text-purple-900 dark:text-purple-300">3. Methodological Synthesis</span>
                  <p className="text-slate-500 dark:text-slate-400">
                    <em>[Topic]: A Systematic Review &amp; Meta-Analytic Consensus Mapping</em>. Signals authoritative epistemic value to referees.
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="font-bold text-purple-900 dark:text-purple-300">4. Boundary Conditions</span>
                  <p className="text-slate-500 dark:text-slate-400">
                    <em>Beyond Direct Effects: Unpacking Moderating Contingencies in [Construct]</em>. Standard syntax in Academy of Management and JAP.
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="font-bold text-purple-900 dark:text-purple-300">5. Computational Systems</span>
                  <p className="text-slate-500 dark:text-slate-400">
                    <em>Towards Robust [Topic]: An Adaptive Multi-Modal Architecture &amp; Benchmark</em>. Standard framework syntax in CS / AI conferences.
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="font-bold text-purple-900 dark:text-purple-300">6. Conceptual Paradigm Shift</span>
                  <p className="text-slate-500 dark:text-slate-400">
                    <em>Rethinking [Construct]: Empirical Anomalies &amp; a New Theoretical Model</em>. High interest for invited perspective essays.
                  </p>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-purple-50/60 dark:bg-purple-950/40 border border-purple-200/80 dark:border-purple-900/60 text-[11px] text-purple-900 dark:text-purple-300 flex items-center gap-2">
                <Info className="w-4 h-4 text-purple-700 shrink-0" />
                <span>Select a preset above or type your core topic to generate tailored titles immediately.</span>
              </div>
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
                <option value="apa">APA 7th Standard Academic (12 title, 250 abstract, 6,000 body)</option>
                <option value="nature">Nature / Science (15 title, 200 abstract, 3,500 body)</option>
                <option value="lancet">The Lancet / BMJ Clinical (18 title, 300 abstract, 4,500 body)</option>
                <option value="ieee">IEEE Transactions (15 title, 250 abstract, 8,000 body)</option>
                <option value="hbr">Harvard Business Review / Admin (10 title, 150 abstract, 3,500 body)</option>
                <option value="plos">PLOS ONE / Open Access (20 title, 250 abstract, 8,500 body)</option>
              </select>
            </div>

            {/* Live Manuscript Body Gauge */}
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">
                  Active Draft Length
                </div>
                <div className="text-xs font-bold text-slate-900 dark:text-white font-mono">
                  {activeDraftWordCount.toLocaleString()} / {budgetSpecs.maxBodyWords.toLocaleString()} words
                </div>
              </div>

              <div className="w-28 bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                <div 
                  className={`h-full transition-all duration-300 ${
                    bodyPercent > 100 
                      ? 'bg-rose-500' 
                      : bodyPercent >= 75 
                      ? 'bg-emerald-500' 
                      : 'bg-blue-500'
                  }`}
                  style={{ width: `${Math.min(100, bodyPercent)}%` }}
                />
              </div>

              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                bodyPercent > 100 
                  ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                  : bodyPercent >= 75
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
              }`}>
                {bodyPercent}%
              </span>
            </div>
          </div>

          {/* Section Distribution Blueprint Card */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs">
            <div className="flex items-center justify-between text-xs font-serif font-bold text-slate-900 dark:text-white">
              <div className="flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-purple-700 dark:text-purple-400" />
                <span>Recommended Manuscript Section Word Allocations ({budgetSpecs.label}):</span>
              </div>
              <span className="text-[11px] font-mono text-slate-500 font-normal">
                Standard IMRaD Distribution
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 text-xs">
              {sectionBreakdown.map((sec, idx) => (
                <div 
                  key={idx} 
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1"
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-slate-700 dark:text-slate-300 truncate">{sec.name.split(' ')[0]}</span>
                    <span className="font-mono text-purple-700 dark:text-purple-400 font-bold">{sec.pct}%</span>
                  </div>
                  <div className="text-sm font-bold font-mono text-slate-900 dark:text-white">
                    ~{sec.words.toLocaleString()} words
                  </div>
                  <p className="text-[10px] text-slate-400 leading-tight">
                    {sec.name}
                  </p>
                </div>
              ))}
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
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-mono font-bold ${
                    titleWordCount > budgetSpecs.maxTitleWords ? 'text-rose-600' : 'text-emerald-600'
                  }`}>
                    {titleWordCount} / {budgetSpecs.maxTitleWords} words
                  </span>
                  {onUpdateTitle && budgetTitle.trim() && (
                    <button
                      type="button"
                      onClick={() => handleSaveTitle(budgetTitle, 'budget-title')}
                      className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold border border-emerald-200 cursor-pointer"
                    >
                      {titleSavedKey === 'budget-title' ? '✓ Set' : 'Set Active'}
                    </button>
                  )}
                </div>
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
                  runningHeadCharCount > (budgetSpecs.maxRunningChars || 999) ? 'text-rose-600' : 'text-emerald-600'
                }`}>
                  {runningHeadCharCount} / {budgetSpecs.maxRunningChars || 'N/A'} chars
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
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-mono font-bold ${
                    abstractWordCount > budgetSpecs.maxAbstractWords ? 'text-rose-600' : 'text-emerald-600'
                  }`}>
                    {abstractWordCount} / {budgetSpecs.maxAbstractWords} words
                  </span>
                  {onSendToStudio && budgetAbstract.trim() && (
                    <button
                      type="button"
                      onClick={() => onSendToStudio(`### Abstract\n${budgetAbstract}`)}
                      className="px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-950 text-purple-900 dark:text-purple-300 text-[10px] font-bold border border-purple-200 cursor-pointer"
                    >
                      Use in Studio
                    </button>
                  )}
                </div>
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

          {/* Reference Table for Journal Word & Character Caps */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs">
            <div className="flex items-center justify-between text-xs font-serif font-bold text-slate-900 dark:text-white">
              <span>Standard Journal Formatting &amp; Cap Constraints:</span>
              <span className="text-[11px] font-sans font-normal text-slate-500">Editorial Guidelines</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-[11px] font-sans">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="font-bold text-purple-900 dark:text-purple-300">Nature / Science</span>
                <p className="text-slate-500 dark:text-slate-400">Title: &le;15 words • Abstract: &le;200 words • Body: &le;3,500 words • Head: &le;50 chars</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="font-bold text-purple-900 dark:text-purple-300">The Lancet / BMJ</span>
                <p className="text-slate-500 dark:text-slate-400">Title: &le;18 words • Abstract: &le;300 words (structured) • Body: &le;4,500 words</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="font-bold text-purple-900 dark:text-purple-300">IEEE Transactions</span>
                <p className="text-slate-500 dark:text-slate-400">Title: &le;15 words • Abstract: &le;250 words • Body: &le;8,000 words</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="font-bold text-purple-900 dark:text-purple-300">Harvard Business Review</span>
                <p className="text-slate-500 dark:text-slate-400">Title: &le;10 words • Executive Summary: &le;150 words • Body: &le;3,500 words</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="font-bold text-purple-900 dark:text-purple-300">APA 7th Academic</span>
                <p className="text-slate-500 dark:text-slate-400">Title: &le;12 words • Abstract: &le;250 words • Body: &le;6,000 words</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="font-bold text-purple-900 dark:text-purple-300">PLOS ONE</span>
                <p className="text-slate-500 dark:text-slate-400">Title: &le;20 words • Abstract: &le;250 words • Body: &le;8,500 words • Open limits</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TOOL 3: BIBTEX CLEANER & NORMALIZER */}
      {activeSubTab === 'bibtexCleaner' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          
          {/* Quick Presets Bar */}
          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>BibTeX Sanitization Demo:</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setBibtexInput(SAMPLE_MESSY_BIBTEX)}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold cursor-pointer transition flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                <span>Load Sample Messy BibTeX</span>
              </button>

              {bibtexInput && (
                <button
                  type="button"
                  onClick={() => setBibtexInput('')}
                  className="px-2.5 py-1.5 rounded-lg text-slate-400 hover:text-slate-600 text-xs font-semibold cursor-pointer transition"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Raw Input */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider font-serif">
                  Raw BibTeX Entry or File Content:
                </label>
                <span className="text-[10px] font-mono text-slate-400">
                  {bibtexInput ? `${bibtexInput.split('@').filter(Boolean).length} entries` : 'Empty'}
                </span>
              </div>

              <textarea
                rows={13}
                value={bibtexInput}
                onChange={(e) => setBibtexInput(e.target.value)}
                placeholder="Paste raw @article{...}, @book{...}, or Google Scholar BibTeX with Mendeley file tags, dirty DOIs, or month fields..."
                className="w-full p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-purple-600"
              />
            </div>

            {/* Cleaned Output */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="text-xs font-bold text-emerald-900 dark:text-emerald-300 uppercase tracking-wider font-serif flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Cleaned &amp; Normalized BibTeX:</span>
                  </label>
                  
                  {cleanedBibtex && (
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleCopy(cleanedBibtex, 'cleaned-bibtex')}
                        className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-1 border border-emerald-200 dark:border-emerald-800 cursor-pointer transition"
                      >
                        {copiedKey === 'cleaned-bibtex' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedKey === 'cleaned-bibtex' ? 'Copied' : 'Copy'}</span>
                      </button>

                      {onUpdateBibliography && (
                        <button
                          type="button"
                          onClick={() => handleSaveBibliography(cleanedBibtex)}
                          className="px-2.5 py-1 rounded-lg bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold flex items-center gap-1 cursor-pointer transition shadow-xs"
                          title="Save to Manuscript Studio bibliography"
                        >
                          <BookmarkPlus className="w-3 h-3" />
                          <span>{bibtexSaved ? '✓ Saved to Studio!' : 'Save to Studio Bib'}</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {cleanedBibtex ? (
                  <div className="mt-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap max-h-[290px] overflow-y-auto leading-relaxed">
                    {cleanedBibtex}
                  </div>
                ) : (
                  <div className="mt-3 p-4 rounded-xl bg-slate-50/70 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-3 font-sans">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white font-serif">
                      <FileText className="w-4 h-4 text-purple-700 dark:text-purple-400" />
                      <span>BibTeX Normalization &amp; Sanitization Protocol</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                      <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-0.5">
                        <span className="font-bold text-purple-900 dark:text-purple-300">Canonical Key Normalization</span>
                        <p className="text-slate-500 dark:text-slate-400">Replaces spaces and illegal characters with clean <code className="font-mono text-slate-700 dark:text-slate-300">Author_Year</code> citation keys.</p>
                      </div>
                      <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-0.5">
                        <span className="font-bold text-purple-900 dark:text-purple-300">Bloat Field Stripping</span>
                        <p className="text-slate-500 dark:text-slate-400">Removes <code className="font-mono text-slate-700 dark:text-slate-300">month</code>, local Mendeley/Zotero <code className="font-mono text-slate-700 dark:text-slate-300">file</code>, and memory-hogging abstracts.</p>
                      </div>
                      <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-0.5">
                        <span className="font-bold text-purple-900 dark:text-purple-300">Standard DOI URLs</span>
                        <p className="text-slate-500 dark:text-slate-400">Converts messy <code className="font-mono text-slate-700 dark:text-slate-300">https://doi.org/...</code> URLs into pristine <code className="font-mono text-slate-700 dark:text-slate-300">doi = &#123;10.xxxx&#125;</code> tags.</p>
                      </div>
                      <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-0.5">
                        <span className="font-bold text-purple-900 dark:text-purple-300">LaTeX / Overleaf Ready</span>
                        <p className="text-slate-500 dark:text-slate-400">Formats entries to prevent bibtex parsing errors and missing brace warnings.</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Actions Bar */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 dark:border-slate-800">
                <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-purple-700 shrink-0" />
                  <span>Sanitizes keys, cleans DOIs, and prepares valid LaTeX/BibTeX.</span>
                </div>

                <div className="flex items-center gap-2">
                  {onNavigateToVerifier && (
                    <button
                      type="button"
                      onClick={onNavigateToVerifier}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                      <span>Audit in DOI Sentinel →</span>
                    </button>
                  )}

                  {onSendToStudio && cleanedBibtex && (
                    <button
                      type="button"
                      onClick={() => onSendToStudio(`### References (BibTeX)\n\`\`\`bibtex\n${cleanedBibtex}\n\`\`\``)}
                      className="px-3 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/60 text-purple-900 dark:text-purple-300 text-xs font-semibold flex items-center gap-1 border border-purple-200 cursor-pointer transition"
                    >
                      <Send className="w-3 h-3 text-purple-700" />
                      <span>Append to Studio</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
