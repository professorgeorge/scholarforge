export const CONTENT_VERSION = "2026.11.1";
export interface Guidance {
  id: string;
  title: string;
  use: string;
  assumptions: string;
  alternatives: string;
  example: string;
  failure: string;
  source: string;
  sourceTitle: string;
}
export const GUIDANCE: Guidance[] = [
  {
    id: "question",
    title: "Define the kind of question",
    use: "Separate describing, explaining, predicting, interpreting, evaluating, and designing before choosing methods.",
    assumptions:
      "The unit of inquiry, context, and intended contribution can be stated explicitly.",
    alternatives:
      "PICO for intervention effects; PCC for scoping; SPIDER for qualitative questions; a construct/context question for theory development.",
    example:
      "“Can we predict attrition?” requires out-of-sample evaluation. “Why do staff leave?” may require explanatory or interpretive inquiry.",
    failure:
      "Treating predictive accuracy as causal explanation, or forcing an interpretive question into an intervention template.",
    source: "https://www.equator-network.org/",
    sourceTitle: "EQUATOR reporting resources",
  },
  {
    id: "measurement",
    title: "Operationalize constructs",
    use: "Connect an abstract concept to observations or measurements before collecting data.",
    assumptions:
      "Content coverage, measurement context, and the proposed interpretation are defensible.",
    alternatives:
      "Established measures, contextual adaptation, multiple indicators, observational measures, or qualitative accounts.",
    example:
      "Before comparing wellbeing across languages, evaluate translation and whether scores have comparable meaning.",
    failure:
      "Treating high Cronbach’s alpha as proof of validity or measurement invariance.",
    source: "https://www.testingstandards.net/",
    sourceTitle: "Standards for Educational and Psychological Testing",
  },
  {
    id: "causality",
    title: "Distinguish causation from association",
    use: "When a conclusion asserts that an intervention or exposure changes an outcome.",
    assumptions:
      "Identification assumptions, timing, selection, confounding, and measurement must be explicit.",
    alternatives:
      "Randomization, carefully justified observational identification, or a narrower associational conclusion.",
    example:
      "A cross-sectional association between autonomy and performance does not establish the direction of influence.",
    failure:
      "Adding controls mechanically, including variables affected by treatment, or strengthening causal wording during revision.",
    source: "https://www.hsph.harvard.edu/miguel-hernan/causal-inference-book/",
    sourceTitle: "Hernán and Robins: Causal Inference",
  },
  {
    id: "qualitative",
    title: "Choose and defend qualitative inquiry",
    use: "To understand meaning, experience, practices, processes, and context.",
    assumptions:
      "Sampling, researcher position, and analytic commitments should fit the question and tradition.",
    alternatives:
      "Reflexive thematic analysis, grounded theory, phenomenology, narrative inquiry, discourse analysis, or case study.",
    example:
      "An interpretive interview study can document how the researcher’s position shaped questions and analysis.",
    failure:
      "Mixing incompatible quality criteria without explanation, treating simulated transcripts as observations, or making universal saturation prescriptions.",
    source: "https://www.equator-network.org/reporting-guidelines/srqr/",
    sourceTitle: "Standards for Reporting Qualitative Research",
  },
  {
    id: "mixed",
    title: "Plan mixed-methods integration",
    use: "When complementary forms of evidence are needed to answer one research problem.",
    assumptions:
      "A clear reason for integration and a feasible sequence, sampling relationship, and interpretive strategy.",
    alternatives:
      "Convergent, explanatory sequential, exploratory sequential, or a well-justified single-method design.",
    example:
      "Use survey patterns to select contrasting interview cases; display agreements and tensions in a joint display.",
    failure:
      "Running two studies side by side without explaining how their findings inform one another.",
    source:
      "https://obssr.od.nih.gov/research-resources/mixed-methods-research",
    sourceTitle: "NIH mixed methods resources",
  },
  {
    id: "synthesis",
    title: "Select an evidence synthesis approach",
    use: "To map a field, estimate effects, explain mechanisms, or synthesize meanings.",
    assumptions:
      "The review purpose, search scope, eligibility, and synthesis method are declared.",
    alternatives:
      "Narrative, scoping, systematic, realist, and qualitative evidence synthesis serve different purposes.",
    example:
      "A scoping review can map how a concept is studied without estimating an intervention effect.",
    failure:
      "Calling a quick search systematic, excluding recent work because it has few citations, or counting papers as independent replications.",
    source: "https://www.prisma-statement.org/",
    sourceTitle: "PRISMA reporting guidance",
  },
  {
    id: "power",
    title: "Plan precision and power",
    use: "Before data collection, compare feasible designs under plausible effect and variance assumptions.",
    assumptions:
      "Effect size, error rate, allocation, reliability, missingness, and dependencies must match the intended analysis.",
    alternatives:
      "Precision-based planning, simulation, sensitivity analysis, or a feasibility study where prior information is weak.",
    example:
      "Compare a null, small, and moderate effect under 0%, 10%, and 20% attrition; report Monte Carlo uncertainty.",
    failure:
      "Using observed significance as a reason to increase sample size or presenting one simulation as a power analysis.",
    source: "https://www.itl.nist.gov/div898/handbook/eda/section3/eda3664.htm",
    sourceTitle: "NIST Student t distribution",
  },
  {
    id: "philosophy",
    title: "Defend philosophical alignment",
    use: "When the nature of knowledge, reality, or interpretation materially shapes a study.",
    assumptions:
      "Positions are reasoned commitments; mapping a method to one philosophy is not a universal rule.",
    alternatives:
      "Present plausible alignments and tensions, including pragmatic and pluralist approaches where justified.",
    example:
      "Two interview studies can have different assumptions about whether accounts reflect experience or construct social meaning.",
    failure:
      "Treating a six-layer compatibility score as proof that a research design is valid.",
    source: "https://plato.stanford.edu/entries/scientific-method/",
    sourceTitle: "Stanford Encyclopedia: Scientific Method",
  },
  {
    id: "communication",
    title: "Communicate estimates and uncertainty",
    use: "When turning analysis into tables, figures, abstracts, and conclusions.",
    assumptions:
      "Reported numbers derive from the actual analysis, with units, denominators, and uncertainty.",
    alternatives:
      "Effect estimates with intervals, descriptive displays, qualitative exemplars, accessible summaries, and explicit limitations.",
    example:
      "Report the estimated difference and interval, then state which populations and settings the inference covers.",
    failure:
      "Reporting fixed significance values, interpreting nonsignificance as equivalence, or generalizing beyond the design.",
    source: "https://www.equator-network.org/reporting-guidelines/sampl/",
    sourceTitle: "SAMPL statistical reporting guidance",
  },
  {
    id: "engineering",
    title: "Evaluate computational and engineering work",
    use: "For benchmarks, algorithms, systems, prototypes, and design artifacts.",
    assumptions:
      "Baselines, evaluation conditions, datasets, leakage controls, and replication instructions are explicit.",
    alternatives:
      "Controlled experiments, ablations, field evaluation, simulation, usability studies, or artifact evaluation.",
    example:
      "Compare an algorithm on held-out datasets with fixed preprocessing and report compute and variability across seeds.",
    failure:
      "Tuning on the test set, comparing unequal compute budgets, or equating benchmark gains with practical usefulness.",
    source:
      "https://www.acm.org/publications/policies/artifact-review-and-badging-current",
    sourceTitle: "ACM artifact review and badging",
  },
  {
    id: "humanities",
    title: "Make interpretive arguments inspectable",
    use: "For archival, historical, textual, and humanities research.",
    assumptions:
      "Corpus selection, context, interpretive choices, translations, and source limitations are explained.",
    alternatives:
      "Close reading, comparative analysis, archival inquiry, oral history, or digital humanities approaches.",
    example:
      "Link an interpretation to the passage and edition, then address plausible competing readings.",
    failure:
      "Treating absent digitized records as historical absence or flattening contested interpretations into a consensus score.",
    source:
      "https://www.historians.org/resource/statement-on-standards-of-professional-conduct/",
    sourceTitle: "American Historical Association professional standards",
  },
];

