import type { 
  AcademicPaper, 
  Author, 
  CitationOptions, 
  CitationStyle, 
  CitationStyleInfo, 
  Claim 
} from '../types/citation';

export const CITATION_STYLES: CitationStyleInfo[] = [
  {
    id: 'apa',
    name: 'APA 7th Edition',
    shortName: 'APA 7',
    category: 'Author-Date',
    inTextExample: '(Vaswani et al., 2017)',
    referenceExample: 'Vaswani, A., Shazeer, N., & Parmar, N. (2017). Attention is all you need. Advances in Neural Information Processing Systems, 30, 5998–6008.',
    description: 'American Psychological Association style, standard in social sciences, psychology, health sciences, and education.',
  },
  {
    id: 'mla',
    name: 'MLA 9th Edition',
    shortName: 'MLA 9',
    category: 'Author-Date',
    inTextExample: '(Vaswani et al.)',
    referenceExample: 'Vaswani, Ashish, et al. "Attention Is All You Need." Advances in Neural Information Processing Systems, vol. 30, 2017, pp. 5998–6008.',
    description: 'Modern Language Association style, standard in humanities, literature, linguistics, and cultural studies.',
  },
  {
    id: 'chicago',
    name: 'Chicago 17th (Author-Date)',
    shortName: 'Chicago',
    category: 'Author-Date',
    inTextExample: '(Vaswani et al. 2017)',
    referenceExample: 'Vaswani, Ashish, Noam Shazeer, and Niki Parmar. 2017. "Attention Is All You Need." Advances in Neural Information Processing Systems 30: 5998–6008.',
    description: 'Chicago Manual of Style (Author-Date), common in physical sciences, social sciences, and history.',
  },
  {
    id: 'harvard',
    name: 'Harvard Referencing',
    shortName: 'Harvard',
    category: 'Author-Date',
    inTextExample: '(Vaswani et al., 2017)',
    referenceExample: 'Vaswani, A., Shazeer, N. and Parmar, N. (2017) \'Attention is all you need\', Advances in Neural Information Processing Systems, 30, pp. 5998–6008.',
    description: 'Widely used academic author-date citation style across UK, Australian, and international universities.',
  },
  {
    id: 'ieee',
    name: 'IEEE Standards',
    shortName: 'IEEE',
    category: 'Numeric',
    inTextExample: '[1]',
    referenceExample: '[1] A. Vaswani, N. Shazeer, and N. Parmar, "Attention is all you need," Adv. Neural Inf. Process. Syst., vol. 30, pp. 5998–6008, 2017, doi: 10.5555/3295222.3295349.',
    description: 'Institute of Electrical and Electronics Engineers numeric style for engineering, computer science, and tech fields.',
  },
  {
    id: 'vancouver',
    name: 'Vancouver Style',
    shortName: 'Vancouver',
    category: 'Numeric',
    inTextExample: '(1)',
    referenceExample: '1. Vaswani A, Shazeer N, Parmar N. Attention is all you need. Adv Neural Inf Process Syst. 2017;30:5998-6008.',
    description: 'Uniform Requirements style for medical, biomedical, health, and clinical science journals.',
  },
  {
    id: 'nature',
    name: 'Nature Publishing Group',
    shortName: 'Nature',
    category: 'Numeric',
    inTextExample: '¹',
    referenceExample: '1. Vaswani, A. et al. Attention is all you need. Adv. Neural Inf. Process. Syst. 30, 5998–6008 (2017).',
    description: 'Standard format used across Nature journals and high-impact physical/biological sciences.',
  },
  {
    id: 'bibtex',
    name: 'BibTeX Citation Keys',
    shortName: 'BibTeX',
    category: 'Code',
    inTextExample: '\\cite{vaswani2017attention}',
    referenceExample: '@article{vaswani2017attention,\n  title={Attention is all you need},\n  author={Vaswani, Ashish and Shazeer, Noam},\n  year={2017}\n}',
    description: 'LaTeX/BibTeX citation keys and formatted bibliography entries for academic typesetting.',
  },
];

function formatAuthorApa(author: Author): string {
  if (author.familyName && author.givenName) {
    const initials = author.givenName
      .split(/\s+/)
      .map((n) => `${n[0]?.toUpperCase()}.`)
      .join(' ');
    return `${author.familyName}, ${initials}`;
  }
  return author.name;
}

function formatAuthorMla(author: Author, isFirst = true): string {
  if (author.familyName && author.givenName) {
    return isFirst ? `${author.familyName}, ${author.givenName}` : `${author.givenName} ${author.familyName}`;
  }
  return author.name;
}

