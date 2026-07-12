import { useMemo } from "react"
import useFinancialKPIs from "./useFinancialKPIs"

// Bundles every data source Money AI is allowed to read into one memoized
// object: transactions, budgets, assets/liabilities, goals, debts,
// savings plans, bills, investments, emergency fund inputs, and derived
// KPI/financial-health figures. This stays entirely in the browser —
// nothing here is sent anywhere unless an external AI provider is
// explicitly enabled (see src/services/aiService.js).
export default function useMoneyAIContext({
  transactions = [],
  budgets = [],
  assets = [],
  liabilities = [],
  goals = [],
  debts = [],
  savingsPlans = [],
  bills = [],
  investments = [],
  emergencySavings = 0,
  monthlyExpenses = 0,
  monthlyIncome = 0,
  settings = {},
}) {
  const kpis = useFinancialKPIs({
    transactions,
    budgets,
    assets,
    liabilities,
    goals,
    debts,
    savingsPlans,
    bills,
    investments,
    emergencySavings,
    monthlyExpenses,
    monthlyIncome,
  })

  return useMemo(
    () => ({
      transactions,
      budgets,
      assets,
      liabilities,
      goals,
      debts,
      savingsPlans,
      bills,
      investments,
      emergencySavings,
      monthlyExpenses,
      monthlyIncome,
      settings,
      kpis,
    }),
    [
      transactions,
      budgets,
      assets,
      liabilities,
      goals,
      debts,
      savingsPlans,
      bills,
      investments,
      emergencySavings,
      monthlyExpenses,
      monthlyIncome,
      settings,
      kpis,
    ]
  )
}
