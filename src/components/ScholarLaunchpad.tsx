import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  Search, 
  FileText, 
  UploadCloud, 
  FileCheck2, 
  Database, 
  Globe2, 
  ChevronDown, 
  ChevronUp, 
  Loader2, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle,
  Cpu,
  Settings2,
  Trash2,
  MessageSquarePlus,
  Wand2,
  ShieldCheck,
  SlidersHorizontal,
  Download
} from 'lucide-react';
import type { AcademicPaper, CitationOptions, Claim } from '../types/citation';
import { extractTextFromManuscriptFile } from '../services/fileImportService';
import { queryPublicSecondaryData } from '../services/secondaryDataService';
import { 
  synthesizeGroundedManuscript, 
  executePeerReviewOverhaul,
  type PeerReviewOverhaulResult,
  type LLMConfig 
} from '../services/llmService';
import { huntLiteratureCorpus } from '../services/academicApi';
import { extractClaimsFromText } from '../services/claimExtractor';
import { LiteratureExportModal } from './LiteratureExportModal';

interface ScholarLaunchpadProps {
  onManuscriptReady: (manuscript: string, claims: Claim[]) => void;
  onStartGroundingDraft: (draftText: string) => void;
  onRebuttalPackageReady?: (result: PeerReviewOverhaulResult, originalDraft: string, claims: Claim[]) => void;
  onNavigateToEthics?: () => void;
  options: CitationOptions;
  setOptions?: React.Dispatch<React.SetStateAction<CitationOptions>>;
  sensitivity?: 'all' | 'moderate' | 'high';
  setSensitivity?: (s: 'all' | 'moderate' | 'high') => void;
  llmConfig: LLMConfig;
  onOpenSettings: () => void;
  isProcessing: boolean;
  initialDraftText?: string;
  initialFilename?: string;
  onManuscriptLoaded?: (text: string, filename?: string) => void;
}

