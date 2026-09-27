/**
 * Reference Authenticity & Hallucination Verifier Engine
 * Ported and integrated from scholar-ref-verifier into ScholarForge.
 *
 * Verifies authenticity of bibliographic references, detects AI-hallucinated citations,
 * flags field discrepancies (wrong year, misspelled author, wrong journal),
 * and provides verified, corrected citations in standard academic formats.
 */

import { formatReferenceEntryHtml, generateBibtexEntry } from './citationFormatter';
import type { AcademicPaper, Author } from '../types/citation';
import { searchEuropePmc } from './europePmcService';
import { searchArxiv } from './arxivService';
import { checkPaperRetraction } from './retractionSentinel';

export interface ParsedCitation {
  raw: string;
  doi?: string;
  arxivId?: string;
  year?: number;
  authors: string[];
  authorString: string;
  title: string;
  venue: string;
  cleanQuery: string;
}

export interface Discrepancy {
  field: 'year' | 'author' | 'title' | 'venue' | 'record' | 'duplicate' | 'retraction';
  message: string;
}

export interface VerifiedReferenceResult {
  id: string;
  raw: string;
  parsed: ParsedCitation;
  verifiedPaper: AcademicPaper | null;
  status: 'verified' | 'discrepancy' | 'not_found';
  confidence: number; // 0 to 100
  discrepancies: Discrepancy[];
  scholarUrl: string;
  isDuplicate?: boolean;
  duplicateOf?: number;
  isRetracted?: boolean;
  retractionDetails?: string;
  correctedCitations: Record<string, string>;
}

export interface BatchVerificationReport {
  total: number;
  verifiedCount: number;
  discrepancyCount: number;
  notFoundCount: number;
  authenticityScore: number; // 0 to 100
  results: VerifiedReferenceResult[];
}

const POLITE_EMAIL = 'scholarforge-app@gmail.com';

/**
 * Splits raw bibliography text into individual reference items.
 */
export function splitBibliography(rawText: string): string[] {
  if (!rawText || !rawText.trim()) return [];

  const normalized = rawText.replace(/\r\n/g, '\n').trim();

  // Numbered list pattern: [1] ..., 1. ..., (1) ...
  const numberedPattern = /(?:^|\n)(?:\[\d+\]|\d+[\.\)]|\(\d+\))\s+/;
  if (numberedPattern.test(normalized)) {
    const items = normalized
      .split(/(?:^|\n)(?=(?:\[\d+\]|\d+[\.\)]|\(\d+\))\s+)/)
      .map((item) => item.replace(/^(?:\[\d+\]|\d+[\.\)]|\(\d+\))\s*/, '').trim())
      .filter((item) => item.length > 5);
    if (items.length > 0) return items;
  }

  // Double linebreak separation
  const doubleSplit = normalized.split(/\n\s*\n/).map((s) => s.trim()).filter((s) => s.length > 5);
  if (doubleSplit.length > 1) return doubleSplit;

  // Single line split fallback
  const lineSplit = normalized.split(/\n/).map((s) => s.trim()).filter((s) => s.length > 10);
  return lineSplit.length > 0 ? lineSplit : [normalized];
}

/**
 * Parses raw citation string into structured components.
 */
