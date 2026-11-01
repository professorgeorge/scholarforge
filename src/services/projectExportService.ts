import { screeningOutcome, type ResearchProject } from "./projectService";
import { REPORTING_GUIDES } from "../data/researchGuidance";

export function synthesisCsv(p: ResearchProject): string {
  const rows = [
    [
      "Source ID",
      "Title",
      "Year",
      "Claim",
      "Direction",
      "Theory",
      "Population/context",
      "Design",
      "Outcome",
      "Estimate",
      "Limitations",
      "Dataset/cohort",
      "Quote",
      "Location",
      "Checked",
    ],
  ];
  p.evidence.forEach((e) =>
    rows.push([
      e.paperId,
      p.papers.find((x) => x.id === e.paperId)?.title || "",
      String(p.papers.find((x) => x.id === e.paperId)?.year || ""),
      p.claims.find((x) => x.id === e.claimId)?.text || "",
      e.direction,
      e.theory,
      e.population,
      e.design,
      e.outcome,
      e.estimate,
      e.limitations,
      e.dataset,
      e.quote,
      e.locator,
      e.checked ? "yes" : "no",
    ]),
  );
  // Protect spreadsheet users from CSV formula injection in imported source content.
  return rows
    .map((row) =>
      row
        .map(
          (value) =>
            '"' +
            (/^[=+@\-\t\r]/.test(value) ? "'" + value : value).replace(
              /"/g,
              '""',
            ) +
            '"',
        )
        .join(","),
    )
    .join("\r\n");
}

export function projectBrief(p: ResearchProject): string {
  return `# ${p.name}\n\nResearch question: ${p.question || "Not specified"}\nDiscipline: ${p.discipline}\nStudy type: ${p.studyType || "Not specified"}\n\n## Protocol\n${p.protocol || "Not recorded"}\n\n## Eligibility criteria (version ${p.criteriaVersion})\n${p.criteria || "Not recorded"}\n\n## Search log\n${p.searches.map((s) => `### ${s.at}: ${s.query}\nMode: ${s.mode}\n${s.sources.map((x) => `- ${x.name}: ${x.count} retrieved; ${x.status}. ${x.detail || ""}\n  Submitted: ${x.query}`).join("\n")}`).join("\n\n") || "No searches recorded."}\n\n## Screening ledger\n${p.papers.map((paper) => `- ${paper.title}: abstract=${screeningOutcome(p, paper.id, "abstract").decision}, full text=${screeningOutcome(p, paper.id, "fulltext").decision}`).join("\n")}\n\n## Claims and evidence\n${p.claims
    .map(
      (c) =>
        `### ${c.text}\nReview status: ${c.needsReview ? "Needs review" : "Researcher reviewed"}\n${
          p.evidence
            .filter((e) => e.claimId === c.id)
            .map(
              (e) =>
                `- ${e.direction}; ${e.checked ? "quotation checked" : "unchecked"}; ${p.papers.find((x) => x.id === e.paperId)?.title || e.paperId}; ${e.locator}\n  > ${e.quote}\n  Limitation: ${e.limitations || "Not recorded"}`,
            )
            .join("\n") || "No evidence linked."
        }`,
    )
    .join(
      "\n\n",
    )}\n\n## Decision record\n${p.decisions.map((d) => `- ${d.at}: ${d.question}\n  Choice: ${d.choice}\n  Alternatives: ${d.alternatives}\n  Rationale: ${d.rationale}\n  Manuscript location: ${d.manuscriptLocation}`).join("\n") || "No decisions recorded."}\n\n## Reporting prompts\nThese are curated navigation prompts, not the complete official checklists or certification.\n${REPORTING_GUIDES.map(
    (g) => {
      const answers = g.items
        .map((item, i) => {
          const r = p.reporting[`${g.id}:${i}`];
          return r ? `- ${item}: ${r.status}; ${r.location}; ${r.note}` : "";
        })
        .filter(Boolean);
      return answers.length
        ? `### ${g.name}\n${g.url}\n${answers.join("\n")}`
        : "";
    },
  )
    .filter(Boolean)
    .join(
      "\n\n",
    )}\n\n## Manuscript\n${p.versions.at(-1)?.text || "No manuscript saved."}\n`;
}
