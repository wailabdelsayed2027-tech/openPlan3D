# Architect Studio — Architectural 2D precision pass (2026-11-01)

**Status:** draft source changes, **not merged to main, not certified, and not browser-validated**. Stacked on the experimental Dockview/MLightCAD/FreeCAD branches.

## Code-level bugs diagnosed and addressed

1. **Door/window clipping at ends and overlaps:** `addDoor` and `addWindow` previously placed their full default width at any 0–1 position, including a centre on an endpoint, which caused geometry outside the source wall. They now use `nearestOpeningPosition` and validate the physical wall path (including curved walls), a draft 5cm end clearance, and collisions with other openings on that wall. Rejected placement keeps the tool active and displays an Arabic explanation. Width and position property edits are checked before saving.
2. **Wall resize clipping existing openings:** `resizeWallLength` previously checked connected wall geometry but not the downstream door/window cutouts. It now checks all affected wall openings against the planned geometry **before** mutating project state. Direct `updateWall` endpoint updates also check openings.
3. **Non-integer/invalid stair inputs:** `updateStair` could accept NaN and fractional riser counts. It now validates finite positive dimensions, integer counts of 3–30, types/directions, and finite rotation. A visible preliminary plan review displays target tread 30cm, 120cm landing, 270cm floor height, and a project-specific **2.5m clear width per flight** assumption. For an 18-riser single straight flight, the illustrative horizontal run plus one landing is 17×30+120 = **630cm**, so a 500cm-long box is flagged. For U-shaped stairs, **two flights each 250cm clear** require at least 515cm *total* width including an illustrative 15cm gap; a 250cm total stairwell does NOT meet this assumption. Actual railings, headroom, landings, structural geometry and local Egyptian rules require independent checking.
4. **Furniture direction out of range:** `updateFurniture` and `setFurnitureRotation` now normalize angles to 0–360 degrees, reject non-finite input, and expose four cardinal orientation buttons (0/90/180/270 degrees) while retaining free-angle rotation and flip controls.
5. **Missing clear inner-face dimensions:** For verified rectangular axis-aligned rooms only, `clearRectangularRoomDimensions` obtains dimensions between the inner faces of the boundary walls, instead of presenting centreline dimensions as clear room sizes. Results show in room properties and are drawn in blue **inside the selected room on the 2D canvas** when dimensions are enabled. Irregular or incomplete rooms return no assumed values. Wall thickness is nominal: plaster and finishes need additional allowances.

## Tests added / modified
- `tests/precision-2d.test.ts`: opening placement, collision, rejection, undo, connected wall resize, stair plan geometry, invalid stair input, furniture rotation, rectangular room clear width, L-shaped refusal.
- `tests/wall-editing.test.ts`: replaced the former assumption that centred openings at 0/1 should be accepted. This is an intentional safety behavior change.

## Remaining implementation items
- Prevent invalid opening geometry during *every* interactive drag path, including multi-element movements, reverse/split/delete of walls, and imported legacy plans. Current safeguards cover `addDoor`, `addWindow`, `updateDoor`, `updateWindow`, `resizeWallLength`, and `updateWall` endpoint edits; they do not yet cover every low-level direct mutation.
- Unify stair tread and landing **rendering geometry** across screen/3D/DXF/PDF/SVG; the new stair review currently checks parameters without changing the old schematic stair renderer. DO NOT use the drawing as a construction stair schedule yet.
- Generalize interior dimensions to L-shaped, rotated and curved rooms through robust planar offsets; the current implementation only shows verified axis-aligned rectangles.
- Add full dimension chains (outer/inner), explicit dimension grips, furniture rotation preview and CAD snapping tests.
- Run `npm ci`, `npm run check`, `npm test`, `npm run build`, Playwright. No GitHub Actions runs visible at the time of writing. Independently confirm DXF and PDF geometry, test on Android and desktop before merging.

## Proposed sample plan acceptance
- 12.00m × 12.00m outer plan, minimum bedroom 3×3m, kitchen 2.5×3m, bathroom 2×2m, living room ≥3×3m, with stair planned to meet the stated user dimensions.
- Select a rectangular 4.00m centreline room bounded by 20cm walls: clear 3.80m × 3.80m and 14.44m² *before finishes*.
- Move a door toward wall end; verify the 5cm jamb clearance and sensible rejection message.
- Decrease a connected wall until a door would clip; ensure the operation is rejected atomically and Undo remains valid.
- Rotate a bed 90°/180°/270°, flip its symbol, inspect saved angle and exported glyph.
- Export and re-open the DXF; verify geometry against plan by MLightCAD or another CAD reviewer.