export function parseRawCitation(rawText: string): ParsedCitation {
  const text = rawText.trim();
  const parsed: ParsedCitation = {
    raw: text,
    authors: [],
    authorString: '',
    title: '',
    venue: '',
    cleanQuery: '',
  };

  // 1. Extract DOI
  const doiMatch = text.match(/(?:https?:\/\/doi\.org\/|doi:\s*|doi\.org\/)?(10\.\d{4,9}\/[-._;()/:A-Za-z0-9]+)/i);
  if (doiMatch) {
    parsed.doi = doiMatch[1].replace(/[\.,;\)]+$/, '');
  }

  // 2. Extract arXiv ID
  const arxivMatch = text.match(/(?:arXiv:\s*|arxiv\.org\/(?:abs|pdf)\/)(\d{4}\.\d{4,5}(?:v\d+)?|[a-z\-]+(?:\.[A-Z]{2})?\/\d{7})/i);
  if (arxivMatch) {
    parsed.arxivId = arxivMatch[1];
  }

  // 3. Extract Year
  const yearMatch = text.match(/(?:\(|\b)(19\d\d|20\d\d)(?:\)|\b)/);
  if (yearMatch) {
    parsed.year = parseInt(yearMatch[1], 10);
  }

  // 4. Extract Title & Authors
  let clean = text
    .replace(/https?:\/\/[^\s]+/g, '')
    .replace(/doi:\s*10\.\d+\/[^\s]+/i, '')
    .replace(/^\[?\d+[\].\)]\s*/, '')
    .trim();

  // Check quotes
  const quoteMatch = clean.match(/["“]([^"”]{5,})["”]/);
  if (quoteMatch) {
    parsed.title = quoteMatch[1].trim();
    const parts = clean.split(quoteMatch[0]);
    if (parts[0]) {
      parsed.authorString = parts[0].replace(/\(\d{4}\)|\d{4}/g, '').replace(/[,.;]+$/, '').trim();
    }
    if (parts[1]) {
      parsed.venue = parts[1].replace(/^[,\s.]+/, '').trim();
    }
  } else {
    // Standard format: Author (Year). Title. Venue.
    const stdMatch = clean.match(/^(.*?)\s*\((19\d\d|20\d\d)\)\s*[\.\:\,]\s*(.*?)(?:\.|$)(.*)/);
    if (stdMatch) {
      parsed.authorString = stdMatch[1].trim();
      parsed.title = stdMatch[3].trim();
      parsed.venue = stdMatch[4]?.trim() || '';
    } else {
      // Fallback splitting on dots
      const parts = clean.split(/\.\s+/);
      if (parts.length >= 2) {
        parsed.authorString = parts[0].trim();
        parsed.title = parts[1].trim();
        parsed.venue = parts.slice(2).join('. ').trim();
      } else {
        parsed.title = clean;
      }
    }
  }

  // Clean authors
  if (parsed.authorString) {
    parsed.authors = parsed.authorString
      .split(/,\s*|\s+and\s+|&\s*/)
      .map((a) => a.trim())
      .filter((a) => a.length > 1 && !/^\d+$/.test(a));
  }

  // Search query
  const searchTerms = [parsed.title || parsed.raw, parsed.authors[0] || '', parsed.year ? String(parsed.year) : '']
    .filter(Boolean)
    .join(' ');
  parsed.cleanQuery = searchTerms.slice(0, 150);

  return parsed;
}

/**
 * Calculates Levenshtein string similarity (0.0 to 1.0).
 */
function calculateStringSimilarity(str1: string, str2: string): number {
  const s1 = (str1 || '').toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
  const s2 = (str2 || '').toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();

  if (s1 === s2) return 1.0;
  if (!s1 || !s2) return 0.0;

  const len1 = s1.length;
  const len2 = s2.length;
  const matrix: number[][] = Array(len1 + 1).fill(null).map(() => Array(len2 + 1).fill(0));

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
  const maxLen = Math.max(len1, len2);
  return 1 - distance / maxLen;
}

/**
 * Look up official work record directly by DOI across Crossref & OpenAlex.
 */
