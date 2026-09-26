import assert from "node:assert/strict";
import { projectFinancials } from "../../src/financial/projection/projectFinancials.js";
import { minorUnitProjectFinancials } from "../../src/financial/projection/projectFinancialsMinor.js";
import { currencyFractionDigits } from "../../src/financial/domain/currency.js";

// Parity: legacy (float reference) vs minor-unit (production authority).
//
// Every compared figure is classified as exactly one of:
//   EXACT                  identical number
//   PRECISION_IMPROVEMENT  minor-unit value is the legacy value rounded to the currency's
//                          minor unit (|diff| <= half a minor unit)
//   CURRENCY_CONTEXT       result is not denominated in the requested currency
//   REGRESSION             anything else
// No tolerance beyond half a minor unit is accepted.

const base = { income: 5000, expenses: 3000, assets: 100000, liabilities: 50000, debt: 20000, monthlyDebtPayment: 500, savings: 10000, monthlySaving: 200, investments: 50000 };

// Baseline scenarios from commit 663eddb: 78 exact + 2 sub-cent precision improvements.
const baselineScenarios = [
  { name: "Zero-value baseline", snapshot: {}, levers: {} },
  { name: "Standard zero growth (no levers)", snapshot: base, levers: { monthsForward: 0 } },
  { name: "Positive growth (savings/debt only)", snapshot: base, levers: { monthsForward: 12, extraDebtPayment: 500, extraMonthlySaving: 100 } },
  { name: "Debt reduction to zero", snapshot: base, levers: { monthsForward: 60, extraDebtPayment: 1000 } },
  { name: "Capital injection positive", snapshot: base, levers: { monthsForward: 0, oneOff: 2500.50 } },
  { name: "Capital injection negative", snapshot: base, levers: { monthsForward: 0, oneOff: -2500.50 } },
  { name: "Long projection horizon (Compound Interest 120m)", snapshot: base, levers: { monthsForward: 120, annualReturnPct: 7.25 } },
  { name: "Long projection horizon (Compound Interest 600m)", snapshot: base, levers: { monthsForward: 600, annualReturnPct: 10.5 } },
];
const BASELINE_EXPECTED = { EXACT: 78, PRECISION_IMPROVEMENT: 2, CURRENCY_CONTEXT: 0, REGRESSION: 0 };
const BASELINE_PRECISION_KEYS = [
  "Long projection horizon (Compound Interest 120m) - investments",
  "Long projection horizon (Compound Interest 600m) - investments",
];

// Additional scenarios (added with the authority switch).
const extendedScenarios = [
  { name: "Negative scheduled saving is clamped (legacy semantics)", snapshot: { ...base, monthlySaving: -300 }, levers: { monthsForward: 12 } },
  { name: "Float noise inputs", snapshot: { ...base, income: 0.1 + 0.2, expenses: 1234.5600000001 }, levers: { monthsForward: 3, extraMonthlySaving: 0.1 + 0.7 } },
  { name: "Negative net worth", snapshot: { ...base, liabilities: 250000.75 }, levers: { monthsForward: 24, annualReturnPct: 6 } },
  { name: "Large realistic balances", snapshot: { ...base, assets: 25_000_000_000.55, investments: 1_500_000_000.10 }, levers: { monthsForward: 120, annualReturnPct: 12 } },
  { name: "UI default levers (6%/yr, 36m)", snapshot: base, levers: { monthsForward: 36, annualReturnPct: 6, extraDebtPayment: 250, extraMonthlySaving: 150, oneOff: 1000 } },
];

function classify(legacyValue, minorValue, currencyCode) {
  const halfUnit = 0.5 * 10 ** -currencyFractionDigits(currencyCode);
  const diff = Math.abs(legacyValue - minorValue);
  if (diff === 0) return { kind: "EXACT", diff };
  if (diff <= halfUnit + Number.EPSILON * Math.max(1, Math.abs(legacyValue))) return { kind: "PRECISION_IMPROVEMENT", diff };
  return { kind: "REGRESSION", diff };
}

