import type { AcademicPaper } from '../types/citation';
import { fetchRegistryJson, RegistryRequestError } from './registryRequestService';

export interface AdditionalSearchOptions {
  limit?: number;
  fromYear?: number;
  toYear?: number;
  excludePreprints?: boolean;
  searchScope?: 'default' | 'title_only' | 'title_abstract';
}

const cache = new Map<string, { at: number; papers: AcademicPaper[] }>();
const pending = new Map<string, Promise<AcademicPaper[]>>();
function cached(key: string, run: () => Promise<AcademicPaper[]>): Promise<AcademicPaper[]> {
  const saved = cache.get(key);
  if (saved && Date.now() - saved.at < 300000) return Promise.resolve(structuredClone(saved.papers));
  const ongoing = pending.get(key);
  if (ongoing) return ongoing.then(papers => structuredClone(papers));
  const request = run().then(papers => {
    if (cache.size >= 50) cache.delete(cache.keys().next().value!);
    cache.set(key, { at: Date.now(), papers });
    return papers;
  }).finally(() => pending.delete(key));
  pending.set(key, request);
  return request.then(papers => structuredClone(papers));
}

const cleanText = (value: string) => value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const boundedLimit = (limit = 30) => Math.min(100, Math.max(1, Math.floor(limit)));
let ncbiQueue = Promise.resolve();
let nextNcbiRequest = 0;
async function ncbiJson(url: string): Promise<any> {
  // Space requests within this browser session below NCBI's unauthenticated rate limit.
  const turn = ncbiQueue.then(async () => {
    const delay = Math.max(0, nextNcbiRequest - Date.now());
    if (delay) await new Promise(resolve => setTimeout(resolve, delay));
    nextNcbiRequest = Date.now() + 400;
  });
  ncbiQueue = turn.catch(() => {});
  await turn;
  return fetchRegistryJson(url, 'PubMed');
}

