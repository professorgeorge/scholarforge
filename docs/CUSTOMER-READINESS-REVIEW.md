# Customer readiness review — 2026-11-03

This review covers the repository's research workflows, shared state, source handling, export paths, and automated tests. It is not a claim of exhaustive browser testing or scholarly validation of every output.

## Material defects corrected

- **Untrusted HTML:** manuscript and response-letter text, imported citation fields, and BibTeX previews could introduce HTML into rendering/export paths. These inputs are now escaped before application formatting is added. Regression tests cover all supported HTML citation styles and the affected exports.
- **Unjustified submission assurances:** the old scorecard described DOI patterns as resolved, inferred clean retraction status from absent keywords, treated declaration keywords as compliance, predicted editorial outcomes, and exported a purported verification certificate. It now produces a local text checklist, explicitly leaves verification and declarations for review, and makes no acceptance prediction.
- **Article diversity:** submission profiles now support empirical, review, and conceptual articles, optional supplied journal word limits, and optional blinded-review checks. Settings persist with the project. Conceptual papers are not penalized for lacking empirical sampling or IMRAD headings.
- **Anonymization:** ordinary ethics prose such as “IRB approval” was treated as a protocol identifier. Identifiers now require digits; email and repository coverage is broader. Users can supply literal names/identifiers, including punctuation and international names. This remains a proposed text redaction, not removal of original-file metadata.
- **Search races and errors:** manual claim searches now run explicitly, clear old results, ignore superseded requests, identify the selected source, and distinguish provider failure from no results. Draft grounding stops committing results when the draft is replaced, cleared, re-extracted, or the project component unmounts.
- **Broken handoffs:** command-palette DOI lookup now passes the DOI into the reference audit. Cart-to-Studio creates source-linked reading notes and updates the actual shared manuscript; it no longer invents empirical claims from source titles.
- **Shared-source integrity:** the cart is the shared project source library. Clearing/removing cards now retains sources referenced by evidence, full-text documents, or screening decisions. Reset text explains that saved versions, repository history, and other tool work survive.
- **Resilience and accessibility:** preference-storage failures no longer crash App effects; failed settings writes remain visible. The two revised dialogs have modal semantics, focus containment, Escape, and focus restoration. Invalid saved tool identifiers return to the hub. Clipboard failures in the revised checklist/anonymizer do not show false success.
- **Loading:** major tool panes load on demand behind a status fallback and error boundary. The main application chunk decreased from approximately 1.62 MB to 726 KB uncompressed in the measured builds. This is a bundle-size measurement, not a measured end-user latency improvement.
- **Command calculator:** the m-quotient uses the correct fields in either input order, removes unsupported percentile labels, and no longer silently strips an exponent operator from arithmetic input.

## Feature and connection map

The tests below are service-level checks, including mocked external responses. They do not establish current provider availability or replace end-to-end UI tests.

| Feature | Main connections and review boundary | Automated coverage or change |
|---|---|---|
| Concept & Theory Studio | Narration → questions → source passages → gaps → methods/discovery/funding | Existing tests cover review invalidation, passage requirements, bounded AI context, and handoffs |
| Funding Finder | Concept/proposal → calls → conditions → shortlist → repository | Existing tests cover dates, unknown eligibility/awards, pagination, partial failures, proxy allowlist, and stale notes |
| Literature Search | Queries/imports → deduplication → shared library/export | Existing tests cover source provenance, provider failure, metadata normalization, and reference exchange; loading split |
| PICO Strategy | Structured question → editable database query | Shared AI context tests and existing query workflow; provider-specific query interpretation still requires live checks |
| Counterevidence | Proposition → broad/null/replication searches → reviewed passages | Existing tests distinguish non-significance, invalidate stale reviews, and preserve partial coverage |
| Methodology Compass | Research question/design → planning/simulation/ethics | Existing planning/AI-context tests; loaded on demand; advice remains design guidance |
| Instrument Finder | Construct/population → candidate sources → validation and permissions | Existing tests prohibit inferred validation/licensing and preserve supplied evidence |
| Synthetic Data Forge | Design → seeded data → diagnostics → analysis scripts | Existing tests cover repeatability, complete cases, unsupported diagnostics, cycle rejection, and export code |
| IRB Preparation | Design/context → ethics prompts/declarations | Existing explicit-AI boundaries; navigation wording corrected to avoid claiming exemption determination |
| Manuscript Studio | Import/draft/cart → current manuscript → audit/writing/anonymizer | HTML escaping, current-manuscript handoff, stale-grounding guard, and retained versions |
| Claims Workbench | Claims → candidate papers → user selection/review | Existing integrity tests; manual search race/error fixes; draft changes invalidate old claim state |
| Applications Studio | Recorded findings → stakeholder/action/pilot cards | Existing tests retain boundaries and distinguish proposed from demonstrated outcomes |
| Writing Utilities | Shared title/abstract/references → editing and export | Citation/export injection regressions; submission word-limit profile connects to writing |
| Reference Audit | Shared bibliography or standalone DOI → registry checks | DOI handoff fixed; checklist directs users here without claiming it already ran |
| Journal Discovery | Manuscript → journal candidates → requirement review | Existing tests prohibit invented journal metrics/APCs; heuristic submission certificate removed |
| Anonymizer | Current draft → proposed redactions → Studio | New tests for prose preservation, explicit IDs, international email, OSF URLs, and literal custom matches |
| Scholar/Reviewer Finder | Search → candidate metadata → evaluation/export | Existing AI opt-in/context boundaries; lazy loading; m-quotient correction in global finder |
| Cross-cutting workbench/repository | Screening, source documents, evidence, reporting, versions, backup/restore | Existing recovery, archive, project isolation, ZIP and exchange tests; new linked-source preservation test |

## Interface decisions

Keep the four research stages and task-oriented start page. The repository, current manuscript, cart/library, and binder serve different roles; making those distinctions explicit is more valuable than adding another top-level destination. The submission checklist stays under **Current manuscript → Submission checks**. Custom redactions live beside the original anonymization input. DOI lookup opens a prepared audit without triggering a network request. Reading notes open directly in Studio.

## Verification and remaining release gates

- Automated test suite: **84 passing tests**, including nine added regressions at this review checkpoint.
- TypeScript/production build and lint must be rerun after the final dependency updates. Existing lint warnings in older components remain; passing lint is not equivalent to a warning-free tree.
- The npm advisory audit identified high-severity findings in Vite and source-map-js; targeted compatible updates were initiated and need the final audit result recorded below.
- **Browser testing was blocked.** The in-app browser timed out reaching the local server. Windows computer use stopped because it could not verify the browser URL. No screenshots, keyboard walkthrough, mobile-layout certification, or end-to-end claim is made.
- Before customer release, exercise desktop and narrow/mobile layouts, keyboard-only navigation across all dialogs, project switches during in-flight work, import/export and restore using representative large files, storage exhaustion, and refresh/deep-link behavior on the deployment host.
- Run live smoke tests for the public scholarly/funding providers on the deployment origin and selected AI-provider configurations. Mocked responses do not verify CORS, current quotas, credentials, or service availability.
- Deploy funding routes with the Node server or equivalent backend. Plain GitHub Pages hosting does not supply these routes.
- The optional browser-model runtime remains a large separately loaded bundle. Browser/device memory and WebGPU compatibility need hardware testing.
- Local projects are not authenticated collaboration or cloud backup. Concurrent editing from multiple tabs and recovery across browsers/devices need an explicit product policy and separate validation.

The implemented changes address material defects, but the blocked browser checks remain a release gate. No customer deployment was performed.
