/**
 * PICO Systematic Search Strategy & Cross-Database Query Compiler
 * Ported and integrated from scholar-query-compiler / scholarcite-express.
 *
 * Compiles evidence-based PICO frameworks (Population, Intervention, Comparison, Outcome)
 * into specialized search queries for Google Scholar, PubMed, Scopus, Web of Science, and IEEE Xplore.
 */

export interface PicoQueryState {
  population: string;
  intervention: string;
  comparison: string;
  outcome: string;
  studyType?: string;
  limitYears?: number;
}

export interface CompiledDatabaseQueries {
  googleScholar: string;
  pubMed: string;
  scopus: string;
  webOfScience: string;
  ieeeXplore: string;
  openAlex: string;
  prismaSummary: string;
}

export interface PlatformSearchUrl {
  name: string;
  platform: 'googleScholar' | 'pubMed' | 'scopus' | 'webOfScience' | 'ieeeXplore';
  url: string;
  description: string;
  query: string;
}

/**
 * Parses space/comma/semicolon separated synonyms into an OR array.
 */
function parseSynonyms(input: string): string[] {
  if (!input || !input.trim()) return [];
  return input
    .split(/[,;\n]+|\s+OR\s+/i)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .map((term) => (term.includes(' ') && !term.startsWith('"') ? `"${term}"` : term));
}

/**
 * Compiles PICO parameters across premier academic search engines.
 */
