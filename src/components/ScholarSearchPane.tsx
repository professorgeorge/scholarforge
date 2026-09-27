import React, { useState, useMemo } from 'react';
import { 
  Search, Users, Award, FileEdit, Briefcase, ShieldCheck, Sparkles, 
  Bookmark, Loader2, AlertCircle,
  ChevronDown, ChevronUp, ArrowRight, UploadCloud, GraduationCap
} from 'lucide-react';
import type { 
  ManuscriptQuery, 
  FilterOptions, 
  ReviewerCandidate, 
  SearchObjective
} from '../types/expertSearch';
import { searchOpenAlexWorks, fetchWorkByIdentifier } from '../services/openAlexExpertService';
import { enhanceCandidatesWithEmailWaterfall } from '../services/emailWaterfallService';
import { detectCoi } from '../services/coiDetector';
import { calculateExpertFitScore } from '../services/expertScorer';
import { ReviewerCard } from './ReviewerCard';
import { OutreachModal } from './OutreachModal';
import { RosterDrawer } from './RosterDrawer';
import { ScholarImpactTab } from './ScholarImpactTab';
import { SAMPLE_SCENARIOS, type SampleScenario } from '../data/sampleScenarios';

const REGION_COUNTRIES: Record<string, string[]> = {
  na: ['US', 'CA'],
  eu: ['GB', 'DE', 'FR', 'IT', 'ES', 'NL', 'CH', 'SE', 'BE', 'DK', 'AT', 'PL', 'FI', 'NO', 'IE', 'PT', 'CZ', 'GR', 'HU'],
  apac: ['CN', 'JP', 'KR', 'IN', 'AU', 'SG', 'NZ', 'TW', 'MY', 'ID', 'TH', 'VN', 'PH'],
  latam: ['BR', 'MX', 'AR', 'CL', 'CO', 'PE'],
  mea: ['ZA', 'EG', 'SA', 'AE', 'IL', 'TR', 'NG', 'KE', 'MA', 'QA']
};

interface ScholarSearchPaneProps {
  initialTitle?: string;
  initialAbstract?: string;
}

