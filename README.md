# ScholarForge

A local research workspace connecting literature discovery, study design, evidence, writing, and submission preparation.

Developed by Professor Babu George.

## Start

Use Node.js 22.13 or newer (Node.js 24 is used in CI).

```bash
npm ci
npm run dev
```

**Start here** offers four explicit tasks: develop a research idea, find literature, work on a manuscript, or check references. Material stays staged until you continue. Concept narrations, topics, and standalone reference checks preserve the active manuscript; opening a draft in Manuscript Studio makes it the active manuscript. Searches and reference verification start only when you run them in their tools. Use **Find a tool** to search the separate utility catalog.

The app keeps one **Current project**, saved automatically in this browser. Rename it in the project bar. Current inputs, drafts, and tool results persist; repository snapshots and original-file copies are no longer collected. Older installations retain the active project and remove other saved projects, archived results, original-file copies, and older manuscript versions when opened.

Use the visible **Clean up app** button beside the project name to download current work, clear literature work (including reviews, cart, binder, and linked evidence/screening), or clear all current work. Cleanup asks for confirmation and reloads the app. Project details and provider settings remain. Download a backup before deleting work you may need again.

**Current manuscript** identifies the draft shared by manuscript tools and offers **Open in Studio**. Import or paste another draft to replace it. Keep original files on your device.

The **Research workbench** supports logged searches, screening, evidence entry, planning, reporting, and decisions for the current project. Restoring a backup replaces the current project after confirmation. There is no project switcher or automatic cloud synchronization.


## Project workbench

- Six outcome-oriented workflows: proposal, literature review, analysis, manuscript, submission, and revision.
- Research questions with PICO, PCC, SPIDER, interpretive, and computational frameworks.
- Logged, paginated review searches across OpenAlex, Crossref, and Europe PMC, separate from rapid federated discovery. Limits and failures remain visible.
- Reference import/export through RIS, expanded BibTeX, and CSL-JSON; read-only Zotero library import.
- Full-text PDF/DOCX/text import, page markers, exact source quotations, optional AI extraction suggestions, and evidence matrices.
- Individual screening decisions, disagreements, adjudication, versioned criteria, and exchangeable reviewer ledgers.
- Claim wording history, evidence links, manually recorded cohort dependence, and review flags after changes.
- Methods guidance, repeated-sample planning with seeds and Monte Carlo uncertainty, reporting prompts, and journal-specific requirements.
- Research decisions, reviewer-response locations, manuscript versions, project backup/restore, and Markdown research briefs.

## Existing utilities

The suite offers seventeen utilities organized in four stages:

| Stage | Utilities |
|---|---|
| Discover | Concept & Theory Studio; Funding Opportunity Finder; federated literature search; PICO strategy builder; Null Findings & Counterevidence Finder |
| Design & Data | Methodology Compass; Measurement & Instrument Finder; Synthetic Data Forge; IRB preparation |
| Draft & Ground | Manuscript Studio; Claims Workbench; Research Applications Studio; writing utilities |
| Audit & Publish | Reference audit; journal discovery; anonymizer; scholar/reviewer finder |

The command palette, research cart, binder, citation styles, and local or external model configuration remain available.

## Findings, counterevidence, and measurement

**Concept & Theory Studio** guides a short narration through puzzle clarification, alternative framings, literature-gap assessment, conceptual explanation, methodological pathways, and an exportable research concept brief. Each step offers connected AI reviews using the existing model settings and editable, bounded context. AI wording is appended only through an explicit action and remains a draft. No model connection is needed for manual work.

The studio supports scholarly searches, reference-manager imports, saved project sources, source quotations, competing explanations, relationship/process/typological/interpretive models, and study-pathway comparison. A candidate gap becomes user-reviewed only after a working frame, question, coverage notes, competing-work assessment, and matching source passages are recorded. This does not certify novelty or exhaustive coverage. Changed upstream inputs flag dependent reviews for rechecking. Briefs retain missing details and review flags and can be saved to the binder or exported as Markdown/JSON. Explicit handoffs fill Literature Search, Counterevidence, and Instrument Finder inputs or append context to Methodology Compass. Cited sources can be kept in the shared project library.

