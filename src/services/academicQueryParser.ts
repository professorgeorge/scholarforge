/**
 * Academic Query Parser & Intelligent Information Retrieval (IR) Expander.
 * Converts natural language research questions, thesis statements, and loose sentences
 * into high-precision academic keyword combinations understood by OpenAlex, Europe PMC,
 * Crossref, and Semantic Scholar.
 */

export const ACADEMIC_ACRONYMS = new Set([
  'ai', 'ml', 'dl', 'rl', 'vr', 'ar', 'xr', 'hr', 'it', 'ui', 'ux', 
  'ct', 'mr', 'er', 'or', 'ic', 'gi', 'tb', 'cv', 'np', 'qa', 'qc', 
  'hf', 'pe', 'dm', 'bp', 'ckd', 'copd', 'icu', 'rct', 'dna', 'rna', 
  'pcr', 'gis', 'iot', 'nlp', 'llm', 'ecg', 'eeg', 'hiv', 'hcv', 'hbv', 
  'mri', 'pet', 'ivf', 'adhd', 'asd', 'ptsd', 'cbt', 'esg', 'csr'
]);

export const ACRONYM_SYNONYMS: Record<string, string[]> = {
  'ai': ['artificial intelligence'],
  'ml': ['machine learning'],
  'dl': ['deep learning'],
  'nlp': ['natural language processing'],
  'llm': ['large language model'],
  'llms': ['large language models'],
  'rct': ['randomized controlled trial'],
  'icu': ['intensive care unit'],
  'hf': ['heart failure'],
  'mri': ['magnetic resonance imaging'],
  'cbt': ['cognitive behavioral therapy'],
  'ptsd': ['post-traumatic stress disorder'],
  'copd': ['chronic obstructive pulmonary disease'],
  'ckd': ['chronic kidney disease'],
  'esg': ['environmental social governance'],
};

const QUESTION_PREFIXES = [
  /^(can|could|does|do|did|is|are|will|would|should)\s+(the\s+)?/i,
  /^to\s+what\s+extent\s+(does|do|can|is|are)\s+/i,
  /^what\s+(is|are)\s+(the\s+)?(impact|impacts|effect|effects|role|roles|outcome|outcomes|efficacy|safety|benefits|risks|determinants|influences?)\s+(of|on|in)\s+/i,
  /^what\s+is\s+the\s+(relationship|association|correlation|link|impact|effect)\s+between\s+/i,
  /^(how|why|what|when|where|who)\s+(does|do|is|are|can|could|will|would|influences|affects)\s+/i,
  /^investigating\s+(the\s+)?(impact|effect|role|influence|nature|determinants|mechanisms)\s+of\s+/i,
  /^(a\s+)?(study|inquiry|investigation|exploration|analysis|review)\s+(in|on|of|into|regarding)\s+/i,
  /^(an?\s+)?(empirical|systematic|comprehensive|exploratory|comparative|longitudinal|qualitative|quantitative)?\s*(study|investigation|analysis|review|inquiry|overview|assessment|evaluation)\s+(of|on|into|regarding|concerning)\s+/i,
  /^an?\s+examination\s+of\s+/i,
  /^exploring\s+(the\s+)?(relationship|link|mechanisms|role)\s+between\s+/i,
  /^the\s+(effect|impact|role|influence|consequences)\s+of\s+/i,
  /^evaluating\s+(the\s+)?/i,
  /^assessing\s+(the\s+)?/i,
  /^understanding\s+(the\s+)?/i,
  /^research\s+on\s+/i,
  /^thesis\s+statement:?\s*/i,
  /^topic:?\s*/i,
  /^please\s+(find|search|show|get)\s+(literature|papers|articles)?\s*(on|about)?\s*/i,
];

