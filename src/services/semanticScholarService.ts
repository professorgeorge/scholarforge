import type { AcademicPaper, Author } from '../types/citation';
import { checkPaperRetraction } from './retractionSentinel';

const CACHE = new Map<string, AcademicPaper[]>();

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
  const cleanQuery = query.replace(/[^\w\s-]/g, ' ').trim();
  if (!cleanQuery) return [];

  const { limit = 20, fromYear, toYear } = options;
  const cacheKey = `s2_${cleanQuery}_${limit}_${fromYear || 'all'}_${toYear || 'all'}`;
  if (CACHE.has(cacheKey)) {
    return CACHE.get(cacheKey)!;
  }

  let yearParam = '';
  if (fromYear && toYear) {
    yearParam = `&year=${fromYear}-${toYear}`;
  } else if (fromYear) {
    yearParam = `&year=${fromYear}-`;
  }

  const url = `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(
    cleanQuery
  )}&limit=${Math.min(Math.max(limit * 2, 30), 50)}&fields=title,abstract,authors,year,venue,citationCount,isOpenAccess,openAccessPdf,externalIds${yearParam}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
      },
    });
    clearTimeout(timeoutId);

    if (res.status === 429) {
      console.warn('Semantic Scholar rate limit reached, falling back to other providers.');
      return [];
    }
    if (!res.ok) {
      console.warn(`Semantic Scholar returned HTTP ${res.status}`);
      return [];
    }

    const data = await res.json();
    const items: any[] = data.data || [];

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
        year: p.year || new Date().getFullYear(),
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

    CACHE.set(cacheKey, papers);
    return papers.slice(0, limit);
  } catch (err) {
    console.warn(`Semantic Scholar search failed for query: "${query}"`, err);
    return [];
  }
}