function runSuite(scenarios, currencyCode) {
  const counts = { EXACT: 0, PRECISION_IMPROVEMENT: 0, CURRENCY_CONTEXT: 0, REGRESSION: 0 };
  const precisionKeys = [];
  for (const scenario of scenarios) {
    const legacy = projectFinancials(scenario.snapshot, scenario.levers);
    const minor = minorUnitProjectFinancials(scenario.snapshot, scenario.levers, { currencyCode });
    if (minor.currencyCode !== currencyCode) {
      counts.CURRENCY_CONTEXT++;
      console.log(`[CURRENCY_CONTEXT] ${currencyCode} ${scenario.name}: got ${minor.currencyCode}`);
    }
    for (const key of Object.keys(legacy)) {
      const { kind, diff } = classify(legacy[key], minor[key], currencyCode);
      counts[kind]++;
      if (kind === "PRECISION_IMPROVEMENT") precisionKeys.push(`${scenario.name} - ${key}`);
      if (kind !== "EXACT") console.log(`  [${kind}] ${currencyCode} ${scenario.name} - ${key}: legacy ${legacy[key]} | minor ${minor[key]} | diff ${diff}`);
    }
  }
  return { counts, precisionKeys };
}

console.log("=== PARITY VALIDATION ===");

// 1. Baseline scenarios, in each currency Money Mind supports (2-digit currencies).
for (const currencyCode of ["SRD", "USD", "EUR"]) {
  const { counts, precisionKeys } = runSuite(baselineScenarios, currencyCode);
  console.log(`Baseline ${currencyCode}:`, counts);
  assert.deepEqual(counts, BASELINE_EXPECTED, `baseline parity counts (${currencyCode})`);
  assert.deepEqual(precisionKeys, BASELINE_PRECISION_KEYS, `baseline precision-improvement set (${currencyCode})`);
}

// 2. Extended scenarios: no regressions / currency issues allowed.
for (const currencyCode of ["SRD", "USD", "EUR"]) {
  const { counts } = runSuite(extendedScenarios, currencyCode);
  console.log(`Extended ${currencyCode}:`, counts);
  assert.equal(counts.REGRESSION, 0, `extended regressions (${currencyCode})`);
  assert.equal(counts.CURRENCY_CONTEXT, 0, `extended currency issues (${currencyCode})`);
}

// 3. Non-2-digit currencies, with inputs representable in that currency (a ¥0.8 amount
//    does not exist). Differences are bounded by half of that currency's minor unit.
function representable(scenario, digits) {
  const round = (group) => Object.fromEntries(Object.entries(group).map(([key, value]) =>
    [key, key === "monthsForward" || key === "annualReturnPct" ? value : Number(Number(value).toFixed(digits))]));
  return { ...scenario, snapshot: round(scenario.snapshot), levers: round(scenario.levers) };
}
for (const currencyCode of ["JPY", "BHD"]) {
  const digits = currencyFractionDigits(currencyCode);
  const { counts } = runSuite([...baselineScenarios, ...extendedScenarios].map((s) => representable(s, digits)), currencyCode);
  console.log(`Precision-varied ${currencyCode}:`, counts);
  assert.equal(counts.REGRESSION, 0, `regressions (${currencyCode})`);
  assert.equal(counts.CURRENCY_CONTEXT, 0, `currency issues (${currencyCode})`);
}

// 4. Explicit input-rounding policy: each input is rounded ONCE to the currency's minor
//    unit at the boundary, then used exactly. A non-representable JPY monthly saving of
//    ¥200.8 therefore becomes ¥201/month (3 months -> +¥603), not ¥602.4 rounded.
const jpy = minorUnitProjectFinancials({ savings: 10000, monthlySaving: 200.8 }, { monthsForward: 3 }, { currencyCode: "JPY" });
assert.equal(jpy.monthlySaving, 201);
assert.equal(jpy.savings, 10603);

console.log("\nParity validated: baseline 78 exact + 2 sub-minor-unit precision improvements per currency; 0 regressions; 0 currency-context issues.");
