/**
 * IRB Triage & Research Ethics Decision Engine
 * Integrated natively into ScholarForge from the companion IRB-Triage suite.
 * 
 * Provides deterministic evaluation for:
 * 1. Researcher Review Track Triage (Exempt, Expedited, Full Board, Not Human Subjects Research)
 * 2. Institutional Review Board (IRB/REC/HREC/IEC) Committee Review Checklist
 * 3. Manuscript Peer-Reviewer / Editor Ethics Disclosure Audit (COPE, ICMJE, Helsinki)
 * 4. Post-Approval Protocol Modification & Incident Action Plan (Amendments, Adverse Events, Breaches)
 */

export type IrbMode = 'researcher' | 'reviewer' | 'manuscript' | 'postapproval';

export type IrbJurisdiction = 
  | 'us'      // US Common Rule 45 CFR 46 / FDA 21 CFR 50/56
  | 'uk'      // UK HRA & University RECs
  | 'eu'      // European Union / GDPR Art. 9
  | 'ca'      // Canada TCPS 2 (2022) Chapter 9
  | 'au'      // Australia NHMRC National Statement / HRECs
  | 'in'      // India ICMR Guidelines (2017) / DHR Naitik
  | 'cn'      // China NHC (2023) & MOST Trial Measures
  | 'br'      // Brazil CEP/CONEP / Lei 14.874/2024
  | 'multi'   // Cross-border / Multi-country
  | 'other';  // General / International baseline

export type IrbPurpose = 'research' | 'qi' | 'classroom' | 'journalism' | 'evaluation' | 'mixed';
export type IrbDataSource = 'primary' | 'existing' | 'both' | 'nohumans';

export type IrbActivity = 
  | 'survey'
  | 'interview'
  | 'observation_public'
  | 'observation_intervene'
  | 'experiment'
  | 'biomedical'
  | 'biospecimens'
  | 'recording'
  | 'online_data'
  | 'ai_subject'
  | 'ai_training'
  | 'deception';

export type IrbPopulation = 
  | 'general'
  | 'minors'
  | 'pregnant'
  | 'prisoners'
  | 'cognitive'
  | 'own_students'
  | 'patients'
  | 'indigenous'
  | 'refugees'
  | 'critically_ill'
  | 'lowresource';

export type IrbIdentifiability = 
  | 'direct'
  | 'indirect'
  | 'coded'
  | 'deidentified'
  | 'anonymous'
  | 'public';

export type IrbSensitivity = 
  | 'none'
  | 'mental_health'
  | 'illegal'
  | 'sexuality'
  | 'substance'
  | 'immigration'
  | 'stigmatized_health'
  | 'political'
  | 'violence'
  | 'genetic';

export type IrbRisk = 'minimal' | 'slightly_above' | 'greater' | 'substantial';

// Post-approval state fields
export type IrbChangeType = 
  | 'protocol_minor'
  | 'protocol_major'
  | 'consent'
  | 'adverse_event'
  | 'breach'
  | 'protocol_deviation'
  | 'new_population'
  | 'continuing';

export type IrbChangeStatus = 'planned' | 'emergency' | 'already';
export type IrbChangeRisk = 'none' | 'reduces' | 'adds_minor' | 'adds_major';

export interface IrbTriageState {
  mode: IrbMode;
  jurisdiction: IrbJurisdiction;
  purpose: IrbPurpose | null;
  dataSource: IrbDataSource | null;
  activities: IrbActivity[];
  population: IrbPopulation[];
  identifiability: IrbIdentifiability | null;
  sensitivity: IrbSensitivity[];
  risk: IrbRisk | null;
  // Post-approval state
  changeType: IrbChangeType | null;
  changeStatus: IrbChangeStatus | null;
  changeRisk: IrbChangeRisk | null;
}

export type IrbVerdict = 
  | 'idle'
  | 'partial'
  | 'notneeded'
  | 'exempt'
  | 'expedited'
  | 'fullboard'
  | 'special'
  | 'amend_minor'
  | 'amend_major'
  | 'report_now';

export interface IrbReason {
  kind: 'good' | 'note' | 'flag';
  text: string;
}

export interface IrbFlag {
  kind: 'flag' | 'warn';
  text: string;
}

export interface IrbAssessmentResult {
  verdict: IrbVerdict;
  track: string | null;
  headline: string;
  sub: string;
  reasons: IrbReason[];
  flags: IrbFlag[];
}

export interface IrbAuditCheck {
  pass: boolean;
  label: string;
  kind?: 'pass' | 'fail' | 'warn';
}

export interface IrbAuditReport {
  checks: IrbAuditCheck[];
  passed: number;
  total: number;
}

export interface IrbReportBlock {
  cls: string;
  title: string;
  items: string[];
}

export interface IrbDeficiency {
  title: string;
  tags: string[];
  body: string;
}

export interface IrbScenario {
  title: string;
  desc: string;
  category: 'behavioural' | 'healthcare' | 'ai' | 'global' | 'edge' | 'post';
  mode: IrbMode;
  data: Partial<IrbTriageState>;
}

// ==========================================
// CONSTANT DATABASES
// ==========================================

