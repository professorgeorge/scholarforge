const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText, filename);
const service = require('../src/services/conceptStudioService.ts');
const { buildToolReviewContext, reviewWithToolAI } = require('../src/services/toolAiService.ts');
const { prepareResearchStart } = require('../src/services/researchStartService.ts');
const paper = { id: 'p1', title: 'Existing account of flexible work', abstract: 'Experiences differed by organizational context.', authors: [], year: 2025, doi: '10.1234/example', source: 'manual' };
const searches = [{ query: 'flexible work boundaries', statuses: [{ name: 'crossref', query: 'flexible work boundaries', status: 'success', count: 1 }] }];
const draft = () => ({ ...service.emptyConceptStudy(), narrative: 'Different experiences of a policy.', question: 'How do boundaries shape the experience?', frames: [{ id: 'f1', title: 'Boundaries', lens: 'Boundary practices', statement: 'The same policy may mean different boundary expectations.', assumptions: 'Expectations vary.' }], selectedFrameId: 'f1', gap: 'How expectations arise remains unclear in these sources.', coverageNotes: 'Crossref plus saved sources; bounded search; full coverage not established.', counterEvidence: 'An existing explanation addresses organizational context; other fields remain unchecked.', evidence: [{ id: 'e1', paperId: 'p1', role: 'challenges', quote: paper.abstract, passage: '', locator: 'Abstract', interpretation: 'Existing work already addresses some contextual variation.' }] });

