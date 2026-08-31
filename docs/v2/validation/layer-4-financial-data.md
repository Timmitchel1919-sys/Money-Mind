# Layer 4 financial data validation

- Date: 2026-08-31
- Branch: `claude/v2-layer-4-financial-data` (cut from `develop/v2` at `e2063fb`, to merge back into `develop/v2`)
- Feature flags: `VITE_V2_ENABLED=true`, `VITE_V2_SPATIAL_UI=true` for browser checks

## Scope

Replace the mock spatial scene (`createProofSpatialScene` + `proofFinancialDomains`)
with the signed-in user's real finances:

- New pure adapter `src/visualization/adapters/financialSpatialAdapter.js` maps a
  normalized model to a renderer-neutral `SpatialScene`. It never imports Firebase and
  never formats currency.
- `src/App.jsx` reuses the existing pure selector `useFinancialKPIs` as the normalized
  model, maps its totals to `{ core, domains }` (formatting `detail` strings with the
  existing `formatCurrencyAmount`), memoizes it, and passes it to the signed-in
  `<SpatialExperience model={...} />`. The signed-out `<SpatialExperience />` keeps no
  model and still renders the demo/proof scene.
- `SpatialExperience` builds the scene with `useMemo` from `model` (or the proof scene
  when `model` is null).
- `SpatialNode` reads `node.magnitude` (share of the largest domain, floor 0.35) and
  applies it as a renderer-side multiplier on the resting scale and the damped scale
  target. `src/motion/**` is unchanged, so the Layer 3 motion policy is bit-identical.
- `SpatialRuntime` inspector footer additionally shows `selectedNode.detail` (the
  formatted amount) when a node is selected — additive, no state/motion change.

Domain mapping (via `useFinancialKPIs`):

| Node | Source field | Meaning |
| --- | --- | --- |
| core | `netWorth`, `healthScore` | assets − liabilities; health carried for later inspector use |
| income | `totalIncome` | sum of income transactions (period: All Time) |
| investments | `investmentValue` | current market value of holdings |
| assets | `totalAssets` | sum of asset values |
| debt | `totalDebt` | sum of debt balances |
| expenses | `totalExpenses` | sum of expense transactions |
| savings | `totalSavingsCurrent` | sum of savings-plan current balances |

## Static verification

| Check | Result |
| --- | --- |
| Dependency verification | PASS; no package change |
| Lint (`npx oxlint src/`) | PASS; only pre-existing unchanged V1 warnings, none in changed files |
| Production build (`npm run build`) | PASS; 2511 modules, spatial code stays in the lazy `runtime-*` chunk |
| Pure-adapter behaviour (bare-node harness) | PASS — see below |
| PWA generation | PASS |
| Tests | UNAVAILABLE (no test runner in repo) |
| Typecheck | UNAVAILABLE (JS project) |

Pure-adapter harness (`createFinancialSpatialScene` exercised directly under Node):

- No model / empty `domains` → 7 nodes (core + 6), 6 `core-<id>` edges, every domain
  `magnitude === 1` (uniform, visually equal to the proof scene). `assertSpatialScene`
  passes. Scene, `nodes`, each node, and each edge are frozen.
- All-zero amounts → same uniform `magnitude === 1` (guards divide-by-zero).
- Lopsided (`debt = 10000`, others ≤ 2000) → `debt.magnitude === 1`, every other domain
  clamped to the `0.35` floor.
- Negative amounts (`debt = -5000`) → magnitude uses `Math.abs`, so `debt` and a
  `+5000` asset both resolve to `magnitude === 1`.
- `core.healthScore` passes through unchanged; missing/non-finite → `null`.

## Bundle impact

| Bundle | Layer 3 | Layer 4 | Difference |
| --- | ---: | ---: | ---: |
| Initial JS | 1,526.88 / 440.11 kB gzip | 1,529.11 / 440.66 kB gzip | +2.23 / +0.55 kB gzip |
| Spatial/motion JS (lazy) | 896.53 / 239.24 kB gzip | 896.67 / 239.30 kB gzip | +0.14 / +0.06 kB gzip |
| Spatial CSS | 6.30 / 1.99 kB gzip | 6.30 / 1.99 kB gzip | 0 |

The adapter and model mapping add ~2 kB gzip to the initial chunk (they sit with the
already-eager `SpatialExperience` / `useFinancialKPIs`). The R3F/Three runtime stays lazy.

## Browser validation — PENDING

Not run in this environment: the Anthropic sandbox cannot reach Firebase/Auth and cannot
initialise WebGL (per `CLAUDE.md`). To be completed on the Windows host before acceptance:

1. `.env` → `VITE_V2_ENABLED=true`, `VITE_V2_SPATIAL_UI=true`; `npm run dev`.
2. Signed out, `#spatial` → proof/demo scene renders exactly as before (regression).
3. Signed in, test user with data in all six domains → each label shows its real
   formatted total; core shows net worth; node sizes track domain share; a near-zero
   domain still renders and is selectable (floor); selecting a node shows its amount in
   the inspector footer.
4. Re-run the Layer 3 motion matrix (overview / hover / select / focus / switch / reset /
   interrupt-selection / interrupt-reset × full / reduced / minimal / off) — expect all
   PASS, since only per-node resting scale changed. Record the matrix here.
5. New user, no data → six uniform nodes, no `NaN`/crash.
6. Forced WebGL denial → existing `SpatialFallback` still shown.

## Known limitations / tuning notes

- `useFinancialKPIs` sums raw `amount`s without `convertCurrency` (same as
  `KPIDashboard`). Mixed-currency users see mixed-currency magnitudes. Tracked as a
  pre-existing V1 limitation; out of scope for Layer 4.
- Magnitude is linear with a hard `0.35` floor, so domains below ~35% of the peak all
  render at the same size. A sqrt/log curve would preserve mid-range differences —
  candidate follow-up if browser review finds the scene too flat.
- `savings` uses savings-plan balances only; the emergency fund is not folded in.

## Decision

**LAYER 4 IMPLEMENTED — PENDING BROWSER VALIDATION**