export const IRB_COMMON_DEFICIENCIES: IrbDeficiency[] = [
  {
    title: 'Consent form readability above target level',
    tags: ['consent', 'all'],
    body: 'Common when a research-trained author writes for participants. Aim for 8th grade reading level for general adult populations; lower for vulnerable groups. Use Flesch-Kincaid or plain-language review.'
  },
  {
    title: 'Vague data destruction timeline',
    tags: ['data', 'security', 'all'],
    body: 'Saying "data will be destroyed when no longer needed" doesn\'t commit to anything. Specify a duration (e.g., "5 years after study close, identifiers removed; de-identified data retained indefinitely").'
  },
  {
    title: 'Recruitment script overstating benefits',
    tags: ['consent', 'recruitment'],
    body: 'Promising "benefits" that are not directly tied to participation. The IRB will want benefits framed accurately, distinguishing personal benefit from contribution to generalizable knowledge.'
  },
  {
    title: 'Compensation creates undue inducement',
    tags: ['consent', 'compensation', 'vulnerable'],
    body: 'Compensation should be reasonable for time and effort, not so large it overrides good judgment. Particularly fraught for low-income or low-resource settings.'
  },
  {
    title: 'Survey instrument missing from submission',
    tags: ['documents', 'survey'],
    body: 'IRBs cannot assess what they cannot see. Include the actual instrument, not just a description. For web-based surveys: include the consent screen and entire question branch flow.'
  },
  {
    title: 'Debriefing for deception missing or vague',
    tags: ['deception', 'consent'],
    body: 'When deception is used, the debriefing must be detailed: when it occurs, what is disclosed, opportunity to withdraw data, and follow-up resources if the deception caused distress.'
  },
  {
    title: 'Indirect identifier risk underestimated',
    tags: ['data', 'identifiability', 'security'],
    body: 'Combining ZIP code, age, and gender alone can uniquely identify many individuals in small populations. Address re-identification risk with k-anonymity, generalization, or cell-size suppression.'
  },
  {
    title: 'Future-use consent too broad to be meaningful',
    tags: ['consent', 'biobank', 'biospecimens'],
    body: 'Consent for "any future research" is hard to defend ethically. Broad consent under §46.116(d) requires specific elements; biobanks should consider tiered consent options.'
  },
  {
    title: 'Online data: terms of service not reviewed',
    tags: ['online', 'social_media', 'ai'],
    body: 'Many platforms prohibit scraping or unauthorized academic analysis. Even when data is "public," ToS compliance is part of the ethics review picture.'
  },
  {
    title: 'Contextual integrity ignored in digital spaces',
    tags: ['online', 'social_media', 'privacy'],
    body: 'Data shared in one context (e.g. a support group on Reddit) may be technically public but not appropriate for analysis without considering user expectations and potential harm.'
  },
  {
    title: 'Cross-border data transfer not addressed',
    tags: ['global', 'gdpr', 'data'],
    body: 'Moving data from EU/UK to other jurisdictions requires a legal mechanism (SCCs, adequacy decision, scientific derogation). Plan and document the transfer basis explicitly.'
  },
  {
    title: 'Vulnerable population included without scientific rationale',
    tags: ['vulnerable', 'justice'],
    body: 'Including a vulnerable group requires explicit justification: why this group, why now, and what additional safeguards are implemented. "Convenience" is never a justification.'
  },
  {
    title: 'Power dynamic in recruitment (students or patients)',
    tags: ['consent', 'students', 'patients'],
    body: 'When the PI has power over potential participants (instructor, supervisor, treating clinician), recruitment should be routed through a neutral third party, and non-participation must clearly carry zero penalty.'
  },
  {
    title: 'Assent and parental permission conflated',
    tags: ['minors', 'consent'],
    body: 'Assent is the child\'s affirmative agreement; permission is the parent\'s. Different documents, different reading levels, and different ages. Most frameworks require both.'
  },
  {
    title: 'AI involvement undisclosed to participants',
    tags: ['ai', 'consent', 'disclosure'],
    body: 'When AI mediates the study (chatbot, decision support, generative content), participants should know they are interacting with an artificial agent, not a human. The Koko case is the classic cautionary tale.'
  },
  {
    title: 'Model training data provenance unclear',
    tags: ['ai', 'data'],
    body: 'Consent for the original data may not have contemplated training an ML model. Document what consent permits, and whether new consent is needed for model weights release.'
  },
  {
    title: 'Memorization risk in trained machine learning models',
    tags: ['ai', 'privacy'],
    body: 'Models can memorize training data, including identifying information. Mitigations include differential privacy, evaluation against extraction attacks, and access controls.'
  },
  {
    title: 'Clinical trial registration after enrollment began',
    tags: ['biomedical', 'registration'],
    body: 'ICMJE requires prospective registration on an approved registry (e.g., ClinicalTrials.gov, CTRI). Registration after enrollment is a major publication red flag that can block acceptance.'
  },
  {
    title: 'Adverse event timeline noncompliant',
    tags: ['post-approval', 'biomedical', 'reporting'],
    body: 'Different institutions have strict timelines. Serious unanticipated events typically need reporting within 10 business days; fatal or life-threatening events within 24 to 72 hours.'
  },
  {
    title: 'Continuing review lapsed during study execution',
    tags: ['post-approval', 'review'],
    body: 'Even if eligible for the 2018 Common Rule continuing-review exception, lapsed approval halts study activities immediately. Submit renewal documents 4-6 weeks prior to expiration.'
  },
  {
    title: 'Data sharing plan absent from protocol',
    tags: ['data', 'publication', 'reporting'],
    body: 'Major funders (NIH 2023 Data Management and Sharing Policy) and top journals require explicit data sharing statements. Address where data will reside and access conditions.'
  },
  {
    title: 'Indigenous community consent omitted',
    tags: ['indigenous', 'community', 'global'],
    body: 'Individual consent does not replace community consent. TCPS 2 Chapter 9 (Canada) and AIATSIS (Australia) mandate engagement at the collective community governance level.'
  },
  {
    title: 'Recording consent underspecified',
    tags: ['consent', 'recording'],
    body: 'Audio/video consent should specify retention periods, transcription handling, who has access, and any planned reuse (teaching, quotes, archive).'
  },
  {
    title: 'Conflict of interest not disclosed',
    tags: ['publication', 'all'],
    body: 'Authors, IRB members, and reviewers all face COI obligations. Disclose financial interests, patent filings, advisory roles, and commercial ties.'
  },
  {
    title: 'Jurisdiction confusion in multi-site work',
    tags: ['global', 'review'],
    body: 'Researchers sometimes mistakenly assume one IRB approval automatically covers foreign or secondary sites. Confirm whether single-IRB or reliance agreements apply.'
  }
];

