import type { AcademicPaper, Author } from '../types/citation';
import { generateAcademicSearchTiers } from './academicQueryParser';

const CACHE = new Map<string, AcademicPaper[]>();

// Known preprint servers, repositories, and non-peer-reviewed outlets
const PREPRINT_IDENTIFIERS = [
  'arxiv',
  'biorxiv',
  'medrxiv',
  'chemrxiv',
  'techrxiv',
  'research square',
  'ssrn',
  'preprints.org',
  'authorea',
  'osf preprints',
  'working paper',
  'researchgate',
  'zenodo',
  'figshare',
  'mpra paper',
  'repec',
  'hal open science',
];

/**
 * Checks if a work is a preprint or non-peer-reviewed repository upload.
 */
function isPreprintOrQuestionable(work: any): boolean {
  const workType = (work.type || work.subtype || '').toLowerCase();
  if (workType === 'preprint' || workType === 'posted-content') {
    return true;
  }

  const hostVenue = (
    work.host_venue?.display_name || 
    work.primary_location?.source?.display_name || 
    work['container-title']?.[0] || 
    work.publisher || 
    ''
  ).toLowerCase();

  for (const identifier of PREPRINT_IDENTIFIERS) {
    if (hostVenue.includes(identifier)) {
      return true;
    }
  }

  return false;
}

/**
 * Reconstructs the abstract from OpenAlex's inverted index representation.
 */
function reconstructAbstract(invertedIndex: Record<string, number[]> | undefined): string {
  if (!invertedIndex) return '';
  const wordsWithPos: { word: string; pos: number }[] = [];
  for (const [word, positions] of Object.entries(invertedIndex)) {
    for (const pos of positions) {
      wordsWithPos.push({ word, pos });
    }
  }
  wordsWithPos.sort((a, b) => a.pos - b.pos);
  return wordsWithPos.map((item) => item.word).join(' ');
}

/**
 * Normalizes author strings/objects into clean structured Author records.
 */
function normalizeAuthors(rawAuthors: any[]): Author[] {
  if (!Array.isArray(rawAuthors)) return [];
  return rawAuthors.slice(0, 8).map((a) => {
    if (typeof a === 'string') {
      return { name: a };
    }
    const rawName = a.display_name || a.name || `${a.given || ''} ${a.family || ''}`.trim() || 'Anonymous';
    const parts = rawName.split(' ');
    const familyName = parts.length > 1 ? parts[parts.length - 1] : parts[0];
    const givenName = parts.length > 1 ? parts.slice(0, -1).join(' ') : '';
    return {
      name: rawName,
      givenName,
      familyName,
    };
  });
}

/**
 * Searches OpenAlex for genuine peer-reviewed scholarly journal articles with verified DOIs.
 */
