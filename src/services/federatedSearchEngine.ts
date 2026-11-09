import { getActiveProjectId, getProject, id, now, saveProject, type SearchRun } from './projectService';
import type { AcademicPaper } from '../types/citation';
import { searchOpenAlex, searchCrossref } from './academicApi';
import { searchEuropePmc } from './europePmcService';
import { searchSemanticScholar } from './semanticScholarService';
import { searchArxiv } from './arxivService';
import { searchPubmed, searchDataCite } from './additionalScholarlySources';
import { DEFAULT_SCHOLARLY_SOURCES, type ScholarlySourceId } from './scholarlySources';
import { RegistryRequestError } from './registryRequestService';
import { mergeDiscoveryPapers } from './discoveryMergeService';
import { checkPaperRetraction } from './retractionSentinel';
import { synthesizeBooleanSearchStrategy } from './academicQueryParser';
import { rankPapersByRelevance } from './relevanceScoringService';

export interface FederatedSearchOptions {
  limitPerSource?: number;
  excludePreprints?: boolean;
  fromYear?: number;
  toYear?: number;
  openAccessOnly?: boolean;
  minCitations?: number;
  requireDoi?: boolean;
  queryMode?: 'adaptive' | 'literal';
  focusQuery?: string;
  searchScope?: 'default' | 'title_only' | 'title_abstract';
  enabledSources?: Partial<Record<ScholarlySourceId, boolean>>;
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
      pubmed?: number;
      datacite?: number;
    };
    duplicatesRemoved: number;
  };
  screening: {
    recordsScreened: number;
    excludedPreprints: number;
    excludedNoAbstract: number;
    excludedLowCitations: number;
    totalExcluded: number;
    excludedOtherFilters?: number;
    excludedOffTopic?: number;
  };
  included: {
    totalIncluded: number;
  };
}

