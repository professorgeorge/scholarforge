import type { AcademicPaper } from '../types/citation';

export interface AcademicTag {
  label: string;
  category: 'methodology' | 'study_type' | 'domain';
  colorClass: string;
}

/**
 * Extracts methodology, study type, and domain tags from paper metadata.
 */
export function extractAcademicTags(paper: AcademicPaper): AcademicTag[] {
  const text = `${paper.title} ${paper.abstract} ${paper.venue}`.toLowerCase();
  const tags: AcademicTag[] = [];

  // Methodology & Design
  if (/\b(meta-analysis|meta analysis|systematic review|prisma)\b/i.test(text)) {
    tags.push({
      label: '#MetaAnalysis',
      category: 'methodology',
      colorClass: 'bg-purple-100 text-purple-800 dark:bg-purple-950/50 dark:text-purple-300 border-purple-200 dark:border-purple-800',
    });
  } else if (/\b(randomized controlled trial|rct|clinical trial|double-blind)\b/i.test(text)) {
    tags.push({
      label: '#RCT',
      category: 'methodology',
      colorClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    });
  } else if (/\b(survey|questionnaire|cross-sectional|sample of \d+|surveyed)\b/i.test(text)) {
    tags.push({
      label: '#Survey',
      category: 'methodology',
      colorClass: 'bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    });
  } else if (/\b(qualitative|semi-structured|phenomenolog|grounded theory|thematic analysis)\b/i.test(text)) {
    tags.push({
      label: '#Qualitative',
      category: 'methodology',
      colorClass: 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    });
  } else if (/\b(case study|case series|field study)\b/i.test(text)) {
    tags.push({
      label: '#CaseStudy',
      category: 'methodology',
      colorClass: 'bg-teal-100 text-teal-800 dark:bg-teal-950/50 dark:text-teal-300 border-teal-200 dark:border-teal-800',
    });
  } else if (/\b(empirical|experiments?|experimental results?|dataset|observations?)\b/i.test(text)) {
    tags.push({
      label: '#Empirical',
      category: 'study_type',
      colorClass: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
    });
  }

  // Synthesis & Frameworks
  if (/\b(framework|conceptual model|theoretical foundations?|taxonomy|ontology)\b/i.test(text)) {
    tags.push({
      label: '#Framework',
      category: 'study_type',
      colorClass: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950/50 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800',
    });
  }

  // Domain specializations
  if (/\b(deep learning|neural network|transformer|large language model|llm|generative ai|gpt)\b/i.test(text)) {
    tags.push({
      label: '#AI-ML',
      category: 'domain',
      colorClass: 'bg-sky-100 text-sky-800 dark:bg-sky-950/50 dark:text-sky-300 border-sky-200 dark:border-sky-800',
    });
  }

  // Limit to maximum 3 relevant tags to avoid clutter
  return tags.slice(0, 3);
}
