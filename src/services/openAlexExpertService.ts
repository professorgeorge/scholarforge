import type { Work, ReviewerCandidate, CareerStage, EmailSource, EmailConfidence } from '../types/expertSearch';

const OPENALEX_BASE_URL = 'https://api.openalex.org';

interface RawAuthorship {
  author_position: 'first' | 'middle' | 'last';
  is_corresponding?: boolean;
  author: {
    id: string;
    display_name: string;
    orcid?: string | null;
  };
  institutions: Array<{
    id: string;
    display_name: string;
    ror?: string;
    country_code?: string;
  }>;
  raw_affiliation_strings?: string[];
}

interface RawWork {
  id: string;
  doi?: string | null;
  title: string;
  publication_year: number;
  cited_by_count: number;
  primary_location?: {
    source?: {
      display_name?: string;
    };
  };
  open_access?: {
    is_oa: boolean;
    oa_url?: string | null;
  };
  authorships: RawAuthorship[];
  abstract_inverted_index?: Record<string, number[]>;
}

// Helper to reconstruct abstract from OpenAlex inverted index
function reconstructAbstract(invertedIndex?: Record<string, number[]>): string {
  if (!invertedIndex) return '';
  const wordMap: Array<{ word: string; pos: number }> = [];
  for (const [word, positions] of Object.entries(invertedIndex)) {
    for (const pos of positions) {
      wordMap.push({ word, pos });
    }
  }
  wordMap.sort((a, b) => a.pos - b.pos);
  return wordMap.map(item => item.word).join(' ').slice(0, 300) + '...';
}

// Regex to extract email from raw affiliation text
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;

export async function searchOpenAlexWorks(
  query: string,
  userEmail: string = 'scholar-search@editorial-intel.org',
  limit: number = 25
): Promise<{ works: RawWork[]; candidates: ReviewerCandidate[] }> {
  const mailtoParam = encodeURIComponent(userEmail || 'scholar-search@editorial-intel.org');
  const encodedQuery = encodeURIComponent(query.trim());
  
  // Query top recent works matching the search terms
  const currentYear = new Date().getFullYear();
  const minYear = currentYear - 4; // last 4 years for recent expertise
  
  const url = `${OPENALEX_BASE_URL}/works?search=${encodedQuery}&filter=publication_year:>${minYear}&per-page=${limit}&sort=relevance_score:desc&mailto=${mailtoParam}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`OpenAlex API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const rawWorks: RawWork[] = data.results || [];

  // Candidate aggregation map by OpenAlex author ID
  const authorMap = new Map<string, {
    author: RawAuthorship['author'];
    institutions: RawAuthorship['institutions'];
    rawAffiliations: string[];
    works: Work[];
    isCorresponding: boolean;
    extractedEmail: string | null;
  }>();

  for (const rawWork of rawWorks) {
    const venueName = rawWork.primary_location?.source?.display_name || null;
    const abstract = reconstructAbstract(rawWork.abstract_inverted_index);

    for (const authorship of rawWork.authorships) {
      const authorId = authorship.author.id;
      if (!authorId || !authorship.author.display_name) continue;

      let extractedEmail: string | null = null;
      if (authorship.raw_affiliation_strings) {
        for (const affil of authorship.raw_affiliation_strings) {
          const match = affil.match(EMAIL_REGEX);
          if (match) {
            extractedEmail = match[0].toLowerCase();
            break;
          }
        }
      }

      const workObj: Work = {
        id: rawWork.id,
        doi: rawWork.doi ? rawWork.doi.replace('https://doi.org/', '') : null,
        title: rawWork.title,
        publication_year: rawWork.publication_year,
        cited_by_count: rawWork.cited_by_count || 0,
        venue: venueName,
        is_oa: rawWork.open_access?.is_oa || false,
        oa_url: rawWork.open_access?.oa_url || null,
        author_position: authorship.author_position || 'unknown',
        is_corresponding: Boolean(authorship.is_corresponding),
        raw_affiliation: authorship.raw_affiliation_strings?.[0],
        abstract
      };

      if (!authorMap.has(authorId)) {
        authorMap.set(authorId, {
          author: authorship.author,
          institutions: authorship.institutions || [],
          rawAffiliations: authorship.raw_affiliation_strings || [],
          works: [workObj],
          isCorresponding: Boolean(authorship.is_corresponding),
          extractedEmail
        });
      } else {
        const record = authorMap.get(authorId)!;
        record.works.push(workObj);
        if (authorship.is_corresponding) record.isCorresponding = true;
        if (extractedEmail && !record.extractedEmail) record.extractedEmail = extractedEmail;
        
        // Merge institutions
        for (const inst of (authorship.institutions || [])) {
          if (!record.institutions.some(i => i.id === inst.id)) {
            record.institutions.push(inst);
          }
        }
      }
    }
  }

  // Convert map to ReviewerCandidate objects
  const candidates: ReviewerCandidate[] = [];

  for (const [authorId, entry] of authorMap.entries()) {
    const totalWorksCount = entry.works.length;
    const totalCitations = entry.works.reduce((acc, w) => acc + w.cited_by_count, 0);

    // Career Stage Heuristic based on works sample and authorship position
    let careerStage: CareerStage = 'Mid-Career Authority';
    const hasFirstAuthor = entry.works.some(w => w.author_position === 'first');
    const hasLastAuthor = entry.works.some(w => w.author_position === 'last');

    if (totalCitations > 500 || (hasLastAuthor && totalWorksCount >= 3)) {
      careerStage = 'Senior Group Leader / PI';
    } else if (hasFirstAuthor && totalCitations < 100 && totalWorksCount <= 2) {
      careerStage = 'Early-Career Specialist';
    }

    // Determine email source and confidence
    let emailSource: EmailSource = null;
    let emailConfidence: EmailConfidence = 'none';

    if (entry.extractedEmail) {
      emailSource = 'openalex_metadata';
      emailConfidence = 'high';
    }

    // Rough h-index estimation from sample works
    const sortedCites = [...entry.works.map(w => w.cited_by_count)].sort((a, b) => b - a);
    let hIndexEst = 0;
    for (let i = 0; i < sortedCites.length; i++) {
      if (sortedCites[i] >= i + 1) hIndexEst = i + 1;
      else break;
    }

    const primaryInst = entry.institutions[0]?.display_name || 'Academic Institution';
    const countryCode = entry.institutions[0]?.country_code || null;

    candidates.push({
      id: authorId,
      name: entry.author.display_name,
      orcid: entry.author.orcid || null,
      affiliations: entry.rawAffiliations,
      institutions: entry.institutions.map(i => ({
        id: i.id,
        name: i.display_name,
        ror: i.ror,
        country_code: i.country_code
      })),
      primaryInstitution: primaryInst,
      countryCode,
      email: entry.extractedEmail,
      emailSource,
      emailConfidence,
      careerStage,
      sampleWorks: entry.works,
      totalRecentWorksCount: totalWorksCount,
      totalRecentCitations: totalCitations,
      hIndexEst,
      readinessScore: 75,
      scoreBreakdown: {
        semanticMatch: 30,
        recency: 20,
        careerSweetSpot: 15,
        authorshipLead: 10,
        overloadPenalty: 0
      },
      coiStatus: {
        hasCoi: false,
        reasons: [],
        severity: 'none',
        matchedAuthors: [],
        matchedInstitutions: []
      },
      acceptanceLikelihood: 'High',
      publicationVelocity: 'Active Scholar'
    });
  }

  return { works: rawWorks, candidates };
}

