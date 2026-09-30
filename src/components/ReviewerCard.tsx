import React, { useState } from 'react';
import { 
  CheckSquare, Square, Mail, Copy, Check, 
  ExternalLink, Send, ChevronDown, ChevronUp, BookOpen, Info, AlertTriangle,
  Bookmark, EyeOff, Award, FileEdit, Briefcase, ShieldCheck, BookmarkPlus
} from 'lucide-react';
import type { ReviewerCandidate, SearchObjective } from '../types/expertSearch';
import type { AcademicPaper } from '../types/citation';
import { addPaperToCart } from '../services/cartService';

interface ReviewerCardProps {
  candidate: ReviewerCandidate;
  isSelected: boolean;
  isShortlisted?: boolean;
  objective?: SearchObjective;
  onToggleSelect: () => void;
  onToggleShortlist?: () => void;
  onExcludeCandidate?: () => void;
  onOpenOutreach: (candidate: ReviewerCandidate) => void;
}

export const ReviewerCard: React.FC<ReviewerCardProps> = ({
  candidate,
  isSelected,
  isShortlisted = false,
  objective = 'reviewer',
  onToggleSelect,
  onToggleShortlist,
  onExcludeCandidate,
  onOpenOutreach
}) => {
  const [showDossier, setShowDossier] = useState(false);
  const [showScoreInfo, setShowScoreInfo] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [coiDismissed, setCoiDismissed] = useState(false);
  const [cartSaved, setCartSaved] = useState(false);

  const handleCopyEmail = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (candidate.email) {
      navigator.clipboard.writeText(candidate.email);
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2000);
    }
  };

  const handleSaveTopWorkToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    const topWork = candidate.sampleWorks[0];
    if (!topWork) return;

    const paper: AcademicPaper = {
      id: topWork.id || `paper-${Date.now()}`,
      title: topWork.title,
      authors: [{ name: candidate.name }],
      year: topWork.publication_year,
      venue: topWork.venue || 'Academic Journal',
      doi: topWork.doi || '',
      url: topWork.doi ? `https://doi.org/${topWork.doi}` : '',
      citationCount: topWork.cited_by_count,
      abstract: topWork.abstract || '',
      openAccess: topWork.is_oa,
      openAccessPdf: topWork.oa_url || undefined,
      source: 'openalex'
    };

    addPaperToCart(paper);
    setCartSaved(true);
    setTimeout(() => setCartSaved(false), 2200);
  };

  const getObjectiveActionDetails = () => {
    switch (objective) {
      case 'grant_coi':
        return {
          scoreLabel: 'Grant Fit Score (GFS)',
          actionBtnText: 'Draft Grant Pitch',
          actionIcon: <Award className="w-3.5 h-3.5 text-amber-500" />,
          badgeColor: 'bg-amber-50 text-amber-900 border-amber-300 dark:bg-amber-950 dark:text-amber-300',
          coiBannerTitle: 'Team / Institutional Overlap Note:',
          coiBannerDesc: 'Identifies if candidate is affiliated with current submitting institutions or listed PIs.'
        };
      case 'coauthor':
        return {
          scoreLabel: 'Synergy Score',
          actionBtnText: 'Invite Co-Author',
          actionIcon: <FileEdit className="w-3.5 h-3.5 text-emerald-500" />,
          badgeColor: 'bg-emerald-50 text-emerald-900 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300',
          coiBannerTitle: 'Existing Co-Authorship Note:',
          coiBannerDesc: 'Identifies previous joint publishing history with listed authors.'
        };
      case 'consultant':
        return {
          scoreLabel: 'Advisory Authority Score',
          actionBtnText: 'Consulting Inquiry',
          actionIcon: <Briefcase className="w-3.5 h-3.5 text-blue-500" />,
          badgeColor: 'bg-blue-50 text-blue-900 border-blue-300 dark:bg-blue-950 dark:text-blue-300',
          coiBannerTitle: 'Organizational Overlap Note:',
          coiBannerDesc: 'Verifies whether candidate has concurrent institutional commitments.'
        };
      case 'reviewer':
      default:
        return {
          scoreLabel: 'Reviewer Readiness Score (RRS)',
          actionBtnText: 'Invite Referee',
          actionIcon: <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />,
          badgeColor: 'bg-indigo-50 text-indigo-900 border-indigo-300 dark:bg-indigo-950 dark:text-indigo-300',
          coiBannerTitle: 'Potential Conflict of Interest (COI):',
          coiBannerDesc: 'Candidate shares recent co-authorship or institutional affiliation with the author team.'
        };
    }
  };

  const actionDetails = getObjectiveActionDetails();

  return (
    <div
      className={`academic-card rounded-2xl border transition-all p-5 shadow-xs ${
        isSelected
          ? 'bg-blue-50/60 dark:bg-blue-950/40 border-blue-500 dark:border-blue-500 shadow-md ring-1 ring-blue-500'
          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
      }`}
    >
      {/* COI Warning Banner */}
      {candidate.coiStatus.hasCoi && !coiDismissed && (
        <div className="mb-4 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-xs text-rose-900 dark:text-rose-200 flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold font-serif">{actionDetails.coiBannerTitle}</div>
              <p className="mt-0.5 text-[11px] leading-relaxed text-rose-800 dark:text-rose-300">
                {candidate.coiStatus.reasons.join(' ')}
              </p>
            </div>
          </div>
          <button
            onClick={() => setCoiDismissed(true)}
            className="text-[11px] font-semibold text-rose-600 hover:underline shrink-0 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Card Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        
        {/* Left: Checkbox + Name + Affiliation */}
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <button
            type="button"
            onClick={onToggleSelect}
            className="mt-1 text-slate-400 hover:text-blue-800 dark:hover:text-blue-400 cursor-pointer shrink-0"
          >
            {isSelected ? (
              <CheckSquare className="w-5 h-5 text-blue-800 dark:text-blue-400" />
            ) : (
              <Square className="w-5 h-5" />
            )}
          </button>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-bold font-serif text-slate-900 dark:text-white break-words">
                {candidate.name}
              </h3>

              {candidate.orcid && (
                <a
                  href={`https://orcid.org/${candidate.orcid}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:underline flex items-center gap-0.5"
                  title="Verified ORCID Profile"
                >
                  <span>iD</span>
                </a>
              )}

              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${actionDetails.badgeColor}`}>
                {candidate.objectiveFitBadge || candidate.careerStage}
              </span>

              {candidate.countryCode && (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  {candidate.countryCode}
                </span>
              )}
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-sans">
              <strong>{candidate.primaryInstitution}</strong>
            </p>

            {candidate.objectiveFitSummary && (
              <p className="text-xs text-blue-900/80 dark:text-blue-300/80 italic mt-1 font-serif">
                "{candidate.objectiveFitSummary}"
              </p>
            )}
          </div>
        </div>

        {/* Right: Score Gauge */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-sans">
              {actionDetails.scoreLabel}
            </div>
            <div className="text-2xl font-black font-mono text-slate-900 dark:text-white flex items-center justify-end gap-1">
              <span>{candidate.readinessScore}</span>
              <span className="text-xs font-normal text-slate-400">/ 100</span>
            </div>
            <div className="text-[10px] font-semibold text-slate-500 mt-0.5">
              Turnaround: <strong>{candidate.acceptanceLikelihood}</strong>
            </div>
          </div>
        </div>

      </div>

      {/* Metric Pills & Contact Bar */}
      <div className="py-3 flex flex-wrap items-center justify-between gap-3 text-xs border-b border-slate-100 dark:border-slate-800 font-sans">
        
        {/* Metric Pills */}
        <div className="flex flex-wrap items-center gap-3 text-slate-600 dark:text-slate-400">
          <span>h-index: <strong>~{candidate.hIndexEst}</strong></span>
          <span>•</span>
          <span>Recent cites: <strong>{candidate.totalRecentCitations.toLocaleString()}</strong></span>
          <span>•</span>
          <span>Recent works: <strong>{candidate.totalRecentWorksCount}</strong></span>
          <span>•</span>
          <span className="italic">{candidate.publicationVelocity}</span>
        </div>

        {/* Email Address & Copy */}
        <div className="flex items-center gap-2">
          {candidate.email ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50/80 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-950 dark:text-emerald-300">
              <Mail className="w-3.5 h-3.5 text-emerald-600" />
              <span className="font-mono text-xs font-medium">{candidate.email}</span>
              <button
                type="button"
                onClick={handleCopyEmail}
                className="ml-1 text-emerald-700 hover:text-emerald-900 dark:text-emerald-400 cursor-pointer"
                title="Copy email to clipboard"
              >
                {copiedEmail ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          ) : (
            <span className="text-slate-400 italic text-[11px]">
              Email via institutional affiliation
            </span>
          )}
        </div>

      </div>

      {/* Expandable Representative Works & Score Breakdown */}
      <div className="pt-3">
        <div className="flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={() => setShowDossier(!showDossier)}
            className="text-blue-900 dark:text-blue-400 font-bold font-serif hover:underline flex items-center gap-1 cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>{showDossier ? 'Hide Representative Publications' : `View ${candidate.sampleWorks.length} Representative Publications`}</span>
            {showDossier ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          <button
            type="button"
            onClick={() => setShowScoreInfo(!showScoreInfo)}
            className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 text-[11px] flex items-center gap-1 cursor-pointer"
          >
            <Info className="w-3 h-3" />
            <span>Score Breakdown</span>
          </button>
        </div>

        {/* Score Breakdown Drawer */}
        {showScoreInfo && candidate.objectiveBreakdown && (
          <div className="mt-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2 animate-in fade-in duration-150">
            <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider font-serif">
              Multi-Objective Fit Score Breakdown:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {candidate.objectiveBreakdown.map((dim) => (
                <div key={dim.key} className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between font-semibold">
                    <span>{dim.label}</span>
                    <span className="font-mono text-blue-900 dark:text-blue-400">{dim.score} / {dim.maxScore}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">{dim.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Representative Works Drawer */}
        {showDossier && (
          <div className="mt-3 space-y-2.5 animate-in fade-in duration-150">
            {candidate.sampleWorks.map((work, idx) => (
              <div
                key={work.id || idx}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 space-y-1.5"
              >
                <div className="flex items-start justify-between gap-3">
                  <h4 className="text-xs font-bold font-serif text-slate-900 dark:text-white leading-snug">
                    {work.title}
                  </h4>
                  {work.is_oa && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shrink-0">
                      Open Access
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 font-sans">
                  <span>{work.publication_year}</span>
                  <span>•</span>
                  <span className="italic text-blue-900 dark:text-blue-300">{work.venue || 'Academic Source'}</span>
                  <span>•</span>
                  <span>{work.cited_by_count.toLocaleString()} citations</span>
                  {work.author_position && (
                    <>
                      <span>•</span>
                      <span className="capitalize">{work.author_position} author</span>
                    </>
                  )}
                </div>

                {work.abstract && (
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 font-serif leading-relaxed line-clamp-2">
                    {work.abstract}
                  </p>
                )}

                {work.doi && (
                  <div className="pt-1">
                    <a
                      href={`https://doi.org/${work.doi}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] font-mono text-blue-900 dark:text-blue-400 hover:underline flex items-center gap-1"
                    >
                      <span>DOI: {work.doi}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Card Action Strip */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          {onToggleShortlist && (
            <button
              type="button"
              onClick={onToggleShortlist}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition cursor-pointer ${
                isShortlisted
                  ? 'bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 border-amber-300 dark:border-amber-700'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>{isShortlisted ? 'Shortlisted' : 'Add to Roster'}</span>
            </button>
          )}

          {/* Save to Universal Research Cart */}
          <button
            type="button"
            onClick={handleSaveTopWorkToCart}
            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 transition cursor-pointer"
            title="Save scholar's top publication to universal Research Cart"
          >
            {cartSaved ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700 dark:text-emerald-300 font-bold">Saved to Cart</span>
              </>
            ) : (
              <>
                <BookmarkPlus className="w-3.5 h-3.5 text-blue-800 dark:text-blue-400" />
                <span>Save to Cart</span>
              </>
            )}
          </button>

          {onExcludeCandidate && (
            <button
              type="button"
              onClick={onExcludeCandidate}
              className="px-2.5 py-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 text-xs font-medium flex items-center gap-1 transition cursor-pointer"
              title="Exclude candidate from this search"
            >
              <EyeOff className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Hide</span>
            </button>
          )}
        </div>

        {/* Primary Action Button */}
        <button
          type="button"
          onClick={() => onOpenOutreach(candidate)}
          className="px-4 py-1.5 rounded-lg bg-blue-900 hover:bg-blue-800 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
        >
          {actionDetails.actionIcon}
          <span>{actionDetails.actionBtnText}</span>
          <Send className="w-3 h-3 ml-0.5" />
        </button>
      </div>

    </div>
  );
};
