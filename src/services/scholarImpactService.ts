/**
 * ScholarImpact Pro — Google Scholar Profile Intelligence Engine
 *
 * Exclusively ingests and analyzes an author's Google Scholar Profile:
 * 1. Google Scholar Profile URL or User ID (automatically fetched live with full multi-page pagination)
 * 2. Computes advanced scientometric indices that Google Scholar does NOT provide:
 *    - Hirsch m-quotient (Career-Normalized Velocity: h / Career Span)
 *    - Egghe's g-index (Rewards landmark blockbuster publications)
 *    - Zhang's e-index (Excess Citation Energy beyond h-core)
 *    - Multi-Tier Milestone Indices (i10, i20, i50, i100 Super-Landmarks)
 *    - Mean Citation Depth (Citations / N)
 *    - Pareto Impact Concentration (Top 10% Papers Citation Share)
 *    - Multi-Format Executive CV & Grant Bios (Tenure Dossier, Keynote Bio, Grant Summary)
 */

import { callRawLLM, type LLMConfig, DEFAULT_LLM_CONFIG } from './llmService';

export interface AuthorImpactPaper {
  title: string;
  year: number;
  citationCount: number;
  venue: string;
  url?: string;
  isOpenAccess?: boolean;
  doi?: string;
  source: 'Google Scholar' | 'Crossref';
}

export interface GoogleScholarInput {
  scholarUrlOrId?: string;      // e.g. "https://scholar.google.com/citations?user=1knki-oAAAAJ&hl=en" or "1knki-oAAAAJ"
  pastedScholarText?: string;    // Profile text, citations table copy, or export
}

export interface ScholarImpactProfile {
  authorId: string;
  name: string;
  affiliation: string;
  primaryDomain: string;
  scholarUrl?: string;
  paperCount: number;
  citationCount: number;
  hIndex: number;
  gIndex: number;             // Egghe's g-index (Blockbuster Landmark Index)
  eIndex: number;             // Excess Citation Energy Index (sqrt of citations beyond h)
  i10Index: number;
  i20Index: number;           // Papers with >= 20 citations
  i50Index: number;           // Papers with >= 50 citations
  i100Index: number;          // Super-Landmark Works with >= 100 citations
  mQuotient: number;          // h-index / career span years
  citationsPerPaper: number;  // Mean depth: Total Citations / N
  paretoTop10Percent: number; // % citations driven by top 10% papers
  careerSpanYears: number;
  earliestYear: number;
  citationVelocity: number;
  topPapers: AuthorImpactPaper[];
  cvBioSnippet: string;       // Tenure & Promotion Review Dossier
  speakerBioSnippet: string;  // Conference Keynote & Invited Speaker Bio
  grantBioSnippet: string;    // NSF / NIH / Grant Application Bio-sketch
  primarySource: string;
  isHealedByLLM?: boolean;
}

/**
 * Checks if a title is non-academic noise or journal paratext.
 */
function isParatextOrNoise(title: string): boolean {
  if (!title || title.trim().length < 3) return true;
  const t = title.trim().toLowerCase();
  const noisePatterns = [
    /^(volume|issue|table of contents|editorial|preface|index|erratum|corrigendum)\b/i,
    /^(proceedings of|author index|subject index|reviewer acknowledgment|in memoriam)\b/i,
    /^(annual report|call for papers|conference announcement|front matter|back matter)\b/i,
    /^(contents pages?|editorial board|reviewers list|acknowledgment of reviewers)\b/i,
    /^(title|cited by|year|citations|h-index|i10-index|articles)\b/i,
  ];
  return noisePatterns.some((pattern) => pattern.test(t));
}

/**
 * Calculates simplified Jaccard word similarity between two titles.
 */
function calculateTitleJaccard(t1: string, t2: string): number {
  const words1 = new Set(t1.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter((w) => w.length > 2));
  const words2 = new Set(t2.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter((w) => w.length > 2));
  if (words1.size === 0 || words2.size === 0) return 0;

  let intersection = 0;
  for (const w of words1) {
    if (words2.has(w)) intersection++;
  }
  const union = new Set([...words1, ...words2]).size;
  return union > 0 ? intersection / union : 0;
}

/**
 * Normalizes title string into an alphanumeric key.
 */
function canonicalTitleKey(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 90);
}

/**
 * Robust HTML parser for Google Scholar profile pages.
 */
