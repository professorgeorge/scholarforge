import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  Compass,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Search,
  BookOpen,
  Copy,
  Check,
  Send,
  ExternalLink,
  Sparkles,
  Clock,
  RotateCcw,
  Quote
} from 'lucide-react';
import {
  type IrbJurisdiction,
  type IrbTriageState,
  type IrbActivity,
  type IrbPopulation,
  type IrbSensitivity,
  type IrbChangeType,
  type IrbChangeStatus,
  type IrbChangeRisk,
  IRB_COMMON_DEFICIENCIES,
  IRB_FOUNDATIONAL_DOCUMENTS,
  IRB_WORKED_SCENARIOS,
  assessIrbTriage,
  computeSubmissionAudit,
  buildIrbDocuments,
  buildJurisdictionNotes,
  generateFormalEthicsStatement
} from '../services/irbTriageService';

interface IrbTriagePaneProps {
  onAppendToDraft?: (text: string) => void;
  onNavigateToStudio?: () => void;
}

const DEFAULT_STATE: IrbTriageState = {
  mode: 'researcher',
  jurisdiction: 'us',
  purpose: 'research',
  dataSource: 'primary',
  activities: ['survey'],
  population: ['general'],
  identifiability: 'coded',
  sensitivity: ['none'],
  risk: 'minimal',
  changeType: null,
  changeStatus: null,
  changeRisk: null
};

