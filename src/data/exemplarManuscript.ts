import type { AcademicPaper, Claim } from '../types/citation';

export const EXEMPLAR_PAPERS: AcademicPaper[] = [
  {
    id: 'exemplar-esteva-2017',
    title: 'Dermatologist-level classification of skin cancer with deep neural networks',
    authors: [
      { name: 'Andre Esteva' },
      { name: 'Brett Kuprel' },
      { name: 'Roberto A. Novoa' },
      { name: 'Justin Ko' },
      { name: 'Susan M. Swetter' },
      { name: 'Helen M. Blau' },
      { name: 'Sebastian Thrun' },
    ],
    year: 2017,
    venue: 'Nature',
    doi: '10.1038/nature21056',
    url: 'https://doi.org/10.1038/nature21056',
    citationCount: 6850,
    abstract: 'Deep convolutional neural networks exhibit high diagnostic performance across medical imaging benchmarks. Here we demonstrate classification of skin lesions using a single neural network trained end-to-end from images directly, matching the performance of 21 board-certified dermatologists across biopsy-proven clinical cases.',
    openAccess: true,
    openAccessPdf: 'https://www.nature.com/articles/nature21056.pdf',
    source: 'crossref',
    volume: '542',
    issue: '7639',
    pages: '115-118',
    type: 'journal',
  },
  {
    id: 'exemplar-mckinney-2020',
    title: 'International evaluation of an AI system for breast cancer screening',
    authors: [
      { name: 'Scott Mayer McKinney' },
      { name: 'Marcin Sieniek' },
      { name: 'Varun Godbole' },
      { name: 'Jonathan Godwin' },
      { name: 'Natasha Antropova' },
      { name: 'Hutan Ashrafian' },
      { name: 'Trevor Back' },
    ],
    year: 2020,
    venue: 'Nature',
    doi: '10.1038/s41586-019-1799-6',
    url: 'https://doi.org/10.1038/s41586-019-1799-6',
    citationCount: 2420,
    abstract: 'Breast cancer screening mammography reduces mortality but suffers from false positives and false negatives. In an international evaluation across large-scale UK and USA datasets, an AI system produced an absolute reduction of 5.7% and 1.2% in false positives, and 9.4% and 2.7% in false negatives, outperforming all individual human readers.',
    openAccess: true,
    openAccessPdf: 'https://www.nature.com/articles/s41586-019-1799-6.pdf',
    source: 'europepmc',
    volume: '577',
    issue: '7788',
    pages: '89-94',
    type: 'journal',
  },
  {
    id: 'exemplar-rajpurkar-2018',
    title: 'Deep learning for chest radiograph diagnosis: A retrospective study on CheXNeXt',
    authors: [
      { name: 'Pranav Rajpurkar' },
      { name: 'Jeremy Irvin' },
      { name: 'Robyn L. Ball' },
      { name: 'Kaylie Zhu' },
      { name: 'Brandon Yang' },
      { name: 'Harkirat Mehta' },
      { name: 'Matthew P. Lungren' },
    ],
    year: 2018,
    venue: 'PLOS Medicine',
    doi: '10.1371/journal.pmed.1002686',
    url: 'https://doi.org/10.1371/journal.pmed.1002686',
    citationCount: 1680,
    abstract: 'Chest radiographs represent the most frequently performed diagnostic imaging examination globally. We developed CheXNeXt, a deep learning algorithm trained to identify 14 clinically critical pathologies on frontal chest radiographs, achieving diagnostic performance statistically indistinguishable from practicing academic thoracic radiologists.',
    openAccess: true,
    openAccessPdf: 'https://journals.plos.org/plosmedicine/article/file?id=10.1371/journal.pmed.1002686&type=printable',
    source: 'openalex',
    volume: '15',
    issue: '11',
    pages: 'e1002686',
    type: 'journal',
  },
  {
    id: 'exemplar-topol-2019',
    title: 'High-performance medicine: the convergence of human and artificial intelligence',
    authors: [
      { name: 'Eric J. Topol' },
    ],
    year: 2019,
    venue: 'Nature Medicine',
    doi: '10.1038/s41591-018-0300-7',
    url: 'https://doi.org/10.1038/s41591-018-0300-7',
    citationCount: 3120,
    abstract: 'The convergence of multimodal medical datasets, high-throughput biosensing, and deep neural networks establishes a high-performance medicine paradigm. AI algorithms augment diagnostic workflow speed and accuracy while liberating clinicians to focus on empathetic patient care and shared clinical decision-making.',
    openAccess: false,
    source: 'crossref',
    volume: '25',
    issue: '1',
    pages: '44-56',
    type: 'journal',
  },
  {
    id: 'exemplar-obermeyer-2019',
    title: 'Dissecting racial bias in an algorithm used to manage the health of populations',
    authors: [
      { name: 'Ziad Obermeyer' },
      { name: 'Brian Powers' },
      { name: 'Christine Vogeli' },
      { name: 'Sendhil Mullainathan' },
    ],
    year: 2019,
    venue: 'Science',
    doi: '10.1126/science.aax2342',
    url: 'https://doi.org/10.1126/science.aax2342',
    citationCount: 2950,
    abstract: 'Commercial prediction algorithms deployed across health systems exhibit systemic racial bias because they use health-care expenditure as a proxy for clinical need. Remedy of this disparate proxy variable reduced bias by 84% and substantially increased remedial enrollment for historically marginalized patient cohorts.',
    openAccess: true,
    openAccessPdf: 'https://www.science.org/doi/pdf/10.1126/science.aax2342',
    source: 'semanticscholar',
    volume: '366',
    issue: '6464',
    pages: '447-453',
    type: 'journal',
  },
  {
    id: 'exemplar-kelly-2019',
    title: 'Key challenges for delivering clinical impact with artificial intelligence',
    authors: [
      { name: 'Christopher J. Kelly' },
      { name: 'Alan Karthikesalingam' },
      { name: 'Mustafa Suleyman' },
      { name: 'Greg Corrado' },
      { name: 'Dominic King' },
    ],
    year: 2019,
    venue: 'BMC Medicine',
    doi: '10.1186/s12916-019-1426-2',
    url: 'https://doi.org/10.1186/s12916-019-1426-2',
    citationCount: 1410,
    abstract: 'Translating deep learning breakthroughs from retrospective in silico benchmarks to prospective clinical workflow faces translation hurdles, including data distribution shift, machine interoperability, algorithmic bias, usability barriers, and prospective regulatory oversight.',
    openAccess: true,
    openAccessPdf: 'https://bmcmedicine.biomedcentral.com/counter/pdf/10.1186/s12916-019-1426-2.pdf',
    source: 'europepmc',
    volume: '17',
    issue: '1',
    pages: '195',
    type: 'journal',
  },
];

