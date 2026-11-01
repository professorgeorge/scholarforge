import { useState, type ReactNode } from 'react';
import type { AcademicPaper } from '../types/citation';
import { SCHOLARLY_SOURCES, type ScholarlySourceId, type ScholarlySourceSelection, scholarlySourceLabel } from '../services/scholarlySources';
import { safeResearchUrl, type DiscoveryBatch } from '../services/researchToolsService';
import './ResearchTools.css';

export function ResearchField({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return <label className="rt-field"><span>{label}</span>{children}{hint && <small>{hint}</small>}</label>;
}
export function ResearchSourcePicker({ value, onChange, disabled }: { value: ScholarlySourceSelection; onChange: (next: ScholarlySourceSelection) => void; disabled: boolean }) {
  return <details className="rt-card"><summary>Choose search sources ({Object.values(value).filter(Boolean).length} selected)</summary><div className="rt-grid rt-source-grid">{(Object.keys(SCHOLARLY_SOURCES) as ScholarlySourceId[]).map(id => <label key={id} className="rt-check"><input type="checkbox" checked={value[id]} disabled={disabled} onChange={event => onChange({ ...value, [id]: event.target.checked })} /><span>{SCHOLARLY_SOURCES[id].label}</span></label>)}</div><p className="rt-muted">Sources overlap. Semantic Scholar is optional; successful sources remain usable when another is unavailable.</p></details>;
}
export function ResearchSearchCoverage({ searches }: { searches: DiscoveryBatch['searches'] }) {
  if (!searches.length) return null;
  const incomplete = searches.some(search => search.statuses.some(source => /fail|unavailable|timed out|rate limited|paused/.test(source.status)));
  return <section aria-label="Search coverage" className="rt-card"><h3>Search coverage</h3><p className="rt-muted">Queries are discovery leads. Providers may simplify syntax; counts are bounded returned records, not exhaustive matches. {incomplete ? 'Some services were unavailable. No results does not establish absence of evidence.' : ''}</p>{searches.map((search, index) => <details key={index}><summary>{search.query}</summary><ul>{search.statuses.map(source => <li key={source.name}><strong>{scholarlySourceLabel(source.name)}</strong>: {source.status} · {source.count} records{source.detail && <span className="rt-muted"> — {source.detail}</span>}</li>)}</ul></details>)}</section>;
}
export function ResearchSelectedSource({ paper }: { paper: AcademicPaper }) {
  const url = safeResearchUrl(paper.url || (paper.doi ? `https://doi.org/${paper.doi}` : ''));
  return <details className="rt-record"><summary>Source text for this review</summary><p><strong>{paper.title}</strong></p>{url && <a href={url} target="_blank" rel="noreferrer">Open original source ↗</a>}<p className="rt-abstract">{paper.abstract || 'No abstract was supplied. Open the source and paste the relevant passage below.'}</p><p className="rt-muted">Supplied metadata/abstract; not independently appraised full text.</p></details>;
}
export function ResearchCandidates({ papers, activeId, onSelect, hints }: { papers: AcademicPaper[]; activeId: string; onSelect: (paper: AcademicPaper) => void; hints?: (paper: AcademicPaper) => string[] }) {
  const [page, setPage] = useState(0);
  const maxPage = Math.max(0, Math.ceil(papers.length / 6) - 1);
  const current = Math.min(page, maxPage);
  return <section className="rt-card"><h3>Candidate records ({papers.length})</h3><p className="rt-muted">Choose a record to inspect and document. Metadata and keyword hints do not establish validation, peer review, or the direction of findings.</p><div className="rt-stack">{papers.slice(current * 6, current * 6 + 6).map(paper => <article key={paper.id} className={`rt-record ${paper.id === activeId ? 'rt-selected' : ''}`}><label className="rt-radio-row"><input type="radio" name="research-record" checked={activeId === paper.id} onChange={() => onSelect(paper)} /><strong>{paper.title}</strong></label><p className="rt-muted">{paper.authors.slice(0, 3).map(author => author.name).join(', ') || 'Authors not supplied'} · {paper.year || 'Year unknown'} · {paper.venue || 'Venue not supplied'} · {scholarlySourceLabel(paper.source)}</p>{hints && <p className="rt-hints">{hints(paper).join(' · ') || 'No keyword lead detected. Read the source.'}</p>}<div className="rt-actions">{safeResearchUrl(paper.url || (paper.doi ? `https://doi.org/${paper.doi}` : '')) && <a href={safeResearchUrl(paper.url || `https://doi.org/${paper.doi}`)} target="_blank" rel="noreferrer">Open source ↗</a>}<button type="button" className="rt-secondary" onClick={() => onSelect(paper)}>Review this record</button></div><details><summary>Supplied abstract</summary><p className="rt-abstract">{paper.abstract || 'No abstract supplied by this source. Obtain the source text before interpreting its findings.'}</p></details></article>)}</div>{papers.length > 6 && <div className="rt-actions"><button type="button" className="rt-secondary" disabled={current === 0} onClick={() => setPage(current - 1)}>Previous records</button><span>Page {current + 1} of {maxPage + 1}</span><button type="button" className="rt-secondary" disabled={current === maxPage} onClick={() => setPage(current + 1)}>Next records</button></div>}</section>;
}
