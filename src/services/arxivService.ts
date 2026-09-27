import type { AcademicPaper, Author } from '../types/citation';

const CACHE = new Map<string, AcademicPaper[]>();

/**
 * Searches arXiv Open Archive via the official export API.
 */
export async function searchArxiv(
  query: string,
  limit = 8
): Promise<AcademicPaper[]> {
  const cleanQuery = query.replace(/[^\w\s-]/g, ' ').trim();
  if (!cleanQuery) return [];

  const cacheKey = `arxiv_${cleanQuery}_${limit}`;
  if (CACHE.has(cacheKey)) {
    return CACHE.get(cacheKey)!;
  }

  const url = `https://export.arxiv.org/api/query?search_query=all:${encodeURIComponent(
    cleanQuery
  )}&start=0&max_results=${Math.min(limit, 20)}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) {
      console.warn(`arXiv returned HTTP ${res.status}`);
      return [];
    }

    const xmlText = await res.text();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
    const entries = Array.from(xmlDoc.querySelectorAll('entry'));

    const papers: AcademicPaper[] = entries.map((entry) => {
      const rawId = entry.querySelector('id')?.textContent || '';
      const arxivId = rawId.replace(/^https?:\/\/arxiv\.org\/abs\//i, '').replace(/v\d+$/, '');
      const title = (entry.querySelector('title')?.textContent || 'Untitled')
        .replace(/\s+/g, ' ')
        .trim();
      const summary = (entry.querySelector('summary')?.textContent || '')
        .replace(/\s+/g, ' ')
        .trim();
      const published = entry.querySelector('published')?.textContent || '';
      const year = published ? parseInt(published.slice(0, 4), 10) : new Date().getFullYear();

      const authorEls = Array.from(entry.querySelectorAll('author > name'));
      const authors: Author[] = authorEls.map((a) => {
        const name = (a.textContent || 'Unknown').trim();
        return {
          name,
          familyName: name.split(' ').pop() || '',
        };
      });

      // Check if DOI is present in arxiv entry
      const doiEl = entry.querySelector('doi');
      const doi = doiEl?.textContent?.trim() || '';

      return {
        id: `arxiv_${arxivId || Math.random()}`,
        title,
        authors,
        year,
        venue: 'arXiv Open Archive',
        doi,
        url: `https://arxiv.org/abs/${arxivId}`,
        citationCount: 0,
        abstract: summary,
        openAccess: true,
        openAccessPdf: `https://arxiv.org/pdf/${arxivId}.pdf`,
        source: 'arxiv',
        type: 'preprint',
      };
    });

    CACHE.set(cacheKey, papers);
    return papers.slice(0, limit);
  } catch (err) {
    console.warn(`arXiv search failed for query: "${query}"`, err);
    return [];
  }
}
