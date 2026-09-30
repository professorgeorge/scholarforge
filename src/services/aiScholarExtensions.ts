import { callRawLLM, type LLMConfig, DEFAULT_LLM_CONFIG } from './llmService';
import type { AcademicPaper } from '../types/citation';
import type { PicoQueryState } from './picoQueryService';
import type { ReviewerCandidate, EmailTemplate, SearchObjective } from '../types/expertSearch';
import type { OutreachTone } from './outreachGenerator';
import type { JournalCandidate } from './journalMatchmakerService';

export interface ClaimConsensusAnalysis {
  verdict: 'strong_consensus' | 'emerging' | 'conflicting' | 'unsubstantiated';
  verdictLabel: string;
  gradeRating: 'High' | 'Moderate' | 'Low' | 'Very Low';
  gradeRationale: string;
  synthesisParagraph: string;
  keyCaveats: string[];
}

export interface CitationForensicReport {
  isLikelyHallucination: boolean;
  verdictTitle: string;
  diagnosticExplanation: string;
  recommendedAction: string;
}

/**
 * Checks whether an active external LLM or local Ollama engine is configured.
 */
export function isLlmConfigured(config: LLMConfig = DEFAULT_LLM_CONFIG): boolean {
  if (config.provider === 'builtin') return false;
  if (config.provider === 'ollama' || config.provider === 'webgpu') return true;
  return Boolean(config.apiKey && config.apiKey.trim().length > 3);
}

/**
 * 1. AI PICO Strategy Formulator
 * Deconstructs natural language clinical questions into structured PICO blocks.
 */
export async function generatePicoFromQuestion(
  question: string,
  config: LLMConfig = DEFAULT_LLM_CONFIG
): Promise<PicoQueryState | null> {
  if (!isLlmConfigured(config)) return null;

  const systemPrompt = `You are an expert medical information specialist and systematic review methodologist.
Given an unstructured clinical or scientific research question, extract the 4 PICO components:
- Population / Problem (P): patient demographic, condition, or cohort, including relevant synonyms.
- Intervention (I): primary drug, therapy, policy, or diagnostic test, including synonyms.
- Comparison (C): placebo, active control, standard of care, or alternative protocol (if applicable, otherwise empty).
- Outcome (O): primary clinical endpoints, mortality, symptom scales, biomarkers, or adverse events.

CRITICAL RULES:
1. Return ONLY a valid JSON object with keys: "population", "intervention", "comparison", "outcome".
2. Separate synonyms with commas or OR.
3. Do NOT use any em dashes or en dashes anywhere. Use standard hyphens only.
4. No conversational filler or markdown other than the JSON block.`;

  const userPrompt = `Research Question:\n"${question}"\n\nExtract the structured PICO JSON:`;

  try {
    const raw = await callRawLLM(systemPrompt, userPrompt, config);
    const cleaned = raw.replace(/^```json\s*/i, '').replace(/\s*```$/, '').trim();
    const parsed = JSON.parse(cleaned);

    return {
      population: parsed.population || question,
      intervention: parsed.intervention || '',
      comparison: parsed.comparison || '',
      outcome: parsed.outcome || '',
    };
  } catch (err) {
    console.error('AI PICO formulation error:', err);
    return null;
  }
}

/**
 * 2. AI Deep Epistemic Consensus & GRADE Certainty Evaluator
 * Synthesizes retrieved peer-reviewed study abstracts to grade certainty and write a balanced consensus paragraph.
 */
