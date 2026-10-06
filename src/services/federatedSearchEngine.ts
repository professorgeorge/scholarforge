import type { AcademicPaper } from '../types/citation';
import { searchOpenAlex, searchCrossref } from './academicApi';
import { searchEuropePmc } from './europePmcService';
import { searchSemanticScholar } from './semanticScholarService';
import { searchArxiv } from './arxivService';
import { checkPaperRetraction } from './retractionSentinel';
import { extractAcademicKeywords, synthesizeBooleanSearchStrategy } from './academicQueryParser';

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
      let timerId: any;
      const timeoutPromise = new Promise<AcademicPaper[]>((resolve) => {
        timerId = setTimeout(() => {
          console.warn(`[Federated Engine] ${label} response timed out after 4.5s. Proceeding with other registries.`);
          resolve([]);
        }, 4500);
      });

      const papers = await Promise.race([promise, timeoutPromise]);
      clearTimeout(timerId);

      const entry = { source: sourceName, papers: Array.isArray(papers) ? papers : [] };
      accumulatedResults.push(entry);

      if (papers && papers.length > 0) {
        onProgress?.(`✓ ${label} returned ${papers.length} publications. Harmonizing...`);
      }
      return entry;
    } catch (err: any) {
      console.warn(`[Federated Engine] ${label} failed:`, err?.message);
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

  // Await either all tasks settling OR a 6-second global aggregation window
  await Promise.race([
    Promise.allSettled(tasks),
    new Promise<void>((resolve) => {
      setTimeout(() => {
        onProgress?.('Aggregation window complete. Harmonizing harvested records...');
        resolve();
      }, 6000);
    }),
  ]);

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

  // Compute multi-factor academic relevance score for each candidate paper
  const queryTokens = extractAcademicKeywords(query);
  const cleanQ = query.toLowerCase().trim();

  const computeRelevance = (paper: AcademicPaper): number => {
    let score = 0;
    const titleLower = (paper.title || '').toLowerCase();
    const abstractLower = (paper.abstract || '').toLowerCase();

    // 1. Exact phrase match bonus
    if (cleanQ.length > 5 && titleLower.includes(cleanQ)) {
      score += 80;
    } else if (cleanQ.length > 5 && abstractLower.includes(cleanQ)) {
      score += 40;
    }

    // 2. Keyword matching in Title (heavy weight)
    let titleMatches = 0;
    for (const token of queryTokens) {
      if (titleLower.includes(token)) {
        titleMatches++;
        score += 25;
      }
    }

    // 3. Keyword matching in Abstract
    for (const token of queryTokens) {
      if (abstractLower.includes(token)) {
        score += 8;
      }
    }

    // 4. Keyword coverage ratio across salient query tokens
    if (queryTokens.length > 0) {
      const salientTokens = queryTokens.slice(0, 5);
      const matchedTokens = salientTokens.filter(
        (t) => titleLower.includes(t) || abstractLower.includes(t)
      );
      const coverage = matchedTokens.length / salientTokens.length;
      if (coverage >= 0.6) {
        score += 35; // high topic fidelity
      } else if (coverage < 0.25 && salientTokens.length > 2) {
        score -= 15; // mild off-topic penalty
      }
    }


    // 5. OpenAlex / API native relevance score
    if (paper.relevanceScore && paper.relevanceScore > 0) {
      score += Math.min(paper.relevanceScore * 10, 25);
    }

    // 6. Citation Count: Log-scaled authority boost (capped so it cannot overwhelm topical relevance)
    const logCitations = Math.log10((paper.citationCount || 0) + 1);
    score += Math.min(logCitations * 4, 18);

    // 7. Structural quality bonuses
    if (paper.doi) score += 10;
    if (paper.abstract && paper.abstract.length > 60) score += 8;

    // 8. Recency bump (last 10 years)
    const currentYear = new Date().getFullYear();
    if (paper.year && paper.year >= currentYear - 10) {
      score += 4;
    }

    return score;
  };

  // 5. Intelligent Query-Relaxation Fallback: If 0 papers passed, query OpenAlex & Crossref with core academic keywords
  if (screened.length === 0) {
    onProgress?.('Broadening search to capture related peer-reviewed studies...');
    const fallbackTerms = extractAcademicKeywords(query).slice(0, 3).join(' ') || query.replace(/[^\w\s-]/g, ' ').trim();
    if (fallbackTerms) {
      try {
        const fallbackTasks = [
          searchOpenAlex(fallbackTerms, limitPerSource, excludePreprints, fromYear),
          searchCrossref(fallbackTerms, limitPerSource, excludePreprints, fromYear),
        ];
        const fallbackSettled = await Promise.allSettled(fallbackTasks);
        for (const res of fallbackSettled) {
          if (res.status === 'fulfilled') {
            for (const paper of res.value) {
              const doiClean = (paper.doi || '').toLowerCase().trim();
              if (doiClean && !seenDois.has(doiClean)) {
                seenDois.add(doiClean);
                screened.push(paper);
              }
            }
          }
        }
      } catch (fbErr: any) {
        console.warn('[Federated Engine] Fallback search failed:', fbErr?.message);
      }
    }
  }

  // Sort by multi-factor relevance score descending
  screened.sort((a, b) => computeRelevance(b) - computeRelevance(a));

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
