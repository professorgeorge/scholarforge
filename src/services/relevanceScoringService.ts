/**
 * Shared Academic Relevance Scoring Service
 *
 * Applies the same rigorous multi-signal scoring used by the Reference Verifier
 * to rank literature search results by genuine topical relevance.
 *
 * Scoring signals (additive):
 *  1. Title similarity       — Levenshtein edit-distance (same algorithm as verifier)
 *  2. Abstract similarity    — token-level Jaccard overlap
 *  3. Keyword coverage ratio — salient query tokens present in title/abstract
 *  4. Exact-phrase bonus     — full query phrase found verbatim
 *  5. Citation authority     — log-scaled, hard-capped to avoid drowning topical signals
 *  6. Recency bump           — mild bonus for last-10-year publications
 *  7. Structural quality     — DOI present, abstract ≥ 60 chars
 *  8. Off-topic gate         — papers with no meaningful overlap are dropped entirely
 */

import type { AcademicPaper } from '../types/citation';

// ─── Tuneable constants ───────────────────────────────────────────────────────

/** Minimum title-OR-abstract signal before gate is applied. */
const TITLE_SIM_FLOOR = 0.18;

/** Keyword coverage ≥ this fraction earns a high-fidelity bonus. */
const MIN_COVERAGE_FOR_BONUS = 0.55;

/** Keyword coverage < this fraction (on a multi-token query) incurs a penalty. */
const LOW_COVERAGE_PENALTY_THRESHOLD = 0.20;

/** Maximum citation count contribution (log-scaled). */
const MAX_CITATION_BOOST = 20;

// ─── Internal utilities ───────────────────────────────────────────────────────

/**
 * Normalised Levenshtein similarity ∈ [0, 1].
 * Identical to referenceVerifierService.calculateStringSimilarity — kept in sync
 * so both verifier and literature search use the same string comparison.
 */
export function stringSimilarity(str1: string, str2: string): number {
  const s1 = (str1 || '').toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
  const s2 = (str2 || '').toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();

  if (s1 === s2) return 1.0;
  if (!s1 || !s2) return 0.0;

  // For long strings, fall back to token Jaccard to avoid O(n²) cost.
  if (s1.length > 300 || s2.length > 300) {
    return tokenJaccard(s1, s2);
  }

  const len1 = s1.length;
  const len2 = s2.length;
  const matrix: number[][] = Array(len1 + 1)
    .fill(null)
    .map(() => Array(len2 + 1).fill(0));

  for (let i = 0; i <= len1; i++) matrix[i][0] = i;
  for (let j = 0; j <= len2; j++) matrix[0][j] = j;

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  const distance = matrix[len1][len2];
  return 1 - distance / Math.max(len1, len2);
}

/**
 * Token-level Jaccard similarity — |A ∩ B| / |A ∪ B|.
 * Effective for capturing shared vocabulary between topic queries and abstracts.
 */
export function tokenJaccard(text1: string, text2: string): number {
  const tokenise = (s: string) =>
    new Set(
      s
        .toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter((t) => t.length >= 3)
    );

  const a = tokenise(text1);
  const b = tokenise(text2);
  if (a.size === 0 && b.size === 0) return 1.0;
  if (a.size === 0 || b.size === 0) return 0.0;

  let intersection = 0;
  for (const token of a) {
    if (b.has(token)) intersection++;
  }
  return intersection / (a.size + b.size - intersection);
}

/**
 * Strips academic stop-words and returns salient keyword tokens from a query.
 */
export function extractSalientTokens(query: string): string[] {
  const STOP_WORDS = new Set([
    'a','an','the','and','or','not','in','on','at','to','of','for','by',
    'with','is','are','was','were','be','been','being','do','does','did',
    'have','has','had','will','would','could','should','may','might','can',
    'this','that','these','those','it','its','from','as','up','out','about',
    'into','through','during','including','until','against','among',
    'throughout','despite','towards','upon','concerning','across',
  ]);

  return query
    .toLowerCase()
    .replace(/[^\w\s-]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length >= 4 && !STOP_WORDS.has(t));
}

// ─── Public API ───────────────────────────────────────────────────────────────

export interface RelevanceExplanation {
  matchPercentage: number;
  titleSimilarity: number;
  keywordCoveragePct: number;
  exactPhrase: boolean;
  citationBoost: number;
  summary: string;
}

/**
 * Computes a detailed multi-signal relevance evaluation for a paper against a query.
 */