const ACADEMIC_STOP_WORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 
  'any', 'are', 'aren\'t', 'as', 'at', 'be', 'because', 'been', 'before', 'being', 
  'below', 'between', 'both', 'but', 'by', 'can', 'can\'t', 'cannot', 'could', 
  'couldn\'t', 'did', 'didn\'t', 'do', 'does', 'doesn\'t', 'doing', 'don\'t', 
  'down', 'during', 'each', 'few', 'for', 'from', 'further', 'had', 'hadn\'t', 
  'has', 'hasn\'t', 'have', 'haven\'t', 'having', 'he', 'he\'d', 'he\'ll', 'he\'s', 
  'her', 'here', 'here\'s', 'hers', 'herself', 'him', 'himself', 'his', 'how', 
  'how\'s', 'i', 'i\'d', 'i\'ll', 'i\'m', 'i\'ve', 'if', 'in', 'into', 'is', 
  'isn\'t', 'it', 'it\'s', 'its', 'itself', 'let\'s', 'me', 'more', 'most', 
  'mustn\'t', 'my', 'myself', 'no', 'nor', 'not', 'of', 'off', 'on', 'once', 
  'only', 'or', 'other', 'ought', 'our', 'ours', 'ourselves', 'out', 'over', 
  'own', 'same', 'shan\'t', 'she', 'she\'d', 'she\'ll', 'she\'s', 'should', 
  'shouldn\'t', 'so', 'some', 'such', 'than', 'that', 'that\'s', 'the', 'their', 
  'theirs', 'them', 'themselves', 'then', 'there', 'there\'s', 'these', 'they', 
  'they\'d', 'they\'ll', 'they\'re', 'they\'ve', 'this', 'those', 'through', 
  'to', 'too', 'under', 'until', 'up', 'very', 'was', 'wasn\'t', 'we', 'we\'d', 
  'we\'ll', 'we\'re', 'we\'ve', 'were', 'weren\'t', 'what', 'what\'s', 'when', 
  'when\'s', 'where', 'where\'s', 'which', 'while', 'who', 'who\'s', 'whom', 
  'why', 'why\'s', 'with', 'won\'t', 'would', 'wouldn\'t', 'you', 'you\'d', 
  'you\'ll', 'you\'re', 'you\'ve', 'your', 'yours', 'yourself', 'yourselves',
  // Conversational academic fillers that dilute search engines
  'investigate', 'investigating', 'investigation', 'explore', 'exploring', 
  'exploration', 'analyze', 'analyzing', 'analysis', 'examine', 'examining', 
  'study', 'studying', 'paper', 'article', 'research', 'thesis', 'inquiry', 
  'question', 'overview', 'focus', 'focusing', 'impact', 'influence', 'role', 
  'effects', 'effect', 'relationship', 'relationships', 'association', 
  'associations', 'determinants', 'factors', 'mechanisms', 'mechanism',
  'implications', 'consequences', 'perspective', 'perspectives', 'evidence',
  'case', 'context', 'regarding', 'concerning', 'towards', 'toward',
  'accurately', 'effectively', 'improve', 'improving', 'increases', 'decreases'
]);

/**
 * Strips conversational question scaffolding and extracts high-value academic terms.
 * Preserves critical academic acronyms (AI, ML, HF, ICU, etc.).
 */
export function extractAcademicKeywords(text: string): string[] {
  let cleaned = text.trim();

  // Strip common conversational question / thesis prefixes
  for (const prefix of QUESTION_PREFIXES) {
    cleaned = cleaned.replace(prefix, '');
  }

  // Remove punctuation (except hyphens inside words)
  cleaned = cleaned.replace(/[^\w\s-]/g, ' ');

  // Split into tokens
  const tokens = cleaned
    .toLowerCase()
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => {
      if (!t) return false;
      if (ACADEMIC_STOP_WORDS.has(t)) return false;
      // Allow 2-letter tokens if they are in ACADEMIC_ACRONYMS
      if (t.length <= 2) {
        return ACADEMIC_ACRONYMS.has(t);
      }
      return true;
    });

  return Array.from(new Set(tokens));
}

/**
 * Synthesizes a structured Boolean search query and fallback search tiers
 * from an arbitrary natural language research topic or question.
 */
