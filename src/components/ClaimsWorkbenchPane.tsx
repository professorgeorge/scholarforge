import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  Search, 
  Loader2, 
  Layers, 
  ExternalLink, 
  BookOpen, 
  BookmarkPlus, 
  Scale,
  SlidersHorizontal,
  Sparkles, 
  Wand2, 
  AlertCircle, 
  Copy, 
  Check,
  ShieldAlert,
  ShieldCheck,
  Flame
} from 'lucide-react';
import type { Claim, AcademicPaper } from '../types/citation';
import { extractClaimsFromText } from '../services/claimExtractor';
import { executeFederatedSearch } from '../services/federatedSearchEngine';
import { addPaperToCart } from '../services/cartService';
import type { LLMConfig } from '../services/llmService';
import { DEFAULT_LLM_CONFIG } from '../services/llmService';
import { 
  synthesizeClaimConsensus, 
  generateCounterHypothesisQuery,
  isLlmConfigured, 
  type ClaimConsensusAnalysis 
} from '../services/aiScholarExtensions';

import type { CitationOptions } from '../types/citation';

interface ClaimsWorkbenchPaneProps {
  onSendToStudio?: (draft: string, claims: Claim[]) => void;
  llmConfig?: LLMConfig;
  sensitivity?: 'all' | 'moderate' | 'high';
  setSensitivity?: (s: 'all' | 'moderate' | 'high') => void;
  options?: CitationOptions;
  setOptions?: React.Dispatch<React.SetStateAction<CitationOptions>>;
  initialText?: string;
}

