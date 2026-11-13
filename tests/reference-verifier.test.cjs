const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');

require.extensions['.ts'] = (module, filename) =>
  module._compile(
    ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
    }).outputText,
    filename
  );

const {
  decodeHtmlEntities,
  stripHtml,
  formatCitationWithNumber,
  generateVerificationWordReport
} = require('../src/services/referenceVerifierService.ts');

test('decodeHtmlEntities thoroughly decodes special characters and HTML quotes', () => {
  const input = '&quot;Machine Learning&quot; in Medicine &amp; Healthcare: O&#39;Reilly &ndash; An Overview';
  const expected = '"Machine Learning" in Medicine & Healthcare: O\'Reilly – An Overview';
  assert.equal(decodeHtmlEntities(input), expected);
});

test('stripHtml strips markup and returns decoded plain text', () => {
  const input = '<i>Advances in Neural Systems</i>, <b>30</b>, pp. &quot;5998-6008&quot;. <a href="https://doi.org/10">doi</a>';
  assert.equal(stripHtml(input), 'Advances in Neural Systems, 30, pp. "5998-6008". doi');
});

test('formatCitationWithNumber prevents duplicate numbering in IEEE and Vancouver', () => {
  const ieeeWithExistingNumber = '[1] A. Vaswani, "Attention is all you need," 2017.';
  assert.equal(
    formatCitationWithNumber(ieeeWithExistingNumber, 'ieee', 2),
    '[2] A. Vaswani, "Attention is all you need," 2017.'
  );

  const ieeeBare = 'A. Vaswani, "Attention is all you need," 2017.';
  assert.equal(
    formatCitationWithNumber(ieeeBare, 'ieee', 1),
    '[1] A. Vaswani, "Attention is all you need," 2017.'
  );

  const vancouverWithExistingNumber = '1. Vaswani A. Attention is all you need. 2017.';
  assert.equal(
    formatCitationWithNumber(vancouverWithExistingNumber, 'vancouver', 3),
    '3. Vaswani A. Attention is all you need. 2017.'
  );

  const apaCitation = 'Vaswani, A. (2017). Attention is all you need.';
  assert.equal(
    formatCitationWithNumber(apaCitation, 'apa', 1),
    'Vaswani, A. (2017). Attention is all you need.'
  );
});

test('generateVerificationWordReport adaptation mode includes original, corrected below in green, and unverifiable in red', () => {
  const mockReport = {
    total: 3,
    verifiedCount: 1,
    discrepancyCount: 1,
    notFoundCount: 1,
    authenticityScore: 80,
    results: [
      {
        id: 'ref_1',
        raw: 'Vaswani, A. (2017). Attention is all you need.',
        parsed: { raw: '', authors: ['Vaswani'], authorString: 'Vaswani', title: 'Attention', venue: 'NeurIPS', cleanQuery: '' },
        verifiedPaper: { id: 'p1', title: 'Attention is all you need', authors: [{ name: 'Vaswani, A.' }], venue: 'NeurIPS', year: 2017, doi: '10.5555/3295222.3295349' },
        status: 'verified',
        confidence: 98,
        discrepancies: [],
        scholarUrl: '',
        correctedCitations: { apa: 'Vaswani, A. (2017). Attention is all you need. NeurIPS.' },
      },
      {
        id: 'ref_2',
        raw: 'George, B. (2025). Longitudinal neural architectures. Nature Machine Intelligence.',
        parsed: { raw: '', authors: ['George'], authorString: 'George', title: 'Longitudinal neural architectures', venue: 'Nature', cleanQuery: '' },
        verifiedPaper: { id: 'p2', title: 'Longitudinal neural architectures in clinical diagnosis', authors: [{ name: 'George, B.' }], venue: 'Nature Machine Intelligence', year: 2023, doi: '10.1038/s42256' },
        status: 'discrepancy',
        confidence: 85,
        discrepancies: [{ field: 'year', message: 'Publication Year mismatch: Cited 2025 vs Published 2023.' }],
        scholarUrl: '',
        correctedCitations: { apa: 'George, B. (2023). Longitudinal neural architectures in clinical diagnosis. Nature Machine Intelligence.' },
      },
      {
        id: 'ref_3',
        raw: 'NonexistentAuthor, X. (2024). Hallucinated empirical study. Journal of Unknowns.',
        parsed: { raw: '', authors: ['NonexistentAuthor'], authorString: 'NonexistentAuthor', title: 'Hallucinated', venue: 'Journal', cleanQuery: '' },
        verifiedPaper: null,
        status: 'not_found',
        confidence: 0,
        discrepancies: [{ field: 'record', message: 'Not found in registries.' }],
        scholarUrl: '',
        correctedCitations: {},
      },
    ],
  };

  const html = generateVerificationWordReport(mockReport, 'apa', 'adaptation');

  // Verify adaptation header and instructions
  assert.ok(html.includes('Reference Verification &amp; Manual Adaptation Guide'), 'Should include adaptation title');
  assert.ok(html.includes('Manual Adaptation Legend &amp; Color Coding'), 'Should include legend');

  // Verify discrepancy entry: Original shown, and corrected placed just below in green (#15803d)
  assert.ok(html.includes('[Original]:</strong> George, B. (2025)'), 'Original reference must be displayed');
  assert.ok(html.includes('color: #15803d; font-weight: bold;'), 'Corrected citation must be styled in green font');
  assert.ok(html.includes('Longitudinal neural architectures in clinical diagnosis'), 'Corrected text must be displayed');

  // Verify unverifiable entry: shown with red color font (#dc2626)
  assert.ok(html.includes('color: #dc2626; font-weight: bold;'), 'Unverifiable reference must be styled in red font');
  assert.ok(html.includes('NonexistentAuthor, X. (2024). Hallucinated empirical study'), 'Unverifiable citation text must be present');
  assert.ok(html.includes('UNINDEXED / UNVERIFIABLE IN REGISTRIES'), 'Should have unindexed marker');
});
