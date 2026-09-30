import rawCompassData from './methodologyCompassData.json';
import { callRawLLM, DEFAULT_LLM_CONFIG, type LLMConfig } from './llmService';

export interface CompassAtlasEntry {
  id: string;
  name: string;
  tagline?: string;
  essence: string;
  proponents?: string;
  assumptions?: string[];
  forecloses?: string;
  tensions?: string;
  critique?: string;
  readings?: string[];
}

export interface CompassQuestionOption {
  label: string;
  detail: string;
  votes: Record<string, Record<string, number>>;
}

export interface CompassQuestion {
  id: string;
  layer?: string;
  prompt: string;
  deck?: string;
  context?: string;
  options: CompassQuestionOption[];
}

export interface CompassExemplar {
  id?: string;
  title: string;
  author: string;
  year?: number;
  discipline: string;
  stack: {
    ontology?: string;
    epistemology?: string;
    paradigm?: string;
    methodology?: string;
    method?: string;
    analysis?: string;
  };
  summary: string;
  whyItWorks?: string;
  lesson?: string;
  readIf?: string;
}

export interface CompassGlossaryItem {
  term: string;
  pron?: string;
  def: string;
  seeAlso?: string[];
}

export interface CompassStack {
  ontology: string | null;
  epistemology: string | null;
  paradigm: string | null;
  methodology: string | null;
  method: string | null;
  analysis: string | null;
}

export interface CoherenceDiagnostic {
  pct: number;
  note: string;
  verdict: 'coherent' | 'tense' | 'incoherent' | null;
  oe: number;
  methFit: boolean | null;
  anaFit: boolean | null;
  issues: string[];
}

export interface QuickAnalysisGuide {
  id: string;
  category: 'quantitative' | 'qualitative';
  objective: string;
  bestFor: string;
  recommendedTest: string;
  parametricAlternative?: string;
  nonParametricAlternative?: string;
  keyAssumptions: string[];
  minimumSampleSize: string;
  softwareSyntax: {
    r?: string;
    python?: string;
    spssOrStata?: string;
  };
  reportingTemplate: string;
}

