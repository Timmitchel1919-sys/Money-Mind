# Layer 6 simulation validation

- Date: 2026-08-31
- Branch: `claude/v2-layer-6-simulation` (from `c5e24bb`, Layer 5 accepted)
- Feature flags for browser checks: `VITE_V2_ENABLED`, `VITE_V2_SPATIAL_UI`,
  `VITE_V2_GRAPH_ENGINE`, `VITE_V2_SIMULATION` all true

## Scope

A "what-if" layer on the spatial view. A **Simulate** toggle in the toolbar opens a
panel of levers (months forward, extra debt payment/mo, extra saving/mo, investment
return %, one-off to assets); while active, the domain nodes and net-worth core
re-scale to the projected state, an amber "Projection · +N mo" badge sits in the
inspector, and "Reset to actual" zeroes the levers. Gated by `v2Simulation`; off →
byte-identical to Layer 5.

- New pure `src/financial/projection/projectFinancials.js` (first occupant of
  `src/financial/`, the ADR-0002 domain boundary): `projectFinancials(snapshot, levers)`
  → projected snapshot. Deliberately separate from the V1 math — the actual path never
  routes through it (CLAUDE.md rule 6).
- `src/App.jsx` owns `sim` lever state, assembles a numeric snapshot from
  `useFinancialKPIs` (+ `monthlySaving` = Σ savingsPlans.monthly), and in the
  `spatialFinancialModel` `useMemo` builds domain amounts from `projectFinancials(...)`
  when `featureFlags.v2Simulation && sim.active`, else from actual KPIs exactly as
  before. `children` (Layer 5) stay from actual data — drill-down is not projected in
  v1. Passes `sim` controls to the signed-in `<SpatialExperience>`.
- `SpatialExperience` threads `sim` to `SpatialRuntime`; the toggle, `SimPanel`, and the
  inspector badge live in `SpatialRuntime`. Adapter copies `projected` / `monthsForward`
  onto the scene (no math). `contracts.js` JSDoc extended.
- Scene morph is free: only model numbers change → `SpatialExperience`'s `useMemo`
  rebuilds the scene → `SpatialNode` damps each mesh toward the new size (Layer 3/4).

Projection math (`m = clamp(round(monthsForward), 0, 600)`):

| Field | Rule |
| --- | --- |
| debt | `max(0, debt - (monthlyDebtPayment + max(0,extraDebtPayment)) * m)` |
| savings | `max(0, savings + (max(0,monthlySaving) + max(0,extraMonthlySaving)) * m + min(0, oneOff))` |
| investments | `investments * (1 + clamp(annualReturnPct,0,100)/1200) ** m` (compound) |
| assets | `assets + max(0, oneOff)` |
| income, expenses | flat (run-rates) |
| netWorth | `assets - liabilities` — same formula as `useFinancialKPIs`, projected assets only |

## Static verification

| Check | Result |
| --- | --- |
| Dependency verification | PASS; no package change |
| Lint (`npx oxlint`) | PASS; only pre-existing V1 warnings |
| Production build | PASS; 2513 modules; spatial code stays in the lazy `runtime-*` chunk (+~1.6 kB) |
| `projectFinancials` bare-node harness | PASS — see below |
| PWA generation | PASS |
| Tests / typecheck | UNAVAILABLE (no runner; JS project) |

`projectFinancials` harness (snapshot: assets 10k, liab 5k, debt 12k, debtPay 300,
savings 2k, save 150, invest 29.6k):
- `m=0` & levers 0 → output === input (no jump on toggle).
- 60 mo, extra debt 500 → `(300+500)*60 = 48000 > 12000` → debt floors at 0.
- 120 mo, 6%/yr → investments match a reference compound loop to < 1e-6.
- `oneOff = -3000` → savings floors at 0, assets unchanged; `oneOff = +5000` → assets
  +5000, savings unchanged.
- `monthsForward: -10`, `extraDebtPayment: NaN`, `annualReturnPct: 999`, `oneOff: NaN`
  → every output field finite (clamped/guarded); `monthsForward: 99999` → clamped to 600.
- `netWorth = (assets + oneOff) - liabilities`.

## Browser validation (2026-08-31, in-app browser, signed in)

Data: assets SRD 10,000, investments SRD 29,600 (4 holdings), income SRD 900,
expenses SRD 80, no debts, no savings plans; net worth SRD 5,000.

| Check | Result |
| --- | --- |
| Flag OFF | PASS — no Simulate control, no badge, scene identical to Layer 5 |
| Toggle Simulate on, levers 0 | PASS — panel (5 fields + Reset), badge "Projection · +0 mo", scene does not move (identity holds in-app) |
| Months 120 + return 12% + one-off 20,000 | PASS — Investments 29,600 → **97,691.45** (compound), Assets 10,000 → **30,000**, core 5,000 → **25,000** (= 30,000 − 5,000 liab); badge "+120 mo" |
| Reset to actual | PASS — levers zeroed, badge "+0 mo", labels back to actual; sim stays on |
| Toggle Simulate off | PASS — panel + badge gone, actual scene |
| Motion with sim active (select / switch / reset) | PASS — badge persists across states; selected node shows the projected amount (e.g. Investments SRD 47,759.66 at +72 mo / 8%); no stale state |
| Console | No React / Three / spatial errors |

## Known limitations / v1 scope

- Drill-down children are **not** projected — a domain node shows its projected total
  while its child nodes still sum to the actual figure. Documented; revisit if needed.
- Net-worth core reflects only asset / one-off changes (keeps V1's `netWorth`
  definition, which excludes debt-manager debts). Debt / savings / investment levers
  reshape those domain nodes, not the core.
- No interest accrual on debt; no income / expense growth or inflation.
- No saved scenarios or actual-vs-projected side-by-side.
- Levers are session state only (not persisted).

## Decision

**LAYER 6 IMPLEMENTED — static + signed-in browser validation PASS.**
Pending before acceptance (host): full Layer 3 motion matrix with sim active across all
four motion modes; forced-WebGL-denial fallback (unchanged since Layer 2C).
