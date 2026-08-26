import React, { useState } from 'react';
import type { Claim, AcademicPaper, CitationStyle } from '../types/citation';
import { 
  ExternalLink, 
  Search, 
  ChevronDown, 
  ChevronUp, 
  EyeOff, 
  Eye, 
  RefreshCw, 
  AlertCircle
} from 'lucide-react';
import { formatInTextCitation } from '../services/citationFormatter';

interface ClaimCardProps {
  claim: Claim;
  index: number;
  citationStyle: CitationStyle;
  onSelectPaper: (claimId: string, paper: AcademicPaper) => void;
  onToggleExclude: (claimId: string) => void;
  onOpenManualSearch: (claim: Claim) => void;
  onRetrySearch?: (claim: Claim) => void;
  isSelected?: boolean;
}

export const ClaimCard: React.FC<ClaimCardProps> = ({
  claim,
  index,
  citationStyle,
  onSelectPaper,
  onToggleExclude,
  onOpenManualSearch,
  isSelected = false,
}) => {
  const [showAbstract, setShowAbstract] = useState(false);
  const [showCandidates, setShowCandidates] = useState(false);

  const selectedPaper = claim.selectedPaper;
  const inTextTag = selectedPaper ? formatInTextCitation(selectedPaper, citationStyle, claim.citationNumber || index + 1) : '';

  return (
    <div
      id={`claim-card-${claim.id}`}
      className={`academic-card rounded-xl p-4 sm:p-5 transition-all duration-150 ${
        claim.isExcluded
          ? 'opacity-40 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800'
          : isSelected
          ? 'bg-white dark:bg-slate-900 border-blue-600 dark:border-blue-500 ring-2 ring-blue-600/20'
          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
      }`}
    >
      {/* Header: Claim Index & Confidence Badge */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-mono text-xs font-bold border border-slate-200 dark:border-slate-700">
            #{index + 1}
          </span>

          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded-md ${
              claim.confidence === 'high'
                ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-900 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
            }`}
          >
            {claim.confidence === 'high' ? 'Empirical Claim' : 'Factual Assertion'}
          </span>

          {claim.isExcluded && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
              Excluded
            </span>
          )}
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onToggleExclude(claim.id)}
            className="p-1.5 rounded-md text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            title={claim.isExcluded ? 'Include citation' : 'Exclude from citations'}
          >
            {claim.isExcluded ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>

          <button
            onClick={() => onOpenManualSearch(claim)}
            className="p-1.5 rounded-md text-slate-500 hover:text-blue-800 dark:text-slate-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-slate-800 transition cursor-pointer"
            title="Search academic database manually"
          >
            <Search className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Claim Sentence Text */}
      <div className="text-sm font-serif text-slate-900 dark:text-slate-100 leading-relaxed mb-3 pl-2.5 border-l-2 border-blue-700 dark:border-blue-500">
        "{claim.text}"
      </div>

      {/* Searching Status Indicator */}
      {claim.status === 'searching' && (
        <div className="flex items-center gap-2.5 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-xs font-medium text-blue-900 dark:text-blue-300">
          <RefreshCw className="w-4 h-4 animate-spin text-blue-700 dark:text-blue-400" />
          <span>Querying OpenAlex & Crossref journal indices...</span>
        </div>
      )}

      {/* Not Found state */}
      {claim.status === 'not_found' && !claim.isExcluded && (
        <div className="flex items-center justify-between p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-300">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-700 dark:text-amber-400" />
            <span>No exact match found in open index.</span>
          </div>
          <button
            onClick={() => onOpenManualSearch(claim)}
            className="px-2.5 py-1 rounded bg-amber-200/60 hover:bg-amber-200 dark:bg-amber-900/60 text-amber-900 dark:text-amber-100 font-semibold transition cursor-pointer"
          >
            Search Manually
          </button>
        </div>
      )}

      {/* Selected Paper Details */}
      {selectedPaper && !claim.isExcluded && (
        <div className="rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3.5 space-y-2.5">
          
          {/* Paper Title & Tag */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-snug font-serif">
                {selectedPaper.title}
              </h4>
              
              <div className="text-xs text-slate-600 dark:text-slate-400 mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {selectedPaper.authors.length > 0
                    ? selectedPaper.authors.slice(0, 3).map((a) => a.name).join(', ') + (selectedPaper.authors.length > 3 ? ' et al.' : '')
                    : 'Scholarly Authors'}
                </span>
                <span>•</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">{selectedPaper.year}</span>
                <span>•</span>
                <span className="italic text-blue-900 dark:text-blue-400">{selectedPaper.venue}</span>
              </div>
            </div>

            {/* In-Text Tag Preview */}
            <div className="shrink-0 font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-900 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              {inTextTag}
            </div>
          </div>

          {/* Paper Badges & Links */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800 text-xs">
            <div className="flex items-center gap-2">
              {selectedPaper.citationCount > 0 && (
                <span className="text-xs px-2 py-0.5 rounded bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 font-medium">
                  {selectedPaper.citationCount.toLocaleString()} citations
                </span>
              )}
              {selectedPaper.openAccess && (
                <span className="text-xs px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-medium">
                  Open Access
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              {/* Abstract Toggle */}
              {selectedPaper.abstract && (
                <button
                  onClick={() => setShowAbstract(!showAbstract)}
                  className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center gap-0.5 transition cursor-pointer"
                >
                  <span>Abstract</span>
                  {showAbstract ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              )}

              {/* Direct DOI Hyperlink */}
              {selectedPaper.url && (
                <a
                  href={selectedPaper.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-blue-800 dark:text-blue-400 hover:underline flex items-center gap-1"
                  title="View verified published article on DOI repository"
                >
                  <span>DOI</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>

          {/* Abstract Content */}
          {showAbstract && selectedPaper.abstract && (
            <div className="mt-2 p-3 rounded-lg bg-white dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-300 leading-relaxed border border-slate-200 dark:border-slate-800 font-serif animate-in fade-in duration-150">
              {selectedPaper.abstract}
            </div>
          )}

          {/* Candidate Papers / Swap Options */}
          {claim.candidatePapers.length > 1 && (
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setShowCandidates(!showCandidates)}
                className="w-full text-left text-xs text-blue-800 dark:text-blue-400 hover:underline font-semibold flex items-center justify-between cursor-pointer"
              >
                <span>Swap alternative paper ({claim.candidatePapers.length} candidates available)</span>
                {showCandidates ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {showCandidates && (
                <div className="mt-2 space-y-2">
                  {claim.candidatePapers.map((paper, pIdx) => {
                    const isCurrent = paper.id === selectedPaper.id;
                    return (
                      <div
                        key={paper.id || pIdx}
                        onClick={() => onSelectPaper(claim.id, paper)}
                        className={`p-2.5 rounded-lg cursor-pointer text-xs border transition ${
                          isCurrent
                            ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-600 dark:border-blue-500 text-slate-900 dark:text-white'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div className="font-bold font-serif line-clamp-1">{paper.title}</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-2">
                          <span>{paper.year}</span>
                          <span>•</span>
                          <span className="italic">{paper.venue}</span>
                          <span>•</span>
                          <span>{paper.citationCount} cites</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

        </div>
      )}
    </div>
  );
};
