import type { Point, Wall } from '$lib/models/types';

/**
 * Net clear dimensions ONLY for a genuine axis-aligned rectangular room whose
 * four wall centre-lines match the detected polygon boundary.
 * Never guess values for L-shaped, curved or incomplete rooms.
 */
export function clearRectangularRoomDimensions(polygon: Point[], walls: Wall[]) {
  if (polygon.length < 4 || polygon.some(p => !Number.isFinite(p.x) || !Number.isFinite(p.y))) return null;
  const xs = polygon.map(p => p.x), ys = polygon.map(p => p.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const width = maxX - minX, depth = maxY - minY;
  if (width <= 0 || depth <= 0) return null;

  const boundary = (p: Point) =>
    Math.abs(p.x - minX) < 1 || Math.abs(p.x - maxX) < 1 ||
    Math.abs(p.y - minY) < 1 || Math.abs(p.y - maxY) < 1;
  if (!polygon.every(boundary)) return null;
  const area = Math.abs(polygon.reduce((sum, p, i) => {
    const next = polygon[(i + 1) % polygon.length];
    return sum + p.x * next.y - p.y * next.x;
  }, 0) / 2);
  if (Math.abs(area - width * depth) > Math.max(1, width * depth * 0.005)) return null;

  const findEdgeThickness = (axis: 'x' | 'y', value: number, otherMin: number, otherMax: number): number | null => {
    const otherAxis = axis === 'x' ? 'y' : 'x';
    const matched = walls.filter(w => !w.curvePoint && Number.isFinite(w.thickness) && w.thickness > 0 &&
      Math.abs(w.start[axis] - value) <= 1 && Math.abs(w.end[axis] - value) <= 1 &&
      Math.max(w.start[otherAxis], w.end[otherAxis]) > otherMin + 1 &&
      Math.min(w.start[otherAxis], w.end[otherAxis]) < otherMax - 1);
    if (matched.length === 0) return null;
    return Math.max(...matched.map(w => w.thickness));
  };
  const left = findEdgeThickness('x', minX, minY, maxY);
  const right = findEdgeThickness('x', maxX, minY, maxY);
  const top = findEdgeThickness('y', minY, minX, maxX);
  const bottom = findEdgeThickness('y', maxY, minX, maxX);
  if (left === null || right === null || top === null || bottom === null) return null;
  const clearWidthCm = width - (left + right) / 2;
  const clearDepthCm = depth - (top + bottom) / 2;
  if (clearWidthCm <= 0 || clearDepthCm <= 0) return null;
  return {
    clearWidthCm, clearDepthCm,
    innerLeftCm: minX + left / 2, innerRightCm: maxX - right / 2,
    innerTopCm: minY + top / 2, innerBottomCm: maxY - bottom / 2,
    clearAreaM2: clearWidthCm * clearDepthCm / 10000,
    centerlineWidthCm: width, centerlineDepthCm: depth
  };
}