export function computePaperRelevanceDetail(
  paper: AcademicPaper,
  query: string,
  salientTokens?: string[]
): { score: number | null; explanation?: RelevanceExplanation } {
  const tokens = salientTokens ?? extractSalientTokens(query);
  const titleLower    = (paper.title    || '').toLowerCase();
  const abstractLower = (paper.abstract || '').toLowerCase();
  const queryLower    = query.toLowerCase().trim();

  // ── Off-topic gate ────────────────────────────────────────────────────────
  const titleLev     = stringSimilarity(queryLower, titleLower);
  const titleJaccard = tokenJaccard(queryLower, titleLower);
  const bestTitle    = Math.max(titleLev, titleJaccard);

  if (bestTitle < TITLE_SIM_FLOOR) {
    const absJaccard = tokenJaccard(queryLower, abstractLower);
    if (absJaccard < 0.12) {
      return { score: null }; // genuinely off-topic
    }
  }

  let score = 0;

  // Signal 1: Title (weight up to 55)
  const titleContrib = bestTitle * 55;
  score += titleContrib;

  // Signal 2: Abstract similarity (weight up to 20)
  let absContrib = 0;
  if (abstractLower.length > 40) {
    absContrib = tokenJaccard(queryLower, abstractLower) * 20;
    score += absContrib;
  }

  // Signal 3: Per-token keyword matching
  for (const token of tokens) {
    if (titleLower.includes(token))    score += 6;
    if (abstractLower.includes(token)) score += 2.5;
  }

  // Signal 4: Keyword coverage ratio
  let coveragePct = 0;
  if (tokens.length > 0) {
    const salient = tokens.slice(0, 6);
    const matched = salient.filter(
      (t) => titleLower.includes(t) || abstractLower.includes(t)
    );
    coveragePct = Math.round((matched.length / salient.length) * 100);

    if (coveragePct >= MIN_COVERAGE_FOR_BONUS * 100) {
      score += 30;
    } else if (coveragePct < LOW_COVERAGE_PENALTY_THRESHOLD * 100 && salient.length > 2) {
      score -= 20;
    }
  }

  // Signal 5: Exact-phrase bonus
  let exactMatch = false;
  if (queryLower.length > 6) {
    if (titleLower.includes(queryLower)) {
      score += 50;
      exactMatch = true;
    } else if (abstractLower.includes(queryLower)) {
      score += 20;
      exactMatch = true;
    }
  }

  // Signal 6: Native API relevance score (OpenAlex)
  if (paper.relevanceScore && paper.relevanceScore > 0) {
    score += Math.min(paper.relevanceScore * 8, 18);
  }

  // Signal 7: Citation authority (log-scaled, hard cap)
  const citeBoost = Math.min(Math.log10((paper.citationCount || 0) + 1) * 4, MAX_CITATION_BOOST);
  score += citeBoost;

  // Signal 8: Structural quality & recency
  if (paper.doi) score += 8;
  if (abstractLower.length > 60) score += 6;
  if (paper.year && paper.year >= new Date().getFullYear() - 10) score += 5;

  // Normalize match percentage for UI presentation (scaled roughly 40% to 99%)
  const clampedScore = Math.max(score, 10);
  const matchPercentage = Math.min(Math.round(45 + (clampedScore / 175) * 54), 99);

  const titleSimilarityPct = Math.round(bestTitle * 100);
  const summaryParts: string[] = [];
  if (exactMatch) summaryParts.push('Exact query match');
  if (titleSimilarityPct > 60) summaryParts.push(`${titleSimilarityPct}% title similarity`);
  if (coveragePct > 50) summaryParts.push(`${coveragePct}% keyword coverage`);
  if (paper.citationCount > 50) summaryParts.push(`Cited ${paper.citationCount}×`);

  const explanation: RelevanceExplanation = {
    matchPercentage,
    titleSimilarity: titleSimilarityPct,
    keywordCoveragePct: coveragePct,
    exactPhrase: exactMatch,
    citationBoost: Math.round(citeBoost),
    summary: summaryParts.length > 0 ? summaryParts.join(' • ') : 'Topic & vocabulary alignment',
  };

  return { score, explanation };
}

/**
 * Computes a multi-signal relevance score for a single paper against a query.
 */
export function computePaperRelevance(
  paper: AcademicPaper,
  query: string,
  salientTokens?: string[]
): number | null {
  return computePaperRelevanceDetail(paper, query, salientTokens).score;
}

/**
 * Sorts an array of papers by relevance to the given query.
 *
 * @param papers         Raw pool of papers from any source.
 * @param query          The user's search/topic query.
 * @param filterOffTopic Drop papers that fail the off-topic gate (default: true).
 * @returns Papers sorted highest-relevance first with attached relevanceExplanation.
 */
export function rankPapersByRelevance(
  papers: AcademicPaper[],
  query: string,
  filterOffTopic = true
): AcademicPaper[] {
  const tokens = extractSalientTokens(query);
  const scored: { paper: AcademicPaper; score: number }[] = [];

  for (const paper of papers) {
    const detail = computePaperRelevanceDetail(paper, query, tokens);
    if (detail.score === null) {
      if (!filterOffTopic) {
        paper.relevanceExplanation = detail.explanation;
        scored.push({ paper, score: -999 });
      }
      // else: silently drop
    } else {
      paper.relevanceExplanation = detail.explanation;
      scored.push({ paper, score: detail.score });
    }
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.map((s) => s.paper);
}
