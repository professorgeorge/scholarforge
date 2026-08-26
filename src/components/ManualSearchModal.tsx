import React, { useState, useEffect } from 'react';
import type { AcademicPaper, Claim } from '../types/citation';
import { searchOpenAlex, searchCrossref } from '../services/academicApi';
import { Search, X, Loader2, ExternalLink, Check, AlertCircle } from 'lucide-react';

interface ManualSearchModalProps {
  claim: Claim | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectPaper: (claimId: string, paper: AcademicPaper) => void;
}

export const ManualSearchModal: React.FC<ManualSearchModalProps> = ({
  claim,
  isOpen,
  onClose,
  onSelectPaper,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<AcademicPaper[]>([]);
  const [loading, setLoading] = useState(false);
  const [source, setSource] = useState<'openalex' | 'crossref'>('openalex');
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    if (claim) {
      const initialQuery = claim.keywords.slice(0, 4).join(' ') || claim.text.slice(0, 50);
      setQuery(initialQuery);
      handleSearch(initialQuery, source);
    }
  }, [claim]);

  const handleSearch = async (searchQuery: string, currentSource: 'openalex' | 'crossref') => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    setHasSearched(true);

    try {
      let papers: AcademicPaper[] = [];
      if (currentSource === 'openalex') {
        papers = await searchOpenAlex(searchQuery, 8);
        if (papers.length === 0) {
          papers = await searchCrossref(searchQuery, 8);
        }
      } else {
        papers = await searchCrossref(searchQuery, 8);
      }
      setResults(papers);
    } catch (err) {
      console.error(err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !claim) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="w-full max-w-3xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-900 dark:text-blue-300">
              <Search className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white font-serif">Manual Academic Paper Search</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Direct query to OpenAlex (250M+ works) and Crossref official registries
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Claim Context Header */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
          <span className="text-[11px] uppercase font-bold tracking-wider text-blue-900 dark:text-blue-400 block mb-1">
            Target Statement in Manuscript:
          </span>
          <p className="text-sm text-slate-800 dark:text-slate-200 font-serif italic line-clamp-2">
            "{claim.text}"
          </p>
        </div>

        {/* Search Input Bar */}
        <div className="p-6 pb-3 space-y-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch(query, source);
            }}
            className="flex gap-2"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by topic, keywords, paper title, or author name..."
                className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-700 focus:ring-1 focus:ring-blue-700 transition"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-academic-primary px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 transition disabled:opacity-50 cursor-pointer shadow-xs"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
            </button>
          </form>

          {/* Database filter selector */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 font-medium">Database:</span>
            <button
              onClick={() => {
                setSource('openalex');
                handleSearch(query, 'openalex');
              }}
              className={`px-3 py-1 rounded-md font-semibold transition cursor-pointer ${
                source === 'openalex'
                  ? 'bg-blue-900 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              OpenAlex (Full-Text & Concepts)
            </button>
            <button
              onClick={() => {
                setSource('crossref');
                handleSearch(query, 'crossref');
              }}
              className={`px-3 py-1 rounded-md font-semibold transition cursor-pointer ${
                source === 'crossref'
                  ? 'bg-blue-900 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Crossref (Official DOIs)
            </button>
          </div>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto px-6 py-2 space-y-3">
          {loading && (
            <div className="py-12 flex flex-col items-center justify-center text-slate-500 gap-3">
              <Loader2 className="w-8 h-8 text-blue-800 animate-spin" />
              <span className="text-sm font-medium">Querying scholarly databases...</span>
            </div>
          )}

          {!loading && results.length === 0 && hasSearched && (
            <div className="py-12 flex flex-col items-center justify-center text-slate-500 gap-2">
              <AlertCircle className="w-8 h-8 text-amber-600" />
              <span className="text-sm font-bold text-slate-800 dark:text-slate-200">No matching peer-reviewed works found</span>
              <p className="text-xs text-slate-500 max-w-sm text-center">
                Try searching broader keyword concepts (e.g. "machine learning radiography" instead of full sentences).
              </p>
            </div>
          )}

          {!loading &&
            results.map((paper) => {
              const isSelected = claim.selectedPaper?.id === paper.id;
              return (
                <div
                  key={paper.id}
                  className={`p-4 rounded-xl border transition ${
                    isSelected
                      ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-600 dark:border-blue-500 ring-1 ring-blue-600/30'
                      : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-snug font-serif">
                        {paper.title}
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                        {paper.authors.map((a) => a.name).join(', ') || 'Scholarly Authors'}
                      </p>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 dark:text-slate-400 mt-2">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{paper.year}</span>
                        <span>•</span>
                        <span className="italic text-blue-900 dark:text-blue-400 font-medium">{paper.venue}</span>
                        {paper.citationCount > 0 && (
                          <>
                            <span>•</span>
                            <span className="px-2 py-0.5 rounded bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 font-medium">
                              {paper.citationCount} cites
                            </span>
                          </>
                        )}
                        {paper.openAccess && (
                          <span className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-medium">
                            Open Access
                          </span>
                        )}
                      </div>
                      {paper.abstract && (
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 line-clamp-2 leading-relaxed font-serif">
                          {paper.abstract}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <button
                        onClick={() => {
                          onSelectPaper(claim.id, paper);
                          onClose();
                        }}
                        className={`px-3.5 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-700 text-white'
                            : 'btn-academic-primary'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>{isSelected ? 'Selected' : 'Use Paper'}</span>
                      </button>

                      {paper.url && (
                        <a
                          href={paper.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-800 dark:text-blue-400 hover:underline flex items-center gap-1 font-semibold"
                        >
                          <span>DOI</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