// Quick analysis guide recommendations for rapid discovery
export const QUICK_ANALYSIS_GUIDES: QuickAnalysisGuide[] = [
  {
    id: 'compare-two-groups',
    category: 'quantitative',
    objective: 'Compare means between 2 independent groups',
    bestFor: 'A/B testing, treatment vs control, gender or cohort differences on a continuous metric.',
    recommendedTest: 'Independent Samples t-Test',
    parametricAlternative: 'Student t-test (equal variances) or Welch t-test (unequal variances)',
    nonParametricAlternative: 'Mann-Whitney U Test (Wilcoxon Rank-Sum)',
    keyAssumptions: ['Continuous dependent variable', 'Independent observations', 'Normality of residuals (or N > 30 per CLT)', 'Homogeneity of variance (Levene test; use Welch t-test if violated)'],
    minimumSampleSize: 'Minimum ~30 per group for 80% power at medium effect size (d = 0.50).',
    softwareSyntax: {
      r: 't.test(outcome ~ group, data = df, var.equal = FALSE)',
      python: 'from scipy import stats\nstats.ttest_ind(group1, group2, equal_var=False)',
      spssOrStata: 'SPSS: Analyze > Compare Means > Independent-Samples T Test | Stata: ttest outcome, by(group) unequal'
    },
    reportingTemplate: 'An independent-samples Welch t-test revealed a statistically significant difference between Group A (M = 4.32, SD = 0.85) and Group B (M = 3.65, SD = 0.91), t(78.4) = 3.42, p = .001, Cohen\'s d = 0.76, 95% CI [0.31, 1.21].'
  },
  {
    id: 'compare-three-plus-groups',
    category: 'quantitative',
    objective: 'Compare means across 3 or more independent groups',
    bestFor: 'Multiple treatment arms, organizational tiers, geographical regions.',
    recommendedTest: 'One-Way Analysis of Variance (ANOVA)',
    parametricAlternative: 'One-Way ANOVA with Tukey HSD or Bonferroni post-hoc tests',
    nonParametricAlternative: 'Kruskal-Wallis H Test with Dunn post-hoc test',
    keyAssumptions: ['Continuous outcome', 'Independent observations', 'Normality of residuals across groups', 'Homoscedasticity (use Welch ANOVA / Games-Howell if violated)'],
    minimumSampleSize: '~20-30 observations per cell minimum.',
    softwareSyntax: {
      r: 'res <- aov(outcome ~ group, data = df); summary(res); TukeyHSD(res)',
      python: 'import statsmodels.api as sm\nfrom statsmodels.formula.api import ols\nmodel = ols("outcome ~ C(group)", data=df).fit()\nsm.stats.anova_lm(model, typ=2)',
      spssOrStata: 'SPSS: Analyze > Compare Means > One-Way ANOVA > Post Hoc: Tukey | Stata: oneway outcome group, tabulate bonferroni'
    },
    reportingTemplate: 'A one-way ANOVA indicated a significant main effect of intervention condition on performance, F(2, 147) = 6.84, p = .001, partial η² = .085. Post-hoc comparisons with Tukey HSD confirmed that Condition 1 scored significantly higher than Control (p = .002).'
  },
  {
    id: 'predict-continuous-dv',
    category: 'quantitative',
    objective: 'Predict a continuous outcome from multiple predictors',
    bestFor: 'Hypothesis testing with control variables, assessing relative contribution of distinct predictors.',
    recommendedTest: 'Multiple Linear Regression (OLS)',
    parametricAlternative: 'Ordinary Least Squares (OLS) Regression',
    nonParametricAlternative: 'Quantile Regression or Robust Regression (Huber/M-estimation)',
    keyAssumptions: ['Linearity in parameters', 'Independence of residuals (Durbin-Watson ~ 2.0)', 'Homoscedasticity (Breusch-Pagan test)', 'No severe multicollinearity (VIF < 5.0)', 'Normality of residuals'],
    minimumSampleSize: 'Rule of thumb: 15-20 observations per predictor variable, or N > 104 + k (Green, 1991).',
    softwareSyntax: {
      r: 'model <- lm(y ~ x1 + x2 + control1, data = df); summary(model)',
      python: 'import statsmodels.formula.api as smf\nmodel = smf.ols("y ~ x1 + x2 + control1", data=df).fit()\nprint(model.summary())',
      spssOrStata: 'SPSS: Analyze > Regression > Linear | Stata: regress y x1 x2 control1'
    },
    reportingTemplate: 'Multiple linear regression demonstrated that predictors accounted for significant variance in the outcome, R² = .42, Adjusted R² = .40, F(3, 196) = 47.3, p < .001. Specifically, predictor X1 exhibited a positive association (β = .38, p < .001).'
  },
  {
    id: 'predict-binary-dv',
    category: 'quantitative',
    objective: 'Predict a binary categorical outcome (Yes/No, Adopted/Churned)',
    bestFor: 'Adoption decisions, medical diagnoses, failure vs success, retention.',
    recommendedTest: 'Binary Logistic Regression',
    parametricAlternative: 'Binary Logistic Regression (Logit)',
    nonParametricAlternative: 'Random Forest or Probit Regression',
    keyAssumptions: ['Binary outcome', 'Independence of observations', 'No severe multicollinearity', 'Linearity of independent variables and log-odds (Box-Tidwell test)', 'Adequate Events-Per-Variable (EPV >= 10-15)'],
    minimumSampleSize: 'Minimum 10 to 15 events in the smaller outcome category per predictor variable.',
    softwareSyntax: {
      r: 'glm_model <- glm(y ~ x1 + x2, data = df, family = binomial(link = "logit")); exp(coef(glm_model))',
      python: 'import statsmodels.formula.api as smf\nlogit_model = smf.logit("y ~ x1 + x2", data=df).fit()\nprint(logit_model.summary())',
      spssOrStata: 'SPSS: Analyze > Regression > Binary Logistic | Stata: logit y x1 x2, or'
    },
    reportingTemplate: 'Binary logistic regression revealed that X1 significantly increased the likelihood of adoption (B = 0.64, SE = 0.18, Wald = 12.6, p < .001, Odds Ratio = 1.90, 95% CI [1.33, 2.70]), indicating a 90% increase in odds per unit increase in X1.'
  },
  {
    id: 'latent-variables-sem',
    category: 'quantitative',
    objective: 'Examine complex networks of latent constructs, mediation, and moderation',
    bestFor: 'Survey instruments with multi-item scales, theoretical models in management, psychology, and marketing.',
    recommendedTest: 'Structural Equation Modelling (SEM) / PLS-SEM',
    parametricAlternative: 'Covariance-Based SEM (CB-SEM via lavaan/AMOS) or PLS-SEM (SmartPLS/cSEM)',
    nonParametricAlternative: 'Partial Least Squares (PLS-SEM) for exploratory or non-normal distribution',
    keyAssumptions: ['Adequate construct reliability (CR > .70, Cronbach α > .70)', 'Convergent validity (AVE > .50)', 'Discriminant validity (HTMT < .85 or Fornell-Larcker criterion)', 'Good model fit (SRMR < .08, CFI > .95, RMSEA < .06)'],
    minimumSampleSize: 'Minimum 150-200 for CB-SEM; 10 times rule or G*Power calculation for PLS-SEM.',
    softwareSyntax: {
      r: 'library(lavaan)\nmodel <- "latent1 =~ i1 + i2 + i3; latent2 =~ i4 + i5 + i6; latent2 ~ latent1"\nfit <- sem(model, data = df); summary(fit, fit.measures=TRUE, standardized=TRUE)',
      python: 'import semopy\nmodel = """latent1 =~ i1 + i2 + i3\nlatent2 =~ i4 + i5 + i6\nlatent2 ~ latent1"""\nm = semopy.Model(model)\nm.fit(df)',
      spssOrStata: 'SPSS AMOS: Graphical Model Builder | Stata: sem (latent1 -> i1 i2 i3) (latent2 -> i4 i5 i6), latent(latent1 latent2)'
    },
    reportingTemplate: 'Confirmatory factor analysis and structural equation modelling verified acceptable model fit (χ²(84) = 112.4, p = .021, CFI = .978, TLI = .971, RMSEA = .038, 95% CI [.014, .056], SRMR = .041). The hypothesized path from Latent 1 to Latent 2 was significant (β = .44, p < .001).'
  },
  {
    id: 'thematic-analysis',
    category: 'qualitative',
    objective: 'Identify, analyze, and report patterns of meaning across qualitative text',
    bestFor: 'Interview transcripts, open survey questions, focus groups across exploratory topics.',
    recommendedTest: 'Reflexive Thematic Analysis (Braun & Clarke, 2006, 2019)',
    keyAssumptions: ['Researcher subjectivity is conceptualized as an analytical resource, not a bias to be eliminated', 'Iterative 6-phase process: Familiarization, Initial coding, Generating initial themes, Reviewing themes, Defining & naming, Writing report', 'Does not mandate codebook reliability or inter-rater kappa in reflexive tradition'],
    minimumSampleSize: 'Typically 12 to 25 rich in-depth interviews or until conceptual informational depth is demonstrated.',
    softwareSyntax: {
      r: 'MAXQDA / NVivo / Atlas.ti / Taguette (Open Source)',
      python: 'QualCoder (Open Source Python-based qualitative analysis suite)',
      spssOrStata: 'Dedicated CAQDAS software or Excel/Word structured codebooks'
    },
    reportingTemplate: 'Transcripts were analyzed using Reflexive Thematic Analysis following Braun and Clarke (2019). The analysis generated three overarching themes and six subthemes that captured participants\' negotiated transitions.'
  },
  {
    id: 'phenomenology-ipa',
    category: 'qualitative',
    objective: 'Explore in depth how individuals make sense of a major life-world experience',
    bestFor: 'Deep psychological or existential lived experiences (e.g. chronic illness, leadership crisis, whistleblowing).',
    recommendedTest: 'Interpretative Phenomenological Analysis (IPA)',
    keyAssumptions: ['Phenomenological: focus on lived experience', 'Hermeneutic: double hermeneutic (the researcher makes sense of the participant making sense of their experience)', 'Idiographic: deep commitment to individual cases before cross-case pattern synthesis'],
    minimumSampleSize: 'Purposive, highly homogenous sample of 4 to 10 participants.',
    softwareSyntax: {
      r: 'NVivo or manual multi-column hermeneutic notes (descriptive, linguistic, conceptual)',
      python: 'Manual narrative transcript tables',
      spssOrStata: 'Manual idiographic case matrices'
    },
    reportingTemplate: 'Following Smith, Flowers, and Larkin (2009), transcripts underwent detailed idiographic coding. Descriptive, linguistic, and conceptual comments were generated for each participant before cross-case Personal Experiential Themes (PETs) were consolidated.'
  },
  {
    id: 'grounded-theory',
    category: 'qualitative',
    objective: 'Generate an explanatory substantive theory of a process grounded in empirical data',
    bestFor: 'Processes where existing theoretical frameworks are absent, insufficient, or misleading.',
    recommendedTest: 'Constructivist Grounded Theory (Charmaz, 2014)',
    keyAssumptions: ['Theoretical sampling directs ongoing data collection', 'Constant comparative method across incidents, codes, and categories', 'Simultaneous data collection and analysis', 'Theoretical saturation of core category'],
    minimumSampleSize: '20 to 50 interviews or theoretical saturation reached.',
    softwareSyntax: {
      r: 'Atlas.ti / MAXQDA / NVivo (Open, Focused, Theoretical coding stages & memoing)',
      python: 'QualCoder memoing tool',
      spssOrStata: 'Dedicated CAQDAS network maps'
    },
    reportingTemplate: 'Analysis adhered to Constructivist Grounded Theory principles (Charmaz, 2014). Initial line-by-line coding using gerunds was followed by focused coding, constant memo-writing, and theoretical sampling until a core substantive category emerged.'
  }
];

