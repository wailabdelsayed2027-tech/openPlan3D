import type { Stair } from '$lib/models/types';

/**
 * Preliminary geometry review, NOT a structural design or a local-code
 * certification. All values are centimetres, explicit for reproducibility.
 */
export interface StairReviewSettings {
  floorToFloorCm: number;
  targetTreadCm: number;
  landingCm: number;
  minimumClearFlightWidthCm: number;
  flightSeparationCm: number;
}
export const ARCHITECT_STAIR_SETTINGS: StairReviewSettings = {
  floorToFloorCm: 270,
  targetTreadCm: 30,
  landingCm: 120,
  minimumClearFlightWidthCm: 250,
  flightSeparationCm: 15
};

export function validStairEdit(stair: Stair): boolean {
  return Number.isFinite(stair.width) && stair.width > 0 &&
    Number.isFinite(stair.depth) && stair.depth > 0 &&
    Number.isInteger(stair.riserCount) && stair.riserCount >= 3 && stair.riserCount <= 30 &&
    Number.isFinite(stair.rotation) &&
    ['straight', 'l-shaped', 'u-shaped', 'spiral'].includes(stair.stairType) &&
    ['up', 'down'].includes(stair.direction);
}

export function reviewStair2d(stair: Stair, settings: StairReviewSettings = ARCHITECT_STAIR_SETTINGS) {
  const issues: string[] = [];
  if (!validStairEdit(stair) ||
      !Object.values(settings).every(v => Number.isFinite(v) && v > 0)) {
    return { issues: ['بيانات السلم أو إعدادات المراجعة غير صالحة.'], riserCm: NaN, requiredWidthCm: NaN, requiredDepthCm: NaN };
  }
  const riserCm = settings.floorToFloorCm / stair.riserCount;
  if (Math.abs(riserCm - 15) > 0.5) issues.push('راجع ارتفاع القائمة: المستهدف 15 سم لهذا المشروع.');
  let requiredWidthCm = settings.minimumClearFlightWidthCm;
  let requiredDepthCm = (stair.riserCount - 1) * settings.targetTreadCm + settings.landingCm;
  if (stair.stairType === 'u-shaped') {
    // Two separate flights. Width of 2.5m is PER FLIGHT, not the outer stairwell.
    const flightA = Math.ceil(stair.riserCount / 2);
    const flightB = stair.riserCount - flightA;
    requiredWidthCm = 2 * settings.minimumClearFlightWidthCm + settings.flightSeparationCm;
    requiredDepthCm = (Math.max(flightA, flightB) - 1) * settings.targetTreadCm + settings.landingCm;
  } else if (stair.stairType !== 'straight') {
    issues.push('الدرجات والبسطات في السلم المنكسر/الدائري تحتاج رسمًا هندسيًا تفصيليًا.');
  }
  if (stair.width + 0.001 < requiredWidthCm) {
    issues.push('عرض السلم لا يحقق عرض القلبات الصافي المحدد في المشروع.');
  }
  if (stair.depth + 0.001 < requiredDepthCm) {
    issues.push('طول السلم لا يكفي للنايمة 30 سم والبسطة 120 سم بافتراض هذه القسمة.');
  }
  return { issues, riserCm, requiredWidthCm, requiredDepthCm };
}

/** Consistent with the editor's 2D screen convention and CAD export. */
export function normalizePlanRotation(degrees: number): number {
  return Number.isFinite(degrees) ? ((degrees % 360) + 360) % 360 : NaN;
}
