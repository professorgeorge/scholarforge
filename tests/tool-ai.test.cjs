const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText, filename);
const { TOOL_AI_REVIEWS, buildToolReviewContext, parseToolAiReview, reviewWithToolAI, MAX_REVIEW_MATERIAL } = require('../src/services/toolAiService.ts');
const { DEFAULT_LLM_CONFIG, switchLLMProvider } = require('../src/services/llmService.ts');
const { isLlmConfigured } = require('../src/services/aiScholarExtensions.ts');
const review = { summary: 'Provisional review of supplied material.', suggestions: [{ title: 'Clarify the design', detail: 'State how participants are recruited.', sourceIds: [] }], questions: ['What is the sampling frame?'], limitations: ['No full-text appraisal was performed.'], proposedText: 'Proposed wording for review.' };
const project = tools => ({ name: 'Test', question: 'How does work relate to wellbeing?', discipline: 'Social sciences', protocol: 'A proposed observational study.', papers: [], evidence: [], tools });

test('tool AI coverage includes every utility, including ethics, writing, and anonymization', () => {
  assert.deepEqual(Object.keys(TOOL_AI_REVIEWS).sort(), ['funding','concept','applications','counterevidence','instruments','literature','pico','methodology','synthetic','irb','studio','claims','writing','verify','journal','anonymizer','scholars'].sort());
  for (const definition of Object.values(TOOL_AI_REVIEWS)) {
    assert.ok(definition.tasks.length >= 2);
    assert.equal(new Set(definition.tasks.map(task => task.id)).size, definition.tasks.length);
  }
});

test('loading bounded tool context excludes credentials, unrelated notes, and raw dataset rows', () => {
  const original = project({
    scholarforge_llm_config: { apiKey: 'NEVER_SEND_THIS' },
    'Unrelated.privateNotes': 'UNRELATED_PRIVATE_NOTE',
    'SyntheticDataForgePane.dataset': { modelType: 'mediation', sampleSize: 50, data: [{ identity: 'RAW_PARTICIPANT_ROW' }], hypothesisVerification: { status: 'not_estimated', pValue: null }, generationConfig: { seed: 42, apiKey: 'NESTED_KEY' } },
  });
  const snapshot = buildToolReviewContext('synthetic', original);
  assert.ok(!snapshot.text.includes('NEVER_SEND_THIS'));
  assert.ok(!snapshot.text.includes('UNRELATED_PRIVATE_NOTE'));
  assert.ok(!snapshot.text.includes('RAW_PARTICIPANT_ROW'));
  assert.ok(!snapshot.text.includes('NESTED_KEY'));
  assert.match(snapshot.text, /not_estimated/);
  assert.equal(original.tools['SyntheticDataForgePane.dataset'].data.length, 1);
});

test('large contexts remain valid JSON with an explicit excerpt flag and bounded source IDs', () => {
  const original = project({ 'LiteratureFirstPane.topic': 'x'.repeat(50000), 'LiteratureFirstPane.discoveredPapers': Array.from({ length: 50 }, (_, i) => ({ title: `Record ${i}`, abstract: 'a'.repeat(5000), year: 2024, doi: `10.1234/${i}` })) });
  const snapshot = buildToolReviewContext('literature', original);
  assert.ok(snapshot.text.length <= MAX_REVIEW_MATERIAL);
  assert.equal(snapshot.truncated, true);
  assert.equal(JSON.parse(snapshot.text).contextIsExcerpted, true);
  assert.equal(snapshot.sourceIds.length, 6);
});

test('unconfigured AI and empty material cause no provider request or offline AI fabrication', async t => {
  let calls = 0;
  t.mock.method(global, 'fetch', async () => { calls++; throw new Error('must not request'); });
  await assert.rejects(reviewWithToolAI('writing', 'titles', 'A topic', '', [], DEFAULT_LLM_CONFIG), /Configure an AI provider/);
  await assert.rejects(reviewWithToolAI('writing', 'titles', '', '', [], { provider: 'custom', baseUrl: 'http://localhost/review' }), /paste the material/);
  assert.equal(calls, 0);
  assert.equal(isLlmConfigured({ provider: 'custom', baseUrl: 'http://localhost/review' }), true);
});

