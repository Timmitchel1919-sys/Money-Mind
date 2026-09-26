import assert from "node:assert/strict";
import { projectFinancials } from "../../src/financial/projection/projectFinancials.js";
import { minorUnitProjectFinancials } from "../../src/financial/projection/projectFinancialsMinor.js";

const PARITY_TOLERANCE = 0.01; // 1 minor unit ($0.01)

// Scenarios
const scenarios = [
  {
    name: "Zero-value baseline",
    snapshot: {},
    levers: {}
  },
  {
    name: "Standard zero growth (no levers)",
    snapshot: { income: 5000, expenses: 3000, assets: 100000, liabilities: 50000, debt: 20000, monthlyDebtPayment: 500, savings: 10000, monthlySaving: 200, investments: 50000 },
    levers: { monthsForward: 0 }
  },
  {
    name: "Positive growth (savings/debt only)",
    snapshot: { income: 5000, expenses: 3000, assets: 100000, liabilities: 50000, debt: 20000, monthlyDebtPayment: 500, savings: 10000, monthlySaving: 200, investments: 50000 },
    levers: { monthsForward: 12, extraDebtPayment: 500, extraMonthlySaving: 100 }
  },
  {
    name: "Debt reduction to zero",
    snapshot: { income: 5000, expenses: 3000, assets: 100000, liabilities: 50000, debt: 20000, monthlyDebtPayment: 500, savings: 10000, monthlySaving: 200, investments: 50000 },
    levers: { monthsForward: 60, extraDebtPayment: 1000 }
  },
  {
    name: "Capital injection positive",
    snapshot: { income: 5000, expenses: 3000, assets: 100000, liabilities: 50000, debt: 20000, monthlyDebtPayment: 500, savings: 10000, monthlySaving: 200, investments: 50000 },
    levers: { monthsForward: 0, oneOff: 2500.50 }
  },
  {
    name: "Capital injection negative",
    snapshot: { income: 5000, expenses: 3000, assets: 100000, liabilities: 50000, debt: 20000, monthlyDebtPayment: 500, savings: 10000, monthlySaving: 200, investments: 50000 },
    levers: { monthsForward: 0, oneOff: -2500.50 }
  },
  {
    name: "Long projection horizon (Compound Interest 120m)",
    snapshot: { income: 5000, expenses: 3000, assets: 100000, liabilities: 50000, debt: 20000, monthlyDebtPayment: 500, savings: 10000, monthlySaving: 200, investments: 50000 },
    levers: { monthsForward: 120, annualReturnPct: 7.25 }
  },
  {
    name: "Long projection horizon (Compound Interest 600m)",
    snapshot: { income: 5000, expenses: 3000, assets: 100000, liabilities: 50000, debt: 20000, monthlyDebtPayment: 500, savings: 10000, monthlySaving: 200, investments: 50000 },
    levers: { monthsForward: 600, annualReturnPct: 10.5 }
  }
];

let totalToleranceDifferences = 0;
let exactMatches = 0;
let precisionImprovements = 0;

console.log("=== PARITY VALIDATION ===");

for (const scenario of scenarios) {
  const legacy = projectFinancials(scenario.snapshot, scenario.levers);
  const minor = minorUnitProjectFinancials(scenario.snapshot, scenario.levers);
  
  const keys = Object.keys(legacy);
  for (const key of keys) {
    const diff = Math.abs(legacy[key] - minor[key]);
    
    if (diff === 0) {
      exactMatches++;
    } else if (diff <= PARITY_TOLERANCE) {
      precisionImprovements++;
      // It's technically different (sub-penny), but valid within financial rounding
      if (key === "investments" || key === "netWorth") {
        console.log(`[EXPECTED_PRECISION_IMPROVEMENT] ${scenario.name} - ${key}:`);
        console.log(`   Legacy: ${legacy[key]}`);
        console.log(`   Minor : ${minor[key]}`);
        console.log(`   Diff  : ${diff}`);
      }
    } else {
      console.log(`[PARITY DIFFERENCE] ${scenario.name} - ${key}: Legacy ${legacy[key]} vs Minor ${minor[key]} (Diff: ${diff})`);
      totalToleranceDifferences++;
    }
  }
}

console.log("\n=== PARITY SUMMARY ===");
console.log(`Exact Matches: ${exactMatches}`);
console.log(`Precision Improvements (sub-penny floating point artifacts removed): ${precisionImprovements}`);
console.log(`Tolerance Failures (> $0.01): ${totalToleranceDifferences}`);

if (totalToleranceDifferences === 0) {
  console.log("\nParity validated successfully. All differences are sub-penny precision improvements.");
} else {
  console.log(`\nParity test completed with ${totalToleranceDifferences} tolerance differences.`);
  process.exit(1);
}
