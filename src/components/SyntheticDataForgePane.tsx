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
  Brain,
  LineChart,
  ShieldCheck,
  Award,
  ArrowRight
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
  DISCIPLINARY_ARCHETYPES,
  type QuantitativeModelConfig,
  type QuantitativeModelType,
  type GeneratedDataset,
  type GeneratedQualitativePackage,
  type QualitativeTranscriptConfig,
  type QualitativeDataType,
  type DisciplinaryArchetype
} from '../services/syntheticDataService';
import type { LLMConfig } from '../services/llmService';
import { callRawLLM } from '../services/llmService';

interface SyntheticDataForgePaneProps {
  llmConfig: LLMConfig;
  onNavigateToStudio?: (seedText: string) => void;
}

type MainTab = 'quantitative' | 'qualitative' | 'ai_prompt';
type QuantitativeSubTab = 'data_table' | 'simple_slopes' | 'diagnostics' | 'assumptions_audit' | 'apa_results' | 'exporters';

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

  // Load Disciplinary Canonical Archetype
  const handleLoadArchetype = (arch: DisciplinaryArchetype) => {
    setModelType(arch.modelType);
    setSampleSize(arch.sampleSize);
    if (arch.config.moderationParams) {
      setModPredictor(arch.config.moderationParams.predictorName);
      setModModerator(arch.config.moderationParams.moderatorName);
      setModOutcome(arch.config.moderationParams.outcomeName);
      setModBetaX(arch.config.moderationParams.betaPredictor);
      setModBetaW(arch.config.moderationParams.betaModerator);
      setModBetaInt(arch.config.moderationParams.betaInteraction);
      setModNoiseSd(arch.config.moderationParams.noiseSd);
    }
    if (arch.config.mediationParams) {
      setMedPredictor(arch.config.mediationParams.predictorName);
      setMedMediator(arch.config.mediationParams.mediatorName);
      setMedOutcome(arch.config.mediationParams.outcomeName);
      setMedPathA(arch.config.mediationParams.pathA);
      setMedPathB(arch.config.mediationParams.pathB);
      setMedPathCDash(arch.config.mediationParams.pathCDash);
    }

    const fullConfig: QuantitativeModelConfig = {
      modelType: arch.modelType,
      sampleSize: arch.sampleSize,
      missingMechanism,
      missingRatePercent: missingRate,
      outlierContaminationPercent: outlierRate,
      meanCenterPredictors,
      ...arch.config
    } as QuantitativeModelConfig;

    const ds = generateQuantitativeDataset(fullConfig);
    setDataset(ds);
    setTablePage(1);
    if (arch.modelType === 'moderation') {
      setQuantSubTab('simple_slopes');
    } else {
      setQuantSubTab('data_table');
    }
    confetti({
      particleCount: 55,
      spread: 70,
      origin: { y: 0.8 },
      colors: ['#0284c7', '#8b5cf6', '#10b981']
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
                Synthetic Data Forge &amp; Applied Simulation
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
          
          {/* Disciplinary Canonical Archetypes Bar */}
          <div className="p-4.5 rounded-2xl bg-linear-to-r from-slate-50 via-blue-50/50 to-indigo-50/40 dark:from-slate-900/90 dark:via-blue-950/30 dark:to-indigo-950/20 border border-blue-100 dark:border-blue-900/40 shadow-xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-blue-600 text-white flex items-center justify-center text-xs font-bold shadow-xs">
                  <Award className="w-3.5 h-3.5" />
                </span>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Disciplinary Canonical Archetypes (1-Click Model Presets)
                </h4>
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Pre-calibrated empirical structures with Aiken &amp; West centering and Hayes pathways
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {DISCIPLINARY_ARCHETYPES.map((arch) => (
                <button
                  key={arch.id}
                  onClick={() => handleLoadArchetype(arch)}
                  className="p-3 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 shadow-xs hover:shadow-md transition text-left cursor-pointer group flex flex-col justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/80">
                        {arch.discipline}
                      </span>
                      <span className="text-[10px] font-mono font-semibold text-slate-400">
                        N = {arch.sampleSize}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                      {arch.title}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {arch.description}
                    </p>
                  </div>
                  <div className="pt-2 flex items-center justify-between text-[10px] text-blue-600 dark:text-blue-400 font-semibold group-hover:translate-x-0.5 transition">
                    <span>{arch.badge}</span>
                    <ArrowRight className="w-3 h-3" />
                  </div>
                </button>
              ))}
            </div>
          </div>

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
              <div className="flex flex-wrap items-center gap-1 bg-emerald-100/60 dark:bg-emerald-900/50 p-1 rounded-lg text-xs font-semibold">
                <button
                  onClick={() => setQuantSubTab('data_table')}
                  className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                    quantSubTab === 'data_table'
                      ? 'bg-white dark:bg-slate-900 text-emerald-900 dark:text-emerald-200 shadow-xs'
                      : 'text-emerald-800 dark:text-emerald-400 hover:text-emerald-950'
                  }`}
                >
                  <Table className="w-3.5 h-3.5 inline mr-1" />
                  <span>Data Table ({dataset.data.length})</span>
                </button>

                {dataset.simpleSlopes && (
                  <button
                    onClick={() => setQuantSubTab('simple_slopes')}
                    className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                      quantSubTab === 'simple_slopes'
                        ? 'bg-white dark:bg-slate-900 text-blue-900 dark:text-blue-200 shadow-xs'
                        : 'text-blue-800 dark:text-blue-400 hover:text-blue-950'
                    }`}
                  >
                    <LineChart className="w-3.5 h-3.5 inline mr-1 text-blue-600 dark:text-blue-400" />
                    <span>Simple Slopes Plot</span>
                  </button>
                )}

                <button
                  onClick={() => setQuantSubTab('diagnostics')}
                  className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                    quantSubTab === 'diagnostics'
                      ? 'bg-white dark:bg-slate-900 text-emerald-900 dark:text-emerald-200 shadow-xs'
                      : 'text-emerald-800 dark:text-emerald-400 hover:text-emerald-950'
                  }`}
                >
                  <TrendingUp className="w-3.5 h-3.5 inline mr-1" />
                  <span>Descriptives &amp; Corrs</span>
                </button>

                {dataset.assumptionAudit && (
                  <button
                    onClick={() => setQuantSubTab('assumptions_audit')}
                    className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                      quantSubTab === 'assumptions_audit'
                        ? 'bg-white dark:bg-slate-900 text-emerald-900 dark:text-emerald-200 shadow-xs'
                        : 'text-emerald-800 dark:text-emerald-400 hover:text-emerald-950'
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5 inline mr-1 text-emerald-600 dark:text-emerald-400" />
                    <span>Assumptions &amp; Power</span>
                  </button>
                )}

                {dataset.apaResultsProse && (
                  <button
                    onClick={() => setQuantSubTab('apa_results')}
                    className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                      quantSubTab === 'apa_results'
                        ? 'bg-white dark:bg-slate-900 text-indigo-900 dark:text-indigo-200 shadow-xs'
                        : 'text-indigo-800 dark:text-indigo-400 hover:text-indigo-950'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5 inline mr-1 text-indigo-600 dark:text-indigo-400" />
                    <span>APA 7th Prose</span>
                  </button>
                )}

                <button
                  onClick={() => setQuantSubTab('exporters')}
                  className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                    quantSubTab === 'exporters'
                      ? 'bg-white dark:bg-slate-900 text-emerald-900 dark:text-emerald-200 shadow-xs'
                      : 'text-emerald-800 dark:text-emerald-400 hover:text-emerald-950'
                  }`}
                >
                  <Code2 className="w-3.5 h-3.5 inline mr-1" />
                  <span>R / Python / SPSS</span>
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

          {/* Sub-Tab: Aiken & West Simple Slopes Spotlight Plot */}
          {dataset && quantSubTab === 'simple_slopes' && dataset.simpleSlopes && (
            <div className="space-y-6">
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-xs">
                        <LineChart className="w-3.5 h-3.5" />
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white font-serif">
                        Aiken &amp; West (1991) Simple Slopes Spotlight Plot
                      </h4>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Interactive visualization of the conditional regression of Criterion Outcome on Predictor across 3 Moderator levels (-1 SD, Mean, +1 SD).
                    </p>
                  </div>

                  {/* Legend */}
                  <div className="flex items-center gap-3 text-xs font-semibold">
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>
                      <span className="text-slate-700 dark:text-slate-300">Low W (-1 SD)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-blue-600 inline-block"></span>
                      <span className="text-slate-700 dark:text-slate-300">Mean W (0 SD)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-purple-600 inline-block"></span>
                      <span className="text-slate-700 dark:text-slate-300">High W (+1 SD)</span>
                    </div>
                  </div>
                </div>

                {/* Native SVG Canvas (Zero NPM Chart Bloat) */}
                {(() => {
                  const sl = dataset.simpleSlopes;
                  const pts = sl.plotPoints;
                  const allY = [...pts.lowW, ...pts.meanW, ...pts.highW];
                  const rawMinY = Math.min(...allY);
                  const rawMaxY = Math.max(...allY);
                  const yMargin = Math.max(0.4, (rawMaxY - rawMinY) * 0.15);
                  const minY = rawMinY - yMargin;
                  const maxY = rawMaxY + yMargin;
                  const minX = pts.xMin;
                  const maxX = pts.xMax;

                  const svgW = 650;
                  const svgH = 320;
                  const padL = 65;
                  const padR = 40;
                  const padT = 30;
                  const padB = 45;
                  const plotW = svgW - padL - padR;
                  const plotH = svgH - padT - padB;

                  const getX = (val: number) => padL + ((val - minX) / Math.max(0.01, maxX - minX)) * plotW;
                  const getY = (val: number) => (svgH - padB) - ((val - minY) / Math.max(0.01, maxY - minY)) * plotH;

                  const yTicks = [
                    minY,
                    minY + (maxY - minY) * 0.25,
                    minY + (maxY - minY) * 0.5,
                    minY + (maxY - minY) * 0.75,
                    maxY
                  ];

                  return (
                    <div className="w-full bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                      <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-auto select-none font-sans">
                        {/* Background Grid Lines */}
                        {yTicks.map((yVal, i) => {
                          const py = getY(yVal);
                          return (
                            <g key={i}>
                              <line x1={padL} y1={py} x2={svgW - padR} y2={py} stroke="currentColor" strokeDasharray="3 3" className="text-slate-200 dark:text-slate-800" strokeWidth="1" />
                              <text x={padL - 10} y={py + 3} textAnchor="end" className="text-[10px] fill-slate-400 font-mono">
                                {yVal.toFixed(1)}
                              </text>
                            </g>
                          );
                        })}

                        {/* X Axis Ticks */}
                        {[minX, (minX + maxX) / 2, maxX].map((xVal, i) => {
                          const px = getX(xVal);
                          return (
                            <g key={i}>
                              <line x1={px} y1={svgH - padB} x2={px} y2={padT} stroke="currentColor" strokeDasharray="3 3" className="text-slate-200 dark:text-slate-800" strokeWidth="1" />
                              <text x={px} y={svgH - padB + 16} textAnchor="middle" className="text-[10px] fill-slate-400 font-mono">
                                {xVal.toFixed(1)}
                              </text>
                            </g>
                          );
                        })}

                        {/* Axes lines */}
                        <line x1={padL} y1={svgH - padB} x2={svgW - padR} y2={svgH - padB} stroke="currentColor" className="text-slate-400 dark:text-slate-600" strokeWidth="1.5" />
                        <line x1={padL} y1={padT} x2={padL} y2={svgH - padB} stroke="currentColor" className="text-slate-400 dark:text-slate-600" strokeWidth="1.5" />

                        {/* Axis Labels */}
                        <text x={padL + plotW / 2} y={svgH - 10} textAnchor="middle" className="text-xs font-bold fill-slate-700 dark:fill-slate-300">
                          Predictor Variable (X)
                        </text>
                        <text x={18} y={padT + plotH / 2} textAnchor="middle" transform={`rotate(-90 18 ${padT + plotH / 2})`} className="text-xs font-bold fill-slate-700 dark:fill-slate-300">
                          Criterion Outcome (Y)
                        </text>

                        {/* Line 1: Low W (-1 SD) */}
                        <line
                          x1={getX(minX)}
                          y1={getY(pts.lowW[0])}
                          x2={getX(maxX)}
                          y2={getY(pts.lowW[1])}
                          stroke="#10b981"
                          strokeWidth="2.5"
                          strokeDasharray="4 2"
                        />
                        <circle cx={getX(minX)} cy={getY(pts.lowW[0])} r="4" fill="#10b981" />
                        <circle cx={getX(maxX)} cy={getY(pts.lowW[1])} r="4" fill="#10b981" />

                        {/* Line 2: Mean W (0 SD) */}
                        <line
                          x1={getX(minX)}
                          y1={getY(pts.meanW[0])}
                          x2={getX(maxX)}
                          y2={getY(pts.meanW[1])}
                          stroke="#2563eb"
                          strokeWidth="2.5"
                        />
                        <circle cx={getX(minX)} cy={getY(pts.meanW[0])} r="4" fill="#2563eb" />
                        <circle cx={getX(maxX)} cy={getY(pts.meanW[1])} r="4" fill="#2563eb" />

                        {/* Line 3: High W (+1 SD) */}
                        <line
                          x1={getX(minX)}
                          y1={getY(pts.highW[0])}
                          x2={getX(maxX)}
                          y2={getY(pts.highW[1])}
                          stroke="#8b5cf6"
                          strokeWidth="2.5"
                        />
                        <circle cx={getX(minX)} cy={getY(pts.highW[0])} r="4" fill="#8b5cf6" />
                        <circle cx={getX(maxX)} cy={getY(pts.highW[1])} r="4" fill="#8b5cf6" />
                      </svg>
                    </div>
                  );
                })()}

                {/* Slope Decomposition Table */}
                <div className="space-y-2 pt-2">
                  <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                    Conditional Simple Slopes at Specific Moderator Levels
                  </h5>
                  <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        <tr>
                          <th className="px-3 py-2">Moderator Level</th>
                          <th className="px-3 py-2 text-right">Value (W)</th>
                          <th className="px-3 py-2 text-right">Simple Slope (b)</th>
                          <th className="px-3 py-2 text-right">Std. Error (SE)</th>
                          <th className="px-3 py-2 text-right">t-statistic</th>
                          <th className="px-3 py-2 text-right">p-value</th>
                          <th className="px-3 py-2 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {dataset.simpleSlopes.slopes.map((s, idx) => {
                          const color = idx === 0 ? 'text-emerald-600 dark:text-emerald-400' : idx === 1 ? 'text-blue-600 dark:text-blue-400' : 'text-purple-600 dark:text-purple-400';
                          return (
                            <tr key={s.condition} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                              <td className={`px-3 py-2 font-bold ${color}`}>{s.condition}</td>
                              <td className="px-3 py-2 text-right">{s.moderatorValue.toFixed(2)}</td>
                              <td className="px-3 py-2 text-right font-bold">{s.slope.toFixed(3)}</td>
                              <td className="px-3 py-2 text-right">{s.se.toFixed(3)}</td>
                              <td className="px-3 py-2 text-right">{s.tValue.toFixed(2)}</td>
                              <td className="px-3 py-2 text-right font-bold">
                                {s.pValue <= 0.001 ? '< .001' : s.pValue.toFixed(3)}
                              </td>
                              <td className="px-3 py-2 text-center">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                  s.pValue < 0.05
                                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                }`}>
                                  {s.pValue < 0.05 ? 'Significant' : 'Non-Sig'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
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

          {/* Sub-Tab: Methodological Assumptions Integrity Auditor & Power Simulator */}
          {dataset && quantSubTab === 'assumptions_audit' && dataset.assumptionAudit && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. Multicollinearity & VIF */}
                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold text-xs">
                        VIF
                      </span>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                        Multicollinearity &amp; Tolerances
                      </h4>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      dataset.assumptionAudit.multicollinearity.status === 'pass'
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                        : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                    }`}>
                      {dataset.assumptionAudit.multicollinearity.status.toUpperCase()} (Max VIF: {dataset.assumptionAudit.multicollinearity.maxVif})
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {dataset.assumptionAudit.multicollinearity.explanation}
                  </p>
                  <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        <tr>
                          <th className="px-3 py-1.5">Predictor Column</th>
                          <th className="px-3 py-1.5 text-right">VIF Value</th>
                          <th className="px-3 py-1.5 text-right">Tolerance (1 - R²)</th>
                          <th className="px-3 py-1.5 text-center">Diagnostic</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {Object.entries(dataset.assumptionAudit.multicollinearity.vifValues).map(([pName, vif]) => {
                          const tol = dataset.assumptionAudit?.multicollinearity.tolerances[pName] ?? 1.0;
                          return (
                            <tr key={pName} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                              <td className="px-3 py-1.5 font-bold text-slate-800 dark:text-slate-200">{pName}</td>
                              <td className={`px-3 py-1.5 text-right font-bold ${vif > 5 ? 'text-red-600' : vif > 2.5 ? 'text-amber-600' : 'text-emerald-600'}`}>
                                {vif}
                              </td>
                              <td className="px-3 py-1.5 text-right">{tol}</td>
                              <td className="px-3 py-1.5 text-center">
                                <span className="text-[10px] text-slate-500">
                                  {vif < 2.5 ? '✓ Low inflation' : vif < 5.0 ? '⚠ Moderate' : '✕ High Collinearity'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 2. Residual Gaussian Normality */}
                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-xs">
                        N(0,σ)
                      </span>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                        Residual Gaussian Normality
                      </h4>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                      {dataset.assumptionAudit.residualNormality.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {dataset.assumptionAudit.residualNormality.explanation}
                  </p>
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-center">
                      <div className="text-[11px] text-slate-500">Residual Skewness</div>
                      <div className="text-lg font-mono font-bold text-slate-900 dark:text-white">
                        {dataset.assumptionAudit.residualNormality.residualSkewness}
                      </div>
                      <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">Target: |skew| &lt; 1.0</div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-center">
                      <div className="text-[11px] text-slate-500">Residual Kurtosis</div>
                      <div className="text-lg font-mono font-bold text-slate-900 dark:text-white">
                        {dataset.assumptionAudit.residualNormality.residualKurtosis}
                      </div>
                      <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">Target: |kurt| &lt; 2.0</div>
                    </div>
                  </div>
                </div>

                {/* 3. Homoscedasticity & Equal Error Variance */}
                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold text-xs">
                        σ²
                      </span>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                        Homoscedasticity &amp; Equal Variance
                      </h4>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                      {dataset.assumptionAudit.homoscedasticity.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {dataset.assumptionAudit.homoscedasticity.explanation}
                  </p>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="text-[11px] text-slate-500">Variance Ratio (Upper Half / Lower Half)</div>
                      <div className="text-xs text-slate-600 dark:text-slate-400">Tested across ascending fitted criterion values</div>
                    </div>
                    <div className="text-lg font-mono font-bold text-purple-600 dark:text-purple-400">
                      {dataset.assumptionAudit.homoscedasticity.varianceRatio}
                    </div>
                  </div>
                </div>

                {/* 4. Power & Sample Size Recommender */}
                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 flex items-center justify-center font-bold text-xs">
                        1-β
                      </span>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                        Monte Carlo Power Simulator (1 - β)
                      </h4>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300">
                      Power: {(dataset.assumptionAudit.statisticalPower.currentPower * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 pt-1">
                    <span>Rec. N (80% power): <strong className="font-mono text-emerald-600">{dataset.assumptionAudit.statisticalPower.recommendedN80}</strong></span>
                    <span>Rec. N (90% power): <strong className="font-mono text-blue-600">{dataset.assumptionAudit.statisticalPower.recommendedN90}</strong></span>
                  </div>
                  <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        <tr>
                          <th className="px-2.5 py-1">Sample Size (N)</th>
                          {dataset.assumptionAudit.statisticalPower.powerCurve.map((pt) => (
                            <th key={pt.n} className="px-2.5 py-1 text-center">N={pt.n}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="px-2.5 py-1 font-bold text-slate-700 dark:text-slate-300">Power (1 - β)</td>
                          {dataset.assumptionAudit.statisticalPower.powerCurve.map((pt) => (
                            <td key={pt.n} className="px-2.5 py-1 text-center font-bold text-blue-600 dark:text-blue-400">
                              {(pt.power * 100).toFixed(0)}%
                            </td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Sub-Tab: Publication-Ready APA 7th Results Section Prose */}
          {dataset && quantSubTab === 'apa_results' && dataset.apaResultsProse && (
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold text-xs">
                    <FileText className="w-3.5 h-3.5" />
                  </span>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white font-serif">
                    APA 7th Edition Results Section Prose
                  </h4>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopy(dataset.apaResultsProse || '', 'apa_prose')}
                    className="px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-xs font-semibold cursor-pointer flex items-center gap-1.5 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 transition"
                  >
                    {copiedKey === 'apa_prose' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'apa_prose' ? 'Copied' : 'Copy APA Prose'}</span>
                  </button>
                  {onNavigateToStudio && (
                    <button
                      onClick={() => onNavigateToStudio(`Results Section Draft:\n\n${dataset.apaResultsProse}`)}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold cursor-pointer flex items-center gap-1.5 shadow-xs transition"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Insert into Manuscript Studio &rarr;</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="p-6 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                <div className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-2">Manuscript Results Section (Verbatim Draft)</div>
                <p className="text-sm font-serif leading-loose text-slate-800 dark:text-slate-200 indent-8 selection:bg-indigo-100 selection:text-indigo-900">
                  {dataset.apaResultsProse}
                </p>
              </div>
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
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>Participants Count (N = {participantCount})</span>
                  <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold font-mono">Max 30 Personas</span>
                </label>
                <div className="space-y-1.5">
                  <select
                    value={participantCount}
                    onChange={(e) => setParticipantCount(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-medium"
                  >
                    <option value={3}>3 In-Depth Informants (Micro-Cohort)</option>
                    <option value={4}>4 Purposive Informants (Pilot Study)</option>
                    <option value={6}>6 Multi-Site Informants (Regional Sample)</option>
                    <option value={8}>8 Stratified Informants (Comparative Quotas)</option>
                    <option value={10}>10 Longitudinal Informants (Extended Panel)</option>
                    <option value={12}>12 Cross-Functional Informants (Institutional)</option>
                    <option value={15}>15 Diverse Stakeholders (High-Variability)</option>
                    <option value={20}>20 Thematic Saturation Cohort (Benchmark)</option>
                    <option value={25}>25 Multi-Tier Institutional Informants</option>
                    <option value={30}>30 Maximum Corpus (Complete 30-Persona Pool)</option>
                  </select>
                  <div className="flex items-center gap-2 pt-0.5">
                    <input
                      type="range"
                      min={3}
                      max={30}
                      value={participantCount}
                      onChange={(e) => setParticipantCount(parseInt(e.target.value, 10))}
                      className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                    <input
                      type="number"
                      min={3}
                      max={30}
                      value={participantCount}
                      onChange={(e) => setParticipantCount(Math.min(30, Math.max(3, parseInt(e.target.value, 10) || 3)))}
                      className="w-14 px-2 py-0.5 rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs text-center font-mono font-bold text-indigo-600 dark:text-indigo-400"
                    />
                  </div>
                </div>
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto pr-1">
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
