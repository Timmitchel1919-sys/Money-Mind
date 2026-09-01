# Layer 5 graph drill-down validation

- Date: 2026-08-31
- Branch: `claude/v2-layer-5-graph-drilldown` (from `f4c10bf`, Layer 4 accepted)
- Feature flags for browser checks: `VITE_V2_ENABLED=true`, `VITE_V2_SPATIAL_UI=true`,
  `VITE_V2_GRAPH_ENGINE=true`

## Scope

Selecting a domain node fans it out into one level of 3D child nodes — a line-item
graph — sized by each item's share of that domain, collapsing again on Overview. Gated
by the `v2GraphEngine` flag; off → byte-identical to Layer 4.

- New pure selector `src/hooks/useFinancialBreakdown.js` (mirrors `useFinancialKPIs`):
  per-domain `{ id, label, amount }[]`, sorted desc, capped at 8 with a synthesized
  `+N more` tail. income/expenses grouped by transaction `category`; assets/debt/
  investments/savings 1:1 from their items. No Firestore, no formatting (ADR-0002).
- `src/App.jsx` folds `children` (with formatted `detail`) into each domain of the
  memoized scene model **only when `featureFlags.v2GraphEngine`**.
- `src/visualization/adapters/financialSpatialAdapter.js` emits `kind: "child"` nodes
  (`parentId`, inherited `tone`, per-domain `magnitude` floor 0.4) on a radius-1.2 ring
  around each domain node, plus `relationship: "domain-item"` edges. `childCount` added
  to each domain node.
- `src/motion/nodes/nodeMotion.js` — new `kind: "child"` branch: collapsed
  (`scale ~0`, `opacity 0`) until `revealed` (`selectedId === parentId` or the child is
  selected). Core/radial output is unchanged (verified line-by-line).
- Runtime: `NodeGroup` adds a third shared child geometry; `SpatialNode` gates child
  reveal + disables raycast on hidden children; `SpatialEdges` hides `domain-item` edges
  unless the domain (or that item) is selected; `NodeLabels` skips child nodes (the DOM
  label layer is camera-independent and would drift under focus zoom — children are read
  in the inspector); `SpatialRuntime` inspector shows an "`N` items" hint for a selected
  domain and the child's amount when a child is selected. `src/spatial/contracts.js`
  JSDoc extended (`"child"` kind, `parentId`, `magnitude`, `childCount`).

## Static verification

| Check | Result |
| --- | --- |
| Dependency verification | PASS; no package change |
| Lint (`npx oxlint src/`) | PASS; only pre-existing unchanged V1 warnings |
| Production build (`npm run build`) | PASS; 2512 modules; spatial code stays in the lazy `runtime-*` chunk |
| `useFinancialBreakdown` pure helpers (bare-node harness) | PASS — see below |
| `createFinancialSpatialScene` with children (bare-node harness) | PASS — see below |
| PWA generation | PASS |
| Tests / typecheck | UNAVAILABLE (no runner; JS project) |

`useFinancialBreakdown` helpers:
- `groupByCategory` merges same-category transactions, maps blank category to
  `"Uncategorized"`, uses `Math.abs` on amounts.
- `rank`: 13 items → 8 + `{ label: "+5 more", amount: <summed remainder> }`, desc sorted;
  ≤ 8 items → no tail node.
- `fromItems`: missing `name` → `"Item N"` fallback.

`createFinancialSpatialScene` with a mixed model (domains with children, with an empty
`children: []`, and with no `children` key):
- Correct node/edge counts (1 core + 6 radial + N child; 6 domain + N item edges).
- Child `parentId`, `relationship: "domain-item"`, `magnitude` = share within the domain
  (peak = 1, others floored at 0.4), positions exactly `CHILD_RADIUS` (1.2) from the
  parent node.
- Missing / empty `children` → zero child nodes, no throw.
- Scene, nodes, child nodes and edges all frozen; `assertSpatialScene` passes.
- No model → 7 nodes / 6 edges / 0 children (Layer 4 parity).

## Browser validation

Local dev server, Chromium via the in-app browser pane, `VITE_V2_GRAPH_ENGINE=true`.

### Signed-out `#spatial` (proof scene regression) — PASS (2026-08-31)

| Check | Result |
| --- | --- |
| Route renders (lazy spatial chunk) | PASS |
| Proof/demo scene unchanged, no child nodes | PASS — proof domains carry no `children`, so `childNodesFor` emits nothing |
| Node select + focus motion (selected Debt) | PASS — focus, camera move, siblings mute, inspector updates |
| Inspector "N items" hint | PASS — absent (proof nodes have no `childCount`) |
| Overview / Reset | PASS |
| Console errors | NONE |

### Signed-in (real data) — PARTIAL PASS (2026-08-31)

Verified in the in-app browser with an authenticated user (data: 1 asset SRD 10,000,
1 investment SRD 12,500, 1 income category SRD 900, 1 expense category SRD 80, no debts,
no savings plans; net worth SRD 5,000).

Route-guard fix required first: App.jsx's signed-in guard gated on
`PROTECTED_PAGES.has(rawRoute)`, and `spatial` is a `DEVELOPMENT_PAGES` entry — so a
signed-in user hitting `#spatial` was redirected to `#dashboard`. Changed to
`APP_PAGES.has(rawRoute)` (widens only by the flag-gated `spatial` route).

