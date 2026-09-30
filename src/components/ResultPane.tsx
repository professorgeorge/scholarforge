import React, { useState } from 'react';
import type { 
  CitationOptions, 
  Claim
} from '../types/citation';
import { 
  buildAnnotatedDocument, 
  CITATION_STYLES, 
  exportToMarkdown, 
  exportToWordHtml, 
  exportToRis,
  generateBibtexEntry 
} from '../services/citationFormatter';
import { 
  reviseGroundedManuscript,
  type LLMConfig,
  DEFAULT_LLM_CONFIG
} from '../services/llmService';
import type { SecondaryDataRecord } from '../services/secondaryDataService';
import { 
  Copy, 
  Check, 
  Download, 
  FileText, 
  Code, 
  GitCompare, 
  BookOpen,
  Sparkles,
  MessageSquarePlus,
  ChevronDown,
  ChevronUp,
  Loader2,
  Undo2,
  AlertCircle,
  Wand2,
  ShoppingCart,
  Crown
} from 'lucide-react';
import confetti from 'canvas-confetti';

import type { PeerReviewOverhaulResult } from '../services/llmService';
import { exportRebuttalToWordHtml } from '../services/citationFormatter';
import { calculateDatasetMetrics } from '../services/datasetScientometrics';
import { addMultiplePapersToCart } from '../services/cartService';
import { downloadWordDocument } from '../services/wordExportService';
import { AcademicPromptsModal } from './AcademicPromptsModal';

interface ResultPaneProps {
  originalText: string;
  claims: Claim[];
  options: CitationOptions;
  setOptions?: React.Dispatch<React.SetStateAction<CitationOptions>>;
  rebuttalPackage?: PeerReviewOverhaulResult | null;
  originalPreRevisionText?: string;
  onFocusClaim: (claimId: string) => void;
  onApplyRevision?: (revisedManuscript: string) => void;
  llmConfig?: LLMConfig;
  primaryData?: string;
  secondaryData?: SecondaryDataRecord[];
}

