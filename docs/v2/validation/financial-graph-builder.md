# Financial Graph Builder validation

- Date: 2026-09-26
- Branch: `develop/v2`
- Architecture: `docs/v2/architecture/financial-graph-builder.md`

## Automated

| Suite | Result |
| --- | --- |
| `test:financial-graph-builder` (new) | **129** assertions PASS: the 15 required fixture scenarios, invalid-data rejection, determinism under input reordering, immutability, 4B/4C/4D compatibility, and an end-to-end run through the real hooks (`useFinancialKPIs`, `useFinancialBreakdown`, `useFinancialGraph` via `react-dom/server`) → presentation → 4D scene |
| 4A / 4B / 4C / 4D | 25 / 77 / 105 / 340 PASS |
| financial domain, projection, parity, authority, hooks | PASS |
| Lint | 0 errors, no new warnings |
| Build | PASS (main bundle +~24 KB: the graph modules ship even with the flag off) |

Two test defects were found and fixed during development:
- A BHD fixture of `10.1235` is `10.12349…` in binary, so it correctly rounds to 10.123.
- `Intl` output uses a non-breaking space after `SRD`.

## Browser (Chrome 153, local dev server, owner signed in)

With `VITE_V2_ENABLED`, `SPATIAL_UI`, `GRAPH_ENGINE`, `MOTION_ENGINE`,
`SIMULATION` and `GRAPH_BUILDER` = true, set in the dev process environment
only:

| Check | Result |
| --- | --- |
| `#spatial` loads, Canvas ready | PASS |
| Real data → graph → 4D | PASS. Precise-coverage call counts show `useFinancialGraph` → `createFinancialGraphFromModel` → `createFinancialGraphPresentation` → `createFinancialGraphSpatialScene` running |
| Rendered scene (read from React fiber props) | `financial-graph-money-mind`: 1 core, 6 domains, 7 children from real records (4 investments summing to the SRD 29,600 domain figure, 1 asset, 2 transaction categories) |
| Edges | 14 (6 core→domain, 7 domain→item, 1 asset `increases` core), **0 dangling** |
| Unmapped data | the owner's SRD 5,000 liability (graph domain `liabilities`) is omitted from the scene with its `reduces` edge, as designed |
| Figures | core SRD 5,000.00 and domain totals identical to the existing view |
| Selection / switching / Overview | PASS (inspector: "4 items", "1 item") |
| Simulation on the graph scene | PASS (+120 mo, 12%/yr, +20,000: core SRD 25,000.00, investments 97,691.45, assets 30,000.00) |
| Motion modes full / reduced / minimal / off | each reaches the runtime (`motionPreference` prop) with the graph scene; selection works in all four |
| Page errors | none (only the known THREE.Clock deprecation warning and background-video / Firestore-channel aborts) |
| Flag off (server restarted without `GRAPH_BUILDER`) | signed-in view renders the existing `money-mind-financial` scene: unchanged |

Observed, as already documented in `graph-spatial-adapter.md`: a semantic
child → core edge (asset `increases` core) is drawn while its child node is
collapsed. The runtime's reveal rule covers only `domain-item` edges.

## Layer 3 regression

`npm run validate:layer3`, fresh run 2026-09-26T10:52Z: every check is true
(interaction, keyboard, camera, all four motion modes, four viewports,
console, WebGL fallback). The refreshed evidence files were not committed.
