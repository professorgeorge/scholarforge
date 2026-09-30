export interface JournalCandidate {
  id: string;
  title: string;
  issn: string;
  publisher: string;
  isOa: boolean;
  oaType: 'Diamond OA ($0 APC)' | 'Gold OA' | 'Hybrid' | 'Subscription';
  apcUsd: number | null;
  citeScore: number;
  hIndex: number;
  scopusQuartile: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  reviewSpeedWeeks: string;
  acceptanceRateEstimated: string;
  topics: string[];
  homepageUrl: string;
  matchScore: number;
  matchRationale: string;
  isDoaj: boolean;
  tier?: 'Stretch (High Impact)' | 'Target (Core Fit)' | 'Fast-Track (Rapid OA)';
  aimsScopeAlignment?: string;
}

export interface PreFlightCheckItem {
  id: string;
  title: string;
  category: 'Structure' | 'Ethics & Integrity' | 'Data & Reproducibility' | 'Citations';
  status: 'pass' | 'warning' | 'fail';
  message: string;
  fixAdvice: string;
  autoFixContent?: string;
}

export interface PreFlightAuditReport {
  overallScore: number;
  status: 'Ready for Submission' | 'Minor Revisions Advised' | 'High Desk-Rejection Risk';
  abstractWordCount: number;
  abstractMaxRecommended: number;
  referencesCount: number;
  recentReferencesPercent: number;
  checks: PreFlightCheckItem[];
  generatedDeclarations: {
    dataAvailability: string;
    conflictOfInterest: string;
    ethicalApproval: string;
  };
}

export interface JournalFilterCriteria {
  searchQuery: string;
  oaModel: 'all' | 'diamond' | 'gold' | 'hybrid';
  maxApc: number | null;
  minQuartile: 'all' | 'Q1' | 'Q2';
  publisher: string;
}

