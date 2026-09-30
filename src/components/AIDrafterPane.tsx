import React, { useState } from 'react';
import { 
  Bot, 
  Sparkles, 
  Cpu, 
  Settings2, 
  ArrowRight, 
  Loader2, 
  FileText, 
  AlertCircle,
  Key,
  CheckCircle2,
  Activity
} from 'lucide-react';
import { 
  ACADEMIC_PROMPT_TEMPLATES, 
  DEFAULT_LLM_CONFIG, 
  generateArticleWithLLM, 
  testLLMConnection,
  type LLMConfig 
} from '../services/llmService';

interface AIDrafterPaneProps {
  onDraftGenerated: (draftText: string, autoGround: boolean) => void;
  isGrounding: boolean;
}

export const AIDrafterPane: React.FC<AIDrafterPaneProps> = ({
  onDraftGenerated,
  isGrounding,
}) => {
  const [topic, setTopic] = useState('');
  const [focus, setFocus] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState(ACADEMIC_PROMPT_TEMPLATES[0].id);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [showConfigModal, setShowConfigModal] = useState(false);
  const [llmConfig, setLlmConfig] = useState<LLMConfig>(() => {
    const saved = localStorage.getItem('citation_filler_llm_config');
    return saved ? JSON.parse(saved) : DEFAULT_LLM_CONFIG;
  });

  // Test connection state
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success?: boolean;
    message?: string;
    latencyMs?: number;
    availableModels?: string[];
  } | null>(null);

  const handleSaveConfig = (newConfig: LLMConfig) => {
    setLlmConfig(newConfig);
    localStorage.setItem('citation_filler_llm_config', JSON.stringify(newConfig));
    setShowConfigModal(false);
    setTestResult(null);
  };

  const handleRunTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await testLLMConnection(llmConfig);
      setTestResult(res);
      if (res.availableModels && res.availableModels.length > 0 && !llmConfig.model) {
        setLlmConfig((prev) => ({ ...prev, model: res.availableModels![0] }));
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Connection test failed.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleGenerate = async (autoGroundAfter = false) => {
    if (!topic.trim()) {
      setErrorMsg('Please enter a research topic or thesis.');
      return;
    }

    setErrorMsg('');
    setIsGenerating(true);

    try {
      const draft = await generateArticleWithLLM(topic, focus, selectedTemplateId, llmConfig);
      onDraftGenerated(draft, autoGroundAfter);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to generate academic draft.');
    } finally {
      setIsGenerating(false);
    }
  };

  const quickTopics = [
    { title: 'AI in Medical Imaging & Radiology', focus: 'Diagnostic sensitivity, pulmonary nodules, and false positives' },
    { title: 'Microplastics in Marine Food Webs', focus: 'Trophic transfer, persistent organic pollutants, and aquatic toxicity' },
    { title: 'Long-Duration Flow Battery Grid Storage', focus: 'Vanadium redox, grid frequency inertia, and solar intermittency' },
    { title: 'Sleep Architecture & Memory Consolidation', focus: 'Slow-wave sleep, hippocampal-neocortical transfer, and synaptic scaling' },
  ];

  return (
    <div className="academic-card rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-7 space-y-6 shadow-xs">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-900 dark:bg-blue-800 flex items-center justify-center text-white shadow-xs">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white font-serif">
                AI Scholarly Manuscript Generator
              </h2>
              <span className="text-xs px-2.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-900 dark:text-blue-300 font-semibold border border-blue-200 dark:border-blue-800">
                Factual Prose Only
              </span>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 font-sans">
              Drafts substantive scientific prose and cross-references empirical assertions with verified peer-reviewed literature.
            </p>
          </div>
        </div>

        {/* LLM Connection Badge / Settings */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setTestResult(null);
              setShowConfigModal(true);
            }}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-sm font-medium border border-slate-300 dark:border-slate-700 transition cursor-pointer"
          >
            <Cpu className="w-4 h-4 text-blue-800 dark:text-blue-400" />
            <span>LLM Engine: <strong>{llmConfig.provider.toUpperCase()}</strong></span>
            <Settings2 className="w-3.5 h-3.5 text-slate-500 ml-1" />
          </button>
        </div>
      </div>

      {/* Input Section */}
      <div className="space-y-5">
        
        {/* Template Selector */}
        <div>
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2 uppercase tracking-wider">
            Academic Document Type:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {ACADEMIC_PROMPT_TEMPLATES.map((tmpl) => (
              <button
                key={tmpl.id}
                onClick={() => setSelectedTemplateId(tmpl.id)}
                className={`p-4 rounded-xl text-left border transition cursor-pointer ${
                  selectedTemplateId === tmpl.id
                    ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-700 dark:border-blue-500 text-slate-900 dark:text-white ring-1 ring-blue-700/30'
                    : 'bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-900 hover:border-slate-300'
                }`}
              >
                <div className="text-sm font-bold text-slate-900 dark:text-slate-100 font-serif">{tmpl.name}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{tmpl.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Topic Input */}
        <div>
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2 uppercase tracking-wider">
            Research Topic / Thesis Statement:
          </label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. Clinical diagnostic accuracy of deep learning in early-stage oncology screening..."
            className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-base text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-700 focus:ring-1 focus:ring-blue-700 transition"
          />

          {/* Quick Topic Pills */}
          <div className="flex flex-wrap items-center gap-2 mt-2.5">
            <span className="text-xs text-slate-500 font-medium">Sample Research Topics:</span>
            {quickTopics.map((qt, i) => (
              <button
                key={i}
                onClick={() => {
                  setTopic(qt.title);
                  setFocus(qt.focus);
                }}
                className="text-xs px-2.5 py-1 rounded-md bg-slate-100 hover:bg-blue-50 dark:bg-slate-800 dark:hover:bg-blue-950/60 text-slate-700 hover:text-blue-900 dark:text-slate-300 dark:hover:text-blue-300 border border-slate-200 dark:border-slate-700 transition cursor-pointer"
              >
                {qt.title.split('&')[0].trim()}
              </button>
            ))}
          </div>
        </div>

        {/* Optional Focus Area */}
        <div>
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2 uppercase tracking-wider">
            Specific Empirical Markers & Focus Areas (Optional):
          </label>
          <input
            type="text"
            value={focus}
            onChange={(e) => setFocus(e.target.value)}
            placeholder="e.g. Specific quantitative metrics, randomized clinical trials, physiological mechanisms, or grid stability metrics"
            className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-700 focus:ring-1 focus:ring-blue-700 transition"
          />
        </div>

        {/* Error message if any */}
        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-300 flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

      </div>

      {/* Action Buttons */}
      <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-700 dark:text-blue-400" />
          <span>LLM assists drafting • OpenAlex &amp; Crossref cross-reference authentic DOIs</span>
        </div>

        <div className="flex items-center gap-3">
          {/* Action 1: Draft only */}
          <button
            onClick={() => handleGenerate(false)}
            disabled={isGenerating || !topic.trim()}
            className="px-4 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-sm font-semibold flex items-center gap-2 transition disabled:opacity-50 cursor-pointer border border-slate-300 dark:border-slate-700"
          >
            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin text-blue-700" /> : <FileText className="w-4 h-4 text-blue-700 dark:text-blue-400" />}
            <span>Draft Text Only</span>
          </button>

          {/* Action 2: Draft & Ground with Real Citations */}
          <button
            onClick={() => handleGenerate(true)}
            disabled={isGenerating || isGrounding || !topic.trim()}
            className="btn-academic-primary px-6 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2.5 disabled:opacity-50 cursor-pointer shadow-xs"
          >
            {isGenerating || isGrounding ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>{isGenerating ? 'Writing Draft with LLM...' : 'Hunting Real Peer-Reviewed Citations...'}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Draft & Ground with Real Citations</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* LLM Config Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <Cpu className="w-5 h-5 text-blue-800 dark:text-blue-400" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white font-serif">LLM Engine Configuration</h3>
              </div>
              <button
                onClick={() => setShowConfigModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">Provider:</label>
                <select
                  value={llmConfig.provider}
                  onChange={(e) => {
                    setLlmConfig({ ...llmConfig, provider: e.target.value as any });
                    setTestResult(null);
                  }}
                  className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-sm"
                >
                  <option value="builtin">Built-in Academic Generator (Instant, Free, No Setup)</option>
                  <option value="ollama">Local Ollama (http://localhost:11434 - Llama 3, Mistral, DeepSeek)</option>
                  <option value="groq">Groq Cloud (Super fast - Llama 3.3 70B)</option>
                  <option value="openai">OpenAI (GPT-4o / GPT-4o-mini)</option>
                  <option value="openrouter">OpenRouter (Any open model)</option>
                  <option value="deepseek">DeepSeek API (DeepSeek-V3 / R1)</option>
                  <option value="custom">Custom Local / Server Endpoint (LM Studio / vLLM)</option>
                </select>
              </div>

              {llmConfig.provider === 'ollama' && (
                <div>
                  <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">Ollama Base URL:</label>
                  <input
                    type="text"
                    value={llmConfig.baseUrl || 'http://localhost:11434'}
                    onChange={(e) => setLlmConfig({ ...llmConfig, baseUrl: e.target.value })}
                    placeholder="http://localhost:11434"
                    className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm"
                  />
                  <span className="text-xs text-slate-500 block mt-1">Ensure Ollama is running locally (<code>ollama serve</code>).</span>
                </div>
              )}

              {['openai', 'groq', 'openrouter', 'deepseek'].includes(llmConfig.provider) && (
                <div>
                  <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">API Key:</label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="password"
                      value={llmConfig.apiKey || ''}
                      onChange={(e) => setLlmConfig({ ...llmConfig, apiKey: e.target.value })}
                      placeholder={`Enter your ${llmConfig.provider.toUpperCase()} API Key`}
                      className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-xs"
                    />
                  </div>
                  <span className="text-xs text-slate-500 block mt-1">Saved securely in your local browser storage.</span>
                </div>
              )}

              {llmConfig.provider !== 'builtin' && (
                <div>
                  <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">Model Name (Optional):</label>
                  <input
                    type="text"
                    value={llmConfig.model || ''}
                    onChange={(e) => setLlmConfig({ ...llmConfig, model: e.target.value })}
                    placeholder={llmConfig.provider === 'ollama' ? 'llama3:latest' : 'Default model'}
                    className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm"
                  />
                </div>
              )}

              {/* Diagnostic Test Result Box */}
              {testResult && (
                <div
                  className={`p-3.5 rounded-xl border text-xs leading-relaxed transition-all ${
                    testResult.success
                      ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                      : 'bg-rose-50 dark:bg-rose-950/50 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {testResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 space-y-1">
                      <div className="font-semibold">
                        {testResult.success ? 'Connection Verified' : 'Connection Failed'}
                      </div>
                      <div className="font-sans text-[11px] opacity-90">{testResult.message}</div>
                      {testResult.availableModels && testResult.availableModels.length > 0 && (
                        <div className="pt-1 text-[11px]">
                          <strong>Available Models:</strong> {testResult.availableModels.join(', ')}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2.5">
              {/* Test Connection Button */}
              <button
                type="button"
                onClick={handleRunTest}
                disabled={isTesting}
                className="px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-blue-900 dark:text-blue-300 text-xs font-semibold flex items-center gap-1.5 transition border border-slate-300 dark:border-slate-700 cursor-pointer disabled:opacity-50"
              >
                {isTesting ? <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-700" /> : <Activity className="w-3.5 h-3.5 text-blue-700" />}
                <span>{isTesting ? 'Testing Connection...' : 'Test Connection'}</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowConfigModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleSaveConfig(llmConfig)}
                  className="btn-academic-primary px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer shadow-xs"
                >
                  Save Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