export interface FederatedSearchResult {
  papers: AcademicPaper[];
  prismaStats: PrismaFlowStats;
  retractedCount: number;
  sourceStatuses: SearchRun['sources'];
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
    limitPerSource = 30,
    excludePreprints = true,
    fromYear,
    toYear,
    openAccessOnly = false,
    minCitations = 0,
    requireDoi = false,
    searchScope = 'default',
    enabledSources: selectedSources,
  } = options;

  const enabledSources = { ...DEFAULT_SCHOLARLY_SOURCES, ...selectedSources };
  if (!Object.entries(enabledSources).some(([source, enabled]) => enabled && (source !== 'arxiv' || !excludePreprints))) throw new Error('Select at least one usable source. arXiv requires preprints to be enabled.');

  onProgress?.('Dispatching concurrent multi-source queries across scholarly registries...');

  const initiatingProjectId = getActiveProjectId();
  const sourceStatuses: SearchRun['sources'] = [];
  const rawTrimmed = query.trim();
  const strategy = synthesizeBooleanSearchStrategy(rawTrimmed);
  const europePmcQuery = options.queryMode === 'literal' ? rawTrimmed : strategy.booleanQuery;
  const fullTextKeywordQuery = options.queryMode === 'literal' ? rawTrimmed : strategy.coreKeywords;


  const wrapSource = async (
    sourceName: string,
    label: string,
    promise: Promise<AcademicPaper[]>,
    sourceQuery = fullTextKeywordQuery
  ): Promise<{ source: string; papers: AcademicPaper[] }> => {
    let timerId: ReturnType<typeof setTimeout> | undefined;
    try {
      // Bound discovery independently; one unavailable source cannot block successful results.
      let timedOut = false;
      const timeoutPromise = new Promise<AcademicPaper[]>((resolve) => {
        timerId = setTimeout(() => {
          console.warn(`[Federated Engine] ${label} response timed out after 12s. Proceeding with other registries.`);
          timedOut = true;
          resolve([]);
        }, 12000);
      });

      const papers = await Promise.race([promise, timeoutPromise]);
      clearTimeout(timerId);

      const entry = { source: sourceName, papers: Array.isArray(papers) ? papers : [] };
      sourceStatuses.push({ name: sourceName, query: sourceQuery, status: timedOut ? 'timed out' : papers.length ? 'records returned (bounded discovery)' : ['pubmed', 'datacite', 'semanticscholar'].includes(sourceName) ? 'no records returned' : 'empty or unavailable', count: entry.papers.length, detail: 'All topic concepts are retained; queries are not automatically broadened. Provider syntax and metadata coverage vary. Results are checked against the original topic using available titles and abstracts.' });

      if (papers && papers.length > 0) {
        onProgress?.(`✓ ${label} returned ${papers.length} publications. Harmonizing...`);
      }
      return entry;
    } catch (err: any) {
      console.warn(`[Federated Engine] ${label} failed:`, err?.message);
      sourceStatuses.push({ name: sourceName, query: sourceQuery, status: err instanceof RegistryRequestError && err.status === 429 ? 'rate limited' : /paused/i.test(err?.message || '') ? 'temporarily paused' : /timed out/i.test(err?.message || '') ? 'timed out' : 'failed', count: 0, detail: err?.message });
      const entry = { source: sourceName, papers: [] };
      return entry;
    } finally {
      clearTimeout(timerId);
    }
  };

  const tasks: Promise<{ source: string; papers: AcademicPaper[] }>[] = [];

  if (enabledSources.openalex !== false) {
    tasks.push(
      wrapSource(
        'openalex',
        'OpenAlex (250M+ Works)',
        searchOpenAlex(europePmcQuery, limitPerSource, excludePreprints, fromYear),
        europePmcQuery
      )
    );
  }

  if (enabledSources.europepmc !== false) {
    tasks.push(
      wrapSource(
        'europepmc',
        'Europe PMC / PubMed Central',
        searchEuropePmc(europePmcQuery, {
          limit: limitPerSource,
          excludePreprints,
          fromYear,
          openAccessOnly,
          searchScope,
        }),
        europePmcQuery
      )
    );
  }

  if (enabledSources.crossref !== false) {
    tasks.push(
      wrapSource(
        'crossref',
        'Crossref Publisher Registry',
        searchCrossref(fullTextKeywordQuery, limitPerSource, excludePreprints, fromYear)
      )
    );
  }

  if (enabledSources.pubmed) {
    tasks.push(wrapSource('pubmed', 'PubMed', searchPubmed(fullTextKeywordQuery, { limit: limitPerSource, fromYear, toYear, excludePreprints, searchScope })));
  }
  if (enabledSources.datacite) {
    tasks.push(wrapSource('datacite', 'DataCite', searchDataCite(fullTextKeywordQuery, { limit: limitPerSource, fromYear, toYear, excludePreprints, searchScope })));
  }

  if (enabledSources.semanticscholar) {
    const s2Keywords = fullTextKeywordQuery;
    tasks.push(
      wrapSource(
        'semanticscholar',
        'Semantic Scholar Graph',
        searchSemanticScholar(s2Keywords || fullTextKeywordQuery, {
          limit: limitPerSource,
          fromYear,
          toYear,
        }),
        s2Keywords || fullTextKeywordQuery
      )
    );
  }

  if (enabledSources.arxiv && !excludePreprints) {
    const arxivKeywords = fullTextKeywordQuery;
    tasks.push(
      wrapSource(
        'arxiv',
        'arXiv Archive',
        searchArxiv(arxivKeywords || fullTextKeywordQuery, limitPerSource),
        arxivKeywords || fullTextKeywordQuery
      )
    );
  }

  // Promise.all retains source priority, independent of response arrival order.
  const results = await Promise.all(tasks);

  // 2. PRISMA 2020 Identification metrics
  const databaseCounts = {
    openalex: 0,
    europepmc: 0,
    crossref: 0,
    semanticscholar: 0,
    arxiv: 0,
    pubmed: 0,
    datacite: 0,
  };

  const rawCorpus: AcademicPaper[] = [];
  for (const res of results) {
    const count = res.papers ? res.papers.length : 0;
    if (res.source in databaseCounts) {
      databaseCounts[res.source as keyof typeof databaseCounts] = count;
    }
    if (res.papers) {
      rawCorpus.push(...res.papers.map(paper => ({ ...paper, registryProvenance: [{ registry: res.source, recordId: paper.id, retrievedAt: now(), query, citationCount: paper.citationCount }] })));
    }
  }

  const totalIdentified = rawCorpus.length;
  onProgress?.(`Retrieved ${totalIdentified} raw records. Deduplicating and auditing...`);

  // Reconcile provider records without losing provenance or combining citation totals.
  const { papers: deduped, duplicatesRemoved } = mergeDiscoveryPapers(rawCorpus);

  // 4. Screening Attrition filters
  let excludedPreprints = 0;
  let excludedNoAbstract = 0;
  let excludedLowCitations = 0;
  let excludedOtherFilters = 0;

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
    if ((fromYear && paper.year < fromYear) || (toYear && paper.year > toYear) || (openAccessOnly && !paper.openAccess) || (requireDoi && !paper.doi)) {
      excludedOtherFilters++;
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

  // Match against all requested concepts; provider scores are not comparable across sources.
  const scoped = searchScope === 'title_only' ? screened.map(paper => ({ ...paper, abstract: '' })) : screened;
  const focused = options.focusQuery?.trim() ? rankPapersByRelevance(scoped, options.focusQuery, true) : scoped;
  const rankedIds = rankPapersByRelevance(focused, query, true);
  const ranked = rankedIds.map(paper => ({ ...screened.find(original => original.id === paper.id)!, relevanceExplanation: paper.relevanceExplanation }));
  const excludedOffTopic = screened.length - ranked.length;
  const totalExcluded = excludedPreprints + excludedLowCitations + excludedOtherFilters + excludedOffTopic;
  const retractedCount = ranked.filter((p) => p.isRetracted).length;

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
      excludedOtherFilters,
      excludedOffTopic,
    },
    included: {
      totalIncluded: ranked.length,
    },
  };

  onProgress?.(`Discovery complete: ${ranked.length} candidate records retained; ${excludedOffTopic} weak topic matches removed. Eligibility and support require review.`);
  const project = getProject(initiatingProjectId);
  if (project) {
    try { saveProject({ ...project, searches: [...project.searches, { id: id(), query, at: now(), mode: 'rapid discovery: bounded, query transformation possible', sources: sourceStatuses, count: ranked.length, options }] }); } catch { /* Workspace displays storage errors. */ }
  }

  return {
    papers: ranked,
    prismaStats,
    retractedCount,
    sourceStatuses,
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
  if (dbs.pubmed) dbStrings.push(`PubMed (n = ${dbs.pubmed})`);
  if (dbs.datacite) dbStrings.push(`DataCite (n = ${dbs.datacite})`);
  if (dbs.arxiv > 0) dbStrings.push(`arXiv (n = ${dbs.arxiv})`);

  return `### Discovery retrieval summary (not a completed systematic review)
**Input query:** "${query}"
**Returned records:** ${dbStrings.join(', ') || 'No records returned; services may be unavailable'}.
${stats.identification.totalIdentified} records were returned within the configured source limits. ${stats.identification.duplicatesRemoved} duplicates were removed. ${stats.screening.excludedPreprints} preprints and ${stats.screening.excludedLowCitations} records below the optional citation filter were removed. ${stats.screening.excludedOtherFilters || 0} records were excluded by year, DOI, or open-access filters. ${stats.screening.excludedOffTopic || 0} records were removed by the title/abstract topic-match filter. ${stats.included.totalIncluded} candidate records remain.
These counts describe bounded discovery, not exhaustive database matches, peer-review verification, eligibility decisions, full-text appraisal, or completed synthesis. Citation-count filtering is a discovery preference, not a default systematic-review eligibility rule. Use the project screening ledger to record actual eligibility decisions and exclusion reasons. Consult the full PRISMA reporting guidance before reporting a systematic review.`;
}
