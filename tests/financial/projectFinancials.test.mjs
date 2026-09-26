import assert from "node:assert/strict";
import { projectFinancials } from "../../src/financial/projection/projectFinancials.js";

// CURRENT REGRESSION TESTS
// Protects the current V2 layer 6 simulation projection logic against floating-point regressions
// and logical breakage before any future strict-money migration.

const baseSnapshot = {
  income: 5000,
  expenses: 3000,
  assets: 100000,
  liabilities: 50000,
  debt: 20000,
  monthlyDebtPayment: 500,
  savings: 10000,
  monthlySaving: 200,
  investments: 50000
};

// 1. Zero months forward should return the original state
const zeroProjection = projectFinancials(baseSnapshot, { monthsForward: 0 });
assert.equal(zeroProjection.netWorth, 50000); // 100000 - 50000
assert.equal(zeroProjection.debt, 20000);
assert.equal(zeroProjection.savings, 10000);
assert.equal(zeroProjection.investments, 50000);

// 2. Project forward without levers
const forwardProjection = projectFinancials(baseSnapshot, { monthsForward: 12 });
assert.equal(forwardProjection.debt, 14000); // 20000 - (500 * 12)
assert.equal(forwardProjection.savings, 12400); // 10000 + (200 * 12)
assert.equal(forwardProjection.investments, 50000); // No return pct

// 3. Project with extra debt payment
const extraDebtProjection = projectFinancials(baseSnapshot, { monthsForward: 10, extraDebtPayment: 1000 });
// Monthly payment becomes 1500. After 10 months = 15000 paid. Debt = 5000.
assert.equal(extraDebtProjection.debt, 5000);

// 4. Debt cannot go below zero
const overpaidDebtProjection = projectFinancials(baseSnapshot, { monthsForward: 50, extraDebtPayment: 1000 });
assert.equal(overpaidDebtProjection.debt, 0);

// 5. Investment returns (floating point precision)
const investProjection = projectFinancials(baseSnapshot, { monthsForward: 12, annualReturnPct: 5 });
// monthlyRate = 5 / 100 / 12
const expectedInvestment = 50000 * Math.pow(1 + (5 / 100 / 12), 12);
assert.equal(investProjection.investments, expectedInvestment);

// 6. One-off injection
const oneOffProjection = projectFinancials(baseSnapshot, { monthsForward: 0, oneOff: 5000 });
assert.equal(oneOffProjection.assets, 105000);
assert.equal(oneOffProjection.netWorth, 55000);

// 7. Negative one-off (expense)
const negOneOffProjection = projectFinancials(baseSnapshot, { monthsForward: 0, oneOff: -2000 });
assert.equal(negOneOffProjection.assets, 100000); // Only positive oneOff adds to assets
assert.equal(negOneOffProjection.savings, 8000); // Negative oneOff reduces savings

// 8. Missing values handled safely
const safeProjection = projectFinancials({}, {});
assert.equal(safeProjection.netWorth, 0);
assert.equal(safeProjection.debt, 0);

console.log("Current Financial Projection tests passed.");
