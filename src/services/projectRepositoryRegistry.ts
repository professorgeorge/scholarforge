import type { AcademicPillar } from '../components/Navbar';

export interface RepositoryTool { id: Exclude<AcademicPillar, 'hub'>; name: string; prefixes: string[]; outputs: string[] }
export const REPOSITORY_TOOLS: RepositoryTool[] = [
  { id: 'concept', name: 'Concept & Theory Studio', prefixes: ['ConceptStudio.'], outputs: [] },
  { id: 'funding', name: 'Funding Opportunity Finder', prefixes: ['FundingFinder.'], outputs: ['opportunities', 'runs', 'shortlist'] },
  { id: 'literature', name: 'Literature Search', prefixes: ['LiteratureFirstPane.'], outputs: ['discoveredPapers', 'sourceStatuses', 'prismaStats'] },
  { id: 'pico', name: 'PICO Search Strategy', prefixes: ['PicoCompilerTab.'], outputs: [] },
  { id: 'counterevidence', name: 'Counterevidence Finder', prefixes: ['CounterevidencePane.'], outputs: ['papers', 'searches', 'reviews'] },
  { id: 'methodology', name: 'Methodology Compass', prefixes: ['MethodologyCompassPane.'], outputs: ['aiRecommendation'] },
  { id: 'instruments', name: 'Measurement & Instrument Finder', prefixes: ['InstrumentFinderPane.'], outputs: ['papers', 'searches', 'profiles'] },
  { id: 'synthetic', name: 'Synthetic Data Forge', prefixes: ['SyntheticDataForgePane.'], outputs: ['dataset', 'qualitativePackage'] },
  { id: 'irb', name: 'IRB Preparation', prefixes: ['IrbTriagePane.'], outputs: ['outputs'] },
  { id: 'studio', name: 'Manuscript Studio', prefixes: ['ResearchStudioPane.', 'ScholarLaunchpad.', 'ResultPane.', 'App.rebuttalPackage', 'App.originalPreRevisionText', 'scholarforge_active_manuscript'], outputs: ['discoveredPapers', 'discoveredPapersForExport', 'discoveredSecondaryData', 'rebuttalPackage', 'coverLetter'] },
  { id: 'claims', name: 'Claims Workbench', prefixes: ['ClaimsWorkbenchPane.', 'App.claims'], outputs: ['testedClaims', 'consensusAnalysisMap', 'counterEvidenceMap'] },
  { id: 'applications', name: 'Research Applications Studio', prefixes: ['ApplicationsPane.'], outputs: [] },
  { id: 'writing', name: 'Writing Utilities', prefixes: ['WritingToolbeltPane.'], outputs: ['outputs'] },
  { id: 'verify', name: 'Reference Audit', prefixes: ['VerifierPane.'], outputs: ['report', 'forensicMap'] },
  { id: 'journal', name: 'Journal Fit & Submission', prefixes: ['JournalSentinelPane.'], outputs: ['journals', 'auditReport', 'aiReport', 'coverLetter'] },
  { id: 'anonymizer', name: 'Double-Blind Anonymizer', prefixes: ['AnonymizerPane.'], outputs: ['output'] },
  { id: 'scholars', name: 'Scholar & Reviewer Finder', prefixes: ['ScholarSearchPane.', 'ScholarImpactTab.', 'OutreachModal.'], outputs: ['candidates', 'impactProfile', 'drafts'] },
];
const uiOnly = /\.(?:step|currentQuestionIdx|selectedClaimIndex|hasSearched|wasExtracted|detectedReferenceCount|sources|enabledSources\.v2|searchScope|sourceStatuses|selectedPresetId|selectedGuide|readingMode|activeTab|mainTab|tablePage|filters|selectedLens|selectedJournalTier|contextVersion)$/;
export function repositoryToolForKey(key: string): RepositoryTool | undefined {
  return REPOSITORY_TOOLS.find(tool => tool.prefixes.some(prefix => key.startsWith(prefix)) || key.startsWith(`ToolAiAssistant.${tool.id}.`));
}
export function meaningfulRepositoryValue(value: unknown): boolean {
  if (typeof value === 'string') return !!value.trim();
  if (typeof value === 'number') return Number.isFinite(value);
  if (typeof value === 'boolean') return value;
  if (Array.isArray(value)) return value.some(meaningfulRepositoryValue);
  if (value && typeof value === 'object') return Object.values(value).some(meaningfulRepositoryValue);
  return false;
}
export function repositoryContentKey(key: string, value: unknown): boolean {
  if (/\.sourceText$/.test(key)) return false;
  if (!repositoryToolForKey(key) || uiOnly.test(key)) return false;
  if (key === 'ConceptStudio.study') {
    const study = value as Record<string, unknown> | null;
    return !!study && ['narrative', 'observed', 'expected', 'question', 'gap', 'frames', 'constructs', 'explanation', 'pathways', 'decisions'].some(field => meaningfulRepositoryValue(study[field]));
  }
  return meaningfulRepositoryValue(value);
}
export function repositoryOutputKey(key: string): boolean {
  const tool = repositoryToolForKey(key);
  return !!tool && (key.startsWith('ToolAiAssistant.') || tool.outputs.some(output => key.endsWith(`.${output}`)));
}
/** Research data and generation parameters are retained; provider secrets and internal comparison stamps are omitted. */
export function cleanRepositoryValue(value: unknown): any {
  if (Array.isArray(value)) return value.map(cleanRepositoryValue);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).filter(([key]) => !/^(?:api[_-]?key|password|authorization|secret|access[_-]?token|refresh[_-]?token|cookie|contextVersion)$|(?:llm|provider)[_-]?config/i.test(key)).map(([key, item]) => [key, cleanRepositoryValue(item)]));
  return value;
}
export interface RepositorySnapshot { id: string; key: string; tool: string; at: string; value: unknown; context?: Record<string, unknown> }
export interface RepositoryState { updated: Record<string, string>; history: RepositorySnapshot[] }
export function recordRepositoryChange(tools: Record<string, unknown>, repository: RepositoryState | undefined, key: string, value: unknown, at: string): RepositoryState | undefined {
  const tool = repositoryToolForKey(key);
  if (!tool || JSON.stringify(tools[key]) === JSON.stringify(value)) return repository;
  const meaningful = repositoryContentKey(key, value);
  if (!meaningful && !repositoryContentKey(key, tools[key])) return repository;
  const next: RepositoryState = { updated: { ...repository?.updated, [tool.id]: at }, history: [...(repository?.history || [])] };
  if (repositoryOutputKey(key) || !meaningful) {
    const retain = (entry: unknown, timestamp: string, context?: Record<string, unknown>) => {
      if (!meaningfulRepositoryValue(entry)) return;
      const cleaned = cleanRepositoryValue(entry);
      if (next.history.some(snapshot => snapshot.key === key && JSON.stringify(snapshot.value) === JSON.stringify(cleaned))) return;
      next.history.push({ id: crypto.randomUUID(), key, tool: tool.id, at: timestamp, value: cleaned, context });
    };
    // Existing projects gain history without pretending their earlier query context is known.
    retain(tools[key], repository?.updated[tool.id] || '');
    const context = cleanRepositoryValue(Object.fromEntries(Object.entries(tools).filter(([field, item]) => repositoryToolForKey(field)?.id === tool.id && repositoryContentKey(field, item) && !repositoryOutputKey(field))));
    retain(value, at, context);
  }
  return next;
}
