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

Not exercised — the test account has exactly one line item per non-empty domain, so:
- multi-child ring fan-out and the `+N more` node were not seen with real data
  (covered by the adapter harness only);
- clicking a single ~0.24-unit child to focus it could not be reliably hit-tested by
  pixel. Re-check both with an account that has several items in a domain.

Still to record on the Windows host: full Layer 3 motion matrix
(overview / hover / select / focus / switch / reset / interrupt × full / reduced /
minimal / off), flag-OFF parity, forced-WebGL-denial fallback.

## Known limitations / tuning notes

- Child nodes are always mounted (hidden at `scale ~0`); ~60 meshes total at the 8-item
  cap. GPU instancing is the future optimization if the cap is raised.
- Child ring radius (1.2) and base scale (0.4) are first-pass; adjust if the browser
  review shows overlap with siblings or the core.
- A selected domain contracts by the Layer 3 radial factor (~6%) while its children are
  positioned from the un-contracted domain position — a small (~0.19 unit) offset,
  invisible at the focus zoom. Not compensated.
- No child DOM labels (camera-independent layer); children are identified via the
  inspector only.
- income/expenses children are transaction categories, not individual transactions.

## Decision

**LAYER 5 IMPLEMENTED — static, signed-out, and core signed-in validation PASS.**
Remaining before acceptance: re-check the multi-child fan-out / `+N more` / child
selection with a richer account, and record the full Layer 3 motion matrix.