async function lookupByDoi(doi: string): Promise<AcademicPaper | null> {
  const cleanDoi = doi.trim();
  if (!cleanDoi) return null;

  // 1. Try Crossref DOI lookup
  try {
    const url = `https://api.crossref.org/works/${encodeURIComponent(cleanDoi)}?mailto=${POLITE_EMAIL}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      const item = data.message;
      if (item) {
        const title = (Array.isArray(item.title) ? item.title[0] : item.title || 'Untitled Work').replace(/<[^>]*>/g, '').trim();
        const year = item.published?.['date-parts']?.[0]?.[0] || 
                     item['issued']?.['date-parts']?.[0]?.[0] || 
                     new Date().getFullYear();
        const venue = (Array.isArray(item['container-title']) ? item['container-title'][0] : item['container-title']) || item.publisher || 'Academic Journal';
        const rawAuthors: Author[] = (item.author || []).map((a: any) => ({
          name: `${a.given || ''} ${a.family || ''}`.trim() || a.name || 'Author',
          givenName: a.given,
          familyName: a.family,
        }));

        return {
          id: `crossref_${item.DOI}`,
          title,
          authors: rawAuthors,
          year,
          venue,
          doi: item.DOI,
          url: item.URL || `https://doi.org/${item.DOI}`,
          citationCount: item['is-referenced-by-count'] || 0,
          abstract: (item.abstract || '').replace(/<[^>]*>/g, '').trim(),
          openAccess: Boolean(item.link?.length),
          source: 'crossref',
          volume: item.volume || '',
          issue: item.issue || '',
          pages: item.page || '',
        };
      }
    }
  } catch {
    // Continue to OpenAlex
  }

  // 2. Try OpenAlex DOI lookup
  try {
    const url = `https://api.openalex.org/works/https://doi.org/${encodeURIComponent(cleanDoi)}?mailto=${POLITE_EMAIL}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data && data.title) {
        const rawAuthors: Author[] = (data.authorships || []).map((a: any) => {
          const name = a.author?.display_name || 'Author';
          const parts = name.split(' ');
          return {
            name,
            givenName: parts.length > 1 ? parts.slice(0, -1).join(' ') : '',
            familyName: parts.length > 1 ? parts[parts.length - 1] : parts[0],
          };
        });

        const doiStr = data.doi ? data.doi.replace(/^https?:\/\/doi\.org\//, '') : cleanDoi;

        return {
          id: `openalex_${data.id || doiStr}`,
          title: data.title.trim(),
          authors: rawAuthors,
          year: data.publication_year || new Date().getFullYear(),
          venue: data.primary_location?.source?.display_name || 'Academic Journal',
          doi: doiStr,
          url: data.doi || `https://doi.org/${doiStr}`,
          citationCount: data.cited_by_count || 0,
          abstract: '',
          openAccess: data.open_access?.is_oa || false,
          source: 'openalex',
          volume: data.biblio?.volume || '',
          issue: data.biblio?.issue || '',
          pages: data.biblio?.first_page ? `${data.biblio.first_page}-${data.biblio.last_page || ''}` : '',
        };
      }
    }
  } catch {
    // OpenAlex failed
  }

  return null;
}

/**
 * Searches Crossref using bibliographic query parameters.
 */
async function searchCrossrefPolite(parsed: ParsedCitation): Promise<AcademicPaper[]> {
  try {
    const query = parsed.title && parsed.title.length > 5 ? parsed.title : (parsed.cleanQuery || parsed.raw);
    const params = new URLSearchParams();
    params.append('query.bibliographic', query.replace(/[^\w\s-]/g, ' ').slice(0, 120));
    params.append('rows', '3');
    params.append('mailto', POLITE_EMAIL);

    if (parsed.authors.length > 0) {
      const firstAuthor = parsed.authors[0].split(/\s+/).pop();
      if (firstAuthor) params.append('query.author', firstAuthor);
    }

    const url = `https://api.crossref.org/works?${params.toString()}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) return [];

    const data = await res.json();
    const items = data.message?.items || [];

    return items.map((item: any) => {
      const title = (Array.isArray(item.title) ? item.title[0] : item.title || 'Untitled Work').replace(/<[^>]*>/g, '').trim();
      const year = item.published?.['date-parts']?.[0]?.[0] || 
                   item['issued']?.['date-parts']?.[0]?.[0] || 
                   new Date().getFullYear();
      const venue = (Array.isArray(item['container-title']) ? item['container-title'][0] : item['container-title']) || item.publisher || 'Academic Journal';
      const rawAuthors: Author[] = (item.author || []).map((a: any) => ({
        name: `${a.given || ''} ${a.family || ''}`.trim() || a.name || 'Author',
        givenName: a.given,
        familyName: a.family,
      }));

      return {
        id: `crossref_${item.DOI}`,
        title,
        authors: rawAuthors,
        year,
        venue,
        doi: item.DOI,
        url: item.URL || `https://doi.org/${item.DOI}`,
        citationCount: item['is-referenced-by-count'] || 0,
        abstract: '',
        openAccess: Boolean(item.link?.length),
        source: 'crossref' as const,
        volume: item.volume || '',
        issue: item.issue || '',
        pages: item.page || '',
      };
    });
  } catch {
    return [];
  }
}

