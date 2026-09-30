import React, { useState, useMemo } from 'react';
import {
  Compass,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Search,
  Copy,
  Download,
  BookOpen,
  Code2,
  RotateCcw,
  ChevronRight,
  ChevronLeft,
  GraduationCap,
  Sparkles,
  Sliders,
  Check,
  Database,
  Bot,
  FolderKanban,
  CheckCheck,
  Terminal,
  Loader2,
  ShieldCheck
} from 'lucide-react';
import { IrbTriagePane } from './IrbTriagePane';
import {
  ATLAS,
  QUESTIONS,
  GLOSSARY,
  EXEMPLARS,
  ELI5,
  LAYERS_ORDER,
  LAYER_LABELS,
  QUICK_ANALYSIS_GUIDES,
  computeStack,
  computeCoherence,
  generateMethodsParagraph,
  generateMarkdown,
  getAtlasEntry,
  getAlternatives,
  recommendMethodologyAI,
  type AIMethodologyRecommendation,
  type CompassStack,
  type QuickAnalysisGuide
} from '../services/methodologyCompassService';
import { addBinderItem } from '../services/binderService';
import { DEFAULT_LLM_CONFIG, type LLMConfig } from '../services/llmService';

type ActiveCompassTab = 'ai_advisor' | 'selector' | 'guided' | 'coherence' | 'compendium' | 'exemplars' | 'glossary' | 'irb_ethics';

interface MethodologyCompassPaneProps {
  onNavigateToSynthetic?: (preset?: string) => void;
  onNavigateToStudio?: () => void;
  onAppendToDraft?: (text: string) => void;
  llmConfig?: LLMConfig;
}

