import { huntAcademicPapers } from './src/services/academicApi';
import { extractClaimsFromText } from './src/services/claimExtractor';
import { buildAnnotatedDocument, exportToMarkdown, exportToWordHtml, CITATION_STYLES } from './src/services/citationFormatter';
import { SAMPLE_ESSAYS } from './src/data/sampleEssays';
import type { CitationOptions } from './src/types/citation';

async function runTests() {
  console.log('====================================================');
  console.log('🧪 RUNNING CITATION FILLER VERIFICATION TEST SUITE');
  console.log('====================================================\n');

  // Test 1: Claim Extraction
  console.log('▶ Test 1: Testing Claim Extraction Engine...');
  const testText = SAMPLE_ESSAYS[0].content;
  const claims = extractClaimsFromText(testText, 'moderate');
  console.log(`  ✓ Extracted ${claims.length} claims from essay.`);

  // Test 2: Academic Paper Search with Preprint Exclusion & Verified DOIs
  console.log('\n▶ Test 2: Hunting Peer-Reviewed Journal Articles (Excluding Preprints & Requiring DOIs)...');
  for (let i = 0; i < claims.length; i++) {
    const claim = claims[i];
    const retrieved = await huntAcademicPapers(claim.searchQueries, 3, true);
    if (retrieved.length > 0) {
      claim.candidatePapers = retrieved;
      claim.selectedPaper = retrieved[0];
      claim.status = 'found';
      console.log(`  ✓ Claim ${i + 1} matched: "${retrieved[0].title.slice(0, 50)}..."`);
      console.log(`      Journal: "${retrieved[0].venue}" | DOI: https://doi.org/${retrieved[0].doi}`);
      
      // Verify DOI exists
      if (!retrieved[0].doi) {
        throw new Error(`Matched paper missing DOI: ${retrieved[0].title}`);
      }
    }
  }

  // Test 3: Formatting & Word HTML Verification
  console.log('\n▶ Test 3: Testing Formatting Across Citation Styles & Word Output...');
  for (const styleInfo of CITATION_STYLES) {
    const options: CitationOptions = {
      style: styleInfo.id,
      includeDoi: true,
      includeAbstracts: false,
      maxAuthorsInText: 3,
      linkCitations: true,
      excludePreprints: true,
      requireDoi: true,
    };

    const result = buildAnnotatedDocument(testText, claims, options);
    console.log(`\n  --- [Style: ${styleInfo.name}] ---`);
    console.log(`  Plain Text Bibliography Entry (No raw asterisks):`);
    console.log(`    ${result.bibliography[0]}`);
    console.log(`  HTML Formatted Bibliography Entry (Italics & Links):`);
    console.log(`    ${result.bibliographyHtml[0]}`);

    // Verify plain text has no raw markdown asterisks
    if (styleInfo.id !== 'bibtex' && result.bibliography[0].includes('*')) {
      throw new Error(`Plain text bibliography contains raw asterisks in style: ${styleInfo.name}`);
    }
  }

  // Test 4: Word Document Export Structure
  console.log('\n▶ Test 4: Testing Word HTML Document Generation...');
  const wordDoc = exportToWordHtml(testText, claims, {
    style: 'apa',
    includeDoi: true,
    includeAbstracts: false,
    maxAuthorsInText: 3,
    linkCitations: true,
    excludePreprints: true,
    requireDoi: true,
  });

  if (!wordDoc.includes('hanging-indent') || !wordDoc.includes('<i>') || !wordDoc.includes('href="https://doi.org/')) {
    throw new Error('Word document is missing academic hanging-indent or italics tags');
  }
  console.log(`  ✓ Word HTML length: ${wordDoc.length} chars (contains hanging indents, <i> italics, and active DOI hyperlinks)`);

  console.log('\n====================================================');
  console.log('🎉 ALL VERIFICATION TESTS PASSED SUCCESSFULLY!');
  console.log('====================================================');
}

runTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