/**
 * Searches OpenAlex using clean search query.
 */
async function searchOpenAlexPolite(parsed: ParsedCitation): Promise<AcademicPaper[]> {
  try {
    const query = parsed.title && parsed.title.length > 5 ? parsed.title : (parsed.cleanQuery || parsed.raw);
    const params = new URLSearchParams();
    params.append('search', query.replace(/[^\w\s-]/g, ' ').slice(0, 120));
    params.append('per-page', '3');
    params.append('mailto', POLITE_EMAIL);

    const url = `https://api.openalex.org/works?${params.toString()}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) return [];

    const data = await res.json();
    const items = data.results || [];

    return items.map((data: any) => {
      const rawAuthors: Author[] = (data.authorships || []).map((a: any) => {
        const name = a.author?.display_name || 'Author';
        const parts = name.split(' ');
        return {
          name,
          givenName: parts.length > 1 ? parts.slice(0, -1).join(' ') : '',
          familyName: parts.length > 1 ? parts[parts.length - 1] : parts[0],
        };
      });

      const doiStr = data.doi ? data.doi.replace(/^https?:\/\/doi\.org\//, '') : '';

      return {
        id: `openalex_${data.id || doiStr}`,
        title: (data.title || data.display_name || '').trim(),
        authors: rawAuthors,
        year: data.publication_year || new Date().getFullYear(),
        venue: data.primary_location?.source?.display_name || 'Academic Journal',
        doi: doiStr,
        url: data.doi || (doiStr ? `https://doi.org/${doiStr}` : ''),
        citationCount: data.cited_by_count || 0,
        abstract: '',
        openAccess: data.open_access?.is_oa || false,
        source: 'openalex' as const,
        volume: data.biblio?.volume || '',
        issue: data.biblio?.issue || '',
        pages: data.biblio?.first_page ? `${data.biblio.first_page}-${data.biblio.last_page || ''}` : '',
      };
    });
  } catch {
    return [];
  }
}

/**
 * Strips HTML tags from formatted reference strings.
 */
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
}

/**
 * Verifies a single raw citation against OpenAlex & Crossref with fuzzy discrepancy detection.
 */