export const IRB_FOUNDATIONAL_DOCUMENTS = [
  {
    name: 'Belmont Report',
    cite: '1979',
    body: 'The three foundational principles for US human subjects research: respect for persons, beneficence, justice. Bedrock of 45 CFR 46.'
  },
  {
    name: 'Declaration of Helsinki',
    cite: 'WMA 2024',
    body: 'World Medical Association statement on ethical principles for medical research involving human subjects. The international gold standard expected by peer-reviewed journals.'
  },
  {
    name: 'CIOMS Guidelines',
    cite: '2016',
    body: 'Council for International Organizations of Medical Sciences. Comprehensive guidance for health-related research in low-resource settings, biobanking, and cluster trials.'
  },
  {
    name: 'US Common Rule',
    cite: '45 CFR 46 (2018)',
    body: 'US federal policy on human subjects protection. Eight exempt categories under §46.104(d)(1)–(8). Mandates institutional determination over self-exemption.'
  },
  {
    name: 'Nuremberg Code',
    cite: '1947',
    body: 'Ten principles arising from the Nuremberg trials. Principle 1: The voluntary consent of the human subject is absolutely essential.'
  },
  {
    name: 'ICMJE Recommendations',
    cite: 'Journals',
    body: 'Defines standard expectations for ethics committee review, informed consent, clinical trial registration, and authorship disclosures.'
  },
  {
    name: 'COPE Flowcharts',
    cite: 'Ethics in Publishing',
    body: 'Committee on Publication Ethics guidelines for handling missing ethics approvals, retroactive protocol questions, and research misconduct allegations.'
  },
  {
    name: 'Common Consent Elements',
    cite: '§46.116',
    body: 'Eight core required elements (purpose, procedures, risks, benefits, alternatives, confidentiality, compensation, contacts, voluntary participation).'
  }
];

export const IRB_WORKED_SCENARIOS: IrbScenario[] = [
  {
    title: 'Survey of Study Habits',
    desc: 'Anonymous online survey of US college students on academic self-efficacy.',
    category: 'behavioural',
    mode: 'researcher',
    data: {
      jurisdiction: 'us',
      purpose: 'research',
      dataSource: 'primary',
      activities: ['survey'],
      population: ['general'],
      identifiability: 'anonymous',
      sensitivity: ['none'],
      risk: 'minimal'
    }
  },
  {
    title: 'Course-Based Assignment',
    desc: 'Research methods class project with no publication or external conference plans.',
    category: 'behavioural',
    mode: 'researcher',
    data: {
      jurisdiction: 'us',
      purpose: 'classroom',
      dataSource: 'primary',
      activities: ['survey'],
      population: ['general'],
      identifiability: 'anonymous',
      sensitivity: ['none'],
      risk: 'minimal'
    }
  },
  {
    title: 'Dissertation Interviews on Workplace Stress',
    desc: 'In-depth interviews in India with coded voice recordings on occupational burnout.',
    category: 'behavioural',
    mode: 'researcher',
    data: {
      jurisdiction: 'in',
      purpose: 'research',
      dataSource: 'primary',
      activities: ['interview', 'recording'],
      population: ['general'],
      identifiability: 'coded',
      sensitivity: ['mental_health'],
      risk: 'slightly_above'
    }
  },
  {
    title: 'Autoethnography / Self-Study',
    desc: 'Self-study of own pedagogical practice; no other human subjects recruited.',
    category: 'edge',
    mode: 'researcher',
    data: {
      jurisdiction: 'us',
      purpose: 'research',
      dataSource: 'nohumans',
      activities: [],
      population: ['general'],
      identifiability: 'public',
      sensitivity: ['none'],
      risk: 'minimal'
    }
  },
  {
    title: 'Hospital Clinical QI Project',
    desc: 'Streamlining emergency department triage wait times within a single medical center.',
    category: 'healthcare',
    mode: 'researcher',
    data: {
      jurisdiction: 'us',
      purpose: 'qi',
      dataSource: 'existing',
      activities: [],
      population: ['patients'],
      identifiability: 'coded',
      sensitivity: ['none'],
      risk: 'minimal'
    }
  },
  {
    title: 'Phase II Investigational Drug Trial',
    desc: 'Evaluating novel oncology compound in hospitalized patients against standard care.',
    category: 'healthcare',
    mode: 'researcher',
    data: {
      jurisdiction: 'us',
      purpose: 'research',
      dataSource: 'primary',
      activities: ['biomedical'],
      population: ['patients'],
      identifiability: 'direct',
      sensitivity: ['stigmatized_health'],
      risk: 'substantial'
    }
  },
  {
    title: 'EHR Secondary Data Mining',
    desc: 'Extracting de-identified hospital electronic health records for diabetes risk patterns.',
    category: 'healthcare',
    mode: 'researcher',
    data: {
      jurisdiction: 'us',
      purpose: 'research',
      dataSource: 'existing',
      activities: [],
      population: ['patients'],
      identifiability: 'coded',
      sensitivity: ['stigmatized_health'],
      risk: 'minimal'
    }
  },
  {
    title: 'AI Chatbot Mental Health Intervention',
    desc: 'Evaluating generative AI peer counseling support tool. Echoes the Koko case.',
    category: 'ai',
    mode: 'researcher',
    data: {
      jurisdiction: 'us',
      purpose: 'research',
      dataSource: 'primary',
      activities: ['ai_subject', 'experiment'],
      population: ['general'],
      identifiability: 'coded',
      sensitivity: ['mental_health'],
      risk: 'slightly_above'
    }
  },
  {
    title: 'Fine-Tuning LLM on Clinical Notes',
    desc: 'Training custom large language model on institutional discharge summaries.',
    category: 'ai',
    mode: 'researcher',
    data: {
      jurisdiction: 'us',
      purpose: 'research',
      dataSource: 'existing',
      activities: ['ai_training'],
      population: ['patients'],
      identifiability: 'deidentified',
      sensitivity: ['stigmatized_health'],
      risk: 'minimal'
    }
  },
  {
    title: 'Social Media Subreddit Ethnography',
    desc: 'Analyzing public discussions on parenting and pediatric healthcare forums.',
    category: 'ai',
    mode: 'researcher',
    data: {
      jurisdiction: 'us',
      purpose: 'research',
      dataSource: 'existing',
      activities: ['online_data', 'observation_public'],
      population: ['general'],
      identifiability: 'public',
      sensitivity: ['none'],
      risk: 'minimal'
    }
  },
  {
    title: 'Cross-Border Survey (US & India)',
    desc: 'Identical behavioral survey instrument administered across American and Indian universities.',
    category: 'global',
    mode: 'researcher',
    data: {
      jurisdiction: 'multi',
      purpose: 'research',
      dataSource: 'primary',
      activities: ['survey', 'interview'],
      population: ['general'],
      identifiability: 'coded',
      sensitivity: ['political'],
      risk: 'slightly_above'
    }
  },
  {
    title: 'Indigenous Community Engagement Study',
    desc: 'Traditional ecological knowledge research in partnership with First Nations in Canada.',
    category: 'global',
    mode: 'researcher',
    data: {
      jurisdiction: 'ca',
      purpose: 'research',
      dataSource: 'primary',
      activities: ['interview', 'observation_public', 'recording'],
      population: ['indigenous'],
      identifiability: 'coded',
      sensitivity: ['none'],
      risk: 'slightly_above'
    }
  },
  {
    title: 'Post-Approval: Add Study Site',
    desc: 'PI expanding active protocol to an additional regional research hospital.',
    category: 'post',
    mode: 'postapproval',
    data: {
      jurisdiction: 'us',
      changeType: 'protocol_major',
      changeStatus: 'planned',
      changeRisk: 'adds_minor'
    }
  },
  {
    title: 'Post-Approval: Unencrypted Laptop Stolen',
    desc: 'Confidentiality breach containing participant coded keys under GDPR oversight.',
    category: 'post',
    mode: 'postapproval',
    data: {
      jurisdiction: 'eu',
      changeType: 'breach',
      changeStatus: 'already',
      changeRisk: 'adds_major'
    }
  },
  {
    title: 'Post-Approval: Annual Continuing Review',
    desc: 'Filing routine annual renewal for ongoing multi-center clinical study.',
    category: 'post',
    mode: 'postapproval',
    data: {
      jurisdiction: 'us',
      changeType: 'continuing',
      changeStatus: 'planned',
      changeRisk: 'none'
    }
  }
];

