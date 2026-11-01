const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");
require("fake-indexeddb/auto");
// Compile source in memory for Node's test runner without a second build output.
require.extensions[".ts"] = (module, filename) =>
  module._compile(
    ts.transpileModule(fs.readFileSync(filename, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        esModuleInterop: true,
      },
    }).outputText,
    filename,
  );
const {
  studentTPValue,
  fPValue,
  seededRandom,
} = require("../src/services/statisticalDistributions.ts");
const { simulatePlanning } = require("../src/services/planningService.ts");
const {
  generateDeterministicConsensus,
} = require("../src/services/aiScholarExtensions.ts");
const {
  generateQuantitativeDataset,
  computeOlsRegression,
} = require("../src/services/syntheticDataService.ts");
const {
  importReferences,
  exportCslJson,
} = require("../src/services/libraryInteropService.ts");
const { generateRIS } = require("../src/services/risExporter.ts");
const { generateBibtexEntry } = require("../src/services/citationFormatter.ts");
const {
  reviseClaim,
  screeningOutcome,
  validateProject,
  createProject,
  getProject,
  selectProject,
  updateProject,
  importProjectBackup,
  exportProjectBackup,
} = require("../src/services/projectService.ts");

class MemoryStorage {
  values = new Map();
  getItem(key) {
    return this.values.get(key) ?? null;
  }
  setItem(key, value) {
    this.values.set(key, String(value));
  }
  removeItem(key) {
    this.values.delete(key);
  }
}
global.localStorage = new MemoryStorage();
global.window = new EventTarget();

test("Student t and F reference probabilities retain finite-sample degrees of freedom", () => {
  assert.ok(Math.abs(studentTPValue(2.2281388519649385, 10) - 0.05) < 1e-10);
  assert.ok(Math.abs(studentTPValue(12.706204736432095, 1) - 0.05) < 1e-10);
  assert.ok(Math.abs(fPValue(4.9646027437307145, 1, 10) - 0.05) < 1e-10);
  assert.equal(studentTPValue(0, 10), 1);
});

test("paper quantity and recency never establish support or GRADE certainty", () => {
  const papers = Array.from({ length: 100 }, () => ({
    year: 2026,
    title: "An unrelated study",
    venue: "Journal",
  }));
  const result = generateDeterministicConsensus("A causes B", papers);
  assert.equal(result.gradeRating, "Not assessed");
  assert.equal(result.verdict, "unsubstantiated");
  assert.doesNotMatch(result.synthesisParagraph, /corroborat|confirms/i);
});

test("seeded generator repeats and null simulation has a plausible false-positive rate", () => {
  const a = seededRandom(42),
    b = seededRandom(42);
  assert.deepEqual(
    Array.from({ length: 100 }, a),
    Array.from({ length: 100 }, b),
  );
  const input = {
    seed: 42,
    samplePerGroup: 50,
    effect: 0,
    reliability: 1,
    attrition: 0,
    replications: 1000,
    alpha: 0.05,
  };
  const result = simulatePlanning(input);
  assert.ok(
    result.power > 0.025 && result.power < 0.08,
    `null rejection rate: ${result.power}`,
  );
  assert.deepEqual(result, simulatePlanning(input));
  assert.ok(simulatePlanning({ ...input, effect: 1 }).power > 0.98);
  assert.throws(() => simulatePlanning({ ...input, samplePerGroup: NaN }));
});

test("synthetic data respects seeds and unsupported diagnostics never claim estimation", () => {
  const config = {
    modelType: "logistic_regression",
    sampleSize: 100,
    randomSeed: 7,
    missingMechanism: "none",
    missingRatePercent: 0,
    outlierContaminationPercent: 0,
    meanCenterPredictors: true,
  };
  const a = generateQuantitativeDataset(config),
    b = generateQuantitativeDataset(config);
  assert.deepEqual(a.data, b.data);
  assert.equal(a.generationConfig.randomSeed, 7);
  assert.equal(a.hypothesisVerification.status, "not_estimated");
  assert.doesNotMatch(
    a.apaResultsProse,
    /p\s*<|empirical confirmation|statistically significant/,
  );
});

