# Optional AI assistance across ScholarForge

A shared review layer gives all fifteen utilities a consistent connection and invocation flow while retaining native AI actions and deterministic tools.

| Utility | Native assistance retained | Optional review tasks |
| --- | --- | --- |
| Research Applications Studio | Editable application cards and brief export | Develop bounded practical applications; critique finding-to-action assumptions |
| Null Findings & Counterevidence | Multi-source discovery, reference imports, and quoted evidence review | Improve neutral counter-searches; review supplied interpretations without equating non-significance with no effect |
| Measurement & Instrument Finder | Candidate discovery, measurement collection links, and profile comparison | Compare supplied measurement evidence; plan adaptation and validation checks without inventing items or permissions |
| Literature search | Synthesis from selected records | Improve search concepts and source-specific query drafts; compare supplied records and abstracts |
| PICO strategy | Question-to-PICO generation | Critique concepts and synonyms; draft database-specific queries for checking |
| Methodology Compass | Design advisor and analysis guidance | Critique design coherence; explain assumptions, diagnostics, and sensitivity checks |
| Synthetic Data Forge | Parameter suggestions and artificial qualitative material | Review simulation settings; explain calculated diagnostics without inventing unsupported estimates |
| IRB preparation | Rule-based triage and document templates | Review protocol and participant-protection gaps; draft plain-language consent with placeholders |
| Manuscript Studio | Drafting, grounded revision, and reviewer-response assistance | Review argument structure; propose a focused prose revision without strengthening unsupported claims |
| Claims Workbench | Provisional source summaries and counter-search suggestions | Calibrate claim wording against supplied material; explore rival explanations and counter-searches |
| Writing utilities | Deterministic title patterns, word counting, and BibTeX cleaning | Suggest titles/running heads; shorten passages to a user-supplied budget; explain metadata problems |
| Reference audit | Optional discrepancy interpretation | Explain audit discrepancies; prepare a manual verification checklist |
| Journal submission | Optional editorial triage and submission drafting | Compare supplied candidates; draft a cover letter without inventing publisher policies or declarations |
| Anonymizer | Deterministic substitutions and change log | Review remaining identity clues; propose minimal neutral replacements without certifying anonymity |
| Scholar/reviewer discovery | Optional outreach personalization and profile assistance | Refine reviewer and conflict-check criteria; draft invitations from supplied details |

## Invocation and context

The panel starts closed, sends no request on mounting or opening, and never treats an offline template as a connected-model review. The configured-provider label is not a connection-test result. Users can open Settings directly from the panel. The standard tools remain available when no model is configured.

**Load saved tool inputs** reads an explicit allowlist from the active project's saved tool state at the time of the click. PICO concepts and reviewer-search criteria are now project-scoped so they can participate in the same flow. Relevant source metadata and abstracts are limited to six records, labelled R1–R6; these may be retrieved or saved records rather than the current transient selection. Material is visibly excerpted and editable. Users should replace the snapshot when a task requires a different passage, selection, or full text.

Automatic context preparation excludes provider settings and credentials, unrelated notes and documents, raw synthetic rows, and downloaded attachments. Identifier-bearing text in an anonymization review remains visible for user review before it is sent to the configured endpoint. Context and focus instructions have size limits. The actual task and integrity instructions are supplied alongside the visible material.

The response must follow a bounded structured format. Source identifiers outside the supplied set and malformed reviews are rejected. Text is displayed as text, not executable HTML. The model can still misunderstand supplied evidence; a valid response format does not establish factual accuracy. The latest review is retained in the current project for that tool, without making another model request when the tool is reopened. Changing the review input clears that snapshot. Reviews remain separate from native results. Copy and save-to-binder actions are explicit, and binder notes are marked as AI-generated with task/provider/time metadata.

## Existing invocation fixes

Journal matching no longer launches AI analysis automatically when a provider is configured. Its dedicated AI triage action remains available. Scholar-profile assistance has a separate opt-in; the ordinary parser and calculations continue without a connected model. Custom endpoints have a configurable chat-completions URL and optional key. Provider changes discard credentials and model settings from the previous endpoint.

## Verification

Regression checks cover all fifteen utility definitions, bounded/redacted context, omitted dataset rows, malformed responses, unsupported source IDs, explicit invocation, no requests without a configured model, preservation of unsupported simulation diagnostics, and provider-switch credential isolation. Browser checks use a local mock provider for connection, invocation, display, and binder saving. Live inference quality and network access depend on the user's selected provider and model.
