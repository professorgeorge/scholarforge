import { seededRandom, studentTPValue } from "./statisticalDistributions";
export interface PlanningInput {
  seed: number;
  samplePerGroup: number;
  effect: number;
  reliability: number;
  attrition: number;
  replications: number;
  alpha: number;
}
export interface PlanningResult {
  input: PlanningInput;
  power: number;
  interval: [number, number];
  meanEstimate: number;
  meanRetainedPerGroup: number;
  estimates: number[];
  rejected: number;
  usable: number;
}

export function simulatePlanning(input: PlanningInput): PlanningResult {
  const {
    seed,
    samplePerGroup: n,
    effect,
    reliability,
    attrition,
    replications,
    alpha,
  } = input;
  if (
    ![seed, n, effect, reliability, attrition, replications, alpha].every(
      Number.isFinite,
    ) ||
    n < 5 ||
    n > 5000 ||
    !Number.isInteger(n) ||
    reliability <= 0 ||
    reliability > 1 ||
    attrition < 0 ||
    attrition >= 0.8 ||
    replications < 50 ||
    replications > 2000 ||
    !Number.isInteger(replications) ||
    alpha <= 0 ||
    alpha >= 0.5
  )
    throw new Error("Invalid simulation parameters.");
  const random = seededRandom(seed);
  const normal = () =>
    Math.sqrt(-2 * Math.log(Math.max(Number.EPSILON, random()))) *
    Math.cos(2 * Math.PI * random());
  let rejected = 0,
    retained = 0;
  const estimates: number[] = [];
  for (let run = 0; run < replications; run++) {
    const groups = [0, 1].map((group) => {
      const values: number[] = [];
      for (let i = 0; i < n; i++) {
        const value = group * effect * Math.sqrt(reliability) + normal();
        if (random() >= attrition) values.push(value);
      }
      return values;
    });
    if (groups.some((g) => g.length < 2)) continue;
    const means = groups.map((g) => g.reduce((a, b) => a + b, 0) / g.length);
    const ss = groups.map((g, j) =>
      g.reduce((sum, x) => sum + (x - means[j]) ** 2, 0),
    );
    const df = groups[0].length + groups[1].length - 2;
    const variance = (ss[0] + ss[1]) / df;
    const estimate = means[1] - means[0];
    const se = Math.sqrt(
      variance * (1 / groups[0].length + 1 / groups[1].length),
    );
    if (studentTPValue(estimate / se, df) < alpha) rejected++;
    estimates.push(estimate);
    retained += (groups[0].length + groups[1].length) / 2;
  }
  const count = estimates.length;
  if (!count) throw new Error("No usable simulated samples.");
  const power = rejected / count;
  // Wilson 95% interval quantifies Monte Carlo uncertainty, not study effect uncertainty.
  const z = 1.959963984540054,
    denom = 1 + (z * z) / count;
  const mid = (power + (z * z) / (2 * count)) / denom;
  const half =
    (z *
      Math.sqrt(
        (power * (1 - power)) / count + (z * z) / (4 * count * count),
      )) /
    denom;
  return {
    input,
    power,
    interval: [mid - half, mid + half],
    meanEstimate: estimates.reduce((a, b) => a + b, 0) / count,
    meanRetainedPerGroup: retained / count,
    estimates,
    rejected,
    usable: count,
  };
}

export function planningRScript(input: PlanningInput): string {
  return `# Independent normal groups; equal variance, two-sided t test.
# Reference implementation: R and browser use different RNGs, so individual samples differ.
# Reliability attenuates the standardized effect by sqrt(reliability); missingness is MCAR.
set.seed(${input.seed})
n <- ${input.samplePerGroup}; reps <- ${input.replications}; alpha <- ${input.alpha}
effect <- ${input.effect}; reliability <- ${input.reliability}; attrition <- ${input.attrition}
results <- replicate(reps, {
  x <- rnorm(n); y <- rnorm(n, effect * sqrt(reliability))
  x <- x[runif(n) >= attrition]; y <- y[runif(n) >= attrition]
  if(length(x) < 2 || length(y) < 2) return(NA_real_)
  t.test(y, x, var.equal=TRUE)$p.value
})
mean(results < alpha, na.rm=TRUE)
`;
}
