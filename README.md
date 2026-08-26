# ScholarForge — Unified Scholarly Intelligence & Academic Research Suite

**ScholarForge** is a unified academic research suite designed for rigorous scholarly writing, peer-reviewed reference grounding, systematic literature searching, and author career impact profiling.

---

## 🌟 Key Features

1. **Grounded Manuscript Writing & Citation Studio**:
   - Synthesize structured, 5-section academic papers with authentic in-text citations.
   - Ground unreferenced `.docx` or raw drafts by discovering and infilling verified journal articles.
   - Revise & Resubmit (R&R) overhaul engine with automated Point-by-Point Author Response Letters.

2. **Supplementary Scholarly Tools Suite**:
   - **Batch Reference & DOI Verifier**: Ingest up to 100 raw bibliography references, verify DOIs across Crossref & OpenAlex, flag retractions and predatory journal hallmarks, and export verified BibTeX.
   - **PICO Matrix & PRISMA Query Builder**: Deconstruct research questions into Population, Intervention, Comparison, and Outcome frameworks and generate targeted Boolean formulas for PubMed, Scopus, Web of Science, Google Scholar, and Cochrane.
   - **ScholarImpact Pro**: Multi-page Google Scholar profile crawler (ingesting 400+ publications), computing advanced scientometrics ($h$-index, Egghe's $g$-index, Zhang's $e$-index, Hirsch $m$-quotient, milestone tiers $i10/i20/i50/i100$, citation velocity, and Pareto concentration) and synthesizing multi-format executive CV dossiers (Tenure, Keynote, Grant Bio).
   - **Instant DOI & BibTeX Resolver**: Resolve raw DOIs into 7 international citation standards (APA 7th, MLA 9th, Chicago 17th, Harvard, IEEE, Vancouver, Nature).

3. **5 Global Secondary Research Data Registries**:
   - ClinicalTrials.gov, World Bank Open Data, Zenodo Open Science, Harvard Dataverse, and Europe PMC.

4. **Supported Citation Standards**:
   - APA 7th, MLA 9th, Chicago 17th, Harvard, IEEE, Vancouver, Nature, and BibTeX/RIS.

---

## 🚀 Quick Start (Local Development)

```bash
# Install dependencies
npm install

# Start local development server
npm run dev

# Build production bundle
npm run build
```

---

## 🌐 Deploy to GitHub Pages

1. Push this repository to your GitHub account (`git push origin main`).
2. On GitHub, navigate to **Settings** $\rightarrow$ **Pages**.
3. Under **Build and deployment** $\rightarrow$ **Source**, select **GitHub Actions**.
4. The included `.github/workflows/deploy.yml` workflow will automatically build and deploy the app to your GitHub Pages URL!

---

## ☁️ Deploy to Netlify

1. Log in to [Netlify](https://www.netlify.com/).
2. Click **Add new site** $\rightarrow$ **Import an existing project**.
3. Connect your GitHub repository.
4. Set build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
5. Click **Deploy Site**.

---

## ⚖️ Copyright & License

**Copyright © 2026 Professor Babu George. All Rights Reserved.**

*This software, its underlying architectures, scientometric formulations ($g$-index, $e$-index, $m$-quotient), dossier synthesizers, and algorithmic workflows are the proprietary intellectual property of Professor Babu George. Automated web scraping, crawling, decompilation, reverse-engineering, modification, sublicensing, extraction, or unauthorized commercial cloning of this platform or its constituent parts is strictly prohibited without prior express written consent.*
