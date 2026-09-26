# Minor-unit projection authority + KPI / hook integration validation

- Date: 2026-09-26
- Branch: `develop/v2` (starting HEAD `663eddb`)
- Architecture: `docs/v2/architecture/financial-domain.md` ("Projection Authority",
  "KPI / Hook Integration")
- Feature flags: unchanged. V2 remains OFF by default; the projection only runs when
  `v2Simulation` is on and the simulation is active.

## Layer 1: minor-unit projection → production authority

| Check | Result |
| --- | --- |
| Currency boundary explicit (`currencyCode` required, from `settings.currency`) | PASS |
| USD hardcode removed from the production path (source scan in the authority test) | PASS |
| Per-currency precision (SRD/USD/EUR 2, JPY 0, BHD 3) | PASS |
| Deterministic (50 repeated runs identical) | PASS |
| Parity baseline 78 EXACT + 2 PRECISION_IMPROVEMENT in SRD, USD, EUR (asserted) | PASS |
| Extended parity: 0 REGRESSION, 0 CURRENCY_CONTEXT | PASS |
| Latent 663eddb defect (negative `monthlySaving` not clamped) found and fixed | PASS |
| Production caller uses `runFinancialProjection` (minor-unit) | PASS |
| Fallback to legacy is explicit (`authority`, `fallbackReason`) | PASS |

Difference classification (JPY scenario during development): a first draft fed ¥0.8
fractional amounts into a 0-digit currency. That is a **test defect**: the values are not
representable in JPY, and the half-unit bound doesn't hold for rounded-then-multiplied
figures. The test now uses representable inputs, and the input-rounding policy is
asserted separately.

## Layer 2: KPI / hook integration

| Consumer | Previous source | Target source | Currency context | Risk | Validation |
| --- | --- | --- | --- | --- | --- |
| `App.jsx` `spatialFinancialModel` (V2 simulation) | inline snapshot + legacy `projectFinancials` | `useFinancialProjection` → `runFinancialProjection` | `settings.currency` → `currencyCode` | Low (flag-gated, V2 off by default) | hook test, build |
| `useFinancialKPIs` (V1 actual totals) | own float math | not migrated | — | V1 semantics / mixed-currency records | unchanged; covered by hook pass-through test |
| `Dashboard`, `KPIDashboard`, `useMoneyAIContext` | `useFinancialKPIs` | not migrated (don't consume projection) | — | — | — |
| `useFinancialBreakdown`, `useAssets`, `useDebt`, `useSavings`, `useInvestments` | Firestore / own selectors | not migrated (don't consume projection) | — | — | — |
| `financialSpatialAdapter`, Spatial Runtime, Motion, Financial Graph Engine | — | untouched (prohibited scope) | — | — | — |

Hook test (`tests/financial/financialProjectionHook.test.mjs`, real hooks via `react-dom/server`):
- Inactive: `figures` equal the KPI snapshot, and `netWorth === financialKPIs.netWorth`.
- Active: `authority === "minor-unit"` and the currency propagates to `figures.currencyCode`.
- Compared with the previous production output: **99 EXACT, 21 PRECISION_IMPROVEMENT, 0 REGRESSION**
  (SRD/USD/EUR × 4 lever sets × 10 figures). The improvements are float noise
  (`12500.400000000001` → `12500.4`) and compound-interest rounding to the cent.
- No conversion: identical figures when projected as SRD vs USD.
- Missing currency: flagged `legacy-fallback`, never USD.

## Commands

| Command | Result |
| --- | --- |
| `npm run test:financial-domain` | PASS |
| `npm run test:financial-projection` | PASS (legacy reference regression) |
| `npm run test:financial-projection-parity` | PASS |
| `npm run test:financial-projection-authority` | PASS (new) |
| `npm run test:financial-projection-hooks` | PASS (new) |
| `npm run test:financial-graph` / `-engine` / `-transform` | PASS (25 / 77 / 46) |
| `npm run lint` (host toolchain) | 0 errors; 16 warnings, down from 17 at baseline. None are new; the removed one was the unused import in the parity test |
| `npm run build` (host toolchain) | PASS |

Lint and build ran through the Windows host toolchain (`cmd.exe /c npm run …`) because
`node_modules` holds Windows native binaries (oxlint, rolldown). Node test scripts ran
in WSL.

## Not validated here
- There was no in-browser check with `v2Simulation` on. The `App.jsx` change is a
  mechanical move, covered by the build and the hook test.