// ==========================================
// CORE DECISION ENGINE
// ==========================================

export function computeTrack(state: IrbTriageState): 'exempt' | 'expedited' | 'fullboard' {
  const a = state.activities;
  const p = state.population;
  const sens = state.sensitivity.filter(s => s !== 'none');
  const id = state.identifiability;
  const risk = state.risk;

  const fullBoardTriggers = [
    a.includes('biomedical'),
    a.includes('biospecimens'),
    a.includes('deception'),
    a.includes('observation_intervene') && (risk === 'greater' || risk === 'substantial'),
    risk === 'greater' || risk === 'substantial',
    p.includes('prisoners'),
    p.includes('minors') && (risk === 'greater' || risk === 'substantial' || sens.length > 0),
    p.includes('cognitive'),
    sens.length > 0 && (id === 'direct' || id === 'indirect' || id === 'coded') && risk !== 'minimal',
    p.includes('refugees') && sens.length > 0,
    p.includes('critically_ill'),
    a.includes('ai_subject') && risk !== 'minimal'
  ];
  if (fullBoardTriggers.some(Boolean)) return 'fullboard';

  const exemptCandidate = (
    (id === 'anonymous' || id === 'public') &&
    risk === 'minimal' &&
    sens.length === 0 &&
    !p.includes('minors') &&
    !p.includes('prisoners') &&
    !p.includes('cognitive') &&
    !p.includes('pregnant') &&
    !p.includes('refugees') &&
    !a.includes('biomedical') &&
    !a.includes('biospecimens') &&
    !a.includes('deception') &&
    !a.includes('ai_subject')
  );
  if (exemptCandidate) return 'exempt';

  return 'expedited';
}