export const EXEMPLAR_MANUSCRIPT_TEXT = `Artificial intelligence architectures have fundamentally transformed clinical diagnostics and medical image interpretation. Deep convolutional neural networks trained on expansive dermatological datasets have achieved diagnostic sensitivity and specificity on par with board-certified clinical specialists across biopsy-confirmed malignancies.

In automated breast cancer screening mammography, algorithmic detection systems demonstrated absolute reductions of over five percent in false-positive rates and nine percent in false-negative evaluations across international clinical cohorts.

Similarly, multi-label convolutional architectures applied to frontal chest radiography demonstrate diagnostic accuracy across thoracic pathologies that is statistically indistinguishable from practicing subspecialty academic radiologists.

The convergence of multimodal electronic health records and deep neural network triage mechanisms establishes an unprecedented opportunity to optimize clinical throughput and expand diagnostic accessibility in resource-constrained environments.

However, clinical translation introduces serious algorithmic governance vulnerabilities, including dataset distribution shift across heterogeneous scanner hardware and systemic biases stemming from uncalibrated commercial proxies.

Prospective multi-center randomized validation trials and rigorous algorithmic accountability frameworks remain imperative before autonomous clinical deployment can be responsibly scaled.`;

export function getExemplarClaims(): Claim[] {
  const claimsText = [
    'Deep convolutional neural networks trained on expansive dermatological datasets have achieved diagnostic sensitivity and specificity on par with board-certified clinical specialists across biopsy-confirmed malignancies.',
    'In automated breast cancer screening mammography, algorithmic detection systems demonstrated absolute reductions of over five percent in false-positive rates and nine percent in false-negative evaluations across international clinical cohorts.',
    'Similarly, multi-label convolutional architectures applied to frontal chest radiography demonstrate diagnostic accuracy across thoracic pathologies that is statistically indistinguishable from practicing subspecialty academic radiologists.',
    'The convergence of multimodal electronic health records and deep neural network triage mechanisms establishes an unprecedented opportunity to optimize clinical throughput and expand diagnostic accessibility in resource-constrained environments.',
    'However, clinical translation introduces serious algorithmic governance vulnerabilities, including dataset distribution shift across heterogeneous scanner hardware and systemic biases stemming from uncalibrated commercial proxies.',
    'Prospective multi-center randomized validation trials and rigorous algorithmic accountability frameworks remain imperative before autonomous clinical deployment can be responsibly scaled.',
  ];

  return claimsText.map((text, idx) => {
    const paper = EXEMPLAR_PAPERS[idx % EXEMPLAR_PAPERS.length];
    return {
      id: `exemplar-claim-${idx + 1}`,
      text,
      rawSentence: text,
      paragraphIndex: idx,
      sentenceIndex: 0,
      startIndex: 0,
      endIndex: text.length,
      confidence: 'high' as const,
      keywords: [text.slice(0, 30)],
      searchQueries: [text.slice(0, 80)],
      candidatePapers: EXEMPLAR_PAPERS,
      selectedPaper: paper,
      status: 'found' as const,
      isExcluded: false,
      citationNumber: idx + 1,
    };
  });
}
