# Research workspace implementation

This release connects the existing twelve utilities to a persistent project workbench. The workbench is available from **Project workspace**, above the active manuscript.

## Implemented

- Project creation and switching, legacy manuscript/cart/binder migration, IndexedDB persistence, browser mirrors, external JSON backup, restore-as-copy, and visible storage failures.
- Persistent state for manuscript claims, searches, writing inputs, methodology selections, journal results, verification results where supported, and simulation artifacts. Asynchronous tool state is scoped to its initiating project.
- Six outcome-oriented workflow checklists; question construction with PICO, PCC, SPIDER, interpretive, and computational frameworks.
- Bounded, paginated review search across OpenAlex, Crossref, and Europe PMC. Exact request URLs, settings, timestamps, returned counts, failures, cancellations, and truncation are retained. Search syntax is registry-specific. Rapid discovery is separately identified and logged.
- RIS, expanded BibTeX, CSL-JSON, and Zotero JSON import; RIS, BibTeX, and CSL-JSON export; read-only Zotero Web API import with pagination and a transient API key.
- PDF, DOCX, TXT, Markdown, and LaTeX text import. PDF page markers survive extraction. Scanned PDFs need OCR outside this application. RTF is rejected rather than read as plain text.
- Manual evidence extraction and optional AI suggestions constrained to quotations actually present in the supplied text. AI extraction analyzes a disclosed 24,000-character excerpt. Suggestions require human review and are never automatically marked checked.
- Evidence entries retain source identity, document, passage, location, population/context, design, outcome, estimate, theory, limitations, and manually assigned dataset/cohort identity. Synthesis CSV/JSON exports preserve these fields. CSV exports guard against formula injection.
- Independent reviewer labels, two-vote agreement, disagreement adjudication, versioned eligibility criteria, mergeable screening ledgers, and an SVG summary of recorded decisions. Earlier-criteria decisions remain in history and do not count toward current outcomes.
- Claim wording history, heuristic causal/generalization drift prompts, source links, and explicit researcher review. Manuscript changes invalidate claim review. Claims are not automatically approved because a relevant paper was found.
- Research decision records, reviewer-response locations, manuscript versions, restoration, and Markdown briefs.
- Curated methods guidance with assumptions, alternatives, examples, failure modes, and primary source links; reporting-framework navigation prompts linked to manuscript locations, with separate reported and procedure-confirmed states.
- Journal-specific requirements entered by the researcher with publisher URL and date checked.
- Offline writing produces an explicitly incomplete scaffold, and offline reviewer responses are worksheets without invented revisions. All model calls receive an instruction to distinguish supplied facts, unknowns, and proposed procedures. Generated R and supported Python model scripts load the supplied CSV and run analysis rather than claiming success while leaving estimation commented out.
- Repeated-sample planning for independent normal groups, MCAR attrition, measurement-reliability sensitivity, seeded reproducibility, Monte Carlo intervals, worker cancellation, and R/JSON/CSV exports.
- Finite-sample t and F tail probabilities, seeded synthetic-data generation, genuine MAR conditioning on an observed auxiliary variable, and complete-case OLS diagnostics recalculated after missingness/contamination. Unsupported model-specific inference is explicitly not estimated.

## Integrity changes

Retrieval counts never establish consensus or GRADE certainty. AI summaries are provisional and do not receive formal GRADE ratings. Journal CiteScore, Scopus quartiles, turnaround, acceptance rates, and APCs are not invented from citedness or AI output. Unknown APCs do not satisfy a budget constraint. Unmatched references do not establish fabrication. Discovery summaries do not claim a completed PRISMA review. Presence of an ethics-related phrase does not establish ethical approval, and templates require actual procedural facts.

## Deliberate boundaries