test("OLS uses complete cases rather than converting missing observations to zero", () => {
  const y = [1, 3, null, 7, 8],
    x = [[0], [1], [2], [3], [4]];
  const actual = computeOlsRegression(y, x),
    expected = computeOlsRegression([1, 3, 7, 8], [[0], [1], [3], [4]]);
  assert.deepEqual(actual.coefficients, expected.coefficients);
  assert.deepEqual(actual.pValues, expected.pValues);
});

test("reference exchange preserves core metadata and nested BibTeX titles", () => {
  const input =
    "@article{key, title={A {Nested} Title}, author={Doe, Jane and Roe, John}, year={2024}, journal={Research}, doi={10.1234/test}, volume={2}, pages={1--9}}";
  const papers = importReferences(input, "bib");
  assert.equal(papers[0].title, "A Nested Title");
  assert.equal(papers[0].authors.length, 2);
  assert.equal(
    importReferences(exportCslJson(papers), "json")[0].doi,
    "10.1234/test",
  );
  assert.equal(
    importReferences(generateRIS(papers), "ris")[0].title,
    papers[0].title,
  );
  assert.equal(
    importReferences(generateBibtexEntry(papers[0]), "bib")[0].year,
    2024,
  );
  assert.throws(() =>
    importReferences("@article{x, title = missingMacro}", "bib"),
  );
});

test("claim revisions preserve wording and flag stronger inference for review", () => {
  const original = {
    id: "c",
    text: "X is associated with Y in this sample",
    history: [],
    needsReview: false,
  };
  const result = reviseClaim(original, "X improves Y generally");
  assert.equal(result.needsReview, true);
  assert.equal(result.history[0].text, original.text);
  assert.match(result.history[0].note, /causality or generalization/);
  assert.equal(original.history.length, 0);
});

test("screening needs two current reviewers and preserves disagreements", () => {
  const base = {
    criteriaVersion: 2,
    screening: [
      {
        id: "1",
        paperId: "p",
        stage: "abstract",
        reviewer: "A",
        decision: "include",
        criteriaVersion: 2,
      },
    ],
    adjudications: {},
  };
  assert.equal(screeningOutcome(base, "p", "abstract").decision, "pending");
  const both = {
    ...base,
    screening: [
      ...base.screening,
      { ...base.screening[0], id: "2", reviewer: "B", decision: "exclude" },
    ],
  };
  assert.equal(screeningOutcome(both, "p", "abstract").decision, "conflict");
  assert.equal(
    screeningOutcome({ ...both, criteriaVersion: 3 }, "p", "abstract").decision,
    "pending",
  );
  const resolved = {
    ...both,
    adjudications: {
      "p:abstract": {
        decision: "exclude",
        reason: "Ineligible population",
        criteriaVersion: 2,
      },
    },
  };
  assert.equal(screeningOutcome(resolved, "p", "abstract").decision, "exclude");
});

test("project switching isolates work and backup restore creates a copy without provider keys", () => {
  const a = createProject("First");
  selectProject(a.id);
  updateProject({ question: "Question one" });
  const b = createProject("Second");
  selectProject(b.id);
  updateProject({ question: "Question two" });
  selectProject(a.id);
  assert.equal(getProject().question, "Question one");
  const backup = exportProjectBackup({
    ...getProject(),
    tools: {
      "workspace.note": "keep",
      apiKey: "SECRET",
      citation_filler_llm_config: { apiKey: "SECRET" },
    },
  });
  assert.doesNotMatch(backup, /SECRET/);
  const restored = importProjectBackup(backup);
  assert.notEqual(restored.id, a.id);
  assert.equal(restored.question, "Question one");
  assert.equal(getProject().id, a.id);
  assert.throws(() => validateProject({ schemaVersion: 5 }));
  assert.throws(() => importProjectBackup("{broken"));
});

test("AI extraction rejects invented passages and retains page locations", () => {
  const {
    validateSuggestions,
  } = require("../src/services/evidenceExtractionService.ts");
  const text =
    "The intervention did not improve the primary outcome in this sample.";
  const doc = { id: "doc", text, pages: [{ page: 3, text }] };
  const result = validateSuggestions(
    [
      { quote: "Invented results show a benefit." },
      { quote: text, estimate: "No benefit", design: "Trial" },
    ],
    doc,
  );
  assert.equal(result.length, 1);
  assert.equal(result[0].locator, "Page 3");
});

