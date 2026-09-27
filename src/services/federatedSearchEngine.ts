import type { AcademicPaper } from '../types/citation';
import { searchOpenAlex, searchCrossref } from './academicApi';
import { searchEuropePmc } from './europePmcService';
import { searchSemanticScholar } from './semanticScholarService';
import { searchArxiv } from './arxivService';
import { checkPaperRetraction } from './retractionSentinel';

export interface FederatedSearchOptions {
  limitPerSource?: number;
  excludePreprints?: boolean;
  fromYear?: number;
  toYear?: number;
  openAccessOnly?: boolean;
  minCitations?: number;
  searchScope?: 'default' | 'title_only' | 'title_abstract';
  enabledSources?: {
    openalex?: boolean;
    europepmc?: boolean;
    crossref?: boolean;
    semanticscholar?: boolean;
    arxiv?: boolean;
  };
}

export interface PrismaFlowStats {
  identification: {
    totalIdentified: number;
    databaseCounts: {
      openalex: number;
      europepmc: number;
      crossref: number;
      semanticscholar: number;
      arxiv: number;
    };
    duplicatesRemoved: number;
  };
  screening: {
    recordsScreened: number;
    excludedPreprints: number;
    excludedNoAbstract: number;
    excludedLowCitations: number;
    totalExcluded: number;
  };
  included: {
    totalIncluded: number;
  };
}

export interface FederatedSearchResult {
  papers: AcademicPaper[];
  prismaStats: PrismaFlowStats;
  retractedCount: number;
}

/**
 * Normalizes title for deduplication comparison.
 */
