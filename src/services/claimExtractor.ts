import type { Claim, ConfidenceLevel } from '../types/citation';
import { generateAcademicSearchTiers, extractAcademicKeywords } from './academicQueryParser';

const EVIDENCE_MARKERS = [
  'studies show', 'research demonstrates', 'evidence suggests', 'demonstrated', 'demonstrates',
  'demonstrating', 'significantly', 'associated with', 'correlated with', 'caused by', 'leads to',
  'resulted in', 'found that', 'revealed', 'indicates that', 'established that', 'observed in',
  'estimated that', 'projected to', 'percent', '%', 'increase by', 'decreased by', 'doubled',
  'tripled', 'halved', 'efficacy', 'mechanism', 'pathway', 'prevalence', 'mortality',
  'incidence', 'clinical trials', 'meta-analysis', 'systematic review', 'empirical', 'statistically',
  'outperformed', 'achieved an accuracy', 'reduces', 'improves', 'causes', 'influences',
  'promotes', 'mitigates', 'inhibits', 'enhances', 'regulates', 'induces'
];

export function segmentSentences(rawText: string): { sentence: string; paragraphIndex: number; startIndex: number; endIndex: number }[] {
  const results: { sentence: string; paragraphIndex: number; startIndex: number; endIndex: number }[] = [];
  const paragraphs = rawText.split(/\n+/);
  let globalOffset = 0;

  paragraphs.forEach((paragraph, pIdx) => {
    const trimmedParagraph = paragraph.trim();
    if (!trimmedParagraph) {
      globalOffset += paragraph.length + 1;
      return;
    }

    const sentenceRegex = /[^.!?\n]+[.!?]+(?:\s+|$)|[^.!?\n]+$/g;
    let match: RegExpExecArray | null;

    while ((match = sentenceRegex.exec(paragraph)) !== null) {
      const sText = match[0].trim();
      if (sText.length > 0) {
        const start = globalOffset + match.index;
        const end = start + match[0].length;
        results.push({
          sentence: sText,
          paragraphIndex: pIdx,
          startIndex: start,
          endIndex: end,
        });
      }
    }

    globalOffset += paragraph.length + 1;
  });

  return results;
}

export function evaluateClaimNeed(sentence: string): { isClaim: boolean; confidence: ConfidenceLevel; score: number } {
  const lower = sentence.toLowerCase().trim();

  if (lower.endsWith('?') || lower.startsWith('what is') || lower.startsWith('how to') || lower.length < 25) {
    return { isClaim: false, confidence: 'low', score: 0 };
  }

  let score = 0;

  if (/\b\d+(\.\d+)?%|\b\d{4}\b|\b\d+(\.\d+)?\s*(million|billion|thousand|nm|mm|cm|kg|mg|g|hz|ghz|tb|gb|fold|times)/i.test(sentence)) {
    score += 4;
  }

  for (const marker of EVIDENCE_MARKERS) {
    if (lower.includes(marker)) {
      score += 3;
    }
  }

  if (sentence.split(/\s+/).length >= 12) {
    score += 1;
  }

  if (/alleviates|synthesized|quantum|algorithm|neural network|crispr|mitochondria|biodiversity|photosynthesis|microplastics|catalyst|epigenetic|neuroplasticity|biomarker/i.test(sentence)) {
    score += 3;
  }

  if (score >= 4) {
    return { isClaim: true, confidence: 'high', score };
  } else if (score >= 2) {
    return { isClaim: true, confidence: 'medium', score };
  } else if (score >= 1) {
    return { isClaim: true, confidence: 'low', score };
  }

  return { isClaim: false, confidence: 'low', score };
}

export function extractClaimKeywords(sentence: string): { keywords: string[]; queries: string[] } {
  const keywords = extractAcademicKeywords(sentence);
  const queries = generateAcademicSearchTiers(sentence);

  return {
    keywords: keywords.slice(0, 8),
    queries: queries.length > 0 ? queries : [sentence.slice(0, 50)],
  };
}

export function extractClaimsFromText(text: string, sensitivity: 'all' | 'moderate' | 'high' = 'moderate'): Claim[] {
  if (!text || !text.trim()) return [];

  const sentences = segmentSentences(text);
  const claims: Claim[] = [];

  sentences.forEach((item, sIdx) => {
    const evalResult = evaluateClaimNeed(item.sentence);

    let shouldInclude = false;
    if (sensitivity === 'all') {
      shouldInclude = item.sentence.split(/\s+/).length > 4;
    } else if (sensitivity === 'moderate') {
      shouldInclude = evalResult.isClaim || item.sentence.length > 45;
    } else {
      shouldInclude = evalResult.confidence === 'high' || evalResult.score >= 3;
    }

    if (shouldInclude) {
      const { keywords, queries } = extractClaimKeywords(item.sentence);

      claims.push({
        id: `claim_${Date.now()}_${sIdx}_${Math.random().toString(36).substring(2, 6)}`,
        text: item.sentence,
        rawSentence: item.sentence,
        paragraphIndex: item.paragraphIndex,
        sentenceIndex: sIdx,
        startIndex: item.startIndex,
        endIndex: item.endIndex,
        confidence: evalResult.confidence,
        keywords,
        searchQueries: queries,
        candidatePapers: [],
        selectedPaper: null,
        status: 'pending',
        isExcluded: false,
      });
    }
  });

  return claims;
}
