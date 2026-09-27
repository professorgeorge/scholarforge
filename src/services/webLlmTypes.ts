export interface WebLlmProgressReport {
  progress: number; // 0 to 1
  text: string;
  isComplete: boolean;
  error?: string;
}

export interface WebLlmModelOption {
  id: string;
  name: string;
  sizeMB: number;
  license: string;
  description: string;
  recommended?: boolean;
}

export const SAFE_UNRESTRICTED_WEBLM_MODELS: WebLlmModelOption[] = [
  {
    id: 'Qwen2.5-1.5B-Instruct-q4f16_1-MLC',
    name: 'Qwen 2.5 (1.5B Instruct)',
    sizeMB: 1080,
    license: 'Apache 2.0',
    description: 'High-precision academic reasoning with comprehensive multilingual capabilities. Optimal balance of speed and depth.',
    recommended: true,
  },
  {
    id: 'Qwen2.5-0.5B-Instruct-q4f16_1-MLC',
    name: 'Qwen 2.5 (0.5B Instruct: Ultra-Light)',
    sizeMB: 390,
    license: 'Apache 2.0',
    description: 'Ultra-fast download (~390 MB) ideal for lower-VRAM laptops and quick structured extractions.',
  },
  {
    id: 'SmolLM2-1.7B-Instruct-q4f16_1-MLC',
    name: 'SmolLM2 (1.7B Instruct)',
    sizeMB: 990,
    license: 'Apache 2.0',
    description: 'Purpose-built on curated synthetic educational and scientific datasets by Hugging Face.',
  },
];

export const DEFAULT_WEBLM_MODEL = 'Qwen2.5-1.5B-Instruct-q4f16_1-MLC';

/**
 * Checks if the current browser and GPU support WebGPU.
 */
export function isWebGPUSupported(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  return 'gpu' in navigator && Boolean((navigator as any).gpu);
}