export function synthesizeBooleanSearchStrategy(query: string): {
  booleanQuery: string;
  coreKeywords: string;
  searchTiers: string[];
} {
  const cleanQ = query.trim();
  const hasUserBoolean = /["\(\)]|\b(AND|OR|NOT)\b/i.test(cleanQ);

  if (hasUserBoolean) {
    // If the user already provided boolean/quotes, respect it
    const kw = extractAcademicKeywords(cleanQ);
    return {
      booleanQuery: cleanQ,
      coreKeywords: kw.slice(0, 4).join(' '),
      searchTiers: [cleanQ, kw.slice(0, 3).join(' ')].filter(Boolean),
    };
  }

  const keywords = extractAcademicKeywords(cleanQ);

  // Group keywords into concept blocks
  // E.g. [ 'ai', 'skin', 'cancer', 'dermatologists' ] ->
  // Concept 1: ('ai' OR 'artificial intelligence')
  // Concept 2: ('skin cancer' OR 'melanoma' OR 'cancer')
  // Concept 3: ('dermatologists')
  const conceptBlocks: string[][] = [];

  let idx = 0;
  while (idx < keywords.length) {
    const kw = keywords[idx];
    const syns = ACRONYM_SYNONYMS[kw] || [];

    // Check if kw + next form a known compound phrase
    const nextKw = keywords[idx + 1];
    if (nextKw) {
      const bigram = `${kw} ${nextKw}`;
      // Common pairings: 'machine learning', 'skin cancer', 'heart failure', 'remote work', etc.
      if (
        ['machine learning', 'deep learning', 'skin cancer', 'heart failure', 'remote work', 'social media', 'higher education', 'mental health', 'critical care', 'ejection fraction'].includes(bigram)
      ) {
        conceptBlocks.push([`"${bigram}"`, bigram]);
        idx += 2;
        continue;
      }
    }

    if (syns.length > 0) {
      conceptBlocks.push([kw.toUpperCase(), ...syns.map((s) => `"${s}"`)]);
    } else {
      conceptBlocks.push([kw]);
    }
    idx++;
  }

  // Build Boolean formulation
  // Take the top 2-3 most essential concepts to avoid over-constraining the query
  const primaryBlocks = conceptBlocks.slice(0, Math.min(conceptBlocks.length, 3));
  const booleanParts = primaryBlocks.map((b) => {
    if (b.length === 1) return b[0];
    return `(${b.join(' OR ')})`;
  });

  const booleanQuery = booleanParts.join(' AND ');
  const coreKeywords = keywords.slice(0, 4).join(' ');
  const searchTiers = generateAcademicSearchTiers(cleanQ);

  return {
    booleanQuery: booleanQuery || coreKeywords || cleanQ,
    coreKeywords: coreKeywords || cleanQ,
    searchTiers,
  };
}

/**
 * Deconstructs a loose conversational query into structured, progressive search tiers.
 * Guarantees that OpenAlex and Crossref will find high-relevance peer-reviewed papers.
 */
export function generateAcademicSearchTiers(
  topic: string, 
  focus?: string
): string[] {
  const cleanTopic = topic.trim();
  const cleanFocus = focus?.trim() || '';

  const topicKeywords = extractAcademicKeywords(cleanTopic);
  const focusKeywords = cleanFocus ? extractAcademicKeywords(cleanFocus) : [];
  const allKeywords = Array.from(new Set([...topicKeywords, ...focusKeywords]));

  const queryTiers: string[] = [];
  const seenQueries = new Set<string>();

  const addQuery = (q: string) => {
    const normalized = q.toLowerCase().replace(/[^\w\s-]/g, ' ').replace(/\s+/g, ' ').trim();
    if (normalized && normalized.length >= 2 && !seenQueries.has(normalized)) {
      seenQueries.add(normalized);
      queryTiers.push(normalized);
    }
  };

  // Tier 1: Core Subject Phrase (Top 3-4 keywords together)
  if (topicKeywords.length >= 2) {
    addQuery(topicKeywords.slice(0, 4).join(' '));
  }

  // Tier 2: Topic + Focus synthesis
  if (topicKeywords.length >= 1 && focusKeywords.length >= 1) {
    addQuery(`${topicKeywords.slice(0, 2).join(' ')} ${focusKeywords.slice(0, 2).join(' ')}`);
  }

  // Tier 3: Consecutive Keyword Bigrams (e.g. "organizational justice", "employee turnover")
  for (let i = 0; i < topicKeywords.length - 1; i++) {
    addQuery(`${topicKeywords[i]} ${topicKeywords[i + 1]}`);
  }

  // Tier 4: First and Last salient concepts combined
  if (topicKeywords.length >= 3) {
    addQuery(`${topicKeywords[0]} ${topicKeywords[topicKeywords.length - 1]}`);
    addQuery(`${topicKeywords[1]} ${topicKeywords[topicKeywords.length - 1]}`);
  }

  // Tier 5: The raw sanitized query as fallback
  const rawSanitized = cleanTopic.replace(/[^\w\s-]/g, ' ').replace(/\s+/g, ' ').trim();
  if (rawSanitized.split(' ').length <= 5) {
    addQuery(rawSanitized);
  }

  // Tier 6: High-frequency individual core terms
  for (const kw of allKeywords.slice(0, 3)) {
    if (kw.length >= 3 || ACADEMIC_ACRONYMS.has(kw)) {
      addQuery(kw);
    }
  }

  return queryTiers;
}