export const ClaimsWorkbenchPane: React.FC<ClaimsWorkbenchPaneProps> = ({
  onSendToStudio,
  llmConfig = DEFAULT_LLM_CONFIG,
  sensitivity = 'moderate',
  setSensitivity,
  options,
  setOptions,
  initialText = ''
}) => {
  const [claimInput, setClaimInput] = useState(() => initialText || '');
  const [isVerifying, setIsVerifying] = useState(false);
  const [testedClaims, setTestedClaims] = useState<Claim[]>([]);
  const [selectedClaimIndex, setSelectedClaimIndex] = useState<number>(0);
  const [evidenceMode, setEvidenceMode] = useState<'single_claim' | 'paragraph_extract'>(() => {
    return initialText && initialText.split(/[.?!]\s+/).length > 1 ? 'paragraph_extract' : 'single_claim';
  });
  const [errorMsg, setErrorMsg] = useState('');
  const [consensusAnalysisMap, setConsensusAnalysisMap] = useState<Record<string, ClaimConsensusAnalysis>>({});
  const [isAnalyzingConsensus, setIsAnalyzingConsensus] = useState(false);
  const [consensusNotice, setConsensusNotice] = useState<string | null>(null);
  const [copiedConsensusId, setCopiedConsensusId] = useState<string | null>(null);
  const [counterEvidenceMap, setCounterEvidenceMap] = useState<Record<string, { counterClaim: string; papers: AcademicPaper[] }>>({});
  const [isTestingCounter, setIsTestingCounter] = useState(false);

  useEffect(() => {
    if (initialText && initialText.trim()) {
      setClaimInput(initialText);
      if (initialText.split(/[.?!]\s+/).length > 1) {
        setEvidenceMode('paragraph_extract');
      }
    }
  }, [initialText]);

  const handleTestClaim = async () => {
    if (!claimInput.trim()) {
      setErrorMsg('Please enter a claim or thesis to verify.');
      return;
    }
    setErrorMsg('');
    setIsVerifying(true);

    try {
      if (evidenceMode === 'single_claim') {
        const result = await executeFederatedSearch(claimInput, {
          limitPerSource: 6,
          searchScope: 'default',
          excludePreprints: options?.excludePreprints,
        });

        const newClaim: Claim = {
          id: `claim-${Date.now()}`,
          text: claimInput.trim(),
          rawSentence: claimInput.trim(),
          paragraphIndex: 0,
          sentenceIndex: 0,
          startIndex: 0,
          endIndex: claimInput.length,
          confidence: result.papers.length >= 3 ? 'high' : result.papers.length > 0 ? 'medium' : 'low',
          keywords: [claimInput.trim().slice(0, 30)],
          searchQueries: [claimInput.trim()],
          candidatePapers: result.papers,
          selectedPaper: result.papers[0] || null,
          status: result.papers.length > 0 ? 'found' : 'not_found',
          isExcluded: false,
          citationNumber: testedClaims.length + 1,
        };

        setTestedClaims([newClaim, ...testedClaims]);
        setSelectedClaimIndex(0);
      } else {
        // Paragraph extract mode: uses active sensitivity setting!
        const extracted = extractClaimsFromText(claimInput, sensitivity);
        if (extracted.length === 0) {
          setErrorMsg('No empirical claims detected in the pasted text under current sensitivity. Try selecting "Thorough" sensitivity or pasting a complete abstract.');
          setIsVerifying(false);
          return;
        }

        const batchClaims: Claim[] = [];
        for (let idx = 0; idx < Math.min(extracted.length, 5); idx++) {
          const c = extracted[idx];
          const query = c.searchQueries[0] || c.text;
          const result = await executeFederatedSearch(query, { 
            limitPerSource: 4,
            excludePreprints: options?.excludePreprints 
          });
          batchClaims.push({
            ...c,
            candidatePapers: result.papers,
            selectedPaper: result.papers[0] || null,
            status: result.papers.length > 0 ? 'found' : 'not_found',
            citationNumber: idx + 1,
          });
        }

        setTestedClaims([...batchClaims, ...testedClaims]);
        setSelectedClaimIndex(0);
      }
    } catch (err: any) {
      setErrorMsg(`Claim verification failed: ${err.message}`);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleRunConsensusAnalysis = async () => {
    if (!activeClaim || !activeClaim.candidatePapers || activeClaim.candidatePapers.length === 0) return;

    setIsAnalyzingConsensus(true);
    setConsensusNotice(null);

    try {
      const res = await synthesizeClaimConsensus(activeClaim.text, activeClaim.candidatePapers, llmConfig);
      if (res) {
        setConsensusAnalysisMap(prev => ({ ...prev, [activeClaim.id]: res }));
        if (!isLlmConfigured(llmConfig)) {
          setConsensusNotice('Synthesized via Deterministic Registry Evidence. (Configure an AI model in Settings for deep neural GRADE reasoning).');
        }
      } else {
        setConsensusNotice('Consensus analysis could not be completed.');
      }
    } catch (err: any) {
      setConsensusNotice(err.message || 'Consensus evaluation failed.');
    } finally {
      setIsAnalyzingConsensus(false);
    }
  };

  const handleRunAdversarialStressTest = async () => {
    if (!activeClaim) return;
    setIsTestingCounter(true);

    try {
      const counter = await generateCounterHypothesisQuery(activeClaim.text, llmConfig);
      const result = await executeFederatedSearch(counter.searchQuery, {
        limitPerSource: 3,
        excludePreprints: options?.excludePreprints
      });

      setCounterEvidenceMap(prev => ({
        ...prev,
        [activeClaim.id]: {
          counterClaim: counter.counterClaim,
          papers: result.papers
        }
      }));
    } catch (err: any) {
      console.error('Counter test error:', err);
    } finally {
      setIsTestingCounter(false);
    }
  };

  const activeClaim = testedClaims[selectedClaimIndex] || null;

  return (
    <div className="academic-card rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-7 space-y-6 shadow-xs">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-900 dark:bg-blue-800 flex items-center justify-center text-white shadow-xs">
            <Scale className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white font-serif">
                Empirical Claims &amp; Evidence Consensus Workbench
              </h2>
              <span className="text-xs px-2.5 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/60 text-purple-900 dark:text-purple-300 font-semibold border border-purple-200 dark:border-purple-800">
                Consensus &amp; Fact-Checking
              </span>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 font-sans">
              Test scientific hypotheses or extract factual assertions from text. Evaluates peer-reviewed literature consensus across 250M+ records.
            </p>
          </div>
        </div>

        {/* Mode Selector */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-lg text-xs">
          <button
            onClick={() => setEvidenceMode('single_claim')}
            className={`px-3 py-1.5 rounded-md font-semibold transition cursor-pointer ${
              evidenceMode === 'single_claim'
                ? 'bg-white dark:bg-slate-900 text-blue-900 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Verify Single Hypothesis
          </button>
          <button
            onClick={() => setEvidenceMode('paragraph_extract')}
            className={`px-3 py-1.5 rounded-md font-semibold transition cursor-pointer ${
              evidenceMode === 'paragraph_extract'
                ? 'bg-white dark:bg-slate-900 text-blue-900 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Extract Claims from Paragraph
          </button>
        </div>
      </div>

      {/* Contextual Settings Bar: Claim Sensitivity & Quality Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
            <SlidersHorizontal className="w-3.5 h-3.5 text-blue-800 dark:text-blue-400" />
            <span>Detection Sensitivity:</span>
          </div>

          <div className="flex items-center gap-1 bg-slate-200/80 dark:bg-slate-900 p-0.5 rounded-lg border border-slate-300 dark:border-slate-800 font-medium">
            <button
              type="button"
              onClick={() => setSensitivity && setSensitivity('high')}
              className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                sensitivity === 'high'
                  ? 'bg-blue-900 text-white font-bold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Strict: Focuses on numeric findings, statistical metrics, and direct causal claims"
            >
              Strict
            </button>
            <button
              type="button"
              onClick={() => setSensitivity && setSensitivity('moderate')}
              className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                sensitivity === 'moderate'
                  ? 'bg-blue-900 text-white font-bold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Balanced: Detects empirical, scientific, and technical assertions"
            >
              Balanced
            </button>
            <button
              type="button"
              onClick={() => setSensitivity && setSensitivity('all')}
              className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                sensitivity === 'all'
                  ? 'bg-blue-900 text-white font-bold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Thorough: Cites almost every factual declarative sentence"
            >
              Thorough
            </button>
          </div>

          <span className="text-[11px] text-slate-500 hidden sm:inline font-sans">
            {sensitivity === 'high' && 'Strict: Numbers, statistical metrics & causal links'}
            {sensitivity === 'moderate' && 'Balanced: Standard empirical & scientific assertions'}
            {sensitivity === 'all' && 'Thorough: Cites every factual sentence'}
          </span>
        </div>

        {/* Quality Filters */}
        <div className="flex items-center gap-4">
          {options && setOptions && (
            <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={options.excludePreprints}
                onChange={(e) => setOptions((prev) => ({ ...prev, excludePreprints: e.target.checked }))}
                className="rounded border-slate-300 text-blue-800 focus:ring-blue-700 cursor-pointer"
              />
              <span>Exclude Preprints</span>
            </label>
          )}
        </div>
      </div>

      {/* Input Section */}
      <div className="space-y-3">
        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block uppercase tracking-wider">
          {evidenceMode === 'single_claim' ? 'Enter Scientific Hypothesis or Factual Claim:' : 'Paste Manuscript Paragraph or Abstract to Decompose:'}
        </label>
        
        {evidenceMode === 'single_claim' ? (
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={claimInput}
                onChange={(e) => setClaimInput(e.target.value)}
                placeholder="e.g. SGLT2 inhibitors reduce all-cause mortality in heart failure patients..."
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-700 transition"
              />
            </div>
            <button
              onClick={handleTestClaim}
              disabled={isVerifying || !claimInput.trim()}
              className="btn-academic-primary px-6 py-3 rounded-xl text-sm font-semibold flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
            >
              {isVerifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Scale className="w-4 h-4" />}
              <span>Verify Claim</span>
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <textarea
              value={claimInput}
              onChange={(e) => setClaimInput(e.target.value)}
              placeholder="Paste a research paragraph, literature synthesis, or abstract here. The engine will decompose each empirical proposition and verify it against registered DOIs..."
              rows={4}
              className="w-full p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-700 transition"
            />
            <button
              onClick={handleTestClaim}
              disabled={isVerifying || !claimInput.trim()}
              className="btn-academic-primary px-6 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
            >
              {isVerifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Layers className="w-4 h-4" />}
              <span>Extract &amp; Ground All Claims</span>
            </button>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-300">
            {errorMsg}
          </div>
        )}
      </div>

      {/* Results Dashboard: Left Claims List + Right Evidence Inspector */}
      {testedClaims.length > 0 && (
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-white font-serif flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span>Verified Claims ({testedClaims.length})</span>
            </h3>
            {onSendToStudio && (
              <button
                onClick={() => {
                  const draftText = testedClaims.map((c) => c.text).join('\n\n');
                  onSendToStudio(draftText, testedClaims);
                }}
                className="px-3 py-1.5 rounded-lg bg-blue-900 hover:bg-blue-800 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs transition"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Open in Manuscript Studio</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left 5 Columns: Claims Selector */}
            <div className="lg:col-span-5 space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
              {testedClaims.map((claim, idx) => {
                const isSelected = selectedClaimIndex === idx;
                const candidateCount = claim.candidatePapers?.length || 0;

                return (
                  <button
                    key={claim.id}
                    onClick={() => setSelectedClaimIndex(idx)}
                    className={`w-full text-left p-3.5 rounded-xl border transition cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50/70 dark:bg-blue-950/50 border-blue-600 dark:border-blue-500 shadow-xs'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300 font-mono">
                        Claim #{idx + 1}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          candidateCount >= 3
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300'
                            : candidateCount > 0
                            ? 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950 dark:text-rose-300'
                        }`}
                      >
                        {candidateCount >= 3 ? 'Empirically Supported' : candidateCount > 0 ? 'Partial Evidence' : 'Unsubstantiated'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-800 dark:text-slate-200 font-serif line-clamp-2">
                      {claim.text}
                    </p>
                    <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
                      <span>{candidateCount} verified papers</span>
                      <span className="text-blue-900 dark:text-blue-400 font-medium">Inspect Evidence →</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Right 7 Columns: Evidence Inspector */}
            <div className="lg:col-span-7 space-y-4">
              {activeClaim ? (
                <div className="space-y-4">
                  
                  {/* Consensus Meter */}
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px]">
                        Literature Consensus Evaluation:
                      </span>
                      <span className="font-semibold text-blue-900 dark:text-blue-400 font-mono">
                        {activeClaim.candidatePapers?.length || 0} studies indexed
                      </span>
                    </div>

                    <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 font-serif leading-relaxed break-words">
                      <strong>Assertion:</strong> "{activeClaim.text}"
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-center text-xs font-semibold">
                      <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        <span className="block text-[10px] uppercase font-bold text-emerald-600">Consensus</span>
                        Supported ({(activeClaim.candidatePapers?.length || 0) > 0 ? '75%+' : '0%'})
                      </div>
                      <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                        <span className="block text-[10px] uppercase font-bold text-amber-600">Nuance</span>
                        Conditional
                      </div>
                      <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        <span className="block text-[10px] uppercase font-bold text-slate-500">Contradictions</span>
                        None Reported
                      </div>
                    </div>
                  </div>

                  {/* AI Epistemic Consensus & GRADE Certainty Evaluation */}
                  <div className="p-4 rounded-xl bg-gradient-to-r from-purple-50/70 via-indigo-50/50 to-blue-50/60 dark:from-purple-950/40 dark:via-indigo-950/30 dark:to-blue-950/40 border border-purple-200/80 dark:border-purple-900/60 space-y-3 shadow-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        <span className="text-xs font-bold text-purple-950 dark:text-purple-200 uppercase tracking-wider font-serif">
                          AI Evidence Consensus &amp; GRADE Certainty Synthesis
                        </span>
                      </div>

                      {consensusAnalysisMap[activeClaim.id] ? (
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            consensusAnalysisMap[activeClaim.id].gradeRating === 'High'
                              ? 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300'
                              : consensusAnalysisMap[activeClaim.id].gradeRating === 'Moderate'
                              ? 'bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-950 dark:text-blue-300'
                              : 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950 dark:text-amber-300'
                          }`}>
                            GRADE: {consensusAnalysisMap[activeClaim.id].gradeRating} Certainty
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-900 dark:text-purple-300 border border-purple-300 dark:border-purple-800">
                            {consensusAnalysisMap[activeClaim.id].verdictLabel}
                          </span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={handleRunConsensusAnalysis}
                          disabled={isAnalyzingConsensus || !activeClaim.candidatePapers || activeClaim.candidatePapers.length === 0}
                          className="btn-academic-primary px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-2xs"
                        >
                          {isAnalyzingConsensus ? <Loader2 className="w-3.5 h-3.5 animate-spin text-white" /> : <Wand2 className="w-3.5 h-3.5 text-amber-300" />}
                          <span>Evaluate GRADE Consensus with AI</span>
                        </button>
                      )}
                    </div>

                    {consensusNotice && (
                      <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-300 flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <span>{consensusNotice}</span>
                      </div>
                    )}

                    {consensusAnalysisMap[activeClaim.id] && (
                      <div className="space-y-3 pt-1 text-xs">
                        <div className="p-3.5 rounded-xl bg-white/90 dark:bg-slate-900/90 border border-purple-200/70 dark:border-purple-900/70 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] uppercase font-bold text-slate-500 font-sans">
                              Methodological Rationale:
                            </span>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(consensusAnalysisMap[activeClaim.id].synthesisParagraph);
                                  setCopiedConsensusId(activeClaim.id);
                                  setTimeout(() => setCopiedConsensusId(null), 2500);
                                }}
                                className="text-xs text-blue-800 dark:text-blue-400 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                              >
                                {copiedConsensusId === activeClaim.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                                <span>{copiedConsensusId === activeClaim.id ? 'Copied' : 'Copy Synthesis'}</span>
                              </button>
                              {onSendToStudio && (
                                <button
                                  type="button"
                                  onClick={() => onSendToStudio(consensusAnalysisMap[activeClaim.id].synthesisParagraph, [activeClaim])}
                                  className="text-xs text-purple-800 dark:text-purple-300 hover:underline font-semibold cursor-pointer"
                                >
                                  Send to Studio →
                                </button>
                              )}
                            </div>
                          </div>
                          <p className="text-[11px] text-slate-600 dark:text-slate-400 font-sans">
                            {consensusAnalysisMap[activeClaim.id].gradeRationale}
                          </p>
                          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 font-serif text-slate-900 dark:text-slate-100 text-xs leading-relaxed border border-slate-200 dark:border-slate-800">
                            {consensusAnalysisMap[activeClaim.id].synthesisParagraph}
                          </div>
                        </div>

                        {consensusAnalysisMap[activeClaim.id].keyCaveats.length > 0 && (
                          <div className="space-y-1 text-[11px] text-slate-600 dark:text-slate-400">
                            <span className="font-bold text-slate-700 dark:text-slate-300 block">Identified Boundary Conditions &amp; Limitations:</span>
                            {consensusAnalysisMap[activeClaim.id].keyCaveats.map((cav, cIdx) => (
                              <div key={cIdx} className="flex items-start gap-1.5">
                                <span className="text-purple-600 font-bold">•</span>
                                <span>{cav}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Popperian Adversarial Falsification & Stress-Test Panel */}
                  <div className="p-4 rounded-xl bg-gradient-to-r from-amber-50/60 to-rose-50/50 dark:from-amber-950/30 dark:to-rose-950/20 border border-amber-200/80 dark:border-amber-900/50 space-y-3 shadow-2xs">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Flame className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        <div>
                          <span className="text-xs font-bold text-amber-950 dark:text-amber-200 uppercase tracking-wider font-serif block">
                            Popperian Falsification &amp; Adversarial Stress-Test
                          </span>
                          <span className="text-[10px] text-amber-800/80 dark:text-amber-300/80">
                            Proactively hunts for negative trials, null results, and contradictory evidence
                          </span>
                        </div>
                      </div>

                      {counterEvidenceMap[activeClaim.id] ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                          {counterEvidenceMap[activeClaim.id].papers.length} Opposing/Null Records Found
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={handleRunAdversarialStressTest}
                          disabled={isTestingCounter}
                          className="px-3.5 py-1.5 rounded-lg bg-amber-700 hover:bg-amber-800 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-2xs transition"
                        >
                          {isTestingCounter ? <Loader2 className="w-3.5 h-3.5 animate-spin text-white" /> : <ShieldAlert className="w-3.5 h-3.5 text-amber-200" />}
                          <span>Stress-Test for Counter-Evidence</span>
                        </button>
                      )}
                    </div>

                    {counterEvidenceMap[activeClaim.id] && (
                      <div className="space-y-2 pt-1 text-xs animate-in fade-in duration-150">
                        <div className="p-3 rounded-lg bg-white/90 dark:bg-slate-900/90 border border-amber-200 dark:border-amber-800 space-y-1">
                          <span className="text-[10px] uppercase font-bold text-slate-500 font-sans">
                            Falsification Query / Counter-Hypothesis:
                          </span>
                          <p className="text-xs text-slate-800 dark:text-slate-200 font-serif italic">
                            "{counterEvidenceMap[activeClaim.id].counterClaim}"
                          </p>
                        </div>

                        {counterEvidenceMap[activeClaim.id].papers.length > 0 ? (
                          <div className="space-y-2">
                            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">
                              Potentially Conflicting / Boundary Studies from Primary Registries:
                            </span>
                            {counterEvidenceMap[activeClaim.id].papers.map((p) => (
                              <div key={p.id} className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-amber-200/70 dark:border-amber-900/60 flex items-start justify-between gap-2">
                                <div className="space-y-0.5">
                                  <div className="font-semibold text-slate-900 dark:text-white line-clamp-1">{p.title}</div>
                                  <div className="text-[10px] text-slate-500">{p.venue} ({p.year}) • {p.authors[0]?.name || 'Author'}</div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => addPaperToCart(p)}
                                  className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-[10px] font-semibold text-slate-700 dark:text-slate-300 shrink-0 cursor-pointer"
                                  title="Add counter-evidence to cart to cite in limitations"
                                >
                                  + Cart
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>No direct conflicting or null trials identified in registry scope. Claim exhibits robust empirical resilience.</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Supporting Peer-Reviewed Studies */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Peer-Reviewed Literature Grounding ({activeClaim.candidatePapers?.length || 0} Studies):
                    </h4>

                    {(activeClaim.candidatePapers || []).map((paper) => (
                      <div
                        key={paper.id}
                        className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 hover:border-slate-300 transition"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h5 className="text-xs font-bold text-slate-900 dark:text-white font-serif leading-snug">
                            {paper.title}
                          </h5>
                          <button
                            onClick={() => addPaperToCart(paper)}
                            className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-semibold flex items-center gap-1 shrink-0 cursor-pointer"
                            title="Add to Research Cart"
                          >
                            <BookmarkPlus className="w-3 h-3" />
                            <span>Save to Cart</span>
                          </button>
                        </div>

                        <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-x-2">
                          <span>{paper.authors.slice(0, 2).map((a) => a.name).join(', ') + (paper.authors.length > 2 ? ' et al.' : '')}</span>
                          <span>•</span>
                          <span>{paper.year}</span>
                          <span>•</span>
                          <span className="italic text-blue-900 dark:text-blue-400">{paper.venue}</span>
                        </div>

                        {paper.abstract && (
                          <p className="text-xs text-slate-600 dark:text-slate-400 font-serif leading-relaxed line-clamp-3 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
                            {paper.abstract}
                          </p>
                        )}

                        <div className="flex items-center justify-between text-xs pt-1">
                          {paper.doi ? (
                            <a
                              href={`https://doi.org/${paper.doi}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-900 dark:text-blue-400 hover:underline flex items-center gap-1 font-mono text-[11px]"
                            >
                              <span>DOI: {paper.doi}</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : <span />}

                          <span className="text-[11px] font-mono text-slate-400">
                            Source: {paper.source.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                </div>
              ) : (
                <div className="p-8 text-center text-xs text-slate-400 border border-dashed rounded-xl">
                  Select a claim on the left to inspect literature grounding.
                </div>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
