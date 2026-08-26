import React from 'react';
import type { Claim } from '../types/citation';
import { CheckCircle, ShieldCheck, Layers, Award } from 'lucide-react';

interface StatsBarProps {
  claims: Claim[];
  totalSentences: number;
}

export const StatsBar: React.FC<StatsBarProps> = ({ claims, totalSentences }) => {
  const activeClaims = claims.filter((c) => !c.isExcluded);
  const matchedClaims = activeClaims.filter((c) => c.selectedPaper !== null);
  const uniqueDois = new Set(
    matchedClaims
      .map((c) => c.selectedPaper?.doi)
      .filter((doi): doi is string => Boolean(doi))
  );

  const totalCitationsCount = matchedClaims.reduce(
    (acc, curr) => acc + (curr.selectedPaper?.citationCount || 0),
    0
  );
  const avgCitations = matchedClaims.length > 0 ? Math.round(totalCitationsCount / matchedClaims.length) : 0;

  // Academic citation depth benchmark
  let citationTier = 'Standard Publication Depth';
  let tierColor = 'text-emerald-800 dark:text-emerald-300';
  if (uniqueDois.size < 15) {
    citationTier = 'Brief Scholarly Note';
    tierColor = 'text-slate-600 dark:text-slate-400';
  } else if (uniqueDois.size >= 30) {
    citationTier = 'Comprehensive Survey Depth';
    tierColor = 'text-blue-900 dark:text-blue-300';
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        {/* Stat 1 */}
        <div className="academic-card rounded-xl p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-3.5">
          <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-900 dark:text-blue-300">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Claims Grounded</div>
            <div className="text-xl font-bold text-slate-900 dark:text-white flex items-baseline gap-1.5 mt-0.5">
              {matchedClaims.length}
              <span className="text-xs text-slate-500 font-normal">of {totalSentences || claims.length} claims</span>
            </div>
          </div>
        </div>

        {/* Stat 2 */}
        <div className="academic-card rounded-xl p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-3.5">
          <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Verified DOIs</div>
            <div className="text-xl font-bold text-emerald-800 dark:text-emerald-400 flex items-baseline gap-1.5 mt-0.5">
              {uniqueDois.size}
              <span className="text-xs text-slate-500 font-normal ml-1">
                references
              </span>
            </div>
          </div>
        </div>

        {/* Stat 3 */}
        <div className="academic-card rounded-xl p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-3.5">
          <div className="p-2.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-300">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Grounding Integrity</div>
            <div className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-0.5">
              {claims.length > 0 ? `${Math.round((matchedClaims.length / claims.length) * 100)}%` : '100%'}
              <span className="text-xs text-slate-500 font-normal ml-1.5">peer-reviewed</span>
            </div>
          </div>
        </div>

        {/* Stat 4 */}
        <div className="academic-card rounded-xl p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-3.5">
          <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Mean Citation Impact</div>
            <div className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-0.5">
              {avgCitations.toLocaleString()}
              <span className="text-xs text-slate-500 font-normal ml-1.5">cites / paper</span>
            </div>
          </div>
        </div>
      </div>

      {/* Academic Citation Benchmark Strip */}
      <div className="px-4 py-2 rounded-lg bg-slate-100/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
        <span className="text-slate-600 dark:text-slate-400 font-medium">
          Literature Coverage: <strong className={tierColor}>{citationTier}</strong>
        </span>
        <span className="font-mono text-slate-500">
          Peer-Reviewed Journal Benchmark
        </span>
      </div>
    </div>
  );
};