export function buildReasonsAndFlags(
  state: IrbTriageState, 
  reasons: IrbReason[], 
  flags: IrbFlag[]
) {
  const a = state.activities;
  const p = state.population;
  const sens = state.sensitivity.filter(s => s !== 'none');
  const id = state.identifiability;
  const risk = state.risk;

  if (state.dataSource === 'primary') {
    reasons.push({ kind: 'note', text: 'New data collected directly from people: the canonical case for IRB / REC review.' });
  } else if (state.dataSource === 'existing') {
    reasons.push({ kind: 'note', text: 'Existing human data: identifiability and original consent scope are the key factors.' });
  } else if (state.dataSource === 'both') {
    reasons.push({ kind: 'note', text: 'Mixed primary and existing data sources. The strictest applicable regulatory standard governs.' });
  }

  if (id === 'anonymous' || id === 'public') {
    reasons.push({ kind: 'good', text: 'Data is anonymous from collection or public, lowering participant risk profile considerably.' });
  } else if (id === 'direct' || id === 'coded') {
    reasons.push({ kind: 'note', text: 'Data is identifiable (direct or coded key). Confidentiality and institutional storage security plans matter.' });
  } else if (id === 'indirect') {
    reasons.push({ kind: 'note', text: 'Indirect identifiers are frequently underestimated; re-identification risk must be addressed explicitly.' });
  }

  if (risk === 'minimal') {
    reasons.push({ kind: 'good', text: 'Minimal risk profile. Eligible for exempt or expedited pathways absent other escalators.' });
  } else if (risk === 'greater' || risk === 'substantial') {
    reasons.push({ kind: 'flag', text: 'Risk exceeds minimal risk threshold. Convened committee (full board) review is standard.' });
  }

  const vulnMap: Record<string, string> = {
    minors: 'Minors involved: assent procedures plus signed parental permission are mandatory.',
    pregnant: 'Pregnant participants / fetuses: special review provisions apply under Subpart B (45 CFR 46).',
    prisoners: 'Incarcerated persons: almost universally requires convened full-board review with an appointed prisoner advocate.',
    cognitive: 'Adults with diminished capacity: surrogate consent procedures and capacity assessment protocol required.',
    indigenous: 'Indigenous communities: community-level consent and culturally appropriate partnership protocols apply (TCPS 2 Chapter 9, AIATSIS).',
    refugees: 'Refugees or undocumented persons: heightened protections required; risk includes severe legal exposure.',
    critically_ill: 'Critically ill or dying participants: surrogate consent safeguards and independent monitoring needed.',
    own_students: 'Power dynamics with students or subordinates: protocol must explicitly eliminate coercion and ensure zero penalty for non-participation.',
    patients: 'Power dynamics with clinical patients: research participation must be strictly isolated from medical care.',
    lowresource: 'Low-resource setting: undue inducement scrutiny on compensation; literacy accommodations for informed consent.'
  };

  p.forEach(key => {
    if (vulnMap[key]) flags.push({ kind: 'flag', text: vulnMap[key] });
  });

  if (a.includes('deception')) {
    flags.push({ kind: 'flag', text: 'Deception or incomplete disclosure requires an explicit debriefing plan and formal IRB justification.' });
  }
  if (a.includes('biomedical')) {
    flags.push({ kind: 'flag', text: 'Biomedical procedures: national clinical trial authorities (FDA, MHRA, DCGI, EMA) apply in addition to the IRB.' });
  }
  if (a.includes('biospecimens')) {
    flags.push({ kind: 'flag', text: 'Biospecimens / genetics: consent must govern future use, biobank repository storage, and commercialization.' });
  }
  if (a.includes('online_data')) {
    flags.push({ kind: 'flag', text: 'Online or social media data: platform terms of service and contextual integrity expectations must be documented.' });
  }
  if (a.includes('ai_subject')) {
    flags.push({ kind: 'flag', text: 'AI as study tool/intervention: participants must know they are interacting with an automated system, not a human. The Koko case is the classic precedent.' });
  }
  if (a.includes('ai_training')) {
    flags.push({ kind: 'flag', text: 'Training models on human data: model memorization can leak training secrets. Consent must explicitly authorize downstream model release.' });
  }
  if (sens.length > 0 && (id === 'direct' || id === 'indirect' || id === 'coded')) {
    flags.push({ kind: 'flag', text: 'Sensitive topics combined with identifiable data: a Certificate of Confidentiality (NIH/US) or regional equivalent is strongly advised.' });
  }
  if (a.includes('recording')) {
    flags.push({ kind: 'flag', text: 'Audio or video recording: consent must specify retention timeline, transcription privacy, and planned reuse.' });
  }
}

export function assessIrbTriage(state: IrbTriageState): IrbAssessmentResult {
  if (state.mode === 'postapproval') {
    return assessPostApproval(state);
  }

  const reasons: IrbReason[] = [];
  const flags: IrbFlag[] = [];
  let verdict: IrbVerdict = 'partial';
  let track: string | null = null;
  let headline = '';
  let sub = '';

  if (state.purpose === 'qi') {
    verdict = 'notneeded';
    headline = 'Likely outside the regulatory research definition';
    sub = 'Quality improvement that stays within a single institution and is not intended for broad generalization typically does not constitute human subjects research.';
    reasons.push({ kind: 'good', text: 'Purpose is internal institutional QI, not the generation of generalizable knowledge.' });
    reasons.push({ kind: 'note', text: 'The boundary shifts immediately if findings or lessons learned are to be published externally.' });
  } else if (state.purpose === 'classroom') {
    verdict = 'notneeded';
    headline = 'Likely classroom-exempt';
    sub = 'Course-based assignments for academic grading, without intention for external publication or conference dissemination, fall outside research review.';
    reasons.push({ kind: 'good', text: 'Classroom exercises with no external dissemination generally sit outside research review.' });
    reasons.push({ kind: 'note', text: 'If unexpected findings prompt a desire to publish later, retrospective approval cannot be granted in most jurisdictions.' });
  } else if (state.purpose === 'journalism') {
    verdict = 'notneeded';
    headline = 'Generally outside research review';
    sub = 'Journalism, oral history, and biographical inquiry are explicitly excluded from the regulatory definition of research under the US Common Rule and comparable frameworks.';
    reasons.push({ kind: 'good', text: 'Journalism and oral history are explicitly excluded under 45 CFR 46.102(l).' });
  } else if (state.purpose === 'evaluation') {
    verdict = 'special';
    headline = 'Borderline territory: Determination letter recommended';
    sub = 'Program evaluation can fall on either side of the regulatory line. Most institutional review boards will issue a formal "Not Human Subjects Research" (NHSR) determination letter upon request.';
    reasons.push({ kind: 'note', text: 'Internal program evaluation alone is rarely research; intent to publish moves it across the threshold.' });
    track = 'special';
  } else if (state.dataSource === 'nohumans') {
    verdict = 'notneeded';
    headline = 'No IRB / human ethics review required';
    sub = 'No human participants or human-derived data are involved. Animal research uses a separate committee (IACUC/AEC). Theoretical and computational work is outside scope.';
    reasons.push({ kind: 'good', text: 'No data is being collected from or about living human participants.' });
  } else {
    track = computeTrack(state);
    if (track === 'exempt') {
      verdict = 'exempt';
      headline = 'Likely qualifies for exempt review';
      sub = 'The study fits within established low-risk exempt categories. Note: in most jurisdictions, the IRB office must issue the official exemption determination; researchers cannot self-exempt.';
    } else if (track === 'expedited') {
      verdict = 'expedited';
      headline = 'Likely expedited / minimal-risk review';
      sub = 'Minimal-risk research with identifiable data is the standard pathway for expedited review by a designated committee reviewer.';
    } else if (track === 'fullboard') {
      verdict = 'fullboard';
      headline = 'Likely full board / convened committee review';
      sub = 'One or more elements (vulnerable population, sensitive topic, biomedical procedure, or heightened risk) escalate this protocol to convened committee review. Plan for a longer lead time.';
    }
    buildReasonsAndFlags(state, reasons, flags);
  }

  if (state.jurisdiction === 'multi') {
    flags.push({ kind: 'flag', text: 'Cross-border / multi-country research: each jurisdiction\'s ethics review and data export laws (GDPR, PIPL) may apply independently.' });
  }
  if (state.purpose === 'mixed') {
    reasons.push({ kind: 'note', text: 'Purpose marked as mixed or unsure. The safest procedural step is to request a formal institutional determination letter.' });
  }

  return { verdict, track, headline, sub, reasons, flags };
}