export async function verifySingleReference(rawCitation: string): Promise<VerifiedReferenceResult> {
  const parsed = parseRawCitation(rawCitation);
  let candidate: AcademicPaper | null = null;

  // 1. Direct DOI lookup if DOI was detected
  if (parsed.doi) {
    candidate = await lookupByDoi(parsed.doi);
  }

  // 1b. Direct arXiv lookup if arXiv ID detected
  if (!candidate && parsed.arxivId) {
    try {
      const arxivResults = await searchArxiv(parsed.arxivId, 1);
      if (arxivResults.length > 0) {
        candidate = arxivResults[0];
      }
    } catch {
      // Continue to multi-registry search
    }
  }

  // 2. Multi-registry academic search across Crossref, OpenAlex, and Europe PMC
  if (!candidate) {
    try {
      const [crossrefResults, openalexResults, epmcResults] = await Promise.all([
        searchCrossrefPolite(parsed),
        searchOpenAlexPolite(parsed),
        searchEuropePmc(parsed.title || parsed.cleanQuery, { limit: 2 }).catch(() => []),
      ]);

      const pool = [...crossrefResults, ...openalexResults, ...epmcResults];
      if (pool.length > 0) {
        let bestItem = pool[0];
        let maxScore = -1;

        for (const item of pool) {
          const titleSim = calculateStringSimilarity(parsed.title || parsed.raw, item.title);
          let score = titleSim * 60;

          if (parsed.year && item.year) {
            const yDiff = Math.abs(parsed.year - item.year);
            if (yDiff === 0) score += 20;
            else if (yDiff <= 1) score += 12;
            else if (yDiff <= 3) score += 5;
          }

          if (parsed.authors.length > 0 && item.authors.length > 0) {
            const firstInputAuthor = parsed.authors[0].toLowerCase();
            const candAuthorsStr = item.authors.map((a) => a.name.toLowerCase()).join(' ');
            if (candAuthorsStr.includes(firstInputAuthor)) {
              score += 20;
            }
          }

          if (score > maxScore) {
            maxScore = score;
            bestItem = item;
          }
        }

        if (maxScore >= 35) {
          candidate = bestItem;
        }
      }
    } catch (err) {
      console.warn('Academic search failed for reference:', err);
    }
  }

  const scholarUrl = `https://scholar.google.com/scholar?q=${encodeURIComponent(parsed.title || parsed.cleanQuery || parsed.raw)}`;

  // If no matching real academic work exists
  if (!candidate) {
    return {
      id: `ref_${Math.random().toString(36).substring(2, 9)}`,
      raw: rawCitation,
      parsed,
      verifiedPaper: null,
      status: 'not_found', // 🔴 Fabricated / Hallucinated / Nonexistent
      confidence: 0,
      discrepancies: [
        {
          field: 'record',
          message: 'No matching academic publication found in OpenAlex or Crossref. Likely a fabricated or AI-hallucinated reference.',
        },
      ],
      scholarUrl,
      correctedCitations: {},
    };
  }

  // Discrepancy & Confidence Evaluation
  const discrepancies: Discrepancy[] = [];
  let confidence = 100;

  // Title similarity check
  const titleSim = calculateStringSimilarity(parsed.title || parsed.raw, candidate.title);
  if (titleSim < 0.70) {
    confidence -= 25;
    discrepancies.push({
      field: 'title',
      message: `Title difference detected: Provided title differs from official publisher record "${candidate.title}".`,
    });
  }

  // Year check
  if (parsed.year && candidate.year && parsed.year !== candidate.year) {
    const diff = Math.abs(parsed.year - candidate.year);
    confidence -= diff > 2 ? 20 : 10;
    discrepancies.push({
      field: 'year',
      message: `Publication year discrepancy: Cited as (${parsed.year}), but official record was published in (${candidate.year}).`,
    });
  }

  // Author check
  if (parsed.authors.length > 0 && candidate.authors.length > 0) {
    const firstAuthorInput = parsed.authors[0].toLowerCase();
    const candAuthorsStr = candidate.authors.map((a) => a.name.toLowerCase()).join(' ');
    if (!candAuthorsStr.includes(firstAuthorInput) && !firstAuthorInput.includes(candidate.authors[0].name.toLowerCase().split(' ').pop() || '')) {
      confidence -= 15;
      discrepancies.push({
        field: 'author',
        message: `Primary author mismatch: Cited as "${parsed.authors[0]}", but official author is "${candidate.authors[0]?.name}".`,
      });
    }
  }

  // Retraction Sentinel check
  let isRetracted = false;
  let retractionDetails: string | undefined;

  const retractionCheck = checkPaperRetraction(candidate);
  if (retractionCheck.isRetracted) {
    isRetracted = true;
    retractionDetails = retractionCheck.reason;
    confidence = Math.min(confidence, 30);
    discrepancies.unshift({
      field: 'retraction',
      message: `CRITICAL RETRACTION: ${retractionCheck.reason || 'Paper is formally indexed as retracted.'}`,
    });
  }

  confidence = Math.max(15, Math.min(100, confidence));
  const status = discrepancies.length === 0 ? 'verified' : 'discrepancy';

  // Generate corrected citations in standard styles
  const correctedCitations: Record<string, string> = {
    apa: stripHtml(formatReferenceEntryHtml(candidate, 'apa', 1)),
    mla: stripHtml(formatReferenceEntryHtml(candidate, 'mla', 1)),
    chicago: stripHtml(formatReferenceEntryHtml(candidate, 'chicago', 1)),
    ieee: stripHtml(formatReferenceEntryHtml(candidate, 'ieee', 1)),
    harvard: stripHtml(formatReferenceEntryHtml(candidate, 'harvard', 1)),
    vancouver: stripHtml(formatReferenceEntryHtml(candidate, 'vancouver', 1)),
    nature: stripHtml(formatReferenceEntryHtml(candidate, 'nature', 1)),
    bibtex: generateBibtexEntry(candidate),
  };

  return {
    id: `ref_${Math.random().toString(36).substring(2, 9)}`,
    raw: rawCitation,
    parsed,
    verifiedPaper: candidate,
    status,
    confidence,
    discrepancies,
    scholarUrl,
    isRetracted,
    retractionDetails,
    correctedCitations,
  };
}

