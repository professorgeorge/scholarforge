import type { ActiveManuscriptContext } from './manuscriptParserService';
import type { AcademicPillar } from '../components/Navbar';

export interface ReadinessCheckItem {
  id: string;
  category: 'structure' | 'citations' | 'anonymity' | 'ethics' | 'methodology';
  title: string;
  status: 'pass' | 'warning' | 'fail';
  pointsEarned: number;
  pointsPossible: number;
  metric?: string;
  description: string;
  recommendation?: string;
  targetPillar?: AcademicPillar;
  actionLabel?: string;
}

export interface ReadinessCategorySummary {
  category: 'structure' | 'citations' | 'anonymity' | 'ethics' | 'methodology';
  label: string;
  score: number;
  maxScore: number;
  percentage: number;
  items: ReadinessCheckItem[];
}

export interface EditorialReadinessReport {
  overallScore: number; // 0 to 100
  tier: 'top_tier' | 'minor_polish' | 'moderate_friction' | 'desk_reject_risk';
  tierLabel: string;
  tierDescription: string;
  executiveSummary: string;
  manuscriptTitle: string;
  wordCount: number;
  referenceCount: number;
  evaluatedAt: number;
  categories: ReadinessCategorySummary[];
  actionableRemediations: ReadinessCheckItem[];
}

export interface ReadinessOptions {
  articleType: 'empirical' | 'review' | 'conceptual';
  doubleBlind: boolean;
  abstractLimit: number | null;
  manuscriptLimit: number | null;
}
export const DEFAULT_READINESS_OPTIONS: ReadinessOptions = {
  articleType: 'empirical', doubleBlind: true, abstractLimit: null, manuscriptLimit: null,
};

