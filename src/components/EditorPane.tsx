import React, { useState, useRef } from 'react';
import { 
  Sparkles, 
  Trash2, 
  FileText, 
  SlidersHorizontal,
  Loader2, 
  CheckCircle, 
  UploadCloud, 
  FileCheck2,
  Database,
  ChevronDown,
  ChevronUp,
  Globe2,
  Settings2
} from 'lucide-react';
import { extractTextFromManuscriptFile } from '../services/fileImportService';

interface EditorPaneProps {
  text: string;
  setText: (text: string) => void;
  focus: string;
  setFocus: (f: string) => void;
  primaryData: string;
  setPrimaryData: (d: string) => void;
  includeSecondaryData: boolean;
  setIncludeSecondaryData: (val: boolean) => void;
  onProcess: () => void;
  isProcessing: boolean;
  sensitivity: 'all' | 'moderate' | 'high';
  setSensitivity: (s: 'all' | 'moderate' | 'high') => void;
  claimsCount?: number;
  onOpenSettings: () => void;
}

export const EditorPane: React.FC<EditorPaneProps> = ({
  text,
  setText,
  focus,
  setFocus,
  primaryData,
  setPrimaryData,
  includeSecondaryData,
  setIncludeSecondaryData,
  onProcess,
  isProcessing,
  sensitivity,
  setSensitivity,
  onOpenSettings,
}) => {
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Advanced contextual guidance options
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(Boolean(focus || primaryData));
  const [uploadedDataFileName, setUploadedDataFileName] = useState<string | null>(null);
  const dataFileInputRef = useRef<HTMLInputElement>(null);

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const charCount = text.length;
  const sentenceEstimate = text.trim() ? (text.match(/[^.!?]+[.!?]+(?:\s+|$)/g) || []).length : 0;

  const handleFileChange = async (file: File) => {
    if (!file) return;
    setIsImporting(true);
    setImportStatus(null);
    try {
      const result = await extractTextFromManuscriptFile(file);
      setText(result.text);
      setImportStatus(`Imported "${result.filename}" (${result.wordCount.toLocaleString()} words)`);
    } catch (err: any) {
      console.error(err);
      alert('Could not import manuscript file: ' + err.message);
    } finally {
      setIsImporting(false);
    }
  };

  const handleDataFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedDataFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setPrimaryData(content);
        setShowAdvancedOptions(true);
      }
    };
    reader.readAsText(file);
  };

  const handleClearPrimaryData = () => {
    setPrimaryData('');
    setUploadedDataFileName(null);
    if (dataFileInputRef.current) {
      dataFileInputRef.current.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileChange(file);
    }
  };

  return (
    <div 
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={`academic-card rounded-2xl bg-white dark:bg-slate-900 border transition ${
        isDragging 
          ? 'border-blue-600 ring-2 ring-blue-600/30 bg-blue-50/20' 
          : 'border-slate-200 dark:border-slate-800'
      } overflow-hidden shadow-xs flex flex-col h-full`}
    >
      {/* Header bar */}
      <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/50 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <FileText className="w-4 h-4 text-blue-800 dark:text-blue-400" />
          <h2 className="text-base font-bold text-slate-900 dark:text-white font-serif">
            Manuscript Draft Editor & Grounding Engine
          </h2>
          <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:inline">
            (Word Document or Pasted Draft)
          </span>
        </div>

        {/* File Import & Clear Action Controls */}
        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileChange(file);
            }}
            accept=".docx,.txt,.md,.rtf,.tex"
            className="hidden"
            id="manuscript-file-upload"
          />
          <label
            htmlFor="manuscript-file-upload"
            className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold border border-slate-300 dark:border-slate-700 transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            {isImporting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-800" />
            ) : (
              <UploadCloud className="w-3.5 h-3.5 text-blue-800 dark:text-blue-400" />
            )}
            <span>{isImporting ? 'Importing...' : 'Upload Word Doc (.docx)'}</span>
          </label>

          <button
            onClick={onOpenSettings}
            className="p-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 transition cursor-pointer"
            title="Open Master Settings"
          >
            <Settings2 className="w-4 h-4 text-slate-600 dark:text-slate-300" />
          </button>

          {text.trim() && (
            <button
              onClick={() => {
                setText('');
                setImportStatus(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
              className="px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-rose-700 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition flex items-center gap-1 cursor-pointer border border-transparent hover:border-slate-300"
              title="Clear text"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* Import Notification Banner if a file was imported */}
      {importStatus && (
        <div className="px-5 py-2.5 bg-blue-50/70 dark:bg-blue-950/40 border-b border-blue-100 dark:border-blue-900/60 flex items-center justify-between text-xs text-blue-900 dark:text-blue-300">
          <div className="flex items-center gap-2 font-medium">
            <FileCheck2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>{importStatus}</span>
          </div>
          <span className="text-[11px] text-slate-500">Ready to ground claims</span>
        </div>
      )}

      {/* Editor Body */}
      <div className="flex-1 p-5 relative flex flex-col min-h-[340px]">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Upload a Microsoft Word (.docx) document or paste your unreferenced manuscript draft, thesis chapter, or research essay here...

The engine will scan the draft, extract factual & empirical assertions, search 250M+ works on OpenAlex and Crossref, and insert verified peer-reviewed citations in your chosen format (APA, MLA, Chicago, IEEE, etc.)."
          className="w-full flex-1 bg-transparent border-0 text-slate-900 dark:text-slate-100 text-base leading-relaxed placeholder-slate-400 focus:outline-none resize-none font-serif p-1"
        />

        {/* Drag & Drop Prompt Overlay when empty */}
        {!text.trim() && (
          <div className="absolute inset-x-8 bottom-16 p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-950/30 text-center pointer-events-none">
            <UploadCloud className="w-6 h-6 text-slate-400 mx-auto mb-1.5" />
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Drag & Drop your Word Document (.docx) or text file here
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Supports .docx, .txt, .md, .rtf, .tex
            </p>
          </div>
        )}
      </div>

      {/* Contextual Focus & Empirical Data Guidance Panel (Parity with Mode 1) */}
      <div className="px-5 py-3 bg-slate-50/90 dark:bg-slate-950/80 border-t border-slate-200 dark:border-slate-800 space-y-3">
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
              <span>Query Public Secondary Registries</span>
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
                Steers claim discovery to prioritize journals and studies specializing in these specific empirical angles.
              </span>
            </div>

            {/* Primary Experimental Data Attachment */}
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
                    ref={dataFileInputRef}
                    onChange={handleDataFileUpload}
                    accept=".csv,.txt,.json,.tsv,.md"
                    className="hidden"
                    id="mode2-primary-data-upload"
                  />
                  <label
                    htmlFor="mode2-primary-data-upload"
                    className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-[11px] font-semibold text-slate-800 dark:text-slate-200 cursor-pointer border border-slate-300 dark:border-slate-700"
                  >
                    Upload CSV / Dataset
                  </label>
                  {primaryData && (
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
                value={primaryData}
                onChange={(e) => {
                  setPrimaryData(e.target.value);
                  if (!e.target.value) setUploadedDataFileName(null);
                }}
                placeholder="Or paste your raw observations, regression results, or statistical metrics here to contextualize grounding..."
                className="w-full p-2 rounded bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
              />
              {uploadedDataFileName && (
                <div className="text-[11px] text-emerald-700 dark:text-emerald-400">
                  Attached file: <strong>{uploadedDataFileName}</strong> ({primaryData.length} chars)
                </div>
              )}
            </div>
          </div>
        )}

        {/* Claim Sensitivity Selection & Word Counts */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-1">
          {/* Metadata counters */}
          <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 font-mono text-xs">
            <span>{wordCount} words</span>
            <span>•</span>
            <span>{sentenceEstimate} sentences</span>
            <span>•</span>
            <span>{charCount} characters</span>
          </div>

          {/* Claim Sensitivity Selection */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1 font-medium">
              <SlidersHorizontal className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400" />
              Claim Detection:
            </span>
            <div className="inline-flex rounded-lg bg-slate-200/80 dark:bg-slate-900 p-0.5 border border-slate-300 dark:border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setSensitivity('high')}
                className={`px-2.5 py-1 rounded-md font-medium transition cursor-pointer ${
                  sensitivity === 'high'
                    ? 'bg-blue-900 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
                title="Only statements with strong numbers, statistics, or causal verbs"
              >
                Strict
              </button>
              <button
                type="button"
                onClick={() => setSensitivity('moderate')}
                className={`px-2.5 py-1 rounded-md font-medium transition cursor-pointer ${
                  sensitivity === 'moderate'
                    ? 'bg-blue-900 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
                title="Empirical, medical, scientific, and technical assertions"
              >
                Balanced
              </button>
              <button
                type="button"
                onClick={() => setSensitivity('all')}
                className={`px-2.5 py-1 rounded-md font-medium transition cursor-pointer ${
                  sensitivity === 'all'
                    ? 'bg-blue-900 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
                title="Cites almost every factual sentence"
              >
                Thorough
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
        <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>Hunts authentic peer-reviewed journal papers on OpenAlex & Crossref with verified DOIs</span>
        </div>

        <button
          onClick={onProcess}
          disabled={!text.trim() || isProcessing}
          className="btn-academic-primary px-6 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2.5 disabled:opacity-50 cursor-pointer shadow-xs"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-white" />
              <span>Hunting Verified Citations...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Extract Claims & Ground Citations</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
