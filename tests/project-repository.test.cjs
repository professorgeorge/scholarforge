const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
require('fake-indexeddb/auto');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText, filename);
global.localStorage = { values: new Map(), getItem(key) { return this.values.get(key) ?? null; }, setItem(key, value) { this.values.set(key, String(value)); }, removeItem(key) { this.values.delete(key); } };
global.window = new EventTarget();
const store = require('../src/services/projectService.ts');
const repo = require('../src/services/projectRepositoryService.ts');
const registry = require('../src/services/projectRepositoryRegistry.ts');
const fileService = require('../src/services/projectFileService.ts');
const { projectZip } = require('../src/services/projectZipService.ts');
const { emptyConceptStudy } = require('../src/services/conceptStudioService.ts');
const paper = { id: 'p1', title: 'A retrieved source', authors: [], doi: '10.1234/example', abstract: 'Supplied abstract.', year: 2025, source: 'crossref', venue: '', url: '', citationCount: 0, openAccess: false };

test('clearing the shared cart cannot orphan evidence, documents or screening decisions', async () => {
  const cart = require('../src/services/cartService.ts');
  const project = store.createProject('Linked sources'); store.selectProject(project.id);
  store.updateProject({ papers: [paper, { ...paper, id: 'free' }, { ...paper, id: 'doc' }, { ...paper, id: 'screen' }],
    evidence: [{ paperId: 'p1' }], documents: [{ paperId: 'doc' }], screening: [{ paperId: 'screen' }] });
  cart.removePaperFromCart('p1');
  assert.ok(store.getProject().papers.some(source => source.id === 'p1'));
  cart.clearCart();
  assert.deepEqual(store.getProject().papers.map(source => source.id).sort(), ['doc', 'p1', 'screen']);
  assert.equal(store.getProject().evidence[0].paperId, 'p1');
  await store.flushProjectWrites();
});

test('blocked preference storage falls back without crashing and reports failed writes', () => {
  const { readPreference, writePreference } = require('../src/services/preferenceStorage.ts');
  const original = global.localStorage;
  try {
    global.localStorage = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('quota'); } };
    assert.equal(readPreference('theme'), null);
    assert.equal(writePreference('theme', 'dark'), false);
    assert.match(store.getStorageError(), /preference could not be saved/);
  } finally { global.localStorage = original; }
});

