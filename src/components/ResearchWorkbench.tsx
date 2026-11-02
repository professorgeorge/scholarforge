import { FolderOpen, ChevronDown, Download } from "lucide-react";
import { reviewFlow, reviewFlowSvg } from "../services/reviewFlowService";
import { QuestionBuilder } from "./QuestionBuilder";
import { SubmissionRequirements } from "./SubmissionRequirements";
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import type { AcademicPillar } from "./Navbar";
import { useProjectState } from "./useProjectState";
import {
  createProject,
  downloadFile,
  exportProjectBackup,
  getProject,
  getProjects,
  getStorageError,
  id,
  importProjectBackup,
  now,
  PROJECT_EVENT,
  reviseClaim,
  screeningOutcome,
  selectProject,
  updateProject,
  type EvidenceEntry,
  type ResearchProject,
  type ReviewDecision,
  type ScreeningDecision,
} from "../services/projectService";
import { addMultiplePapersToCart } from "../services/cartService";
import { extractTextFromManuscriptFile } from "../services/fileImportService";
import { extractClaimsFromText } from "../services/claimExtractor";
import {
  exportCslJson,
  fetchZoteroLibrary,
  importReferences,
} from "../services/libraryInteropService";
import { generateRIS } from "../services/risExporter";
import { generateBibtexEntry } from "../services/citationFormatter";
import {
  CONTENT_VERSION,
  GUIDANCE,
  REPORTING_GUIDES,
  WORKFLOWS,
} from "../data/researchGuidance";
import {
  planningRScript,
  type PlanningInput,
  type PlanningResult,
} from "../services/planningService";
import {
  searchReviewCorpus,
  type ReviewRegistry,
} from "../services/reviewSearchService";
import { projectBrief, synthesisCsv } from "../services/projectExportService";
import "./ProjectWorkspace.css";
import type { LLMConfig } from "../services/llmService";
import {
  suggestEvidenceExtraction,
  type ExtractionSuggestion,
} from "../services/evidenceExtractionService";

const TABS = [
  "Overview",
  "Search & library",
  "Screening",
  "Evidence",
  "Claims",
  "Methods & planning",
  "Reporting",
  "Decisions & versions",
] as const;
type Tab = (typeof TABS)[number];
function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="sf-field">
      <span>{label}</span>
      {children}
    </label>
  );
}
function Text({
  label,
  value,
  save,
  multiline = false,
}: {
  label: string;
  value: string;
  save: (value: string) => void;
  multiline?: boolean;
}) {
  return (
    <Field label={label}>
      {multiline ? (
        <textarea
          key={value}
          defaultValue={value}
          onBlur={(e) => {
            if (e.target.value !== value) save(e.target.value);
          }}
        />
      ) : (
        <input
          key={value}
          defaultValue={value}
          onBlur={(e) => {
            if (e.target.value !== value) save(e.target.value);
          }}
        />
      )}
    </Field>
  );
}
const read = (form: HTMLFormElement, key: string) =>
  String(new FormData(form).get(key) || "").trim();
const workflowPillars: Record<string, AcademicPillar[]> = {
  proposal: ["concept", "funding", "literature", "methodology", "irb"],
  literature: ["literature", "pico", "claims"],
  analysis: ["methodology", "synthetic"],
  manuscript: ["studio", "claims", "writing"],
  submission: ["journal", "verify", "anonymizer"],
  revision: ["studio", "verify"],
};