/**
 * Verifies a batch of references concurrently with duplicate detection.
 */
export async function verifyReferenceBatch(
  rawBibliography: string,
  onProgress?: (current: number, total: number) => void
): Promise<BatchVerificationReport> {
  const items = splitBibliography(rawBibliography);
  if (items.length === 0) {
    return {
      total: 0,
      verifiedCount: 0,
      discrepancyCount: 0,
      notFoundCount: 0,
      authenticityScore: 0,
      results: [],
    };
  }

  const results: VerifiedReferenceResult[] = [];
  const batchSize = 2;

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map((raw) => verifySingleReference(raw))
    );
    results.push(...batchResults);
    if (onProgress) {
      onProgress(Math.min(i + batchSize, items.length), items.length);
    }
    if (i + batchSize < items.length) {
      await new Promise((res) => setTimeout(res, 200)); // Polite stagger
    }
  }

  // Duplicate detection
  for (let i = 0; i < results.length; i++) {
    const a = results[i];
    if (!a.verifiedPaper) continue;

    for (let j = i + 1; j < results.length; j++) {
      const b = results[j];
      if (!b.verifiedPaper) continue;

      const sameDoi = Boolean(a.verifiedPaper.doi && b.verifiedPaper.doi && a.verifiedPaper.doi.toLowerCase() === b.verifiedPaper.doi.toLowerCase());
      const titleSim = calculateStringSimilarity(a.verifiedPaper.title, b.verifiedPaper.title);

      if (sameDoi || titleSim > 0.92) {
        b.isDuplicate = true;
        b.duplicateOf = i + 1;
        if (!b.discrepancies.some((d) => d.field === 'duplicate')) {
          b.discrepancies.unshift({
            field: 'duplicate',
            message: `Duplicate citation: Identical paper already listed at reference #${i + 1}.`,
          });
        }
      }
    }
  }

  const verifiedCount = results.filter((r) => r.status === 'verified').length;
  const discrepancyCount = results.filter((r) => r.status === 'discrepancy').length;
  const notFoundCount = results.filter((r) => r.status === 'not_found').length;
  const authenticityScore = results.length > 0
    ? Math.round(((verifiedCount * 1.0 + discrepancyCount * 0.7) / results.length) * 100)
    : 0;

  return {
    total: results.length,
    verifiedCount,
    discrepancyCount,
    notFoundCount,
    authenticityScore,
    results,
  };
}

/**
 * Generates an official Microsoft Word (.doc) document for verification results.
 * Supports:
 * - mode = 'clean': Clean, publication-ready bibliography in standard style with hanging indents.
 * - mode = 'audit': Comprehensive audit report with verification badges, discrepancy diffs, and retraction notices.
 */