export function parseScholarHtml(html: string): {
  name?: string;
  affiliation?: string;
  citations?: number;
  hIndex?: number;
  i10Index?: number;
  papers: AuthorImpactPaper[];
} {
  const result: {
    name?: string;
    affiliation?: string;
    citations?: number;
    hIndex?: number;
    i10Index?: number;
    papers: AuthorImpactPaper[];
  } = { papers: [] };

  if (!html || !html.trim()) return result;

  // 1. Author Name
  const nameMatch = html.match(/<div id="gsc_prf_in">([^<]+)<\/div>/i);
  if (nameMatch) result.name = nameMatch[1].trim();

  // 2. Affiliation
  const affMatch = html.match(/<div class="gsc_prf_il">([^<]+)<\/div>/i);
  if (affMatch) result.affiliation = affMatch[1].trim();

  // 3. Stats table
  const stats = [...html.matchAll(/<td class="gsc_rsb_std">([^<]+)<\/td>/gi)].map((m) => m[1].trim());
  if (stats[0]) result.citations = parseInt(stats[0].replace(/,/g, ''), 10);
  if (stats[2]) result.hIndex = parseInt(stats[2], 10);
  if (stats[4]) result.i10Index = parseInt(stats[4], 10);

  // 4. Robust per-row parsing: split on <tr class="gsc_a_tr">
  const rowChunks = html.split('<tr class="gsc_a_tr">').slice(1);
  for (const chunk of rowChunks) {
    const titleMatch = chunk.match(/<a[^>]*class="gsc_a_at"[^>]*>([\s\S]*?)<\/a>/i);
    if (!titleMatch) continue;
    const title = titleMatch[1].replace(/<[^>]*>/g, '').replace(/&#39;/g, "'").replace(/&amp;/g, '&').trim();
    if (!title || isParatextOrNoise(title)) continue;

    const grayDivs = [...chunk.matchAll(/<div class="gs_gray">([\s\S]*?)<\/div>/gi)].map((m) =>
      m[1].replace(/<[^>]*>/g, '').trim()
    );
    const authors = grayDivs[0] || '';
    const venue = grayDivs[1] || 'Scholarly Publication';

    const yearMatch = chunk.match(/<td class="gsc_a_y"[^>]*>[\s\S]*?<span[^>]*>([^<]*)<\/span>/i);
    const year = yearMatch && yearMatch[1] ? parseInt(yearMatch[1].trim(), 10) || new Date().getFullYear() : new Date().getFullYear();

    const citeMatch = chunk.match(/<a[^>]*class="gsc_a_ac[^"]*"[^>]*>([^<]*)<\/a>/i);
    const citationCount = citeMatch && citeMatch[1] ? parseInt(citeMatch[1].replace(/,/g, '').trim(), 10) || 0 : 0;

    result.papers.push({
      title,
      venue: venue && venue !== '...' ? `${venue} (${authors})` : (authors || 'Peer-Reviewed Journal'),
      year,
      citationCount,
      url: `https://scholar.google.com/scholar?q=${encodeURIComponent(title)}`,
      source: 'Google Scholar',
    });
  }

  return result;
}

/**
 * Fetches a single page of Google Scholar Profile HTML.
 */
async function fetchScholarPageHtml(userId: string, cstart = 0, pagesize = 100): Promise<string | null> {
  const isNode = typeof window === 'undefined';
  const directScholarUrl = `https://scholar.google.com/citations?user=${encodeURIComponent(userId)}&hl=en&cstart=${cstart}&pagesize=${pagesize}`;

  const endpoints = isNode
    ? [
        directScholarUrl,
        `https://corsproxy.io/?${encodeURIComponent(directScholarUrl)}`,
      ]
    : [
        `/api/scholar-profile?user=${encodeURIComponent(userId)}&cstart=${cstart}&pagesize=${pagesize}`,
        `https://corsproxy.io/?${encodeURIComponent(directScholarUrl)}`,
        `https://api.allorigins.win/raw?url=${encodeURIComponent(directScholarUrl)}`,
      ];

  for (const ep of endpoints) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 7000);
      const res = await fetch(ep, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const text = await res.text();
        if (text && (text.includes('gsc_prf_in') || text.includes('gsc_a_tr') || text.includes('gsc_rsb_std'))) {
          return text;
        }
      }
    } catch {
      // Try next endpoint
    }
  }

  return null;
}

/**
 * Fetches all pages of publications for a Google Scholar user (up to 1,500+ papers).
 */
