/**
 * Manuscript Parsing & Session Memory Service
 * Provides automated extraction of academic manuscript components:
 * - Title
 * - Authors & Affiliations
 * - Abstract & Keywords
 * - Draft Body (Introduction through Discussion/Conclusion)
 * - Bibliography / References list
 * - Quantitative metrics (word counts, citation counts)
 */

import { extractBibliographyFromManuscript } from './referenceVerifierService';

export interface ActiveManuscriptContext {
  id: string;
  filename?: string;
  rawText: string;
  title: string;
  abstract: string;
  keywords: string[];
  body: string;
  bibliography: string;
  detectedReferencesCount: number;
  wordCount: number;
  abstractWordCount: number;
  uploadedAt: number;
}

const STORAGE_KEY = 'scholarforge_active_manuscript';

/**
 * Parses raw text into an intelligent, structured ActiveManuscriptContext.
 */
export function parseManuscript(rawText: string, filename?: string): ActiveManuscriptContext {
  if (!rawText || !rawText.trim()) {
    return createEmptyManuscriptContext();
  }

  const cleanText = rawText.replace(/\r\n/g, '\n').trim();
  const words = cleanText.split(/\s+/).filter(Boolean);
  const totalWords = words.length;

  // 1. Extract Bibliography & Raw References
  const bibResult = extractBibliographyFromManuscript(cleanText);
  const bibliography = bibResult.bibliography || '';
  const detectedReferencesCount = bibResult.referenceCount || 0;

  // Text preceding references is the main content
  let contentText = cleanText;
  if (bibResult.wasExtracted && bibResult.fullText) {
    const bibIndex = cleanText.indexOf(bibResult.bibliography);
    if (bibIndex > 100) {
      contentText = cleanText.slice(0, bibIndex).trim();
    }
  }

  // 2. Extract Title
  let title = '';
  const lines = contentText.split('\n').map(l => l.trim()).filter(Boolean);
  
  if (lines.length > 0) {
    // Check if first line starts with markdown header #
    const firstLine = lines[0].replace(/^#+\s*/, '').trim();
    if (firstLine.length > 5 && firstLine.length < 250) {
      title = firstLine;
    } else {
      // Find the first line before 'Abstract'
      const abstractIndex = lines.findIndex(l => /^abstract\b/i.test(l));
      if (abstractIndex > 0) {
        title = lines.slice(0, abstractIndex).join(' ').replace(/^#+\s*/, '').trim();
      } else {
        title = lines[0].slice(0, 160);
      }
    }
  }

  // 3. Extract Abstract
  let abstract = '';
  const abstractRegex = /(?:^|\n)\s*(?:#{1,6}\s*)?(?:abstract|summary)\s*[:\n\r]([\s\S]*?)(?=(?:\n\s*(?:#{1,6}\s*)?(?:keywords|key\s+words|1\.?\s+introduction|introduction)\b|\n\n\n|$))/i;
  const abstractMatch = contentText.match(abstractRegex);

  if (abstractMatch && abstractMatch[1]) {
    abstract = abstractMatch[1].trim();
  } else {
    // Fallback: Check if there is an early block between 100 and 2500 characters
    if (lines.length > 2) {
      const secondLine = lines.slice(1, 4).join('\n\n');
      if (secondLine.length > 100 && secondLine.length < 2000) {
        abstract = secondLine;
      }
    }
  }

  const abstractWordCount = abstract ? abstract.split(/\s+/).filter(Boolean).length : 0;

  // 4. Extract Keywords
  const keywords: string[] = [];
  const keywordsRegex = /(?:^|\n)\s*(?:#{1,6}\s*)?(?:keywords|key\s+words|index\s+terms)\s*[:\n\r]([^\n\r]+)/i;
  const kwMatch = contentText.match(keywordsRegex);
  if (kwMatch && kwMatch[1]) {
    const rawKws = kwMatch[1].split(/[,;•]/).map(k => k.trim()).filter(Boolean);
    keywords.push(...rawKws);
  }

  // 5. Extract Body (excluding title, abstract, keywords, and bibliography)
  let body = contentText;
  if (abstract && contentText.includes(abstract)) {
    const afterAbstract = contentText.split(abstract)[1] || '';
    body = afterAbstract.replace(/^[\s\n\r]*(?:keywords[^\n\r]*\n)?/i, '').trim();
  }

  const context: ActiveManuscriptContext = {
    id: `manuscript-${Date.now()}`,
    filename: filename || (title ? `${title.slice(0, 30).replace(/[^a-zA-Z0-9]/g, '_')}.docx` : 'Active_Manuscript.docx'),
    rawText: cleanText,
    title: title || (filename ? filename.replace(/\.[^.]+$/, '') : 'Untitled Academic Manuscript'),
    abstract: abstract || '',
    keywords,
    body: body || cleanText,
    bibliography: bibliography,
    detectedReferencesCount,
    wordCount: totalWords,
    abstractWordCount,
    uploadedAt: Date.now()
  };

  return context;
}

/**
 * Creates a clean default empty state context.
 */
export function createEmptyManuscriptContext(): ActiveManuscriptContext {
  return {
    id: '',
    filename: undefined,
    rawText: '',
    title: '',
    abstract: '',
    keywords: [],
    body: '',
    bibliography: '',
    detectedReferencesCount: 0,
    wordCount: 0,
    abstractWordCount: 0,
    uploadedAt: 0
  };
}

/**
 * Loads the active manuscript context from persistent browser storage.
 */
export function loadActiveManuscriptFromStorage(): ActiveManuscriptContext | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    if (parsed && parsed.rawText) {
      return parsed as ActiveManuscriptContext;
    }
  } catch (err) {
    console.warn('Failed to load active manuscript from storage', err);
  }
  return null;
}

/**
 * Saves the active manuscript context to persistent browser storage.
 */
export function saveActiveManuscriptToStorage(context: ActiveManuscriptContext | null): void {
  try {
    if (!context || !context.rawText) {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(context));
    }
  } catch (err) {
    console.warn('Failed to save active manuscript to storage', err);
  }
}
