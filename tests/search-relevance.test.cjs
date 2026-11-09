const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, filename);
global.localStorage = { getItem: () => null, setItem() {}, removeItem() {} };
global.window = new EventTarget();
const parser = require('../src/services/academicQueryParser.ts');
const { rankPapersByRelevance, computePaperRelevanceDetail } = require('../src/services/relevanceScoringService.ts');
const { searchOpenAlex } = require('../src/services/academicApi.ts');
const { searchEuropePmc } = require('../src/services/europePmcService.ts');
const { executeFederatedSearch } = require('../src/services/federatedSearchEngine.ts');
const paper = (id, title, extra = {}) => ({ id, title, abstract: '', authors: [], year: 2024, doi: '', venue: '', url: '', citationCount: 0, openAccess: false, source: 'crossref', ...extra });
const json = value => new Response(JSON.stringify(value), { headers: { 'Content-Type': 'application/json' } });
const sources = { openalex: false, crossref: true, europepmc: false, semanticscholar: false, pubmed: false, datacite: false, arxiv: false };

test('query planning retains late concepts, focus, phrases, and every Boolean branch', () => {
  const query = 'How does remote work affect employee wellbeing among rural nurses?';
  const strategy = parser.synthesizeBooleanSearchStrategy(query);
  assert.match(strategy.coreKeywords, /rural nurses/);
  assert.match(strategy.booleanQuery, /rural AND nurses/);
  assert.deepEqual(parser.generateAcademicSearchTiers(query, 'India'), [query + ' India']);
  const explicit = '("remote work" OR telework) AND nurses NOT students';
  assert.equal(parser.synthesizeBooleanSearchStrategy(explicit).booleanQuery, explicit);
  assert.deepEqual(parser.synthesizeBooleanSearchStrategy(explicit).searchTiers, [explicit]);
});

test('topical coverage beats citations, DOI, and native provider scores', () => {
  const results = rankPapersByRelevance([
    paper('irrelevant', 'Machine learning for remote sensing', { doi: '10.1/a', citationCount: 1000000, relevanceScore: 100 }),
    paper('partial', 'Remote work arrangements', { citationCount: 1000000 }),
    paper('relevant', 'Remote work and employee wellbeing'),
  ], 'remote work employee wellbeing');
  assert.deepEqual(results.map(item => item.id), ['relevant']);
  assert.equal(results[0].relevanceExplanation.matchPercentage, 100);
  assert.equal(computePaperRelevanceDetail(paper('x', 'Unrelated biochemical assays'), 'remote work').score, null);
});

test('matching respects phrases, Boolean alternatives and exclusions, whole words, acronyms and plurals', () => {
  const candidates = [paper('yes', 'Telework among nurses'), paper('excluded', 'Telework among nursing students'), paper('wrong-phrase', 'Remote sensing of work among nurses')];
  assert.deepEqual(rankPapersByRelevance(candidates, '("remote work" OR telework) AND nurses NOT students').map(p => p.id), ['yes']);
  assert.equal(rankPapersByRelevance([paper('ai', 'Artificial intelligence for nurses')], 'AI nurses').length, 1);
  assert.equal(rankPapersByRelevance([paper('wrong', 'Said repairs')], 'AI').length, 0);
  assert.equal(rankPapersByRelevance([paper('plural', 'Nurses and hospitals')], 'nurse hospital').length, 1);
});

test('complete matching abstracts remain eligible even with a differently worded title', () => {
  const result = rankPapersByRelevance([paper('x', 'An occupational cohort', { abstract: 'We examine remote work and employee wellbeing. ' + 'Additional context. '.repeat(100) })], 'remote work employee wellbeing');
  assert.equal(result.length, 1);
});

test('empty OpenAlex and Europe PMC searches never retry with truncated terms', async t => {
  const calls = [];
  t.mock.method(global, 'fetch', async url => { calls.push(new URL(url)); return json({ results: [], resultList: { result: [] } }); });
  const query = '"remote work" AND employee wellbeing nurses';
  await searchOpenAlex(query);
  await searchEuropePmc(query);
  assert.equal(calls.length, 2);
  assert.equal(calls[0].searchParams.get('search'), query);
  assert.match(calls[1].searchParams.get('query'), /employee wellbeing nurses/);
});

test('federated discovery removes irrelevant records and reconciles retrieval counts', async t => {
  const calls = [];
  t.mock.method(global, 'fetch', async url => {
    calls.push(new URL(url));
    return json({ message: { items: [
      { DOI: '10.1234/right', title: ['Remote work employee wellbeing among rural nurses'], type: 'journal-article' },
      { DOI: '10.1234/wrong', title: ['Machine learning in remote sensing'], type: 'journal-article', 'is-referenced-by-count': 100000 },
    ] } });
  });
  const result = await executeFederatedSearch('remote work employee wellbeing among rural nurses', { enabledSources: sources });
  assert.match(calls[0].searchParams.get('query'), /rural nurses/);
  assert.equal(result.papers.length, 1);
  assert.equal(result.prismaStats.screening.excludedOffTopic, 1);
  assert.equal(result.prismaStats.screening.recordsScreened, result.prismaStats.screening.totalExcluded + result.prismaStats.included.totalIncluded);
});

test('focus and title-only scope cannot be satisfied by unrelated title terms', async t => {
  t.mock.method(global, 'fetch', async () => json({ message: { items: [
    { DOI: '10.1234/focus', title: ['Remote work employee wellbeing rural nurses'], type: 'journal-article' },
    { DOI: '10.1234/no-focus', title: ['Remote work employee wellbeing office workers'], type: 'journal-article' },
    { DOI: '10.1234/abstract-only', title: ['Occupational cohort findings'], abstract: 'Remote work employee wellbeing rural nurses', type: 'journal-article' },
  ] } }));
  const result = await executeFederatedSearch('remote work employee wellbeing rural nurses', { enabledSources: sources, focusQuery: 'rural nurses', searchScope: 'title_only', limitPerSource: 11 });
  assert.deepEqual(result.papers.map(p => p.doi), ['10.1234/focus']);
  assert.equal(result.prismaStats.screening.excludedOffTopic, 2);
});
