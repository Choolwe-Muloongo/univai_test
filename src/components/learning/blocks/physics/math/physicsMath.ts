export function kineticEnergy(massKg: number, velocityMs: number) {
  return 0.5 * massKg * velocityMs ** 2;
}

export function momentum(massKg: number, velocityMs: number) {
  return massKg * velocityMs;
}

export function pressure(forceN: number, areaM2: number) {
  return areaM2 === 0 ? 0 : forceN / areaM2;
}

export function hydraulicForce(inputForceN: number, inputAreaM2: number, outputAreaM2: number) {
  if (inputAreaM2 === 0) return 0;
  return inputForceN * (outputAreaM2 / inputAreaM2);
}

export function electricFieldStrength(chargeC: number, radiusM: number) {
  const k = 8.9875517923e9;
  if (radiusM === 0) return 0;
  return k * chargeC / radiusM ** 2;
}

export function lorentzFactor(speedMs: number) {
  const c = 299_792_458;
  const beta2 = (speedMs / c) ** 2;
  if (beta2 >= 1) return Infinity;
  return 1 / Math.sqrt(1 - beta2);
}

export function deBroglieWavelength(massKg: number, velocityMs: number) {
  const h = 6.62607015e-34;
  const p = momentum(massKg, velocityMs);
  return p === 0 ? Infinity : h / p;
}

export function probabilityDensity(psiReal: number, psiImaginary = 0) {
  return psiReal ** 2 + psiImaginary ** 2;
}

export function trapezoidalArea(points: Array<[number, number]>) {
  if (points.length < 2) return 0;
  return points.slice(1).reduce((sum, [x, y], index) => {
    const [previousX, previousY] = points[index];
    return sum + ((y + previousY) / 2) * (x - previousX);
  }, 0);
}

export function linearRegression(points: Array<[number, number]>) {
  const n = points.length;
  if (!n) return { slope: 0, intercept: 0, r2: 0 };
  const sumX = points.reduce((sum, [x]) => sum + x, 0);
  const sumY = points.reduce((sum, [, y]) => sum + y, 0);
  const sumXY = points.reduce((sum, [x, y]) => sum + x * y, 0);
  const sumXX = points.reduce((sum, [x]) => sum + x * x, 0);
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX ** 2 || 1);
  const intercept = (sumY - slope * sumX) / n;
  const meanY = sumY / n;
  const ssTot = points.reduce((sum, [, y]) => sum + (y - meanY) ** 2, 0);
  const ssRes = points.reduce((sum, [x, y]) => sum + (y - (slope * x + intercept)) ** 2, 0);
  return { slope, intercept, r2: ssTot === 0 ? 1 : 1 - ssRes / ssTot };
}

export function percentError(experimental: number, accepted: number) {
  if (accepted === 0) return 0;
  return Math.abs((experimental - accepted) / accepted) * 100;
}
