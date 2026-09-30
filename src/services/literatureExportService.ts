import type { AcademicPaper, CitationStyle } from '../types/citation';
import { calculateDatasetMetrics } from './datasetScientometrics';
import { extractAcademicTags } from './academicTagger';
import { formatReferenceEntryPlain } from './citationFormatter';
import { generateBibtexKey } from './citationFormatter';
import { generateRIS } from './risExporter';

export interface LiteratureExportOptions {
  topic?: string;
  style?: CitationStyle;
  includeAbstracts?: boolean;
  includeTags?: boolean;
  includeMetrics?: boolean;
  documentTitle?: string;
}

/**
 * Clean and normalize DOI string into full URL
 */
export function formatDoiUrl(doi?: string): string {
  if (!doi) return '';
  const cleanDoi = doi.replace(/^https?:\/\/(dx\.)?doi\.org\//i, '').trim();
  return `https://doi.org/${cleanDoi}`;
}

/**
 * 1. JSON EXPORT
 * Full structured machine-readable export with comprehensive metadata of all identified records.
 */
export function exportLiteratureToJson(
  papers: AcademicPaper[],
  options: LiteratureExportOptions = {}
): string {
  const { topic = '', includeMetrics = true } = options;
  const metrics = includeMetrics ? calculateDatasetMetrics(papers) : undefined;

  const exportPayload = {
    exportMetadata: {
      generator: 'ScholarForge Academic Discovery Suite',
      topic: topic || 'Unspecified Literature Search',
      exportedAt: new Date().toISOString(),
      totalRecords: papers.length,
      scientometrics: metrics
        ? {
            datasetHIndex: metrics.hIndex,
            totalCitations: metrics.totalCitations,
            averageCitationsPerPaper: metrics.avgCitations,
            openAccessPercentage: `${metrics.openAccessPct}%`,
          }
        : undefined,
    },
    records: papers.map((paper, index) => {
      const doiUrl = formatDoiUrl(paper.doi);
      const tags = extractAcademicTags(paper).map((t) => t.label);

      return {
        recordNumber: index + 1,
        id: paper.id,
        title: paper.title,
        authors: paper.authors.map((a) => ({
          name: a.name,
          familyName: a.familyName || '',
          givenName: a.givenName || '',
        })),
        publicationYear: paper.year || null,
        journalVenue: paper.venue || 'Scholarly Publication',
        volume: paper.volume || null,
        issue: paper.issue || null,
        pages: paper.pages || null,
        doi: paper.doi ? paper.doi.replace(/^https?:\/\/(dx\.)?doi\.org\//i, '').trim() : null,
        doiUrl: doiUrl || null,
        url: paper.url || doiUrl || null,
        abstract: paper.abstract || 'No abstract provided in registry.',
        citationCount: paper.citationCount ?? 0,
        isOpenAccess: Boolean(paper.openAccess),
        openAccessPdf: paper.openAccessPdf || null,
        sourceRegistry: paper.source || 'federated',
        keywordsAndTags: tags,
      };
    }),
  };

  return JSON.stringify(exportPayload, null, 2);
}

/**
 * 2. MARKDOWN (.MD) EXPORT
 * Publication-grade Markdown with overview scientometrics, quick reference index table,
 * and individual comprehensive record cards with abstracts, badges, and authentic DOI links.
 */
export function exportLiteratureToMarkdown(
  papers: AcademicPaper[],
  options: LiteratureExportOptions = {}
): string {
  const { topic = '', includeAbstracts = true, includeMetrics = true } = options;
  const dateStr = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const metrics = includeMetrics ? calculateDatasetMetrics(papers) : null;

  let md = `# Identified Scholarly Literature Records\n\n`;
  if (topic) {
    md += `**Research Topic / Inquiry:** ${topic}\n\n`;
  }
  md += `**Total Records Identified:** ${papers.length}  |  **Export Date:** ${dateStr}\n\n`;

  if (metrics) {
    md += `> **Dataset Scientometrics Summary:**  \n`;
    md += `> - **Dataset $h$-Index:** ${metrics.hIndex}  \n`;
    md += `> - **Total Citations:** ${metrics.totalCitations.toLocaleString()} (Average: ${metrics.avgCitations} per paper)  \n`;
    md += `> - **Open Access Availability:** ${metrics.openAccessPct}% of identified records\n\n`;
  }

  md += `---\n\n`;

  // Quick Index Table
  md += `## Literature Overview Table\n\n`;
  md += `| # | Title | Authors | Year | Venue / Journal | Citations | DOI |\n`;
  md += `|---|-------|---------|------|-----------------|-----------|-----|\n`;

  papers.forEach((p, idx) => {
    const authorStr =
      p.authors.length > 2
        ? `${p.authors[0].familyName || p.authors[0].name} et al.`
        : p.authors.map((a) => a.familyName || a.name).join(' & ') || 'Anonymous';
    const cleanTitle = p.title.replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
    const cleanVenue = (p.venue || 'Journal').replace(/\|/g, '\\|');
    const doiUrl = formatDoiUrl(p.doi);
    const doiCell = doiUrl ? `[${p.doi?.replace(/^https?:\/\/(dx\.)?doi\.org\//i, '')}](${doiUrl})` : 'N/A';
    md += `| ${idx + 1} | ${cleanTitle} | ${authorStr} | ${p.year || 'N/A'} | ${cleanVenue} | ${p.citationCount ?? 0} | ${doiCell} |\n`;
  });

  md += `\n---\n\n`;

  // Detailed Records Section
  md += `## Comprehensive Records with Full Abstracts\n\n`;

  papers.forEach((p, idx) => {
    const doiUrl = formatDoiUrl(p.doi);
    const authorList = p.authors.map((a) => a.name).join(', ') || 'Anonymous Authors';
    const tags = extractAcademicTags(p).map((t) => `\`${t.label}\``).join(' ');
    const isOpenAccess = Boolean(p.openAccess);

    md += `### [${idx + 1}] ${p.title}\n\n`;
    md += `- **Authors:** ${authorList}\n`;
    md += `- **Publication Year:** ${p.year || 'N/A'}\n`;
    md += `- **Journal / Venue:** *${p.venue || 'Scholarly Publication'}*${p.volume ? ` (Vol. ${p.volume}${p.issue ? `, Issue ${p.issue}` : ''})` : ''}\n`;
    if (doiUrl) {
      md += `- **DOI:** [${p.doi}](${doiUrl})\n`;
    }
    if (p.url && p.url !== doiUrl) {
      md += `- **Direct URL:** [${p.url}](${p.url})\n`;
    }
    md += `- **Citation Count:** ${p.citationCount ?? 0}\n`;
    md += `- **Access:** ${isOpenAccess ? '🔓 Open Access' : '🔒 Subscription / Paywall'}`;
    if (p.openAccessPdf) {
      md += ` &mdash; [Download Legal OA PDF](${p.openAccessPdf})`;
    }
    md += `\n`;
    if (p.source) {
      md += `- **Registry Source:** ${p.source.toUpperCase()}\n`;
    }
    if (tags) {
      md += `- **Academic Tags / Concepts:** ${tags}\n`;
    }

    if (includeAbstracts) {
      const abstractText = p.abstract?.trim() || 'No abstract available for this record.';
      md += `\n**Abstract:**\n\n`;
      // Format as blockquote with proper multiline markdown formatting
      md += abstractText
        .split('\n')
        .map((line) => `> ${line}`)
        .join('\n') + '\n\n';
    }

    md += `---\n\n`;
  });

  md += `*Generated by ScholarForge Literature Discovery & Grounding Suite.*\n`;
  return md;
}

/**
 * 3. CSV / SPREADSHEET EXPORT
 * RFC 4180 compliant CSV with UTF-8 BOM for immediate Excel & Google Sheets compatibility.
 */
export function exportLiteratureToCsv(
  papers: AcademicPaper[],
  _options: LiteratureExportOptions = {}
): string {
  const headers = [
    'Record_ID',
    'Number',
    'Title',
    'Authors',
    'Publication_Year',
    'Journal_Venue',
    'DOI',
    'DOI_URL',
    'Direct_URL',
    'Citation_Count',
    'Open_Access',
    'Open_Access_PDF',
    'Source_Registry',
    'Keywords_Concepts',
    'Abstract',
  ];

  const escapeCsv = (val: any): string => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/\r?\n/g, ' ').replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = papers.map((p, idx) => {
    const doiUrl = formatDoiUrl(p.doi);
    const cleanDoi = p.doi ? p.doi.replace(/^https?:\/\/(dx\.)?doi\.org\//i, '').trim() : '';
    const authorsStr = p.authors.map((a) => a.name).join('; ');
    const tagsStr = extractAcademicTags(p).map((t) => t.label).join('; ');
    const isOpenAccess = Boolean(p.openAccess) ? 'YES' : 'NO';

    return [
      escapeCsv(p.id),
      escapeCsv(idx + 1),
      escapeCsv(p.title),
      escapeCsv(authorsStr),
      escapeCsv(p.year || ''),
      escapeCsv(p.venue || ''),
      escapeCsv(cleanDoi),
      escapeCsv(doiUrl),
      escapeCsv(p.url || ''),
      escapeCsv(p.citationCount ?? 0),
      escapeCsv(isOpenAccess),
      escapeCsv(p.openAccessPdf || ''),
      escapeCsv(p.source || 'federated'),
      escapeCsv(tagsStr),
      escapeCsv(p.abstract || ''),
    ].join(',');
  });

  // Prepend UTF-8 BOM (\ufeff) so Excel properly opens foreign characters and accents
  return '\ufeff' + [headers.join(','), ...rows].join('\r\n');
}

/**
 * 4. MICROSOFT WORD (.DOC) EXPORT
 * Full formatted Word Document (Office XML / HTML MIME) with academic typography,
 * styled abstract panels, hyperlinked DOIs, author affiliations, and dataset scientometrics.
 */
export function exportLiteratureToWordHtml(
  papers: AcademicPaper[],
  options: LiteratureExportOptions = {}
): string {
  const {
    topic = '',
    style = 'apa',
    includeAbstracts = true,
    includeTags = true,
    includeMetrics = true,
    documentTitle = 'Scholarly Literature Dossier',
  } = options;

  const dateStr = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const metrics = includeMetrics ? calculateDatasetMetrics(papers) : null;

  const escapeHTML = (str: string): string => {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  };

  const recordsHtml = papers
    .map((paper, index) => {
      const citationText = formatReferenceEntryPlain(paper, style, index + 1);
      const doiUrl = formatDoiUrl(paper.doi);
      const tags = includeTags ? extractAcademicTags(paper) : [];
      const tagString = tags.map((t) => t.label).join(' &bull; ');
      const abstractText = paper.abstract?.trim() || 'No abstract provided in academic registries.';

      return `
        <div class="record-card">
          <div class="citation-header">
            <span class="record-number">[${index + 1}]</span>
            <span class="citation-text"><b>${escapeHTML(citationText)}</b></span>
          </div>

          <table class="meta-table" width="100%">
            <tr>
              <td class="meta-label">Journal / Venue:</td>
              <td class="meta-value"><em>${escapeHTML(paper.venue || 'Scholarly Publication')}</em> (${paper.year || 'N/A'})</td>
              <td class="meta-label">Citations:</td>
              <td class="meta-value"><strong>${paper.citationCount ?? 0}</strong></td>
            </tr>
            ${
              doiUrl
                ? `<tr>
                    <td class="meta-label">DOI:</td>
                    <td class="meta-value" colspan="3">
                      <a href="${escapeHTML(doiUrl)}" style="color: #1e3a8a; text-decoration: underline;">
                        ${escapeHTML(doiUrl)}
                      </a>
                    </td>
                  </tr>`
                : ''
            }
            ${
              paper.openAccessPdf
                ? `<tr>
                    <td class="meta-label">Open Access PDF:</td>
                    <td class="meta-value" colspan="3">
                      <a href="${escapeHTML(paper.openAccessPdf)}" style="color: #065f46; text-decoration: underline;">
                        Direct PDF Download Link
                      </a>
                    </td>
                  </tr>`
                : ''
            }
            ${
              tagString
                ? `<tr>
                    <td class="meta-label">Keywords / Tags:</td>
                    <td class="meta-value" colspan="3"><span style="color: #2563eb;">${escapeHTML(tagString)}</span></td>
                  </tr>`
                : ''
            }
          </table>

          ${
            includeAbstracts
              ? `
            <div class="abstract-container">
              <div class="abstract-title">ABSTRACT</div>
              <div class="abstract-body">${escapeHTML(abstractText)}</div>
            </div>
            `
              : ''
          }
        </div>
      `;
    })
    .join('\n');

  return `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' 
          xmlns:w='urn:schemas-microsoft-com:office:word' 
          xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>${escapeHTML(documentTitle)}</title>
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
          font-size: 11pt;
          line-height: 1.45;
          color: #111827;
        }
        h1.main-title {
          text-align: center;
          font-size: 18pt;
          font-weight: bold;
          margin-bottom: 4pt;
          color: #0f172a;
        }
        p.subtitle {
          text-align: center;
          font-size: 11pt;
          color: #475569;
          margin-top: 0;
          margin-bottom: 16pt;
          font-style: italic;
        }
        .metrics-banner {
          background-color: #f1f5f9;
          border: 1pt solid #cbd5e1;
          padding: 10pt;
          margin-bottom: 20pt;
          font-size: 10pt;
        }
        .record-card {
          margin-bottom: 22pt;
          padding-bottom: 14pt;
          border-bottom: 1pt solid #e2e8f0;
          page-break-inside: avoid;
        }
        .citation-header {
          font-size: 11.5pt;
          margin-bottom: 6pt;
          line-height: 1.4;
        }
        .record-number {
          color: #1e3a8a;
          font-weight: bold;
          margin-right: 4pt;
        }
        .meta-table {
          font-size: 9.5pt;
          margin-top: 4pt;
          margin-bottom: 8pt;
          border-collapse: collapse;
        }
        .meta-label {
          color: #64748b;
          font-weight: bold;
          width: 18%;
          padding: 2pt 4pt;
          vertical-align: top;
        }
        .meta-value {
          color: #1e293b;
          padding: 2pt 4pt;
          vertical-align: top;
        }
        .abstract-container {
          background-color: #f8fafc;
          border-left: 3pt solid #1e3a8a;
          padding: 8pt 10pt;
          margin-top: 6pt;
        }
        .abstract-title {
          font-size: 8.5pt;
          font-weight: bold;
          color: #1e3a8a;
          letter-spacing: 0.5pt;
          margin-bottom: 3pt;
        }
        .abstract-body {
          font-size: 10pt;
          color: #334155;
          line-height: 1.4;
          text-align: justify;
        }
      </style>
    </head>
    <body>
      <h1 class="main-title">${escapeHTML(documentTitle)}</h1>
      <p class="subtitle">
        ${topic ? `Inquiry / Topic: <strong>${escapeHTML(topic)}</strong> &bull; ` : ''}
        ${papers.length} Peer-Reviewed Records &bull; Style: ${style.toUpperCase()} &bull; ${dateStr}
      </p>

      ${
        metrics
          ? `
        <div class="metrics-banner">
          <strong>Corpus Scientometrics Overview:</strong>
          Dataset $h$-Index: <strong>${metrics.hIndex}</strong> &bull;
          Total Citations: <strong>${metrics.totalCitations.toLocaleString()}</strong> (Mean: ${metrics.avgCitations}/paper) &bull;
          Open Access: <strong>${metrics.openAccessPct}%</strong>
        </div>
        `
          : ''
      }

      ${recordsHtml}

      <p style="text-align: center; font-size: 9pt; color: #94a3b8; margin-top: 30pt;">
        Curated and verified via ScholarForge Academic Intelligence Suite.
      </p>
    </body>
    </html>
  `;
}

/**
 * 5. BIBTEX (.BIB) EXPORT
 * Full BibTeX collection including title, author, journal, year, doi, url, and full abstract.
 */
export function exportLiteratureToBibtex(papers: AcademicPaper[]): string {
  return papers
    .map((paper) => {
      const key = generateBibtexKey(paper);
      const authors = paper.authors.map((a) => a.name).join(' and ') || 'Anonymous';
      const year = paper.year || '2024';
      const title = paper.title.replace(/[{}]/g, '');
      const venue = (paper.venue || 'Journal').replace(/[{}]/g, '');
      const cleanDoi = paper.doi ? paper.doi.replace(/^https?:\/\/(dx\.)?doi\.org\//i, '').trim() : '';
      const abstractClean = paper.abstract ? paper.abstract.replace(/[{}]/g, '').replace(/\r?\n/g, ' ') : '';

      return `@article{${key},
  title = {${title}},
  author = {${authors}},
  journal = {${venue}},
  year = {${year}},${paper.volume ? `\n  volume = {${paper.volume}},` : ''}${paper.issue ? `\n  number = {${paper.issue}},` : ''}${paper.pages ? `\n  pages = {${paper.pages}},` : ''}${cleanDoi ? `\n  doi = {${cleanDoi}},` : ''}${paper.url ? `\n  url = {${paper.url}},` : ''}${abstractClean ? `\n  abstract = {${abstractClean}}` : ''}
}`;
    })
    .join('\n\n');
}

/**
 * 6. RIS (.RIS) EXPORT
 * Standard Research Information Systems format for Zotero, Mendeley, EndNote.
 */
export function exportLiteratureToRis(papers: AcademicPaper[]): string {
  return generateRIS(papers);
}

// -------------------------------------------------------------
// BROWSER DOWNLOAD HELPERS
// -------------------------------------------------------------

function triggerBrowserDownload(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function sanitizeFilename(topic: string, defaultName: string): string {
  if (!topic) return defaultName;
  const safe = topic
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .slice(0, 40)
    .replace(/^_+|_+$/g, '');
  return safe ? `ScholarForge_${safe}` : defaultName;
}

export function downloadLiteratureJson(
  papers: AcademicPaper[],
  options: LiteratureExportOptions = {}
): void {
  const content = exportLiteratureToJson(papers, options);
  const baseName = sanitizeFilename(options.topic || '', 'ScholarForge_Literature');
  triggerBrowserDownload(content, `${baseName}_records.json`, 'application/json;charset=utf-8');
}

export function downloadLiteratureMarkdown(
  papers: AcademicPaper[],
  options: LiteratureExportOptions = {}
): void {
  const content = exportLiteratureToMarkdown(papers, options);
  const baseName = sanitizeFilename(options.topic || '', 'ScholarForge_Literature');
  triggerBrowserDownload(content, `${baseName}_records.md`, 'text/markdown;charset=utf-8');
}

export function downloadLiteratureCsv(
  papers: AcademicPaper[],
  options: LiteratureExportOptions = {}
): void {
  const content = exportLiteratureToCsv(papers, options);
  const baseName = sanitizeFilename(options.topic || '', 'ScholarForge_Literature');
  triggerBrowserDownload(content, `${baseName}_records.csv`, 'text/csv;charset=utf-8');
}

export function downloadLiteratureWord(
  papers: AcademicPaper[],
  options: LiteratureExportOptions = {}
): void {
  const content = exportLiteratureToWordHtml(papers, options);
  const baseName = sanitizeFilename(options.topic || '', 'ScholarForge_Literature');
  triggerBrowserDownload('\ufeff' + content, `${baseName}_dossier.doc`, 'application/msword;charset=utf-8');
}

export function downloadLiteratureBibtex(
  papers: AcademicPaper[],
  options: LiteratureExportOptions = {}
): void {
  const content = exportLiteratureToBibtex(papers);
  const baseName = sanitizeFilename(options.topic || '', 'ScholarForge_Literature');
  triggerBrowserDownload(content, `${baseName}_references.bib`, 'text/plain;charset=utf-8');
}

export function downloadLiteratureRis(
  papers: AcademicPaper[],
  options: LiteratureExportOptions = {}
): void {
  const content = exportLiteratureToRis(papers);
  const baseName = sanitizeFilename(options.topic || '', 'ScholarForge_Literature');
  triggerBrowserDownload(content, `${baseName}_references.ris`, 'application/x-research-info-systems;charset=utf-8');
}
