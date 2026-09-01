// Layer 6 (V2 simulation): a pure "what-if" projection over a financial snapshot.
//
// This is a NEW calculation, deliberately separate from the V1 financial math
// (useFinancialKPIs and the page-level calculators) — the actual-data path is
// never routed through here, so V1 numbers are unaffected (CLAUDE.md rule 6).
// It lives under src/financial/ per ADR-0002 (financial domain logic, renderer-
// and Firebase-independent).

const MAX_MONTHS = 600

function num(value) {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

/**
 * @typedef {object} FinancialSnapshot
 * @property {number} income              Monthly-ish income run-rate (kept flat).
 * @property {number} expenses            Expense run-rate (kept flat).
 * @property {number} assets              Asset stock.
 * @property {number} liabilities         Non-debt-manager liabilities (kept flat).
 * @property {number} debt                Debt-manager balance.
 * @property {number} monthlyDebtPayment  Current scheduled monthly debt payment.
 * @property {number} savings             Savings-plan balance.
 * @property {number} monthlySaving       Current scheduled monthly savings contribution.
 * @property {number} investments         Investment market value.
 *
 * @typedef {object} SimulationLevers
 * @property {number} monthsForward
 * @property {number} extraDebtPayment    Additional principal per month.
 * @property {number} extraMonthlySaving  Additional savings per month.
 * @property {number} annualReturnPct     Assumed annual investment return, %.
 * @property {number} oneOff              Signed one-time amount (+ to assets, - from savings).
 */

/**
 * Project a snapshot forward. At monthsForward = 0 with all levers 0 the output
 * equals the input (no jump when the simulation is toggled on).
 *
 * @param {FinancialSnapshot} snapshot
 * @param {SimulationLevers} levers
 * @returns {FinancialSnapshot & { netWorth: number }}
 */
export function projectFinancials(snapshot = {}, levers = {}) {
  const income = num(snapshot.income)
  const expenses = num(snapshot.expenses)
  const liabilities = num(snapshot.liabilities)

  const m = clamp(Math.round(num(levers.monthsForward)), 0, MAX_MONTHS)
  const oneOff = num(levers.oneOff)

  const debtPerMonth = num(snapshot.monthlyDebtPayment) + Math.max(0, num(levers.extraDebtPayment))
  const debt = Math.max(0, num(snapshot.debt) - debtPerMonth * m)

  const savePerMonth = Math.max(0, num(snapshot.monthlySaving)) + Math.max(0, num(levers.extraMonthlySaving))
  const savings = Math.max(0, num(snapshot.savings) + savePerMonth * m + Math.min(0, oneOff))

  const monthlyRate = clamp(num(levers.annualReturnPct), 0, 100) / 100 / 12
  const investments = num(snapshot.investments) * (1 + monthlyRate) ** m

  const assets = num(snapshot.assets) + Math.max(0, oneOff)

  // Same net-worth definition as useFinancialKPIs (assets - liabilities), applied
  // to projected assets. Debt / savings / investment levers reshape those domain
  // nodes; in v1 they do not feed the net-worth core.
  const netWorth = assets - liabilities

  return { income, expenses, assets, liabilities, debt, monthlyDebtPayment: debtPerMonth, savings, monthlySaving: savePerMonth, investments, netWorth }
}
