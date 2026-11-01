import type { AcademicPaper } from '../types/citation';
import { executeFederatedSearch } from './federatedSearchEngine';
import { mergeDiscoveryPapers } from './discoveryMergeService';
import type { SearchRun } from './projectService';
import { DEFAULT_SCHOLARLY_SOURCES, type ScholarlySourceSelection } from './scholarlySources';

export interface ApplicationCard {
  id: string; finding: string; sourceNote: string; stakeholder: string; action: string;
  conditions: string; risks: string; pilot: string; successMeasure: string;
}
export interface ApplicationsStudy { title: string; design: string; population: string; limitations: string }
export function applicationsBrief(study: ApplicationsStudy, cards: ApplicationCard[]): string {
  const value = (text: string) => text.trim() || '[Not supplied]';
  return `# Research applications: ${value(study.title)}\n\nStudy design: ${value(study.design)}\nPopulation/context: ${value(study.population)}\nStudy limitations: ${value(study.limitations)}\n\nThese are proposed applications, not demonstrated implementation outcomes. A study design label alone does not establish causation or transferability.\n\n` + cards.map((card, index) => `## Application ${index + 1}\n\n- Finding: ${value(card.finding)}\n- Evidence/source location: ${value(card.sourceNote)}\n- Stakeholder: ${value(card.stakeholder)}\n- Proposed action: ${value(card.action)}\n- Conditions required: ${value(card.conditions)}\n- Risks and tradeoffs: ${value(card.risks)}\n- Pilot or validation step: ${value(card.pilot)}\n- Proposed success measure: ${value(card.successMeasure)}\n`).join('\n');
}

export type EvidenceDirection = 'unreviewed' | 'supports' | 'contradicts' | 'non_significant' | 'negligible_effect' | 'inconclusive' | 'not_comparable';
export const EVIDENCE_DIRECTIONS: Record<EvidenceDirection, string> = {
  unreviewed: 'Not reviewed', supports: 'Supports the proposition', contradicts: 'Contradicts the proposition',
  non_significant: 'Reports a non-significant result', negligible_effect: 'Supports a negligible effect / equivalence',
  inconclusive: 'Inconclusive', not_comparable: 'Not sufficiently comparable',
};
export interface EvidenceReview {
  proposition?: string; paperId: string; direction: EvidenceDirection; comparable: 'unclear' | 'yes' | 'no';
  population: string; outcome: string; quote: string; locator: string; sourceExcerpt: string;
  interpretation: string; equivalenceBasis: string;
}
export function evidenceLeadHints(paper: AcademicPaper): string[] {
  const text = `${paper.title} ${paper.abstract}`;
  return [
    /null (?:result|finding|effect)|not statistically significant|no significant|no association|no evidence of/i.test(text) ? 'Null/non-significance language' : '',
    /replicat|reproducib/i.test(text) ? 'Replication language' : '',
    /contradict|opposite|inconsisten|challenge|failed to/i.test(text) ? 'Challenge/disagreement language' : '',
    /equivalence|negligible|smallest effect|equivalent/i.test(text) ? 'Equivalence language' : '',
  ].filter(Boolean);
}
export function validateEvidenceReview(review: EvidenceReview, paper: AcademicPaper): string[] {
  if (review.direction === 'unreviewed') return [];
  const errors: string[] = [];
  if (!review.population.trim() || !review.outcome.trim()) errors.push('Record the study population/context and outcome being compared.');
  if (!review.interpretation.trim()) errors.push('Explain why this record has the selected classification.');
  if (['supports', 'contradicts', 'non_significant', 'negligible_effect'].includes(review.direction) && review.comparable !== 'yes') errors.push('Confirm comparability before assigning a direction or null-result classification.');
  if (!review.quote.trim() || !review.locator.trim()) errors.push('Add a source quotation and its location.');
  const normalize = (text: string) => text.replace(/\s+/g, ' ').trim();
  if (review.quote.trim() && !normalize(paper.abstract || '').includes(normalize(review.quote)) && !normalize(review.sourceExcerpt).includes(normalize(review.quote))) errors.push('The quotation must occur in the supplied abstract or the source passage you pasted.');
  if (review.direction === 'negligible_effect' && !review.equivalenceBasis.trim()) errors.push('Record the equivalence margin, interval, or other explicit basis for a negligible-effect interpretation. Non-significance alone is insufficient.');
  return errors;
}
export function counterQueries(topic: string): { id: string; label: string; query: string; enabled: boolean }[] {
  const terms = topic.trim();
  if (!terms) return [];
  return [
    { id: 'broad', label: 'Broad comparison', query: terms, enabled: true },
    { id: 'null', label: 'Null/inconclusive leads', query: `${terms} null results`, enabled: true },
    { id: 'replication', label: 'Replication/challenge leads', query: `${terms} replication`, enabled: true },
  ];
}
export interface DiscoveryBatch { papers: AcademicPaper[]; searches: { query: string; statuses: SearchRun['sources'] }[] }
export async function searchResearchQueries(queries: string[], sources: ScholarlySourceSelection = DEFAULT_SCHOLARLY_SOURCES, onProgress?: (message: string) => void): Promise<DiscoveryBatch> {
  const submitted = [...new Set(queries.map(query => query.trim()).filter(Boolean))];
  if (!submitted.length || submitted.length > 3) throw new Error('Choose one to three non-empty queries.');
  if (!Object.values(sources).some(Boolean)) throw new Error('Select at least one search source.');
  const papers: AcademicPaper[] = [];
  const searches: DiscoveryBatch['searches'] = [];
  for (let index = 0; index < submitted.length; index++) {
    const query = submitted[index];
    onProgress?.(`Query ${index + 1} of ${submitted.length}: ${query}`);
    try {
      const result = await executeFederatedSearch(query, { enabledSources: sources, excludePreprints: false, requireDoi: false, limitPerSource: 12, queryMode: 'literal' }, onProgress);
      papers.push(...result.papers);
      searches.push({ query, statuses: result.sourceStatuses });
    } catch (failure) {
      searches.push({ query, statuses: [{ name: 'search', query, status: 'failed', count: 0, detail: failure instanceof Error ? failure.message : 'Search failed.' }] });
    }
  }
  return { papers: mergeDiscoveryPapers(papers).papers, searches };
}
export function counterevidenceBrief(proposition: string, papers: AcademicPaper[], reviews: Record<string, EvidenceReview>, searches: DiscoveryBatch['searches']): string {
  return `# Counterevidence review\n\nProposition: ${proposition || '[Not supplied]'}\n\nDiscovery is bounded and may simplify provider syntax. No returned records does not establish absence of contrary evidence. Keyword hints are not outcome classifications. Classifications below are user-recorded; non-significance is distinct from evidence of negligible effect.\n\n## Queries and coverage\n${searches.map(search => `- ${search.query}: ${search.statuses.map(status => `${status.name}: ${status.status} (${status.count})`).join('; ')}`).join('\n')}\n\n## Records\n` + papers.map(paper => {
    const saved = reviews[paper.id];
    const review = saved && saved.proposition === proposition && !validateEvidenceReview(saved, paper).length ? saved : undefined;
    return `### ${paper.title}\nSource: ${paper.doi || paper.url || paper.id}\nClassification: ${EVIDENCE_DIRECTIONS[review?.direction || 'unreviewed']}${saved && !review ? ' (saved review needs rechecking against current source text)' : ''}\nPopulation/context: ${review?.population || '[Not reviewed]'}\nOutcome: ${review?.outcome || '[Not reviewed]'}\nQuotation: ${review?.quote || '[Not recorded]'}\nLocation: ${review?.locator || '[Not recorded]'}\nInterpretation: ${review?.interpretation || '[Not recorded]'}\nEquivalence basis: ${review?.equivalenceBasis || '[Not recorded]'}\n`;
  }).join('\n');
}

