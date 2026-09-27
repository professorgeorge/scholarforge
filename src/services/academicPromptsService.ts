import type { AcademicPaper, AcademicPromptTemplate, CitationStyle } from '../types/citation';
import { formatReferenceEntryPlain } from './citationFormatter';
import { calculateDatasetMetrics } from './datasetScientometrics';

export const ACADEMIC_PROMPT_TEMPLATES: AcademicPromptTemplate[] = [
  {
    id: 'godmode',
    title: '👑 God-Mode: Full Academic Paper Generator',
    iconName: 'Crown',
    badge: 'Publication-Ready',
    description:
      'Generates a complete, rigorous 7-section publication manuscript (Title, Abstract, Introduction, Review, Methods, Discussion, Implications, and References).',
    template: (papers, query) => {
      const topic = query ? `on "${query}"` : '';
      return `ACT AS A WORLD-CLASS SENIOR RESEARCH PROFESSOR AND JOURNAL EDITOR-IN-CHIEF.

Draft a comprehensive, rigorous, publication-ready Academic Research Paper ${topic} based strictly and authentically upon the attached literature dataset (${papers.length} peer-reviewed references).

STRUCTURE THE MANUSCRIPT WITH THE FOLLOWING SECTIONS:
- Title (Authoritative, empirical, non-clickbait)
- Abstract (200-250 words: Context, Purpose, Methodology, Key Findings, Contributions)
- 1. Introduction & Research Questions (The problematization, theoretical tension, and 3 explicit research questions)
- 2. Theoretical Framework & Narrative Review (Synthesizing foundational concepts and paradigms from the literature)
- 3. Methodological Landscape & Comparative Analysis (Comparing sample designs, empirical frameworks, and data architectures)
- 4. Critical Discussion & Empirical Discrepancies (Cross-examining findings, debates, and contradictions)
- 5. Strategic Research Gaps & Proposed Hypotheses (Delineating unaddressed voids in the corpus)
- 6. Practical & Policy Implications (Actionable directives for institutions, practitioners, and policymakers)
- 7. Conclusion & Research Horizons
- Complete References (Formatted with in-text author-date citations corresponding strictly to the attached dataset)

GROUNDING LITERATURE DATASET:
${formatPapersForPrompt(papers, 'apa')}`;
    },
  },
  {
    id: 'synthesis',
    title: '📋 Literature Review Synthesis Matrix',
    iconName: 'Layers',
    badge: 'Systematic',
    description:
      'Synthesizes core themes, comparative methodological frameworks, and empirical findings across all papers.',
    template: (papers, query) => {
      return `ACT AS A SENIOR ACADEMIC RESEARCHER AND SYSTEMATIC REVIEWER.

Synthesize the attached research dataset (${papers.length} papers${query ? ` regarding "${query}"` : ''}) into a structured Literature Review paper:
1. Executive Summary & Core Themes: Group the papers into 3-4 convergent thematic clusters.
2. Comparative Methodological Overview: Contrast the empirical vs conceptual approaches employed.
3. Critical Empirical Findings: Detail the major discoveries, statistical effects, and qualitative findings.
4. Unaddressed Research Gaps: Detail what questions current literature leaves unanswered.
5. Strategic Future Research Agenda: Formulate concrete research designs for future studies.

LITERATURE DATASET:
${formatPapersForPrompt(papers, 'apa')}`;
    },
  },
  {
    id: 'research_gaps',
    title: '🔍 Research Gaps & Future Directions',
    iconName: 'Search',
    badge: 'Discovery',
    description:
      'Identifies theoretical, methodological, sample, and contextual gaps across the corpus and suggests new hypotheses.',
    template: (papers) => {
      return `ACT AS A SENIOR METHODOLOGIST AND DISSERTATION COMMITTEE CHAIR.

Thoroughly analyze the attached literature corpus (${papers.length} papers). Identify and formulate 5 explicit research gaps:
1. Theoretical Gaps (Under-theorized constructs or untested boundary conditions)
2. Methodological Gaps (Over-reliance on cross-sectional surveys, lack of longitudinal or mixed-method designs)
3. Sample & Contextual Gaps (Geographic, cultural, or industry blind spots)
4. Empirical Contradictions (Areas where authors report conflicting results)
5. Actionable Research Questions & Hypotheses: For each gap, propose 1 testable hypothesis or specific research question.

LITERATURE CORPUS:
${formatPapersForPrompt(papers, 'apa')}`;
    },
  },
  {
    id: 'methodology_matrix',
    title: '📊 Methodology Matrix & Evidence Table',
    iconName: 'Table',
    badge: 'PRISMA Table',
    description:
      'Constructs an academic Markdown evidence table detailing study design, sample size, variables, and limitations.',
    template: (papers) => {
      return `ACT AS A SYSTEMATIC REVIEW METHODOLOGY AUDITOR.

Construct a structured Methodology Evidence Matrix in Markdown table format comparing each study in the attached dataset:
| Paper Citation | Research Design | Sample Size & Setting | Key Constructs / Variables | Analytical Techniques | Core Empirical Finding | Stated Limitations |

Following the table, provide:
1. Methodological Trends: What are the prevailing study designs and analytical techniques?
2. Methodological Vulnerabilities: Common validity or measurement concerns across the corpus.

PAPERS TO AUDIT:
${formatPapersForPrompt(papers, 'apa')}`;
    },
  },
  {
    id: 'theoretical_frameworks',
    title: '💡 Theoretical Frameworks & Conceptual Models',
    iconName: 'Lightbulb',
    badge: 'Theory',
    description:
      'Maps underlying theories, construct relationships, and synthesizes an integrative theoretical model.',
    template: (papers) => {
      return `ACT AS A THEORETICAL SCHOLAR IN SOCIAL SCIENCES & SYSTEM DYNAMICS.

Analyze the attached literature dataset to map its theoretical architecture:
1. Primary Theoretical Frameworks: Identify the dominant theories used by the authors.
2. Conceptual Definitions: Define the key constructs and how they relate across papers.
3. Evolution & Critique: How do recent papers build upon or critique earlier foundational works?
4. Integrative Theoretical Model: Propose an overarching conceptual model that harmonizes the divergent perspectives found in the dataset.

ATTACHED PAPERS:
${formatPapersForPrompt(papers, 'apa')}`;
    },
  },
  {
    id: 'conflicting_findings',
    title: '🥊 Conflicting Findings & Scholarly Debates',
    iconName: 'Swords',
    badge: 'Debate',
    description:
      'Analyzes points of controversy, empirical discrepancies, and divergent perspectives between authors.',
    template: (papers) => {
      return `ACT AS AN EXPERT PEER REVIEWER.

Critically analyze the attached papers to identify areas of debate, contradictory evidence, and conflicting interpretations:
1. Areas of Scholarly Consensus: What core premises or empirical facts do all authors agree on?
2. Points of Empirical Contradiction: Where do author findings directly clash?
3. Underlying Causes of Discrepancy: Analyze whether differences stem from differing sample populations, measurement instruments, or contextual variables.
4. Resolution Agenda: What empirical research design would definitively resolve these conflicting findings?

LITERATURE CORPUS:
${formatPapersForPrompt(papers, 'apa')}`;
    },
  },
  {
    id: 'practical_implications',
    title: '⚡ Practical, Clinical & Policy Implications',
    iconName: 'Zap',
    badge: 'Applied',
    description:
      'Translates academic findings into concrete executive recommendations, risk assessments, and implementation roadmaps.',
    template: (papers) => {
      return `ACT AS A SENIOR STRATEGIC POLICY ADVISOR AND EXECUTIVE CONSULTANT.

Extract and translate the research findings from the attached literature dataset into applied, actionable recommendations:
1. Executive Summary: Top 3 high-impact takeaways for industry leaders and policymakers.
2. Evidence-Based Directives: Specific institutional policies, operational interventions, or clinical practices supported by the data.
3. Implementation Roadmap & Risks: Practical hurdles, organizational barriers, and unintended consequences warned against in the literature.
4. Key Performance Indicators (KPIs): Measurable metrics to monitor intervention efficacy.

ATTACHED RESEARCH:
${formatPapersForPrompt(papers, 'apa')}`;
    },
  },
];

