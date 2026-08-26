import React, { useState } from 'react';
import { 
  X, 
  Cpu, 
  ShieldCheck, 
  BookOpen, 
  SlidersHorizontal, 
  Key, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Layers
} from 'lucide-react';
import type { CitationOptions } from '../types/citation';
import { CITATION_STYLES } from '../services/citationFormatter';
import { testLLMConnection, type LLMConfig } from '../services/llmService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  options: CitationOptions;
  setOptions: React.Dispatch<React.SetStateAction<CitationOptions>>;
  llmConfig: LLMConfig;
  setLlmConfig: (config: LLMConfig) => void;
  sensitivity: 'all' | 'moderate' | 'high';
  setSensitivity: (s: 'all' | 'moderate' | 'high') => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  options,
  setOptions,
  llmConfig,
  setLlmConfig,
  sensitivity,
  setSensitivity,
}) => {
  const [activeTab, setActiveTab] = useState<'llm' | 'quality' | 'citation' | 'claims'>('llm');
  const [tempLLMConfig, setTempLLMConfig] = useState<LLMConfig>(llmConfig);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success?: boolean;
    message?: string;
    latencyMs?: number;
    availableModels?: string[];
  } | null>(null);

  if (!isOpen) return null;

  const handleRunTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await testLLMConnection(tempLLMConfig);
      setTestResult(res);
      if (res.availableModels && res.availableModels.length > 0 && !tempLLMConfig.model) {
        setTempLLMConfig((prev) => ({ ...prev, model: res.availableModels![0] }));
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

  const handleSaveAll = () => {
    setLlmConfig(tempLLMConfig);
    localStorage.setItem('citation_filler_llm_config', JSON.stringify(tempLLMConfig));
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-blue-900 text-white shadow-xs">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white font-serif">
                Master Studio Settings
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Consolidated configuration for LLM synthesis, quality filters, and citation rules
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

        {/* Tab Navigation */}
        <div className="px-6 pt-3 bg-slate-50/70 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 flex gap-2 overflow-x-auto text-xs">
          <button
            onClick={() => setActiveTab('llm')}
            className={`px-4 py-2.5 rounded-t-lg font-bold flex items-center gap-2 border-b-2 transition cursor-pointer ${
              activeTab === 'llm'
                ? 'border-blue-800 text-blue-900 dark:text-blue-300 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>1. LLM Engine & Privacy</span>
          </button>

          <button
            onClick={() => setActiveTab('quality')}
            className={`px-4 py-2.5 rounded-t-lg font-bold flex items-center gap-2 border-b-2 transition cursor-pointer ${
              activeTab === 'quality'
                ? 'border-blue-800 text-blue-900 dark:text-blue-300 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>2. Quality & Journal Filters</span>
          </button>

          <button
            onClick={() => setActiveTab('citation')}
            className={`px-4 py-2.5 rounded-t-lg font-bold flex items-center gap-2 border-b-2 transition cursor-pointer ${
              activeTab === 'citation'
                ? 'border-blue-800 text-blue-900 dark:text-blue-300 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>3. Citation Formatting</span>
          </button>

          <button
            onClick={() => setActiveTab('claims')}
            className={`px-4 py-2.5 rounded-t-lg font-bold flex items-center gap-2 border-b-2 transition cursor-pointer ${
              activeTab === 'claims'
                ? 'border-blue-800 text-blue-900 dark:text-blue-300 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>4. Claim Detection</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          
          {/* TAB 1: LLM Engine & Privacy */}
          {activeTab === 'llm' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-1">
                  AI Provider & Privacy Model:
                </label>
                <select
                  value={tempLLMConfig.provider}
                  onChange={(e) => {
                    setTempLLMConfig({ ...tempLLMConfig, provider: e.target.value as any });
                    setTestResult(null);
                  }}
                  className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm"
                >
                  <option value="builtin">Built-in Academic Generator (Instant, Free, Zero Setup)</option>
                  <option value="gemini">Google Gemini API (Gemini 1.5 Flash / Pro - Fast & High Context)</option>
                  <option value="ollama">Local Ollama (http://localhost:11434 - 100% Private on Your PC)</option>
                  <option value="groq">Groq Cloud (Ultra-Fast - Llama 3.3 70B)</option>
                  <option value="openai">OpenAI API (GPT-4o / GPT-4o-mini)</option>
                  <option value="deepseek">DeepSeek API (DeepSeek-V3 / DeepSeek-R1)</option>
                  <option value="openrouter">OpenRouter (Any open source model)</option>
                  <option value="custom">Custom Server Endpoint (LM Studio / vLLM)</option>
                </select>
              </div>

              {tempLLMConfig.provider === 'ollama' && (
                <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 space-y-2">
                  <label className="text-xs font-bold text-blue-950 dark:text-blue-200 block">
                    Local Ollama Endpoint URL:
                  </label>
                  <input
                    type="text"
                    value={tempLLMConfig.baseUrl || 'http://localhost:11434'}
                    onChange={(e) => setTempLLMConfig({ ...tempLLMConfig, baseUrl: e.target.value })}
                    placeholder="http://localhost:11434"
                    className="w-full p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-mono"
                  />
                  <p className="text-[11px] text-slate-600 dark:text-slate-400">
                    Runs locally on your CPU/GPU with zero data leaving your hardware. Ensure Ollama is running (<code>ollama serve</code>).
                  </p>
                </div>
              )}

              {['gemini', 'openai', 'groq', 'openrouter', 'deepseek'].includes(tempLLMConfig.provider) && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                    {tempLLMConfig.provider === 'gemini' ? 'Google Gemini API Key' : `${tempLLMConfig.provider.toUpperCase()} API Key`}:
                  </label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="password"
                      value={tempLLMConfig.apiKey || ''}
                      onChange={(e) => setTempLLMConfig({ ...tempLLMConfig, apiKey: e.target.value })}
                      placeholder={tempLLMConfig.provider === 'gemini' ? 'Enter your Google AI Studio / Gemini API Key' : `Enter your ${tempLLMConfig.provider.toUpperCase()} API Key`}
                      className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-xs"
                    />
                  </div>
                  <span className="text-[11px] text-slate-500 block">
                    {tempLLMConfig.provider === 'gemini' ? 'Get a free API key from aistudio.google.com' : 'Stored securely in your local browser storage.'}
                  </span>
                </div>
              )}

              {tempLLMConfig.provider !== 'builtin' && (
                <div>
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-1">
                    Model Identifier (Optional):
                  </label>
                  <input
                    type="text"
                    value={tempLLMConfig.model || ''}
                    onChange={(e) => setTempLLMConfig({ ...tempLLMConfig, model: e.target.value })}
                    placeholder={
                      tempLLMConfig.provider === 'gemini' 
                        ? 'gemini-3.6-flash (or gemini-2.0-flash)' 
                        : tempLLMConfig.provider === 'ollama' 
                        ? 'llama3.2:latest (or gemma4:12b)' 
                        : 'Default provider model'
                    }
                    className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-mono text-xs"
                  />
                </div>
              )}

              {/* Test Connection Button & Output */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleRunTest}
                  disabled={isTesting}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-blue-900 dark:text-blue-300 text-xs font-semibold flex items-center gap-2 transition border border-slate-300 dark:border-slate-700 cursor-pointer disabled:opacity-50"
                >
                  {isTesting ? <Loader2 className="w-4 h-4 animate-spin text-blue-700" /> : <Layers className="w-4 h-4 text-blue-700" />}
                  <span>{isTesting ? 'Testing Connection...' : 'Test Connection & Detect Models'}</span>
                </button>

                {testResult && (
                  <div
                    className={`mt-3 p-3.5 rounded-xl border text-xs leading-relaxed transition-all ${
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
                            <strong>Detected Models:</strong> {testResult.availableModels.join(', ')}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: Quality & Journal Filters */}
          {activeTab === 'quality' && (
            <div className="space-y-4">
              <label className="flex items-start justify-between gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 cursor-pointer">
                <div>
                  <span className="font-bold block text-slate-900 dark:text-slate-100 text-xs">
                    Exclude Preprints & Working Papers (Recommended)
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Filters out non-peer-reviewed repositories (arXiv, bioRxiv, medRxiv, SSRN, Research Square) to ensure cited works are peer-reviewed.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={options.excludePreprints}
                  onChange={(e) => setOptions((prev) => ({ ...prev, excludePreprints: e.target.checked }))}
                  className="rounded border-slate-300 text-blue-800 focus:ring-blue-700 mt-1 cursor-pointer"
                />
              </label>

              <label className="flex items-start justify-between gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 cursor-pointer">
                <div>
                  <span className="font-bold block text-slate-900 dark:text-slate-100 text-xs">
                    Require Verified Permanent DOI
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Only cites works with registered permanent Digital Object Identifiers in Crossref or OpenAlex.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={options.requireDoi}
                  onChange={(e) => setOptions((prev) => ({ ...prev, requireDoi: e.target.checked }))}
                  className="rounded border-slate-300 text-blue-800 focus:ring-blue-700 mt-1 cursor-pointer"
                />
              </label>
            </div>
          )}

          {/* TAB 3: Citation Formatting */}
          {activeTab === 'citation' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-1">
                  Primary Citation Format:
                </label>
                <select
                  value={options.style}
                  onChange={(e) => setOptions((prev) => ({ ...prev, style: e.target.value as any }))}
                  className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm"
                >
                  {CITATION_STYLES.map((style) => (
                    <option key={style.id} value={style.id}>
                      {style.name} ({style.category})
                    </option>
                  ))}
                </select>
              </div>

              <label className="flex items-start justify-between gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 cursor-pointer">
                <div>
                  <span className="font-bold block text-slate-900 dark:text-slate-100 text-xs">
                    Include Clickable DOI URLs in Reference List
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Appends direct https://doi.org/... hyperlinks to each bibliographic entry.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={options.includeDoi}
                  onChange={(e) => setOptions((prev) => ({ ...prev, includeDoi: e.target.checked }))}
                  className="rounded border-slate-300 text-blue-800 focus:ring-blue-700 mt-1 cursor-pointer"
                />
              </label>
            </div>
          )}

          {/* TAB 4: Claim Detection */}
          {activeTab === 'claims' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-1.5">
                  Default Claim Sensitivity:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setSensitivity('high')}
                    className={`p-3 rounded-xl text-left border transition cursor-pointer ${
                      sensitivity === 'high'
                        ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-700 dark:border-blue-500 ring-1 ring-blue-700/30'
                        : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div className="text-xs font-bold text-slate-900 dark:text-slate-100">Strict</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Only cites statements with numbers, stats, and causal metrics.</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSensitivity('moderate')}
                    className={`p-3 rounded-xl text-left border transition cursor-pointer ${
                      sensitivity === 'moderate'
                        ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-700 dark:border-blue-500 ring-1 ring-blue-700/30'
                        : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div className="text-xs font-bold text-slate-900 dark:text-slate-100">Balanced</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Detects empirical, scientific, and technical assertions.</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSensitivity('all')}
                    className={`p-3 rounded-xl text-left border transition cursor-pointer ${
                      sensitivity === 'all'
                        ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-700 dark:border-blue-500 ring-1 ring-blue-700/30'
                        : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div className="text-xs font-bold text-slate-900 dark:text-slate-100">Thorough</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Hunts citations for almost every factual sentence.</div>
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-sans">
            Settings saved locally in your browser
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveAll}
              className="btn-academic-primary px-5 py-2 rounded-lg text-xs font-semibold cursor-pointer shadow-xs"
            >
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
