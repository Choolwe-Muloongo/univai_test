export type Point = { x: number; y: number };

export function gradient(points: Point[], interval?: { fromX: number; toX: number }) {
  const data = interval ? points.filter((point) => point.x >= interval.fromX && point.x <= interval.toX) : points;
  if (data.length < 2) return 0;
  const first = data[0];
  const last = data[data.length - 1];
  const dx = last.x - first.x;
  return dx === 0 ? 0 : (last.y - first.y) / dx;
}

export function areaUnderCurve(points: Point[]) {
  if (points.length < 2) return 0;
  return points.slice(1).reduce((area, point, index) => {
    const previous = points[index];
    const width = point.x - previous.x;
    const averageHeight = (point.y + previous.y) / 2;
    return area + width * averageHeight;
  }, 0);
}

export function interpolate(points: Point[], x: number) {
  const sorted = [...points].sort((a, b) => a.x - b.x);
  const rightIndex = sorted.findIndex((point) => point.x >= x);
  if (rightIndex <= 0) return sorted[0]?.y ?? 0;
  const left = sorted[rightIndex - 1];
  const right = sorted[rightIndex];
  const span = right.x - left.x || 1;
  const ratio = (x - left.x) / span;
  return left.y + ratio * (right.y - left.y);
}

export function findMax(points: Point[]) {
  return points.reduce<Point | null>((max, point) => (!max || point.y > max.y ? point : max), null);
}

export function findIntercept(points: Point[]) {
  for (let i = 1; i < points.length; i += 1) {
    const previous = points[i - 1];
    const current = points[i];
    if (previous.y === 0) return previous;
    if ((previous.y < 0 && current.y > 0) || (previous.y > 0 && current.y < 0)) {
      const x = previous.x + ((0 - previous.y) * (current.x - previous.x)) / (current.y - previous.y);
      return { x, y: 0 };
    }
  }
  return null;
}
