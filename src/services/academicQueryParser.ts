/**
 * Academic Query Parser & Intelligent Information Retrieval (IR) Expander.
 * Converts natural language research questions, thesis statements, and loose sentences
 * into high-precision academic keyword combinations understood by OpenAlex and Crossref.
 */

const QUESTION_PREFIXES = [
  /^investigating\s+(the\s+)?(impact|effect|role|influence|nature|determinants|mechanisms)\s+of\s+/i,
  /^(a\s+)?(study|inquiry|investigation|exploration|analysis|review)\s+(in|on|of|into)\s+/i,
  /^(how|why|what|when|where|who)\s+(does|do|is|are|can|could|will|would|influences|affects)\s+/i,
  /^what\s+is\s+the\s+(relationship|association|correlation|link|impact|effect)\s+between\s+/i,
  /^to\s+what\s+extent\s+(does|do|can)\s+/i,
  /^an?\s+examination\s+of\s+/i,
  /^exploring\s+(the\s+)?(relationship|link|mechanisms|role)\s+between\s+/i,
  /^the\s+(effect|impact|role|influence|consequences)\s+of\s+/i,
  /^evaluating\s+(the\s+)?/i,
  /^assessing\s+(the\s+)?/i,
  /^understanding\s+(the\s+)?/i,
  /^research\s+on\s+/i,
  /^thesis\s+statement:?\s*/i,
  /^topic:?\s*/i,
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
  // Conversational academic fillers
  'investigate', 'investigating', 'investigation', 'explore', 'exploring', 
  'exploration', 'analyze', 'analyzing', 'analysis', 'examine', 'examining', 
  'study', 'studying', 'paper', 'article', 'research', 'thesis', 'inquiry', 
  'question', 'overview', 'focus', 'focusing', 'impact', 'influence', 'role', 
  'effects', 'effect', 'relationship', 'relationships', 'association', 
  'associations', 'determinants', 'factors', 'mechanisms', 'mechanism',
  'implications', 'consequences', 'perspective', 'perspectives', 'evidence',
  'case', 'context', 'regarding', 'concerning', 'towards', 'toward'
]);

/**
 * Strips conversational question scaffolding and extracts high-value academic terms.
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
    .filter((t) => t.length > 2 && !ACADEMIC_STOP_WORDS.has(t));

  return Array.from(new Set(tokens));
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
    const normalized = q.toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
    if (normalized && normalized.length >= 3 && !seenQueries.has(normalized)) {
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
  const rawSanitized = cleanTopic.replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
  if (rawSanitized.split(' ').length <= 5) {
    addQuery(rawSanitized);
  }

  // Tier 6: High-frequency individual core terms
  for (const kw of allKeywords.slice(0, 3)) {
    if (kw.length >= 4) {
      addQuery(kw);
    }
  }

  return queryTiers;
}
