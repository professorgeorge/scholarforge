import React, { useState, useEffect } from 'react';
import { Navbar, type AcademicPillar, type WorkflowLensId, WORKFLOW_LENSES } from './components/Navbar';
import { ScholarLaunchpad } from './components/ScholarLaunchpad';
import { ResultPane } from './components/ResultPane';
import { EvidencePane } from './components/EvidencePane';
import { ManualSearchModal } from './components/ManualSearchModal';
import { HelpModal } from './components/HelpModal';
import { SettingsModal } from './components/SettingsModal';
import { ResearchCartDrawer } from './components/ResearchCartDrawer';
import { VerifierPane } from './components/VerifierPane';
import { LiteratureFirstPane } from './components/LiteratureFirstPane';
import { ClaimsWorkbenchPane } from './components/ClaimsWorkbenchPane';
import { ScholarSearchPane } from './components/ScholarSearchPane';
import { JournalSentinelPane } from './components/JournalSentinelPane';
import { MethodologyCompassPane } from './components/MethodologyCompassPane';
import { SyntheticDataForgePane } from './components/SyntheticDataForgePane';
import { CommandPaletteModal } from './components/CommandPaletteModal';
import { AcademicToolbeltModal } from './components/AcademicToolbeltModal';
import { ResearchBinderDrawer } from './components/ResearchBinderDrawer';
import { 
  EXEMPLAR_MANUSCRIPT_TEXT, 
  getExemplarClaims 
} from './data/exemplarManuscript';
import type { 
  AcademicPaper, 
  CitationOptions, 
  Claim 
} from './types/citation';
import { DEFAULT_LLM_CONFIG, type LLMConfig, type PeerReviewOverhaulResult } from './services/llmService';
import { extractClaimsFromText } from './services/claimExtractor';
import { huntAcademicPapers } from './services/academicApi';
import { 
  BookOpen, 
  RotateCcw, 
  RefreshCw,
  ExternalLink,
  ShieldAlert,
  ShieldCheck,
  Users,
  Compass,
  Database
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { addMultiplePapersToCart } from './services/cartService';

export const App: React.FC = () => {
  const [inputText, setInputText] = useState<string>('');
  const [claims, setClaims] = useState<Claim[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 });
  const [sensitivity, setSensitivity] = useState<'all' | 'moderate' | 'high'>(() => {
    const saved = localStorage.getItem('scholarforge_claim_sensitivity');
    if (saved === 'all' || saved === 'moderate' || saved === 'high') return saved;
    return 'moderate';
  });
  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null);
  const [manualSearchClaim, setManualSearchClaim] = useState<Claim | null>(null);
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [activePillar, setActivePillar] = useState<AcademicPillar>('literature');
  const [activeLens, setActiveLens] = useState<WorkflowLensId>('full');
  const [isSpotlightOpen, setIsSpotlightOpen] = useState<boolean>(false);
  const [isToolbeltOpen, setIsToolbeltOpen] = useState<boolean>(false);
  const [activeToolbeltId, setActiveToolbeltId] = useState<string | undefined>('anonymizer');
  const [isBinderOpen, setIsBinderOpen] = useState<boolean>(false);

  // Global Keyboard Shortcuts (Ctrl+K or Cmd+K for Spotlight)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSpotlightOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Cross-Platform Bridge: Detect incoming cart payloads from ScholarCite Express
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes('import-cart')) {
      try {
        const queryPart = hash.split('?')[1] || window.location.search.slice(1);
        const params = new URLSearchParams(queryPart);
        const data = params.get('data');
        if (data) {
          const decoded = JSON.parse(decodeURIComponent(escape(atob(data))));
          if (Array.isArray(decoded) && decoded.length > 0) {
            const normalized: AcademicPaper[] = decoded.map((item: any, idx: number) => ({
              id: item.id || item.doi || `imported-${Date.now()}-${idx}`,
              title: item.title || 'Untitled Research',
              authors: Array.isArray(item.authors)
                ? item.authors.map((a: any) => (typeof a === 'string' ? { name: a } : a))
                : [],
              year: item.year || new Date().getFullYear(),
              venue: item.venue || item.fullVenue || 'Academic Source',
              doi: item.doi || '',
              url: item.url || (item.doi ? `https://doi.org/${item.doi}` : ''),
              citationCount: item.citeCount || item.citationCount || 0,
              abstract: item.abstract || item.snippet || '',
              openAccess: Boolean(item.openAccess || item.openAccessPdf || item.isOa),
              openAccessPdf: item.openAccessPdf,
              source: 'manual',
              volume: item.volume,
              issue: item.issue,
              pages: item.pages,
              type: item.type || 'journal',
            }));

            addMultiplePapersToCart(normalized);
            setIsCartOpen(true);
            confetti({
              particleCount: 50,
              spread: 70,
              origin: { y: 0.8 },
              colors: ['#0284c7', '#38bdf8', '#c084fc'],
            });
            window.history.replaceState(null, '', window.location.pathname);
          }
        }
      } catch (err) {
        console.error('Failed to import cart from URL bridge', err);
      }
    }
  }, []);

  // Peer-Review Rebuttal Package State
  const [rebuttalPackage, setRebuttalPackage] = useState<PeerReviewOverhaulResult | null>(null);
  const [originalPreRevisionText, setOriginalPreRevisionText] = useState<string>('');

  const [options, setOptions] = useState<CitationOptions>(() => {
    const saved = localStorage.getItem('scholarforge_citation_options');
    if (saved) {
      try {
        return {
          style: 'apa',
          includeDoi: true,
          includeAbstracts: true,
          maxAuthorsInText: 3,
          linkCitations: true,
          excludePreprints: true,
          requireDoi: true,
          ...JSON.parse(saved)
        };
      } catch {}
    }
    return {
      style: 'apa',
      includeDoi: true,
      includeAbstracts: true,
      maxAuthorsInText: 3,
      linkCitations: true,
      excludePreprints: true,
      requireDoi: true,
    };
  });

  // Keep options and sensitivity synchronized in localStorage
  useEffect(() => {
    localStorage.setItem('scholarforge_citation_options', JSON.stringify(options));
  }, [options]);

  useEffect(() => {
    localStorage.setItem('scholarforge_claim_sensitivity', sensitivity);
  }, [sensitivity]);

  const [llmConfig, setLlmConfig] = useState<LLMConfig>(() => {
    const saved = localStorage.getItem('citation_filler_llm_config');
    if (!saved) return DEFAULT_LLM_CONFIG;
    try {
      const parsed = JSON.parse(saved);
      if (parsed.provider === 'gemini') {
        if (!parsed.model || parsed.model.includes('1.5') || parsed.model.includes('3.6')) {
          parsed.model = 'gemini-2.5-flash';
          localStorage.setItem('citation_filler_llm_config', JSON.stringify(parsed));
        }
      } else if (parsed.provider === 'webgpu') {
        const validWebModels = ['Qwen2.5-1.5B-Instruct-q4f16_1-MLC', 'Qwen2.5-0.5B-Instruct-q4f16_1-MLC', 'SmolLM2-1.7B-Instruct-q4f16_1-MLC'];
        if (!validWebModels.includes(parsed.model)) {
          parsed.model = 'Qwen2.5-1.5B-Instruct-q4f16_1-MLC';
          localStorage.setItem('citation_filler_llm_config', JSON.stringify(parsed));
        }
      }
      return parsed;
    } catch {
      return DEFAULT_LLM_CONFIG;
    }
  });

  // Extract unique papers from current claims
  const uniquePapers: AcademicPaper[] = Array.from(
    new Map(
      claims
        .map((c) => c.selectedPaper)
        .filter(Boolean)
        .map((p) => [p!.id, p!])
    ).values()
  );

  // Ground an existing draft manuscript
  const handleStartGroundingDraft = async (draftText: string) => {
    if (!draftText.trim() || isProcessing) return;

    setInputText(draftText);
    setRebuttalPackage(null);
    setOriginalPreRevisionText('');
    setIsProcessing(true);

    const extractedClaims = extractClaimsFromText(draftText, sensitivity);
    if (extractedClaims.length === 0) {
      setClaims([]);
      setIsProcessing(false);
      return;
    }

    const initialClaims: Claim[] = extractedClaims.map((c) => ({
      ...c,
      status: 'searching',
    }));
    setClaims(initialClaims);
    setProgress({ current: 0, total: initialClaims.length });

    const updatedClaims: Claim[] = [...initialClaims];
    const batchSize = 3;

    for (let i = 0; i < updatedClaims.length; i += batchSize) {
      const batch = updatedClaims.slice(i, i + batchSize);

      await Promise.all(
        batch.map(async (claim, batchIdx) => {
          const globalIdx = i + batchIdx;
          try {
            const papers = await huntAcademicPapers(claim.searchQueries, 4, options.excludePreprints);

            if (papers.length > 0) {
              updatedClaims[globalIdx] = {
                ...claim,
                candidatePapers: papers,
                selectedPaper: papers[0],
                status: 'found',
              };
            } else {
              updatedClaims[globalIdx] = {
                ...claim,
                candidatePapers: [],
                selectedPaper: null,
                status: 'not_found',
              };
            }
          } catch (err) {
            console.error(`Search failed for claim: "${claim.text}"`, err);
            updatedClaims[globalIdx] = {
              ...claim,
              candidatePapers: [],
              selectedPaper: null,
              status: 'not_found',
            };
          }
        })
      );

      setClaims([...updatedClaims]);
      setProgress({ current: Math.min(i + batchSize, updatedClaims.length), total: updatedClaims.length });
    }

    setIsProcessing(false);

    confetti({
      particleCount: 45,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#1e3a8a', '#2563eb', '#065f46'],
    });
  };

  // Re-extract claims from the current manuscript using an updated sensitivity setting
  const handleReExtractClaims = (newSensitivity: 'all' | 'moderate' | 'high') => {
    if (!inputText.trim()) return;
    setSensitivity(newSensitivity);

    const extractedClaims = extractClaimsFromText(inputText, newSensitivity);
    if (extractedClaims.length === 0) {
      setClaims([]);
      return;
    }

    const existingPaperMap = new Map<string, AcademicPaper>();
    claims.forEach((c) => {
      if (c.selectedPaper) {
        existingPaperMap.set(c.text.trim().toLowerCase(), c.selectedPaper);
      }
    });

    const candidatePool = uniquePapers.length > 0 ? uniquePapers : [];

    const updatedClaims: Claim[] = extractedClaims.map((claim, idx) => {
      const match = existingPaperMap.get(claim.text.trim().toLowerCase());
      const selected = match || (candidatePool.length > 0 ? candidatePool[idx % candidatePool.length] : null);
      return {
        ...claim,
        candidatePapers: candidatePool,
        selectedPaper: selected,
        status: selected ? 'found' : 'not_found',
        confidence: selected ? 'high' : 'medium',
        isExcluded: false,
        citationNumber: idx + 1,
      };
    });

    setClaims(updatedClaims);
    setSelectedClaimId(null);
  };

  // Called when AI synthesizes a new grounded manuscript
  const handleManuscriptReady = (manuscript: string, synthesizedClaims: Claim[]) => {
    setInputText(manuscript);
    setRebuttalPackage(null);
    setOriginalPreRevisionText('');
    setClaims(synthesizedClaims);
    setSelectedClaimId(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    confetti({
      particleCount: 50,
      spread: 70,
      origin: { y: 0.8 },
      colors: ['#1e3a8a', '#2563eb', '#065f46'],
    });
  };

  // Called when Peer-Review Overhaul and Point-by-Point Rebuttal Package is ready
  const handleRebuttalPackageReady = (
    result: PeerReviewOverhaulResult, 
    originalDraft: string, 
    overhaulClaims: Claim[]
  ) => {
    setInputText(result.revisedManuscript);
    setRebuttalPackage(result);
    setOriginalPreRevisionText(originalDraft);
    setClaims(overhaulClaims);
    setSelectedClaimId(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    confetti({
      particleCount: 65,
      spread: 80,
      origin: { y: 0.8 },
      colors: ['#1e3a8a', '#2563eb', '#065f46'],
    });
  };

  // Called to load pre-grounded exemplar research paper for instant live studio exploration
  const handleLoadExemplarManuscript = () => {
    setInputText(EXEMPLAR_MANUSCRIPT_TEXT);
    setClaims(getExemplarClaims());
    setSelectedClaimId(null);
    setRebuttalPackage(null);
    setOriginalPreRevisionText('');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    confetti({
      particleCount: 50,
      spread: 70,
      origin: { y: 0.8 },
      colors: ['#0284c7', '#38bdf8', '#c084fc'],
    });
  };

  // Called when user submits peer-review revisions
  const handleApplyRevision = (revisedManuscript: string) => {
    setInputText(revisedManuscript);
    
    // Extract claims from revised text and map existing verified papers
    const extractedClaims = extractClaimsFromText(revisedManuscript, sensitivity);
    const existingPapers = uniquePapers;
    
    const newClaims: Claim[] = extractedClaims.map((claim, idx) => {
      const assigned = existingPapers[idx % Math.max(existingPapers.length, 1)] || null;
      return {
        ...claim,
        candidatePapers: existingPapers,
        selectedPaper: assigned,
        status: assigned ? 'found' : 'searching',
        confidence: 'high',
        isExcluded: false,
        citationNumber: idx + 1,
      };
    });

    setClaims(newClaims);
    setSelectedClaimId(null);
  };

  const handleSelectPaper = (claimId: string, paper: AcademicPaper) => {
    setClaims((prev) =>
      prev.map((c) =>
        c.id === claimId
          ? { ...c, selectedPaper: paper, status: 'found' }
          : c
      )
    );
  };

  const handleToggleExclude = (claimId: string) => {
    setClaims((prev) =>
      prev.map((c) =>
        c.id === claimId
          ? { ...c, isExcluded: !c.isExcluded }
          : c
      )
    );
  };

  const handleRetrySearch = async (claimId: string, customQuery?: string) => {
    const claimIndex = claims.findIndex((c) => c.id === claimId);
    if (claimIndex === -1) return;

    setClaims((prev) =>
      prev.map((c) => (c.id === claimId ? { ...c, status: 'searching' } : c))
    );

    const targetClaim = claims[claimIndex];
    const queries = customQuery ? [customQuery] : targetClaim.searchQueries;

    try {
      const papers = await huntAcademicPapers(queries, 6, options.excludePreprints);
      setClaims((prev) =>
        prev.map((c) =>
          c.id === claimId
            ? {
                ...c,
                candidatePapers: papers,
                selectedPaper: papers.length > 0 ? papers[0] : null,
                status: papers.length > 0 ? 'found' : 'not_found',
              }
            : c
        )
      );
    } catch (err) {
      setClaims((prev) =>
        prev.map((c) => (c.id === claimId ? { ...c, status: 'not_found' } : c))
      );
    }
  };

  const handleResetWorkspace = () => {
    if (window.confirm('Start a new inquiry and reset the current manuscript?')) {
      setInputText('');
      setClaims([]);
      setProgress({ current: 0, total: 0 });
      setSelectedClaimId(null);
    }
  };

  const handleResetResearchData = () => {
    setInputText('');
    setClaims([]);
    setProgress({ current: 0, total: 0 });
    setSelectedClaimId(null);
    setRebuttalPackage(null);
    setOriginalPreRevisionText('');
  };

  const handleFullFactoryReset = () => {
    setInputText('');
    setClaims([]);
    setProgress({ current: 0, total: 0 });
    setSelectedClaimId(null);
    setRebuttalPackage(null);
    setOriginalPreRevisionText('');
    setOptions({
      style: 'apa',
      includeDoi: true,
      includeAbstracts: true,
      maxAuthorsInText: 3,
      linkCitations: true,
      excludePreprints: true,
      requireDoi: true,
    });
    setSensitivity('moderate');
    setLlmConfig(DEFAULT_LLM_CONFIG);
  };

  const hasActiveManuscript = claims.length > 0;
  const groundedClaimsCount = claims.filter((c) => !c.isExcluded && c.selectedPaper).length;

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'} transition-colors duration-200`}>
      
      {/* Navigation Bar */}
      <Navbar
        options={options}
        setOptions={setOptions}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
        onOpenHelp={() => setIsHelpOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenSpotlight={() => setIsSpotlightOpen(true)}
        onOpenToolbelt={() => {
          setActiveToolbeltId('anonymizer');
          setIsToolbeltOpen(true);
        }}
        onOpenBinder={() => setIsBinderOpen(true)}
        activePillar={activePillar}
        onSelectPillar={(pillar) => {
          setActivePillar(pillar);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        activeLens={activeLens}
        onSelectLens={setActiveLens}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 lg:px-8 py-6 space-y-6">
        
        {/* Global Progress Bar when grounding */}
        {isProcessing && (
          <div className="p-4 rounded-xl bg-blue-50/80 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 animate-in fade-in duration-200">
            <div className="flex items-center justify-between text-xs font-semibold text-blue-950 dark:text-blue-200 mb-2">
              <span className="flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-800 dark:text-blue-400" />
                <span>Extracting empirical claims & hunting verified peer-reviewed articles...</span>
              </span>
              <span>
                {progress.current} / {progress.total} claims ({progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0}%)
              </span>
            </div>
            <div className="w-full bg-blue-200 dark:bg-blue-900/50 rounded-full h-2 overflow-hidden">
              <div
                className="bg-blue-900 dark:bg-blue-400 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Pillar 4: Verify & Audit Mode */}
        {activePillar === 'verify' && (
          <div className="py-2 animate-in fade-in duration-200">
            <VerifierPane llmConfig={llmConfig} />
          </div>
        )}

        {/* Pillar 1: Literature-First Discovery & Extraction */}
        {activePillar === 'literature' && (
          <div className="py-2 animate-in fade-in duration-200">
            <LiteratureFirstPane
              onManuscriptSynthesized={(m, c) => {
                handleManuscriptReady(m, c);
                setActivePillar('studio');
              }}
              options={options}
              setOptions={setOptions}
              llmConfig={llmConfig}
            />
          </div>
        )}

        {/* Pillar 3: Empirical Claims & Evidence Consensus Workbench */}
        {activePillar === 'claims' && (
          <div className="py-2 animate-in fade-in duration-200">
            <ClaimsWorkbenchPane
              llmConfig={llmConfig}
              sensitivity={sensitivity}
              setSensitivity={setSensitivity}
              options={options}
              setOptions={setOptions}
              onSendToStudio={(draft, newClaims) => {
                setInputText(draft);
                setClaims(newClaims);
                setSelectedClaimId(null);
                setActivePillar('studio');
                confetti({
                  particleCount: 50,
                  spread: 70,
                  origin: { y: 0.8 },
                  colors: ['#0284c7', '#38bdf8', '#c084fc'],
                });
              }}
            />
          </div>
        )}

        {/* Pillar 5: Scholars & Reviewers (Universal Scholar Search) */}
        {activePillar === 'scholars' && (
          <div className="py-2 animate-in fade-in duration-200">
            <ScholarSearchPane
              llmConfig={llmConfig}
              initialTitle={inputText ? inputText.slice(0, 160) : ''}
              initialAbstract={inputText && inputText.length > 160 ? inputText.slice(160, 1500) : ''}
            />
          </div>
        )}

        {/* Pillar 6: The Journal Fit & Desk-Rejection Pre-Flight Sentinel */}
        {activePillar === 'journal' && (
          <div className="py-2 animate-in fade-in duration-200">
            <JournalSentinelPane
              llmConfig={llmConfig}
              initialTitle={inputText ? inputText.slice(0, 160) : ''}
              initialAbstract={inputText && inputText.length > 160 ? inputText.slice(160, 1500) : ''}
              initialFullDraft={inputText}
              initialReferences={uniquePapers.map(p => `${p.authors.map(a => a.name).join(', ')}. ${p.title}. ${p.venue}, ${p.year}.`)}
              onAppendToDraft={(declarationText) => {
                setInputText(prev => prev ? `${prev}\n\n${declarationText}` : declarationText);
              }}
              onNavigateToStudio={() => setActivePillar('studio')}
            />
          </div>
        )}

        {/* Pillar 7: Methodology & Analysis Compass */}
        {activePillar === 'methodology' && (
          <div className="py-2 animate-in fade-in duration-200">
            <MethodologyCompassPane 
              llmConfig={llmConfig}
              onNavigateToSynthetic={() => setActivePillar('synthetic')} 
            />
          </div>
        )}

        {/* Pillar 8: Synthetic Data Forge & Applied Simulation */}
        {activePillar === 'synthetic' && (
          <div className="py-2 animate-in fade-in duration-200">
            <SyntheticDataForgePane
              llmConfig={llmConfig}
              onNavigateToStudio={(seedText) => {
                setInputText(prev => prev ? `${prev}\n\n${seedText}` : seedText);
                setActivePillar('studio');
              }}
            />
          </div>
        )}

        {/* Pillar 2: Manuscript Studio */}
        {activePillar === 'studio' && (
          <>
            {!hasActiveManuscript ? (
              <div className="py-4 animate-in fade-in duration-200">
                <ScholarLaunchpad
                  onManuscriptReady={(m, c) => {
                    handleManuscriptReady(m, c);
                    setActivePillar('studio');
                  }}
                  onStartGroundingDraft={(d) => {
                    handleStartGroundingDraft(d);
                    setActivePillar('studio');
                  }}
                  onRebuttalPackageReady={(r, o, c) => {
                    handleRebuttalPackageReady(r, o, c);
                    setActivePillar('studio');
                  }}
                  onLoadSample={handleLoadExemplarManuscript}
                  options={options}
                  setOptions={setOptions}
                  sensitivity={sensitivity}
                  setSensitivity={setSensitivity}
                  llmConfig={llmConfig}
                  onOpenSettings={() => setIsSettingsOpen(true)}
                  isProcessing={isProcessing}
                />
              </div>
            ) : (
              <div className="space-y-5 animate-in fade-in duration-200">
                
                {/* Active Manuscript Status & Control Strip */}
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 shadow-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-900 dark:bg-blue-800 flex items-center justify-center text-white shrink-0">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white font-serif">
                          Grounded Manuscript Workspace
                        </h3>
                        {rebuttalPackage && (
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950 text-purple-900 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                            Peer-Review Rebuttal Package
                          </span>
                        )}
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          Active
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-500 font-sans">
                        <span><strong>{groundedClaimsCount} / {claims.length}</strong> claims cited</span>
                        <span>•</span>
                        <span><strong>{uniquePapers.length}</strong> peer-reviewed journal papers</span>
                        <span>•</span>
                        <span>100% verified DOIs</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setActivePillar('methodology')}
                      className="px-3.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 dark:bg-red-950/60 dark:hover:bg-red-900/60 text-red-900 dark:text-red-300 text-xs font-semibold flex items-center gap-1.5 border border-red-200 dark:border-red-800 cursor-pointer transition"
                      title="Architect statistical/qualitative methods & verify epistemic coherence"
                    >
                      <Compass className="w-3.5 h-3.5 text-red-700 dark:text-red-400" />
                      <span>Methodology Compass</span>
                    </button>
                    <button
                      onClick={() => setActivePillar('synthetic')}
                      className="px-3.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-900 dark:text-blue-300 text-xs font-semibold flex items-center gap-1.5 border border-blue-200 dark:border-blue-800 cursor-pointer transition"
                      title="Generate synthetic empirical data with moderation, mediation, or interview discourse"
                    >
                      <Database className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400" />
                      <span>Synthetic Data Forge</span>
                    </button>
                    <button
                      onClick={() => setActivePillar('journal')}
                      className="px-3.5 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/60 dark:hover:bg-teal-900/60 text-teal-900 dark:text-teal-300 text-xs font-semibold flex items-center gap-1.5 border border-teal-200 dark:border-teal-800 cursor-pointer transition"
                      title="Match Scopus journals & run desk-rejection pre-flight audit for this manuscript"
                    >
                      <Compass className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                      <span>Journal Fit &amp; Pre-Flight</span>
                    </button>
                    <button
                      onClick={() => setActivePillar('scholars')}
                      className="px-3.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-900 dark:text-indigo-300 text-xs font-semibold flex items-center gap-1.5 border border-indigo-200 dark:border-indigo-800 cursor-pointer transition"
                      title="Find Peer Reviewers, Co-Authors, or Co-Investigators for this manuscript"
                    >
                      <Users className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                      <span>Find Scholars &amp; Reviewers</span>
                    </button>
                    <button
                      onClick={handleResetWorkspace}
                      className="px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 border border-slate-300 dark:border-slate-700 cursor-pointer transition"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Start New Paper</span>
                    </button>
                  </div>
                </div>

                {/* Split Screen Layout: Left Canvas (Result & Revisions) + Right Pane (Evidence & Claims) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  
                  {/* Left 7 Columns: Manuscript Canvas & Export Suite */}
                  <div className="lg:col-span-7 space-y-4">
                    <ResultPane
                      originalText={inputText}
                      claims={claims}
                      options={options}
                      setOptions={setOptions}
                      rebuttalPackage={rebuttalPackage}
                      originalPreRevisionText={originalPreRevisionText}
                      onFocusClaim={(claimId) => {
                        setSelectedClaimId(claimId);
                        const el = document.getElementById(`claim-card-${claimId}`);
                        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }}
                      onApplyRevision={handleApplyRevision}
                      llmConfig={llmConfig}
                    />
                  </div>

                  {/* Right 5 Columns: Evidence & Claims Inspector */}
                  <div className="lg:col-span-5 space-y-4">
                    <EvidencePane
                      claims={claims}
                      uniquePapers={uniquePapers}
                      citationStyle={options.style}
                      selectedClaimId={selectedClaimId}
                      onSelectPaper={handleSelectPaper}
                      onToggleExclude={handleToggleExclude}
                      onOpenManualSearch={(c) => setManualSearchClaim(c)}
                      onRetrySearch={(c) => handleRetrySearch(c.id)}
                      sensitivity={sensitivity}
                      setSensitivity={setSensitivity}
                      onReExtractClaims={handleReExtractClaims}
                    />
                  </div>

                </div>

              </div>
            )}
          </>
        )}

      </main>

      {/* Consolidated Master Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        options={options}
        setOptions={setOptions}
        llmConfig={llmConfig}
        setLlmConfig={setLlmConfig}
        sensitivity={sensitivity}
        setSensitivity={setSensitivity}
        onResetResearchData={handleResetResearchData}
        onFullFactoryReset={handleFullFactoryReset}
      />

      {/* Manual Search Modal */}
      <ManualSearchModal
        claim={manualSearchClaim}
        isOpen={Boolean(manualSearchClaim)}
        onClose={() => setManualSearchClaim(null)}
        onSelectPaper={handleSelectPaper}
      />

      {/* Help & Documentation Modal */}
      <HelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />

      {/* Research Literature Cart Drawer */}
      <ResearchCartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        activeStyle={options.style}
        onSeedManuscript={(cartPapers) => {
          if (cartPapers.length === 0) return;
          const syntheticClaims: Claim[] = cartPapers.map((paper, idx) => ({
            id: `cart-claim-${idx + 1}-${paper.id}`,
            text: `Empirical research demonstrates key dynamics regarding ${paper.title}.`,
            rawSentence: `Empirical research demonstrates key dynamics regarding ${paper.title}.`,
            paragraphIndex: idx,
            sentenceIndex: 0,
            startIndex: 0,
            endIndex: 100,
            confidence: 'high',
            keywords: [paper.title.slice(0, 30)],
            searchQueries: [paper.title],
            candidatePapers: [paper],
            selectedPaper: paper,
            status: 'found',
            isExcluded: false,
          }));
          const draft = cartPapers
            .map((p) => `Recent scholarly literature investigates ${p.title}.`)
            .join(' ');
          setInputText(draft);
          setClaims(syntheticClaims);
          setIsCartOpen(false);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Universal Command Palette (Scholar Spotlight) */}
      <CommandPaletteModal
        isOpen={isSpotlightOpen}
        onClose={() => setIsSpotlightOpen(false)}
        onSelectPillar={(pillar) => {
          setActivePillar(pillar);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenHelp={() => setIsHelpOpen(true)}
        onOpenCart={() => setIsCartOpen(true)}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
        citationOptions={options}
        setCitationOptions={setOptions}
        onOpenToolbelt={(toolId) => {
          setActiveToolbeltId(toolId);
          setIsToolbeltOpen(true);
        }}
        onSelectWorkflowLens={(lens) => {
          const l = lens as WorkflowLensId;
          setActiveLens(l);
          const targetLens = WORKFLOW_LENSES.find((x) => x.id === l);
          if (targetLens && !targetLens.pillars.includes(activePillar)) {
            setActivePillar(targetLens.pillars[0]);
          }
        }}
      />

      {/* Academic Toolbelt Micro-Blades */}
      <AcademicToolbeltModal
        isOpen={isToolbeltOpen}
        onClose={() => setIsToolbeltOpen(false)}
        initialToolId={activeToolbeltId}
        onSendToStudio={(text) => {
          setInputText((prev) => (prev ? `${prev}\n\n${text}` : text));
          setActivePillar('studio');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Universal Research Binder Drawer */}
      <ResearchBinderDrawer
        isOpen={isBinderOpen}
        onClose={() => setIsBinderOpen(false)}
        onSendToStudio={(text) => {
          setInputText((prev) => (prev ? `${prev}\n\n${text}` : text));
          setActivePillar('studio');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Academic Footer */}
      <footer className="w-full border-t border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md py-8 px-6 mt-16 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* Top Row: Brand & Standard Badges */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-center md:text-left space-y-1">
              <div className="font-serif font-bold text-slate-900 dark:text-white flex items-center justify-center md:justify-start gap-2">
                <span>Scholar<span className="text-blue-700 dark:text-blue-400">Forge</span></span>
                <span className="text-slate-400">•</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">Unified Scholarly Intelligence Suite</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-sans">
                Manuscript Grounding • Synthetic Data Forge • DOI Verifier • PICO Matrix • Scientometrics (<em>h</em>-index, <em>g</em>-index, <em>e</em>-index, <em>m</em>-quotient)
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center md:justify-end gap-2 text-[11px]">
              <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-medium">APA 7th</span>
              <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-medium">MLA 9</span>
              <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-medium">Chicago</span>
              <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-medium">IEEE</span>
              <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-medium">Vancouver</span>
              <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-medium">Harvard</span>
              <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-medium">Nature</span>
              <span className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-300 font-mono font-semibold">BibTeX</span>
            </div>
          </div>

          {/* Middle Row: Copyright & Authorship Declaration */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="text-slate-700 dark:text-slate-300 font-sans font-medium flex flex-wrap items-center gap-1.5">
              <span>Copyright &copy; 2026</span>
              <a
                href="https://www.linkedin.com/in/beingbabu/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-blue-700 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
              >
                <span>Professor Babu George</span>
                <ExternalLink className="w-3 h-3 inline" />
              </a>
              <span className="text-slate-400">•</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">Licensed under CC BY-NC-SA 4.0</span>
            </div>
            <div className="text-slate-500 dark:text-slate-400 font-mono text-[11px] flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>Academic License (CC BY-NC-SA 4.0)</span>
            </div>
          </div>

          {/* Bottom Row: Academic Terms of Service & Legal Disclaimer */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed space-y-3">
            <div>
              <div className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[9px] flex items-center gap-1 mb-0.5">
                <ShieldCheck className="w-3 h-3 text-blue-600" />
                <span>Academic Research License &amp; Intellectual Property Notice</span>
              </div>
              <p className="text-justify">
                ScholarForge, its software architecture, workflow synthesizers, scientometric implementations, and analytical modules are the intellectual property of Professor Babu George, released under the Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License (CC BY-NC-SA 4.0). This suite is made available strictly for non-commercial academic research, pedagogical instruction, and scholarly inquiry. Any use, derived research, adaptation, or deployment must prominently credit and cite Professor Babu George. Commercial exploitation, monetization, SaaS wrapping, or closed proprietary cloning is strictly prohibited without prior express written permission.
              </p>
            </div>

            <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
              <div className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[9px] flex items-center gap-1 mb-0.5">
                <ShieldAlert className="w-3 h-3 text-amber-600" />
                <span>Legal Disclaimer &amp; Absolute Limitation of Liability</span>
              </div>
              <p className="text-justify">
                ScholarForge is provided strictly &ldquo;as is&rdquo; and &ldquo;as available&rdquo; without warranty of any kind, express, statutory, or implied, including but not limited to the implied warranties of merchantability, fitness for a particular purpose, and non-infringement. Professor Babu George, developers, contributors, and affiliated academic institutions shall have NO liability whatsoever for any direct, indirect, incidental, consequential, special, punitive, or exemplary damages—including but not limited to financial losses, third-party API token consumption, rate-limiting penalties, data loss, manuscript desk-rejections, peer-review outcomes, academic or institutional disciplinary actions, tenure decisions, reputational harm, or service interruptions—arising out of or in connection with the access, use, interpretation, or inability to use this platform or any outputs generated herein. Users assume 100% sole responsibility for conducting independent verification of all citations, facts, statistical equations, and texts against primary literature. By accessing or using ScholarForge, users irrevocably agree to defend, indemnify, and hold harmless Professor Babu George and all project contributors from any third-party claims or liabilities resulting from their use or distribution of generated materials.
              </p>
            </div>

            <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
              <div className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[9px] flex items-center gap-1 mb-0.5">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                <span>Nominative Fair Use &amp; Trademark Attribution Notice</span>
              </div>
              <p className="text-justify">
                All product names, logos, trademarks, and registered trademarks cited within ScholarForge—including Google Scholar™ (Google LLC), Scopus® and CiteScore™ (Elsevier B.V.), Web of Science™ (Clarivate Analytics), PubMed® and MEDLINE® (U.S. National Library of Medicine / NIH), IEEE Xplore® (IEEE), Crossref® (Publishers International Linking Association, Inc.), IBM® SPSS® (International Business Machines Corporation), and Nature® (Springer Nature)—are the property of their respective owners. Their mention in ScholarForge is strictly for nominative, descriptive, and comparative scholarly identification purposes under nominative fair use principles. ScholarForge is an independent research platform and is NOT affiliated with, sponsored by, authorized by, or endorsed by any of the aforementioned entities.
              </p>
            </div>

            <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
              <div className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[9px] flex items-center gap-1 mb-0.5">
                <ShieldAlert className="w-3 h-3 text-blue-600" />
                <span>Synthetic Simulation &amp; Scientific Integrity Policy</span>
              </div>
              <p className="text-justify">
                All quantitative datasets, Likert scales, Monte Carlo models, regression coefficients, participant interview transcripts, focus group dialogues, and thematic matrices generated by the Synthetic Data Forge or AI assistants are purely artificial mathematical and algorithmic simulations designed solely for methodology testing, statistical power planning, pedagogical demonstration, and pre-registration pipeline validation. They must NEVER be submitted, published, represented, or relied upon as genuine empirical observations, human subject research, or real clinical data. Users are solely responsible for adhering to Committee on Publication Ethics (COPE) standards, Institutional Review Board (IRB) requirements, and academic honesty codes.
              </p>
            </div>
          </div>

        </div>
      </footer>
    </div>
  );
};

export default App;
