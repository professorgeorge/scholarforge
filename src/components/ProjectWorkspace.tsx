import { useEffect, useMemo, useRef, useState } from 'react';
import { Archive, ArrowUpRight, ChevronDown, Download, FileText, FolderOpen, Search, X } from 'lucide-react';
import type { AcademicPillar } from './Navbar';
import type { LLMConfig } from '../services/llmService';
import { ResearchWorkbench } from './ResearchWorkbench';
import { createProject, downloadFile, exportProjectBackup, getProject, getProjects, getStorageError, importProjectBackup, PROJECT_EVENT, selectProject, updateProject } from '../services/projectService';
import { projectRepositoryItems, projectRepositorySources, repositoryDownloadFiles, repositoryFilename, repositoryItemMarkdown, type ProjectRepositoryItem, type RepositoryCategory } from '../services/projectRepositoryService';
import { repositoryContentKey, repositoryToolForKey } from '../services/projectRepositoryRegistry';
import { projectZip, downloadProjectZip } from '../services/projectZipService';
import { generateRIS } from '../services/risExporter';
import { generateBibtexEntry } from '../services/citationFormatter';
import { exportCslJson } from '../services/libraryInteropService';
import { downloadRetainedFile } from '../services/projectFileService';
import './ProjectWorkspace.css';
import './ProjectRepository.css';

const categories: ('All records' | RepositoryCategory)[] = ['All records', 'Tool work', 'Sources', 'Original files', 'Documents', 'Manuscripts', 'Evidence & decisions', 'Binder', 'Result history'];
type Props = { navigate: (pillar: AcademicPillar) => void; restoreManuscript: (text: string, filename?: string) => void; llmConfig: LLMConfig; manuscriptRequest: number };
const date = (value: string) => value && Number.isFinite(Date.parse(value)) ? new Date(value).toLocaleString() : 'Saved before activity tracking';

