import { beforeEach, describe, expect, it } from 'vitest';
import { get } from 'svelte/store';
import {
  addDoor, addWindow, addStair, activeFloor, addFurniture,
  currentProject, loadProject, resizeWallLength, updateDoor,
  updateFurniture, updateStair, updateWindow, undo
} from '$lib/stores/project';
import { nearestOpeningPosition, wallOpeningError } from '$lib/utils/openingRules';
import { clearRectangularRoomDimensions } from '$lib/utils/roomClearDimensions';
import { reviewStair2d, normalizePlanRotation } from '$lib/utils/stairReview2d';
import { roomProject } from './fixtures/project';
import type { Stair, Wall } from '$lib/models/types';

const floor = () => get(activeFloor)!;
beforeEach(() => {
  const p = roomProject();
  p.floors[0].doors = [];
  p.floors[0].windows = [];
  p.floors[0].stairs = [];
  p.floors[0].furniture = [];
  loadProject(p);
});

describe('architectural 2D opening constraints', () => {
  it('clamps a new door inside the wall ends instead of cutting beyond the corner', () => {
    const wall = floor().walls[0];
    const id = addDoor(wall.id, 0, 'single');
    expect(id).toBeTruthy();
    const door = floor().doors.find(d => d.id === id)!;
    expect(wallOpeningError(wall, door)).toBeNull();
    expect(door.position).toBeGreaterThan(0);
    expect(door.position).toBeLessThan(1);
  });

  it('refuses a too-short wall or overlap with an existing door', () => {
    const wall = floor().walls[0];
    expect(nearestOpeningPosition(wall, 0.5, 10000)).toBeNull();
    expect(addDoor(wall.id, 0.5, 'single')).toBeTruthy();
    const previousCount = floor().doors.length;
    expect(addDoor(wall.id, 0.5, 'single')).toBe('');
    expect(floor().doors).toHaveLength(previousCount);
    expect(addWindow(wall.id, 0.5, 'standard')).toBe('');
  });

  it('atomically rejects editing a door/window beyond wall limits', () => {
    const wall = floor().walls[0];
    const doorId = addDoor(wall.id, 0.5);
    const winId = addWindow(floor().walls[1].id, 0.5);
    expect(doorId).toBeTruthy(); expect(winId).toBeTruthy();
    const before = JSON.stringify(get(currentProject));
    updateDoor(doorId, { width: 3000 });
    updateWindow(winId, { position: 0, width: 2000 });
    expect(JSON.stringify(get(currentProject))).toBe(before);
  });

  it('rejects shrinking a connected wall if its existing opening would be cut off', () => {
    const wall = floor().walls[0];
    const doorId = addDoor(wall.id, 0.8);
    expect(doorId).toBeTruthy();
    const before = JSON.stringify(get(currentProject));
    expect(resizeWallLength(wall.id, 110)).toBeTruthy();
    expect(JSON.stringify(get(currentProject))).toBe(before);
  });

  it('retains legal door edits and undo semantics', () => {
    const wall = floor().walls[0];
    const id = addDoor(wall.id, 0.5);
    const oldWidth = floor().doors[0].width;
    updateDoor(id, { width: oldWidth - 10 });
    expect(floor().doors[0].width).toBe(oldWidth - 10);
    undo();
    expect(floor().doors[0].width).toBe(oldWidth);
  });
});

describe('2D stairs and furniture direction', () => {
  const stair: Stair = {
    id: 's', position: {x: 0,y: 0}, rotation: 0, width: 250,
    depth: 500, riserCount: 18, direction: 'up', stairType: 'straight'
  };
  it('reports that 18 risers / 30cm tread / 120cm landing need 630cm straight length', () => {
    const review = reviewStair2d(stair);
    expect(review.riserCm).toBe(15);
    expect(review.requiredDepthCm).toBe(630);
    expect(review.issues.some(x => x.includes('طول'))).toBe(true);
    expect(reviewStair2d({ ...stair, depth: 630 }).issues).toEqual([]);
  });

  it('does not mistake a U-shaped 250cm total stairwell for two 250cm clear flights', () => {
    const review = reviewStair2d({ ...stair, stairType: 'u-shaped' });
    expect(review.requiredWidthCm).toBe(515);
    expect(review.issues.some(x => x.includes('عرض'))).toBe(true);
  });

  it('rejects fractional/invalid stair geometry without modifying the project', () => {
    const id = addStair({ x: 300, y: 300 });
    const before = JSON.stringify(get(currentProject));
    updateStair(id, { riserCount: 18.5, width: -30 });
    expect(JSON.stringify(get(currentProject))).toBe(before);
    updateStair(id, { riserCount: 18 });
    expect(floor().stairs.find(x => x.id === id)?.riserCount).toBe(18);
  });

  it('normalizes furniture orientation and rejects non-finite angles', () => {
    const id = addFurniture('bed', {x: 200,y: 200});
    updateFurniture(id, { rotation: -90 });
    expect(floor().furniture.find(x => x.id === id)?.rotation).toBe(270);
    updateFurniture(id, { rotation: 450 });
    expect(floor().furniture.find(x => x.id === id)?.rotation).toBe(90);
    updateFurniture(id, { rotation: NaN });
    expect(floor().furniture.find(x => x.id === id)?.rotation).toBe(90);
    expect(normalizePlanRotation(-450)).toBe(270);
  });
});

describe('internal clear dimensions', () => {
  it('subtracts half the thickness of the four boundary walls', () => {
    const wall = (id: string, x1: number, y1: number, x2: number, y2: number, thickness: number): Wall =>
      ({ id, start: { x:x1,y:y1 }, end: { x:x2,y:y2 }, thickness, height: 270, color: '#000' });
    const walls = [
      wall('l',0,0,0,1200,20), wall('r',1200,0,1200,1200,20),
      wall('t',0,0,1200,0,20), wall('b',0,1200,1200,1200,20)
    ];
    const polygon = [{x:0,y:0},{x:1200,y:0},{x:1200,y:1200},{x:0,y:1200}];
    const result = clearRectangularRoomDimensions(polygon, walls);
    expect(result?.clearWidthCm).toBe(1180);
    expect(result?.clearDepthCm).toBe(1180);
    expect(result?.clearAreaM2).toBeCloseTo(139.24);
  });

  it('refuses to invent a clear size for an L-shaped or unbounded room', () => {
    const polygon = [{x:0,y:0},{x:400,y:0},{x:400,y:200},{x:200,y:200},{x:200,y:400},{x:0,y:400}];
    expect(clearRectangularRoomDimensions(polygon, [])).toBeNull();
    expect(clearRectangularRoomDimensions([{x:0,y:0}], [])).toBeNull();
  });
});
