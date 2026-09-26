import { addMoney, subtractMoney, createMoney } from "../domain/money.js";
import { toMinor, toMajor, toBasisPoints } from "./projectionMoneyAdapter.js";

const MAX_MONTHS = 600;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

/**
 * Calculates compound interest on a minor-unit money amount over M months.
 * UNSPECIFIED FINANCIAL POLICY -> EXPLICIT POLICY:
 * Rounding occurs at the very end of the compound period, not monthly.
 * This matches the continuous floating-point curve of the legacy engine as closely as possible,
 * preventing rounding artifacts from accumulating over 600 months.
 * Negative values behave identically (Math.round handles negative halfway cases differently in JS, but here balances are non-negative).
 * 
 * @param {import("../domain/money.js").Money} initialMoney 
 * @param {number} annualBps 
 * @param {number} months 
 * @returns {import("../domain/money.js").Money}
 */
function applyCompoundInterest(initialMoney, annualBps, months) {
  if (months === 0 || annualBps === 0) return initialMoney;
  // annualBps = 525 means 5.25%.
  // monthlyRate decimal = (5.25 / 100) / 12 = 525 / 10000 / 12 = 525 / 120000
  const monthlyRate = annualBps / 120000;
  
  // Apply compound interest to the minor amount.
  const compoundedMinor = initialMoney.amountMinor * Math.pow(1 + monthlyRate, months);
  
  return createMoney(Math.round(compoundedMinor), initialMoney.currency);
}

/**
 * Executes the projection utilizing the strict minor-unit domain.
 * Takes the same floating-point major-unit inputs as projectFinancials and outputs the same major-unit contract.
 */
export function minorUnitProjectFinancials(snapshot = {}, levers = {}) {
  // 1. Convert everything to explicit boundaries
  const income = toMinor(snapshot.income);
  const expenses = toMinor(snapshot.expenses);
  const liabilities = toMinor(snapshot.liabilities);
  
  const m = clamp(Math.round(Number(levers.monthsForward) || 0), 0, MAX_MONTHS);
  const oneOff = toMinor(levers.oneOff);
  const isOneOffPositive = oneOff.amountMinor > 0;
  
  const snapshotDebt = toMinor(snapshot.debt);
  const snapshotDebtPayment = toMinor(snapshot.monthlyDebtPayment);
  const extraDebtPayment = toMinor(Math.max(0, Number(levers.extraDebtPayment) || 0));
  
  const snapshotSavings = toMinor(snapshot.savings);
  const snapshotSavingPayment = toMinor(snapshot.monthlySaving);
  const extraMonthlySaving = toMinor(Math.max(0, Number(levers.extraMonthlySaving) || 0));
  
  const snapshotInvestments = toMinor(snapshot.investments);
  const annualReturnBps = toBasisPoints(clamp(Number(levers.annualReturnPct) || 0, 0, 100));
  
  const snapshotAssets = toMinor(snapshot.assets);

  // 2. Perform integer calculations
  
  // Debt
  const debtPerMonth = addMoney(snapshotDebtPayment, extraDebtPayment);
  // debtBurn = debtPerMonth * m
  const debtBurn = createMoney(debtPerMonth.amountMinor * m, debtPerMonth.currency);
  const debtMinorAmount = Math.max(0, snapshotDebt.amountMinor - debtBurn.amountMinor);
  const debt = createMoney(debtMinorAmount, snapshotDebt.currency);
  
  // Savings
  const savePerMonth = addMoney(snapshotSavingPayment, extraMonthlySaving);
  const totalSaved = createMoney(savePerMonth.amountMinor * m, savePerMonth.currency);
  
  let savingsAmountMinor = snapshotSavings.amountMinor + totalSaved.amountMinor;
  if (!isOneOffPositive) {
    // oneOff is negative or zero, adds to savings (since oneOff is already negative, we just add it)
    savingsAmountMinor += oneOff.amountMinor; 
  }
  const savings = createMoney(Math.max(0, savingsAmountMinor), snapshotSavings.currency);
  
  // Investments
  const investments = applyCompoundInterest(snapshotInvestments, annualReturnBps, m);
  
  // Assets
  let assetsAmountMinor = snapshotAssets.amountMinor;
  if (isOneOffPositive) {
    assetsAmountMinor += oneOff.amountMinor;
  }
  const assets = createMoney(assetsAmountMinor, snapshotAssets.currency);
  
  // Net Worth = Assets - Liabilities
  const netWorth = subtractMoney(assets, liabilities);
  
  // 3. Map back to major-unit output contract
  return {
    income: toMajor(income),
    expenses: toMajor(expenses),
    assets: toMajor(assets),
    liabilities: toMajor(liabilities),
    debt: toMajor(debt),
    monthlyDebtPayment: toMajor(debtPerMonth),
    savings: toMajor(savings),
    monthlySaving: toMajor(savePerMonth),
    investments: toMajor(investments),
    netWorth: toMajor(netWorth)
  };
}