export function assessPostApproval(state: IrbTriageState): IrbAssessmentResult {
  const reasons: IrbReason[] = [];
  const flags: IrbFlag[] = [];
  let verdict: IrbVerdict = 'partial';
  let headline = '';
  let sub = '';

  const t = state.changeType;
  const status = state.changeStatus;
  const risk = state.changeRisk;

  if (!t) {
    return {
      verdict: 'partial',
      track: null,
      headline: 'Specify the modification or incident',
      sub: 'Select the change type to determine your reporting obligations.',
      reasons,
      flags
    };
  }

  // Adverse event / breach: report immediately
  if (t === 'adverse_event' || t === 'breach') {
    verdict = 'report_now';
    headline = t === 'adverse_event' ? 'Report this event promptly' : 'Confidentiality breach: Report promptly';
    sub = t === 'adverse_event'
      ? 'Adverse events and unanticipated problems involving risks to subjects must be reported within the IRB\'s mandated timeframe (typically 10 business days; 24-72 hours for serious or fatal events).'
      : 'Confidentiality breaches require prompt reporting to the IRB and institutional privacy officers. Document what happened, affected identifiers, and mitigation steps taken.';
    reasons.push({ kind: 'flag', text: 'Reportable incident under all major institutional frameworks.' });
    reasons.push({ kind: 'note', text: 'Document the incident log immediately, even prior to formal submission. The factual timeline is critical.' });
    if (t === 'breach' && state.jurisdiction === 'eu') {
      flags.push({ kind: 'flag', text: 'GDPR Article 33: Notify supervisory authority within 72 hours of becoming aware of a personal data breach where feasible.' });
    }
    if (t === 'breach' && state.jurisdiction === 'uk') {
      flags.push({ kind: 'flag', text: 'UK GDPR / DPA 2018: ICO notification within 72 hours where rights and freedoms of data subjects are at risk.' });
    }
    return { verdict, track: null, headline, sub, reasons, flags };
  }

  // Continuing review
  if (t === 'continuing') {
    verdict = 'amend_minor';
    headline = 'Prepare continuing review renewal submission';
    sub = 'Annual or periodic re-approval. Even when certain minimal-risk studies under the 2018 Common Rule are exempt from mandatory continuing review, institutions typically require an annual status update.';
    reasons.push({ kind: 'note', text: 'Submit renewal package 4 to 6 weeks before current approval expires to prevent lapse in study authorization.' });
    reasons.push({ kind: 'note', text: 'Required metrics: cumulative enrollment, withdrawals, adverse events, protocol deviations, and relevant new literature.' });
    return { verdict, track: null, headline, sub, reasons, flags };
  }

  // Protocol deviation
  if (t === 'protocol_deviation') {
    verdict = 'report_now';
    headline = 'Report protocol deviation';
    sub = 'Protocol deviations must be reported. Consequences depend on whether participant safety or scientific data integrity were affected, and whether the event was systemic or isolated.';
    reasons.push({ kind: 'flag', text: 'Reportable deviation: document root cause, participant impact assessment, and corrective action plan (CAPA).' });
    return { verdict, track: null, headline, sub, reasons, flags };
  }

  // Amendments
  const isMinor = (t === 'protocol_minor') || (risk === 'none');
  const isMajor = (t === 'protocol_major' || t === 'consent' || t === 'new_population') || (risk === 'adds_major');

  if (status === 'already' && t !== 'protocol_minor') {
    verdict = 'report_now';
    headline = 'Protocol change implemented prior to IRB approval';
    sub = 'Implementing substantive protocol changes prior to approval constitutes an unauthorized deviation. Report to the IRB immediately with a formal explanation, safety audit, and corrective mitigation.';
    flags.push({ kind: 'flag', text: 'Implementing unapproved protocol modifications is an ethics deviation across nearly all jurisdictions.' });
    return { verdict, track: null, headline, sub, reasons, flags };
  }

  if (isMajor) {
    verdict = 'amend_major';
    headline = 'Major amendment required prior to implementation';
    sub = 'Substantive procedural changes, consent form modifications, or recruitment of new populations require formal IRB review and approval before taking effect. Treat the timeline like a new submission for the affected section.';
    reasons.push({ kind: 'flag', text: 'Major amendments require the same review track as the original protocol (expedited or full board).' });
    if (t === 'consent') reasons.push({ kind: 'note', text: 'Already-enrolled participants may need re-consenting depending on the nature of the modifications.' });
    if (t === 'new_population' && (state.population.includes('minors') || state.population.includes('cognitive'))) {
      flags.push({ kind: 'flag', text: 'Adding a vulnerable population triggers convened committee review and additional regulatory safeguards.' });
    }
    return { verdict, track: null, headline, sub, reasons, flags };
  }

  if (isMinor) {
    verdict = 'amend_minor';
    headline = 'Minor amendment: File before implementing';
    sub = 'Most institutions process minor modifications through an administrative or expedited pathway. Submit, await formal acknowledgment or approval (days to a couple weeks), then implement.';
    reasons.push({ kind: 'good', text: 'Risk profile to participants is unchanged or reduced.' });
    reasons.push({ kind: 'note', text: 'Typo corrections, contact updates, and pure clerical adjustments occasionally only require administrative logging.' });
    return { verdict, track: null, headline, sub, reasons, flags };
  }

  return { verdict: 'partial', track: null, headline: 'Select remaining parameters', sub: '', reasons, flags };
}

