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
