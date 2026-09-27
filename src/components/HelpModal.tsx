import React from 'react';
import { 
  X, 
  ShieldCheck, 
  Database, 
  BookOpen, 
  Sparkles, 
  Cpu, 
  Layers, 
  CheckCircle2, 
  GraduationCap, 
  ExternalLink
} from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="w-full max-w-3xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-blue-900 text-white shadow-xs">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white font-serif">
                ScholarForge Documentation &amp; User Guide
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Unified Scholarly Intelligence &amp; Academic Research Studio
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          
          {/* Core Philosophy: Zero Hallucination */}
          <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 space-y-2">
            <div className="flex items-center gap-2 text-blue-900 dark:text-blue-300 font-bold text-sm">
              <ShieldCheck className="w-4 h-4 text-blue-700 dark:text-blue-400" />
              <span>Authentic Scholarly Grounding • Zero Hallucinations</span>
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
              LLMs frequently hallucinate nonexistent citations and bogus DOIs. <strong>ScholarForge</strong> interfaces directly with official scholarly registries (<strong>OpenAlex</strong> indexing 250M+ works, <strong>Crossref</strong> official DOI authority, and <strong>Google Scholar</strong> profile crawling) to ensure 100% genuine citations and verifiable scientific evidence.
            </p>
          </div>

          {/* Section 1: Three Core Manuscript Workflows */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 font-serif">
              <Sparkles className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
              <span>1. Core Manuscript Writing &amp; Grounding Workflows</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5">
                <span className="font-bold text-blue-900 dark:text-blue-300 block font-serif">
                  Synthesize New Paper
                </span>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-sans">
                  Enter an inquiry or thesis statement → Discover verified peer-reviewed articles and synthesize a 5-section paper with authentic in-text citations.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5">
                <span className="font-bold text-emerald-900 dark:text-emerald-300 block font-serif">
                  Ground Existing Draft
                </span>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-sans">
                  Upload a Word `.docx` or paste unreferenced draft → The engine extracts empirical claims and infills genuine published journal articles with verified DOIs.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 space-y-1.5">
                <span className="font-bold text-purple-900 dark:text-purple-300 block font-serif">
                  Revise &amp; Resubmit (R&amp;R)
                </span>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-sans">
                  Upload manuscript + reviewer report → Overhaul manuscript and generate a formal <strong>Point-by-Point Author Response Letter</strong>.
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: Supplementary Scholarly Tools Suite */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 font-serif">
              <Layers className="w-4 h-4 text-blue-700 dark:text-blue-400" />
              <span>2. Supplementary Scholarly Tools Suite</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              
              {/* Tool 1: Ref Verifier */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5">
                <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 font-serif">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Batch Reference &amp; DOI Verifier</span>
                </div>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-sans">
                  Paste or upload up to 100 raw bibliography references. Ingests and verifies DOIs across Crossref &amp; OpenAlex, flags retractions and predatory journal hallmarks, and exports verified BibTeX.
                </p>
              </div>

              {/* Tool 2: PICO Matrix */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5">
                <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 font-serif">
                  <BookOpen className="w-3.5 h-3.5 text-purple-600" />
                  <span>PICO Matrix &amp; PRISMA Query Builder</span>
                </div>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-sans">
                  Deconstruct research questions into <strong>Population, Intervention, Comparison, Outcome</strong> matrices. Generates targeted Boolean formulas for PubMed, Scopus, Web of Science, Google Scholar, and Cochrane.
                </p>
              </div>

              {/* Tool 3: ScholarImpact Pro */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5 sm:col-span-2">
                <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 font-serif">
                  <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
                  <span>ScholarImpact Pro: Advanced Scientometrics &amp; Career Dossier</span>
                </div>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-sans">
                  Comprehensive Google Scholar profile intelligence engine. Computes advanced indices that Google Scholar lacks:
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-[11px]">
                  <div className="p-1.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <strong>g-index</strong>: Blockbusters
                  </div>
                  <div className="p-1.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <strong>e-index</strong>: Excess Energy
                  </div>
                  <div className="p-1.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <strong>m-quotient</strong>: Career Speed
                  </div>
                  <div className="p-1.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <strong>i100 Tier</strong>: Super-Landmarks
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 text-[11px] space-y-1">
                  <strong className="text-emerald-900 dark:text-emerald-300 block">💡 100% Reliable Ingest Guide (CSV / BibTeX Export):</strong>
                  <ol className="list-decimal pl-4 space-y-0.5 text-slate-700 dark:text-slate-300">
                    <li>Open your profile on Google Scholar and click the <strong>top-left checkbox</strong> above the articles list to select all works.</li>
                    <li>Click <strong>Export</strong> $\rightarrow$ Choose <strong>CSV</strong> (or <strong>BibTeX</strong>).</li>
                    <li>Upload or drop the file into ScholarImpact Pro to instantly compute your complete publication catalog with zero bot blocks!</li>
                  </ol>
                </div>
                <p className="text-[11px] text-slate-500 font-sans pt-1">
                  Synthesizes 3 executive bio formats: <em>Tenure &amp; Review Dossier</em>, <em>Keynote Speaker Intro</em>, and <em>Grant / NSF Bio-Sketch</em> with 1-click formatted copy.
                </p>
              </div>

            </div>
          </div>

          {/* Section 3: Connected Secondary Data Repositories */}
          <div className="space-y-2">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 font-serif">
              <Database className="w-4 h-4 text-blue-700 dark:text-blue-400" />
              <span>3. Global Secondary Research Data Registries</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-sans text-slate-600 dark:text-slate-400">
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <strong>🔬 ClinicalTrials.gov (NIH)</strong>: Interventional trial cohorts, endpoints &amp; study status.
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <strong>📊 World Bank Open Data</strong>: Macroeconomic, health, education &amp; development time-series.
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <strong>🌌 Zenodo Open Science (CERN)</strong>: Global multidisciplinary research datasets with DOIs.
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <strong>🏛️ Harvard Dataverse</strong>: Social science, survey &amp; empirical observational data.
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 sm:col-span-2">
                <strong>🧬 Europe PMC (EMBL-EBI)</strong>: 4.3M+ peer-reviewed datasets &amp; open supplementary cohorts.
              </div>
            </div>
          </div>

          {/* Section 4: Citation Standards */}
          <div className="space-y-2">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 font-serif">
              <BookOpen className="w-4 h-4 text-blue-700 dark:text-blue-400" />
              <span>4. Supported Citation Standards</span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-xs">
              <div className="p-2 rounded-md bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-center font-medium text-slate-800 dark:text-slate-200">APA 7th</div>
              <div className="p-2 rounded-md bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-center font-medium text-slate-800 dark:text-slate-200">MLA 9th</div>
              <div className="p-2 rounded-md bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-center font-medium text-slate-800 dark:text-slate-200">Chicago 17th</div>
              <div className="p-2 rounded-md bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-center font-medium text-slate-800 dark:text-slate-200">Harvard</div>
              <div className="p-2 rounded-md bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-center font-medium text-slate-800 dark:text-slate-200">IEEE</div>
              <div className="p-2 rounded-md bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-center font-medium text-slate-800 dark:text-slate-200">Vancouver</div>
              <div className="p-2 rounded-md bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-center font-medium text-slate-800 dark:text-slate-200">Nature</div>
              <div className="p-2 rounded-md bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-center font-bold text-blue-900 dark:text-blue-300">BibTeX / RIS</div>
            </div>
          </div>

          {/* Section 5: LLM Engines & Privacy */}
          <div className="space-y-2">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 font-serif">
              <Cpu className="w-4 h-4 text-blue-800 dark:text-blue-400" />
              <span>5. AI Engine Connections &amp; 100% Local Privacy</span>
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-sans leading-relaxed">
              Connect your own API key for <strong>Gemini (e.g. Gemini 2.5 Flash / Pro)</strong>, <strong>OpenAI (GPT-4o, o3-mini)</strong>, <strong>Groq</strong>, <strong>DeepSeek</strong>, or run <strong>100% Private Local Models with Ollama</strong> (Llama 3, DeepSeek-R1, Mistral) on your own machine. A zero-configuration built-in heuristic engine is also available.
            </p>
          </div>

          {/* Credits & Disclaimer Box */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                Conceptualized and developed by{' '}
                <a
                  href="https://www.linkedin.com/in/beingbabu/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-700 dark:text-blue-400 hover:underline font-bold inline-flex items-center gap-0.5"
                >
                  <span>Professor Babu George</span>
                  <ExternalLink className="w-3 h-3 inline" />
                </a>
              </span>
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed border-t border-slate-200 dark:border-slate-800 pt-2 text-justify">
              <strong>Disclaimer:</strong> ScholarForge is provided strictly &ldquo;as is&rdquo; for research assistance and informational purposes without warranty of any kind. Users assume full, sole responsibility for all associated third-party API usage, token costs, rate limits, output verification, copyright compliance, and academic integrity. The creator, developers, and affiliated entities disclaim all liability for any costs, inaccuracies, damages, or consequences arising from the use of this tool.
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-sans">
            ScholarForge • Unified Scholarly Intelligence Suite
          </span>
          <button
            onClick={onClose}
            className="btn-academic-primary px-4 py-1.5 rounded-lg text-xs font-semibold cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