export const ATLAS = rawCompassData.ATLAS as unknown as Record<string, CompassAtlasEntry[]>;
export const COMPAT = rawCompassData.COMPAT as unknown as {
  ontoEpi: Record<string, Record<string, number>>;
  epiMeth: Record<string, string[]>;
  methToMethods: Record<string, string[]>;
  methToAnalysis: Record<string, string[]>;
};
export const QUESTIONS = rawCompassData.QUESTIONS as unknown as CompassQuestion[];
export const GLOSSARY = rawCompassData.GLOSSARY as unknown as CompassGlossaryItem[];
export const EXEMPLARS = rawCompassData.EXEMPLARS as unknown as CompassExemplar[];
export const ELI5 = rawCompassData.ELI5 as Record<string, string>;
export const ADJACENT = rawCompassData.ADJACENT as Record<string, string[]>;
export const LAYERS_ORDER = rawCompassData.LAYERS_ORDER as string[];
export const LAYER_LABELS = rawCompassData.LAYER_LABELS as Record<string, string>;

export function getAtlasEntry(layer: string, id: string): CompassAtlasEntry | undefined {
  return (ATLAS[layer] || []).find((e) => e.id === id);
}

export function tallyVotes(answers: (number | null)[]): Record<string, Record<string, number>> {
  const totals: Record<string, Record<string, number>> = {};
  LAYERS_ORDER.forEach((l) => {
    totals[l] = {};
  });

  answers.forEach((optionIdx, qIdx) => {
    if (optionIdx == null) return;
    const q = QUESTIONS[qIdx];
    if (!q) return;
    const opt = q.options[optionIdx];
    if (!opt || !opt.votes) return;
    Object.keys(opt.votes).forEach((layer) => {
      if (!totals[layer]) totals[layer] = {};
      const idMap = opt.votes[layer];
      Object.keys(idMap).forEach((id) => {
        totals[layer][id] = (totals[layer][id] || 0) + idMap[id];
      });
    });
  });
  return totals;
}

export function deriveParadigm(_onto: string | null, epi: string | null): string | null {
  if (!epi) return null;
  if (epi === 'critical') return 'radical-structuralist';
  if (epi === 'post-structural') return 'radical-humanist';
  if (epi === 'participatory') return 'pragmatist-paradigm';
  if (epi === 'pragmatism') return 'pragmatist-paradigm';
  if (epi === 'positivism' || epi === 'post-positivism') return 'functionalist';
  if (epi === 'interpretivism' || epi === 'constructivism') return 'interpretive';
  if (epi === 'indigenous-epistemologies') return 'critical-race';
  return null;
}

export function computeStack(
  answers: (number | null)[],
  manualOverrides: Record<string, string | null> = {}
): CompassStack {
  const totals = tallyVotes(answers);
  const stack: Record<string, string | null> = {};

  LAYERS_ORDER.forEach((layer) => {
    if (manualOverrides[layer]) {
      stack[layer] = manualOverrides[layer];
      return;
    }
    const entries = Object.keys(totals[layer] || {}).map((k) => [k, totals[layer][k]] as [string, number]);
    if (entries.length === 0) {
      stack[layer] = null;
      return;
    }
    entries.sort((a, b) => b[1] - a[1]);
    stack[layer] = entries[0][0];
  });

  // Cascade
  if (!stack.paradigm && stack.epistemology) {
    stack.paradigm = deriveParadigm(stack.ontology, stack.epistemology);
  }
  if (!stack.methodology && stack.epistemology && COMPAT.epiMeth[stack.epistemology]) {
    stack.methodology = COMPAT.epiMeth[stack.epistemology][0];
  }
  if (!stack.method && stack.methodology && COMPAT.methToMethods[stack.methodology]) {
    stack.method = COMPAT.methToMethods[stack.methodology][0];
  }
  if (!stack.analysis && stack.methodology && COMPAT.methToAnalysis[stack.methodology]) {
    stack.analysis = COMPAT.methToAnalysis[stack.methodology][0];
  }

  return stack as unknown as CompassStack;
}

export function getAlternatives(answers: (number | null)[]): Record<string, string[]> {
  const totals = tallyVotes(answers);
  const alts: Record<string, string[]> = {};
  LAYERS_ORDER.forEach((layer) => {
    const entries = Object.keys(totals[layer] || {})
      .map((k) => [k, totals[layer][k]] as [string, number])
      .sort((a, b) => b[1] - a[1]);
    alts[layer] = entries.slice(1, 3).map((e) => e[0]);
  });
  return alts;
}

