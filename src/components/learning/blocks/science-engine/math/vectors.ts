export type Vector2 = { x: number; y: number };
export type Vector3 = { x: number; y: number; z: number };

export function magnitude(vector: Vector2 | Vector3) {
  const z = 'z' in vector ? vector.z : 0;
  return Math.sqrt(vector.x ** 2 + vector.y ** 2 + z ** 2);
}

export function dot(a: Vector2 | Vector3, b: Vector2 | Vector3) {
  const az = 'z' in a ? a.z : 0;
  const bz = 'z' in b ? b.z : 0;
  return a.x * b.x + a.y * b.y + az * bz;
}

export function cross(a: Vector3, b: Vector3): Vector3 {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  };
}

export function resolveVector(value: number, angleDegrees: number): Vector2 {
  const angle = (angleDegrees * Math.PI) / 180;
  return { x: value * Math.cos(angle), y: value * Math.sin(angle) };
}

export function resultant(vectors: Vector2[]): Vector2 {
  return vectors.reduce((sum, vector) => ({ x: sum.x + vector.x, y: sum.y + vector.y }), { x: 0, y: 0 });
}

export function unitVector<T extends Vector2 | Vector3>(vector: T): T {
  const length = magnitude(vector) || 1;
  if ('z' in vector) return { x: vector.x / length, y: vector.y / length, z: vector.z / length } as T;
  return { x: vector.x / length, y: vector.y / length } as T;
}

export function angleBetween(a: Vector2 | Vector3, b: Vector2 | Vector3) {
  const denominator = magnitude(a) * magnitude(b) || 1;
  return Math.acos(Math.max(-1, Math.min(1, dot(a, b) / denominator))) * (180 / Math.PI);
}
