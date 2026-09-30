import React, { useState, useMemo } from 'react';
import {
  Database,
  Sliders,
  FileSpreadsheet,
  Download,
  Copy,
  Check,
  Sparkles,
  RefreshCw,
  Code2,
  Table,
  BarChart2,
  Users,
  MessageSquare,
  FileText,
  TrendingUp,
  Brain
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  generateQuantitativeDataset,
  generateQualitativeTranscripts,
  exportDatasetToCsv,
  generateExecutableRScript,
  generateExecutablePythonScript,
  generateSpssSyntax,
  generateCodebookMarkdown,
  type QuantitativeModelConfig,
  type QuantitativeModelType,
  type GeneratedDataset,
  type GeneratedQualitativePackage,
  type QualitativeTranscriptConfig,
  type QualitativeDataType
} from '../services/syntheticDataService';
import type { LLMConfig } from '../services/llmService';
import { callRawLLM } from '../services/llmService';

interface SyntheticDataForgePaneProps {
  llmConfig: LLMConfig;
  onNavigateToStudio?: (seedText: string) => void;
}

type MainTab = 'quantitative' | 'qualitative' | 'ai_prompt';
type QuantitativeSubTab = 'data_table' | 'diagnostics' | 'exporters';

export const SyntheticDataForgePane: React.FC<SyntheticDataForgePaneProps> = ({
  llmConfig,
  onNavigateToStudio
}) => {
  const [mainTab, setMainTab] = useState<MainTab>('quantitative');
  const [quantSubTab, setQuantSubTab] = useState<QuantitativeSubTab>('data_table');

  // Quantitative Generator State
  const [modelType, setModelType] = useState<QuantitativeModelType>('moderation');
  const [sampleSize, setSampleSize] = useState<number>(1000);
  const [missingMechanism, setMissingMechanism] = useState<'none' | 'mcar' | 'mar'>('none');
  const [missingRate, setMissingRate] = useState<number>(3);
  const [outlierRate, setOutlierRate] = useState<number>(0);
  const [meanCenterPredictors, setMeanCenterPredictors] = useState<boolean>(true);

  // Moderation Config
  const [modPredictor, setModPredictor] = useState('Job_Autonomy');
  const [modModerator, setModModerator] = useState('Psychological_Safety');
  const [modOutcome, setModOutcome] = useState('Work_Performance');
  const [modBetaX, setModBetaX] = useState<number>(0.32);
  const [modBetaW, setModBetaW] = useState<number>(0.26);
  const [modBetaInt, setModBetaInt] = useState<number>(0.24);
  const [modNoiseSd, setModNoiseSd] = useState<number>(0.85);

  // Mediation Config
  const [medPredictor, setMedPredictor] = useState('Transformational_Leadership');
  const [medMediator, setMedMediator] = useState('Work_Engagement');
  const [medOutcome, setMedOutcome] = useState('Innovative_Work_Behavior');
  const [medPathA, setMedPathA] = useState<number>(0.45);
  const [medPathB, setMedPathB] = useState<number>(0.42);
  const [medPathCDash, setMedPathCDash] = useState<number>(0.14);

  // Qualitative Generator State
  const [qualType, setQualType] = useState<QualitativeDataType>('semi_structured_interviews');
  const [qualDomain, setQualDomain] = useState<string>('Healthcare Worker Resilience & Moral Distress in Emergency Care');
  const [participantCount, setParticipantCount] = useState<number>(4);
  const [isGeneratingQual, setIsGeneratingQual] = useState<boolean>(false);

  // AI Prompt Synthesizer State
  const [aiPrompt, setAiPrompt] = useState<string>(
    'Create a quantitative dataset of 1000 records in which remote work autonomy predicts organizational commitment, significantly moderated by psychological safety, controlling for employee tenure and company size.'
  );
  const [isAiProcessing, setIsAiProcessing] = useState<boolean>(false);
  const [aiStatusMsg, setAiStatusMsg] = useState<string>('');

  // Generated Artifacts
  const [dataset, setDataset] = useState<GeneratedDataset | null>(() => {
    return generateQuantitativeDataset({
      modelType: 'moderation',
      sampleSize: 1000,
      missingMechanism: 'none',
      missingRatePercent: 0,
      outlierContaminationPercent: 0,
      meanCenterPredictors: true,
      moderationParams: {
        predictorName: 'Job_Autonomy',
        moderatorName: 'Psychological_Safety',
        outcomeName: 'Work_Performance',
        betaPredictor: 0.32,
        betaModerator: 0.26,
        betaInteraction: 0.24,
        noiseSd: 0.85,
        covariates: [
          { name: 'Tenure_Years', beta: 0.12 },
          { name: 'Job_Level', beta: 0.15 }
        ]
      }
    });
  });

  const [qualitativePackage, setQualitativePackage] = useState<GeneratedQualitativePackage | null>(null);

  // Table pagination state
  const [tablePage, setTablePage] = useState<number>(1);
  const pageSize = 15;
  const [tableSearch, setTableSearch] = useState<string>('');

  // Copy state
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleDownload = (content: string, filename: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Generate Quantitative Dataset Handler
  const handleGenerateQuantitative = () => {
    const config: QuantitativeModelConfig = {
      modelType,
      sampleSize,
      missingMechanism,
      missingRatePercent: missingRate,
      outlierContaminationPercent: outlierRate,
      meanCenterPredictors,
      moderationParams: {
        predictorName: modPredictor || 'X',
        moderatorName: modModerator || 'W',
        outcomeName: modOutcome || 'Y',
        betaPredictor: modBetaX,
        betaModerator: modBetaW,
        betaInteraction: modBetaInt,
        noiseSd: modNoiseSd,
        covariates: [
          { name: 'Tenure_Years', beta: 0.12 },
          { name: 'Prior_Experience', beta: 0.08 }
        ]
      },
      mediationParams: {
        predictorName: medPredictor || 'X',
        mediatorName: medMediator || 'M',
        outcomeName: medOutcome || 'Y',
        pathA: medPathA,
        pathB: medPathB,
        pathCDash: medPathCDash,
        noiseSdM: 0.70,
        noiseSdY: 0.75
      }
    };

    const ds = generateQuantitativeDataset(config);
    setDataset(ds);
    setTablePage(1);
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#0284c7', '#38bdf8', '#10b981']
    });
  };

  // Generate Qualitative Dataset Handler
  const handleGenerateQualitative = async () => {
    setIsGeneratingQual(true);
    try {
      const config: QualitativeTranscriptConfig = {
        type: qualType,
        domain: qualDomain,
        participantCount,
        themes: [],
        conversationDepth: 'in_depth'
      };

      const result = await generateQualitativeTranscripts(config, llmConfig);
      setQualitativePackage(result);
      confetti({
        particleCount: 55,
        spread: 70,
        origin: { y: 0.8 },
        colors: ['#8b5cf6', '#a855f7', '#3b82f6']
      });
    } catch (err) {
      console.error('Failed to generate qualitative package:', err);
    } finally {
      setIsGeneratingQual(false);
    }
  };

  // AI Prompt Synthesizer Handler
  const handleSynthesizeWithAi = async () => {
    if (!aiPrompt.trim()) return;
    setIsAiProcessing(true);
    setAiStatusMsg('Deconstructing prompt through applied statistician heuristics...');

    try {
      if (llmConfig.provider !== 'builtin') {
        const sysPrompt = `You are a Principal Biostatistician and Quantitative Methodologist.
Analyze the user's research request. Determine if it is QUANTITATIVE or QUALITATIVE.
If QUANTITATIVE:
Return a valid JSON object matching this schema:
{
  "category": "quantitative",
  "modelType": "moderation" | "mediation" | "sem_cfa" | "anova_factorial" | "logistic_regression" | "longitudinal",
  "sampleSize": number,
  "predictorName": string,
  "moderatorName": string,
  "mediatorName": string,
  "outcomeName": string,
  "betaInteraction": number,
  "rationale": string
}
If QUALITATIVE:
Return:
{
  "category": "qualitative",
  "domain": string,
  "themes": string[],
  "rationale": string
}
Do NOT include markdown backticks around the json. Output raw JSON only.`;

        const resp = await callRawLLM(sysPrompt, aiPrompt, llmConfig);
        try {
          const cleanJson = resp.replace(/```json/g, '').replace(/```/g, '').trim();
          const parsed = JSON.parse(cleanJson);

          if (parsed.category === 'quantitative') {
            if (parsed.predictorName) setModPredictor(parsed.predictorName);
            if (parsed.moderatorName) setModModerator(parsed.moderatorName);
            if (parsed.outcomeName) setModOutcome(parsed.outcomeName);
            if (parsed.sampleSize) setSampleSize(parsed.sampleSize);
            if (parsed.modelType) setModelType(parsed.modelType);

            const ds = generateQuantitativeDataset({
              modelType: parsed.modelType || 'moderation',
              sampleSize: parsed.sampleSize || 1000,
              missingMechanism: 'none',
              missingRatePercent: 0,
              outlierContaminationPercent: 0,
              meanCenterPredictors: true,
              moderationParams: {
                predictorName: parsed.predictorName || 'X',
                moderatorName: parsed.moderatorName || 'W',
                outcomeName: parsed.outcomeName || 'Y',
                betaPredictor: 0.35,
                betaModerator: 0.28,
                betaInteraction: parsed.betaInteraction || 0.25,
                noiseSd: 0.85
              }
            });
            setDataset(ds);
            setMainTab('quantitative');
          } else {
            setQualDomain(parsed.domain || aiPrompt);
            const qualResult = await generateQualitativeTranscripts({
              type: 'semi_structured_interviews',
              domain: parsed.domain || aiPrompt,
              participantCount: 4,
              themes: (parsed.themes || []).map((t: string, idx: number) => ({
                id: `th_${idx}`,
                title: t,
                description: `Qualitative dimension regarding ${t}`,
                anchorKeywords: [t],
                subThemes: ['Manifest experiences', 'Contextual barriers']
              })),
              conversationDepth: 'in_depth'
            }, llmConfig);
            setQualitativePackage(qualResult);
            setMainTab('qualitative');
          }
        } catch {
          // If JSON parse failed, run default moderation matching prompt keywords
          handleGenerateQuantitative();
          setMainTab('quantitative');
        }
      } else {
        // Builtin algorithmic parser
        handleGenerateQuantitative();
        setMainTab('quantitative');
      }

      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#0284c7', '#38bdf8', '#10b981']
      });
    } catch (err: any) {
      console.error(err);
      alert(`Synthesis error: ${err.message}`);
    } finally {
      setIsAiProcessing(false);
      setAiStatusMsg('');
    }
  };

  // Filtered dataset records for Table view
  const filteredRecords = useMemo(() => {
    if (!dataset) return [];
    if (!tableSearch.trim()) return dataset.data;
    const term = tableSearch.toLowerCase();
    return dataset.data.filter((row) =>
      Object.values(row).some((val) => String(val).toLowerCase().includes(term))
    );
  }, [dataset, tableSearch]);

  const paginatedRecords = useMemo(() => {
    const start = (tablePage - 1) * pageSize;
    return filteredRecords.slice(start, start + pageSize);
  }, [filteredRecords, tablePage]);

  const totalPages = Math.ceil(filteredRecords.length / pageSize) || 1;

  return (
    <div className="space-y-6">
      
      {/* Pillar Header & Academic Manifesto */}
      <div className="rounded-2xl p-6 bg-linear-to-r from-blue-900 via-indigo-900 to-slate-900 text-white shadow-md relative overflow-hidden border border-blue-800/50">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-lg bg-blue-700/60 border border-blue-400/30 flex items-center justify-center text-white">
                <Database className="w-4 h-4 text-blue-300" />
              </span>
              <h2 className="text-xl font-bold font-serif tracking-tight">
                Pillar 8: Synthetic Data Forge &amp; Applied Simulation
              </h2>
              <span className="text-[11px] font-semibold uppercase px-2 py-0.5 rounded bg-blue-500/20 text-blue-200 border border-blue-400/30">
                Monte Carlo &amp; Discourse Engine
              </span>
            </div>
            <p className="text-xs text-blue-100/80 max-w-3xl leading-relaxed">
              Generate publication-grade empirical datasets with specified structural pathways, verified interaction/moderation effects, latent factor models, or in-depth qualitative interview transcripts with natural thematic discourse.
            </p>
          </div>

          {/* Quick Mode Switcher */}
          <div className="flex items-center gap-1.5 bg-slate-950/60 p-1.5 rounded-xl border border-slate-700/60 shrink-0">
            <button
              onClick={() => setMainTab('quantitative')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                mainTab === 'quantitative'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span>Quantitative Monte Carlo</span>
            </button>
            <button
              onClick={() => setMainTab('qualitative')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                mainTab === 'qualitative'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Qualitative Discourse</span>
            </button>
            <button
              onClick={() => setMainTab('ai_prompt')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                mainTab === 'ai_prompt'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>AI Synthesizer</span>
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 1. QUANTITATIVE MONTE CARLO FORGE */}
      {/* ============================================================== */}
      {mainTab === 'quantitative' && (
        <div className="space-y-6">
          
          {/* Parameter Configuration Deck */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="space-y-0.5">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>Statistical Model Architecture</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Select your analytical methodology and configure structural path parameters.
                </p>
              </div>

              {/* Model Type Selector */}
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { id: 'moderation', label: 'Moderation / Interaction (X * W -> Y)' },
                  { id: 'mediation', label: 'Mediation (Hayes Model 4: X -> M -> Y)' },
                  { id: 'sem_cfa', label: 'Latent SEM / CFA Likert Scales' },
                  { id: 'anova_factorial', label: '2x2 Factorial ANOVA / ANCOVA' },
                  { id: 'logistic_regression', label: 'Logistic Binary Outcome (Odds Ratios)' },
                  { id: 'longitudinal', label: 'Longitudinal AR(1) Panel Waves' }
                ].map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setModelType(m.id as QuantitativeModelType)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer border ${
                      modelType === m.id
                        ? 'bg-blue-50 dark:bg-blue-950/80 border-blue-500 text-blue-900 dark:text-blue-200 font-bold'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Model Specific Parameter Controls */}
            {modelType === 'moderation' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Predictor Variable (X)
                  </label>
                  <input
                    type="text"
                    value={modPredictor}
                    onChange={(e) => setModPredictor(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-mono"
                    placeholder="e.g. Job_Autonomy"
                  />
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>Main Effect (β₁):</span>
                    <span className="font-mono font-bold text-blue-600">{modBetaX}</span>
                  </div>
                  <input
                    type="range"
                    min="0.0"
                    max="0.8"
                    step="0.02"
                    value={modBetaX}
                    onChange={(e) => setModBetaX(parseFloat(e.target.value))}
                    className="w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Moderator Variable (W)
                  </label>
                  <input
                    type="text"
                    value={modModerator}
                    onChange={(e) => setModModerator(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-mono"
                    placeholder="e.g. Psychological_Safety"
                  />
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>Moderator Main Effect (β₂):</span>
                    <span className="font-mono font-bold text-blue-600">{modBetaW}</span>
                  </div>
                  <input
                    type="range"
                    min="0.0"
                    max="0.8"
                    step="0.02"
                    value={modBetaW}
                    onChange={(e) => setModBetaW(parseFloat(e.target.value))}
                    className="w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                    <span>Criterion Outcome (Y)</span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                      Target Interaction
                    </span>
                  </label>
                  <input
                    type="text"
                    value={modOutcome}
                    onChange={(e) => setModOutcome(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-mono"
                    placeholder="e.g. Work_Performance"
                  />
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>Interaction (β₃ X*W):</span>
                    <span className="font-mono font-bold text-emerald-600">{modBetaInt}</span>
                  </div>
                  <input
                    type="range"
                    min="0.05"
                    max="0.6"
                    step="0.02"
                    value={modBetaInt}
                    onChange={(e) => setModBetaInt(parseFloat(e.target.value))}
                    className="w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                    <span>Residual Noise SD:</span>
                    <span className="font-mono font-bold text-slate-600 dark:text-slate-400">{modNoiseSd}</span>
                  </div>
                  <input
                    type="range"
                    min="0.3"
                    max="1.5"
                    step="0.05"
                    value={modNoiseSd}
                    onChange={(e) => setModNoiseSd(parseFloat(e.target.value))}
                    className="w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>
            )}

            {modelType === 'mediation' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Predictor (X)
                  </label>
                  <input
                    type="text"
                    value={medPredictor}
                    onChange={(e) => setMedPredictor(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-mono"
                  />
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>Path a (X → M):</span>
                    <span className="font-mono font-bold text-blue-600">{medPathA}</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="0.8"
                    step="0.02"
                    value={medPathA}
                    onChange={(e) => setMedPathA(parseFloat(e.target.value))}
                    className="w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Intervening Mediator (M)
                  </label>
                  <input
                    type="text"
                    value={medMediator}
                    onChange={(e) => setMedMediator(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-mono"
                  />
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>Path b (M → Y):</span>
                    <span className="font-mono font-bold text-blue-600">{medPathB}</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="0.8"
                    step="0.02"
                    value={medPathB}
                    onChange={(e) => setMedPathB(parseFloat(e.target.value))}
                    className="w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Dependent Outcome (Y)
                  </label>
                  <input
                    type="text"
                    value={medOutcome}
                    onChange={(e) => setMedOutcome(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-mono"
                  />
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>Direct Path c' (X → Y):</span>
                    <span className="font-mono font-bold text-slate-600">{medPathCDash}</span>
                  </div>
                  <input
                    type="range"
                    min="0.0"
                    max="0.5"
                    step="0.02"
                    value={medPathCDash}
                    onChange={(e) => setMedPathCDash(parseFloat(e.target.value))}
                    className="w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>
            )}

            {/* Applied Statistician Realism Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Sample Size ($N$): <span className="font-mono text-blue-600 dark:text-blue-400 font-bold">{sampleSize}</span>
                </label>
                <div className="flex items-center gap-1.5">
                  {[250, 500, 1000, 2500].map((n) => (
                    <button
                      key={n}
                      onClick={() => setSampleSize(n)}
                      className={`px-2 py-0.5 rounded text-[11px] font-mono transition cursor-pointer border ${
                        sampleSize === n
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Missing Mechanism ({missingMechanism !== 'none' ? `${missingRate}%` : '0%'})
                </label>
                <select
                  value={missingMechanism}
                  onChange={(e) => setMissingMechanism(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs"
                >
                  <option value="none">None (Complete Cases)</option>
                  <option value="mcar">MCAR (Missing Completely at Random)</option>
                  <option value="mar">MAR (Missing at Random)</option>
                </select>
                {missingMechanism !== 'none' && (
                  <input
                    type="range"
                    min="1"
                    max="15"
                    step="1"
                    value={missingRate}
                    onChange={(e) => setMissingRate(parseInt(e.target.value, 10))}
                    className="w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer mt-1"
                  />
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Contamination:
                  </label>
                  <span className="font-mono text-slate-500 font-bold">{outlierRate}% Outliers</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="5"
                  step="1"
                  value={outlierRate}
                  onChange={(e) => setOutlierRate(parseInt(e.target.value, 10))}
                  className="w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
                />
                <label className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 mt-1 cursor-pointer text-[11px]">
                  <input
                    type="checkbox"
                    checked={meanCenterPredictors}
                    onChange={(e) => setMeanCenterPredictors(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Mean-center predictors</span>
                </label>
              </div>

              <div className="flex items-end">
                <button
                  onClick={handleGenerateQuantitative}
                  className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Execute Monte Carlo ($N$={sampleSize})</span>
                </button>
              </div>
            </div>

          </div>

          {/* Dataset Status Banner & Hypothesis Verification */}
          {dataset && (
            <div className="p-4 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200 uppercase tracking-wider">
                      Hypothesis Statistically Verified
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-mono">
                      p &lt; {dataset.hypothesisVerification.pValue <= 0.001 ? '.001' : dataset.hypothesisVerification.pValue}
                    </span>
                  </div>
                  <p className="text-xs text-emerald-800 dark:text-emerald-300 mt-0.5">
                    {dataset.hypothesisVerification.summaryNotes}
                  </p>
                </div>
              </div>

              {onNavigateToStudio && (
                <button
                  onClick={() => onNavigateToStudio(`Empirical simulation of ${dataset.name}: ${dataset.hypothesisVerification.summaryNotes}`)}
                  className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                  title="Forward empirical hypothesis and findings to Manuscript Studio"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Send to Manuscript Studio &rarr;</span>
                </button>
              )}

              {/* Sub-Tabs for Results Deck */}
              <div className="flex items-center gap-1 bg-emerald-100/60 dark:bg-emerald-900/50 p-1 rounded-lg text-xs font-semibold">
                <button
                  onClick={() => setQuantSubTab('data_table')}
                  className={`px-3 py-1 rounded-md transition cursor-pointer ${
                    quantSubTab === 'data_table'
                      ? 'bg-white dark:bg-slate-900 text-emerald-900 dark:text-emerald-200 shadow-xs'
                      : 'text-emerald-800 dark:text-emerald-400 hover:text-emerald-950'
                  }`}
                >
                  <Table className="w-3.5 h-3.5 inline mr-1" />
                  <span>Data Table ({dataset.data.length})</span>
                </button>
                <button
                  onClick={() => setQuantSubTab('diagnostics')}
                  className={`px-3 py-1 rounded-md transition cursor-pointer ${
                    quantSubTab === 'diagnostics'
                      ? 'bg-white dark:bg-slate-900 text-emerald-900 dark:text-emerald-200 shadow-xs'
                      : 'text-emerald-800 dark:text-emerald-400 hover:text-emerald-950'
                  }`}
                >
                  <TrendingUp className="w-3.5 h-3.5 inline mr-1" />
                  <span>Descriptives &amp; Corrs</span>
                </button>
                <button
                  onClick={() => setQuantSubTab('exporters')}
                  className={`px-3 py-1 rounded-md transition cursor-pointer ${
                    quantSubTab === 'exporters'
                      ? 'bg-white dark:bg-slate-900 text-emerald-900 dark:text-emerald-200 shadow-xs'
                      : 'text-emerald-800 dark:text-emerald-400 hover:text-emerald-950'
                  }`}
                >
                  <Code2 className="w-3.5 h-3.5 inline mr-1" />
                  <span>R / Python / SPSS Exporters</span>
                </button>
              </div>
            </div>
          )}

          {/* Sub-Tab 1: Interactive Data Table */}
          {dataset && quantSubTab === 'data_table' && (
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={tableSearch}
                    onChange={(e) => {
                      setTableSearch(e.target.value);
                      setTablePage(1);
                    }}
                    placeholder="Search records..."
                    className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs w-64"
                  />
                  <span className="text-xs text-slate-500">
                    Showing {paginatedRecords.length} of {filteredRecords.length} rows
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDownload(exportDatasetToCsv(dataset), 'scholarforge_dataset.csv', 'text/csv')}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download CSV</span>
                  </button>
                  <button
                    onClick={() => handleDownload(JSON.stringify(dataset.data, null, 2), 'scholarforge_dataset.json', 'application/json')}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>JSON</span>
                  </button>
                </div>
              </div>

              {/* Data Table View */}
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left text-xs border-collapse font-mono">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                      {dataset.variables.map((v) => (
                        <th key={v.name} className="px-3 py-2.5 font-bold whitespace-nowrap">
                          <div>{v.name}</div>
                          <div className="text-[10px] font-normal text-slate-400 capitalize">{v.role}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {paginatedRecords.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        {dataset.variables.map((v) => {
                          const val = row[v.name];
                          return (
                            <td key={v.name} className="px-3 py-2 whitespace-nowrap text-slate-800 dark:text-slate-200">
                              {val === null || val === undefined ? (
                                <span className="text-[10px] px-1 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-sans">
                                  NA
                                </span>
                              ) : (
                                String(val)
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination controls */}
              <div className="flex items-center justify-between text-xs text-slate-500 pt-2">
                <span>
                  Page {tablePage} of {totalPages}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    disabled={tablePage === 1}
                    onClick={() => setTablePage((p) => Math.max(1, p - 1))}
                    className="px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 disabled:opacity-40 cursor-pointer"
                  >
                    Previous
                  </button>
                  <button
                    disabled={tablePage >= totalPages}
                    onClick={() => setTablePage((p) => Math.min(totalPages, p + 1))}
                    className="px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 disabled:opacity-40 cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Sub-Tab 2: Applied Statistician Diagnostics & Descriptives */}
          {dataset && quantSubTab === 'diagnostics' && (
            <div className="space-y-6">
              
              {/* Descriptives Table */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 font-serif">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                  <span>Univariate Descriptive Statistics</span>
                </h4>
                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="px-3 py-2">Variable</th>
                        <th className="px-3 py-2 text-right">Mean</th>
                        <th className="px-3 py-2 text-right">Std Dev</th>
                        <th className="px-3 py-2 text-right">Median</th>
                        <th className="px-3 py-2 text-right">Min</th>
                        <th className="px-3 py-2 text-right">Max</th>
                        <th className="px-3 py-2 text-right">Skewness</th>
                        <th className="px-3 py-2 text-right">Kurtosis</th>
                        <th className="px-3 py-2 text-right">Valid N</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {Object.entries(dataset.descriptives).map(([varName, desc]) => (
                        <tr key={varName} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="px-3 py-2 font-bold text-slate-900 dark:text-slate-100">{varName}</td>
                          <td className="px-3 py-2 text-right text-blue-600 dark:text-blue-400 font-bold">{desc.mean}</td>
                          <td className="px-3 py-2 text-right">{desc.sd}</td>
                          <td className="px-3 py-2 text-right">{desc.median}</td>
                          <td className="px-3 py-2 text-right">{desc.min}</td>
                          <td className="px-3 py-2 text-right">{desc.max}</td>
                          <td className="px-3 py-2 text-right">{desc.skewness}</td>
                          <td className="px-3 py-2 text-right">{desc.kurtosis}</td>
                          <td className="px-3 py-2 text-right">{desc.nValid}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Bivariate Pearson Correlation Matrix */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 font-serif">
                  <BarChart2 className="w-4 h-4 text-indigo-600" />
                  <span>Bivariate Pearson Correlation Matrix ($r$ and $p$-values)</span>
                </h4>
                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="px-3 py-2">Variable</th>
                        {dataset.correlationMatrix.variables.map((v, idx) => (
                          <th key={v} className="px-3 py-2 text-center">
                            ({idx + 1})
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {dataset.correlationMatrix.variables.map((vName, rIdx) => (
                        <tr key={vName} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="px-3 py-2 font-bold text-slate-900 dark:text-slate-100">
                            ({rIdx + 1}) {vName}
                          </td>
                          {dataset.correlationMatrix.matrix[rIdx].map((rVal, cIdx) => {
                            const pVal = dataset.correlationMatrix.pValues[rIdx][cIdx];
                            const isSig = pVal < 0.05 && rIdx !== cIdx;
                            return (
                              <td
                                key={cIdx}
                                className={`px-3 py-2 text-center ${
                                  rIdx === cIdx
                                    ? 'bg-slate-100 dark:bg-slate-800/60 font-bold text-slate-400'
                                    : isSig
                                    ? 'text-blue-600 dark:text-blue-400 font-bold'
                                    : 'text-slate-600 dark:text-slate-400'
                                }`}
                              >
                                {rIdx === cIdx ? '1.00' : `${rVal.toFixed(2)}${pVal < 0.001 ? '***' : pVal < 0.01 ? '**' : pVal < 0.05 ? '*' : ''}`}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-[11px] text-slate-500 font-sans italic">
                  Note: * p &lt; .05, ** p &lt; .01, *** p &lt; .001 (two-tailed).
                </p>
              </div>

              {/* Psychometrics Reliability (if SEM/CFA) */}
              {dataset.psychometrics && (
                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 font-serif">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Psychometric Scale Reliability (Cronbach's α &amp; Inter-Item Corrs)</span>
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {dataset.psychometrics.scales.map((sc) => (
                      <div key={sc.construct} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
                        <div className="text-xs font-bold text-slate-900 dark:text-white">{sc.construct}</div>
                        <div className="text-[11px] text-slate-500">Items: {sc.items.join(', ')}</div>
                        <div className="pt-2 flex items-center justify-between text-xs font-mono">
                          <span>Cronbach's α:</span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">{sc.cronbachAlpha}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span>Mean Inter-Item r:</span>
                          <span className="text-slate-600 dark:text-slate-300">{sc.meanInterItemCorr}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}

          {/* Sub-Tab 3: Applied Statistician Code Exporters */}
          {dataset && quantSubTab === 'exporters' && (
            <div className="space-y-6">
              
              {/* R Script Exporter */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-xs">
                      R
                    </span>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      Executable R Analysis Script (.R)
                    </h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopy(generateExecutableRScript(dataset), 'r_script')}
                      className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-xs font-semibold cursor-pointer flex items-center gap-1 text-slate-700 dark:text-slate-300"
                    >
                      {copiedKey === 'r_script' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>Copy</span>
                    </button>
                    <button
                      onClick={() => handleDownload(generateExecutableRScript(dataset), 'analysis_script.R', 'text/plain')}
                      className="px-2.5 py-1 rounded bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-xs font-semibold cursor-pointer flex items-center gap-1 border border-blue-200 dark:border-blue-800"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download .R</span>
                    </button>
                  </div>
                </div>
                <pre className="p-4 rounded-xl bg-slate-950 text-slate-200 text-xs font-mono overflow-x-auto max-h-64 leading-relaxed">
                  {generateExecutableRScript(dataset)}
                </pre>
              </div>

              {/* Python Script Exporter */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 flex items-center justify-center font-bold text-xs">
                      Py
                    </span>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      Python Script (statsmodels + pandas)
                    </h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopy(generateExecutablePythonScript(dataset), 'py_script')}
                      className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-xs font-semibold cursor-pointer flex items-center gap-1 text-slate-700 dark:text-slate-300"
                    >
                      {copiedKey === 'py_script' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>Copy</span>
                    </button>
                    <button
                      onClick={() => handleDownload(generateExecutablePythonScript(dataset), 'analysis_script.py', 'text/plain')}
                      className="px-2.5 py-1 rounded bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-xs font-semibold cursor-pointer flex items-center gap-1 border border-amber-200 dark:border-amber-800"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download .py</span>
                    </button>
                  </div>
                </div>
                <pre className="p-4 rounded-xl bg-slate-950 text-slate-200 text-xs font-mono overflow-x-auto max-h-64 leading-relaxed">
                  {generateExecutablePythonScript(dataset)}
                </pre>
              </div>

              {/* SPSS Syntax Exporter */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 flex items-center justify-center font-bold text-xs">
                      SPS
                    </span>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      IBM SPSS Syntax (.sps)
                    </h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopy(generateSpssSyntax(dataset), 'spss_syntax')}
                      className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-xs font-semibold cursor-pointer flex items-center gap-1 text-slate-700 dark:text-slate-300"
                    >
                      {copiedKey === 'spss_syntax' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>Copy</span>
                    </button>
                    <button
                      onClick={() => handleDownload(generateSpssSyntax(dataset), 'analysis_syntax.sps', 'text/plain')}
                      className="px-2.5 py-1 rounded bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 text-xs font-semibold cursor-pointer flex items-center gap-1 border border-red-200 dark:border-red-800"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download .sps</span>
                    </button>
                  </div>
                </div>
                <pre className="p-4 rounded-xl bg-slate-950 text-slate-200 text-xs font-mono overflow-x-auto max-h-64 leading-relaxed">
                  {generateSpssSyntax(dataset)}
                </pre>
              </div>

              {/* APA Data Codebook Markdown */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-600" />
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      APA-Style Variable Codebook &amp; Dictionary (.md)
                    </h4>
                  </div>
                  <button
                    onClick={() => handleDownload(generateCodebookMarkdown(dataset), 'dataset_codebook.md', 'text/markdown')}
                    className="px-2.5 py-1 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs font-semibold cursor-pointer flex items-center gap-1 border border-emerald-200 dark:border-emerald-800"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Codebook</span>
                  </button>
                </div>
                <pre className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-xs font-mono overflow-x-auto max-h-64 leading-relaxed border border-slate-200 dark:border-slate-800">
                  {generateCodebookMarkdown(dataset)}
                </pre>
              </div>

            </div>
          )}

        </div>
      )}

      {/* ============================================================== */}
      {/* 2. QUALITATIVE DISCOURSE STUDIO */}
      {/* ============================================================== */}
      {mainTab === 'qualitative' && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="space-y-0.5">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 font-serif">
                  <MessageSquare className="w-4 h-4 text-indigo-600" />
                  <span>Qualitative Empirical Discourse Generator</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Synthesize semi-structured interview transcripts with authentic speech dynamics, nuanced anecdotes, and thematic coding.
                </p>
              </div>

              {/* Format selection */}
              <div className="flex items-center gap-1.5">
                {[
                  { id: 'semi_structured_interviews', label: 'Semi-Structured Interviews' },
                  { id: 'focus_group', label: 'Focus Group Discussion' },
                  { id: 'open_ended_survey', label: 'Open-Ended Survey Vignettes' }
                ].map((fmt) => (
                  <button
                    key={fmt.id}
                    onClick={() => setQualType(fmt.id as QualitativeDataType)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer border ${
                      qualType === fmt.id
                        ? 'bg-indigo-50 dark:bg-indigo-950/80 border-indigo-500 text-indigo-900 dark:text-indigo-200'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                    }`}
                  >
                    {fmt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-8 space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Research Topic / Phenomenon of Inquiry
                </label>
                <input
                  type="text"
                  value={qualDomain}
                  onChange={(e) => setQualDomain(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs"
                  placeholder="e.g. Healthcare Worker Resilience & Moral Distress in Emergency Care"
                />
              </div>

              <div className="md:col-span-4 space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Participants Count
                </label>
                <select
                  value={participantCount}
                  onChange={(e) => setParticipantCount(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs"
                >
                  <option value={3}>3 In-Depth Informants</option>
                  <option value={4}>4 Purposive Informants</option>
                  <option value={6}>6 Multi-Site Informants</option>
                  <option value={8}>8 Stratified Informants</option>
                </select>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Mode: {llmConfig.provider !== 'builtin' ? `AI-Powered via ${llmConfig.provider.toUpperCase()} (${llmConfig.model})` : 'High-Fidelity Algorithmic Synthesis'}
              </span>
              <button
                disabled={isGeneratingQual}
                onClick={handleGenerateQualitative}
                className="py-2.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition cursor-pointer flex items-center gap-2 disabled:opacity-50"
              >
                {isGeneratingQual ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Synthesizing Transcripts...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Synthesize Qualitative Corpus</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Qualitative Corpus Display */}
          {qualitativePackage && (
            <div className="space-y-6">
              
              {/* Header Card with Exports */}
              <div className="p-4 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-indigo-950 dark:text-indigo-200 uppercase tracking-wider">
                    {qualitativePackage.title}
                  </h4>
                  <p className="text-xs text-indigo-800 dark:text-indigo-300">
                    Generated {qualitativePackage.participants.length} purposive informant transcripts with Braun &amp; Clarke thematic matrix.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDownload(qualitativePackage.rawMarkdownExport, 'qualitative_transcripts.md', 'text/markdown')}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Markdown</span>
                  </button>
                  <button
                    onClick={() => handleDownload(qualitativePackage.rawMarkdownExport, 'qualitative_transcripts.doc', 'application/msword')}
                    className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-indigo-300 dark:border-indigo-700 text-indigo-900 dark:text-indigo-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Word (.doc)</span>
                  </button>
                </div>
              </div>

              {/* Informant Profiles */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-600" />
                  <span>Purposive Participant Informant Roster</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {qualitativePackage.participants.map((p) => (
                    <div key={p.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">{p.pseudonym}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 font-bold">
                          {p.id}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-600 dark:text-slate-400">
                        {p.role} • {p.experienceYears} Years Experience
                      </div>
                      <div className="text-[11px] text-slate-500 italic">
                        Context: {p.context}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Thematic Codebook Matrix */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <Brain className="w-4 h-4 text-indigo-600" />
                  <span>Thematic Codebook Matrix (Themes, Sub-themes &amp; Anchor Quotes)</span>
                </h4>
                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 font-semibold">
                      <tr>
                        <th className="px-3.5 py-2.5 w-1/4">Master Theme</th>
                        <th className="px-3.5 py-2.5 w-1/4">Operational Definition</th>
                        <th className="px-3.5 py-2.5 w-1/2">Anchor Exemplar Quote</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {qualitativePackage.thematicCodebook.map((cb, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="px-3.5 py-2.5 font-bold text-slate-900 dark:text-white">
                            <div>{cb.theme}</div>
                            <div className="text-[11px] font-normal text-indigo-600 dark:text-indigo-400 mt-0.5">
                              Sub: {cb.subTheme}
                            </div>
                          </td>
                          <td className="px-3.5 py-2.5 text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                            {cb.definition}
                          </td>
                          <td className="px-3.5 py-2.5 text-slate-700 dark:text-slate-200 italic text-[11px] leading-relaxed">
                            "{cb.representativeQuotes[0]?.quote || ''}"
                            <div className="not-italic text-[10px] text-slate-400 mt-1 font-sans">
                              — {cb.representativeQuotes[0]?.participantPseudonym}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Full In-Depth Transcripts */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
                  <span>Verbatim Interview Transcripts (Excerpt)</span>
                </h4>
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                  {qualitativePackage.transcripts.map((tr) => (
                    <div key={tr.participantId} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
                      <div className="text-xs font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2 flex items-center justify-between">
                        <span>Transcript: {tr.pseudonym}</span>
                        <span className="text-[11px] font-mono text-slate-500">{tr.participantId}</span>
                      </div>
                      <div className="space-y-3 text-xs">
                        {tr.turns.map((turn, tIdx) => (
                          <div key={tIdx} className="space-y-1">
                            <span className="font-bold text-indigo-700 dark:text-indigo-400">
                              {turn.speaker}:
                            </span>
                            <p className="text-slate-800 dark:text-slate-200 leading-relaxed pl-2 border-l-2 border-slate-200 dark:border-slate-700">
                              {turn.text}
                            </p>
                            {turn.codedThemes && (
                              <div className="flex flex-wrap gap-1 mt-1 pl-2">
                                {turn.codedThemes.map((th) => (
                                  <span key={th} className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-semibold">
                                    Coded: {th}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

        </div>
      )}

      {/* ============================================================== */}
      {/* 3. AI PROMPT SYNTHESIZER */}
      {/* ============================================================== */}
      {mainTab === 'ai_prompt' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white font-serif">
                  Natural Language Empirical Data Synthesizer
                </h3>
              </div>
              <p className="text-xs text-slate-500">
                Type your research design, statistical hypotheses, or qualitative requirements in plain English. The AI interpreter will translate it into an exact mathematical specification or rich qualitative corpus.
              </p>
            </div>

            <textarea
              rows={4}
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              className="w-full p-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-sans text-slate-900 dark:text-slate-100 leading-relaxed focus:ring-2 focus:ring-amber-500"
              placeholder="e.g. Create a dataset of 1000 records where job autonomy predicts organizational commitment, significantly moderated by psychological safety, controlling for tenure and company size."
            />

            {/* Quick Exemplar Prompts */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-slate-400 font-semibold">Example Prompts:</span>
              {[
                '1000 records: Transformational leadership predicts employee turnover moderated by perceived supervisor support.',
                'Factorial trial: 500 patient records testing Drug A vs. Placebo at 2 dose levels with baseline severity covariate.',
                'Interview corpus: 5 hospital nurses discussing moral distress across 5 themes.'
              ].map((ex, idx) => (
                <button
                  key={idx}
                  onClick={() => setAiPrompt(ex)}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-[11px] cursor-pointer transition border border-slate-200 dark:border-slate-700"
                >
                  "{ex.slice(0, 40)}..."
                </button>
              ))}
            </div>

            <div className="pt-2 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Engine: <strong className="text-slate-700 dark:text-slate-300">{llmConfig.provider.toUpperCase()}</strong> ({llmConfig.model})
              </span>
              <button
                disabled={isAiProcessing || !aiPrompt.trim()}
                onClick={handleSynthesizeWithAi}
                className="py-2.5 px-6 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md transition cursor-pointer flex items-center gap-2 disabled:opacity-50"
              >
                {isAiProcessing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>{aiStatusMsg || 'Analyzing & Synthesizing...'}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Synthesize Empirical Data</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
