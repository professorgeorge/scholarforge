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
  source: 'openalex' | 'crossref' | 'semanticscholar' | 'manual';
  relevanceScore?: number;
  volume?: string;
  issue?: string;
  pages?: string;
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
