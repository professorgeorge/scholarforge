import { getActiveProjectId, getProject, id, now, saveProject, type SearchRun } from './projectService';
import type { AcademicPaper } from '../types/citation';
import { searchOpenAlex, searchCrossref } from './academicApi';
import { searchEuropePmc } from './europePmcService';
import { searchSemanticScholar } from './semanticScholarService';
import { searchArxiv } from './arxivService';
import { checkPaperRetraction } from './retractionSentinel';
import { extractAcademicKeywords, synthesizeBooleanSearchStrategy } from './academicQueryParser';
import { rankPapersByRelevance } from './relevanceScoringService';

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
  sourceStatuses: SearchRun['sources'];
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
    limitPerSource = 30,
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

  const initiatingProjectId = getActiveProjectId();
  const sourceStatuses: SearchRun['sources'] = [];
  const rawTrimmed = query.trim();
  const hasBooleanOrQuotes = /["\(\)]|\b(AND|OR|NOT)\b/i.test(rawTrimmed);

  // 1. Prepare registry-optimized query representations
  let europePmcQuery: string;
  let fullTextKeywordQuery: string;

  if (hasBooleanOrQuotes) {
    europePmcQuery = rawTrimmed;
    // For full-text search APIs (OpenAlex, Crossref, S2), extract the clean core words without quotes/parens
    const cleanTokens = extractAcademicKeywords(rawTrimmed);
    fullTextKeywordQuery = cleanTokens.slice(0, 5).join(' ') || rawTrimmed.replace(/[^\w\s-]/g, ' ').trim();
  } else {
    // Natural Language: Synthesize high-fidelity Boolean query for Europe PMC
    // and concise core concept keywords for OpenAlex / Crossref / Semantic Scholar
    const strategy = synthesizeBooleanSearchStrategy(rawTrimmed);
    europePmcQuery = strategy.booleanQuery;
    fullTextKeywordQuery = strategy.coreKeywords;
  }

  const accumulatedResults: { source: string; papers: AcademicPaper[] }[] = [];

  const wrapSource = async (
    sourceName: string,
    label: string,
    promise: Promise<AcademicPaper[]>
  ): Promise<{ source: string; papers: AcademicPaper[] }> => {
    try {
      // Enforce 4.5-second hard ceiling per source so slow APIs can never hang the search
      let timerId: ReturnType<typeof setTimeout> | undefined;
      let timedOut = false;
      const timeoutPromise = new Promise<AcademicPaper[]>((resolve) => {
        timerId = setTimeout(() => {
          console.warn(`[Federated Engine] ${label} response timed out after 4.5s. Proceeding with other registries.`);
          timedOut = true;
          resolve([]);
        }, 4500);
      });

      const papers = await Promise.race([promise, timeoutPromise]);
      clearTimeout(timerId);

      const entry = { source: sourceName, papers: Array.isArray(papers) ? papers : [] };
      accumulatedResults.push(entry);
      sourceStatuses.push({ name: sourceName, query: sourceName === 'europepmc' ? europePmcQuery : fullTextKeywordQuery, status: timedOut ? 'timed out' : papers.length ? 'records returned (bounded discovery)' : 'empty or unavailable', count: entry.papers.length, detail: 'Discovery adapters may simplify or relax queries. Empty responses do not establish zero database matches. Use logged review search for explicit requests.' });

      if (papers && papers.length > 0) {
        onProgress?.(`✓ ${label} returned ${papers.length} publications. Harmonizing...`);
      }
      return entry;
    } catch (err: any) {
      console.warn(`[Federated Engine] ${label} failed:`, err?.message);
      sourceStatuses.push({ name: sourceName, query: fullTextKeywordQuery, status: 'failed', count: 0, detail: err?.message });
      const entry = { source: sourceName, papers: [] };
      accumulatedResults.push(entry);
      return entry;
    }
  };

  const tasks: Promise<{ source: string; papers: AcademicPaper[] }>[] = [];

  if (enabledSources.openalex !== false) {
    tasks.push(
      wrapSource(
        'openalex',
        'OpenAlex (250M+ Works)',
        searchOpenAlex(fullTextKeywordQuery, limitPerSource, excludePreprints, fromYear)
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
        })
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

  if (enabledSources.semanticscholar) {
    const s2Keywords = extractAcademicKeywords(fullTextKeywordQuery).slice(0, 4).join(' ');
    tasks.push(
      wrapSource(
        'semanticscholar',
        'Semantic Scholar Graph',
        searchSemanticScholar(s2Keywords || fullTextKeywordQuery, {
          limit: limitPerSource,
          fromYear,
          toYear,
        })
      )
    );
  }

  if (enabledSources.arxiv && !excludePreprints) {
    const arxivKeywords = extractAcademicKeywords(fullTextKeywordQuery).slice(0, 4).join(' ');
    tasks.push(
      wrapSource(
        'arxiv',
        'arXiv Archive',
        searchArxiv(arxivKeywords || fullTextKeywordQuery, limitPerSource)
      )
    );
  }

  // Each source has its own bounded timeout; wait for all source statuses.
  await Promise.allSettled(tasks);

  // Use all successfully accumulated results - never wipe them out
  const results = accumulatedResults;

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
    const count = res.papers ? res.papers.length : 0;
    if (res.source in databaseCounts) {
      databaseCounts[res.source as keyof typeof databaseCounts] = count;
    }
    if (res.papers) {
      rawCorpus.push(...res.papers);
    }
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

  // Sort and optionally filter off-topic papers using the shared verifier-grade relevance scorer.
  // filterOffTopic=false keeps all papers but still sorts them — ensures zero result-count regression.
  const ranked = rankPapersByRelevance(screened, query, false);

  const totalExcluded = excludedPreprints + excludedLowCitations;
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
    },
    included: {
      totalIncluded: ranked.length,
    },
  };

  onProgress?.(`Discovery complete: ${ranked.length} candidate records retained. Eligibility and support require review.`);
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
  if (dbs.arxiv > 0) dbStrings.push(`arXiv (n = ${dbs.arxiv})`);

  return `### Discovery retrieval summary (not a completed systematic review)
**Input query:** "${query}"
**Returned records:** ${dbStrings.join(', ') || 'No records returned; services may be unavailable'}.
${stats.identification.totalIdentified} records were returned within the configured source limits. ${stats.identification.duplicatesRemoved} duplicates were removed. ${stats.screening.excludedPreprints} preprints and ${stats.screening.excludedLowCitations} records below the optional citation filter were removed. ${stats.included.totalIncluded} candidate records remain.
These counts describe bounded discovery, not exhaustive database matches, peer-review verification, eligibility decisions, full-text appraisal, or completed synthesis. Citation-count filtering is a discovery preference, not a default systematic-review eligibility rule. Use the project screening ledger to record actual eligibility decisions and exclusion reasons. Consult the full PRISMA reporting guidance before reporting a systematic review.`;
}
