import { useState, useEffect, useRef, type ReactNode } from 'react';
import type { AcademicPaper } from '../types/citation';
import { useProjectState } from './useProjectState';
import { ReferenceImportPanel } from './ReferenceImportPanel';
import { ResearchSourcePicker, ResearchSearchCoverage, ResearchCandidates } from './ResearchToolsShared';
import { DEFAULT_SCHOLARLY_SOURCES } from '../services/scholarlySources';
import { searchResearchQueries, type DiscoveryBatch } from '../services/researchToolsService';
import { mergeDiscoveryPapers } from '../services/discoveryMergeService';
import { getProject } from '../services/projectService';

export function ResearchDiscovery({ prefix, queries, onSelect, activeId, hints, children }: { prefix: string; queries: string[]; onSelect: (paper: AcademicPaper) => void; activeId: string; hints?: (paper: AcademicPaper) => string[]; children?: ReactNode }) {
  const reviewRef = useRef<HTMLDivElement>(null);
  useEffect(() => { if (activeId) reviewRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' }); }, [activeId]);
  const [sources, setSources] = useProjectState(`${prefix}.sources`, DEFAULT_SCHOLARLY_SOURCES);
  const [papers, setPapers] = useProjectState<AcademicPaper[]>(`${prefix}.papers`, []);
  const [searches, setSearches] = useProjectState<DiscoveryBatch['searches']>(`${prefix}.searches`, []);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const append = (records: AcademicPaper[], origin: string) => { setPapers(previous => mergeDiscoveryPapers([...previous, ...records]).papers); setMessage(`${records.length} records loaded from ${origin}. Review their source text before interpreting findings.`); };
  return <>
    <ResearchSourcePicker value={sources} onChange={setSources} disabled={busy} />
    <div className="rt-actions"><button type="button" disabled={busy || !queries.some(query => query.trim())} onClick={async () => {
      setBusy(true); setError('');
      try { const result = await searchResearchQueries(queries, sources, setMessage); setPapers(previous => mergeDiscoveryPapers([...previous, ...result.papers]).papers); setSearches(previous => [...previous, ...result.searches]); setMessage(`${result.papers.length} records returned by this search. The candidate list retains earlier records and imports.`); }
      catch (failure) { setError(failure instanceof Error ? failure.message : 'Search failed.'); }
      finally { setBusy(false); }
    }}>{busy ? 'Searching sources…' : 'Search selected sources'}</button><button type="button" className="rt-secondary" disabled={busy} onClick={() => append(getProject()?.papers || [], 'this project')}>Use saved project sources</button></div>
    {message && <p className="rt-notice" role="status">{message}</p>}{error && <p className="rt-error" role="alert">{error}</p>}
    <ReferenceImportPanel disabled={busy} onImport={append} />
    <ResearchSearchCoverage searches={searches} />
    <div ref={reviewRef} style={{ scrollMarginTop: '7rem' }}>{children}</div>
    <ResearchCandidates papers={papers} activeId={activeId} onSelect={onSelect} hints={hints} />
  </>;
}