**Research Applications Studio** creates editable finding → stakeholder → action cards with evidence locations, boundary conditions, risks, pilot plans, and proposed success measures. Load a recorded project claim or enter a finding. Export a Markdown brief or JSON, or save the brief to the binder. Proposed benefits remain distinct from demonstrated outcomes.

**Null Findings & Counterevidence Finder** prepares editable broad, null-result, and replication searches. Review source passages and comparable populations/outcomes before recording a direction. Non-significance is separate from negligible-effect/equivalence evidence. A changed proposition or mismatched source passage invalidates the classification in the Markdown report. Exported JSON preserves the proposition associated with each recorded review.

**Measurement & Instrument Finder** searches for candidate measurement literature and links to IPIP, HealthMeasures/PROMIS, and PhenX. Build and compare profiles with validation quotations, source roles, population/version, burden, scoring, and documented permissions. Search hits do not automatically become validated instruments, and scale items are not reproduced.

Both finders use independent scholarly sources, retain partial results and query coverage, merge duplicate candidates, and accept saved project sources or reference-manager exports. Searches are bounded discovery, not exhaustive reviews; provider syntax can differ. All three tools work without AI, retain saved work in the active project, and provide explicit optional AI reviews with editable context.

## Optional AI assistance

Every utility includes an **Optional AI assistance** panel with task-specific reviews. Configure a cloud provider, Ollama, a browser model, or a compatible custom endpoint in Settings. Configuration alone does not invoke the shared assistant: choose a task, load saved tool inputs or paste material, edit the visible context, and click **Run AI review**. Only that material and the supplied instructions are sent with the task prompt. Context is excerpted and bounded; provider credentials, unrelated project documents, and raw dataset rows are excluded from automatic context loading.

AI reviews can be copied or explicitly saved to the research binder. They do not overwrite manuscript text, registry results, calculations, ethics determinations, or anonymization output. Journal AI triage requires its own action; scholar-profile AI parsing and biography assistance require an explicit opt-in. Custom model endpoints can be entered directly and may operate without an API key when the server permits it. Switching providers clears credentials, model names, and endpoints belonging to the previous provider.

See [AI coverage and verification boundaries](docs/AI-COVERAGE.md) for the tasks available in each utility.

## Scholarly sources and reference exchange

Rapid discovery searches OpenAlex, Crossref, Europe PMC, PubMed, and DataCite independently. Semantic Scholar is optional and off by default; arXiv is optional when preprints are allowed. Source status remains visible after a search, including failures, rate limits, and returned-record counts. One failed source does not discard successful records. Semantic Scholar failures trigger a brief cooldown rather than repeated requests.

PubMed adds direct NCBI metadata; its summary API does not provide abstracts or citation totals. DataCite adds repository papers, theses, and reports, including material that may not be peer reviewed. DOI registration is not verification of peer review. Duplicate records retain registry provenance; citation totals from different providers are never added together. Rapid discovery is bounded and may transform queries; the logged review-search workflow still supports OpenAlex, Crossref, and Europe PMC.

The literature screen previews RIS, BibTeX, CSL-JSON, and Zotero library imports before merging them with results. Use RIS exports from Publish or Perish and compatible reference managers. Zotero user/group libraries are read only; private-library keys are request-only and are not saved. Live-search filters do not apply to imported references. Export RIS or BibTeX to bring records back to your reference manager. Google Scholar, Scopus, Lens, and Web of Science are not queried directly by this integration.

