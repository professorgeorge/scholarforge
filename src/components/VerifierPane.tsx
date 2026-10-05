import React, { useState, useRef, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Copy,
  Check,
  Download,
  ExternalLink,
  UploadCloud,
  Loader2,
  ArrowUpDown,
  FileCheck2,
  RefreshCw,
  Sparkles,
  ShieldAlert,
  FileText,
  BookmarkPlus
} from 'lucide-react';
import {
  verifyReferenceBatch,
  SAMPLE_VERIFICATION_REFERENCES,
  downloadVerificationWordDocument,
  extractBibliographyFromManuscript,
  type BatchVerificationReport
} from '../services/referenceVerifierService';
import { CITATION_STYLES } from '../services/citationFormatter';
import type { CitationStyle } from '../types/citation';
import { addPaperToCart } from '../services/cartService';
import { DoiResolverTab } from './DoiResolverTab';
import type { LLMConfig } from '../services/llmService';
import { DEFAULT_LLM_CONFIG } from '../services/llmService';
import { analyzeCitationForensics, isLlmConfigured, type CitationForensicReport } from '../services/aiScholarExtensions';
import { Wand2 } from 'lucide-react';

interface VerifierPaneProps {
  onAddPaperToCart?: (paper: any) => void;
  llmConfig?: LLMConfig;
  initialBibliography?: string;
  sourceFilename?: string;
}

