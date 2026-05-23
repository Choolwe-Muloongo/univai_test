export type Dimension = Partial<Record<'M' | 'L' | 'T' | 'I' | 'Theta' | 'N' | 'J', number>>;

export type ParsedQuantity = {
  value: number;
  unit: string;
};

const unitTable: Record<string, { factor: number; dimension: Dimension; canonical: string }> = {
  N: { factor: 1, dimension: { M: 1, L: 1, T: -2 }, canonical: 'N' },
  kN: { factor: 1000, dimension: { M: 1, L: 1, T: -2 }, canonical: 'N' },
  Pa: { factor: 1, dimension: { M: 1, L: -1, T: -2 }, canonical: 'Pa' },
  kPa: { factor: 1000, dimension: { M: 1, L: -1, T: -2 }, canonical: 'Pa' },
  MPa: { factor: 1_000_000, dimension: { M: 1, L: -1, T: -2 }, canonical: 'Pa' },
  J: { factor: 1, dimension: { M: 1, L: 2, T: -2 }, canonical: 'J' },
  W: { factor: 1, dimension: { M: 1, L: 2, T: -3 }, canonical: 'W' },
  kg: { factor: 1, dimension: { M: 1 }, canonical: 'kg' },
  g: { factor: 0.001, dimension: { M: 1 }, canonical: 'kg' },
  m: { factor: 1, dimension: { L: 1 }, canonical: 'm' },
  cm: { factor: 0.01, dimension: { L: 1 }, canonical: 'm' },
  mm: { factor: 0.001, dimension: { L: 1 }, canonical: 'm' },
  s: { factor: 1, dimension: { T: 1 }, canonical: 's' },
  min: { factor: 60, dimension: { T: 1 }, canonical: 's' },
  h: { factor: 3600, dimension: { T: 1 }, canonical: 's' },
  A: { factor: 1, dimension: { I: 1 }, canonical: 'A' },
  V: { factor: 1, dimension: { M: 1, L: 2, T: -3, I: -1 }, canonical: 'V' },
  ohm: { factor: 1, dimension: { M: 1, L: 2, T: -3, I: -2 }, canonical: 'ohm' },
  Hz: { factor: 1, dimension: { T: -1 }, canonical: 'Hz' },
};

function sameDimension(a: Dimension, b: Dimension) {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)] as Array<keyof Dimension>);
  for (const key of keys) {
    if ((a[key] ?? 0) !== (b[key] ?? 0)) return false;
  }
  return true;
}

export function parseQuantity(input: string): ParsedQuantity | null {
  const match = input.trim().match(/^(-?\d+(?:\.\d+)?)\s*([a-zA-ZΩ/\^0-9\-]*)$/);
  if (!match) return null;
  return { value: Number(match[1]), unit: normaliseUnit(match[2] || '') };
}

export function normaliseUnit(unit: string) {
  return unit.replace('Ω', 'ohm').trim();
}

export function checkUnitCompatibility(expectedUnit: string, submittedUnit: string) {
  const expected = unitTable[normaliseUnit(expectedUnit)];
  const submitted = unitTable[normaliseUnit(submittedUnit)];
  if (!expected || !submitted) return expectedUnit === submittedUnit;
  return sameDimension(expected.dimension, submitted.dimension);
}

export function convertUnit(value: number, fromUnit: string, toUnit: string) {
  const from = unitTable[normaliseUnit(fromUnit)];
  const to = unitTable[normaliseUnit(toUnit)];
  if (!from || !to) throw new Error(`Unsupported unit conversion: ${fromUnit} to ${toUnit}`);
  if (!sameDimension(from.dimension, to.dimension)) throw new Error(`Incompatible units: ${fromUnit} and ${toUnit}`);
  return (value * from.factor) / to.factor;
}

export function formatUnit(unit: string) {
  return normaliseUnit(unit).replace('ohm', 'Ω');
}

export function detectWrongUnit(expectedUnit: string, submittedUnit: string) {
  if (checkUnitCompatibility(expectedUnit, submittedUnit)) return null;
  return `Expected a quantity compatible with ${formatUnit(expectedUnit)}, but received ${formatUnit(submittedUnit)}.`;
}
