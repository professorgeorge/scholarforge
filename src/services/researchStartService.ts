/** Explicit home-page handoffs keep queries and references out of manuscript memory. */
export type ResearchStartMode = 'concept' | 'topic' | 'manuscript' | 'references';

export interface ResearchStartRequest {
  mode: ResearchStartMode;
  text: string;
  filename?: string;
}

export const RESEARCH_START_OPTIONS: Record<ResearchStartMode, {
  label: string;
  description: string;
  inputLabel: string;
  placeholder: string;
  action: string;
  next: string;
}> = {
  concept: {
    label: 'Develop a research idea', description: 'Start with a situation that needs explaining.',
    inputLabel: 'What is puzzling about this situation?', placeholder: 'Describe what happens, what you expected instead, and why the difference matters.',
    action: 'Open Concept & Theory Studio', next: 'Your narration will be staged for review. Develop alternative framings, examine literature, and compare explanations and study pathways.',
  },
  topic: {
    label: 'Find literature',
    description: 'Start with a topic or research question.',
    inputLabel: 'Your research topic or question',
    placeholder: 'For example: How does remote work affect employee wellbeing?',
    action: 'Open literature search',
    next: 'Your topic will be filled in. Review the search settings, then run your search.',
  },
  manuscript: {
    label: 'Work on a manuscript',
    description: 'Bring a draft into the writing tools.',
    inputLabel: 'Your manuscript or draft section',
    placeholder: 'Paste your draft here, or choose a document below.',
    action: 'Open draft in Manuscript Studio',
    next: 'Your draft becomes the active manuscript for the writing and review tools. Opening it does not generate or revise text.',
  },
  references: {
    label: 'Check references',
    description: 'Review a DOI or a list of citations.',
    inputLabel: 'DOI or reference list',
    placeholder: 'For example: 10.1038/nature12373, or paste one or more complete references.',
    action: 'Open reference audit',
    next: 'Your references will be filled into the audit tool. Review them before starting verification.',
  },
};

export function prepareResearchStart(mode: ResearchStartMode, text: string, filename?: string): ResearchStartRequest {
  const trimmed = text.trim();
  if (!trimmed) throw new Error('Add text or choose a document before continuing.');
  return { mode, text: trimmed, ...(filename ? { filename } : {}) };
}