export const MethodologyCompassPane: React.FC<MethodologyCompassPaneProps> = ({
  onNavigateToSynthetic,
  onNavigateToStudio,
  onAppendToDraft,
  llmConfig = DEFAULT_LLM_CONFIG
}) => {
  const [activeTab, setActiveTab] = useState<ActiveCompassTab>('ai_advisor');

  // Guided pathway state
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState<number>(0);
  const [answers, setAnswers] = useState<(number | null)[]>(new Array(QUESTIONS.length).fill(null));
  const [manualOverrides, setManualOverrides] = useState<Record<string, string | null>>({});

  // Quick analysis selector state
  const [analysisFilter, setAnalysisFilter] = useState<'all' | 'quantitative' | 'qualitative'>('all');
  const [analysisSearch, setAnalysisSearch] = useState('');
  const [selectedGuide, setSelectedGuide] = useState<QuickAnalysisGuide | null>(QUICK_ANALYSIS_GUIDES[0]);

  // Coherence matrix custom selection
  const [customStack, setCustomStack] = useState<CompassStack>({
    ontology: 'critical-realism',
    epistemology: 'post-positivism',
    paradigm: 'functionalist',
    methodology: 'survey',
    method: 'survey-instrument',
    analysis: 'sem'
  });

  // Compendium state
  const [compendiumLayer, setCompendiumLayer] = useState<string>('analysis');
  const [compendiumSearch, setCompendiumSearch] = useState('');
  const [selectedEntryId, setSelectedEntryId] = useState<string>('sem');
  const [readingMode, setReadingMode] = useState<'both' | 'plain' | 'scholar'>('both');

  // Glossary search
  const [glossarySearch, setGlossarySearch] = useState('');

  // Copy notification states
  const [copiedParagraph, setCopiedParagraph] = useState(false);
  const [copiedMarkdown, setCopiedMarkdown] = useState(false);
  const [copiedSyntax, setCopiedSyntax] = useState<string | null>(null);

  // AI Advisor State
  const [aiObjective, setAiObjective] = useState('');
  const [aiDataDesc, setAiDataDesc] = useState('');
  const [aiDiscipline, setAiDiscipline] = useState('Business & Social Sciences');
  const [isAnalyzingAI, setIsAnalyzingAI] = useState(false);
  const [aiRecommendation, setAiRecommendation] = useState<AIMethodologyRecommendation | null>(null);
  const [activeCodeLang, setActiveCodeLang] = useState<'r' | 'python' | 'spssOrStata'>('r');
  const [copiedAiProse, setCopiedAiProse] = useState(false);
  const [copiedAiCode, setCopiedAiCode] = useState(false);
  const [savedAiToBinder, setSavedAiToBinder] = useState(false);

  const AI_EXEMPLAR_PRESETS = [
    {
      label: 'Moderated Regression',
      objective: 'Investigate whether perceived organizational support moderates the negative impact of workplace stress on employee turnover intentions.',
      data: 'Cross-sectional survey of 320 healthcare workers using validated 5-point Likert scales. Some missing values in demographics, outcome is slightly skewed.',
      discipline: 'Business & Social Sciences'
    },
    {
      label: 'Statistical Mediation',
      objective: 'Determine whether psychological safety mediates the relationship between servant leadership and team innovative work behavior.',
      data: 'Multi-source survey with 240 dyads (leaders and subordinates) across two measurement waves spaced 6 weeks apart.',
      discipline: 'Psychology & Cognitive Sciences'
    },
    {
      label: '2x2 Factorial Experiment',
      objective: 'Evaluate the causal effect of generative AI feedback versus human tutor feedback on undergraduate essay revision quality across novice vs advanced students.',
      data: 'Randomized 2x2 laboratory experiment with N=140 students randomly assigned to feedback conditions; baseline verbal SAT score recorded as covariate.',
      discipline: 'Education & Pedagogy'
    },
    {
      label: 'Qualitative Phenomenological Inquiry',
      objective: 'Understand how mid-career academic clinicians experience and navigate existential burnout and administrative identity conflict during hospital restructuring.',
      data: 'In-depth semi-structured interviews with 16 academic physicians with 10+ years tenure, average 65 minutes per interview, fully transcribed.',
      discipline: 'Medicine & Healthcare'
    },
    {
      label: 'Binary Logistic Churn Model',
      objective: 'Identify predictive drivers of student dropout (persisted vs dropped out) based on LMS behavioral telemetry and socio-demographic indicators.',
      data: 'Institutional registry of 1,800 first-year undergraduates with weekly LMS logins, assignment submission timeliness, GPA, and binary retention status (0/1).',
      discipline: 'Computer Science & HCI'
    }
  ];

  const handleRunAIAnalysis = async () => {
    if (!aiObjective.trim()) return;
    setIsAnalyzingAI(true);
    setSavedAiToBinder(false);
    try {
      const rec = await recommendMethodologyAI(
        aiObjective,
        aiDataDesc || 'No specific data properties specified',
        aiDiscipline,
        llmConfig
      );
      setAiRecommendation(rec);
    } catch (e) {
      console.error('AI methodology error:', e);
    } finally {
      setIsAnalyzingAI(false);
    }
  };

  const handleApplyAIToStack = (rec: AIMethodologyRecommendation) => {
    setCustomStack({
      ontology: rec.recommendedStack.ontology,
      epistemology: rec.recommendedStack.epistemology,
      paradigm: rec.recommendedStack.paradigm,
      methodology: rec.recommendedStack.methodology,
      method: rec.recommendedStack.method,
      analysis: rec.recommendedStack.analysis,
    });
    setActiveTab('coherence');
  };

  const handleSaveAIToBinder = (rec: AIMethodologyRecommendation) => {
    addBinderItem({
      type: 'stat',
      title: `Methodology: ${rec.recommendedStack.analysisName}`,
      snippet: `${rec.summary}\n\nStack: ${rec.recommendedStack.methodologyName} -> ${rec.recommendedStack.analysisName}`,
      sourcePillar: 'Methodology Compass (AI Advisor)',
      metadata: {
        stack: rec.recommendedStack,
        apaProse: rec.apaMethodologyProse
      }
    });
    setSavedAiToBinder(true);
    setTimeout(() => setSavedAiToBinder(false), 2500);
  };

  // Compute guided stack & coherence
  const stack = useMemo(() => {
    return computeStack(answers, manualOverrides);
  }, [answers, manualOverrides]);

  const coherence = useMemo(() => {
    return computeCoherence(stack);
  }, [stack]);

  const customCoherence = useMemo(() => {
    return computeCoherence(customStack);
  }, [customStack]);

  const alternatives = useMemo(() => {
    return getAlternatives(answers);
  }, [answers]);

  const methodsParagraph = useMemo(() => {
    return generateMethodsParagraph(stack);
  }, [stack]);

  // Handlers for guided pathway
  const handleSelectOption = (optionIdx: number) => {
    const nextAnswers = [...answers];
    nextAnswers[currentQuestionIdx] = optionIdx;
    setAnswers(nextAnswers);
  };

  const handleResetStack = () => {
    setAnswers(new Array(QUESTIONS.length).fill(null));
    setManualOverrides({});
    setCurrentQuestionIdx(0);
  };

  const handleCopyParagraph = () => {
    navigator.clipboard.writeText(methodsParagraph);
    setCopiedParagraph(true);
    setTimeout(() => setCopiedParagraph(false), 2000);
  };

  const handleCopyMarkdown = () => {
    const md = generateMarkdown(stack, answers);
    navigator.clipboard.writeText(md);
    setCopiedMarkdown(true);
    setTimeout(() => setCopiedMarkdown(false), 2000);
  };

  const handleDownloadDossier = () => {
    const md = generateMarkdown(stack, answers);
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `research-architecture-dossier-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopySyntax = (syntaxText: string, key: string) => {
    navigator.clipboard.writeText(syntaxText);
    setCopiedSyntax(key);
    setTimeout(() => setCopiedSyntax(null), 2000);
  };

  // Filtered quick analysis guides
  const filteredGuides = useMemo(() => {
    return QUICK_ANALYSIS_GUIDES.filter((g) => {
      const matchCat = analysisFilter === 'all' || g.category === analysisFilter;
      const q = analysisSearch.toLowerCase();
      const matchText =
        g.objective.toLowerCase().includes(q) ||
        g.recommendedTest.toLowerCase().includes(q) ||
        g.bestFor.toLowerCase().includes(q);
      return matchCat && matchText;
    });
  }, [analysisFilter, analysisSearch]);

  // Filtered compendium entries
  const compEntries = useMemo(() => {
    const list = ATLAS[compendiumLayer] || [];
    if (!compendiumSearch) return list;
    const q = compendiumSearch.toLowerCase();
    return list.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        (e.tagline || '').toLowerCase().includes(q) ||
        e.essence.toLowerCase().includes(q)
    );
  }, [compendiumLayer, compendiumSearch]);

  const activeCompEntry = useMemo(() => {
    return getAtlasEntry(compendiumLayer, selectedEntryId) || compEntries[0] || null;
  }, [compendiumLayer, selectedEntryId, compEntries]);

  // Filtered glossary
  const filteredGlossary = useMemo(() => {
    if (!glossarySearch) return GLOSSARY;
    const q = glossarySearch.toLowerCase();
    return GLOSSARY.filter(
      (item) => item.term.toLowerCase().includes(q) || item.def.toLowerCase().includes(q)
    );
  }, [glossarySearch]);

  // Count answered questions
  const answeredCount = answers.filter((a) => a !== null).length;

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-oxblood-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/40">
                <Compass className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-serif font-bold text-slate-900 dark:text-slate-100">
                Methodology &amp; Analysis Compass
              </h2>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                Decision Atlas for Social Research
              </span>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-3xl">
              Architect your complete methodological stack from <strong>Ontology &rarr; Epistemology &rarr; Methodology &rarr; Analytical Strategy</strong>.
              Select appropriate statistical or qualitative analyses, audit cross-layer coherence, and generate publication-ready APA methodology paragraphs.
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Curated by <strong>Professor Babu George</strong> &middot; Adapted from <em>The Methodology Compass</em>
            </p>
          </div>

          {/* Quick Action Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleCopyParagraph}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-750 transition cursor-pointer"
              title="Copy APA Methodology Paragraph to Clipboard"
            >
              {copiedParagraph ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
              {copiedParagraph ? 'Copied Paragraph!' : 'Copy Methods Paragraph'}
            </button>
            <button
              onClick={handleCopyMarkdown}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-750 transition cursor-pointer"
              title="Copy Full Markdown Dossier to Clipboard"
            >
              {copiedMarkdown ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
              {copiedMarkdown ? 'Copied Dossier!' : 'Copy Dossier (MD)'}
            </button>
            {onNavigateToSynthetic && (
              <button
                onClick={() => onNavigateToSynthetic()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/80 dark:hover:bg-blue-900/80 text-blue-900 dark:text-blue-300 border border-blue-200 dark:border-blue-800 transition shadow-xs cursor-pointer"
                title="Generate Synthetic Pilot Data for this Research Architecture"
              >
                <Database className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400" />
                <span>Synthetic Data Forge &rarr;</span>
              </button>
            )}
            <button
              onClick={() => setActiveTab('irb_ethics')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/80 dark:hover:bg-emerald-900/80 text-emerald-900 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 transition shadow-xs cursor-pointer"
              title="Assess Human Subjects Ethics &amp; IRB Review Pathway for this Methodology"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>IRB Pre-Flight &rarr;</span>
            </button>
            <button
              onClick={handleDownloadDossier}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-red-800 hover:bg-red-900 text-white transition shadow-sm cursor-pointer"
              title="Download Full Markdown Research Architecture Dossier"
            >
              <Download className="w-3.5 h-3.5" />
              Export Dossier (.md)
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
          <button
            onClick={() => setActiveTab('ai_advisor')}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all duration-150 whitespace-nowrap flex items-center gap-1.5 cursor-pointer active:scale-95 ${
              activeTab === 'ai_advisor'
                ? 'bg-blue-900 dark:bg-blue-800 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-blue-900 dark:hover:text-blue-300 hover:bg-blue-50/70 dark:hover:bg-blue-950/40 border border-transparent hover:border-blue-200 dark:hover:border-blue-900/40'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>AI Research Design Advisor</span>
          </button>

          <button
            onClick={() => setActiveTab('selector')}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all duration-150 whitespace-nowrap flex items-center gap-1.5 cursor-pointer active:scale-95 ${
              activeTab === 'selector'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Code2 className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
            <span>Which Analysis Should I Choose?</span>
          </button>

          <button
            onClick={() => setActiveTab('guided')}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all duration-150 whitespace-nowrap flex items-center gap-1.5 cursor-pointer active:scale-95 ${
              activeTab === 'guided'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Compass className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
            <span>Guided Pathway ({answeredCount}/{QUESTIONS.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('coherence')}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all duration-150 whitespace-nowrap flex items-center gap-1.5 cursor-pointer active:scale-95 ${
              activeTab === 'coherence'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-purple-500 dark:text-purple-400" />
            <span>Coherence &amp; Defense Matrix</span>
          </button>

          <button
            onClick={() => setActiveTab('compendium')}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all duration-150 whitespace-nowrap flex items-center gap-1.5 cursor-pointer active:scale-95 ${
              activeTab === 'compendium'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-teal-500 dark:text-teal-400" />
            <span>Methodology Compendium</span>
          </button>

          <button
            onClick={() => setActiveTab('exemplars')}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all duration-150 whitespace-nowrap flex items-center gap-1.5 cursor-pointer active:scale-95 ${
              activeTab === 'exemplars'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
            <span>Published Exemplars</span>
          </button>

          <button
            onClick={() => setActiveTab('glossary')}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all duration-150 whitespace-nowrap flex items-center gap-1.5 cursor-pointer active:scale-95 ${
              activeTab === 'glossary'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400" />
            <span>Viva &amp; Defense Glossary</span>
          </button>

          <button
            onClick={() => setActiveTab('irb_ethics')}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all duration-150 whitespace-nowrap flex items-center gap-1.5 cursor-pointer active:scale-95 ${
              activeTab === 'irb_ethics'
                ? 'bg-emerald-900 dark:bg-emerald-800 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-emerald-900 dark:hover:text-emerald-300 hover:bg-emerald-50/70 dark:hover:bg-emerald-950/40 border border-transparent hover:border-emerald-200 dark:hover:border-emerald-900/40'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>IRB &amp; Ethics Triage</span>
          </button>
        </div>
      </div>

      {/* TAB 0: AI METHODOLOGICAL ARCHITECT & RESEARCH DESIGN ADVISOR */}
      {activeTab === 'ai_advisor' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Natural Language Prompt & Input Card */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-900/60">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                  </span>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    AI Methodological Architect &amp; Research Design Advisor
                  </h3>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Describe what you want to study and your data properties in plain English. The AI synthesizes the optimal 6-layer epistemic stack, inspects statistical assumptions, provides executable R/Python/SPSS code, and formats APA 7th methodology prose.
                </p>
              </div>

              {/* Provider Badge */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 shrink-0">
                <Bot className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span className="font-semibold capitalize">{llmConfig?.provider || 'Built-in'}</span>
                <span className="text-[10px] text-slate-400 font-mono">({llmConfig?.model || 'Deterministic Rules'})</span>
              </div>
            </div>

            {/* Quick Inspiration Exemplar Chips */}
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Quick Exemplar Presets (Click to load):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {AI_EXEMPLAR_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setAiObjective(preset.objective);
                      setAiDataDesc(preset.data);
                      setAiDiscipline(preset.discipline);
                    }}
                    className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 hover:bg-blue-50 dark:bg-slate-800 dark:hover:bg-blue-950/60 text-slate-700 dark:text-slate-300 hover:text-blue-700 dark:hover:text-blue-300 border border-slate-200 dark:border-slate-700 transition cursor-pointer"
                  >
                    💡 {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Input Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-8 space-y-1.5">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                  1. Research Objective, Question, or Planned Investigation:
                </label>
                <textarea
                  value={aiObjective}
                  onChange={(e) => setAiObjective(e.target.value)}
                  rows={4}
                  placeholder="e.g., I want to investigate whether workplace psychological safety moderates the negative impact of remote work isolation on employee turnover intention..."
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-600/30"
                />
              </div>

              <div className="md:col-span-4 space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                    Discipline / Scientific Domain:
                  </label>
                  <select
                    value={aiDiscipline}
                    onChange={(e) => setAiDiscipline(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                  >
                    <option value="Business & Social Sciences">Business &amp; Social Sciences</option>
                    <option value="Psychology & Cognitive Sciences">Psychology &amp; Behavioral Sciences</option>
                    <option value="Medicine & Healthcare">Medicine &amp; Healthcare</option>
                    <option value="Education & Pedagogy">Education &amp; Pedagogy</option>
                    <option value="Computer Science & HCI">Computer Science &amp; HCI</option>
                    <option value="Economics & Finance">Economics &amp; Finance</option>
                    <option value="Sociology & Public Policy">Sociology &amp; Public Policy</option>
                    <option value="Interdisciplinary">Interdisciplinary Social Sciences</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                    2. Data Characteristics &amp; Constraints:
                  </label>
                  <textarea
                    value={aiDataDesc}
                    onChange={(e) => setAiDataDesc(e.target.value)}
                    rows={2}
                    placeholder="e.g., Survey with 350 tech workers, 5-point Likert scales, continuous turnover intention metric..."
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-600/30"
                  />
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                Tip: Mention variables, sample size, measurement format, or qualitative medium for highest precision.
              </span>
              <button
                type="button"
                onClick={handleRunAIAnalysis}
                disabled={isAnalyzingAI || !aiObjective.trim()}
                className="px-5 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold transition flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isAnalyzingAI ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Synthesizing Architecture...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>Recommend Methodology &amp; Analysis</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* AI Recommendation Output Section */}
          {aiRecommendation && (
            <div className="space-y-6 animate-in fade-in duration-300">
              
              {/* Executive Strategic Summary Banner */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-900 to-indigo-900 text-white shadow-md">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-md bg-blue-800 text-blue-200 uppercase tracking-wider">
                      Strategic Methodological Verdict
                    </span>
                    <h4 className="text-base font-bold mt-1">
                      {aiRecommendation.recommendedStack.methodologyName} &amp; {aiRecommendation.recommendedStack.analysisName}
                    </h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleApplyAIToStack(aiRecommendation)}
                      className="px-3.5 py-1.5 rounded-xl bg-white text-blue-950 font-bold text-xs hover:bg-blue-50 transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                      title="Load this recommended 6-layer stack into the Coherence Diagnostic Matrix"
                    >
                      <Sliders className="w-3.5 h-3.5 text-blue-800" />
                      <span>Inspect Coherence Matrix &rarr;</span>
                    </button>
                    {onNavigateToSynthetic && (
                      <button
                        type="button"
                        onClick={() => onNavigateToSynthetic(aiRecommendation.suggestedSyntheticPreset)}
                        className="px-3.5 py-1.5 rounded-xl bg-blue-800/80 hover:bg-blue-700 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1.5 border border-blue-600/50 shadow-xs"
                        title="Simulate empirical pilot data matching this architecture in the Synthetic Data Forge"
                      >
                        <Database className="w-3.5 h-3.5 text-amber-300" />
                        <span>Simulate in Synthetic Forge &rarr;</span>
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-xs text-blue-100 mt-2.5 leading-relaxed max-w-4xl">
                  {aiRecommendation.summary}
                </p>
              </div>

              {/* 6-Layer Epistemic Stack Grid */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span>Recommended 6-Layer Epistemic Alignment Stack</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => handleApplyAIToStack(aiRecommendation)}
                    className="text-xs font-bold text-blue-700 dark:text-blue-400 hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <span>Load Into Coherence Matrix</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">1. Ontology</span>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block mt-0.5 truncate" title={aiRecommendation.recommendedStack.ontologyName}>
                      {aiRecommendation.recommendedStack.ontologyName}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">{aiRecommendation.recommendedStack.ontology}</span>
                  </div>

                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">2. Epistemology</span>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block mt-0.5 truncate" title={aiRecommendation.recommendedStack.epistemologyName}>
                      {aiRecommendation.recommendedStack.epistemologyName}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">{aiRecommendation.recommendedStack.epistemology}</span>
                  </div>

                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">3. Paradigm</span>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block mt-0.5 truncate" title={aiRecommendation.recommendedStack.paradigmName}>
                      {aiRecommendation.recommendedStack.paradigmName}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">{aiRecommendation.recommendedStack.paradigm}</span>
                  </div>

                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">4. Methodology</span>
                    <span className="text-xs font-bold text-blue-800 dark:text-blue-400 block mt-0.5 truncate" title={aiRecommendation.recommendedStack.methodologyName}>
                      {aiRecommendation.recommendedStack.methodologyName}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">{aiRecommendation.recommendedStack.methodology}</span>
                  </div>

                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">5. Method</span>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block mt-0.5 truncate" title={aiRecommendation.recommendedStack.methodName}>
                      {aiRecommendation.recommendedStack.methodName}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">{aiRecommendation.recommendedStack.method}</span>
                  </div>

                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">6. Analysis</span>
                    <span className="text-xs font-bold text-emerald-800 dark:text-emerald-400 block mt-0.5 truncate" title={aiRecommendation.recommendedStack.analysisName}>
                      {aiRecommendation.recommendedStack.analysisName}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">{aiRecommendation.recommendedStack.analysis}</span>
                  </div>
                </div>
              </div>

              {/* Two Column Deep Dive: Rationale & Assumptions vs. Code & Prose */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Left Column: Scientific Rationale, Assumptions, Sample Power */}
                <div className="lg:col-span-6 space-y-5">
                  
                  {/* Scientific Rationale Card */}
                  <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2.5">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      <GraduationCap className="w-4 h-4 text-blue-700 dark:text-blue-400" />
                      <span>Methodological Defense &amp; Design Rationale</span>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed text-justify">
                      {aiRecommendation.designRationale}
                    </p>
                  </div>

                  {/* Key Assumptions Checklist */}
                  <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>Key Statistical &amp; Methodological Assumptions</span>
                    </div>
                    <div className="space-y-2">
                      {aiRecommendation.keyAssumptions.map((assumption, idx) => (
                        <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span className="leading-relaxed">{assumption}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Sample Size Guidance */}
                  <div className="p-4 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 flex items-start gap-3">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white block">
                        Sample Size &amp; Statistical Power Rule
                      </span>
                      <p className="text-xs text-slate-700 dark:text-slate-300 mt-0.5 leading-relaxed">
                        {aiRecommendation.sampleSizeGuidance}
                      </p>
                    </div>
                  </div>

                </div>

                {/* Right Column: Code Syntax, Publication Prose, Binder */}
                <div className="lg:col-span-6 space-y-5">
                  
                  {/* Executable Code Syntax */}
                  <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                        <Terminal className="w-4 h-4 text-blue-700 dark:text-blue-400" />
                        <span>Executable Analysis Syntax</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const code = aiRecommendation.softwareSyntax[activeCodeLang] || '';
                          navigator.clipboard.writeText(code);
                          setCopiedAiCode(true);
                          setTimeout(() => setCopiedAiCode(false), 2000);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 transition cursor-pointer flex items-center gap-1"
                      >
                        {copiedAiCode ? (
                          <>
                            <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy Syntax</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Language Switcher */}
                    <div className="flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-800 pb-2">
                      <button
                        type="button"
                        onClick={() => setActiveCodeLang('r')}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                          activeCodeLang === 'r'
                            ? 'bg-blue-900 text-white shadow-xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        R Script
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveCodeLang('python')}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                          activeCodeLang === 'python'
                            ? 'bg-blue-900 text-white shadow-xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        Python (statsmodels)
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveCodeLang('spssOrStata')}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                          activeCodeLang === 'spssOrStata'
                            ? 'bg-blue-900 text-white shadow-xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        SPSS / Stata
                      </button>
                    </div>

                    {/* Syntax Code Block */}
                    <div className="relative rounded-xl overflow-hidden bg-slate-950 p-4 font-mono text-xs text-slate-200 max-h-56 overflow-y-auto leading-relaxed whitespace-pre-wrap">
                      {aiRecommendation.softwareSyntax[activeCodeLang] || '# No specific script available'}
                    </div>
                  </div>

                  {/* APA 7th Methodology Paragraph */}
                  <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                        <BookOpen className="w-4 h-4 text-blue-700 dark:text-blue-400" />
                        <span>Publication-Ready APA 7th Methods Section</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(aiRecommendation.apaMethodologyProse);
                          setCopiedAiProse(true);
                          setTimeout(() => setCopiedAiProse(false), 2000);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 transition cursor-pointer flex items-center gap-1"
                      >
                        {copiedAiProse ? (
                          <>
                            <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy Prose</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-serif text-xs text-slate-800 dark:text-slate-200 leading-relaxed text-justify">
                      {aiRecommendation.apaMethodologyProse}
                    </div>

                    {/* Persistent Binder & Actions */}
                    <div className="pt-2 flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[11px] text-slate-400">
                        Ready to integrate into Chapter 3 or journal manuscript.
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setActiveTab('irb_ethics')}
                          className="px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-xs bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-900 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span>Run IRB Ethics Pre-Flight</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveAIToBinder(aiRecommendation)}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-xs ${
                            savedAiToBinder
                              ? 'bg-emerald-600 text-white'
                              : 'bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-900 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                          }`}
                        >
                          {savedAiToBinder ? (
                            <>
                              <CheckCheck className="w-3.5 h-3.5" />
                              <span>Saved to Binder!</span>
                            </>
                          ) : (
                            <>
                              <FolderKanban className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400" />
                              <span>Clip to Research Binder</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                  </div>

                </div>

              </div>

            </div>
          )}

        </div>
      )}

      {/* TAB 1: WHICH ANALYSIS SHOULD I CHOOSE? */}
      {activeTab === 'selector' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Guide List & Filters */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Select Your Analytical Objective
                </h3>
                <span className="text-xs text-slate-500">
                  {filteredGuides.length} method guides
                </span>
              </div>

              {/* Category Filter Pills */}
              <div className="flex items-center gap-1.5">
                {(['all', 'quantitative', 'qualitative'] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setAnalysisFilter(cat)}
                    className={`px-2.5 py-1 text-xs font-medium rounded-lg capitalize transition ${
                      analysisFilter === cat
                        ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                    }`}
                  >
                    {cat === 'all' ? 'All Methods' : cat}
                  </button>
                ))}
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={analysisSearch}
                  onChange={(e) => setAnalysisSearch(e.target.value)}
                  placeholder="Filter by goal (e.g. compare groups, SEM, lived experience, interview)..."
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-red-800/20"
                />
              </div>
            </div>

            {/* List of Guides */}
            <div className="space-y-2 max-h-[640px] overflow-y-auto pr-1">
              {filteredGuides.map((guide) => {
                const isSelected = selectedGuide?.id === guide.id;
                return (
                  <div
                    key={guide.id}
                    onClick={() => setSelectedGuide(guide)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition text-left ${
                      isSelected
                        ? 'border-red-700 dark:border-red-600 bg-red-50/60 dark:bg-red-950/20 shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          guide.category === 'quantitative'
                            ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                            : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                        }`}
                      >
                        {guide.category}
                      </span>
                      <span className="text-xs font-semibold text-red-700 dark:text-red-400">
                        {guide.recommendedTest}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-snug">
                      {guide.objective}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                      {guide.bestFor}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Detailed Analysis Blueprint */}
          <div className="lg:col-span-7">
            {selectedGuide ? (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
                <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
                  <div className="flex items-center justify-between gap-3">
                    <span
                      className={`text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                        selectedGuide.category === 'quantitative'
                          ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                          : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                      }`}
                    >
                      {selectedGuide.category} Blueprint
                    </span>
                    <button
                      onClick={() => {
                        // Apply directly to stack
                        if (selectedGuide.category === 'quantitative') {
                          setManualOverrides((prev) => ({
                            ...prev,
                            ontology: 'critical-realism',
                            epistemology: 'post-positivism',
                            analysis: selectedGuide.id.includes('sem') ? 'sem' : 'regression'
                          }));
                        } else {
                          setManualOverrides((prev) => ({
                            ...prev,
                            ontology: 'social-constructionism',
                            epistemology: 'interpretivism',
                            analysis: selectedGuide.id.includes('thematic') ? 'thematic-analysis' : 'ipa'
                          }));
                        }
                        setActiveTab('guided');
                      }}
                      className="text-xs font-medium text-red-700 dark:text-red-400 hover:underline flex items-center gap-1"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Adopt into Guided Stack
                    </button>
                  </div>
                  <h3 className="text-xl font-serif font-bold text-slate-900 dark:text-slate-100 mt-2">
                    {selectedGuide.recommendedTest}
                  </h3>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                    Objective: {selectedGuide.objective}
                  </p>
                </div>

                {/* Best For & Alternatives */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-750">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Ideal Use Case
                    </div>
                    <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                      {selectedGuide.bestFor}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-750">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Parametric &amp; Non-Parametric Options
                    </div>
                    <div className="text-xs text-slate-700 dark:text-slate-300 space-y-1">
                      {selectedGuide.parametricAlternative && (
                        <div>
                          <strong className="text-slate-900 dark:text-slate-100">Parametric:</strong> {selectedGuide.parametricAlternative}
                        </div>
                      )}
                      {selectedGuide.nonParametricAlternative && (
                        <div>
                          <strong className="text-slate-900 dark:text-slate-100">Non-Parametric:</strong> {selectedGuide.nonParametricAlternative}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Core Assumptions & Sample Size */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Statistical / Methodological Assumptions
                  </h4>
                  <ul className="space-y-1.5">
                    {selectedGuide.keyAssumptions.map((asm, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{asm}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 text-xs text-amber-900 dark:text-amber-300 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <strong>Sample Size &amp; Power Requirement:</strong> {selectedGuide.minimumSampleSize}
                    </div>
                  </div>
                </div>

                {/* Ready Software Code Blocks */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <Code2 className="w-3.5 h-3.5 text-red-700 dark:text-red-400" />
                      Software Execution Syntax (R, Python, SPSS/Stata)
                    </h4>
                  </div>

                  <div className="space-y-2">
                    {selectedGuide.softwareSyntax.r && (
                      <div className="relative group">
                        <div className="flex items-center justify-between text-[11px] font-mono px-3 py-1 bg-slate-800 text-slate-300 rounded-t-lg">
                          <span>R Syntax</span>
                          <button
                            onClick={() => handleCopySyntax(selectedGuide.softwareSyntax.r || '', 'r')}
                            className="hover:text-white transition flex items-center gap-1 text-[10px]"
                          >
                            {copiedSyntax === 'r' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            {copiedSyntax === 'r' ? 'Copied' : 'Copy'}
                          </button>
                        </div>
                        <pre className="p-3 text-xs font-mono bg-slate-900 text-emerald-400 rounded-b-lg overflow-x-auto whitespace-pre-wrap">
                          {selectedGuide.softwareSyntax.r}
                        </pre>
                      </div>
                    )}

                    {selectedGuide.softwareSyntax.python && (
                      <div className="relative group">
                        <div className="flex items-center justify-between text-[11px] font-mono px-3 py-1 bg-slate-800 text-slate-300 rounded-t-lg">
                          <span>Python Syntax</span>
                          <button
                            onClick={() => handleCopySyntax(selectedGuide.softwareSyntax.python || '', 'python')}
                            className="hover:text-white transition flex items-center gap-1 text-[10px]"
                          >
                            {copiedSyntax === 'python' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            {copiedSyntax === 'python' ? 'Copied' : 'Copy'}
                          </button>
                        </div>
                        <pre className="p-3 text-xs font-mono bg-slate-900 text-cyan-400 rounded-b-lg overflow-x-auto whitespace-pre-wrap">
                          {selectedGuide.softwareSyntax.python}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>

                {/* APA Publication Reporting Template */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-red-800 dark:text-red-400 uppercase tracking-wider flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5" />
                      APA 7th Edition Reporting Template
                    </span>
                    <button
                      onClick={() => handleCopySyntax(selectedGuide.reportingTemplate, 'apa')}
                      className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1"
                    >
                      {copiedSyntax === 'apa' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                      Copy Template
                    </button>
                  </div>
                  <p className="text-xs font-serif italic text-slate-800 dark:text-slate-200 leading-relaxed border-l-2 border-red-700 pl-3">
                    &ldquo;{selectedGuide.reportingTemplate}&rdquo;
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-slate-400 border border-dashed rounded-2xl">
                Select an analytical objective to inspect assumptions, syntax, and reporting blueprints.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: GUIDED PATHWAY (THE 10 QUESTIONS) */}
      {activeTab === 'guided' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Question Flow (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Progress Bar */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                <span>
                  Question {currentQuestionIdx + 1} of {QUESTIONS.length}
                </span>
                <span>{Math.round(((currentQuestionIdx + 1) / QUESTIONS.length) * 100)}% Complete</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-red-800 dark:bg-red-700 transition-all duration-300"
                  style={{ width: `${((currentQuestionIdx + 1) / QUESTIONS.length) * 100}%` }}
                />
              </div>

              {/* Question step dots */}
              <div className="flex items-center justify-between pt-1">
                {QUESTIONS.map((q, idx) => (
                  <button
                    key={q.id}
                    onClick={() => setCurrentQuestionIdx(idx)}
                    className={`w-6 h-6 rounded-full text-[10px] font-mono font-bold transition flex items-center justify-center ${
                      idx === currentQuestionIdx
                        ? 'bg-red-800 text-white'
                        : answers[idx] !== null
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                    }`}
                    title={q.prompt}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>
            </div>

            {/* Active Question Card */}
            {QUESTIONS[currentQuestionIdx] && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
                <div>
                  <span className="text-[11px] font-bold text-red-800 dark:text-red-400 uppercase tracking-wider">
                    Step {currentQuestionIdx + 1} &middot; {QUESTIONS[currentQuestionIdx].layer ? `Focus: ${QUESTIONS[currentQuestionIdx].layer}` : 'Research Architecture'}
                  </span>
                  <h3 className="text-xl font-serif font-bold text-slate-900 dark:text-slate-100 mt-1">
                    {QUESTIONS[currentQuestionIdx].prompt}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    {QUESTIONS[currentQuestionIdx].deck}
                  </p>
                </div>

                {/* Option Radios */}
                <div className="space-y-3">
                  {QUESTIONS[currentQuestionIdx].options.map((opt, optIdx) => {
                    const isSelected = answers[currentQuestionIdx] === optIdx;
                    return (
                      <div
                        key={optIdx}
                        onClick={() => handleSelectOption(optIdx)}
                        className={`p-4 rounded-xl border cursor-pointer transition text-left flex items-start gap-3 ${
                          isSelected
                            ? 'border-red-700 dark:border-red-600 bg-red-50/70 dark:bg-red-950/20 shadow-sm ring-1 ring-red-700/20'
                            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-full mt-0.5 border flex items-center justify-center shrink-0 ${
                            isSelected
                              ? 'border-red-700 bg-red-700 text-white'
                              : 'border-slate-300 dark:border-slate-600'
                          }`}
                        >
                          {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                        </div>
                        <div className="space-y-0.5">
                          <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                            {opt.label}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                            {opt.detail}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Question Nav Buttons */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
                  <button
                    onClick={() => setCurrentQuestionIdx((p) => Math.max(0, p - 1))}
                    disabled={currentQuestionIdx === 0}
                    className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    Previous
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleResetStack}
                      className="px-3 py-2 text-xs font-medium text-slate-500 hover:text-red-700 flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Reset
                    </button>
                    {currentQuestionIdx < QUESTIONS.length - 1 ? (
                      <button
                        onClick={() => setCurrentQuestionIdx((p) => Math.min(QUESTIONS.length - 1, p + 1))}
                        className="px-4 py-2 text-xs font-semibold rounded-lg bg-red-800 hover:bg-red-900 text-white flex items-center gap-1.5 shadow-sm"
                      >
                        Next
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <button
                        onClick={() => setActiveTab('coherence')}
                        className="px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white flex items-center gap-1.5 shadow-sm"
                      >
                        View Full Coherence
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Rail: Real-time Synthesized Stack (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-red-700 dark:text-red-400" />
                  Your Research Stack
                </h3>
                <span className="text-[10px] font-mono text-slate-400 uppercase">Live Synthesis</span>
              </div>

              {/* Coherence Gauge */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-750 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-600 dark:text-slate-400">Coherence Score</span>
                  <span
                    className={`font-mono font-bold ${
                      coherence.pct >= 75
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : coherence.pct >= 45
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    {coherence.pct}% {coherence.verdict ? `(${coherence.verdict.toUpperCase()})` : ''}
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      coherence.pct >= 75
                        ? 'bg-emerald-500'
                        : coherence.pct >= 45
                        ? 'bg-amber-500'
                        : 'bg-red-500'
                    }`}
                    style={{ width: `${coherence.pct}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                  {coherence.note}
                </p>
              </div>

              {/* Stack Layers List */}
              <div className="space-y-2 text-xs">
                {LAYERS_ORDER.map((layerKey) => {
                  const id = stack[layerKey as keyof CompassStack];
                  const entry = id ? getAtlasEntry(layerKey, id) : null;
                  return (
                    <div
                      key={layerKey}
                      className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30"
                    >
                      <div className="text-[10px] font-bold text-red-800 dark:text-red-400 uppercase tracking-wider">
                        {LAYER_LABELS[layerKey] || layerKey}
                      </div>
                      <div className="font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
                        {entry ? entry.name : <span className="text-slate-400 italic font-normal">Pending answers...</span>}
                      </div>
                      {entry?.tagline && (
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                          {entry.tagline}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Generated Paragraph Draft Card */}
              <div className="p-3.5 rounded-xl bg-red-50/40 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-red-800 dark:text-red-400">
                  <span>Draft Methods Paragraph</span>
                  <button
                    onClick={handleCopyParagraph}
                    className="hover:underline flex items-center gap-1 text-[11px] cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                    Copy
                  </button>
                </div>
                <p className="text-xs font-serif italic text-slate-700 dark:text-slate-300 leading-relaxed">
                  &ldquo;{methodsParagraph}&rdquo;
                </p>
                <div className="pt-2 border-t border-red-200/60 dark:border-red-900/40 flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">
                    Human subjects or primary empirical data?
                  </span>
                  <button
                    onClick={() => setActiveTab('irb_ethics')}
                    className="text-[11px] font-bold text-red-800 dark:text-red-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Run IRB Ethics Pre-Flight &rarr;</span>
                  </button>
                </div>
              </div>

              {/* Viable Alternatives Card */}
              {Object.keys(alternatives).some((k) => alternatives[k]?.length > 0) && (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-1.5 text-xs">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Viable Alternative Options
                  </div>
                  {LAYERS_ORDER.filter((l) => alternatives[l]?.length > 0).slice(0, 3).map((l) => (
                    <div key={l} className="text-[11px] text-slate-600 dark:text-slate-400">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{LAYER_LABELS[l]}:</span>{' '}
                      {alternatives[l].map((id) => getAtlasEntry(l, id)?.name || id).join(', ')}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: COHERENCE & DEFENSE MATRIX */}
      {activeTab === 'coherence' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
            <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-red-800 dark:text-red-400">
                Architecture Coherence Auditor
              </span>
              <h3 className="text-xl font-serif font-bold text-slate-900 dark:text-slate-100 mt-1">
                Test Methodological Combinations &amp; Defense Pressures
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Customize any combination of Ontology, Epistemology, Methodology, and Analytical method to see whether your architecture holds together under reviewer scrutiny.
              </p>
            </div>

            {/* Interactive Dropdowns */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  1. Ontology
                </label>
                <select
                  value={customStack.ontology || ''}
                  onChange={(e) => setCustomStack({ ...customStack, ontology: e.target.value })}
                  className="w-full text-xs font-medium p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                >
                  {(ATLAS.ontology || []).map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  2. Epistemology
                </label>
                <select
                  value={customStack.epistemology || ''}
                  onChange={(e) => setCustomStack({ ...customStack, epistemology: e.target.value })}
                  className="w-full text-xs font-medium p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                >
                  {(ATLAS.epistemology || []).map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  3. Methodology
                </label>
                <select
                  value={customStack.methodology || ''}
                  onChange={(e) => setCustomStack({ ...customStack, methodology: e.target.value })}
                  className="w-full text-xs font-medium p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                >
                  {(ATLAS.methodology || []).map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  4. Analytical Strategy
                </label>
                <select
                  value={customStack.analysis || ''}
                  onChange={(e) => setCustomStack({ ...customStack, analysis: e.target.value })}
                  className="w-full text-xs font-medium p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                >
                  {(ATLAS.analysis || []).map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Diagnostic Result Card */}
            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={`p-2 rounded-xl ${
                      customCoherence.pct >= 75
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                        : customCoherence.pct >= 45
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                        : 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                    }`}
                  >
                    {customCoherence.pct >= 75 ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <AlertTriangle className="w-5 h-5" />
                    )}
                  </span>
                  <div>
                    <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
                      Coherence Verdict: {customCoherence.verdict?.toUpperCase()} ({customCoherence.pct}%)
                    </h4>
                    <p className="text-xs text-slate-500">{customCoherence.note}</p>
                  </div>
                </div>
              </div>

              {/* Defense Points & Pressure Zones */}
              <div className="space-y-2 pt-2">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Where Reviewers and Viva Examiners Will Press:
                </div>
                {customCoherence.issues.length > 0 ? (
                  <ul className="space-y-1.5">
                    {customCoherence.issues.map((issue, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-amber-800 dark:text-amber-300">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                        <span>{issue}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    No philosophical or methodological contradiction detected. This stack conforms to established canons.
                  </div>
                )}
              </div>

              {/* Draft Paragraph for Custom Stack */}
              <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5">
                <div className="text-[11px] font-bold text-red-800 dark:text-red-400 uppercase tracking-wider">
                  Generated Justification Paragraph
                </div>
                <p className="text-xs font-serif italic text-slate-800 dark:text-slate-200 leading-relaxed">
                  &ldquo;{generateMethodsParagraph(customStack)}&rdquo;
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: METHODOLOGY COMPENDIUM */}
      {activeTab === 'compendium' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Layer Selector & Entries */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                Layer
              </label>
              <select
                value={compendiumLayer}
                onChange={(e) => {
                  setCompendiumLayer(e.target.value);
                  const first = (ATLAS[e.target.value] || [])[0];
                  if (first) setSelectedEntryId(first.id);
                }}
                className="w-full text-xs font-medium p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              >
                {LAYERS_ORDER.map((l) => (
                  <option key={l} value={l}>
                    {LAYER_LABELS[l] || l} ({ATLAS[l]?.length || 0})
                  </option>
                ))}
              </select>

              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={compendiumSearch}
                  onChange={(e) => setCompendiumSearch(e.target.value)}
                  placeholder="Filter entries..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>
            </div>

            {/* List of entries in layer */}
            <div className="space-y-1.5 max-h-[580px] overflow-y-auto pr-1">
              {compEntries.map((entry) => {
                const isSelected = entry.id === selectedEntryId;
                return (
                  <button
                    key={entry.id}
                    onClick={() => setSelectedEntryId(entry.id)}
                    className={`w-full p-3 rounded-xl border text-left transition ${
                      isSelected
                        ? 'border-red-700 bg-red-50/70 dark:bg-red-950/20 text-red-900 dark:text-red-200 font-semibold'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                    }`}
                  >
                    <div className="text-xs font-bold">{entry.name}</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                      {entry.tagline}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Encyclopedic Detail */}
          <div className="lg:col-span-8">
            {activeCompEntry ? (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
                <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-red-800 dark:text-red-400">
                      {LAYER_LABELS[compendiumLayer]} Atlas
                    </span>
                    <div className="flex items-center gap-1 text-[11px]">
                      <button
                        onClick={() => setReadingMode('both')}
                        className={`px-2 py-0.5 rounded ${
                          readingMode === 'both' ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900' : 'text-slate-500'
                        }`}
                      >
                        Both
                      </button>
                      <button
                        onClick={() => setReadingMode('plain')}
                        className={`px-2 py-0.5 rounded ${
                          readingMode === 'plain' ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900' : 'text-slate-500'
                        }`}
                      >
                        Plain English (ELI5)
                      </button>
                      <button
                        onClick={() => setReadingMode('scholar')}
                        className={`px-2 py-0.5 rounded ${
                          readingMode === 'scholar' ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900' : 'text-slate-500'
                        }`}
                      >
                        Scholarly
                      </button>
                    </div>
                  </div>
                  <h3 className="text-2xl font-serif font-bold text-slate-900 dark:text-slate-100 mt-2">
                    {activeCompEntry.name}
                  </h3>
                  <p className="text-sm font-serif italic text-slate-600 dark:text-slate-400 mt-1">
                    {activeCompEntry.tagline}
                  </p>
                </div>

                {/* Plain English (ELI5) */}
                {(readingMode === 'both' || readingMode === 'plain') && ELI5[activeCompEntry.id] && (
                  <div className="p-4 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 space-y-1">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400">
                      In Plain English (The Lay Intuition)
                    </div>
                    <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed">
                      {ELI5[activeCompEntry.id]}
                    </p>
                  </div>
                )}

                {/* Scholarly Essence & Proponents */}
                {(readingMode === 'both' || readingMode === 'scholar') && (
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                        Scholarly Essence
                      </h4>
                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                        {activeCompEntry.essence}
                      </p>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                        Key Proponents &amp; Theorists
                      </h4>
                      <p className="text-xs font-medium text-slate-800 dark:text-slate-200">
                        {activeCompEntry.proponents}
                      </p>
                    </div>

                    {/* Assumptions */}
                    {Boolean(activeCompEntry.assumptions && activeCompEntry.assumptions.length > 0) && (
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                          Foundational Assumptions
                        </h4>
                        <ul className="space-y-1">
                          {activeCompEntry.assumptions?.map((asm, i) => (
                            <li key={i} className="text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2">
                              <span className="text-red-700 font-bold">&bull;</span>
                              <span>{asm}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Forecloses & Tensions */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {activeCompEntry.forecloses && (
                        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                          <div className="text-[11px] font-bold uppercase tracking-wider text-red-800 dark:text-red-400 mb-1">
                            What It Forecloses
                          </div>
                          <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                            {activeCompEntry.forecloses}
                          </div>
                        </div>
                      )}

                      {activeCompEntry.tensions && (
                        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                          <div className="text-[11px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400 mb-1">
                            Inherent Tensions
                          </div>
                          <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                            {activeCompEntry.tensions}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Critique & Readings */}
                    {activeCompEntry.critique && (
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                          Major Critiques
                        </h4>
                        <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                          {activeCompEntry.critique}
                        </p>
                      </div>
                    )}

                    {Boolean(activeCompEntry.readings && activeCompEntry.readings.length > 0) && (
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                          Canonical Readings
                        </h4>
                        <ul className="space-y-1">
                          {activeCompEntry.readings?.map((r, i) => (
                            <li key={i} className="text-xs font-serif italic text-slate-600 dark:text-slate-400">
                              {r}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-12 text-center text-slate-400">Select an entry to view details.</div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: PUBLISHED EXEMPLARS */}
      {activeTab === 'exemplars' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-serif font-bold text-slate-900 dark:text-slate-100">
              Published Exemplars: How High-Impact Papers Build Their Stacks
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Study how canonical and contemporary publications across business, sociology, and information systems defended their methodological stacks.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {EXEMPLARS.map((ex) => (
              <div
                key={ex.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3 hover:border-red-700/40 transition"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    {ex.discipline}
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-serif font-bold text-slate-900 dark:text-slate-100 leading-snug">
                    {ex.title}
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">{ex.author}</p>
                </div>

                {/* Stack Pills */}
                <div className="flex flex-wrap gap-1">
                  {ex.stack.ontology && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/30">
                      {ex.stack.ontology}
                    </span>
                  )}
                  {ex.stack.epistemology && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-900/30">
                      {ex.stack.epistemology}
                    </span>
                  )}
                  {ex.stack.analysis && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/30">
                      {ex.stack.analysis}
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {ex.summary}
                </p>

                {(ex.lesson || ex.whyItWorks) && (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                    <div className="text-[11px] font-bold text-slate-400 mb-0.5">Methodological Takeaway:</div>
                    <div className="text-slate-700 dark:text-slate-300 text-[11px] leading-relaxed">
                      {ex.lesson || ex.whyItWorks}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: VIVA & DEFENSE GLOSSARY */}
      {activeTab === 'glossary' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-3">
            <h3 className="text-lg font-serif font-bold text-slate-900 dark:text-slate-100">
              Doctoral Defense &amp; Viva Glossary
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Compact, defensible definitions of 42 critical methodology concepts you will be expected to wield without hesitation in defense or peer review.
            </p>
            <div className="relative max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={glossarySearch}
                onChange={(e) => setGlossarySearch(e.target.value)}
                placeholder="Search glossary terms (e.g. retroduction, idiographic, positivism)..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredGlossary.map((item, idx) => (
              <div
                key={idx}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-1.5"
              >
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-serif font-bold text-slate-900 dark:text-slate-100">
                    {item.term}
                  </h4>
                  {item.pron && (
                    <span className="text-xs font-serif italic text-slate-400">
                      {item.pron}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {item.def}
                </p>
                {item.seeAlso && item.seeAlso.length > 0 && (
                  <div className="flex items-center gap-1 pt-1 text-[11px] text-slate-400">
                    <span>See also:</span>
                    {item.seeAlso.map((sa, i) => (
                      <span key={i} className="text-red-700 dark:text-red-400 underline">
                        {sa}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 7: THE IRB & RESEARCH ETHICS SENTINEL */}
      {activeTab === 'irb_ethics' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <IrbTriagePane
            onAppendToDraft={onAppendToDraft}
            onNavigateToStudio={onNavigateToStudio}
          />
        </div>
      )}
    </div>
  );
};