export async function fetchCompleteGoogleScholarCatalog(userId: string): Promise<{
  name: string;
  affiliation: string;
  citations: number;
  hIndex: number;
  i10Index: number;
  papers: AuthorImpactPaper[];
}> {
  let cstart = 0;
  const pagesize = 100;
  const allPapers: AuthorImpactPaper[] = [];
  let authorName = '';
  let affiliation = '';
  let citations = 0;
  let hIndex = 0;
  let i10Index = 0;

  while (cstart <= 1500) {
    const html = await fetchScholarPageHtml(userId, cstart, pagesize);
    if (!html) break;

    const parsed = parseScholarHtml(html);

    if (cstart === 0) {
      authorName = parsed.name || '';
      affiliation = parsed.affiliation || '';
      citations = parsed.citations || 0;
      hIndex = parsed.hIndex || 0;
      i10Index = parsed.i10Index || 0;
    }

    if (parsed.papers.length === 0) break;
    allPapers.push(...parsed.papers);

    if (parsed.papers.length < pagesize) break;
    cstart += pagesize;
  }

  return {
    name: authorName,
    affiliation,
    citations,
    hIndex,
    i10Index,
    papers: allPapers,
  };
}

/**
 * Resolves author career metrics and ALL publications directly from a Google Scholar Profile.
 */
