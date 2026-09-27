import type { ManuscriptQuery, SearchObjective } from '../types/expertSearch';

export interface SampleScenario {
  id: string;
  objective: SearchObjective;
  label: string;
  tag: string;
  objectiveBadge: string;
  query: ManuscriptQuery;
}

export const SAMPLE_SCENARIOS: SampleScenario[] = [
  {
    id: 'grant-car-t',
    objective: 'grant_coi',
    label: 'Grant Co-I: NIH R01 / Epigenetics of CAR-T Cell Exhaustion',
    tag: 'NIH R01 Proposal • Inter-Institutional Consortium',
    objectiveBadge: 'Grant Co-Investigator',
    query: {
      title: 'Epigenetic Biomarkers and Single-Cell Profiling of CAR-T Cell Exhaustion in Solid Tumors',
      abstract: 'Chimeric antigen receptor (CAR) T cell therapies face severe functional exhaustion within the immunosuppressive microenvironment of solid tumors. This NIH R01 proposal will delineate chromatin accessibility landscapes, pioneer high-throughput single-cell multi-omic profiling, and engineer synthetic epigenetic switches to reverse T-cell senescence in patient-derived tumor organoids. We are building a multi-site team seeking a Co-Investigator with proven expertise in single-cell epigenomics and microfluidic organoid co-culture platforms.',
      keywords: 'CAR-T cell exhaustion single-cell epigenomics chromatin accessibility solid tumors immunotherapy',
      submittedAuthors: 'Carl H. June, Michel Sadelain',
      submittedInstitutions: 'University of Pennsylvania, Memorial Sloan Kettering'
    }
  },
  {
    id: 'coauthor-cryoem',
    objective: 'coauthor',
    label: 'Co-Author: Latent Diffusion for Cryo-EM Protein Structure Reconstruction',
    tag: 'Manuscript Collaboration • Methodological Co-Author',
    objectiveBadge: 'Paper Co-Author',
    query: {
      title: 'Cross-Attention Latent Diffusion for Real-Time Cryo-EM Protein Structure Reconstruction',
      abstract: 'Cryo-electron microscopy (cryo-EM) single-particle analysis frequently encounters conformational heterogeneity and computationally prohibitive iterative reconstruction workflows. We introduce a cross-attention latent diffusion architecture capable of direct 3D density volume reconstruction directly from 2D projection micrographs. We seek a structural biology co-author with hands-on expertise in RELION, cryoSPARC validation, and experimental macromolecular benchmarks to co-author and refine experimental sections.',
      keywords: 'cryo-EM latent diffusion cross-attention structural biology protein reconstruction cryoSPARC',
      submittedAuthors: 'Demis Hassabis, John Jumper',
      submittedInstitutions: 'Google DeepMind, University of Cambridge'
    }
  },
  {
    id: 'consulting-perovskite',
    objective: 'consultant',
    label: 'Consulting SME: Industrial Scalability of Perovskite Tandem Solar Cells',
    tag: 'Corporate Due Diligence • Scientific Advisory',
    objectiveBadge: 'Consulting Advisor',
    query: {
      title: 'Commercialization Feasibility and Buried Interface Defect Passivation in Perovskite-Silicon Tandem Photovoltaics',
      abstract: 'Our corporate technology practice is conducting due diligence and technical roadmap evaluation for 30%+ efficiency perovskite-silicon tandem solar cell manufacturing. Primary technical hurdles center around moisture and thermal degradation at the buried heterojunction interfaces, scalable slot-die coating yield, and module encapsulation longevity. We require a distinguished academic SME / Scientific Advisory Board consultant to evaluate partner patent portfolios, validate accelerated aging data, and guide our technical diligence.',
      keywords: 'perovskite tandem solar cells defect passivation slot-die coating commercialization degradation',
      submittedAuthors: 'CleanTech Strategy & Diligence Team',
      submittedInstitutions: 'CleanTech Capital Advisors'
    }
  },
  {
    id: 'reviewer-crispr',
    objective: 'reviewer',
    label: 'Peer Reviewer: High-Fidelity CRISPR-Cas9 Off-Target Profiling',
    tag: 'Journal Referee Search • COI Shielding Active',
    objectiveBadge: 'Peer Reviewer',
    query: {
      title: 'High-Fidelity SpCas9-HF1 Off-Target Cleavage Profiling via High-Throughput Sequencing in Primary Human T Cells',
      abstract: 'Targeted genome editing using CRISPR-Cas9 nucleases holds great clinical promise for treating genetic diseases and engineering immunotherapies. However, promiscuous double-strand breaks at non-homologous or partially matched genomic loci present critical oncogenic and genotoxic hazards. Here, we investigate genome-wide off-target cleavage specificities of high-fidelity Cas9 variants across primary human CD4+ and CD8+ T cells utilizing GUIDE-seq and CIRCLE-seq deep sequencing assays.',
      keywords: 'CRISPR Cas9 off-target cleavage GUIDE-seq genome editing specificity',
      submittedAuthors: 'John G. Doench, Feng Zhang, Jennifer Doudna',
      submittedInstitutions: 'Broad Institute, Harvard University, UC Berkeley'
    }
  }
];