/**
 * Generate in-text citation string.
 */
export function formatInTextCitation(
  paper: AcademicPaper,
  style: CitationStyle,
  citationNumber = 1,
  _options?: Partial<CitationOptions>
): string {
  const authors = paper.authors || [];
  const year = paper.year || 'n.d.';
  const firstAuthor = authors[0]?.familyName || authors[0]?.name || 'Anonymous';
  const secondAuthor = authors[1]?.familyName || authors[1]?.name;

  switch (style) {
    case 'apa':
      if (authors.length === 0) return `(Anonymous, ${year})`;
      if (authors.length === 1) return `(${firstAuthor}, ${year})`;
      if (authors.length === 2) return `(${firstAuthor} & ${secondAuthor}, ${year})`;
      return `(${firstAuthor} et al., ${year})`;

    case 'mla':
      if (authors.length === 0) return `(Anonymous)`;
      if (authors.length === 1) return `(${firstAuthor})`;
      if (authors.length === 2) return `(${firstAuthor} and ${secondAuthor})`;
      return `(${firstAuthor} et al.)`;

    case 'chicago':
      if (authors.length === 0) return `(Anonymous ${year})`;
      if (authors.length === 1) return `(${firstAuthor} ${year})`;
      if (authors.length === 2) return `(${firstAuthor} and ${secondAuthor} ${year})`;
      return `(${firstAuthor} et al. ${year})`;

    case 'harvard':
      if (authors.length === 0) return `(Anonymous, ${year})`;
      if (authors.length === 1) return `(${firstAuthor}, ${year})`;
      if (authors.length === 2) return `(${firstAuthor} and ${secondAuthor}, ${year})`;
      return `(${firstAuthor} et al., ${year})`;

    case 'ieee':
      return `[${citationNumber}]`;

    case 'vancouver':
      return `(${citationNumber})`;

    case 'nature':
      const superscripts = ['⁰', '¹', '²', '³', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹'];
      const numStr = String(citationNumber)
        .split('')
        .map((d) => superscripts[parseInt(d, 10)] || d)
        .join('');
      return numStr;

    case 'bibtex':
      return `\\cite{${generateBibtexKey(paper)}}`;

    default:
      return `(${firstAuthor}, ${year})`;
  }
}

/**
 * Generate a clean reference entry in plain text (WITHOUT raw markdown asterisks).
 */
export function formatReferenceEntryPlain(
  paper: AcademicPaper,
  style: CitationStyle,
  citationNumber = 1,
  options?: Partial<CitationOptions>
): string {
  const authors = paper.authors || [];
  const year = paper.year || 'n.d.';
  const title = paper.title.trim();
  const venue = paper.venue.trim();
  const doi = paper.doi ? (paper.doi.startsWith('http') ? paper.doi : `https://doi.org/${paper.doi}`) : '';
  const includeDoi = options?.includeDoi ?? true;

  switch (style) {
    case 'apa': {
      let authorStr = 'Anonymous';
      if (authors.length === 1) {
        authorStr = formatAuthorApa(authors[0]);
      } else if (authors.length === 2) {
        authorStr = `${formatAuthorApa(authors[0])}, & ${formatAuthorApa(authors[1])}`;
      } else if (authors.length > 2 && authors.length <= 20) {
        const allExceptLast = authors.slice(0, -1).map(formatAuthorApa).join(', ');
        authorStr = `${allExceptLast}, & ${formatAuthorApa(authors[authors.length - 1])}`;
      } else if (authors.length > 20) {
        const first19 = authors.slice(0, 19).map(formatAuthorApa).join(', ');
        authorStr = `${first19}, ... ${formatAuthorApa(authors[authors.length - 1])}`;
      }

      const volIssue = paper.volume ? (paper.issue ? `, ${paper.volume}(${paper.issue})` : `, ${paper.volume}`) : '';
      const pages = paper.pages ? `, ${paper.pages}` : '';
      const doiStr = includeDoi && doi ? ` ${doi}` : '';

      return `${authorStr} (${year}). ${title}. ${venue}${volIssue}${pages}.${doiStr}`;
    }

    case 'mla': {
      let authorStr = 'Anonymous';
      if (authors.length === 1) {
        authorStr = `${formatAuthorMla(authors[0], true)}.`;
      } else if (authors.length === 2) {
        authorStr = `${formatAuthorMla(authors[0], true)}, and ${formatAuthorMla(authors[1], false)}.`;
      } else if (authors.length > 2) {
        authorStr = `${formatAuthorMla(authors[0], true)}, et al.`;
      }

      const volStr = paper.volume ? `, vol. ${paper.volume}` : '';
      const noStr = paper.issue ? `, no. ${paper.issue}` : '';
      const pages = paper.pages ? `, pp. ${paper.pages}` : '';
      const doiStr = includeDoi && doi ? `, ${doi}` : '.';

      return `${authorStr} "${title}." ${venue}${volStr}${noStr}, ${year}${pages}${doiStr}`;
    }

    case 'chicago': {
      let authorStr = 'Anonymous';
      if (authors.length === 1) {
        authorStr = `${formatAuthorMla(authors[0], true)}`;
      } else if (authors.length === 2) {
        authorStr = `${formatAuthorMla(authors[0], true)}, and ${formatAuthorMla(authors[1], false)}`;
      } else if (authors.length > 2) {
        authorStr = `${formatAuthorMla(authors[0], true)}, et al.`;
      }

      const volIssue = paper.volume ? ` ${paper.volume}${paper.issue ? ` (${paper.issue})` : ''}` : '';
      const pages = paper.pages ? `: ${paper.pages}` : '';
      const doiStr = includeDoi && doi ? ` ${doi}` : '';

      return `${authorStr}. ${year}. "${title}." ${venue}${volIssue}${pages}.${doiStr}`;
    }

    case 'harvard': {
      let authorStr = 'Anonymous';
      if (authors.length === 1) {
        authorStr = formatAuthorApa(authors[0]);
      } else if (authors.length === 2) {
        authorStr = `${formatAuthorApa(authors[0])} and ${formatAuthorApa(authors[1])}`;
      } else if (authors.length > 2) {
        authorStr = `${formatAuthorApa(authors[0])} et al.`;
      }

      const volIssue = paper.volume ? `, ${paper.volume}${paper.issue ? `(${paper.issue})` : ''}` : '';
      const pages = paper.pages ? `, pp. ${paper.pages}` : '';
      const doiStr = includeDoi && doi ? ` Available at: ${doi}` : '';

      return `${authorStr} (${year}) '${title}', ${venue}${volIssue}${pages}.${doiStr}`;
    }

    case 'ieee': {
      const authorList = authors
        .map((a) => {
          if (a.familyName && a.givenName) {
            const initials = a.givenName.split(/\s+/).map((n) => `${n[0]?.toUpperCase()}.`).join(' ');
            return `${initials} ${a.familyName}`;
          }
          return a.name;
        })
        .join(', ');

      const authorStr = authorList || 'Anonymous';
      const volStr = paper.volume ? `, vol. ${paper.volume}` : '';
      const noStr = paper.issue ? `, no. ${paper.issue}` : '';
      const pages = paper.pages ? `, pp. ${paper.pages}` : '';
      const doiStr = includeDoi && doi ? `, doi: ${paper.doi || doi}` : '.';

      return `[${citationNumber}] ${authorStr}, "${title}," ${venue}${volStr}${noStr}${pages}, ${year}${doiStr}`;
    }

    case 'vancouver': {
      const authorList = authors
        .slice(0, 6)
        .map((a) => {
          if (a.familyName && a.givenName) {
            const initials = a.givenName.split(/\s+/).map((n) => n[0]?.toUpperCase() || '').join('');
            return `${a.familyName} ${initials}`;
          }
          return a.name;
        })
        .join(', ');

      const authorStr = authorList ? (authors.length > 6 ? `${authorList}, et al.` : authorList) : 'Anonymous';
      const volIssue = paper.volume ? `${paper.volume}${paper.issue ? `(${paper.issue})` : ''}` : '';
      const pages = paper.pages ? `:${paper.pages}` : '';
      const doiStr = includeDoi && doi ? ` Available from: ${doi}` : '';

      return `${citationNumber}. ${authorStr}. ${title}. ${venue}. ${year};${volIssue}${pages}.${doiStr}`;
    }

    case 'nature': {
      const authorStr =
        authors.length === 0
          ? 'Anonymous'
          : authors.length === 1
          ? formatAuthorApa(authors[0])
          : `${formatAuthorApa(authors[0])} et al.`;

      const volStr = paper.volume ? ` ${paper.volume}` : '';
      const pages = paper.pages ? `, ${paper.pages}` : '';

      return `${citationNumber}. ${authorStr} ${title}. ${venue}${volStr}${pages} (${year}).`;
    }

    case 'bibtex': {
      return generateBibtexEntry(paper);
    }

    default:
      return `${paper.authors[0]?.name || 'Anonymous'} (${year}). ${title}. ${venue}.`;
  }
}

/**
 * Generate a rich HTML formatted reference entry with proper <i>, <b>, and <a> tags for Word/Docs.
 */
export function formatReferenceEntryHtml(
  paper: AcademicPaper,
  style: CitationStyle,
  citationNumber = 1,
  options?: Partial<CitationOptions>
): string {
  const authors = paper.authors || [];
  const year = paper.year || 'n.d.';
  const title = paper.title.trim();
  const venue = paper.venue.trim();
  const doi = paper.doi ? (paper.doi.startsWith('http') ? paper.doi : `https://doi.org/${paper.doi}`) : '';
  const includeDoi = options?.includeDoi ?? true;
  const doiLink = doi ? `<a href="${doi}" style="color: #004499; text-decoration: underline;">${doi}</a>` : '';

  switch (style) {
    case 'apa': {
      let authorStr = 'Anonymous';
      if (authors.length === 1) {
        authorStr = formatAuthorApa(authors[0]);
      } else if (authors.length === 2) {
        authorStr = `${formatAuthorApa(authors[0])}, & ${formatAuthorApa(authors[1])}`;
      } else if (authors.length > 2 && authors.length <= 20) {
        const allExceptLast = authors.slice(0, -1).map(formatAuthorApa).join(', ');
        authorStr = `${allExceptLast}, & ${formatAuthorApa(authors[authors.length - 1])}`;
      } else if (authors.length > 20) {
        const first19 = authors.slice(0, 19).map(formatAuthorApa).join(', ');
        authorStr = `${first19}, ... ${formatAuthorApa(authors[authors.length - 1])}`;
      }

      const volIssue = paper.volume ? (paper.issue ? `, <i>${paper.volume}</i>(${paper.issue})` : `, <i>${paper.volume}</i>`) : '';
      const pages = paper.pages ? `, ${paper.pages}` : '';
      const doiStr = includeDoi && doi ? ` ${doiLink}` : '';

      return `${authorStr} (${year}). ${title}. <i>${venue}</i>${volIssue}${pages}.${doiStr}`;
    }

    case 'mla': {
      let authorStr = 'Anonymous';
      if (authors.length === 1) {
        authorStr = `${formatAuthorMla(authors[0], true)}.`;
      } else if (authors.length === 2) {
        authorStr = `${formatAuthorMla(authors[0], true)}, and ${formatAuthorMla(authors[1], false)}.`;
      } else if (authors.length > 2) {
        authorStr = `${formatAuthorMla(authors[0], true)}, et al.`;
      }

      const volStr = paper.volume ? `, vol. ${paper.volume}` : '';
      const noStr = paper.issue ? `, no. ${paper.issue}` : '';
      const pages = paper.pages ? `, pp. ${paper.pages}` : '';
      const doiStr = includeDoi && doi ? `, ${doiLink}` : '.';

      return `${authorStr} "${title}." <i>${venue}</i>${volStr}${noStr}, ${year}${pages}${doiStr}`;
    }

    case 'chicago': {
      let authorStr = 'Anonymous';
      if (authors.length === 1) {
        authorStr = `${formatAuthorMla(authors[0], true)}`;
      } else if (authors.length === 2) {
        authorStr = `${formatAuthorMla(authors[0], true)}, and ${formatAuthorMla(authors[1], false)}`;
      } else if (authors.length > 2) {
        authorStr = `${formatAuthorMla(authors[0], true)}, et al.`;
      }

      const volIssue = paper.volume ? ` ${paper.volume}${paper.issue ? ` (${paper.issue})` : ''}` : '';
      const pages = paper.pages ? `: ${paper.pages}` : '';
      const doiStr = includeDoi && doi ? ` ${doiLink}` : '';

      return `${authorStr}. ${year}. "${title}." <i>${venue}</i>${volIssue}${pages}.${doiStr}`;
    }

    case 'harvard': {
      let authorStr = 'Anonymous';
      if (authors.length === 1) {
        authorStr = formatAuthorApa(authors[0]);
      } else if (authors.length === 2) {
        authorStr = `${formatAuthorApa(authors[0])} and ${formatAuthorApa(authors[1])}`;
      } else if (authors.length > 2) {
        authorStr = `${formatAuthorApa(authors[0])} et al.`;
      }

      const volIssue = paper.volume ? `, ${paper.volume}${paper.issue ? `(${paper.issue})` : ''}` : '';
      const pages = paper.pages ? `, pp. ${paper.pages}` : '';
      const doiStr = includeDoi && doi ? ` Available at: ${doiLink}` : '';

      return `${authorStr} (${year}) '${title}', <i>${venue}</i>${volIssue}${pages}.${doiStr}`;
    }

    case 'ieee': {
      const authorList = authors
        .map((a) => {
          if (a.familyName && a.givenName) {
            const initials = a.givenName.split(/\s+/).map((n) => `${n[0]?.toUpperCase()}.`).join(' ');
            return `${initials} ${a.familyName}`;
          }
          return a.name;
        })
        .join(', ');

      const authorStr = authorList || 'Anonymous';
      const volStr = paper.volume ? `, vol. ${paper.volume}` : '';
      const noStr = paper.issue ? `, no. ${paper.issue}` : '';
      const pages = paper.pages ? `, pp. ${paper.pages}` : '';
      const doiStr = includeDoi && doi ? `, doi: ${doiLink}` : '.';

      return `[${citationNumber}] ${authorStr}, "${title}," <i>${venue}</i>${volStr}${noStr}${pages}, ${year}${doiStr}`;
    }

    case 'vancouver': {
      const authorList = authors
        .slice(0, 6)
        .map((a) => {
          if (a.familyName && a.givenName) {
            const initials = a.givenName.split(/\s+/).map((n) => n[0]?.toUpperCase() || '').join('');
            return `${a.familyName} ${initials}`;
          }
          return a.name;
        })
        .join(', ');

      const authorStr = authorList ? (authors.length > 6 ? `${authorList}, et al.` : authorList) : 'Anonymous';
      const volIssue = paper.volume ? `${paper.volume}${paper.issue ? `(${paper.issue})` : ''}` : '';
      const pages = paper.pages ? `:${paper.pages}` : '';
      const doiStr = includeDoi && doi ? ` Available from: ${doiLink}` : '';

      return `${citationNumber}. ${authorStr}. ${title}. <i>${venue}</i>. ${year};${volIssue}${pages}.${doiStr}`;
    }

    case 'nature': {
      const authorStr =
        authors.length === 0
          ? 'Anonymous'
          : authors.length === 1
          ? formatAuthorApa(authors[0])
          : `${formatAuthorApa(authors[0])} et al.`;

      const volStr = paper.volume ? ` <b>${paper.volume}</b>` : '';
      const pages = paper.pages ? `, ${paper.pages}` : '';

      return `${citationNumber}. ${authorStr} ${title}. <i>${venue}</i>${volStr}${pages} (${year}).`;
    }

    case 'bibtex': {
      return `<pre style="font-family: Consolas, monospace; font-size: 10pt; background: #f4f4f4; padding: 8px; border-radius: 4px;">${generateBibtexEntry(paper)}</pre>`;
    }

    default:
      return `${paper.authors[0]?.name || 'Anonymous'} (${year}). ${title}. <i>${venue}</i>.`;
  }
}

export function generateBibtexKey(paper: AcademicPaper): string {
  const firstAuthor = (paper.authors[0]?.familyName || paper.authors[0]?.name || 'cite')
    .toLowerCase()
    .replace(/[^\w]/g, '');
  const year = paper.year || '2024';
  const firstWord = (paper.title || 'work')
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .find((w) => w.length > 3 && !['with', 'from', 'that', 'this', 'study', 'impact'].includes(w)) || 'paper';

  return `${firstAuthor}${year}${firstWord}`;
}

export function generateBibtexEntry(paper: AcademicPaper): string {
  const key = generateBibtexKey(paper);
  const authors = paper.authors.map((a) => a.name).join(' and ') || 'Anonymous';
  const year = paper.year || '2024';
  const title = paper.title.replace(/[{}]/g, '');
  const venue = paper.venue.replace(/[{}]/g, '');

  return `@article{${key},
  title = {${title}},
  author = {${authors}},
  journal = {${venue}},
  year = {${year}},${paper.volume ? `\n  volume = {${paper.volume}},` : ''}${paper.issue ? `\n  number = {${paper.issue}},` : ''}${paper.pages ? `\n  pages = {${paper.pages}},` : ''}${paper.doi ? `\n  doi = {${paper.doi}},` : ''}${paper.url ? `\n  url = {${paper.url}}` : ''}
}`;
}

export function generateRisEntry(paper: AcademicPaper): string {
  const lines: string[] = [
    'TY  - JOUR',
    `TI  - ${paper.title.replace(/\n+/g, ' ').trim()}`,
  ];
  for (const author of paper.authors) {
    lines.push(`AU  - ${author.name}`);
  }
  lines.push(`PY  - ${paper.year || 2024}`);
  lines.push(`JO  - ${paper.venue}`);
  if (paper.volume) lines.push(`VL  - ${paper.volume}`);
  if (paper.issue) lines.push(`IS  - ${paper.issue}`);
  if (paper.pages) lines.push(`SP  - ${paper.pages}`);
  if (paper.doi) lines.push(`DO  - ${paper.doi}`);
  if (paper.url) lines.push(`UR  - ${paper.url}`);
  if (paper.abstract) lines.push(`AB  - ${paper.abstract.replace(/\n+/g, ' ')}`);
  lines.push('ER  - ');
  return lines.join('\r\n');
}

export function exportToRis(papers: AcademicPaper[]): string {
  return papers.map((p) => generateRisEntry(p)).join('\r\n\r\n');
}

/**
 * Builds annotated document with in-text citations and compiled bibliography.
 */
export function buildAnnotatedDocument(
  originalText: string,
  claims: Claim[],
  options: CitationOptions
): {
  annotatedText: string;
  bibliography: string[];
  bibliographyHtml: string[];
  uniquePapers: AcademicPaper[];
  inTextMap: Map<string, string>;
} {
  const activeClaims = claims.filter((c) => !c.isExcluded && c.selectedPaper !== null);

  const uniquePapers: AcademicPaper[] = [];
  const paperIndexMap = new Map<string, number>();

  activeClaims.forEach((claim) => {
    const paper = claim.selectedPaper!;
    const paperKey = paper.doi || paper.id || paper.title;
    if (!paperIndexMap.has(paperKey)) {
      uniquePapers.push(paper);
      paperIndexMap.set(paperKey, uniquePapers.length);
    }
    claim.citationNumber = paperIndexMap.get(paperKey);
  });

  const inTextMap = new Map<string, string>();
  activeClaims.forEach((claim) => {
    const citation = formatInTextCitation(
      claim.selectedPaper!,
      options.style,
      claim.citationNumber || 1,
      options
    );
    inTextMap.set(claim.id, citation);
  });

  let annotatedText = originalText;
  const sortedClaims = [...activeClaims].sort((a, b) => b.startIndex - a.startIndex);

  for (const claim of sortedClaims) {
    const inTextCit = inTextMap.get(claim.id);
    if (!inTextCit) continue;

    const sentence = claim.rawSentence.trim();
    const lastPunctuation = sentence.match(/[.!?]$/);
    const punctuationChar = lastPunctuation ? lastPunctuation[0] : '';
    const sentenceBody = punctuationChar ? sentence.slice(0, -1) : sentence;

    let replacement: string;
    if (options.style === 'nature') {
      replacement = `${sentence}${inTextCit}`;
    } else {
      replacement = `${sentenceBody} ${inTextCit}${punctuationChar}`;
    }

    if (annotatedText.includes(sentence)) {
      annotatedText = annotatedText.replace(sentence, replacement);
    }
  }

  let bibliography: string[] = [];
  let bibliographyHtml: string[] = [];

  if (options.style === 'bibtex') {
    bibliography = uniquePapers.map((paper) => generateBibtexEntry(paper));
    bibliographyHtml = bibliography.map((entry) => `<pre style="font-family: Consolas, monospace; font-size: 9.5pt; background: #f8fafc; border: 1px solid #e2e8f0; padding: 10px; border-radius: 6px;">${entry}</pre>`);
  } else if (['apa', 'mla', 'chicago', 'harvard'].includes(options.style)) {
    const sortedAlphabetical = [...uniquePapers].sort((a, b) => {
      const authA = a.authors[0]?.familyName || a.authors[0]?.name || '';
      const authB = b.authors[0]?.familyName || b.authors[0]?.name || '';
      return authA.localeCompare(authB);
    });

    bibliography = sortedAlphabetical.map((paper, idx) =>
      formatReferenceEntryPlain(paper, options.style, idx + 1, options)
    );
    bibliographyHtml = sortedAlphabetical.map((paper, idx) =>
      formatReferenceEntryHtml(paper, options.style, idx + 1, options)
    );
  } else {
    bibliography = uniquePapers.map((paper, idx) =>
      formatReferenceEntryPlain(paper, options.style, idx + 1, options)
    );
    bibliographyHtml = uniquePapers.map((paper, idx) =>
      formatReferenceEntryHtml(paper, options.style, idx + 1, options)
    );
  }

  return {
    annotatedText,
    bibliography,
    bibliographyHtml,
    uniquePapers,
    inTextMap,
  };
}

/**
 * Compiles full markdown document with title, text, and references.
 */
export function exportToMarkdown(
  originalText: string,
  claims: Claim[],
  options: CitationOptions
): string {
  const { annotatedText, bibliography } = buildAnnotatedDocument(originalText, claims, options);

  const styleInfo = CITATION_STYLES.find((s) => s.id === options.style);
  const refHeader = options.style === 'mla' ? '## Works Cited' : '## References';

  if (options.style === 'bibtex') {
    return `${annotatedText}\n\n${refHeader}\n\n\`\`\`bibtex\n${bibliography.join('\n\n')}\n\`\`\``;
  }

  return `${annotatedText}\n\n${refHeader}\n\n${bibliography.map((r) => `- ${r}`).join('\n')}\n\n---\n*Citations generated via Citation Filler (${styleInfo?.name || 'Academic'})*`;
}

/**
 * Compiles Microsoft Word-compliant HTML document with proper styles, italics, hanging indents, and headers.
 * Opens seamlessly in Microsoft Word with perfect academic layout and formatting.
 */
export function exportToWordHtml(
  originalText: string,
  claims: Claim[],
  options: CitationOptions
): string {
  const { annotatedText, bibliographyHtml } = buildAnnotatedDocument(originalText, claims, options);
  const paragraphs = annotatedText.split(/\n\n+/).filter((p) => p.trim());
  const refHeader = options.style === 'mla' ? 'Works Cited' : 'References';
  const isAuthorDate = ['apa', 'mla', 'chicago', 'harvard'].includes(options.style);

  return `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
<meta charset="utf-8">
<title>Cited Academic Document</title>
<!--[if gte mso 9]>
<xml>
 <w:WordDocument>
  <w:View>Print</w:View>
  <w:Zoom>100</w:Zoom>
  <w:DoNotOptimizeForBrowser/>
 </w:WordDocument>
</xml>
<![endif]-->
<style>
  @page {
    size: 8.5in 11in;
    margin: 1.0in 1.0in 1.0in 1.0in;
    mso-header-margin: 0.5in;
    mso-footer-margin: 0.5in;
  }
  body {
    font-family: 'Times New Roman', Times, serif;
    font-size: 12.0pt;
    line-height: 2.0; /* Standard academic double spacing */
    color: #000000;
    margin: 0;
    padding: 0;
  }
  p.MsoNormal, p {
    font-family: 'Times New Roman', Times, serif;
    font-size: 12.0pt;
    line-height: 2.0;
    margin-top: 0in;
    margin-bottom: 0in;
    text-align: justify;
    text-indent: 0.5in; /* Standard paragraph first line indent */
  }
  h2.section-header {
    font-family: 'Times New Roman', Times, serif;
    font-size: 12.0pt;
    font-weight: bold;
    text-align: center;
    margin-top: 24.0pt;
    margin-bottom: 12.0pt;
    text-indent: 0in;
    page-break-before: always;
  }
  /* Academic Hanging Indent for APA, MLA, Chicago, Harvard */
  p.hanging-indent {
    font-family: 'Times New Roman', Times, serif;
    font-size: 12.0pt;
    line-height: 2.0;
    margin-top: 0in;
    margin-bottom: 12.0pt;
    text-align: left;
    margin-left: 0.5in;
    text-indent: -0.5in;
  }
  /* Numbered References for IEEE, Vancouver, Nature */
  p.numbered-reference {
    font-family: 'Times New Roman', Times, serif;
    font-size: 12.0pt;
    line-height: 1.5;
    margin-top: 0in;
    margin-bottom: 8.0pt;
    text-align: left;
    margin-left: 0.3in;
    text-indent: -0.3in;
  }
  i, em {
    font-style: italic;
  }
  b, strong {
    font-weight: bold;
  }
  a {
    color: #004499;
    text-decoration: underline;
  }
</style>
</head>
<body>

  <!-- Academic Manuscript Body -->
  ${paragraphs.map((p) => {
    const trimmed = p.trim();
    if (trimmed.startsWith('# ')) {
      return `<h1 style="font-family: 'Times New Roman', Times, serif; font-size: 16.0pt; font-weight: bold; text-align: center; margin-top: 12.0pt; margin-bottom: 18.0pt; text-indent: 0in;">${trimmed.slice(2)}</h1>`;
    }
    if (trimmed.startsWith('## ')) {
      return `<h2 style="font-family: 'Times New Roman', Times, serif; font-size: 13.0pt; font-weight: bold; margin-top: 20.0pt; margin-bottom: 8.0pt; text-indent: 0in;">${trimmed.slice(3)}</h2>`;
    }
    if (trimmed.startsWith('### Abstract') || trimmed.startsWith('### ')) {
      return `<h3 style="font-family: 'Times New Roman', Times, serif; font-size: 12.0pt; font-weight: bold; text-align: center; margin-top: 14.0pt; margin-bottom: 6.0pt; text-indent: 0in; text-transform: uppercase;">${trimmed.replace(/^###\s*/, '')}</h3>`;
    }
    if (trimmed === '---') {
      return `<hr style="border: 0; border-top: 1px solid #999999; margin: 18.0pt 0;" />`;
    }
    if (trimmed.startsWith('**Keywords:') || trimmed.startsWith('Keywords:')) {
      return `<p style="font-family: 'Times New Roman', Times, serif; font-size: 11.0pt; font-style: italic; margin-bottom: 14.0pt; text-indent: 0in;">${trimmed.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')}</p>`;
    }
    if (trimmed.startsWith('**Background') || trimmed.startsWith('**Objective') || trimmed.startsWith('**Methodology') || trimmed.startsWith('**Results') || trimmed.startsWith('**Significance')) {
      return `<div style="margin: 12.0pt 0.5in; padding: 6.0pt 0; font-style: normal; text-align: justify; font-size: 11.0pt; line-height: 1.6;">${trimmed.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')}</div>`;
    }
    return `<p class="MsoNormal">${trimmed.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')}</p>`;
  }).join('\n\n')}

  <!-- References Section Heading -->
  <h2 class="section-header">${refHeader}</h2>

  <!-- Formatted Reference Entries -->
  <div class="references-list">
    ${bibliographyHtml
      .map((ref) => `<p class="${isAuthorDate ? 'hanging-indent' : 'numbered-reference'}">${ref}</p>`)
      .join('\n\n')}
  </div>

