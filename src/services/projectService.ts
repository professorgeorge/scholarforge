import type { AcademicPaper } from "../types/citation";
import type { RetainedProjectFile } from './projectFileService';
import { cleanRepositoryValue, recordRepositoryChange, repositoryContentKey, repositoryToolForKey, type RepositoryState } from './projectRepositoryRegistry';

export type ReviewDecision = "pending" | "include" | "exclude" | "uncertain";
export interface ScreeningDecision {
  id: string;
  paperId: string;
  stage: "abstract" | "fulltext";
  reviewer: string;
  decision: ReviewDecision;
  reason: string;
  criteriaVersion: number;
  at: string;
}
export interface SourceDocument {
  id: string;
  paperId: string;
  filename: string;
  text: string;
  importedAt: string;
  pages?: { page: number; text: string }[];
}
export interface EvidenceEntry {
  id: string;
  paperId: string;
  documentId: string;
  quote: string;
  locator: string;
  claimId: string;
  direction: "supports" | "contradicts" | "qualifies" | "context";
  population: string;
  design: string;
  outcome: string;
  estimate: string;
  limitations: string;
  theory: string;
  dataset: string;
  checked: boolean;
  at: string;
}
export interface TrackedClaim {
  id: string;
  text: string;
  history: { text: string; at: string; note: string }[];
  needsReview: boolean;
}
export interface DecisionEntry {
  id: string;
  question: string;
  choice: string;
  alternatives: string;
  rationale: string;
  manuscriptLocation: string;
  at: string;
}
export interface ManuscriptVersion {
  id: string;
  text: string;
  at: string;
  filename?: string;
}
export interface SearchRun {
  id: string;
  query: string;
  at: string;
  mode: string;
  sources: {
    name: string;
    query: string;
    status: string;
    count: number;
    detail?: string;
  }[];
  count: number;
  options: unknown;
}
export interface ReportingResponse {
  location: string;
  note: string;
  status: "missing" | "reported" | "confirmed";
}
export interface ResearchProject {
  schemaVersion: 1;
  id: string;
  name: string;
  question: string;
  discipline: string;
  studyType: string;
  workflow: string;
  createdAt: string;
  updatedAt: string;
  papers: AcademicPaper[];
  protocol: string;
  criteria: string;
  criteriaVersion: number;
  decisions: DecisionEntry[];
  documents: SourceDocument[];
  evidence: EvidenceEntry[];
  claims: TrackedClaim[];
  screening: ScreeningDecision[];
  adjudications: Record<
    string,
    {
      decision: ReviewDecision;
      reason: string;
      at: string;
      criteriaVersion: number;
      voteIds?: string[];
    }
  >;
  versions: ManuscriptVersion[];
  searches: SearchRun[];
  reporting: Record<string, ReportingResponse>;
  tasks: Record<string, boolean>;
  tools: Record<string, unknown>;
  repository?: RepositoryState;
  files?: RetainedProjectFile[];
}

const INDEX = "scholarforge_projects_v1";
const ACTIVE = "scholarforge_active_project_v1";
const PREFIX = "scholarforge_project_v1_";
export const PROJECT_EVENT = "scholarforge_project_updated";
export const id = () => crypto.randomUUID();
export const now = () => new Date().toISOString();
let storageError = "";
let mirrorQueue = Promise.resolve();
const cache = new Map<string, ResearchProject>();
let activeId = "";

function database(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("scholarforge-projects", 1);
    request.onupgradeneeded = () =>
      request.result.createObjectStore("projects", { keyPath: "id" });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () =>
      reject(new Error("Close older ScholarForge tabs to update storage."));
  });
}

async function mirror(project: ResearchProject): Promise<void> {
  const db = await database();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction("projects", "readwrite");
      tx.objectStore("projects").put(project);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}

