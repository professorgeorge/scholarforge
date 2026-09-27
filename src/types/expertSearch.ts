export type SearchObjective = 'grant_coi' | 'coauthor' | 'consultant' | 'reviewer';

export interface ObjectiveMeta {
  id: SearchObjective;
  title: string;
  shortLabel: string;
  tagline: string;
  badge: string;
  scoreName: string;
  scoreDescription: string;
  primaryAction: string;
  recommendedStages: string;
  targetOutcome: string;
  iconName: 'Building' | 'FileEdit' | 'Briefcase' | 'ShieldCheck';
}

export interface Work {
  id: string;
  doi: string | null;
  title: string;
  publication_year: number;
  cited_by_count: number;
  venue: string | null;
  is_oa: boolean;
  oa_url: string | null;
  author_position: 'first' | 'middle' | 'last' | 'unknown';
  is_corresponding: boolean;
  raw_affiliation?: string;
  abstract?: string;
}

export type CareerStage = 'Early-Career Specialist' | 'Mid-Career Authority' | 'Senior Group Leader / PI';

export type EmailSource = 
  | 'pubmed_xml' 
  | 'openalex_metadata' 
  | 'oa_paper' 
  | 'orcid_profile' 
  | 'synthesized_domain'
  | null;

export type EmailConfidence = 'verified' | 'high' | 'probable' | 'heuristic' | 'none';

export interface ScoreBreakdown {
  semanticMatch: number;      // 0 to 40
  recency: number;            // 0 to 25
  careerSweetSpot: number;    // 0 to 20
  authorshipLead: number;     // 0 to 15
  overloadPenalty: number;    // 0 to -15
}

export interface ObjectiveScoreDimension {
  key: string;
  label: string;
  score: number;
  maxScore: number;
  description: string;
}

export interface CoiStatus {
  hasCoi: boolean;
  reasons: string[];
  severity: 'critical' | 'medium' | 'none';
  matchedAuthors: string[];
  matchedInstitutions: string[];
}

export interface ReviewerCandidate {
  id: string;
  name: string;
  orcid: string | null;
  affiliations: string[];
  institutions: Array<{
    id: string;
    name: string;
    ror?: string | null;
    country_code?: string | null;
  }>;
  primaryInstitution: string;
  countryCode: string | null;
  email: string | null;
  emailSource: EmailSource;
  emailConfidence: EmailConfidence;
  careerStage: CareerStage;
  sampleWorks: Work[];
  totalRecentWorksCount: number;
  totalRecentCitations: number;
  hIndexEst: number;
  readinessScore: number;                 // 0 to 100
  scoreBreakdown: ScoreBreakdown;
  objectiveBreakdown?: ObjectiveScoreDimension[];
  objectiveFitBadge?: string;             // e.g. "Ideal Co-I Lead", "Prime Reviewer Sweet Spot"
  objectiveFitSummary?: string;           // 1-sentence contextual summary for the active objective
  coiStatus: CoiStatus;
  acceptanceLikelihood: 'High' | 'Moderate' | 'Low (PI Overload)';
  publicationVelocity: string;
  isShortlisted?: boolean;
  isExcluded?: boolean;
  selectedForExport?: boolean;
}

export type ExpertCandidate = ReviewerCandidate;

export interface ManuscriptQuery {
  title: string;
  abstract: string;
  keywords: string;
  submittedAuthors: string;       // comma or newline separated
  submittedInstitutions: string;  // comma or newline separated
}

export type ProjectQuery = ManuscriptQuery;

export type GeographicRegion = 'all' | 'na' | 'eu' | 'apac' | 'latam' | 'mea';

export interface FilterOptions {
  minScore: number;
  careerStage: 'all' | 'early' | 'mid' | 'senior';
  emailVerifiedOnly: boolean;
  hideCoi: boolean;
  searchQuery: string;
  sortBy: 'score' | 'citations' | 'hindex' | 'name';
  region: GeographicRegion;
  shortlistedOnly: boolean;
}

export interface EmailTemplate {
  subject: string;
  body: string;
  objective?: SearchObjective;
}