// Exemplar fallback registry for instant discovery or offline mode
export const BASELINE_JOURNALS_REGISTRY: JournalCandidate[] = [
  {
    id: 'S1983995261',
    title: 'PLOS ONE',
    issn: '1932-6203',
    publisher: 'Public Library of Science',
    isOa: true,
    oaType: 'Gold OA',
    apcUsd: 2290,
    citeScore: 5.6,
    hIndex: 432,
    scopusQuartile: 'Q1',
    reviewSpeedWeeks: '5 to 7 weeks',
    acceptanceRateEstimated: '48% to 52%',
    topics: ['Multidisciplinary', 'Clinical Trials', 'Biomedical Science', 'Computer Science'],
    homepageUrl: 'https://journals.plos.org/plosone/',
    matchScore: 94,
    matchRationale: 'Broad scope with strong acceptance for rigorous empirical methodologies and open datasets.',
    isDoaj: true,
  },
  {
    id: 'S2764959074',
    title: 'Nature Communications',
    issn: '2041-1723',
    publisher: 'Springer Nature',
    isOa: true,
    oaType: 'Gold OA',
    apcUsd: 6790,
    citeScore: 23.4,
    hIndex: 420,
    scopusQuartile: 'Q1',
    reviewSpeedWeeks: '6 to 9 weeks',
    acceptanceRateEstimated: '14% to 18%',
    topics: ['Natural Sciences', 'Biomedicine', 'Machine Learning', 'Physics'],
    homepageUrl: 'https://www.nature.com/ncomms/',
    matchScore: 92,
    matchRationale: 'Premier multidisciplinary open access venue for high-significance breakthroughs.',
    isDoaj: true,
  },
  {
    id: 'S128919022',
    title: 'BMJ Open',
    issn: '2044-6055',
    publisher: 'BMJ Publishing Group',
    isOa: true,
    oaType: 'Gold OA',
    apcUsd: 3150,
    citeScore: 4.8,
    hIndex: 145,
    scopusQuartile: 'Q1',
    reviewSpeedWeeks: '6 to 8 weeks',
    acceptanceRateEstimated: '35% to 42%',
    topics: ['Clinical Medicine', 'Epidemiology', 'Public Health', 'Health Services'],
    homepageUrl: 'https://bmjopen.bmj.com/',
    matchScore: 90,
    matchRationale: 'Strict adherence to PRISMA and clinical trial registration protocols.',
    isDoaj: true,
  },
  {
    id: 'S4210172589',
    title: 'PeerJ Computer Science',
    issn: '2376-5992',
    publisher: 'PeerJ Inc.',
    isOa: true,
    oaType: 'Gold OA',
    apcUsd: 1490,
    citeScore: 6.2,
    hIndex: 58,
    scopusQuartile: 'Q2',
    reviewSpeedWeeks: '4 to 6 weeks',
    acceptanceRateEstimated: '40% to 45%',
    topics: ['Computer Science', 'Artificial Intelligence', 'Data Science', 'Human Computer Interaction'],
    homepageUrl: 'https://peerj.com/computer-science/',
    matchScore: 89,
    matchRationale: 'Rapid peer-review turnaround with emphasis on reproducible computational workflows.',
    isDoaj: true,
  },
  {
    id: 'S189020478',
    title: 'Journal of Medical Internet Research (JMIR)',
    issn: '1438-8871',
    publisher: 'JMIR Publications',
    isOa: true,
    oaType: 'Gold OA',
    apcUsd: 3250,
    citeScore: 10.5,
    hIndex: 182,
    scopusQuartile: 'Q1',
    reviewSpeedWeeks: '4 to 6 weeks',
    acceptanceRateEstimated: '22% to 28%',
    topics: ['Digital Health', 'Medical Informatics', 'Clinical AI', 'Telemedicine'],
    homepageUrl: 'https://www.jmir.org/',
    matchScore: 91,
    matchRationale: 'Leading digital health journal prioritizing computational interventions and health metrics.',
    isDoaj: true,
  },
  {
    id: 'S203256638',
    title: 'BMC Medicine',
    issn: '1741-7015',
    publisher: 'BioMed Central',
    isOa: true,
    oaType: 'Gold OA',
    apcUsd: 3890,
    citeScore: 16.8,
    hIndex: 175,
    scopusQuartile: 'Q1',
    reviewSpeedWeeks: '5 to 8 weeks',
    acceptanceRateEstimated: '15% to 20%',
    topics: ['Translational Medicine', 'Clinical Trials', 'Global Health'],
    homepageUrl: 'https://bmcmedicine.biomedcentral.com/',
    matchScore: 88,
    matchRationale: 'High-impact medical research with strong preference for multi-cohort datasets.',
    isDoaj: true,
  },
  {
    id: 'S4210214842',
    title: 'IEEE Access',
    issn: '2169-3536',
    publisher: 'IEEE',
    isOa: true,
    oaType: 'Gold OA',
    apcUsd: 1950,
    citeScore: 7.2,
    hIndex: 198,
    scopusQuartile: 'Q1',
    reviewSpeedWeeks: '3 to 5 weeks',
    acceptanceRateEstimated: '32% to 38%',
    topics: ['Electrical Engineering', 'Signal Processing', 'AI and Machine Learning', 'Telecommunications'],
    homepageUrl: 'https://ieeeaccess.ieee.org/',
    matchScore: 87,
    matchRationale: 'Rapid peer-review with broad IEEE scope across computational and engineering domains.',
    isDoaj: true,
  },
  {
    id: 'S200892019',
    title: 'Frontiers in Digital Health',
    issn: '2673-253X',
    publisher: 'Frontiers Media',
    isOa: true,
    oaType: 'Gold OA',
    apcUsd: 1790,
    citeScore: 5.1,
    hIndex: 38,
    scopusQuartile: 'Q2',
    reviewSpeedWeeks: '4 to 6 weeks',
    acceptanceRateEstimated: '45% to 50%',
    topics: ['Digital Health', 'Clinical AI', 'Personalized Medicine', 'Epidemiology'],
    homepageUrl: 'https://www.frontiersin.org/journals/digital-health',
    matchScore: 86,
    matchRationale: 'Interactive peer-review with transparent reviewer reporting.',
    isDoaj: true,
  },
  {
    id: 'S119827361',
    title: 'Journal of Open Source Software (JOSS)',
    issn: '2475-9066',
    publisher: 'Open Journals',
    isOa: true,
    oaType: 'Diamond OA ($0 APC)',
    apcUsd: 0,
    citeScore: 4.1,
    hIndex: 42,
    scopusQuartile: 'Q2',
    reviewSpeedWeeks: '3 to 5 weeks',
    acceptanceRateEstimated: '70% to 80%',
    topics: ['Open Source Software', 'Scientific Computing', 'Data Science', 'Reproducibility'],
    homepageUrl: 'https://joss.theoj.org/',
    matchScore: 85,
    matchRationale: 'Diamond open access with zero APC fees, dedicated to scholarly research software and reproducibility.',
    isDoaj: true,
  },
  {
    id: 'S982716382',
    title: 'Digital Biomarkers',
    issn: '2504-110X',
    publisher: 'Karger Publishers',
    isOa: true,
    oaType: 'Gold OA',
    apcUsd: 2100,
    citeScore: 4.9,
    hIndex: 28,
    scopusQuartile: 'Q2',
    reviewSpeedWeeks: '4 to 6 weeks',
    acceptanceRateEstimated: '38% to 44%',
    topics: ['Sensors', 'Wearables', 'Clinical Informatics', 'Digital Biomarkers'],
    homepageUrl: 'https://www.karger.com/Journal/Home/271708',
    matchScore: 84,
    matchRationale: 'Focused on wearable sensors, behavioral telemetry, and clinical validation.',
    isDoaj: true,
  }
];

