import { useState } from 'react';
import { BookOpen, ChevronDown, FileText, RotateCcw } from 'lucide-react';
import type { ActiveManuscriptContext } from '../services/manuscriptParserService';
import type { AcademicPillar } from './Navbar';
import { EditorialReadinessModal } from './EditorialReadinessModal';
import { cleanAllUserData } from '../services/projectService';

interface ActiveManuscriptBarProps {
  manuscript: ActiveManuscriptContext | null;
  onClearManuscript: () => void;
  onNavigateToPillar: (pillar: AcademicPillar) => void;
}

/** The project stores all work; this strip identifies the one draft shared by manuscript tools. */
export function ActiveManuscriptBar({ manuscript, onClearManuscript, onNavigateToPillar }: ActiveManuscriptBarProps) {
  const [details, setDetails] = useState(false);
  const [checks, setChecks] = useState(false);

  const handleCleanAllUserData = async () => {
    if (window.confirm('Clean all user data? This will permanently wipe your drafts, cart papers, and binder clips while preserving your saved API keys and settings.')) {
      await cleanAllUserData();
      window.location.reload();
    }
  };

  if (!manuscript?.rawText.trim()) return null;
  return <section className="current-manuscript" aria-label="Current manuscript">
    <div className="current-manuscript-main">
      <FileText size={17} aria-hidden="true" />
      <div><span className="current-manuscript-label">Current manuscript</span><strong>{manuscript.title || manuscript.filename || 'Untitled draft'}</strong><small>{manuscript.wordCount.toLocaleString()} words · Used by writing and manuscript review tools</small></div>
      <div className="current-manuscript-actions">
        <button type="button" onClick={() => onNavigateToPillar('studio')}><BookOpen size={14} aria-hidden="true" />Open in Studio</button>
        <button type="button" aria-expanded={details} aria-controls="current-manuscript-details" onClick={() => setDetails(previous => !previous)}>About this draft<ChevronDown size={14} aria-hidden="true" /></button>
      </div>
    </div>
    {details && <div id="current-manuscript-details" className="current-manuscript-details">
      <p>This is the draft currently shared with Manuscript Studio, reference auditing, journal fit, writing utilities, and anonymization. Open another draft in Studio to change it.</p>
      <p>Your work is saved automatically. Using a draft here does not run an AI review or a reference check.</p>
      {manuscript.abstract && <details><summary>Parsed abstract</summary><p>{manuscript.abstract}</p></details>}
      <div className="current-manuscript-actions">
        <button type="button" onClick={() => setChecks(true)}>Submission checks</button>
        <button type="button" onClick={onClearManuscript}>Stop using this draft</button>
        <button type="button" onClick={handleCleanAllUserData} className="hover:text-red-700 dark:hover:text-red-400" title="Clean all research session drafts, cart papers, and binder clips while preserving saved settings">
          <RotateCcw size={13} aria-hidden="true" />
          Clean All User Data
        </button>
      </div>
    </div>}
    <EditorialReadinessModal isOpen={checks} onClose={() => setChecks(false)} manuscript={manuscript} onNavigateToPillar={onNavigateToPillar} />
  </section>;
}