export const IrbTriagePane: React.FC<IrbTriagePaneProps> = ({
  onAppendToDraft,
  onNavigateToStudio
}) => {
  const [state, setState] = useState<IrbTriageState>(DEFAULT_STATE);
  const [institutionName, setInstitutionName] = useState<string>('');
  const [protocolId, setProtocolId] = useState<string>('');
  
  // Deficiencies search
  const [defSearch, setDefSearch] = useState<string>('');
  const [scenarioFilter, setScenarioFilter] = useState<string>('all');
  
  // Copy state
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [appendedToStudio, setAppendedToStudio] = useState<boolean>(false);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  // Evaluation
  const assessment = useMemo(() => assessIrbTriage(state), [state]);
  const audit = useMemo(() => computeSubmissionAudit(state), [state]);
  const requiredDocs = useMemo(() => buildIrbDocuments(state), [state]);
  const jurisdictionNotes = useMemo(() => buildJurisdictionNotes(state.jurisdiction), [state.jurisdiction]);
  const formalStatement = useMemo(
    () => generateFormalEthicsStatement(
      state, 
      institutionName.trim() || '[Name of University / Institutional Ethics Body]', 
      protocolId.trim() || '[IRB Protocol #]'
    ), 
    [state, institutionName, protocolId]
  );

  // Filtered Deficiencies
  const filteredDeficiencies = useMemo(() => {
    const q = defSearch.trim().toLowerCase();
    if (!q) return IRB_COMMON_DEFICIENCIES;
    return IRB_COMMON_DEFICIENCIES.filter(d => 
      d.title.toLowerCase().includes(q) ||
      d.body.toLowerCase().includes(q) ||
      d.tags.some(t => t.includes(q))
    );
  }, [defSearch]);

  // Filtered Scenarios
  const filteredScenarios = useMemo(() => {
    if (scenarioFilter === 'all') return IRB_WORKED_SCENARIOS;
    return IRB_WORKED_SCENARIOS.filter(s => s.category === scenarioFilter);
  }, [scenarioFilter]);

  const loadScenario = (idx: number) => {
    const sc = filteredScenarios[idx];
    if (!sc) return;
    setState(prev => ({
      ...prev,
      mode: sc.mode,
      ...sc.data
    }));
  };

  const handleToggleActivity = (act: IrbActivity) => {
    setState(prev => {
      const current = prev.activities;
      const next = current.includes(act) ? current.filter(a => a !== act) : [...current, act];
      return { ...prev, activities: next };
    });
  };

  const handleTogglePopulation = (pop: IrbPopulation) => {
    setState(prev => {
      const current = prev.population;
      const next = current.includes(pop) ? current.filter(p => p !== pop) : [...current, pop];
      return { ...prev, population: next };
    });
  };

  const handleToggleSensitivity = (sens: IrbSensitivity) => {
    setState(prev => {
      if (sens === 'none') {
        return { ...prev, sensitivity: ['none'] };
      }
      const filtered = prev.sensitivity.filter(s => s !== 'none');
      const next = filtered.includes(sens) ? filtered.filter(s => s !== sens) : [...filtered, sens];
      return { ...prev, sensitivity: next.length > 0 ? next : ['none'] };
    });
  };

  const handleSendToStudio = () => {
    if (onAppendToDraft) {
      onAppendToDraft(`\n\n### Institutional Ethics & Compliance Declaration\n${formalStatement}\n`);
      setAppendedToStudio(true);
      setTimeout(() => setAppendedToStudio(false), 3000);
    }
  };

  const badgeColor = useMemo(() => {
    switch (assessment.verdict) {
      case 'notneeded':
        return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700';
      case 'exempt':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800';
      case 'expedited':
      case 'amend_minor':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-300 dark:border-blue-800';
      case 'special':
        return 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 border-amber-300 dark:border-amber-800';
      case 'fullboard':
      case 'amend_major':
      case 'report_now':
        return 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-300 dark:border-rose-800';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300';
    }
  }, [assessment.verdict]);

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      
      {/* Banner / Header */}
      <div className="relative overflow-hidden p-6 sm:p-7 rounded-3xl bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-5 border border-blue-800/40">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="space-y-2 max-w-3xl relative z-10">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 border border-blue-400/40 flex items-center justify-center shadow-md">
              <ShieldCheck className="w-5 h-5 text-amber-300" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold font-serif tracking-tight">
              The IRB &amp; Research Ethics Sentinel
            </h2>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
              Deterministic Ethics Engine
            </span>
          </div>
          <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed font-sans">
            Prospective ethics review track triage for investigators, committee checklists (IRB/REC/HREC/IEC), and peer-review audits. 
            Calibrated against the 2018 US Common Rule (45 CFR 46), ICMR (India), TCPS 2 (Canada), NHMRC (Australia), NHC/MOST (China), CEP/CONEP (Brazil), and the Declaration of Helsinki.
          </p>
          <div className="flex items-center gap-3 pt-1 text-[11px] text-blue-200/80">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Offline &amp; Privacy-Preserving</span>
            </span>
            <span>&bull;</span>
            <a
              href="https://professorgeorge.github.io/IRB-Triage/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-300 hover:text-amber-200 hover:underline flex items-center gap-1 font-semibold transition"
            >
              <span>Open Standalone Web Portal</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        <button
          onClick={() => setState(DEFAULT_STATE)}
          className="relative z-10 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white text-xs font-semibold flex items-center gap-2 transition cursor-pointer border border-white/15 shadow-sm self-start md:self-auto shrink-0 backdrop-blur-xs"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Triage Answers</span>
        </button>
      </div>

      {/* Role / Mode Switcher */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <button
          onClick={() => setState(prev => ({ ...prev, mode: 'researcher' }))}
          className={`p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between group ${
            state.mode === 'researcher'
              ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-600 dark:border-blue-500 shadow-sm ring-1 ring-blue-500/20'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">Mode 01</span>
            <h4 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
              I&rsquo;m a Researcher
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">Determine likely review track and prepare required documents.</p>
          </div>
          <div className="mt-3 flex items-center gap-1 text-[11px] font-bold text-blue-600 dark:text-blue-400">
            <span>Prospective Triage &rarr;</span>
          </div>
        </button>

        <button
          onClick={() => setState(prev => ({ ...prev, mode: 'reviewer' }))}
          className={`p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between group ${
            state.mode === 'reviewer'
              ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-600 dark:border-blue-500 shadow-sm ring-1 ring-blue-500/20'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">Mode 02</span>
            <h4 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
              I&rsquo;m on an IRB / REC
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">Structured committee checklist and red-flag prompts.</p>
          </div>
          <div className="mt-3 flex items-center gap-1 text-[11px] font-bold text-blue-600 dark:text-blue-400">
            <span>Committee Criteria &rarr;</span>
          </div>
        </button>

        <button
          onClick={() => setState(prev => ({ ...prev, mode: 'manuscript' }))}
          className={`p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between group ${
            state.mode === 'manuscript'
              ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-600 dark:border-blue-500 shadow-sm ring-1 ring-blue-500/20'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">Mode 03</span>
            <h4 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
              Manuscript Reviewer
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">Audit ethics disclosures against ICMJE and COPE.</p>
          </div>
          <div className="mt-3 flex items-center gap-1 text-[11px] font-bold text-blue-600 dark:text-blue-400">
            <span>Desk-Audit Verification &rarr;</span>
          </div>
        </button>

        <button
          onClick={() => setState(prev => ({ ...prev, mode: 'postapproval' }))}
          className={`p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between group ${
            state.mode === 'postapproval'
              ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-600 dark:border-blue-500 shadow-sm ring-1 ring-blue-500/20'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">Mode 04</span>
            <h4 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
              Study Approved / Active
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">Assess amendments, adverse events, or breaches.</p>
          </div>
          <div className="mt-3 flex items-center gap-1 text-[11px] font-bold text-blue-600 dark:text-blue-400">
            <span>Post-Approval Action &rarr;</span>
          </div>
        </button>
      </div>

      {/* Main Grid: Triage Form (Left) & Live Verdict Verdict / Statements (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Questionnaire (7 cols) */}
        <div className="lg:col-span-7 space-y-6">

          {/* Worked Scenarios Quick-Pick */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-700" />
                <span>Load Exemplar Worked Scenario:</span>
              </span>
              <div className="flex items-center gap-1 text-[11px]">
                {['all', 'behavioural', 'healthcare', 'ai', 'global', 'post'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setScenarioFilter(cat)}
                    className={`px-2 py-0.5 rounded-lg capitalize transition cursor-pointer ${
                      scenarioFilter === cat
                        ? 'bg-blue-900 text-white font-bold'
                        : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {filteredScenarios.slice(0, 4).map((sc, idx) => (
                <button
                  key={idx}
                  onClick={() => loadScenario(idx)}
                  className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60 hover:bg-blue-50/60 dark:hover:bg-blue-950/40 text-left transition cursor-pointer"
                >
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{sc.title}</div>
                  <div className="text-[10px] text-slate-500 line-clamp-1">{sc.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Form Questions */}
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-6">

            {/* Jurisdiction Selector */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Q1. Primary Jurisdiction &amp; Regulatory Framework
                </label>
                <span className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">8 Global Frameworks</span>
              </div>
              <select
                value={state.jurisdiction}
                onChange={e => setState(prev => ({ ...prev, jurisdiction: e.target.value as IrbJurisdiction }))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="us">United States — Common Rule (45 CFR 46), FDA 21 CFR 50/56</option>
                <option value="uk">United Kingdom — HRA, NHS RECs, University RECs</option>
                <option value="eu">European Union — Member State Frameworks &amp; GDPR Art. 9</option>
                <option value="ca">Canada — Tri-Council Policy Statement (TCPS 2, 2022) / REBs</option>
                <option value="au">Australia — NHMRC National Statement / HRECs</option>
                <option value="in">India — ICMR Ethical Guidelines (2017), IECs / DHR Naitik</option>
                <option value="cn">China — NHC Measures (2023) &amp; MOST Trial Measures (Dec 2023)</option>
                <option value="br">Brazil — CEP/CONEP, Plataforma Brasil, Lei 14.874/2024</option>
                <option value="multi">Multiple Countries (Cross-Border Consortium)</option>
                <option value="other">Other / International Baseline (Helsinki, CIOMS)</option>
              </select>
            </div>

            {state.mode !== 'postapproval' ? (
              <>
                {/* Q2. Purpose */}
                <div className="space-y-2.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
                    Q2. Primary Purpose of the Work
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {[
                      { id: 'research', label: 'Generalizable Knowledge / Research', desc: 'Publication, conference, or academic thesis' },
                      { id: 'qi', label: 'Internal Quality Improvement (QI)', desc: 'Single-site workflow or clinical enhancement' },
                      { id: 'classroom', label: 'Classroom / Coursework Assignment', desc: 'Pedagogical grading without external dissemination' },
                      { id: 'journalism', label: 'Journalism / Oral History / Biography', desc: 'Explicitly excluded from Common Rule research scope' },
                      { id: 'evaluation', label: 'Program Evaluation', desc: 'Internal agency assessment (borderline determination)' },
                      { id: 'mixed', label: 'Mixed or Uncertain Intent', desc: 'Safe recommendation: obtain formal NHSR letter' }
                    ].map(item => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setState(prev => ({ ...prev, purpose: item.id as any }))}
                        className={`p-3 rounded-2xl border text-left transition-all duration-150 cursor-pointer active:scale-[0.99] ${
                          state.purpose === item.id
                            ? 'bg-blue-50/90 dark:bg-blue-950/70 border-blue-600 dark:border-blue-500 text-blue-900 dark:text-blue-100 font-bold ring-2 ring-blue-500/20 shadow-xs'
                            : 'bg-slate-50/60 dark:bg-slate-950/60 border-slate-200/90 dark:border-slate-800/90 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-100/70 dark:hover:bg-slate-800/60 hover:shadow-xs'
                        }`}
                      >
                        <div className="font-semibold flex items-center justify-between">
                          <span>{item.label}</span>
                          {state.purpose === item.id && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />}
                        </div>
                        <div className="text-[10px] text-slate-500 font-normal mt-0.5">{item.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Q3. Data Source */}
                <div className="space-y-2.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
                    Q3. Data Source &amp; Human Interaction
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {[
                      { id: 'primary', label: 'New Data from Humans', desc: 'Direct interaction, interviews, surveys, experiments' },
                      { id: 'existing', label: 'Existing Secondary Data', desc: 'Archived records, EHR, social media datasets' },
                      { id: 'both', label: 'Both Primary & Secondary Data', desc: 'Mixed data sources; strictest rule governs' },
                      { id: 'nohumans', label: 'No Humans Involved', desc: 'Literature review, simulations, animal (IACUC)' }
                    ].map(item => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setState(prev => ({ ...prev, dataSource: item.id as any }))}
                        className={`p-3 rounded-2xl border text-left transition-all duration-150 cursor-pointer active:scale-[0.99] ${
                          state.dataSource === item.id
                            ? 'bg-blue-50/90 dark:bg-blue-950/70 border-blue-600 dark:border-blue-500 text-blue-900 dark:text-blue-100 font-bold ring-2 ring-blue-500/20 shadow-xs'
                            : 'bg-slate-50/60 dark:bg-slate-950/60 border-slate-200/90 dark:border-slate-800/90 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-100/70 dark:hover:bg-slate-800/60 hover:shadow-xs'
                        }`}
                      >
                        <div className="font-semibold flex items-center justify-between">
                          <span>{item.label}</span>
                          {state.dataSource === item.id && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />}
                        </div>
                        <div className="text-[10px] text-slate-500 font-normal mt-0.5">{item.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Q4. Activities Involved */}
                <div className="space-y-2.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
                    Q4. Research Activities Involved (Select All That Apply)
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                    {[
                      { id: 'survey', label: 'Surveys / Questionnaires' },
                      { id: 'interview', label: 'Interviews / Focus Groups' },
                      { id: 'observation_public', label: 'Public Observation' },
                      { id: 'observation_intervene', label: 'Interventional Observation' },
                      { id: 'experiment', label: 'Behavioral Experiment' },
                      { id: 'recording', label: 'Audio / Video Recording' },
                      { id: 'online_data', label: 'Online / Social Media Data' },
                      { id: 'ai_subject', label: 'AI as Tool / Intervention', tag: 'Emerging' },
                      { id: 'ai_training', label: 'Training AI on Human Data', tag: 'Emerging' },
                      { id: 'deception', label: 'Deception / Debriefing Plan', tag: 'Flag' },
                      { id: 'biomedical', label: 'Biomedical / Clinical Trial', tag: 'High Risk' },
                      { id: 'biospecimens', label: 'Biospecimens / Biobank', tag: 'High Risk' }
                    ].map(item => {
                      const selected = state.activities.includes(item.id as IrbActivity);
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleToggleActivity(item.id as IrbActivity)}
                          className={`p-2.5 rounded-2xl border text-left transition-all duration-150 cursor-pointer flex flex-col justify-between active:scale-[0.99] ${
                            selected
                              ? 'bg-blue-50/90 dark:bg-blue-950/70 border-blue-600 dark:border-blue-500 text-blue-900 dark:text-blue-100 font-bold ring-2 ring-blue-500/20 shadow-xs'
                              : 'bg-slate-50/60 dark:bg-slate-950/60 border-slate-200/90 dark:border-slate-800/90 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-100/70 dark:hover:bg-slate-800/60 hover:shadow-xs'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-xs">{item.label}</span>
                            {item.tag && (
                              <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold uppercase shrink-0 ${
                                item.tag === 'High Risk' || item.tag === 'Flag'
                                  ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                  : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                              }`}>
                                {item.tag}
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Q5. Population */}
                <div className="space-y-2.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
                    Q5. Population &amp; Vulnerability Safeguards (Select All)
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                    {[
                      { id: 'general', label: 'General Adult (18+)' },
                      { id: 'minors', label: 'Minors (<18) [Assent+Parent]', tag: 'Vulnerable' },
                      { id: 'pregnant', label: 'Pregnant / Neonates', tag: 'Vulnerable' },
                      { id: 'prisoners', label: 'Prisoners / Incarcerated', tag: 'Strict' },
                      { id: 'cognitive', label: 'Diminished Capacity', tag: 'Vulnerable' },
                      { id: 'own_students', label: 'Own Students / Employees', tag: 'Power' },
                      { id: 'patients', label: 'Clinical Patients', tag: 'Power' },
                      { id: 'indigenous', label: 'Indigenous Peoples', tag: 'TCPS2 Ch9' },
                      { id: 'refugees', label: 'Refugees / Undocumented', tag: 'Vulnerable' },
                      { id: 'critically_ill', label: 'Critically / Terminally Ill', tag: 'Vulnerable' },
                      { id: 'lowresource', label: 'Low-Resource / Low-Literacy', tag: 'Justice' }
                    ].map(item => {
                      const selected = state.population.includes(item.id as IrbPopulation);
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleTogglePopulation(item.id as IrbPopulation)}
                          className={`p-2.5 rounded-2xl border text-left transition-all duration-150 cursor-pointer flex flex-col justify-between active:scale-[0.99] ${
                            selected
                              ? 'bg-blue-50/90 dark:bg-blue-950/70 border-blue-600 dark:border-blue-500 text-blue-900 dark:text-blue-100 font-bold ring-2 ring-blue-500/20 shadow-xs'
                              : 'bg-slate-50/60 dark:bg-slate-950/60 border-slate-200/90 dark:border-slate-800/90 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-100/70 dark:hover:bg-slate-800/60 hover:shadow-xs'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-xs">{item.label}</span>
                            {item.tag && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded-full font-bold uppercase bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 shrink-0">
                                {item.tag}
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Q6. Identifiability */}
                <div className="space-y-2.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
                    Q6. Data Identifiability &amp; Key Custody
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                    {[
                      { id: 'anonymous', label: 'Anonymous from Collection', desc: 'No identifiers recorded ever' },
                      { id: 'public', label: 'Publicly Available Data', desc: 'No expectation of privacy' },
                      { id: 'coded', label: 'Coded with Key', desc: 'Linkage key kept separately' },
                      { id: 'deidentified', label: 'De-Identified (Key Destroyed)', desc: 'Residual re-identification risk' },
                      { id: 'indirect', label: 'Indirect Identifiers Only', desc: 'Demographics that could link' },
                      { id: 'direct', label: 'Direct Identifiers Retained', desc: 'Names, emails, medical IDs, photos' }
                    ].map(item => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setState(prev => ({ ...prev, identifiability: item.id as any }))}
                        className={`p-2.5 rounded-2xl border text-left transition-all duration-150 cursor-pointer active:scale-[0.99] ${
                          state.identifiability === item.id
                            ? 'bg-blue-50/90 dark:bg-blue-950/70 border-blue-600 dark:border-blue-500 text-blue-900 dark:text-blue-100 font-bold ring-2 ring-blue-500/20 shadow-xs'
                            : 'bg-slate-50/60 dark:bg-slate-950/60 border-slate-200/90 dark:border-slate-800/90 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-100/70 dark:hover:bg-slate-800/60 hover:shadow-xs'
                        }`}
                      >
                        <div className="font-semibold text-xs flex items-center justify-between">
                          <span>{item.label}</span>
                          {state.identifiability === item.id && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />}
                        </div>
                        <div className="text-[10px] text-slate-500 font-normal mt-0.5">{item.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Q7. Topic Sensitivity */}
                <div className="space-y-2.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
                    Q7. Topic Sensitivity (Select All)
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    {[
                      { id: 'none', label: 'None Apply' },
                      { id: 'mental_health', label: 'Mental Health / Trauma' },
                      { id: 'illegal', label: 'Illegal Activities' },
                      { id: 'substance', label: 'Substance / Drug Use' },
                      { id: 'sexuality', label: 'Sexual Practices' },
                      { id: 'immigration', label: 'Immigration / Legal' },
                      { id: 'stigmatized_health', label: 'Stigmatized Disease' },
                      { id: 'genetic', label: 'Genetic / Hereditary' }
                    ].map(item => {
                      const selected = state.sensitivity.includes(item.id as IrbSensitivity);
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleToggleSensitivity(item.id as IrbSensitivity)}
                          className={`p-2.5 rounded-2xl border text-left transition-all duration-150 cursor-pointer active:scale-[0.99] ${
                            selected
                              ? 'bg-blue-50/90 dark:bg-blue-950/70 border-blue-600 dark:border-blue-500 text-blue-900 dark:text-blue-100 font-bold ring-2 ring-blue-500/20 shadow-xs'
                              : 'bg-slate-50/60 dark:bg-slate-950/60 border-slate-200/90 dark:border-slate-800/90 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-100/70 dark:hover:bg-slate-800/60 hover:shadow-xs'
                          }`}
                        >
                          <span className="text-xs">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Q8. Risk Magnitude */}
                <div className="space-y-2.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
                    Q8. Participant Risk Magnitude
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    {[
                      { id: 'minimal', label: 'Minimal Risk', desc: 'No greater than everyday life' },
                      { id: 'slightly_above', label: 'Slightly Above Minimal', desc: 'Mild fatigue or stress' },
                      { id: 'greater', label: 'Greater Than Minimal', desc: 'Psychological or legal risk' },
                      { id: 'substantial', label: 'Substantial Risk', desc: 'Clinical drug trial or surgery' }
                    ].map(item => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setState(prev => ({ ...prev, risk: item.id as any }))}
                        className={`p-2.5 rounded-2xl border text-left transition-all duration-150 cursor-pointer active:scale-[0.99] ${
                          state.risk === item.id
                            ? 'bg-blue-50/90 dark:bg-blue-950/70 border-blue-600 dark:border-blue-500 text-blue-900 dark:text-blue-100 font-bold ring-2 ring-blue-500/20 shadow-xs'
                            : 'bg-slate-50/60 dark:bg-slate-950/60 border-slate-200/90 dark:border-slate-800/90 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-100/70 dark:hover:bg-slate-800/60 hover:shadow-xs'
                        }`}
                      >
                        <div className="font-semibold text-xs flex items-center justify-between">
                          <span>{item.label}</span>
                          {state.risk === item.id && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />}
                        </div>
                        <div className="text-[10px] text-slate-500 font-normal mt-0.5">{item.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              /* Post-Approval Questions */
              <div className="space-y-6">
                <div className="space-y-2.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
                    P1. What Kind of Event or Protocol Modification Occurred?
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {[
                      { id: 'protocol_minor', label: 'Minor Protocol Change', desc: 'Clarifications, typographical corrections, contact info' },
                      { id: 'protocol_major', label: 'Substantive Protocol Change', desc: 'New procedure, new study site, expanded sample size' },
                      { id: 'consent', label: 'Consent Form Revision', desc: 'New risks disclosed, changed compensation or procedures' },
                      { id: 'adverse_event', label: 'Adverse Event in Participant', desc: 'Physical injury, severe psychological trauma, hospital stay' },
                      { id: 'breach', label: 'Confidentiality or Data Breach', desc: 'Stolen device, misdirected participant record export' },
                      { id: 'protocol_deviation', label: 'Protocol Deviation', desc: 'Procedure departed from approved protocol' },
                      { id: 'new_population', label: 'Adding New Vulnerable Group', desc: 'Expanding recruitment to minors, prisoners, or ICU' },
                      { id: 'continuing', label: 'Continuing Review Approaching', desc: 'Annual renewal package due' }
                    ].map(item => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setState(prev => ({ ...prev, changeType: item.id as IrbChangeType }))}
                        className={`p-3 rounded-2xl border text-left transition-all duration-150 cursor-pointer active:scale-[0.99] ${
                          state.changeType === item.id
                            ? 'bg-blue-50/90 dark:bg-blue-950/70 border-blue-600 dark:border-blue-500 text-blue-900 dark:text-blue-100 font-bold ring-2 ring-blue-500/20 shadow-xs'
                            : 'bg-slate-50/60 dark:bg-slate-950/60 border-slate-200/90 dark:border-slate-800/90 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-100/70 dark:hover:bg-slate-800/60 hover:shadow-xs'
                        }`}
                      >
                        <div className="font-semibold flex items-center justify-between">
                          <span>{item.label}</span>
                          {state.changeType === item.id && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />}
                        </div>
                        <div className="text-[10px] text-slate-500 font-normal mt-0.5">{item.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
                    P2. Has the Change Been Implemented Yet?
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                    {[
                      { id: 'planned', label: 'Not Yet (Planned)', desc: 'Proper protocol: submitting for prior approval' },
                      { id: 'emergency', label: 'Yes (Emergency Hazard)', desc: 'Implemented solely to eliminate immediate participant harm' },
                      { id: 'already', label: 'Yes (Non-Emergency)', desc: 'Protocol deviation: implemented prior to approval' }
                    ].map(item => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setState(prev => ({ ...prev, changeStatus: item.id as IrbChangeStatus }))}
                        className={`p-3 rounded-2xl border text-left transition-all duration-150 cursor-pointer active:scale-[0.99] ${
                          state.changeStatus === item.id
                            ? 'bg-blue-50/90 dark:bg-blue-950/70 border-blue-600 dark:border-blue-500 text-blue-900 dark:text-blue-100 font-bold ring-2 ring-blue-500/20 shadow-xs'
                            : 'bg-slate-50/60 dark:bg-slate-950/60 border-slate-200/90 dark:border-slate-800/90 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-100/70 dark:hover:bg-slate-800/60 hover:shadow-xs'
                        }`}
                      >
                        <div className="font-semibold flex items-center justify-between">
                          <span>{item.label}</span>
                          {state.changeStatus === item.id && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />}
                        </div>
                        <div className="text-[10px] text-slate-500 font-normal mt-0.5">{item.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
                    P3. Does the Modification Impact Risk to Participants?
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    {[
                      { id: 'none', label: 'No Risk Impact', desc: 'Purely clerical / contact' },
                      { id: 'reduces', label: 'Reduces Risk', desc: 'Removed invasive step' },
                      { id: 'adds_minor', label: 'Adds Minor Risk', desc: 'Brief additional questionnaire' },
                      { id: 'adds_major', label: 'Materially Adds Risk', desc: 'New procedure or drug' }
                    ].map(item => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setState(prev => ({ ...prev, changeRisk: item.id as IrbChangeRisk }))}
                        className={`p-2.5 rounded-2xl border text-left transition-all duration-150 cursor-pointer active:scale-[0.99] ${
                          state.changeRisk === item.id
                            ? 'bg-blue-50/90 dark:bg-blue-950/70 border-blue-600 dark:border-blue-500 text-blue-900 dark:text-blue-100 font-bold ring-2 ring-blue-500/20 shadow-xs'
                            : 'bg-slate-50/60 dark:bg-slate-950/60 border-slate-200/90 dark:border-slate-800/90 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-100/70 dark:hover:bg-slate-800/60 hover:shadow-xs'
                        }`}
                      >
                        <div className="font-semibold text-xs flex items-center justify-between">
                          <span>{item.label}</span>
                          {state.changeRisk === item.id && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />}
                        </div>
                        <div className="text-[10px] text-slate-500 font-normal mt-0.5">{item.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Common Deficiencies Database */}
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold font-serif text-slate-900 dark:text-white flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <span>Common Deficiencies &amp; Desk-Rejection Traps</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Issues that most frequently trigger revisions, ethics committee queries, or journal desk-rejections.
                </p>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter deficiencies (AI, consent...)"
                  value={defSearch}
                  onChange={e => setDefSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2.5 max-h-72 overflow-y-auto pr-1">
              {filteredDeficiencies.map((def, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-2xl bg-slate-50/70 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800/80 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-bold text-slate-900 dark:text-white">{def.title}</h5>
                    <div className="flex items-center gap-1">
                      {def.tags.slice(0, 2).map((t, tidx) => (
                        <span key={tidx} className="text-[9px] px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono">
                          #{t}
                        </span>
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{def.body}</p>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column: Live Verdict & Ethics Statement Generator (5 cols) */}
        <div className="lg:col-span-5 space-y-6">

          {/* Live Verdict Card */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/90 dark:border-slate-800/90 space-y-4 shadow-lg sticky top-4 ring-1 ring-slate-900/5 dark:ring-white/5">
            
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400" />
                <span>Deterministic Verdict</span>
              </span>
              <span className={`text-xs font-bold px-3 py-1 rounded-full border uppercase tracking-wider shadow-xs ${badgeColor}`}>
                {assessment.verdict.replace('_', ' ')}
              </span>
            </div>

            <div className="space-y-1.5">
              <h3 className="text-base font-bold font-serif text-slate-900 dark:text-white leading-snug">
                {assessment.headline}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {assessment.sub}
              </p>
            </div>

            {/* Submission Audit Meter */}
            <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-950/80 border border-slate-200/80 dark:border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>Triage Readiness Score</span>
                </span>
                <span className="text-blue-700 dark:text-blue-400 font-mono text-[11px] font-bold">
                  {audit.passed} of {audit.total} Checked
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500 transition-all duration-500"
                  style={{ width: `${(audit.passed / audit.total) * 100}%` }}
                />
              </div>
            </div>

            {/* Escalations / Flags */}
            {assessment.flags.length > 0 && (
              <div className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Escalating Considerations:</span>
                </span>
                <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                  {assessment.flags.map((f, fidx) => (
                    <li key={fidx} className="flex items-start gap-2 bg-rose-50/60 dark:bg-rose-950/30 p-2 rounded-xl border border-rose-100 dark:border-rose-900/40">
                      <span className="text-rose-600 font-bold shrink-0">&bull;</span>
                      <span className="leading-snug">{f.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Reasons */}
            {assessment.reasons.length > 0 && (
              <div className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Factors Shaping This Verdict:
                </span>
                <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                  {assessment.reasons.map((r, ridx) => (
                    <li key={ridx} className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span className="leading-snug">{r.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Required Submission Documents */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400" />
                <span>Documents You Will Likely Need:</span>
              </span>
              <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
                {requiredDocs.slice(0, 5).map((doc, didx) => (
                  <li key={didx} className="flex items-start gap-1.5">
                    <span className="text-blue-500 font-bold shrink-0">&bull;</span>
                    <span className="leading-snug">{doc}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Jurisdiction Specific Statutory Notes */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Jurisdiction Statutory Guidelines:</span>
              </span>
              <ul className="space-y-1 text-[11px] text-slate-600 dark:text-slate-400">
                {jurisdictionNotes.slice(0, 2).map((note, nidx) => (
                  <li key={nidx} className="flex items-start gap-1.5">
                    <span className="text-indigo-500 font-bold shrink-0">&bull;</span>
                    <span className="leading-snug">{note}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Formal Ethics Declaration Generator */}
            <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/90 dark:border-blue-900/90 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900 dark:text-blue-200">
                  <ShieldCheck className="w-4 h-4 text-blue-700 dark:text-blue-400" />
                  <span>Formal Ethics Statement Generator</span>
                </div>
                <button
                  onClick={() => handleCopy(formalStatement, 'statement')}
                  className="text-[11px] font-bold text-blue-700 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer transition active:scale-95"
                >
                  {copiedKey === 'statement' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'statement' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block mb-1">Institution Body:</label>
                  <input
                    type="text"
                    value={institutionName}
                    onChange={e => setInstitutionName(e.target.value)}
                    placeholder="e.g. Institutional Review Board / Research Ethics Committee"
                    className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block mb-1">Protocol / Approval Ref:</label>
                  <input
                    type="text"
                    value={protocolId}
                    onChange={e => setProtocolId(e.target.value)}
                    placeholder="e.g. IRB-2026-EXP-418"
                    className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  />
                </div>
              </div>

              <div className="relative p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-serif italic shadow-inner">
                <Quote className="w-4 h-4 text-blue-400/30 absolute top-2 right-2 pointer-events-none" />
                &ldquo;{formalStatement}&rdquo;
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={handleSendToStudio}
                  className="flex-1 px-3 py-2 rounded-xl bg-blue-900 hover:bg-blue-800 active:scale-[0.98] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{appendedToStudio ? 'Appended to Active Studio Draft!' : 'Send Declaration to Studio'}</span>
                </button>
                {onNavigateToStudio && (
                  <button
                    onClick={onNavigateToStudio}
                    className="px-3 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 active:scale-[0.98] text-slate-700 dark:text-slate-300 font-bold text-xs transition cursor-pointer"
                  >
                    View Studio
                  </button>
                )}
              </div>
            </div>

          </div>

          {/* Reference Shelf */}
          <div className="p-4 rounded-3xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-blue-700" />
              <span>Foundational Regulatory Reference Shelf</span>
            </span>
            <div className="grid grid-cols-1 gap-2 text-xs">
              {IRB_FOUNDATIONAL_DOCUMENTS.slice(0, 4).map((doc, idx) => (
                <div key={idx} className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white">
                    <span>{doc.name}</span>
                    <span className="text-[10px] text-blue-600 dark:text-blue-400 font-mono">{doc.cite}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{doc.body}</p>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
