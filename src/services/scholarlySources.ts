export const SCHOLARLY_SOURCES = {
  openalex: { label: 'OpenAlex', description: 'Multidisciplinary works and citation metadata.', url: 'https://openalex.org/' },
  europepmc: { label: 'Europe PMC', description: 'Biomedical literature, abstracts, and full-text links.', url: 'https://europepmc.org/' },
  crossref: { label: 'Crossref', description: 'Publisher DOI records across disciplines.', url: 'https://www.crossref.org/' },
  pubmed: { label: 'PubMed', description: 'Direct NCBI biomedical search. Overlaps with Europe PMC; duplicates are merged.', url: 'https://pubmed.ncbi.nlm.nih.gov/' },
  datacite: { label: 'DataCite', description: 'Repository papers, theses, and reports. Metadata registration does not establish peer review.', url: 'https://commons.datacite.org/' },
  semanticscholar: { label: 'Semantic Scholar (optional)', description: 'Citation graph. Public access is often rate limited; failures do not stop other sources.', url: 'https://www.semanticscholar.org/' },
  arxiv: { label: 'arXiv (preprints)', description: 'Preprints. Enable preprints in the quality filters to include these records.', url: 'https://arxiv.org/' },
} as const;

export type ScholarlySourceId = keyof typeof SCHOLARLY_SOURCES;
export type ScholarlySourceSelection = Record<ScholarlySourceId, boolean>;
export const DEFAULT_SCHOLARLY_SOURCES: ScholarlySourceSelection = {
  openalex: true, europepmc: true, crossref: true, pubmed: true, datacite: true,
  semanticscholar: false, arxiv: false,
};

export function scholarlySourceLabel(source: string): string {
  return source in SCHOLARLY_SOURCES ? SCHOLARLY_SOURCES[source as ScholarlySourceId].label : source;
}
