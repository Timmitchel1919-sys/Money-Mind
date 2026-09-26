// KPI -> projection boundary: maps the existing useFinancialKPIs model onto the
// projection's FinancialSnapshot. No new KPI definitions — every field is an
// existing KPI total (moved verbatim from App.jsx's Layer 6 wiring).

/**
 * @param {ReturnType<typeof import("../../hooks/useFinancialKPIs.js").default>} kpis
 * @param {Array<{ monthly?: number | string }>} savingsPlans
 * @returns {import("./projectFinancials.js").FinancialSnapshot}
 */
export function buildProjectionSnapshot(kpis, savingsPlans = []) {
  return {
    income: kpis.totalIncome,
    expenses: kpis.totalExpenses,
    assets: kpis.totalAssets,
    liabilities: kpis.totalLiabilities,
    debt: kpis.totalDebt,
    monthlyDebtPayment: kpis.monthlyDebtPayments,
    savings: kpis.totalSavingsCurrent,
    monthlySaving: savingsPlans.reduce((total, plan) => total + Number(plan.monthly || 0), 0),
    investments: kpis.investmentValue,
  }
}