export const ScholarSearchPane: React.FC<ScholarSearchPaneProps> = ({
  initialTitle = '',
  initialAbstract = '',
}) => {
  const [paneMode, setPaneMode] = useState<'talent_search' | 'scholar_impact'>('talent_search');
  const [objective, setObjective] = useState<SearchObjective>('grant_coi');

  const [query, setQuery] = useState<ManuscriptQuery>({
    title: initialTitle,
    abstract: initialAbstract,
    keywords: '',
    submittedAuthors: '',
    submittedInstitutions: ''
  });

  const [doiInput, setDoiInput] = useState('');
  const [isIngestingDoi, setIsIngestingDoi] = useState(false);
  const [candidates, setCandidates] = useState<ReviewerCandidate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Shortlist and selection
  const [shortlistedIds, setShortlistedIds] = useState<Set<string>>(new Set());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [excludedIds, setExcludedIds] = useState<Set<string>>(new Set());

  // Modals & Drawer
  const [isRosterOpen, setIsRosterOpen] = useState(false);
  const [outreachCandidate, setOutreachCandidate] = useState<ReviewerCandidate | null>(null);
  const [showAdvancedInputs, setShowAdvancedInputs] = useState(false);

  // Filters
  const [filters, setFilters] = useState<FilterOptions>({
    minScore: 40,
    careerStage: 'all',
    emailVerifiedOnly: false,
    hideCoi: false,
    searchQuery: '',
    sortBy: 'score',
    region: 'all',
    shortlistedOnly: false
  });

  // Re-rank candidates on objective change
  const handleObjectiveChange = (newObj: SearchObjective) => {
    setObjective(newObj);
    if (candidates.length > 0) {
      const term = query.keywords.trim() || query.title.trim() || '';
      const rescored = candidates.map(cand => {
        const { score, breakdown, objectiveBreakdown, objectiveFitBadge, objectiveFitSummary, acceptanceLikelihood, publicationVelocity } = calculateExpertFitScore(cand, term, newObj);
        return {
          ...cand,
          readinessScore: score,
          scoreBreakdown: breakdown,
          objectiveBreakdown,
          objectiveFitBadge,
          objectiveFitSummary,
          acceptanceLikelihood,
          publicationVelocity
        };
      });

      rescored.sort((a, b) => b.readinessScore - a.readinessScore);
      setCandidates(rescored);
    }
  };

  // Load a preset scenario
  const handleLoadScenario = (scenario: SampleScenario) => {
    setObjective(scenario.objective);
    setQuery({ ...scenario.query });
    setErrorMessage(null);
  };

  // 1-Click DOI / PMID Ingest
  const handleAutoIngestDoi = async () => {
    if (!doiInput.trim()) return;
    setIsIngestingDoi(true);
    setErrorMessage(null);
    try {
      const data = await fetchWorkByIdentifier(doiInput.trim());
      if (data) {
        setQuery({
          title: data.title,
          abstract: data.abstract,
          keywords: data.keywords,
          submittedAuthors: data.authors.join(', '),
          submittedInstitutions: data.institutions.join(', ')
        });
        setDoiInput('');
      } else {
        setErrorMessage('Could not locate metadata for this identifier across OpenAlex or Crossref.');
      }
    } catch (err: any) {
      setErrorMessage(`Identifier ingest failed: ${err.message}`);
    } finally {
      setIsIngestingDoi(false);
    }
  };

  // Execute federated talent search
  const handleExecuteSearch = async () => {
    const rawSearchQuery = query.keywords.trim() || query.title.trim();
    if (!rawSearchQuery && !query.abstract.trim()) {
      setErrorMessage('Please provide keywords, a project title, or a brief abstract.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setCandidates([]);
    setSelectedIds(new Set());
    setHasSearched(true);
    setStatusMessage('Querying OpenAlex global graph for authoritative publications...');

    try {
      const { candidates: rawCandidates } = await searchOpenAlexWorks(
        rawSearchQuery || query.abstract.slice(0, 100),
        'scholar-search@editorial-intel.org',
        30
      );

      if (rawCandidates.length === 0) {
        throw new Error('No academic experts found matching these terms. Try broader keywords.');
      }

      setStatusMessage('Enriching contact emails via PubMed XML & OpenAlex metadata...');
      const enrichedCandidates = await enhanceCandidatesWithEmailWaterfall(
        rawCandidates,
        rawSearchQuery || query.title
      );

      setStatusMessage('Executing automated Conflict of Interest (COI) shield & multi-objective scoring...');
      const scoredCandidates = enrichedCandidates.map(cand => {
        const coi = detectCoi(cand, query.submittedAuthors, query.submittedInstitutions);
        const { score, breakdown, objectiveBreakdown, objectiveFitBadge, objectiveFitSummary, acceptanceLikelihood, publicationVelocity } = calculateExpertFitScore(cand, rawSearchQuery, objective);

        return {
          ...cand,
          coiStatus: coi,
          readinessScore: score,
          scoreBreakdown: breakdown,
          objectiveBreakdown,
          objectiveFitBadge,
          objectiveFitSummary,
          acceptanceLikelihood,
          publicationVelocity
        };
      });

      scoredCandidates.sort((a, b) => b.readinessScore - a.readinessScore);
      setCandidates(scoredCandidates);
    } catch (err: any) {
      setErrorMessage(err.message || 'Search execution failed.');
    } finally {
      setIsLoading(false);
      setStatusMessage('');
    }
  };

  // Toggle Shortlist
  const toggleShortlist = (id: string) => {
    setShortlistedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Toggle Card Selection
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Select all visible candidates
  const handleSelectAll = () => {
    if (selectedIds.size === filteredCandidates.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredCandidates.map(c => c.id)));
    }
  };

  // Filtered & Sorted Candidates
  const filteredCandidates = useMemo(() => {
    return candidates.filter(candidate => {
      if (excludedIds.has(candidate.id)) return false;
      if (candidate.readinessScore < filters.minScore) return false;
      if (filters.emailVerifiedOnly && (!candidate.email || candidate.emailConfidence === 'heuristic')) return false;
      if (filters.hideCoi && candidate.coiStatus.hasCoi) return false;
      if (filters.shortlistedOnly && !shortlistedIds.has(candidate.id)) return false;

      if (filters.careerStage !== 'all') {
        if (filters.careerStage === 'early' && candidate.careerStage !== 'Early-Career Specialist') return false;
        if (filters.careerStage === 'mid' && candidate.careerStage !== 'Mid-Career Authority') return false;
        if (filters.careerStage === 'senior' && candidate.careerStage !== 'Senior Group Leader / PI') return false;
      }

      if (filters.region !== 'all' && candidate.countryCode) {
        const allowedCountries = REGION_COUNTRIES[filters.region];
        if (allowedCountries && !allowedCountries.includes(candidate.countryCode)) return false;
      }

      if (filters.searchQuery.trim()) {
        const q = filters.searchQuery.toLowerCase();
        const matchesName = candidate.name.toLowerCase().includes(q);
        const matchesInst = candidate.primaryInstitution.toLowerCase().includes(q);
        const matchesWorks = candidate.sampleWorks.some(w => w.title.toLowerCase().includes(q));
        if (!matchesName && !matchesInst && !matchesWorks) return false;
      }

      return true;
    }).sort((a, b) => {
      if (filters.sortBy === 'citations') return b.totalRecentCitations - a.totalRecentCitations;
      if (filters.sortBy === 'hindex') return b.hIndexEst - a.hIndexEst;
      if (filters.sortBy === 'name') return a.name.localeCompare(b.name);
      return b.readinessScore - a.readinessScore;
    });
  }, [candidates, filters, excludedIds, shortlistedIds]);

  const shortlistedList = useMemo(() => {
    return candidates.filter(c => shortlistedIds.has(c.id));
  }, [candidates, shortlistedIds]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Studio Header Card */}
      <div className="academic-card rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-7 space-y-5 shadow-xs">
        
        <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-blue-900 dark:bg-blue-800 flex items-center justify-center text-white shadow-xs">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold font-serif text-slate-900 dark:text-white">
                  Academic Talent & Reviewer Discovery Studio
                </h2>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950 text-blue-900 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  OpenAlex & PubMed REST
                </span>
              </div>
              <p className="text-xs text-slate-500 font-sans mt-0.5">
                Multi-objective discovery for Grant Co-Investigators, Paper Co-Authors, Consulting Advisors, and Journal Peer Reviewers
              </p>
            </div>
          </div>

          {/* Roster Drawer Trigger */}
          <button
            onClick={() => setIsRosterOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950 dark:hover:bg-blue-900/60 text-blue-900 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-semibold shadow-2xs transition cursor-pointer"
          >
            <Bookmark className="w-4 h-4 text-blue-700 dark:text-blue-400" />
            <span>Shortlist Roster</span>
            <span className="px-1.5 py-0.2 rounded-full bg-blue-900 text-white font-mono text-[10px]">
              {shortlistedIds.size}
            </span>
          </button>
        </div>

        {/* Sub-Navigation Switcher */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
          <button
            type="button"
            onClick={() => setPaneMode('talent_search')}
            className={`px-4 py-2 rounded-xl text-xs font-bold font-serif flex items-center gap-2 transition cursor-pointer ${
              paneMode === 'talent_search'
                ? 'bg-blue-900 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Talent &amp; Reviewer Search Studio</span>
          </button>

          <button
            type="button"
            onClick={() => setPaneMode('scholar_impact')}
            className={`px-4 py-2 rounded-xl text-xs font-bold font-serif flex items-center gap-2 transition cursor-pointer ${
              paneMode === 'scholar_impact'
                ? 'bg-blue-900 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5 text-amber-400" />
            <span>ScholarImpact Pro &amp; Career Biosketch</span>
          </button>
        </div>

        {paneMode === 'scholar_impact' ? (
          <ScholarImpactTab />
        ) : (
          <>
            {/* 4 Dedicated Search Objectives Switcher */}
            <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5 font-serif">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Select Discovery Objective:</span>
            </label>
            <span className="text-[11px] text-slate-500 font-sans">
              Instantly re-ranks candidates and adapts outreach emails without redundant queries
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {[
              {
                id: 'grant_coi' as const,
                title: 'Grant Co-Investigator',
                desc: 'Consortium seniority, citation impact, and multi-site institutional diversity',
                icon: <Award className="w-4 h-4 text-amber-500" />,
                badge: 'Grant Fit Score (GFS)'
              },
              {
                id: 'coauthor' as const,
                title: 'Paper Co-Author',
                desc: 'High publishing velocity, first/corresponding authorship, and methodological fit',
                icon: <FileEdit className="w-4 h-4 text-emerald-500" />,
                badge: 'Synergy Score'
              },
              {
                id: 'consultant' as const,
                title: 'Consulting & SME',
                desc: 'Executive credibility, global h-index stature, and technical diligence advisory',
                icon: <Briefcase className="w-4 h-4 text-blue-500" />,
                badge: 'Advisory Authority'
              },
              {
                id: 'reviewer' as const,
                title: 'Journal Peer Reviewer',
                desc: 'Early-to-mid career sweet spot, rapid turnaround, and COI shield exclusion',
                icon: <ShieldCheck className="w-4 h-4 text-indigo-500" />,
                badge: 'Reviewer Readiness'
              }
            ].map(obj => {
              const isActive = objective === obj.id;
              return (
                <button
                  key={obj.id}
                  type="button"
                  onClick={() => handleObjectiveChange(obj.id)}
                  className={`p-3 rounded-xl text-left border transition cursor-pointer flex flex-col justify-between ${
                    isActive
                      ? 'bg-blue-50/70 dark:bg-blue-950/50 border-blue-600 dark:border-blue-500 shadow-xs ring-1 ring-blue-500'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {obj.icon}
                      <span className="text-xs font-bold font-serif text-slate-900 dark:text-white">
                        {obj.title}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-snug">
                      {obj.desc}
                    </p>
                  </div>
                  <div className="mt-2 text-[10px] font-mono font-semibold text-blue-900 dark:text-blue-400">
                    {obj.badge}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Query Input Section */}
        <div className="space-y-4 pt-2">
          
          {/* Quick Preset Scenarios */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[11px] font-medium text-slate-500">Sample Scenarios:</span>
            {SAMPLE_SCENARIOS.map(sc => (
              <button
                key={sc.id}
                type="button"
                onClick={() => handleLoadScenario(sc)}
                className="px-2.5 py-1 rounded-lg text-[11px] font-serif bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950 text-slate-700 dark:text-slate-300 hover:text-blue-900 dark:hover:text-blue-200 border border-slate-200 dark:border-slate-700 transition cursor-pointer"
              >
                {sc.label}
              </button>
            ))}
          </div>

          {/* 1-Click DOI / PMID Ingest Bar */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 flex-1 min-w-[240px]">
              <UploadCloud className="w-4 h-4 text-blue-800 dark:text-blue-400 shrink-0" />
              <input
                type="text"
                value={doiInput}
                onChange={(e) => setDoiInput(e.target.value)}
                placeholder="Paste Paper DOI (e.g. 10.1038/nature21056) or PubMed PMID to auto-populate..."
                className="w-full px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-blue-700"
              />
            </div>
            <button
              type="button"
              onClick={handleAutoIngestDoi}
              disabled={isIngestingDoi || !doiInput.trim()}
              className="px-3 py-1 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 font-semibold text-xs text-slate-800 dark:text-slate-200 transition cursor-pointer disabled:opacity-50"
            >
              {isIngestingDoi ? 'Ingesting...' : 'Auto-Ingest'}
            </button>
          </div>

          {/* Title and Keywords */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block mb-1 font-serif">
                Project Title / Inquiry Headline:
              </label>
              <input
                type="text"
                value={query.title}
                onChange={(e) => setQuery({ ...query, title: e.target.value })}
                placeholder="e.g. Cross-Attention Latent Diffusion for Cryo-EM Protein Structure Reconstruction"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white font-serif focus:outline-none focus:border-blue-700"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block mb-1 font-serif">
                Domain Keywords & Methodological Concepts:
              </label>
              <input
                type="text"
                value={query.keywords}
                onChange={(e) => setQuery({ ...query, keywords: e.target.value })}
                placeholder="e.g. cryo-EM latent diffusion single-cell structural biology"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white font-sans focus:outline-none focus:border-blue-700"
              />
            </div>
          </div>

          {/* Abstract / Scope */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block mb-1 font-serif">
              Proposal Abstract / Technical Description (Optional for deep matching):
            </label>
            <textarea
              rows={3}
              value={query.abstract}
              onChange={(e) => setQuery({ ...query, abstract: e.target.value })}
              placeholder="Paste research proposal abstract or specific aims to evaluate semantic relevance..."
              className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white font-serif leading-relaxed focus:outline-none focus:border-blue-700"
            />
          </div>

          {/* Expandable COI Shield Inputs */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowAdvancedInputs(!showAdvancedInputs)}
              className="text-xs text-blue-800 dark:text-blue-400 font-bold font-serif hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>{showAdvancedInputs ? 'Hide Conflict of Interest (COI) Inputs' : '+ Conflict of Interest (COI) Shield: Add Submitting Authors & Institutions'}</span>
              {showAdvancedInputs ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {showAdvancedInputs && (
              <div className="mt-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-150 text-xs">
                <div>
                  <label className="font-bold uppercase tracking-wider block mb-1 text-slate-700 dark:text-slate-300 font-serif">
                    Submitting Co-Authors / Current Team:
                  </label>
                  <input
                    type="text"
                    value={query.submittedAuthors}
                    onChange={(e) => setQuery({ ...query, submittedAuthors: e.target.value })}
                    placeholder="Comma-separated: Carl June, Michel Sadelain"
                    className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-blue-700 font-sans"
                  />
                  <span className="text-[11px] text-slate-500 block mt-1">Automatically flags direct co-author conflicts</span>
                </div>

                <div>
                  <label className="font-bold uppercase tracking-wider block mb-1 text-slate-700 dark:text-slate-300 font-serif">
                    Submitting / Lead Institutions:
                  </label>
                  <input
                    type="text"
                    value={query.submittedInstitutions}
                    onChange={(e) => setQuery({ ...query, submittedInstitutions: e.target.value })}
                    placeholder="Comma-separated: University of Pennsylvania, MSKCC"
                    className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-blue-700 font-sans"
                  />
                  <span className="text-[11px] text-slate-500 block mt-1">Automatically flags institutional overlaps</span>
                </div>
              </div>
            )}
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Status Message */}
          {statusMessage && (
            <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-xs text-blue-900 dark:text-blue-300 flex items-center gap-2.5 font-medium animate-pulse">
              <Loader2 className="w-4 h-4 text-blue-700 animate-spin shrink-0" />
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Action Row */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-slate-500">
              Live queries OpenAlex (250M+ works) and PubMed E-Utilities
            </span>

            <button
              type="button"
              onClick={handleExecuteSearch}
              disabled={isLoading}
              className="btn-academic-primary px-7 py-3 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Discovering Experts...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Discover Academic Experts</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

        </div>
        </>
        )}

      </div>

      {/* Results Workspace */}
      {paneMode === 'talent_search' && hasSearched && (
        <div className="space-y-4">
          
          {/* Filter & Sort Controls */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs font-sans shadow-xs">
            
            <div className="flex flex-wrap items-center gap-3">
              {/* Score Slider */}
              <div className="flex items-center gap-2">
                <span className="text-slate-500 font-medium">Min Score:</span>
                <input
                  type="range"
                  min={30}
                  max={90}
                  value={filters.minScore}
                  onChange={(e) => setFilters({ ...filters, minScore: Number(e.target.value) })}
                  className="w-24 accent-blue-900 cursor-pointer"
                />
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{filters.minScore}</span>
              </div>

              {/* Career Stage Filter */}
              <select
                value={filters.careerStage}
                onChange={(e) => setFilters({ ...filters, careerStage: e.target.value as any })}
                className="px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
              >
                <option value="all">All Career Stages</option>
                <option value="early">Early-Career Specialists</option>
                <option value="mid">Mid-Career Authorities</option>
                <option value="senior">Senior PIs / Group Leaders</option>
              </select>

              {/* Region Filter */}
              <select
                value={filters.region}
                onChange={(e) => setFilters({ ...filters, region: e.target.value as any })}
                className="px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
              >
                <option value="all">Global (All Regions)</option>
                <option value="na">North America (US/CA)</option>
                <option value="eu">Europe (EU/UK/CH)</option>
                <option value="apac">Asia-Pacific (APAC)</option>
                <option value="latam">Latin America</option>
                <option value="mea">Middle East & Africa</option>
              </select>

              {/* Verified Email Toggle */}
              <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={filters.emailVerifiedOnly}
                  onChange={(e) => setFilters({ ...filters, emailVerifiedOnly: e.target.checked })}
                  className="rounded text-blue-900 focus:ring-blue-700"
                />
                <span>Email Available</span>
              </label>

              {/* Hide COI Toggle */}
              <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={filters.hideCoi}
                  onChange={(e) => setFilters({ ...filters, hideCoi: e.target.checked })}
                  className="rounded text-blue-900 focus:ring-blue-700"
                />
                <span>Hide COI Conflicts</span>
              </label>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-medium">Sort By:</span>
              <select
                value={filters.sortBy}
                onChange={(e) => setFilters({ ...filters, sortBy: e.target.value as any })}
                className="px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
              >
                <option value="score">Fit Score (High to Low)</option>
                <option value="citations">Recent Citations</option>
                <option value="hindex">Estimated h-Index</option>
                <option value="name">Scholar Name</option>
              </select>
            </div>

          </div>

          {/* Status Strip: Count + Select All + Shortlist Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {filteredCandidates.length} candidate{filteredCandidates.length === 1 ? '' : 's'} identified
              </span>
              <span className="text-slate-400">•</span>
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-blue-900 dark:text-blue-400 hover:underline font-semibold cursor-pointer"
              >
                {selectedIds.size === filteredCandidates.length && filteredCandidates.length > 0
                  ? 'Deselect All'
                  : 'Select All Visible'}
              </button>
            </div>

            {selectedIds.size > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-slate-500">{selectedIds.size} selected</span>
                <button
                  type="button"
                  onClick={() => {
                    setShortlistedIds(prev => {
                      const next = new Set(prev);
                      selectedIds.forEach(id => next.add(id));
                      return next;
                    });
                  }}
                  className="px-3 py-1 rounded-lg bg-blue-900 text-white font-semibold text-xs transition cursor-pointer"
                >
                  Add Selected to Roster
                </button>
              </div>
            )}
          </div>

          {/* Candidates List */}
          {filteredCandidates.length === 0 ? (
            <div className="academic-card rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-12 text-center text-xs text-slate-500">
              No candidates meet the active filter thresholds. Try lowering the minimum score or loosening career stage filters.
            </div>
          ) : (
            <div className="space-y-4">
              {filteredCandidates.map(candidate => (
                <ReviewerCard
                  key={candidate.id}
                  candidate={candidate}
                  isSelected={selectedIds.has(candidate.id)}
                  isShortlisted={shortlistedIds.has(candidate.id)}
                  objective={objective}
                  onToggleSelect={() => toggleSelect(candidate.id)}
                  onToggleShortlist={() => toggleShortlist(candidate.id)}
                  onExcludeCandidate={() => {
                    setExcludedIds(prev => {
                      const next = new Set(prev);
                      next.add(candidate.id);
                      return next;
                    });
                  }}
                  onOpenOutreach={(c) => setOutreachCandidate(c)}
                />
              ))}
            </div>
          )}

        </div>
      )}

      {/* Outreach Modal */}
      <OutreachModal
        candidate={outreachCandidate}
        manuscriptTitle={query.title || 'Scholarly Research Project'}
        objective={objective}
        onClose={() => setOutreachCandidate(null)}
      />

      {/* Roster Drawer */}
      <RosterDrawer
        isOpen={isRosterOpen}
        onClose={() => setIsRosterOpen(false)}
        shortlistedCandidates={shortlistedList}
        onRemoveFromShortlist={toggleShortlist}
        onClearShortlist={() => setShortlistedIds(new Set())}
        objective={objective}
      />

    </div>
  );
};
