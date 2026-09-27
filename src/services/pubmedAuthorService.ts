const PUBMED_ESEARCH_URL = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi';
const PUBMED_EFETCH_URL = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi';

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;

export interface PubMedAuthorEmailResult {
  authorLastName: string;
  authorInitials: string;
  email: string;
  affiliation: string;
  pmid: string;
}

export async function resolvePubMedAuthorEmails(query: string, maxResults: number = 10): Promise<PubMedAuthorEmailResult[]> {
  try {
    const encodedTerm = encodeURIComponent(query.trim());
    const searchUrl = `${PUBMED_ESEARCH_URL}?db=pubmed&term=${encodedTerm}&retmode=json&retmax=${maxResults}&sort=pub_date`;

    const searchRes = await fetch(searchUrl);
    if (!searchRes.ok) return [];

    const searchData = await searchRes.json();
    const idList: string[] = searchData.esearchresult?.idlist || [];
    if (idList.length === 0) return [];

    // Fetch XML metadata
    const fetchUrl = `${PUBMED_EFETCH_URL}?db=pubmed&id=${idList.join(',')}&retmode=xml`;
    const fetchRes = await fetch(fetchUrl);
    if (!fetchRes.ok) return [];

    const xml = await fetchRes.text();
    const results: PubMedAuthorEmailResult[] = [];

    // Parse Author and Affiliation nodes using regex
    const articleRegex = /<PubmedArticle>([\s\S]*?)<\/PubmedArticle>/g;
    let articleMatch;

    while ((articleMatch = articleRegex.exec(xml)) !== null) {
      const articleXml = articleMatch[1];
      const pmidMatch = articleXml.match(/<PMID[^>]*>(\d+)<\/PMID>/);
      const pmid = pmidMatch ? pmidMatch[1] : '';

      const authorRegex = /<Author[^>]*>([\s\S]*?)<\/Author>/g;
      let authorMatch;

      while ((authorMatch = authorRegex.exec(articleXml)) !== null) {
        const authorXml = authorMatch[1];
        const lastNameMatch = authorXml.match(/<LastName>(.*?)<\/LastName>/);
        const initialsMatch = authorXml.match(/<Initials>(.*?)<\/Initials>/);
        const affilMatch = authorXml.match(/<Affiliation>(.*?)<\/Affiliation>/);

        if (lastNameMatch && affilMatch) {
          const affilText = affilMatch[1];
          const emailMatch = affilText.match(EMAIL_REGEX);

          if (emailMatch) {
            const email = emailMatch[0].toLowerCase();
            // Skip publisher corporate contact emails
            if (!email.includes('publisher') && !email.includes('journal') && !email.includes('office') && !email.includes('editorial')) {
              results.push({
                authorLastName: lastNameMatch[1].trim(),
                authorInitials: initialsMatch ? initialsMatch[1].trim() : '',
                email,
                affiliation: affilText,
                pmid
              });
            }
          }
        }
      }
    }

    return results;
  } catch (err) {
    console.warn('PubMed email resolution error:', err);
    return [];
  }
}
