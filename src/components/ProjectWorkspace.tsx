import { useEffect, useState } from 'react';
import { BrushCleaning, FolderOpen } from 'lucide-react';
import type { AcademicPillar } from './Navbar';
import type { LLMConfig } from '../services/llmService';
import { ResearchWorkbench } from './ResearchWorkbench';
import { cleanUpProject, downloadFile, exportProjectBackup, getProject, getStorageError, PROJECT_EVENT, updateProject } from '../services/projectService';
import './ProjectWorkspace.css';

type Props = { navigate: (pillar: AcademicPillar) => void; restoreManuscript: (text: string, filename?: string) => void; llmConfig: LLMConfig };
export function ProjectWorkspace({ navigate, restoreManuscript, llmConfig }: Props) {
  const [project, setProject] = useState(() => getProject()!);
  const [cleanup, setCleanup] = useState(false);
  const [workbench, setWorkbench] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    const refresh = () => { const current = getProject(); if (current) setProject(current); };
    window.addEventListener(PROJECT_EVENT, refresh);
    return () => window.removeEventListener(PROJECT_EVENT, refresh);
  }, []);
  const clear = async (scope: 'literature' | 'all') => {
    if (!confirm(scope === 'literature' ? 'Delete literature searches, results, AI literature reviews, research cart, binder clips, and linked screening and evidence records? Your current manuscript and other tool work will remain.' : 'Delete all current work, including drafts, results, reviews, sources, and binder clips? Project details and provider settings will remain.')) return;
    setBusy(true);
    try { await cleanUpProject(scope); window.location.reload(); }
    catch { setError('Cleanup could not finish. Please try again.'); setBusy(false); }
  };
  return <section className="sf-workspace" aria-label="Current project">
    <div className="sf-project-bar">
      <div className="sf-project-identity"><FolderOpen aria-hidden="true" /><label>Current project <input aria-label="Project name" key={project.id} defaultValue={project.name} onBlur={event => { const name = event.target.value.trim(); if (name) updateProject({ name }); }} /></label></div>
      <div className="sf-actions"><button type="button" className="sf-secondary" onClick={() => setWorkbench(!workbench)}>Research workbench</button><button type="button" aria-expanded={cleanup} aria-controls="app-cleanup" onClick={() => setCleanup(!cleanup)}><BrushCleaning size={16} aria-hidden="true" /> Clean up app</button></div>
    </div>
    {getStorageError() && <p role="alert" className="sf-alert">{getStorageError()}</p>}
    {cleanup && <div id="app-cleanup" className="sf-workspace-body sf-stack">
      <h2>Clean up app</h2><p>Only your current project is saved in this browser. Clear work you no longer need to free storage. Cleanup reloads the app and cannot be undone; download a backup first if needed.</p>
      <div className="sf-actions"><button type="button" className="sf-secondary" disabled={busy} onClick={() => downloadFile('ScholarForge-current-project.json', exportProjectBackup(getProject()!), 'application/json')}>Download current work</button></div>
      <h3>Literature work</h3><p>Remove literature searches, results, AI literature reviews, cart papers, binder clips, and linked evidence and screening records. Keep your current manuscript and other tool work.</p>
      <div className="sf-actions"><button type="button" disabled={busy} onClick={() => void clear('literature')}>Clear literature work</button></div>
      <h3>Start fresh</h3><p>Remove all current drafts, tool inputs, results, reviews, sources, and research records. Keep project details and provider settings.</p>
      <div className="sf-actions"><button type="button" disabled={busy} onClick={() => void clear('all')}>{busy ? 'Cleaning up...' : 'Clear all current work'}</button></div>
      {error && <p role="alert">{error}</p>}
    </div>}
    {workbench && <ResearchWorkbench navigate={navigate} restoreManuscript={restoreManuscript} llmConfig={llmConfig} onClose={() => setWorkbench(false)} />}
  </section>;
}