export interface InstrumentProfile {
  id: string; name: string; construct: string; population: string; language: string; burden: string;
  scoring: string; validationQuote: string; locator: string; sourceExcerpt: string;
  referenceRole: 'unknown' | 'original_validation' | 'later_study';
  permission: 'unknown' | 'public_domain' | 'permission_required' | 'licensed'; permissionUrl: string; permissionNotes: string;
  source: AcademicPaper;
}
export const INSTRUMENT_RESOURCES = [
  { name: 'International Personality Item Pool (IPIP)', url: 'https://ipip.ori.org/', description: 'Personality item pools and scales. Check the original scale documentation, scoring, and fit to your population.' },
  { name: 'HealthMeasures / PROMIS', url: 'https://www.healthmeasures.net/explore-measurement-systems/promis/obtain-administer-measures', description: 'Health-related measurement resources. Check the specific measure, translation, scoring, and administration permissions.' },
  { name: 'PhenX Toolkit', url: 'https://phenxtoolkit.org/protocols', description: 'Standard measurement protocols across research domains. Check each protocol’s source and conditions of use.' },
];
export function instrumentQuery(construct: string, population: string, language: string): string {
  return [construct.trim(), population.trim(), language.trim(), 'scale validation psychometric'].filter(Boolean).join(' ');
}
export function validateInstrumentProfile(profile: InstrumentProfile): string[] {
  const errors: string[] = [];
  if (!profile.name.trim() || !profile.construct.trim()) errors.push('Enter the instrument name and construct.');
  const normalize = (text: string) => text.replace(/\s+/g, ' ').trim();
  if (profile.validationQuote.trim() && (!profile.locator.trim() || (!normalize(profile.source.abstract || '').includes(normalize(profile.validationQuote)) && !normalize(profile.sourceExcerpt).includes(normalize(profile.validationQuote))))) errors.push('Validation quotations need a location and must match the abstract or supplied source passage.');
  if (profile.referenceRole === 'original_validation' && !profile.validationQuote.trim()) errors.push('Add a checked quotation before recording this as an original validation source.');
  if (profile.permission !== 'unknown' && !/^https?:\/\//i.test(profile.permissionUrl)) errors.push('Add a permissions/source URL for the stated licensing status, or leave it as not checked.');
  return errors;
}
export function instrumentComparison(profiles: InstrumentProfile[]): string {
  return '# Measurement and instrument comparison\n\nProfiles are user-recorded. Finding a paper does not establish that an instrument is validated for a new population, language, purpose, or mode of administration. Permission and scoring details must be checked at their sources.\n\n' + profiles.map(profile => `## ${profile.name}\n- Construct: ${profile.construct}\n- Population/context: ${profile.population || '[Not checked]'}\n- Language/version: ${profile.language || '[Not checked]'}\n- Administration burden: ${profile.burden || '[Not checked]'}\n- Scoring instructions: ${profile.scoring || '[Not checked]'}\n- Reference role: ${profile.referenceRole}\n- Validation quotation: ${profile.validationQuote || '[Not recorded]'}\n- Location: ${profile.locator || '[Not recorded]'}\n- Permissions status: ${profile.permission}\n- Permissions source: ${profile.permissionUrl || '[Not checked]'}\n- Permissions notes: ${profile.permissionNotes || '[Not checked]'}\n- Research source: ${profile.source.title} (${profile.source.year || 'year unknown'}) ${profile.source.doi || profile.source.url}\n`).join('\n');
}
export function safeResearchUrl(url: string): string | undefined { return /^https?:\/\//i.test(url || '') ? url : undefined; }
