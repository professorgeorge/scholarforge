const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
require('fake-indexeddb/auto');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText, filename);
global.localStorage = { getItem: () => null, setItem() {}, removeItem() {} };
global.window = new EventTarget();
const service = require('../src/services/researchToolsService.ts');
const { buildToolReviewContext } = require('../src/services/toolAiService.ts');
const paper = { id: 'one', title: 'A replication with null results', authors: [], year: 2024, doi: '10.1234/research', url: '', citationCount: 0, abstract: 'The difference was not statistically significant. The interval included meaningful benefits and harms.', source: 'manual', openAccess: false, venue: '' };
const review = { proposition: 'Work improves wellbeing', paperId: paper.id, direction: 'non_significant', comparable: 'yes', population: 'Adults in work', outcome: 'Wellbeing versus usual practice', quote: 'The difference was not statistically significant.', locator: 'Abstract, results', sourceExcerpt: '', interpretation: 'Imprecise evidence; not proof of no effect.', equivalenceBasis: '' };
const profile = { id: 'profile', name: 'Candidate scale', construct: 'Wellbeing', population: '', language: '', burden: '', scoring: '', validationQuote: '', locator: '', sourceExcerpt: '', referenceRole: 'unknown', permission: 'unknown', permissionUrl: '', permissionNotes: '', source: paper };
test('application briefs retain missing conditions and distinguish proposed outcomes from findings', () => {
  const text = service.applicationsBrief({ title: 'Study', design: 'observational', population: '', limitations: '' }, [{ id:'one', finding:'An association was observed.', sourceNote:'Table 2', stakeholder:'Employers', action:'Pilot an adjustment', conditions:'', risks:'', pilot:'', successMeasure:'' }]);
  assert.match(text, /not demonstrated implementation outcomes/);
  assert.match(text, /does not establish causation/);
  assert.match(text, /Conditions required: \[Not supplied\]/);
  assert.match(text, /An association was observed/);
});
test('keyword hints do not classify null findings and evidence review requires a checked passage', () => {
  assert.deepEqual(service.evidenceLeadHints(paper), ['Null/non-significance language', 'Replication language']);
  assert.deepEqual(service.validateEvidenceReview(review, paper), []);
  assert.ok(service.validateEvidenceReview({ ...review, quote:'An invented result.' }, paper).some(error => error.includes('quotation must occur')));
  assert.ok(service.validateEvidenceReview({ ...review, comparable:'unclear' }, paper).length);
  assert.ok(service.validateEvidenceReview({ ...review, direction:'negligible_effect' }, paper).some(error => error.includes('Non-significance alone')));
  assert.deepEqual(service.validateEvidenceReview({ ...review, quote:'An independently supplied passage.', sourceExcerpt:'An independently supplied passage. Extra context.' }, paper), []);
});
test('counterevidence reports invalidate classifications after proposition or source-text changes', () => {
  assert.match(service.counterevidenceBrief(review.proposition, [paper], {one:review}, []), /Reports a non-significant result/);
  assert.match(service.counterevidenceBrief('A different idea', [paper], {one:review}, []), /saved review needs rechecking/);
  assert.match(service.counterevidenceBrief(review.proposition, [{...paper, abstract:'Changed metadata'}], {one:review}, []), /saved review needs rechecking/);
  assert.match(service.counterevidenceBrief(review.proposition, [], {}, []), /does not establish absence/);
});
test('instrument validation and licensing are never inferred from search metadata', () => {
  assert.deepEqual(service.validateInstrumentProfile(profile), []);
  assert.match(service.instrumentComparison([profile]), /Permissions status: unknown/);
  assert.match(service.instrumentComparison([profile]), /does not establish/);
  assert.ok(service.validateInstrumentProfile({...profile, referenceRole:'original_validation'}).length);
  assert.ok(service.validateInstrumentProfile({...profile, permission:'public_domain'}).length);
  assert.ok(service.validateInstrumentProfile({...profile, validationQuote:'invented', locator:'p2'}).length);
  assert.deepEqual(service.validateInstrumentProfile({...profile, validationQuote:review.quote, locator:'Abstract', referenceRole:'original_validation', permission:'licensed', permissionUrl:'https://example.org/conditions'}), []);
  assert.equal(service.safeResearchUrl('javascript:alert(1)'), undefined);
});
test('search plans retain user concepts and measurement constraints', () => {
  const queries = service.counterQueries('flexible work wellbeing');
  assert.equal(queries.length, 3);
  assert.equal(queries[1].query, 'flexible work wellbeing null results');
  assert.match(service.instrumentQuery('engagement','adult workers','Spanish'), /engagement adult workers Spanish scale validation psychometric/);
  assert.deepEqual(service.counterQueries(' '), []);
});
test('research searches retain partial coverage, deduplicate sources and preserve null-result terms', async t => {
  const urls=[];
  t.mock.method(global,'fetch',async input => {
    const url=new URL(input); urls.push(url);
    if(url.searchParams.get('query')?.includes('failed fixture')) return new Response('',{status:503});
    return new Response(JSON.stringify({data:[{attributes:{doi:paper.doi,titles:[{title:paper.title}],publicationYear:2024,types:{resourceTypeGeneral:'Report'},descriptions:[{descriptionType:'Abstract',description:paper.abstract}]}}]}),{headers:{'Content-Type':'application/json'}});
  });
  const sources={openalex:false,europepmc:false,crossref:false,pubmed:false,datacite:true,semanticscholar:false,arxiv:false};
  const result=await service.searchResearchQueries(['wellbeing null results fixture','failed fixture','wellbeing replication fixture'],sources);
  assert.equal(result.papers.length,1);
  assert.equal(result.searches.length,3);
  assert.equal(result.searches[1].statuses[0].status,'failed');
  assert.match(urls[0].searchParams.get('query'),/wellbeing null results fixture/);
  await assert.rejects(service.searchResearchQueries([],sources),/one to three/);
  await assert.rejects(service.searchResearchQueries(['one'],{...sources,datacite:false}),/at least one/);
});
test('all new tools load their saved review material and supplied source IDs without a model request', () => {
  const project={question:'Question',discipline:'Research',papers:[paper],evidence:[],tools:{'ApplicationsPane.cards':[{finding:'Observed association'}],'CounterevidencePane.papers':[paper],'CounterevidencePane.reviews':{one:review},'InstrumentFinderPane.papers':[paper],'InstrumentFinderPane.profiles':[profile]}};
  for(const tool of ['applications','counterevidence','instruments']) {
    const context=buildToolReviewContext(tool,project);
    assert.deepEqual(context.sourceIds,['R1']);
    assert.match(context.text,/10.1234\/research/);
  }
  assert.match(buildToolReviewContext('counterevidence',project).text,/non_significant/);
  assert.match(buildToolReviewContext('instruments',project).text,/"permission": "unknown"/);
});
