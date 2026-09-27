export interface Author {
  name: string;
  givenName?: string;
  familyName?: string;
}

export interface AcademicPaper {
  id: string;
  title: string;
  authors: Author[];
  year: number;
  venue: string;
  doi: string;
  url: string;
  citationCount: number;
  abstract: string;
  openAccess: boolean;
  openAccessPdf?: string;
  source: 'openalex' | 'crossref' | 'europepmc' | 'semanticscholar' | 'arxiv' | 'manual';
  relevanceScore?: number;
  volume?: string;
  issue?: string;
  pages?: string;
  type?: 'journal' | 'book' | 'conference' | 'preprint';
  publisher?: string;
  isRetracted?: boolean;
  retractionDetails?: string;
  pmid?: string;
  pmcid?: string;
}

export interface DatasetMetrics {
  totalPapers: number;
  totalCitations: number;
  avgCitations: number;
  hIndex: number;
  highlyCitedCount: number; // 100+ citations
  influentialCount: number; // 25+ citations
  emergingCount: number; // <25 citations
  openAccessCount: number;
  openAccessPct: number;
}

export interface AcademicPromptTemplate {
  id: string;
  title: string;
  iconName: string;
  badge: string;
  description: string;
  template: (papers: AcademicPaper[], query?: string) => string;
}

export type ConfidenceLevel = 'high' | 'medium' | 'low';
export type ClaimStatus = 'pending' | 'searching' | 'found' | 'not_found' | 'skipped';

export interface Claim {
  id: string;
  text: string;
  rawSentence: string;
  paragraphIndex: number;
  sentenceIndex: number;
  startIndex: number;
  endIndex: number;
  confidence: ConfidenceLevel;
  keywords: string[];
  searchQueries: string[];
  candidatePapers: AcademicPaper[];
  selectedPaper: AcademicPaper | null;
  status: ClaimStatus;
  customQuery?: string;
  isExcluded: boolean;
  citationNumber?: number; // For numeric styles like IEEE / Vancouver / Nature
}

export type CitationStyle =
  | 'apa'
  | 'mla'
  | 'chicago'
  | 'harvard'
  | 'ieee'
  | 'vancouver'
  | 'nature'
  | 'bibtex';

export interface CitationStyleInfo {
  id: CitationStyle;
  name: string;
  shortName: string;
  category: 'Author-Date' | 'Numeric' | 'Notes' | 'Code';
  inTextExample: string;
  referenceExample: string;
  description: string;
}

export interface CitationOptions {
  style: CitationStyle;
  includeDoi: boolean;
  includeAbstracts: boolean;
  maxAuthorsInText: number;
  linkCitations: boolean;
  excludePreprints: boolean;
  requireDoi: boolean;
}

export interface SampleEssay {
  id: string;
  title: string;
  category: string;
  description: string;
  content: string;
}