export function computeCoherence(stack: CompassStack): CoherenceDiagnostic {
  const onto = stack.ontology;
  const epi = stack.epistemology;
  const meth = stack.methodology;
  const ana = stack.analysis;

  if (!onto || !epi) {
    return {
      pct: 0,
      note: 'Make selections to begin diagnosing your research architecture.',
      verdict: null,
      oe: 0,
      methFit: null,
      anaFit: null,
      issues: []
    };
  }

  const oeRaw = (COMPAT.ontoEpi[onto] || {})[epi];
  const oe = oeRaw == null ? 0 : oeRaw;

  let methFit: boolean | null = null;
  if (meth) methFit = (COMPAT.epiMeth[epi] || []).indexOf(meth) !== -1;
  let anaFit: boolean | null = null;
  if (ana && meth) anaFit = (COMPAT.methToAnalysis[meth] || []).indexOf(ana) !== -1;

  let pct = ((oe + 1) / 2) * 70;
  if (methFit === true) pct += 20;
  else if (methFit === false) pct -= 10;
  if (anaFit === true) pct += 10;
  else if (anaFit === false) pct -= 5;
  pct = Math.max(0, Math.min(100, Math.round(pct)));

  let verdict: 'coherent' | 'tense' | 'incoherent';
  let note: string;
  if (pct >= 75) {
    verdict = 'coherent';
    note = 'These commitments hold together seamlessly. The architecture is internally consistent.';
  } else if (pct >= 45) {
    verdict = 'tense';
    note = 'There is productive tension here. You will need to explicitly argue the bridge in your methodology defense.';
  } else {
    verdict = 'incoherent';
    note = 'These layers pull against one another. Reconsider, or write a dedicated philosophical justification.';
  }

  const issues: string[] = [];
  if (oe < 0) issues.push('Your ontology and epistemology pull in opposing directions.');
  if (methFit === false) issues.push('Your methodology is uncommon for this epistemological stance.');
  if (anaFit === false) issues.push('Your analytic technique is rarely paired with this methodology.');
  if (issues.length) note += ' ' + issues.join(' ');

  return { pct, note, verdict, oe, methFit, anaFit, issues };
}