export function computeSubmissionAudit(state: IrbTriageState): IrbAuditReport {
  const checks: IrbAuditCheck[] = [];
  const isPost = state.mode === 'postapproval';

  if (isPost) {
    checks.push({ pass: !!state.changeType, label: 'Change type identified' });
    checks.push({ pass: !!state.changeStatus, label: 'Implementation status declared' });
    checks.push({ pass: !!state.changeRisk, label: 'Risk impact assessed' });
    checks.push({ pass: !!state.jurisdiction, label: 'Jurisdiction selected' });
  } else {
    checks.push({ pass: !!state.purpose, label: 'Purpose declared' });
    checks.push({ pass: !!state.dataSource, label: 'Data source declared' });
    checks.push({ pass: state.activities.length > 0, label: 'Activities listed' });
    checks.push({ pass: state.population.length > 0, label: 'Population specified' });
    checks.push({ pass: !!state.identifiability, label: 'Identifiability declared' });
    checks.push({ pass: state.sensitivity.length > 0, label: 'Sensitivity declared (incl. "none")' });
    checks.push({ pass: !!state.risk, label: 'Risk level declared' });

    const hasVulnerable = state.population.some(p => ['minors','prisoners','pregnant','cognitive','refugees','critically_ill'].includes(p));
    if (hasVulnerable) {
      checks.push({ pass: state.risk !== null, label: 'Vulnerable population: Explicit risk assessment conducted' });
    }
    const hasSensitive = state.sensitivity.filter(s => s !== 'none').length > 0;
    const isIdentifiable = ['direct','indirect','coded'].includes(state.identifiability || '');
    if (hasSensitive && isIdentifiable) {
      checks.push({ pass: true, kind: 'warn', label: 'Sensitive + Identifiable: Enhanced confidentiality plan mandatory' });
    }
    if (state.activities.includes('ai_subject') || state.activities.includes('ai_training')) {
      checks.push({ pass: true, kind: 'warn', label: 'AI involved: Model documentation and participant disclosure plan required' });
    }
  }

  const passed = checks.filter(c => c.pass).length;
  return { checks, passed, total: checks.length };
}

export function buildIrbDocuments(state: IrbTriageState): string[] {
  const list = ['Full Protocol or Research Plan (aims, recruitment, methodology, data analysis)'];
  if (state.dataSource === 'primary' || state.dataSource === 'both') {
    list.push('Informed Consent Form (with assent form for minors if applicable)');
    list.push('Recruitment materials (flyers, social media ads, email scripts, invitation letters)');
  }
  if (state.activities.includes('survey')) list.push('Complete questionnaire instrument and survey question flow');
  if (state.activities.includes('interview')) list.push('Interview guide or semi-structured focus group protocol');
  if (state.activities.includes('experiment')) list.push('Experimental stimuli, intervention task descriptions, and debriefing script');
  if (state.activities.includes('biomedical')) {
    list.push('Investigator\'s Brochure or Medical Device Operational Manual');
    list.push('Safety monitoring & adverse event reporting protocol');
  }
  if (state.activities.includes('biospecimens')) list.push('Biospecimen acquisition, storage, biobank disposition, and future-use protocol');
  if (state.activities.includes('ai_subject')) {
    list.push('AI system documentation: model provider, version, automated interventions, failure handling');
    list.push('AI disclosure language: how subjects are informed of interacting with an artificial agent');
  }
  if (state.activities.includes('ai_training')) {
    list.push('Training dataset provenance and consent authorization basis');
    list.push('Mitigations against model memorization and re-identification leakage');
  }
  if (['direct', 'indirect', 'coded'].includes(state.identifiability || '')) {
    list.push('Data Management & Information Security Plan (encryption, key custody, access controls)');
  }
  if (state.population.includes('minors')) list.push('Parental Permission Form plus age-appropriate Youth Assent Form');
  if (state.population.includes('cognitive')) list.push('Decision-making capacity assessment protocol and Legally Authorized Representative (LAR) consent');
  if (state.population.includes('indigenous')) list.push('Community partnership letters, Elder council endorsement, and governance agreements');
  if (state.population.includes('lowresource')) list.push('Translated consent forms and oral witness verification procedures');
  list.push('Investigator CV and Human Subjects Ethics Training Certificate (CITI Program, TCPS 2 CORE, or equivalent)');
  if (state.jurisdiction === 'multi') list.push('Institutional approval / reliance letters from each international participating site');
  return list;
}