test('explicit invocation sends the edited material, task-specific limits and no hidden context', async t => {
  let sent;
  t.mock.method(global, 'fetch', async (url, options) => { sent = { url, body: JSON.parse(options.body), headers: options.headers }; return new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify(review) } }] }), { headers: { 'Content-Type': 'application/json' } }); });
  const result = await reviewWithToolAI('irb', 'consent', 'Only this reviewed excerpt', 'Use plain language.', [], { provider: 'custom', apiKey: 'TEST_AUTH_ONLY', baseUrl: 'http://localhost/review', model: 'test-model' });
  assert.equal(result.summary, review.summary);
  assert.equal(sent.url, 'http://localhost/review');
  assert.match(sent.body.messages[0].content, /Do not state approval/);
  assert.match(sent.body.messages[0].content, /Never certify/);
  assert.ok(!JSON.stringify(sent.body).includes('TEST_AUTH_ONLY'));
  assert.deepEqual(JSON.parse(sent.body.messages[1].content), { userRequest: 'Use plain language.', material: 'Only this reviewed excerpt' });
});

test('fabricated source IDs and malformed model results are rejected rather than presented as a review', () => {
  assert.throws(() => parseToolAiReview(JSON.stringify({ ...review, suggestions: [{ title: 'Claim', detail: 'Unsupported', sourceIds: ['R999'] }] }), ['R1']), /not supplied/);
  assert.throws(() => parseToolAiReview('an unstructured model answer', []), /usable structured review/);
  assert.throws(() => parseToolAiReview(JSON.stringify({ ...review, summary: 123 }), []), /invalid review field/);
  assert.equal(parseToolAiReview('```json\n' + JSON.stringify(review) + '\n```', []).summary, review.summary);
});

test('synthetic review instructions preserve unsupported diagnostics as not estimated', async t => {
  let prompt = '';
  t.mock.method(global, 'fetch', async (_, options) => { prompt = JSON.parse(options.body).messages[0].content; return new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify(review) } }] })); });
  await reviewWithToolAI('synthetic', 'diagnostics', 'status: not_estimated', '', [], { provider: 'custom', baseUrl: 'http://localhost/review' });
  assert.match(prompt, /not_estimated result must stay not estimated/);
  assert.match(prompt, /Never invent coefficients/);
});


test('switching model providers clears credentials, stale model names and unrelated endpoints', () => {
  const original = { provider: 'openai', model: 'provider-specific-model', apiKey: 'PRIVATE_KEY', baseUrl: 'https://old.example/v1/chat/completions' };
  const custom = switchLLMProvider(original, 'custom');
  assert.equal(custom.apiKey, undefined);
  assert.equal(custom.model, undefined);
  assert.equal(custom.baseUrl, 'http://localhost:1234/v1/chat/completions');
  assert.equal(original.apiKey, 'PRIVATE_KEY');
  assert.equal(switchLLMProvider(original, 'openai').apiKey, 'PRIVATE_KEY');
});


test('new research tools invoke only the configured endpoint with bounded scientific interpretation tasks', async t => {
  const prompts = [];
  t.mock.method(global, 'fetch', async (url, options) => {
    assert.equal(url, 'http://localhost/review');
    prompts.push(JSON.parse(options.body).messages[0].content);
    return new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify(review) } }] }));
  });
  const config = { provider: 'custom', baseUrl: 'http://localhost/review' };
  for (const [tool, task] of [['applications','translate'], ['counterevidence','compare'], ['instruments','compare']]) {
    const result = await reviewWithToolAI(tool, task, 'Only the reviewed source material', '', [], config);
    assert.equal(result.summary, review.summary);
  }
  assert.equal(prompts.length, 3);
  assert.match(prompts[0], /Do not infer causation/);
  assert.match(prompts[1], /Do not infer no effect/);
  assert.match(prompts[2], /Do not invent scale items/);
});
