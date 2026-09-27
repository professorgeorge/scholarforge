import type { AcademicPaper, DatasetMetrics } from '../types/citation';

/**
 * Calculates dataset-level scientometrics for a corpus or research cart of academic papers.
 */
export function calculateDatasetMetrics(papers: AcademicPaper[]): DatasetMetrics {
  if (!papers || papers.length === 0) {
    return {
      totalPapers: 0,
      totalCitations: 0,
      avgCitations: 0,
      hIndex: 0,
      highlyCitedCount: 0,
      influentialCount: 0,
      emergingCount: 0,
      openAccessCount: 0,
      openAccessPct: 0,
    };
  }

  const counts = papers
    .map((p) => p.citationCount || 0)
    .sort((a, b) => b - a);

  const totalCitations = counts.reduce((acc, c) => acc + c, 0);
  const avgCitations = Math.round((totalCitations / papers.length) * 10) / 10;

  // Calculate dataset h-index
  let hIndex = 0;
  for (let i = 0; i < counts.length; i++) {
    if (counts[i] >= i + 1) {
      hIndex = i + 1;
    } else {
      break;
    }
  }

  const highlyCitedCount = counts.filter((c) => c >= 100).length;
  const influentialCount = counts.filter((c) => c >= 25 && c < 100).length;
  const emergingCount = counts.filter((c) => c < 25).length;
  const openAccessCount = papers.filter((p) => p.openAccess || Boolean(p.openAccessPdf)).length;
  const openAccessPct = Math.round((openAccessCount / papers.length) * 100);

  return {
    totalPapers: papers.length,
    totalCitations,
    avgCitations,
    hIndex,
    highlyCitedCount,
    influentialCount,
    emergingCount,
    openAccessCount,
    openAccessPct,
  };
}

export type CitationTier = 'highly_cited' | 'influential' | 'emerging';

export function getCitationTier(citations: number): {
  tier: CitationTier;
  label: string;
  badgeClass: string;
} {
  if (citations >= 100) {
    return {
      tier: 'highly_cited',
      label: '🔥 Highly Cited (100+)',
      badgeClass: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/50',
    };
  }
  if (citations >= 25) {
    return {
      tier: 'influential',
      label: '⭐ Influential (25+)',
      badgeClass: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/50',
    };
  }
  return {
    tier: 'emerging',
    label: '🌱 Emerging',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/50',
  };
}
