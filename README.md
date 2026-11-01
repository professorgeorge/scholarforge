# ScholarForge

A local research workspace connecting literature discovery, study design, evidence, writing, and submission preparation.

Developed by Professor Babu George.

## Start

Use Node.js 22.13 or newer (Node.js 24 is used in CI).

```bash
npm ci
npm run dev
```

Open **Project workspace** above the active manuscript to create or switch projects. Existing manuscript, cart, and binder content is copied into the first project. Legacy originals are retained.

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

The suite retains twelve utilities organized in four stages:

| Stage | Utilities |
|---|---|
| Discover | Federated literature search; PICO strategy builder |
| Design & Data | Methodology Compass; Synthetic Data Forge; IRB preparation |
| Draft & Ground | Manuscript Studio; Claims Workbench; writing utilities |
| Audit & Publish | Reference audit; journal discovery; anonymizer; scholar/reviewer finder |

The command palette, research cart, binder, citation styles, and local or external model configuration remain available.

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