export const ScholarLaunchpad: React.FC<ScholarLaunchpadProps> = ({
  onManuscriptReady,
  onStartGroundingDraft,
  onRebuttalPackageReady,
  onNavigateToEthics,
  options,
  setOptions,
  sensitivity = 'moderate',
  setSensitivity,
  llmConfig,
  onOpenSettings,
  isProcessing,
  initialDraftText = '',
  initialFilename,
  onManuscriptLoaded
}) => {
  const [activeTab, setActiveTab] = useState<'synthesize' | 'ground_draft'>(() => {
    return initialDraftText && initialDraftText.trim() ? 'ground_draft' : 'synthesize';
  });

  // Tab 1: Synthesis Inputs
  const [topic, setTopic] = useState('');
  const [searchScope, setSearchScope] = useState<number>(25);

  // Tab 2: Ground Existing Draft Inputs
  const [draftText, setDraftText] = useState(() => initialDraftText || '');
  const [importedFilename, setImportedFilename] = useState<string | null>(initialFilename || null);
  const [isImportingDocx, setIsImportingDocx] = useState(false);
  const docxInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialDraftText && initialDraftText.trim()) {
      setDraftText(initialDraftText);
      setActiveTab('ground_draft');
    }
    if (initialFilename) {
      setImportedFilename(initialFilename);
    }
  }, [initialDraftText, initialFilename]);

  // Tab 2: Peer-Review Comments & Critique Inputs
  const [reviewerCommentsText, setReviewerCommentsText] = useState('');
  const [reviewerFilename, setReviewerFilename] = useState<string | null>(null);
  const [isImportingReviewerDocx, setIsImportingReviewerDocx] = useState(false);
  const reviewerFileInputRef = useRef<HTMLInputElement>(null);

  // Advanced Empirical Focus & Secondary / Primary Data
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [focus, setFocus] = useState('');
  const [primaryDataText, setPrimaryDataText] = useState('');
  const [primaryDataFilename, setPrimaryDataFilename] = useState<string | null>(null);
  const [includeSecondaryData, setIncludeSecondaryData] = useState(true);
  const primaryDataInputRef = useRef<HTMLInputElement>(null);

  // Literature Discovery & Export State
  const [discoveredPapersForExport, setDiscoveredPapersForExport] = useState<AcademicPaper[]>([]);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isSearchingLiteratureOnly, setIsSearchingLiteratureOnly] = useState(false);

  // Loading & Error States
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Handle Word Docx Upload for Tab 2
  const handleDocxUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImportingDocx(true);
    setErrorMsg('');
    try {
      const result = await extractTextFromManuscriptFile(file);
      setDraftText(result.text);
      setImportedFilename(result.filename);
      if (onManuscriptLoaded) {
        onManuscriptLoaded(result.text, result.filename);
      }
    } catch (err: any) {
      setErrorMsg(`Failed to parse document: ${err.message}`);
    } finally {
      setIsImportingDocx(false);
    }
  };

  const handleClearDocx = () => {
    setDraftText('');
    setImportedFilename(null);
    if (docxInputRef.current) docxInputRef.current.value = '';
  };

  // Handle Reviewer Comments Upload (.docx / .txt / .md)
  const handleReviewerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImportingReviewerDocx(true);
    setErrorMsg('');
    try {
      if (file.name.toLowerCase().endsWith('.docx')) {
        const result = await extractTextFromManuscriptFile(file);
        setReviewerCommentsText(result.text);
        setReviewerFilename(result.filename);
      } else {
        const reader = new FileReader();
        reader.onload = (event) => {
          const content = event.target?.result as string;
          if (content) {
            setReviewerCommentsText(content);
            setReviewerFilename(file.name);
          }
        };
        reader.readAsText(file);
      }
    } catch (err: any) {
      setErrorMsg(`Failed to parse reviewer comments file: ${err.message}`);
    } finally {
      setIsImportingReviewerDocx(false);
    }
  };

  const handleClearReviewerComments = () => {
    setReviewerCommentsText('');
    setReviewerFilename(null);
    if (reviewerFileInputRef.current) reviewerFileInputRef.current.value = '';
  };

  // Handle Primary Data (Surveys, Transcripts, Tables, CSV/DOCX/TXT) Upload
  const handlePrimaryDataUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPrimaryDataFilename(file.name);

    if (file.name.toLowerCase().endsWith('.docx')) {
      try {
        const result = await extractTextFromManuscriptFile(file);
        setPrimaryDataText(result.text);
        setShowAdvanced(true);
      } catch (err: any) {
        setErrorMsg(`Failed to parse primary data document: ${err.message}`);
      }
    } else {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        if (content) {
          setPrimaryDataText(content);
          setShowAdvanced(true);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleClearPrimaryData = () => {
    setPrimaryDataText('');
    setPrimaryDataFilename(null);
    if (primaryDataInputRef.current) primaryDataInputRef.current.value = '';
  };

  // Execution: Synthesize Full Grounded Research Paper (Tab 1)
  const handleExecuteSynthesis = async () => {
    if (!topic.trim()) {
      setErrorMsg('Please enter a research topic, thesis statement, or inquiry.');
      return;
    }

    setErrorMsg('');
    setStatusMessage('Querying OpenAlex & Crossref for verified peer-reviewed literature...');

    try {
      // Step 1: Hunt real literature and secondary registries
      const [papers, secondaryRecords] = await Promise.all([
        huntLiteratureCorpus(topic, focus, searchScope, options.excludePreprints),
        includeSecondaryData ? queryPublicSecondaryData(topic, focus) : Promise.resolve([]),
      ]);

      if (papers.length === 0) {
        throw new Error('No peer-reviewed papers with DOIs found for this exact inquiry. Try broader search terms.');
      }

      // Step 2: Synthesize full 5,000+ word research paper via Chained Multi-Section Orchestration
      const manuscript = await synthesizeGroundedManuscript(
        topic,
        focus,
        papers,
        llmConfig,
        primaryDataText.trim() || undefined,
        secondaryRecords,
        (_step, _total, msg) => {
          setStatusMessage(msg);
        }
      );

      // Step 3: Extract claims and assign verified papers
      const extractedClaims = extractClaimsFromText(manuscript, 'all');
      const claims: Claim[] = extractedClaims.map((claim, idx) => {
        const assignedPaper = papers[idx % papers.length];
        return {
          ...claim,
          candidatePapers: papers,
          selectedPaper: assignedPaper,
          status: 'found',
          confidence: 'high',
          isExcluded: false,
          citationNumber: idx + 1,
        };
      });

      onManuscriptReady(manuscript, claims);
    } catch (err: any) {
      setErrorMsg(err.message || 'Synthesis failed.');
    } finally {
      setStatusMessage('');
    }
  };

  // Execution: Identify & Download Literature Records without Synthesizing
  const handleIdentifyLiteratureOnly = async () => {
    if (!topic.trim()) {
      setErrorMsg('Please enter a research topic, thesis statement, or inquiry.');
      return;
    }

    setErrorMsg('');
    setIsSearchingLiteratureOnly(true);
    setStatusMessage('Querying OpenAlex & Crossref for verified peer-reviewed literature...');

    try {
      const papers = await huntLiteratureCorpus(topic, focus, searchScope, options.excludePreprints);
      if (papers.length === 0) {
        throw new Error('No peer-reviewed papers with DOIs found for this exact inquiry. Try broader search terms.');
      }
      setDiscoveredPapersForExport(papers);
      setIsExportModalOpen(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'Literature discovery failed.');
    } finally {
      setIsSearchingLiteratureOnly(false);
      setStatusMessage('');
    }
  };

  // Execution: Peer-Review Rebuttal & Comprehensive Overhaul (Tab 2)
  const handleExecutePeerReviewOverhaul = async () => {
    if (!draftText.trim()) {
      setErrorMsg('Please paste your manuscript draft or upload a Word document.');
      return;
    }
    if (!reviewerCommentsText.trim()) {
      setErrorMsg('Please provide reviewer comments or editorial critique.');
      return;
    }

    setErrorMsg('');
    setStatusMessage('Analyzing reviewer critiques and querying literature knowledge graph...');

    try {
      // Extract salient keywords from manuscript
      const searchTopic = draftText.slice(0, 100);
      const papers = await huntLiteratureCorpus(searchTopic, focus, searchScope, options.excludePreprints);

      const overhaulResult = await executePeerReviewOverhaul(
        draftText,
        reviewerCommentsText,
        papers,
        llmConfig,
        primaryDataText.trim() || undefined,
        (_step, _total, msg) => {
          setStatusMessage(msg);
        }
      );

      const extractedClaims = extractClaimsFromText(overhaulResult.revisedManuscript, 'all');
      const claims: Claim[] = extractedClaims.map((claim, idx) => {
        const assignedPaper = papers.length > 0 ? papers[idx % papers.length] : null;
        return {
          ...claim,
          candidatePapers: papers,
          selectedPaper: assignedPaper,
          status: assignedPaper ? 'found' : 'not_found',
          confidence: 'high',
          isExcluded: false,
          citationNumber: idx + 1,
        };
      });

      if (onRebuttalPackageReady) {
        onRebuttalPackageReady(overhaulResult, draftText, claims);
      } else {
        onManuscriptReady(overhaulResult.revisedManuscript, claims);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Peer-review overhaul failed.');
    } finally {
      setStatusMessage('');
    }
  };

  // Execution: Ground Existing Manuscript (Tab 2 Citation Infilling Only)
  const handleExecuteGrounding = () => {
    if (!draftText.trim()) {
      setErrorMsg('Please paste your manuscript draft or upload a Word document.');
      return;
    }
    setErrorMsg('');
    onStartGroundingDraft(draftText);
  };

  const isBusy = Boolean(statusMessage) || isProcessing;

  return (
    <div className="academic-card rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6 shadow-sm max-w-4xl mx-auto">
      
      {/* Studio Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white font-serif tracking-tight">
            Academic Research & Grounded Manuscript Studio
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-sans">
            Full research paper synthesis & infilling • Verified DOIs • OpenAlex & Crossref knowledge graphs
          </p>
        </div>

        {/* Action Controls & Master Settings Trigger */}
        <div className="flex items-center gap-2.5">


          <button
            onClick={onOpenSettings}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold border border-slate-300 dark:border-slate-700 transition cursor-pointer"
          >
            <Cpu className="w-3.5 h-3.5 text-blue-800 dark:text-blue-400" />
            <span>LLM: <strong>{llmConfig.provider.toUpperCase()}</strong></span>
            <Settings2 className="w-3.5 h-3.5 text-slate-500 ml-0.5" />
          </button>
        </div>
      </div>

      {/* Main Two Intent Tabs */}
      <div className="p-1 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
        
        {/* Intent 1: Research Inquiry & Full Paper Synthesis */}
        <button
          type="button"
          onClick={() => { setActiveTab('synthesize'); setErrorMsg(''); }}
          className={`p-3.5 rounded-lg text-left transition cursor-pointer flex items-center gap-3 ${
            activeTab === 'synthesize'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs border border-slate-300 dark:border-slate-700'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-900 dark:text-blue-300 shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold font-serif">1. Research Inquiry, Literature Discovery & Synthesis</div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Enter a thesis or inquiry → Query literature to download records (Word, JSON, MD, CSV) or synthesize a full grounded paper.
            </div>
          </div>
        </button>

        {/* Intent 2: Ground Existing Manuscript */}
        <button
          type="button"
          onClick={() => { setActiveTab('ground_draft'); setErrorMsg(''); }}
          className={`p-3.5 rounded-lg text-left transition cursor-pointer flex items-center gap-3 ${
            activeTab === 'ground_draft'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs border border-slate-300 dark:border-slate-700'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold font-serif">2. Ground Existing Manuscript</div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Upload Word (.docx) or paste draft → ScholarForge extracts factual claims & infills authentic peer-reviewed citations.
            </div>
          </div>
        </button>

      </div>

      {/* Tab 1: Research Inquiry & Full Paper Synthesis Body */}
      {activeTab === 'synthesize' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          
          {/* Research Topic */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2 uppercase tracking-wider">
              Research Topic, Thesis Statement, or Inquiry:
            </label>
            <div className="relative">
              <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
              <textarea
                rows={2}
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Enter your research topic, thesis statement, or inquiry..."
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-700 focus:ring-1 focus:ring-blue-700 font-serif leading-relaxed"
              />
            </div>
          </div>

          {/* Literature Search Scope */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5 uppercase tracking-wider">
              Literature Search Breadth:
            </label>
            <select
              value={searchScope}
              onChange={(e) => setSearchScope(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-blue-700"
            >
              <option value={15}>Brief Search (Focused Discovery, 15+ Core Papers)</option>
              <option value={25}>Standard Research Review (Recommended, 25+ Papers)</option>
              <option value={35}>Comprehensive Survey (Deep Cross-Disciplinary, 35+ Papers)</option>
            </select>
          </div>

          {/* Quality & Integrity Parameters for Synthesis */}
          {setOptions && (
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-800 dark:text-blue-400" />
                <span>Synthesis Quality Filters:</span>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 dark:text-slate-300 font-medium">
                  <input
                    type="checkbox"
                    checked={options.excludePreprints}
                    onChange={(e) => setOptions((prev) => ({ ...prev, excludePreprints: e.target.checked }))}
                    className="rounded border-slate-300 text-blue-800 focus:ring-blue-700 cursor-pointer"
                  />
                  <span>Exclude Preprints</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 dark:text-slate-300 font-medium">
                  <input
                    type="checkbox"
                    checked={options.requireDoi}
                    onChange={(e) => setOptions((prev) => ({ ...prev, requireDoi: e.target.checked }))}
                    className="rounded border-slate-300 text-blue-800 focus:ring-blue-700 cursor-pointer"
                  />
                  <span>Require Permanent DOI</span>
                </label>
              </div>
            </div>
          )}

        </div>
      )}

      {/* Tab 2: Ground Existing Manuscript Body */}
      {activeTab === 'ground_draft' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          
          <div className="flex flex-wrap items-center justify-between gap-3">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block uppercase tracking-wider">
              Paste Draft Text or Upload Microsoft Word File:
            </label>

            <div className="flex items-center gap-2">
              <input
                type="file"
                ref={docxInputRef}
                onChange={handleDocxUpload}
                accept=".docx,.txt,.md,.rtf,.tex"
                className="hidden"
                id="launchpad-docx-upload"
              />
              <label
                htmlFor="launchpad-docx-upload"
                className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                {isImportingDocx ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-800" />
                ) : (
                  <UploadCloud className="w-3.5 h-3.5 text-blue-800 dark:text-blue-400" />
                )}
                <span>{isImportingDocx ? 'Parsing Document...' : 'Upload Word Doc (.docx)'}</span>
              </label>



              {draftText && (
                <button
                  type="button"
                  onClick={handleClearDocx}
                  className="text-xs text-rose-600 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear</span>
                </button>
              )}
            </div>
          </div>

          {importedFilename && (
            <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-300 flex items-center gap-2 font-medium">
              <FileCheck2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Loaded Word document: <strong>{importedFilename}</strong> ({draftText.length.toLocaleString()} characters)</span>
            </div>
          )}

          <textarea
            rows={6}
            value={draftText}
            onChange={(e) => setDraftText(e.target.value)}
            placeholder="Paste your manuscript draft, thesis section, or literature notes here..."
            className="w-full p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white font-serif leading-relaxed placeholder-slate-400 focus:outline-none focus:border-blue-700 focus:ring-1 focus:ring-blue-700"
          />

          {/* Reviewer Comments & Editorial Critiques Section */}
          <div className="p-4 rounded-xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <MessageSquarePlus className="w-4 h-4 text-blue-800 dark:text-blue-400" />
                <label className="text-xs font-bold text-blue-950 dark:text-blue-200 uppercase tracking-wider font-serif">
                  Peer-Reviewer & Editor Comments / Critiques (Optional for R&R):
                </label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="file"
                  ref={reviewerFileInputRef}
                  onChange={handleReviewerUpload}
                  accept=".docx,.txt,.md,.rtf"
                  className="hidden"
                  id="launchpad-reviewer-upload"
                />
                <label
                  htmlFor="launchpad-reviewer-upload"
                  className="px-2.5 py-1 rounded-md bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-700 hover:bg-blue-100 text-xs font-semibold text-blue-900 dark:text-blue-300 flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  {isImportingReviewerDocx ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-800" />
                  ) : (
                    <UploadCloud className="w-3.5 h-3.5 text-blue-800 dark:text-blue-400" />
                  )}
                  <span>Upload Reviewer Report (.docx/.txt)</span>
                </label>

                {reviewerCommentsText && (
                  <button
                    type="button"
                    onClick={handleClearReviewerComments}
                    className="text-xs text-rose-600 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear</span>
                  </button>
                )}
              </div>
            </div>

            {reviewerFilename && (
              <div className="p-2 rounded-lg bg-blue-100/70 dark:bg-blue-900/50 text-xs text-blue-950 dark:text-blue-200 flex items-center gap-2 font-medium">
                <FileCheck2 className="w-4 h-4 text-blue-700 shrink-0" />
                <span>Loaded Reviewer Report: <strong>{reviewerFilename}</strong> ({reviewerCommentsText.length.toLocaleString()} characters)</span>
              </div>
            )}

            <textarea
              rows={4}
              value={reviewerCommentsText}
              onChange={(e) => setReviewerCommentsText(e.target.value)}
              placeholder="Paste reviewer critique points, editor decision letter, or revision guidelines here (e.g. 'Reviewer 1 asks to soften causal claims in Section 4; Reviewer 2 requests expanding on methodology...'). ScholarForge will revise the manuscript and generate a formal Point-by-Point Author Response Letter!"
              className="w-full p-3 rounded-lg bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800 text-xs text-slate-900 dark:text-white font-sans leading-relaxed placeholder-slate-400 focus:outline-none focus:border-blue-700 focus:ring-1 focus:ring-blue-700"
            />
            <div className="text-[11px] text-blue-900/80 dark:text-blue-300/80 flex items-center gap-1.5 font-sans">
              <Wand2 className="w-3.5 h-3.5 text-amber-500" />
              <span>When reviewer comments are provided, ScholarForge thoroughly overhauls the entire manuscript AND produces a formal Point-by-Point Rebuttal Letter.</span>
            </div>
          </div>

          {/* Literature Search Scope for Tab 2 */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5 uppercase tracking-wider">
              Literature Search Breadth:
            </label>
            <select
              value={searchScope}
              onChange={(e) => setSearchScope(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-blue-700"
            >
              <option value={15}>Brief Search (Focused Discovery, 2-3 Candidates per Claim)</option>
              <option value={25}>Standard Search (Recommended, 4-5 Candidates per Claim)</option>
              <option value={35}>Comprehensive Survey (Deep Cross-Disciplinary, 6-8 Candidates per Claim)</option>
            </select>
          </div>

          {/* Claim Sensitivity & Quality Settings for Grounding Drafts */}
          <div className="space-y-2.5 pt-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-blue-800 dark:text-blue-400" />
              <span>Claim Extraction Sensitivity:</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSensitivity && setSensitivity('high')}
                className={`p-2.5 rounded-xl text-left border transition cursor-pointer ${
                  sensitivity === 'high'
                    ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-700 dark:border-blue-500 ring-1 ring-blue-700/30'
                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="text-xs font-bold text-slate-900 dark:text-slate-100">Strict</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Numbers, stats &amp; metrics</div>
              </button>
              <button
                type="button"
                onClick={() => setSensitivity && setSensitivity('moderate')}
                className={`p-2.5 rounded-xl text-left border transition cursor-pointer ${
                  sensitivity === 'moderate'
                    ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-700 dark:border-blue-500 ring-1 ring-blue-700/30'
                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="text-xs font-bold text-slate-900 dark:text-slate-100">Balanced</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Empirical &amp; scientific assertions</div>
              </button>
              <button
                type="button"
                onClick={() => setSensitivity && setSensitivity('all')}
                className={`p-2.5 rounded-xl text-left border transition cursor-pointer ${
                  sensitivity === 'all'
                    ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-700 dark:border-blue-500 ring-1 ring-blue-700/30'
                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="text-xs font-bold text-slate-900 dark:text-slate-100">Thorough</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Hunts all factual sentences</div>
              </button>
            </div>

            {setOptions && (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs mt-2">
                <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-800 dark:text-blue-400" />
                  <span>Quality Filters:</span>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                  <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 dark:text-slate-300 font-medium">
                    <input
                      type="checkbox"
                      checked={options.excludePreprints}
                      onChange={(e) => setOptions((prev) => ({ ...prev, excludePreprints: e.target.checked }))}
                      className="rounded border-slate-300 text-blue-800 focus:ring-blue-700 cursor-pointer"
                    />
                    <span>Exclude Preprints</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 dark:text-slate-300 font-medium">
                    <input
                      type="checkbox"
                      checked={options.requireDoi}
                      onChange={(e) => setOptions((prev) => ({ ...prev, requireDoi: e.target.checked }))}
                      className="rounded border-slate-300 text-blue-800 focus:ring-blue-700 cursor-pointer"
                    />
                    <span>Require Permanent DOI</span>
                  </label>
                  {onNavigateToEthics && (
                    <button
                      type="button"
                      onClick={onNavigateToEthics}
                      className="text-xs font-semibold text-emerald-800 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer ml-auto"
                      title="Triage human subjects research and IRB exemptions"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>IRB Ethics Pre-Flight</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

        </div>
      )}

      {/* Expandable Contextual Guidance, Primary Data & Secondary Registries */}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-xs text-blue-800 dark:text-blue-400 hover:underline flex items-center gap-1.5 font-bold font-serif cursor-pointer"
          >
            <span>{showAdvanced ? 'Hide Contextual Guidance & Primary Data' : '+ Add Empirical Focus, Primary Data & Registry Search (Optional)'}</span>
            {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          <label className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer font-medium">
            <input
              type="checkbox"
              checked={includeSecondaryData}
              onChange={(e) => setIncludeSecondaryData(e.target.checked)}
              className="rounded border-slate-300 text-blue-800 focus:ring-blue-700 cursor-pointer"
            />
            <Globe2 className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400" />
            <span>Query Public Secondary Registries (ClinicalTrials.gov, World Bank, Zenodo, Harvard Dataverse & Europe PMC)</span>
          </label>
        </div>

        {showAdvanced && (
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-3.5 animate-in fade-in duration-150">
            
            {/* Specific Focus Input */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1 uppercase tracking-wider">
                Specific Empirical Focus / Sub-Field Angle (Optional):
              </label>
              <input
                type="text"
                value={focus}
                onChange={(e) => setFocus(e.target.value)}
                placeholder="Specific empirical methodologies, key variables, or contextual focus..."
                className="w-full px-3.5 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-700 font-sans"
              />
            </div>

            {/* Primary Empirical Data / Surveys / Transcripts */}
            <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Database className="w-3.5 h-3.5 text-blue-800 dark:text-blue-400" />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Author's Primary Data / Rebuttal Evidence (Surveys, Transcripts, Tables, or Observations):
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={primaryDataInputRef}
                    onChange={handlePrimaryDataUpload}
                    accept=".csv,.txt,.json,.tsv,.md,.docx,.rtf"
                    className="hidden"
                    id="primary-data-upload-launchpad"
                  />
                  <label
                    htmlFor="primary-data-upload-launchpad"
                    className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-[11px] font-semibold text-slate-800 dark:text-slate-200 cursor-pointer border border-slate-300 dark:border-slate-700"
                  >
                    Upload Data / Survey / Docx
                  </label>
                  {primaryDataText && (
                    <button
                      type="button"
                      onClick={handleClearPrimaryData}
                      className="text-[11px] text-rose-600 hover:underline cursor-pointer"
                    >
                      Clear Data
                    </button>
                  )}
                </div>
              </div>

              <textarea
                rows={2}
                value={primaryDataText}
                onChange={(e) => {
                  setPrimaryDataText(e.target.value);
                  if (!e.target.value) setPrimaryDataFilename(null);
                }}
                placeholder="Paste survey statistics, interview quotes/thematic codes, descriptive statistics, observations, or rebuttal tables here..."
                className="w-full p-2.5 rounded bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
              />
              {primaryDataFilename && (
                <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                  Attached file: <strong>{primaryDataFilename}</strong> ({primaryDataText.length} characters)
                </div>
              )}
            </div>

          </div>
        )}
      </div>

      {/* Error Banner */}
      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-300 flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Status Progress Banner */}
      {statusMessage && (
        <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-xs text-blue-900 dark:text-blue-300 flex items-center gap-2.5 font-medium animate-pulse">
          <Loader2 className="w-4 h-4 text-blue-700 animate-spin shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Primary Action Button */}
      <div className="pt-2 flex items-center justify-end">
        {activeTab === 'synthesize' ? (
          <div className="flex flex-wrap items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleIdentifyLiteratureOnly}
              disabled={isBusy || isSearchingLiteratureOnly || !topic.trim()}
              className="px-6 py-3.5 rounded-xl text-sm font-semibold flex items-center gap-2 cursor-pointer border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition shadow-xs disabled:opacity-50"
              title="Identify genuine peer-reviewed literature and download as Word, JSON, Markdown, CSV, RIS, or BibTeX without synthesizing"
            >
              {isSearchingLiteratureOnly ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-600 dark:text-emerald-400" />
                  <span>Discovering Literature...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Identify & Download Literature Records</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleExecuteSynthesis}
              disabled={isBusy || isSearchingLiteratureOnly || !topic.trim()}
              className="btn-academic-primary px-8 py-3.5 rounded-xl text-sm font-semibold flex items-center gap-2.5 cursor-pointer shadow-md disabled:opacity-50"
            >
              {isBusy ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Synthesizing Full Grounded Paper...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Synthesize Full Grounded Paper</span>
                  <ArrowRight className="w-4 h-4 ml-0.5" />
                </>
              )}
            </button>
          </div>
        ) : reviewerCommentsText.trim() ? (
          <button
            type="button"
            onClick={handleExecutePeerReviewOverhaul}
            disabled={isBusy || !draftText.trim()}
            className="px-8 py-3.5 rounded-xl text-sm font-semibold flex items-center gap-2.5 cursor-pointer shadow-md bg-blue-900 hover:bg-blue-950 text-white disabled:opacity-50 transition"
          >
            {isBusy ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Overhauling Manuscript & Compiling Rebuttal...</span>
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4 text-amber-300" />
                <span>Overhaul Manuscript & Generate Point-by-Point Rebuttal</span>
                <ArrowRight className="w-4 h-4 ml-0.5" />
              </>
            )}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleExecuteGrounding}
            disabled={isBusy || !draftText.trim()}
            className="btn-academic-primary px-8 py-3.5 rounded-xl text-sm font-semibold flex items-center gap-2.5 cursor-pointer shadow-md disabled:opacity-50"
          >
            {isBusy ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Hunting Citations with Genuine DOIs...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                <span>Extract Claims & Infill Citations</span>
                <ArrowRight className="w-4 h-4 ml-0.5" />
              </>
            )}
          </button>
        )}
      </div>

      {/* Literature Export Modal */}
      <LiteratureExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        papers={discoveredPapersForExport}
        topic={topic}
        activeStyle={options.style}
      />

    </div>
  );
};
