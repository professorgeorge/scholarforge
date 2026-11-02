const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const { Readable } = require('node:stream');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText, filename);
const funding = require('../src/services/fundingService.ts');
const { fundingMiddleware } = require('../server/fundingProxy.ts');
const { buildToolReviewContext, MAX_REVIEW_MATERIAL, reviewWithToolAI } = require('../src/services/toolAiService.ts');
const { conceptHandoffFields, emptyConceptStudy } = require('../src/services/conceptStudioService.ts');
const at = '2026-11-02T12:00:00Z';
const searchResponse = { errorcode: 0, token: 'PUBLIC_RESPONSE_TOKEN_NOT_TO_RETAIN', data: { hitCount: 25, oppHits: [{ id: '123456', title: 'Community climate research', number: 'TEST-26', agency: 'A federal agency', oppStatus: 'posted', closeDate: '01/11/2027' }] } };
const detailResponse = { errorcode: 0, data: { id: 123456, opportunityTitle: 'Community climate research', opportunityNumber: 'TEST-26', synopsis: { agencyName: 'A federal agency', synopsisDesc: '<p>Research &amp; community partnerships.</p>', responseDateStr: '2027-01-11-00-00-00', responseDate: 'Jan 11, 2027 12:00:00 AM EST', awardFloor: '10000', awardCeiling: '100000', costSharing: false, applicantTypes: [{ id: '06', description: 'Public institutions of higher education' }], applicantEligibilityDesc: 'Applicants must meet the detailed institutional and investigator requirements.' } } };
const item = () => funding.normalizeGrantsSearch(searchResponse, 0, at).records[0];
const profile = () => ({ ...funding.emptyFundingProfile(), idea: 'Community climate research', applicant: 'public_university', country: 'United States' });

