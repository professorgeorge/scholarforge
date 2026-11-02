import mammoth from 'mammoth';
import { retainProjectFile } from './projectFileService';
import { getActiveProjectId } from './projectService';

export async function extractTextFromManuscriptFile(file: File) {
  const projectId = getActiveProjectId();
  const result = await extractFileText(file);
  await retainProjectFile(file, projectId);
  return result;
}

/**
 * Extracts clean manuscript text from an uploaded file (.docx, .txt, .md, .rtf, .tex).
 */
async function extractFileText(file: File): Promise<{
  text: string;
  filename: string;
  wordCount: number;
  pages?: { page: number; text: string }[];
}> {
  const filename = file.name;
  const extension = filename.split('.').pop()?.toLowerCase() || '';

  if (file.size > 40 * 1024 * 1024) throw new Error('Use a file smaller than 40 MB.');
  if (extension === 'pdf') {
    const pdfjs = await import('pdfjs-dist');
    const worker = await import('pdfjs-dist/build/pdf.worker.min.mjs?url');
    pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
    const task = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) });
    const doc = await task.promise;
    try {
      const pages: { page: number; text: string }[] = [];
      for (let page = 1; page <= doc.numPages; page++) {
        const content = await (await doc.getPage(page)).getTextContent();
        pages.push({ page, text: content.items.map(item => 'str' in item ? item.str + (item.hasEOL ? '\n' : ' ') : '').join('').trim() });
      }
      const text = pages.map(p => `[Page ${p.page}]\n${p.text}`).join('\n\n');
      if (!pages.some(p => p.text.length > 10)) throw new Error('This PDF has no extractable text. OCR it first, then import the text.');
      return { text, filename, wordCount: text.split(/\s+/).filter(Boolean).length, pages };
    } finally { await task.destroy(); }
  }
  if (!['docx', 'txt', 'md', 'tex'].includes(extension)) throw new Error('Supported files: PDF, DOCX, TXT, Markdown, and LaTeX. Convert RTF to DOCX or plain text first.');

  if (extension === 'docx') {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    const text = result.value.replace(/\r\n/g, '\n').trim();
    const wordCount = text ? text.split(/\s+/).length : 0;
    return { text, filename, wordCount };
  }

  // Text-based files (.txt, .md, .tex, .rtf)
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = ((e.target?.result as string) || '').replace(/\r\n/g, '\n').trim();
      const wordCount = text ? text.split(/\s+/).length : 0;
      resolve({ text, filename, wordCount });
    };
    reader.onerror = () => reject(new Error('Failed to read manuscript file.'));
    reader.readAsText(file);
  });
}
