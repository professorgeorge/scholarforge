import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { getActiveProjectId, initializeProjects, PROJECT_EVENT } from './services/projectService'

function ProjectRoot() {
  const [projectId, setProjectId] = useState(getActiveProjectId);
  useEffect(() => {
    const refresh = () => setProjectId(getActiveProjectId());
    window.addEventListener(PROJECT_EVENT, refresh);
    return () => window.removeEventListener(PROJECT_EVENT, refresh);
  }, []);
  return <App key={projectId} />;
}

const root = createRoot(document.getElementById('root')!);
root.render(<p role="status" style={{ padding: '2rem' }}>Opening your research workspace…</p>);
initializeProjects().then(() => root.render(<StrictMode><ProjectRoot /></StrictMode>)).catch(() => {
  root.render(<div role="alert" style={{ padding: '2rem' }}><h1>Research workspace could not open</h1><p>Browser storage may be full or unavailable. Your saved records have not been deleted. Enable browser storage and reload.</p></div>);
});