export const WORKFLOWS = [
  {
    id: "proposal",
    title: "Develop a research proposal",
    steps: [
      "Define question and contribution",
      "Assess evidence and feasibility",
      "Compare design alternatives",
      "Plan measurement and analysis",
      "Record protocol and ethics requirements",
    ],
  },
  {
    id: "literature",
    title: "Conduct a literature review",
    steps: [
      "Declare review purpose and question",
      "Record search strategy",
      "Define eligibility criteria",
      "Screen and resolve disagreements",
      "Extract and appraise evidence",
      "Synthesize findings and limitations",
    ],
  },
  {
    id: "analysis",
    title: "Plan or analyze a study",
    steps: [
      "Define variables and estimands",
      "Record design assumptions",
      "Plan precision and sample size",
      "Save analysis specification",
      "Inspect results and uncertainty",
    ],
  },
  {
    id: "manuscript",
    title: "Improve a manuscript",
    steps: [
      "Save manuscript version",
      "Review claims and source passages",
      "Inspect contradictory evidence",
      "Review reporting requirements",
      "Revise interpretation and limitations",
    ],
  },
  {
    id: "submission",
    title: "Prepare a submission",
    steps: [
      "Verify journal policies at source",
      "Check reporting requirements",
      "Audit references",
      "Confirm declarations",
      "Prepare submission package",
    ],
  },
  {
    id: "revision",
    title: "Respond to reviewers",
    steps: [
      "Record each reviewer comment",
      "Decide action and rationale",
      "Revise manuscript",
      "Link response to manuscript location",
      "Check revised claims and references",
    ],
  },
];

