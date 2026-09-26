# Layer 4C + 4D validation: graph transformations & graph → spatial adapter

- Date: 2026-09-26
- Branch: `develop/v2`
- Architecture: `docs/v2/architecture/financial-graph-engine.md` (4A–4C),
  `docs/v2/architecture/graph-spatial-adapter.md` (4D)

## Starting state

Layers 4A/4B and an initial 4C existed only as **untracked** files, never
committed, even though `package.json` on GitHub already referenced their test
scripts. With the owner's approval they were committed unchanged first
(`feat(v2): add financial graph contracts, engine and transformations`), so
the 4C/4D changes below are reviewable on their own.

## Layer 4C

Added on top of the existing transformations (`projectGraph`,
`selectNodesBy*`, `selectEdgesByRelationships`, `extractNeighborhood`,
`extractConnectedComponent`):
- `selectNodeRelationships` (incoming / outgoing / both, optional relationship filter)
- `selectRelationshipsBetween` (source → target, directed or not)
- `composeGraphTransforms` (validated, re-frozen pipelines)
- `metadata.lineage` provenance

**Defect found and fixed:** views over graphs with **hierarchical domains**
dropped parent domains, so they failed validation (`DOMAIN_PARENT_MISSING`)
and threw. This was already in the committed 4C code. The 4D tests surfaced
it, and a regression test now covers it.

| Gate item | Result |
| --- | --- |
| 4A contracts / validation reused, no duplicate model | PASS |
| 4B engine and indexes reused | PASS |
| Filtering, subgraphs, domain views, relationship views, projection | PASS |
| Composition | PASS (identical to manual chaining) |
| Immutable, deterministic, valid derived graphs | PASS |
| No financial calculations, no spatial imports (import scan) | PASS |
| 4A / 4B / 4C tests | 25 / 77 / **105** (was 46) PASS |
| Lint / build | 0 errors, no new warnings / PASS |

Snapshots: none added. Every derived graph is already a frozen, serializable
`FinancialGraph`, and a dedicated type would duplicate it (rationale in the
architecture doc). Graph **merge** stays deferred.

## Layer 4D

| Gate item | Result |
| --- | --- |
| Explicit adapter boundary reusing 4A/4B + spatial contracts | PASS |
| No amounts or financial calculation in adapter or scene (source + output checks) | PASS |
| No Firestore / Three.js / R3F / React imports; no graph lib, force layout, physics, randomness | PASS |
| Node / edge / domain / selection mapping | PASS |
| Canonical radial slots identical to the live scene | PASS |
| Unmapped domain → omitted and reported, no dangling edges | PASS |
| Invalid inputs rejected with typed errors | PASS |
| Deterministic, frozen output; input never mutated | PASS |
| Empty graph → empty valid scene | PASS |
| 4C views and pipelines map directly | PASS |
| Runtime-renderable scene (kinds, finite positions, palette tones, parents, endpoints) | PASS |
| 4D tests | **340** assertions PASS |
| `financialSpatialAdapter.js` refactor output | byte-identical on 4 models (empty, real totals, projected + children) |

## Spatial regression

`npm run validate:layer3` (Chromium, signed-out `#spatial` proof scene, fresh
run 2026-09-26T09:38Z):

- All checks true: initialization, hover, selection, deselection, switching,
  rapid interruption, keyboard, camera focus/reset, and the full / reduced /
  minimal / off motion modes.
- All 4 responsive viewports pass.
- Console is clean, and the WebGL-unavailable fallback works.

These checks cover the Layer 2C runtime behaviours too: WebGL init and
fallback, quality, and viewports. There is no separate 2C script. The
harness's refreshed screenshots and report were not committed (evidence
churn). The harness process didn't exit on Windows after finishing, because
its spawned dev server outlives `kill()`. That is a pre-existing harness
issue, not a runtime one.

## Other suites

The financial domain, projection, parity, authority and hook suites all pass.
