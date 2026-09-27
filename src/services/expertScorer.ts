import type { ReviewerCandidate, SearchObjective, ObjectiveScoreDimension, ScoreBreakdown } from '../types/expertSearch';

export interface ExpertScorerResult {
  score: number;
  breakdown: ScoreBreakdown;
  objectiveBreakdown: ObjectiveScoreDimension[];
  acceptanceLikelihood: 'High' | 'Moderate' | 'Low (PI Overload)';
  publicationVelocity: string;
  objectiveFitBadge: string;
  objectiveFitSummary: string;
}

export function calculateExpertFitScore(
  candidate: ReviewerCandidate,
  keywords: string,
  objective: SearchObjective = 'reviewer'
): ExpertScorerResult {
  const currentYear = new Date().getFullYear();

  // Keyword extraction and semantic density check
  const searchTerms = keywords
    .toLowerCase()
    .split(/\s+/)
    .filter(t => t.length > 3);

  let termHits = 0;
  for (const work of candidate.sampleWorks) {
    const text = `${work.title} ${work.abstract || ''}`.toLowerCase();
    for (const term of searchTerms) {
      if (text.includes(term)) termHits += 1;
    }
  }

  // Recency calculation
  let avgYear = currentYear - 2;
  if (candidate.sampleWorks.length > 0) {
    const sumYears = candidate.sampleWorks.reduce((acc, w) => acc + (w.publication_year || currentYear - 2), 0);
    avgYear = sumYears / candidate.sampleWorks.length;
  }

  // Authorship flags
  const hasLeadWork = candidate.sampleWorks.some(w => w.author_position === 'first' || w.author_position === 'last');
  const hasCorresponding = candidate.sampleWorks.some(w => w.is_corresponding);

  // Publication velocity description
  let publicationVelocity = 'Active & Consistent';
  if (candidate.totalRecentWorksCount > 20) {
    publicationVelocity = 'Hyper-Prolific (High Volume)';
  } else if (candidate.totalRecentWorksCount >= 3) {
    publicationVelocity = `Active Scholar (${candidate.sampleWorks.length} recent papers)`;
  } else {
    publicationVelocity = 'Selective / Emerging Publisher';
  }

  // Base semantic score
  const worksCountBonus = Math.min(candidate.sampleWorks.length * 7, 21);
  const hitsBonus = Math.min(termHits * 3, 14);
  const baseSemanticMatch = Math.min(Math.round(worksCountBonus + hitsBonus), 35);

  // -------------------------------------------------------------
  // OBJECTIVE 1: GRANT CO-INVESTIGATOR (Co-I)
  // Needs: High PI authority, grant-ready citation footprint, institutional diversity
  // -------------------------------------------------------------
  if (objective === 'grant_coi') {
    const semanticScore = baseSemanticMatch; // 0 to 35
    
    // PI Leadership / Track Record (0 to 25 pts)
    let leadershipScore = 14;
    if (candidate.careerStage === 'Senior Group Leader / PI') leadershipScore = 25;
    else if (candidate.careerStage === 'Mid-Career Authority') leadershipScore = 20;

    // Citation Impact & Authority (0 to 20 pts)
    let citationScore = 6;
    if (candidate.totalRecentCitations > 300 || candidate.hIndexEst >= 18) citationScore = 20;
    else if (candidate.totalRecentCitations > 100 || candidate.hIndexEst >= 10) citationScore = 15;
    else if (candidate.totalRecentCitations > 30) citationScore = 10;

    // Institutional Breadth & Complementarity (0 to 10 pts)
    let diversityScore = 10;
    if (candidate.coiStatus.hasCoi) {
      diversityScore = 4; // Already internal/overlapping institution
    }

    // Recency (0 to 10 pts)
    let recencyScore = 4;
    if (avgYear >= currentYear - 2) recencyScore = 10;
    else if (avgYear >= currentYear - 4) recencyScore = 7;

    const totalRaw = semanticScore + leadershipScore + citationScore + diversityScore + recencyScore;
    const finalScore = Math.max(35, Math.min(99, totalRaw));

    const objectiveBreakdown: ObjectiveScoreDimension[] = [
      { key: 'semantic', label: 'Domain Overlap', score: semanticScore, maxScore: 35, description: 'Alignment with proposal specific aims' },
      { key: 'leadership', label: 'PI Seniority & Group Leadership', score: leadershipScore, maxScore: 25, description: 'Track record leading funded projects' },
      { key: 'citations', label: 'Citation Footprint', score: citationScore, maxScore: 20, description: 'H-index depth and community recognition' },
      { key: 'diversity', label: 'Consortium Institutional Diversity', score: diversityScore, maxScore: 10, description: 'External multi-site institutional complement' },
      { key: 'recency', label: 'Recent Velocity', score: recencyScore, maxScore: 10, description: 'Active publishing in last 24-36 months' }
    ];

    let objectiveFitBadge = 'Promising Co-I Candidate';
    if (finalScore >= 85) objectiveFitBadge = 'Consortium Co-PI Anchor';
    else if (finalScore >= 70) objectiveFitBadge = 'Strong Methodological Co-I';

    const objectiveFitSummary = `${candidate.careerStage} with estimated h-index of ${candidate.hIndexEst} and ${candidate.totalRecentCitations} recent citations. Ideal partner for multi-institutional proposals.`;

    return {
      score: finalScore,
      breakdown: {
        semanticMatch: semanticScore,
        recency: recencyScore,
        careerSweetSpot: leadershipScore,
        authorshipLead: citationScore,
        overloadPenalty: 0
      },
      objectiveBreakdown,
      acceptanceLikelihood: candidate.careerStage === 'Senior Group Leader / PI' ? 'Moderate' : 'High',
      publicationVelocity,
      objectiveFitBadge,
      objectiveFitSummary
    };
  }

  // -------------------------------------------------------------
  // OBJECTIVE 2: PAPER CO-AUTHOR
  // Needs: High publishing velocity, first/corresponding authorship, complementary skills
  // -------------------------------------------------------------
  if (objective === 'coauthor') {
    const semanticScore = Math.min(baseSemanticMatch + 5, 40); // 0 to 40

    // Velocity & Hands-on Publishing (0 to 25 pts)
    let velocityScore = 12;
    if (candidate.totalRecentWorksCount >= 8) velocityScore = 25;
    else if (candidate.totalRecentWorksCount >= 4) velocityScore = 20;
    else if (candidate.totalRecentWorksCount >= 2) velocityScore = 15;

    // Lead Authorship Experience (First or Corresponding) (0 to 20 pts)
    let leadScore = 5;
    if (hasLeadWork && hasCorresponding) leadScore = 20;
    else if (hasLeadWork || hasCorresponding) leadScore = 15;

    // Collaboration Sweet Spot (0 to 15 pts)
    let sweetSpotScore = 10;
    if (candidate.careerStage === 'Mid-Career Authority') sweetSpotScore = 15;
    else if (candidate.careerStage === 'Early-Career Specialist') sweetSpotScore = 14;
    else sweetSpotScore = 9;

    const totalRaw = semanticScore + velocityScore + leadScore + sweetSpotScore;
    const finalScore = Math.max(35, Math.min(98, totalRaw));

    const objectiveBreakdown: ObjectiveScoreDimension[] = [
      { key: 'semantic', label: 'Methodological Synergy', score: semanticScore, maxScore: 40, description: 'Direct topic and technical alignment' },
      { key: 'velocity', label: 'Publication Velocity', score: velocityScore, maxScore: 25, description: 'Recent paper output frequency' },
      { key: 'lead', label: 'Lead/Corresponding Track Record', score: leadScore, maxScore: 20, description: 'Hands-on writing and corresponding author experience' },
      { key: 'sweetspot', label: 'Collaboration Availability', score: sweetSpotScore, maxScore: 15, description: 'Likelihood of active hands-on co-authorship contribution' }
    ];

    let objectiveFitBadge = 'Solid Co-Author Match';
    if (finalScore >= 85) objectiveFitBadge = 'Prime Co-Author Candidate';
    else if (finalScore >= 72) objectiveFitBadge = 'Active Writing Partner';

    const objectiveFitSummary = `Demonstrates ${publicationVelocity.toLowerCase()} with lead-authorship experience. High synergy for manuscript section collaboration.`;

    return {
      score: finalScore,
      breakdown: {
        semanticMatch: semanticScore,
        recency: velocityScore,
        careerSweetSpot: sweetSpotScore,
        authorshipLead: leadScore,
        overloadPenalty: 0
      },
      objectiveBreakdown,
      acceptanceLikelihood: candidate.careerStage === 'Senior Group Leader / PI' ? 'Moderate' : 'High',
      publicationVelocity,
      objectiveFitBadge,
      objectiveFitSummary
    };
  }

  // -------------------------------------------------------------
  // OBJECTIVE 3: CONSULTING & SUBJECT MATTER EXPERT (SME)
  // Needs: Broad authority, high citations, senior industry/advisory standing
  // -------------------------------------------------------------
  if (objective === 'consultant') {
    const semanticScore = baseSemanticMatch; // 0 to 35

    // Domain Authority & Standing (0 to 30 pts)
    let authorityScore = 12;
    if (candidate.careerStage === 'Senior Group Leader / PI') authorityScore = 30;
    else if (candidate.careerStage === 'Mid-Career Authority') authorityScore = 24;

    // Career Citation Depth & Influence (0 to 25 pts)
    let citationDepthScore = 8;
    if (candidate.totalRecentCitations > 400 || candidate.hIndexEst >= 20) citationDepthScore = 25;
    else if (candidate.totalRecentCitations > 150 || candidate.hIndexEst >= 12) citationDepthScore = 19;
    else if (candidate.totalRecentCitations > 50) citationDepthScore = 13;

    // Breadth & Global Recognition (0 to 10 pts)
    let breadthScore = 6;
    if (candidate.sampleWorks.length >= 4) breadthScore = 10;
    else if (candidate.sampleWorks.length >= 2) breadthScore = 8;

    const totalRaw = semanticScore + authorityScore + citationDepthScore + breadthScore;
    const finalScore = Math.max(40, Math.min(99, totalRaw));

    const objectiveBreakdown: ObjectiveScoreDimension[] = [
      { key: 'semantic', label: 'Domain Specialization', score: semanticScore, maxScore: 35, description: 'Subject matter depth in target technical discipline' },
      { key: 'authority', label: 'Executive / Academic Seniority', score: authorityScore, maxScore: 30, description: 'Credibility for Scientific Advisory Boards (SAB)' },
      { key: 'depth', label: 'Citation Impact & Influence', score: citationDepthScore, maxScore: 25, description: 'Standing among global peers and industry' },
      { key: 'breadth', label: 'Portfolio Breadth', score: breadthScore, maxScore: 10, description: 'Demonstrated multi-disciplinary scope' }
    ];

    let objectiveFitBadge = 'Recognized Domain Specialist';
    if (finalScore >= 88) objectiveFitBadge = 'Top-Tier Key Opinion Leader (KOL)';
    else if (finalScore >= 74) objectiveFitBadge = 'Authoritative SME Advisor';

    const objectiveFitSummary = `Distinguished ${candidate.careerStage.toLowerCase()} with deep authority in this space. Excellent fit for technical due diligence or advisory roles.`;

    return {
      score: finalScore,
      breakdown: {
        semanticMatch: semanticScore,
        recency: breadthScore,
        careerSweetSpot: authorityScore,
        authorshipLead: citationDepthScore,
        overloadPenalty: 0
      },
      objectiveBreakdown,
      acceptanceLikelihood: 'Moderate',
      publicationVelocity,
      objectiveFitBadge,
      objectiveFitSummary
    };
  }

  // -------------------------------------------------------------
  // OBJECTIVE 4: JOURNAL PEER REVIEWER (Default)
  // Needs: Early/mid-career sweet spot, high turnaround likelihood, avoids PI burnout
  // -------------------------------------------------------------
  const semanticMatch = baseSemanticMatch; // 0 to 35

  // Recency of literature (0 to 25 pts)
  let recencyScore = 8;
  if (avgYear >= currentYear - 1) recencyScore = 25;
  else if (avgYear >= currentYear - 2) recencyScore = 20;
  else if (avgYear >= currentYear - 3) recencyScore = 15;
  else if (avgYear >= currentYear - 4) recencyScore = 10;

  // Career stage sweet spot (0 to 20 pts)
  let careerSweetSpot = 8;
  let acceptanceLikelihood: 'High' | 'Moderate' | 'Low (PI Overload)' = 'Moderate';

  if (candidate.careerStage === 'Early-Career Specialist') {
    careerSweetSpot = 20;
    acceptanceLikelihood = 'High';
  } else if (candidate.careerStage === 'Mid-Career Authority') {
    careerSweetSpot = 17;
    acceptanceLikelihood = 'High';
  } else {
    careerSweetSpot = 10;
    acceptanceLikelihood = 'Low (PI Overload)';
  }

  // Authorship lead bonus (0 to 15 pts)
  let authorshipLead = 4;
  if (hasLeadWork && hasCorresponding) authorshipLead = 15;
  else if (hasLeadWork) authorshipLead = 11;
  else if (hasCorresponding) authorshipLead = 9;

  // PI Overload penalty for reviewers (0 to -15 pts)
  let overloadPenalty = 0;
  if (candidate.careerStage === 'Senior Group Leader / PI' && candidate.totalRecentWorksCount > 15) {
    overloadPenalty = -12;
  } else if (candidate.totalRecentWorksCount > 25) {
    overloadPenalty = -8;
  }

  const rawReviewerScore = semanticMatch + recencyScore + careerSweetSpot + authorshipLead + overloadPenalty;
  const finalReviewerScore = Math.max(30, Math.min(98, rawReviewerScore));

  const objectiveBreakdown: ObjectiveScoreDimension[] = [
    { key: 'semantic', label: 'Manuscript Alignment', score: semanticMatch, maxScore: 35, description: 'Subject matter correspondence with submitted paper' },
    { key: 'recency', label: 'Recent Activity', score: recencyScore, maxScore: 25, description: 'Recent active publishing in this precise specialty' },
    { key: 'sweetspot', label: 'Reviewer Sweet Spot', score: careerSweetSpot, maxScore: 20, description: 'Early-to-mid career balance with high review acceptance' },
    { key: 'lead', label: 'Lead Author Experience', score: authorshipLead, maxScore: 15, description: 'First or corresponding author writing experience' },
    { key: 'overload', label: 'PI Workload Balance', score: Math.abs(overloadPenalty), maxScore: 15, description: 'Deductions for extreme publication volume / PI overload' }
  ];

  let objectiveFitBadge = 'Capable Referee';
  if (finalReviewerScore >= 85) objectiveFitBadge = 'Prime Reviewer Sweet Spot';
  else if (finalReviewerScore >= 72) objectiveFitBadge = 'Responsive Specialist';

  const objectiveFitSummary = `${candidate.careerStage} with ${acceptanceLikelihood.toLowerCase()} likelihood of accepting an editorial review assignment.`;

  return {
    score: finalReviewerScore,
    breakdown: {
      semanticMatch,
      recency: recencyScore,
      careerSweetSpot,
      authorshipLead,
      overloadPenalty
    },
    objectiveBreakdown,
    acceptanceLikelihood,
    publicationVelocity,
    objectiveFitBadge,
    objectiveFitSummary
  };
}