</body>
</html>`;
}

/**
 * Formats a Point-by-Point Author Response Letter into a Microsoft Word (.doc) HTML document.
 */
export function exportRebuttalToWordHtml(letterText: string, _manuscriptTitle = 'Manuscript'): string {
  const paragraphs = letterText.split(/\n\n+/).filter((p) => p.trim());

  return `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
<meta charset="utf-8">
<title>Point-by-Point Author Response Letter</title>
<style>
  @page {
    size: 8.5in 11in;
    margin: 1.0in;
  }
  body {
    font-family: 'Times New Roman', Times, serif;
    font-size: 11.5pt;
    line-height: 1.5;
    color: #000000;
  }
  h1 {
    font-size: 15pt;
    font-weight: bold;
    text-align: center;
    margin-bottom: 12pt;
  }
  h2 {
    font-size: 13pt;
    font-weight: bold;
    border-bottom: 1px solid #333333;
    padding-bottom: 4pt;
    margin-top: 18pt;
    margin-bottom: 8pt;
  }
  h3 {
    font-size: 12pt;
    font-weight: bold;
    margin-top: 12pt;
    margin-bottom: 4pt;
  }
  blockquote {
    margin: 6pt 0.4in;
    padding: 6pt 10pt;
    background: #f4f6f8;
    border-left: 3px solid #1e3a8a;
    font-style: italic;
  }
  p {
    margin-top: 4pt;
    margin-bottom: 8pt;
    text-align: justify;
  }
  b, strong {
    font-weight: bold;
  }
</style>
</head>
<body>
  ${paragraphs.map((p) => {
    const trimmed = p.trim();
    if (trimmed.startsWith('# ')) return `<h1>${trimmed.slice(2)}</h1>`;
    if (trimmed.startsWith('## ')) return `<h2>${trimmed.slice(3)}</h2>`;
    if (trimmed.startsWith('### ')) return `<h3>${trimmed.slice(4)}</h3>`;
    if (trimmed.startsWith('> ')) {
      return `<blockquote>${trimmed.slice(2).replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')}</blockquote>`;
    }
    if (trimmed === '---') return `<hr style="border: 0; border-top: 1px solid #cccccc; margin: 12pt 0;" />`;
    return `<p>${trimmed.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')}</p>`;
  }).join('\n\n')}
</body>
</html>`;
}