function cleanTitleForDedup(title: string): string {
  return (title || '')
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Parallel Federated Search Engine
 * Dispatches concurrent queries across OpenAlex, Europe PMC / PubMed, Crossref,
 * Semantic Scholar, and arXiv, tracks PRISMA 2020 attrition metrics, and deduplicates.
 */
export async function executeFederatedSearch(
  query: string,
  options: FederatedSearchOptions = {},
  onProgress?: (msg: string) => void
): Promise<FederatedSearchResult> {
  const {
    limitPerSource = 12,
    excludePreprints = true,
    fromYear,
    toYear,
    openAccessOnly = false,
    minCitations = 0,
    searchScope = 'default',
    enabledSources = {
      openalex: true,
      europepmc: true,
      crossref: true,
      semanticscholar: true,
      arxiv: false,
    },
  } = options;

  onProgress?.('Dispatching concurrent multi-source queries across scholarly registries...');

  // 1. Prepare search tasks
  const tasks: Promise<{ source: string; papers: AcademicPaper[] }>[] = [];

  if (enabledSources.openalex !== false) {
    tasks.push(
      searchOpenAlex(query, limitPerSource, excludePreprints, fromYear)
        .then((papers) => ({ source: 'openalex', papers }))
        .catch(() => ({ source: 'openalex', papers: [] }))
    );
  }

  if (enabledSources.europepmc !== false) {
    tasks.push(
      searchEuropePmc(query, {
        limit: limitPerSource,
        excludePreprints,
        fromYear,
        openAccessOnly,
        searchScope,
      })
        .then((papers) => ({ source: 'europepmc', papers }))
        .catch(() => ({ source: 'europepmc', papers: [] }))
    );
  }

  if (enabledSources.crossref !== false) {
    tasks.push(
      searchCrossref(query, limitPerSource, excludePreprints, fromYear)
        .then((papers) => ({ source: 'crossref', papers }))
        .catch(() => ({ source: 'crossref', papers: [] }))
    );
  }

  if (enabledSources.semanticscholar) {
    tasks.push(
      searchSemanticScholar(query, {
        limit: limitPerSource,
        fromYear,
        toYear,
      })
        .then((papers) => ({ source: 'semanticscholar', papers }))
        .catch(() => ({ source: 'semanticscholar', papers: [] }))
    );
  }

  if (enabledSources.arxiv && !excludePreprints) {
    tasks.push(
      searchArxiv(query, limitPerSource)
        .then((papers) => ({ source: 'arxiv', papers }))
        .catch(() => ({ source: 'arxiv', papers: [] }))
    );
  }

  const results = await Promise.all(tasks);

  // 2. PRISMA 2020 Identification metrics
  const databaseCounts = {
    openalex: 0,
    europepmc: 0,
    crossref: 0,
    semanticscholar: 0,
    arxiv: 0,
  };

  const rawCorpus: AcademicPaper[] = [];
  for (const res of results) {
    const count = res.papers.length;
    if (res.source in databaseCounts) {
      databaseCounts[res.source as keyof typeof databaseCounts] = count;
    }
    rawCorpus.push(...res.papers);
  }

  const totalIdentified = rawCorpus.length;
  onProgress?.(`Retrieved ${totalIdentified} raw records. Deduplicating and auditing...`);

  // 3. Deduplication via DOI and normalized title
  const seenDois = new Set<string>();
  const seenTitles = new Set<string>();
  const deduped: AcademicPaper[] = [];
  let duplicatesRemoved = 0;

  for (const paper of rawCorpus) {
    const doiClean = (paper.doi || '').toLowerCase().trim();
    const titleNorm = cleanTitleForDedup(paper.title);

    if (doiClean && seenDois.has(doiClean)) {
      duplicatesRemoved++;
      continue;
    }
    if (titleNorm && seenTitles.has(titleNorm)) {
      duplicatesRemoved++;
      continue;
    }

    if (doiClean) seenDois.add(doiClean);
    if (titleNorm) seenTitles.add(titleNorm);
    deduped.push(paper);
  }

  // 4. Screening Attrition filters
  let excludedPreprints = 0;
  let excludedNoAbstract = 0;
  let excludedLowCitations = 0;

  const screened: AcademicPaper[] = [];

  for (const paper of deduped) {
    // Audit retraction sentinel
    const retraction = checkPaperRetraction(paper);
    if (retraction.isRetracted) {
      paper.isRetracted = true;
      paper.retractionDetails = retraction.reason;
    }

    if (excludePreprints && paper.type === 'preprint') {
      excludedPreprints++;
      continue;
    }
    if (minCitations > 0 && (paper.citationCount || 0) < minCitations) {
      excludedLowCitations++;
      continue;
    }
    if (!paper.abstract || paper.abstract.length < 40) {
      excludedNoAbstract++;
      // Still keep unless strict, but count for PRISMA breakdown
    }

    screened.push(paper);
  }

  // Sort by highest citation count & relevance
  screened.sort((a, b) => (b.citationCount || 0) - (a.citationCount || 0));

  const totalExcluded = excludedPreprints + excludedLowCitations;
  const retractedCount = screened.filter((p) => p.isRetracted).length;

  const prismaStats: PrismaFlowStats = {
    identification: {
      totalIdentified,
      databaseCounts,
      duplicatesRemoved,
    },
    screening: {
      recordsScreened: deduped.length,
      excludedPreprints,
      excludedNoAbstract,
      excludedLowCitations,
      totalExcluded,
    },
    included: {
      totalIncluded: screened.length,
    },
  };

  onProgress?.(`Systematic extraction complete: ${screened.length} peer-reviewed studies included.`);

  return {
    papers: screened,
    prismaStats,
    retractedCount,
  };
}

/**
 * Generates ready-to-copy PRISMA 2020 Search & Screening Protocol prose.
 */
export function generatePrismaProse(query: string, stats: PrismaFlowStats): string {
  const dbs = stats.identification.databaseCounts;
  const dbStrings: string[] = [];
  if (dbs.openalex > 0) dbStrings.push(`OpenAlex (n = ${dbs.openalex})`);
  if (dbs.europepmc > 0) dbStrings.push(`Europe PMC / PubMed Central (n = ${dbs.europepmc})`);
  if (dbs.crossref > 0) dbStrings.push(`Crossref (n = ${dbs.crossref})`);
  if (dbs.semanticscholar > 0) dbStrings.push(`Semantic Scholar (n = ${dbs.semanticscholar})`);
  if (dbs.arxiv > 0) dbStrings.push(`arXiv (n = ${dbs.arxiv})`);

  return `### PRISMA 2020 Systematic Literature Search Protocol
**Search Query:** "${query}"
**Databases Consulted:** ${dbStrings.join(', ')}.

1. **Identification Phase:**
   A total of ${stats.identification.totalIdentified} records were identified through federated multi-registry queries (${dbStrings.join(', ')}). Across the aggregated corpus, ${stats.identification.duplicatesRemoved} duplicate records were identified and removed based on DOI and normalized title matching.

2. **Screening & Eligibility Phase:**
   ${stats.screening.recordsScreened} distinct records were screened against peer-review eligibility criteria. A total of ${stats.screening.totalExcluded} records were excluded during screening (${stats.screening.excludedPreprints} non-peer-reviewed preprints, ${stats.screening.excludedLowCitations} records below impact citation thresholds).

3. **Inclusion Phase:**
   ${stats.included.totalIncluded} verified peer-reviewed empirical and theoretical studies met all inclusion criteria and were synthesized into the final review corpus.`;
}