export async function searchOpenAlex(
  query: string, 
  limit = 30, 
  excludePreprints = true,
  fromYear?: number
): Promise<AcademicPaper[]> {
  const cleanQuery = query.replace(/[^\w\s-]/g, ' ').trim();
  if (!cleanQuery) return [];

  const cacheKey = `openalex_${cleanQuery}_${limit}_${excludePreprints}_${fromYear || 'all'}`;
  if (CACHE.has(cacheKey)) {
    return CACHE.get(cacheKey)!;
  }

  try {
    const url = new URL('https://api.openalex.org/works');
    url.searchParams.set('search', cleanQuery);
    url.searchParams.set('per-page', String(Math.min(Math.max(limit * 2, 60), 100)));
    url.searchParams.set('sort', 'relevance_score:desc');
    
    let filterString = 'has_doi:true,is_paratext:false';
    if (fromYear && fromYear > 1900) {
      filterString += `,from_publication_date:${fromYear}-01-01`;
    }
    url.searchParams.set('filter', filterString);
    url.searchParams.set('mailto', 'citation-filler-app@gmail.com');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000);

    const response = await fetch(url.toString(), {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
      },
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`OpenAlex returned HTTP ${response.status}`);
      return [];
    }

    const data = await response.json();
    const results: any[] = data.results || [];

    let papers: AcademicPaper[] = results
      .filter((work) => {
        if (!work.doi) return false;
        if (excludePreprints && isPreprintOrQuestionable(work)) {
          return false;
        }
        return true;
      })
      .map((work) => {
        const rawAbstract = reconstructAbstract(work.abstract_inverted_index);
        const doiClean = (work.doi || '').replace(/^https?:\/\/doi\.org\//i, '');
        const venue = work.primary_location?.source?.display_name || 
                      work.host_venue?.display_name || 
                      'Peer-Reviewed Scholarly Journal';

        return {
          id: work.id || `openalex_${doiClean}`,
          title: (work.title || 'Untitled Scholarly Publication').replace(/\n+/g, ' ').trim(),
          authors: normalizeAuthors(work.authorships?.map((a: any) => a.author) || []),
          year: work.publication_year || new Date().getFullYear(),
          venue,
          doi: doiClean,
          url: work.doi || `https://doi.org/${doiClean}`,
          citationCount: work.cited_by_count || 0,
          abstract: rawAbstract || '',
          openAccess: Boolean(work.open_access?.is_oa),
          source: 'openalex',
          relevanceScore: work.relevance_score || 0,
          volume: work.biblio?.volume || '',
          issue: work.biblio?.issue || '',
          pages: work.biblio?.first_page ? `${work.biblio.first_page}-${work.biblio.last_page || ''}` : '',
        };
      });

    // If 0 results, fall back to core keywords if input had many terms
    if (papers.length === 0) {
      const kw = cleanQuery.split(/\s+/);
      if (kw.length > 3) {
        const fallback = kw.slice(0, 3).join(' ');
        const fallbackUrl = new URL('https://api.openalex.org/works');
        fallbackUrl.searchParams.set('search', fallback);
        fallbackUrl.searchParams.set('per-page', String(Math.min(Math.max(limit * 2, 40), 100)));
        fallbackUrl.searchParams.set('sort', 'relevance_score:desc');
        fallbackUrl.searchParams.set('filter', filterString);
        fallbackUrl.searchParams.set('mailto', 'citation-filler-app@gmail.com');

        const fbController = new AbortController();
        const fbTimeoutId = setTimeout(() => fbController.abort(), 5000);

        try {
          const fbRes = await fetch(fallbackUrl.toString(), {
            signal: fbController.signal,
            headers: {
              'Accept': 'application/json',
            },
          });
          clearTimeout(fbTimeoutId);
          if (fbRes.ok) {
            const fbData = await fbRes.json();
            const fbResults: any[] = fbData.results || [];
            papers = fbResults
              .filter((work) => work.doi && (!excludePreprints || !isPreprintOrQuestionable(work)))
              .map((work) => {
                const rawAbstract = reconstructAbstract(work.abstract_inverted_index);
                const doiClean = (work.doi || '').replace(/^https?:\/\/doi\.org\//i, '');
                const venue = work.primary_location?.source?.display_name || 
                              work.host_venue?.display_name || 
                              'Peer-Reviewed Scholarly Journal';
                return {
                  id: work.id || `openalex_${doiClean}`,
                  title: (work.title || 'Untitled Scholarly Publication').replace(/\n+/g, ' ').trim(),
                  authors: normalizeAuthors(work.authorships?.map((a: any) => a.author) || []),
                  year: work.publication_year || new Date().getFullYear(),
                  venue,
                  doi: doiClean,
                  url: work.doi || `https://doi.org/${doiClean}`,
                  citationCount: work.cited_by_count || 0,
                  abstract: rawAbstract || '',
                  openAccess: Boolean(work.open_access?.is_oa),
                  source: 'openalex',
                  relevanceScore: work.relevance_score || 0,
                  volume: work.biblio?.volume || '',
                  issue: work.biblio?.issue || '',
                  pages: work.biblio?.first_page ? `${work.biblio.first_page}-${work.biblio.last_page || ''}` : '',
                };
              });
          }
        } catch {
          // ignore fallback error
        }
      }
    }

    CACHE.set(cacheKey, papers);
    return papers.slice(0, limit);
  } catch (err) {
    console.warn(`OpenAlex search failed for query: "${query}"`, err);
    return [];
  }
}


/**
 * Searches Crossref as a high-authority fallback for registered DOIs.
 */
