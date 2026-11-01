import { screeningOutcome, type ResearchProject } from "./projectService";

export function reviewFlow(p: ResearchProject) {
  const abstractIncluded = p.papers.filter(
    (paper) => screeningOutcome(p, paper.id, "abstract").decision === "include",
  );
  const abstractExcluded = p.papers.filter(
    (paper) => screeningOutcome(p, paper.id, "abstract").decision === "exclude",
  );
  const included = abstractIncluded.filter(
    (paper) => screeningOutcome(p, paper.id, "fulltext").decision === "include",
  );
  const fulltextExcluded = abstractIncluded.filter(
    (paper) => screeningOutcome(p, paper.id, "fulltext").decision === "exclude",
  );
  return {
    library: p.papers.length,
    abstractIncluded: abstractIncluded.length,
    abstractExcluded: abstractExcluded.length,
    abstractUnresolved:
      p.papers.length - abstractIncluded.length - abstractExcluded.length,
    fulltextIncluded: included.length,
    fulltextExcluded: fulltextExcluded.length,
    fulltextUnresolved:
      abstractIncluded.length - included.length - fulltextExcluded.length,
  };
}

export function reviewFlowSvg(p: ResearchProject): string {
  const f = reviewFlow(p);
  const box = (y: number, label: string, count: number) =>
    `<rect x="30" y="${y}" width="540" height="72" rx="8" fill="#edf4fb" stroke="#345b80"/><text x="300" y="${y + 30}" text-anchor="middle" font-size="16">${label}</text><text x="300" y="${y + 56}" text-anchor="middle" font-size="18" font-weight="bold">n = ${count}</text>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="710" viewBox="0 0 600 710" role="img" aria-label="Recorded review decisions"><rect width="600" height="710" fill="white"/><g font-family="Arial,sans-serif" fill="#172b45"><text x="300" y="28" text-anchor="middle" font-size="20">Recorded review decisions</text>${box(50, "Distinct sources in project library", f.library)}<text x="300" y="148" text-anchor="middle" font-size="13">Abstract exclusions: ${f.abstractExcluded}; unresolved: ${f.abstractUnresolved}</text>${box(170, "Passed title and abstract screening", f.abstractIncluded)}<text x="300" y="270" text-anchor="middle" font-size="13">Full-text exclusions: ${f.fulltextExcluded}; unresolved: ${f.fulltextUnresolved}</text>${box(290, "Passed both recorded screening stages", f.fulltextIncluded)}<text x="30" y="410" font-size="13">Criteria version: ${p.criteriaVersion}. Two agreeing reviewer labels or adjudication.</text><text x="30" y="440" font-size="13">This is a ledger summary, not a complete PRISMA flow diagram.</text><text x="30" y="470" font-size="13">Database totals, duplicates and retrieval failures need separate reporting.</text><text x="30" y="500" font-size="13">Passing screening does not establish risk of bias or synthesis completion.</text></g></svg>`;
}