test('all seventeen tools participate in automatic project collection', () => {
  assert.equal(registry.REPOSITORY_TOOLS.length, 17);
  for (const tool of registry.REPOSITORY_TOOLS) assert.equal(registry.repositoryToolForKey(`ToolAiAssistant.${tool.id}.review`).id, tool.id);
  assert.equal(registry.repositoryToolForKey('ScholarImpactTab.impactProfile').id, 'scholars');
  assert.equal(registry.repositoryContentKey('ConceptStudio.study', emptyConceptStudy()), false);
  assert.equal(registry.repositoryContentKey('ConceptStudio.step', 'gap'), false);
  assert.equal(registry.repositoryContentKey('LiteratureFirstPane.enabledSources.v2', { crossref: true }), false);
});
test('existing project work is indexed without requiring another save or upload', () => {
  const project = store.createProject('Legacy project');
  project.tools = { 'LiteratureFirstPane.topic': 'Work and wellbeing', 'LiteratureFirstPane.discoveredPapers': [paper], 'ConceptStudio.study': { ...emptyConceptStudy(), narrative: 'A puzzle to explain.' } };
  const items = repo.projectRepositoryItems(project);
  assert.ok(items.some(item => item.id === 'tool-literature'));
  assert.ok(items.some(item => item.id === 'tool-concept'));
  assert.ok(items.some(item => item.category === 'Sources' && item.title === paper.title && /not screened/.test(item.description)));
  assert.equal(items.find(item => item.id === 'tool-literature').at, '');
  assert.equal(project.papers.length, 0, 'collection must not silently turn a retrieval into an endorsed library item');
});
test('new outputs retain result snapshots and context, including after clearing the tool', () => {
  const project = store.createProject('Automatic results'); store.selectProject(project.id);
  store.setToolState('LiteratureFirstPane.topic', 'Initial query');
  store.setToolState('LiteratureFirstPane.discoveredPapers', [paper]);
  const afterFirst = store.getProject();
  assert.equal(afterFirst.repository.history.length, 1);
  assert.equal(afterFirst.repository.history[0].context['LiteratureFirstPane.topic'], 'Initial query');
  store.setToolState('LiteratureFirstPane.discoveredPapers', [paper]);
  assert.equal(store.getProject().repository.history.length, 1, 'identical writes do not create another snapshot');
  store.setToolState('LiteratureFirstPane.discoveredPapers', []);
  assert.equal(store.getProject().repository.history.length, 1);
  assert.equal(repo.projectRepositorySources(store.getProject())[0].title, paper.title);
  store.setToolState('LiteratureFirstPane.discoveredPapers', [{ ...paper, id: 'p2', doi: '10.1234/second' }]);
  assert.equal(store.getProject().repository.history.length, 2);
});
test('automatic checkpoints preserve working drafts and isolate a departing project from the next one', () => {
  const first = store.createProject('First'); store.selectProject(first.id);
  store.setToolState('ConceptStudio.study', { ...emptyConceptStudy(), narrative: 'First project narration.' });
  store.checkpointProjectTool('concept', first.id);
  store.checkpointProjectTool('concept', first.id);
  assert.equal(store.getProject(first.id).repository.history.length, 1);
  const second = store.createProject('Second'); store.selectProject(second.id);
  store.setToolState('ScholarSearchPane.candidates', [{ id: 'r1', name: 'Candidate' }], first.id);
  assert.equal(store.getProject(second.id).repository, undefined);
  assert.ok(store.getProject(first.id).repository.history.some(entry => entry.key === 'ScholarSearchPane.candidates'));
});
test('empty or navigation-only projects stay empty rather than inventing research work', () => {
  const project = store.createProject('Empty');
  project.tools = { 'ConceptStudio.study': emptyConceptStudy(), 'ConceptStudio.step': 'frames', 'MethodologyCompassPane.currentQuestionIdx': 2 };
  assert.deepEqual(repo.projectRepositoryItems(project), []);
});
test('collection deduplicates sources across tools and retains manuscript versions, evidence, and binder notes', () => {
  const project = store.createProject('Connected collection');
  project.papers = [paper]; project.tools['ConceptStudio.papers'] = [{ ...paper, id: 'duplicate' }];
  project.tools.scholarforge_universal_binder = [{ id: 'b1', title: 'AI review', snippet: 'A suggestion.', sourcePillar: 'Concept Studio', metadata: { aiGenerated: true } }];
  project.versions = [{ id: 'v1', text: 'A manuscript.', at: new Date().toISOString(), filename: 'Draft.md' }];
  project.decisions = [{ id: 'd1', question: 'Which design?', choice: 'Compare cases', alternatives: '', rationale: 'Context matters.', at: '', manuscriptLocation: '' }];
  assert.equal(repo.projectRepositorySources(project).length, 1);
  const items = repo.projectRepositoryItems(project);
  for (const category of ['Sources', 'Manuscripts', 'Binder', 'Evidence & decisions']) assert.ok(items.some(item => item.category === category));
  assert.match(items.find(item => item.category === 'Binder').description, /AI-generated suggestion/);
});
test('backups preserve full research data, original files, and review state while excluding credentials recursively', () => {
  const project = store.createProject('Backup');
  project.tools['ConceptStudio.study'] = { ...emptyConceptStudy(), narrative: 'A puzzle.', gapReviewedBasis: 'REVIEW_BASIS' };
  project.tools['SyntheticDataForgePane.dataset'] = { generationConfig: { seed: 42, apiKey: 'NESTED_SECRET' }, data: [{ value: 7 }] };
  project.repository = { updated: {}, history: [{ id: 's1', key: 'x', tool: 'synthetic', at: '', value: { accessToken: 'TOKEN_SECRET', values: [1, 2] } }] };
  project.files = [{ id: 'file1', name: 'notes.txt', size: 5, base64: 'aGVsbG8=', mime: 'text/plain', at: '' }];
  const backup = store.exportProjectBackup(project);
  assert.ok(!backup.includes('NESTED_SECRET') && !backup.includes('TOKEN_SECRET'));
  const restored = store.importProjectBackup(backup);
  assert.notEqual(restored.id, project.id);
  assert.equal(restored.tools['ConceptStudio.study'].gapReviewedBasis, 'REVIEW_BASIS');
  assert.equal(restored.tools['SyntheticDataForgePane.dataset'].data[0].value, 7);
  assert.equal(restored.files[0].base64, 'aGVsbG8=');
});
test('new document imports retain exact original bytes once per name and content in the originating project', async () => {
  const first = store.createProject('Original file'); store.selectProject(first.id);
  const file = new File([new Uint8Array([0, 1, 127, 255])], 'original.bin', { type: 'application/octet-stream' });
  const pending = fileService.retainProjectFile(file, first.id);
  const second = store.createProject('Other project'); store.selectProject(second.id);
  await pending; await fileService.retainProjectFile(file, first.id);
  assert.equal(store.getProject(first.id).files.length, 1);
  assert.deepEqual([...fileService.base64ToBytes(store.getProject(first.id).files[0].base64)], [0, 1, 127, 255]);
  assert.equal(store.getProject(second.id).files, undefined);
});
test('complete downloads contain complete JSON even when readable previews abbreviate large lists', () => {
  const project = store.createProject('Download');
  project.tools['ScholarSearchPane.candidates'] = Array.from({ length: 40 }, (_, i) => ({ id: `c${i}`, name: `Candidate ${i}` }));
  const files = repo.repositoryDownloadFiles(project, store.exportProjectBackup(project));
  assert.ok(files.some(file => file.path === 'Project-backup.json'));
  const record = files.find(file => file.path.endsWith('tool-scholars.json'));
  assert.equal(JSON.parse(record.content)['ScholarSearchPane.candidates'].length, 40);
  assert.match(files.find(file => file.path.endsWith('tool-scholars.md')).content, /further entries/);
});
test('ZIP uses valid entry offsets, standard CRC32, UTF-8 names, and exact binary payloads', () => {
  const files = [{ path: 'Research/évidence.txt', content: '123456789' }, { path: 'Original-files/file.bin', content: new Uint8Array([0, 255, 1]) }];
  const zip = Buffer.from(projectZip(files));
  assert.equal(zip.readUInt32LE(0), 0x04034b50);
  assert.equal(zip.readUInt32LE(14), 0xcbf43926);
  assert.equal(zip.readUInt16LE(6), 0x800);
  const end = zip.length - 22;
  assert.equal(zip.readUInt32LE(end), 0x06054b50);
  assert.equal(zip.readUInt16LE(end + 10), 2);
  let directory = zip.readUInt32LE(end + 16);
  for (const expected of files) {
    assert.equal(zip.readUInt32LE(directory), 0x02014b50);
    const offset = zip.readUInt32LE(directory + 42), nameLength = zip.readUInt16LE(directory + 28), size = zip.readUInt32LE(directory + 24);
    assert.equal(zip.subarray(directory + 46, directory + 46 + nameLength).toString(), expected.path);
    const start = offset + 30 + zip.readUInt16LE(offset + 26);
    assert.deepEqual(zip.subarray(start, start + size), Buffer.from(expected.content));
    directory += 46 + nameLength;
  }
  assert.throws(() => projectZip([{ path: '../escape', content: 'x' }]), /Invalid archive path/);
});