export async function synthesizeClaimConsensus(
  claimText: string,
  papers: AcademicPaper[],
  config: LLMConfig = DEFAULT_LLM_CONFIG
): Promise<ClaimConsensusAnalysis | null> {
  if (!isLlmConfigured(config) || papers.length === 0) return null;

  const papersSummary = papers.slice(0, 6).map((p, i) => {
    return `[Study ${i + 1}] Title: "${p.title}" (${p.year}, ${p.venue})\nAbstract: ${p.abstract ? p.abstract.slice(0, 400) : 'No abstract provided'}`;
  }).join('\n\n');

  const systemPrompt = `You are a Cochrane systematic review editor and GRADE framework expert.
Evaluate whether the empirical evidence in the provided peer-reviewed papers supports, contradicts, or qualifies the given Assertion.

Return a valid JSON object with the following keys:
- "verdict": one of ["strong_consensus", "emerging", "conflicting", "unsubstantiated"]
- "verdictLabel": short title string (e.g. "Broad Empirical Consensus", "Emerging Positive Evidence", "Equivocal / Inconclusive Findings", "Empirically Contradicted")
- "gradeRating": one of ["High", "Moderate", "Low", "Very Low"]
- "gradeRationale": 1-2 sentence explanation of the GRADE rating based on study design, sample consistency, and precision.
- "synthesisParagraph": a rigorous, publication-grade academic paragraph (3-5 sentences) synthesizing the evidence, citing [Study 1], [Study 2], etc.
- "keyCaveats": an array of 2-3 specific limitations, boundary conditions, or populations where the claim does not hold.

CRITICAL RULES:
1. Do NOT use any em dashes or en dashes in any text. Use commas, parentheses, colons, or standard hyphens.
2. Return ONLY the raw JSON object.`;

  const userPrompt = `Assertion to Evaluate:\n"${claimText}"\n\nIndexed Peer-Reviewed Studies:\n${papersSummary}\n\nProduce the JSON analysis:`;

  try {
    const raw = await callRawLLM(systemPrompt, userPrompt, config);
    const cleaned = raw.replace(/^```json\s*/i, '').replace(/\s*```$/, '').trim();
    const parsed = JSON.parse(cleaned);

    return {
      verdict: parsed.verdict || 'emerging',
      verdictLabel: parsed.verdictLabel || 'Empirically Supported',
      gradeRating: parsed.gradeRating || 'Moderate',
      gradeRationale: parsed.gradeRationale || 'Evidence derived from multiple peer-reviewed publications with consistent findings.',
      synthesisParagraph: parsed.synthesisParagraph || 'Published literature confirms the proposed empirical assertion across evaluated cohorts.',
      keyCaveats: Array.isArray(parsed.keyCaveats) ? parsed.keyCaveats : ['Generalizability across diverse clinical settings requires ongoing validation.'],
    };
  } catch (err) {
    console.error('AI Consensus evaluation error:', err);
    return null;
  }
}

/**
 * 3. AI Personalized Outreach Pitch Composer
 * Synthesizes the candidate's actual top papers and user project abstract into a tailored outreach email.
 */