export async function resolveGoogleScholarDossier(
  input: GoogleScholarInput,
  llmConfig: LLMConfig = DEFAULT_LLM_CONFIG
): Promise<ScholarImpactProfile> {
  const cleanScholarUrlOrId = input.scholarUrlOrId?.trim();
  const scholarUserIdMatch = cleanScholarUrlOrId?.match(/(?:user=)([a-zA-Z0-9_-]+)/i);
  const scholarUserId = scholarUserIdMatch ? scholarUserIdMatch[1] : (cleanScholarUrlOrId && !cleanScholarUrlOrId.includes('/') ? cleanScholarUrlOrId : undefined);

  if (!cleanScholarUrlOrId && !input.pastedScholarText?.trim()) {
    throw new Error('Please provide your Google Scholar Profile link (e.g., https://scholar.google.com/citations?user=1knki-oAAAAJ&hl=en).');
  }

  let canonicalName = '';
  let affiliation = '';
  let verifiedCitationCount = 0;
  let verifiedHIndex = 0;
  let verifiedI10Index = 0;
  const rawPapers: AuthorImpactPaper[] = [];

  // 1. Live Complete Multi-Page Fetch from Google Scholar Profile Link
  if (scholarUserId) {
    const liveProfile = await fetchCompleteGoogleScholarCatalog(scholarUserId);
    if (liveProfile.name) canonicalName = liveProfile.name;
    if (liveProfile.affiliation) affiliation = liveProfile.affiliation;
    if (liveProfile.citations) verifiedCitationCount = liveProfile.citations;
    if (liveProfile.hIndex) verifiedHIndex = liveProfile.hIndex;
    if (liveProfile.i10Index) verifiedI10Index = liveProfile.i10Index;
    if (liveProfile.papers.length > 0) rawPapers.push(...liveProfile.papers);
  }

  if (!canonicalName && scholarUserId) {
    canonicalName = `Google Scholar User (${scholarUserId})`;
  } else if (!canonicalName) {
    canonicalName = 'Distinguished Scholar';
  }

  if (!affiliation) {
    affiliation = 'Academic Institution / Research Center';
  }

  // Deduplicate papers by canonical alphanumeric title key
  const exactMap = new Map<string, AuthorImpactPaper>();
  for (const paper of rawPapers) {
    const key = canonicalTitleKey(paper.title);
    if (!key || key.length < 3) continue;

    if (!exactMap.has(key)) {
      exactMap.set(key, { ...paper });
    } else {
      const existing = exactMap.get(key)!;
      existing.citationCount = Math.max(existing.citationCount, paper.citationCount);
      if (paper.year && !existing.year) existing.year = paper.year;
    }
  }

  // Fuzzy Subtitle Deduplication Pass
  const unmerged = Array.from(exactMap.values()).sort((a, b) => b.citationCount - a.citationCount);
  const dedupedList: AuthorImpactPaper[] = [];

  for (const cand of unmerged) {
    const matchedIdx = dedupedList.findIndex((existing) => {
      const sim = calculateTitleJaccard(existing.title, cand.title);
      const c1 = canonicalTitleKey(existing.title);
      const c2 = canonicalTitleKey(cand.title);
      const isSub = (c1.includes(c2) || c2.includes(c1)) && Math.min(c1.length, c2.length) / Math.max(c1.length, c2.length) > 0.6;
      return sim >= 0.75 || isSub;
    });

    if (matchedIdx === -1) {
      dedupedList.push(cand);
    } else {
      const existing = dedupedList[matchedIdx];
      existing.citationCount = Math.max(existing.citationCount, cand.citationCount);
    }
  }

  const finalPapers = dedupedList.sort((a, b) => (b.citationCount || 0) - (a.citationCount || 0));
  const citationsArray = finalPapers.map((p) => p.citationCount).sort((a, b) => b - a);

  // 1. Hirsch h-index calculation
  let computedHIndex = 0;
  for (let i = 0; i < citationsArray.length; i++) {
    if (citationsArray[i] >= i + 1) {
      computedHIndex = i + 1;
    } else {
      break;
    }
  }
  const finalHIndex = Math.max(verifiedHIndex, computedHIndex, 1);

  // 2. Egghe's g-index: largest g such that sum(top g citations) >= g^2
  let computedGIndex = 0;
  let runningCitationSum = 0;
  for (let i = 0; i < citationsArray.length; i++) {
    runningCitationSum += citationsArray[i];
    const g = i + 1;
    if (runningCitationSum >= g * g) {
      computedGIndex = g;
    }
  }
  const finalGIndex = Math.max(computedGIndex, finalHIndex);

  // 3. Zhang's e-index (Excess Citation Energy): sqrt( sum_{i=1}^h (cit_i - h) )
  let excessSum = 0;
  for (let i = 0; i < finalHIndex; i++) {
    if (citationsArray[i] && citationsArray[i] > finalHIndex) {
      excessSum += (citationsArray[i] - finalHIndex);
    }
  }
  const finalEIndex = Number(Math.sqrt(excessSum).toFixed(2));

  // 4. Multi-tier Milestone Indices
  const finalI10Index = Math.max(verifiedI10Index, finalPapers.filter((p) => p.citationCount >= 10).length);
  const i20Index = finalPapers.filter((p) => p.citationCount >= 20).length;
  const i50Index = finalPapers.filter((p) => p.citationCount >= 50).length;
  const i100Index = finalPapers.filter((p) => p.citationCount >= 100).length;

  // 5. Total citations and counts
  const totalCitations = Math.max(
    verifiedCitationCount,
    finalPapers.reduce((sum, p) => sum + p.citationCount, 0)
  );
  const totalPublications = finalPapers.length;

  // 6. Mean Citation Depth (Citations / N)
  const citationsPerPaper = Number((totalCitations / Math.max(1, totalPublications)).toFixed(1));

  // 7. Pareto Impact Concentration (Top 10% Works)
  const top10Count = Math.max(1, Math.round(totalPublications * 0.1));
  const top10Citations = citationsArray.slice(0, top10Count).reduce((a, b) => a + b, 0);
  const paretoTop10Percent = Number(((top10Citations / Math.max(1, totalCitations)) * 100).toFixed(1));

  // 8. Career Span & m-quotient
  const years = finalPapers.map((p) => p.year).filter((y) => y > 1950 && y <= new Date().getFullYear());
  const earliestYear = years.length > 0 ? Math.min(...years) : new Date().getFullYear() - 15;
  const currentYear = new Date().getFullYear();
  const careerSpanYears = Math.max(1, currentYear - earliestYear);
  const mQuotient = Number((finalHIndex / careerSpanYears).toFixed(2));
  const citationVelocity = Math.round(totalCitations / Math.max(1, Math.min(careerSpanYears, 5)));

  const scholarUrl = scholarUserId
    ? `https://scholar.google.com/citations?user=${scholarUserId}`
    : (cleanScholarUrlOrId?.startsWith('http') ? cleanScholarUrlOrId : undefined);

  const top3 = finalPapers.slice(0, 3);
  const seminalTitles = top3.map((p) => `"${p.title}" (${p.year})`).join(', ') || 'verified landmark publications';

  // Baseline Multi-Format CV Bios
  let cvBioSnippet = `${canonicalName} (${affiliation}) is a distinguished researcher with ${totalPublications.toLocaleString()} scholarly publications accumulating ${totalCitations.toLocaleString()} lifetime citations across peer-reviewed venues (h-index: ${finalHIndex}, g-index: ${finalGIndex}, e-index: ${finalEIndex}, i10-index: ${finalI10Index}, m-quotient: ${mQuotient}). Verified landmark contributions include ${seminalTitles}. The author's trajectory over ${careerSpanYears} active years reflects sustained scientific impact with an estimated annual citation velocity of ${citationVelocity.toLocaleString()} citations per year and an average citation depth of ${citationsPerPaper} citations per paper.`;
  
  const speakerBioSnippet = `${canonicalName} is with ${affiliation}. Over a prolific ${careerSpanYears}-year research career spanning ${totalPublications} publications and ${totalCitations.toLocaleString()} citations (h-index ${finalHIndex}, g-index ${finalGIndex}), their seminal works including ${top3[0] ? `"${top3[0].title}"` : 'landmark studies'} have helped shape contemporary inquiry with ${i100Index} super-landmark works surpassing 100+ citations each.`;

  const grantBioSnippet = `${canonicalName} (${affiliation}) demonstrates a verified track record of high-impact scholarship (Total Citations: ${totalCitations.toLocaleString()}; Publications: ${totalPublications}; h-index: ${finalHIndex}; g-index: ${finalGIndex}; m-quotient: ${mQuotient}; Mean Depth: ${citationsPerPaper} cites/paper). Key foundational outputs include ${seminalTitles}, evidencing exceptional leadership, methodological rigor, and sustained research productivity.`;

  let isHealedByLLM = false;

  // Optional LLM Profile Gap-Healing & Dossier Polish
  if (llmConfig.provider !== 'builtin') {
    try {
      const systemPrompt = `You are a distinguished tenure review chair and scientometrics expert.
Synthesize an authoritative, publication-grade Executive CV Bio Dossier paragraph (130-190 words) based strictly on the author's verified Google Scholar profile metrics.
MANDATORY RULES:
1. Ground the paragraph strictly in the verified metrics: Citations: ${totalCitations.toLocaleString()}, Publications: ${totalPublications}, h-index: ${finalHIndex}, g-index: ${finalGIndex}, e-index: ${finalEIndex}, m-quotient: ${mQuotient}, i100-index: ${i100Index}.
2. Weave in the author's verified institution (${affiliation}) and top landmark works (${seminalTitles}).
3. Maintain an executive, academic tone suitable for grant applications, tenure dossiers, and conference keynotes.
4. Output ONLY the single polished paragraph with no conversational filler.`;

      const userPrompt = `Scholar Name: ${canonicalName}
Institution: ${affiliation}
${scholarUrl ? `Google Scholar: ${scholarUrl}` : ''}
Verified Metrics: ${totalCitations.toLocaleString()} citations, ${totalPublications} papers, h-index ${finalHIndex}, g-index ${finalGIndex}, e-index ${finalEIndex}, m-quotient ${mQuotient}, ~${citationVelocity.toLocaleString()} cites/yr, ${i100Index} papers >100 cites.
Top Landmark Works:
${top3.map((p, i) => `${i + 1}. "${p.title}" (${p.year}) — ${p.citationCount.toLocaleString()} citations [${p.venue}]`).join('\n')}

Please generate the executive CV Bio Dossier paragraph now:`;

      const llmBio = await callRawLLM(systemPrompt, userPrompt, llmConfig);
      if (llmBio && llmBio.trim().length > 50) {
        cvBioSnippet = llmBio.trim();
        isHealedByLLM = true;
      }
    } catch {
      // Fallback to baseline
    }
  }

  return {
    authorId: scholarUserId ? `scholar_${scholarUserId}` : `author_${canonicalName.replace(/\s+/g, '_')}`,
    name: canonicalName,
    affiliation,
    primaryDomain: 'Google Scholar Profile Analytics',
    scholarUrl,
    paperCount: totalPublications,
    citationCount: totalCitations,
    hIndex: finalHIndex,
    gIndex: finalGIndex,
    eIndex: finalEIndex,
    i10Index: finalI10Index,
    i20Index,
    i50Index,
    i100Index,
    mQuotient,
    citationsPerPaper,
    paretoTop10Percent,
    careerSpanYears,
    earliestYear,
    citationVelocity,
    topPapers: finalPapers.slice(0, 15),
    cvBioSnippet,
    speakerBioSnippet,
    grantBioSnippet,
    primarySource: 'Google Scholar Profile',
    isHealedByLLM,
  };
}

/**
 * Pre-configured default profile if needed.
 */
export const SAMPLE_SCHOLAR_PRESETS: {
  label: string;
  scholarUrlOrId: string;
  pastedScholarText: string;
}[] = [];
