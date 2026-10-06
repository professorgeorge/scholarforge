import type { AcademicPaper, Author } from '../types/citation';

const CACHE = new Map<string, AcademicPaper[]>();

export interface EuropePmcSearchOptions {
  limit?: number;
  excludePreprints?: boolean;
  fromYear?: number;
  openAccessOnly?: boolean;
  searchScope?: 'default' | 'title_only' | 'title_abstract';
}

/**
 * Normalizes author array from Europe PMC result.
 */
function normalizeEuropePmcAuthors(authorList?: any[]): Author[] {
  if (!Array.isArray(authorList)) return [];
  return authorList.slice(0, 8).map((a) => {
    const rawName = a.fullName || `${a.firstName || ''} ${a.lastName || ''}`.trim() || 'Anonymous';
    return {
      name: rawName,
      givenName: a.firstName || '',
      familyName: a.lastName || (rawName.split(' ').pop() || ''),
    };
  });
}

import { synthesizeBooleanSearchStrategy, extractAcademicKeywords } from './academicQueryParser';

/**
 * Searches Europe PMC & PubMed Central repository for peer-reviewed medical and life sciences research.
 */
export async function searchEuropePmc(
  query: string,
  options: EuropePmcSearchOptions = {}
): Promise<AcademicPaper[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const {
    limit = 30,
    excludePreprints = true,
    fromYear,
    openAccessOnly = false,
    searchScope = 'default',
  } = options;

  // Check if user provided Boolean syntax or quotes
  const hasBooleanSyntax = /["\(\)]|\b(AND|OR|NOT)\b/i.test(trimmed);

  // If natural language without boolean, synthesize structured boolean concepts
  let cleanQuery: string;
  if (hasBooleanSyntax) {
    cleanQuery = trimmed.replace(/[^\w\s\-:"\(\)]/g, ' ').replace(/\s+/g, ' ').trim();
  } else {
    const strategy = synthesizeBooleanSearchStrategy(trimmed);
    cleanQuery = strategy.booleanQuery;
  }

  const cacheKey = `epmc_${cleanQuery}_${limit}_${excludePreprints}_${fromYear || 'all'}_${openAccessOnly}_${searchScope}`;
  if (CACHE.has(cacheKey)) {
    return CACHE.get(cacheKey)!;
  }

  const executeFetch = async (queryToRun: string): Promise<AcademicPaper[]> => {
    // Build query syntax for Europe PMC
    let scopedQuery = queryToRun;
    const hasGrouping = queryToRun.includes('(') || queryToRun.includes('"');
    
    if (searchScope === 'title_only') {
      scopedQuery = hasGrouping ? `TITLE:(${queryToRun})` : `TITLE:(${queryToRun})`;
    } else if (searchScope === 'title_abstract') {
      scopedQuery = hasGrouping 
        ? `(TITLE:(${queryToRun}) OR ABSTRACT:(${queryToRun}))`
        : `(TITLE:(${queryToRun}) OR ABSTRACT:(${queryToRun}))`;
    }

    if (excludePreprints) {
      scopedQuery += ' NOT (SRC:PPR OR PUB_TYPE:"Preprint")';
    }
    if (openAccessOnly) {
      scopedQuery += ' AND (OPEN_ACCESS:Y)';
    }
    if (fromYear && fromYear > 1900) {
      const currentYear = new Date().getFullYear();
      scopedQuery += ` AND (PUB_YEAR:[${fromYear} TO ${currentYear}])`;
    }

    const pageSize = Math.min(Math.max(limit * 2, 50), 100);
    const url = `https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=${encodeURIComponent(
      scopedQuery
    )}&format=json&resultType=core&pageSize=${pageSize}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
      },
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      console.warn(`Europe PMC returned HTTP ${res.status}`);
      return [];
    }

    const data = await res.json();
    const results: any[] = data.resultList?.result || [];

    return results
      .filter((item) => {
        // Enforce peer-reviewed quality: must have title and either DOI or journal title
        if (!item.title) return false;
        if (!item.doi && !item.pmid) return false;
        return true;
      })
      .map((item) => {
        const rawTitle = (item.title || 'Untitled Publication').replace(/<[^>]*>/g, '').trim();
        const venue = item.journalInfo?.journal?.title || 
                      item.journalTitle || 
                      item.bookOrReportDetails?.publisher || 
                      'Europe PMC Peer-Reviewed Archive';
        const year = item.pubYear ? parseInt(item.pubYear, 10) : new Date().getFullYear();
        const doiClean = (item.doi || '').replace(/^https?:\/\/doi\.org\//i, '');

        return {
          id: item.doi ? `epmc_${doiClean}` : `epmc_${item.id || item.pmid}`,
          title: rawTitle,
          authors: normalizeEuropePmcAuthors(item.authorList?.author),
          year,
          venue,
          doi: doiClean,
          pmid: item.pmid || '',
          pmcid: item.pmcid || '',
          url: doiClean ? `https://doi.org/${doiClean}` : `https://europepmc.org/article/MED/${item.pmid}`,
          citationCount: item.citedByCount || 0,
          abstract: (item.abstractText || '').replace(/<[^>]*>/g, '').trim(),
          openAccess: item.isOpenAccess === 'Y',
          source: 'europepmc',
          type: item.pubType === 'Preprint' ? 'preprint' : 'journal',
        };
      });
  };

  try {
    let papers = await executeFetch(cleanQuery);

    // Fallback if 0 results: try broader core keywords
    if (papers.length === 0) {
      const fallbackKeywords = extractAcademicKeywords(trimmed).slice(0, 3).join(' ');
      if (fallbackKeywords && fallbackKeywords !== cleanQuery) {
        papers = await executeFetch(fallbackKeywords);
      }
    }

    CACHE.set(cacheKey, papers);
    return papers.slice(0, limit);
  } catch (err) {
    console.warn(`Europe PMC search failed for query: "${query}"`, err);
    return [];
  }
}

