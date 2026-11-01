import type { AcademicPaper } from "../types/citation";
import {
  getActiveProjectId,
  getProject,
  id,
  now,
  saveProject,
  type SearchRun,
} from "./projectService";
export type ReviewRegistry = "openalex" | "crossref" | "europepmc";
export interface ReviewSearchInput {
  query: string;
  sources: ReviewRegistry[];
  pagesPerSource: number;
  fromYear?: number;
  toYear?: number;
}
export interface ReviewSearchResult {
  papers: AcademicPaper[];
  run: SearchRun;
}

function normalize(
  raw: Record<string, any>,
  source: ReviewRegistry,
): AcademicPaper {
  const crossref = source === "crossref",
    pmc = source === "europepmc";
  const doi = String(raw.DOI || raw.doi || "").replace(
    /^https?:\/\/doi.org\//i,
    "",
  );
  const abstract =
    raw.abstract ||
    raw.abstractText ||
    (raw.abstract_inverted_index
      ? Object.entries(raw.abstract_inverted_index as Record<string, number[]>)
          .flatMap(([word, positions]) =>
            positions.map((position) => ({ word, position })),
          )
          .sort((a, b) => a.position - b.position)
          .map((x) => x.word)
          .join(" ")
      : "");
  return {
    id: String(raw.id || raw.DOI || raw.pmid || id()),
    doi,
    title: String(
      crossref ? raw.title?.[0] || "" : raw.display_name || raw.title || "",
    ),
    authors: crossref
      ? (raw.author || []).map((a: any) => ({
          name: `${a.given || ""} ${a.family || ""}`.trim(),
          givenName: a.given,
          familyName: a.family,
        }))
      : pmc
        ? (raw.authorList?.author || []).map((a: any) => ({
            name: a.fullName || "",
            givenName: a.firstName,
            familyName: a.lastName,
          }))
        : (raw.authorships || []).map((a: any) => ({
            name: a.author?.display_name || "",
          })),
    year: Number(
      raw.publication_year ||
        raw.pubYear ||
        raw.published?.["date-parts"]?.[0]?.[0] ||
        0,
    ),
    venue: String(
      raw["container-title"]?.[0] ||
        raw.journalInfo?.journal?.title ||
        raw.primary_location?.source?.display_name ||
        "",
    ),
    abstract: String(abstract).replace(/<[^>]*>/g, " "),
    citationCount: Number(
      raw.cited_by_count ||
        raw["is-referenced-by-count"] ||
        raw.citedByCount ||
        0,
    ),
    openAccess: Boolean(raw.open_access?.is_oa || raw.isOpenAccess === "Y"),
    url: doi ? `https://doi.org/${doi}` : String(raw.id || ""),
    source,
    type:
      raw.type === "preprint" || raw.type === "posted-content"
        ? "preprint"
        : raw.type === "book"
          ? "book"
          : "journal",
    isRetracted: raw.is_retracted === true,
    pmid: raw.pmid,
    pmcid: raw.pmcid,
  };
}

