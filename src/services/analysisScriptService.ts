import type { GeneratedDataset } from "./syntheticDataService";

const rString = (value: string) => JSON.stringify(value);
const rVector = (values: string[]) => `c(${values.map(rString).join(", ")})`;

export function executableR(dataset: GeneratedDataset): string {
  const outcome =
    dataset.variables.find((v) => v.role === "outcome")?.name || "";
  const predictors = dataset.variables
    .filter((v) => ["predictor", "moderator", "covariate"].includes(v.role))
    .map((v) => v.name)
    .filter((name) => name !== "Missingness_Auxiliary");
  const interaction = dataset.variables.find((v) =>
    v.name.includes("_x_"),
  )?.name;
  const x = dataset.variables.find((v) => v.role === "predictor")?.name || "";
  const m = dataset.variables.find((v) => v.role === "mediator")?.name || "";
  let analysis: string;
  if (dataset.modelType === "moderation") {
    analysis = `predictors <- ${rVector([...new Set([...predictors, ...(interaction ? [interaction] : [])])])}
model_data <- df[, c(${rString(outcome)}, predictors), drop=FALSE]
model_data <- model_data[complete.cases(model_data), , drop=FALSE]
names(model_data) <- c('outcome', paste0('x', seq_along(predictors)))
fit <- lm(outcome ~ ., data=model_data)
print(summary(fit)); print(confint(fit))
# Interaction is the exported generation-scale product, including any centering.
`;
  } else if (dataset.modelType === "mediation") {
    analysis = `d <- df[, ${rVector([x, m, outcome])}, drop=FALSE]
names(d) <- c('x','m','y'); d <- d[complete.cases(d), ]
fit_a <- lm(m ~ x, data=d); fit_b <- lm(y ~ x + m, data=d)
print(summary(fit_a)); print(summary(fit_b))
set.seed(${dataset.generationConfig?.randomSeed ?? 1})
indirect <- replicate(2000, { b <- d[sample.int(nrow(d), replace=TRUE), ]; coef(lm(m ~ x, b))['x'] * coef(lm(y ~ x + m, b))['m'] })
print(quantile(indirect, c(.025,.5,.975), na.rm=TRUE))
# Percentile bootstrap interval; interpretation requires causal assumptions.
`;
  } else if (dataset.modelType === "logistic_regression") {
    analysis = `d <- df[, ${rVector([outcome, ...predictors])}, drop=FALSE]
names(d) <- c('outcome', paste0('x', seq_len(ncol(d)-1)))
fit <- glm(outcome ~ ., family=binomial(), data=d)
print(summary(fit)); print(exp(cbind(OR=coef(fit), confint.default(fit))))
`;
  } else if (dataset.modelType === "anova_factorial") {
    const factors = dataset.variables
      .filter((v) => v.role === "factor")
      .map((v) => v.name);
    const covariates = dataset.variables
      .filter((v) => v.role === "covariate")
      .map((v) => v.name)
      .filter((name) => name !== "Missingness_Auxiliary");
    analysis = `d <- df[, ${rVector([outcome, ...factors, ...covariates])}, drop=FALSE]
names(d) <- c('outcome','factor_a','factor_b', ${covariates.length ? covariates.map((_, i) => `'cov${i + 1}'`).join(", ") : ""})
d$factor_a <- factor(d$factor_a); d$factor_b <- factor(d$factor_b)
fit <- lm(outcome ~ factor_a * factor_b${covariates.map((_, i) => ` + cov${i + 1}`).join("")}, data=d)
print(summary(fit)); print(anova(fit)); print(confint(fit))
# anova() reports sequential sums of squares; choose contrasts/tests for your design.
`;
    analysis = analysis.replace("'factor_b', )", "'factor_b')");
  } else if (dataset.modelType === "sem_cfa") {
    const scales = dataset.psychometrics?.scales || [];
    const items = scales.flatMap((scale) => scale.items);
    let offset = 0;
    const model = scales
      .map((scale, i) => {
        const terms = scale.items.map(() => `item${++offset}`);
        return `factor${i + 1} =~ ${terms.join(" + ")}`;
      })
      .join("\n");
    analysis = `if (!requireNamespace('lavaan', quietly=TRUE)) stop('Install lavaan to estimate the measurement model.')
d <- df[, ${rVector(items)}, drop=FALSE]; names(d) <- paste0('item', seq_len(ncol(d)))
model <- ${rString(model)}
fit <- lavaan::cfa(model, data=d, ordered=names(d), estimator='WLSMV')
print(summary(fit, fit.measures=TRUE, standardized=TRUE))
# This estimates the measurement model, not every possible structural path.
`;
  } else {
    const subject =
      dataset.variables.find((v) => v.role === "id")?.name || "Subject_ID";
    const time =
      dataset.variables.find((v) => v.role === "time")?.name || "Time";
    const group = dataset.variables.find((v) => v.role === "factor")?.name;
    analysis = `if (!requireNamespace('nlme', quietly=TRUE)) stop('Install nlme for mixed-effects estimation.')
d <- df[, ${rVector([subject, time, outcome, ...(group ? [group] : [])])}, drop=FALSE]; names(d) <- c('subject','time','outcome'${group ? ", 'group'" : ""})
d$subject <- factor(d$subject); d <- d[complete.cases(d), ]
fit <- nlme::lme(outcome ~ ${group ? "time * factor(group)" : "time"}, random=~1|subject, correlation=nlme::corAR1(form=~time|subject), data=d)
print(summary(fit)); print(intervals(fit))
# Model and covariance assumptions must match the intended analysis.
`;
  }
  return `# ScholarForge synthetic-data analysis. Artificial observations only.
# Run: Rscript analysis.R path/to/exported.csv
# Seed used for browser generation: ${dataset.generationConfig?.randomSeed ?? "not recorded"}
args <- commandArgs(trailingOnly=TRUE)
path <- if(length(args)) args[1] else 'scholarforge_dataset.csv'
if(!file.exists(path)) stop('Supply the path to the exported CSV.')
df <- read.csv(path, check.names=FALSE, stringsAsFactors=FALSE)
print(summary(df))
${analysis}`;
}

