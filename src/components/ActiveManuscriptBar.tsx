import { useState } from 'react';
import { BookOpen, ChevronDown, FileText } from 'lucide-react';
import type { ActiveManuscriptContext } from '../services/manuscriptParserService';
import type { AcademicPillar } from './Navbar';
import { EditorialReadinessModal } from './EditorialReadinessModal';

interface ActiveManuscriptBarProps {
  manuscript: ActiveManuscriptContext | null;
  onClearManuscript: () => void;
  onNavigateToPillar: (pillar: AcademicPillar) => void;
  onViewVersions: () => void;
}

/** The project stores all work; this strip identifies the one draft shared by manuscript tools. */
export function ActiveManuscriptBar({ manuscript, onClearManuscript, onNavigateToPillar, onViewVersions }: ActiveManuscriptBarProps) {
  const [details, setDetails] = useState(false);
  const [checks, setChecks] = useState(false);
  if (!manuscript?.rawText.trim()) return null;
  return <section className="current-manuscript" aria-label="Current manuscript">
    <div className="current-manuscript-main">
      <FileText size={17} aria-hidden="true" />
      <div><span className="current-manuscript-label">Current manuscript</span><strong>{manuscript.title || manuscript.filename || 'Untitled draft'}</strong><small>{manuscript.wordCount.toLocaleString()} words · Used by writing and manuscript review tools</small></div>
      <div className="current-manuscript-actions">
        <button type="button" onClick={() => onNavigateToPillar('studio')}><BookOpen size={14} aria-hidden="true" />Open in Studio</button>
        <button type="button" onClick={onViewVersions}>Saved versions</button>
        <button type="button" aria-expanded={details} aria-controls="current-manuscript-details" onClick={() => setDetails(previous => !previous)}>About this draft<ChevronDown size={14} aria-hidden="true" /></button>
      </div>
    </div>
    {details && <div id="current-manuscript-details" className="current-manuscript-details">
      <p>This is the draft currently shared with Manuscript Studio, reference auditing, journal fit, writing utilities, and anonymization. Choose a saved version in the project repository or open another draft in Studio to change it.</p>
      <p>The project repository keeps your drafts, versions, and other research work together. Using a draft here does not run an AI review or a reference check.</p>
      {manuscript.abstract && <details><summary>Parsed abstract</summary><p>{manuscript.abstract}</p></details>}
      <div className="current-manuscript-actions"><button type="button" onClick={() => setChecks(true)}>Submission checks</button><button type="button" onClick={onClearManuscript}>Stop using this draft</button><span>Saved versions remain in the project repository.</span></div>
    </div>}
    <EditorialReadinessModal isOpen={checks} onClose={() => setChecks(false)} manuscript={manuscript} onNavigateToPillar={onNavigateToPillar} />
  </section>;
}
