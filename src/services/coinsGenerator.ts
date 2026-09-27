import type { AcademicPaper } from '../types/citation';

/**
 * Generates OpenURL Z39.88-2004 COinS metadata attribute string.
 * When placed inside `<span class="Z3988" title={generateCOinS(paper)} />`,
 * browser extensions like Zotero Connector and Mendeley Web Importer
 * automatically detect the citation and allow 1-click import.
 */
export function generateCOinS(paper: AcademicPaper): string {
  if (!paper || !paper.title) return '';

  const params: string[] = [];
  params.push('url_ver=Z39.88-2004');
  params.push('ctx_ver=Z39.88-2004');

  const type = paper.type || 'journal';

  if (type === 'book') {
    params.push('rft_val_fmt=info%3Aofi%2Ffmt%3Akev%3Amtx%3Abook');
    params.push('rft.genre=book');
    params.push(`rft.btitle=${encodeURIComponent(paper.title)}`);
    if (paper.publisher) {
      params.push(`rft.pub=${encodeURIComponent(paper.publisher)}`);
    }
  } else {
    params.push('rft_val_fmt=info%3Aofi%2Ffmt%3Akev%3Amtx%3Ajournal');
    params.push('rft.genre=article');
    params.push(`rft.atitle=${encodeURIComponent(paper.title)}`);
    if (paper.venue) {
      params.push(`rft.jtitle=${encodeURIComponent(paper.venue)}`);
    }
  }

  if (paper.year) {
    params.push(`rft.date=${encodeURIComponent(paper.year.toString())}`);
  }

  if (paper.volume) {
    params.push(`rft.volume=${encodeURIComponent(paper.volume)}`);
  }

  if (paper.issue) {
    params.push(`rft.issue=${encodeURIComponent(paper.issue)}`);
  }

  if (paper.pages) {
    const pageParts = paper.pages.split(/[-–—]/);
    if (pageParts[0]) params.push(`rft.spage=${encodeURIComponent(pageParts[0].trim())}`);
    if (pageParts[1]) params.push(`rft.epage=${encodeURIComponent(pageParts[1].trim())}`);
  }

  if (paper.doi) {
    const cleanDoi = paper.doi.replace(/^https?:\/\/(dx\.)?doi\.org\//i, '').trim();
    params.push(`rft.id=info%3Adoi%2F${encodeURIComponent(cleanDoi)}`);
  }

  if (paper.url) {
    params.push(`rft_id=${encodeURIComponent(paper.url)}`);
  }

  // Authors
  if (paper.authors && paper.authors.length > 0) {
    paper.authors.forEach((a) => {
      const name = a.familyName && a.givenName ? `${a.familyName}, ${a.givenName}` : a.name;
      if (name) {
        params.push(`rft.au=${encodeURIComponent(name.trim())}`);
      }
    });
  }

  return params.join('&');
}