test('a narration or an empty search cannot become a reviewed gap without evidence', () => {
  const study = service.emptyConceptStudy();
  study.narrative = 'Something puzzling.';
  assert.ok(service.conceptGapErrors(study, []).length);
  assert.match(service.conceptGapStatus(study, [], []), /Candidate gap/);
  study.gapReviewedBasis = service.conceptGapBasis(study, [], []);
  assert.match(service.conceptGapStatus(study, [], []), /Needs rechecking/);
  assert.match(service.conceptBrief(study, [], []), /No searches recorded/);
});
test('passages require source, transcription, location and interpretation; matching text is not verification', () => {
  const study = draft();
  assert.deepEqual(service.conceptGapErrors(study, [paper]), []);
  const note = study.evidence[0];
  assert.ok(service.conceptEvidenceErrors({ ...note, quote: 'Invented text' }, [paper]).length);
  assert.ok(service.conceptEvidenceErrors({ ...note, locator: '' }, [paper]).length);
  assert.ok(service.conceptEvidenceErrors(note, []).length);
  assert.deepEqual(service.conceptEvidenceErrors({ ...note, quote: 'Additional passage.', passage: 'Additional passage. With context.' }, [paper]), []);
});
test('source, framing, question, coverage and narration changes invalidate earlier reviews', () => {
  const study = draft();
  study.gapReviewedBasis = service.conceptGapBasis(study, [paper], searches);
  assert.match(service.conceptGapStatus(study, [paper], searches), /User-reviewed/);
  for (const field of ['narrative', 'question', 'gap', 'coverageNotes', 'counterEvidence', 'observed', 'level']) {
    assert.match(service.conceptGapStatus({ ...study, [field]: 'Changed' }, [paper], searches), /Needs rechecking/);
  }
  assert.match(service.conceptGapStatus(study, [{ ...paper, abstract: 'Changed source' }], searches), /Needs rechecking/);
  assert.match(service.conceptGapStatus({ ...study, selectedFrameId: '' }, [paper], searches), /Needs rechecking/);
  assert.match(service.conceptGapStatus(study, [paper], []), /Needs rechecking/);
});
test('model and pathway reviews depend on upstream evidence and model decisions', () => {
  const study = draft();
  study.explanation = 'A proposed interpretive explanation.';
  study.modelKind = 'interpretive';
  study.modelReviewedBasis = service.conceptModelBasis(study, [paper], searches);
  study.pathwayReviewedBasis = service.conceptPathwayBasis(study, [paper], searches);
  assert.notEqual(service.conceptModelBasis({ ...study, question: 'Changed question' }, [paper], searches), study.modelReviewedBasis);
  assert.notEqual(service.conceptPathwayBasis({ ...study, explanation: 'A rival explanation' }, [paper], searches), study.pathwayReviewedBasis);
  assert.equal(service.conceptModelBasis({ ...study, decisions: 'Memo only' }, [paper], searches), study.modelReviewedBasis);
  assert.match(service.conceptBrief({ ...study, gap: 'Changed' }, [paper], searches), /Needs rechecking after changes/);
});
test('briefs preserve competing frames, source passages, limitations and unknowns', () => {
  const study = draft();
  const text = service.conceptBrief(study, [paper], searches);
  for (const expected of [paper.title, paper.abstract, '10.1234/example', 'Crossref plus saved sources', 'Role: challenges', '[Not supplied]', 'proposals']) assert.ok(text.includes(expected));
  assert.match(text, /not independent source verification/);
  assert.equal(prepareResearchStart('concept', '  A puzzle  ').text, 'A puzzle');
});
test('handoffs append methodology context and clear obsolete prepared queries without touching evidence or manuscripts', () => {
  const study = draft();
  study.propositions = 'Boundary expectations shape experiences.';
  study.constructs = [{ id: 'c1', name: 'Boundary expectations', definition: '', observation: '' }];
  const existing = { 'MethodologyCompassPane.aiObjective': 'Existing objective', 'MethodologyCompassPane.aiDataDesc': 'Existing data plan', 'CounterevidencePane.queries': ['old search'], 'CounterevidencePane.reviews': { saved: true }, scholarforge_active_manuscript: 'PRESERVE_DRAFT' };
  const method = service.conceptHandoffFields('methodology', study, existing);
  assert.ok(method['MethodologyCompassPane.aiObjective'].startsWith('Existing objective\n\n'));
  assert.ok(method['MethodologyCompassPane.aiDataDesc'].startsWith('Existing data plan\n\n'));
  assert.deepEqual(service.conceptHandoffFields('counterevidence', study, existing)['CounterevidencePane.queries'], []);
  assert.equal(service.conceptHandoffFields('instruments', study, existing)['InstrumentFinderPane.query'], '');
  assert.equal(existing.scholarforge_active_manuscript, 'PRESERVE_DRAFT');
  assert.deepEqual(existing['CounterevidencePane.reviews'], { saved: true });
});
test('concept AI context includes theory and pathways, prioritizes linked sources and excludes review signatures', () => {
  const study = draft();
  study.explanation = 'MODEL_CONTEXT'; study.pathways = [{ design: 'PATHWAY_CONTEXT' }];
  study.gapReviewedBasis = 'INTERNAL_SIGNATURE';
  const context = buildToolReviewContext('concept', { question: '', discipline: '', tools: { 'ConceptStudio.study': study, 'ConceptStudio.papers': [paper], 'Unrelated.notes': 'PRIVATE_NOTE' } });
  for (const text of ['MODEL_CONTEXT', 'PATHWAY_CONTEXT', paper.title, paper.abstract]) assert.ok(context.text.includes(text));
  for (const text of ['INTERNAL_SIGNATURE', 'PRIVATE_NOTE']) assert.ok(!context.text.includes(text));
  assert.deepEqual(context.sourceIds, ['R1']);
});
test('connected concept AI uses the chosen task and supplies suggestions without certifying a gap', async t => {
  let sent;
  t.mock.method(global, 'fetch', async (url, options) => { sent = JSON.parse(options.body); return new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify({ summary: 'A provisional gap.', suggestions: [], questions: ['What existing explanation challenges this?'], limitations: ['Limited search coverage.'], proposedText: 'A candidate mechanism gap.' }) } }] }), { headers: { 'Content-Type': 'application/json' } }); });
  const result = await reviewWithToolAI('concept', 'gap', 'Only supplied context', '', [], { provider: 'custom', baseUrl: 'http://localhost/mock', model: 'test' });
  assert.match(sent.messages[0].content, /Never infer absence/);
  assert.match(sent.messages[0].content, /certify novelty/);
  assert.equal(result.proposedText, 'A candidate mechanism gap.');
});
