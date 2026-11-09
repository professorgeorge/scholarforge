const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
require('fake-indexeddb/auto');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText, filename);
global.localStorage = { getItem: () => null, setItem() {}, removeItem() {} };
global.window = new EventTarget();
const { searchPubmed, searchDataCite } = require('../src/services/additionalScholarlySources.ts');
const { searchSemanticScholar } = require('../src/services/semanticScholarService.ts');
const { executeFederatedSearch } = require('../src/services/federatedSearchEngine.ts');
const { mergeDiscoveryPapers } = require('../src/services/discoveryMergeService.ts');
const { importReferences, exportCslJson, fetchZoteroLibrary } = require('../src/services/libraryInteropService.ts');
const { generateRIS } = require('../src/services/risExporter.ts');
const { generateBibtexEntry } = require('../src/services/citationFormatter.ts');
const { exportLiteratureToJson } = require('../src/services/literatureExportService.ts');
const json = body => new Response(JSON.stringify(body), { headers: { 'Content-Type': 'application/json' } });
const sourceSelection = { openalex: false, europepmc: false, crossref: false, pubmed: false, datacite: false, semanticscholar: false, arxiv: false };
const record = overrides => ({ id: 'one', title: 'Remote work and employee wellbeing', authors: [{ name: 'Jane Smith', familyName: 'Smith' }], year: 2024, venue: '', doi: '10.1234/shared', url: '', citationCount: 8, abstract: '', openAccess: false, source: 'crossref', ...overrides });

test('PubMed batches metadata, preserves unknown fields, and caches repeated requests', async t => {
  const requests = [];
  t.mock.method(global, 'fetch', async input => {
    const url = new URL(input); requests.push(url);
    if (url.pathname.endsWith('esearch.fcgi')) return json({ esearchresult: { idlist: ['123'] } });
    return json({ result: { uids: ['123'], 123: { title: 'Remote <i>work</i>', authors: [{ name: 'Smith J' }], pubdate: '2023 Jan', fulljournalname: 'Example Journal', articleids: [{ idtype: 'doi', value: '10.1234/pubmed' }], pubtype: ['Journal Article'] } } });
  });
  const papers = await searchPubmed('pubmed fixture topic', { fromYear: 2020, toYear: 2025, searchScope: 'title_only' });
  assert.equal(requests.length, 2);
  assert.match(requests[0].searchParams.get('term'), /\[Title\]/);
  assert.equal(requests[0].searchParams.get('mindate'), '2020');
  assert.equal(papers[0].title, 'Remote work');
  assert.equal(papers[0].pmid, '123');
  assert.equal(papers[0].abstract, '');
  assert.equal(papers[0].openAccess, false);
  assert.equal(papers[0].source, 'pubmed');
  papers[0].title = 'caller mutation';
  assert.equal((await searchPubmed('pubmed fixture topic', { fromYear: 2020, toYear: 2025, searchScope: 'title_only' }))[0].title, 'Remote work');
  assert.equal(requests.length, 2);
});

test('DataCite retains thesis metadata and excludes identified preprints and out-of-range records', async t => {
  t.mock.method(global, 'fetch', async () => json({ data: [
    { attributes: { doi: '10.1234/thesis', titles: [{ title: 'A repository thesis' }], creators: [{ name: 'Smith, Jane' }], publicationYear: 2024, publisher: 'Example University', types: { resourceTypeGeneral: 'Dissertation' }, descriptions: [{ descriptionType: 'Abstract', description: 'Repository abstract.' }], rightsList: [{ rightsUri: 'https://creativecommons.org/licenses/by/4.0/' }] } },
    { attributes: { doi: '10.1234/preprint', titles: [{ title: 'A preprint' }], publicationYear: 2024, types: { resourceTypeGeneral: 'Preprint' } } },
    { attributes: { doi: '10.1234/old', titles: [{ title: 'An older report' }], publicationYear: 1990, types: { resourceTypeGeneral: 'Report' } } }
  ] }));
  const papers = await searchDataCite('datacite fixture', { fromYear: 2020, excludePreprints: true });
  assert.equal(papers.length, 1);
  assert.equal(papers[0].type, 'thesis');
  assert.equal(papers[0].year, 2024);
  assert.equal(papers[0].openAccess, true);
  assert.equal(papers[0].source, 'datacite');
});

