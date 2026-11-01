# Architect Studio: Dockview + MLightCAD + FreeCAD (experimental)

Branch: `feature/mlightcad-freecad-bridge-20261101` (stacked on `feature/dockview-workspace-20261101`).
This integration is deliberately **not** deployed to `main` before validation.

## What has actually been implemented
- **Dockview:** Adds two optional tabs to the experimental dockable editor:
  `مراجعة DXF` and `FreeCAD`. Legacy editor is retained.
- **MLightCAD:** Real `@mlightcad/cad-simple-viewer` browser CAD engine, in its
  own Vite microfrontend and iframe, with a local DXF file picker, read-only mode,
  40 MiB per-file demo cap, zoom-extents and WebGL canvas. Its `three` and
  peer dependencies are isolated from the floor-plan editor to avoid upgrading
  OpenPlan3D's existing Three.js unexpectedly.
- **FreeCAD:** One-click OpenPlan3D DXF export plus a downloadable `.FCMacro`
  script. Running that macro in desktop FreeCAD prompts for DXF, imports it,
  and optionally saves `.FCStd`. The macro is a file exchange bridge, **not**
  a structural design or BIM conversion routine.
- **Security:** Review DXF files in the browser; they are not uploaded by this panel.
  Closed-source/commercial `DWG` support is not included. LibreDWG integration
  is deliberately absent due GPL-3.0 distribution considerations.

## Build and validate locally on Windows / CI
From the repository root:

```bash
npm ci
npm run setup:cad-review
npm run check:cad-review
npm run build:cad-review
npm run check
npm test
npm run build
npx playwright test tests/browser/cad-integrations.spec.ts --project=chromium
npx playwright test tests/browser/dockview-workspace.spec.ts --project=chromium
```

`npm run build:cad-review` compiles the separate viewer into
`static/cad-review/index.html` plus JS assets. This generated output must be
built **before** the main SvelteKit build for deployment. The root `npm run build`
does not automatically build the sidecar (to avoid changing the main CI pipeline
before validation). On dev server, build sidecar first and then run `npm run dev`.

## How to use
1. Start the modified OpenPlan3D, open `/editor?dock=1` on desktop.
2. Click **مراجعة DXF**, then choose a local `.dxf` file in the MLightCAD pane.
   This is a read-only, separate review canvas: editing it will not silently change
   the source OpenPlan3D geometry.
3. Click **FreeCAD** to export the current floor plan as DXF and download
   the FreeCAD import macro.
4. In desktop FreeCAD select **Macro > Macros**, run the `.FCMacro`, choose DXF,
   and save a `.FCStd` document. Inspect units, wall positions and annotation
   compatibility after import.

The standalone MLightCAD review page is also usable directly on a phone after
deployment: `/cad-review/index.html`. Dockview workspace currently has a
desktop-only toggle; the classic editor remains the mobile fallback.

## Required release gates
- Confirm npm install and license/peer dependency compatibility for published
  versions of `@mlightcad/cad-simple-viewer` and its renderer modules.
- Confirm MLightCAD renders real DXF files, with layers and dimension text,
  in Chromium, Firefox and WebKit; test performance on Android.
- Confirm no breakage to existing 2D and 3D views from Dockview toggles.
- Test the macro in an installed FreeCAD GUI on Windows; this cannot be
  tested through ordinary browser CI. DXF import is 2D geometry, not
  automatically inferred columns, beams, footings or reinforcement.
- Confirm the sidecar is built and deployed in the same release; avoid exposing
  the tab without its assets.
- Test sample plans 6.5x8 m and 12x12 m, room limits, 2.5 m clear stair,
  0.30 m treads and 0.15 m risers independently of UI layout.
- Re-check DXF exports after structural/architectural edits before issuing prints.

## Sources
- MLightCAD: https://github.com/mlightcad/cad-viewer
- FreeCAD: https://github.com/FreeCAD/FreeCAD
- Dockview: https://github.com/dockview/dockview

**Status: source implementation only, runtime build and browser/FreeCAD
acceptance tests not yet confirmed.** Keep the PR draft until validated.