Source API references: [PubMed E-utilities](https://www.ncbi.nlm.nih.gov/books/NBK25497/), [DataCite REST API](https://support.datacite.org/docs/api), [Semantic Scholar access and limits](https://www.semanticscholar.org/product/api/tutorial), [Zotero Web API](https://www.zotero.org/support/dev/web_api/v3/basics), and [Publish or Perish sources](https://harzing.com/resources/publish-or-perish/manual/using/data-sources).

## Interpretation and persistence

Retrieved papers are candidates, not proof of support. Registry matching does not establish peer review. AI summaries and extraction suggestions require source checking. GRADE certainty, journal quartiles, review times, and acceptance rates are not inferred from paper counts or citedness. Reporting prompts are navigation aids, not complete official checklists or certification.

Projects use IndexedDB with a browser-storage mirror when space permits. Storage failures are visible; external backups remain important. Backups include source texts and research notes but exclude provider-key configuration. Reviewer labels support local ledger exchange, not authenticated real-time collaboration.

Synthetic data are artificial. Supported sample diagnostics are calculated from generated rows; unsupported model-specific inference is explicitly not estimated. The planning laboratory currently models independent normal groups with equal variance, reliability attenuation, and MCAR attrition. Use an appropriate validated external analysis for other designs.

See [implementation details, boundaries, and acceptance scenarios](docs/IMPLEMENTATION.md).

## Validate

```bash
npm test
npm run build
npm run lint
```

Build includes TypeScript checks. Lint also reports existing warnings in the older utility suite.

## Deploy

The existing GitHub Pages workflow builds and publishes pushes to its configured default branches. Local implementation does not deploy changes automatically.

## 📄 License & Intellectual Property

ScholarForge is released under the **[Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License (CC BY-NC-SA 4.0)](./LICENSE)**.

Copyright &copy; 2025–2026 **Professor Babu George** • Licensed under CC BY-NC-SA 4.0.

- **Non-Commercial Academic & Research Use**: Freely accessible for scholarly inquiry, teaching, experimentation, and research verification.
- **Mandatory Attribution**: Any use, adaptation, derivative research, or deployment must prominently attribute and cite Professor Babu George.
- **Commercial Prohibition**: Commercial redistribution, proprietary wrapping, SaaS monetization, or closed cloning is strictly prohibited without prior express written permission.

### 📚 Suggested Citation

```bibtex
@software{george2026scholarforge,
  author = {George, Babu},
  title = {{ScholarForge: Unified Scholarly Intelligence, Empirical Synthesis, and Reference Verification Suite}},
  year = {2026},
  publisher = {GitHub},
  url = {https://github.com/professorgeorge/scholarforge}
}
```

---

## ⚖️ Legal Disclaimer & Absolute Limitation of Liability

> [!WARNING]
> **RESEARCH ASSISTANCE & "AS IS" DISCLAIMER**:
> ScholarForge is provided strictly on an **"AS IS"** and **"AS AVAILABLE"** basis for non-commercial academic research, pedagogical instruction, and scholarly inquiry. Neither Professor Babu George, developers, contributors, nor affiliated institutions warrant the accuracy, completeness, reliability, or timeliness of any literature citations, scientometric indicators, journal quartiles, or synthetic simulations.

- **Absolution of Financial & Technical Liability**: In no event shall Professor Babu George or contributors be liable for any direct, indirect, incidental, consequential, special, or exemplary damages, including but not limited to third-party API token expenses, runaway LLM billing, rate-limiting penalties, data corruption, or service disruptions.
- **Absolution of Academic & Professional Liability**: The author and contributors disclaim all liability for any academic outcomes, manuscript desk-rejections, peer-review evaluations, tenure or promotion reviews, institutional ethics inquiries, or reputational impacts resulting from the use of this software.
- **Sole User Responsibility**: Users assume 100% sole responsibility for independently verifying all factual claims, statistical computations, and citations against original primary literature before inclusion in any academic manuscript, thesis, or grant proposal.
- **Indemnification**: By downloading, cloning, running, or utilizing ScholarForge, users agree to defend, indemnify, and hold harmless Professor Babu George and all contributors from any third-party claims, legal disputes, copyright allegations, or regulatory inquiries arising from their use or distribution of outputs generated by the platform.

---

## 🏷️ Nominative Fair Use & Trademark Attribution Notice

All product names, logos, registered trademarks, and service marks referenced throughout ScholarForge—including:
- **Google Scholar™** (Google LLC)
- **Scopus®** and **CiteScore™** (Elsevier B.V.)
- **Web of Science™** (Clarivate Analytics)
- **PubMed®** and **MEDLINE®** (U.S. National Library of Medicine / NIH)
- **IEEE Xplore®** (Institute of Electrical and Electronics Engineers)
- **IBM® SPSS®** (International Business Machines Corporation)
- **Crossref®** (Publishers International Linking Association, Inc.)
- **Nature®** (Springer Nature)
- **arXiv®** (Cornell University)
- **DOAJ** (Directory of Open Access Journals)

remain the exclusive property of their respective trademark holders. Their citation within ScholarForge is strictly for **nominative fair use** (descriptive identification of external search endpoints, bibliographic databases, and output format targets). ScholarForge is an independent scholarly initiative and is **not affiliated with, endorsed by, sponsored by, or licensed by** any of these entities.

---

## 🔬 Scientific Integrity & Synthetic Simulation Policy

All quantitative datasets, Likert scale items, Monte Carlo matrices, participant interview transcripts, and focus group dialogues generated by the **Synthetic Data Forge** are purely artificial mathematical and algorithmic simulations designed solely for methodology testing, statistical power planning, pedagogical demonstration, and pre-registration pipeline validation.

**Under no circumstances should synthetic simulation data generated by ScholarForge be submitted, published, represented, or relied upon as genuine empirical observations or human subject research.** Users are solely responsible for ensuring adherence to Committee on Publication Ethics (COPE) guidelines and Institutional Review Board (IRB) ethical standards.


## Funding Opportunity Finder

Find the tool in **Discover**, the tool finder, the proposal workbench, or the Concept Studio handoff. Describe the funding idea, applicant organisation or individual, applicant country, project location, purpose, and constraints. Edit the query before searching. Grants.gov applies applicant-category codes with unrestricted/clarification categories retained; EU and UKRI eligibility remains a source-document review. Country, project location, purpose, and constraints inform fit notes and explicit AI reviews, not verified remote eligibility filters.

Live connectors cover Grants.gov search and detailed conditions, EU public funding-topic search, and an optional UKRI recent RSS feed. Wellcome and the source portals are linked as additional official-site discovery routes; linked sites are not counted as searched. No API keys are required for these connectors. Simpler.Grants.gov is not a second independent source in this implementation.

Each API batch is bounded to 20 records per source, with explicit pagination, source counts, failures, and coverage limits. UKRI provides only recent feed leads. Source status and supplied dates are retained separately: records whose supplied dates have passed are excluded from current-result views, including when the source labels them open. Missing dates or amounts stay unknown. Local award filters use overlapping reported ranges in one currency, with no currency conversion or assumption that a programme budget is an individual award.

Retrieve Grants.gov conditions explicitly, review category conflicts and remaining country/investigator/consortium rules, retain a shortlist, and write fit notes. Changed applicant context or conditions flag notes for rechecking. Searches, results, conditions, shortlists, and notes are saved in the current project. Export the shortlist as Markdown/CSV, download all funding records as JSON, or save a brief to the binder. AI can refine terms or compare supplied records; it does not search independently, create opportunities, certify eligibility, or predict funding success.

### Running funding connectors

Both `npm run dev` and `npm run preview` include the fixed-host funding proxy. For a built local application, use Node.js 22.13+ and run:

```bash
npm run build
npm start
```

The built application is served at `http://127.0.0.1:4173/` by default. `PORT` and `SCHOLARFORGE_HOST` configure the server. A plain static-file host does not supply `/api/funding/search` and `/api/funding/detail`; deploy the Node server or provide equivalent routes. The UI reports a missing connector rather than treating it as a valid zero-result search. Upstream requests use allowlisted official hosts, bounded responses, timeouts, five-minute caching, and no applicant credentials or application-submission endpoints.

Source documentation: [Grants.gov API](https://www.grants.gov/api/api-guide), [Grants.gov API terms](https://www.grants.gov/api/terms-conditions), [EU Funding & Tenders APIs](https://ec.europa.eu/info/funding-tenders/opportunities/portal/screen/support/apis), [UKRI funding finder and feed](https://www.ukri.org/opportunity/).

### Literature relevance

Literature discovery retains every extracted topic concept, preserves explicit Boolean/phrase queries for OpenAlex and Europe PMC, and does not silently retry with shortened queries. Results are ranked by whole-word query coverage in supplied titles and abstracts, with acronym expansion and simple plural matching. Weak matches are removed and counted separately in the retrieval summary; an additional focus must also match. Title-only searches apply the relevance check to titles alone. Citation counts, DOI availability, recency, and provider-specific scores do not increase the topical-match score.

The displayed percentage is query-term coverage, not a probability of relevance. This lexical filter can miss synonyms or records with incomplete metadata and does not match Google Scholar's index or ranking. Re-run existing saved searches to apply the corrected retrieval and ranking.
