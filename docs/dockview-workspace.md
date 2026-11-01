# Dockview CAD Workspace — experimental integration (2026-11-01)

## Status
- Development branch: `feature/dockview-workspace-20261101`
- PR: #2 (draft; do not merge before checks pass)
- Dockview pinned: `8.8.3` (vanilla JavaScript build, not `dockview-react`, since this app uses Svelte 5).
- The classic CAD editor remains the default.

## Enabling the workspace
1. After installing dependencies and running the app, open the usual `/editor`.
2. On a desktop-width browser, click **واجهة النوافذ العائمة** at the bottom right.
3. Alternatively, visit `/editor?dock=1` to opt in and save the preference.
4. Use the tabs to drag groups between left/right/center positions. Use **نافذة عائمة** to float the properties panel.
5. Use **الطبقات** to focus the Layers panel, and **إعادة الترتيب** to restore defaults.
6. Click **الواجهة الأصلية** to revert. A saved layout is kept locally in that browser.

The layout is stored under `openplan3d:dockview-layout:v1`; the opt-in preference under `openplan3d:use-dockview`. The CAD project remains in the original project stores — moving a tab does not intentionally change wall geometry.

## Existing components reused
- `DockPlanCanvas`: FloorPlanCanvas, AlignmentToolbar, ElevationView and lazily loaded ThreeViewer
- `BuildPanel`: drawing/building tools
- `PropertiesPanel`: wall, door, stair, column and dimension properties
- `LayersPanel`: visibility and selection

## Required validation before merge
```bash
npm ci
npm run check
npm test
npm run build
npx playwright test tests/browser/dockview-workspace.spec.ts --project=chromium
```

Then manually verify:
- Drag/dock tabs with mouse, float Properties, reset layout, close/reopen browser.
- A 12x12 m example: walls, doors, a 2.5 m stair; confirm saved dimensions before and after dragging.
- Switching 2D/3D, importing/exporting JSON and DXF, and keyboard shortcuts.
- Desktop and small-screen behavior: small-screen users should retain the classic editor.
- Test other browsers and ensure the editor canvas redraws correctly after panel resize.

## Current limitations
- No local runtime compile or browser run has yet been completed by the integration author; the draft PR is a code change, not a deployed release.
- The workspace is enabled only on desktop-width viewports; native touch layout tuning is out of scope for v1.
- Dockview changes panel layout only. It does not add CAD geometry, stair engineering validation, DXF support, structural calculations or reinforcement drawings.
- npm's install/build step should re-verify the dependency lock and fill verified integrity hashes where needed.
