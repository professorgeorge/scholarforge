import React, { useState, useMemo } from 'react';
import { 
  X, 
  Download, 
  Copy, 
  Check, 
  FileText, 
  Code, 
  FileSpreadsheet, 
  BookOpen, 
  Database,
  Layers,
  FileCheck
} from 'lucide-react';
import type { AcademicPaper, CitationStyle } from '../types/citation';
import { 
  downloadLiteratureWord,
  downloadLiteratureJson,
  downloadLiteratureMarkdown,
  downloadLiteratureCsv,
  downloadLiteratureBibtex,
  downloadLiteratureRis,
  exportLiteratureToJson,
  exportLiteratureToMarkdown,
  exportLiteratureToCsv,
  exportLiteratureToBibtex,
  exportLiteratureToRis,
  exportLiteratureToWordHtml
} from '../services/literatureExportService';
import { calculateDatasetMetrics } from '../services/datasetScientometrics';

export type LiteratureExportFormat = 'word' | 'json' | 'markdown' | 'csv' | 'bibtex' | 'ris';

interface LiteratureExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  papers: AcademicPaper[];
  selectedPaperIds?: Set<string>;
  topic?: string;
  activeStyle?: CitationStyle;
}

export const LiteratureExportModal: React.FC<LiteratureExportModalProps> = ({
  isOpen,
  onClose,
  papers,
  selectedPaperIds = new Set(),
  topic = '',
  activeStyle = 'apa',
}) => {
  const [format, setFormat] = useState<LiteratureExportFormat>('word');
  const [scope, setScope] = useState<'selected' | 'all'>(
    selectedPaperIds.size > 0 && selectedPaperIds.size < papers.length ? 'selected' : 'all'
  );
  const [includeAbstracts, setIncludeAbstracts] = useState<boolean>(true);
  const [includeTags, setIncludeTags] = useState<boolean>(true);
  const [includeMetrics, setIncludeMetrics] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  const activePapers = useMemo(() => {
    if (scope === 'selected' && selectedPaperIds.size > 0) {
      return papers.filter((p) => selectedPaperIds.has(p.id));
    }
    return papers;
  }, [papers, scope, selectedPaperIds]);

  const metrics = useMemo(() => calculateDatasetMetrics(activePapers), [activePapers]);

  // Preview content generation
  const previewContent = useMemo(() => {
    if (activePapers.length === 0) return 'No papers available to export.';

    const exportOpts = {
      topic,
      style: activeStyle,
      includeAbstracts,
      includeTags,
      includeMetrics,
    };

    switch (format) {
      case 'json':
        return exportLiteratureToJson(activePapers, exportOpts);
      case 'markdown':
        return exportLiteratureToMarkdown(activePapers, exportOpts);
      case 'csv':
        return exportLiteratureToCsv(activePapers, exportOpts);
      case 'bibtex':
        return exportLiteratureToBibtex(activePapers);
      case 'ris':
        return exportLiteratureToRis(activePapers);
      case 'word': {
        // Show informative preview for Word HTML
        return exportLiteratureToWordHtml(activePapers, exportOpts);
      }
      default:
        return '';
    }
  }, [activePapers, format, topic, activeStyle, includeAbstracts, includeTags, includeMetrics]);

  if (!isOpen) return null;

  const handleDownload = (targetFormat?: LiteratureExportFormat) => {
    const fmt = targetFormat || format;
    const exportOpts = {
      topic,
      style: activeStyle,
      includeAbstracts,
      includeTags,
      includeMetrics,
    };

    switch (fmt) {
      case 'word':
        downloadLiteratureWord(activePapers, exportOpts);
        setDownloadSuccess('Microsoft Word Dossier downloaded (.doc)!');
        break;
      case 'json':
        downloadLiteratureJson(activePapers, exportOpts);
        setDownloadSuccess('Complete JSON Dataset downloaded (.json)!');
        break;
      case 'markdown':
        downloadLiteratureMarkdown(activePapers, exportOpts);
        setDownloadSuccess('Markdown Dossier downloaded (.md)!');
        break;
      case 'csv':
        downloadLiteratureCsv(activePapers, exportOpts);
        setDownloadSuccess('Spreadsheet CSV downloaded (.csv)!');
        break;
      case 'bibtex':
        downloadLiteratureBibtex(activePapers, exportOpts);
        setDownloadSuccess('BibTeX file downloaded (.bib)!');
        break;
      case 'ris':
        downloadLiteratureRis(activePapers, exportOpts);
        setDownloadSuccess('RIS file downloaded (.ris)!');
        break;
    }

    setTimeout(() => setDownloadSuccess(null), 3500);
  };

  const handleCopyPreview = async () => {
    try {
      await navigator.clipboard.writeText(previewContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  const formatCards = [
    {
      id: 'word' as LiteratureExportFormat,
      title: 'Word Document',
      extension: '.doc',
      icon: <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
      desc: 'Annotated dossier with styled abstracts, DOI hyperlinks & scientometrics table.',
      badge: 'Publication Dossier',
    },
    {
      id: 'json' as LiteratureExportFormat,
      title: 'JSON Dataset',
      extension: '.json',
      icon: <Database className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
      desc: 'Complete structured records with title, authors, full abstracts, DOIs, URLs & tags.',
      badge: 'Machine-Readable',
    },
    {
      id: 'markdown' as LiteratureExportFormat,
      title: 'Markdown File',
      extension: '.md',
      icon: <BookOpen className="w-5 h-5 text-purple-600 dark:text-purple-400" />,
      desc: 'GitHub-flavored markdown with overview summary table and abstract blockquotes.',
      badge: 'Documentation',
    },
    {
      id: 'csv' as LiteratureExportFormat,
      title: 'CSV Spreadsheet',
      extension: '.csv',
      icon: <FileSpreadsheet className="w-5 h-5 text-teal-600 dark:text-teal-400" />,
      desc: 'Spreadsheet table for Excel & Google Sheets with title, abstract, DOI & author columns.',
      badge: 'Excel / Screening',
    },
    {
      id: 'bibtex' as LiteratureExportFormat,
      title: 'BibTeX File',
      extension: '.bib',
      icon: <Code className="w-5 h-5 text-amber-600 dark:text-amber-400" />,
      desc: 'LaTeX / Overleaf citations including abstract, DOI, and journal metadata.',
      badge: 'LaTeX / Overleaf',
    },
    {
      id: 'ris' as LiteratureExportFormat,
      title: 'RIS Reference File',
      extension: '.ris',
      icon: <Layers className="w-5 h-5 text-rose-600 dark:text-rose-400" />,
      desc: 'Direct import format for Zotero, Mendeley, EndNote, Citavi & RefWorks.',
      badge: 'Citation Manager',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-4xl max-h-[90vh] flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden font-sans text-slate-800 dark:text-slate-100"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-900 dark:bg-blue-800 flex items-center justify-center text-white shadow-xs">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white font-serif">
                  Export Identified Literature Records
                </h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300 font-semibold">
                  {activePapers.length} Records
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Download verified scholarly records with full titles, abstracts, DOIs, authors, and citation counts.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Success Banner */}
          {downloadSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center justify-between animate-in fade-in duration-200">
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>{downloadSuccess}</span>
              </div>
              <span className="text-[11px] font-normal text-emerald-600 dark:text-emerald-400">Saved to your downloads folder</span>
            </div>
          )}

          {/* Scope & Topic Bar */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-600 dark:text-slate-400">Export Scope:</span>
              <div className="inline-flex rounded-lg p-0.5 bg-slate-200 dark:bg-slate-800">
                <button
                  type="button"
                  onClick={() => setScope('all')}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
                    scope === 'all'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  All Discovered ({papers.length})
                </button>
                <button
                  type="button"
                  onClick={() => setScope('selected')}
                  disabled={selectedPaperIds.size === 0}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition cursor-pointer disabled:opacity-40 ${
                    scope === 'selected'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  Selected Only ({selectedPaperIds.size})
                </button>
              </div>
            </div>

            {/* Scientometrics pill summary */}
            <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 text-[11px]">
              <span>Dataset $h$-index: <strong className="text-blue-600 dark:text-blue-400">{metrics.hIndex}</strong></span>
              <span>&bull;</span>
              <span>Total Citations: <strong className="text-slate-700 dark:text-slate-300">{metrics.totalCitations.toLocaleString()}</strong></span>
              <span>&bull;</span>
              <span>Open Access: <strong className="text-emerald-600 dark:text-emerald-400">{metrics.openAccessPct}%</strong></span>
            </div>
          </div>

          {/* Format Selection Cards Grid */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-2.5">
              Select Output Format:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {formatCards.map((card) => {
                const isSelected = format === card.id;
                return (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => setFormat(card.id)}
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-blue-600 dark:border-blue-500 bg-blue-50/50 dark:bg-blue-950/40 shadow-xs ring-1 ring-blue-500/30'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {card.icon}
                          <span className="text-xs font-bold text-slate-900 dark:text-white font-serif">
                            {card.title}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {card.extension}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mb-3">
                        {card.desc}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80">
                      <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">
                        {card.badge}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(card.id);
                        }}
                        className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                        title={`Download ${card.title}`}
                      >
                        <Download className="w-3 h-3" />
                        <span>Download</span>
                      </button>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Export Customization Options */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800">
            <div className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2.5">
              Included Information Fields:
            </div>
            <div className="flex flex-wrap items-center gap-5 text-xs text-slate-700 dark:text-slate-300">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includeAbstracts}
                  onChange={(e) => setIncludeAbstracts(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="font-medium">Full Abstracts (All records)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includeMetrics}
                  onChange={(e) => setIncludeMetrics(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="font-medium">Scientometrics & Citations ($h$-index, citation counts)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includeTags}
                  onChange={(e) => setIncludeTags(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="font-medium">Academic Keywords & Methodological Tags</span>
              </label>
            </div>
          </div>

          {/* Content Preview Box */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <span>File Content Preview:</span>
                <span className="text-[10px] font-mono text-slate-400 font-normal">
                  ({format.toUpperCase()} format)
                </span>
              </label>

              <button
                type="button"
                onClick={handleCopyPreview}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 flex items-center gap-1.5 transition cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Content</span>
                  </>
                )}
              </button>
            </div>

            <div className="relative rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-900 text-slate-200 overflow-hidden text-xs font-mono">
              <pre className="max-h-60 overflow-y-auto p-4 leading-relaxed whitespace-pre-wrap select-all">
                {previewContent}
              </pre>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/80">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Exporting <strong>{activePapers.length}</strong> verified peer-reviewed articles.
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              Close
            </button>

            <button
              type="button"
              onClick={() => handleDownload()}
              className="btn-academic-primary px-6 py-2.5 text-xs font-bold rounded-xl flex items-center gap-2 shadow-xs cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download {formatCards.find((f) => f.id === format)?.title}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
