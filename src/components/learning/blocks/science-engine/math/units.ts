export type Dimension = Partial<Record<'M' | 'L' | 'T' | 'I' | 'Theta' | 'N' | 'J', number>>;

export type ParsedQuantity = {
  value: number;
  unit: string;
};

type UnitDefinition = { factor: number; dimension: Dimension; canonical: string };

type UnitToken = { symbol: string; power: number; sign: 1 | -1 };

const unitTable: Record<string, UnitDefinition> = {
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
  K: { factor: 1, dimension: { Theta: 1 }, canonical: 'K' },
  mol: { factor: 1, dimension: { N: 1 }, canonical: 'mol' },
  V: { factor: 1, dimension: { M: 1, L: 2, T: -3, I: -1 }, canonical: 'V' },
  ohm: { factor: 1, dimension: { M: 1, L: 2, T: -3, I: -2 }, canonical: 'ohm' },
  Hz: { factor: 1, dimension: { T: -1 }, canonical: 'Hz' },
};

const compoundAliases: Record<string, string> = {
  'm/s2': 'm/s^2',
  'm/s²': 'm/s^2',
  'kg/m3': 'kg/m^3',
  'kg/m³': 'kg/m^3',
  'm2': 'm^2',
  'm²': 'm^2',
  'm3': 'm^3',
  'm³': 'm^3',
  'N/m2': 'N/m^2',
  'N/m²': 'N/m^2',
  'Pa.s': 'Pa*s',
  'W/mK': 'W/(m*K)',
};

function addDimensions(a: Dimension, b: Dimension, multiplier = 1): Dimension {
  const next: Dimension = { ...a };
  for (const [key, value] of Object.entries(b) as Array<[keyof Dimension, number]>) {
    next[key] = (next[key] ?? 0) + value * multiplier;
    if (next[key] === 0) delete next[key];
  }
  return next;
}

function sameDimension(a: Dimension, b: Dimension) {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)] as Array<keyof Dimension>);
  for (const key of keys) if ((a[key] ?? 0) !== (b[key] ?? 0)) return false;
  return true;
}

function parseUnitPower(raw: string) {
  const unit = raw.trim().replace(/[()]/g, '');
  const match = unit.match(/^([a-zA-Z]+)(?:\^(-?\d+))?$/);
  if (!match) return null;
  return { symbol: normaliseUnit(match[1]), power: Number(match[2] ?? 1) };
}

function tokenizeCompoundUnit(cleaned: string): UnitToken[] | null {
  const tokens: UnitToken[] = [];
  let buffer = '';
  let sign: 1 | -1 = 1;

  function flush() {
    const value = buffer.trim().replace(/[()]/g, '');
    buffer = '';
    if (!value) return true;
    const parsed = parseUnitPower(value);
    if (!parsed) return false;
    tokens.push({ ...parsed, sign });
    return true;
  }

  for (const char of cleaned) {
    if (char === '*' || char === '/') {
      if (!flush()) return null;
      sign = char === '/' ? -1 : 1;
    } else {
      buffer += char;
    }
  }

  if (!flush()) return null;
  return tokens.length ? tokens : null;
}

export function getUnitDefinition(unit: string): UnitDefinition | null {
  const cleaned = normaliseUnit(unit);
  if (!cleaned || cleaned === '1') return { factor: 1, dimension: {}, canonical: '1' };
  if (unitTable[cleaned]) return unitTable[cleaned];

  const tokens = tokenizeCompoundUnit(cleaned);
  if (!tokens?.length) return null;

  let factor = 1;
  let dimension: Dimension = {};

  for (const token of tokens) {
    const definition = unitTable[token.symbol];
    if (!definition) return null;
    const signedPower = token.power * token.sign;
    factor *= definition.factor ** signedPower;
    dimension = addDimensions(dimension, definition.dimension, signedPower);
  }

  return { factor, dimension, canonical: cleaned };
}

export function parseQuantity(input: string): ParsedQuantity | null {
  const match = input.trim().match(/^(-?\d+(?:\.\d+)?)\s*([a-zA-ZΩ/\^0-9\-.*()²³]*)$/);
  if (!match) return null;
  return { value: Number(match[1]), unit: normaliseUnit(match[2] || '') };
}

export function normaliseUnit(unit: string) {
  const cleaned = unit.replace('Ω', 'ohm').replace(/\s+/g, '').trim();
  return compoundAliases[cleaned] ?? cleaned;
}

export function checkUnitCompatibility(expectedUnit: string, submittedUnit: string) {
  const expected = getUnitDefinition(expectedUnit);
  const submitted = getUnitDefinition(submittedUnit);
  if (!expected || !submitted) return normaliseUnit(expectedUnit) === normaliseUnit(submittedUnit);
  return sameDimension(expected.dimension, submitted.dimension);
}

export function convertUnit(value: number, fromUnit: string, toUnit: string) {
  const from = getUnitDefinition(fromUnit);
  const to = getUnitDefinition(toUnit);
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
