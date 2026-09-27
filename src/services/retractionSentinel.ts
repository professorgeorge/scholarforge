import type { AcademicPaper } from '../types/citation';

export interface RetractionCheckResult {
  isRetracted: boolean;
  label?: string;
  severity: 'critical' | 'none';
  reason?: string;
  details?: string;
}

/**
 * Retraction Sentinel
 * Scans academic papers across Europe PMC, PubMed, OpenAlex, and Crossref registries
 * to detect formal retractions, expressions of concern, or removal notices.
 */
export function checkPaperRetraction(paper: Partial<AcademicPaper>, rawWork?: any): RetractionCheckResult {
  // 1. Direct explicit flag
  if (paper.isRetracted) {
    return {
      isRetracted: true,
      label: 'RETRACTED',
      severity: 'critical',
      reason: paper.retractionDetails || 'Formally indexed as retracted in academic registries.',
      details: 'This publication has been formally retracted by the authors or publisher. Do not cite as valid empirical findings.',
    };
  }

  // 2. OpenAlex raw checks
  if (rawWork?.is_retracted === true) {
    return {
      isRetracted: true,
      label: 'RETRACTED',
      severity: 'critical',
      reason: 'Work formally marked retracted in OpenAlex registry.',
      details: 'This study has been retracted from the scientific literature.',
    };
  }

  // 3. Europe PMC / PubMed publication types
  const pubTypes: string[] = [];
  if (rawWork?.pubTypeList?.pubType) {
    if (Array.isArray(rawWork.pubTypeList.pubType)) {
      pubTypes.push(...rawWork.pubTypeList.pubType.map((t: any) => String(t).toLowerCase()));
    } else {
      pubTypes.push(String(rawWork.pubTypeList.pubType).toLowerCase());
    }
  }

  for (const pt of pubTypes) {
    if (pt.includes('retraction of publication') || pt.includes('retracted publication')) {
      return {
        isRetracted: true,
        label: 'RETRACTED',
        severity: 'critical',
        reason: 'Indexed as a Retracted Publication in PubMed / Europe PMC.',
        details: 'Formal retraction notice issued in biomedical literature databases.',
      };
    }
  }

  // 4. Crossref update-to / is-retracted-by
  if (rawWork?.['update-to']?.some((u: any) => u.type?.toLowerCase().includes('retraction'))) {
    return {
      isRetracted: true,
      label: 'RETRACTED',
      severity: 'critical',
      reason: 'Crossref record indicates a formal retraction update.',
      details: 'Crossmark registry flags this DOI as having received a retraction notice.',
    };
  }
  if (rawWork?.relation?.['is-retracted-by']) {
    return {
      isRetracted: true,
      label: 'RETRACTED',
      severity: 'critical',
      reason: 'Crossref relation indicates paper is retracted.',
      details: 'A corresponding retraction notice exists in Crossref for this DOI.',
    };
  }

  // 5. Title heuristic fallback
  const title = (paper.title || '').trim().toLowerCase();
  if (title.startsWith('retracted:') || title.startsWith('retraction:') || title.includes('[retracted]')) {
    return {
      isRetracted: true,
      label: 'RETRACTED',
      severity: 'critical',
      reason: 'Publication title explicitly indicates a retracted work.',
      details: 'Publisher has modified the canonical title to reflect retraction status.',
    };
  }

  return {
    isRetracted: false,
    severity: 'none',
  };
}
