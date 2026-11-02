export type FundingSource = 'grants' | 'eu' | 'ukri';
export const FUNDING_SOURCES: Record<FundingSource, { name: string; description: string; url: string }> = {
  grants: { name: 'Grants.gov', description: 'US federal search and detailed conditions; no API key needed.', url: 'https://www.grants.gov/search-grants' },
  eu: { name: 'EU Funding & Tenders', description: 'Public funding-topic search. Eligibility and award amounts often require the official call documents.', url: 'https://ec.europa.eu/info/funding-tenders/opportunities/portal/screen/opportunities/topic-search' },
  ukri: { name: 'UKRI recent feed', description: 'Recent feed items only, filtered locally by query terms. This is not a complete UK funding search.', url: 'https://www.ukri.org/opportunity/' },
};
export const APPLICANT_TYPES = {
  any: { label: 'Not specified / explore all', codes: [] as string[] },
  university: { label: 'University / higher education', codes: ['06', '20'] },
  public_university: { label: 'Public university', codes: ['06'] },
  private_university: { label: 'Private university', codes: ['20'] },
  nonprofit: { label: 'Nonprofit organisation', codes: ['12', '13'] },
  nonprofit_501c3: { label: 'US nonprofit with 501(c)(3) status', codes: ['12'] },
  business: { label: 'Business / company', codes: ['22', '23'] },
  small_business: { label: 'Small business', codes: ['23'] },
  government: { label: 'Government entity', codes: ['00', '01', '02', '04'] },
  tribal: { label: 'Tribal government / organisation', codes: ['07', '11'] },
  school: { label: 'Independent school district', codes: ['05'] },
  individual: { label: 'Individual researcher', codes: ['21'] },
  consortium: { label: 'Consortium / partnership', codes: [] as string[] },
} satisfies Record<string, { label: string; codes: string[] }>;
export type ApplicantType = keyof typeof APPLICANT_TYPES;
export interface FundingProfile { idea: string; applicant: ApplicantType; country: string; projectLocation: string; purpose: string; constraints: string }
export interface FundingFilters { status: 'current' | 'open' | 'forecasted' | 'all'; deadlineFrom: string; deadlineTo: string; minimum: string; maximum: string; currency: 'USD' | 'EUR' | 'GBP'; includeUnknown: boolean; hideConflicts: boolean }
export const emptyFundingProfile = (): FundingProfile => ({ idea: '', applicant: 'any', country: '', projectLocation: '', purpose: 'Research', constraints: '' });
export const defaultFundingFilters = (): FundingFilters => ({ status: 'current', deadlineFrom: '', deadlineTo: '', minimum: '', maximum: '', currency: 'USD', includeUnknown: true, hideConflicts: false });
export interface FundingOpportunity {
  id: string; source: FundingSource; sourceId: string; number: string; title: string; funder: string; url: string; description: string;
  reportedStatus: 'open' | 'forecasted' | 'closed' | 'unknown'; statusText: string; deadlines: string[]; deadlineText: string;
  floor: number | null; ceiling: number | null; currency: string; applicantCodes: string[]; applicantLabels: string[];
  eligibility: string; conditions: string; costSharing: boolean | null; retrievedAt: string; detailsAt: string; detailState: 'summary' | 'retrieved';
}
export interface FundingSourcePage { source: FundingSource; records: FundingOpportunity[]; total: number | null; hasMore: boolean; offset: number; coverage: string }
export interface FundingCoverage { source: FundingSource; state: 'success' | 'failed' | 'cancelled'; count: number; total: number | null; hasMore: boolean; offset: number; detail: string }
export interface FundingRun { id: string; at: string; query: string; profile: FundingProfile; requestedStatus: FundingFilters['status']; sources: FundingSource[]; coverage: FundingCoverage[]; recordIds: string[] }
export interface FundingNote { text: string; basis: string; at: string }

