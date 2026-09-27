import { callRawLLM, type LLMConfig, DEFAULT_LLM_CONFIG } from './llmService';
import type { AcademicPaper } from '../types/citation';
import type { PicoQueryState } from './picoQueryService';
import type { ReviewerCandidate, EmailTemplate, SearchObjective } from '../types/expertSearch';
import type { OutreachTone } from './outreachGenerator';

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
  if (config.provider === 'ollama') return true;
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