test("offline manuscript and reviewer workflows do not fabricate findings or completed revisions", async () => {
  const {
    generateArticleWithLLM,
    executePeerReviewOverhaul,
  } = require("../src/services/llmService.ts");
  const config = { provider: "builtin" };
  const manuscript = await generateArticleWithLLM(
    "An unstudied topic",
    "A research question",
    "",
    config,
  );
  assert.match(manuscript, /offline scaffold does not synthesize findings/i);
  assert.doesNotMatch(
    manuscript,
    /Smith \(2023\)|statistically significant improvements|sensitivity analyses.*executed/i,
  );
  const response = await executePeerReviewOverhaul(
    "Original draft",
    "Please perform sensitivity analysis.",
    [],
    config,
  );
  assert.equal(response.revisedManuscript, "Original draft");
  assert.match(response.executiveSummary, /not been revised/);
  assert.doesNotMatch(
    response.responseLetter,
    /we conducted|we performed|we have added/i,
  );
});

test("review search preserves pagination limits and partial source failure", async () => {
  const {
    searchReviewCorpus,
  } = require("../src/services/reviewSearchService.ts");
  const previousFetch = global.fetch;
  const requests = [];
  global.fetch = async (url) => {
    requests.push(String(url));
    if (String(url).includes("crossref")) return { ok: false, status: 429 };
    const cursor = new URL(url).searchParams.get("cursor");
    return {
      ok: true,
      json: async () => ({
        results: Array.from({ length: 100 }, (_, i) => ({
          id: `${cursor}-${i}`,
          display_name: `Paper ${cursor}-${i}`,
          authorships: [],
          publication_year: 2024,
        })),
        meta: { next_cursor: cursor === "*" ? "next" : "next2" },
      }),
    };
  };
  try {
    const result = await searchReviewCorpus({
      query: '"exact term"',
      sources: ["openalex", "crossref"],
      pagesPerSource: 2,
    });
    assert.equal(result.papers.length, 200);
    assert.equal(requests.length, 3);
    assert.match(result.run.sources[0].status, /truncated/);
    assert.match(result.run.sources[1].status, /failed/);
    assert.equal(
      new URL(requests[0]).searchParams.get("search"),
      '"exact term"',
    );
    assert.equal(new URL(requests[1]).searchParams.get("cursor"), "next");
  } finally {
    global.fetch = previousFetch;
  }
});

test("journal metadata does not manufacture named metrics, time estimates, or free APCs", async () => {
  const {
    matchJournalsForManuscript,
  } = require("../src/services/journalMatchmakerService.ts");
  const previousFetch = global.fetch;
  global.fetch = async () => ({
    ok: true,
    json: async () => ({
      results: [
        {
          id: "J1",
          display_name: "Test journal",
          is_oa: true,
          is_in_doaj: true,
          apc_usd: null,
          summary_stats: { "2yr_mean_citedness": 12, h_index: 200 },
          topics: [],
        },
      ],
    }),
  });
  try {
    const results = await matchJournalsForManuscript("Test", "Study");
    const journal = results.find((j) => j.id === "J1");
    assert.equal(journal.citeScore, null);
    assert.equal(journal.meanCitedness, 12);
    assert.equal(journal.scopusQuartile, "Unknown");
    assert.equal(journal.reviewSpeedWeeks, "Unknown");
    assert.equal(journal.acceptanceRateEstimated, "Unknown");
    assert.equal(journal.apcUsd, null);
    assert.notEqual(journal.oaType, "Diamond OA ($0 APC)");
    assert.equal(
      (await matchJournalsForManuscript("Test", "Study", { maxApc: 0 })).length,
      0,
    );
  } finally {
    global.fetch = previousFetch;
  }
});