test('Grants.gov search preserves source identifiers, reported status, unknown awards, and pagination without response tokens', () => {
  const result = funding.normalizeGrantsSearch(searchResponse, 0, at);
  assert.equal(result.hasMore, true); assert.equal(result.total, 25);
  assert.equal(result.records[0].funder, 'A federal agency');
  assert.equal(result.records[0].ceiling, null);
  assert.equal(funding.nextFundingDeadline(result.records[0], '2026-11-02'), '2027-01-11');
  assert.ok(!JSON.stringify(result).includes('PUBLIC_RESPONSE_TOKEN'));
  assert.throws(() => funding.normalizeGrantsSearch({ errorcode: 1, data: {} }, 0, at), /unexpected/);
});
test('official detail parsing retains supplied conditions and distinguishes zero, missing, and false values', () => {
  const detail = funding.normalizeGrantsDetail(detailResponse, at);
  assert.equal(detail.floor, 10000); assert.equal(detail.ceiling, 100000);
  assert.equal(detail.costSharing, false); assert.deepEqual(detail.applicantCodes, ['06']);
  assert.equal(detail.description, 'Research & community partnerships.');
  assert.equal(detail.detailState, 'retrieved');
  const changed = structuredClone(detailResponse); changed.data.synopsis.awardFloor = '0'; delete changed.data.synopsis.awardCeiling; delete changed.data.synopsis.costSharing;
  const unknown = funding.normalizeGrantsDetail(changed, at);
  assert.equal(unknown.floor, 0); assert.equal(unknown.ceiling, null); assert.equal(unknown.costSharing, null);
});
test('EU normalization excludes tenders and does not interpret a programme budget as an individual award', () => {
  const result = funding.normalizeEuSearch({ totalResults: 40, results: [{ metadata: { type: ['1'], identifier: ['HORIZON-2027-EXAMPLE'], title: ['A research topic'], status: ['31094502'], deadlineDate: ['2027-03-01T17:00:00.000+0000'], budget: ['100000000'] } }, { metadata: { type: ['2'], identifier: ['TENDER-EXAMPLE'] } }] }, 0, at);
  assert.equal(result.records.length, 1); assert.equal(result.records[0].ceiling, null);
  assert.equal(result.records[0].reportedStatus, 'open'); assert.equal(result.records[0].eligibility, '');
  assert.match(result.records[0].url, /topic-details\/HORIZON-2027-EXAMPLE/);
});
test('past dates override current-result display without overwriting the source-reported status', () => {
  const expired = { ...item(), deadlines: ['2023-09-21T17:00:00.000+0000'], reportedStatus: 'open' };
  assert.equal(funding.fundingDeadlinePassed(expired, '2026-11-02'), true);
  assert.equal(funding.fundingMatches(expired, funding.defaultFundingFilters(), profile(), '2026-11-02'), false);
  assert.equal(funding.fundingMatches(expired, { ...funding.defaultFundingFilters(), status: 'all' }, profile(), '2026-11-02'), true);
  assert.equal(expired.reportedStatus, 'open');
  assert.equal(funding.nextFundingDeadline({ ...item(), deadlines: ['2025-01-01', '2027-01-01', '2028-01-01'] }, '2026-11-02'), '2027-01-01');
  assert.equal(funding.fundingDate('2026-02-30'), '');
  assert.match(funding.fundingDateWarning({ ...item(), deadlines: ['2076-10-05'] }, '2026-11-02'), /placeholder/);
});
test('applicant category matching never certifies eligibility or infers international access', () => {
  const detail = funding.normalizeGrantsDetail(detailResponse, at);
  const fit = funding.fundingFit(detail, profile());
  assert.equal(fit.conflict, false); assert.match(fit.label, /conditions need checking/);
  assert.ok(fit.reasons.some(reason => reason.includes('United States')));
  assert.equal(funding.fundingFit({ ...detail, applicantCodes: ['21'] }, profile()).conflict, true);
  for (const code of ['99', '25']) assert.equal(funding.fundingFit({ ...detail, applicantCodes: [code] }, profile()).conflict, false);
  assert.match(funding.fundingFit(item(), profile()).label, /needs checking/);
});
test('local filters validate ranges, keep unknowns explicitly, and never convert currencies', () => {
  const detail = { ...funding.normalizeGrantsDetail(detailResponse, at), reportedStatus: 'open' };
  assert.equal(funding.fundingMatches(detail, { ...funding.defaultFundingFilters(), minimum: '200000' }, profile(), '2026-11-02'), false);
  assert.equal(funding.fundingMatches(detail, { ...funding.defaultFundingFilters(), minimum: '5000', currency: 'EUR' }, profile(), '2026-11-02'), false);
  assert.equal(funding.fundingMatches(item(), { ...funding.defaultFundingFilters(), minimum: '5000' }, profile(), '2026-11-02'), true);
  assert.equal(funding.fundingMatches(item(), { ...funding.defaultFundingFilters(), minimum: '5000', includeUnknown: false }, profile(), '2026-11-02'), false);
  assert.ok(funding.fundingFilterErrors({ ...funding.defaultFundingFilters(), minimum: '100', maximum: '10' }).length);
  assert.ok(funding.fundingFilterErrors({ ...funding.defaultFundingFilters(), minimum: '-1' }).length);
});
test('UKRI RSS produces recent leads with unknown dates and applicant eligibility', () => {
  const xml = '<rss><channel><item><title><![CDATA[Climate partnerships]]></title><link>https://www.ukri.org/opportunity/climate/</link><description><![CDATA[<p>Support for climate research.</p>]]></description></item><item><title>Other research</title><link>https://evil.example/fake</link></item></channel></rss>';
  const result = funding.normalizeUkriFeed(xml, 'climate', at);
  assert.equal(result.records.length, 1); assert.equal(result.total, null); assert.equal(result.hasMore, false);
  assert.equal(result.records[0].reportedStatus, 'unknown'); assert.deepEqual(result.records[0].deadlines, []);
  assert.match(result.coverage, /not a complete|No complete/);
});
test('partial source failure preserves successful funding results and records the failure', async t => {
  t.mock.method(global, 'fetch', async (url, options) => {
    const body = JSON.parse(options.body);
    assert.equal(url, '/api/funding/search'); assert.ok(!options.body.includes('United States'));
    if (body.source === 'eu') return new Response(JSON.stringify({ error: 'Provider unavailable' }), { status: 502, headers: { 'Content-Type': 'application/json' } });
    return new Response(JSON.stringify(funding.normalizeGrantsSearch(searchResponse, 0, at)), { headers: { 'Content-Type': 'application/json' } });
  });
  const result = await funding.searchFunding('climate', profile(), funding.defaultFundingFilters(), ['grants', 'eu']);
  assert.equal(result.records.length, 1); assert.equal(result.coverage[1].state, 'failed');
  assert.match(result.coverage[1].detail, /unavailable/);
});
test('a static host without a funding backend reports a connector failure rather than an empty catalog', async t => {
  t.mock.method(global, 'fetch', async () => new Response('<html>SPA fallback</html>', { headers: { 'Content-Type': 'text/html' } }));
  await assert.rejects(funding.fundingRequest('search', {}), /connector is unavailable/);
});
test('refreshing search summaries preserves previously fetched conditions with a separate detail timestamp', () => {
  const detail = { ...funding.normalizeGrantsDetail(detailResponse, at), conditions: 'Partner institution must supply matching funds.' };
  const result = funding.mergeFunding([detail], [{ ...item(), retrievedAt: '2026-11-03T12:00:00Z' }]);
  assert.equal(result.length, 1); assert.equal(result[0].ceiling, 100000);
  assert.equal(result[0].detailsAt, at); assert.equal(result[0].retrievedAt, '2026-11-03T12:00:00Z');
  assert.equal(result[0].conditions, detail.conditions);
  assert.equal(result[0].eligibility, detail.eligibility);
  assert.equal(result[0].costSharing, detail.costSharing);
});