export function searchPubmed(query: string, options: AdditionalSearchOptions = {}): Promise<AcademicPaper[]> {
  if (!query.trim()) return Promise.resolve([]);
  const limit = boundedLimit(options.limit);
  return cached(`pubmed:${query}:${JSON.stringify(options)}`, async () => {
    const scope = options.searchScope === 'title_only' ? '[Title]' : options.searchScope === 'title_abstract' ? '[Title/Abstract]' : '';
    const words = query.replace(/[()[\]"\\]/g, ' ').trim();
    let term = scope ? words.split(/\s+/).map(word => `${word}${scope}`).join(' AND ') : words;
    if (options.excludePreprints) term = `(${term}) NOT preprint[Publication Type]`;
    const params = new URLSearchParams({ db: 'pubmed', term, retmode: 'json', retmax: String(limit), sort: 'relevance', tool: 'scholarforge' });
    if (options.fromYear || options.toYear) {
      params.set('datetype', 'pdat');
      params.set('mindate', String(options.fromYear || 1000));
      params.set('maxdate', String(options.toYear || new Date().getFullYear()));
    }
    const found = await ncbiJson(`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?${params}`);
    if (found.error || !Array.isArray(found.esearchresult?.idlist)) throw new RegistryRequestError('PubMed returned an invalid search response.');
    const ids: string[] = found.esearchresult.idlist;
    if (!ids.length) return [];
    const summary = await ncbiJson(`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?${new URLSearchParams({ db: 'pubmed', id: ids.join(','), retmode: 'json', tool: 'scholarforge' })}`);
    if (summary.error || !summary.result) throw new RegistryRequestError('PubMed returned an invalid summary response.');
    return ids.map(id => {
      const row = summary.result[id];
      if (!row?.title || row.error) throw new RegistryRequestError('PubMed returned an incomplete summary batch. Please retry later.');
      const doi = row.articleids?.find((value: any) => value.idtype === 'doi')?.value || '';
      const pmcid = row.articleids?.find((value: any) => value.idtype === 'pmc')?.value;
      return {
        id: `pubmed_${id}`, title: cleanText(row.title),
        authors: (row.authors || []).filter((value: any) => value.name).map((value: any) => ({ name: value.name })),
        year: Number(String(row.pubdate || row.epubdate || '').match(/\d{4}/)?.[0]) || 0,
        venue: row.fulljournalname || row.source || '', doi, url: `https://pubmed.ncbi.nlm.nih.gov/${id}/`,
        citationCount: 0, abstract: '', openAccess: false, source: 'pubmed' as const,
        type: (row.pubtype || []).some((value: string) => /preprint/i.test(value)) ? 'preprint' as const : 'journal' as const,
        volume: row.volume, issue: row.issue, pages: row.pages, pmid: id, pmcid,
      };
    });
  });
}

export function searchDataCite(query: string, options: AdditionalSearchOptions = {}): Promise<AcademicPaper[]> {
  if (!query.trim()) return Promise.resolve([]);
  return cached(`datacite:${query}:${JSON.stringify(options)}`, async () => {
    const terms = query.replace(/[+\-!(){}[\]^"~*?:\\/|&]/g, ' ').replace(/\s+/g, ' ').trim();
    const textQuery = options.searchScope === 'title_only' ? `titles.title:(${terms})` : options.searchScope === 'title_abstract' ? `(titles.title:(${terms}) OR descriptions.description:(${terms}))` : `(${terms})`;
    const textual = '(types.resourceTypeGeneral:Text OR types.resourceTypeGeneral:JournalArticle OR types.resourceTypeGeneral:ConferencePaper OR types.resourceTypeGeneral:Dissertation OR types.resourceTypeGeneral:Report OR types.resourceTypeGeneral:Preprint OR types.resourceTypeGeneral:Book OR types.resourceTypeGeneral:BookChapter)';
    const params = new URLSearchParams({ query: `${textQuery} AND ${textual}`, 'page[size]': String(boundedLimit(options.limit)) });
    const body = await fetchRegistryJson(`https://api.datacite.org/dois?${params}`, 'DataCite');
    if (!Array.isArray(body.data)) throw new RegistryRequestError('DataCite returned an invalid search response.');
    return body.data.flatMap((row: any): AcademicPaper[] => {
      const value = row.attributes || {};
      const resourceType = `${value.types?.resourceTypeGeneral || ''} ${value.types?.resourceType || ''}`.trim();
      const title = cleanText(value.titles?.[0]?.title || '');
      if (!title || !value.doi) return [];
      const type = /preprint|working paper|posted content/i.test(resourceType) ? 'preprint' : /dissertation|thesis/i.test(resourceType) ? 'thesis' : /report/i.test(resourceType) ? 'report' : /conference/i.test(resourceType) ? 'conference' : /book/i.test(resourceType) ? 'book' : /journal/i.test(resourceType) ? 'journal' : undefined;
      const year = Number(value.publicationYear) || 0;
      const publisher = typeof value.publisher === 'string' ? value.publisher : value.publisher?.name || '';
      if ((options.excludePreprints && type === 'preprint') || (options.fromYear && year < options.fromYear) || (options.toYear && year > options.toYear)) return [];
      const rights = value.rightsList || [];
      return [{
        id: `datacite_${value.doi.toLowerCase()}`, title,
        authors: (value.creators || []).map((creator: any) => ({ name: creator.name || `${creator.givenName || ''} ${creator.familyName || ''}`.trim(), givenName: creator.givenName, familyName: creator.familyName })),
        year, venue: value.container?.title || publisher, doi: value.doi,
        url: `https://doi.org/${value.doi}`, citationCount: Number(value.citationCount) || 0,
        abstract: cleanText(value.descriptions?.find((description: any) => description.descriptionType === 'Abstract')?.description || ''),
        openAccess: rights.some((right: any) => /creativecommons\.org\/(licenses|publicdomain)\//i.test(right.rightsUri || '')),
        source: 'datacite', type, documentType: resourceType || undefined, publisher,
      }];
    });
  });
}
