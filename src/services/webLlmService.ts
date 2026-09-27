import type { MLCEngine } from '@mlc-ai/web-llm';
import {
  type WebLlmProgressReport,
  type WebLlmModelOption,
  SAFE_UNRESTRICTED_WEBLM_MODELS,
  DEFAULT_WEBLM_MODEL,
  isWebGPUSupported,
} from './webLlmTypes';

export {
  type WebLlmProgressReport,
  type WebLlmModelOption,
  SAFE_UNRESTRICTED_WEBLM_MODELS,
  DEFAULT_WEBLM_MODEL,
  isWebGPUSupported,
};

// Singleton engine instance per model
let cachedEngine: MLCEngine | null = null;
let currentLoadedModelId: string | null = null;
let isInitializing = false;

// Global listeners for download/shader compilation progress
const progressListeners = new Set<(report: WebLlmProgressReport) => void>();

export function subscribeWebLlmProgress(listener: (report: WebLlmProgressReport) => void): () => void {
  progressListeners.add(listener);
  return () => {
    progressListeners.delete(listener);
  };
}

function notifyProgress(report: WebLlmProgressReport) {
  progressListeners.forEach((l) => {
    try {
      l(report);
    } catch (e) {
      console.error('Progress listener error:', e);
    }
  });
}

/**
 * Retrieves or initializes the WebLLM engine with real-time download and compile tracking.
 */
export async function getWebLlmEngine(
  modelId: string = DEFAULT_WEBLM_MODEL,
  onProgress?: (report: WebLlmProgressReport) => void
): Promise<MLCEngine> {
  if (!isWebGPUSupported()) {
    throw new Error('WebGPU is not supported by your browser or graphics hardware. Please use Google Chrome, Edge, or Arc on desktop, or choose another AI provider.');
  }

  if (cachedEngine && currentLoadedModelId === modelId) {
    onProgress?.({ progress: 1, text: 'Model loaded and ready in browser VRAM', isComplete: true });
    return cachedEngine;
  }

  if (isInitializing) {
    // Wait until initialization completes
    while (isInitializing) {
      await new Promise((r) => setTimeout(r, 200));
    }
    if (cachedEngine && currentLoadedModelId === modelId) {
      return cachedEngine;
    }
  }

  isInitializing = true;
  notifyProgress({ progress: 0.01, text: `Connecting to WebGPU pipeline for ${modelId}...`, isComplete: false });

  try {
    const webllm = await import('@mlc-ai/web-llm');

    const engine = await webllm.CreateMLCEngine(modelId, {
      initProgressCallback: (report) => {
        const progressReport: WebLlmProgressReport = {
          progress: report.progress,
          text: report.text,
          isComplete: report.progress >= 1,
        };
        onProgress?.(progressReport);
        notifyProgress(progressReport);
      },
    });

    cachedEngine = engine;
    currentLoadedModelId = modelId;
    isInitializing = false;

    const readyReport: WebLlmProgressReport = {
      progress: 1,
      text: `Model ${modelId} successfully initialized in GPU memory.`,
      isComplete: true,
    };
    onProgress?.(readyReport);
    notifyProgress(readyReport);

    return engine;
  } catch (err: any) {
    isInitializing = false;
    const errReport: WebLlmProgressReport = {
      progress: 0,
      text: `WebGPU initialization failed: ${err.message}`,
      isComplete: false,
      error: err.message,
    };
    onProgress?.(errReport);
    notifyProgress(errReport);
    throw err;
  }
}

/**
 * Executes chat inference using the in-browser WebLLM engine.
 */
export async function callWebLLM(
  systemPrompt: string,
  userPrompt: string,
  modelId: string = DEFAULT_WEBLM_MODEL,
  temperature: number = 0.6,
  onProgress?: (report: WebLlmProgressReport) => void
): Promise<string> {
  const engine = await getWebLlmEngine(modelId, onProgress);

  const reply = await engine.chat.completions.create({
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature,
  });

  return (reply.choices[0]?.message?.content || '').trim();
}

/**
 * Checks if the specified model is already cached or loaded in memory.
 */
export function isModelLoaded(modelId: string): boolean {
  return cachedEngine !== null && currentLoadedModelId === modelId;
}
