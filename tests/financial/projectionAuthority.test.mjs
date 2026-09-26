import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { minorUnitProjectFinancials } from "../../src/financial/projection/projectFinancialsMinor.js";
import { requireCurrencyCode, toMinor, toMajor } from "../../src/financial/projection/projectionMoneyAdapter.js";
import { runFinancialProjection, PROJECTION_AUTHORITY, LEGACY_FALLBACK } from "../../src/financial/projection/projectionAuthority.js";
import { projectFinancials as legacyProjectFinancials } from "../../src/financial/projection/projectFinancials.js";
import { DomainValidationError } from "../../src/financial/domain/errors.js";

// Currency boundary + production authority tests for the V2 projection.

const base = { income: 5000, expenses: 3000, assets: 100000, liabilities: 50000, debt: 20000, monthlyDebtPayment: 500, savings: 10000, monthlySaving: 200, investments: 50000 };

// 1. Currency is explicit: no currency -> rejected (no implicit USD).
for (const missing of [undefined, null, "", "   "]) {
  assert.throws(() => requireCurrencyCode(missing), DomainValidationError, `missing currency ${String(missing)}`);
  assert.throws(() => minorUnitProjectFinancials(base, {}, { currencyCode: missing }), DomainValidationError);
}
assert.throws(() => minorUnitProjectFinancials(base, {}), DomainValidationError, "no context");
assert.throws(() => toMinor(10, undefined), DomainValidationError);
assert.throws(() => requireCurrencyCode("ZZZ"), DomainValidationError, "unknown ISO code");
assert.equal(requireCurrencyCode(" srd "), "SRD");

// 2. Results are denominated in the requested currency, never silently USD, never converted.
for (const code of ["SRD", "USD", "EUR"]) {
  const result = minorUnitProjectFinancials(base, { monthsForward: 12 }, { currencyCode: code });
  assert.equal(result.currencyCode, code);
  assert.equal(result.netWorth, 50000, `${code}: amounts are not converted`);
  assert.equal(result.savings, 12400);
}

// 3. Minor-unit precision follows the currency (SRD 2, JPY 0, BHD 3).
assert.deepEqual(toMinor(1234.567, "SRD"), { amountMinor: 123457, currency: "SRD" });
assert.deepEqual(toMinor(1234.567, "JPY"), { amountMinor: 1235, currency: "JPY" });
assert.deepEqual(toMinor(1234.5675, "BHD"), { amountMinor: 1234568, currency: "BHD" });
assert.equal(toMajor({ amountMinor: 123457, currency: "SRD" }), 1234.57);
assert.equal(toMajor({ amountMinor: 1235, currency: "JPY" }), 1235);
assert.equal(toMajor({ amountMinor: 1234568, currency: "BHD" }), 1234.568);

// 4. Zero / negative / fractional / non-finite handling.
assert.equal(toMinor(0, "SRD").amountMinor, 0);
assert.ok(Object.is(toMinor(-0.001, "SRD").amountMinor, 0), "tiny negative noise normalizes to +0");
assert.equal(toMinor(-2500.5, "SRD").amountMinor, -250050);
assert.equal(toMinor(0.1 + 0.2, "EUR").amountMinor, 30);
assert.equal(toMinor(Number.NaN, "SRD").amountMinor, 0);
assert.equal(toMinor(Infinity, "SRD").amountMinor, 0);
assert.equal(toMinor("oops", "SRD").amountMinor, 0);
const negative = minorUnitProjectFinancials({ ...base, liabilities: 250000.75 }, {}, { currencyCode: "SRD" });
assert.equal(negative.netWorth, -150000.75);

// 5. Determinism: identical inputs -> identical outputs (repeated runs).
const levers = { monthsForward: 120, annualReturnPct: 7.25, extraDebtPayment: 125.5, extraMonthlySaving: 50.25, oneOff: -99.99 };
const first = JSON.stringify(minorUnitProjectFinancials(base, levers, { currencyCode: "SRD" }));
for (let i = 0; i < 50; i++) assert.equal(JSON.stringify(minorUnitProjectFinancials(base, levers, { currencyCode: "SRD" })), first);

// 6. Every monetary output is an exact multiple of the currency's minor unit.
const out = JSON.parse(first);
for (const [key, value] of Object.entries(out)) {
  if (key === "currencyCode") continue;
  assert.ok(Number.isInteger(Math.round(value * 100)) && Math.abs(value * 100 - Math.round(value * 100)) < 1e-6, `${key} is whole cents`);
}

// 7. Authority: production entry point runs the minor-unit engine.
assert.equal(PROJECTION_AUTHORITY, "minor-unit");
const authoritative = runFinancialProjection(base, levers, { currencyCode: "SRD" });
assert.equal(authoritative.authority, "minor-unit");
assert.equal(authoritative.fallbackReason, null);
assert.deepEqual({ ...authoritative, authority: undefined, fallbackReason: undefined }, { ...minorUnitProjectFinancials(base, levers, { currencyCode: "SRD" }), authority: undefined, fallbackReason: undefined });

// 8. Fallback is explicit, never silent: amounts beyond the safe-integer range and an
//    unresolvable currency fall back to the legacy reference, flagged.
const huge = runFinancialProjection({ ...base, investments: 1e15 }, { monthsForward: 600, annualReturnPct: 100 }, { currencyCode: "SRD" });
assert.equal(huge.authority, LEGACY_FALLBACK);
assert.match(huge.fallbackReason, /UnsafeMoneyIntegerError|InvalidMoneyInputError/);
assert.equal(huge.investments, legacyProjectFinancials({ ...base, investments: 1e15 }, { monthsForward: 600, annualReturnPct: 100 }).investments);
const noCurrency = runFinancialProjection(base, {}, { currencyCode: "" });
assert.equal(noCurrency.authority, LEGACY_FALLBACK);
assert.equal(noCurrency.currencyCode, "");
assert.match(noCurrency.fallbackReason, /explicit currencyCode/);

// 9. No hardcoded currency in the production projection path.
for (const file of ["projectionMoneyAdapter.js", "projectFinancialsMinor.js", "projectionAuthority.js"]) {
  const source = readFileSync(new URL(`../../src/financial/projection/${file}`, import.meta.url), "utf8")
    .replace(/\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "");
  assert.doesNotMatch(source, /["'](USD|SRD|EUR)["']/, `${file} hardcodes a currency`);
}

console.log("Projection currency-boundary and authority tests passed.");