export function fundingText(value: unknown): string {
  const text = Array.isArray(value) ? value.join('\n') : typeof value === 'string' || typeof value === 'number' ? String(value) : '';
  return text.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '').replace(/<\/?(?:p|div|li|br|h[1-6])\b[^>]*>/gi, '\n').replace(/<[^>]+>/g, '').replace(/&(?:nbsp|amp|lt|gt|quot|apos);|&#(?:x[0-9a-f]+|\d+);/gi, entity => {
    const named: Record<string, string> = { '&nbsp;': ' ', '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&apos;': "'" };
    if (named[entity.toLowerCase()]) return named[entity.toLowerCase()];
    const code = entity[2]?.toLowerCase() === 'x' ? parseInt(entity.slice(3, -1), 16) : parseInt(entity.slice(2, -1), 10);
    return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : '';
  }).replace(/\n{3,}/g, '\n\n').trim().slice(0, 24000);
}
function amount(value: unknown): number | null { if (value === null || value === undefined || String(value).trim() === '') return null; const number = Number(String(value).replace(/[$,]/g, '')); return Number.isFinite(number) && number >= 0 ? number : null; }
export function fundingDate(value: string): string {
  const iso = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  const us = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  const result = iso ? `${iso[1]}-${iso[2]}-${iso[3]}` : us ? `${us[3]}-${us[1].padStart(2, '0')}-${us[2].padStart(2, '0')}` : '';
  if (result) { const parsed = new Date(`${result}T12:00:00Z`); return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === result ? result : ''; }
  return '';
}
export function localFundingDay(now = new Date()): string { return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`; }
export function nextFundingDeadline(item: FundingOpportunity, today = localFundingDay()): string {
  const dates = [...new Set(item.deadlines.map(fundingDate).filter(Boolean))].sort();
  return dates.find(date => date >= today) || dates.at(-1) || '';
}
export function fundingDeadlinePassed(item: FundingOpportunity, today = localFundingDay()): boolean { const date = nextFundingDeadline(item, today); return !!date && date < today; }
export function fundingDateWarning(item: FundingOpportunity, today = localFundingDay()): string {
  const date = nextFundingDeadline(item, today);
  return date && Number(date.slice(0, 4)) > Number(today.slice(0, 4)) + 10 ? 'The supplied deadline is unusually distant and may be a placeholder. Verify it in the official call.' : '';
}
export function safeFundingUrl(value: string): string | undefined { try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password ? url.href : undefined; } catch { return undefined; } }
function base(source: FundingSource, sourceId: string, at: string): FundingOpportunity {
  return { id: `${source}:${sourceId}`, source, sourceId, number: '', title: '', funder: '', url: '', description: '', reportedStatus: 'unknown', statusText: '', deadlines: [], deadlineText: '', floor: null, ceiling: null, currency: '', applicantCodes: [], applicantLabels: [], eligibility: '', conditions: '', costSharing: null, retrievedAt: at, detailsAt: '', detailState: 'summary' };
}
function status(value: unknown): FundingOpportunity['reportedStatus'] { return ({ posted: 'open', forecasted: 'forecasted', closed: 'closed', archived: 'closed', '31094501': 'forecasted', '31094502': 'open', '31094503': 'closed' } as const)[String(value)] || 'unknown'; }
export function normalizeGrantsSearch(raw: any, offset: number, at: string): FundingSourcePage {
  if (raw?.errorcode !== 0 || !Array.isArray(raw.data?.oppHits)) throw new Error('Grants.gov returned an unexpected search response.');
  const records = raw.data.oppHits.filter((hit: any) => /^\d+$/.test(String(hit.id)) && typeof hit.title === 'string').map((hit: any) => ({ ...base('grants', String(hit.id), at), number: fundingText(hit.number), title: fundingText(hit.title), funder: fundingText(hit.agencyName || hit.agency || hit.agencyCode), url: `https://www.grants.gov/search-results-detail/${hit.id}`, reportedStatus: status(hit.oppStatus), statusText: fundingText(hit.oppStatus), deadlines: hit.closeDate ? [String(hit.closeDate)] : [], deadlineText: fundingText(hit.closeDate), currency: 'USD' }));
  const total = amount(raw.data.hitCount);
  return { source: 'grants', records, total, hasMore: total !== null && offset + records.length < total, offset, coverage: 'Bounded US federal results. Applicant-category search includes unrestricted and “other / see conditions” records. Read full conditions before assessing eligibility.' };
}
export function normalizeGrantsDetail(raw: any, at: string): FundingOpportunity {
  const data = raw?.data, info = data?.synopsis || data?.forecast;
  if (raw?.errorcode !== 0 || !data || !info || !/^\d+$/.test(String(data.id))) throw new Error('Grants.gov did not supply usable opportunity details.');
  const item = base('grants', String(data.id), at);
  const deadline = fundingText(info.responseDateStr).slice(0, 10);
  return { ...item, title: fundingText(data.opportunityTitle), number: fundingText(data.opportunityNumber), funder: fundingText(info.agencyName || data.agencyDetails?.agencyName || data.owningAgencyCode), url: `https://www.grants.gov/search-results-detail/${data.id}`, description: fundingText(info.synopsisDesc), deadlines: fundingDate(deadline) ? [deadline] : [], deadlineText: [fundingText(info.responseDate), fundingText(info.responseDateDesc)].filter(Boolean).join('\n'), floor: amount(info.awardFloor), ceiling: amount(info.awardCeiling), currency: 'USD', applicantCodes: (info.applicantTypes || []).map((entry: any) => String(entry.id)), applicantLabels: (info.applicantTypes || []).map((entry: any) => fundingText(entry.description)), eligibility: fundingText(info.applicantEligibilityDesc), conditions: fundingText(info.fundingDescLinkDesc), costSharing: typeof info.costSharing === 'boolean' ? info.costSharing : null, detailsAt: at, detailState: 'retrieved' };
}
export function normalizeEuSearch(raw: any, offset: number, at: string): FundingSourcePage {
  if (!Array.isArray(raw?.results)) throw new Error('EU funding search returned an unexpected response.');
  const records: FundingOpportunity[] = raw.results.flatMap((entry: any) => {
    const meta = entry.metadata || {};
    if (!Array.isArray(meta.type) || !meta.type.includes('1')) return [];
    const identifier = fundingText(meta.identifier?.[0]);
    if (!/^[A-Z0-9][A-Z0-9_.-]{2,180}$/i.test(identifier)) return [];
    return [{ ...base('eu', identifier, at), number: identifier, title: fundingText(meta.title?.[0] || entry.summary), funder: 'European Commission / EU programmes', url: `https://ec.europa.eu/info/funding-tenders/opportunities/portal/screen/opportunities/topic-details/${encodeURIComponent(identifier)}`, description: fundingText(entry.content || entry.summary), reportedStatus: status(meta.status?.[0]), statusText: fundingText(meta.status), deadlines: Array.isArray(meta.deadlineDate) ? meta.deadlineDate.filter((date: unknown) => typeof date === 'string') : [], deadlineText: fundingText(meta.deadlineDate), conditions: ['Action: ' + (fundingText(meta.typesOfAction) || 'Not supplied'), 'Programme period: ' + (fundingText(meta.programmePeriod) || 'Not supplied'), 'Deadline model: ' + (fundingText(meta.deadlineModel) || 'Not supplied')].join('\n'), currency: 'EUR' }];
  });
  const total = amount(raw.totalResults);
  return { source: 'eu', records, total, hasMore: total !== null && offset + raw.results.length < total, offset, coverage: 'Funding topics only; procurement tenders are excluded. Source status can conflict with dated deadlines. Applicant geography, consortium rules, and award amounts need checking in official call documents.' };
}
export function normalizeUkriFeed(xml: string, query: string, at: string): FundingSourcePage {
  if (!/<rss\b/i.test(xml)) throw new Error('UKRI did not return a readable RSS feed.');
  const terms = query.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(term => term.length > 2);
  const tag = (body: string, name: string) => fundingText((body.match(new RegExp(`<${name}\\b[^>]*>([\\s\\S]*?)<\\/${name}>`, 'i'))?.[1] || '').replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1'));
  const records = [...xml.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)].slice(0, 100).flatMap(match => {
    const title = tag(match[1], 'title'), description = tag(match[1], 'description'), link = tag(match[1], 'link');
    if (!/^https:\/\/www\.ukri\.org\/opportunity\//i.test(link) || !title || !terms.some(term => `${title} ${description}`.toLowerCase().includes(term))) return [];
    const sourceId = new URL(link).pathname;
    return [{ ...base('ukri', sourceId, at), title, funder: 'UK Research and Innovation', url: link, description, conditions: 'Recent feed lead. Open the official call to check status, deadline, applicant and investigator eligibility, location, and funding.', currency: 'GBP' }];
  });
  return { source: 'ukri', records, total: null, hasMore: false, offset: 0, coverage: 'Recent RSS entries only; matched locally against at least one query term. No complete-catalog search or normalized eligibility, deadline, or award amounts.' };
}
export function fundingFit(item: FundingOpportunity, profile: FundingProfile): { label: string; conflict: boolean; reasons: string[] } {
  const selected = APPLICANT_TYPES[profile.applicant]?.codes || [];
  const conflict = !!selected.length && !!item.applicantCodes.length && !item.applicantCodes.some(code => selected.includes(code) || code === '99' || code === '25');
  const listed = !!selected.length && item.applicantCodes.some(code => selected.includes(code));
  return { label: conflict ? 'Potential applicant-category conflict' : listed ? 'Applicant category listed; conditions need checking' : 'Eligibility needs checking', conflict, reasons: [conflict ? `The supplied applicant categories do not list ${APPLICANT_TYPES[profile.applicant].label}. Check exceptions and partnering routes.` : listed ? 'The selected organisation category appears in the supplied source. This is not an eligibility determination.' : 'Applicant type alone does not establish eligibility.', profile.country ? `Confirm that an applicant based in ${profile.country} may apply.` : 'Applicant country has not been specified.', profile.projectLocation ? `Check permitted project locations against ${profile.projectLocation}.` : 'Check where funded work may take place.', 'Check investigator qualifications, partnerships, exclusions, registrations, and any matching-fund conditions.'] };
}
export function fundingFilterErrors(filters: FundingFilters): string[] {
  const errors: string[] = [];
  if ([filters.minimum, filters.maximum].some(value => value.trim() && (!Number.isFinite(Number(value)) || Number(value) < 0))) errors.push('Enter non-negative numeric funding amounts.');
  if (filters.minimum && filters.maximum && Number(filters.minimum) > Number(filters.maximum)) errors.push('Minimum funding cannot exceed maximum funding.');
  if (filters.deadlineFrom && filters.deadlineTo && filters.deadlineFrom > filters.deadlineTo) errors.push('The deadline window ends before it starts.');
  return errors;
}
export function fundingMatches(item: FundingOpportunity, filters: FundingFilters, profile: FundingProfile, today = localFundingDay()): boolean {
  if (fundingFilterErrors(filters).length) return false;
  const expired = fundingDeadlinePassed(item, today), deadline = nextFundingDeadline(item, today);
  if (filters.status !== 'all' && (expired || item.reportedStatus === 'closed')) return false;
  if (filters.status === 'open' && item.reportedStatus !== 'open' && !(filters.includeUnknown && item.reportedStatus === 'unknown')) return false;
  if (filters.status === 'forecasted' && item.reportedStatus !== 'forecasted' && !(filters.includeUnknown && item.reportedStatus === 'unknown')) return false;
  if (!filters.includeUnknown && item.reportedStatus === 'unknown') return false;
  if (filters.deadlineFrom || filters.deadlineTo) {
    if (!deadline && !filters.includeUnknown) return false;
    if (deadline && ((filters.deadlineFrom && deadline < filters.deadlineFrom) || (filters.deadlineTo && deadline > filters.deadlineTo))) return false;
  }
  if (filters.minimum || filters.maximum) {
    if (item.currency && item.currency !== filters.currency) return false;
    if (filters.minimum && (item.ceiling === null ? !filters.includeUnknown : item.ceiling < Number(filters.minimum))) return false;
    if (filters.maximum && (item.floor === null ? !filters.includeUnknown : item.floor > Number(filters.maximum))) return false;
  }
  return !(filters.hideConflicts && fundingFit(item, profile).conflict);
}
export function fundingBasis(item: FundingOpportunity, profile: FundingProfile): string { return JSON.stringify([profile, item.eligibility, item.conditions, item.applicantCodes, item.deadlines, item.floor, item.ceiling, item.currency, item.costSharing, item.detailsAt, item.reportedStatus]); }
export function mergeFunding(existing: FundingOpportunity[], incoming: FundingOpportunity[]): FundingOpportunity[] {
  const merged = new Map(existing.map(item => [item.id, item]));
  for (const item of incoming) { const old = merged.get(item.id); merged.set(item.id, old?.detailState === 'retrieved' && item.detailState === 'summary' ? { ...old, ...item, floor: old.floor, ceiling: old.ceiling, applicantCodes: old.applicantCodes, applicantLabels: old.applicantLabels, eligibility: old.eligibility, conditions: old.conditions, description: old.description, costSharing: old.costSharing, detailsAt: old.detailsAt, detailState: old.detailState } : item); }
  return [...merged.values()];
}
export async function fundingRequest(path: 'search' | 'detail', body: unknown, signal?: AbortSignal): Promise<any> {
  const response = await fetch(`/api/funding/${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal });
  if (!(response.headers.get('Content-Type') || '').includes('application/json')) throw new Error('The funding connector is unavailable on this host. Run ScholarForge with its funding server, or use the official source links below.');
  const result: any = await response.json();
  if (!response.ok) throw new Error(result?.error || `Funding connector returned HTTP ${response.status}.`);
  return result;
}
export async function searchFunding(query: string, profile: FundingProfile, filters: FundingFilters, sources: FundingSource[], offsets: Partial<Record<FundingSource, number>> = {}, signal?: AbortSignal): Promise<{ records: FundingOpportunity[]; coverage: FundingCoverage[] }> {
  if (query.trim().length < 2 || query.length > 300) throw new Error('Enter search terms between 2 and 300 characters.');
  if (!sources.length) throw new Error('Select at least one live source.');
  const results = await Promise.all(sources.map(async source => {
    const offset = offsets[source] || 0;
    try { const result: FundingSourcePage = await fundingRequest('search', { source, query: query.trim(), applicant: profile.applicant, status: filters.status, offset }, signal); if (result.source !== source || !Array.isArray(result.records)) throw new Error('The connector returned an unexpected response.'); return { records: result.records, coverage: { source, state: 'success', count: result.records.length, total: result.total, hasMore: result.hasMore, offset, detail: result.coverage } as FundingCoverage }; }
    catch (failure) { return { records: [], coverage: { source, state: signal?.aborted ? 'cancelled' : 'failed', count: 0, total: null, hasMore: false, offset, detail: failure instanceof Error ? failure.message : 'Source could not be reached.' } as FundingCoverage }; }
  }));
  return { records: results.flatMap(result => result.records), coverage: results.map(result => result.coverage) };
}
export function fundingBrief(profile: FundingProfile, run: FundingRun | null, records: FundingOpportunity[], shortlist: string[], notes: Record<string, FundingNote>): string {
  const v = (value: string) => value.trim() || '[Not supplied]';
  return `# Funding opportunity shortlist\n\nIdea: ${v(profile.idea)}\nApplicant: ${APPLICANT_TYPES[profile.applicant].label}\nApplicant country: ${v(profile.country)}\nProject location: ${v(profile.projectLocation)}\nPurpose: ${v(profile.purpose)}\nConstraints: ${v(profile.constraints)}\n\n## Latest search coverage\n${run ? `${run.at}: ${run.query}\n${run.coverage.map(item => `- ${FUNDING_SOURCES[item.source].name}: ${item.state}, ${item.count} returned. ${item.detail}`).join('\n')}` : 'No search recorded.'}\n\nFunding calls change. Category matches are not eligibility determinations. Confirm deadlines, award amounts, country and investigator rules at the official source. Currency amounts have not been converted.\n\n` + records.filter(item => shortlist.includes(item.id)).map(item => `## ${item.title}\nSource: ${FUNDING_SOURCES[item.source].name}\nFunder: ${item.funder}\nOfficial link: ${item.url}\nOpportunity ID: ${item.number || item.sourceId}\nSource-reported status: ${item.statusText || 'Not supplied'}\nDeadline dates as supplied: ${item.deadlineText || '[Not supplied]'}\nDeadline passed in retained record: ${fundingDeadlinePassed(item) ? 'Yes; recheck official source' : 'No past deadline detected; this does not verify availability'}\nDate warning: ${fundingDateWarning(item) || 'No unusually distant date detected; verify the official deadline'}\nAward floor/ceiling: ${item.floor ?? 'Unknown'} / ${item.ceiling ?? 'Unknown'} ${item.currency}\nApplicant categories: ${item.applicantLabels.join('; ') || 'Not supplied'}\nEligibility text: ${item.eligibility || '[Not supplied]'}\nConditions: ${item.conditions || '[Not supplied]'}\nCost sharing: ${item.costSharing === null ? 'Not supplied' : item.costSharing ? 'Required in supplied metadata; read conditions' : 'Not required in supplied metadata; read conditions'}\nRetrieved: ${item.retrievedAt}\nDetails retrieved: ${item.detailsAt || 'Not retrieved'}\nCategory assessment: ${fundingFit(item, profile).label}\nUser notes: ${notes[item.id]?.text || '[Not supplied]'}\nNotes need rechecking: ${notes[item.id] && notes[item.id].basis !== fundingBasis(item, profile) ? 'Yes; profile or opportunity conditions changed' : 'No change detected'}\n`).join('\n');
}