export const VerifierPane: React.FC<VerifierPaneProps> = ({
  llmConfig = DEFAULT_LLM_CONFIG,
  initialBibliography = '',
  sourceFilename
}) => {
  const [subTab, setSubTab] = useState<'batch' | 'single'>('batch');
  const [rawBibliography, setRawBibliography] = useState<string>(() => {
    if (initialBibliography.trim()) {
      return extractBibliographyFromManuscript(initialBibliography).bibliography;
    }
    return '';
  });
  const [fullTransmittedText, setFullTransmittedText] = useState<string | null>(() => {
    if (initialBibliography.trim()) {
      return extractBibliographyFromManuscript(initialBibliography).fullText;
    }
    return null;
  });
  const [wasExtracted, setWasExtracted] = useState<boolean>(() => {
    if (initialBibliography.trim()) {
      return extractBibliographyFromManuscript(initialBibliography).wasExtracted;
    }
    return false;
  });
  const [detectedReferenceCount, setDetectedReferenceCount] = useState<number>(() => {
    if (initialBibliography.trim()) {
      return extractBibliographyFromManuscript(initialBibliography).referenceCount;
    }
    return 0;
  });
  const [transmittedDocName, setTransmittedDocName] = useState<string | null>(sourceFilename || null);
  const [isViewingFullManuscript, setIsViewingFullManuscript] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [verifyProgress, setVerifyProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 });
  const [report, setReport] = useState<BatchVerificationReport | null>(null);
  const [selectedOutputStyle, setSelectedOutputStyle] = useState<CitationStyle>('apa');
  const [statusFilter, setStatusFilter] = useState<'all' | 'verified' | 'discrepancy' | 'not_found' | 'retracted'>('all');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [forensicMap, setForensicMap] = useState<Record<string, CitationForensicReport>>({});
  const [analyzingForensicId, setAnalyzingForensicId] = useState<string | null>(null);
  const [forensicNotice, setForensicNotice] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Synchronize incoming bibliography/manuscript text when transmitted from hub or other panes
  useEffect(() => {
    if (initialBibliography && initialBibliography.trim()) {
      const res = extractBibliographyFromManuscript(initialBibliography);
      setRawBibliography(res.bibliography);
      setFullTransmittedText(res.fullText);
      setWasExtracted(res.wasExtracted);
      setDetectedReferenceCount(res.referenceCount);
      setIsViewingFullManuscript(false);
    }
    if (sourceFilename) {
      setTransmittedDocName(sourceFilename);
    }
  }, [initialBibliography, sourceFilename]);

  const handleToggleManuscriptView = () => {
    if (!fullTransmittedText) return;
    if (isViewingFullManuscript) {
      if (initialBibliography) {
        const res = extractBibliographyFromManuscript(initialBibliography);
        setRawBibliography(res.bibliography);
      }
      setIsViewingFullManuscript(false);
    } else {
      setRawBibliography(fullTransmittedText);
      setIsViewingFullManuscript(true);
    }
  };

  const handleRunForensicAudit = async (item: any) => {
    if (!isLlmConfigured(llmConfig)) {
      setForensicNotice('Optional LLM is not configured. Configure an OpenAI, Gemini, Claude, or local Ollama engine in Master Settings to enable AI citation forensic diagnostics.');
      return;
    }

    setAnalyzingForensicId(item.id);
    setForensicNotice(null);

    try {
      const res = await analyzeCitationForensics(
        item.raw,
        item.verifiedPaper || null,
        item.discrepancies.map((d: any) => d.message),
        llmConfig
      );

      if (res) {
        setForensicMap(prev => ({ ...prev, [item.id]: res }));
      }
    } catch (err: any) {
      setForensicNotice(err.message || 'Forensic analysis failed.');
    } finally {
      setAnalyzingForensicId(null);
    }
  };

  const handleStartVerification = async () => {
    if (!rawBibliography.trim()) return;
    setIsVerifying(true);
    setVerifyProgress({ current: 0, total: 0 });

    try {
      const res = await verifyReferenceBatch(rawBibliography, (current, total) => {
        setVerifyProgress({ current, total });
      });
      setReport(res);
    } catch (err) {
      console.error('Verification failed:', err);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleLoadSample = () => {
    setRawBibliography(SAMPLE_VERIFICATION_REFERENCES);
  };

  const handleClear = () => {
    setRawBibliography('');
    setReport(null);
    setTransmittedDocName(null);
    setFullTransmittedText(null);
    setWasExtracted(false);
    setDetectedReferenceCount(0);
    setIsViewingFullManuscript(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result;
      if (typeof content === 'string') {
        const res = extractBibliographyFromManuscript(content);
        setRawBibliography(res.bibliography);
        setFullTransmittedText(res.fullText);
        setWasExtracted(res.wasExtracted);
        setDetectedReferenceCount(res.referenceCount);
        setTransmittedDocName(file.name);
        setIsViewingFullManuscript(false);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const content = evt.target?.result;
        if (typeof content === 'string') {
          const res = extractBibliographyFromManuscript(content);
          setRawBibliography(res.bibliography);
          setFullTransmittedText(res.fullText);
          setWasExtracted(res.wasExtracted);
          setDetectedReferenceCount(res.referenceCount);
          setTransmittedDocName(file.name);
          setIsViewingFullManuscript(false);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleCopyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleApplyCorrections = () => {
    if (!report) return;
    const correctedList = report.results.map((r, idx) => {
      const formatted = r.correctedCitations[selectedOutputStyle] || r.correctedCitations.apa || r.raw;
      const isIeee = selectedOutputStyle === 'ieee';
      return isIeee ? `[${idx + 1}] ${formatted}` : formatted;
    });
    setRawBibliography(correctedList.join('\n\n'));
    handleCopyText(correctedList.join('\n\n'), 'applied');
  };

  const handleSortAlphabetically = () => {
    if (!report) return;
    const sorted = [...report.results].sort((a, b) => {
      const aName = a.verifiedPaper?.authors?.[0]?.familyName || a.parsed.authors?.[0] || a.raw;
      const bName = b.verifiedPaper?.authors?.[0]?.familyName || b.parsed.authors?.[0] || b.raw;
      return aName.localeCompare(bName);
    });
    setReport({ ...report, results: sorted });
  };

  const handleDownloadWordAudit = () => {
    if (!report) return;
    downloadVerificationWordDocument(report, selectedOutputStyle, 'audit');
  };

  const handleDownloadWordClean = () => {
    if (!report) return;
    downloadVerificationWordDocument(report, selectedOutputStyle, 'clean');
  };

  // Filter results
  const filteredResults = report
    ? report.results.filter((r) => {
        if (statusFilter === 'all') return true;
        if (statusFilter === 'retracted') return r.isRetracted;
        return r.status === statusFilter;
      })
    : [];

  const retractedTotal = report ? report.results.filter((r) => r.isRetracted).length : 0;

  return (
    <div className="academic-card rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-7 space-y-6 shadow-xs">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-900 dark:bg-blue-800 flex items-center justify-center text-white shadow-xs">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white font-serif">
                Bibliography Integrity &amp; AI Hallucination Auditor
              </h2>
              <span className="text-xs px-2.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 font-semibold border border-blue-200 dark:border-blue-800">
                Crossref • OpenAlex • Europe PMC • arXiv
              </span>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 font-sans">
              Cross-checks references against 250M+ verified DOI registries. Detects AI hallucinations, year typos, author discrepancies, and retractions.
            </p>
          </div>
        </div>

        {/* Style Selector */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
            Citation Style:
          </label>
          <select
            value={selectedOutputStyle}
            onChange={(e) => setSelectedOutputStyle(e.target.value as CitationStyle)}
            className="px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-blue-700"
          >
            {CITATION_STYLES.map((st) => (
              <option key={st.id} value={st.id}>
                {st.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Sub-Navigation Switcher */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          type="button"
          onClick={() => setSubTab('batch')}
          className={`px-4 py-2 rounded-xl text-xs font-bold font-serif flex items-center gap-2 transition cursor-pointer ${
            subTab === 'batch'
              ? 'bg-blue-900 text-white shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Batch Reference Authenticity Auditor</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('single')}
          className={`px-4 py-2 rounded-xl text-xs font-bold font-serif flex items-center gap-2 transition cursor-pointer ${
            subTab === 'single'
              ? 'bg-blue-900 text-white shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          <FileText className="w-3.5 h-3.5 text-blue-400" />
          <span>Single DOI &amp; BibTeX Quick Resolver</span>
        </button>
      </div>

      {subTab === 'single' ? (
        <DoiResolverTab />
      ) : (
        /* Main Workspace: Grid of Input & Results */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Input Dropzone */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Transmitted File / Source Notification Banner */}
          {(transmittedDocName || wasExtracted || (initialBibliography && rawBibliography.length > 0)) && (
            <div className="p-3.5 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50/60 dark:from-blue-950/40 dark:to-indigo-950/30 border border-blue-200 dark:border-blue-800 space-y-2 shadow-2xs animate-in fade-in duration-150">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 truncate">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                  <span className="text-xs font-bold text-slate-900 dark:text-white font-serif truncate">
                    {transmittedDocName ? `Transmitted: ${transmittedDocName}` : 'Transmitted from Scholar Hub'}
                  </span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 font-bold shrink-0">
                  {detectedReferenceCount} {detectedReferenceCount === 1 ? 'Reference' : 'References'} Ready
                </span>
              </div>

              <div className="text-[11px] text-slate-600 dark:text-slate-400 flex flex-wrap items-center justify-between gap-2">
                <span>
                  {wasExtracted
                    ? (isViewingFullManuscript 
                        ? 'Showing full manuscript text in editor below.' 
                        : 'Intelligently parsed bibliography section from your manuscript.')
                    : 'Transmitted references ready for cross-registry audit.'}
                </span>

                {wasExtracted && fullTransmittedText && (
                  <button
                    type="button"
                    onClick={handleToggleManuscriptView}
                    className="text-xs font-semibold text-blue-800 dark:text-blue-300 hover:underline cursor-pointer flex items-center gap-1"
                  >
                    {isViewingFullManuscript ? '↩ Show References Only' : '📄 View Full Manuscript'}
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Paste Bibliography to Audit:
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleLoadSample}
                className="text-xs text-blue-900 dark:text-blue-400 font-semibold hover:underline cursor-pointer"
              >
                Load Sample
              </button>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <button
                type="button"
                onClick={handleClear}
                className="text-xs text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer"
              >
                Clear
              </button>
            </div>
          </div>

          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            className={`relative rounded-xl border-2 transition ${
              isDragOver
                ? 'border-blue-700 bg-blue-50/30 dark:bg-blue-950/30'
                : 'border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-950/40'
            }`}
          >
            <textarea
              value={rawBibliography}
              onChange={(e) => setRawBibliography(e.target.value)}
              placeholder="Paste raw citations here (numbered [1], APA format, BibTeX, or line-by-line)...&#10;&#10;Drag and drop a .txt, .bib, or .md file directly here!"
              rows={14}
              className="w-full p-4 bg-transparent text-xs font-mono text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none resize-y"
            />
            <div className="p-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 rounded-b-xl">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".txt,.bib,.csv,.md"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-2.5 py-1 text-xs font-semibold rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center gap-1.5 cursor-pointer border border-slate-200 dark:border-slate-700 transition"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Upload .txt / .bib</span>
              </button>
              <span className="text-[11px] text-slate-400">
                Supports APA, IEEE, Vancouver, BibTeX
              </span>
            </div>
          </div>

          <button
            onClick={handleStartVerification}
            disabled={isVerifying || !rawBibliography.trim()}
            className="w-full btn-academic-primary py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
          >
            {isVerifying ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>
                  Verifying {verifyProgress.current} / {verifyProgress.total} Citations...
                </span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4 text-emerald-300" />
                <span>Verify References &amp; Detect Discrepancies</span>
              </>
            )}
          </button>
        </div>

        {/* Right Column: Audit Dashboard & Results */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Welcome state when no report */}
          {!report && !isVerifying && (
            <div className="h-full min-h-[380px] rounded-xl border border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center p-8 text-center bg-slate-50/50 dark:bg-slate-950/20">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300 flex items-center justify-center mb-3">
                <FileCheck2 className="w-7 h-7" />
              </div>
              <h3 className="font-serif font-bold text-base text-slate-900 dark:text-white">
                Ready to Audit Your Bibliography
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mt-1 mb-4 leading-relaxed font-sans">
                Paste your manuscript references on the left or click <strong>Load Sample</strong> to test citation authenticity, identify year typos, and detect AI hallucinations.
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  ✓ Retraction Sentinel
                </span>
                <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  ✓ Duplicate Detection
                </span>
                <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  ✓ Word Audit Report
                </span>
                <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  ✓ 1-Click Auto-Fix
                </span>
              </div>
            </div>
          )}

          {/* Verification in progress */}
          {isVerifying && (
            <div className="p-6 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-blue-950 dark:text-blue-200">
                <span className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-blue-800 dark:text-blue-400" />
                  <span>Auditing references against Crossref, OpenAlex, and Europe PMC...</span>
                </span>
                <span className="font-mono">
                  {verifyProgress.total > 0 ? Math.round((verifyProgress.current / verifyProgress.total) * 100) : 0}%
                </span>
              </div>
              <div className="w-full bg-blue-200 dark:bg-blue-900/50 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-blue-900 dark:bg-blue-400 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${verifyProgress.total > 0 ? (verifyProgress.current / verifyProgress.total) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          )}

          {/* Verified Report View */}
          {report && (
            <div className="space-y-4 animate-in fade-in duration-200">
              
              {/* Authenticity Summary Banner */}
              <div
                className={`p-4 rounded-xl border flex items-center justify-between gap-4 ${
                  report.authenticityScore >= 90
                    ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800'
                    : report.authenticityScore >= 60
                    ? 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800'
                    : 'bg-rose-50/80 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ${
                      report.authenticityScore >= 90
                        ? 'bg-emerald-600'
                        : report.authenticityScore >= 60
                        ? 'bg-amber-600'
                        : 'bg-rose-600'
                    }`}
                  >
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white font-serif">
                      Bibliography Authenticity: {report.authenticityScore}%
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                      {report.authenticityScore >= 90
                        ? 'High authenticity. The majority of references match verified records.'
                        : 'Discrepancies or unindexed citations detected. Review the highlighted entries below.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleApplyCorrections}
                    className="px-3 py-1.5 rounded-lg bg-blue-900 dark:bg-blue-800 hover:bg-blue-800 dark:hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs transition"
                    title="Overwrite input with verified and corrected citations"
                  >
                    {copiedKey === 'applied' ? <Check className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5 text-amber-300" />}
                    <span>{copiedKey === 'applied' ? 'Applied!' : 'Apply Auto-Fix'}</span>
                  </button>
                </div>
              </div>

              {/* Stats Counters Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                  <div className="text-lg font-extrabold text-slate-900 dark:text-white font-mono">
                    {report.total}
                  </div>
                  <div className="text-[10px] uppercase font-bold text-slate-500">
                    Total Analyzed
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60">
                  <div className="text-lg font-extrabold text-emerald-700 dark:text-emerald-400 font-mono">
                    {report.verifiedCount}
                  </div>
                  <div className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-500">
                    Verified Genuine
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-amber-50/50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60">
                  <div className="text-lg font-extrabold text-amber-700 dark:text-amber-400 font-mono">
                    {report.discrepancyCount}
                  </div>
                  <div className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-500">
                    Discrepancies Fixed
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-rose-50/50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60">
                  <div className="text-lg font-extrabold text-rose-700 dark:text-rose-400 font-mono">
                    {report.notFoundCount}
                  </div>
                  <div className="text-[10px] uppercase font-bold text-rose-600 dark:text-rose-500">
                    Unindexed / Unconfirmed
                  </div>
                </div>
              </div>

              {/* Action Strip: Filters & Word Exports */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                {/* Filter Tabs */}
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-lg text-xs">
                  <button
                    onClick={() => setStatusFilter('all')}
                    className={`px-2.5 py-1 rounded-md font-medium cursor-pointer transition ${
                      statusFilter === 'all'
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-semibold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    All ({report.total})
                  </button>
                  <button
                    onClick={() => setStatusFilter('verified')}
                    className={`px-2.5 py-1 rounded-md font-medium cursor-pointer transition ${
                      statusFilter === 'verified'
                        ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs font-semibold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    Verified ({report.verifiedCount})
                  </button>
                  <button
                    onClick={() => setStatusFilter('discrepancy')}
                    className={`px-2.5 py-1 rounded-md font-medium cursor-pointer transition ${
                      statusFilter === 'discrepancy'
                        ? 'bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-400 shadow-xs font-semibold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    Discrepancies ({report.discrepancyCount})
                  </button>
                  <button
                    onClick={() => setStatusFilter('not_found')}
                    className={`px-2.5 py-1 rounded-md font-medium cursor-pointer transition ${
                      statusFilter === 'not_found'
                        ? 'bg-white dark:bg-slate-900 text-rose-700 dark:text-rose-400 shadow-xs font-semibold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    Unindexed ({report.notFoundCount})
                  </button>
                  {retractedTotal > 0 && (
                    <button
                      onClick={() => setStatusFilter('retracted')}
                      className={`px-2.5 py-1 rounded-md font-medium cursor-pointer transition ${
                        statusFilter === 'retracted'
                          ? 'bg-red-600 text-white shadow-xs font-semibold'
                          : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      Retracted ({retractedTotal})
                    </button>
                  )}
                </div>

                {/* Toolbar Buttons: Sort A-Z, Word Exports */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleSortAlphabetically}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1 border border-slate-200 dark:border-slate-700 cursor-pointer"
                    title="Sort references alphabetically by primary author surname"
                  >
                    <ArrowUpDown className="w-3.5 h-3.5" />
                    <span>Sort A-Z</span>
                  </button>

                  <button
                    onClick={handleDownloadWordClean}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1 border border-slate-200 dark:border-slate-700 cursor-pointer"
                    title="Download publication-ready Word (.doc) bibliography with hanging indents"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Clean Word (.doc)</span>
                  </button>

                  <button
                    onClick={handleDownloadWordAudit}
                    className="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-900 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                    title="Download complete Word verification audit report with color-coded markers"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Audit Report (.doc)</span>
                  </button>
                </div>
              </div>

              {/* Forensic Notice Banner */}
              {forensicNotice && (
                <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-xs text-purple-900 dark:text-purple-200 flex items-center justify-between gap-2">
                  <span>{forensicNotice}</span>
                  <button
                    type="button"
                    onClick={() => setForensicNotice(null)}
                    className="font-bold px-2 py-0.5 hover:underline cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              {/* Cards List */}
              <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                {filteredResults.map((item, idx) => {
                  const formattedCite = item.correctedCitations[selectedOutputStyle] || item.correctedCitations.apa || item.raw;
                  const isIeee = selectedOutputStyle === 'ieee';

                  return (
                    <div
                      key={item.id}
                      className={`p-4 rounded-xl border transition ${
                        item.isRetracted
                          ? 'bg-red-50/60 dark:bg-red-950/30 border-red-300 dark:border-red-900'
                          : item.status === 'verified'
                          ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/60'
                          : item.status === 'discrepancy'
                          ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/60'
                          : 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60'
                      }`}
                    >
                      {/* Header Line */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 font-mono">
                            #{idx + 1}
                          </span>
                          
                          {item.isRetracted ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 border border-red-300 flex items-center gap-1 animate-pulse">
                              <ShieldAlert className="w-3 h-3 text-red-600" />
                              RETRACTED PUBLICATION
                            </span>
                          ) : item.status === 'verified' ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              REGISTRY CONFIRMED
                            </span>
                          ) : item.status === 'discrepancy' ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3 text-amber-600" />
                              DISCREPANCY FIXED ({item.confidence}% Match)
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 flex items-center gap-1">
                              <XCircle className="w-3 h-3 text-rose-600" />
                              UNINDEXED / UNCONFIRMED
                            </span>
                          )}
                        </div>

                        {/* In-text citation preview badge */}
                        {item.verifiedPaper && (
                          <span className="text-[11px] font-mono text-slate-500 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2 py-0.5 rounded-md">
                            {isIeee
                              ? `[${idx + 1}]`
                              : `(${item.verifiedPaper.authors[0]?.familyName || 'Author'}, ${item.verifiedPaper.year})`}
                          </span>
                        )}
                      </div>

                      {/* Original Input Text */}
                      <div className="p-2.5 rounded-lg bg-white/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 font-mono mb-2">
                        <span className="font-sans font-semibold text-slate-500 block text-[10px] uppercase">
                          Original Input:
                        </span>
                        {item.raw}
                      </div>

                      {/* Corrected Citation */}
                      {item.verifiedPaper && (
                        <div className="p-2.5 rounded-lg bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-xs text-slate-900 dark:text-white font-serif leading-relaxed mb-2">
                          <span className="font-sans font-semibold text-blue-900 dark:text-blue-300 block text-[10px] uppercase mb-0.5">
                            Corrected {selectedOutputStyle.toUpperCase()} Reference:
                          </span>
                          {isIeee && `[${idx + 1}] `}
                          {formattedCite}
                        </div>
                      )}

                      {/* Discrepancies Details List */}
                      {item.discrepancies.length > 0 && (
                        <div className="space-y-1 mb-2">
                          {item.discrepancies.map((d, dIdx) => (
                            <div
                              key={dIdx}
                              className="text-xs p-2 rounded-md bg-amber-100/70 dark:bg-amber-950/40 border-l-2 border-amber-500 text-amber-900 dark:text-amber-200 flex items-start gap-1.5"
                            >
                              <span className="font-bold shrink-0">•</span>
                              <span>{d.message}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* AI Citation Forensic Diagnostic (Discrepancy / Not Found) */}
                      {(item.status === 'discrepancy' || item.status === 'not_found') && (
                        <div className="mb-2">
                          {forensicMap[item.id] ? (
                            <div className="p-3 rounded-xl bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-xs space-y-2">
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-1.5">
                                  <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                                  <span className="font-bold text-purple-900 dark:text-purple-200">
                                    AI Forensic Diagnostic:
                                  </span>
                                </div>
                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                                  forensicMap[item.id].isLikelyHallucination
                                    ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800'
                                    : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                                }`}>
                                  {forensicMap[item.id].verdictTitle}
                                </span>
                              </div>
                              <p className="text-slate-700 dark:text-slate-300 font-sans leading-relaxed">
                                {forensicMap[item.id].diagnosticExplanation}
                              </p>
                              {forensicMap[item.id].recommendedAction && (
                                <div className="pt-1 text-[11px] font-medium text-purple-900 dark:text-purple-300 border-t border-purple-200/60 dark:border-purple-800/60">
                                  <span className="font-bold">Recommended Action: </span>
                                  {forensicMap[item.id].recommendedAction}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleRunForensicAudit(item)}
                                disabled={analyzingForensicId === item.id}
                                className="px-2.5 py-1 rounded-md bg-purple-50 dark:bg-purple-950/50 hover:bg-purple-100 dark:hover:bg-purple-900/60 border border-purple-200 dark:border-purple-800 text-purple-800 dark:text-purple-300 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                                title="Run AI citation forensic diagnostics to determine if this discrepancy is a metadata typo or an AI hallucination"
                              >
                                {analyzingForensicId === item.id ? (
                                  <>
                                    <Loader2 className="w-3 h-3 animate-spin text-purple-600" />
                                    <span>Running AI Forensic Diagnostic...</span>
                                  </>
                                ) : (
                                  <>
                                    <Wand2 className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                                    <span>AI Forensic Diagnostic</span>
                                  </>
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Footer Actions */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                        <div className="flex items-center gap-2">
                          {item.verifiedPaper?.doi && (
                            <a
                              href={`https://doi.org/${item.verifiedPaper.doi}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs font-semibold text-blue-900 dark:text-blue-400 hover:underline flex items-center gap-1"
                            >
                              <span>DOI: {item.verifiedPaper.doi}</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                          {item.verifiedPaper?.openAccess && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                              🔓 Open Access
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5">
                          {item.verifiedPaper && (
                            <button
                              onClick={() => addPaperToCart(item.verifiedPaper!)}
                              className="px-2.5 py-1 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold flex items-center gap-1 cursor-pointer transition"
                              title="Add paper to Universal Research Cart"
                            >
                              <BookmarkPlus className="w-3 h-3" />
                              <span>Save to Cart</span>
                            </button>
                          )}
                          <button
                            onClick={() => handleCopyText(formattedCite, item.id)}
                            className="px-2.5 py-1 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold flex items-center gap-1 cursor-pointer transition"
                          >
                            {copiedKey === item.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedKey === item.id ? 'Copied!' : 'Copy Citation'}</span>
                          </button>
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>

            </div>
          )}

        </div>

      </div>
      )}

    </div>
  );
};
