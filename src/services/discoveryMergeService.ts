import type { AcademicPaper } from '../types/citation';

export function normalizedDoi(doi: string): string {
  return (doi || '').trim().replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, '').replace(/^doi:\s*/i, '').toLowerCase();
}

function titleKey(paper: AcademicPaper): string {
  const title = paper.title.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
  // Short generic titles are not a reliable identity. Different years remain distinct.
  return title.length >= 20 ? `${title}:${paper.year || ''}` : '';
}

/** Keep distinct DOIs separate; preserve every registry that supplied a duplicate. */
export function mergeDiscoveryPapers(papers: AcademicPaper[]): { papers: AcademicPaper[]; duplicatesRemoved: number } {
  const unique: AcademicPaper[] = [];
  const doiIndex = new Map<string, number>();
  const titleIndex = new Map<string, number[]>();
  let duplicatesRemoved = 0;
  for (const original of papers) {
    const paper = structuredClone(original);
    const doi = normalizedDoi(paper.doi);
    const title = titleKey(paper);
    let match = doi ? doiIndex.get(doi) : undefined;
    if (match === undefined && title) {
      match = (titleIndex.get(title) || []).find(index => {
        const existing = unique[index];
        const existingDoi = normalizedDoi(existing.doi);
        if (doi && existingDoi && doi !== existingDoi) return false;
        const a = existing.authors[0]?.familyName || existing.authors[0]?.name;
        const b = paper.authors[0]?.familyName || paper.authors[0]?.name;
        return !a || !b || a.toLowerCase() === b.toLowerCase();
      });
    }
    if (match === undefined) {
      const index = unique.length;
      unique.push({ ...paper, doi });
      if (doi) doiIndex.set(doi, index);
      if (title) titleIndex.set(title, [...(titleIndex.get(title) || []), index]);
      continue;
    }
    duplicatesRemoved++;
    const previous = unique[match];
    const provenance = [...(previous.registryProvenance || []), ...(paper.registryProvenance || [])];
    unique[match] = {
      ...previous,
      doi: previous.doi || doi,
      abstract: previous.abstract || paper.abstract,
      authors: previous.authors.length ? previous.authors : paper.authors,
      venue: previous.venue || paper.venue,
      pmid: previous.pmid || paper.pmid,
      pmcid: previous.pmcid || paper.pmcid,
      openAccess: previous.openAccess || paper.openAccess,
      openAccessPdf: previous.openAccessPdf || paper.openAccessPdf,
      isRetracted: previous.isRetracted || paper.isRetracted,
      retractionDetails: previous.retractionDetails || paper.retractionDetails,
      // Preserve the primary provider's count; graph totals are not added together.
      registryProvenance: provenance.filter((item, index) => provenance.findIndex(other => other.registry === item.registry && other.recordId === item.recordId && other.query === item.query) === index),
    };
    if (doi) doiIndex.set(doi, match);
  }
  return { papers: unique, duplicatesRemoved };
}
