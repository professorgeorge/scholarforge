import React from 'react';
import { 
  X, Trash2, FileSpreadsheet
} from 'lucide-react';
import type { ReviewerCandidate, SearchObjective } from '../types/expertSearch';
import { 
  exportToScholarOneCsv, 
  exportToEditorialManagerCsv, 
  exportToNihNsfDossierCsv,
  exportToCoauthorRosterCsv,
  exportToConsultingBriefCsv,
  exportToJson
} from '../services/expertExportUtils';

interface RosterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  shortlistedCandidates: ReviewerCandidate[];
  onRemoveFromShortlist: (id: string) => void;
  onClearShortlist: () => void;
  objective: SearchObjective;
}

export const RosterDrawer: React.FC<RosterDrawerProps> = ({
  isOpen,
  onClose,
  shortlistedCandidates,
  onRemoveFromShortlist,
  onClearShortlist,
  objective
}) => {
  if (!isOpen) return null;

  const handleExportDefault = () => {
    switch (objective) {
      case 'grant_coi':
        exportToNihNsfDossierCsv(shortlistedCandidates);
        break;
      case 'coauthor':
        exportToCoauthorRosterCsv(shortlistedCandidates);
        break;
      case 'consultant':
        exportToConsultingBriefCsv(shortlistedCandidates);
        break;
      case 'reviewer':
      default:
        exportToScholarOneCsv(shortlistedCandidates);
        break;
    }
  };

  const getObjectiveExportTitle = () => {
    switch (objective) {
      case 'grant_coi': return 'Download NIH / NSF Consortium Dossier (.csv)';
      case 'coauthor': return 'Download Co-Author Collaboration Roster (.csv)';
      case 'consultant': return 'Download Advisory Briefing Dossier (.csv)';
      case 'reviewer':
      default: return 'Download ScholarOne Reviewer Roster (.csv)';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-md h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden text-slate-900 dark:text-slate-100">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-900 dark:bg-blue-800 text-white flex items-center justify-center font-bold text-xs">
              {shortlistedCandidates.length}
            </div>
            <div>
              <h3 className="text-sm font-bold font-serif text-slate-900 dark:text-white">
                Saved Expert Roster
              </h3>
              <p className="text-[11px] text-slate-500 font-sans">
                {shortlistedCandidates.length} candidate{shortlistedCandidates.length === 1 ? '' : 's'} shortlisted
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Candidate List */}
        <div className="p-4 flex-1 overflow-y-auto space-y-3">
          {shortlistedCandidates.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-300 dark:border-slate-800 rounded-xl my-6">
              No candidates shortlisted yet. Click "Add to Roster" on any expert card to save them here for export.
            </div>
          ) : (
            shortlistedCandidates.map((c) => (
              <div
                key={c.id}
                className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-2 text-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-bold font-serif text-slate-900 dark:text-white text-xs">
                      {c.name}
                    </h4>
                    <p className="text-[11px] text-slate-500 line-clamp-1">
                      {c.primaryInstitution}
                    </p>
                  </div>

                  <button
                    onClick={() => onRemoveFromShortlist(c.id)}
                    className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                    title="Remove from roster"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center justify-between text-[11px] font-sans pt-1 border-t border-slate-100 dark:border-slate-800/80">
                  <span className="font-semibold text-blue-900 dark:text-blue-400 font-mono">
                    Score: {c.readinessScore} / 100
                  </span>
                  {c.email ? (
                    <span className="text-emerald-700 dark:text-emerald-400 font-mono truncate max-w-[170px]">
                      {c.email}
                    </span>
                  ) : (
                    <span className="text-slate-400 italic">No email</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Actions */}
        {shortlistedCandidates.length > 0 && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 space-y-2.5">
            <button
              onClick={handleExportDefault}
              className="w-full py-2.5 px-4 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-xs transition cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-amber-300" />
              <span>{getObjectiveExportTitle()}</span>
            </button>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <button
                onClick={() => exportToEditorialManagerCsv(shortlistedCandidates)}
                className="py-1.5 px-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium text-slate-700 dark:text-slate-300 transition cursor-pointer text-center"
              >
                Editorial Manager CSV
              </button>

              <button
                onClick={() => exportToJson(shortlistedCandidates)}
                className="py-1.5 px-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium text-slate-700 dark:text-slate-300 transition cursor-pointer text-center"
              >
                Export JSON Dossier
              </button>
            </div>

            <button
              onClick={onClearShortlist}
              className="w-full text-center text-xs text-rose-600 hover:underline pt-1 cursor-pointer font-medium"
            >
              Clear Entire Roster
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