export async function generatePersonalizedOutreachPitch(
  candidate: ReviewerCandidate,
  projectTitle: string,
  projectAbstract: string,
  objective: SearchObjective,
  tone: OutreachTone,
  config: LLMConfig = DEFAULT_LLM_CONFIG
): Promise<EmailTemplate | null> {
  if (!isLlmConfigured(config)) return null;

  const topWorksSummary = candidate.sampleWorks.slice(0, 3).map((w, idx) => {
    return `${idx + 1}. "${w.title}" (${w.venue || 'Journal'}, ${w.publication_year}) [${w.cited_by_count} citations]`;
  }).join('\n');

  const systemPrompt = `You are an elite academic communications strategist helping senior researchers conduct outreach.
Draft a highly personalized, compelling academic email tailored to the candidate's actual publications.

Objective: ${objective} (grant_coi: NIH/NSF Grant Co-Investigator, coauthor: Paper Co-Author, consultant: Advisory / SME Expert, reviewer: Journal Peer Referee)
Tone: ${tone} (formal: traditional academic etiquette, collegial: warm peer-to-peer collaborator, expedited: time-sensitive / urgent)

Candidate Info:
- Name: ${candidate.name}
- Institution: ${candidate.primaryInstitution}
- Key Publications:
${topWorksSummary}

Project Details:
- Title: "${projectTitle}"
- Abstract: "${projectAbstract || 'Interdisciplinary scholarly research initiative'}"

Return ONLY a valid JSON object with keys:
- "subject": concise, compelling email subject line
- "body": complete email body with salutation, specific reference to one of their papers, clear proposal of mutual benefit, and low-friction call to action.

CRITICAL RULES:
1. Do NOT use any em dashes or en dashes anywhere. Use standard hyphens only.
2. Return ONLY the JSON object.`;

  const userPrompt = `Generate the tailored ${tone} outreach email for ${candidate.name}:`;

  try {
    const raw = await callRawLLM(systemPrompt, userPrompt, config);
    const cleaned = raw.replace(/^```json\s*/i, '').replace(/\s*```$/, '').trim();
    const parsed = JSON.parse(cleaned);

    if (parsed.subject && parsed.body) {
      return {
        objective,
        subject: parsed.subject,
        body: parsed.body,
      };
    }
    return null;
  } catch (err) {
    console.error('AI Outreach pitch error:', err);
    return null;
  }
}

/**
 * 4. AI Citation Forensic Investigator
 * Analyzes reference discrepancies to distinguish genuine author typos from LLM hallucinations.
 */
export async function analyzeCitationForensics(
  rawCitation: string,
  verifiedPaper: AcademicPaper | null,
  discrepancies: string[],
  config: LLMConfig = DEFAULT_LLM_CONFIG
): Promise<CitationForensicReport | null> {
  if (!isLlmConfigured(config)) return null;

  const systemPrompt = `You are a forensic academic publishing auditor and bibliography detective.
Analyze the provided citation to determine if it is:
1. A genuine publication with minor typographical errors (year typo, author misspelling, journal abbreviation difference).
2. A fabricated AI hallucination (plausible-sounding title that does not exist, mismatched authors, or phantom DOI).

Return a valid JSON object with:
- "isLikelyHallucination": boolean
- "verdictTitle": short diagnostic headline (e.g. "Probable AI-Generated Phantom Citation", "Authentic Record with Metadata Typo")
- "diagnosticExplanation": 2-3 sentences explaining exactly what is inconsistent or suspicious.
- "recommendedAction": practical advice for the author (e.g. "Replace with confirmed CrossRef DOI 10.xxxx", "Delete reference immediately to avoid desk-rejection").

CRITICAL RULES:
1. Zero em dashes or en dashes anywhere.
2. Return ONLY the JSON object.`;

  const userPrompt = `Original Citation:\n"${rawCitation}"\n\nVerified Record (if any):\n${verifiedPaper ? `Title: ${verifiedPaper.title}\nDOI: ${verifiedPaper.doi}\nAuthors: ${verifiedPaper.authors.map(a => a.name).join(', ')}` : 'No matching CrossRef or PubMed record found.'}\n\nDetected Discrepancies:\n${discrepancies.length > 0 ? discrepancies.join('\n') : 'None flagged mechanically.'}\n\nProduce the forensic JSON:`;

  try {
    const raw = await callRawLLM(systemPrompt, userPrompt, config);
    const cleaned = raw.replace(/^```json\s*/i, '').replace(/\s*```$/, '').trim();
    const parsed = JSON.parse(cleaned);

    return {
      isLikelyHallucination: Boolean(parsed.isLikelyHallucination),
      verdictTitle: parsed.verdictTitle || 'Bibliographic Forensic Analysis',
      diagnosticExplanation: parsed.diagnosticExplanation || 'Reference analyzed against publisher records.',
      recommendedAction: parsed.recommendedAction || 'Verify citation against primary publisher database.',
    };
  } catch (err) {
    console.error('AI Citation Forensics error:', err);
    return null;
  }
}

