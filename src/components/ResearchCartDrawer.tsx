import React, { useState, useEffect } from 'react';
import { 
  X, 
  Trash2, 
  Sparkles, 
  ExternalLink, 
  ChevronDown, 
  ChevronUp, 
  BookOpen, 
  Crown,
  Check,
  Download
} from 'lucide-react';
import type { AcademicPaper, CitationStyle } from '../types/citation';
import { 
  getCartPapers, 
  removePaperFromCart, 
  clearCart 
} from '../services/cartService';
import { calculateDatasetMetrics, getCitationTier } from '../services/datasetScientometrics';
import { extractAcademicTags } from '../services/academicTagger';
import { generateCOinS } from '../services/coinsGenerator';
import { downloadRISFile } from '../services/risExporter';
import { downloadWordDocument } from '../services/wordExportService';
import { AcademicPromptsModal } from './AcademicPromptsModal';
import { LiteratureExportModal } from './LiteratureExportModal';

interface ResearchCartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSeedManuscript?: (papers: AcademicPaper[]) => void;
  activeStyle?: CitationStyle;
}

export const ResearchCartDrawer: React.FC<ResearchCartDrawerProps> = ({
  isOpen,
  onClose,
  onSeedManuscript,
  activeStyle = 'apa',
}) => {
  const [papers, setPapers] = useState<AcademicPaper[]>([]);
  const [expandedAbstractId, setExpandedAbstractId] = useState<string | null>(null);
  const [isPromptsOpen, setIsPromptsOpen] = useState<boolean>(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);

  const refreshCart = () => {
    setPapers(getCartPapers());
  };

  useEffect(() => {
    refreshCart();
    const handleUpdate = () => refreshCart();
    window.addEventListener('scholarforge_cart_updated', handleUpdate);
    return () => window.removeEventListener('scholarforge_cart_updated', handleUpdate);
  }, [isOpen]);

  if (!isOpen) return null;

  const metrics = calculateDatasetMetrics(papers);

  const handleExportWord = (includeAbstracts: boolean) => {
    downloadWordDocument(papers, {
      style: activeStyle,
      includeAbstracts,
      includeTags: true,
      documentTitle: includeAbstracts ? 'Annotated Bibliography' : 'Curated Literature References',
      topic: 'Research Cart Selection',
    });
    showSuccessToast(includeAbstracts ? 'Word Annotated Bibliography exported!' : 'Word References exported!');
  };

  const handleExportRIS = () => {
    downloadRISFile(papers, 'ScholarForge_Cart_Export.ris');
    showSuccessToast('RIS file exported for Zotero/EndNote!');
  };

  const handleExportBibTeX = () => {
    // Generate BibTeX text
    const bibtexStr = papers
      .map((p) => {
        const key = (p.authors[0]?.familyName || 'paper') + (p.year || '') + (p.title.split(' ')[0] || '');
        const cleanKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
        return `@article{${cleanKey},
  title={${p.title}},
  author={${p.authors.map((a) => a.name).join(' and ')}},
  journal={${p.venue || 'Journal'}},
  year={${p.year || ''}},
  doi={${p.doi || ''}}
}`;
      })
      .join('\n\n');

    const blob = new Blob([bibtexStr], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'ScholarForge_Cart_References.bib';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showSuccessToast('BibTeX file exported!');
  };

  const showSuccessToast = (msg: string) => {
    setExportSuccess(msg);
    setTimeout(() => setExportSuccess(null), 2500);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-sm animate-fade-in">
        <div className="bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 w-full max-w-2xl h-full flex flex-col shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/60 dark:bg-slate-900/60">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Research Literature Cart
                  </h3>
                  <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
                    {papers.length} {papers.length === 1 ? 'Paper' : 'Papers'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Accumulated across searches and sessions. Ready for grounding and export.
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Toast */}
          {exportSuccess && (
            <div className="bg-emerald-50 dark:bg-emerald-950/40 border-b border-emerald-200 dark:border-emerald-800 px-4 py-2 text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-500" />
              {exportSuccess}
            </div>
          )}

          {/* Dataset Scientometrics Banner */}
          {papers.length > 0 && (
            <div className="px-6 py-3 bg-slate-100/70 dark:bg-slate-950/40 border-b border-slate-200 dark:border-slate-800 grid grid-cols-4 gap-3 text-center">
              <div>
                <div className="text-sm font-bold text-blue-600 dark:text-blue-400">
                  {metrics.hIndex}
                </div>
                <div className="text-[10px] uppercase font-semibold text-slate-500 dark:text-slate-400">
                  Dataset $h$-Index
                </div>
              </div>
              <div>
                <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  {metrics.totalCitations.toLocaleString()}
                </div>
                <div className="text-[10px] uppercase font-semibold text-slate-500 dark:text-slate-400">
                  Total Citations
                </div>
              </div>
              <div>
                <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  {metrics.avgCitations}
                </div>
                <div className="text-[10px] uppercase font-semibold text-slate-500 dark:text-slate-400">
                  Avg Citations
                </div>
              </div>
              <div>
                <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                  {metrics.openAccessPct}%
                </div>
                <div className="text-[10px] uppercase font-semibold text-slate-500 dark:text-slate-400">
                  Open Access
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions Strip */}
          {papers.length > 0 && (
            <div className="px-6 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 flex-wrap bg-white dark:bg-slate-900">
              <div className="flex items-center gap-2 flex-wrap">
                {onSeedManuscript && (
                  <button
                    onClick={() => {
                      onSeedManuscript(papers);
                      onClose();
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Seed Manuscript Studio
                  </button>
                )}
                <button
                  onClick={() => setIsPromptsOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-sm transition-all"
                >
                  <Crown className="w-3.5 h-3.5" />
                  7 LLM Prompts
                </button>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  onClick={() => setIsExportModalOpen(true)}
                  className="px-2.5 py-1 text-xs font-bold rounded-md bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1 transition-colors shadow-xs cursor-pointer"
                  title="Export Cart Records in Word, JSON, Markdown, CSV, RIS, or BibTeX"
                >
                  <Download className="w-3 h-3" />
                  <span>Export ({papers.length})</span>
                </button>
                <button
                  onClick={() => handleExportWord(false)}
                  className="px-2 py-1 text-xs font-semibold rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  title="Export Word References"
                >
                  .docx
                </button>
                <button
                  onClick={() => handleExportWord(true)}
                  className="px-2 py-1 text-xs font-semibold rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  title="Export Annotated Bibliography with abstracts"
                >
                  Annotated
                </button>
                <button
                  onClick={handleExportRIS}
                  className="px-2 py-1 text-xs font-semibold rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  title="Export RIS for Zotero / EndNote"
                >
                  RIS
                </button>
                <button
                  onClick={handleExportBibTeX}
                  className="px-2 py-1 text-xs font-semibold rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  title="Export BibTeX"
                >
                  BibTeX
                </button>
                <button
                  onClick={() => {
                    if (confirm('Clear all papers from your cart?')) {
                      clearCart();
                    }
                  }}
                  className="p-1.5 text-xs text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-md transition-colors"
                  title="Clear Cart"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Papers List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {papers.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400">
                <BookOpen className="w-12 h-12 mb-3 text-slate-300 dark:text-slate-700" />
                <h4 className="text-base font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Your Research Cart is Empty
                </h4>
                <p className="text-xs max-w-sm">
                  Click the <strong>+ Cart</strong> button on any discovered paper across the Literature Studio, Evidence Pane, or DOI Verifier to accumulate papers here.
                </p>
              </div>
            ) : (
              papers.map((paper, idx) => {
                const tier = getCitationTier(paper.citationCount || 0);
                const tags = extractAcademicTags(paper);
                const isExpanded = expandedAbstractId === paper.id;
                const coinsMetadata = generateCOinS(paper);

                return (
                  <div
                    key={paper.id || idx}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 hover:border-blue-400/40 dark:hover:border-blue-500/40 transition-all shadow-sm"
                  >
                    {/* Hidden COinS OpenURL metadata for Zotero / Mendeley detection */}
                    <span className="Z3988 hidden" title={coinsMetadata} />

                    <div className="flex items-start justify-between gap-3 mb-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-slate-400 dark:text-slate-500">
                          #{idx + 1}
                        </span>
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${tier.badgeClass}`}
                        >
                          {tier.label}
                        </span>
                        {paper.openAccess && (
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/50">
                            🔓 Open Access
                          </span>
                        )}
                        {tags.map((t) => (
                          <span
                            key={t.label}
                            className={`px-2 py-0.5 text-[10px] font-semibold rounded-full border ${t.colorClass}`}
                          >
                            {t.label}
                          </span>
                        ))}
                      </div>

                      <button
                        onClick={() => removePaperFromCart(paper.id)}
                        className="text-slate-400 hover:text-rose-500 p-1 rounded-md transition-colors"
                        title="Remove from Cart"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-snug mb-1">
                      {paper.title}
                    </h4>

                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                      {paper.authors.map((a) => a.name).join(', ') || 'Unknown Authors'} &bull;{' '}
                      {paper.year || 'n.d.'} &bull;{' '}
                      <span className="italic">{paper.venue || 'Academic Venue'}</span>
                      {paper.citationCount !== undefined && (
                        <span> &bull; {paper.citationCount.toLocaleString()} citations</span>
                      )}
                    </p>

                    {/* DOI & Abstract Toggle */}
                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                      <div className="flex items-center gap-3">
                        {paper.doi && (
                          <a
                            href={`https://doi.org/${paper.doi}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-mono text-[11px]"
                          >
                            <span>DOI: {paper.doi}</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>

                      {paper.abstract && (
                        <button
                          onClick={() => setExpandedAbstractId(isExpanded ? null : paper.id)}
                          className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1 font-medium text-[11px]"
                        >
                          {isExpanded ? (
                            <>
                              Hide Abstract <ChevronUp className="w-3 h-3" />
                            </>
                          ) : (
                            <>
                              View Abstract <ChevronDown className="w-3 h-3" />
                            </>
                          )}
                        </button>
                      )}
                    </div>

                    {isExpanded && paper.abstract && (
                      <div className="mt-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 leading-relaxed text-justify">
                        <strong className="block text-[11px] uppercase tracking-wider text-slate-400 mb-1">
                          Abstract
                        </strong>
                        {paper.abstract}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* 7 LLM Prompts Modal */}
      <AcademicPromptsModal
        isOpen={isPromptsOpen}
        onClose={() => setIsPromptsOpen(false)}
        papers={papers}
        topic="Research Cart Selection"
        style={activeStyle}
      />

      {/* Literature Export Modal */}
      <LiteratureExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        papers={papers}
        topic="Research Cart Selection"
        activeStyle={activeStyle}
      />
    </>
  );
};
