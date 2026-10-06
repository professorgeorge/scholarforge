import React, { useState, useRef } from 'react';
import { 
  BookOpen, 
  Sparkles, 
  Search, 
  CheckCircle2, 
  Loader2, 
  ExternalLink, 
  AlertCircle, 
  ChevronDown, 
  ChevronUp, 
  Plus,
  Cpu,
  Settings2,
  ArrowRight,
  Database,
  Globe2,
  UploadCloud,
  FileCheck2,
  FileText,
  Trash2
} from 'lucide-react';
import type { AcademicPaper, CitationOptions, Claim } from '../types/citation';
import { huntLiteratureCorpus, huntAcademicPapers } from '../services/academicApi';
import { queryPublicSecondaryData, type SecondaryDataRecord } from '../services/secondaryDataService';
import { extractClaimsFromText } from '../services/claimExtractor';
import { extractTextFromManuscriptFile } from '../services/fileImportService';
import { 
  ACADEMIC_PROMPT_TEMPLATES, 
  generateArticleWithLLM, 
  synthesizeGroundedManuscript, 
  type LLMConfig 
} from '../services/llmService';

interface ResearchStudioPaneProps {
  onManuscriptReady: (manuscript: string, claims: Claim[]) => void;
  onInstantDraftReady: (draftText: string, autoGround: boolean) => void;
  options: CitationOptions;
  llmConfig: LLMConfig;
  onOpenSettings: () => void;
  isGrounding: boolean;
}

