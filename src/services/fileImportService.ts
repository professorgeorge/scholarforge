import mammoth from 'mammoth';

/**
 * Extracts clean manuscript text from an uploaded file (.docx, .txt, .md, .rtf, .tex).
 */
export async function extractTextFromManuscriptFile(file: File): Promise<{
  text: string;
  filename: string;
  wordCount: number;
}> {
  const filename = file.name;
  const extension = filename.split('.').pop()?.toLowerCase() || '';

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
