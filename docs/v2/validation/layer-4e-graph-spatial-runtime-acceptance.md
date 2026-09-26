# Layer 4E: Financial Graph → Spatial Runtime acceptance

- Date: 2026-09-26
- Branch: `develop/v2`, starting HEAD `8ffe8bb`
- Result: **ACCEPTED**, with one correction (below)

## Environment

- **Browser:** Google Chrome 153.0.8010.53 (Windows), headed, driven over
  CDP with playwright-core 1.62.1 (already a devDependency).
- **App:** local Vite dev server. `VITE_V2_ENABLED`, `SPATIAL_UI`,
  `GRAPH_ENGINE`, `MOTION_ENGINE`, `SIMULATION` and `GRAPH_BUILDER` were set
  to true in the dev process environment only; no `.env` change.
- **Auth:** the project owner signed in with their real account. The
  throwaway browser profile was deleted afterwards.
- **Evidence method (read-only, no app changes):**
  - CDP precise-coverage call counts to prove which functions ran;
  - React fiber props/hook state to read the rendered `SpatialScene` and the
    built `FinancialGraph`;
  - the R3F root (`_roots`) to read the Three.js scene that is actually drawn.
- **Data scenario:** the owner's existing records, with no fixtures:
  - 2 transactions (1 income category, 1 expense category);
  - 1 asset, 1 liability, 4 investments;
  - no debts and no savings plans (valid empty domains).

  Screenshots were captured but not committed, because they show personal
  financial records.

## Pipeline (observed at runtime)

| Stage | Evidence | Result |
| --- | --- | --- |
| Records → builder | `createFinancialGraphFromModel` runs; each of the 6 record nodes traced back to its loaded record (collection/id); `amountMinor` = record value × 100; category nodes list only loaded transaction ids | PASS |
| 4A graph | `validateGraph` valid, frozen; 8 domains; exactly 1 core; edges = asset `increases` core, liability `reduces` core only (nothing fabricated) | PASS |
| 4B engine | on the real graph: every node/edge resolves; domain queries match; relationship queries (`getIncomingNeighbors(core)`, `getRelatedNodes`); `selectNode` / `clearSelection` valid | PASS |
| 4C transforms | on the real graph: domain view, node selection, core neighborhood, "what reduces net worth", 2-step `composeGraphTransforms` pipeline; all valid; source graph unchanged | PASS |
| 4D adapter | the scene the runtime renders is structurally identical to `createFinancialGraphSpatialScene(realGraph)`; 14 nodes, 14 edges, 0 dangling, 0 duplicates; the liability is reported as omitted (no spatial slot) | PASS |
| Runtime / Three.js | WebGL2 `WebGLRenderer`, context not lost; 14 meshes; all 14 scene edges present as rendered `Line` objects | PASS |
| Identity | record id → graph node id → spatial node id / `entityId` (same id, no replacement); identical graph and scene ids after a full reload | PASS |
| Currency | SRD → USD → EUR → SRD via Settings: graph `reportingCurrency`, record Money currency and every label follow the setting; `amountMinor` values unchanged (no conversion) | PASS (see limitation) |
| No new calculations | core/domain figures equal the existing KPI scene; record figures are the records' own Money | PASS |

## Correction: edges into collapsed child nodes

**Defect (observed):** at overview, the builder's asset → core `increases`
edge was drawn to the asset child's position while that child node was
collapsed (invisible). The line ended at an empty point in the scene. The
runtime's reveal rule (`SpatialEdges.jsx`) hid only `domain-item` edges;
the graph path is the first producer of semantic edges on child nodes.

**Fix (smallest):** `src/spatial/runtime/edges/SpatialEdges.jsx`. An edge is
revealed only when both endpoints are revealed, using the same child rule
`SpatialNode.jsx` already applies (a child is visible when its parent or the
child itself is selected).

**Proof of no regression:**
- An exhaustive old-vs-new rule comparison over every edge × every possible
  selection of the existing financial scenes (with drill-down children) and
  the proof scene found **0 differences in 651 checks**.
