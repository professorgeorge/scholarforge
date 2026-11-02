import type { AcademicPaper } from '../types/citation';
import type { DiscoveryBatch } from './researchToolsService';

export interface ConceptFrame { id: string; title: string; lens: string; statement: string; assumptions: string }
export interface ConceptEvidence { id: string; paperId: string; role: 'supports' | 'challenges' | 'context'; quote: string; passage: string; locator: string; interpretation: string }
export interface ConceptConstruct { id: string; name: string; definition: string; observation: string }
export interface ConceptLink { id: string; from: string; to: string; relationship: string; mechanism: string; boundary: string }
export interface ConceptPathway { id: string; design: string; fit: string; sampling: string; analysis: string; limits: string; feasibility: string }
export interface ConceptStudy {
  narrative: string; observed: string; expected: string; stakeholders: string; level: string; assumptions: string; unknowns: string;
  frames: ConceptFrame[]; selectedFrameId: string; question: string;
  gap: string; gapKind: string; coverageNotes: string; counterEvidence: string; evidence: ConceptEvidence[];
  gapReviewedBasis: string; modelReviewedBasis: string; pathwayReviewedBasis: string;
  modelKind: string; explanation: string; constructs: ConceptConstruct[]; links: ConceptLink[];
  propositions: string; rivals: string; disconfirmation: string; contribution: string;
  pathways: ConceptPathway[]; selectedPathwayId: string; constraints: string; decisions: string;
}
export const CONCEPT_STATE_KEY = 'ConceptStudio.study';
export type ConceptHandoffTarget = 'literature' | 'methodology' | 'counterevidence' | 'instruments' | 'funding';
/** Explicit destination fields only: preserve manuscripts, evidence ledgers, and saved results. */
export function conceptHandoffFields(target: ConceptHandoffTarget, study: ConceptStudy, existing: Record<string, unknown>): Record<string, unknown> {
  if (target === 'funding') {
    const previous = typeof existing['FundingFinder.profile'] === 'object' && existing['FundingFinder.profile'] ? existing['FundingFinder.profile'] as Record<string, unknown> : {};
    return { 'FundingFinder.profile': { applicant: 'any', country: '', projectLocation: '', purpose: 'Research', constraints: study.constraints, ...previous, idea: [...new Set([typeof previous.idea === 'string' ? previous.idea : '', study.question || study.narrative].filter(Boolean))].join('\n\n') } };
  }
  const append = (key: string, text: string) => [typeof existing[key] === 'string' ? existing[key] : '', text].filter(Boolean).join('\n\n');
  if (target === 'methodology') {
    const pathway = study.pathways.find(item => item.id === study.selectedPathwayId);
    return {
      'MethodologyCompassPane.aiObjective': append('MethodologyCompassPane.aiObjective', `Concept & Theory Studio — working research question:\n${study.question}\nProposed explanation: ${study.explanation || 'Still developing'}`),
      'MethodologyCompassPane.aiDataDesc': append('MethodologyCompassPane.aiDataDesc', `Concept studio pathway context (proposed):\n${pathway ? `${pathway.design}\nQuestion fit: ${pathway.fit}\nData/sampling: ${pathway.sampling}\nAnalysis: ${pathway.analysis}\nLimits: ${pathway.limits}\nFeasibility: ${pathway.feasibility}` : 'No working pathway selected.'}\nConstraints: ${study.constraints || 'Not supplied'}`),
    };
  }
  if (target === 'counterevidence') return { 'CounterevidencePane.proposition': study.propositions, 'CounterevidencePane.topic': study.question, 'CounterevidencePane.queries': [] };
  if (target === 'instruments') return { 'InstrumentFinderPane.construct': study.constructs.find(item => item.name.trim())?.name || '', 'InstrumentFinderPane.query': '' };
  return {};
}
export const emptyConceptStudy = (): ConceptStudy => ({
  narrative: '', observed: '', expected: '', stakeholders: '', level: '', assumptions: '', unknowns: '', frames: [], selectedFrameId: '', question: '',
  gap: '', gapKind: 'mechanism', coverageNotes: '', counterEvidence: '', evidence: [], gapReviewedBasis: '', modelReviewedBasis: '', pathwayReviewedBasis: '',
  modelKind: 'relationships', explanation: '', constructs: [], links: [], propositions: '', rivals: '', disconfirmation: '', contribution: '',
  pathways: [], selectedPathwayId: '', constraints: '', decisions: '',
});
export const selectedConceptFrame = (study: ConceptStudy) => study.frames.find(frame => frame.id === study.selectedFrameId);
export function conceptEvidenceErrors(entry: ConceptEvidence, papers: AcademicPaper[]): string[] {
  const paper = papers.find(item => item.id === entry.paperId);
  const errors: string[] = [];
  const normalize = (value: string) => value.replace(/\s+/g, ' ').trim();
  if (!paper) errors.push('Choose an available source.');
  if (!entry.quote.trim() || !entry.locator.trim() || !entry.interpretation.trim()) errors.push('Record a quotation, its location, and your interpretation.');
  if (entry.quote.trim() && !normalize(paper?.abstract || '').includes(normalize(entry.quote)) && !normalize(entry.passage).includes(normalize(entry.quote))) errors.push('The quotation must match the supplied abstract or pasted source passage.');
  return errors;
}
export function conceptGapErrors(study: ConceptStudy, papers: AcademicPaper[]): string[] {
  const errors: string[] = [];
  if (!study.gap.trim() || !study.question.trim() || !selectedConceptFrame(study)?.statement.trim()) errors.push('Record a working frame, research question, and candidate gap.');
  if (!study.coverageNotes.trim()) errors.push('Describe search coverage, terminology, and remaining limits.');
  if (!study.counterEvidence.trim()) errors.push('Explain your search for competing work and what challenges the gap.');
  if (!study.evidence.some(entry => !conceptEvidenceErrors(entry, papers).length)) errors.push('Add at least one source passage with a location and interpretation.');
  if (study.evidence.some(entry => conceptEvidenceErrors(entry, papers).length)) errors.push('Complete or remove unfinished evidence notes before recording review.');
  return errors;
}
export function conceptGapBasis(study: ConceptStudy, papers: AcademicPaper[], searches: DiscoveryBatch['searches']): string {
  return JSON.stringify({ narrative: study.narrative, observed: study.observed, expected: study.expected, stakeholders: study.stakeholders, level: study.level, assumptions: study.assumptions, unknowns: study.unknowns, frame: selectedConceptFrame(study), question: study.question, gap: study.gap, gapKind: study.gapKind, coverage: study.coverageNotes, counter: study.counterEvidence, evidence: study.evidence, sources: study.evidence.map(entry => papers.find(paper => paper.id === entry.paperId)), searches });
}
export function conceptGapStatus(study: ConceptStudy, papers: AcademicPaper[], searches: DiscoveryBatch['searches']): string {
  if (!study.gapReviewedBasis) return 'Candidate gap — not reviewed';
  if (study.gapReviewedBasis !== conceptGapBasis(study, papers, searches) || conceptGapErrors(study, papers).length) return 'Needs rechecking — inputs or evidence changed';
  return 'User-reviewed against recorded sources — coverage remains limited';
}
export const conceptModelBasis = (study: ConceptStudy, papers: AcademicPaper[], searches: DiscoveryBatch['searches']) => JSON.stringify([conceptGapBasis(study, papers, searches), study.modelKind, study.constructs, study.links, study.explanation, study.propositions, study.rivals, study.disconfirmation, study.contribution]);
export const conceptPathwayBasis = (study: ConceptStudy, papers: AcademicPaper[], searches: DiscoveryBatch['searches']) => JSON.stringify([conceptModelBasis(study, papers, searches), study.pathways, study.selectedPathwayId, study.constraints]);
export function conceptBrief(study: ConceptStudy, papers: AcademicPaper[], searches: DiscoveryBatch['searches']): string {
  const v = (text?: string) => text?.trim() || '[Not supplied]';
  const frame = selectedConceptFrame(study);
  const construct = (id: string) => study.constructs.find(item => item.id === id)?.name || '[Concept removed]';
  return `# Research concept brief\n\nWorking document. Explanations and pathways are proposals; source notes are user interpretations.\n\n## Situation and puzzle\n${v(study.narrative)}\n\nObserved: ${v(study.observed)}\nExpected: ${v(study.expected)}\nPeople/context: ${v(study.stakeholders)}\nLevel of analysis: ${v(study.level)}\nAssumptions: ${v(study.assumptions)}\nUnknowns: ${v(study.unknowns)}\n\n## Alternative framings\n${study.frames.map(item => `### ${v(item.title)}${item.id === frame?.id ? ' (working frame)' : ''}\nLens: ${v(item.lens)}\n${v(item.statement)}\nAssumptions: ${v(item.assumptions)}`).join('\n\n') || '[Not supplied]'}\n\n## Research question\n${v(study.question)}\n\n## Candidate gap (${study.gapKind})\n${v(study.gap)}\n\nStatus: ${conceptGapStatus(study, papers, searches)}\nCoverage and limits: ${v(study.coverageNotes)}\nCompeting work and counterevidence: ${v(study.counterEvidence)}\n\n### Search record\n${searches.map(search => `- ${search.query}: ${search.statuses.map(source => `${source.name}: ${source.status} (${source.count})`).join('; ')}`).join('\n') || 'No searches recorded in this studio. Document external searches in coverage notes.'}\n\n### Evidence notes\n${study.evidence.map(entry => { const paper = papers.find(item => item.id === entry.paperId); return `- ${paper?.title || entry.paperId} (${paper?.year || 'year unknown'}); ${paper?.doi || paper?.url || 'No source link'}\n  Role: ${entry.role}\n  Quotation: ${v(entry.quote)}\n  Location: ${v(entry.locator)}\n  Supplied passage: ${v(entry.passage)}\n  Interpretation: ${v(entry.interpretation)}\n  Passage check: ${conceptEvidenceErrors(entry, papers).join(' ') || 'Matches supplied text; not independent source verification.'}`; }).join('\n') || '[Not supplied]'}\n\n## Proposed conceptual model: ${study.modelKind}\nReview: ${study.modelReviewedBasis ? study.modelReviewedBasis === conceptModelBasis(study, papers, searches) ? 'User reviewed' : 'Needs rechecking after changes' : 'Not reviewed'}\n${v(study.explanation)}\n\n### Concepts\n${study.constructs.map(item => `- ${v(item.name)}: ${v(item.definition)}\n  Observation/interpretation: ${v(item.observation)}`).join('\n') || '[Not supplied]'}\n\n### Proposed connections\n${study.links.map(link => `- ${construct(link.from)} → ${construct(link.to)}: ${v(link.relationship)}\n  Mechanism: ${v(link.mechanism)}\n  Boundary: ${v(link.boundary)}`).join('\n') || '[Not supplied]'}\n\nPropositions or sensitizing questions: ${v(study.propositions)}\nRival explanations: ${v(study.rivals)}\nEvidence that would challenge this explanation: ${v(study.disconfirmation)}\nIntended contribution: ${v(study.contribution)}\n\n## Study pathways\nReview: ${study.pathwayReviewedBasis ? study.pathwayReviewedBasis === conceptPathwayBasis(study, papers, searches) ? 'User reviewed' : 'Needs rechecking after changes' : 'Not reviewed'}\nConstraints: ${v(study.constraints)}\n${study.pathways.map(item => `### ${v(item.design)}${item.id === study.selectedPathwayId ? ' (working pathway)' : ''}\nQuestion fit: ${v(item.fit)}\nSampling/data: ${v(item.sampling)}\nAnalysis: ${v(item.analysis)}\nLimits: ${v(item.limits)}\nFeasibility/ethics: ${v(item.feasibility)}`).join('\n\n') || '[Not supplied]'}\n\n## Decisions and unresolved work\n${v(study.decisions)}\n`;
}