function capitalize(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function generateMethodsParagraph(stack: CompassStack): string {
  const o = stack.ontology ? getAtlasEntry('ontology', stack.ontology) : null;
  const e = stack.epistemology ? getAtlasEntry('epistemology', stack.epistemology) : null;
  const m = stack.methodology ? getAtlasEntry('methodology', stack.methodology) : null;
  const meth = stack.method ? getAtlasEntry('method', stack.method) : null;
  const a = stack.analysis ? getAtlasEntry('analysis', stack.analysis) : null;

  if (!o && !e && !m) {
    return 'Select your research design layers to generate an APA-compliant draft methods chapter paragraph.';
  }

  const sentences: string[] = [];

  if (o && e) {
    sentences.push(
      `This study is grounded in ${o.name.toLowerCase()} and informed by ${e.name.toLowerCase()}, which together hold that ${o.tagline || 'the social world has an intelligible structure that disciplined inquiry can engage'}.`
    );
  } else if (e) {
    sentences.push(`Epistemologically, this study operates within ${e.name.toLowerCase()}.`);
  }

  if (m) {
    const methPlain = ELI5[m.id] || m.tagline || '';
    sentences.push(
      `Given this stance, I employ ${m.name.toLowerCase()} as the overarching methodological strategy. ${methPlain ? capitalize(methPlain) : ''}`
    );
  }

  if (meth) {
    sentences.push(`Data are collected and generated via ${meth.name.toLowerCase()}${meth.tagline ? ` (${meth.tagline.toLowerCase()})` : ''}.`);
  }

  if (a) {
    sentences.push(`Analytical strategy follows ${a.name.toLowerCase()}${a.tagline ? `, ${a.tagline.toLowerCase()}` : ''}.`);
  }

  // Coherence note
  const coh = computeCoherence(stack);
  if (coh.verdict === 'tense') {
    sentences.push(
      'Because this configuration sits in productive tension between mainstream traditions, the methods chapter explicitly justifies the bridge rather than asserting it.'
    );
  } else if (coh.verdict === 'incoherent') {
    sentences.push(
      'This unconventional configuration is adopted deliberately; the methods chapter argues for it at length, engaging counter-arguments directly.'
    );
  } else if (coh.verdict === 'coherent') {
    sentences.push(
      'The chosen layers are mutually reinforcing, which permits the manuscript to focus on rigor of execution rather than defensive philosophical justification.'
    );
  }

  return sentences.join(' ');
}

export function generateMarkdown(stack: CompassStack, answers: (number | null)[]): string {
  const coh = computeCoherence(stack);
  const alts = getAlternatives(answers);

  const lines: string[] = [];
  lines.push('# Research Architecture Dossier');
  lines.push('');
  lines.push('_Generated by ScholarForge Methodology & Analysis Compass (Curated by Professor Babu George)._');
  lines.push('');
  lines.push(`Generated: ${new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}`);
  lines.push('');

  if (coh.verdict) {
    const verdictLabel = coh.verdict.charAt(0).toUpperCase() + coh.verdict.slice(1);
    lines.push(`**Overall Coherence:** ${coh.pct}% (${verdictLabel})`);
    lines.push('');
  }

  lines.push('## The Methodological Stack');
  lines.push('');
  const layers = [
    { key: 'ontology', label: 'Ontology' },
    { key: 'epistemology', label: 'Epistemology' },
    { key: 'paradigm', label: 'Paradigm' },
    { key: 'methodology', label: 'Methodology' },
    { key: 'method', label: 'Data Collection Method' },
    { key: 'analysis', label: 'Analytical Strategy' }
  ];

  layers.forEach((l) => {
    const id = stack[l.key as keyof CompassStack];
    const e = id ? getAtlasEntry(l.key, id) : null;
    if (e) {
      lines.push(`- **${l.label}:** ${e.name}${e.tagline ? ` — ${e.tagline}` : ''}`);
    } else {
      lines.push(`- **${l.label}:** _(not determined)_`);
    }
  });
  lines.push('');

  lines.push('## Plain-English Lay Notes (ELI5)');
  lines.push('');
  layers.forEach((l) => {
    const id = stack[l.key as keyof CompassStack];
    const eli5 = id && ELI5[id];
    if (eli5) {
      const e = getAtlasEntry(l.key, id);
      lines.push(`### ${l.label}: ${e ? e.name : id}`);
      lines.push('');
      lines.push(eli5);
      lines.push('');
    }
  });

  lines.push('## Draft Methodology Paragraph (Ready for Manuscript / Dissertation)');
  lines.push('');
  lines.push('> ' + generateMethodsParagraph(stack));
  lines.push('');

  if (coh.note) {
    lines.push('## Coherence & Defense Diagnostic');
    lines.push('');
    lines.push(coh.note);
    lines.push('');
  }

  const altLines: string[] = [];
  layers.forEach((l) => {
    if (alts[l.key] && alts[l.key].length) {
      const items = alts[l.key]
        .map((id) => {
          const e = getAtlasEntry(l.key, id);
          return e ? e.name : id;
        })
        .join('; ');
      altLines.push(`- **${l.label}:** ${items}`);
    }
  });
  if (altLines.length) {
    lines.push('## Alternative Configurations Worth Weighing');
    lines.push('');
    altLines.forEach((al) => lines.push(al));
    lines.push('');
  }

  return lines.join('\n');
}

export interface AIMethodologyRecommendation {
  summary: string;
  recommendedStack: {
    ontology: string;
    ontologyName: string;
    epistemology: string;
    epistemologyName: string;
    paradigm: string;
    paradigmName: string;
    methodology: string;
    methodologyName: string;
    method: string;
    methodName: string;
    analysis: string;
    analysisName: string;
  };
  designRationale: string;
  keyAssumptions: string[];
  sampleSizeGuidance: string;
  softwareSyntax: {
    r: string;
    python: string;
    spssOrStata: string;
  };
  apaMethodologyProse: string;
  suggestedSyntheticPreset?: 'moderation' | 'mediation' | 'sem_cfa' | 'anova_factorial' | 'logistic_regression' | 'longitudinal' | 'semi_structured_interviews' | 'focus_group';
}

/**
 * Intelligent deterministic fallback recommender when offline or built-in AI mode is active.
 */
export function generateDeterministicRecommendation(
  researchObjective: string,
  dataDescription: string,
  discipline: string = 'General Academic'
): AIMethodologyRecommendation {
  const query = `${researchObjective} ${dataDescription} ${discipline}`.toLowerCase();

  // 1. Moderation / Interaction Analysis
  if (query.includes('moderat') || query.includes('interaction') || query.includes('buffer') || query.includes('boundary condition')) {
    return {
      summary: `A quantitative cross-sectional moderated regression framework (Hayes PROCESS Model 1) is recommended to evaluate whether the conditioning variable alters the strength or direction of the primary relationship.`,
      recommendedStack: {
        ontology: 'critical-realism',
        ontologyName: 'Critical Realism',
        epistemology: 'post-positivism',
        epistemologyName: 'Post-Positivism',
        paradigm: 'functionalist',
        paradigmName: 'Functionalist Paradigm',
        methodology: 'survey',
        methodologyName: 'Cross-Sectional Survey',
        method: 'survey-instrument',
        methodName: 'Structured Likert Instrument',
        analysis: 'ols-regression',
        analysisName: 'Moderated Multiple Regression (OLS / PROCESS)'
      },
      designRationale: `Moderation inquiries require verifying conditional effects ($Y = \\beta_0 + \\beta_1 X + \\beta_2 W + \\beta_3 XW + \\epsilon$). A post-positivist survey methodology aligns with continuous psychological/behavioral constructs, while critical realism accommodates fallible measurement of generative mechanisms under varying boundary conditions.`,
      keyAssumptions: [
        'Linearity of conditional relationships across all values of the moderator',
        'Independence of observations and absence of autocorrelation (Durbin-Watson ~ 2.0)',
        'Mean-centering of continuous predictor and moderator to reduce non-essential multicollinearity (VIF < 5.0)',
        'Homoscedasticity of error variance (checked via Breusch-Pagan / Koenker test)'
      ],
      sampleSizeGuidance: `Statistical power simulations (G*Power 3.1) indicate a minimum sample size of N = 180 to 250 is required to detect small-to-medium interaction effects (f² = 0.05 - 0.10) with 80% power at α = .05.`,
      softwareSyntax: {
        r: `# R syntax using 'interactions' and 'processr'\nlibrary(interactions)\nmodel <- lm(outcome ~ predictor * moderator + control1, data = df)\nsummary(model)\nsim_slopes(model, pred = predictor, modx = moderator, jn = TRUE)`,
        python: `# Python statsmodels OLS with interaction\nimport statsmodels.formula.api as smf\nmodel = smf.ols('outcome ~ predictor * moderator + control1', data=df).fit()\nprint(model.summary())`,
        spssOrStata: `SPSS: Run Hayes PROCESS Macro Model 1:\nPROCESS y=outcome /x=predictor /m=moderator /c=control1 /model=1 /center=1 /plot=1.\nStata: regress outcome c.predictor##c.moderator control1`
      },
      apaMethodologyProse: `To test the hypothesized moderating effect, hierarchical multiple ordinary least squares (OLS) regression analysis was conducted following the procedures outlined by Aiken and West (1991) and Hayes (2022). Continuous predictor and moderator variables were mean-centered prior to forming the interaction product term to mitigate non-essential multicollinearity. Conditional effects were probed using the Johnson-Neyman technique to identify the exact regions of significance along the continuum of the moderator.`,
      suggestedSyntheticPreset: 'moderation'
    };
  }

  // 2. Mediation Analysis
  if (query.includes('mediat') || query.includes('indirect effect') || query.includes('intervening') || query.includes('mechanism')) {
    return {
      summary: `A statistical mediation model (Hayes PROCESS Model 4 / Path Analysis) is recommended to unpack the indirect transmission mechanism through which the antecedent influences the criterion.`,
      recommendedStack: {
        ontology: 'critical-realism',
        ontologyName: 'Critical Realism',
        epistemology: 'post-positivism',
        epistemologyName: 'Post-Positivism',
        paradigm: 'functionalist',
        paradigmName: 'Functionalist Paradigm',
        methodology: 'survey',
        methodologyName: 'Multi-Wave or Cross-Sectional Survey',
        method: 'survey-instrument',
        methodName: 'Standardized Psychometric Scales',
        analysis: 'sem',
        analysisName: 'Path Analysis & Bootstrapped Indirect Effects'
      },
      designRationale: `Mediation explores generative causal pathways ($X \\to M \\to Y$). Post-positivism justifies modeling latent transmission processes while bootstrapping provides distribution-free inferences for the asymmetric indirect effect product ($a \\times b$).`,
      keyAssumptions: [
        'Correct temporal or theoretical causal ordering (X precedes M, M precedes Y)',
        'Absence of omitted mediator-outcome confounders (Judd & Kenny, 1981)',
        'Reliability of measurement for the mediator (unreliability deflates indirect effect estimates)',
        'Non-zero bootstrapped confidence intervals for the product term a * b (5,000 resamples)'
      ],
      sampleSizeGuidance: `Empirical guidelines (Fritz & MacKinnon, 2007) recommend N >= 148 for the bias-corrected bootstrap to achieve 80% power under medium path coefficients (a = .39, b = .39).`,
      softwareSyntax: {
        r: `# R syntax using lavaan for mediation\nlibrary(lavaan)\nmodel <- '\n  mediator ~ a*predictor\n  outcome ~ b*mediator + c_prime*predictor\n  indirect := a*b\n  total := c_prime + (a*b)\n'\nfit <- sem(model, data = df, se = "bootstrap", bootstrap = 5000)\nsummary(fit, standardized = TRUE, ci = TRUE)`,
        python: `# Python path analysis\nfrom semopy import Model\ndesc = '''\nmediator ~ predictor\noutcome ~ mediator + predictor\n'''\nmod = Model(desc)\nmod.fit(df)`,
        spssOrStata: `SPSS Hayes PROCESS Macro Model 4:\nPROCESS y=outcome /x=predictor /m=mediator /model=4 /boot=5000 /seed=12345.\nStata: sem (mediator <- predictor) (outcome <- mediator predictor), vce(bootstrap, reps(5000))`
      },
      apaMethodologyProse: `Hypothesized indirect transmission pathways were evaluated using path-analytic mediation modeling with non-parametric percentile bootstrapping (5,000 resamples) to generate 95% bias-corrected confidence intervals (Preacher & Hayes, 2008). A statistically significant indirect effect is corroborated when the 95% bootstrap confidence interval excludes zero, bypassing distributional assumptions of normality for the product term.`,
      suggestedSyntheticPreset: 'mediation'
    };
  }

  // 3. Structural Equation Modeling / Latent Scale Validation
  if (query.includes('sem') || query.includes('cfa') || query.includes('latent') || query.includes('structural equation') || query.includes('factor analysis') || query.includes('cronbach')) {
    return {
      summary: `A two-step Covariance-Based Structural Equation Modeling (CB-SEM) or PLS-SEM approach is recommended to validate measurement construct reliability (CFA) before assessing structural path relationships.`,
      recommendedStack: {
        ontology: 'critical-realism',
        ontologyName: 'Critical Realism',
        epistemology: 'post-positivism',
        epistemologyName: 'Post-Positivism',
        paradigm: 'functionalist',
        paradigmName: 'Functionalist Paradigm',
        methodology: 'survey',
        methodologyName: 'Multi-Item Psychometric Survey',
        method: 'survey-instrument',
        methodName: 'Validated Multi-Item Likert Batteries',
        analysis: 'sem',
        analysisName: 'Confirmatory Factor Analysis (CFA) & SEM'
      },
      designRationale: `CB-SEM explicitly accounts for measurement error in observed indicator items, separating true score variance from error variance. This aligns with critical realist epistemology where underlying latent constructs are unobservable generative realities.`,
      keyAssumptions: [
        'Multivariate normality of continuous indicator items (or use robust estimators such as Satorra-Bentler / MLM / MLR)',
        'Convergent validity: standardized factor loadings λ > 0.70, Average Variance Extracted (AVE) > 0.50',
        'Discriminant validity: Fornell-Larcker criterion and Heterotrait-Monotrait (HTMT < 0.85)',
        'Construct reliability: Composite Reliability (CR) > 0.80 and Cronbach alpha > 0.70'
      ],
      sampleSizeGuidance: `Rule of thumb: 10 observations per estimated parameter, or minimum N = 200-300 for stable covariance estimation (Kline, 2016).`,
      softwareSyntax: {
        r: `# R lavaan CFA and Structural Model\nlibrary(lavaan)\ncfa_model <- '\n  F1 =~ item1 + item2 + item3\n  F2 =~ item4 + item5 + item6\n  F2 ~ F1\n'\nfit <- sem(cfa_model, data = df, estimator = "MLR")\nsummary(fit, fit.measures = TRUE, standardized = TRUE)`,
        python: `# Python semopy CFA\nfrom semopy import Model\nmodel = Model('F1 =~ item1 + item2 + item3\\nF2 =~ item4 + item5 + item6\\nF2 ~ F1')\nmodel.fit(df)`,
        spssOrStata: `SPSS AMOS: Draw path diagram with latent ellipses and observed rectangles | Stata: sem (F1 -> item1 item2 item3) (F2 -> item4 item5 item6) (F2 <- F1), method(mlmv)`
      },
      apaMethodologyProse: `The statistical analysis followed Anderson and Gerbing's (1988) two-step structural equation modeling paradigm. First, confirmatory factor analysis (CFA) was conducted to evaluate the measurement model's construct validity, convergent loadings, and discriminant boundaries. Model goodness-of-fit was adjudicated using the comparative fit index (CFI >= .95), Tucker-Lewis index (TLI >= .95), root mean square error of approximation (RMSEA <= .06), and standardized root mean square residual (SRMR <= .08) (Hu & Bentler, 1999). Second, the structural model was estimated to examine hypothesized directional relations.`,
      suggestedSyntheticPreset: 'sem_cfa'
    };
  }

  // 4. Experimental / Factorial ANOVA Designs
  if (query.includes('experiment') || query.includes('trial') || query.includes('treatment') || query.includes('control') || query.includes('a/b') || query.includes('anova') || query.includes('ancova') || query.includes('rct')) {
    return {
      summary: `A randomized controlled factorial experiment (2x2 Factorial ANOVA / ANCOVA) is recommended to establish robust internal validity and isolate true causal treatment effects.`,
      recommendedStack: {
        ontology: 'naive-realism',
        ontologyName: 'Empirical Realism',
        epistemology: 'positivism',
        epistemologyName: 'Positivism',
        paradigm: 'functionalist',
        paradigmName: 'Functionalist Paradigm',
        methodology: 'experiment',
        methodologyName: 'Randomized Controlled Trial / Lab Experiment',
        method: 'experimental-task',
        methodName: 'Randomized Experimental Intervention & Baseline Covariate Assessment',
        analysis: 'anova',
        analysisName: 'Factorial ANOVA / ANCOVA'
      },
      designRationale: `Experiments represent the gold standard for establishing causal precedence (X precedes Y, co-variation, and elimination of plausible rival explanations via true random assignment). Positivist epistemology is directly satisfied through manipulation and objective measurement.`,
      keyAssumptions: [
        'True random assignment of participants to experimental conditions',
        'Homogeneity of variance across cells (Levene test p > .05; Welch ANOVA if violated)',
        'Normality of residuals within experimental cells (Shapiro-Wilk / Q-Q plots)',
        'For ANCOVA: Homogeneity of regression slopes between covariate and factors'
      ],
      sampleSizeGuidance: `Power analysis (G*Power) indicates N = 128 (32 per cell in a 2x2 design) is required to detect a medium interaction effect (f = 0.25) with power 1 - β = .80 at α = .05.`,
      softwareSyntax: {
        r: `# R 2x2 Factorial ANOVA\nres <- aov(outcome ~ factorA * factorB + covariate, data = df)\nsummary(res)\nTukeyHSD(res)`,
        python: `# Python statsmodels ANOVA\nimport statsmodels.api as sm\nfrom statsmodels.formula.api import ols\nmodel = ols('outcome ~ C(factorA) * C(factorB) + covariate', data=df).fit()\nsm.stats.anova_lm(model, typ=2)`,
        spssOrStata: `SPSS: Analyze > General Linear Model > Univariate > Dependent: outcome | Fixed Factors: factorA, factorB | Covariate: baseline\nStata: anova outcome factorA##factorB c.covariate`
      },
      apaMethodologyProse: `Data were analyzed using a 2x2 between-subjects factorial analysis of covariance (ANCOVA). Treatment condition and moderating factor served as independent fixed factors, with baseline performance entered as a continuous covariate to increase statistical precision. Assumptions of normality, homoscedasticity, and homogeneity of regression slopes were inspected and confirmed prior to hypothesis testing. Effect sizes are reported as partial eta-squared (η²p).`,
      suggestedSyntheticPreset: 'anova_factorial'
    };
  }

  // 5. Binary Outcome / Logistic Regression
  if (query.includes('logistic') || query.includes('binary') || query.includes('churn') || query.includes('turnover') || query.includes('pass/fail') || query.includes('odds ratio')) {
    return {
      summary: `A multivariable binary logistic regression model is recommended to quantify the adjusted Odds Ratios (OR) and predict dichotomous classification probabilities.`,
      recommendedStack: {
        ontology: 'critical-realism',
        ontologyName: 'Critical Realism',
        epistemology: 'post-positivism',
        epistemologyName: 'Post-Positivism',
        paradigm: 'functionalist',
        paradigmName: 'Functionalist Paradigm',
        methodology: 'survey',
        methodologyName: 'Secondary Registry / Cross-Sectional Cohort',
        method: 'secondary-data-mining',
        methodName: 'Archival Metric Extraction',
        analysis: 'logistic-regression',
        analysisName: 'Binary Logistic Regression'
      },
      designRationale: `Linear regression violates boundary constraints and homoscedasticity when predicting a binary event (0/1). The logit link function ln(p / (1-p)) maps unbounded continuous predictors to a valid [0, 1] probability continuum.`,
      keyAssumptions: [
        'Dichotomous outcome variable without excessive class imbalance (use SMOTE / Firth penalized likelihood if < 5% events)',
        'Linearity of independent continuous predictors with the log-odds (Box-Tidwell test)',
        'No extreme multicollinearity among explanatory predictors (VIF < 5.0)',
        'Minimum of 10 to 15 events per variable (EPV rule of thumb)'
      ],
      sampleSizeGuidance: `Based on Peduzzi et al. (1996), with k = 6 predictors and a 20% base rate, a minimum of N = (10 * 6) / 0.20 = 300 observations is required.`,
      softwareSyntax: {
        r: `# R binary logistic regression\nmodel <- glm(status ~ predictor1 + predictor2 + age, family = binomial(link = "logit"), data = df)\nsummary(model)\nexp(coef(model)) # Odds Ratios\nexp(confint(model)) # 95% CI`,
        python: `# Python logistic regression\nimport statsmodels.api as sm\nlogit_model = sm.Logit(df['status'], sm.add_constant(df[['pred1', 'pred2', 'age']])).fit()\nprint(logit_model.summary())`,
        spssOrStata: `SPSS: Analyze > Regression > Binary Logistic | Stata: logistic status pred1 pred2 age`
      },
      apaMethodologyProse: `A multivariable binary logistic regression was estimated to ascertain the effects of explanatory predictors on the likelihood of the event occurring. Goodness-of-fit was assessed using the Hosmer-Lemeshow test and Nagelkerke pseudo-R². Adjusted Odds Ratios (OR) and corresponding 95% profile likelihood confidence intervals are reported for each predictor.`,
      suggestedSyntheticPreset: 'logistic_regression'
    };
  }

  // 6. Longitudinal / Panel Data
  if (query.includes('longitudinal') || query.includes('panel') || query.includes('repeated') || query.includes('time series') || query.includes('waves') || query.includes('growth')) {
    return {
      summary: `A Linear Mixed-Effects Model (LMM / Multilevel Growth Curve) is recommended to account for nested within-person temporal dependencies across repeated measurement waves.`,
      recommendedStack: {
        ontology: 'critical-realism',
        ontologyName: 'Critical Realism',
        epistemology: 'post-positivism',
        epistemologyName: 'Post-Positivism',
        paradigm: 'functionalist',
        paradigmName: 'Functionalist Paradigm',
        methodology: 'survey',
        methodologyName: 'Longitudinal Panel Cohort',
        method: 'survey-instrument',
        methodName: 'Multi-Wave Repeated Measurements',
        analysis: 'multilevel-modeling',
        analysisName: 'Multilevel Growth Curve / Mixed-Effects Modeling'
      },
      designRationale: `Repeated measurements within participants violate the assumption of independent observations. Mixed-effects models decompose variance into between-person (Level 2) and within-person (Level 1) components while accommodating missing waves under Missing at Random (MAR) assumptions.`,
      keyAssumptions: [
        'Adequate autocorrelation structure specification (e.g. AR(1) or unstructured covariance)',
        'Normality of random intercepts and slopes at Level 2',
        'Sufficient measurement waves (T >= 3 for linear growth curves; T >= 4 for quadratic)',
        'Missingness ignorable under Full Information Maximum Likelihood (FIML)'
      ],
      sampleSizeGuidance: `Recommended minimum: N = 100 participants observed across at least 3-4 distinct time waves.`,
      softwareSyntax: {
        r: `# R lme4 linear mixed model\nlibrary(lme4)\nlibrary(lmerTest)\nmodel <- lmer(outcome ~ time * condition + (1 + time | participant_id), data = df_long)\nsummary(model)`,
        python: `# Python statsmodels MixedLM\nimport statsmodels.formula.api as smf\nmodel = smf.mixedlm("outcome ~ time * condition", df_long, groups=df_long["participant_id"], re_formula="~time").fit()\nprint(model.summary())`,
        spssOrStata: `SPSS: Analyze > Mixed Models > Linear | Stata: mixed outcome c.time##i.condition || participant_id: time, cov(unstr)`
      },
      apaMethodologyProse: `To examine temporal trajectories while addressing the non-independence of repeated measures, a linear mixed-effects model (LMM) was fitted via restricted maximum likelihood (REML). Random intercepts and random linear slopes were estimated for each participant. Missing observations were handled using Full Information Maximum Likelihood under the assumption that missingness was at random (MAR).`,
      suggestedSyntheticPreset: 'longitudinal'
    };
  }

  // 7. Qualitative / Thematic / Grounded Inquiry
  return {
    summary: `A rigorous qualitative reflexive thematic analysis (Braun & Clarke, 2019, 2021) or phenomenological inquiry is recommended to generate authentic, inductive insight into participants' nuanced lived experiences.`,
    recommendedStack: {
      ontology: 'social-constructionism',
      ontologyName: 'Social Constructionism',
      epistemology: 'interpretivism',
      epistemologyName: 'Interpretivism',
      paradigm: 'interpretive',
      paradigmName: 'Interpretive Paradigm',
      methodology: 'case-study',
      methodologyName: 'Qualitative In-Depth Inquiry',
      method: 'in-depth-interviews',
      methodName: 'Semi-Structured In-Depth Qualitative Interviews',
      analysis: 'thematic-analysis',
      analysisName: 'Reflexive Thematic Analysis (Braun & Clarke)'
    },
    designRationale: `When the research objective seeks to understand meaning-making, organizational culture, or complex human experiences, qualitative inquiry allows inductive pattern discovery that rigid quantitative scales overlook. Interpretivism recognizes the researcher as an active, reflexive co-creator of meaning.`,
    keyAssumptions: [
      'Reflexivity: Continuous self-monitoring of researcher positioning and epistemic assumptions',
      'Purposive sampling ensuring participants hold experiential authority over the phenomenon',
      'Iterative, non-linear progression across familiarization, coding, and theme generation',
      'Adherence to Lincoln & Guba (1985) trustworthiness criteria: credibility, transferability, dependability, confirmability'
    ],
    sampleSizeGuidance: `Purposive sample of N = 12 to 25 in-depth interview participants, continued until thematic saturation or information power (Malterud et al., 2016) is reached.`,
    softwareSyntax: {
      r: `# CAQDAS Coding Workflow\n# Use dedicated qualitative analysis suites: Taguette (Open Source), NVivo, or MAXQDA.\n# Codebook structured by Theme -> Subtheme -> Anchor Exemplar Quotes.`,
      python: `# Python QualCoder (Open Source CAQDAS)\n# Textual segment tokenization and thematic hierarchy matrix export to CSV/JSON.`,
      spssOrStata: `Not applicable for statistical packages. Use dedicated CAQDAS (NVivo, ATLAS.ti, MAXQDA) or structured qualitative matrices.`
    },
    apaMethodologyProse: `Verbatim transcripts were examined using Reflexive Thematic Analysis in accordance with the six-phase framework established by Braun and Clarke (2019, 2021). The analytic process was iterative and organic: initial familiarization was followed by inductive semantic and latent line-by-line coding, candidate theme clustering, iterative review against raw transcript segments, and final definition of coherent overarching themes. Methodological rigor was maintained using member-checking and an explicit audit trail.`,
    suggestedSyntheticPreset: 'semi_structured_interviews'
  };
}

/**
 * AI-powered Research Design & Methodology Advisor
 * Translates natural language descriptions of research goals and datasets into
 * a publication-grade methodological architecture package.
 */
export async function recommendMethodologyAI(
  researchObjective: string,
  dataDescription: string,
  discipline: string = 'General Academic',
  config: LLMConfig = DEFAULT_LLM_CONFIG
): Promise<AIMethodologyRecommendation> {
  const isLlmActive = config.provider !== 'builtin' && (config.provider === 'ollama' || config.provider === 'webgpu' || Boolean(config.apiKey && config.apiKey.length > 3));

  if (!isLlmActive) {
    return generateDeterministicRecommendation(researchObjective, dataDescription, discipline);
  }

  const systemPrompt = `You are a distinguished Professor of Research Methods, Applied Statistics, and Epistemology.
A scholar has described their planned research inquiry and available data.
Your goal is to provide a rigorous, publication-grade Methodological Architecture Recommendation aligned with the 6-layer epistemic framework:
Layer 1: Ontology ('critical-realism', 'naive-realism', 'social-constructionism', 'pragmatism', 'relativism')
Layer 2: Epistemology ('post-positivism', 'positivism', 'interpretivism', 'pragmatic-epistemology', 'standpoint-epistemology')
Layer 3: Paradigm ('functionalist', 'interpretive', 'radical-humanist', 'radical-structuralist')
Layer 4: Methodology ('survey', 'experiment', 'quasi-experiment', 'case-study', 'grounded-theory', 'phenomenology', 'mixed-methods')
Layer 5: Method ('survey-instrument', 'in-depth-interviews', 'focus-groups', 'participant-observation', 'secondary-data-mining')
Layer 6: Analysis ('ols-regression', 'sem', 'anova', 'thematic-analysis', 'content-analysis', 'discourse-analysis', 'logistic-regression', 'multilevel-modeling')

You MUST respond strictly with a valid JSON object without markdown formatting, code fences or backticks:
{
  "summary": "2-3 sentence strategic executive summary of recommended design",
  "recommendedStack": {
    "ontology": "id",
    "ontologyName": "Human Readable Name",
    "epistemology": "id",
    "epistemologyName": "Human Readable Name",
    "paradigm": "id",
    "paradigmName": "Human Readable Name",
    "methodology": "id",
    "methodologyName": "Human Readable Name",
    "method": "id",
    "methodName": "Human Readable Name",
    "analysis": "id",
    "analysisName": "Human Readable Name"
  },
  "designRationale": "In-depth scientific defense explaining why this design answers the question and respects data properties",
  "keyAssumptions": ["Assumption 1", "Assumption 2", "Assumption 3", "Assumption 4"],
  "sampleSizeGuidance": "Statistical power or qualitative saturation justification (e.g. N rule, G*Power spec, saturation)",
  "softwareSyntax": {
    "r": "# Executable R script snippet",
    "python": "# Executable Python script snippet",
    "spssOrStata": "* SPSS syntax or Stata command"
  },
  "apaMethodologyProse": "A formal, publication-ready APA 7th style methodology section paragraph for Chapter 3 / Journal article.",
  "suggestedSyntheticPreset": "moderation"
}`;

  const userPrompt = `DISCIPLINE: ${discipline}
RESEARCH OBJECTIVE & HYPOTHESES:
${researchObjective}

DATA CHARACTERISTICS & CONSTRAINTS:
${dataDescription}

Analyze the methodological fit, statistical assumptions, and epistemic coherence. Output only the JSON.`;

  try {
    const raw = await callRawLLM(systemPrompt, userPrompt, config);
    const cleanJson = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanJson);
    if (parsed.summary && parsed.recommendedStack && parsed.apaMethodologyProse) {
      return parsed;
    }
  } catch (err) {
    console.warn('AI methodology recommendation fallback triggered:', err);
  }

  return generateDeterministicRecommendation(researchObjective, dataDescription, discipline);
}

