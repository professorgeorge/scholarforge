import React, { useState, useRef } from 'react';
import { 
  ShieldCheck, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Copy, 
  Check, 
  Download, 
  ExternalLink, 
  UploadCloud, 
  Trash2, 
  Loader2, 
  BookOpen, 
  Wrench, 
  ChevronDown, 
  ChevronUp, 
  Compass,
  FileCode2,
  Sparkles,
  TrendingUp,
  Award,
  GraduationCap,
  Link2,
  BadgeCheck,
  FileText
} from 'lucide-react';
import { 
  verifyReferenceBatch, 
  SAMPLE_VERIFICATION_REFERENCES, 
  type BatchVerificationReport, 
  type VerifiedReferenceResult 
} from '../services/referenceVerifierService';
import { 
  compilePicoQueries, 
  buildPlatformUrls, 
  SAMPLE_PICO_PRESETS, 
  type PicoQueryState 
} from '../services/picoQueryService';
import { 
  resolveGoogleScholarDossier, 
  type ScholarImpactProfile,
  type GoogleScholarInput 
} from '../services/scholarImpactService';
import { CITATION_STYLES } from '../services/citationFormatter';
import type { CitationStyle } from '../types/citation';
import type { LLMConfig } from '../services/llmService';
import { DEFAULT_LLM_CONFIG } from '../services/llmService';
import confetti from 'canvas-confetti';

interface SupplementaryToolsProps {
  llmConfig?: LLMConfig;
}