export function compilePicoQueries(pico: PicoQueryState): CompiledDatabaseQueries {
  const popTerms = parseSynonyms(pico.population);
  const intTerms = parseSynonyms(pico.intervention);
  const compTerms = parseSynonyms(pico.comparison);
  const outTerms = parseSynonyms(pico.outcome);

  const activeBlocks: { key: string; terms: string[] }[] = [];
  if (popTerms.length > 0) activeBlocks.push({ key: 'Population', terms: popTerms });
  if (intTerms.length > 0) activeBlocks.push({ key: 'Intervention', terms: intTerms });
  if (compTerms.length > 0) activeBlocks.push({ key: 'Comparison', terms: compTerms });
  if (outTerms.length > 0) activeBlocks.push({ key: 'Outcome', terms: outTerms });

  // 1. Google Scholar Query (Character and token efficient, max 256 chars)
  const gsBlocks = activeBlocks.map((b) => (b.terms.length === 1 ? b.terms[0] : `(${b.terms.join(' OR ')})`));
  const googleScholar = gsBlocks.join(' AND ');

  // 2. PubMed / MEDLINE Query (Structured MeSH / Title/Abstract tags)
  const pmBlocks = activeBlocks.map((b) => {
    const formatted = b.terms.map((t) => (t.startsWith('"') ? `${t}[tiab]` : `${t}[tiab]`)).join(' OR ');
    return `(${formatted})`;
  });
  const pubMed = pmBlocks.join(' AND ');

  // 3. Scopus Query (TITLE-ABS-KEY syntax)
  const scopusBlocks = activeBlocks.map((b) => `TITLE-ABS-KEY(${b.terms.join(' OR ')})`);
  const scopus = scopusBlocks.join(' AND ');

  // 4. Web of Science Query (TS= Topic Search)
  const wosBlocks = activeBlocks.map((b) => `TS=(${b.terms.join(' OR ')})`);
  const webOfScience = wosBlocks.join(' AND ');

  // 5. IEEE Xplore Query ("Abstract":term OR "Document Title":term)
  const ieeeBlocks = activeBlocks.map((b) => `(${b.terms.map((t) => `("Abstract":${t} OR "Document Title":${t})`).join(' OR ')})`);
  const ieeeXplore = ieeeBlocks.join(' AND ');

  // 6. OpenAlex Search Phrase
  const openAlex = activeBlocks.map((b) => b.terms.map((t) => t.replace(/"/g, '')).join(' ')).join(' ');

  // 7. PRISMA Systematic Review Documentation Block
  const prismaLines = [
    `# PRISMA Systematic Search Strategy (${new Date().toLocaleDateString()})`,
    `Database Searches Executed:`,
    `- Google Scholar: ${googleScholar || 'None'}`,
    `- PubMed / MEDLINE: ${pubMed || 'None'}`,
    `- Scopus: ${scopus || 'None'}`,
    `- Web of Science: ${webOfScience || 'None'}`,
    `- IEEE Xplore: ${ieeeXplore || 'None'}`,
    ``,
    `Search Concept Matrix:`,
    `- Population / Problem (P): ${popTerms.join(', ') || 'N/A'}`,
    `- Intervention (I): ${intTerms.join(', ') || 'N/A'}`,
    `- Comparison (C): ${compTerms.join(', ') || 'N/A'}`,
    `- Outcome (O): ${outTerms.join(', ') || 'N/A'}`,
  ];

  return {
    googleScholar,
    pubMed,
    scopus,
    webOfScience,
    ieeeXplore,
    openAlex,
    prismaSummary: prismaLines.join('\n'),
  };
}

/**
 * Builds direct 1-click external launch URLs for database queries.
 */
export function buildPlatformUrls(queries: CompiledDatabaseQueries): PlatformSearchUrl[] {
  return [
    {
      name: 'Google Scholar',
      platform: 'googleScholar',
      url: `https://scholar.google.com/scholar?q=${encodeURIComponent(queries.googleScholar)}`,
      description: 'Comprehensive cross-disciplinary academic search with patent & citation indexing.',
      query: queries.googleScholar,
    },
    {
      name: 'PubMed / MEDLINE',
      platform: 'pubMed',
      url: `https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(queries.pubMed)}`,
      description: 'National Library of Medicine peer-reviewed biomedical, clinical, and life sciences literature.',
      query: queries.pubMed,
    },
    {
      name: 'Scopus (Elsevier)',
      platform: 'scopus',
      url: `https://www.scopus.com/search/form.uri?display=basic#basic`,
      description: 'Abstract and citation database covering life sciences, social sciences, and physical sciences.',
      query: queries.scopus,
    },
    {
      name: 'Web of Science (Clarivate)',
      platform: 'webOfScience',
      url: `https://www.webofscience.com/wos/woscc/basic-search`,
      description: 'Curated citation index for high-impact multidisciplinary scientific journals.',
      query: queries.webOfScience,
    },
    {
      name: 'IEEE Xplore Digital Library',
      platform: 'ieeeXplore',
      url: `https://ieeexplore.ieee.org/search/searchresult.jsp?queryText=${encodeURIComponent(queries.ieeeXplore)}`,
      description: 'Engineering, electrical, computer science, and electronics peer-reviewed publications.',
      query: queries.ieeeXplore,
    },
  ];
}

/**
 * Sample PICO presets for instant one-click demonstration.
 */
export const SAMPLE_PICO_PRESETS = [
  {
    label: 'Healthcare / Nursing Burnout (Clinical)',
    population: 'ICU nurses, critical care staff, healthcare workers',
    intervention: 'resilience training, peer support programs, mindfulness',
    comparison: 'standard staffing, conventional shifts, no intervention',
    outcome: 'burnout rates, medication errors, turnover intention, job satisfaction',
  },
  {
    label: 'AI & Large Language Models in Education (EdTech)',
    population: 'undergraduate students, higher education learners',
    intervention: 'generative AI tutors, ChatGPT pedagogical assistants, adaptive LLMs',
    comparison: 'traditional lecture instruction, static textbooks',
    outcome: 'conceptual comprehension, critical thinking, exam performance, retention',
  },
  {
    label: 'Renewable Energy & Grid Stability (Engineering)',
    population: 'distributed power grids, microgrids, renewable networks',
    intervention: 'solid-state battery storage, deep reinforcement learning dispatch',
    comparison: 'fossil-fuel spinning reserves, static load scheduling',
    outcome: 'frequency stability, carbon emissions, operational curtailment, cost',
  },
];
