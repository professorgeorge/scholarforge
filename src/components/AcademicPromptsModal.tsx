import React, { useState } from 'react';
import { 
  X, 
  Crown, 
  Layers, 
  Search, 
  Table, 
  Lightbulb, 
  Swords, 
  Zap, 
  Copy, 
  Check, 
  Download, 
  Sparkles,
  FileText
} from 'lucide-react';
import type { AcademicPaper, CitationStyle } from '../types/citation';
import { 
  ACADEMIC_PROMPT_TEMPLATES, 
  generateLLMMarkdownDataset 
} from '../services/academicPromptsService';
import { downloadOpenAccessPDFList } from '../services/wordExportService';
import confetti from 'canvas-confetti';

interface AcademicPromptsModalProps {
  isOpen: boolean;
  onClose: () => void;
  papers: AcademicPaper[];
  topic?: string;
  style?: CitationStyle;
}

export const AcademicPromptsModal: React.FC<AcademicPromptsModalProps> = ({
  isOpen,
  onClose,
  papers,
  topic = 'Academic Research',
  style = 'apa',
}) => {
  const [selectedPromptId, setSelectedPromptId] = useState<string>('godmode');
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const activeTemplate =
    ACADEMIC_PROMPT_TEMPLATES.find((p) => p.id === selectedPromptId) ||
    ACADEMIC_PROMPT_TEMPLATES[0];

  const generatedPrompt = activeTemplate.template(papers, topic);

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedPrompt);
    setCopied(true);
    confetti({
      particleCount: 35,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#0284c7', '#38bdf8', '#c084fc'],
    });
    setTimeout(() => setCopied(false), 2200);
  };

  const handleDownloadDatasetMD = () => {
    const md = generateLLMMarkdownDataset(papers, style, topic);
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ScholarForge_LLM_Dataset_${topic.replace(/[^a-zA-Z0-9_\-]/g, '_')}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const renderIcon = (name: string) => {
    switch (name) {
      case 'Crown':
        return <Crown className="w-4 h-4 text-amber-500" />;
      case 'Layers':
        return <Layers className="w-4 h-4 text-blue-500" />;
      case 'Search':
        return <Search className="w-4 h-4 text-purple-500" />;
      case 'Table':
        return <Table className="w-4 h-4 text-emerald-500" />;
      case 'Lightbulb':
        return <Lightbulb className="w-4 h-4 text-yellow-500" />;
      case 'Swords':
        return <Swords className="w-4 h-4 text-rose-500" />;
      case 'Zap':
        return <Zap className="w-4 h-4 text-orange-500" />;
      default:
        return <Sparkles className="w-4 h-4 text-primary-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-5xl h-[88vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Academic LLM & NotebookLM Prompts Suite
                </h3>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
                  {papers.length} Papers Bundled
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Ready-to-run prompts with authentic citations and abstracts for Gemini, ChatGPT, Claude, and NotebookLM.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadDatasetMD}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              title="Download full dataset with prompt templates as Markdown"
            >
              <FileText className="w-3.5 h-3.5 text-blue-500" />
              Download .md Dataset
            </button>
            <button
              onClick={() => downloadOpenAccessPDFList(papers, topic)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              title="Download text file with direct links to legal Open Access PDFs"
            >
              <Download className="w-3.5 h-3.5 text-emerald-500" />
              OA PDF Links
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body Split */}
        <div className="flex-1 flex overflow-hidden">
          {/* Prompt Selector Sidebar */}
          <div className="w-80 border-r border-slate-200 dark:border-slate-800 overflow-y-auto p-3 space-y-1.5 bg-slate-50/40 dark:bg-slate-900/30">
            <div className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Select Analysis Prompt
            </div>

            {ACADEMIC_PROMPT_TEMPLATES.map((tpl) => {
              const isSelected = tpl.id === selectedPromptId;
              return (
                <button
                  key={tpl.id}
                  onClick={() => setSelectedPromptId(tpl.id)}
                  className={`w-full text-left p-3 rounded-xl transition-all border ${
                    isSelected
                      ? 'bg-white dark:bg-slate-800 border-blue-500/40 dark:border-blue-500/40 shadow-sm text-slate-900 dark:text-white'
                      : 'border-transparent text-slate-600 dark:text-slate-400 hover:bg-white/60 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1.5 mb-1">
                    <div className="flex items-center gap-2">
                      {renderIcon(tpl.iconName)}
                      <span className="text-xs font-bold truncate">{tpl.title}</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {tpl.description}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Prompt Output View */}
          <div className="flex-1 flex flex-col bg-slate-100/50 dark:bg-slate-950/50 overflow-hidden">
            <div className="px-6 py-3 border-b border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  {activeTemplate.title}
                  <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                    {activeTemplate.badge}
                  </span>
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Copy and paste directly into Google NotebookLM, ChatGPT Plus, Claude 3.5, or Gemini Advanced.
                </p>
              </div>

              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-300" />
                    Copied Prompt!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy Ready Prompt
                  </>
                )}
              </button>
            </div>

            <div className="flex-1 p-6 overflow-y-auto">
              <pre className="font-mono text-xs text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 whitespace-pre-wrap leading-relaxed shadow-sm">
                {generatedPrompt}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