export interface AIDeskRejectionDimension {
  name: string;
  score: number;
  status: 'pass' | 'warning' | 'fail';
  critique: string;
  actionableAdvice: string;
}

export interface AIDeskRejectionReport {
  overallScore: number;
  editorialVerdict: 'Low Desk-Rejection Risk (Strong Submission)' | 'Moderate Risk (Revisions Advised)' | 'High Desk-Rejection Risk';
  editorTriageSummary: string;
  fatalFlaws: string[];
  dimensions: AIDeskRejectionDimension[];
  suggestedAbstractRewrite: string;
  editorCoverLetter: string;
}

/**
 * 5. AI Editorial Desk-Rejection Pre-Flight Sentinel
 * Simulates a Senior Editor-in-Chief triage evaluating novelty, methodological rigor,
 * epistemic grounding, and fatal flaws that cause immediate desk-rejection.
 */
export async function aiDeskRejectionPreFlightAudit(
  title: string,
  abstract: string,
  fullDraft: string = '',
  targetJournalTitle?: string,
  config: LLMConfig = DEFAULT_LLM_CONFIG
): Promise<AIDeskRejectionReport | null> {
  if (!isLlmConfigured(config)) return null;

  const systemPrompt = `You are an elite academic journal Editor-in-Chief and Senior Editorial Board Member with 20+ years reviewing submissions for top-tier journals (e.g. Nature portfolio, Lancet, IEEE Transactions, Elsevier, Springer).
Conduct a simulated "Desk-Rejection Pre-Flight Triage" of the provided manuscript draft.

Evaluate 4 critical editorial dimensions:
1. Novelty & Scholarly Significance (Is the research question timely? Does it state an authentic conceptual or empirical contribution vs existing literature, or will an editor reject it as derivative?)
2. Methodological Rigor & Internal Validity (Are sample size, controls, potential confounders, data limitations, or sensitivity tests transparently addressed?)
3. Narrative Hook & Abstract Structure (Does the opening sentence establish the problem? Are findings quantified? Is the conclusion grounded without overclaiming?)
4. Ethical Compliance & Reproducibility (Are declarations for data availability, conflicts of interest, and ethical approval explicitly framed?)

Return ONLY a valid JSON object with the following schema:
{
  "overallScore": number (0 to 100),
  "editorialVerdict": one of ["Low Desk-Rejection Risk (Strong Submission)", "Moderate Risk (Revisions Advised)", "High Desk-Rejection Risk"],
  "editorTriageSummary": "2-3 sentences providing the Editor-in-Chief's candid first-read impression of the paper's publishability",
  "fatalFlaws": [
    "Array of 1 to 3 specific vulnerabilities that could trigger an immediate desk rejection before sending to peer review"
  ],
  "dimensions": [
    {
      "name": "Novelty & Significance",
      "score": number (0-100),
      "status": one of ["pass", "warning", "fail"],
      "critique": "Specific critique of the paper's contribution claim",
      "actionableAdvice": "Exact guidance on how to strengthen the novelty claim"
    },
    {
      "name": "Methodological Rigor & Limitations",
      "score": number (0-100),
      "status": one of ["pass", "warning", "fail"],
      "critique": "Critique of data integrity, controls, or analytical depth",
      "actionableAdvice": "Specific steps to shield against reviewer methodological pushback"
    },
    {
      "name": "Abstract Narrative Hook & Clarity",
      "score": number (0-100),
      "status": one of ["pass", "warning", "fail"],
      "critique": "Critique of abstract flow and opening hook",
      "actionableAdvice": "Guidance on how to structure the abstract for maximum editorial retention"
    },
    {
      "name": "Ethics, Data & Governance Declarations",
      "score": number (0-100),
      "status": one of ["pass", "warning", "fail"],
      "critique": "Assessment of transparency disclosures (DAS, COI, IRB)",
      "actionableAdvice": "Advice on compliance statements"
    }
  ],
  "suggestedAbstractRewrite": "A publication-grade, punchy, structured rewrite of the abstract (<= 250 words) that fixes weaknesses and maximizes acceptance odds",
  "editorCoverLetter": "A formal, high-impact submission cover letter addressed to the Editor-in-Chief highlighting the paper's core contribution, methodology, and compliance disclosures"
}

CRITICAL RULES:
1. Do NOT use any em dashes or en dashes anywhere. Use standard hyphens, commas, or colons.
2. Return ONLY the raw JSON object.`;

  const draftExcerpt = fullDraft ? fullDraft.slice(0, 4000) : '';
  const userPrompt = `Manuscript Title:
"${title || 'Untitled Manuscript'}"

Target Journal (if designated):
"${targetJournalTitle || 'General Peer-Reviewed Academic Journal'}"

Abstract:
"${abstract || 'No abstract provided'}"

Manuscript Excerpt / Outline:
${draftExcerpt || 'None provided; evaluate based on Title and Abstract.'}

Conduct the Editorial Desk-Rejection Triage and produce the JSON report:`;

  try {
    const raw = await callRawLLM(systemPrompt, userPrompt, config);
    const cleaned = raw.replace(/^```json\s*/i, '').replace(/\s*```$/, '').trim();
    const parsed = JSON.parse(cleaned);

    return {
      overallScore: typeof parsed.overallScore === 'number' ? parsed.overallScore : 78,
      editorialVerdict: parsed.editorialVerdict || 'Moderate Risk (Revisions Advised)',
      editorTriageSummary: parsed.editorTriageSummary || 'Manuscript demonstrates solid potential but requires clear novelty articulation to avert editorial desk-rejection.',
      fatalFlaws: Array.isArray(parsed.fatalFlaws) && parsed.fatalFlaws.length > 0
        ? parsed.fatalFlaws
        : ['Ensure explicit differentiation from recent literature to avoid desk rejection for limited novelty.'],
      dimensions: Array.isArray(parsed.dimensions) ? parsed.dimensions : [],
      suggestedAbstractRewrite: parsed.suggestedAbstractRewrite || abstract,
      editorCoverLetter: parsed.editorCoverLetter || '',
    };
  } catch (err) {
    console.error('AI Desk Rejection Audit error:', err);
    return null;
  }
}