export function generateVerificationWordReport(
  report: BatchVerificationReport,
  style: string = 'apa',
  mode: 'clean' | 'audit' = 'audit'
): string {
  const s = style.toLowerCase();
  let title = 'References';
  if (s === 'mla') title = 'Works Cited';
  else if (s === 'chicago') title = 'Bibliography';
  else if (s === 'ieee') title = 'References';

  let listToExport = report.results;
  if (mode === 'clean') {
    // In clean mode, exclude unindexed / hallucinated and retracted references
    listToExport = report.results.filter(
      (r) => (r.status === 'verified' || r.status === 'discrepancy') && !r.isRetracted
    );
  }

  let auditSummaryTable = '';
  if (mode === 'audit') {
    auditSummaryTable = `
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 24pt; font-family: 'Times New Roman', Times, serif; font-size: 10.5pt; border: 1.5pt solid #cbd5e1; background-color: #f8fafc;">
      <tr>
        <td style="padding: 10pt 14pt; border-bottom: 1pt solid #cbd5e1; font-weight: bold; font-size: 11pt; background-color: #f1f5f9; color: #0f172a;">
          Scholar Reference Verifier — Audit Summary &amp; Authenticity Metrics
        </td>
      </tr>
      <tr>
        <td style="padding: 10pt 14pt; color: #334155; line-height: 1.5;">
          <strong>Total References Analyzed:</strong> ${report.total}<br/>
          <strong>Authenticity Score:</strong> ${report.authenticityScore}%<br/>
          <strong>Verified Genuine:</strong> <span style="color: #15803d; font-weight: bold;">${report.verifiedCount}</span> | 
          <strong>Discrepancies Fixed:</strong> <span style="color: #b45309; font-weight: bold;">${report.discrepancyCount}</span> | 
          <strong>Unindexed / Potential AI Hallucinations:</strong> <span style="color: #b91c1c; font-weight: bold;">${report.notFoundCount}</span>
        </td>
      </tr>
    </table>`;
  }

  const itemsHtml = listToExport
    .map((item, idx) => {
      const formattedCite = item.correctedCitations[s] || item.correctedCitations.apa || item.raw;
      const isIeee = s === 'ieee';
      const citePrefix = isIeee ? `[${idx + 1}] ` : '';

      if (mode === 'clean') {
        return `<p style="margin-top: 0; margin-bottom: 12pt; text-align: left; line-height: 2.0; font-family: 'Times New Roman', Times, serif; font-size: 12pt; ${
          isIeee ? 'margin-left: 0.3in; text-indent: -0.3in;' : 'margin-left: 0.5in; text-indent: -0.5in;'
        }">${citePrefix}${formattedCite}</p>`;
      }

      // Audit Mode: include badge, discrepancies, and diffs
      let badgeHtml = '';
      if (item.isRetracted) {
        badgeHtml = `<span style="background-color: #fee2e2; color: #991b1b; padding: 2pt 6pt; font-size: 9pt; font-weight: bold; border-radius: 3pt; border: 1pt solid #fca5a5;">RETRACTED PUBLICATION</span>`;
      } else if (item.status === 'verified') {
        badgeHtml = `<span style="background-color: #dcfce7; color: #166534; padding: 2pt 6pt; font-size: 9pt; font-weight: bold; border-radius: 3pt; border: 1pt solid #86efac;">100% VERIFIED</span>`;
      } else if (item.status === 'discrepancy') {
        badgeHtml = `<span style="background-color: #fef3c7; color: #92400e; padding: 2pt 6pt; font-size: 9pt; font-weight: bold; border-radius: 3pt; border: 1pt solid #fcd34d;">DISCREPANCIES FIXED</span>`;
      } else {
        badgeHtml = `<span style="background-color: #fee2e2; color: #991b1b; padding: 2pt 6pt; font-size: 9pt; font-weight: bold; border-radius: 3pt; border: 1pt solid #fca5a5;">UNINDEXED / POTENTIAL AI HALLUCINATION</span>`;
      }

      let discrepancyDetails = '';
      if (item.discrepancies.length > 0) {
        const issues = item.discrepancies
          .map((d) => `<li style="margin-bottom: 2pt;">${d.message}</li>`)
          .join('');
        discrepancyDetails = `
        <div style="margin-top: 4pt; margin-bottom: 6pt; font-size: 9.5pt; color: #78350f; background-color: #fffbeb; padding: 6pt 10pt; border-left: 3pt solid #f59e0b;">
          <strong>Discrepancies Detected:</strong>
          <ul style="margin: 2pt 0 0 14pt; padding: 0;">${issues}</ul>
        </div>`;
      }

      const rawPastedBlock = `
        <div style="font-size: 9pt; color: #64748b; background-color: #f8fafc; padding: 4pt 8pt; border: 1pt solid #e2e8f0; margin-bottom: 4pt;">
          <strong>Original Input:</strong> <em>${item.raw}</em>
        </div>`;

      return `
      <div style="margin-bottom: 16pt; font-family: 'Times New Roman', Times, serif;">
        <div style="display: flex; align-items: center; gap: 8pt; margin-bottom: 4pt;">
          <strong>Reference #${idx + 1}</strong> &nbsp; ${badgeHtml}
        </div>
        ${rawPastedBlock}
        <p style="margin-top: 0; margin-bottom: 4pt; text-align: left; line-height: 1.5; font-size: 11pt; color: #0f172a; ${
          isIeee ? 'margin-left: 0.25in; text-indent: -0.25in;' : 'margin-left: 0.4in; text-indent: -0.4in;'
        }">
          <strong>${isIeee ? citePrefix : ''}Corrected Citation:</strong> ${formattedCite}
        </p>
        ${discrepancyDetails}
      </div>`;
    })
    .join('\n');

  return `<!DOCTYPE html>
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
  <meta charset="utf-8">
  <title>${title} - ScholarForge Verifier</title>
  <style>
    @page {
      size: 8.5in 11.0in;
      margin: 1.0in 1.0in 1.0in 1.0in;
      mso-header-margin: 0.5in;
      mso-footer-margin: 0.5in;
    }
    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 12pt;
      color: #000000;
      line-height: 1.5;
    }
    h1 {
      font-family: 'Times New Roman', Times, serif;
      font-size: 14pt;
      font-weight: bold;
      text-align: center;
      margin-top: 0;
      margin-bottom: 18pt;
    }
  </style>
</head>
<body>
  <h1>${mode === 'audit' ? 'Bibliography Verification & Authenticity Audit Report' : title}</h1>
  ${auditSummaryTable}
  ${itemsHtml}
</body>
</html>`;
}

