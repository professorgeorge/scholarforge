import type { AcademicPaper, CitationStyle } from '../types/citation';
import { formatReferenceEntryPlain } from './citationFormatter';
import { extractAcademicTags } from './academicTagger';

export interface WordExportOptions {
  style: CitationStyle;
  includeAbstracts: boolean;
  includeTags?: boolean;
  documentTitle?: string;
  topic?: string;
}

/**
 * Generates an MS Word compatible document (Office XML / Word HTML MIME)
 * with strict academic formatting (1-inch margins, Times New Roman 12pt, hanging indent).
 */
export function generateWordDocumentHTML(
  papers: AcademicPaper[],
  options: WordExportOptions
): string {
  const { style, includeAbstracts, includeTags = true, documentTitle, topic } = options;

  const heading =
    documentTitle ||
    (includeAbstracts
      ? 'Annotated Bibliography'
      : style === 'mla'
      ? 'Works Cited'
      : 'References');

  const dateStr = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const bodyItems = papers
    .map((paper, index) => {
      const citationText = formatReferenceEntryPlain(paper, style, index + 1);
      const tags = includeTags ? extractAcademicTags(paper) : [];
      const tagString = tags.map((t) => t.label).join('  ');

      if (includeAbstracts) {
        const abstract = paper.abstract || 'No abstract available.';
        return `
          <div class="entry-block">
            <p class="citation-item"><b>[${index + 1}]</b> ${escapeHTML(citationText)}</p>
            ${
              tagString
                ? `<p class="tags-line"><em>Keywords / Classification: ${escapeHTML(tagString)}</em></p>`
                : ''
            }
            ${
              paper.doi
                ? `<p class="doi-line"><strong>DOI:</strong> <a href="https://doi.org/${escapeHTML(
                    paper.doi
                  )}">https://doi.org/${escapeHTML(paper.doi)}</a></p>`
                : ''
            }
            <div class="abstract-box">
              <p class="abstract-label"><strong>Abstract:</strong></p>
              <p class="abstract-text">${escapeHTML(abstract)}</p>
            </div>
          </div>
        `;
      }

      return `<p class="citation-item">${escapeHTML(citationText)}</p>`;
    })
    .join('\n');

  return `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' 
          xmlns:w='urn:schemas-microsoft-com:office:word' 
          xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>${escapeHTML(heading)}</title>
      <!--[if gte mso 9]>
      <xml>
        <w:WordDocument>
          <w:View>Print</w:View>
          <w:Zoom>100</w:Zoom>
          <w:DoNotOptimizeForCustomXSL/>
        </w:WordDocument>
      </xml>
      <![endif]-->
      <style>
        @page {
          size: 8.5in 11.0in;
          margin: 1.0in 1.0in 1.0in 1.0in;
        }
        body {
          font-family: "Times New Roman", Times, serif;
          font-size: 12pt;
          line-height: 1.5;
          color: #000000;
        }
        h1.doc-heading {
          text-align: center;
          font-size: 14pt;
          font-weight: bold;
          margin-bottom: 12pt;
          text-transform: capitalize;
        }
        .meta-info {
          font-size: 10pt;
          color: #555555;
          text-align: center;
          margin-bottom: 24pt;
          font-style: italic;
        }
        .entry-block {
          margin-bottom: 20pt;
          page-break-inside: avoid;
        }
        p.citation-item {
          margin-top: 0pt;
          margin-bottom: 6pt;
          text-indent: -0.5in;
          margin-left: 0.5in;
          line-height: 1.5;
        }
        .tags-line {
          margin-left: 0.5in;
          margin-top: 2pt;
          margin-bottom: 4pt;
          font-size: 10.5pt;
          color: #3b82f6;
        }
        .doi-line {
          margin-left: 0.5in;
          margin-top: 0pt;
          margin-bottom: 4pt;
          font-size: 10.5pt;
        }
        .abstract-box {
          margin-left: 0.5in;
          margin-top: 4pt;
          margin-bottom: 12pt;
          padding-left: 10pt;
          border-left: 2pt solid #cccccc;
        }
        p.abstract-label {
          font-size: 11pt;
          margin-bottom: 2pt;
          font-weight: bold;
        }
        p.abstract-text {
          font-size: 11pt;
          line-height: 1.4;
          text-align: justify;
          margin-top: 0;
        }
      </style>
    </head>
    <body>
      <h1 class="doc-heading">${escapeHTML(heading)}</h1>
      <p class="meta-info">
        ${topic ? `Research Topic: ${escapeHTML(topic)} &bull; ` : ''}
        Format: ${style.toUpperCase()} &bull; ${papers.length} References &bull; ${dateStr}
      </p>
      ${bodyItems}
    </body>
    </html>
  `;
}

/**
 * Downloads the generated Word document in the user's browser.
 */
export function downloadWordDocument(
  papers: AcademicPaper[],
  options: WordExportOptions,
  filename?: string
): void {
  const htmlContent = generateWordDocumentHTML(papers, options);
  const blob = new Blob([htmlContent], { type: 'application/msword;charset=utf-8' });
  const safeFilename =
    filename ||
    `ScholarForge_${options.includeAbstracts ? 'Annotated_Bibliography' : 'References'}_${options.style.toUpperCase()}.doc`;

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = safeFilename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generates and downloads a plain text list of legal Open Access PDF download URLs.
 */
export function downloadOpenAccessPDFList(papers: AcademicPaper[], query = 'ScholarForge'): void {
  const pdfPapers = papers.filter((p) => p.openAccessPdf || (p.openAccess && p.url));
  if (pdfPapers.length === 0) {
    alert('No Open Access PDF links found in the current selection.');
    return;
  }

  let content = `# ScholarForge Open Access PDF Direct Links (${pdfPapers.length} Files)\n`;
  content += `# Query / Topic: ${query}\n`;
  content += `# Generated: ${new Date().toLocaleDateString('en-US')}\n\n`;

  pdfPapers.forEach((p, i) => {
    const link = p.openAccessPdf || p.url;
    content += `[${i + 1}] ${p.title}\n${link}\n\n`;
  });

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const safeQuery = query.replace(/[^a-zA-Z0-9_\-]/g, '_');
  const filename = `ScholarForge_${safeQuery}_OA_PDFs.txt`;

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function escapeHTML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
