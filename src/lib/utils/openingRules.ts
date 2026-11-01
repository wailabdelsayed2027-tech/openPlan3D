import type { Door, Wall, Window as PlanWindow } from '$lib/models/types';
import { wallPathProfile } from './wallProfiles';

/** In centimetres. Do not leave a door leaf or window cut beyond a wall end. */
export const OPENING_END_CLEARANCE_CM = 5;

export type WallOpeningRef = Pick<Door | PlanWindow, 'wallId' | 'position' | 'width'> & { id?: string };

/** Check a complete opening on a *physical* wall path, including curved walls. */
export function wallOpeningError(
  wall: Wall | undefined,
  opening: WallOpeningRef,
  otherOpenings: WallOpeningRef[] = [],
  clearanceCm = OPENING_END_CLEARANCE_CM
): string | null {
  if (!wall || wall.id !== opening.wallId) return 'Opening must reference an existing wall.';
  if (!Number.isFinite(opening.position) || opening.position < 0 || opening.position > 1 ||
      !Number.isFinite(opening.width) || opening.width <= 0 ||
      !Number.isFinite(clearanceCm) || clearanceCm < 0) return 'Opening dimensions or position are invalid.';
  const path = wallPathProfile(wall);
  if (!Number.isFinite(path.length) || path.length <= 0) return 'Wall path is invalid.';
  const center = path.distanceAt(opening.position);
  const left = center - opening.width / 2, right = center + opening.width / 2;
  if (left < clearanceCm - 0.001 || right > path.length - clearanceCm + 0.001) {
    return 'Opening exceeds the available wall length (including 5 cm end clearance).';
  }
  for (const other of otherOpenings) {
    if (other.wallId !== wall.id || other.id === opening.id) continue;
    if (!Number.isFinite(other.position) || !Number.isFinite(other.width) || other.width <= 0) continue;
    const mid = path.distanceAt(other.position);
    if (left < mid + other.width / 2 - 0.001 && right > mid - other.width / 2 + 0.001) {
      return 'Door/window openings overlap on the same wall.';
    }
  }
  return null;
}

/**
 * Move a newly placed opening just inside the end jambs. If other openings
 * block that spot, reject rather than silently moving it to a different room.
 */
export function nearestOpeningPosition(
  wall: Wall | undefined, position: number, width: number,
  others: WallOpeningRef[] = [], clearanceCm = OPENING_END_CLEARANCE_CM
): number | null {
  if (!wall || !Number.isFinite(position) || !Number.isFinite(width) || width <= 0) return null;
  const path = wallPathProfile(wall);
  const minCenter = width / 2 + clearanceCm;
  const maxCenter = path.length - minCenter;
  if (!Number.isFinite(path.length) || maxCenter < minCenter) return null;
  const target = Math.max(minCenter, Math.min(maxCenter, path.distanceAt(position)));
  // wallPathProfile distanceAt is nonlinear on curved walls: invert numerically.
  let low = 0, high = 1;
  for (let i = 0; i < 42; i++) {
    const mid = (low + high) / 2;
    if (path.distanceAt(mid) < target) low = mid;
    else high = mid;
  }
  const result = (low + high) / 2;
  return wallOpeningError(wall, { wallId: wall.id, position: result, width }, others, clearanceCm) ? null : result;
}
