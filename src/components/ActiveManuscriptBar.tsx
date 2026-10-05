import React, { useState, useRef } from 'react';
import {
  FileText,
  CheckCircle2,
  Search,
  BookOpen,
  ShieldCheck,
  X,
  UploadCloud,
  RefreshCw,
  Eye,
  FileCheck,
  Layers
} from 'lucide-react';
import type { ActiveManuscriptContext } from '../services/manuscriptParserService';
import type { AcademicPillar } from './Navbar';
import { extractTextFromManuscriptFile } from '../services/fileImportService';

interface ActiveManuscriptBarProps {
  manuscript: ActiveManuscriptContext | null;
  onManuscriptLoaded: (rawText: string, filename?: string) => void;
  onClearManuscript: () => void;
  onNavigateToPillar: (pillar: AcademicPillar) => void;
}

export const ActiveManuscriptBar: React.FC<ActiveManuscriptBarProps> = ({
  manuscript,
  onManuscriptLoaded,
  onClearManuscript,
  onNavigateToPillar,
}) => {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isPasteModalOpen, setIsPasteModalOpen] = useState(false);
  const [pasteDraftInput, setPasteDraftInput] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await processSelectedFile(e.target.files[0]);
    }
    e.target.value = '';
  };

  const processSelectedFile = async (file: File) => {
    try {
      setIsProcessingFile(true);
      const { text, filename } = await extractTextFromManuscriptFile(file);
      onManuscriptLoaded(text, filename);
    } catch (err: any) {
      console.error('Failed to parse dropped manuscript:', err);
      alert('Could not read the manuscript file. Please ensure it is a valid .docx, .txt, or .md file.');
    } finally {
      setIsProcessingFile(false);
    }
  };

  const handlePasteSubmit = () => {
    if (!pasteDraftInput.trim()) return;
    onManuscriptLoaded(pasteDraftInput.trim(), 'Pasted_Manuscript_Draft.docx');
    setPasteDraftInput('');
    setIsPasteModalOpen(false);
  };

  // If no manuscript is loaded
  if (!manuscript || !manuscript.rawText || !manuscript.rawText.trim()) {
    return (
      <>
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleFileDrop}
          className={`border-b transition-colors duration-150 ${
            isDragging
              ? 'bg-blue-50/90 dark:bg-blue-950/50 border-blue-400 dark:border-blue-600'
              : 'bg-slate-50/80 dark:bg-slate-900/60 border-slate-200/80 dark:border-slate-800'
          }`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 text-slate-600 dark:text-slate-400">
              <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600"></span>
              <span className="font-semibold font-serif text-slate-700 dark:text-slate-300">
                Active Manuscript Memory:
              </span>
              <span className="hidden sm:inline text-slate-500">
                Drop your manuscript (.docx, .txt, .md) to activate seamless data continuity across all tools.
              </span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileInputChange}
                accept=".docx,.txt,.md,.rtf,.tex"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessingFile}
                className="px-3 py-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-2xs disabled:opacity-50"
              >
                {isProcessingFile ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
                ) : (
                  <UploadCloud className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                )}
                <span>Load File</span>
              </button>

              <button
                type="button"
                onClick={() => setIsPasteModalOpen(true)}
                className="px-3 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900 font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Paste Text</span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal for Pasting Draft */}
        {isPasteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white font-serif">
                      Load Manuscript into Session Memory
                    </h3>
                    <p className="text-xs text-slate-500">
                      ScholarForge will automatically parse the title, abstract, body, and references.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPasteModalOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <textarea
                rows={12}
                value={pasteDraftInput}
                onChange={(e) => setPasteDraftInput(e.target.value)}
                placeholder="Paste full manuscript text or excerpt including title, abstract, body, and references section..."
                className="w-full p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs font-sans text-slate-900 dark:text-white focus:outline-none focus:border-blue-600 leading-relaxed"
              />

              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-slate-400">
                  {pasteDraftInput ? `${pasteDraftInput.split(/\s+/).filter(Boolean).length} words` : '0 words'}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsPasteModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handlePasteSubmit}
                    disabled={!pasteDraftInput.trim()}
                    className="btn-academic-primary px-5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Activate Session Memory</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // When a manuscript IS loaded
  return (
    <>
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleFileDrop}
        className={`border-b transition-colors duration-150 ${
          isDragging
            ? 'bg-blue-100/90 dark:bg-blue-950/70 border-blue-400 dark:border-blue-600 ring-2 ring-blue-500'
            : 'bg-gradient-to-r from-blue-50/70 via-indigo-50/60 to-purple-50/50 dark:from-slate-900/90 dark:via-blue-950/30 dark:to-slate-900/90 border-blue-200/80 dark:border-blue-900/50 shadow-2xs'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
          <div className="flex flex-wrap items-center justify-between gap-2.5 text-xs">
            
            {/* Left: Active Status & Title */}
            <div className="flex items-center gap-2.5 min-w-0 max-w-full md:max-w-xl">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>

              <div className="flex items-center gap-1.5 truncate">
                <FileCheck className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400 shrink-0" />
                <span className="font-bold text-slate-900 dark:text-white truncate font-serif">
                  {manuscript.title || manuscript.filename || 'Active Manuscript'}
                </span>
                {manuscript.filename && (
                  <span className="hidden md:inline text-[10px] px-2 py-0.5 rounded-full bg-blue-100/80 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 font-mono shrink-0">
                    {manuscript.filename}
                  </span>
                )}
              </div>

              {/* Metrics Badges */}
              <div className="hidden sm:flex items-center gap-1.5 shrink-0 text-[11px]">
                <span className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-slate-700 dark:text-slate-300">
                  {manuscript.wordCount.toLocaleString()} w
                </span>
                {manuscript.detectedReferencesCount > 0 && (
                  <span className="px-2 py-0.5 rounded-md bg-purple-100/80 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 font-semibold border border-purple-200 dark:border-purple-800">
                    {manuscript.detectedReferencesCount} refs
                  </span>
                )}
              </div>
            </div>

            {/* Right: Quick Handoff Shortcuts */}
            <div className="flex items-center gap-1.5 shrink-0">
              
              {/* 1. Audit Bibliography */}
              {manuscript.detectedReferencesCount > 0 && (
                <button
                  type="button"
                  onClick={() => onNavigateToPillar('verify')}
                  className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold text-[11px] flex items-center gap-1 transition cursor-pointer shadow-2xs"
                  title="Audit entire bibliography against Crossref & OpenAlex"
                >
                  <Search className="w-3 h-3" />
                  <span>Audit ({manuscript.detectedReferencesCount})</span>
                </button>
              )}

              {/* 2. Match Journals */}
              <button
                type="button"
                onClick={() => onNavigateToPillar('journal')}
                className="px-2 py-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-medium text-[11px] flex items-center gap-1 transition cursor-pointer"
                title="Match manuscript to compliant journals"
              >
                <BookOpen className="w-3 h-3 text-amber-500" />
                <span className="hidden md:inline">Match Journals</span>
              </button>

              {/* 3. Double-Blind Redact */}
              <button
                type="button"
                onClick={() => onNavigateToPillar('anonymizer')}
                className="px-2 py-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-medium text-[11px] flex items-center gap-1 transition cursor-pointer"
                title="Sanitize for double-blind peer review"
              >
                <ShieldCheck className="w-3 h-3 text-emerald-500" />
                <span className="hidden lg:inline">De-Identify</span>
              </button>

              {/* 4. Claims Extraction */}
              <button
                type="button"
                onClick={() => onNavigateToPillar('claims')}
                className="px-2 py-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-medium text-[11px] flex items-center gap-1 transition cursor-pointer"
                title="Extract assertions and ground in literature"
              >
                <Layers className="w-3 h-3 text-blue-500" />
                <span className="hidden lg:inline">Ground Claims</span>
              </button>

              {/* View Breakdown */}
              <button
                type="button"
                onClick={() => setIsDetailsOpen(!isDetailsOpen)}
                className="p-1 rounded-lg hover:bg-white/80 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition cursor-pointer"
                title="View parsed manuscript sections"
              >
                <Eye className="w-3.5 h-3.5" />
              </button>

              {/* Clear Context */}
              <button
                type="button"
                onClick={onClearManuscript}
                className="p-1 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-950/60 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition cursor-pointer"
                title="Unload active manuscript session"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>

          {/* Expandable Parsed Details Drawer */}
          {isDetailsOpen && (
            <div className="mt-2.5 pt-2.5 border-t border-blue-200/60 dark:border-blue-900/40 grid grid-cols-1 md:grid-cols-3 gap-3 animate-in fade-in duration-150">
              
              {/* Title & Metadata */}
              <div className="p-3 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Manuscript Title
                </span>
                <p className="font-serif font-bold text-slate-900 dark:text-white text-xs">
                  {manuscript.title}
                </p>
                {manuscript.keywords && manuscript.keywords.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {manuscript.keywords.map((kw, i) => (
                      <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono">
                        {kw}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Abstract */}
              <div className="p-3 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Abstract
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">
                    {manuscript.abstractWordCount} words
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed">
                  {manuscript.abstract || 'No explicit abstract heading detected.'}
                </p>
              </div>

              {/* Bibliography */}
              <div className="p-3 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                    Extracted References
                  </span>
                  <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300 font-mono">
                    {manuscript.detectedReferencesCount} citations
                  </span>
                </div>
                <p className="text-xs font-mono text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed">
                  {manuscript.bibliography ? manuscript.bibliography.slice(0, 300) : 'No references section parsed.'}
                </p>
              </div>

            </div>
          )}
        </div>
      </div>
    </>
  );
};