/**
 * Formats a list of academic papers into a clean textual bundle for LLM prompts.
 */
export function formatPapersForPrompt(
  papers: AcademicPaper[],
  style: CitationStyle = 'apa'
): string {
  return papers
    .map((p, idx) => {
      const citation = formatReferenceEntryPlain(p, style, idx + 1);
      const authors = p.authors.map((a) => a.name).join(', ') || 'Unknown Authors';
      const abstract = p.abstract || 'No abstract available.';

      let entry = `[${idx + 1}] ${p.title}\n`;
      entry += `Authors: ${authors} | Year: ${p.year || 'n.d.'} | Venue: ${p.venue || 'N/A'}\n`;
      if (p.doi) entry += `DOI: https://doi.org/${p.doi}\n`;
      if (p.citationCount) entry += `Citations: ${p.citationCount.toLocaleString()}\n`;
      entry += `Citation (${style.toUpperCase()}): ${citation}\n`;
      entry += `Abstract: ${abstract}\n`;
      return entry;
    })
    .join('\n---\n\n');
}

/**
 * Generates an LLM-ready comprehensive Markdown dossier with scientometric benchmarks.
 */
export function generateLLMMarkdownDataset(
  papers: AcademicPaper[],
  style: CitationStyle = 'apa',
  query = 'Literature Dataset'
): string {
  const metrics = calculateDatasetMetrics(papers);
  const dateStr = new Date().toLocaleDateString('en-US');

  let md = `# Research Literature Dataset (${papers.length} Papers)\n\n`;
  md += `- **Topic / Focus**: ${query}\n`;
  md += `- **Citation Style**: ${style.toUpperCase()}\n`;
  md += `- **Generated**: ${dateStr}\n\n`;

  md += `## 📊 Corpus Scientometric Benchmarks\n`;
  md += `- **Total Dataset Citations**: ${metrics.totalCitations.toLocaleString()} citations\n`;
  md += `- **Average Citations per Paper**: ${metrics.avgCitations}\n`;
  md += `- **Dataset H-Index Benchmark**: ${metrics.hIndex}\n`;
  md += `- **Highly Cited Papers (100+)**: ${metrics.highlyCitedCount}\n`;
  md += `- **Influential Papers (25-99)**: ${metrics.influentialCount}\n`;
  md += `- **Open Access Available**: ${metrics.openAccessCount} (${metrics.openAccessPct}%)\n\n`;
  md += `---\n\n`;

  md += `## 📚 Peer-Reviewed Literature Records\n\n`;
  papers.forEach((p, idx) => {
    const citation = formatReferenceEntryPlain(p, style, idx + 1);
    const authors = p.authors.map((a) => a.name).join(', ') || 'Unknown Authors';
    const abstract = p.abstract || 'No abstract available.';

    md += `### [${idx + 1}] ${p.title}\n`;
    md += `- **Authors**: ${authors}\n`;
    md += `- **Year**: ${p.year || 'n.d.'}\n`;
    md += `- **Venue / Journal**: ${p.venue || 'N/A'}\n`;
    if (p.volume) md += `- **Volume / Issue**: Vol. ${p.volume}${p.issue ? `, No. ${p.issue}` : ''}\n`;
    if (p.pages) md += `- **Pages**: ${p.pages}\n`;
    if (p.doi) md += `- **DOI**: [https://doi.org/${p.doi}](https://doi.org/${p.doi})\n`;
    if (p.citationCount) md += `- **Citation Count**: ${p.citationCount.toLocaleString()}\n`;
    if (p.openAccessPdf) md += `- **Open Access PDF**: [Direct Download](${p.openAccessPdf})\n`;
    md += `- **Formatted Citation (${style.toUpperCase()})**: ${citation}\n\n`;
    md += `**Abstract**:\n${abstract}\n\n`;
    md += `---\n\n`;
  });

  return md;
}
