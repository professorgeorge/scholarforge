import type { ReviewerCandidate, CoiStatus } from '../types/expertSearch';

function normalize(str: string): string {
  return str
    .toLowerCase()
    .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function nameMatches(nameA: string, nameB: string): boolean {
  const normA = normalize(nameA);
  const normB = normalize(nameB);
  if (normA === normB) return true;

  const partsA = normA.split(' ').filter(p => p.length > 1);
  const partsB = normB.split(' ').filter(p => p.length > 1);

  if (partsA.length === 0 || partsB.length === 0) return false;

  const lastNameA = partsA[partsA.length - 1];
  const lastNameB = partsB[partsB.length - 1];

  if (lastNameA !== lastNameB) return false;

  // Compare first name or initial
  const firstA = partsA[0];
  const firstB = partsB[0];
  return firstA === firstB || firstA[0] === firstB[0];
}

export function detectCoi(
  candidate: ReviewerCandidate,
  submittedAuthorsStr: string,
  submittedInstitutionsStr: string
): CoiStatus {
  const reasons: string[] = [];
  const matchedAuthors: string[] = [];
  const matchedInstitutions: string[] = [];

  const submittedAuthors = submittedAuthorsStr
    .split(/[,;\n]/)
    .map(s => s.trim())
    .filter(s => s.length > 1);

  const submittedInstitutions = submittedInstitutionsStr
    .split(/[,;\n]/)
    .map(s => s.trim())
    .filter(s => s.length > 1);

  // 1. Direct Self-Author Match
  for (const subAuthor of submittedAuthors) {
    if (nameMatches(candidate.name, subAuthor)) {
      reasons.push(`Direct Conflict: Candidate "${candidate.name}" is listed as an author on this manuscript.`);
      matchedAuthors.push(subAuthor);
    }
  }

  // 2. Institutional Overlap Match
  const candidateInstitutions = [
    candidate.primaryInstitution,
    ...candidate.institutions.map(i => i.name),
    ...candidate.affiliations
  ].map(normalize);

  for (const subInst of submittedInstitutions) {
    const normSub = normalize(subInst);
    if (normSub.length < 3) continue;

    for (const candInst of candidateInstitutions) {
      if (candInst.includes(normSub) || normSub.includes(candInst)) {
        const reason = `Institutional Conflict: Candidate is affiliated with "${candidate.primaryInstitution}", matching submitted institution "${subInst}".`;
        if (!reasons.includes(reason)) {
          reasons.push(reason);
          matchedInstitutions.push(subInst);
        }
      }
    }
  }

  // 3. Recent Co-Authorship Match (checked via sample works raw affiliations or title acknowledgments)
  for (const work of candidate.sampleWorks) {
    for (const subAuthor of submittedAuthors) {
      const normSub = normalize(subAuthor);
      const lastName = normSub.split(' ').pop();
      if (lastName && lastName.length > 2 && work.raw_affiliation) {
        if (work.raw_affiliation.toLowerCase().includes(normSub)) {
          const reason = `Co-Authorship Overlap: Potential recent co-authorship on paper "${work.title.slice(0, 50)}..." with ${subAuthor}.`;
          if (!reasons.includes(reason)) {
            reasons.push(reason);
            matchedAuthors.push(subAuthor);
          }
        }
      }
    }
  }

  const hasCoi = reasons.length > 0;
  const severity: 'critical' | 'medium' | 'none' = hasCoi 
    ? (matchedAuthors.length > 0 ? 'critical' : 'medium')
    : 'none';

  return {
    hasCoi,
    reasons,
    severity,
    matchedAuthors,
    matchedInstitutions
  };
}