export function ProjectWorkspace({ navigate, restoreManuscript, llmConfig, manuscriptRequest }: Props) {
  const [project, setProject] = useState(() => getProject()!);
  const [open, setOpen] = useState(false);
  const [workbench, setWorkbench] = useState(false);
  const [category, setCategory] = useState<typeof categories[number]>('All records');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);
  const [selectedId, setSelectedId] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const preview = useRef<HTMLHeadingElement>(null);
  useEffect(() => { if (manuscriptRequest) { setWorkbench(false); setOpen(true); setCategory('Manuscripts'); setPage(0); requestAnimationFrame(() => document.getElementById('project-repository-details')?.scrollIntoView({ block: 'start', behavior: 'smooth' })); } }, [manuscriptRequest]);
  useEffect(() => {
    const refresh = () => { const current = getProject(); if (current) setProject(current); };
    window.addEventListener(PROJECT_EVENT, refresh);
    return () => window.removeEventListener(PROJECT_EVENT, refresh);
  }, []);
  const activeTools = useMemo(() => new Set(Object.entries(project.tools).filter(([key, value]) => repositoryContentKey(key, value)).map(([key]) => repositoryToolForKey(key)!.id)), [project.tools]);
  const items = useMemo(() => open ? projectRepositoryItems(project) : [], [project, open]);
  const filtered = items.filter(item => (category === 'All records' || item.category === category) && `${item.title} ${item.description} ${item.category}`.toLowerCase().includes(query.trim().toLowerCase()));
  const maxPage = Math.max(0, Math.ceil(filtered.length / 12) - 1);
  const currentPage = Math.min(page, maxPage);
  const selected = items.find(item => item.id === selectedId);
  const selectedFile = selected?.category === 'Original files' ? project.files?.find(file => `file-${file.id}` === selected.id) : undefined;
  const previewText = selected ? repositoryItemMarkdown(selected) : '';
  const inspect = (item: ProjectRepositoryItem) => { setSelectedId(item.id); requestAnimationFrame(() => preview.current?.focus()); };
  const resume = (tool: string) => { setOpen(false); navigate(tool as AcademicPillar); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const downloadAll = async () => {
    if (busy) return;
    setBusy(true); setNotice('Preparing your project download…');
    try {
      await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
      const current = getProject()!;
      const files = repositoryDownloadFiles(current, exportProjectBackup(current));
      const sources = projectRepositorySources(current);
      if (sources.length) files.push({ path: 'Sources/All-sources.ris', content: generateRIS(sources) }, { path: 'Sources/All-sources.bib', content: sources.map(paper => generateBibtexEntry(paper)).join('\n\n') }, { path: 'Sources/All-sources.csl.json', content: exportCslJson(sources) });
      downloadProjectZip(`${repositoryFilename(current.name)}-project.zip`, projectZip(files));
      setNotice('Project ZIP prepared: restorable backup, complete saved records, and readable downloads.');
    } catch (failure) { setNotice(`Could not prepare ZIP: ${failure instanceof Error ? failure.message : 'Unknown error'}. Use Download backup JSON instead.`); }
    finally { setBusy(false); }
  };

  if (workbench) return <ResearchWorkbench navigate={navigate} restoreManuscript={restoreManuscript} llmConfig={llmConfig} onClose={() => { setWorkbench(false); setOpen(true); }} />;
  return <section className="sf-workspace project-repository" aria-label="Project repository">
    <div className="sf-project-bar">
      <div className="sf-project-identity"><FolderOpen aria-hidden="true" /><span className="sf-project-label">Project</span><strong>{project.name}</strong><span className="repo-bar-summary">{activeTools.size ? `${activeTools.size} ${activeTools.size === 1 ? 'tool' : 'tools'} with saved work` : 'Work is collected automatically'}</span></div>
      <button type="button" className="sf-project-toggle" aria-expanded={open} aria-controls="project-repository-details" onClick={() => setOpen(previous => !previous)}>Project repository<ChevronDown aria-hidden="true" className={open ? 'sf-chevron-open' : undefined} /></button>
    </div>
    {getStorageError() && <p role="alert" className="sf-alert">{getStorageError()}</p>}
    {open && <div id="project-repository-details" className="sf-workspace-body sf-stack">
      <header className="repo-heading">
        <div><p className="repo-eyebrow">Collected as you work</p><h2>Your project, together</h2><p>Find drafts, sources, results, and AI reviews from every tool here. Work is saved automatically in the active project.</p></div>
        <div className="sf-actions"><button type="button" disabled={busy} onClick={() => void downloadAll()}><Archive size={16} aria-hidden="true" />{busy ? 'Preparing download…' : 'Download complete project'}</button><button type="button" className="sf-secondary" onClick={() => downloadFile(`${repositoryFilename(project.name)}-backup.json`, exportProjectBackup(getProject()!), 'application/json')}>Download backup JSON</button></div>
      </header>
      <div className="repo-project-controls">
        <label className="sf-field"><span>Active project</span><select value={project.id} onChange={event => { setSelectedId(''); setPage(0); selectProject(event.target.value); }}>{getProjects().map(entry => <option key={entry.id} value={entry.id}>{entry.name}</option>)}</select></label>
        <p><span className="repo-saved-dot" />Saved on this browser · last updated {date(project.updatedAt)}<small>Each project keeps its own work. Downloads stay on your device; there is no automatic cloud sync.</small></p>
      </div>
      <div className="repo-summary-grid">{[
        ['Tool work', activeTools.size, 'tools with saved work'], ['Sources', items.filter(item => item.category === 'Sources').length, 'sources retained'], ['Manuscripts', project.versions.length, 'manuscript versions'], ['Result history', project.repository?.history.length || 0, 'result snapshots'],
      ].map(([value, count, label]) => <button type="button" key={value} className="sf-secondary" onClick={() => { setCategory(value as RepositoryCategory); setPage(0); }}><strong>{count}</strong><span>{label}</span></button>)}</div>
      <div className="repo-toolbar">
        <label className="sf-field"><span>Find saved work</span><div className="repo-search"><Search size={16} aria-hidden="true" /><input type="search" value={query} onChange={event => { setQuery(event.target.value); setPage(0); }} placeholder="Search titles, tools, and record types" /></div></label>
        <label className="sf-field"><span>Show</span><select value={category} onChange={event => { setCategory(event.target.value as typeof category); setPage(0); }}>{categories.map(value => <option key={value} value={value}>{value} ({value === 'All records' ? items.length : items.filter(item => item.category === value).length})</option>)}</select></label>
      </div>
      {!items.length ? <section className="repo-empty"><FolderOpen size={30} aria-hidden="true" /><h3>Your project collection starts with your work</h3><p>Describe a research idea, search for literature, draft a manuscript, or use another tool. Your inputs and results will appear here automatically—there is no separate upload or filing step.</p><div className="sf-actions"><button type="button" onClick={() => resume('concept')}>Develop a research idea</button><button type="button" className="sf-secondary" onClick={() => resume('literature')}>Find literature</button></div></section> : <>
        <div className="repo-list-heading"><h3>{category}</h3><span>{filtered.length} records{query ? ` matching “${query}”` : ''}</span></div>
        {!filtered.length && <p className="repo-empty">No saved records match this view. Try another category or search term.</p>}
        <div className="repo-record-grid">{filtered.slice(currentPage * 12, currentPage * 12 + 12).map(item => <article className={`repo-record ${item.id === selectedId ? 'repo-selected' : ''}`} key={item.id}>
          <div className="repo-record-type"><FileText size={15} aria-hidden="true" />{item.category}</div><h4>{item.title}</h4><p>{item.description}</p>{item.at && <small>{date(item.at)}</small>}
          <div className="sf-actions"><button type="button" className="sf-secondary" onClick={() => inspect(item)}>Preview</button>{item.category === 'Original files' ? <button type="button" className="sf-secondary" onClick={() => { const file = project.files?.find(entry => `file-${entry.id}` === item.id); if (file) downloadRetainedFile(file); }}>Download original</button> : <button type="button" className="sf-secondary" aria-label={`Download ${item.title} JSON`} onClick={() => downloadFile(`${item.filename}.json`, JSON.stringify(item.value, null, 2), 'application/json')}><Download size={14} aria-hidden="true" />JSON</button>}{item.tool && item.category === 'Tool work' && <button type="button" className="sf-secondary" onClick={() => resume(item.tool!)}>Continue<ArrowUpRight size={14} aria-hidden="true" /></button>}</div>
        </article>)}</div>
        {maxPage > 0 && <div className="sf-actions repo-pagination"><button type="button" className="sf-secondary" disabled={!currentPage} onClick={() => setPage(currentPage - 1)}>Previous records</button><span>Page {currentPage + 1} of {maxPage + 1}</span><button type="button" className="sf-secondary" disabled={currentPage === maxPage} onClick={() => setPage(currentPage + 1)}>Next records</button></div>}
      </>}
      {selected && <section className="repo-preview" aria-label="Saved record preview"><div className="repo-list-heading"><h3 ref={preview} tabIndex={-1}>{selected.title}</h3><button type="button" className="sf-secondary" aria-label="Close saved record preview" onClick={() => setSelectedId('')}><X size={16} aria-hidden="true" /></button></div><p>{selected.description}</p><pre>{previewText.slice(0, 16000)}{previewText.length > 16000 ? '\n\nPreview shortened. Download the record for more detail.' : ''}</pre><div className="sf-actions">{selected.category === 'Manuscripts' && <button type="button" onClick={() => { const version = project.versions.find(entry => `manuscript-${entry.id}` === selected.id); if (version) { restoreManuscript(version.text, version.filename); setNotice('This saved version is now the current manuscript.'); } }}>Use as current manuscript</button>}{selectedFile && <button type="button" onClick={() => downloadRetainedFile(selectedFile)}>Download original file</button>}<button type="button" onClick={() => downloadFile(`${selected.filename}.md`, previewText, 'text/markdown')}>Download readable record</button><button type="button" className="sf-secondary" onClick={() => downloadFile(`${selected.filename}.json`, JSON.stringify(selected.value, null, 2), 'application/json')}>Download complete record JSON</button></div></section>}
      <section className="repo-footer-grid"><div><h3>Research workbench</h3><p>For logged review searches, screening, evidence entry, study planning, reporting, and research decisions. Its records also appear in this repository.</p><button type="button" className="sf-secondary" onClick={() => setWorkbench(true)}>Open research workbench<ArrowUpRight size={15} aria-hidden="true" /></button></div><div><h3>What is retained?</h3><p>Current tool inputs and drafts, retrieved source metadata, generated results, AI reviews, manuscript versions, and project records. New result snapshots are kept when outputs change. New document imports retain the original file as well as extracted text. Older imports may contain extracted text only.</p><p>Collection preserves the status of the work. Retrieved records remain candidates, AI text remains suggestions, and synthetic data remains artificial.</p></div></section>
      <details className="repo-management"><summary>Project settings & recovery</summary><div className="repo-settings sf-stack">
        <label className="sf-field"><span>Project name</span><input key={project.id} defaultValue={project.name} onBlur={event => { const name = event.target.value.trim(); if (name && name !== project.name) updateProject({ name }); }} /></label>
        <form onSubmit={event => { event.preventDefault(); const name = String(new FormData(event.currentTarget).get('name') || '').trim(); if (name) { const created = createProject(name); selectProject(created.id); } }}><label className="sf-field"><span>Create another project</span><input name="name" required placeholder="Project name" /></label><button type="submit" className="sf-secondary">Create project</button></form>
        <label className="sf-field"><span>Restore a downloaded backup as a separate project</span><input type="file" accept=".json" onChange={async event => { const file = event.target.files?.[0]; event.target.value = ''; if (!file) return; try { const copy = importProjectBackup(await file.text()); selectProject(copy.id); } catch (failure) { setNotice(failure instanceof Error ? failure.message : 'Could not restore this backup.'); } }} /></label>
        <p>Restoration creates a copy. Your current project remains intact. Project backups include your research material and omit provider credentials.</p>
      </div></details>
      {notice && <p role="status" className="sf-notice">{notice}</p>}
    </div>}
  </section>;
}