export function executablePython(dataset: GeneratedDataset): string {
  const outcome =
    dataset.variables.find((v) => v.role === "outcome")?.name || "";
  const predictors = dataset.variables
    .filter(
      (v) =>
        ["predictor", "moderator", "covariate"].includes(v.role) &&
        v.name !== "Missingness_Auxiliary",
    )
    .map((v) => v.name);
  const interaction = dataset.variables.find((v) =>
    v.name.includes("_x_"),
  )?.name;
  let analysis: string;
  if (
    dataset.modelType === "moderation" ||
    dataset.modelType === "logistic_regression"
  ) {
    const cols = [
      ...new Set([
        ...predictors,
        ...(dataset.modelType === "moderation" && interaction
          ? [interaction]
          : []),
      ]),
    ];
    analysis = `columns = ${JSON.stringify(cols)}
d = df[[${JSON.stringify(outcome)}] + columns].dropna()
x = sm.add_constant(d[columns].astype(float), has_constant='add')
y = d[${JSON.stringify(outcome)}].astype(float)
fit = sm.${dataset.modelType === "moderation" ? "OLS" : "Logit"}(y, x).fit()
print(fit.summary())
print(${dataset.modelType === "logistic_regression" ? "np.exp(fit.conf_int())" : "fit.conf_int()"})
`;
  } else if (dataset.modelType === "mediation") {
    const x = dataset.variables.find((v) => v.role === "predictor")?.name || "";
    const m = dataset.variables.find((v) => v.role === "mediator")?.name || "";
    analysis = `d = df[${JSON.stringify([x, m, outcome])}].dropna().astype(float)
d.columns = ['x', 'm', 'y']
a = sm.OLS(d['m'], sm.add_constant(d[['x']])).fit()
b = sm.OLS(d['y'], sm.add_constant(d[['x','m']])).fit()
print(a.summary()); print(b.summary())
rng = np.random.default_rng(${dataset.generationConfig?.randomSeed ?? 1})
indirect = []
for _ in range(2000):
    sample = d.iloc[rng.integers(0, len(d), size=len(d))]
    aa = sm.OLS(sample['m'], sm.add_constant(sample[['x']])).fit().params['x']
    bb = sm.OLS(sample['y'], sm.add_constant(sample[['x','m']])).fit().params['m']
    indirect.append(aa * bb)
print('Indirect effect percentile interval:', np.quantile(indirect, [.025, .5, .975]))
`;
  } else if (dataset.modelType === "anova_factorial") {
    const factors = dataset.variables
      .filter((v) => v.role === "factor")
      .map((v) => v.name);
    const covariates = dataset.variables
      .filter(
        (v) => v.role === "covariate" && v.name !== "Missingness_Auxiliary",
      )
      .map((v) => v.name);
    analysis = `d = df[${JSON.stringify([outcome, ...factors, ...covariates])}].copy()
d.columns = ${JSON.stringify(["outcome", "factor_a", "factor_b", ...covariates.map((_, i) => `cov${i + 1}`)])}
fit = smf.ols(${JSON.stringify("outcome ~ C(factor_a) * C(factor_b)" + covariates.map((_, i) => ` + cov${i + 1}`).join(""))}, data=d).fit()
print(fit.summary()); print(sm.stats.anova_lm(fit, typ=2))
`;
  } else {
    analysis = `raise NotImplementedError('Use the accompanying R script for CFA or correlated longitudinal estimation. An OLS approximation is not a substitute.')\n`;
  }
  return `"""ScholarForge synthetic-data analysis. Run: python analysis.py path/to/exported.csv
Requires pandas, numpy, statsmodels. This analyzes artificial observations only.
"""
import sys
import pandas as pd
import numpy as np
import statsmodels.api as sm
import statsmodels.formula.api as smf
if len(sys.argv) < 2:
    raise SystemExit('Supply the path to the exported CSV.')
df = pd.read_csv(sys.argv[1])
print(df.describe(include='all').T)
${analysis}`;
}
