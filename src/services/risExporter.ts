import type { AcademicPaper } from '../types/citation';

/**
 * Generates standard RIS reference format compatible with EndNote, Zotero, Mendeley, Citavi, and RefWorks.
 */
export function generateRIS(papers: AcademicPaper[]): string {
  if (!papers || papers.length === 0) return '';

  return papers
    .map((paper) => {
      const isBook = paper.type === 'book';
      const lines: string[] = [
        `TY  - ${isBook ? 'BOOK' : 'JOUR'}`,
        `TI  - ${paper.title}`,
      ];

      // Authors
      if (paper.authors && paper.authors.length > 0) {
        paper.authors.forEach((a) => {
          const authorFormatted =
            a.familyName && a.givenName ? `${a.familyName}, ${a.givenName}` : a.name;
          lines.push(`AU  - ${authorFormatted}`);
        });
      }

      if (paper.year) {
        lines.push(`PY  - ${paper.year}`);
      }

      if (paper.venue) {
        lines.push(`JO  - ${paper.venue}`);
        lines.push(`T2  - ${paper.venue}`);
      }

      if (paper.volume) {
        lines.push(`VL  - ${paper.volume}`);
      }

      if (paper.issue) {
        lines.push(`IS  - ${paper.issue}`);
      }

      if (paper.pages) {
        const parts = paper.pages.split(/[-–—]/);
        if (parts[0]) lines.push(`SP  - ${parts[0].trim()}`);
        if (parts[1]) lines.push(`EP  - ${parts[1].trim()}`);
      }

      if (paper.doi) {
        const cleanDoi = paper.doi.replace(/^https?:\/\/(dx\.)?doi\.org\//i, '').trim();
        lines.push(`DO  - ${cleanDoi}`);
      }

      if (paper.url) {
        lines.push(`UR  - ${paper.url}`);
      }

      if (paper.abstract) {
        lines.push(`AB  - ${paper.abstract.replace(/\r?\n/g, ' ')}`);
        lines.push(`N2  - ${paper.abstract.replace(/\r?\n/g, ' ')}`);
      }

      if (paper.publisher) {
        lines.push(`PB  - ${paper.publisher}`);
      }

      lines.push('ER  - ');
      return lines.join('\r\n');
    })
    .join('\r\n\r\n');
}

/**
 * Triggers a download of a RIS file in the user's browser.
 */
export function downloadRISFile(papers: AcademicPaper[], filename = 'ScholarForge_References.ris'): void {
  const content = generateRIS(papers);
  const blob = new Blob([content], { type: 'application/x-research-info-systems;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