test('cross-provider duplicates retain provenance without adding citation totals or merging different DOIs', () => {
  const first = record({ registryProvenance: [{ registry: 'crossref', recordId: 'a', retrievedAt: '2026-01-01' }] });
  const second = record({ id: 'two', source: 'pubmed', doi: 'https://doi.org/10.1234/SHARED', abstract: 'An abstract supplied by another provider.', citationCount: 100, registryProvenance: [{ registry: 'pubmed', recordId: 'b', retrievedAt: '2026-01-01' }] });
  const third = record({ id: 'three', doi: '10.1234/different' });
  const merged = mergeDiscoveryPapers([first, second, third]);
  assert.equal(merged.papers.length, 2);
  assert.equal(merged.duplicatesRemoved, 1);
  assert.equal(merged.papers[0].citationCount, 8);
  assert.equal(merged.papers[0].registryProvenance.length, 2);
  assert.match(merged.papers[0].abstract, /another provider/);
  assert.equal(first.abstract, '');
  assert.equal(mergeDiscoveryPapers([record({ title: '研究甲的长期观察与评估结果', doi: '' }), record({ id: 'other', title: '研究乙的长期观察与评估结果', doi: '' })]).papers.length, 2);
});

test('federated search retains successful sources when Semantic Scholar is rate limited', async t => {
  let semanticCalls = 0;
  t.mock.method(global, 'fetch', async input => {
    const url = new URL(input);
    if (url.hostname === 'api.semanticscholar.org') { semanticCalls++; return new Response('', { status: 429, headers: { 'Retry-After': '120' } }); }
    if (url.hostname === 'api.datacite.org') return json({ data: [{ attributes: { doi: '10.1234/source', titles: [{ title: 'Source resilience research report' }], publicationYear: 2024, types: { resourceTypeGeneral: 'Report' } } }] });
    if (url.pathname.endsWith('esearch.fcgi')) return json({ esearchresult: { idlist: ['987'] } });
    return json({ result: { 987: { title: 'Independent PubMed result about resilience', pubdate: '2024', authors: [], articleids: [] } } });
  });
  const result = await executeFederatedSearch('resilience', { enabledSources: { ...sourceSelection, pubmed: true, datacite: true, semanticscholar: true } });
  assert.equal(result.papers.length, 2);
  assert.equal(result.sourceStatuses.find(source => source.name === 'semanticscholar').status, 'rate limited');
  assert.equal(result.prismaStats.identification.databaseCounts.datacite, 1);
  assert.equal(result.prismaStats.identification.databaseCounts.pubmed, 1);
  await assert.rejects(searchSemanticScholar('a different request during cooldown'), /paused/);
  assert.equal(semanticCalls, 1);
});

test('a source failure is distinct from a valid zero-result query', async t => {
  t.mock.method(global, 'fetch', async input => new URL(input).hostname === 'api.datacite.org' ? new Response('', { status: 503 }) : json({ esearchresult: { idlist: [] } }));
  const result = await executeFederatedSearch('empty failure fixture', { enabledSources: { ...sourceSelection, pubmed: true, datacite: true } });
  assert.equal(result.sourceStatuses.find(source => source.name === 'datacite').status, 'failed');
  assert.equal(result.sourceStatuses.find(source => source.name === 'pubmed').status, 'no records returned');
  await assert.rejects(executeFederatedSearch('anything', { enabledSources: sourceSelection }), /Select at least one/);
});

test('reference-manager exchange retains report and thesis types and Publish or Perish citation counts', () => {
  const papers = importReferences('TY  - THES\nTI  - A doctoral repository record\nAU  - Smith, Jane\nPY  - 2024\nM1  - 42\nER  -\n\nTY  - RPRT\nTI  - A report record\nN1  - Times Cited: 7\nER  -', 'ris');
  assert.equal(papers[0].type, 'thesis');
  assert.equal(papers[0].citationCount, 42);
  assert.equal(papers[1].type, 'report');
  assert.equal(papers[1].citationCount, 7);
  const returned = importReferences(generateRIS(papers), 'ris');
  assert.equal(returned[0].type, 'thesis');
  assert.equal(returned[0].citationCount, 42);
  assert.equal(returned[1].type, 'report');
  assert.equal(JSON.parse(exportCslJson(papers))[0].type, 'thesis');
  assert.match(generateBibtexEntry(papers[1]), /@techreport/);
  assert.equal(importReferences(exportLiteratureToJson(papers), 'json')[0].citationCount, 42);
});


test('Zotero uses the key only in headers and never returns a partial import after a page failure', async t => {
  const calls = [];
  t.mock.method(global, 'fetch', async (url, options) => {
    calls.push({ url, headers: options.headers });
    if (calls.length === 2) return new Response('', { status: 503 });
    return json(Array.from({ length: 100 }, (_, index) => ({ id: `test-${index}`, title: `Zotero fixture ${index}`, type: 'article-journal', author: [{ family: 'Researcher' }] })));
  });
  await assert.rejects(fetchZoteroLibrary('123456', 'users', 'test-read-key'), /No partial import/);
  assert.equal(calls.length, 2);
  assert.equal(calls[0].headers['Zotero-API-Key'], 'test-read-key');
  assert.ok(calls.every(call => !call.url.includes('test-read-key')));
});