- Visible rendered edges after the fix (Three.js opacity > 0.01):

| State | Visible edges |
| --- | --- |
| Overview | 6 × core→domain |
| Assets selected | + 1 `domain-item` + the `increases` edge |
| Investments selected | + 4 `domain-item` |
| After reset | 6 × core→domain |

## Interaction and motion (graph-built scene, signed in)

The same steps and assertions as `scripts/v2/layer3-browser-acceptance.mjs`,
at 1366×768, with `prefers-reduced-motion` emulated like the harness:

| | FULL | REDUCED | MINIMAL | OFF |
| --- | --- | --- | --- | --- |
| runtime `motionPreference` | full | reduced | minimal | off |
| initialization, hover, selection, deselection | PASS | PASS | PASS | PASS |
| switching, rapid interruption | PASS | PASS | PASS | PASS |
| keyboard (Tab / Enter / Space / reset) | PASS | PASS | PASS | PASS |
| camera focus / reset, core click, quality modes | PASS | PASS | PASS | PASS |
| OFF settles without transition | — | — | — | PASS |

Selection uses the existing motion engine (`aria-pressed` and scene state).
There is no second state machine.

## Responsive

| Viewport | Overflow | Labels in stage | Core horizontally centred | Select / reset |
| --- | --- | --- | --- | --- |
| Desktop 1920×1080 | none | 7/7 | yes | PASS |
| Laptop 1366×768 | none | 7/7 | yes | PASS |
| Tablet 768×1024 | none | 7/7 | yes | PASS |
| Mobile 390×844 | none | 7/7 | yes (plus a focused screenshot) | PASS |

## WebGL fallback (signed in)

The same profile was relaunched with `--disable-webgl --disable-gpu` (the
harness mechanism):
- "Spatial view unavailable" appears, with no canvas and no page or console
  errors.
- The graph still builds (9 nodes, 2 edges) without affecting the fallback.
- The Dashboard and Net Worth pages work.

Relaunched with WebGL, it recovered: WebGL2, the 14-line graph scene renders,
and selection works.

## Console / network / performance

- **Page errors:** none.
- **Console:** only the known `THREE.Clock` deprecation warning and
  `ERR_CACHE_OPERATION_NOT_SUPPORTED` for the background video. Both are
  pre-existing and unrelated.
- **Failed requests:** background-video range aborts and a Firestore Listen
  channel aborted on reload. Neither blocks anything; there were no HTTP
  errors.
- **Firestore:** 0 requests during the spatial session (navigation,
  interaction, simulation). The data loaders run only at app load.
- **Graph rebuilds:**
  - idle 5 s: 0;
  - 7 selections + reset: 0 pipeline calls;
  - simulation lever change: the builder is **not** re-run (memoized on the
    record arrays); only the adapter/presentation re-run, because the
    displayed figures change.
  - 4 builds during initial load, one per data-array arrival.

## Regression

| Suite | Result |
| --- | --- |
| Builder / 4A / 4B / 4C / 4D | 129 / 25 / 77 / 105 / 340 PASS |
| Financial domain, projection, parity (78 + 2 per currency), authority, hooks | PASS |
| `npm run validate:layer3` (fresh run 2026-09-26T12:41Z, after the fix) | all checks true, including WebGL fallback and 4 viewports (covers the Layer 2C runtime behaviours; no separate 2C script exists) |
| Lint | 0 errors, no new warnings |
| Build | PASS |

## Limitations (not blocking)

- **Records have no stored currency** (V1 never writes one). The Settings
  currency declares their denomination, so switching it relabels the same
  amounts. This is the same as the existing KPIs and scene. Nothing is
  converted, and a record carrying its own `currency` keeps it (unit-tested).
  Fixing it needs a schema change, which is out of scope.
- JPY/BHD aren't offered by Settings, so they're covered by unit tests only.
- The liability (graph domain `liabilities`) has no spatial slot, so it is
  omitted from the 3D scene and reported.