| Check | Result |
| --- | --- |
| Layer 4 — real amounts in labels + inspector | PASS (Income 900, Investments 12,500, Assets 10,000, Expenses 80, Debt/Savings 0, core = net worth 5,000) |
| Layer 4 — magnitude sizing | PASS — Investments (largest) > Assets > core; the four ~0 / small domains sit at the floor |
| Select a domain with items → "N items" hint | PASS (Income/Expenses/Assets/Investments show "1 item"); pluralization fixed (`item`/`items`) |
| Child node revealed on parent select | PASS — child sphere visible above the selected Investments node, connected |
| Empty domain (Debt, Savings — SRD 0) | PASS — no hint, no child nodes, no crash |
| Overview / Reset → collapse | PASS — returns to `overview`, hint clears |
| Layer 3 motion states | PASS — `selecting` → `focused` → `overview`; switch between domains works |
| Console | No React / Three / spatial errors (only unrelated Firebase-auth COOP warnings) |

Multi-child fan-out — PASS (2026-08-31): added three investments (Staatsolie Bond 9,500,
Tech ETF 6,200, Bitcoin 1,400) so Investments held four holdings (SRD 29,600). Selecting
Investments showed **four child nodes on a ring around the domain node**, each joined by
a spoke edge, sized by share (gold largest at magnitude 1, Bitcoin at the floor);
siblings and core dimmed; inspector read "4 items — select one to inspect"; Overview
collapsed them.

Child click-to-focus — PASS after a fix. First pass: no click on a child ever
registered — every one deselected. Root cause: `SpatialNode` toggled the mesh `raycast`
prop between a no-op function and `undefined`, and R3F ignores an `undefined` prop, so
once a child had been collapsed its `raycast` stayed the no-op and it never became
clickable again. Fixed by toggling between two real functions
(`Mesh.prototype.raycast` ⇄ no-op). Also bumped the child size for comfortable
hit-testing: base 0.4 → 0.52, geometry 0.6 → 0.72, `MIN_CHILD_MAGNITUDE` 0.4 → 0.55.
After the fix: clicking the top child selects "gold", the inspector shows
`gold — SRD 12,500.00`, the camera focuses it; Overview collapses back to overview.

`+N more` — PASS (2026-08-31): with `MAX_CHILDREN` temporarily set to 2 and four
holdings, Investments rendered three child nodes (2 top holdings + one collapse node)
and the hint read "3 items". The collapse node's label ("+N more") and summed remainder
are covered by the bare-node harness. `MAX_CHILDREN` restored to 8.

Flag OFF (`VITE_V2_GRAPH_ENGINE=false`) — PASS (2026-08-31): `#spatial` renders the
Layer 4 scene; selecting a domain shows no "N items" hint and no child nodes.

Layer 3 motion matrix — PASS (2026-08-31), driven via `?spatialMotion=<mode>`:

| Mode | select | switch | interrupt | reset |
| --- | --- | --- | --- | --- |
| off | → `focused` immediately | → `focused` | settles on last requested (Debt) | → `overview` |
| reduced | `selecting` → `focused` | `switching` → `focused` | settles on last | `resetting` → `overview` |
| minimal | → `focused` | `switching` → `focused` | (n/a) | `resetting` → `overview` |
| full | `selecting` → `focused` | `switching` → `focused` | settles on last (Debt) | → `overview` |

No stale selection; inspector always ended on the last requested node or overview; no
console errors. The Layer 3 transition state machine
(`MotionProvider` / `transitionSequences`) was not modified — only the `kind: "child"`
branch of `resolveNodeMotion` is new.

Not done here (needs the Windows host): forced-WebGL-denial fallback.

## Known limitations / tuning notes

- Child nodes are always mounted (hidden at `scale ~0`); ~60 meshes total at the 8-item
  cap. GPU instancing is the future optimization if the cap is raised.
- Child ring radius 1.2, base scale 0.52, geometry radius 0.72, magnitude floor 0.55 —
  tuned for hit-testing on 2026-08-31; revisit if a domain with many items shows overlap
  with siblings or the core.
- A selected domain contracts by the Layer 3 radial factor (~6%) while its children are
  positioned from the un-contracted domain position — a small (~0.19 unit) offset,
  invisible at the focus zoom. Not compensated.
- No child DOM labels (camera-independent layer); children are identified via the
  inspector only.
- income/expenses children are transaction categories, not individual transactions.

## Decision

**LAYER 5 ACCEPTED** (2026-08-31)

Static, signed-out, and signed-in browser validation all pass: real per-domain totals
and magnitude sizing (Layer 4 intact), domain-select fans out real child nodes on a
ring sized by share, "+N more" collapses the tail, child click focuses the item and
shows its amount, Overview collapses, empty domains are inert, flag-OFF is Layer-4
identical, and the Layer 3 motion matrix passes in all four modes. Two bugs found and
fixed along the way (signed-in `#spatial` route guard; child-node `raycast` toggle).

Not exercised: forced-WebGL-denial fallback (needs the host) — low risk, the
`SpatialFallback` path is unchanged from Layer 2C.
