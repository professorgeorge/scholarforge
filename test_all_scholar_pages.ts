import { parseScholarHtml } from './src/services/scholarImpactService.ts';

async function testAllPages(userId: string) {
  console.log(`\n=================== Fetching ALL Pages for User: ${userId} ===================`);
  let totalPapers = 0;
  let cstart = 0;
  const pagesize = 100;
  const allPapers: any[] = [];
  let authorName = '';
  let affiliation = '';
  let citations = 0;
  let hIndex = 0;
  let i10Index = 0;

  while (cstart <= 1000) {
    const url = `https://scholar.google.com/citations?user=${userId}&hl=en&cstart=${cstart}&pagesize=${pagesize}`;
    console.log(`Fetching page cstart=${cstart}...`);

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    if (!res.ok) {
      console.log(`Page returned status: ${res.status}`);
      break;
    }

    const html = await res.text();
    const parsed = parseScholarHtml(html);

    if (cstart === 0) {
      authorName = parsed.name || '';
      affiliation = parsed.affiliation || '';
      citations = parsed.citations || 0;
      hIndex = parsed.hIndex || 0;
      i10Index = parsed.i10Index || 0;
    }

    const pageCount = parsed.papers.length;
    console.log(`Page cstart=${cstart} returned ${pageCount} papers.`);

    if (pageCount === 0) {
      break;
    }

    allPapers.push(...parsed.papers);
    cstart += pagesize;

    if (pageCount < pagesize) {
      break;
    }
  }

  console.log(`\n=================== COMPLETE SCHOLAR CATALOG ===================`);
  console.log(`Author Name: ${authorName}`);
  console.log(`Affiliation: ${affiliation}`);
  console.log(`Total Published Papers Count: ${allPapers.length}`);
  console.log(`Total Citations: ${citations.toLocaleString()}`);
  console.log(`h-index: ${hIndex} | i10-index: ${i10Index}`);
  console.log('Sample papers:');
  allPapers.slice(0, 5).forEach((p, i) => console.log(`  ${i + 1}. "${p.title}" (${p.year}) — ${p.citationCount} cites`));
}

testAllPages('1knki-oAAAAJ');
