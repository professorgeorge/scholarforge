import rawCompassData from './methodologyCompassData.json';

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
