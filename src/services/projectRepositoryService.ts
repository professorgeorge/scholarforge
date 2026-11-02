import type { ResearchProject } from './projectService';
import type { AcademicPaper } from '../types/citation';
import { base64ToBytes } from './projectFileService';
import { fundingBrief, type FundingProfile, type FundingRun, type FundingOpportunity, type FundingNote } from './fundingService';
import { cleanRepositoryValue, REPOSITORY_TOOLS, repositoryContentKey, repositoryToolForKey } from './projectRepositoryRegistry';
import { conceptBrief, type ConceptStudy } from './conceptStudioService';
import { applicationsBrief, counterevidenceBrief, instrumentComparison, type ApplicationCard, type ApplicationsStudy, type EvidenceReview, type InstrumentProfile, type DiscoveryBatch } from './researchToolsService';

export type RepositoryCategory = 'Tool work' | 'Sources' | 'Original files' | 'Documents' | 'Manuscripts' | 'Evidence & decisions' | 'Binder' | 'Result history';
export interface ProjectRepositoryItem { id: string; title: string; category: RepositoryCategory; tool?: string; at: string; description: string; value: unknown; markdown?: string; filename: string }
export function repositoryFilename(text: string): string { return text.replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 90) || 'Project-item'; }
const meaningful = (value: unknown) => Array.isArray(value) ? value.length > 0 : typeof value === 'string' ? !!value.trim() : !!value && typeof value === 'object' && Object.keys(value).length > 0;
export function repositoryLabel(key: string): string { return key.split('.').at(-1)!.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[_-]+/g, ' ').replace(/^./, letter => letter.toUpperCase()); }
export function readableRepositoryValue(value: unknown, level = 0): string {
  if (value === null || value === undefined || value === '') return 'Not supplied';
  if (typeof value !== 'object') return String(value);
  if (level > 7) return '[Nested detail available in JSON]';
  if (Array.isArray(value)) {
    if (!value.length) return 'None recorded';
    return value.slice(0, 30).map((entry, index) => `${index + 1}. ${readableRepositoryValue(entry, level + 1)}`).join('\n\n') + (value.length > 30 ? `\n\n${value.length - 30} further entries are included in the JSON download.` : '');
  }
  return Object.entries(value).filter(([key]) => !/ReviewedBasis|contextVersion/.test(key)).map(([key, entry]) => `${repositoryLabel(key)}: ${readableRepositoryValue(entry, level + 1)}`).join('\n\n');
}
export function projectRepositorySources(project: ResearchProject): AcademicPaper[] {
  const records: AcademicPaper[] = [...project.papers];
  const collect = (value: unknown, depth = 0) => {
    if (!value || typeof value !== 'object' || depth > 7) return;
    if (!Array.isArray(value) && typeof (value as AcademicPaper).id === 'string' && typeof (value as AcademicPaper).title === 'string' && Array.isArray((value as AcademicPaper).authors)) { records.push(value as AcademicPaper); return; }
    if (Array.isArray(value)) value.forEach(item => collect(item, depth + 1));
    else for (const [key, entry] of Object.entries(value)) if (/papers|source|candidate|claim|profile|record|retrieved/i.test(key)) collect(entry, depth + 1);
  };
  for (const [key, value] of Object.entries(project.tools)) if (/papers|testedClaims|profiles|searchResults|App.claims/i.test(key)) collect(value);
  for (const snapshot of project.repository?.history || []) if (/papers|testedClaims|profiles/i.test(snapshot.key)) collect(snapshot.value);
  const seen = new Set<string>();
  return records.filter(paper => { const key = (paper.doi || paper.id).toLowerCase().replace(/^https?:\/\/(?:dx\.)?doi.org\//, ''); if (seen.has(key)) return false; seen.add(key); return true; });
}
export function projectRepositoryItems(project: ResearchProject): ProjectRepositoryItem[] {
  const items: ProjectRepositoryItem[] = [];
  const add = (item: Omit<ProjectRepositoryItem, 'filename'>) => items.push({ ...item, filename: repositoryFilename(item.id) });
  const tools = project.tools;
  for (const file of project.files || []) add({ id: `file-${file.id}`, title: file.name, category: 'Original files', at: file.at, description: `${file.size.toLocaleString()} bytes · original imported file, retained automatically`, value: { id: file.id, name: file.name, mime: file.mime, size: file.size, at: file.at } });
  for (const tool of REPOSITORY_TOOLS) {
    const entries = Object.entries(tools).filter(([key]) => repositoryToolForKey(key)?.id === tool.id);
    if (!entries.some(([key, value]) => repositoryContentKey(key, value))) continue;
    const value = cleanRepositoryValue(Object.fromEntries(entries));
    let markdown: string | undefined;
    if (tool.id === 'funding' && tools['FundingFinder.profile']) markdown = fundingBrief(tools['FundingFinder.profile'] as FundingProfile, (tools['FundingFinder.runs'] as FundingRun[] | undefined)?.at(-1) || null, (tools['FundingFinder.opportunities'] || []) as FundingOpportunity[], (tools['FundingFinder.shortlist'] || []) as string[], (tools['FundingFinder.notes'] || {}) as Record<string, FundingNote>);
    if (tool.id === 'concept' && tools['ConceptStudio.study']) markdown = conceptBrief(tools['ConceptStudio.study'] as ConceptStudy, (tools['ConceptStudio.papers'] || []) as AcademicPaper[], (tools['ConceptStudio.searches'] || []) as DiscoveryBatch['searches']);
    if (tool.id === 'applications' && tools['ApplicationsPane.study']) markdown = applicationsBrief(tools['ApplicationsPane.study'] as ApplicationsStudy, (tools['ApplicationsPane.cards'] || []) as ApplicationCard[]);
    if (tool.id === 'counterevidence') markdown = counterevidenceBrief(String(tools['CounterevidencePane.proposition'] || ''), (tools['CounterevidencePane.papers'] || []) as AcademicPaper[], (tools['CounterevidencePane.reviews'] || {}) as Record<string, EvidenceReview>, (tools['CounterevidencePane.searches'] || []) as DiscoveryBatch['searches']);
    if (tool.id === 'instruments' && Array.isArray(tools['InstrumentFinderPane.profiles'])) markdown = instrumentComparison(tools['InstrumentFinderPane.profiles'] as InstrumentProfile[]);
    add({ id: `tool-${tool.id}`, title: tool.name, category: 'Tool work', tool: tool.id, at: project.repository?.updated[tool.id] || '', description: 'Current inputs, working drafts, results, and AI reviews retained automatically.', value, markdown });
  }
  const sourceIds = new Set(project.papers.map(paper => paper.id));
  for (const paper of projectRepositorySources(project)) add({ id: `source-${paper.id}`, title: paper.title, category: 'Sources', at: '', description: `${sourceIds.has(paper.id) ? 'In shared source library' : 'Retrieved in a tool; not screened or endorsed'} · ${paper.year || 'Year unknown'}`, value: paper, markdown: `# ${paper.title}\n\n${paper.authors.map(author => author.name).join(', ')}\n\n${paper.year || ''} · ${paper.venue || ''}\n\nDOI: ${paper.doi || 'Not supplied'}\nURL: ${paper.url || 'Not supplied'}\n\n## Supplied abstract\n${paper.abstract || 'Not supplied'}\n\nRetained metadata; finding a record does not establish a verified finding or peer review.\n` });
  for (const document of project.documents) add({ id: `document-${document.id}`, title: document.filename, category: 'Documents', at: document.importedAt, description: 'Retained extracted source text and page markers. See Original files for retained imports; older originals may be unavailable.', value: document, markdown: document.text });
  for (const version of project.versions) add({ id: `manuscript-${version.id}`, title: version.filename || 'Manuscript version', category: 'Manuscripts', tool: 'studio', at: version.at, description: version === project.versions.at(-1) ? 'Latest saved manuscript version' : 'Earlier manuscript version', value: version, markdown: version.text });
  const collections: [string, string, unknown][] = [
    ['question', 'Project question & protocol', { question: project.question, protocol: project.protocol, discipline: project.discipline, studyType: project.studyType }],
    ['evidence', 'Project evidence ledger', project.evidence], ['claims', 'Tracked claims & wording history', project.claims], ['screening', 'Screening decisions & adjudications', { decisions: project.screening, adjudications: project.adjudications }],
    ['decisions', 'Research decision record', project.decisions], ['searches', 'Logged review searches', project.searches], ['reporting', 'Reporting record', project.reporting],
    ['planning', 'Study planning results', tools['workspace.planningHistory'] || tools['workspace.planning']],
  ];
  for (const [id, title, value] of collections) {
    if (id === 'question' ? !project.question && !project.protocol : id === 'screening' ? !project.screening.length && !Object.keys(project.adjudications).length : !meaningful(value)) continue;
    add({ id, title, category: 'Evidence & decisions', at: '', description: 'Recorded project work; review statuses and limitations remain as recorded.', value: cleanRepositoryValue(value) });
  }
  const binder = tools.scholarforge_universal_binder;
  if (Array.isArray(binder)) for (const note of binder) add({ id: `binder-${note.id}`, title: note.title || 'Research note', category: 'Binder', at: '', description: `Clipped from ${note.sourcePillar || 'a research tool'}${note.metadata?.aiGenerated ? ' · AI-generated suggestion' : ''}`, value: cleanRepositoryValue(note), markdown: note.snippet });
  for (const snapshot of project.repository?.history || []) add({ id: `history-${snapshot.id}`, title: `${REPOSITORY_TOOLS.find(tool => tool.id === snapshot.tool)?.name || snapshot.tool} · ${snapshot.key.startsWith('checkpoint.') ? 'Working draft checkpoint' : repositoryLabel(snapshot.key)}`, category: 'Result history', tool: snapshot.tool, at: snapshot.at, description: 'Automatically retained work snapshot. Its original review status is preserved; it may no longer fit current inputs.', value: cleanRepositoryValue(snapshot) });
  return items.sort((a, b) => b.at.localeCompare(a.at) || a.title.localeCompare(b.title));
}
export function repositoryItemMarkdown(item: ProjectRepositoryItem): string {
  return item.markdown || `# ${item.title}\n\n${item.description}\n${item.at ? `\nSaved: ${item.at}\n` : ''}\n${readableRepositoryValue(item.value)}\n`;
}
export interface RepositoryDownload { path: string; content: string | Uint8Array }
export function repositoryDownloadFiles(project: ResearchProject, backup: string): RepositoryDownload[] {
  const items = projectRepositoryItems(project);
  const files: RepositoryDownload[] = [
    { path: 'Project-backup.json', content: backup },
    { path: 'README.md', content: `# ${project.name}\n\nProject repository exported ${new Date().toISOString()}.\n\nProject-backup.json is the complete restorable record, including tool state and automatically retained results. Individual folders contain readable records and complete JSON. Long readable lists are abbreviated; JSON retains every saved entry. Original-files contains retained imports. Older source imports may have extracted text only; originals cannot be recovered retroactively. Provider credentials are excluded. Retrieved sources, AI suggestions, and synthetic data retain their provisional roles; collection does not certify evidence.\n\n## Contents\n${items.map(item => `- ${item.category}: ${item.title}`).join('\n')}\n` },
  ];
  items.forEach((item, index) => { const base = `${repositoryFilename(item.category)}/${index + 1}-${item.filename}`; files.push({ path: `${base}.json`, content: JSON.stringify(item.value, null, 2) }); files.push({ path: `${base}.md`, content: repositoryItemMarkdown(item) }); });
  for (const [index, file] of (project.files || []).entries()) files.push({ path: `Original-files/${index + 1}-${repositoryFilename(file.name)}`, content: base64ToBytes(file.base64) });
  return files;
}
