/** Rank discovery candidates by query-term coverage in supplied metadata. */

import type { AcademicPaper } from '../types/citation';

import { extractAcademicKeywords, ACRONYM_SYNONYMS } from './academicQueryParser';

/**
 * Normalised Levenshtein similarity ∈ [0, 1].
 * Identical to referenceVerifierService.calculateStringSimilarity — kept in sync
 * for consumers doing bibliographic string comparison; topic ranking does not use it.
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
  return extractAcademicKeywords(query);
}

const normalize = (text: string) => text.toLowerCase().normalize('NFKC').replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();
const stem = (word: string) => word.length > 4 && word.endsWith('ies') ? word.slice(0, -3) + 'y' : word.length > 3 && word.endsWith('s') && !/(ss|us|is)$/.test(word) ? word.slice(0, -1) : word;
function hasTerm(text: string, term: string): boolean {
  const words = new Set(normalize(text).split(' ').map(stem));
  const matches = (value: string) => normalize(value).split(' ').filter(Boolean).every(word => words.has(stem(word)));
  return matches(term) || (ACRONYM_SYNONYMS[term.toLowerCase()] || []).some(matches);
}

/** Evaluate explicit Boolean groups and quoted phrases against supplied metadata. */
function queryConstraints(query: string, text: string): boolean {
  if (!/["]|\b(?:AND|OR|NOT)\b/.test(query)) return true;
  const parts = query.match(/"[^"]*"|\(|\)|\bAND\b|\bOR\b|\bNOT\b|[^\s()"]+/g) || [];
  let index = 0;
  const atom = (): boolean => {
    const value = parts[index++];
    if (!value) return false;
    if (value === 'NOT') return !atom();
    if (value === '(') { const result = either(); if (parts[index] === ')') index++; return result; }
    if (value.startsWith('"')) return (` ${normalize(text)} `).includes(` ${normalize(value)} `);
    const terms = extractSalientTokens(value);
    return !terms.length || terms.every(term => hasTerm(text, term));
  };
  const both = (): boolean => {
    let result = atom();
    while (index < parts.length && parts[index] !== ')' && parts[index] !== 'OR') {
      if (parts[index] === 'AND') index++;
      const next = atom(); result = result && next;
    }
    return result;
  };
  const either = (): boolean => {
    let result = both();
    while (parts[index] === 'OR') { index++; const next = both(); result = result || next; }
    return result;
  };
  return either();
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
  const title = paper.title || '';
  const abstract = paper.abstract || '';
  const text = `${title} ${abstract}`;
  const matched = tokens.filter(token => hasTerm(text, token));
  const titleMatches = tokens.filter(token => hasTerm(title, token));
  const coverage = tokens.length ? matched.length / tokens.length : 0;
  const explicit = /["]|\b(?:AND|OR|NOT)\b/.test(query);
  // Lexical matching is a discovery aid, not a calibrated probability of relevance.
  // Do not let citations, a DOI, recency, or character similarity rescue a weak match.
  if (!tokens.length || !queryConstraints(query, text) || (!explicit && coverage < 0.6) || !matched.length) return { score: null };
  const titleCoverage = titleMatches.length / tokens.length;
  const exactPhrase = normalize(query).length > 2 && (` ${normalize(text)} `).includes(` ${normalize(query)} `);
  const score = coverage * 100 + titleCoverage * 35 + (exactPhrase ? 10 : 0);
  const coveragePct = Math.round(coverage * 100);
  return { score, explanation: {
    matchPercentage: coveragePct,
    titleSimilarity: Math.round(titleCoverage * 100),
    keywordCoveragePct: coveragePct,
    exactPhrase,
    citationBoost: 0,
    summary: `${matched.length} of ${tokens.length} query terms found in supplied title/abstract${abstract ? '' : '; abstract unavailable'}. Keyword coverage is not a probability of relevance.`,
  } };
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
