import React, { useState, useMemo } from 'react';
import {
  Wrench,
  ShieldCheck,
  Check,
  Copy,
  Sparkles,
  X,
  AlertTriangle,
  BookOpen,
  AlignLeft
} from 'lucide-react';
import { IrbTriagePane } from './IrbTriagePane';

export interface AcademicToolbeltProps {
  isOpen: boolean;
  onClose: () => void;
  initialToolId?: string;
  onSendToStudio?: (text: string) => void;
}

export type ToolbeltToolId = 'anonymizer' | 'wordBudget' | 'bibtexCleaner' | 'titlePolisher' | 'irbTriage';

export const AcademicToolbeltModal: React.FC<AcademicToolbeltProps> = ({
  isOpen,
  onClose,
  initialToolId = 'anonymizer',
  onSendToStudio
}) => {
  const [activeTool, setActiveTool] = useState<ToolbeltToolId>(initialToolId as ToolbeltToolId);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // 1. Anonymizer State
  const [anonInput, setAnonInput] = useState<string>(
    `This research was conducted in the Department of Psychology at Harvard University under IRB Protocol #2023-891. As demonstrated in our earlier work (George & Smith, 2023), cognitive resilience buffers occupational distress. Funding was generously provided by the National Science Foundation (NSF Grant #SES-2049182). We thank Dr. Eleanor Vance at Stanford University for providing the preliminary sample data.`
  );

  // 2. Word Budget State
  const [budgetTitle, setBudgetTitle] = useState<string>('Cognitive Resilience and Moral Distress in Emergency Medicine: A Multi-Center Empirical Investigation');
  const [budgetRunningHead, setBudgetRunningHead] = useState<string>('RESILIENCE & DISTRESS IN EMERGENCY MEDICINE');
  const [budgetAbstract, setBudgetAbstract] = useState<string>(
    'Background: Healthcare professionals face unprecedented levels of moral distress and burnout in acute clinical environments. While psychological resilience has been proposed as a mitigating buffer, empirical mechanisms linking institutional autonomy and team safety remain contested.\n\nMethods: We conducted a multi-center cross-sectional investigation across 1,200 emergency department practitioners, deploying structural equation modeling and moderated regression.\n\nResults: Psychological safety significantly moderated the inverse relationship between work overload and performance (beta = 0.28, p < .001). Furthermore, team autonomy explained 34% of variance in retention intention.\n\nConclusions: Strategic organizational interventions prioritizing psychological safety yield measurable improvements in clinician retention and patient outcome metrics.'
  );
  const [budgetHighlights, setBudgetHighlights] = useState<string>(
    `1. Emergency practitioners experience significant moral distress under severe clinical constraints.\n2. Team psychological safety buffers the detrimental effect of high patient acuity.\n3. Institutional autonomy explains 34% of long-term clinician retention variance.`
  );

  // 3. BibTeX Cleaner State
  const [bibtexInput, setBibtexInput] = useState<string>(
    `@article{10.1038/s41586-021-03819-2,\n  author = {Vaswani, Ashish and Shazeer, Noam and Parmar, Niki},\n  title = {Attention is all you need},\n  journal = {Advances in Neural Information Processing Systems},\n  year = {2017},\n  volume = {30}\n}`
  );
  const [keyConvention, setKeyConvention] = useState<'authorYear' | 'authorYearTitle' | 'authorYearJournal'>('authorYearTitle');

  // 4. Title Polisher State
  const [topicInput, setTopicInput] = useState<string>('AI in higher education, student critical thinking, and automated feedback systems');

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  // --- ANONYMIZER LOGIC ---
  const anonymizedOutput = useMemo(() => {
    if (!anonInput.trim()) return '';

    let text = anonInput;

    // 1. Self-citation patterns (e.g. "our previous work (Author, 2022)" or "as we showed in Author (2020)")
    text = text.replace(/(?:in\s+our\s+(?:previous|earlier|prior)\s+(?:work|study|investigation|paper)|as\s+(?:we|the\s+authors)\s+(?:showed|demonstrated|reported))\s*\(([^)]+)\)/gi,
      `[Self-citation and author identification redacted for double-blind review]`
    );

    // 2. Institutional names & Universities
    text = text.replace(/\b(?:at|from|conducted\s+at)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:University|College|Institute|Hospital|Center|School\s+of\s+[A-Z][a-z]+))\b/g,
      `[Institutional affiliation redacted for double-blind review]`
    );

    // 3. IRB / Ethics protocol numbers
    text = text.replace(/\b(?:IRB|Ethics\s+Committee|Protocol|Approval|Human\s+Subjects)\s*(?:#|No\.|Number)?\s*[:\s]*[A-Z0-9-]{4,15}\b/gi,
      `[IRB Protocol Number Redacted]`
    );

    // 4. Grant and Funding identifiers
    text = text.replace(/\b(?:Grant|Award|Contract|Funder|NSF|NIH|CIHR|ESRC|ERC)\s*(?:#|No\.|Number)?\s*[:\s]*[A-Z0-9-]{4,20}\b/gi,
      `[Grant ID Redacted]`
    );

    // 5. Explicit acknowledgments sentences
    text = text.replace(/(?:We\s+thank|The\s+authors\s+gratefully\s+acknowledge|Special\s+thanks\s+to)\s+[^.]+?\./gi,
      `[Acknowledgments statement redacted for double-blind review].`
    );

    return text;
  }, [anonInput]);

  // --- WORD BUDGET METRICS ---
  const budgetStats = useMemo(() => {
    const countWords = (s: string) => s.trim() ? s.trim().split(/\s+/).length : 0;
    const countChars = (s: string) => s.length;

    const titleWords = countWords(budgetTitle);
    const runningHeadChars = countChars(budgetRunningHead);
    const abstractWords = countWords(budgetAbstract);
    const highlightLines = budgetHighlights.split('\n').filter((l) => l.trim().length > 0);

    return {
      titleWords,
      titleMaxWords: 15,
      isTitleOver: titleWords > 15,
      runningHeadChars,
      runningHeadMaxChars: 50,
      isRunningHeadOver: runningHeadChars > 50,
      abstractWords,
      abstractMaxWords: 250,
      isAbstractOver: abstractWords > 250,
      highlights: highlightLines.map((line) => {
        const cleaned = line.replace(/^\d+[\.\)]\s*/, '').trim();
        return {
          text: cleaned,
          chars: cleaned.length,
          maxChars: 85,
          isOver: cleaned.length > 85
        };
      })
    };
  }, [budgetTitle, budgetRunningHead, budgetAbstract, budgetHighlights]);

  // --- BIBTEX CLEANER LOGIC ---
  const cleanedBibtex = useMemo(() => {
    if (!bibtexInput.trim()) return '';

    // Match @article{key, or @book{key,
    const entryMatch = bibtexInput.match(/@([a-zA-Z]+)\s*\{\s*([^,]+),([\s\S]*)/i);
    if (!entryMatch) return bibtexInput;

    const entryType = entryMatch[1];
    const body = entryMatch[3];

    // Extract first author
    const authorMatch = body.match(/author\s*=\s*\{([^,}\n]+)/i);
    const authorLastName = authorMatch ? authorMatch[1].trim().split(/\s+/).pop()?.replace(/[^a-zA-Z]/g, '') || 'Author' : 'Author';

    // Extract year
    const yearMatch = body.match(/year\s*=\s*\{?(\d{4})\}?/i);
    const year = yearMatch ? yearMatch[1] : '2026';

    // Extract first title word
    const titleMatch = body.match(/title\s*=\s*\{([^,}\n]+)/i);
    let titleSlug = 'paper';
    if (titleMatch) {
      const words = titleMatch[1].trim().split(/\s+/).map((w) => w.toLowerCase().replace(/[^a-z0-9]/g, '')).filter((w) => !['a', 'an', 'the', 'in', 'on', 'of', 'for'].includes(w));
      if (words[0]) titleSlug = words[0];
    }

    let newKey = `${authorLastName}${year}`;
    if (keyConvention === 'authorYearTitle') {
      newKey = `${authorLastName.toLowerCase()}_${year}_${titleSlug}`;
    } else if (keyConvention === 'authorYearJournal') {
      const journalMatch = body.match(/journal\s*=\s*\{([^,}\n]+)/i);
      const jWord = journalMatch ? journalMatch[1].trim().split(/\s+/)[0].replace(/[^a-zA-Z]/g, '') : 'Journal';
      newKey = `${authorLastName}${year}${jWord}`;
    }

    return `@${entryType}{${newKey},${body}`;
  }, [bibtexInput, keyConvention]);

  // --- TITLE POLISHER LOGIC ---
  const generatedTitles = useMemo(() => {
    const raw = topicInput.trim() || 'empirical research';
    const clean = raw.replace(/[.,]/g, '').trim();

    return [
      {
        type: 'Metaphorical Hook : Empirical Subtitle',
        title: `Beyond the Black Box: How ${clean} Shapes Scholarly Trajectories`,
        runningHead: `BEYOND THE BLACK BOX IN ACADEMIA`
      },
      {
        type: 'Action / Inquiry Statement',
        title: `Does ${clean} Accelerate Discovery? A Multi-Center Empirical Triage`,
        runningHead: `ACCELERATING DISCOVERY IN EMPIRICAL INQUIRY`
      },
      {
        type: 'Methodological & Latent Modeling',
        title: `Mapping the Architecture of ${clean}: A Structural Equation and Moderation Analysis`,
        runningHead: `ARCHITECTURE AND MODERATION ANALYSIS`
      },
      {
        type: 'Translational & Impact Horizon',
        title: `From Theory to Praxis: Re-Evaluating ${clean} in Contemporary Research Ecosystems`,
        runningHead: `RE-EVALUATING CONTEMPORARY PRACTICE`
      }
    ];
  }, [topicInput]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      
      <div className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-900 text-white flex items-center justify-center shadow-xs">
              <Wrench className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold font-serif text-slate-900 dark:text-white">
                  Academic Toolbelt
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                  Essential Micro-Blades
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Zero-bloat scholarly utilities for peer-review compliance, budgeting, and citation hygiene.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-200/80 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tool Switcher Tabs */}
        <div className="px-5 pt-3 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-wrap gap-2 text-xs font-semibold">
          <button
            onClick={() => setActiveTool('anonymizer')}
            className={`px-3.5 py-2 rounded-xl flex items-center gap-2 transition cursor-pointer ${
              activeTool === 'anonymizer'
                ? 'bg-purple-900 text-white font-bold shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Double-Blind Anonymizer</span>
          </button>

          <button
            onClick={() => setActiveTool('wordBudget')}
            className={`px-3.5 py-2 rounded-xl flex items-center gap-2 transition cursor-pointer ${
              activeTool === 'wordBudget'
                ? 'bg-purple-900 text-white font-bold shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <AlignLeft className="w-4 h-4" />
            <span>Word &amp; Character Budget</span>
          </button>

          <button
            onClick={() => setActiveTool('bibtexCleaner')}
            className={`px-3.5 py-2 rounded-xl flex items-center gap-2 transition cursor-pointer ${
              activeTool === 'bibtexCleaner'
                ? 'bg-purple-900 text-white font-bold shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>BibTeX Key Standardizer</span>
          </button>

          <button
            onClick={() => setActiveTool('titlePolisher')}
            className={`px-3.5 py-2 rounded-xl flex items-center gap-2 transition cursor-pointer ${
              activeTool === 'titlePolisher'
                ? 'bg-purple-900 text-white font-bold shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Title &amp; Running Head</span>
          </button>

          <button
            onClick={() => setActiveTool('irbTriage')}
            className={`px-3.5 py-2 rounded-xl flex items-center gap-2 transition cursor-pointer ${
              activeTool === 'irbTriage'
                ? 'bg-purple-900 text-white font-bold shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>IRB &amp; Ethics Triage</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          
          {/* TOOL 1: DOUBLE-BLIND ANONYMIZER */}
          {activeTool === 'anonymizer' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 text-slate-700 dark:text-slate-300 space-y-1">
                <span className="font-bold block text-purple-950 dark:text-purple-300">
                  Pre-Submission Double-Blind Redaction Engine
                </span>
                <p className="text-[11px] text-slate-600 dark:text-slate-400">
                  Strips self-identifying first-person citations (&ldquo;in our earlier work&rdquo;), university affiliations, IRB protocol IDs, grant numbers, and acknowledgments before peer review.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                    <span>Draft Text / Introduction</span>
                    <span className="text-[11px] text-slate-400 font-normal">Original Manuscript</span>
                  </label>
                  <textarea
                    rows={9}
                    value={anonInput}
                    onChange={(e) => setAnonInput(e.target.value)}
                    className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-purple-600"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                      <span>Anonymized Version</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCopy(anonymizedOutput, 'anon-out')}
                        className="text-purple-700 dark:text-purple-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        {copiedKey === 'anon-out' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedKey === 'anon-out' ? 'Copied' : 'Copy'}</span>
                      </button>
                      {onSendToStudio && (
                        <button
                          onClick={() => {
                            onSendToStudio(anonymizedOutput);
                            onClose();
                          }}
                          className="px-2.5 py-1 rounded-lg bg-purple-900 hover:bg-purple-800 text-white font-bold text-[11px] cursor-pointer"
                        >
                          Send to Studio
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="w-full h-[180px] p-3 rounded-xl bg-slate-100 dark:bg-slate-950 border border-purple-200 dark:border-purple-900/60 text-xs font-mono text-slate-800 dark:text-slate-200 overflow-y-auto leading-relaxed">
                    {anonymizedOutput}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TOOL 2: WORD & CHARACTER BUDGET */}
          {activeTool === 'wordBudget' && (
            <div className="space-y-5">
              
              {/* Title Section */}
              <div className="space-y-2 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>Manuscript Title</span>
                    <span className={`text-[11px] font-mono px-2 py-0.5 rounded-md font-bold ${
                      budgetStats.isTitleOver
                        ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    }`}>
                      {budgetStats.titleWords} / {budgetStats.titleMaxWords} words
                    </span>
                  </label>
                  {budgetStats.isTitleOver && (
                    <span className="text-[11px] text-rose-600 font-bold flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Exceeds limit by {budgetStats.titleWords - budgetStats.titleMaxWords} words</span>
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  value={budgetTitle}
                  onChange={(e) => setBudgetTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-semibold focus:outline-none focus:border-purple-600"
                />
              </div>

              {/* Running Head Section */}
              <div className="space-y-2 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>Running Head (Short Header Title)</span>
                    <span className={`text-[11px] font-mono px-2 py-0.5 rounded-md font-bold ${
                      budgetStats.isRunningHeadOver
                        ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    }`}>
                      {budgetStats.runningHeadChars} / {budgetStats.runningHeadMaxChars} chars
                    </span>
                  </label>
                  {budgetStats.isRunningHeadOver && (
                    <span className="text-[11px] text-rose-600 font-bold flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Exceeds limit by {budgetStats.runningHeadChars - budgetStats.runningHeadMaxChars} chars</span>
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  value={budgetRunningHead}
                  onChange={(e) => setBudgetRunningHead(e.target.value.toUpperCase())}
                  className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-mono uppercase focus:outline-none focus:border-purple-600"
                />
              </div>

              {/* Abstract Section */}
              <div className="space-y-2 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>Structured Abstract</span>
                    <span className={`text-[11px] font-mono px-2 py-0.5 rounded-md font-bold ${
                      budgetStats.isAbstractOver
                        ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    }`}>
                      {budgetStats.abstractWords} / {budgetStats.abstractMaxWords} words
                    </span>
                  </label>
                  {budgetStats.isAbstractOver && (
                    <span className="text-[11px] text-rose-600 font-bold flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Exceeds limit by {budgetStats.abstractWords - budgetStats.abstractMaxWords} words</span>
                    </span>
                  )}
                </div>
                <textarea
                  rows={5}
                  value={budgetAbstract}
                  onChange={(e) => setBudgetAbstract(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs focus:outline-none focus:border-purple-600"
                />
              </div>

              {/* Highlights Section */}
              <div className="space-y-2 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <label className="font-bold text-slate-900 dark:text-white block">
                  Manuscript Highlights (Elsevier / Nature Format: &le; 85 characters each)
                </label>
                <textarea
                  rows={3}
                  value={budgetHighlights}
                  onChange={(e) => setBudgetHighlights(e.target.value)}
                  placeholder="Enter 3 to 5 bullet highlights, one per line..."
                  className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs focus:outline-none focus:border-purple-600 mb-2"
                />
                <div className="space-y-1.5">
                  {budgetStats.highlights.map((h, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
                      <span className="flex-1 truncate">{h.text}</span>
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded shrink-0 font-bold ${
                        h.isOver ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                      }`}>
                        {h.chars} / {h.maxChars} chars
                      </span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* TOOL 3: BIBTEX CLEANER */}
          {activeTool === 'bibtexCleaner' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <div>
                  <span className="font-bold block text-blue-950 dark:text-blue-300">
                    BibTeX Key Normalizer &amp; Syntax Standardizer
                  </span>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400">
                    Converts unstandardized DOI or numeric BibTeX keys into clean academic naming conventions.
                  </p>
                </div>
                <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-300 dark:border-slate-700">
                  <button
                    onClick={() => setKeyConvention('authorYearTitle')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition ${
                      keyConvention === 'authorYearTitle' ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    author_year_title
                  </button>
                  <button
                    onClick={() => setKeyConvention('authorYear')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition ${
                      keyConvention === 'authorYear' ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    AuthorYear
                  </button>
                  <button
                    onClick={() => setKeyConvention('authorYearJournal')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition ${
                      keyConvention === 'authorYearJournal' ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    AuthorYearJournal
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Raw BibTeX Entry</label>
                  <textarea
                    rows={8}
                    value={bibtexInput}
                    onChange={(e) => setBibtexInput(e.target.value)}
                    className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-700 dark:text-slate-300">Standardized Clean BibTeX</label>
                    <button
                      onClick={() => handleCopy(cleanedBibtex, 'clean-bib')}
                      className="text-blue-700 dark:text-blue-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      {copiedKey === 'clean-bib' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedKey === 'clean-bib' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <pre className="w-full h-[160px] p-3 rounded-xl bg-slate-100 dark:bg-slate-950 border border-blue-200 dark:border-blue-900/60 text-xs font-mono text-blue-900 dark:text-blue-300 overflow-y-auto">
                    {cleanedBibtex}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* TOOL 4: TITLE & RUNNING HEAD POLISHER */}
          {activeTool === 'titlePolisher' && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-800 dark:text-slate-200">
                  Enter Research Topic or Draft Working Title
                </label>
                <input
                  type="text"
                  value={topicInput}
                  onChange={(e) => setTopicInput(e.target.value)}
                  placeholder="e.g. mindfulness in critical care nursing and clinical error rates..."
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs font-semibold focus:outline-none focus:border-purple-600"
                />
              </div>

              <div className="space-y-3 pt-2">
                <label className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px] block">
                  Top-Tier Editorial Formatted Title Variants:
                </label>
                <div className="grid grid-cols-1 gap-2.5">
                  {generatedTitles.map((t, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5 hover:border-purple-400 dark:hover:border-purple-700 transition"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400">
                          {t.type}
                        </span>
                        <button
                          onClick={() => handleCopy(`${t.title}\nRunning Head: ${t.runningHead}`, `title-${idx}`)}
                          className="text-[11px] text-purple-700 dark:text-purple-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          {copiedKey === `title-${idx}` ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedKey === `title-${idx}` ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                      <h4 className="font-serif font-bold text-slate-900 dark:text-white text-sm">
                        {t.title}
                      </h4>
                      <p className="font-mono text-[11px] text-slate-500">
                        Running Head (&le; 50c): <span className="text-slate-800 dark:text-slate-300">{t.runningHead}</span> ({t.runningHead.length} chars)
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TOOL 5: THE IRB & ETHICS SENTINEL */}
          {activeTool === 'irbTriage' && (
            <div className="space-y-4">
              <IrbTriagePane
                onAppendToDraft={onSendToStudio}
                onNavigateToStudio={() => {
                  onClose();
                }}
              />
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Micro-Blades operate client-side in your browser.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer"
          >
            Close Toolbelt
          </button>
        </div>

      </div>
    </div>
  );
};