export const ResearchStudioPane: React.FC<ResearchStudioPaneProps> = ({
  onManuscriptReady,
  onInstantDraftReady,
  options,
  llmConfig,
  onOpenSettings,
  isGrounding,
}) => {
  const [synthesisStyle, setSynthesisStyle] = useState<'evidence_first' | 'draft_synthesis'>('evidence_first');
  const [topic, setTopic] = useState('');
  const [focus, setFocus] = useState('');
  const [targetCitationCount, setTargetCitationCount] = useState<number>(25);
  const [selectedTemplateId, setSelectedTemplateId] = useState(ACADEMIC_PROMPT_TEMPLATES[0].id);

  // Base Manuscript / Draft Text & File Ingestion (For Drafting & Infilling)
  const [baseDraftText, setBaseDraftText] = useState<string>('');
  const [isImportingDocx, setIsImportingDocx] = useState<boolean>(false);
  const [importedDocxName, setImportedDocxName] = useState<string | null>(null);
  const docxInputRef = useRef<HTMLInputElement>(null);

  // Secondary Data Query State
  const [includeSecondaryData, setIncludeSecondaryData] = useState<boolean>(true);
  const [discoveredSecondaryData, setDiscoveredSecondaryData] = useState<SecondaryDataRecord[]>([]);

  // Primary Data Upload / Input State & Expandable Panel
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [primaryDataText, setPrimaryDataText] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Evidence-First state
  const [isSearching, setIsSearching] = useState(false);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [discoveredPapers, setDiscoveredPapers] = useState<AcademicPaper[]>([]);
  const [selectedPaperIds, setSelectedPaperIds] = useState<Set<string>>(new Set());
  const [expandedAbstractId, setExpandedAbstractId] = useState<string | null>(null);
  const [customKeyword, setCustomKeyword] = useState('');

  // Active corpus viewing tab
  const [activeCorpusTab, setActiveCorpusTab] = useState<'papers' | 'secondary'>('papers');

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Handle Base Word Doc Ingestion
  const handleDocxUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImportingDocx(true);
    setErrorMsg('');
    try {
      const result = await extractTextFromManuscriptFile(file);
      setBaseDraftText(result.text);
      setImportedDocxName(result.filename);
      if (!topic.trim()) {
        const firstLine = result.text.split('\n')[0]?.trim();
        if (firstLine && firstLine.length < 120) {
          setTopic(firstLine);
        }
      }
    } catch (err: any) {
      setErrorMsg(`Failed to read Word document: ${err.message}`);
    } finally {
      setIsImportingDocx(false);
    }
  };

  const handleClearDocx = () => {
    setBaseDraftText('');
    setImportedDocxName(null);
    if (docxInputRef.current) docxInputRef.current.value = '';
  };

  // Handle Primary Data File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setPrimaryDataText(content);
        setShowAdvancedOptions(true);
      }
    };
    reader.readAsText(file);
  };

  const handleClearPrimaryData = () => {
    setPrimaryDataText('');
    setUploadedFileName(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Literature & Secondary Data Discovery
  const handleSearchLiterature = async () => {
    if (!topic.trim()) {
      setErrorMsg('Please enter a research topic or thesis.');
      return;
    }

    setErrorMsg('');
    setIsSearching(true);
    setDiscoveredPapers([]);
    setDiscoveredSecondaryData([]);
    setSelectedPaperIds(new Set());

    try {
      const fetchTarget = Math.max(targetCitationCount + 5, 25);
      
      const [papers, secondaryRecords] = await Promise.all([
        huntLiteratureCorpus(topic, focus, fetchTarget, options.excludePreprints),
        includeSecondaryData ? queryPublicSecondaryData(topic, focus) : Promise.resolve([]),
      ]);

      if (papers.length === 0) {
        setErrorMsg('No peer-reviewed papers found with DOIs for this exact topic. Try broader search terms.');
      } else {
        setDiscoveredPapers(papers);
        setDiscoveredSecondaryData(secondaryRecords);
        const autoSelected = new Set(papers.slice(0, targetCitationCount).map((p) => p.id));
        setSelectedPaperIds(autoSelected);
      }
    } catch (err: any) {
      setErrorMsg(`Literature discovery failed: ${err.message}`);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddCustomKeywordSearch = async () => {
    if (!customKeyword.trim()) return;
    setIsSearching(true);
    try {
      const extraPapers = await huntAcademicPapers([customKeyword], 8, options.excludePreprints);
      const existingIds = new Set(discoveredPapers.map((p) => p.id));
      const newUnique = extraPapers.filter((p) => !existingIds.has(p.id));
      
      setDiscoveredPapers((prev) => [...prev, ...newUnique]);
      setSelectedPaperIds((prev) => {
        const next = new Set(prev);
        newUnique.forEach((p) => next.add(p.id));
        return next;
      });
      setCustomKeyword('');
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsSearching(false);
    }
  };

  const togglePaperSelection = (paperId: string) => {
    setSelectedPaperIds((prev) => {
      const next = new Set(prev);
      if (next.has(paperId)) {
        next.delete(paperId);
      } else {
        next.add(paperId);
      }
      return next;
    });
  };

  const handleSelectAll = (select: boolean) => {
    if (select) {
      setSelectedPaperIds(new Set(discoveredPapers.map((p) => p.id)));
    } else {
      setSelectedPaperIds(new Set());
    }
  };

  const handleSynthesizeEvidenceFirst = async () => {
    const selectedPapers = discoveredPapers.filter((p) => selectedPaperIds.has(p.id));
    if (selectedPapers.length === 0) {
      setErrorMsg('Please select at least one paper for the synthesis corpus.');
      return;
    }

    setIsSynthesizing(true);
    setErrorMsg('');

    try {
      const manuscript = await synthesizeGroundedManuscript(
        topic, 
        focus, 
        selectedPapers, 
        llmConfig,
        primaryDataText.trim() || undefined,
        discoveredSecondaryData
      );
      const extractedClaims = extractClaimsFromText(manuscript, 'all');

      const claims: Claim[] = extractedClaims.map((claim, idx) => {
        const assignedPaper = selectedPapers[idx % selectedPapers.length];
        return {
          ...claim,
          candidatePapers: selectedPapers,
          selectedPaper: assignedPaper,
          status: 'found',
          confidence: 'high',
          isExcluded: false,
          citationNumber: idx + 1,
        };
      });

      onManuscriptReady(manuscript, claims);
    } catch (err: any) {
      setErrorMsg(`Synthesis failed: ${err.message}`);
    } finally {
      setIsSynthesizing(false);
    }
  };

  // Draft Synthesis & Infilling
  const handleGenerateDraftSynthesis = async (autoGround = true) => {
    if (!topic.trim() && !baseDraftText.trim()) {
      setErrorMsg('Please enter a research topic or upload/paste a base manuscript.');
      return;
    }

    setErrorMsg('');
    setIsGenerating(true);

    try {
      const secondaryData = includeSecondaryData ? await queryPublicSecondaryData(topic, focus) : [];
      const draft = await generateArticleWithLLM(
        topic, 
        focus, 
        selectedTemplateId, 
        llmConfig,
        primaryDataText.trim() || undefined,
        secondaryData,
        baseDraftText.trim() || undefined
      );
      onInstantDraftReady(draft, autoGround);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to generate academic draft.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Direct Infilling of Base Manuscript (When author wants to ground their text directly)
  const handleDirectGrounding = () => {
    if (!baseDraftText.trim()) {
      setErrorMsg('Please upload a Word document or paste your manuscript draft into the base draft box.');
      return;
    }
    onInstantDraftReady(baseDraftText, true);
  };

  return (
    <div className="academic-card rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-7 space-y-6 shadow-xs">
      
      {/* Header & Settings Trigger */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-900 dark:bg-blue-800 flex items-center justify-center text-white shadow-xs">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white font-serif">
                Scholarly Research & Manuscript Synthesis Studio
              </h2>
              <span className="text-xs px-2.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-800">
                Verified Scholarly Suite
              </span>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 font-sans">
              Peer-reviewed knowledge graph grounding (OpenAlex & Crossref) • Public data registries • Word (.docx) integration
            </p>
          </div>
        </div>

        {/* Master Settings Button */}
        <button
          onClick={onOpenSettings}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold border border-slate-300 dark:border-slate-700 transition cursor-pointer"
        >
          <Cpu className="w-4 h-4 text-blue-800 dark:text-blue-400" />
          <span>LLM: <strong>{llmConfig.provider.toUpperCase()}</strong></span>
          <Settings2 className="w-3.5 h-3.5 text-slate-500 ml-1" />
        </button>
      </div>

      {/* Synthesis Method Segmented Switcher */}
      <div className="p-1 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
        <button
          onClick={() => setSynthesisStyle('evidence_first')}
          className={`p-3 rounded-lg text-left transition cursor-pointer flex items-center gap-3 ${
            synthesisStyle === 'evidence_first'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs border border-slate-300 dark:border-slate-700'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <div className="p-2 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold font-serif flex items-center gap-1.5">
              <span>1. Evidence-First Synthesis</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-sans font-semibold">
                Corpus First
              </span>
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Curate verified literature & registries first → AI synthesizes grounded review across selected works.
            </div>
          </div>
        </button>

        <button
          onClick={() => setSynthesisStyle('draft_synthesis')}
          className={`p-3 rounded-lg text-left transition cursor-pointer flex items-center gap-3 ${
            synthesisStyle === 'draft_synthesis'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs border border-slate-300 dark:border-slate-700'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <div className="p-2 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-900 dark:text-blue-300 shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold font-serif flex items-center gap-1.5">
              <span>2. Manuscript Drafting & Infilling</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-100 dark:bg-blue-950 text-blue-900 dark:text-blue-300 font-sans font-semibold">
                Draft + Grounding
              </span>
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Draft new prose or upload Word (.docx) / paste existing text as base material → AI infills verified DOIs.
            </div>
          </div>
        </button>
      </div>

      {/* Input Section */}
      <div className="space-y-4">
        
        {/* Document Template Selector (For Drafting & Infilling) */}
        {synthesisStyle === 'draft_synthesis' && (
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2 uppercase tracking-wider">
              Document Format & Academic Structure:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {ACADEMIC_PROMPT_TEMPLATES.map((tmpl) => (
                <button
                  key={tmpl.id}
                  onClick={() => setSelectedTemplateId(tmpl.id)}
                  className={`p-3 rounded-xl text-left border transition cursor-pointer ${
                    selectedTemplateId === tmpl.id
                      ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-700 dark:border-blue-500 text-slate-900 dark:text-white ring-1 ring-blue-700/30'
                      : 'bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-white'
                  }`}
                >
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100 font-serif">{tmpl.name}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{tmpl.description}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Literature Search Scope (For Evidence-First) */}
        {synthesisStyle === 'evidence_first' && (
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                Literature Search Scope:
              </span>
              <span className="text-[11px] text-slate-500">
                Select the depth and breadth of peer-reviewed journal discovery.
              </span>
            </div>

            <div className="inline-flex rounded-lg bg-slate-200/80 dark:bg-slate-900 p-0.5 border border-slate-300 dark:border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setTargetCitationCount(15)}
                className={`px-3 py-1.5 rounded-md font-semibold transition cursor-pointer ${
                  targetCitationCount === 15
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Brief Synthesis
              </button>
              <button
                type="button"
                onClick={() => setTargetCitationCount(25)}
                className={`px-3 py-1.5 rounded-md font-semibold transition cursor-pointer ${
                  targetCitationCount === 25
                    ? 'bg-blue-900 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Standard Research Review
              </button>
              <button
                type="button"
                onClick={() => setTargetCitationCount(35)}
                className={`px-3 py-1.5 rounded-md font-semibold transition cursor-pointer ${
                  targetCitationCount === 35
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Comprehensive Survey
              </button>
            </div>
          </div>
        )}

        {/* Topic Input */}
        <div>
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2 uppercase tracking-wider">
            Research Topic & Core Thesis:
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Enter your research topic, thesis statement, or inquiry across any discipline..."
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-base text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-700 focus:ring-1 focus:ring-blue-700 transition font-sans"
              />
            </div>

            {/* In Evidence-First mode, show Discover button */}
            {synthesisStyle === 'evidence_first' && (
              <button
                onClick={handleSearchLiterature}
                disabled={isSearching || !topic.trim()}
                className={`px-6 py-3 rounded-xl text-sm font-semibold flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50 transition ${
                  isSearching
                    ? 'bg-gradient-to-r from-blue-700 via-indigo-600 to-blue-700 text-white animate-pulse ring-4 ring-blue-500/30'
                    : 'btn-academic-primary'
                }`}
              >
                {isSearching ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white shrink-0" />
                    <span className="font-bold">Discovering Literature...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>Discover Literature & Data</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Base Manuscript Draft / Word .docx Section (For Drafting & Infilling Studio) */}
        {synthesisStyle === 'draft_synthesis' && (
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-800 dark:text-blue-400" />
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                  Base Manuscript Draft / Existing Word Document (Optional Base Material)
                </span>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="file"
                  ref={docxInputRef}
                  onChange={handleDocxUpload}
                  accept=".docx,.txt,.md,.rtf,.tex"
                  className="hidden"
                  id="docx-base-upload"
                />
                <label
                  htmlFor="docx-base-upload"
                  className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  {isImportingDocx ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-800" />
                  ) : (
                    <UploadCloud className="w-3.5 h-3.5 text-blue-800 dark:text-blue-400" />
                  )}
                  <span>{isImportingDocx ? 'Importing...' : 'Upload Word Doc (.docx)'}</span>
                </label>

                {baseDraftText && (
                  <button
                    type="button"
                    onClick={handleClearDocx}
                    className="text-xs text-rose-600 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear Base Draft</span>
                  </button>
                )}
              </div>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Have existing text, rough paragraphs, or an unreferenced manuscript draft? Paste it below or upload your Word file. The engine will use it as foundational base material to expand, synthesize, and ground with genuine peer-reviewed DOIs.
            </p>

            {importedDocxName && (
              <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-300 flex items-center gap-2 font-medium">
                <FileCheck2 className="w-4 h-4 text-emerald-600" />
                <span>Base file loaded: <strong>{importedDocxName}</strong> ({baseDraftText.length.toLocaleString()} characters)</span>
              </div>
            )}

            <textarea
              rows={4}
              value={baseDraftText}
              onChange={(e) => setBaseDraftText(e.target.value)}
              placeholder="Or paste your rough manuscript draft, ungrounded thesis section, or literature notes here..."
              className="w-full p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white font-serif placeholder-slate-400 focus:outline-none focus:border-blue-700"
            />
          </div>
        )}

        {/* Expandable Empirical Guidance & Primary Data Panel */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
              className="text-xs text-blue-800 dark:text-blue-400 hover:underline flex items-center gap-1.5 font-bold font-serif cursor-pointer"
            >
              <span>{showAdvancedOptions ? 'Hide Contextual Guidance & Primary Data' : '+ Add Empirical Focus, Primary Data & Registry Search (Optional)'}</span>
              {showAdvancedOptions ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer font-medium">
                <input
                  type="checkbox"
                  checked={includeSecondaryData}
                  onChange={(e) => setIncludeSecondaryData(e.target.checked)}
                  className="rounded border-slate-300 text-blue-800 focus:ring-blue-700 cursor-pointer"
                />
                <Globe2 className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400" />
                <span>Query Public Secondary Registries (ClinicalTrials / World Bank)</span>
              </label>
            </div>
          </div>

          {showAdvancedOptions && (
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-3 animate-in fade-in duration-150">
              {/* Specific Focus Input */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1 uppercase tracking-wider">
                  Specific Empirical Focus / Sub-Field Bias (Optional):
                </label>
                <input
                  type="text"
                  value={focus}
                  onChange={(e) => setFocus(e.target.value)}
                  placeholder="e.g. Specific methodologies, randomized clinical cohorts, econometric models, or benchmark datasets..."
                  className="w-full px-3.5 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-700 font-sans"
                />
                <span className="text-[11px] text-slate-500 block mt-0.5">
                  Steers literature and claim discovery to prioritize journals and studies specializing in these specific empirical angles.
                </span>
              </div>

              {/* Primary Data Attachment */}
              <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database className="w-3.5 h-3.5 text-blue-800 dark:text-blue-400" />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Author's Primary Experimental Dataset (Optional)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept=".csv,.txt,.json,.tsv,.md"
                      className="hidden"
                      id="primary-data-upload-unified"
                    />
                    <label
                      htmlFor="primary-data-upload-unified"
                      className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-[11px] font-semibold text-slate-800 dark:text-slate-200 cursor-pointer border border-slate-300 dark:border-slate-700"
                    >
                      Upload CSV / Dataset
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
                  rows={3}
                  value={primaryDataText}
                  onChange={(e) => {
                    setPrimaryDataText(e.target.value);
                    if (!e.target.value) setUploadedFileName(null);
                  }}
                  placeholder="Or paste your raw findings, observations, or statistical table here to weave into the paper..."
                  className="w-full p-2.5 rounded bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
                />
                {uploadedFileName && (
                  <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                    Attached file: <strong>{uploadedFileName}</strong> ({primaryDataText.length} characters)
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Error message */}
        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-300 flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

      </div>

      {/* High-Visibility Live Search Progress HUD */}
      {isSearching && (
        <div className="pt-2 border-t border-slate-200 dark:border-slate-800 animate-in fade-in duration-200">
          <div className="p-8 rounded-2xl bg-gradient-to-b from-blue-50/90 via-white to-slate-50/90 dark:from-slate-900/95 dark:via-blue-950/30 dark:to-slate-900/95 border-2 border-blue-400 dark:border-blue-700 shadow-xl text-center space-y-5">
            <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-blue-500/20 animate-ping duration-1000" />
              <div className="absolute inset-1 rounded-full border-2 border-blue-500/40 animate-spin border-t-transparent" />
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center shadow-lg shadow-blue-500/30">
                <Search className="w-6 h-6 animate-pulse" />
              </div>
            </div>
            <div className="space-y-1.5 max-w-md mx-auto">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-900 dark:text-blue-300 border border-blue-300 dark:border-blue-800 text-xs font-bold tracking-wide uppercase font-mono">
                <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400 animate-ping" />
                <span>Multi-Registry Literature Discovery Active</span>
              </div>
              <h4 className="text-base font-bold font-serif text-slate-900 dark:text-white">
                Harvesting Verified Empirical Corpus
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-sans">
                Querying OpenAlex, Crossref, Europe PMC, and Semantic Scholar concurrently...
              </p>
            </div>
            <div className="w-full max-w-lg mx-auto h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-emerald-500 rounded-full animate-pulse w-full" />
            </div>
          </div>
        </div>
      )}

      {/* Mode 1: Discovered Corpus Grid (Evidence-First) with Tabs for Literature & Secondary Data */}
      {synthesisStyle === 'evidence_first' && (discoveredPapers.length > 0 || discoveredSecondaryData.length > 0) && (
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-4 animate-in fade-in duration-200">
          
          {/* Corpus Tabs Header */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveCorpusTab('papers')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold font-serif flex items-center gap-2 transition cursor-pointer ${
                  activeCorpusTab === 'papers'
                    ? 'bg-blue-900 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Peer-Reviewed Journal Papers ({discoveredPapers.length})</span>
              </button>

              {discoveredSecondaryData.length > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveCorpusTab('secondary')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold font-serif flex items-center gap-2 transition cursor-pointer ${
                    activeCorpusTab === 'secondary'
                      ? 'bg-blue-900 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  <Globe2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Public Secondary Datasets ({discoveredSecondaryData.length})</span>
                </button>
              )}
            </div>

            {activeCorpusTab === 'papers' && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSelectAll(selectedPaperIds.size < discoveredPapers.length)}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-200 cursor-pointer"
                >
                  {selectedPaperIds.size < discoveredPapers.length ? 'Select All' : 'Deselect All'}
                </button>

                <input
                  type="text"
                  value={customKeyword}
                  onChange={(e) => setCustomKeyword(e.target.value)}
                  placeholder="Add keyword query..."
                  className="px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400"
                />
                <button
                  onClick={handleAddCustomKeywordSearch}
                  disabled={isSearching || !customKeyword.trim()}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold flex items-center gap-1 border border-slate-300 dark:border-slate-700 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </div>
            )}
          </div>

          {/* Tab 1: Paper Cards List */}
          {activeCorpusTab === 'papers' && (
            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {discoveredPapers.map((paper, idx) => {
                const isSelected = selectedPaperIds.has(paper.id);
                const isExpanded = expandedAbstractId === paper.id;
                return (
                  <div
                    key={paper.id}
                    className={`p-4 rounded-xl border transition ${
                      isSelected
                        ? 'bg-blue-50/50 dark:bg-blue-950/40 border-blue-600 dark:border-blue-500'
                        : 'bg-slate-50/50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 opacity-60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1">
                        <span className="font-mono text-xs font-bold text-slate-400 mt-1 shrink-0">
                          #{idx + 1}
                        </span>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => togglePaperSelection(paper.id)}
                          className="mt-1 rounded border-slate-300 text-blue-800 focus:ring-blue-700 cursor-pointer"
                        />
                        <div className="flex-1">
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white font-serif leading-snug">
                            {paper.title}
                          </h4>
                          <div className="text-xs text-slate-600 dark:text-slate-400 mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                            <span className="font-medium text-slate-800 dark:text-slate-200">
                              {paper.authors.slice(0, 3).map((a) => a.name).join(', ') + (paper.authors.length > 3 ? ' et al.' : '')}
                            </span>
                            <span>•</span>
                            <span className="font-semibold text-slate-700 dark:text-slate-300">{paper.year}</span>
                            <span>•</span>
                            <span className="italic text-blue-900 dark:text-blue-400 font-medium">{paper.venue}</span>
                            {paper.citationCount > 0 && (
                              <>
                                <span>•</span>
                                <span className="px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px]">
                                  {paper.citationCount.toLocaleString()} cites
                                </span>
                              </>
                            )}
                          </div>

                          {/* Abstract */}
                          {isExpanded && paper.abstract && (
                            <div className="mt-2.5 p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-serif animate-in fade-in duration-150">
                              {paper.abstract}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {paper.abstract && (
                          <button
                            onClick={() => setExpandedAbstractId(isExpanded ? null : paper.id)}
                            className="text-xs text-slate-600 dark:text-slate-400 hover:text-blue-800 flex items-center gap-0.5 cursor-pointer font-medium"
                          >
                            <span>Abstract</span>
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                        )}

                        {paper.url && (
                          <a
                            href={paper.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-800 dark:text-blue-400 hover:underline flex items-center gap-1 font-semibold"
                            title="View verified DOI"
                          >
                            <span>DOI</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Tab 2: Discovered Secondary Datasets & Registries */}
          {activeCorpusTab === 'secondary' && (
            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {discoveredSecondaryData.map((rec) => (
                <div
                  key={rec.id}
                  className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-2"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 uppercase tracking-wide">
                          {rec.sourceName}
                        </span>
                        <span className="text-xs text-slate-500 font-mono">{rec.category}</span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white font-serif mt-1">
                        {rec.title}
                      </h4>
                    </div>

                    <a
                      href={rec.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-emerald-800 dark:text-emerald-400 hover:underline flex items-center gap-1 font-semibold shrink-0"
                    >
                      <span>Public Registry</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  <p className="text-xs text-slate-700 dark:text-slate-300 font-sans leading-relaxed">
                    {rec.description}
                  </p>

                  <div className="pt-1.5 text-xs text-emerald-900 dark:text-emerald-300 font-mono">
                    <strong>Metrics & Parameters:</strong> {rec.metrics}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Action Button: Trigger Grounded Synthesis */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
            <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">
              Ready to synthesize comprehensive literature review from <strong>{selectedPaperIds.size} verified papers</strong>
              {discoveredSecondaryData.length > 0 ? ` + ${discoveredSecondaryData.length} public secondary datasets` : ''}
              {primaryDataText ? ' + your primary dataset' : ''}.
            </div>

            <button
              onClick={handleSynthesizeEvidenceFirst}
              disabled={isSynthesizing || selectedPaperIds.size === 0}
              className="btn-academic-primary px-7 py-3 rounded-xl text-sm font-semibold flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
            >
              {isSynthesizing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Synthesizing Literature & Secondary Data...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Synthesize Grounded Manuscript</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Mode 2: Drafting & Infilling Action Footer */}
      {synthesisStyle === 'draft_synthesis' && (
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-700 dark:text-blue-400" />
            <span>
              {baseDraftText.trim() 
                ? 'Base manuscript loaded • Choose to enhance with AI or ground claims directly'
                : 'LLM drafts prose from your thesis • ScholarForge verifies and infills genuine DOIs'}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {baseDraftText.trim() && (
              <button
                type="button"
                onClick={handleDirectGrounding}
                disabled={isGrounding}
                className="px-4 py-2.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950 dark:hover:bg-emerald-900 text-emerald-900 dark:text-emerald-200 text-sm font-semibold flex items-center gap-2 transition border border-emerald-300 dark:border-emerald-800 cursor-pointer shadow-2xs"
                title="Keep your exact words verbatim and extract claims & infill verified DOIs"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Ground Base Draft Directly</span>
              </button>
            )}

            <button
              onClick={() => handleGenerateDraftSynthesis(false)}
              disabled={isGenerating || (!topic.trim() && !baseDraftText.trim())}
              className="px-4 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-sm font-semibold flex items-center gap-2 transition disabled:opacity-50 cursor-pointer border border-slate-300 dark:border-slate-700"
            >
              {isGenerating ? <Loader2 className="w-4 h-4 animate-spin text-blue-700" /> : <FileText className="w-4 h-4 text-blue-700 dark:text-blue-400" />}
              <span>Draft Prose Only</span>
            </button>

            <button
              onClick={() => handleGenerateDraftSynthesis(true)}
              disabled={isGenerating || isGrounding || (!topic.trim() && !baseDraftText.trim())}
              className="btn-academic-primary px-6 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2.5 disabled:opacity-50 cursor-pointer shadow-xs"
            >
              {isGenerating || isGrounding ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>{isGenerating ? 'Synthesizing with LLM...' : 'Hunting Verified Citations with DOIs...'}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Draft & Ground with Real Citations</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
