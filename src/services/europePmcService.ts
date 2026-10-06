import type { AcademicPaper, Author } from '../types/citation';
import { checkPaperRetraction } from './retractionSentinel';

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

/**
 * Searches Europe PMC & PubMed Central repository for peer-reviewed medical and life sciences research.
 */
export async function searchEuropePmc(
  query: string,
  options: EuropePmcSearchOptions = {}
): Promise<AcademicPaper[]> {
  const cleanQuery = query.replace(/[^\w\s-]/g, ' ').trim();
  if (!cleanQuery) return [];

  const {
    limit = 10,
    excludePreprints = true,
    fromYear,
    openAccessOnly = false,
    searchScope = 'default',
  } = options;

  const cacheKey = `epmc_${cleanQuery}_${limit}_${excludePreprints}_${fromYear || 'all'}_${openAccessOnly}_${searchScope}`;
  if (CACHE.has(cacheKey)) {
    return CACHE.get(cacheKey)!;
  }

  // Build query syntax for Europe PMC
  let scopedQuery = cleanQuery;
  const hasUserQuotes = cleanQuery.includes('"');
  if (searchScope === 'title_only') {
    scopedQuery = hasUserQuotes ? `TITLE:${cleanQuery}` : `TITLE:(${cleanQuery})`;
  } else if (searchScope === 'title_abstract') {
    scopedQuery = hasUserQuotes 
      ? `(TITLE:${cleanQuery} OR ABSTRACT:${cleanQuery})`
      : `(TITLE:(${cleanQuery}) OR ABSTRACT:(${cleanQuery}))`;
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

  const pageSize = Math.min(limit * 2, 40);
  const url = `https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=${encodeURIComponent(
    scopedQuery
  )}&format=json&resultType=core&pageSize=${pageSize}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        'User-Agent': 'ScholarForge/1.0 (mailto:scholarforge-app@gmail.com)',
      },
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      console.warn(`Europe PMC returned HTTP ${res.status}`);
      return [];
    }

    const data = await res.json();
    const results: any[] = data.resultList?.result || [];

    const papers: AcademicPaper[] = results.map((item) => {
      const journalInfo = item.journalInfo || {};
      const venue =
        journalInfo.journal?.title ||
        item.bookOrReportDetails?.publisher ||
        'Europe PMC / PubMed Central';

      const doiClean = item.doi ? item.doi.replace(/^https?:\/\/doi\.org\//i, '') : '';
      const authors = normalizeEuropePmcAuthors(item.authorList?.author);
      const abstractText = item.abstractText
        ? item.abstractText.replace(/<[^>]+>/g, '').trim()
        : '';

      const pdfItem = item.fullTextUrlList?.fullTextUrl?.find(
        (f: any) => f.documentStyle === 'pdf'
      );
      const pdfUrl = pdfItem?.url || undefined;
      const isOpenAccess = item.isOpenAccess === 'Y';

      // Check retraction status via Retraction Sentinel
      const retraction = checkPaperRetraction({}, item);

      return {
        id: item.pmid ? `pmid_${item.pmid}` : item.id || `epmc_${doiClean || Math.random()}`,
        title: (item.title || 'Untitled Scholarly Publication').replace(/\.$/, '').trim(),
        authors,
        year: item.pubYear ? parseInt(item.pubYear, 10) : new Date().getFullYear(),
        venue,
        doi: doiClean,
        url: doiClean
          ? `https://doi.org/${doiClean}`
          : item.pmid
          ? `https://pubmed.ncbi.nlm.nih.gov/${item.pmid}/`
          : `https://europepmc.org/article/${item.source || 'MED'}/${item.id}`,
        citationCount: item.citedByCount || 0,
        abstract: abstractText,
        openAccess: isOpenAccess,
        openAccessPdf: pdfUrl,
        source: 'europepmc',
        pmid: item.pmid || undefined,
        pmcid: item.pmcid || undefined,
        volume: journalInfo.volume || '',
        issue: journalInfo.issue || '',
        pages: item.pageInfo || '',
        isRetracted: retraction.isRetracted,
        retractionDetails: retraction.reason,
      };
    });

    CACHE.set(cacheKey, papers);
    return papers.slice(0, limit);
  } catch (err) {
    console.warn(`Europe PMC search failed for query: "${query}"`, err);
    return [];
  }
}