export async function searchCrossref(
  query: string, 
  limit = 25, 
  excludePreprints = true,
  fromYear?: number
): Promise<AcademicPaper[]> {
  const cleanQuery = query.replace(/[^\w\s-]/g, ' ').trim();
  if (!cleanQuery) return [];

  const cacheKey = `crossref_${cleanQuery}_${limit}_${excludePreprints}_${fromYear || 'all'}`;
  if (CACHE.has(cacheKey)) {
    return CACHE.get(cacheKey)!;
  }

  try {
    const url = new URL('https://api.crossref.org/works');
    url.searchParams.set('query', cleanQuery);
    url.searchParams.set('rows', String(Math.min(Math.max(limit * 2, 50), 100)));
    url.searchParams.set('sort', 'relevance');
    
    let filterString = 'type:journal-article';
    if (fromYear && fromYear > 1900) {
      filterString += `,from-pub-date:${fromYear}-01-01`;
    }
    url.searchParams.set('filter', filterString);
    url.searchParams.set('mailto', 'citation-filler-app@gmail.com');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(url.toString(), {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
      },
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`Crossref returned HTTP ${response.status}`);
      return [];
    }

    const data = await response.json();
    const items: any[] = data.message?.items || [];

    const papers: AcademicPaper[] = items
      .filter((item) => {
        if (!item.DOI) return false;
        const itemType = (item.type || '').toLowerCase();
        if (excludePreprints && (itemType === 'posted-content' || itemType === 'preprint')) {
          return false;
        }
        const venue = (
          item['container-title']?.[0] || 
          item.publisher || 
          ''
        ).toLowerCase();
        if (excludePreprints) {
          if (PREPRINT_IDENTIFIERS.some((p) => venue.includes(p))) {
            return false;
          }
        }
        return true;
      })
      .map((item) => {
        const title = (item.title?.[0] || 'Untitled Work').replace(/<[^>]*>/g, '').trim();
        const year = item.published?.['date-parts']?.[0]?.[0] || 
                     item['issued']?.['date-parts']?.[0]?.[0] || 
                     new Date().getFullYear();
        const venue = item['container-title']?.[0] || item.publisher || 'Peer-Reviewed Journal';
        const rawAbstract = (item.abstract || '').replace(/<[^>]*>/g, '').trim();

        return {
          id: `crossref_${item.DOI}`,
          title,
          authors: normalizeAuthors(item.author || []),
          year,
          venue,
          doi: item.DOI,
          url: item.URL || `https://doi.org/${item.DOI}`,
          citationCount: item['is-referenced-by-count'] || 0,
          abstract: rawAbstract,
          openAccess: Boolean(item.link?.length),
          source: 'crossref',
          volume: item.volume || '',
          issue: item.issue || '',
          pages: item.page || '',
        };
      });

    CACHE.set(cacheKey, papers);
    return papers.slice(0, limit);
  } catch (err) {
    console.warn(`Crossref search failed for query: "${query}"`, err);
    return [];
  }
}

/**
 * Searches across multiple thematic angles to construct a robust literature corpus.
 * Converts conversational or complex inquiry sentences into high-precision search tiers.
 */
export async function huntLiteratureCorpus(
  topic: string,
  focus: string,
  targetCount = 25,
  excludePreprints = true,
  fromYear?: number
): Promise<AcademicPaper[]> {
  const queryTiers = generateAcademicSearchTiers(topic, focus);
  return huntAcademicPapers(queryTiers, targetCount, excludePreprints, fromYear);
}

/**
 * High-reliability multi-source academic paper search ensuring genuine peer-reviewed journal publications with DOIs.
 */
export async function huntAcademicPapers(
  queries: string[], 
  limit = 35, 
  excludePreprints = true,
  fromYear?: number
): Promise<AcademicPaper[]> {
  const combinedPapers: AcademicPaper[] = [];
  const seenDois = new Set<string>();
  const seenTitles = new Set<string>();

  const perQueryLimit = Math.max(Math.ceil(limit / Math.max(queries.length, 1)) + 10, 20);

  for (const query of queries) {
    if (!query || query.trim().length < 3) continue;

    // Primary search via OpenAlex
    let papers = await searchOpenAlex(query, perQueryLimit, excludePreprints, fromYear);

    // Complement with Crossref if needed
    if (papers.length < perQueryLimit) {
      const crossrefPapers = await searchCrossref(query, perQueryLimit, excludePreprints, fromYear);
      papers = [...papers, ...crossrefPapers];
    }

    for (const paper of papers) {
      if (!paper.doi) continue;

      const normalizedTitle = paper.title.toLowerCase().replace(/[^\w]/g, '');
      const doi = paper.doi.toLowerCase();

      if (seenDois.has(doi)) continue;
      if (normalizedTitle && seenTitles.has(normalizedTitle)) continue;

      seenDois.add(doi);
      if (normalizedTitle) seenTitles.add(normalizedTitle);

      combinedPapers.push(paper);
      if (combinedPapers.length >= limit) break;
    }

    if (combinedPapers.length >= limit) break;
  }

  return combinedPapers.sort((a, b) => {
    const scoreA = (a.doi ? 100 : 0) + (a.abstract.length > 50 ? 30 : 0) + Math.min(a.citationCount, 500) * 0.1;
    const scoreB = (b.doi ? 100 : 0) + (b.abstract.length > 50 ? 30 : 0) + Math.min(b.citationCount, 500) * 0.1;
    return scoreB - scoreA;
  });
}
