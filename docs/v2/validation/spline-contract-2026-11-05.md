# Spline contract preparation — 2026-11-05

This records preparation only. It does not accept an integration layer or
authorize release: the Spline renderer is not connected to the application.

- Inspected the editable Spline scene and recorded the current core and module
  object IDs in the integration contract and registry metadata.
- Removed its independent HTML navigation overlay. Existing React navigation
  and the motion engine remain the intended authorities.
- Added a pure selection resolver that ignores unknown objects and modules not
  in the supplied visible registry. It is not wired into the runtime.
- `node tests/financial/splineSelectionAdapter.test.mjs`: passed.
- `node scripts/v2/validate-v2-app.mjs`: 224 assertions passed.
- `node scripts/v2/validate-spatial-universe.mjs`: 238 assertions passed.
- Oxlint completed with existing warnings. Vite build exited 0 and Workbox
  generated `dist/sw.js` and its runtime. This verifies generation, not PWA
  installability, offline behavior, or an integrated scene.

The prior interrupted build was not shown to have a defect: a repeat completed
the Workbox stage and exited normally. The environment's Node shim had no
configured version; validation used the bundled Node 24 executable directly.
Native labels, exported object IDs, event wiring, interaction, accessibility,
responsive behavior, real-data result rail and production release remain open.