/**
 * Searches and ranks journals based on manuscript title, abstract, and filtering criteria.
 */
export async function matchJournalsForManuscript(
  title: string,
  abstract: string,
  filters: Partial<JournalFilterCriteria> = {}
): Promise<JournalCandidate[]> {
  const combinedText = `${title} ${abstract}`.trim();
  const searchTerms = extractSearchKeywords(combinedText);
  const queryParam = encodeURIComponent(searchTerms.slice(0, 4).join(' '));

  let fetchedJournals: JournalCandidate[] = [];

  try {
    const url = `https://api.openalex.org/sources?search=${queryParam}&per-page=25`;
    const resp = await fetch(url);
    if (resp.ok) {
      const data = await resp.json();
      if (Array.isArray(data.results) && data.results.length > 0) {
        fetchedJournals = data.results.map((src: any) => {
          const citedness = src.summary_stats?.['2yr_mean_citedness'] || 0;
          const hIndex = src.summary_stats?.h_index || 0;
          const apcUsd = src.apc_usd ?? null;
          const isOa = Boolean(src.is_oa);
          const isDoaj = Boolean(src.is_in_doaj);

          // Estimate Quartile based on 2-year citedness and h-index
          let scopusQuartile: 'Q1' | 'Q2' | 'Q3' | 'Q4' = 'Q3';
          if (citedness >= 4.5 || hIndex >= 120) {
            scopusQuartile = 'Q1';
          } else if (citedness >= 2.4 || hIndex >= 60) {
            scopusQuartile = 'Q2';
          } else if (citedness < 1.1 && hIndex < 25) {
            scopusQuartile = 'Q4';
          }

          let oaType: 'Diamond OA ($0 APC)' | 'Gold OA' | 'Hybrid' | 'Subscription' = 'Subscription';
          if (isOa) {
            if (apcUsd === 0 || (isDoaj && apcUsd === null)) {
              oaType = 'Diamond OA ($0 APC)';
            } else {
              oaType = 'Gold OA';
            }
          } else if (apcUsd && apcUsd > 0) {
            oaType = 'Hybrid';
          }

          // Compute topic match score
          const srcTopics = (src.topics || []).map((t: any) => t.display_name);
          const matchScore = calculateMatchScore(combinedText, src.display_name, srcTopics);

          return {
            id: src.id ? src.id.replace(/^https:\/\/openalex\.org\//, '') : `src-${Math.random()}`,
            title: src.display_name || 'Academic Journal',
            issn: src.issn_l || (src.issn ? src.issn[0] : 'N/A'),
            publisher: src.publisher || 'Academic Press',
            isOa,
            oaType,
            apcUsd: oaType === 'Diamond OA ($0 APC)' ? 0 : apcUsd,
            citeScore: Number(citedness.toFixed(1)),
            hIndex,
            scopusQuartile,
            reviewSpeedWeeks: citedness > 10 ? '6 to 10 weeks' : '4 to 6 weeks',
            acceptanceRateEstimated: citedness > 15 ? '12% to 18%' : citedness > 5 ? '25% to 35%' : '40% to 50%',
            topics: srcTopics.slice(0, 4),
            homepageUrl: src.homepage_url || `https://doi.org`,
            matchScore,
            matchRationale: `Indexed across ${srcTopics.slice(0, 2).join(' and ') || 'relevant scientific domains'}.`,
            isDoaj,
          };
        });
      }
    }
  } catch (err) {
    console.warn('OpenAlex sources search fallback to curated registry:', err);
  }

  // Combine fetched journals with baseline curated journals to ensure rich results
  const allCandidates = [...fetchedJournals];
  for (const baseline of BASELINE_JOURNALS_REGISTRY) {
    if (!allCandidates.some(j => j.title.toLowerCase() === baseline.title.toLowerCase())) {
      const recalculatedScore = calculateMatchScore(combinedText, baseline.title, baseline.topics);
      allCandidates.push({
        ...baseline,
        matchScore: recalculatedScore,
      });
    }
  }

  // Apply filters
  let filtered = allCandidates.filter((j) => {
    // Open Access filter
    if (filters.oaModel === 'diamond' && j.oaType !== 'Diamond OA ($0 APC)') return false;
    if (filters.oaModel === 'gold' && !j.isOa) return false;
    if (filters.oaModel === 'hybrid' && j.oaType !== 'Hybrid') return false;

    // Max APC budget filter
    if (filters.maxApc !== null && filters.maxApc !== undefined) {
      if (j.apcUsd !== null && j.apcUsd > filters.maxApc) return false;
    }

    // Min Quartile filter
    if (filters.minQuartile === 'Q1' && j.scopusQuartile !== 'Q1') return false;
    if (filters.minQuartile === 'Q2' && j.scopusQuartile !== 'Q1' && j.scopusQuartile !== 'Q2') return false;

    // Publisher filter
    if (filters.publisher && filters.publisher !== 'all') {
      if (!j.publisher.toLowerCase().includes(filters.publisher.toLowerCase())) return false;
    }

    return true;
  });

  // Sort by match score descending
  filtered.sort((a, b) => b.matchScore - a.matchScore);

  return filtered.slice(0, 15);
}

/**
 * Conducts a comprehensive Desk-Rejection Pre-Flight Audit of the manuscript draft.
 */
export function auditManuscriptPreFlight(
  title: string,
  abstract: string,
  fullDraft: string = '',
  references: string[] = []
): PreFlightAuditReport {
  const checks: PreFlightCheckItem[] = [];
  const fullText = `${title}\n${abstract}\n${fullDraft}`.toLowerCase();
  const abstractWords = abstract.trim() ? abstract.trim().split(/\s+/).length : 0;
  const maxAbstractWords = 250;

  // 1. Abstract Word Count Check
  if (abstractWords === 0) {
    checks.push({
      id: 'abstract_empty',
      title: 'Abstract Missing or Incomplete',
      category: 'Structure',
      status: 'fail',
      message: 'No abstract text detected. Journals require a 150-250 word abstract.',
      fixAdvice: 'Provide a structured abstract summarizing the background, methods, findings, and conclusion.',
    });
  } else if (abstractWords > 320) {
    checks.push({
      id: 'abstract_len_critical',
      title: 'Abstract Exceeds Maximum Length',
      category: 'Structure',
      status: 'fail',
      message: `Abstract is ${abstractWords} words. Most journals strictly enforce a 250 to 300 word cap and reject over-length submissions.`,
      fixAdvice: `Trim approximately ${abstractWords - maxAbstractWords} words to fit within standard publisher constraints.`,
    });
  } else if (abstractWords > 250) {
    checks.push({
      id: 'abstract_len_warn',
      title: 'Abstract Slightly Long (250+ Words)',
      category: 'Structure',
      status: 'warning',
      message: `Abstract is ${abstractWords} words. Some strict journals (e.g. Lancet, Nature, IEEE) mandate <= 200 or 250 words.`,
      fixAdvice: 'Condense introductory statements to leave maximum space for empirical outcomes.',
    });
  } else {
    checks.push({
      id: 'abstract_len_pass',
      title: 'Abstract Word Count Compliant',
      category: 'Structure',
      status: 'pass',
      message: `Abstract length is optimal (${abstractWords} words, compliant with <= 250 word caps).`,
      fixAdvice: 'Length meets standard publisher submission requirements.',
    });
  }

  // 2. Structured Abstract Headers Check
  const hasBackground = /background|introduction|objective|context/i.test(abstract);
  const hasMethods = /methods?|methodology|design|approach|protocol/i.test(abstract);
  const hasResults = /results?|findings?|outcomes?|metrics/i.test(abstract);
  const hasConclusion = /conclusions?|implications?|discussion/i.test(abstract);

  if (hasBackground && hasMethods && hasResults && hasConclusion) {
    checks.push({
      id: 'abstract_structure_pass',
      title: 'Structured Abstract Sections Present',
      category: 'Structure',
      status: 'pass',
      message: 'Detected all four essential components: Background, Methods, Results, and Conclusions.',
      fixAdvice: 'Excellent structure; facilitates rapid editorial triage.',
    });
  } else {
    const missing: string[] = [];
    if (!hasBackground) missing.push('Background/Objective');
    if (!hasMethods) missing.push('Methods');
    if (!hasResults) missing.push('Results');
    if (!hasConclusion) missing.push('Conclusion');

    checks.push({
      id: 'abstract_structure_warn',
      title: 'Unstructured or Missing Abstract Sections',
      category: 'Structure',
      status: 'warning',
      message: `Missing explicit markers for: ${missing.join(', ')}. Many journals require structured headings.`,
      fixAdvice: 'Label subsections explicitly (e.g. Objective, Methods, Results, Conclusion) to satisfy editorial criteria.',
    });
  }

  // 3. Data Availability Statement (DAS) Check
  const hasDas = /data availability|data access|accession code|zenodo|figshare|dryad|osf\.io|github\.com|reasonable request|publicly available/i.test(fullText);
  if (hasDas) {
    checks.push({
      id: 'das_pass',
      title: 'Data Availability Statement Detected',
      category: 'Data & Reproducibility',
      status: 'pass',
      message: 'Manuscript declares repository access or data availability protocols.',
      fixAdvice: 'Compliant with Nature, Elsevier, PLOS, and Springer Open Science policies.',
    });
  } else {
    checks.push({
      id: 'das_fail',
      title: 'Missing Data Availability Statement (Mandatory for Top Journals)',
      category: 'Data & Reproducibility',
      status: 'fail',
      message: 'No Data Availability Statement detected. Leading publishers will halt peer-review without this declaration.',
      fixAdvice: 'Insert a formal statement detailing where data, code, and materials can be accessed.',
      autoFixContent: 'Data Availability Statement: The datasets generated during and/or analyzed during the current study are available in the public repository [Insert Repository Name / Zenodo DOI] or are available from the corresponding author upon reasonable request.',
    });
  }

  // 4. Ethical Approval & Consent Disclosure Check
  const hasEthics = /irb|ethics committee|institutional review board|informed consent|declaration of helsinki|ethical approval|ethics approval|waived|exempt/i.test(fullText);
  const isHumanOrClinical = /patients?|participants?|subjects?|clinical trial|cohort|survey|interviews?|questionnaire/i.test(fullText);

  if (hasEthics) {
    checks.push({
      id: 'ethics_pass',
      title: 'Ethical Approval & Consent Disclosure Present',
      category: 'Ethics & Integrity',
      status: 'pass',
      message: 'Detected IRB, ethics committee, or institutional review clearance declarations.',
      fixAdvice: 'Meets Committee on Publication Ethics (COPE) guidelines.',
    });
  } else if (isHumanOrClinical) {
    checks.push({
      id: 'ethics_fail',
      title: 'Human/Clinical Cohort Detected Without IRB Approval',
      category: 'Ethics & Integrity',
      status: 'fail',
      message: 'Human participants or clinical surveys detected without an ethics committee approval number or exemption notice.',
      fixAdvice: 'Provide the institutional review board name, protocol approval number, and consent method.',
      autoFixContent: 'Ethical Approval: This study was approved by the Institutional Review Board of [Institution Name] (Protocol ID: [Approval Number]). Written informed consent was obtained from all participants prior to study inclusion.',
    });
  } else {
    checks.push({
      id: 'ethics_neutral',
      title: 'Ethics Exemption or Secondary Data Context',
      category: 'Ethics & Integrity',
      status: 'pass',
      message: 'No primary human cohort detected. If this is pure theoretical or secondary literature work, explicitly state exemption.',
      fixAdvice: 'Add an explicit note: "Ethical approval was not required as this study analyzed publicly available secondary datasets."',
      autoFixContent: 'Ethical Approval: Ethical approval was not required for this study as it relies exclusively on publicly available, anonymized secondary literature and open registry data.',
    });
  }

  // 5. Conflict of Interest (COI) Statement Check
  const hasCoi = /conflict of interest|competing interests|financial disclosure|no competing|declare no/i.test(fullText);
  if (hasCoi) {
    checks.push({
      id: 'coi_pass',
      title: 'Conflict of Interest Disclosure Present',
      category: 'Ethics & Integrity',
      status: 'pass',
      message: 'Authors have declared potential competing interests or stated absence of conflict.',
      fixAdvice: 'Fulfills ICMJE and COPE transparency standards.',
    });
  } else {
    checks.push({
      id: 'coi_fail',
      title: 'Missing Conflict of Interest Disclosure',
      category: 'Ethics & Integrity',
      status: 'fail',
      message: 'Every peer-reviewed journal requires an explicit statement confirming absence or disclosure of competing interests.',
      fixAdvice: 'Insert a standard declaration before the bibliography.',
      autoFixContent: 'Conflict of Interest: The authors declare that they have no known competing financial interests or personal relationships that could have appeared to influence the work reported in this paper.',
    });
  }

  // 6. Clinical Trial / Systematic Review Registration Check
  const isTrialOrReview = /clinical trial|randomized controlled|systematic review|meta-analysis/i.test(fullText);
  const hasRegNumber = /nct\d{8}|prospero|crd\d{9}|isrctn\d{8}/i.test(fullText);

  if (isTrialOrReview && !hasRegNumber) {
    checks.push({
      id: 'reg_warn',
      title: 'Trial or Systematic Review Without Registration ID',
      category: 'Ethics & Integrity',
      status: 'warning',
      message: 'Clinical trials and systematic reviews typically require prospective registry numbers (e.g. ClinicalTrials.gov NCT ID or PROSPERO CRD ID).',
      fixAdvice: 'Include the registry identifier in the abstract and methods section to prevent desk rejection.',
      autoFixContent: 'Trial Registration: Prospectively registered with ClinicalTrials.gov (Identifier: NCT[Insert Number]) or PROSPERO (ID: CRD[Insert Number]).',
    });
  } else if (isTrialOrReview && hasRegNumber) {
    checks.push({
      id: 'reg_pass',
      title: 'Prospective Protocol Registration Identified',
      category: 'Ethics & Integrity',
      status: 'pass',
      message: 'Prospective registry identifier detected in manuscript text.',
      fixAdvice: 'Ensures compliance with ICMJE clinical trial registration policies.',
    });
  }

  // 7. Reference Recency & Freshness Ratio Check
  let recentCount = 0;
  const currentYear = new Date().getFullYear();
  const recentThreshold = currentYear - 4; // Last 5 years

  for (const ref of references) {
    const yearMatch = ref.match(/\b(20\d{2}|19\d{2})\b/);
    if (yearMatch) {
      const year = parseInt(yearMatch[1], 10);
      if (year >= recentThreshold) {
        recentCount++;
      }
    }
  }

  const recentPercent = references.length > 0 ? Math.round((recentCount / references.length) * 100) : 50;

  if (references.length > 0 && recentPercent < 20) {
    checks.push({
      id: 'ref_recency_warn',
      title: 'Low Reference Freshness Ratio (<20% Recent)',
      category: 'Citations',
      status: 'warning',
      message: `Only ${recentPercent}% of references are from the last 5 years (${recentCount}/${references.length}). Editors often look for contemporary literature dialogue.`,
      fixAdvice: 'Integrate recently published peer-reviewed studies from the last 2-3 years to establish state-of-the-art context.',
    });
  } else {
    checks.push({
      id: 'ref_recency_pass',
      title: 'Adequate Reference Freshness',
      category: 'Citations',
      status: 'pass',
      message: `Healthy citation balance: ${recentPercent}% of citations are from the last 5 years.`,
      fixAdvice: 'Demonstrates active engagement with contemporary literature.',
    });
  }

  // Compute Overall Score
  let score = 100;
  for (const c of checks) {
    if (c.status === 'fail') score -= 20;
    if (c.status === 'warning') score -= 8;
  }
  score = Math.max(10, Math.min(100, score));

  let status: 'Ready for Submission' | 'Minor Revisions Advised' | 'High Desk-Rejection Risk' = 'Ready for Submission';
  if (score < 65) {
    status = 'High Desk-Rejection Risk';
  } else if (score < 85) {
    status = 'Minor Revisions Advised';
  }

  return {
    overallScore: score,
    status,
    abstractWordCount: abstractWords,
    abstractMaxRecommended: maxAbstractWords,
    referencesCount: references.length,
    recentReferencesPercent: recentPercent,
    checks,
    generatedDeclarations: {
      dataAvailability: 'Data Availability Statement: The datasets generated during and/or analyzed during the current study are available in the public repository [Insert Repository Name / DOI] or are available from the corresponding author upon reasonable request.',
      conflictOfInterest: 'Conflict of Interest: The authors declare that they have no known competing financial interests or personal relationships that could have appeared to influence the work reported in this paper.',
      ethicalApproval: 'Ethical Approval: Ethical approval was obtained from the Institutional Review Board of [Institution Name] (Approval ID: [Number]). All participants provided written informed consent.',
    },
  };
}

/**
 * Extracts key semantic terms from text for journal matching queries.
 */
function extractSearchKeywords(text: string): string[] {
  const stopwords = new Set([
    'the', 'and', 'for', 'with', 'that', 'this', 'from', 'were', 'which', 'their',
    'been', 'have', 'study', 'research', 'paper', 'results', 'using', 'between',
    'analysis', 'effect', 'effects', 'based', 'methods', 'data', 'clinical'
  ]);

  const clean = text.replace(/[^a-zA-Z\s]/g, ' ').toLowerCase();
  const tokens = clean.split(/\s+/).filter(w => w.length > 4 && !stopwords.has(w));
  
  // Count frequency
  const freq: Record<string, number> = {};
  tokens.forEach(t => { freq[t] = (freq[t] || 0) + 1; });

  const sorted = Object.keys(freq).sort((a, b) => freq[b] - freq[a]);
  return sorted.slice(0, 6);
}

/**
 * Calculates a match score between the manuscript text and journal profile.
 */
function calculateMatchScore(manuscriptText: string, journalTitle: string, journalTopics: string[]): number {
  const lowerText = manuscriptText.toLowerCase();
  let score = 70;

  // Title keyword overlap
  const titleWords = journalTitle.toLowerCase().split(/\s+/).filter(w => w.length > 4);
  for (const w of titleWords) {
    if (lowerText.includes(w)) score += 5;
  }

  // Topic overlap
  for (const topic of journalTopics) {
    const tLower = topic.toLowerCase();
    if (lowerText.includes(tLower)) {
      score += 8;
    } else {
      const parts = tLower.split(/\s+/);
      if (parts.some(p => p.length > 4 && lowerText.includes(p))) {
        score += 3;
      }
    }
  }

  return Math.min(98, Math.max(62, score));
}