export const ResultPane: React.FC<ResultPaneProps> = ({
  originalText,
  claims,
  options,
  setOptions,
  rebuttalPackage,
  originalPreRevisionText,
  onFocusClaim,
  onApplyRevision,
  llmConfig = DEFAULT_LLM_CONFIG,
  primaryData,
  secondaryData,
}) => {
  const [activeTab, setActiveTab] = useState<'rebuttal' | 'annotated' | 'diff' | 'rebuttal_diff' | 'bib' | 'raw'>(
    rebuttalPackage ? 'rebuttal' : 'annotated'
  );
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Peer-Review AI Revision state
  const [showRevisionPanel, setShowRevisionPanel] = useState<boolean>(false);
  const [revisionComments, setRevisionComments] = useState<string>('');
  const [isRevising, setIsRevising] = useState<boolean>(false);
  const [revisionError, setRevisionError] = useState<string>('');
  const [versionHistory, setVersionHistory] = useState<string[]>([]);
  const [isPromptsOpen, setIsPromptsOpen] = useState<boolean>(false);

  const { annotatedText, bibliography, bibliographyHtml, uniquePapers } = buildAnnotatedDocument(
    originalText,
    claims,
    options
  );

  const currentStyleInfo = CITATION_STYLES.find((s) => s.id === options.style) || CITATION_STYLES[0];

  const handleCopyPlain = (textToCopy: string, key: string) => {
    navigator.clipboard.writeText(textToCopy);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);

    confetti({
      particleCount: 25,
      spread: 50,
      origin: { y: 0.85 },
      colors: ['#1e3a8a', '#2563eb', '#065f46'],
    });
  };

  const handleCopyRichText = async () => {
    const htmlContent = exportToWordHtml(originalText, claims, options);
    const plainText = `${annotatedText}\n\n${options.style === 'mla' ? 'Works Cited' : 'References'}\n\n${bibliography.join('\n\n')}`;

    try {
      if (navigator.clipboard && window.ClipboardItem) {
        const typeHtml = 'text/html';
        const typePlain = 'text/plain';
        const blobHtml = new Blob([htmlContent], { type: typeHtml });
        const blobPlain = new Blob([plainText], { type: typePlain });
        const item = new ClipboardItem({
          [typeHtml]: blobHtml,
          [typePlain]: blobPlain,
        });
        await navigator.clipboard.write([item]);
      } else {
        await navigator.clipboard.writeText(plainText);
      }
      setCopiedKey('rich-text');
      setTimeout(() => setCopiedKey(null), 2500);

      confetti({
        particleCount: 35,
        spread: 60,
        origin: { y: 0.85 },
        colors: ['#1e3a8a', '#2563eb', '#065f46'],
      });
    } catch (err) {
      handleCopyPlain(plainText, 'rich-text');
    }
  };

  const handleDownload = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadWord = () => {
    const htmlContent = exportToWordHtml(originalText, claims, options);
    handleDownload('\ufeff' + htmlContent, `manuscript_${options.style}.doc`, 'application/msword;charset=utf-8');
  };

  const handleDownloadRebuttalWord = () => {
    if (!rebuttalPackage) return;
    const htmlContent = exportRebuttalToWordHtml(rebuttalPackage.responseLetter, 'Author Response Letter');
    handleDownload('\ufeff' + htmlContent, 'point_by_point_author_response.doc', 'application/msword;charset=utf-8');
  };

  const handleDownloadCombinedPackageWord = () => {
    if (!rebuttalPackage) return;
    const manuscriptHtml = exportToWordHtml(originalText, claims, options);
    const rebuttalHtml = exportRebuttalToWordHtml(rebuttalPackage.responseLetter, 'Author Response Letter');
    const combined = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head><meta charset="utf-8"><title>Submission Package</title></head>
<body>
${rebuttalHtml.replace(/<\/?html.*?>|<\/?head.*?>|<\/?body.*?>/gi, '')}
<br clear="all" style="page-break-before:always" />
${manuscriptHtml.replace(/<\/?html.*?>|<\/?head.*?>|<\/?body.*?>/gi, '')}
</body></html>`;
    handleDownload('\ufeff' + combined, 'revised_submission_package.doc', 'application/msword;charset=utf-8');
  };

  const handleDownloadMarkdown = () => {
    const mdContent = exportToMarkdown(originalText, claims, options);
    handleDownload(mdContent, `manuscript_${options.style}.md`, 'text/markdown');
  };

  const handleDownloadBibtex = () => {
    const bibContent = uniquePapers.map((p) => generateBibtexEntry(p)).join('\n\n');
    handleDownload(bibContent, 'references.bib', 'text/plain');
  };

  const handleDownloadRis = () => {
    const risContent = exportToRis(uniquePapers);
    handleDownload(risContent, 'references.ris', 'application/x-research-info-systems');
  };

  // Revision Quick Preset Helper
  const handleApplyPreset = (presetText: string) => {
    setRevisionComments((prev) => (prev ? `${prev}\n• ${presetText}` : presetText));
  };

  // Submit AI Manuscript Revision
  const handleExecuteRevision = async () => {
    if (!revisionComments.trim()) {
      setRevisionError('Please enter your revision comments or directives.');
      return;
    }

    setRevisionError('');
    setIsRevising(true);

    try {
      const revised = await reviseGroundedManuscript(
        originalText,
        revisionComments,
        uniquePapers,
        llmConfig,
        primaryData,
        secondaryData
      );

      // Save previous draft into version history
      setVersionHistory((prev) => [...prev, originalText]);
      if (onApplyRevision) {
        onApplyRevision(revised);
      }
      setRevisionComments('');
      setShowRevisionPanel(false);

      confetti({
        particleCount: 45,
        spread: 60,
        origin: { y: 0.85 },
        colors: ['#1e3a8a', '#059669', '#d97706'],
      });
    } catch (err: any) {
      setRevisionError(err.message || 'Failed to revise manuscript.');
    } finally {
      setIsRevising(false);
    }
  };

  const handleUndoRevision = () => {
    if (versionHistory.length === 0) return;
    const previous = versionHistory[versionHistory.length - 1];
    setVersionHistory((prev) => prev.slice(0, -1));
    if (onApplyRevision) {
      onApplyRevision(previous);
    }
  };

  return (
    <div className="academic-card rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs flex flex-col h-full">
      
      {/* Tab Header & Export Bar */}
      <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 flex flex-wrap items-center justify-between gap-3">
        {/* Tabs */}
        <div className="flex items-center gap-1 bg-slate-200/80 dark:bg-slate-950 p-1 rounded-lg border border-slate-300 dark:border-slate-800 text-xs overflow-x-auto">
          {rebuttalPackage && (
            <button
              onClick={() => setActiveTab('rebuttal')}
              className={`px-3 py-1.5 rounded-md font-bold flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
                activeTab === 'rebuttal'
                  ? 'bg-blue-900 text-white shadow-xs'
                  : 'text-blue-900 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-950/60'
              }`}
            >
              <Wand2 className="w-3.5 h-3.5 text-amber-300" />
              <span>Point-by-Point Rebuttal</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('annotated')}
            className={`px-3 py-1.5 rounded-md font-semibold flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
              activeTab === 'annotated'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>{rebuttalPackage ? 'Revised Manuscript' : 'Annotated Manuscript'}</span>
          </button>

          {rebuttalPackage && originalPreRevisionText && (
            <button
              onClick={() => setActiveTab('rebuttal_diff')}
              className={`px-3 py-1.5 rounded-md font-semibold flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
                activeTab === 'rebuttal_diff'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <GitCompare className="w-3.5 h-3.5" />
              <span>Revision Diff</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('diff')}
            className={`px-3 py-1.5 rounded-md font-semibold flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
              activeTab === 'diff'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <GitCompare className="w-3.5 h-3.5" />
            <span>Claim Diff</span>
          </button>

          <button
            onClick={() => setActiveTab('bib')}
            className={`px-3 py-1.5 rounded-md font-semibold flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
              activeTab === 'bib'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>{options.style === 'mla' ? 'Works Cited' : 'References'} ({uniquePapers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('raw')}
            className={`px-3 py-1.5 rounded-md font-semibold flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
              activeTab === 'raw'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>Raw Export</span>
          </button>
        </div>

        {/* Right tools: Style Badge & Comment/Revise Button */}
        <div className="flex items-center gap-2">
          {versionHistory.length > 0 && (
            <button
              onClick={handleUndoRevision}
              className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1 border border-slate-300 dark:border-slate-700 cursor-pointer"
              title="Undo last revision"
            >
              <Undo2 className="w-3.5 h-3.5" />
              <span>Undo Edit</span>
            </button>
          )}

          <button
            onClick={() => setShowRevisionPanel(!showRevisionPanel)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold font-serif flex items-center gap-1.5 transition cursor-pointer border ${
              showRevisionPanel
                ? 'bg-blue-900 text-white border-blue-900 shadow-xs'
                : 'bg-white dark:bg-slate-800 text-blue-900 dark:text-blue-300 border-blue-300 dark:border-blue-700 hover:bg-blue-50'
            }`}
          >
            <MessageSquarePlus className="w-3.5 h-3.5 text-amber-300" />
            <span>Revise with Reviewer Comments</span>
            {showRevisionPanel ? <ChevronUp className="w-3 h-3 ml-0.5" /> : <ChevronDown className="w-3 h-3 ml-0.5" />}
          </button>

          {setOptions ? (
            <div className="flex items-center gap-1.5">
              <select
                value={options.style}
                onChange={(e) => setOptions((prev) => ({ ...prev, style: e.target.value as any }))}
                className="px-2.5 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-900 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-semibold cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-700"
                title="Change Citation Format live"
              >
                {CITATION_STYLES.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.shortName || st.name}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => setOptions((prev) => ({ ...prev, includeDoi: !prev.includeDoi }))}
                className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium cursor-pointer transition ${
                  options.includeDoi
                    ? 'bg-blue-900 text-white border-blue-900 shadow-2xs font-semibold'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700 hover:bg-slate-50'
                }`}
                title={options.includeDoi ? 'Clickable DOI URLs included in references' : 'Clickable DOI URLs omitted'}
              >
                {options.includeDoi ? 'DOIs: ON' : 'DOIs: OFF'}
              </button>
            </div>
          ) : (
            <span className="text-xs px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-900 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-semibold font-sans">
              {currentStyleInfo.name}
            </span>
          )}
        </div>
      </div>

      {/* Expandable Author / Peer-Review Revision Comment Drawer */}
      {showRevisionPanel && (
        <div className="p-4 sm:p-5 bg-blue-50/70 dark:bg-blue-950/50 border-b border-blue-200 dark:border-blue-800/80 space-y-3.5 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wand2 className="w-4 h-4 text-blue-800 dark:text-blue-400" />
              <h4 className="text-xs font-bold text-blue-950 dark:text-blue-200 uppercase tracking-wider font-serif">
                Direct AI Peer-Review Revisions & Manuscript Steering
              </h4>
            </div>
            <span className="text-[11px] text-slate-500 font-sans">
              LLM refines the draft while strictly maintaining verified DOIs
            </span>
          </div>

          {/* Quick Presets */}
          <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
            <span className="text-slate-500 font-semibold mr-1">Quick Directives:</span>
            <button
              type="button"
              onClick={() => handleApplyPreset('Adopt a more cautious tone regarding causal inferences and emphasize sample heterogeneity.')}
              className="px-2.5 py-1 rounded-md bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900 cursor-pointer transition shadow-2xs"
            >
              🛡️ Soften Causal Claims
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset('Expand on the biochemical/computational mechanisms in detail with deeper granular explanation.')}
              className="px-2.5 py-1 rounded-md bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900 cursor-pointer transition shadow-2xs"
            >
              🔬 Deepen Mechanistic Detail
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset('Emphasize methodological limitations, sensitivity analysis, and need for prospective multi-center auditing.')}
              className="px-2.5 py-1 rounded-md bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900 cursor-pointer transition shadow-2xs"
            >
              📊 Highlight Limitations
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset('Tighten the prose, eliminate repetitive sentences, and make the discussion more concise and punchy.')}
              className="px-2.5 py-1 rounded-md bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900 cursor-pointer transition shadow-2xs"
            >
              ✂️ Make Concise
            </button>
          </div>

          {/* Feedback Textarea */}
          <textarea
            rows={3}
            value={revisionComments}
            onChange={(e) => setRevisionComments(e.target.value)}
            placeholder="Type your reviewer critique or revision comments (e.g. 'In paragraph 2, expand more on the comparative metrics...', 'Tone down the definitive claims about treatment efficacy...', 'Add discussion on clinical translation hurdles...')"
            className="w-full p-3 rounded-xl bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-700 font-sans"
          />

          {revisionError && (
            <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{revisionError}</span>
            </div>
          )}

          {/* Action Bar */}
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-500">
              Applying revisions will update the draft while preserving your citations.
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowRevisionPanel(false)}
                className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-xs font-medium border border-slate-300 dark:border-slate-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteRevision}
                disabled={isRevising || !revisionComments.trim()}
                className="btn-academic-primary px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
              >
                {isRevising ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                    <span>Revising Manuscript with LLM...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>Apply Revisions & Re-Ground</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content Area */}
      <div className="flex-1 p-6 sm:p-7 overflow-y-auto max-h-[600px] text-slate-900 dark:text-slate-100">
        
        {/* Tab 0: Point-by-Point Rebuttal Document */}
        {activeTab === 'rebuttal' && rebuttalPackage && (
          <div className="space-y-6 max-w-3xl animate-in fade-in duration-150">
            {/* Rebuttal Actions Strip */}
            <div className="p-4 rounded-xl bg-blue-50/80 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h4 className="text-xs font-bold text-blue-950 dark:text-blue-200 font-serif uppercase tracking-wider">
                  Official Point-by-Point Author Response Letter
                </h4>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 font-sans">
                  Addresses every reviewer point with quoted manuscript excerpts & empirical justifications.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCopyPlain(rebuttalPackage.responseLetter, 'rebuttal-letter')}
                  className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-700 text-xs font-semibold text-blue-900 dark:text-blue-300 hover:bg-blue-100 flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  {copiedKey === 'rebuttal-letter' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Copy Letter</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadRebuttalWord}
                  className="px-3 py-1.5 rounded-lg bg-blue-900 hover:bg-blue-950 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Response Letter (.doc)</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadCombinedPackageWord}
                  className="px-3 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  title="Download complete submission package containing both the Rebuttal Letter and Revised Manuscript in one Word document"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Combined Package (.doc)</span>
                </button>
              </div>
            </div>

            {/* Rebuttal Document Body */}
            <div className="manuscript-body space-y-4 text-justify">
              {rebuttalPackage.responseLetter.split(/\n\n+/).map((block, pIdx) => {
                const trimmed = block.trim();
                if (trimmed.startsWith('# ')) {
                  return (
                    <h1 key={pIdx} className="text-xl sm:text-2xl font-bold font-serif text-slate-900 dark:text-white pt-2 pb-3 mb-3 border-b border-slate-200 dark:border-slate-800 text-center">
                      {trimmed.slice(2)}
                    </h1>
                  );
                }
                if (trimmed.startsWith('## ')) {
                  return (
                    <h2 key={pIdx} className="text-base sm:text-lg font-bold font-serif text-blue-950 dark:text-blue-300 pt-6 pb-2 border-b border-blue-200 dark:border-blue-900/60">
                      {trimmed.slice(3)}
                    </h2>
                  );
                }
                if (trimmed.startsWith('### ')) {
                  return (
                    <h3 key={pIdx} className="text-sm font-bold font-serif text-slate-900 dark:text-white pt-3 pb-1">
                      {trimmed.slice(4)}
                    </h3>
                  );
                }
                if (trimmed.startsWith('> ')) {
                  return (
                    <blockquote key={pIdx} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/80 border-l-4 border-blue-800 dark:border-blue-400 font-serif text-xs sm:text-sm text-slate-800 dark:text-slate-200 italic my-3 shadow-2xs">
                      {trimmed.slice(2).replace(/\*\*(.*?)\*\*/g, '$1')}
                    </blockquote>
                  );
                }
                if (trimmed === '---') {
                  return <hr key={pIdx} className="border-slate-200 dark:border-slate-800 my-4" />;
                }
                return (
                  <p key={pIdx} className="font-serif text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed text-justify" dangerouslySetInnerHTML={{ __html: trimmed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                );
              })}
            </div>
          </div>
        )}

        {/* Tab: Rebuttal Diff */}
        {activeTab === 'rebuttal_diff' && rebuttalPackage && originalPreRevisionText && (
          <div className="space-y-5 max-w-3xl animate-in fade-in duration-150">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                Manuscript Rebuttal Diff: Comparing Original Draft ({originalPreRevisionText.length.toLocaleString()} chars) vs Revised Manuscript ({originalText.length.toLocaleString()} chars)
              </span>
              <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold text-[11px]">
                +{Math.max(0, originalText.length - originalPreRevisionText.length)} chars added
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-serif leading-relaxed">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="font-sans font-bold text-slate-500 uppercase tracking-wider text-[11px] pb-2 border-b border-slate-200 dark:border-slate-800">
                  Original Submitted Draft
                </div>
                <div className="text-slate-700 dark:text-slate-300 space-y-3 whitespace-pre-wrap opacity-80 max-h-[450px] overflow-y-auto">
                  {originalPreRevisionText}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-blue-50/40 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 space-y-3">
                <div className="font-sans font-bold text-blue-900 dark:text-blue-300 uppercase tracking-wider text-[11px] pb-2 border-b border-blue-200 dark:border-blue-800 flex items-center justify-between">
                  <span>Overhauled Revised Manuscript</span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">R&R Edition</span>
                </div>
                <div className="text-slate-900 dark:text-white space-y-3 whitespace-pre-wrap max-h-[450px] overflow-y-auto">
                  {originalText}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 1: Formatted Document */}
        {activeTab === 'annotated' && (
          <div className="space-y-6 max-w-3xl">
            {/* Main Body with Academic Typography */}
            <div className="manuscript-body space-y-4">
              {annotatedText.split(/\n\n+/).map((block, pIdx) => {
                const trimmed = block.trim();

                // 1. Paper Title (# Title)
                if (trimmed.startsWith('# ')) {
                  return (
                    <h1 
                      key={pIdx}
                      className="text-2xl sm:text-3xl font-bold font-serif text-slate-900 dark:text-white tracking-tight leading-tight pt-2 pb-4 mb-4 border-b-2 border-slate-200 dark:border-slate-800 text-center"
                    >
                      {trimmed.slice(2)}
                    </h1>
                  );
                }

                // 2. Section Headings (## Section Name)
                if (trimmed.startsWith('## ')) {
                  return (
                    <h2 
                      key={pIdx}
                      className="text-lg sm:text-xl font-bold font-serif text-slate-900 dark:text-white pt-8 pb-2 border-b border-slate-200 dark:border-slate-800 tracking-tight"
                    >
                      {trimmed.slice(3)}
                    </h2>
                  );
                }

                // 3. Subheadings (### Subheading)
                if (trimmed.startsWith('### Abstract') || trimmed.startsWith('### ')) {
                  const content = trimmed.replace(/^###\s*/, '');
                  return (
                    <h3 
                      key={pIdx}
                      className="text-base font-bold font-serif text-slate-900 dark:text-white pt-4 pb-1 uppercase tracking-wider text-xs"
                    >
                      {content}
                    </h3>
                  );
                }

                // 4. Horizontal Rule (---)
                if (trimmed === '---') {
                  return <hr key={pIdx} className="border-slate-200 dark:border-slate-800 my-6" />;
                }

                // 5. Keywords Block
                if (trimmed.startsWith('**Keywords:**') || trimmed.startsWith('Keywords:')) {
                  const kwBody = trimmed.replace(/^\*\*Keywords:\*\*\s*/, '').replace(/^Keywords:\s*/, '');
                  return (
                    <div 
                      key={pIdx}
                      className="p-3 rounded-lg bg-blue-50/50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 text-xs font-sans text-slate-700 dark:text-slate-300 flex flex-wrap items-center gap-2 my-3"
                    >
                      <span className="font-bold text-blue-900 dark:text-blue-300 uppercase tracking-wider text-[11px]">
                        Keywords:
                      </span>
                      <span className="italic font-serif">
                        {kwBody}
                      </span>
                    </div>
                  );
                }

                // 6. Abstract Paragraph Body
                if (trimmed.startsWith('**Background') || trimmed.startsWith('**Objective') || trimmed.startsWith('**Methodology') || trimmed.startsWith('**Results') || trimmed.startsWith('**Significance')) {
                  return (
                    <div 
                      key={pIdx}
                      className="p-4 rounded-xl bg-slate-50/90 dark:bg-slate-950/70 border-l-4 border-blue-800 dark:border-blue-400 border border-slate-200 dark:border-slate-800 font-serif text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed space-y-2 shadow-2xs my-4"
                    >
                      <div className="font-bold text-xs uppercase tracking-wider text-blue-950 dark:text-blue-200 font-sans mb-1">
                        Structured Abstract
                      </div>
                      <div className="space-y-2 text-justify">
                        {trimmed.split('\n').map((line, lIdx) => (
                          <p key={lIdx} dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                        ))}
                      </div>
                    </div>
                  );
                }

                // 7. Regular Scholarly Paragraph
                return (
                  <p 
                    key={pIdx}
                    className="font-serif text-sm sm:text-base text-slate-800 dark:text-slate-200 leading-relaxed text-justify indent-6"
                  >
                    {trimmed}
                  </p>
                );
              })}
            </div>

            {/* Bibliography Section */}
            {bibliographyHtml.length > 0 && (
              <div className="mt-10 pt-6 border-t border-slate-200 dark:border-slate-800">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 font-serif">
                    <BookOpen className="w-5 h-5 text-blue-800 dark:text-blue-400" />
                    <span>{options.style === 'mla' ? 'Works Cited' : 'References'}</span>
                  </h3>

                  {setOptions && (
                    <label className="flex items-center gap-2 text-xs font-sans text-slate-600 dark:text-slate-400 cursor-pointer font-medium">
                      <input
                        type="checkbox"
                        checked={options.includeDoi}
                        onChange={(e) => setOptions((prev) => ({ ...prev, includeDoi: e.target.checked }))}
                        className="rounded border-slate-300 text-blue-800 focus:ring-blue-700 cursor-pointer"
                      />
                      <span>Include Clickable DOI URLs (https://doi.org/...)</span>
                    </label>
                  )}
                </div>

                <div className="space-y-3 font-serif text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
                  {bibliographyHtml.map((entryHtml, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-blue-400 transition"
                    >
                      <div className="flex items-start gap-2.5">
                        {options.style === 'ieee' || options.style === 'vancouver' || options.style === 'nature' ? (
                          <span className="font-mono text-blue-800 dark:text-blue-400 font-bold shrink-0">
                            {idx + 1}.
                          </span>
                        ) : null}
                        <div 
                          className="flex-1"
                          dangerouslySetInnerHTML={{ __html: entryHtml }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Claims Diff View */}
        {activeTab === 'diff' && (
          <div className="space-y-4">
            <div className="text-xs text-slate-600 dark:text-slate-400">
              Interactive Claim Inspector: Click any identified statement below to inspect or swap its peer-reviewed citation.
            </div>

            <div className="space-y-3 font-serif text-sm leading-relaxed">
              {claims.map((claim, idx) => (
                <div
                  key={claim.id}
                  onClick={() => onFocusClaim(claim.id)}
                  className={`p-3.5 rounded-xl border transition cursor-pointer ${
                    claim.isExcluded
                      ? 'bg-slate-100 dark:bg-slate-900 border-dashed border-slate-300 dark:border-slate-700 opacity-50'
                      : claim.selectedPaper
                      ? 'bg-blue-50/50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 hover:border-blue-500'
                      : 'bg-amber-50/50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <span className="font-mono text-xs font-bold text-slate-400 shrink-0 mt-0.5">
                      #{idx + 1}
                    </span>
                    <div className="flex-1 space-y-1.5">
                      <p className="text-slate-900 dark:text-white">
                        {claim.text}
                      </p>

                      {claim.selectedPaper && !claim.isExcluded ? (
                        <div className="text-xs text-blue-900 dark:text-blue-300 font-sans flex items-center gap-2">
                          <span className="font-semibold">Cited:</span>
                          <span className="italic">{claim.selectedPaper.title}</span>
                          <span className="font-mono text-slate-500">({claim.selectedPaper.year})</span>
                        </div>
                      ) : (
                        <div className="text-xs text-slate-500 italic">
                          {claim.isExcluded ? 'Excluded by author' : 'No verified citation assigned'}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Formatted Reference List */}
        {activeTab === 'bib' && (
          <div className="space-y-4">
            {/* Dataset Scientometrics Benchmarks */}
            {uniquePapers.length > 0 && (() => {
              const metrics = calculateDatasetMetrics(uniquePapers);
              return (
                <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800 grid grid-cols-4 gap-2 text-center">
                  <div>
                    <div className="text-sm font-bold text-blue-600 dark:text-blue-400">
                      {metrics.hIndex}
                    </div>
                    <div className="text-[10px] uppercase font-semibold text-slate-500">
                      Dataset $h$-Index
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      {metrics.totalCitations.toLocaleString()}
                    </div>
                    <div className="text-[10px] uppercase font-semibold text-slate-500">
                      Total Citations
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      {metrics.avgCitations}
                    </div>
                    <div className="text-[10px] uppercase font-semibold text-slate-500">
                      Avg Citations
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                      {metrics.openAccessPct}%
                    </div>
                    <div className="text-[10px] uppercase font-semibold text-slate-500">
                      Open Access
                    </div>
                  </div>
                </div>
              );
            })()}

            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">
                {uniquePapers.length} unique peer-reviewed sources in {currentStyleInfo.name}
              </span>
              <button
                onClick={() => handleCopyPlain(bibliography.join('\n\n'), 'bib-tab')}
                className="text-xs text-blue-800 dark:text-blue-400 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
              >
                {copiedKey === 'bib-tab' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Copy References</span>
              </button>
            </div>

            <div className="space-y-3 font-serif text-sm">
              {bibliographyHtml.map((refHtml, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
                  dangerouslySetInnerHTML={{ __html: refHtml }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Tab 4: Raw Markdown Export */}
        {activeTab === 'raw' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">Raw Text & Markdown Output</span>
              <button
                onClick={() => handleCopyPlain(exportToMarkdown(originalText, claims, options), 'raw-tab')}
                className="text-xs text-blue-800 dark:text-blue-400 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
              >
                {copiedKey === 'raw-tab' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Copy Raw Code</span>
              </button>
            </div>

            <pre className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed">
              {exportToMarkdown(originalText, claims, options)}
            </pre>
          </div>
        )}

      </div>

      {/* Export Toolbar Footer */}
      <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
        {/* Copy buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleCopyRichText}
            className="btn-academic-primary px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-xs"
            title="Copy formatted with italics, indents, and links ready to paste into Word or Docs"
          >
            {copiedKey === 'rich-text' ? <Check className="w-4 h-4 text-emerald-300" /> : <Sparkles className="w-4 h-4 text-amber-300" />}
            <span>Copy Formatted (Word / Docs)</span>
          </button>

          <button
            onClick={() => handleCopyPlain(`${annotatedText}\n\n${options.style === 'mla' ? 'Works Cited' : 'References'}\n\n${bibliography.join('\n\n')}`, 'full-text')}
            className="px-3.5 py-2 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer border border-slate-300 dark:border-slate-700"
            title="Copy as clean plain text without any asterisks"
          >
            {copiedKey === 'full-text' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>Copy Plain Text</span>
          </button>
          <button
            onClick={() => {
              const added = addMultiplePapersToCart(uniquePapers);
              handleCopyPlain('', '');
              alert(`Added ${added} papers to your Research Cart!`);
            }}
            className="px-3.5 py-2 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-900 dark:text-blue-300 text-xs font-bold flex items-center gap-1.5 transition border border-blue-200 dark:border-blue-800 cursor-pointer shadow-xs"
            title="Add all verified citations to your persistent Research Cart"
          >
            <ShoppingCart className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400" />
            <span>Add All to Cart</span>
          </button>

          <button
            onClick={() => setIsPromptsOpen(true)}
            className="px-3.5 py-2 rounded-lg bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900/60 text-amber-900 dark:text-amber-300 text-xs font-bold flex items-center gap-1.5 transition border border-amber-200 dark:border-amber-800 cursor-pointer shadow-xs"
            title="Export pre-formatted prompts for Google NotebookLM, ChatGPT, Claude, and Gemini"
          >
            <Crown className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>7 LLM Prompts Suite</span>
          </button>
        </div>

        {/* Download file buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleDownloadWord}
            className="px-3.5 py-2 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-950 dark:hover:bg-blue-900 text-blue-900 dark:text-blue-200 text-xs font-semibold flex items-center gap-1.5 transition border border-blue-200 dark:border-blue-800 cursor-pointer shadow-xs"
            title="Download formatted academic document for Microsoft Word (.doc) with italics and hanging indents"
          >
            <Download className="w-3.5 h-3.5 text-blue-800 dark:text-blue-400" />
            <span>Word (.doc)</span>
          </button>

          <button
            onClick={() => {
              downloadWordDocument(uniquePapers, {
                style: options.style,
                includeAbstracts: true,
                includeTags: true,
                documentTitle: 'Annotated Bibliography',
                topic: 'Manuscript Citations',
              });
            }}
            className="px-3 py-2 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium flex items-center gap-1.5 transition border border-slate-300 dark:border-slate-700 cursor-pointer"
            title="Download Annotated Bibliography (.doc) with abstracts and keywords"
          >
            <Download className="w-3.5 h-3.5 text-blue-600" />
            <span>Annotated Bib (.doc)</span>
          </button>

          <button
            onClick={handleDownloadRis}
            className="px-3 py-2 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium flex items-center gap-1.5 transition border border-slate-300 dark:border-slate-700 cursor-pointer"
            title="Download RIS citation bundle for reference managers (EndNote, Zotero, Mendeley, JabRef)"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>RIS (.ris)</span>
          </button>

          <button
            onClick={handleDownloadBibtex}
            className="px-3 py-2 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium flex items-center gap-1.5 transition border border-slate-300 dark:border-slate-700 cursor-pointer"
            title="Download BibTeX database for LaTeX / Overleaf"
          >
            <Download className="w-3.5 h-3.5" />
            <span>BibTeX (.bib)</span>
          </button>

          <button
            onClick={handleDownloadMarkdown}
            className="px-3 py-2 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium flex items-center gap-1.5 transition border border-slate-300 dark:border-slate-700 cursor-pointer"
            title="Download Markdown file"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Markdown (.md)</span>
          </button>
        </div>
      </div>

      {/* 7 Academic LLM Prompts Modal */}
      <AcademicPromptsModal
        isOpen={isPromptsOpen}
        onClose={() => setIsPromptsOpen(false)}
        papers={uniquePapers}
        topic="Grounded Manuscript References"
        style={options.style}
      />
    </div>
  );
};
