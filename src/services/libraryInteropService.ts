import type { AcademicPaper, Author } from "../types/citation";
import { id } from "./projectService";

function author(name: string): Author {
  const parts = name.split(",").map((x) => x.trim());
  return parts.length > 1
    ? {
        name: `${parts[1]} ${parts[0]}`,
        familyName: parts[0],
        givenName: parts[1],
      }
    : { name };
}
function paper(
  fields: Record<string, string>,
  authors: Author[],
): AcademicPaper {
  const doi = (fields.doi || "")
    .replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, "")
    .trim();
  return {
    id: fields.id || doi || id(),
    title: fields.title || "Untitled imported record",
    authors,
    year: Number(fields.year?.match(/\d{4}/)?.[0]) || 0,
    venue: fields.venue || "",
    doi,
    url: fields.url || (doi ? `https://doi.org/${doi}` : ""),
    citationCount: 0,
    abstract: fields.abstract || "",
    openAccess: false,
    source: "manual",
    volume: fields.volume,
    issue: fields.issue,
    pages: fields.pages,
    publisher: fields.publisher,
    type:
      fields.type === "book"
        ? "book"
        : fields.type === "conference"
          ? "conference"
          : "journal",
  };
}

export function importReferences(
  text: string,
  format: "ris" | "bib" | "json",
): AcademicPaper[] {
  let papers: AcademicPaper[] = [];
  if (format === "json") {
    const raw = JSON.parse(text);
    const entries = Array.isArray(raw) ? raw : raw.items;
    if (!Array.isArray(entries))
      throw new Error("Expected a CSL-JSON or Zotero item array.");
    papers = entries
      .filter(
        (item) =>
          item &&
          typeof item === "object" &&
          !["attachment", "note", "annotation"].includes(
            item.data?.itemType || item.itemType || item.type,
          ),
      )
      .map((item) => {
        const v = item.data || item;
        const authors = (v.author || v.creators || v.authors || []).map(
          (a: Record<string, string>) => ({
            name:
              a.literal ||
              a.name ||
              `${a.given || a.firstName || ""} ${a.family || a.lastName || ""}`.trim(),
            givenName: a.given || a.firstName,
            familyName: a.family || a.lastName,
          }),
        );
        return paper(
          {
            id: String(item.key || v.id || ""),
            title: String(v.title || ""),
            doi: v.DOI || v.doi || "",
            year: String(
              v.issued?.["date-parts"]?.[0]?.[0] || v.date || v.year || "",
            ),
            venue: v["container-title"] || v.publicationTitle || v.venue || "",
            abstract: v.abstract || v.abstractNote || "",
            url: v.URL || v.url || "",
            volume: v.volume,
            issue: v.issue,
            pages: v.page || v.pages,
            publisher: v.publisher,
            type: v.type || v.itemType,
          },
          authors,
        );
      });
  } else if (format === "ris") {
    const blocks = text.split(/^ER\s{2}-.*$/m);
    for (const block of blocks) {
      const fields: Record<string, string[]> = {};
      let last = "";
      for (const line of block.split(/\r?\n/)) {
        const match = line.match(/^([A-Z0-9]{2})\s{2}-\s?(.*)$/);
        if (match) {
          last = match[1];
          (fields[last] ||= []).push(match[2]);
        } else if (last && line.trim())
          fields[last][fields[last].length - 1] += ` ${line.trim()}`;
      }
      if (!(fields.TI || fields.T1)) continue;
      const v = (key: string) => fields[key]?.[0] || "";
      papers.push(
        paper(
          {
            title: v("TI") || v("T1"),
            doi: v("DO"),
            year: v("PY") || v("Y1"),
            venue: v("JO") || v("JF") || v("T2"),
            url: v("UR"),
            abstract: v("AB") || v("N2"),
            volume: v("VL"),
            issue: v("IS"),
            pages: [v("SP"), v("EP")].filter(Boolean).join("-"),
            publisher: v("PB"),
            type: v("TY") === "BOOK" ? "book" : "journal",
          },
          (fields.AU || fields.A1 || []).map(author),
        ),
      );
    }
  } else {
    // Balanced braces preserve nested title capitalization; macros/string concatenation are rejected.
    let pos = 0;
    while (pos < text.length) {
      const match = /@(\w+)\s*[{(]/g;
      match.lastIndex = pos;
      const entry = match.exec(text);
      if (!entry) break;
      let cursor = match.lastIndex,
        depth = 1,
        quoted = false;
      const opening = text[cursor - 1],
        closing = opening === "{" ? "}" : ")";
      const start = cursor;
      for (; cursor < text.length && depth; cursor++) {
        if (text[cursor - 1] === "\\") continue;
        if (text[cursor] === '"') quoted = !quoted;
        if (!quoted && text[cursor] === opening) depth++;
        if (!quoted && text[cursor] === closing) depth--;
      }
      if (depth) throw new Error("Unbalanced BibTeX entry.");
      const body = text.slice(start, cursor - 1);
      pos = cursor;
      if (["comment", "preamble", "string"].includes(entry[1].toLowerCase()))
        continue;
      const comma = body.indexOf(",");
      if (comma < 0) continue;
      const fields: Record<string, string> = {};
      let i = comma + 1;
      while (i < body.length) {
        const key = /^\s*,?\s*([\w-]+)\s*=\s*/.exec(body.slice(i));
        if (!key) break;
        i += key[0].length;
        const delimiter = body[i];
        let value = "";
        if (delimiter === "{") {
          let nesting = 1;
          i++;
          for (; i < body.length && nesting; i++) {
            if (body[i] === "{" && body[i - 1] !== "\\") nesting++;
            if (body[i] === "}" && body[i - 1] !== "\\") nesting--;
            if (nesting) value += body[i];
          }
          if (nesting) throw new Error("Unbalanced BibTeX field.");
        } else if (delimiter === '"') {
          i++;
          while (i < body.length && (body[i] !== '"' || body[i - 1] === "\\"))
            value += body[i++];
          i++;
        } else {
          const token = /^[^,]+/.exec(body.slice(i))?.[0] || "";
          i += token.length;
          if (!/^\d+$/.test(token.trim()))
            throw new Error(
              "BibTeX string macros are not supported. Export expanded BibTeX or CSL-JSON.",
            );
          value = token;
        }
        if (/^\s*#/.test(body.slice(i)))
          throw new Error(
            "BibTeX concatenation is not supported. Export expanded BibTeX.",
          );
        fields[key[1].toLowerCase()] = value.replace(/[{}]/g, "").trim();
      }
      if (fields.title)
        papers.push(
          paper(
            {
              ...fields,
              venue: fields.journal || fields.booktitle || "",
              type:
                entry[1].toLowerCase() === "book"
                  ? "book"
                  : entry[1].toLowerCase() === "inproceedings"
                    ? "conference"
                    : "journal",
            },
            (fields.author || "")
              .split(/\s+and\s+/i)
              .filter(Boolean)
              .map(author),
          ),
        );
    }
  }
  if (!papers.length)
    throw new Error("No bibliographic records could be read.");
  return papers;
}

export function exportCslJson(papers: AcademicPaper[]): string {
  return JSON.stringify(
    papers.map((p) => ({
      id: p.id,
      type:
        p.type === "book"
          ? "book"
          : p.type === "conference"
            ? "paper-conference"
            : "article-journal",
      title: p.title,
      author: p.authors.map((a) =>
        a.familyName
          ? { family: a.familyName, given: a.givenName }
          : { literal: a.name },
      ),
      issued: { "date-parts": [[p.year]] },
      "container-title": p.venue,
      DOI: p.doi,
      URL: p.url,
      abstract: p.abstract,
      volume: p.volume,
      issue: p.issue,
      page: p.pages,
      publisher: p.publisher,
    })),
    null,
    2,
  );
}

export async function fetchZoteroLibrary(
  libraryId: string,
  kind: "users" | "groups",
  apiKey: string,
  signal?: AbortSignal,
): Promise<AcademicPaper[]> {
  if (!/^\d+$/.test(libraryId))
    throw new Error("Enter a numeric Zotero user or group ID.");
  const records: AcademicPaper[] = [];
  for (let start = 0; start < 10000; start += 100) {
    const response = await fetch(
      `https://api.zotero.org/${kind}/${libraryId}/items/top?format=csljson&limit=100&start=${start}`,
      {
        headers: {
          "Zotero-API-Version": "3",
          ...(apiKey ? { "Zotero-API-Key": apiKey } : {}),
        },
        signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(30000)]) : AbortSignal.timeout(30000),
      },
    );
    if (!response.ok)
      throw new Error(
        `Zotero returned ${response.status}. Check access, library ID, and rate limits. No partial import has been saved.`,
      );
    const raw = await response.json();
    const items = Array.isArray(raw) ? raw : raw.items;
    if (!Array.isArray(items)) throw new Error("Unexpected Zotero response.");
    if (!items.length) break;
    records.push(...importReferences(JSON.stringify(items), "json"));
    if (items.length < 100) return records;
    if (start === 9900)
      throw new Error(
        "Library exceeds the 10,000-record interactive import limit. Use file export to import a subset.",
      );
  }
  return records;
}