/** Exact submitted strings are logged. Registry syntax differs; this does not claim cross-registry Boolean equivalence. */
export async function searchReviewCorpus(
  input: ReviewSearchInput,
  signal?: AbortSignal,
): Promise<ReviewSearchResult> {
  if (
    !input.query.trim() ||
    !input.sources.length ||
    input.pagesPerSource < 1 ||
    input.pagesPerSource > 20 ||
    !Number.isInteger(input.pagesPerSource)
  )
    throw new Error(
      "Enter a query, select registries, and choose 1–20 pages per registry.",
    );
  if (input.fromYear && input.toYear && input.fromYear > input.toYear)
    throw new Error("Start year must not exceed end year.");
  const projectId = getActiveProjectId();
  const papers: AcademicPaper[] = [];
  const run: SearchRun = {
    id: id(),
    query: input.query,
    mode: "review: exact, paginated, bounded",
    at: now(),
    sources: [],
    count: 0,
    options: input,
  };
  for (const source of input.sources) {
    let cursor = "*",
      count = 0,
      complete = false;
    const pageQueries: string[] = [];
    try {
      for (let page = 0; page < input.pagesPerSource; page++) {
        if (signal?.aborted)
          throw new DOMException("Search cancelled", "AbortError");
        let url: string;
        if (source === "openalex") {
          const params = new URLSearchParams({
            search: input.query,
            "per-page": "100",
            cursor,
          });
          const filters = [
            input.fromYear
              ? `from_publication_date:${input.fromYear}-01-01`
              : "",
            input.toYear ? `to_publication_date:${input.toYear}-12-31` : "",
          ].filter(Boolean);
          if (filters.length) params.set("filter", filters.join(","));
          url = `https://api.openalex.org/works?${params}`;
        } else if (source === "crossref") {
          const params = new URLSearchParams({
            query: input.query,
            rows: "100",
            cursor,
          });
          const filters = [
            input.fromYear ? `from-pub-date:${input.fromYear}-01-01` : "",
            input.toYear ? `until-pub-date:${input.toYear}-12-31` : "",
          ].filter(Boolean);
          if (filters.length) params.set("filter", filters.join(","));
          url = `https://api.crossref.org/works?${params}`;
        } else {
          const years =
            input.fromYear || input.toYear
              ? ` AND FIRST_PDATE:[${input.fromYear || 1000}-01-01 TO ${input.toYear || new Date().getFullYear()}-12-31]`
              : "";
          url = `https://www.ebi.ac.uk/europepmc/webservices/rest/search?${new URLSearchParams({ query: input.query + years, format: "json", resultType: "core", pageSize: "100", cursorMark: cursor })}`;
        }
        pageQueries.push(url);
        const response = await fetch(url, {
          signal: signal
            ? AbortSignal.any([signal, AbortSignal.timeout(25000)])
            : AbortSignal.timeout(25000),
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const raw = await response.json();
        const rows =
          source === "openalex"
            ? raw.results
            : source === "crossref"
              ? raw.message?.items
              : raw.resultList?.result;
        if (!Array.isArray(rows))
          throw new Error("Unexpected registry response");
        const next =
          source === "openalex"
            ? raw.meta?.next_cursor
            : source === "crossref"
              ? raw.message?.["next-cursor"]
              : raw.nextCursorMark;
        papers.push(...rows.map((row) => normalize(row, source)));
        count += rows.length;
        if (rows.length < 100 || !next || next === cursor) {
          complete = true;
          break;
        }
        cursor = next;
      }
      run.sources.push({
        name: source,
        query: pageQueries.join("\n"),
        count,
        status: complete
          ? "returned available pages"
          : "truncated at page limit",
        detail:
          "Counts describe retrieved records, not full database matches. Boolean and field syntax are registry-specific.",
      });
    } catch (error) {
      run.sources.push({
        name: source,
        query: pageQueries.join("\n"),
        count,
        status: signal?.aborted ? "cancelled" : "failed or partial",
        detail: error instanceof Error ? error.message : "Request failed",
      });
    }
    if (signal?.aborted) break;
  }
  const unique = new Map<string, AcademicPaper>();
  papers.forEach((p) => {
    const key =
      p.doi.toLowerCase() ||
      p.title.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");
    const provenance = { registry: p.source, recordId: p.id, retrievedAt: run.at, query: input.query };
    const existing = unique.get(key);
    if (!existing) unique.set(key, { ...p, registryProvenance: [provenance] });
    else unique.set(key, { ...existing, abstract: existing.abstract || p.abstract, registryProvenance: [...(existing.registryProvenance || []), provenance] });
  });
  const result = [...unique.values()];
  run.count = result.length;
  // Save to the initiating project even if the researcher switched projects during a request.
  const project = getProject(projectId);
  if (project)
    saveProject({ ...project, searches: [...project.searches, run] });
  return { papers: result, run };
}