test('fit notes become stale when supplied conditions or award currency changes', () => {
  const record = item();
  const basis = funding.fundingBasis(record, profile());
  assert.notEqual(funding.fundingBasis({ ...record, conditions: 'A new partner requirement.' }, profile()), basis);
  assert.notEqual(funding.fundingBasis({ ...record, currency: 'EUR' }, profile()), basis);
});
test('funding exports retain unknowns, source coverage, dates, and stale-note flags', () => {
  const note = { text: 'Check partnership requirements.', basis: funding.fundingBasis(item(), profile()), at };
  const text = funding.fundingBrief({ ...profile(), country: 'Kenya' }, null, [item()], [item().id], { [item().id]: note });
  for (const part of ['Unknown', 'No search recorded', 'Check partnership', 'Notes need rechecking: Yes', 'Category matches are not eligibility determinations']) assert.ok(text.includes(part));
});
test('concept handoff preserves the existing applicant profile and appends the new idea without searching', () => {
  const result = conceptHandoffFields('funding', { ...emptyConceptStudy(), question: 'A new concept question' }, { 'FundingFinder.profile': { ...profile(), country: 'Kenya' } });
  assert.equal(result['FundingFinder.profile'].country, 'Kenya');
  assert.ok(result['FundingFinder.profile'].idea.includes('A new concept question'));
  assert.ok(result['FundingFinder.profile'].idea.includes('Community climate research'));
});
test('funding AI context is bounded, uses funding IDs, and excludes unrelated project documents', () => {
  const records = Array.from({ length: 10 }, (_, index) => ({ ...item(), id: `grants:${index}`, sourceId: String(index), eligibility: 'x'.repeat(50000), description: 'a'.repeat(5000) }));
  const snapshot = buildToolReviewContext('funding', { tools: { 'FundingFinder.profile': profile(), 'FundingFinder.opportunities': records, 'FundingFinder.runs': [{ recordIds: records.map(item => item.id), coverage: [] }], 'Unrelated.notes': 'PRIVATE_TEXT' } });
  assert.ok(snapshot.text.length <= MAX_REVIEW_MATERIAL); assert.equal(snapshot.truncated, true);
  assert.ok(snapshot.sourceIds.every(id => /^F\d$/.test(id))); assert.ok(!snapshot.text.includes('PRIVATE_TEXT'));
  JSON.parse(snapshot.text);
});
test('funding AI reviews use supplied records and task-specific constraints without inventing opportunities', async t => {
  let sent;
  t.mock.method(global, 'fetch', async (url, options) => { sent = JSON.parse(options.body); return new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify({ summary: 'Requirements need checking.', suggestions: [], questions: ['Where is the lead applicant based?'], limitations: ['No complete call document supplied.'], proposedText: '' }) } }] }), { headers: { 'Content-Type': 'application/json' } }); });
  await reviewWithToolAI('funding', 'eligibility', 'Supplied funding call only', '', [], { provider: 'custom', baseUrl: 'http://localhost/mock' });
  assert.match(sent.messages[0].content, /not eligibility determinations/);
  assert.match(sent.messages[0].content, /Do not infer international eligibility/);
});
async function request(body, options = {}) {
  const req = Readable.from([JSON.stringify(body)]); req.url = options.path || '/api/funding/search'; req.method = options.method || 'POST'; req.headers = { 'content-type': 'application/json', host: 'localhost:5173', ...options.headers };
  const res = { statusCode: 0, headers: {}, setHeader(key, value) { this.headers[key] = value; }, end(value) { this.body = value ? JSON.parse(value) : null; } };
  await fundingMiddleware(req, res, () => { res.next = true; }); return res;
}
test('funding proxy rejects arbitrary destinations, invalid pagination, and cross-origin requests before network access', async t => {
  let calls = 0; t.mock.method(global, 'fetch', async () => { calls++; throw new Error('Unexpected request'); });
  const body = { source: 'grants', query: 'test', applicant: 'any', status: 'current', offset: 0 };
  assert.equal((await request({ ...body, source: 'https://evil.example/' })).statusCode, 400);
  assert.equal((await request({ ...body, offset: -1 })).statusCode, 400);
  assert.equal((await request(body, { headers: { origin: 'https://evil.example' } })).statusCode, 403);
  assert.equal((await request({ source: 'grants', id: '../secret' }, { path: '/api/funding/detail' })).statusCode, 400);
  assert.equal(calls, 0);
});
test('funding proxy sends applicant codes plus clarification categories and exposes no upstream token', async t => {
  let sent;
  t.mock.method(global, 'fetch', async (url, options) => { sent = { url, body: JSON.parse(options.body) }; return new Response(JSON.stringify(searchResponse), { headers: { 'Content-Type': 'application/json' } }); });
  const res = await request({ source: 'grants', query: 'proxy-test-unique', applicant: 'public_university', status: 'current', offset: 20 });
  assert.equal(res.statusCode, 200); assert.equal(sent.url, 'https://api.grants.gov/v1/api/search2');
  assert.equal(sent.body.eligibilities, '06|99|25'); assert.equal(sent.body.startRecordNum, 20);
  assert.equal(sent.body.fundingInstruments, 'G|CA');
  assert.ok(!JSON.stringify(res.body).includes('PUBLIC_RESPONSE_TOKEN'));
});