export function getProjectIds(): string[] {
  try {
    const ids = JSON.parse(localStorage.getItem(INDEX) || "[]");
    return Array.isArray(ids) ? ids.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}
export function getActiveProjectId(): string {
  return activeId || localStorage.getItem(ACTIVE) || "";
}
export function getProject(
  projectId = getActiveProjectId(),
): ResearchProject | null {
  if (cache.has(projectId)) return cache.get(projectId)!;
  try {
    const raw = localStorage.getItem(PREFIX + projectId);
    const p = raw ? validateProject(JSON.parse(raw)) : null;
    if (p) cache.set(projectId, p);
    return p;
  } catch {
    return null;
  }
}
export function getProjects(): ResearchProject[] {
  return [...new Set([...getProjectIds(), ...cache.keys()])]
    .map((projectId) => getProject(projectId))
    .filter((p): p is ResearchProject => p !== null);
}
export function getStorageError(): string {
  return storageError;
}
export function reportProjectStorageError(message: string): void {
  storageError = message;
  window.dispatchEvent(new Event(PROJECT_EVENT));
}
export async function flushProjectWrites(): Promise<void> {
  await mirrorQueue;
}

export function saveProject(project: ResearchProject): void {
  const updated = { ...project, updatedAt: now() };
  cache.set(project.id, updated);
  let browserMirrorSaved = false;
  try {
    localStorage.setItem(PREFIX + project.id, JSON.stringify(updated));
    const ids = getProjectIds();
    if (!ids.includes(project.id))
      localStorage.setItem(INDEX, JSON.stringify([...ids, project.id]));
    browserMirrorSaved = true;
    storageError = "";
  } catch {
    storageError =
      "Browser mirror is full. Saving the project to IndexedDB; keep an external backup.";
  }
  // Serialize durable writes so an older write cannot overwrite a newer version.
  mirrorQueue = mirrorQueue
    .then(() => mirror(updated))
    .then(() => {
      if (!browserMirrorSaved) {
        storageError =
          "Project saved in IndexedDB. The smaller browser mirror is full; download regular backups.";
        window.dispatchEvent(new Event(PROJECT_EVENT));
      }
    })
    .catch(() => {
      storageError = browserMirrorSaved
        ? "Project saved in browser storage; IndexedDB is unavailable. Download a project backup."
        : "Project is in memory only: both storage methods failed. Download a backup before leaving.";
      window.dispatchEvent(new Event(PROJECT_EVENT));
    });
  window.dispatchEvent(new Event(PROJECT_EVENT));
}

export function updateProject(
  change: Partial<ResearchProject> | ((p: ResearchProject) => ResearchProject),
  projectId = getActiveProjectId(),
): ResearchProject {
  const current = getProject(projectId);
  if (!current) throw new Error("No active project.");
  const updated =
    typeof change === "function" ? change(current) : { ...current, ...change };
  saveProject(updated);
  return updated;
}

export function createProject(name: string): ResearchProject {
  const project: ResearchProject = {
    schemaVersion: 1,
    id: id(),
    name: name.trim() || "Untitled project",
    question: "",
    discipline: "Interdisciplinary",
    studyType: "",
    workflow: "literature",
    createdAt: now(),
    updatedAt: now(),
    papers: [],
    protocol: "",
    criteria: "",
    criteriaVersion: 1,
    decisions: [],
    documents: [],
    evidence: [],
    claims: [],
    screening: [],
    adjudications: {},
    versions: [],
    searches: [],
    reporting: {},
    tasks: {},
    tools: {},
  };
  saveProject(project);
  return project;
}

export function selectProject(projectId: string): void {
  if (!getProject(projectId)) throw new Error("Project not found.");
  activeId = projectId;
  try {
    localStorage.setItem(ACTIVE, projectId);
  } catch {
    /* IndexedDB records and in-memory selection remain usable. */
  }
  window.dispatchEvent(new Event(PROJECT_EVENT));
  window.dispatchEvent(new Event("scholarforge_cart_updated"));
  window.dispatchEvent(new Event("scholarforge_binder_updated"));
}

export async function initializeProjects(): Promise<void> {
  // Recover durable records before creating a blank workspace if browser mirrors were lost.
  try {
    const db = await database();
    const durable = await new Promise<ResearchProject[]>((resolve, reject) => {
      const request = db
        .transaction("projects")
        .objectStore("projects")
        .getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    db.close();
    for (const raw of durable) {
      try {
        const project = validateProject(raw);
        const cached = getProject(project.id);
        if (!cached || project.updatedAt > cached.updatedAt) {
          cache.set(project.id, project);
        }
        try {
          if (!getProjectIds().includes(project.id))
            localStorage.setItem(
              INDEX,
              JSON.stringify([...getProjectIds(), project.id]),
            );
        } catch {
          /* The primary IndexedDB record remains available. */
        }
      } catch {
        /* A malformed record must not prevent other projects from opening. */
      }
    }
  } catch {
    storageError =
      "IndexedDB is unavailable. Browser storage remains active; export regular backups.";
  }
  if (!getProjects().length) {
    const project = createProject("My research project");
    // Copy existing work once. Keep legacy originals for recovery.
    for (const key of [
      "scholarforge_active_manuscript",
      "scholarforge_universal_binder",
    ]) {
      try {
        const value = localStorage.getItem(key);
        if (value) project.tools[key] = JSON.parse(value);
      } catch {
        /* Preserve originals. */
      }
    }
    try {
      project.papers = JSON.parse(
        localStorage.getItem("scholarforge_research_cart_v1") || "[]",
      );
    } catch {
      /* Empty legacy cart. */
    }
    saveProject(project);
    selectProject(project.id);
  } else if (!getProject()) selectProject(getProjects()[0].id);
}

export function getToolState<T>(key: string, fallback: T): T {
  return (getProject()?.tools[key] as T | undefined) ?? fallback;
}
export function setToolState(
  key: string,
  value: unknown,
  projectId = getActiveProjectId(),
): void {
  const current = getProject(projectId);
  if (current && JSON.stringify(current.tools[key]) === JSON.stringify(value)) return;
  updateProject(
    (p) => ({ ...p, tools: { ...p.tools, [key]: value }, repository: recordRepositoryChange(p.tools, p.repository, key, value, now()) }),
    projectId,
  );
}

export function checkpointProjectTool(tool: string, projectId = getActiveProjectId()): void {
  const project = getProject(projectId);
  if (!project) return;
  const value = cleanRepositoryValue(Object.fromEntries(Object.entries(project.tools).filter(([key, item]) => repositoryToolForKey(key)?.id === tool && repositoryContentKey(key, item))));
  if (!Object.keys(value).length) return;
  const key = `checkpoint.${tool}`;
  if (project.repository?.history.some(entry => entry.key === key && JSON.stringify(entry.value) === JSON.stringify(value))) return;
  updateProject(current => ({ ...current, repository: { updated: { ...current.repository?.updated, [tool]: now() }, history: [...(current.repository?.history || []), { id: id(), key, tool, at: now(), value }] } }), projectId);
}

export function saveManuscriptVersion(
  text: string,
  filename?: string,
  projectId = getActiveProjectId(),
): void {
  if (!text.trim()) return;
  updateProject((p) => {
    if (p.versions.at(-1)?.text === text) return p;
    return {
      ...p,
      versions: [...p.versions, { id: id(), text, filename, at: now() }],
      claims: p.claims.map((c) => ({ ...c, needsReview: true })),
      reporting: Object.fromEntries(Object.entries(p.reporting).map(([key, response]) => [key, { ...response, status: 'missing' as const }])),
    };
  }, projectId);
}

export function reviseClaim(claim: TrackedClaim, text: string): TrackedClaim {
  if (claim.text === text) return claim;
  const causal = /\b(caus\w*|improv\w*|prevent\w*|lead\w* to|result\w* in)\b/i;
  const broad = /\b(all|always|universally|everyone|generally)\b/i;
  const stronger =
    (!causal.test(claim.text) && causal.test(text)) ||
    (!broad.test(claim.text) && broad.test(text));
  return {
    ...claim,
    text,
    needsReview: true,
    history: [
      ...claim.history,
      {
        text: claim.text,
        at: now(),
        note: stronger
          ? "Wording may strengthen causality or generalization. Reassess supporting evidence."
          : "Wording changed. Reassess evidence applicability.",
      },
    ],
  };
}

export function screeningOutcome(
  project: ResearchProject,
  paperId: string,
  stage: ScreeningDecision["stage"],
): { decision: ReviewDecision | "conflict"; votes: ScreeningDecision[] } {
  const votes = [
    ...new Map(
      project.screening
        .filter(
          (v) =>
            v.paperId === paperId &&
            v.stage === stage &&
            v.criteriaVersion === project.criteriaVersion,
        )
        .map((v) => [v.reviewer, v]),
    ).values(),
  ];
  const adjudicated = project.adjudications[`${paperId}:${stage}`];
  if (
    adjudicated?.criteriaVersion === project.criteriaVersion &&
    (!adjudicated.voteIds ||
      votes.every((v) => adjudicated.voteIds!.includes(v.id)))
  )
    return { decision: adjudicated.decision, votes };
  const decisions = new Set(votes.map((v) => v.decision));
  return {
    decision:
      decisions.size > 1
        ? "conflict"
        : votes.length >= 2
          ? votes[0]?.decision || "pending"
          : "pending",
    votes,
  };
}

export function validateProject(value: unknown): ResearchProject {
  if (!value || typeof value !== "object")
    throw new Error("Invalid project backup.");
  const p = value as ResearchProject;
  if (
    p.schemaVersion !== 1 ||
    typeof p.id !== "string" ||
    !/^[\w-]+$/.test(p.id) ||
    typeof p.name !== "string"
  )
    throw new Error("Unsupported project format.");
  for (const key of [
    "papers",
    "documents",
    "evidence",
    "claims",
    "screening",
    "versions",
    "searches",
    "decisions",
  ] as const) {
    if (
      !Array.isArray(p[key]) ||
      p[key].some((x) => !x || typeof x !== "object")
    )
      throw new Error(`Invalid ${key} in backup.`);
  }
  for (const paper of p.papers)
    if (
      typeof paper.id !== "string" ||
      typeof paper.title !== "string" ||
      !Array.isArray(paper.authors)
    )
      throw new Error("Invalid paper in backup.");
  for (const doc of p.documents)
    if (typeof doc.text !== "string" || typeof doc.id !== "string")
      throw new Error("Invalid document in backup.");
  for (const key of ["tools", "tasks", "reporting", "adjudications"] as const)
    if (!p[key] || typeof p[key] !== "object" || Array.isArray(p[key]))
      throw new Error(`Invalid ${key}.`);
  if (typeof p.criteriaVersion !== "number" || typeof p.updatedAt !== "string")
    throw new Error("Invalid project metadata.");
  if (p.repository && (!Array.isArray(p.repository.history) || !p.repository.updated || typeof p.repository.updated !== 'object' || p.repository.history.some(entry => !entry || typeof entry.id !== 'string' || typeof entry.key !== 'string' || typeof entry.tool !== 'string' || typeof entry.at !== 'string'))) throw new Error('Invalid project repository.');
  if (p.files && (!Array.isArray(p.files) || p.files.some(file => !file || typeof file.id !== 'string' || typeof file.name !== 'string' || typeof file.base64 !== 'string' || (file.base64.length % 4 !== 0 || /[^A-Za-z0-9+/=]/.test(file.base64) || /=[^=]/.test(file.base64) || /={3}/.test(file.base64)) || typeof file.size !== 'number' || typeof file.mime !== 'string' || typeof file.at !== 'string'))) throw new Error('Invalid retained project files.');
  for (const key of [
    "question",
    "discipline",
    "studyType",
    "workflow",
    "protocol",
    "criteria",
    "createdAt",
  ] as const) {
    if (typeof p[key] !== "string")
      throw new Error(`Invalid ${key} in backup.`);
  }
  for (const claim of p.claims) {
    if (
      typeof claim.id !== "string" ||
      typeof claim.text !== "string" ||
      !Array.isArray(claim.history) ||
      typeof claim.needsReview !== "boolean" ||
      claim.history.some(
        (h) => !h || typeof h.text !== "string" || typeof h.note !== "string",
      )
    )
      throw new Error("Invalid claim history in backup.");
  }
  for (const entry of p.evidence) {
    for (const key of [
      "id",
      "paperId",
      "documentId",
      "quote",
      "locator",
      "claimId",
      "direction",
      "population",
      "design",
      "outcome",
      "estimate",
      "limitations",
      "theory",
      "dataset",
      "at",
    ] as const)
      if (typeof entry[key] !== "string")
        throw new Error("Invalid evidence entry in backup.");
    if (typeof entry.checked !== "boolean")
      throw new Error("Invalid evidence review state.");
  }
  for (const version of p.versions)
    if (typeof version.text !== "string" || typeof version.at !== "string")
      throw new Error("Invalid manuscript version.");
  for (const vote of p.screening)
    if (
      typeof vote.reviewer !== "string" ||
      typeof vote.reason !== "string" ||
      !["abstract", "fulltext"].includes(vote.stage) ||
      !["pending", "include", "exclude", "uncertain"].includes(vote.decision)
    )
      throw new Error("Invalid screening decision.");
  return p;
}

export function importProjectBackup(text: string): ResearchProject {
  const raw = JSON.parse(text);
  const original = validateProject(cleanRepositoryValue(raw.project ?? raw));
  // Always import as a copy, never overwrite an existing project or current work.
  const project = {
    ...original,
    id: id(),
    name: `${original.name} (restored)`,
    updatedAt: now(),
  };
  // API keys and provider settings are never part of project backups.
  project.tools = Object.fromEntries(
    Object.entries(project.tools).filter(
      ([key]) => !/llm|api.?key|token|secret|config/i.test(key),
    ),
  );
  saveProject(project);
  return project;
}

export function downloadFile(
  filename: string,
  content: string,
  mime = "text/plain",
): void {
  const url = URL.createObjectURL(new Blob([content], { type: mime }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function exportProjectBackup(project: ResearchProject): string {
  const tools = Object.fromEntries(
    Object.entries(project.tools).filter(
      ([key]) => !/llm|api.?key|token|secret|config/i.test(key),
    ),
  );
  return JSON.stringify(
    {
      format: "ScholarForge project backup",
      version: 1,
      exportedAt: now(),
      project: cleanRepositoryValue({ ...project, tools }),
    },
    null,
    2,
  );
}
