# V2 Financial Domain Foundation

**STATUS:** 
- Minor-unit domain foundation: IMPLEMENTED
- Production financial integration: NOT STARTED

> [!WARNING]
> NEW DOMAIN FOUNDATION IS NOT YET THE PRODUCTION CALCULATION ENGINE. 
> The application currently routes all calculations through `useFinancialKPIs` and `projectFinancials` using floating-point math.

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

## Projection Migration Status

> [!WARNING]
> MINOR-UNIT PROJECTION IS NOT YET AUTHORITATIVE.

The legacy `projectFinancials.js` continues to execute all production projections using floating point numbers.
We have introduced a parity framework:
- **Legacy Calculation Path:** `projectFinancials.js` (Authoritative)
- **Minor-Unit Shadow Path:** `projectFinancialsMinor.js` (Shadow / Validation Only)

### Conversion Boundary
The `projectionMoneyAdapter.js` serves as the explicit boundary between floating-point major units (expected by the current UI contract) and the new strict domain minor units.
Floating point amounts are serialized to 2-decimal strings to strip floating-point artifacts (e.g. `0.30000000000004` -> `"0.30"`) before parsing into strict `Money` objects. Currently, `USD` is assumed for all minor unit calculations until multi-currency support is properly passed through from the UI.

### Rate Conversion
Decimal percentages (e.g., `5.25`) are converted into `BasisPoints` (e.g., `525`) exactly once at the adapter boundary.

### Rounding Policy
- **Addition & Subtraction:** Exact. No rounding is applied to integer addition/subtraction.
- **Compounding Interest:** Explicitly applies a continuous rate and rounds to the nearest minor unit *only at the very end* of the month iteration (e.g., `Math.round(minorAmount * Math.pow(1 + rate, months))`) to match the legacy continuous curve without accumulating intermediate compounding artifacts.

### Parity Methodology
The parity test (`tests/financial/projectFinancials.parity.test.mjs`) injects identical floating point states and levers into both engines and compares the results.

### Known Differences
- **Precision:** The legacy engine routinely outputs deep fractional artifacts (e.g., `9313193.843911406`) on long compound horizons. The minor-unit engine correctly truncates this to `9313193.84`. This sub-penny variance is classified as an `EXPECTED_PRECISION_IMPROVEMENT`. 