/**
 * Downloads the verification report as an official Microsoft Word (.doc) file.
 */
export function downloadVerificationWordDocument(
  report: BatchVerificationReport,
  style: string = 'apa',
  mode: 'clean' | 'audit' = 'audit'
): void {
  const docHtml = generateVerificationWordReport(report, style, mode);
  const blob = new Blob(['\ufeff', docHtml], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const timestamp = new Date().toISOString().slice(0, 10);
  a.download = `ScholarForge_Verification_${mode === 'audit' ? 'Audit_Report' : 'Clean_Bibliography'}_${timestamp}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Sample test references containing genuine, altered, and AI-hallucinated citations.
 */
export const SAMPLE_VERIFICATION_REFERENCES = `[1] Vaswani, A., Shazeer, N., Parmar, N., Uszkoreit, J., Jones, L., Gomez, A. N., Kaiser, L., & Polosukhin, I. (2017). Attention is all you need. Advances in Neural Information Processing Systems, 30, 5998-6008.

[2] Smith, J., & Johnson, K. (2019). Quantum Machine Learning Architectures for Hyper-Dimensional Feature Extraction in Brain-Computer Interfaces. Journal of Theoretical Neuroinformatics, 42(3), 205-220.

[3] He, K., Zhang, X., Ren, S., & Sun, J. (2014). Deep residual learning for image recognition. IEEE Transactions on Pattern Analysis and Machine Intelligence, 10.1109/CVPR.2016.90.

[4] Goodfellow, I., Pouget-Abadie, J., Mirza, M., Xu, B., Warde-Farley, D., Ozair, S., Courville, A., & Bengio, Y. (2014). Generative adversarial nets. Advances in Neural Information Processing Systems, 27, 2672-2680.

[5] Albright, T. R., & Vanderbilt, M. E. (2023). Empirical Verification of Non-Local Entropy Cascades in Distributed Deep Learning Supercomputers. International Review of Applied Synthetic Intelligence, 15(2), 104-118.`;

