import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import useFinancialKPIs from "../../src/hooks/useFinancialKPIs.js";
import useFinancialProjection from "../../src/hooks/useFinancialProjection.js";
import { buildProjectionSnapshot } from "../../src/financial/projection/projectionSnapshot.js";
import { projectFinancials as legacyProjectFinancials } from "../../src/financial/projection/projectFinancials.js";
import { currencyFractionDigits } from "../../src/financial/domain/currency.js";

// Layer 2: KPI -> minor-unit projection -> hook integration.
// Renders the real hooks (useFinancialKPIs -> useFinancialProjection) with react-dom/server
// and compares against the previous production path (legacy engine over the same snapshot
// App.jsx used to build inline).

function renderHooks(data, projectionArgs) {
  let captured;
  function Probe() {
    const financialKPIs = useFinancialKPIs(data);
    const projection = useFinancialProjection({ financialKPIs, savingsPlans: data.savingsPlans, ...projectionArgs });
    captured = { financialKPIs, projection };
    return null;
  }
  renderToString(createElement(Probe));
  return captured;
}

// Fixture: an SRD user (the app's base currency), with sub-cent-free and float-noisy data.
const data = {
  transactions: [
    { type: "income", amount: 12500.10, date: "2026-08-01", currency: "SRD" },
    { type: "income", amount: 0.1, date: "2026-08-02", currency: "SRD" },
    { type: "income", amount: 0.2, date: "2026-08-03", currency: "SRD" },
    { type: "expense", amount: 4210.35, date: "2026-08-05", currency: "SRD" },
    { type: "expense", amount: 999.99, date: "2026-08-09", currency: "SRD" },
  ],
  budgets: [{ amount: 6000 }],
  assets: [{ value: 185000.5 }, { value: 42000.25 }],
  liabilities: [{ value: 91000.4 }],
  goals: [{ saved: 500, target: 1000 }],
  debts: [{ balance: 30000, payment: 750.5 }, { balance: 4500.75, payment: 125 }],
  savingsPlans: [{ current: 8000, target: 20000, monthly: 400.25 }, { current: 1500.5, target: 5000, monthly: "150" }],
  bills: [{ amount: 300 }],
  investments: [{ type: "ETF", cost: 40000, value: 51234.56 }, { type: "Stock", cost: 10000, value: 9870.12 }],
  emergencySavings: 9000,
  monthlyExpenses: 3000,
  monthlyIncome: 12500,
};

const FIGURES = ["income", "expenses", "assets", "liabilities", "debt", "monthlyDebtPayment", "savings", "monthlySaving", "investments", "netWorth"];

function classify(previous, current, currencyCode) {
  const halfUnit = 0.5 * 10 ** -currencyFractionDigits(currencyCode);
  const diff = Math.abs(previous - current);
  if (diff === 0) return "EXACT";
  if (diff <= halfUnit + Number.EPSILON * Math.max(1, Math.abs(previous))) return "PRECISION_IMPROVEMENT";
  return "REGRESSION";
}

// 1. Inactive (flag off / simulation off): actual KPI figures pass through untouched.
{
  const { financialKPIs, projection } = renderHooks(data, { levers: {}, active: false, currencyCode: "SRD" });
  assert.equal(projection.active, false);
  assert.equal(projection.authority, "actual");
  assert.equal(projection.currencyCode, "SRD");
  assert.deepEqual(projection.figures, buildProjectionSnapshot(financialKPIs, data.savingsPlans));
  assert.equal(projection.netWorth, financialKPIs.netWorth, "V1 net worth unchanged");
  assert.equal(projection.figures.assets, financialKPIs.totalAssets);
  assert.equal(projection.figures.income, financialKPIs.totalIncome, "actual path keeps V1 float totals (no re-derivation)");
}

// 2. Snapshot builder is a verbatim move of App.jsx's inline snapshot (incl. malformed monthly).
{
  const { financialKPIs } = renderHooks(data, { levers: {}, active: false, currencyCode: "SRD" });
  const inline = {
    income: financialKPIs.totalIncome, expenses: financialKPIs.totalExpenses, assets: financialKPIs.totalAssets,
    liabilities: financialKPIs.totalLiabilities, debt: financialKPIs.totalDebt, monthlyDebtPayment: financialKPIs.monthlyDebtPayments,
    savings: financialKPIs.totalSavingsCurrent, monthlySaving: data.savingsPlans.reduce((t, p) => t + Number(p.monthly || 0), 0),
    investments: financialKPIs.investmentValue,
  };
  assert.deepEqual(buildProjectionSnapshot(financialKPIs, data.savingsPlans), inline);
  const malformed = [{ monthly: 100 }, { monthly: "abc" }];
  assert.ok(Number.isNaN(buildProjectionSnapshot(financialKPIs, malformed).monthlySaving), "NaN semantics preserved from App.jsx");
}

// 3. Active: hook output == minor-unit authority; vs previous (legacy) production output only
//    EXACT or sub-minor-unit PRECISION_IMPROVEMENT, per currency; currency is propagated.
const leverSets = [
  { monthsForward: 0, annualReturnPct: 6 },
  { monthsForward: 12, annualReturnPct: 6, extraDebtPayment: 250, extraMonthlySaving: 100 },
  { monthsForward: 36, annualReturnPct: 7.5, oneOff: 2500.5 },
  { monthsForward: 120, annualReturnPct: 12, oneOff: -1200.25, extraMonthlySaving: 0.1 + 0.2 },
];
const totals = { EXACT: 0, PRECISION_IMPROVEMENT: 0, REGRESSION: 0 };
for (const currencyCode of ["SRD", "USD", "EUR"]) {
  for (const levers of leverSets) {
    const { financialKPIs, projection } = renderHooks(data, { levers, active: true, currencyCode });
    assert.equal(projection.active, true);
    assert.equal(projection.authority, "minor-unit", "hook uses the minor-unit authority");
    assert.equal(projection.fallbackReason, null);
    assert.equal(projection.currencyCode, currencyCode, "currency propagated");
    assert.equal(projection.figures.currencyCode, currencyCode, "figures denominated in the reporting currency");
    assert.equal(projection.netWorth, projection.figures.netWorth);

    const previous = legacyProjectFinancials(buildProjectionSnapshot(financialKPIs, data.savingsPlans), levers);
    for (const key of FIGURES) {
      const kind = classify(previous[key], projection.figures[key], currencyCode);
      totals[kind]++;
      if (kind !== "EXACT") console.log(`  [${kind}] ${currencyCode} m=${levers.monthsForward} ${key}: previous ${previous[key]} | now ${projection.figures[key]}`);
    }
  }
}
console.log("KPI/hook parity vs previous authority:", totals);
assert.equal(totals.REGRESSION, 0, "no unexplained KPI differences");

// 4. Same amounts in different currencies are NOT converted (no silent SRD->USD).
{
  const srd = renderHooks(data, { levers: leverSets[1], active: true, currencyCode: "SRD" }).projection.figures;
  const usd = renderHooks(data, { levers: leverSets[1], active: true, currencyCode: "USD" }).projection.figures;
  for (const key of FIGURES) assert.equal(srd[key], usd[key], `${key} not converted between currencies`);
}

// 5. Missing reporting currency: explicit flagged fallback, never an implicit USD.
{
  const { projection } = renderHooks(data, { levers: leverSets[1], active: true, currencyCode: undefined });
  assert.equal(projection.authority, "legacy-fallback");
  assert.notEqual(projection.currencyCode, "USD");
  assert.match(projection.fallbackReason, /explicit currencyCode/);
}

console.log("Financial KPI / hook integration tests passed.");