export function buildJurisdictionNotes(jurisdiction: IrbJurisdiction): string[] {
  const map: Record<IrbJurisdiction, string[]> = {
    us: [
      'Common Rule at 45 CFR 46 (Subpart A), revised 2018; FDA 21 CFR 50/56 for drugs and medical devices.',
      'Eight exempt categories under §46.104(d)(1)–(8). The IRB office makes the determination; investigators cannot self-exempt.',
      'Limited IRB review applies to select exempt categories (notably 2(iii), 3, 7, and 8) per §46.111(a)(7) privacy criteria.',
      'CITI Program Human Subjects Research certification is standard institutional requirement.'
    ],
    uk: [
      'Two-track system: Health Research Authority (HRA) for NHS research; University Research Ethics Committees (RECs) for non-NHS work.',
      'The HRA decision tools (hra.nhs.uk) determine whether NHS REC review is legally required.',
      'Clinical Trials of Investigational Medicinal Products (CTIMPs) fall under MHRA in addition to REC review.',
      'UK GDPR and Data Protection Act 2018 govern personal data; ICO breach notification required within 72 hours where rights are at risk.'
    ],
    eu: [
      'No single EU-wide ethics committee; each member state runs its own statutory institutional framework.',
      'GDPR (Regulation 2016/679) applies to all personal data processing, with Art. 9 derogations for scientific research.',
      'Clinical Trials Regulation (EU) 536/2014 harmonizes interventional pharmaceutical trials via the CTIS portal.',
      'GDPR Article 33 requires notification to supervisory authorities within 72 hours of discovering a personal data breach.',
      'Cross-border consortia require ethics approvals at the designated review board of each participating member state.'
    ],
    ca: [
      'Tri-Council Policy Statement (TCPS 2, 2022) governs research ethics across CIHR, NSERC, and SSHRC institutions.',
      'Research Ethics Boards (REBs) at universities and hospitals conduct review.',
      'Article 2.5 explicitly removes QA, QI, program evaluation, and routine performance reviews from REB scope (not research).',
      'TCPS 2 Chapter 9 establishes mandatory protocols for research involving First Nations, Inuit, and Métis peoples; community engagement is foundational.'
    ],
    au: [
      'National Statement on Ethical Conduct in Human Research (jointly issued by NHMRC, ARC, and Universities Australia).',
      'Institutional Human Research Ethics Committees (HRECs) evaluate research protocols.',
      'Negligible-risk pathways exist for very low-risk studies and may be reviewed administratively outside full HREC.',
      'AIATSIS Code of Ethics for Aboriginal and Torres Strait Islander Research (2020) applies in addition to the National Statement.'
    ],
    in: [
      'ICMR National Ethical Guidelines for Biomedical and Health Research Involving Human Participants (2017) is the reference standard.',
      'Institutional Ethics Committees (IECs) reviewing biomedical research must register with DHR via the Naitik portal.',
      'CDSCO / DCGI regulates clinical drug trials under the New Drugs and Clinical Trials Rules 2019.',
      'Mandatory registration on the Clinical Trials Registry - India (CTRI) prior to enrolling the first human participant.',
      'A dedicated social and behavioral research pathway is delineated within ICMR guidelines.'
    ],
    cn: [
      'NHC Measures for Ethical Review of Life Sciences and Medical Research Involving Humans (February 2023).',
      'MOST Trial Measures for Scientific and Technological Ethics Review (December 2023) covers broader scientific inquiry including AI models and algorithms.',
      'Both frameworks apply in parallel across medical institutions and academic research laboratories.',
      'Human Genetic Resources (HGR) regulations impose strict approval constraints on biological specimen export.',
      'Cross-border data transfers are strictly governed under the Personal Information Protection Law (PIPL).'
    ],
    br: [
      'CEP/CONEP system: Local Research Ethics Committees (CEPs) review standard protocols; CONEP handles special high-risk categories.',
      'All submissions involving humans must be lodged through the federal Plataforma Brasil portal.',
      'Resolution CNS 466/2012 governs biomedical research; Resolution CNS 510/2016 establishes procedures for social sciences and humanities.',
      'Lei 14.874/2024 establishes modern statutory standards for clinical research involving human subjects.',
      'CONEP review is mandatory for international collaboration, indigenous peoples, genetics, and new medical compounds.'
    ],
    multi: [
      'Cross-border multi-site studies: Each participating jurisdiction generally requires independent ethics clearance.',
      'Single-IRB or REC reliance agreements are increasingly supported (e.g. NIH single IRB mandate) but must be formalized via institutional contracts.',
      'Data sovereignty and export regulations (GDPR, HIPAA, PIPL) apply simultaneously across national borders.',
      'Budget additional lead time (3 to 6 months) for parallel regulatory filings.'
    ],
    other: [
      'Universal ethical bedrock: Declaration of Helsinki, Belmont Report principles, and informed consent.',
      'Identify the institutional review board with statutory jurisdiction over your primary affiliated campus.',
      'Check whether study protocols mandate clinical trial registration (WHO ICTRP registry network).',
      'Ensure manuscript disclosure aligns with ICMJE and COPE recommendations prior to journal submission.'
    ]
  };

  return map[jurisdiction] || map.other;
}

/**
 * Generate a ready-to-paste formal Ethics Approval Declaration for manuscripts
 */
export function generateFormalEthicsStatement(
  state: IrbTriageState, 
  institutionName: string = '[Name of University / Institutional Ethics Body]',
  protocolNumber: string = '[IRB Protocol #]'
): string {
  if (state.dataSource === 'nohumans') {
    return `Ethical Approval: Ethical review was not required for this study in accordance with institutional and national statutory guidelines because the research did not involve human participants, animal subjects, or private identifiable human biological materials.`;
  }

  if (state.purpose === 'qi' || state.purpose === 'classroom') {
    return `Ethical Approval: This project was evaluated and determined to constitute institutional quality improvement / educational inquiry rather than human subjects research in accordance with 45 CFR 46 and institutional review board guidelines. Consequently, formal IRB review and approval were waived.`;
  }

  const result = assessIrbTriage(state);

  if (result.verdict === 'exempt') {
    return `Ethical Approval & Informed Consent: This study protocol was reviewed and granted formal exemption from continued Institutional Review Board oversight by the ${institutionName} (Protocol ID: ${protocolNumber}) under exempt research guidelines. Informed consent was obtained from all participants prior to electronic survey administration. All data were collected and analyzed in fully de-identified / anonymous format.`;
  }

  let consentText = 'Informed consent was obtained from all individual participants included in the study.';
  if (state.population.includes('minors')) {
    consentText = 'Written informed parental permission and participant assent were obtained prior to enrollment in accordance with institutional guidelines.';
  } else if (state.identifiability === 'anonymous') {
    consentText = 'Electronic informed consent was recorded from all respondents prior to survey initiation.';
  }

  return `Ethical Approval: All procedures performed in studies involving human participants were in accordance with the ethical standards of the institutional and/or national research committee (${institutionName}, Approval Reference: ${protocolNumber}) and with the 1964 Helsinki Declaration and its later amendments or comparable ethical standards. Informed Consent: ${consentText}`;
}