export const SupplementaryTools: React.FC<SupplementaryToolsProps> = ({ 
  llmConfig = DEFAULT_LLM_CONFIG 
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(true);
  const [activeTool, setActiveTool] = useState<'verifier' | 'pico_compiler' | 'scholar_impact' | 'doi_resolver'>('verifier');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Tool 1: Reference Verifier State
  const [rawBibliography, setRawBibliography] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [verifyProgress, setVerifyProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 });
  const [report, setReport] = useState<BatchVerificationReport | null>(null);
  const [selectedOutputStyle, setSelectedOutputStyle] = useState<CitationStyle>('apa');
  const [statusFilter, setStatusFilter] = useState<'all' | 'verified' | 'discrepancy' | 'not_found'>('all');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Tool 2: PICO Systematic Search Strategy Compiler State
  const [picoState, setPicoState] = useState<PicoQueryState>({
    population: 'ICU nurses, critical care staff',
    intervention: 'mindfulness training, peer support programs',
    comparison: 'standard staffing, no intervention',
    outcome: 'burnout rates, medication errors, turnover intention',
  });

  // Tool 3: ScholarImpact Pro State (Google Scholar Profile Only)
  const [scholarInput, setScholarInput] = useState<GoogleScholarInput>({
    scholarUrlOrId: 'https://scholar.google.com/citations?user=1knki-oAAAAJ&hl=en',
    pastedScholarText: '',
  });
  const [isFetchingImpact, setIsFetchingImpact] = useState<boolean>(false);
  const [impactProfile, setImpactProfile] = useState<ScholarImpactProfile | null>(null);
  const [impactError, setImpactError] = useState<string>('');
  const [activeBioTab, setActiveBioTab] = useState<'tenure' | 'speaker' | 'grant'>('tenure');

  // Tool 4: DOI / BibTeX Resolver State
  const [doiInput, setDoiInput] = useState<string>('');
  const [isResolvingDoi, setIsResolvingDoi] = useState<boolean>(false);
  const [resolvedResult, setResolvedResult] = useState<VerifiedReferenceResult | null>(null);
  const [doiError, setDoiError] = useState<string>('');

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setRawBibliography(content);
        setReport(null);
      }
    };
    reader.readAsText(file);
  };

  const handleLoadSample = () => {
    setRawBibliography(SAMPLE_VERIFICATION_REFERENCES);
    setReport(null);
  };

  const handleClear = () => {
    setRawBibliography('');
    setReport(null);
  };

  const handleExecuteVerification = async () => {
    if (!rawBibliography.trim() || isVerifying) return;

    setIsVerifying(true);
    setReport(null);
    setVerifyProgress({ current: 0, total: 0 });

    try {
      const batchReport = await verifyReferenceBatch(rawBibliography, (curr, tot) => {
        setVerifyProgress({ current: curr, total: tot });
      });

      setReport(batchReport);
      confetti({
        particleCount: 50,
        spread: 70,
        origin: { y: 0.9 },
        colors: ['#1e3a8a', '#059669', '#d97706'],
      });
    } catch (err) {
      console.error('Batch verification failed:', err);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCopyAllCorrected = () => {
    if (!report) return;
    const correctedList = report.results
      .map((r, i) => {
        const text = r.correctedCitations[selectedOutputStyle] || r.raw;
        return `[${i + 1}] ${text}`;
      })
      .join('\n\n');
    handleCopy(correctedList, 'copy-all-corrected');
  };

  const handleExportCsv = () => {
    if (!report) return;
    const headers = ['#', 'Status', 'Confidence', 'Original Citation', 'Verified Title', 'Verified DOI', 'Discrepancies'];
    const rows = report.results.map((r, idx) => [
      idx + 1,
      r.status.toUpperCase(),
      `${r.confidence}%`,
      `"${r.raw.replace(/"/g, '""')}"`,
      `"${(r.verifiedPaper?.title || '').replace(/"/g, '""')}"`,
      `"${r.verifiedPaper?.doi || 'N/A'}"`,
      `"${r.discrepancies.map((d) => d.message).join('; ').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scholar_verification_audit_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportBibtex = () => {
    if (!report) return;
    const bibList = report.results
      .filter((r) => r.verifiedPaper)
      .map((r) => r.correctedCitations['bibtex'])
      .filter(Boolean)
      .join('\n\n');

    const blob = new Blob([bibList], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'verified_references.bib';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Tool 2: PICO Handlers
  const compiledPico = compilePicoQueries(picoState);
  const platformUrls = buildPlatformUrls(compiledPico);

  const handleApplyPicoPreset = (preset: typeof SAMPLE_PICO_PRESETS[0]) => {
    setPicoState({
      population: preset.population,
      intervention: preset.intervention,
      comparison: preset.comparison,
      outcome: preset.outcome,
    });
  };

  // Tool 3: ScholarImpact Google Scholar Handler
  const handleExecuteImpactSearch = async (customInput?: GoogleScholarInput) => {
    const inputToUse = customInput || scholarInput;
    if (!inputToUse.scholarUrlOrId?.trim() && !inputToUse.pastedScholarText?.trim()) {
      setImpactError('Please provide your Google Scholar profile link or paste your profile text / citations table.');
      return;
    }

    setIsFetchingImpact(true);
    setImpactError('');
    setImpactProfile(null);

    try {
      const profile = await resolveGoogleScholarDossier(inputToUse, llmConfig);
      setImpactProfile(profile);
    } catch (err: any) {
      setImpactError(err.message || 'Google Scholar profile resolution failed.');
    } finally {
      setIsFetchingImpact(false);
    }
  };

  // Tool 4: Resolver Handler
  const handleResolveSingleDoi = async () => {
    if (!doiInput.trim() || isResolvingDoi) return;
    setIsResolvingDoi(true);
    setResolvedResult(null);
    setDoiError('');

    try {
      const res = await verifyReferenceBatch(doiInput.trim());
      if (res.results.length > 0 && res.results[0].verifiedPaper) {
        setResolvedResult(res.results[0]);
      } else {
        setDoiError('Could not resolve DOI or citation. Please verify the identifier.');
      }
    } catch (err: any) {
      setDoiError(err.message || 'Lookup failed.');
    } finally {
      setIsResolvingDoi(false);
    }
  };

  const filteredResults = report
    ? report.results.filter((r) => {
        if (statusFilter === 'all') return true;
        return r.status === statusFilter;
      })
    : [];

  return (
    <section className="academic-card rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm mt-8 animate-in fade-in duration-200">
      
      {/* Header Banner */}
      <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-950/70 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-900 dark:bg-blue-800 flex items-center justify-center text-white shadow-2xs">
            <Wrench className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white font-serif">
                Supplementary Scholarly Tools Suite
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-900 dark:text-blue-300 border border-blue-200 dark:border-blue-800 uppercase">
                ScholarForge Integrated Toolkit
              </span>
            </div>
            <p className="text-xs text-slate-500 font-sans">
              Reference Authenticity Verifier • PICO Search Matrix • ORCID & Scholar Co-Brewing Dossier • Instant DOI Resolver
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer border border-slate-300 dark:border-slate-700"
        >
          <span>{isOpen ? 'Collapse Tools' : 'Expand Tools'}</span>
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Expanded Tools Body */}
      {isOpen && (
        <div className="p-6 space-y-6">
          
          {/* Tool Navigation Switcher */}
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-4">
            <button
              onClick={() => setActiveTool('verifier')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold font-serif flex items-center gap-1.5 transition cursor-pointer ${
                activeTool === 'verifier'
                  ? 'bg-blue-900 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Reference Authenticity Verifier</span>
            </button>

            <button
              onClick={() => setActiveTool('pico_compiler')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold font-serif flex items-center gap-1.5 transition cursor-pointer ${
                activeTool === 'pico_compiler'
                  ? 'bg-blue-900 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              <Compass className="w-4 h-4 text-amber-400" />
              <span>ScholarCite Express: PICO Matrix</span>
            </button>

            <button
              onClick={() => setActiveTool('scholar_impact')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold font-serif flex items-center gap-1.5 transition cursor-pointer ${
                activeTool === 'scholar_impact'
                  ? 'bg-blue-900 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              <GraduationCap className="w-4 h-4 text-blue-400" />
              <span>ScholarImpact Pro: Google Scholar Dossier</span>
            </button>

            <button
              onClick={() => setActiveTool('doi_resolver')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold font-serif flex items-center gap-1.5 transition cursor-pointer ${
                activeTool === 'doi_resolver'
                  ? 'bg-blue-900 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              <BookOpen className="w-4 h-4 text-blue-400" />
              <span>Instant DOI Resolver</span>
            </button>
          </div>

          {/* TOOL 1: REFERENCE VERIFIER & HALLUCINATION DETECTOR */}
          {activeTool === 'verifier' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              
              <div className="flex flex-wrap items-center justify-between gap-3">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider font-serif">
                  Paste References List, Bibliography, or AI Output:
                </label>

                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept=".txt,.bib,.docx"
                    className="hidden"
                    id="supp-file-upload"
                  />
                  <label
                    htmlFor="supp-file-upload"
                    className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 cursor-pointer border border-slate-300 dark:border-slate-700"
                  >
                    <UploadCloud className="w-3.5 h-3.5 text-blue-800 dark:text-blue-400" />
                    <span>Upload File (.txt/.bib)</span>
                  </label>

                  <button
                    type="button"
                    onClick={handleLoadSample}
                    className="px-2.5 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 text-xs font-semibold text-blue-900 dark:text-blue-300 border border-blue-200 dark:border-blue-800 cursor-pointer"
                  >
                    Load Test Sample
                  </button>

                  {rawBibliography && (
                    <button
                      type="button"
                      onClick={handleClear}
                      className="text-xs text-rose-600 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Clear</span>
                    </button>
                  )}
                </div>
              </div>

              <textarea
                rows={6}
                value={rawBibliography}
                onChange={(e) => setRawBibliography(e.target.value)}
                placeholder="Paste numbered or unnumbered references here (e.g. '[1] Vaswani et al. (2017). Attention is all you need...'). ScholarForge will check every reference against OpenAlex and Crossref, detecting AI hallucinations, wrong publication years, and misspelled authors."
                className="w-full p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white leading-relaxed placeholder-slate-400 focus:outline-none focus:border-blue-700"
              />

              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                    Format Corrected Output in:
                  </span>
                  <select
                    value={selectedOutputStyle}
                    onChange={(e) => setSelectedOutputStyle(e.target.value as CitationStyle)}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none"
                  >
                    {CITATION_STYLES.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.name}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={handleExecuteVerification}
                  disabled={isVerifying || !rawBibliography.trim()}
                  className="btn-academic-primary px-6 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
                >
                  {isVerifying ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                      <span>Auditing References ({verifyProgress.current}/{verifyProgress.total})...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>Verify Scholarly References & Audit Authenticity</span>
                    </>
                  )}
                </button>
              </div>

              {isVerifying && verifyProgress.total > 0 && (
                <div className="space-y-1 pt-2">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-sans">
                    <span>Cross-referencing OpenAlex & Crossref repositories...</span>
                    <span>{Math.round((verifyProgress.current / verifyProgress.total) * 100)}%</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-blue-900 dark:bg-blue-500 h-1.5 rounded-full transition-all duration-200"
                      style={{ width: `${(verifyProgress.current / verifyProgress.total) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {report && (
                <div className="space-y-5 pt-4 border-t border-slate-200 dark:border-slate-800 animate-in fade-in duration-200">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                      <div className="text-[11px] font-semibold text-slate-500 uppercase">Authenticity Score</div>
                      <div className="text-xl font-bold font-serif text-slate-900 dark:text-white mt-0.5">
                        {report.authenticityScore}%
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                      <div className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-400 uppercase flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Verified (100% Genuine)</span>
                      </div>
                      <div className="text-xl font-bold font-serif text-emerald-900 dark:text-emerald-300 mt-0.5">
                        {report.verifiedCount} / {report.total}
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800">
                      <div className="text-[11px] font-semibold text-amber-800 dark:text-amber-400 uppercase flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Discrepancies Fixed</span>
                      </div>
                      <div className="text-xl font-bold font-serif text-amber-900 dark:text-amber-300 mt-0.5">
                        {report.discrepancyCount}
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800">
                      <div className="text-[11px] font-semibold text-rose-800 dark:text-rose-400 uppercase flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Fabricated / Hallucinated</span>
                      </div>
                      <div className="text-xl font-bold font-serif text-rose-900 dark:text-rose-300 mt-0.5">
                        {report.notFoundCount}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-1 text-xs">
                      <span className="font-semibold text-slate-500 mr-1.5">Filter:</span>
                      <button
                        onClick={() => setStatusFilter('all')}
                        className={`px-2.5 py-1 rounded-md font-medium cursor-pointer ${
                          statusFilter === 'all' ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900' : 'text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        All ({report.total})
                      </button>
                      <button
                        onClick={() => setStatusFilter('verified')}
                        className={`px-2.5 py-1 rounded-md font-medium cursor-pointer ${
                          statusFilter === 'verified' ? 'bg-emerald-800 text-white' : 'text-emerald-700 hover:bg-emerald-100'
                        }`}
                      >
                        Verified ({report.verifiedCount})
                      </button>
                      <button
                        onClick={() => setStatusFilter('discrepancy')}
                        className={`px-2.5 py-1 rounded-md font-medium cursor-pointer ${
                          statusFilter === 'discrepancy' ? 'bg-amber-800 text-white' : 'text-amber-700 hover:bg-amber-100'
                        }`}
                      >
                        Discrepancies ({report.discrepancyCount})
                      </button>
                      <button
                        onClick={() => setStatusFilter('not_found')}
                        className={`px-2.5 py-1 rounded-md font-medium cursor-pointer ${
                          statusFilter === 'not_found' ? 'bg-rose-800 text-white' : 'text-rose-700 hover:bg-rose-100'
                        }`}
                      >
                        Hallucinations ({report.notFoundCount})
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={handleCopyAllCorrected}
                        className="px-2.5 py-1 rounded-md bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      >
                        {copiedKey === 'copy-all-corrected' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>Copy All Corrected ({selectedOutputStyle.toUpperCase()})</span>
                      </button>

                      <button
                        onClick={handleExportCsv}
                        className="px-2.5 py-1 rounded-md bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      >
                        <Download className="w-3.5 h-3.5 text-blue-700" />
                        <span>Audit CSV</span>
                      </button>

                      <button
                        onClick={handleExportBibtex}
                        className="px-2.5 py-1 rounded-md bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      >
                        <Download className="w-3.5 h-3.5 text-purple-700" />
                        <span>BibTeX (.bib)</span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                    {filteredResults.map((item, idx) => (
                      <div
                        key={item.id}
                        className={`p-4 rounded-xl border space-y-2.5 transition ${
                          item.status === 'verified'
                            ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/60'
                            : item.status === 'discrepancy'
                            ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/60'
                            : 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60'
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-slate-500">#{idx + 1}</span>
                            
                            {item.status === 'verified' && (
                              <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold text-[11px] flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Verified Authentic ({item.confidence}%)</span>
                              </span>
                            )}

                            {item.status === 'discrepancy' && (
                              <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold text-[11px] flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                <span>Discrepancy Corrected ({item.confidence}%)</span>
                              </span>
                            )}

                            {item.status === 'not_found' && (
                              <span className="px-2 py-0.5 rounded-md bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 font-bold text-[11px] flex items-center gap-1">
                                <XCircle className="w-3 h-3" />
                                <span>Fabricated / Hallucination Detected (0%)</span>
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            {item.verifiedPaper?.url && (
                              <a
                                href={item.verifiedPaper.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-800 dark:text-blue-400 hover:underline flex items-center gap-1 font-semibold"
                              >
                                <span>Official DOI Record</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                            <a
                              href={item.scholarUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-slate-500 hover:underline flex items-center gap-1"
                              title="Search Google Scholar"
                            >
                              <span>Scholar Search</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </div>

                        <div className="text-xs text-slate-700 dark:text-slate-300 font-mono bg-white/70 dark:bg-slate-900/70 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5 font-sans">
                            Provided Citation:
                          </span>
                          <span>{item.raw}</span>
                        </div>

                        {item.discrepancies.length > 0 && (
                          <div className="space-y-1">
                            {item.discrepancies.map((d, dIdx) => (
                              <div
                                key={dIdx}
                                className="text-xs text-amber-900 dark:text-amber-300 font-medium flex items-start gap-1.5"
                              >
                                <span className="text-amber-600 font-bold shrink-0">•</span>
                                <span>{d.message}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {item.verifiedPaper && (
                          <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-blue-900 dark:text-blue-300 uppercase tracking-wider">
                                Corrected Citation ({selectedOutputStyle.toUpperCase()}):
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCopy(item.correctedCitations[selectedOutputStyle], item.id)}
                                className="text-xs text-blue-800 dark:text-blue-400 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                              >
                                {copiedKey === item.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                                <span>{copiedKey === item.id ? 'Copied' : 'Copy'}</span>
                              </button>
                            </div>
                            <p className="font-serif text-xs text-slate-900 dark:text-white leading-relaxed">
                              {item.correctedCitations[selectedOutputStyle]}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                </div>
              )}

            </div>
          )}

          {/* TOOL 2: SCHOLARCITE EXPRESS PICO SYSTEMATIC SEARCH MATRIX */}
          {activeTool === 'pico_compiler' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              
              <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60">
                <span className="text-xs font-bold text-amber-950 dark:text-amber-200 font-serif flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>Evidence-Based PICO Search Strategy Formulator</span>
                </span>
                
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] text-slate-500 font-medium">Load Template:</span>
                  {SAMPLE_PICO_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleApplyPicoPreset(preset)}
                      className="px-2 py-1 rounded bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 text-[11px] font-semibold text-slate-800 dark:text-slate-200 cursor-pointer shadow-2xs"
                    >
                      {preset.label.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5">
                  <label className="font-bold text-blue-900 dark:text-blue-300 uppercase tracking-wider block font-serif">
                    P — Population / Problem / Cohort:
                  </label>
                  <input
                    type="text"
                    value={picoState.population}
                    onChange={(e) => setPicoState({ ...picoState, population: e.target.value })}
                    placeholder="e.g. ICU nurses, critical care staff, healthcare workers"
                    className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-blue-700 font-sans"
                  />
                  <span className="text-[11px] text-slate-500 block">Separate synonyms with commas or 'OR'</span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5">
                  <label className="font-bold text-emerald-900 dark:text-emerald-300 uppercase tracking-wider block font-serif">
                    I — Intervention / Treatment / Exposure:
                  </label>
                  <input
                    type="text"
                    value={picoState.intervention}
                    onChange={(e) => setPicoState({ ...picoState, intervention: e.target.value })}
                    placeholder="e.g. resilience training, mindfulness, peer support programs"
                    className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-blue-700 font-sans"
                  />
                  <span className="text-[11px] text-slate-500 block">Primary treatment, policy, or independent variable</span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5">
                  <label className="font-bold text-purple-900 dark:text-purple-300 uppercase tracking-wider block font-serif">
                    C — Comparison / Control (Optional):
                  </label>
                  <input
                    type="text"
                    value={picoState.comparison}
                    onChange={(e) => setPicoState({ ...picoState, comparison: e.target.value })}
                    placeholder="e.g. standard shifts, conventional staffing, placebo"
                    className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-blue-700 font-sans"
                  />
                  <span className="text-[11px] text-slate-500 block">Baseline comparison or alternative protocol</span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5">
                  <label className="font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wider block font-serif">
                    O — Outcomes / Clinical Endpoints / Metrics:
                  </label>
                  <input
                    type="text"
                    value={picoState.outcome}
                    onChange={(e) => setPicoState({ ...picoState, outcome: e.target.value })}
                    placeholder="e.g. burnout rates, medication errors, turnover intention"
                    className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-blue-700 font-sans"
                  />
                  <span className="text-[11px] text-slate-500 block">Dependent measures, safety rates, or effect sizes</span>
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider font-serif flex items-center gap-1.5">
                    <FileCode2 className="w-4 h-4 text-blue-700" />
                    <span>Compiled Database Search Syntax & 1-Click Launchers</span>
                  </h4>

                  <button
                    type="button"
                    onClick={() => handleCopy(compiledPico.prismaSummary, 'prisma-doc')}
                    className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1 border border-slate-300 dark:border-slate-700 cursor-pointer shadow-2xs"
                  >
                    {copiedKey === 'prisma-doc' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>Copy PRISMA Strategy</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {platformUrls.map((item) => (
                    <div
                      key={item.platform}
                      className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-blue-950 dark:text-blue-200 font-serif">
                            {item.name}
                          </span>
                          <span className="text-[10px] text-slate-500 hidden sm:inline">
                            {item.description}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleCopy(item.query, item.platform)}
                            className="px-2.5 py-1 rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 flex items-center gap-1 cursor-pointer shadow-2xs"
                          >
                            {copiedKey === item.platform ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedKey === item.platform ? 'Copied' : 'Copy Query'}</span>
                          </button>

                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1 rounded bg-blue-900 hover:bg-blue-950 text-white text-xs font-semibold flex items-center gap-1 shadow-2xs"
                          >
                            <span>Search in {item.name.split(' ')[0]}</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>

                      <div className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono text-xs text-slate-800 dark:text-slate-200 break-all select-all">
                        {item.query || '<Fill PICO terms above>'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TOOL 3: SCHOLARIMPACT PRO GOOGLE SCHOLAR PROFILE INTELLIGENCE */}
          {activeTool === 'scholar_impact' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              
              {/* Header Title Card */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-900 text-white flex items-center justify-center shadow-xs">
                    <GraduationCap className="w-4 h-4 text-amber-300" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white font-serif">
                      Google Scholar Profile Career Intelligence Engine
                    </h4>
                    <p className="text-[11px] text-slate-500 font-sans">
                      Automatically crawls all publication pages, computes h-index, and synthesizes publication-grade CV dossiers.
                    </p>
                  </div>
                </div>
              </div>

              {/* Google Scholar Input Form */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-4 text-xs">
                
                {/* Method 1: Google Scholar Profile URL */}
                <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-800/80 space-y-2">
                  <label className="font-bold text-blue-950 dark:text-blue-300 flex items-center justify-between font-serif">
                    <span className="flex items-center gap-1.5">
                      <Link2 className="w-4 h-4 text-blue-600" />
                      <span>Google Scholar Profile Link or User ID:</span>
                    </span>
                    <span className="text-[10px] uppercase font-bold text-blue-700 dark:text-blue-400 bg-blue-100 dark:bg-blue-950 px-2 py-0.5 rounded">
                      Profile Link
                    </span>
                  </label>
                  
                  <input
                    type="text"
                    value={scholarInput.scholarUrlOrId || ''}
                    onChange={(e) => setScholarInput({ ...scholarInput, scholarUrlOrId: e.target.value })}
                    placeholder="e.g. https://scholar.google.com/citations?user=1knki-oAAAAJ&hl=en or 1knki-oAAAAJ"
                    className="w-full px-3 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:border-blue-600"
                  />
                  <span className="text-[11px] text-slate-500 block">
                    Direct link to your public Google Scholar profile.
                  </span>
                </div>

                {/* Method 2: Instant 100% Fail-Safe Profile Text / Table Copy */}
                <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                  <label className="font-bold text-slate-900 dark:text-white flex items-center justify-between font-serif">
                    <span className="flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-emerald-600" />
                      <span>Instant Profile Text / Citations Table Paste (100% Fail-Safe):</span>
                    </span>
                    <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded">
                      Zero-Block Direct Ingest
                    </span>
                  </label>
                  
                  <textarea
                    rows={3}
                    value={scholarInput.pastedScholarText || ''}
                    onChange={(e) => setScholarInput({ ...scholarInput, pastedScholarText: e.target.value })}
                    placeholder="Open your Google Scholar profile page, press Ctrl+A, then Ctrl+C, and paste here to instantly parse all 405+ publications with zero bot blocks..."
                    className="w-full px-3 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-sans text-xs focus:outline-none focus:border-emerald-600 leading-relaxed"
                  />
                  <span className="text-[11px] text-slate-500 block">
                    Tip: If Google Scholar blocks direct URL access in your browser, simply paste your profile page text here for instant calculation of all metrics ($g$-index, $e$-index, $m$-quotient, tiers).
                  </span>
                </div>

                {/* Action Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <div className="text-[11px] text-slate-500 font-sans flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>Parses complete catalog, computes advanced scientometrics, and generates multi-format CV dossiers.</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleExecuteImpactSearch()}
                    disabled={isFetchingImpact || (!scholarInput.scholarUrlOrId?.trim() && !scholarInput.pastedScholarText?.trim())}
                    className="btn-academic-primary px-6 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer disabled:opacity-50 shadow-md"
                  >
                    {isFetchingImpact ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                        <span>Analyzing Scholar Profile...</span>
                      </>
                    ) : (
                      <>
                        <TrendingUp className="w-4 h-4" />
                        <span>Build Scholar Impact Dossier</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {impactError && (
                <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-300">
                  {impactError}
                </div>
              )}

              {/* Impact Profile Results */}
              {impactProfile && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  
                  {/* Author Overview Header Card */}
                  <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white space-y-4 shadow-lg border border-blue-800/50">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <GraduationCap className="w-5 h-5 text-amber-300" />
                          <h3 className="text-lg font-bold font-serif">{impactProfile.name}</h3>
                          
                          <span className="px-2 py-0.5 rounded-full bg-blue-400/20 text-blue-300 border border-blue-400/30 text-[10px] font-bold flex items-center gap-1">
                            <BadgeCheck className="w-3 h-3" />
                            <span>{impactProfile.primarySource}</span>
                          </span>

                          {impactProfile.isHealedByLLM && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[10px] font-bold flex items-center gap-1">
                              <Sparkles className="w-2.5 h-2.5" />
                              <span>LLM Synthesized</span>
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-blue-200 mt-1">
                          {impactProfile.affiliation} • Active Span: {impactProfile.earliestYear} – {impactProfile.earliestYear + impactProfile.careerSpanYears} ({impactProfile.careerSpanYears} yrs)
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {impactProfile.scholarUrl && (
                          <a
                            href={impactProfile.scholarUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold text-white flex items-center gap-1.5 border border-white/20 backdrop-blur-xs cursor-pointer shadow-xs"
                          >
                            <span>Open Google Scholar</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Primary Scientometric Indices Grid (8 Metrics) */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3 border-t border-white/10 text-center">
                      
                      {/* Metric 1: Total Citations */}
                      <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                        <div className="text-[10px] uppercase font-bold tracking-wider text-blue-200">Total Lifetime Citations</div>
                        <div className="text-lg font-bold font-serif text-white mt-0.5">{impactProfile.citationCount.toLocaleString()}</div>
                        <div className="text-[10px] text-blue-300/80 mt-0.5">~{impactProfile.citationVelocity.toLocaleString()} cites/year</div>
                      </div>

                      {/* Metric 2: Total Publications */}
                      <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                        <div className="text-[10px] uppercase font-bold tracking-wider text-blue-200">Total Publications (N)</div>
                        <div className="text-lg font-bold font-serif text-emerald-300 mt-0.5">{impactProfile.paperCount.toLocaleString()}</div>
                        <div className="text-[10px] text-emerald-200/80 mt-0.5">Complete crawled catalog</div>
                      </div>

                      {/* Metric 3: Hirsch h-index */}
                      <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                        <div className="text-[10px] uppercase font-bold tracking-wider text-blue-200">Hirsch h-index</div>
                        <div className="text-lg font-bold font-serif text-amber-300 mt-0.5">{impactProfile.hIndex}</div>
                        <div className="text-[10px] text-amber-200/80 mt-0.5">{impactProfile.hIndex} papers with ≥{impactProfile.hIndex} cites</div>
                      </div>

                      {/* Metric 4: Egghe g-index (Blockbuster Index) */}
                      <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                        <div className="text-[10px] uppercase font-bold tracking-wider text-amber-200">Egghe g-index 🌟</div>
                        <div className="text-lg font-bold font-serif text-amber-300 mt-0.5">{impactProfile.gIndex}</div>
                        <div className="text-[10px] text-amber-200/80 mt-0.5">Rewards blockbuster papers</div>
                      </div>

                      {/* Metric 5: Hirsch m-quotient */}
                      <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                        <div className="text-[10px] uppercase font-bold tracking-wider text-blue-200">m-quotient (Career Speed)</div>
                        <div className="text-lg font-bold font-serif text-emerald-300 mt-0.5">{impactProfile.mQuotient}</div>
                        <div className="text-[10px] text-blue-300/80 mt-0.5">h / {impactProfile.careerSpanYears} career years</div>
                      </div>

                      {/* Metric 6: Zhang e-index (Excess Citation Energy) */}
                      <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                        <div className="text-[10px] uppercase font-bold tracking-wider text-blue-200">e-index (Excess Energy)</div>
                        <div className="text-lg font-bold font-serif text-purple-300 mt-0.5">{impactProfile.eIndex}</div>
                        <div className="text-[10px] text-purple-200/80 mt-0.5">Citations above h-core</div>
                      </div>

                      {/* Metric 7: Citation Depth */}
                      <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                        <div className="text-[10px] uppercase font-bold tracking-wider text-blue-200">Mean Citation Depth (μ)</div>
                        <div className="text-lg font-bold font-serif text-sky-300 mt-0.5">{impactProfile.citationsPerPaper}</div>
                        <div className="text-[10px] text-sky-200/80 mt-0.5">Average cites / paper</div>
                      </div>

                      {/* Metric 8: Pareto Impact Concentration */}
                      <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                        <div className="text-[10px] uppercase font-bold tracking-wider text-blue-200">Pareto Concentration</div>
                        <div className="text-lg font-bold font-serif text-rose-300 mt-0.5">{impactProfile.paretoTop10Percent}%</div>
                        <div className="text-[10px] text-rose-200/80 mt-0.5">Share from top 10% papers</div>
                      </div>

                    </div>

                    {/* Milestone Tiers Strip */}
                    <div className="p-2.5 rounded-xl bg-white/10 border border-white/15 flex flex-wrap items-center justify-between gap-3 text-xs">
                      <span className="font-bold text-amber-200 flex items-center gap-1.5 font-serif">
                        <Award className="w-3.5 h-3.5" />
                        <span>High-Impact Milestone Tiers:</span>
                      </span>

                      <div className="flex flex-wrap items-center gap-3">
                        <span className="px-2 py-0.5 rounded bg-white/10 border border-white/10 text-white font-mono font-semibold">
                          i10: <strong>{impactProfile.i10Index}</strong>
                        </span>
                        <span className="px-2 py-0.5 rounded bg-blue-500/20 border border-blue-400/30 text-blue-200 font-mono font-semibold">
                          i20: <strong>{impactProfile.i20Index}</strong>
                        </span>
                        <span className="px-2 py-0.5 rounded bg-purple-500/20 border border-purple-400/30 text-purple-200 font-mono font-semibold">
                          i50: <strong>{impactProfile.i50Index}</strong>
                        </span>
                        <span className="px-2.5 py-0.5 rounded bg-amber-500/30 border border-amber-400/50 text-amber-200 font-mono font-bold shadow-xs">
                          i100 (Super-Landmarks): <strong>{impactProfile.i100Index}</strong>
                        </span>
                      </div>
                    </div>

                  </div>

                  {/* Multi-Format Executive CV Bio Dossier Tabs */}
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-2.5">
                      
                      {/* Format Switcher */}
                      <div className="flex items-center gap-1 bg-slate-200 dark:bg-slate-900 p-1 rounded-lg">
                        <button
                          type="button"
                          onClick={() => setActiveBioTab('tenure')}
                          className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                            activeBioTab === 'tenure'
                              ? 'bg-blue-900 text-white shadow-xs'
                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          Tenure & Review Dossier
                        </button>

                        <button
                          type="button"
                          onClick={() => setActiveBioTab('speaker')}
                          className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                            activeBioTab === 'speaker'
                              ? 'bg-blue-900 text-white shadow-xs'
                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          Keynote Speaker Intro
                        </button>

                        <button
                          type="button"
                          onClick={() => setActiveBioTab('grant')}
                          className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                            activeBioTab === 'grant'
                              ? 'bg-blue-900 text-white shadow-xs'
                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          Grant / Bio-Sketch (NSF Style)
                        </button>
                      </div>

                      {/* Copy Active Bio */}
                      <button
                        type="button"
                        onClick={() => {
                          const textToCopy =
                            activeBioTab === 'tenure'
                              ? impactProfile.cvBioSnippet
                              : activeBioTab === 'speaker'
                              ? impactProfile.speakerBioSnippet
                              : impactProfile.grantBioSnippet;
                          handleCopy(textToCopy, `cv-bio-${activeBioTab}`);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      >
                        {copiedKey === `cv-bio-${activeBioTab}` ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        <span>{copiedKey === `cv-bio-${activeBioTab}` ? 'Copied Bio!' : 'Copy Formatted Bio'}</span>
                      </button>
                    </div>

                    {/* Bio Text Render */}
                    <p className="font-serif text-xs text-slate-800 dark:text-slate-200 leading-relaxed bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-justify">
                      {activeBioTab === 'tenure' && impactProfile.cvBioSnippet}
                      {activeBioTab === 'speaker' && impactProfile.speakerBioSnippet}
                      {activeBioTab === 'grant' && impactProfile.grantBioSnippet}
                    </p>
                  </div>

                  {/* Top Defining Publications ("Greatest Hits") */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white font-serif uppercase tracking-wider flex items-center gap-1.5">
                        <BookOpen className="w-4 h-4 text-blue-700" />
                        <span>Landmark Publications & Citation Metrics ({impactProfile.topPapers.length} Top Works)</span>
                      </h4>
                      <span className="text-[11px] text-slate-500 font-sans">
                        Sorted by Lifetime Impact
                      </span>
                    </div>

                    <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                      {impactProfile.topPapers.map((paper, pIdx) => (
                        <div
                          key={pIdx}
                          className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-start justify-between gap-3 text-xs hover:border-blue-300 dark:hover:border-blue-800 transition-colors"
                        >
                          <div className="space-y-1 flex-1">
                            <h5 className="font-serif font-bold text-slate-900 dark:text-white">
                              {pIdx + 1}. {paper.title}
                            </h5>
                            <div className="text-slate-500 font-sans flex flex-wrap items-center gap-2">
                              <span><strong>{paper.year}</strong></span>
                              <span>•</span>
                              <span><em>{paper.venue}</em></span>
                              <span className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-semibold">
                                {paper.source}
                              </span>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <div className="font-mono font-bold text-blue-900 dark:text-blue-300 text-xs">
                              {paper.citationCount.toLocaleString()} cites
                            </div>
                            {paper.url && (
                              <a
                                href={paper.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[11px] text-blue-800 dark:text-blue-400 hover:underline flex items-center gap-0.5 justify-end mt-0.5"
                              >
                                <span>Scholar Search</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              )}

            </div>
          )}

          {/* TOOL 4: INSTANT DOI / BIBTEX RESOLVER */}
          {activeTool === 'doi_resolver' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider font-serif block">
                Enter Digital Object Identifier (DOI) or Raw BibTeX Entry:
              </label>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={doiInput}
                  onChange={(e) => setDoiInput(e.target.value)}
                  placeholder="e.g. 10.1038/s41586-020-2649-2 or 10.1145/3318464.3389700"
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-700"
                />
                <button
                  type="button"
                  onClick={handleResolveSingleDoi}
                  disabled={isResolvingDoi || !doiInput.trim()}
                  className="btn-academic-primary px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isResolvingDoi ? <Loader2 className="w-3.5 h-3.5 animate-spin text-white" /> : <Search className="w-3.5 h-3.5" />}
                  <span>Resolve Citation</span>
                </button>
              </div>

              {doiError && (
                <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-300">
                  {doiError}
                </div>
              )}

              {resolvedResult && resolvedResult.verifiedPaper && (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-800 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Verified Publisher Record Found</span>
                    </span>
                    <a
                      href={resolvedResult.verifiedPaper.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-800 dark:text-blue-400 hover:underline flex items-center gap-1 font-semibold"
                    >
                      <span>Open Publisher DOI</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 dark:text-white font-serif">
                    {resolvedResult.verifiedPaper.title}
                  </h4>

                  <div className="text-xs text-slate-600 dark:text-slate-400 font-sans">
                    <strong>Authors:</strong> {resolvedResult.verifiedPaper.authors.map((a) => a.name).join(', ')} ({resolvedResult.verifiedPaper.year}) • <em>{resolvedResult.verifiedPaper.venue}</em>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                    {CITATION_STYLES.map((st) => (
                      <div key={st.id} className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-blue-900 dark:text-blue-300 uppercase">
                            {st.name}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(resolvedResult.correctedCitations[st.id] || '', st.id)}
                            className="text-xs text-blue-800 dark:text-blue-400 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                          >
                            {copiedKey === st.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedKey === st.id ? 'Copied' : 'Copy'}</span>
                          </button>
                        </div>
                        <p className="font-serif text-xs text-slate-900 dark:text-white leading-relaxed">
                          {resolvedResult.correctedCitations[st.id]}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      )}

    </section>
  );
};