// Fetch single work details by DOI or PMID for 1-click ingest
export async function fetchWorkByIdentifier(
  identifier: string,
  userEmail: string = 'scholar-search@editorial-intel.org'
): Promise<{
  title: string;
  abstract: string;
  keywords: string;
  authors: string[];
  institutions: string[];
} | null> {
  const mailtoParam = encodeURIComponent(userEmail || 'scholar-search@editorial-intel.org');
  let cleanId = identifier.trim();

  // Normalize DOI / PMID
  if (cleanId.startsWith('10.')) {
    cleanId = `https://doi.org/${cleanId}`;
  } else if (/^\d+$/.test(cleanId)) {
    cleanId = `pmid:${cleanId}`;
  }

  const url = `${OPENALEX_BASE_URL}/works/${encodeURIComponent(cleanId)}?mailto=${mailtoParam}`;

  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const work = await res.json();

    const title = work.title || '';
    const abstract = reconstructAbstract(work.abstract_inverted_index);

    const authors: string[] = [];
    const institutions: string[] = [];

    if (work.authorships) {
      for (const auth of work.authorships) {
        if (auth.author?.display_name) {
          authors.push(auth.author.display_name);
        }
        if (auth.institutions) {
          for (const inst of auth.institutions) {
            if (inst.display_name && !institutions.includes(inst.display_name)) {
              institutions.push(inst.display_name);
            }
          }
        }
      }
    }

    const keywords = (work.concepts || [])
      .slice(0, 6)
      .map((c: any) => c.display_name)
      .join(' ');

    return {
      title,
      abstract,
      keywords,
      authors,
      institutions
    };
  } catch (err) {
    console.warn('Failed to fetch work by identifier:', err);
    return null;
  }
}