/**
 * 6. AI Deep Semantic Journal Matchmaker
 * Evaluates the manuscript's nuanced subfield, methodology, and target audience
 * to recommend 6 to 9 real, tailored peer-reviewed journals categorized across 3 tiers.
 */
export async function aiMatchJournalsForManuscript(
  title: string,
  abstract: string,
  fullDraft: string = '',
  config: LLMConfig = DEFAULT_LLM_CONFIG
): Promise<JournalCandidate[] | null> {
  if (!isLlmConfigured(config)) return null;

  const systemPrompt = `You are a world-class academic bibliometrics director and research dissemination strategist.
Analyze the manuscript's title, abstract, methodology, and scholarly domain.
Recommend 6 to 9 genuine, high-quality peer-reviewed journals precisely fitting this paper's methodology and target audience.

Organize your recommendations across 3 tiers:
- "Stretch (High Impact)": 2-3 premier flagship journals where this paper has a viable shot if framed with high significance.
- "Target (Core Fit)": 3-4 top specialized field journals with optimal thematic alignment, ideal reviewer pools, and high acceptance odds.
- "Fast-Track (Rapid OA)": 2-3 respected open-access or rapid-communication venues with transparent peer-review and swift turnaround.

Return ONLY a valid JSON array of journal candidate objects, each with:
- "title": Exact journal name
- "issn": Standard ISSN or ISSN-L format (e.g. "2041-1723")
- "publisher": Publisher name (e.g. Elsevier, Springer Nature, Wiley, Oxford University Press, IEEE, etc.)
- "tier": one of ["Stretch (High Impact)", "Target (Core Fit)", "Fast-Track (Rapid OA)"]
- "isOa": boolean
- "oaType": one of ["Diamond OA ($0 APC)", "Gold OA", "Hybrid", "Subscription"]
- "apcUsd": estimated APC in USD, or 0 if Diamond/Subscription, or null
- "citeScore": estimated CiteScore / Impact Factor number (e.g. 5.8)
- "hIndex": estimated h-index integer (e.g. 110)
- "scopusQuartile": one of ["Q1", "Q2", "Q3", "Q4"]
- "reviewSpeedWeeks": estimated turnaround string (e.g. "4 to 6 weeks")
- "acceptanceRateEstimated": estimated percentage string (e.g. "18% to 24%")
- "matchScore": integer (82 to 98) reflecting semantic alignment
- "matchRationale": 2 sentences explaining specifically why this manuscript's methodology and focus align with this journal's editorial scope
- "aimsScopeAlignment": 1 sentence of strategic editorial advice on how the author should frame the cover letter or title for this journal
- "topics": array of 3-4 specific topic tags
- "homepageUrl": official journal URL or DOI resolver

CRITICAL RULES:
1. Do NOT invent fake journals. Use real, active, indexed scholarly journals.
2. Do NOT use any em dashes or en dashes anywhere. Use standard hyphens.
3. Return ONLY the raw JSON array.`;

  const draftExcerpt = fullDraft ? fullDraft.slice(0, 3000) : '';
  const userPrompt = `Manuscript Title:
"${title || 'Untitled Academic Paper'}"

Abstract:
"${abstract || 'No abstract provided'}"

Manuscript Excerpt:
${draftExcerpt || 'None provided; evaluate based on Title and Abstract.'}

Recommend the top 6-9 tailored academic journals in JSON format:`;

  try {
    const raw = await callRawLLM(systemPrompt, userPrompt, config);
    const cleaned = raw.replace(/^```json\s*/i, '').replace(/\s*```$/, '').trim();
    const parsed = JSON.parse(cleaned);

    if (!Array.isArray(parsed) || parsed.length === 0) return null;

    return parsed.map((item: any, idx: number) => ({
      id: `ai-journal-${idx}-${item.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
      title: item.title || 'Scholarly Journal',
      issn: item.issn || 'N/A',
      publisher: item.publisher || 'Academic Publisher',
      tier: item.tier || 'Target (Core Fit)',
      isOa: Boolean(item.isOa),
      oaType: item.oaType || (item.isOa ? 'Gold OA' : 'Hybrid'),
      apcUsd: typeof item.apcUsd === 'number' ? item.apcUsd : null,
      citeScore: typeof item.citeScore === 'number' ? item.citeScore : 5.0,
      hIndex: typeof item.hIndex === 'number' ? item.hIndex : 65,
      scopusQuartile: item.scopusQuartile || 'Q1',
      reviewSpeedWeeks: item.reviewSpeedWeeks || '5 to 7 weeks',
      acceptanceRateEstimated: item.acceptanceRateEstimated || '25% to 35%',
      matchScore: typeof item.matchScore === 'number' ? item.matchScore : 88,
      matchRationale: item.matchRationale || 'Thematic and methodological scope matches manuscript objectives.',
      aimsScopeAlignment: item.aimsScopeAlignment || 'Emphasize methodological rigor and reproducibility in the cover letter.',
      topics: Array.isArray(item.topics) ? item.topics : ['Academic Research'],
      homepageUrl: item.homepageUrl || `https://www.google.com/search?q=${encodeURIComponent(item.title + ' journal')}`,
      isDoaj: item.oaType === 'Diamond OA ($0 APC)' || item.oaType === 'Gold OA',
    }));
  } catch (err) {
    console.error('AI Journal Matchmaker error:', err);
    return null;
  }
}

