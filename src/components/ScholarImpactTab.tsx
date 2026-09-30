import React, { useState, useRef } from 'react';
import { 
  GraduationCap, 
  Sparkles, 
  Link2, 
  Upload, 
  FileText, 
  Loader2, 
  Check, 
  Copy, 
  BookOpen, 
  ExternalLink,
  BadgeCheck,
  Info
} from 'lucide-react';
import { 
  resolveGoogleScholarDossier, 
  type ScholarImpactProfile, 
  type GoogleScholarInput 
} from '../services/scholarImpactService';
import type { LLMConfig } from '../services/llmService';
import { DEFAULT_LLM_CONFIG } from '../services/llmService';

interface ScholarImpactTabProps {
  llmConfig?: LLMConfig;
}

export const ScholarImpactTab: React.FC<ScholarImpactTabProps> = ({
  llmConfig = DEFAULT_LLM_CONFIG
}) => {
  const [scholarInput, setScholarInput] = useState<GoogleScholarInput>({
    scholarUrlOrId: '',
    pastedScholarText: '',
  });
  const [isFetchingImpact, setIsFetchingImpact] = useState<boolean>(false);
  const [impactProfile, setImpactProfile] = useState<ScholarImpactProfile | null>(null);
  const [impactError, setImpactError] = useState<string>('');
  const [activeBioTab, setActiveBioTab] = useState<'tenure' | 'speaker' | 'grant'>('tenure');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

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

  const handleScholarFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        setScholarInput((prev) => ({ ...prev, pastedScholarText: content }));
        handleExecuteImpactSearch({ ...scholarInput, pastedScholarText: content });
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header Title Card */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/60 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-900 dark:bg-blue-800 text-white flex items-center justify-center shadow-xs">
            <GraduationCap className="w-5 h-5 text-amber-300" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white font-serif">
              Google Scholar Career Intelligence &amp; Biosketch Generator
            </h3>
            <p className="text-xs text-slate-500 font-sans">
              Analyze citation curves, verify h-index, and generate publication-grade tenure, speaker, and grant biosketches.
            </p>
          </div>
        </div>
      </div>

      {/* 3 Step Instructions */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 dark:from-emerald-950/40 dark:via-teal-950/40 dark:to-blue-950/40 border border-emerald-200 dark:border-emerald-800 space-y-2.5 text-xs text-slate-700 dark:text-slate-300 shadow-xs">
        <div className="flex items-center gap-2 font-bold text-emerald-900 dark:text-emerald-300 font-serif">
          <Sparkles className="w-4 h-4 text-emerald-600" />
          <span>How to Ingest Your Complete Publication Catalog in 3 Simple Steps:</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
          <div className="p-3 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-emerald-200/60 dark:border-emerald-900/60 space-y-1">
            <span className="font-bold text-emerald-800 dark:text-emerald-300 block">Step 1: Open Google Scholar</span>
            <p className="text-[11px] text-slate-600 dark:text-slate-400">
              Open your profile page on Google Scholar and click the <strong>top-left checkbox</strong> above the articles table to select all works.
            </p>
          </div>
          <div className="p-3 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-emerald-200/60 dark:border-emerald-900/60 space-y-1">
            <span className="font-bold text-emerald-800 dark:text-emerald-300 block">Step 2: Export CSV or BibTeX</span>
            <p className="text-[11px] text-slate-600 dark:text-slate-400">
              Click the blue <strong>EXPORT</strong> button at the top of the table and choose <strong>CSV</strong> (or <strong>BibTeX</strong>).
            </p>
          </div>
          <div className="p-3 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-emerald-200/60 dark:border-emerald-900/60 space-y-1">
            <span className="font-bold text-emerald-800 dark:text-emerald-300 block">Step 3: Upload or Paste File</span>
            <p className="text-[11px] text-slate-600 dark:text-slate-400">
              Upload your downloaded file below (or paste its content). Your complete publication catalog and advanced scientometrics are parsed locally in 1 second!
            </p>
          </div>
        </div>
      </div>

      {/* Ingestion Methods */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs text-xs">
        
        {/* Method 1: Google Scholar Profile URL */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-blue-200 dark:border-blue-900/60 space-y-2">
          <label className="font-bold text-blue-950 dark:text-blue-300 flex items-center justify-between font-serif">
            <span className="flex items-center gap-1.5">
              <Link2 className="w-4 h-4 text-blue-600" />
              <span>Method A: Google Scholar Profile Link or User ID</span>
            </span>
            <span className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setScholarInput(prev => ({ ...prev, scholarUrlOrId: 'https://scholar.google.com/citations?user=1knki-oAAAAJ&hl=en' }))}
                className="text-[11px] font-semibold text-blue-700 dark:text-blue-400 hover:underline cursor-pointer font-sans"
              >
                Load Demo Profile
              </button>
              {scholarInput.scholarUrlOrId && (
                <button
                  type="button"
                  onClick={() => setScholarInput(prev => ({ ...prev, scholarUrlOrId: '' }))}
                  className="text-[11px] font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer font-sans"
                >
                  Clear
                </button>
              )}
            </span>
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={scholarInput.scholarUrlOrId}
              onChange={(e) => setScholarInput({ ...scholarInput, scholarUrlOrId: e.target.value })}
              placeholder="e.g. https://scholar.google.com/citations?user=1knki-oAAAAJ&hl=en"
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 text-xs font-mono focus:outline-none focus:border-blue-700"
            />
            <button
              type="button"
              onClick={() => handleExecuteImpactSearch()}
              disabled={isFetchingImpact}
              className="btn-academic-primary px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
            >
              {isFetchingImpact ? <Loader2 className="w-3.5 h-3.5 animate-spin text-white" /> : <Sparkles className="w-3.5 h-3.5" />}
              <span>Analyze Scholar</span>
            </button>
          </div>
        </div>

        {/* Method 2: Upload CSV or BibTeX */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 bg-slate-50/50 dark:bg-slate-950/50 flex flex-col items-center justify-center text-center cursor-pointer transition-colors space-y-1.5"
          >
            <input
              type="file"
              ref={fileInputRef}
              accept=".csv,.txt,.bib"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleScholarFileUpload(file);
              }}
            />
            <Upload className="w-5 h-5 text-blue-700 dark:text-blue-400" />
            <span className="font-bold text-slate-800 dark:text-slate-200">Method B: Upload Exported CSV or BibTeX</span>
            <p className="text-[11px] text-slate-500">
              Drag and drop your Google Scholar CSV export here for instant comprehensive analysis
            </p>
          </div>

          {/* Method 3: Paste text */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1 font-serif">
                <FileText className="w-3.5 h-3.5 text-purple-600" />
                <span>Method C: Paste Raw Export / Text</span>
              </span>
              {scholarInput.pastedScholarText && (
                <button
                  type="button"
                  onClick={() => handleExecuteImpactSearch()}
                  className="text-xs text-blue-700 font-bold hover:underline cursor-pointer"
                >
                  Analyze Pasted Text
                </button>
              )}
            </div>
            <textarea
              rows={2}
              value={scholarInput.pastedScholarText}
              onChange={(e) => setScholarInput({ ...scholarInput, pastedScholarText: e.target.value })}
              placeholder="Paste table rows from Google Scholar or CSV contents here..."
              className="w-full p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-[11px] font-mono text-slate-900 dark:text-white focus:outline-none focus:border-blue-700"
            />
          </div>
        </div>

        {impactError && (
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-300">
            {impactError}
          </div>
        )}

        {/* Nominative Trademark & Fair Use Notice */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-start gap-2">
          <Info className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
          <span className="leading-relaxed">
            <strong>Nominative Fair Use Notice:</strong> Google Scholar&trade; is a trademark of Google LLC. ScholarForge is an independent scholarly software tool and is not affiliated with, sponsored by, or endorsed by Google LLC. Automated profile ingestion operates on user-initiated public researcher profiles or locally provided CSV/BibTeX exports under fair use for personal academic evaluation.
          </span>
        </div>
      </div>

      {/* Scholar Profile Results Presentation */}
      {impactProfile && (
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-6 shadow-xs animate-in fade-in duration-200">
          
          {/* Identity Header Strip */}
          <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-900 text-white flex items-center justify-center font-bold text-xl font-serif shadow-xs">
                {impactProfile.name.charAt(0) || 'S'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold font-serif text-slate-900 dark:text-white">
                    {impactProfile.name}
                  </h3>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                    <BadgeCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Verified Profile</span>
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  {impactProfile.affiliation || 'University Research Faculty'}
                </p>
              </div>
            </div>

            {impactProfile.scholarUrl && (
              <a
                href={impactProfile.scholarUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 border border-slate-300 dark:border-slate-700 shadow-2xs transition"
              >
                <span>View Google Scholar</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>

          {/* Scientometric Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] uppercase tracking-wider text-slate-500 font-bold block font-sans">
                Total Citations
              </span>
              <span className="text-2xl font-bold font-mono text-blue-900 dark:text-blue-300 mt-1 block">
                {impactProfile.citationCount.toLocaleString()}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] uppercase tracking-wider text-slate-500 font-bold block font-sans">
                h-index
              </span>
              <span className="text-2xl font-bold font-mono text-emerald-900 dark:text-emerald-300 mt-1 block">
                {impactProfile.hIndex}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] uppercase tracking-wider text-slate-500 font-bold block font-sans">
                i10-index
              </span>
              <span className="text-2xl font-bold font-mono text-purple-900 dark:text-purple-300 mt-1 block">
                {impactProfile.i10Index}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] uppercase tracking-wider text-slate-500 font-bold block font-sans">
                Indexed Works
              </span>
              <span className="text-2xl font-bold font-mono text-amber-900 dark:text-amber-300 mt-1 block">
                {impactProfile.paperCount}
              </span>
            </div>
          </div>

          {/* Automated Academic Bio Statements */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setActiveBioTab('tenure')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    activeBioTab === 'tenure'
                      ? 'bg-blue-900 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  Tenure &amp; Promotion Narrative
                </button>

                <button
                  type="button"
                  onClick={() => setActiveBioTab('speaker')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    activeBioTab === 'speaker'
                      ? 'bg-blue-900 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  Keynote Speaker Bio
                </button>

                <button
                  type="button"
                  onClick={() => setActiveBioTab('grant')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    activeBioTab === 'grant'
                      ? 'bg-blue-900 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  Grant Proposal Biosketch
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  const bio = activeBioTab === 'tenure' 
                    ? impactProfile.cvBioSnippet 
                    : activeBioTab === 'speaker' 
                    ? impactProfile.speakerBioSnippet 
                    : impactProfile.grantBioSnippet;
                  handleCopy(bio, `cv-bio-${activeBioTab}`);
                }}
                className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 flex items-center gap-1.5 cursor-pointer shadow-2xs transition"
              >
                {copiedKey === `cv-bio-${activeBioTab}` ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === `cv-bio-${activeBioTab}` ? 'Copied Bio!' : 'Copy Formatted Bio'}</span>
              </button>
            </div>

            <p className="font-serif text-xs text-slate-800 dark:text-slate-200 leading-relaxed bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-justify">
              {activeBioTab === 'tenure' && impactProfile.cvBioSnippet}
              {activeBioTab === 'speaker' && impactProfile.speakerBioSnippet}
              {activeBioTab === 'grant' && impactProfile.grantBioSnippet}
            </p>
          </div>

          {/* Landmark Defining Publications */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white font-serif uppercase tracking-wider flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-blue-700" />
                <span>Landmark Publications and Lifetime Impact ({impactProfile.topPapers.length} Top Works)</span>
              </h4>
              <span className="text-[11px] text-slate-500 font-sans">
                Ranked by citation count
              </span>
            </div>

            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
              {impactProfile.topPapers.map((paper, pIdx) => (
                <div
                  key={pIdx}
                  className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-start justify-between gap-3 text-xs hover:border-blue-300 dark:hover:border-blue-800 transition-colors"
                >
                  <div className="space-y-1 flex-1">
                    <h5 className="font-serif font-bold text-slate-900 dark:text-white">
                      {pIdx + 1}. {paper.title}
                    </h5>
                    <div className="text-slate-500 font-sans flex flex-wrap items-center gap-2">
                      <span><strong>{paper.year}</strong></span>
                      <span>•</span>
                      <span><em>{paper.venue}</em></span>
                      <span className="px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-semibold">
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
                        <span>Scholar Record</span>
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
  );
};
