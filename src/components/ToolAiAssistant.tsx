import { useProjectState } from './useProjectState';
import { useState } from 'react';
import { Sparkles, Settings, Loader2, Copy, BookmarkPlus } from 'lucide-react';
import type { LLMConfig } from '../services/llmService';
import { isLlmConfigured } from '../services/aiScholarExtensions';
import { getProject } from '../services/projectService';
import { addBinderItem, getBinderItems } from '../services/binderService';
import { buildToolReviewContext, formatToolAiReview, MAX_REVIEW_MATERIAL, reviewWithToolAI, TOOL_AI_REVIEWS, type AiToolId, type ToolAiReview } from '../services/toolAiService';

interface ToolAiAssistantProps { tool: AiToolId; config: LLMConfig; onConfigure: () => void }
export function ToolAiAssistant({ tool, config, onConfigure }: ToolAiAssistantProps) {
  const definition = TOOL_AI_REVIEWS[tool];
  const configured = isLlmConfigured(config);
  const [taskId, setTaskId] = useState(definition.tasks[0].id);
  const [material, setMaterial] = useState('');
  const [request, setRequest] = useState('');
  const [sourceIds, setSourceIds] = useState<string[]>([]);
  const [excerpted, setExcerpted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [result, setResult] = useProjectState<{ review: ToolAiReview; provider: string; task: string; id: string; at: string } | null>(`ToolAiAssistant.${tool}.review`, null);
  const clearResult = () => { setResult(null); setFeedback(''); setError(''); };

  const run = async () => {
    if (busy) return;
    setBusy(true); clearResult();
    try {
      const review = await reviewWithToolAI(tool, taskId, material, request, sourceIds, config);
      setResult({ review, provider: `${config.provider}${config.model ? ` / ${config.model} (configured model)` : ''}`, task: definition.tasks.find(task => task.id === taskId)!.label, id: crypto.randomUUID(), at: new Date().toISOString() });
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'AI review failed. Your tool inputs have not been changed.'); }
    finally { setBusy(false); }
  };

  return <details className="sf-tool-ai rounded-xl border border-blue-200 dark:border-blue-900 bg-white dark:bg-slate-900 p-4 sm:p-5">
    <summary className="cursor-pointer text-sm text-slate-800 dark:text-slate-100">
      <span className="inline-flex flex-wrap items-center gap-2 align-middle"><Sparkles aria-hidden="true" className="w-4 h-4 shrink-0 text-blue-700 dark:text-blue-300" /><strong>Optional AI assistance</strong><span className="text-xs text-slate-500 dark:text-slate-400">{configured ? `Configured: ${config.provider}` : 'Connect a model to use'} · {definition.name}</span></span>
    </summary>
    <div className="mt-4 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="max-w-2xl text-xs leading-relaxed text-slate-600 dark:text-slate-300">Get a task-specific review using your chosen model. Load saved tool inputs or paste material below, review what will be sent, then invoke AI. Suggestions stay separate from your manuscript, registry checks, and calculations.</p>
        <button type="button" disabled={busy} onClick={onConfigure} className="btn-academic-secondary px-3 py-2 inline-flex items-center gap-2 text-xs cursor-pointer"><Settings aria-hidden="true" className="w-4 h-4" />{configured ? 'AI settings' : 'Connect AI'}</button>
      </div>
      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">AI task
        <select value={taskId} disabled={busy} onChange={event => { setTaskId(event.target.value); clearResult(); }} className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 p-2 text-sm">{definition.tasks.map(task => <option key={task.id} value={task.id}>{task.label}</option>)}</select>
      </label>
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <label htmlFor={`ai-material-${tool}`} className="text-xs font-semibold text-slate-700 dark:text-slate-200">Material to send (editable)</label>
          <button type="button" disabled={busy} onClick={() => { const context = buildToolReviewContext(tool, getProject()); setMaterial(context.text); setSourceIds(context.sourceIds); setExcerpted(context.truncated); clearResult(); }} className="text-xs font-semibold text-blue-800 dark:text-blue-300 underline cursor-pointer">Load saved tool inputs</button>
        </div>
        <textarea id={`ai-material-${tool}`} value={material} disabled={busy} maxLength={MAX_REVIEW_MATERIAL} rows={7} onChange={event => { setMaterial(event.target.value); clearResult(); }} placeholder="Paste the passage, research question, plan, or records you want reviewed. Nothing is sent until you invoke AI." className="w-full resize-y rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-3 text-sm leading-relaxed text-slate-900 dark:text-white" />
        <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">{material.length.toLocaleString()} / {MAX_REVIEW_MATERIAL.toLocaleString()} characters. {excerpted ? 'The loaded context was shortened. Inspect the excerpts and add any missing details.' : 'Only the material shown here and your instructions below are supplied.'}</p>
      </div>
      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">Focus or constraints (optional)
        <textarea value={request} disabled={busy} maxLength={2000} rows={2} onChange={event => { setRequest(event.target.value); clearResult(); }} placeholder="For example: preserve the numerical findings; target 200 words; focus on sampling limitations." className="mt-1 w-full resize-y rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-3 text-sm text-slate-900 dark:text-white" />
      </label>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-slate-500 dark:text-slate-400">{configured ? (config.provider === 'webgpu' ? 'Inference uses the configured browser model.' : `This request uses your configured ${config.provider} endpoint. Review identifying or confidential text before sending.`) : 'The standard tool remains available without an AI connection.'}</p>
        <button type="button" disabled={!configured || busy || !material.trim()} onClick={() => void run()} className="btn-academic-primary px-4 py-2.5 inline-flex items-center gap-2 text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">{busy ? <Loader2 aria-hidden="true" className="w-4 h-4 animate-spin" /> : <Sparkles aria-hidden="true" className="w-4 h-4" />}{busy ? 'Reviewing supplied material…' : 'Run AI review'}</button>
      </div>
      {busy && <p role="status" className="text-xs text-blue-800 dark:text-blue-300">Waiting for your configured model. The tool inputs remain unchanged.</p>}
      {error && <p role="alert" className="rounded-lg bg-red-50 dark:bg-red-950/40 p-3 text-xs text-red-800 dark:text-red-200">{error}</p>}
      {result && <section aria-label="AI review suggestions" className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-4 space-y-4">
        <div><h3 className="font-semibold text-slate-900 dark:text-white">AI suggestions · review before use</h3><p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">{result.task} · {result.provider} · {new Date(result.at).toLocaleString()}</p></div>
        <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-200">{result.review.summary}</p>
        {result.review.suggestions.map((suggestion, index) => <div key={index}><h4 className="text-sm font-semibold text-slate-900 dark:text-white">{suggestion.title}</h4><p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-slate-600 dark:text-slate-300">{suggestion.detail}</p>{suggestion.sourceIds.length > 0 && <p className="mt-1 text-xs text-blue-800 dark:text-blue-300">Supplied source IDs: {suggestion.sourceIds.join(', ')}. Check the source text before relying on this interpretation.</p>}</div>)}
        {result.review.proposedText && <div><h4 className="text-sm font-semibold text-slate-900 dark:text-white">Suggested wording</h4><p className="mt-2 whitespace-pre-wrap rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 text-sm leading-relaxed text-slate-700 dark:text-slate-200">{result.review.proposedText}</p></div>}
        {result.review.questions.length > 0 && <div><h4 className="text-sm font-semibold text-slate-900 dark:text-white">Questions to resolve</h4><ul className="mt-1 list-disc pl-5 text-sm text-slate-600 dark:text-slate-300">{result.review.questions.map((question, index) => <li key={index}>{question}</li>)}</ul></div>}
        <div><h4 className="text-sm font-semibold text-slate-900 dark:text-white">Limitations</h4><ul className="mt-1 list-disc pl-5 text-sm text-slate-600 dark:text-slate-300">{result.review.limitations.map((limitation, index) => <li key={index}>{limitation}</li>)}</ul><p className="mt-2 text-xs text-slate-500 dark:text-slate-400">AI suggestions do not replace registry verification, statistical estimation, ethics review, or a final anonymity check.</p></div>
        <div className="flex flex-wrap gap-3">
          <button type="button" className="btn-academic-secondary px-3 py-2 inline-flex items-center gap-2 text-xs cursor-pointer" onClick={async () => { try { await navigator.clipboard.writeText(formatToolAiReview(result.review)); setFeedback('Review copied.'); } catch { setFeedback('Clipboard is unavailable. Select and copy the review text.'); } }}><Copy aria-hidden="true" className="w-4 h-4" />Copy review</button>
          <button type="button" disabled={feedback === 'Review saved to the research binder.'} className="btn-academic-secondary px-3 py-2 inline-flex items-center gap-2 text-xs cursor-pointer disabled:opacity-50" onClick={() => { addBinderItem({ type: 'note', title: `AI review: ${definition.name} · ${result.task}`, snippet: formatToolAiReview(result.review), sourcePillar: definition.name, metadata: { aiGenerated: true, reviewId: result.id, provider: result.provider, createdAt: result.at } }); setFeedback(getBinderItems()[0]?.metadata?.reviewId === result.id ? 'Review saved to the research binder.' : 'The review could not be saved. Check the storage warning and copy the text instead.'); }}><BookmarkPlus aria-hidden="true" className="w-4 h-4" />Save review to binder</button>
        </div>
      </section>}
      {feedback && <p role="status" className="text-xs text-slate-600 dark:text-slate-300">{feedback}</p>}
    </div>
  </details>;
}
