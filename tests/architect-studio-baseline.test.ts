import { describe, it, expect } from 'vitest';
import { readProject } from '$lib/utils/projectValidation';
import { resolveRooms } from '$lib/utils/roomDetection';
import fs from 'node:fs';
import path from 'node:path';

describe('Architect Studio baseline 10×10 and 12×12 (original OpenPlan3D functions)', () => {
  for (const side of [10, 12]) {
    it(`imports and detects 9 rooms correctly for ${side}×${side} m`, () => {
      const raw = JSON.parse(fs.readFileSync(path.resolve(`tests/fixtures/architect-baseline-${side}x${side}.openplan.json`), 'utf-8'));
      const source = JSON.stringify(raw);
      const project = readProject(raw);
      expect(JSON.stringify(raw)).toBe(source);
      expect(project.floors.length).toBe(1);
      const f = project.floors[0];
      expect(f.walls.length).toBe(24);
      expect(f.stairs).toHaveLength(1);
      expect(f.stairs[0].riserCount).toBe(18);
      const rooms = resolveRooms(f);
      expect(rooms).toHaveLength(9);
      const total = rooms.reduce((s, r) => s + r.area, 0);
      expect(total).toBeCloseTo(side * side, 1);
      expect(new Set(f.walls.map(w => w.id)).size).toBe(f.walls.length);
      expect(f.annotations[0].x2 - f.annotations[0].x1).toBe(side * 100);
    });
  }
});
