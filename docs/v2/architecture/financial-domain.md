# V2 Financial Domain Foundation

**STATUS:** 
- Minor-unit domain foundation: IMPLEMENTED
- V2 simulation projection: MINOR-UNIT IS THE PRODUCTION AUTHORITY (see "Projection Authority" below)
- V1 KPI totals (`useFinancialKPIs`): unchanged, still floating-point (not migrated — see "Remaining Migration Work")

> [!NOTE]
> Only the V2 projection path is minor-unit authoritative. `useFinancialKPIs` and the V1
> page-level calculators still compute actual figures in floating point, by design for now.

## Motivation for Minor Units
Money Mind V1 and early V2 iterations relied on JavaScript `Number` (IEEE-754 floating point) to represent monetary values. This approach inherently risks precision loss (e.g., `0.1 + 0.2 === 0.30000000000000004`), which can cause subtle accounting discrepancies during division, fraction truncation, or simulating months of compounding interest.

To ensure exact deterministic accounting, the financial domain boundary now operates strictly in integer minor units (e.g., cents). 

## Internal Money Representation
Money is represented conceptually and explicitly as a discrete type:
```javascript
{
  amountMinor: 125050, // Safe Integer
  currency: "USD"      // ISO 3-letter code
}
```
All internal arithmetic (`addMoney`, `subtractMoney`, etc.) enforces the `Number.isSafeInteger()` boundary.

## Currency Invariant
Money operations must not silently combine incompatible currencies. The calculation primitives enforce currency uniformity. Explicit cross-currency operations (`validateCrossCurrencyTransfer`) must be invoked where multi-currency operations occur.

## Rate Representation
Rates (interest, returns, margins) are abstracted into integer basis points (1/100th of a percent) where applicable:
```javascript
5.25% -> 525 basis points
```
This isolates fractional representations into dedicated rate-scaling functions rather than mixing decimals and integers blindly.

## Rounding Policy
- **Addition & Subtraction:** Exact. No rounding is applied to integer addition/subtraction.
- **Percentages & Conversions:** UNSPECIFIED FINANCIAL POLICY. Division, compounding interest loops, and explicit percentage applications do not currently possess a centralized rounding convention in the pure foundation (the prototype omitted them). They will be defined explicitly during the integration of `useFinancialKPIs`/`projectFinancials`.

## Safe Integer Boundary
The domain primitives enforce `Number.isSafeInteger()`. The maximum safe integer in JavaScript is `9,007,199,254,740,991`.
For USD (2 fraction digits), this accommodates `$90,071,992,547,409.91` (90 trillion dollars).
This boundary is more than sufficient for the foreseeable scope of Money Mind V2 personal finance use-cases; BigInt integration is intentionally excluded to minimize complexity.

## Domain / Application Boundary
The financial domain is isolated in `src/financial/domain/` as pure, framework-independent JavaScript. It has zero dependency on React hooks, Firebase, Next.js, or DOM structures. Validations reject invalid shapes early, allowing the rest of the engine to assume safe structural invariants.

## Projection Authority

**Production authority: MINOR-UNIT.** Legacy floating-point `projectFinancials.js` is a
comparison reference (parity suite) and an explicit, flagged fallback only.

| Module | Role |
| --- | --- |
| `src/financial/projection/projectionAuthority.js` | `runFinancialProjection(snapshot, levers, { currencyCode })` — the single production entry point. Runs the minor-unit engine; result carries `authority` (`"minor-unit"` / `"legacy-fallback"`) and `fallbackReason`. |
| `src/financial/projection/projectFinancialsMinor.js` | Minor-unit engine. Requires `context.currencyCode`; returns the legacy major-unit output contract plus `currencyCode`. |
| `src/financial/projection/projectionMoneyAdapter.js` | Float major ↔ `Money` boundary, per-currency precision. No default currency. |
| `src/financial/projection/projectionSnapshot.js` | `buildProjectionSnapshot(kpis, savingsPlans)` — KPI model → projection snapshot (verbatim move from `App.jsx`). |
| `src/hooks/useFinancialProjection.js` | KPI → projection hook consumed by `App.jsx`'s spatial model. |
| `src/financial/projection/projectFinancials.js` | LEGACY REFERENCE. No production callers except the flagged fallback. |

### Currency Boundary
- **Where currency lives:** the projection operates on KPI totals that the app already
  presents in the user's **reporting currency**, `settings.currency` (`useSettings`,
  `DEFAULT_SETTINGS.currency = "SRD"`, the app's documented base currency). That existing
  field is reused; no new currency architecture was introduced.
- **Path:** `settings.currency` → `App.jsx` (`reportingCurrency`) →
  `useFinancialProjection({ currencyCode })` → `runFinancialProjection(…, { currencyCode })`
  → `minorUnitProjectFinancials` → `toMinor(value, currencyCode)` → figures tagged with
  `currencyCode` → formatted with the same code in the spatial model.
