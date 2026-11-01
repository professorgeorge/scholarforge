import type { AcademicPaper, Author } from '../types/citation';
import { checkPaperRetraction } from './retractionSentinel';
import { fetchRegistryJson, RegistryRequestError } from './registryRequestService';

const CACHE = new Map<string, { at: number; papers: AcademicPaper[] }>();
const PENDING = new Map<string, Promise<AcademicPaper[]>>();
let cooldownUntil = 0;
let cooldownStatus: number | undefined;

export interface SemanticScholarSearchOptions {
  limit?: number;
  fromYear?: number;
  toYear?: number;
}

/**
 * Searches the Semantic Scholar Academic Graph API for computer science, biomedicine, and STEM papers.
 */
export async function searchSemanticScholar(
  query: string,
  options: SemanticScholarSearchOptions = {}
): Promise<AcademicPaper[]> {
  const cleanQuery = query.replace(/[^\p{L}\p{N}\s-]/gu, ' ').trim();
  if (!cleanQuery) return [];

  const { limit = 20, fromYear, toYear } = options;
  const cacheKey = `s2_${cleanQuery}_${limit}_${fromYear || 'all'}_${toYear || 'all'}`;
  const saved = CACHE.get(cacheKey);
  if (saved && Date.now() - saved.at < 300000) return structuredClone(saved.papers);
  if (Date.now() < cooldownUntil) throw new RegistryRequestError(`Semantic Scholar is paused after a failed or rate-limited request. Try again in ${Math.ceil((cooldownUntil - Date.now()) / 1000)} seconds, or use the other sources.`, cooldownStatus, cooldownUntil - Date.now());
  const ongoing = PENDING.get(cacheKey);
  if (ongoing) return structuredClone(await ongoing);

  let yearParam = '';
  if (fromYear && toYear) {
    yearParam = `&year=${fromYear}-${toYear}`;
  } else if (fromYear) {
    yearParam = `&year=${fromYear}-`;
  } else if (toYear) {
    yearParam = `&year=-${toYear}`;
  }

  const url = `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(
    cleanQuery
  )}&limit=${Math.min(Math.max(limit * 2, 30), 50)}&fields=title,abstract,authors,year,venue,citationCount,isOpenAccess,openAccessPdf,externalIds${yearParam}`;

  const request = (async () => {
    const data = await fetchRegistryJson(url, 'Semantic Scholar');
    if (!Array.isArray(data.data)) throw new RegistryRequestError('Semantic Scholar returned an invalid search response.');
    const items: any[] = data.data;

    const papers: AcademicPaper[] = items.map((p) => {
      const doi = p.externalIds?.DOI ? p.externalIds.DOI.replace(/^https?:\/\/doi\.org\//i, '') : '';
      const authors: Author[] = (p.authors || []).slice(0, 8).map((a: any) => {
        const rawName = a.name || 'Anonymous';
        return {
          name: rawName,
          familyName: rawName.split(' ').pop() || '',
        };
      });

      const retraction = checkPaperRetraction({ title: p.title });

      return {
        id: p.paperId ? `s2_${p.paperId}` : `s2_${doi || Math.random()}`,
        title: (p.title || 'Untitled Scholarly Publication').trim(),
        authors,
        year: p.year || 0,
        venue: p.venue || 'Semantic Scholar Indexed Publication',
        doi,
        url: doi
          ? `https://doi.org/${doi}`
          : `https://www.semanticscholar.org/paper/${p.paperId}`,
        citationCount: p.citationCount || 0,
        abstract: p.abstract || '',
        openAccess: Boolean(p.isOpenAccess),
        openAccessPdf: p.openAccessPdf?.url || undefined,
        source: 'semanticscholar',
        isRetracted: retraction.isRetracted,
        retractionDetails: retraction.reason,
      };
    });

    const selected = papers.slice(0, limit);
    if (CACHE.size >= 50) CACHE.delete(CACHE.keys().next().value!);
    CACHE.set(cacheKey, { at: Date.now(), papers: selected });
    return selected;
  })();
  PENDING.set(cacheKey, request);
  try {
    return structuredClone(await request);
  } catch (error) {
    const wait = error instanceof RegistryRequestError && error.status === 429 ? Math.max(60000, error.retryAfterMs) : 15000;
    cooldownUntil = Date.now() + wait;
    cooldownStatus = error instanceof RegistryRequestError ? error.status : undefined;
    throw error;
  } finally {
    PENDING.delete(cacheKey);
  }
}
