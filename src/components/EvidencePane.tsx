import React, { useState } from 'react';
import type { AcademicPaper, CitationStyle, Claim } from '../types/citation';
import type { SecondaryDataRecord } from '../services/secondaryDataService';
import { ClaimCard } from './ClaimCard';
import { 
  BookOpen, 
  Globe2, 
  Layers, 
  ExternalLink, 
  ChevronDown, 
  ChevronUp,
  RotateCcw,
  SlidersHorizontal
} from 'lucide-react';

interface EvidencePaneProps {
  claims: Claim[];
  uniquePapers: AcademicPaper[];
  secondaryData?: SecondaryDataRecord[];
  citationStyle: CitationStyle;
  selectedClaimId: string | null;
  onSelectPaper: (claimId: string, paper: AcademicPaper) => void;
  onToggleExclude: (claimId: string) => void;
  onOpenManualSearch: (claim: Claim) => void;
  onRetrySearch: (claim: Claim) => void;
  sensitivity?: 'all' | 'moderate' | 'high';
  setSensitivity?: (s: 'all' | 'moderate' | 'high') => void;
  onReExtractClaims?: (newSensitivity: 'all' | 'moderate' | 'high') => void;
}

export const EvidencePane: React.FC<EvidencePaneProps> = ({
  claims,
  uniquePapers,
  secondaryData = [],
  citationStyle,
  selectedClaimId,
  onSelectPaper,
  onToggleExclude,
  onOpenManualSearch,
  onRetrySearch,
  sensitivity = 'moderate',
  setSensitivity,
  onReExtractClaims,
}) => {
  const [activeTab, setActiveTab] = useState<'claims' | 'corpus' | 'secondary'>('claims');
  const [expandedAbstractId, setExpandedAbstractId] = useState<string | null>(null);

  const groundedClaimsCount = claims.filter((c) => !c.isExcluded && c.selectedPaper).length;

  return (
    <div className="academic-card rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs flex flex-col h-full">
      
      {/* Evidence Navigation Tabs */}
      <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 bg-slate-200/80 dark:bg-slate-950 p-1 rounded-lg border border-slate-300 dark:border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('claims')}
            className={`px-3 py-1.5 rounded-md font-semibold flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === 'claims'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-blue-800 dark:text-blue-400" />
            <span>Claims ({groundedClaimsCount}/{claims.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('corpus')}
            className={`px-3 py-1.5 rounded-md font-semibold flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === 'corpus'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
            <span>Corpus ({uniquePapers.length})</span>
          </button>

          {secondaryData.length > 0 && (
            <button
              onClick={() => setActiveTab('secondary')}
              className={`px-3 py-1.5 rounded-md font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                activeTab === 'secondary'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Globe2 className="w-3.5 h-3.5 text-blue-600" />
              <span>Registries ({secondaryData.length})</span>
            </button>
          )}
        </div>

        <span className="text-[11px] text-slate-500 font-sans hidden sm:block">
          OpenAlex & Crossref
        </span>
      </div>

      {/* Contextual Claim Detection Sensitivity Toolbar */}
      {activeTab === 'claims' && (
        <div className="px-4 py-2 bg-slate-50/90 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <SlidersHorizontal className="w-3 h-3 text-blue-800 dark:text-blue-400" />
              <span>Sensitivity:</span>
            </span>
            <div className="flex items-center gap-0.5 bg-slate-200/80 dark:bg-slate-900 p-0.5 rounded-lg border border-slate-300 dark:border-slate-800 text-[11px] font-medium">
              <button
                type="button"
                onClick={() => setSensitivity && setSensitivity('high')}
                className={`px-2 py-0.5 rounded transition cursor-pointer ${
                  sensitivity === 'high'
                    ? 'bg-blue-900 text-white font-bold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Strict: Focuses on numeric findings, stats, and causal metrics"
              >
                Strict
              </button>
              <button
                type="button"
                onClick={() => setSensitivity && setSensitivity('moderate')}
                className={`px-2 py-0.5 rounded transition cursor-pointer ${
                  sensitivity === 'moderate'
                    ? 'bg-blue-900 text-white font-bold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Balanced: Detects empirical and scientific assertions"
              >
                Balanced
              </button>
              <button
                type="button"
                onClick={() => setSensitivity && setSensitivity('all')}
                className={`px-2 py-0.5 rounded transition cursor-pointer ${
                  sensitivity === 'all'
                    ? 'bg-blue-900 text-white font-bold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Thorough: Cites almost every factual sentence"
              >
                Thorough
              </button>
            </div>
          </div>

          {onReExtractClaims && claims.length > 0 && (
            <button
              type="button"
              onClick={() => onReExtractClaims(sensitivity)}
              className="px-2.5 py-1 rounded-md bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900 text-blue-900 dark:text-blue-300 font-semibold border border-blue-200 dark:border-blue-800 text-[11px] flex items-center gap-1 cursor-pointer transition shadow-2xs"
              title="Re-extract manuscript claims using selected sensitivity"
            >
              <RotateCcw className="w-3 h-3 text-blue-700 dark:text-blue-400" />
              <span>Re-scan Claims</span>
            </button>
          )}
        </div>
      )}

      {/* Content Stream */}
      <div className="flex-1 p-4 overflow-y-auto max-h-[640px] space-y-3">
        
        {/* Tab 1: Interactive Claim Cards */}
        {activeTab === 'claims' && (
          <div className="space-y-3">
            {claims.map((claim, idx) => (
              <ClaimCard
                key={claim.id}
                claim={claim}
                index={idx}
                citationStyle={citationStyle}
                onSelectPaper={onSelectPaper}
                onToggleExclude={onToggleExclude}
                onOpenManualSearch={onOpenManualSearch}
                onRetrySearch={onRetrySearch}
                isSelected={selectedClaimId === claim.id}
              />
            ))}
          </div>
        )}

        {/* Tab 2: Verified Literature Corpus Summary */}
        {activeTab === 'corpus' && (
          <div className="space-y-3">
            {uniquePapers.map((paper, idx) => {
              const isExpanded = expandedAbstractId === paper.id;
              return (
                <div
                  key={paper.id}
                  className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-blue-400 transition"
                >
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-blue-800 dark:text-blue-400">
                          #{idx + 1}
                        </span>
                        <span className="text-[11px] px-2 py-0.2 rounded bg-blue-50 dark:bg-blue-950 text-blue-900 dark:text-blue-300 font-semibold">
                          {paper.year || 'Recent'}
                        </span>
                        {paper.citationCount > 0 && (
                          <span className="text-[11px] text-slate-500 font-medium">
                            {paper.citationCount.toLocaleString()} citations
                          </span>
                        )}
                      </div>

                      <h4 className="text-xs font-bold text-slate-900 dark:text-white font-serif mt-1 leading-snug">
                        {paper.title}
                      </h4>

                      <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
                        <span className="font-medium text-slate-800 dark:text-slate-200">
                          {paper.authors.slice(0, 3).map((a) => a.name).join(', ') + (paper.authors.length > 3 ? ' et al.' : '')}
                        </span>
                        <span> • </span>
                        <span className="italic text-blue-900 dark:text-blue-400">{paper.venue}</span>
                      </div>

                      {/* Abstract Drawer */}
                      {isExpanded && paper.abstract && (
                        <div className="mt-2 p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 font-serif leading-relaxed animate-in fade-in duration-150">
                          {paper.abstract}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {paper.abstract && (
                        <button
                          type="button"
                          onClick={() => setExpandedAbstractId(isExpanded ? null : paper.id)}
                          className="text-xs text-slate-500 hover:text-slate-900 flex items-center cursor-pointer"
                          title="Toggle Abstract"
                        >
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                      )}

                      {paper.url && (
                        <a
                          href={paper.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 rounded text-blue-800 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950"
                          title="View verified DOI"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Tab 3: Public Secondary Registries */}
        {activeTab === 'secondary' && (
          <div className="space-y-3">
            {secondaryData.map((rec) => (
              <div
                key={rec.id}
                className="p-3.5 rounded-xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/60 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-300 uppercase">
                    {rec.sourceName}
                  </span>
                  <a
                    href={rec.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-emerald-800 dark:text-emerald-400 hover:underline flex items-center gap-1 font-semibold"
                  >
                    <span>Registry Record</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <h4 className="text-xs font-bold text-slate-900 dark:text-white font-serif">
                  {rec.title}
                </h4>

                <p className="text-xs text-slate-700 dark:text-slate-300 font-sans leading-relaxed">
                  {rec.description}
                </p>

                <div className="text-[11px] text-emerald-900 dark:text-emerald-300 font-mono pt-1">
                  <strong>Metrics:</strong> {rec.metrics}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};