/** Local text indicators only. No registry requests or editorial predictions. */
export function evaluateEditorialReadiness(
  manuscript: ActiveManuscriptContext | null,
  options: ReadinessOptions = DEFAULT_READINESS_OPTIONS,
): EditorialReadinessReport {
  const text = manuscript?.rawText || '';
  const body = manuscript?.body || text;
  const bib = manuscript?.bibliography || '';
  const words = (value: string) => value.trim().split(/\s+/).filter(Boolean).length;
  const items: ReadinessCheckItem[] = [];
  const add = (id: string, category: ReadinessCheckItem['category'], title: string,
    detected: boolean, description: string, targetPillar: AcademicPillar,
    recommendation: string, metric?: string, manual = false) => {
    items.push({ id, category, title, status: detected && !manual ? 'pass' : 'warning',
      pointsEarned: detected && !manual ? 1 : 0, pointsPossible: 1,
      description, recommendation, metric, targetPillar, actionLabel: 'Open related tool' });
  };
  if (text.trim()) {
    add('title_length', 'structure', 'Title detected', !!manuscript?.title?.trim(),
      'Title detection does not assess novelty or suitability.', 'writing', 'Check the title against the target journal instructions.', `${words(manuscript?.title || '')} words`);
    const abstractWords = words(manuscript?.abstract || '');
    add('abstract_budget', 'structure', 'Abstract and supplied word limit',
      abstractWords > 0 && (!options.abstractLimit || abstractWords <= options.abstractLimit),
      abstractWords ? 'Abstract text detected. Word counts are approximate; journal counting rules vary.' : 'No distinct abstract detected.',
      'writing', 'Review the abstract and enter the target journal limit if applicable.', `${abstractWords} words; limit ${options.abstractLimit || 'not supplied'}`);
    add('substantive_length', 'structure', 'Manuscript word limit',
      !!options.manuscriptLimit && words(text) <= options.manuscriptLimit,
      'Count includes all imported text. Length does not establish scholarly depth.', 'writing',
      'Compare the journal limit and its rules for excluding references, tables, and supplements.', `${words(text)} words; limit ${options.manuscriptLimit || 'not supplied'}`);
    if (options.articleType === 'empirical') {
      const headings = ['introduction|background', 'methods|methodology|materials and methods', 'results|findings', 'discussion|conclusions?'];
      const count = headings.filter(pattern => new RegExp(`(?:^|\\n)\\s*(?:#{1,6}\\s*)?(?:\\d+\\.?\\s+)?(?:${pattern})\\b`, 'i').test(text)).length;
      add('sections_structure', 'structure', 'Empirical article headings', count === 4,
        'Heading matches do not establish complete reporting. Alternative structures may be appropriate.', 'studio',
        'Check the structure for your article type.', `${count}/4 heading groups detected`);
    }
    add('reference_volume', 'citations', 'Bibliography detected', !!bib.trim(),
      'Reference quantity does not establish coverage, peer review, or evidential support.', 'verify',
      'Check reference accuracy and relevance against the original sources.', `${manuscript?.detectedReferencesCount || 0} parsed references`);
    const dois = new Set((bib.match(/10\.\d{4,9}\/[-._;()/:A-Z0-9]+/gi) || []).map(x => x.toLowerCase()));
    add('doi_coverage', 'citations', 'DOI text patterns', false,
      'DOI-shaped text has not been resolved or matched to a source by this checklist. Some valid sources have no DOI.',
      'verify', 'Run the reference audit to check registry matches.', `${dois.size} distinct DOI patterns; resolution not checked`, true);
    const flagged = /\b(retracted|retraction|withdrawn|expression of concern)\b/i.test(bib);
    add('retraction_scan', 'citations', 'Retraction status requires verification', false,
      flagged ? 'Retraction-related wording appears in the bibliography. It may describe a study of retractions; inspect its context.' : 'No retraction-related wording detected. Absence of wording does not establish a clean retraction status.',
      'verify', 'Check publisher notices and the reference audit before interpreting citation status.', 'Registry status not checked', true);
    if (options.doubleBlind) {
      add('anonymity_review', 'anonymity', 'Blinded manuscript review', false,
        'Text patterns cannot certify anonymity. Author names, affiliations, acknowledgements, repository links, and file metadata require inspection.',
        'anonymizer', 'Review proposed redactions and inspect the final submission file, including its metadata.', 'Manual review required', true);
    }
    const declarations: [string, string, RegExp, string][] = [
      ['ethics_statement', 'Ethics and consent', /\b(irb|ethics|informed consent|ethical approval)\b/i, 'Record the actual approval, consent, exemption, or reason this is not applicable.'],
      ['coi_statement', 'Competing interests', /conflicts? of interest|competing interests?/i, 'Disclose actual interests; do not insert an unverified no-conflict declaration.'],
      ['data_availability', 'Data and materials availability', /data availability|available from the corresponding author/i, 'Describe actual access conditions, restrictions, and repository locations.'],
      ['funding_disclosure', 'Funding disclosure', /\bfunding\b|financial support|supported by.*grant/i, 'Report actual funding and funder roles, or confirm that no funding was received.'],
    ];
    for (const [id, title, pattern, recommendation] of declarations) {
      const found = pattern.test(body);
      add(id, 'ethics', title, false,
        found ? 'Related wording detected; completeness, accuracy, and applicability still need author review.' : 'No matching wording detected; confirm whether this declaration is required.',
        id === 'ethics_statement' ? 'irb' : 'studio', recommendation, found ? 'Wording detected; unverified' : 'Not detected', true);
    }
    add('hypothesis_objective', 'methodology', 'Research aim or question', /research question|objective|study aims|study aimed|we hypothesi/i.test(body),
      'This is a wording check, not an assessment of the research question.', 'concept', 'State the research purpose and its scope explicitly.');
    if (options.articleType !== 'conceptual') {
      add('sample_specification', 'methodology', 'Sampling or source selection', /\bn\s*=\s*\d+|\d+\s+(participants|records|studies|informants)|inclusion criteria/i.test(body),
        'Detected counts or selection wording do not establish sample adequacy.', 'methodology', 'Explain sample or source selection and the basis for its adequacy.');
      add('analytical_precision', 'methodology', 'Analysis description', /confidence interval|thematic analysis|grounded theory|meta.analysis|regression|p\s*[=<]/i.test(body),
        'Analysis vocabulary does not verify calculations, assumptions, or methodological rigor.', 'methodology', 'Check design-appropriate methods and reporting, including uncertainty and limitations.');
    }
    add('limitations', 'methodology', 'Limitations and boundaries', /\blimitations?\b|boundary conditions/i.test(body),
      'A limitations marker does not establish that all relevant limitations are addressed.', 'studio', 'Describe inference limits, competing explanations, and transferability.');
  }
  const labels = { structure: 'Structure and word limits', citations: 'Reference checks', anonymity: 'Blinded review', ethics: 'Author declarations', methodology: 'Methods and scope' };
  const categories = (Object.keys(labels) as ReadinessCheckItem['category'][]).map(category => {
    const selected = items.filter(item => item.category === category);
    const score = selected.reduce((sum, item) => sum + item.pointsEarned, 0);
    return { category, label: labels[category], score, maxScore: selected.length,
      percentage: selected.length ? Math.round(100 * score / selected.length) : 0, items: selected };
  }).filter(category => category.items.length);
  const passed = items.filter(item => item.status === 'pass').length;
  return {
    overallScore: items.length ? Math.round(100 * passed / items.length) : 0,
    tier: 'moderate_friction',
    tierLabel: text.trim() ? 'Author review required' : 'No active manuscript loaded',
    tierDescription: 'Local text checklist only. This is not certification, journal compliance, research-quality scoring, or a prediction of acceptance.',
    executiveSummary: `${passed} text checks satisfied; ${items.length - passed} checks require review. No external registries were queried. Profile: ${options.articleType}; blinded review: ${options.doubleBlind ? 'yes' : 'no'}.`,
    manuscriptTitle: manuscript?.title || 'Untitled manuscript', wordCount: words(text),
    referenceCount: manuscript?.detectedReferencesCount || 0, evaluatedAt: Date.now(), categories,
    actionableRemediations: items.filter(item => item.status !== 'pass'),
  };
}

/** Kept under its previous export name for compatibility with existing callers. */
export function generateReadinessCertificateMarkdown(report: EditorialReadinessReport): string {
  return `# ScholarForge Submission Preparation Checklist
Date: ${new Date(report.evaluatedAt).toISOString().slice(0, 10)}
Manuscript: ${report.manuscriptTitle}
Text checks satisfied: ${report.overallScore}%

${report.tierDescription}
${report.executiveSummary}

${report.categories.map(category => `## ${category.label}\n${category.items.map(item => `- [${item.status === 'pass' ? 'TEXT DETECTED' : 'REVIEW'}] ${item.title}: ${item.metric || ''} ${item.description} ${item.recommendation || ''}`).join('\n')}`).join('\n\n')}

Generated locally from supplied text. No Crossref, OpenAlex, publisher, or institutional verification is performed by this checklist.
`;
}
