const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
}).outputText, filename);
const { formatReferenceEntryHtml, buildAnnotatedDocument, exportToWordHtml, exportRebuttalToWordHtml } = require('../src/services/citationFormatter.ts');
const { boldTextHtml } = require('../src/services/safeHtml.ts');
const { proposeAnonymization } = require('../src/services/anonymizationService.ts');
const { evaluateEditorialReadiness, generateReadinessCertificateMarkdown, DEFAULT_READINESS_OPTIONS } = require('../src/services/editorialReadinessService.ts');
const { searchOpenAlex, searchCrossref } = require('../src/services/academicApi.ts');

const payload = '<img src=x onerror="alert(1)">';
const paper = { id: 'p', title: payload, venue: payload, authors: [{ name: payload }], year: 2026,
  doi: '10.1234/test" onclick="alert(1)', url: payload, volume: payload, issue: payload, pages: payload,
  abstract: payload, source: 'manual', citationCount: 0, openAccess: false };
const options = { style: 'apa', includeDoi: true, includeAbstracts: true, maxAuthorsInText: 3, linkCitations: true, excludePreprints: true, requireDoi: false };

test('all HTML citation styles escape hostile imported metadata while retaining formatting', () => {
  for (const style of ['apa', 'mla', 'chicago', 'harvard', 'ieee', 'vancouver', 'nature', 'bibtex']) {
    const html = formatReferenceEntryHtml(paper, style);
    assert.ok(!html.includes('<img'), style);
    assert.ok(!html.includes('" onclick="'), style);
    assert.match(html, /&lt;img/);
  }
  assert.equal(boldTextHtml(`**Study** ${payload}`), '<strong>Study</strong> &lt;img src=x onerror=&quot;alert(1)&quot;&gt;');
});

test('manuscript, response letter and BibTeX HTML exports cannot introduce active content', () => {
  assert.ok(!exportToWordHtml(payload, [], options).includes('<img'));
  assert.ok(!exportRebuttalToWordHtml(payload).includes('<img'));
  const claim = { id: 'c', text: 'Study.', rawSentence: 'Study.', selectedPaper: paper, status: 'found', isExcluded: false };
  const result = buildAnnotatedDocument('Study.', [claim], { ...options, style: 'bibtex' });
  assert.ok(result.bibliographyHtml.length > 0);
  assert.ok(result.bibliographyHtml.every(html => !html.includes('<img')));
});

function manuscript(overrides = {}) {
  return { rawText: 'Introduction\nResearch question\nMethods\nN = 20\nResults\np = 0.03\nDiscussion\nLimitations\nIRB approval was not obtained. Funding is unknown.',
    title: 'Study of a research question', abstract: 'A short abstract.', bibliography: 'Example (2026). 10.1234/example',
    detectedReferencesCount: 1, ...overrides };
}
const item = (report, id) => report.categories.flatMap(category => category.items).find(check => check.id === id);

test('readiness never treats DOI syntax, absent retraction wording or ethics keywords as verification', () => {
  const report = evaluateEditorialReadiness(manuscript());
  for (const id of ['doi_coverage', 'retraction_scan', 'ethics_statement', 'funding_disclosure']) {
    assert.equal(item(report, id).status, 'warning', id);
  }
  assert.match(item(report, 'doi_coverage').metric, /resolution not checked/);
  assert.equal(item(report, 'sections_structure').metric, '4/4 heading groups detected');
  const md = generateReadinessCertificateMarkdown(report);
  assert.ok(!md.includes('Certificate'));
  assert.ok(!md.includes('DOIs resolved'));
  assert.match(md, /No external registries were queried/);
});

test('submission profiles apply supplied limits and avoid imposing empirical structure on conceptual papers', () => {
  const report = evaluateEditorialReadiness(manuscript(), { ...DEFAULT_READINESS_OPTIONS, articleType: 'conceptual', doubleBlind: false, abstractLimit: 2, manuscriptLimit: 10 });
  assert.equal(item(report, 'abstract_budget').status, 'warning');
  assert.equal(item(report, 'substantive_length').status, 'warning');
  assert.equal(item(report, 'sections_structure'), undefined);
  assert.equal(item(report, 'sample_specification'), undefined);
  assert.equal(item(report, 'anonymity_review'), undefined);
  assert.equal(evaluateEditorialReadiness(null).overallScore, 0);
  assert.equal(evaluateEditorialReadiness(null).categories.length, 0);
});

test('anonymization preserves ethics prose and redacts explicit IDs, international email and OSF links', () => {
  const text = 'IRB approval and Grant funding were discussed. Protocol #ABC-123 was approved. Email author@uni.de. Materials: https://osf.io/abc12/';
  const result = proposeAnonymization(text);
  assert.match(result.output, /IRB approval and Grant funding/);
  assert.ok(!result.output.includes('ABC-123'));
  assert.ok(!result.output.includes('author@uni.de'));
  assert.ok(!result.output.includes('osf.io/abc12'));
  assert.equal(result.count, 3);
});

test('explicit redactions treat regex characters literally and support case-insensitive author names', () => {
  const result = proposeAnonymization('A. Smith and A+Lab; a. smith; unrelated AxxxLab.', 'A. Smith\nA+Lab');
  assert.equal(result.count, 3);
  assert.match(result.output, /unrelated AxxxLab/);
  assert.equal(proposeAnonymization('', 'Smith').output, '');
});

test('strict manual searches distinguish provider failures from a valid empty result', async () => {
  const originalFetch = global.fetch;
  try {
    global.fetch = async () => new Response('', { status: 503 });
    await assert.rejects(searchOpenAlex('unavailable openalex', 8, true, undefined, true), /503/);
    await assert.rejects(searchCrossref('unavailable crossref', 8, true, undefined, true), /503/);
    global.fetch = async () => new Response(JSON.stringify({ results: [], message: { items: [] } }), { status: 200 });
    assert.deepEqual(await searchOpenAlex('empty openalex', 8, true, undefined, true), []);
    assert.deepEqual(await searchCrossref('empty crossref', 8, true, undefined, true), []);
  } finally { global.fetch = originalFetch; }
});