export interface ReportingGuide {
  id: string;
  name: string;
  scope: string;
  url: string;
  items: string[];
}
// Curated navigation prompts, not reproductions of the complete licensed checklists.
export const REPORTING_GUIDES: ReportingGuide[] = [
  {
    id: "prisma",
    name: "PRISMA 2020",
    scope: "Systematic reviews; consult extensions for other review types.",
    url: "https://www.prisma-statement.org/prisma-2020",
    items: [
      "Review question and eligibility",
      "Information sources and exact searches",
      "Selection process and exclusion reasons",
      "Data collection and risk-of-bias methods",
      "Synthesis methods and results",
      "Certainty, limitations, registration, and support",
    ],
  },
  {
    id: "consort",
    name: "CONSORT",
    scope:
      "Randomized trials; select the applicable current checklist and extension.",
    url: "https://www.consort-spirit.org/",
    items: [
      "Design and allocation",
      "Participants and interventions",
      "Outcomes and sample size",
      "Randomization and masking",
      "Participant flow, estimates, and harms",
      "Registration, protocol, and transparency",
    ],
  },
  {
    id: "strobe",
    name: "STROBE",
    scope: "Observational cohort, case-control, and cross-sectional studies.",
    url: "https://www.strobe-statement.org/",
    items: [
      "Design, setting, and participants",
      "Variables and measurement",
      "Bias, sample size, and missing data",
      "Statistical methods",
      "Descriptive data and estimates",
      "Limitations and generalizability",
    ],
  },
  {
    id: "srqr",
    name: "SRQR",
    scope: "Qualitative research; use with an appropriate analytic tradition.",
    url: "https://www.equator-network.org/reporting-guidelines/srqr/",
    items: [
      "Problem and qualitative approach",
      "Researcher characteristics and reflexivity",
      "Context, sampling, and ethics",
      "Data collection and analysis",
      "Findings linked to empirical material",
      "Interpretation, transferability, and limitations",
    ],
  },
  {
    id: "coreq",
    name: "COREQ",
    scope: "Qualitative interviews and focus groups.",
    url: "https://www.equator-network.org/reporting-guidelines/coreq/",
    items: [
      "Research team and reflexivity",
      "Study design and recruitment",
      "Data collection context",
      "Analysis process",
      "Participant quotations",
      "Findings, variation, and limitations",
    ],
  },
  {
    id: "spirit",
    name: "SPIRIT",
    scope: "Clinical trial protocols.",
    url: "https://www.consort-spirit.org/",
    items: [
      "Rationale, objectives, and design",
      "Eligibility, interventions, and outcomes",
      "Sample size and allocation",
      "Collection, management, and analysis",
      "Monitoring and participant protection",
      "Registration, amendments, and dissemination",
    ],
  },
  {
    id: "arrive",
    name: "ARRIVE",
    scope: "Animal research.",
    url: "https://arriveguidelines.org/",
    items: [
      "Study design and sample size",
      "Inclusion, randomization, and blinding",
      "Outcome measures and statistical methods",
      "Animals and procedures",
      "Results and adverse events",
      "Ethics, limitations, and reproducibility",
    ],
  },
  {
    id: "acm",
    name: "Computational artifact review",
    scope: "Computational reproducibility prompts; not a certification.",
    url: "https://www.acm.org/publications/policies/artifact-review-and-badging-current",
    items: [
      "Artifact identity and version",
      "Environment and dependencies",
      "Data and access conditions",
      "Execution instructions",
      "Expected outputs and checks",
      "Limitations, licensing, and preservation",
    ],
  },
];