- **No implicit currency:** the previous `ASSUMED_CURRENCY = "USD"` is removed. A missing
  or unresolvable code throws `DomainValidationError` in the engine; the authority turns
  that into a *flagged* `legacy-fallback` rather than guessing a currency.
- **No conversion:** amounts are never converted. The same numbers projected as SRD and
  as USD produce the same figures, each labelled with its own code.
- **Precision per currency:** minor units follow ISO/Intl precision
  (`currencyFractionDigits`): SRD/USD/EUR 2, JPY 0, BHD 3. The 663eddb adapter hardcoded
  2 digits (`toFixed(2)`, `/100`); both are now derived from the currency.

### Conversion Boundary
Floating-point major amounts are serialized with `toFixed(<currency digits>)` to strip
float artifacts (e.g. `0.30000000000000004` → `"0.30"`) and parsed into strict `Money`.
Each input is rounded **once** at the boundary; everything after is integer arithmetic,
except compounding (below). A tiny negative residue (`"-0.00"`) is normalized to `0`.
Non-finite inputs map to `0`, matching the legacy `num()` behavior.

### Rate Conversion
Decimal percentages (e.g., `5.25`) are converted into `BasisPoints` (e.g., `525`) exactly once at the adapter boundary.

### Rounding Policy
- **Addition & Subtraction:** Exact integer arithmetic.
- **Multiplication by months:** Exact integer arithmetic (`amountMinor * m`).
- **Compounding Interest:** `Math.round(amountMinor * (1 + bps/120000) ** months)` — one
  rounding to the nearest minor unit at the end of the horizon, so no per-month rounding
  drift. The intermediate is a float; the rounded result is the authority.

### Safe-Integer Limit and Fallback
Amounts outside `Number.MAX_SAFE_INTEGER` minor units (≈ 90 trillion for 2-digit
currencies) cannot be represented. The UI levers (≤ 120 months, ≤ 12 %/yr) keep realistic
balances far inside this; for inputs beyond it the authority returns the legacy float
result with `authority: "legacy-fallback"` and a `fallbackReason`, never silently.

### Parity Status (re-run with the authority switch)
`tests/financial/projectFinancials.parity.test.mjs` classifies every figure as EXACT,
PRECISION_IMPROVEMENT (|Δ| ≤ ½ minor unit), CURRENCY_CONTEXT, or REGRESSION — no wider
tolerance.
- Baseline scenarios (663eddb), run in SRD, USD and EUR: **78 EXACT + 2
  PRECISION_IMPROVEMENT** each (the 120m / 600m compound `investments` figures), asserted.
- Extended scenarios (negative saving, float noise, negative net worth, large balances, UI
  defaults): 45 EXACT + 5 PRECISION_IMPROVEMENT per currency, 0 regressions.
- JPY / BHD with currency-representable inputs: 0 regressions.
- **Latent defect fixed:** the 663eddb shadow engine did not clamp a negative
  `monthlySaving` to 0 as the legacy engine does (savings 6400 vs 10000 in the new
  scenario). The minor engine now matches legacy semantics. The original 8 scenarios
  never exercised it.

### Known Precision Differences
- Long compound horizons: legacy `9313193.843911406` → minor `9313193.84` (sub-cent).
- Float-noise sums: legacy `12500.400000000001` → minor `12500.4`.
- For 0-digit currencies, a non-representable input (e.g. ¥200.8/month) is rounded once
  (¥201) and then multiplied by months; this is the intended input-rounding policy.

## KPI / Hook Integration

- `useFinancialProjection` consumes `useFinancialKPIs` output through
  `buildProjectionSnapshot` and the minor-unit authority. It returns
  `{ active, currencyCode, snapshot, figures, netWorth, authority, fallbackReason }`.
- When the simulation is inactive (default; `v2Simulation` flag off), `figures` is the
  actual KPI snapshot and `netWorth` is `financialKPIs.netWorth` — V1 figures are passed
  through, never re-derived.
- `App.jsx`'s `spatialFinancialModel` now reads the hook instead of building the snapshot
  and calling the legacy engine inline.
- Validated by `tests/financial/financialProjectionHook.test.mjs` (real hooks rendered via
  `react-dom/server`): against the previous production path, 99 EXACT +
  21 PRECISION_IMPROVEMENT, 0 regressions across SRD/USD/EUR.

## Remaining Migration Work
- `useFinancialKPIs` (V1 actual totals, consumed by Dashboard, KPIDashboard,
  useMoneyAIContext, and as the projection input) is **not** migrated to minor units. It
  sums record amounts without per-record currency handling (records carry `item.currency`,
  default `"SRD"`). Migrating it requires a decision on mixed-currency records (reject vs
  convert via `useCurrency` rates), which is out of scope and would change V1 semantics.
- `useFinancialBreakdown` (drill-down line items) and the domain hooks (`useAssets`,
  `useDebt`, `useSavings`, `useInvestments`) do not consume the projection and were not
  migrated.
- The legacy engine can be removed once the fallback is no longer needed (e.g. once KPI
  inputs are themselves `Money`).
