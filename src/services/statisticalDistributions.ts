// Regularized incomplete beta, using the continued fraction expansion.
// Student t and F tail probabilities retain finite-sample degrees of freedom.
function logGamma(z: number): number {
  const p = [
    676.5203681218851, -1259.1392167224028, 771.3234287776531,
    -176.6150291621406, 12.507343278686905, -0.13857109526572012,
    9.984369578019572e-6, 1.5056327351493116e-7,
  ];
  if (z < 0.5)
    return (
      Math.log(Math.PI) - Math.log(Math.sin(Math.PI * z)) - logGamma(1 - z)
    );
  z -= 1;
  let x = 0.9999999999998099;
  p.forEach((c, i) => {
    x += c / (z + i + 1);
  });
  const t = z + p.length - 0.5;
  return (
    0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x)
  );
}

function fraction(a: number, b: number, x: number): number {
  const tiny = 1e-30;
  const safe = (n: number) => (Math.abs(n) < tiny ? (n < 0 ? -tiny : tiny) : n);
  let c = 1,
    d = 1 / safe(1 - ((a + b) * x) / (a + 1)),
    h = d;
  for (let m = 1; m <= 300; m++) {
    let aa = (m * (b - m) * x) / ((a + 2 * m - 1) * (a + 2 * m));
    d = 1 / safe(1 + aa * d);
    c = safe(1 + aa / c);
    h *= d * c;
    aa = (-(a + m) * (a + b + m) * x) / ((a + 2 * m) * (a + 2 * m + 1));
    d = 1 / safe(1 + aa * d);
    c = safe(1 + aa / c);
    const delta = d * c;
    h *= delta;
    if (Math.abs(delta - 1) < 3e-14) break;
  }
  return h;
}

export function regularizedBeta(x: number, a: number, b: number): number {
  if (!(a > 0 && b > 0) || Number.isNaN(x)) return NaN;
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const front = Math.exp(
    logGamma(a + b) -
      logGamma(a) -
      logGamma(b) +
      a * Math.log(x) +
      b * Math.log1p(-x),
  );
  return Math.max(
    0,
    Math.min(
      1,
      x < (a + 1) / (a + b + 2)
        ? (front * fraction(a, b, x)) / a
        : 1 - (front * fraction(b, a, 1 - x)) / b,
    ),
  );
}

export function studentTPValue(t: number, df: number): number {
  return df > 0 ? regularizedBeta(df / (df + t * t), df / 2, 0.5) : NaN;
}

export function fPValue(f: number, df1: number, df2: number): number {
  return f >= 0 && df1 > 0 && df2 > 0
    ? regularizedBeta(df2 / (df2 + df1 * f), df2 / 2, df1 / 2)
    : NaN;
}

export function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