test("supported simulation diagnostics describe exported complete cases", () => {
  const config = {
    modelType: "moderation",
    sampleSize: 300,
    randomSeed: 12,
    missingMechanism: "mar",
    missingRatePercent: 15,
    outlierContaminationPercent: 2,
    meanCenterPredictors: true,
  };
  const dataset = generateQuantitativeDataset(config);
  const vars = dataset.variables;
  const outcome = vars.find((v) => v.role === "outcome").name;
  const predictor = vars.find((v) => v.role === "predictor").name;
  const moderator = vars.find((v) => v.role === "moderator").name;
  const product = `${predictor}_x_${moderator}`;
  const covariates = vars
    .filter((v) => v.role === "covariate" && v.name !== "Missingness_Auxiliary")
    .map((v) => v.name);
  const cols = [predictor, moderator, product, ...covariates];
  const complete = dataset.data.filter((row) =>
    [outcome, ...cols].every((col) => typeof row[col] === "number"),
  );
  const fit = computeOlsRegression(
    complete.map((row) => row[outcome]),
    complete.map((row) => cols.map((col) => row[col])),
  );
  assert.equal(
    dataset.hypothesisVerification.focalCoefficient,
    fit.coefficients[3],
  );
  assert.equal(dataset.hypothesisVerification.pValue, fit.pValues[3]);
  assert.ok(
    dataset.data.every((row) => typeof row.Missingness_Auxiliary === "number"),
  );
  assert.ok(complete.length < dataset.data.length);
});

test('latent generation handles one factor, unique long item names, and rejects cycles', () => {
  const base = { modelType: 'sem_cfa', sampleSize: 30, randomSeed: 7, missingMechanism: 'none', missingRatePercent: 0, outlierContaminationPercent: 0, meanCenterPredictors: true };
  const single = generateQuantitativeDataset({ ...base, semParams: { scaleType: 'likert_5', factors: [{ name: 'FACTOR', label: 'Factor', itemsCount: 3, targetLoading: 0.8 }], structuralPaths: [] } });
  assert.equal(single.psychometrics.scales.length, 1);
  const defaults = generateQuantitativeDataset(base);
  assert.equal(new Set(defaults.variables.map(v => v.name)).size, defaults.variables.length);
  assert.throws(() => generateQuantitativeDataset({ ...base, semParams: { scaleType: 'likert_5', factors: [{ name: 'A', label: 'A', itemsCount: 3, targetLoading: 0.8 }, { name: 'B', label: 'B', itemsCount: 3, targetLoading: 0.8 }], structuralPaths: [{ from: 'A', to: 'B', beta: 0.4 }, { from: 'B', to: 'A', beta: 0.4 }] } }), /acyclic/);
});

test("analysis exporters contain executable model code and no fictitious loaded-data claim", () => {
  const {
    executableR,
    executablePython,
  } = require("../src/services/analysisScriptService.ts");
  const { spawnSync } = require("node:child_process");
  for (const modelType of [
    "moderation",
    "mediation",
    "sem_cfa",
    "anova_factorial",
    "logistic_regression",
    "longitudinal",
  ]) {
    const dataset = generateQuantitativeDataset({
      modelType,
      sampleSize: 40,
      randomSeed: 3,
      missingMechanism: "none",
      missingRatePercent: 0,
      outlierContaminationPercent: 0,
      meanCenterPredictors: true,
    });
    const script = executablePython(dataset);
    assert.match(script, /pd.read_csv\(sys.argv\[1\]\)/);
    assert.doesNotMatch(script, /Dataset loaded successfully/);
    const parsed = spawnSync(
      "python",
      ["-c", "import ast,sys; ast.parse(sys.stdin.read())"],
      { input: script, encoding: "utf8" },
    );
    if (!parsed.error) assert.equal(parsed.status, 0, parsed.stderr);
    const r = executableR(dataset);
    assert.match(r, /read.csv\(path/);
    assert.doesNotMatch(r, /# fit <-|# df <-/);
  }
});

test("IndexedDB recovers full projects when the smaller browser mirror is unavailable", async () => {
  const service = require("../src/services/projectService.ts");
  const project = service.createProject("Durable recovery");
  service.selectProject(project.id);
  const originalSet = global.localStorage.setItem;
  global.localStorage.setItem = () => {
    throw new Error("Quota exceeded");
  };
  service.updateProject({ protocol: "Must survive a mirror quota failure" });
  await service.flushProjectWrites();
  global.localStorage.setItem = originalSet;
  global.localStorage.values.clear();
  const path = require.resolve("../src/services/projectService.ts");
  delete require.cache[path];
  const recovered = require("../src/services/projectService.ts");
  await recovered.initializeProjects();
  assert.equal(
    recovered.getProject(project.id).protocol,
    "Must survive a mirror quota failure",
  );
});
