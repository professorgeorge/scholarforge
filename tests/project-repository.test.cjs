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
test('current outputs replace previous results without retaining archive snapshots', async () => {
  const project = store.createProject('Current results'); store.selectProject(project.id);
  store.setToolState('LiteratureFirstPane.discoveredPapers', [paper]);
  store.setToolState('LiteratureFirstPane.discoveredPapers', []);
  assert.equal(store.getProject().repository, undefined);
  assert.deepEqual(repo.projectRepositorySources(store.getProject()), []);
  const second = store.createProject('Replacement');
  await store.flushProjectWrites();
  assert.deepEqual(store.getProjectIds(), [second.id]);
  assert.equal(store.getProject(project.id), null);
  const db = await new Promise(resolve => { const request = indexedDB.open('scholarforge-projects', 1); request.onsuccess = () => resolve(request.result); });
  const records = await new Promise(resolve => { const request = db.transaction('projects').objectStore('projects').getAll(); request.onsuccess = () => resolve(request.result); });
  db.close();
  assert.deepEqual(records.map(record => record.id), [second.id]);
});

test('opening a legacy installation keeps the active project and discards archived copies', async () => {
  const current = store.createProject('Active legacy work');
  await store.flushProjectWrites();
  const archived = { ...current, id: 'old-project', name: 'Old project' };
  localStorage.setItem('scholarforge_project_v1_old-project', JSON.stringify(archived));
  localStorage.setItem('scholarforge_projects_v1', JSON.stringify([current.id, archived.id]));
  await store.initializeProjects();
  assert.equal(store.getProject().id, current.id);
  assert.deepEqual(store.getProjectIds(), [current.id]);
  assert.equal(localStorage.getItem('scholarforge_project_v1_old-project'), null);
  assert.equal(store.getProject(archived.id), null);
});

test('literature cleanup removes linked records and survives reopening while preserving other work', async () => {
  store.createProject('Cleanup');
  store.updateProject({ papers: [paper], documents: [{ id: 'd', paperId: paper.id, text: 'Evidence' }], evidence: [{ paperId: paper.id }],
    tools: { 'LiteratureFirstPane.topic': 'Old review', 'ToolAiAssistant.literature.review': 'Review', 'App.literatureTopic': 'Old review', 'ResearchStudioPane.draft': 'Keep draft', scholarforge_universal_binder: ['clip'] } });
  localStorage.setItem('provider-key', 'keep');
  await store.cleanUpProject('literature');
  await store.initializeProjects();
  const current = store.getProject();
  assert.equal(current.name, 'Cleanup');
  assert.deepEqual(current.papers, []);
  assert.deepEqual(current.evidence, []);
  assert.deepEqual(current.documents, []);
  assert.deepEqual(current.tools, { 'ResearchStudioPane.draft': 'Keep draft' });
  assert.equal(localStorage.getItem('provider-key'), 'keep');
  await store.cleanUpProject('all');
  assert.deepEqual(store.getProject().tools, {});
  assert.equal(store.getProject().name, 'Cleanup');
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
test('backup restoration keeps current research and review state but discards archives and credentials', () => {
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
  assert.equal(restored.files, undefined);
  assert.equal(restored.repository, undefined);
});
test('document imports do not accumulate original file copies', async () => {
  const project = store.createProject('Current document');
  await fileService.retainProjectFile(new File(['content'], 'draft.txt'), project.id);
  assert.equal(store.getProject().files, undefined);
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