export function ResearchWorkbench({
  navigate,
  restoreManuscript,
  llmConfig,
  onClose,
}: {
  navigate: (pillar: AcademicPillar) => void;
  restoreManuscript: (text: string, filename?: string) => void;
  llmConfig: LLMConfig;
  onClose: () => void;
}) {
  const [project, setProject] = useState(() => getProject()!);
  const [open, setOpen] = useState(true);
  const [tab, setTab] = useProjectState<Tab>("workspace.tab", "Overview");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [docId, setDocId] = useState("");
  const [quote, setQuote] = useState("");
  const [locator, setLocator] = useState("");
  const [suggestions, setSuggestions] = useState<ExtractionSuggestion[]>([]);
  const [extractionDraft, setExtractionDraft] =
    useState<ExtractionSuggestion | null>(null);
  const [stage, setStage] = useState<"abstract" | "fulltext">("abstract");
  const [reviewer, setReviewer] = useProjectState(
    "workspace.reviewer",
    "Reviewer 1",
  );
  const [guide, setGuide] = useProjectState("workspace.guide", "prisma");
  const [planning, setPlanning] = useProjectState<PlanningResult | null>(
    "workspace.planning",
    null,
  );
  const [planningHistory, setPlanningHistory] = useProjectState<PlanningResult[]>('workspace.planningHistory', []);
  const [searchResults, setSearchResults] = useProjectState<
    import("../types/citation").AcademicPaper[]
  >("workspace.searchResults", []);
  const worker = useRef<Worker | null>(null);
  const abort = useRef<AbortController | null>(null);
  useEffect(() => {
    const refresh = () => {
      const p = getProject();
      if (p) setProject(p);
    };
    window.addEventListener(PROJECT_EVENT, refresh);
    return () => {
      window.removeEventListener(PROJECT_EVENT, refresh);
      abort.current?.abort();
      worker.current?.terminate();
    };
  }, []);
  function change(updates: Partial<ResearchProject>) {
    try {
      updateProject(current => {
        const amended = (['question', 'protocol', 'criteria'] as const).filter(key => updates[key] !== undefined && updates[key] !== current[key]);
        const decisions = amended.map(key => ({ id: id(), question: `${key === 'question' ? 'Research question' : key === 'criteria' ? 'Eligibility criteria' : 'Protocol'} amendment`, choice: updates[key] || '(cleared)', alternatives: current[key] || '(previously empty)', rationale: 'Author edited this project field. A substantive amendment rationale has not yet been recorded.', manuscriptLocation: '', at: now() }));
        return { ...current, ...updates, decisions: [...(updates.decisions || current.decisions), ...decisions], ...(amended.includes('question') ? { tools: { ...current.tools, ...updates.tools, 'workspace.criteriaNeedsReview': true } } : {}), ...(amended.includes('criteria') ? { tools: { ...current.tools, ...updates.tools, 'workspace.criteriaNeedsReview': false } } : {}) };
      });
    } catch (error) {
      setNotice(String(error));
    }
  }
  async function action(fn: () => void | Promise<void>) {
    setBusy(true);
    setNotice("");
    try {
      await fn();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Action failed.");
    } finally {
      setBusy(false);
    }
  }
  const selectedDoc =
    project.documents.find((d) => d.id === docId) || project.documents[0];
  const workflow =
    WORKFLOWS.find((w) => w.id === project.workflow) || WORKFLOWS[1];
  const reportingGuide =
    REPORTING_GUIDES.find((g) => g.id === guide) || REPORTING_GUIDES[0];
  const unresolved = project.claims.filter((c) => c.needsReview).length;
  const staleVotes = project.screening.filter(
    (v) => v.criteriaVersion !== project.criteriaVersion,
  ).length;
  const conflicts = project.papers.filter(
    (p) => screeningOutcome(project, p.id, stage).decision === "conflict",
  ).length;
  const saveEvidence = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!selectedDoc || !quote.trim() || !locator.trim()) {
      setNotice(
        "Choose a source, select or paste its passage, and provide a location.",
      );
      return;
    }
    const normalized = (s: string) => s.replace(/\s+/g, " ").trim();
    if (!normalized(selectedDoc.text).includes(normalized(quote))) {
      setNotice(
        "The quotation does not match the imported source text. Check it before saving.",
      );
      return;
    }
    const checked = new FormData(form).get("checked") === "on";
    const entry: EvidenceEntry = {
      id: id(),
      paperId: selectedDoc.paperId,
      documentId: selectedDoc.id,
      quote: quote.trim(),
      locator,
      claimId: read(form, "claimId"),
      direction: read(form, "direction") as EvidenceEntry["direction"],
      population: read(form, "population"),
      design: read(form, "design"),
      outcome: read(form, "outcome"),
      estimate: read(form, "estimate"),
      limitations: read(form, "limitations"),
      theory: read(form, "theory"),
      dataset: read(form, "dataset"),
      checked,
      at: now(),
    };
    change({ evidence: [...project.evidence, entry] });
    setExtractionDraft(null);
    setQuote("");
    setNotice("Evidence saved with its source passage and location.");
    form.reset();
  };

  return (
    <section className="sf-workspace" aria-label="Research project workspace">
      <div className="sf-project-bar">
        <div className="sf-project-identity">
          <FolderOpen aria-hidden="true" />
          <span className="sf-project-label">Research workbench</span>
          <strong title={project.name}>{project.name}</strong>
        </div>
        <button
          type="button"
          className="sf-project-toggle"
          aria-expanded={open}
          aria-controls="research-project-details"
          onClick={() => setOpen(!open)}
        >
          <span>Research activities</span>
          <ChevronDown aria-hidden="true" className={open ? "sf-chevron-open" : undefined} />
        </button>
      </div>
      <button type="button" className="sf-secondary" onClick={onClose}>Back to project repository</button>
      {getStorageError() && (
        <p role="alert" className="sf-alert">
          {getStorageError()}
        </p>
      )}
      {notice && (
        <p role="status" className="sf-notice">
          {notice}
          <button
            className="sf-secondary"
            aria-label="Dismiss message"
            onClick={() => setNotice("")}
          >
            ×
          </button>
        </p>
      )}
      {open && (
        <div id="research-project-details" className="sf-workspace-body">
          <div className="sf-project-management">
            <Field label="Current project">
              <select
                aria-label="Current project"
                value={project.id}
                disabled={busy}
                onChange={(event) => selectProject(event.target.value)}
              >
                {getProjects().map((entry) => <option key={entry.id} value={entry.id}>{entry.name}</option>)}
              </select>
            </Field>
            <button
              type="button"
              className="sf-secondary sf-project-backup"
              onClick={() => downloadFile("ScholarForge-project.json", exportProjectBackup(project), "application/json")}
            >
              <Download aria-hidden="true" />
              Download project backup
            </button>
          </div>
          {project.papers.length > 0 || project.evidence.length > 0 || unresolved > 0 ? (
            <p className="sf-project-summary">
              {[
                project.papers.length > 0 ? `${project.papers.length} saved ${project.papers.length === 1 ? 'source' : 'sources'}` : '',
                project.evidence.length > 0 ? `${project.evidence.length} evidence ${project.evidence.length === 1 ? 'entry' : 'entries'}` : '',
                unresolved > 0 ? `${unresolved} ${unresolved === 1 ? 'claim needs' : 'claims need'} review` : '',
              ].filter(Boolean).join(' · ')}
            </p>
          ) : (
            <p className="sf-project-summary">Keep sources, evidence, and research decisions together. Add search results to your research cart to save them in this project.</p>
          )}
          <nav className="sf-tabs" aria-label="Project sections">
            {TABS.map((t) => (
              <button
                key={t}
                aria-current={tab === t ? "page" : undefined}
                onClick={() => setTab(t)}
              >
                {t}
              </button>
            ))}
          </nav>

          {tab === "Overview" && (
            <div className="sf-stack">
              <div>
                <h2>Your research project</h2>
                <p>
                  Plan research, screen sources, enter evidence, and record decisions here. Your work is retained automatically in the project repository.
                  Fields save when you leave them. Quick utilities remain
                  available below.
                </p>
              </div>
              <div className="sf-grid">
                <Text
                  label="Project name"
                  value={project.name}
                  save={(name) => change({ name: name || "Untitled project" })}
                />
                <Text
                  label="Discipline"
                  value={project.discipline}
                  save={(discipline) => change({ discipline })}
                />
                <Text
                  label="Study type"
                  value={project.studyType}
                  save={(studyType) => change({ studyType })}
                />
              </div>
              <Text
                label="Research question and intended contribution"
                multiline
                value={project.question}
                save={(question) =>
                  change({
                    question,
                    claims: project.claims.map((c) => ({
                      ...c,
                      needsReview: true,
                    })),
                    tasks: {},
                  })
                }
              />
              <QuestionBuilder
                apply={(question) =>
                  change({
                    question,
                    tasks: {},
                    claims: project.claims.map((c) => ({
                      ...c,
                      needsReview: true,
                    })),
                  })
                }
              />
              <Field label="What are you trying to accomplish?">
                <select
                  value={project.workflow}
                  onChange={(e) => change({ workflow: e.target.value })}
                >
                  {WORKFLOWS.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.title}
                    </option>
                  ))}
                </select>
              </Field>
              <div className="sf-card">
                <h3>{workflow.title}</h3>
                <p>
                  Progress is your recorded completion, not certification of
                  research quality.
                </p>
                {workflow.steps.map((step, i) => (
                  <label className="sf-check" key={step}>
                    <input
                      type="checkbox"
                      checked={Boolean(project.tasks[`${workflow.id}:${i}`])}
                      onChange={(e) =>
                        change({
                          tasks: {
                            ...project.tasks,
                            [`${workflow.id}:${i}`]: e.target.checked,
                          },
                        })
                      }
                    />
                    {step}
                  </label>
                ))}
                <div className="sf-actions">
                  {workflowPillars[workflow.id].map((pillar) => (
                    <button
                      key={pillar}
                      className="sf-secondary"
                      onClick={() => navigate(pillar)}
                    >
                      Open {pillar}
                    </button>
                  ))}
                </div>
              </div>
              <Text
                label="Protocol and analysis specification (include assumptions, outcomes, measurement, ethics, and planned deviations)"
                multiline
                value={project.protocol}
                save={(protocol) => change({ protocol })}
              />
              <div className="sf-grid">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const name = read(e.currentTarget, "name");
                    void action(() => {
                      const p = createProject(name);
                      selectProject(p.id);
                    });
                  }}
                >
                  <Field label="Create another project">
                    <input name="name" required placeholder="Project name" />
                  </Field>
                  <button disabled={busy}>Create project</button>
                </form>
                <Field label="Restore project backup as a new copy">
                  <input
                    type="file"
                    accept=".json"
                    disabled={busy}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file)
                        void action(async () => {
                          if (file.size > 80 * 1024 * 1024)
                            throw new Error("Backup exceeds 80 MB.");
                          const p = importProjectBackup(await file.text());
                          selectProject(p.id);
                        });
                      e.target.value = "";
                    }}
                  />
                </Field>
              </div>
              <div className="sf-actions">
                <button
                  onClick={() =>
                    downloadFile(
                      "Research-brief.md",
                      projectBrief(project),
                      "text/markdown",
                    )
                  }
                >
                  Export research brief
                </button>
                <button
                  className="sf-secondary"
                  onClick={() =>
                    void action(async () => {
                      if (navigator.storage?.persist)
                        setNotice(
                          (await navigator.storage.persist())
                            ? "Persistent browser storage granted. Keep external backups too."
                            : "Browser did not grant persistent storage. Keep external backups.",
                        );
                    })
                  }
                >
                  Request persistent browser storage
                </button>
              </div>
              <p>
                Projects are stored on this browser with an IndexedDB copy.
                Backups contain documents and research notes; protect them
                accordingly. Provider keys are excluded. There is no server
                account or automatic cross-device synchronization.
              </p>
            </div>
          )}

          {tab === "Search & library" && (
            <div className="sf-stack">
              <h2>Reproducible search and your source library</h2>
              <p>
                Use the Literature Search utility for rapid discovery. This
                review search uses explicit queries, paginated retrieval, and a
                saved request log. Registry syntax differs: Crossref is keyword
                search, not a Boolean database. A bounded search is not an
                exhaustive review.
              </p>
              <form
                className="sf-card sf-stack"
                onSubmit={(e) => {
                  e.preventDefault();
                  const form = e.currentTarget;
                  const query = read(form, "query");
                  const sources = new FormData(form).getAll(
                    "source",
                  ) as ReviewRegistry[];
                  void action(async () => {
                    abort.current = new AbortController();
                    const result = await searchReviewCorpus(
                      {
                        query,
                        sources,
                        pagesPerSource: Number(read(form, "pages")),
                        fromYear: Number(read(form, "from")) || undefined,
                        toYear: Number(read(form, "to")) || undefined,
                      },
                      abort.current.signal,
                    );
                    setSearchResults(result.papers);
                    setNotice(
                      `${result.papers.length} distinct records retrieved. Inspect the saved log for truncation and source failures.`,
                    );
                  });
                }}
              >
                <Field label="Query (saved exactly with submitted requests)">
                  <input
                    name="query"
                    required
                    defaultValue={project.question}
                  />
                </Field>
                <div className="sf-actions">
                  {(["openalex", "crossref", "europepmc"] as const).map(
                    (source) => (
                      <label className="sf-check" key={source}>
                        <input
                          name="source"
                          type="checkbox"
                          value={source}
                          defaultChecked
                        />
                        {source}
                      </label>
                    ),
                  )}
                </div>
                <div className="sf-grid">
                  <Field label="Pages per source (100 records/page)">
                    <input
                      name="pages"
                      type="number"
                      min="1"
                      max="20"
                      defaultValue="2"
                      required
                    />
                  </Field>
                  <Field label="From year">
                    <input name="from" type="number" min="1000" max="2200" />
                  </Field>
                  <Field label="Through year">
                    <input name="to" type="number" min="1000" max="2200" />
                  </Field>
                </div>
                <div className="sf-actions">
                  <button disabled={busy}>Run logged review search</button>
                  {busy && (
                    <button
                      type="button"
                      className="sf-secondary"
                      onClick={() => abort.current?.abort()}
                    >
                      Cancel search
                    </button>
                  )}
                </div>
              </form>
              {searchResults.length > 0 && (
                <div className="sf-card">
                  <h3>{searchResults.length} retrieved records</h3>
                  <button
                    onClick={() => {
                      const count = addMultiplePapersToCart(searchResults);
                      setNotice(`${count} sources added to this project.`);
                    }}
                  >
                    Add retrieved records to project
                  </button>
                  <div className="sf-scroll">
                    <ul>
                      {searchResults.map((p) => (
                        <li key={p.id}>
                          {p.title} ({p.year || "year unknown"}) · {p.source}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
              <div className="sf-grid">
                <Field label="Import RIS, expanded BibTeX, CSL-JSON, or Zotero JSON">
                  <input
                    type="file"
                    accept=".ris,.bib,.json"
                    disabled={busy}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file)
                        void action(async () => {
                          const format = file.name.endsWith(".ris")
                            ? "ris"
                            : file.name.endsWith(".bib")
                              ? "bib"
                              : "json";
                          const count = addMultiplePapersToCart(
                            importReferences(await file.text(), format),
                          );
                          setNotice(
                            `${count} new sources imported. Review metadata before citing.`,
                          );
                        });
                      e.target.value = "";
                    }}
                  />
                </Field>
                <div className="sf-actions">
                  <button
                    onClick={() =>
                      downloadFile(
                        "References.ris",
                        generateRIS(project.papers),
                      )
                    }
                  >
                    Export RIS
                  </button>
                  <button
                    onClick={() =>
                      downloadFile(
                        "References.bib",
                        project.papers.map(generateBibtexEntry).join("\n\n"),
                      )
                    }
                  >
                    Export BibTeX
                  </button>
                  <button
                    onClick={() =>
                      downloadFile(
                        "References.csl.json",
                        exportCslJson(project.papers),
                        "application/json",
                      )
                    }
                  >
                    Export CSL-JSON
                  </button>
                </div>
              </div>
              <details className="sf-card">
                <summary>Import from Zotero (read only)</summary>
                <p>
                  Read bibliographic records from a user or group library. The
                  key is used for this request and is never saved. Attachments
                  and notes are preserved through project full-text import, not
                  downloaded by this connector.
                </p>
                <form
                  className="sf-grid"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const form = e.currentTarget;
                    void action(async () => {
                      abort.current = new AbortController();
                      const papers = await fetchZoteroLibrary(
                        read(form, "library"),
                        read(form, "kind") as "users" | "groups",
                        read(form, "key"),
                        abort.current.signal,
                      );
                      const count = addMultiplePapersToCart(papers);
                      form.reset();
                      setNotice(`${count} Zotero sources imported.`);
                    });
                  }}
                >
                  <Field label="Library kind">
                    <select name="kind">
                      <option value="users">User</option>
                      <option value="groups">Group</option>
                    </select>
                  </Field>
                  <Field label="Numeric library ID">
                    <input name="library" required pattern="[0-9]+" />
                  </Field>
                  <Field label="Read-access API key (optional for public libraries)">
                    <input name="key" type="password" autoComplete="off" />
                  </Field>
                  <button disabled={busy}>Import library</button>
                </form>
              </details>
              <details className="sf-card">
                <summary>Add a source manually</summary>
                <form
                  className="sf-stack"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const form = e.currentTarget;
                    const title = read(form, "title");
                    const count = addMultiplePapersToCart([
                      {
                        id: id(),
                        title,
                        authors: read(form, "authors")
                          .split(";")
                          .filter(Boolean)
                          .map((name) => ({ name })),
                        year: Number(read(form, "year")) || 0,
                        doi: read(form, "doi"),
                        venue: read(form, "venue"),
                        abstract: read(form, "abstract"),
                        citationCount: 0,
                        openAccess: false,
                        source: "manual",
                        url: "",
                      },
                    ]);
                    form.reset();
                    setNotice(`${count} source added.`);
                  }}
                >
                  <Field label="Title">
                    <input name="title" required />
                  </Field>
                  <Field label="Authors (semicolon separated)">
                    <input name="authors" />
                  </Field>
                  <div className="sf-grid">
                    <Field label="Year">
                      <input name="year" type="number" min="1000" max="2200" />
                    </Field>
                    <Field label="DOI">
                      <input name="doi" />
                    </Field>
                    <Field label="Venue">
                      <input name="venue" />
                    </Field>
                  </div>
                  <Field label="Abstract">
                    <textarea name="abstract" />
                  </Field>
                  <button>Add source</button>
                </form>
              </details>
              <h3>Project sources ({project.papers.length})</h3>
              <div className="sf-scroll">
                {project.papers.map((p) => (
                  <details className="sf-card" key={p.id}>
                    <summary>
                      {p.title} ({p.year || "unknown year"})
                    </summary>
                    <p>{p.abstract || "No abstract available."}</p>
                    <p>
                      DOI: {p.doi || "not recorded"} · Source: {p.source} ·{" "}
                      {
                        project.documents.filter((d) => d.paperId === p.id)
                          .length
                      }{" "}
                      imported documents
                    </p>
                  </details>
                ))}
              </div>
              <h3>Saved searches ({project.searches.length})</h3>
              {project.searches
                .slice()
                .reverse()
                .map((s) => (
                  <details className="sf-card" key={s.id}>
                    <summary>
                      {s.at} · {s.query} · {s.count} distinct records
                    </summary>
                    <p>{s.mode}</p>
                    {s.sources.map((source, i) => (
                      <div key={i}>
                        <strong>
                          {source.name}: {source.status}; {source.count} records
                        </strong>
                        <p>{source.detail}</p>
                        <pre>{source.query}</pre>
                      </div>
                    ))}
                  </details>
                ))}
            </div>
          )}

          {tab === "Screening" && (
            <div className="sf-stack">
              <h2>Screening and disagreements</h2>
              {project.tools['workspace.criteriaNeedsReview'] === true && <p className="sf-alert">The research question changed. Recheck eligibility criteria before continuing screening.</p>}
              <p>
                Record individual decisions before comparing reviewers. Local
                reviewer labels organize votes; they are not authenticated
                identities. Export and merge a ledger to exchange decisions with
                collaborators.
              </p>
              <Text
                label={`Eligibility criteria (version ${project.criteriaVersion}; editing starts a new version)`}
                multiline
                value={project.criteria}
                save={(criteria) =>
                  change({
                    criteria,
                    criteriaVersion: project.criteriaVersion + 1,
                    tasks: {},
                    claims: project.claims.map((c) => ({
                      ...c,
                      needsReview: true,
                    })),
                  })
                }
              />
              {staleVotes > 0 && (
                <p className="sf-alert">
                  {staleVotes} historical decisions use earlier criteria. They
                  are retained but do not count toward the current outcome.
                </p>
              )}
              <div className="sf-grid">
                <Field label="Current reviewer">
                  <input
                    value={reviewer}
                    onChange={(e) => setReviewer(e.target.value)}
                  />
                </Field>
                <Field label="Screening stage">
                  <select
                    value={stage}
                    onChange={(e) => setStage(e.target.value as typeof stage)}
                  >
                    <option value="abstract">Title and abstract</option>
                    <option value="fulltext">Full text</option>
                  </select>
                </Field>
              </div>
              <p>
                {conflicts} unresolved disagreements in this stage. Outcomes
                remain provisional until a second reviewer agrees or an
                adjudicator records a reason.
              </p>
              {!project.criteria.trim() && (
                <p className="sf-alert">
                  Record eligibility criteria before screening.
                </p>
              )}
              <div className="sf-scroll">
                {project.papers.map((paper) => {
                  const outcome = screeningOutcome(project, paper.id, stage);
                  const own = outcome.votes.find(
                    (v) => v.reviewer === reviewer.trim(),
                  );
                  return (
                    <article
                      className="sf-card"
                      key={`${paper.id}:${stage}:${reviewer}:${project.criteriaVersion}`}
                    >
                      <h3>{paper.title}</h3>
                      <p>
                        {paper.abstract ||
                          "Abstract unavailable. Obtain the source before making a decision."}
                      </p>
                      <p>
                        Outcome: <strong>{outcome.decision}</strong> ·{" "}
                        {outcome.votes.length} current votes
                      </p>
                      <form
                        className="sf-grid"
                        onSubmit={(e) => {
                          e.preventDefault();
                          const form = e.currentTarget;
                          if (!reviewer.trim()) {
                            setNotice("Enter a reviewer label.");
                            return;
                          }
                          if (!project.criteria.trim()) {
                            setNotice("Record eligibility criteria first.");
                            return;
                          }
                          const decision = read(
                            form,
                            "decision",
                          ) as ReviewDecision;
                          const reason = read(form, "reason");
                          if (decision === "exclude" && !reason) {
                            setNotice("Exclusions require a reason.");
                            return;
                          }
                          change({
                            screening: [
                              ...project.screening,
                              {
                                id: id(),
                                paperId: paper.id,
                                reviewer: reviewer.trim(),
                                stage,
                                decision,
                                reason,
                                criteriaVersion: project.criteriaVersion,
                                at: now(),
                              },
                            ],
                          });
                        }}
                      >
                        <Field label="Your decision">
                          <select
                            name="decision"
                            defaultValue={own?.decision || "uncertain"}
                          >
                            <option value="include">Include</option>
                            <option value="exclude">Exclude</option>
                            <option value="uncertain">Uncertain</option>
                          </select>
                        </Field>
                        <Field label="Reason (required for exclusion)">
                          <input name="reason" defaultValue={own?.reason} />
                        </Field>
                        <button>Save individual decision</button>
                      </form>
                      {own && (
                        <details>
                          <summary>Compare recorded decisions</summary>
                          {outcome.votes.map((v) => (
                            <p key={v.id}>
                              {v.reviewer}: {v.decision} ·{" "}
                              {v.reason || "No note"}
                            </p>
                          ))}
                        </details>
                      )}
                      {outcome.decision === "conflict" && own && (
                        <form
                          className="sf-grid"
                          onSubmit={(e) => {
                            e.preventDefault();
                            const form = e.currentTarget;
                            change({
                              adjudications: {
                                ...project.adjudications,
                                [`${paper.id}:${stage}`]: {
                                  decision: read(
                                    form,
                                    "decision",
                                  ) as ReviewDecision,
                                  reason: read(form, "reason"),
                                  at: now(),
                                  criteriaVersion: project.criteriaVersion,
                                  voteIds: outcome.votes.map((v) => v.id),
                                },
                              },
                            });
                          }}
                        >
                          <Field label="Adjudicated decision">
                            <select name="decision">
                              <option value="include">Include</option>
                              <option value="exclude">Exclude</option>
                              <option value="uncertain">Uncertain</option>
                            </select>
                          </Field>
                          <Field label="Adjudication rationale">
                            <input name="reason" required />
                          </Field>
                          <button>Resolve disagreement</button>
                        </form>
                      )}
                    </article>
                  );
                })}
              </div>
              <div className="sf-card">
                <h3>Recorded screening flow</h3>
                <p>{JSON.stringify(reviewFlow(project))}</p>
                <button
                  onClick={() =>
                    downloadFile(
                      "Review-flow.svg",
                      reviewFlowSvg(project),
                      "image/svg+xml",
                    )
                  }
                >
                  Export recorded screening flow
                </button>
              </div>
              <div className="sf-actions">
                <button
                  onClick={() =>
                    downloadFile(
                      "Screening-ledger.json",
                      JSON.stringify(
                        {
                          projectId: project.id,
                          criteria: project.criteria,
                          criteriaVersion: project.criteriaVersion,
                          screening: project.screening,
                        },
                        null,
                        2,
                      ),
                      "application/json",
                    )
                  }
                >
                  Export screening ledger
                </button>
                <Field label="Merge screening ledger">
                  <input
                    type="file"
                    accept=".json"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file)
                        void action(async () => {
                          const raw = JSON.parse(await file.text());
                          if (
                            raw.criteria !== project.criteria ||
                            raw.criteriaVersion !== project.criteriaVersion ||
                            !Array.isArray(raw.screening)
                          )
                            throw new Error(
                              "Ledger criteria do not match this project.",
                            );
                          const votes = raw.screening as ScreeningDecision[];
                          if (
                            votes.some(
                              (v) =>
                                !project.papers.some(
                                  (p) => p.id === v.paperId,
                                ) ||
                                !["abstract", "fulltext"].includes(v.stage) ||
                                ![
                                  "include",
                                  "exclude",
                                  "uncertain",
                                  "pending",
                                ].includes(v.decision) ||
                                typeof v.reviewer !== "string" ||
                                typeof v.reason !== "string" ||
                                v.criteriaVersion !== project.criteriaVersion,
                            )
                          )
                            throw new Error(
                              "Ledger contains invalid or unrelated decisions.",
                            );
                          const ids = new Set(
                            project.screening.map((v) => v.id),
                          );
                          change({
                            screening: [
                              ...project.screening,
                              ...votes.filter((v) => !ids.has(v.id)),
                            ],
                          });
                          setNotice(
                            "Screening decisions merged; review disagreements.",
                          );
                        });
                      e.target.value = "";
                    }}
                  />
                </Field>
              </div>
            </div>
          )}

          {tab === "Evidence" && (
            <div className="sf-stack">
              <h2>Evidence with inspectable source passages</h2>
              <p>
                Import a source you have access to. Select a passage in the
                source text to prepare an evidence entry. Extraction and
                interpretation remain researcher decisions.
              </p>
              <form
                className="sf-grid"
                onSubmit={(e) => {
                  e.preventDefault();
                  const form = e.currentTarget;
                  const paperId = read(form, "paper");
                  const file = (
                    form.elements.namedItem("file") as HTMLInputElement
                  ).files?.[0];
                  if (file)
                    void action(async () => {
                      const result = await extractTextFromManuscriptFile(file);
                      const doc = {
                        id: id(),
                        paperId,
                        filename: result.filename,
                        text: result.text,
                        pages: result.pages,
                        importedAt: now(),
                      };
                      change({ documents: [...project.documents, doc] });
                      setDocId(doc.id);
                      form.reset();
                      setNotice(
                        "Source text imported. PDF page markers are retained; tables and extraction order may require checking.",
                      );
                    });
                }}
              >
                <Field label="Bibliographic source">
                  <select name="paper" required>
                    <option value="">Choose a project source</option>
                    {project.papers.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Full-text file">
                  <input
                    name="file"
                    type="file"
                    accept=".pdf,.docx,.txt,.md,.tex"
                    required
                  />
                </Field>
                <button disabled={busy || !project.papers.length}>
                  Import full text
                </button>
              </form>
              {selectedDoc && (
                <>
                  <Field label="Imported source">
                    <select
                      value={selectedDoc.id}
                      onChange={(e) => {
                        setDocId(e.target.value);
                        setQuote("");
                        setLocator("");
                        setSuggestions([]);
                        setExtractionDraft(null);
                      }}
                    >
                      {project.documents.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.filename} ·{" "}
                          {
                            project.papers.find((p) => p.id === d.paperId)
                              ?.title
                          }
                        </option>
                      ))}
                    </select>
                  </Field>
                  <div className="sf-actions">
                    <button
                      disabled={busy}
                      onClick={() =>
                        void action(async () => {
                          const result = await suggestEvidenceExtraction(
                            selectedDoc,
                            llmConfig,
                          );
                          setSuggestions(result.suggestions);
                          setNotice(
                            `${result.suggestions.length} exact-quote suggestions from the first ${result.analyzedCharacters} characters. Interpretations and locations need review. No suggestions were saved as checked evidence.`,
                          );
                        })
                      }
                    >
                      Suggest findings from source text
                    </button>
                  </div>
                  {suggestions.map((suggestion, i) => (
                    <article className="sf-card" key={i}>
                      <blockquote>{suggestion.quote}</blockquote>
                      <p>
                        {suggestion.locator} · {suggestion.design} ·{" "}
                        {suggestion.outcome}
                      </p>
                      <p>
                        {suggestion.estimate} {suggestion.limitations}
                      </p>
                      <button
                        onClick={() => {
                          setQuote(suggestion.quote);
                          setLocator(suggestion.locator);
                          setExtractionDraft(suggestion);
                        }}
                      >
                        Review this extraction
                      </button>
                    </article>
                  ))}
                  <Field label="Source text (select a quotation)">
                    <textarea
                      className="sf-source-text"
                      readOnly
                      value={selectedDoc.text}
                      onSelect={(e) => {
                        const el = e.currentTarget;
                        if (el.selectionEnd > el.selectionStart) {
                          setQuote(
                            el.value.slice(el.selectionStart, el.selectionEnd),
                          );
                          const page = [
                            ...el.value
                              .slice(0, el.selectionStart)
                              .matchAll(/\[Page (\d+)\]/g),
                          ].at(-1)?.[1];
                          setLocator(page ? `Page ${page}` : "");
                        }
                      }}
                    />
                  </Field>
                  <form
                    key={extractionDraft?.quote || selectedDoc.id}
                    className="sf-card sf-stack"
                    onSubmit={saveEvidence}
                  >
                    <div className="sf-grid">
                      <Field label="Link to claim (optional)">
                        <select name="claimId">
                          <option value="">Context or unlinked evidence</option>
                          {project.claims.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.text}
                            </option>
                          ))}
                        </select>
                      </Field>
                      <Field label="Relationship to the claim">
                        <select name="direction">
                          <option value="context">Context</option>
                          <option value="supports">Supports</option>
                          <option value="contradicts">Contradicts</option>
                          <option value="qualifies">Qualifies</option>
                        </select>
                      </Field>
                    </div>
                    <Field label="Exact source passage">
                      <textarea
                        value={quote}
                        onChange={(e) => setQuote(e.target.value)}
                        required
                      />
                    </Field>
                    <Field label="Page, section, table, or paragraph">
                      <input
                        value={locator}
                        onChange={(e) => setLocator(e.target.value)}
                        required
                      />
                    </Field>
                    <div className="sf-grid">
                      {[
                        ["population", "Population / setting"],
                        ["design", "Study design"],
                        ["outcome", "Outcome / construct"],
                        ["estimate", "Estimate and uncertainty"],
                        ["theory", "Theory / framework"],
                        ["dataset", "Shared dataset or cohort identifier"],
                      ].map(([name, label]) => (
                        <Field key={name} label={label}>
                          <input
                            name={name}
                            defaultValue={
                              extractionDraft?.[
                                name as keyof ExtractionSuggestion
                              ] || ""
                            }
                          />
                        </Field>
                      ))}
                    </div>
                    <Field label="Limitations and appraisal notes">
                      <textarea
                        name="limitations"
                        defaultValue={extractionDraft?.limitations || ""}
                      />
                    </Field>
                    <label className="sf-check">
                      <input type="checkbox" name="checked" />I checked this
                      quotation and location against the source.
                    </label>
                    <button>Save evidence entry</button>
                  </form>
                </>
              )}
              <div className="sf-actions">
                <button
                  onClick={() =>
                    downloadFile(
                      "Evidence-matrix.csv",
                      synthesisCsv(project),
                      "text/csv",
                    )
                  }
                >
                  Export synthesis matrix
                </button>
                <button
                  className="sf-secondary"
                  onClick={() =>
                    downloadFile(
                      "Evidence.json",
                      JSON.stringify(project.evidence, null, 2),
                      "application/json",
                    )
                  }
                >
                  Export evidence JSON
                </button>
              </div>
              <div className="sf-table-scroll">
                <table>
                  <caption>Literature synthesis matrix</caption>
                  <thead>
                    <tr>
                      {[
                        "Source / passage",
                        "Interpretation",
                        "Study context",
                        "Limits / dependence",
                      ].map((x) => (
                        <th key={x}>{x}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {project.evidence.map((e) => (
                      <tr key={e.id}>
                        <td>
                          <strong>
                            {
                              project.papers.find((p) => p.id === e.paperId)
                                ?.title
                            }
                          </strong>
                          <blockquote>{e.quote}</blockquote>
                          {e.locator} ·{" "}
                          {e.checked ? "Quotation checked" : "Unchecked"}
                        </td>
                        <td>
                          {e.direction}
                          <p>
                            {project.claims.find((c) => c.id === e.claimId)
                              ?.text || "Unlinked context"}
                          </p>
                          {e.estimate}
                        </td>
                        <td>
                          {e.theory}
                          <p>{e.population}</p>
                          {e.design}
                          <p>{e.outcome}</p>
                        </td>
                        <td>
                          {e.limitations || "No appraisal recorded"}
                          <p>Dataset/cohort: {e.dataset || "Not recorded"}</p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="sf-card">
                <h3>Evidence dependence</h3>
                <p>
                  Shared identifiers are entered by researchers. Absence of a
                  link does not establish study independence.
                </p>
                {[
                  ...new Set(
                    project.evidence.map((e) => e.dataset).filter(Boolean),
                  ),
                ].map((dataset) => {
                  const sources = [
                    ...new Set(
                      project.evidence
                        .filter((e) => e.dataset === dataset)
                        .map((e) => e.paperId),
                    ),
                  ];
                  return (
                    <p key={dataset}>
                      <strong>{dataset}</strong>: {sources.length} publications
                      ·{" "}
                      {sources
                        .map(
                          (source) =>
                            project.papers.find((p) => p.id === source)?.title,
                        )
                        .join("; ")}
                      {sources.length > 1
                        ? " — potentially dependent evidence; do not count as independent replications."
                        : ""}
                    </p>
                  );
                })}
              </div>
            </div>
          )}

          {tab === "Claims" && (
            <div className="sf-stack">
              <h2>Claim history and evidence review</h2>
              <p>
                Changing wording flags the claim for review. Causal and broader
                wording receive an additional prompt. This is a language
                heuristic; a researcher must assess the inference.
              </p>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const form = e.currentTarget;
                  const text = read(form, "claim");
                  change({
                    claims: [
                      ...project.claims,
                      { id: id(), text, history: [], needsReview: true },
                    ],
                  });
                  form.reset();
                }}
              >
                <Field label="Add a claim">
                  <textarea name="claim" required />
                </Field>
                <button>Add claim</button>
              </form>
              <button
                className="sf-secondary"
                onClick={() => {
                  const manuscript = project.versions.at(-1)?.text || "";
                  const extracted = extractClaimsFromText(
                    manuscript,
                    "moderate",
                  );
                  const fresh = extracted
                    .filter(
                      (c) =>
                        !project.claims.some(
                          (existing) => existing.text === c.text,
                        ),
                    )
                    .map((c) => ({
                      id: id(),
                      text: c.text,
                      history: [],
                      needsReview: true,
                    }));
                  change({ claims: [...project.claims, ...fresh] });
                  setNotice(
                    `${fresh.length} candidate claims extracted from the latest manuscript. Extraction is heuristic.`,
                  );
                }}
              >
                Extract candidate claims from saved manuscript
              </button>
              {project.claims.map((claim) => (
                <article className="sf-card" key={claim.id}>
                  <Text
                    label="Claim wording"
                    multiline
                    value={claim.text}
                    save={(text) =>
                      change({
                        claims: project.claims.map((c) =>
                          c.id === claim.id ? reviseClaim(c, text) : c,
                        ),
                      })
                    }
                  />
                  <p>
                    {claim.needsReview
                      ? "Needs evidence review"
                      : "Researcher marked reviewed"}{" "}
                    ·{" "}
                    {
                      project.evidence.filter((e) => e.claimId === claim.id)
                        .length
                    }{" "}
                    linked evidence entries
                  </p>
                  {project.evidence
                    .filter((e) => e.claimId === claim.id)
                    .map((e) => (
                      <p key={e.id}>
                        {e.direction} ·{" "}
                        {project.papers.find((p) => p.id === e.paperId)?.title}{" "}
                        · {e.locator} ·{" "}
                        {e.checked ? "quotation checked" : "unchecked"}
                      </p>
                    ))}
                  <button
                    className="sf-secondary"
                    disabled={
                      !project.evidence.some(
                        (e) => e.claimId === claim.id && e.checked,
                      )
                    }
                    onClick={() =>
                      change({
                        claims: project.claims.map((c) =>
                          c.id === claim.id ? { ...c, needsReview: false } : c,
                        ),
                      })
                    }
                  >
                    Mark reviewed against linked evidence
                  </button>
                  <details>
                    <summary>Wording history ({claim.history.length})</summary>
                    {claim.history
                      .slice()
                      .reverse()
                      .map((h, i) => (
                        <p key={i}>
                          {h.at}: “{h.text}” — {h.note}
                        </p>
                      ))}
                  </details>
                </article>
              ))}
            </div>
          )}

          {tab === "Methods & planning" && (
            <div className="sf-stack">
              <h2>Methods, alternatives, and sensitivity planning</h2>
              <p>
                Guidance edition {CONTENT_VERSION}. Curated starter guidance;
                external sources provide the full standards. Philosophical
                mappings are prompts for a defensible position, not proof of
                validity.
              </p>
              {GUIDANCE.map((g) => (
                <details className="sf-card" key={g.id}>
                  <summary>{g.title}</summary>
                  <dl>
                    <dt>When it helps</dt>
                    <dd>{g.use}</dd>
                    <dt>Assumptions</dt>
                    <dd>{g.assumptions}</dd>
                    <dt>Alternatives</dt>
                    <dd>{g.alternatives}</dd>
                    <dt>Worked example</dt>
                    <dd>{g.example}</dd>
                    <dt>Failure modes</dt>
                    <dd>{g.failure}</dd>
                  </dl>
                  <a href={g.source} target="_blank" rel="noreferrer">
                    {g.sourceTitle}
                  </a>
                </details>
              ))}
              <div className="sf-card sf-stack">
                <h3>Power and sensitivity laboratory</h3>
                <p>
                  Balanced independent normal groups, equal variances, two-sided
                  pooled t test. Reliability attenuates the standardized effect
                  by √reliability. Attrition is MCAR. This model does not
                  represent clustering, mediation, qualitative sampling, or a
                  project-specific design justification.
                </p>
                <form
                  className="sf-stack"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const form = e.currentTarget;
                    const input: PlanningInput = {
                      seed: Number(read(form, "seed")),
                      samplePerGroup: Number(read(form, "n")),
                      effect: Number(read(form, "effect")),
                      reliability: Number(read(form, "reliability")),
                      attrition: Number(read(form, "attrition")) / 100,
                      replications: Number(read(form, "reps")),
                      alpha: Number(read(form, "alpha")),
                    };
                    setBusy(true);
                    setNotice("Running repeated artificial samples…");
                    worker.current?.terminate();
                    const w = new Worker(
                      new URL("../services/planningWorker.ts", import.meta.url),
                      { type: "module" },
                    );
                    worker.current = w;
                    w.onmessage = (event) => {
                      if (event.data.error) setNotice(event.data.error);
                      else {
                        setPlanning(event.data.result);
                        setPlanningHistory(previous => [...previous, event.data.result]);
                        setNotice(
                          "Simulation complete. Inspect the assumptions and Monte Carlo uncertainty.",
                        );
                      }
                      setBusy(false);
                      w.terminate();
                      worker.current = null;
                    };
                    w.onerror = () => {
                      setNotice("Simulation worker failed.");
                      setBusy(false);
                      w.terminate();
                    };
                    w.postMessage(input);
                  }}
                >
                  <div className="sf-grid">
                    {[
                      [
                        "seed",
                        "Reproducibility seed",
                        20261101,
                        0,
                        4294967295,
                        1,
                      ],
                      ["n", "Planned participants per group", 100, 5, 5000, 1],
                      [
                        "effect",
                        "Latent standardized mean difference",
                        0.3,
                        -5,
                        5,
                        0.05,
                      ],
                      [
                        "reliability",
                        "Measurement reliability",
                        0.8,
                        0.01,
                        1,
                        0.01,
                      ],
                      ["attrition", "Attrition (%)", 10, 0, 79, 1],
                      ["reps", "Repeated samples", 500, 50, 2000, 1],
                      ["alpha", "Two-sided alpha", 0.05, 0.001, 0.49, 0.001],
                    ].map(([name, label, value, min, max, step]) => (
                      <Field key={String(name)} label={String(label)}>
                        <input
                          name={String(name)}
                          type="number"
                          defaultValue={Number(value)}
                          min={Number(min)}
                          max={Number(max)}
                          step={Number(step)}
                          required
                        />
                      </Field>
                    ))}
                  </div>
                  <div className="sf-actions">
                    <button disabled={busy}>Run sensitivity simulation</button>
                    {busy && (
                      <button
                        type="button"
                        className="sf-secondary"
                        onClick={() => {
                          worker.current?.terminate();
                          worker.current = null;
                          setBusy(false);
                          setNotice("Simulation cancelled.");
                        }}
                      >
                        Cancel simulation
                      </button>
                    )}
                  </div>
                </form>
                {planningHistory.length > 1 && <div className="sf-table-scroll"><table><caption>Saved sensitivity scenarios</caption><thead><tr>{['N per group', 'Effect', 'Reliability', 'Attrition', 'Seed', 'Rejection rate', '95% Monte Carlo interval'].map(label => <th key={label}>{label}</th>)}</tr></thead><tbody>{planningHistory.map((result, i) => <tr key={i}><td>{result.input.samplePerGroup}</td><td>{result.input.effect}</td><td>{result.input.reliability}</td><td>{(result.input.attrition * 100).toFixed(0)}%</td><td>{result.input.seed}</td><td>{(result.power * 100).toFixed(1)}%</td><td>{(result.interval[0] * 100).toFixed(1)}–{(result.interval[1] * 100).toFixed(1)}%</td></tr>)}</tbody></table><button onClick={() => downloadFile('Sensitivity-scenarios.json', JSON.stringify(planningHistory, null, 2), 'application/json')}>Export scenario comparison</button></div>}
                {planning && (
                  <div role="status">
                    <p>
                      <strong>
                        Estimated rejection rate:{" "}
                        {(planning.power * 100).toFixed(1)}%
                      </strong>{" "}
                      · 95% Monte Carlo interval{" "}
                      {(planning.interval[0] * 100).toFixed(1)}–
                      {(planning.interval[1] * 100).toFixed(1)}%
                    </p>
                    <p>
                      {planning.usable} usable samples; mean retained per group{" "}
                      {planning.meanRetainedPerGroup.toFixed(1)}; mean estimated
                      difference {planning.meanEstimate.toFixed(3)}.
                    </p>
                    <p>
                      At a zero effect this estimates false-positive rate. At a
                      nonzero effect it estimates power under these assumptions.
                    </p>
                    <progress
                      aria-label="Estimated rejection rate"
                      value={planning.power}
                      max={1}
                    />
                    <div className="sf-actions">
                      <button
                        onClick={() =>
                          downloadFile(
                            "Planning-results.json",
                            JSON.stringify(planning, null, 2),
                            "application/json",
                          )
                        }
                      >
                        Export inputs and results
                      </button>
                      <button
                        onClick={() =>
                          downloadFile(
                            "Planning-reference.R",
                            planningRScript(planning.input),
                          )
                        }
                      >
                        Export reference R script
                      </button>
                      <button
                        onClick={() =>
                          downloadFile(
                            "Planning-estimates.csv",
                            "replicate,estimated_difference\n" +
                              planning.estimates
                                .map((x, i) => `${i + 1},${x}`)
                                .join("\n"),
                            "text/csv",
                          )
                        }
                      >
                        Export sample estimates
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {tab === "Reporting" && (
            <div className="sf-stack">
              <h2>Reporting requirements linked to your manuscript</h2>
              <SubmissionRequirements
                manuscript={project.versions.at(-1)?.text || ""}
              />
              <p>
                These are curated navigation prompts, not complete official
                checklists or compliance certification. Consult the current
                guideline and journal instructions. “Reported” records a
                manuscript location; “confirmed” is your explicit confirmation
                of the underlying procedure.
              </p>
              <Field label="Reporting framework">
                <select
                  value={guide}
                  onChange={(e) => setGuide(e.target.value)}
                >
                  {REPORTING_GUIDES.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </Field>
              <p>
                {reportingGuide.scope}{" "}
                <a href={reportingGuide.url} target="_blank" rel="noreferrer">
                  Open official guidance
                </a>
              </p>
              {reportingGuide.items.map((item, i) => {
                const key = `${reportingGuide.id}:${i}`;
                const r = project.reporting[key] || {
                  location: "",
                  note: "",
                  status: "missing" as const,
                };
                return (
                  <article className="sf-card" key={key}>
                    <h3>{item}</h3>
                    <Text
                      label="Manuscript passage / location"
                      multiline
                      value={r.location}
                      save={(location) =>
                        change({
                          reporting: {
                            ...project.reporting,
                            [key]: { ...r, location, status: "reported" },
                          },
                        })
                      }
                    />
                    <Text
                      label="Procedure confirmation or unresolved concern"
                      value={r.note}
                      save={(note) =>
                        change({
                          reporting: {
                            ...project.reporting,
                            [key]: { ...r, note },
                          },
                        })
                      }
                    />
                    <Field label="Researcher assessment">
                      <select
                        value={r.status}
                        onChange={(e) => {
                          if (
                            e.target.value !== "missing" &&
                            !r.location.trim()
                          ) {
                            setNotice("Provide a manuscript location first.");
                            return;
                          }
                          if (
                            e.target.value === "confirmed" &&
                            !r.note.trim()
                          ) {
                            setNotice("Record what procedure you confirmed.");
                            return;
                          }
                          change({
                            reporting: {
                              ...project.reporting,
                              [key]: {
                                ...r,
                                status: e.target.value as typeof r.status,
                              },
                            },
                          });
                        }}
                      >
                        <option value="missing">Missing / needs review</option>
                        <option value="reported">
                          Appears reported at linked location
                        </option>
                        <option value="confirmed">
                          Procedure confirmed by researcher
                        </option>
                      </select>
                    </Field>
                  </article>
                );
              })}
              <button
                onClick={() =>
                  downloadFile(
                    "Reporting-and-project-brief.md",
                    projectBrief(project),
                    "text/markdown",
                  )
                }
              >
                Export reporting record
              </button>
            </div>
          )}

          {tab === "Decisions & versions" && (
            <div className="sf-stack">
              <h2>Research decision record</h2>
              <p>
                Record why you selected a method, changed an outcome, departed
                from a protocol, or accepted or declined a reviewer request.
              </p>
              <form
                className="sf-stack sf-card"
                onSubmit={(e) => {
                  e.preventDefault();
                  const form = e.currentTarget;
                  change({
                    decisions: [
                      ...project.decisions,
                      {
                        id: id(),
                        question: read(form, "question"),
                        choice: read(form, "choice"),
                        alternatives: read(form, "alternatives"),
                        rationale: read(form, "rationale"),
                        manuscriptLocation: read(form, "location"),
                        at: now(),
                      },
                    ],
                  });
                  form.reset();
                }}
              >
                {[
                  ["question", "Question or reviewer comment"],
                  ["choice", "Decision / action"],
                  ["alternatives", "Alternatives considered"],
                  ["rationale", "Rationale and supporting evidence"],
                  ["location", "Manuscript location / response reference"],
                ].map(([name, label]) => (
                  <Field key={name} label={label}>
                    <textarea
                      name={name}
                      required={
                        name === "question" ||
                        name === "choice" ||
                        name === "rationale"
                      }
                    />
                  </Field>
                ))}
                <button>Record decision</button>
              </form>
              {project.decisions
                .slice()
                .reverse()
                .map((d) => (
                  <article className="sf-card" key={d.id}>
                    <h3>{d.question}</h3>
                    <p>{d.at}</p>
                    <p>
                      <strong>Decision:</strong> {d.choice}
                    </p>
                    <p>
                      <strong>Alternatives:</strong>{" "}
                      {d.alternatives || "Not recorded"}
                    </p>
                    <p>
                      <strong>Rationale:</strong> {d.rationale}
                    </p>
                    <p>
                      <strong>Location:</strong> {d.manuscriptLocation}
                    </p>
                  </article>
                ))}
              <h3>Manuscript versions ({project.versions.length})</h3>
              <p>
                Restoring a version creates a new version and flags claim links
                for review.
              </p>
              {project.versions
                .slice()
                .reverse()
                .map((v) => (
                  <details className="sf-card" key={v.id}>
                    <summary>
                      {v.at} · {v.filename || "Manuscript"} ·{" "}
                      {v.text.split(/\s+/).length} words
                    </summary>
                    <pre>{v.text}</pre>
                    <div className="sf-actions">
                      <button
                        onClick={() => {
                          restoreManuscript(v.text, v.filename);
                          setNotice(
                            "Manuscript restored. Review claim applicability.",
                          );
                        }}
                      >
                        Restore this version
                      </button>
                      <button
                        onClick={() =>
                          downloadFile("Manuscript.md", v.text, "text/markdown")
                        }
                      >
                        Download version
                      </button>
                    </div>
                  </details>
                ))}
              <button
                onClick={() =>
                  downloadFile(
                    "Research-decision-record.md",
                    projectBrief(project),
                    "text/markdown",
                  )
                }
              >
                Export decision record and brief
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