- This is a local workspace. Reviewer identities are labels, not authentication. Ledger exchange supports collaboration without a hosted service; simultaneous team editing, permissions, and cross-device synchronization require a separately designed backend.
- Reporting prompts link to official guidance; they are not the complete official checklists and do not certify compliance. Formal GRADE and discipline-specific risk-of-bias instruments still require their full procedures.
- Full-text import retains extracted text, not original PDF binaries or attachment synchronization. PDF reading order, tables, equations, and scans require checking.
- Dependency links are researcher-assigned. No automatic cohort identity, study independence, or bibliometric coverage guarantee is made.
- Browser planning currently implements a specified two-group normal model. Complex power planning, CFA/SEM, logistic inference, mediation bootstrap intervals, mixed models, and cluster inference require validated external analysis. Synthetic generation is not estimation.
- Registry quotas, keys, CORS policies, coverage, and changing metadata can limit requests. A bounded result set is not an exhaustive systematic search.
- Project backups intentionally exclude provider credential configuration. They still contain source texts and research notes and should be protected.
- The existing tool suite includes older heuristics beyond this upgrade. A complete methodological and security audit is a separate release gate.

## Verification

Run `npm test`, `npm run build`, and `npm run lint`. Tests exercise distribution reference values, null rejection behavior, deterministic seeds, unsupported diagnostics, complete-case regression, reference exchange, claim drift, screening, project isolation, and backup behavior. Build performs TypeScript validation.

Browser verification in this environment was blocked by local-server reachability and the Windows computer-use URL check. Rendered end-to-end QA, real Zotero credentials, live registry coverage, PDF fixtures, and a small researcher usability study remain release validation tasks. No publication, deployment, or outreach has been performed.

## Next release gates

1. Exercise the acceptance scenarios below in a browser at desktop and narrow widths; keyboard-test forms, disclosures, and navigation.
2. Validate PDF page anchors against representative single-column, multi-column, table-heavy, and scanned documents.
3. Compare supported statistical outputs against independent R/Python reference results across edge cases.
4. Evaluate extraction suggestions against a researcher-annotated corpus, including null and contradictory findings; measure quote fidelity separately from interpretation quality.
5. Recruit users only through an explicitly authorized study; measure task completion, repeated input, evidence traceability, and recovery after reopening.

## Acceptance scenarios

- Import an existing bibliography, create a project, switch away, reopen it, and verify that references and manuscript remain isolated from another project.
- Run a review query with one unavailable source; verify partial-source status and page limits in the saved log.
- Import a PDF, select a passage, attach a page location and claim, and export a synthesis matrix; compare it with the original page.
- Have two reviewer labels disagree, adjudicate with a reason, change criteria, and verify the previous decision becomes historical.
- Revise an associational claim to causal wording; verify its earlier wording and review flag remain visible.
- Run a zero-effect simulation and a nonzero-effect simulation with the same saved input; verify repeatability and Monte Carlo uncertainty.
- Export a project, restore it as a copy, and verify sources, text, decisions, and version history without provider keys.

## Source references

- [Zotero Web API v3](https://www.zotero.org/support/dev/web_api/v3/basics)
- [PDF.js examples](https://github.com/mozilla/pdf.js/tree/master/examples)
- [NIST t distribution](https://www.itl.nist.gov/div898/handbook/eda/section3/eda3664.htm)
- [PRISMA 2020](https://www.prisma-statement.org/prisma-2020)
- [GRADE Working Group](https://www.gradeworkinggroup.org/)
- [EQUATOR](https://www.equator-network.org/)


## Applications, counterevidence, and instruments

Three project-scoped utilities extend the existing navigation, hub, command palette and optional AI reviews. ResearchDiscovery shares explicit source selection, bounded federated searches, partial failure reporting, reference imports and candidate paging. New searches retain prior candidates, so source reviews are not silently removed. The literal query option preserves the user's terms at engine dispatch; adapters may still transform provider syntax. Default literature discovery remains adaptive.

Evidence reviews require population/outcome, comparability, exact supplied quotation/location, and interpretation for directional classifications. Negligible-effect labels additionally require an explicit equivalence/interval basis. The saved proposition accompanies each review, and stale classifications are suppressed in Markdown reports. Instrument profiles retain unknown permissions and validation roles until users document them; quotation checks verify transcription against supplied text, not publication authenticity. Exports preserve missing details instead of manufacturing them.
