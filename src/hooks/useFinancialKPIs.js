import { useMemo } from "react"

function safeNum(value) {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

function safeDiv(numerator, denominator) {
  if (!denominator || !Number.isFinite(denominator)) return 0
  const result = numerator / denominator
  return Number.isFinite(result) ? result : 0
}

function clamp(value, min, max) {
  const safeValue = Number.isFinite(value) ? value : min
  return Math.min(max, Math.max(min, safeValue))
}

function sumBy(list, key) {
  return list.reduce((sum, item) => sum + safeNum(item[key]), 0)
}

const PERIODS = ["This Month", "Last Month", "Last 3 Months", "Last 6 Months", "Year to Date", "All Time"]

function periodRange(period, now) {
  const startOfMonth = (year, month) => new Date(year, month, 1, 0, 0, 0, 0)
  const endOfMonth = (year, month) => new Date(year, month + 1, 0, 23, 59, 59, 999)

  switch (period) {
    case "This Month":
      return { start: startOfMonth(now.getFullYear(), now.getMonth()), end: now }
    case "Last Month":
      return {
        start: startOfMonth(now.getFullYear(), now.getMonth() - 1),
        end: endOfMonth(now.getFullYear(), now.getMonth() - 1),
      }
    case "Last 3 Months":
      return { start: startOfMonth(now.getFullYear(), now.getMonth() - 2), end: now }
    case "Last 6 Months":
      return { start: startOfMonth(now.getFullYear(), now.getMonth() - 5), end: now }
    case "Year to Date":
      return { start: new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0), end: now }
    default:
      return null
  }
}

// Only transactions carry dates in this data model, so the period filter
// only narrows income/expense-derived KPIs. Snapshot data (assets, debts,
// investments, budgets) has no historical dimension yet and always
// reflects the current values, regardless of the selected period.
function filterTransactionsByPeriod(transactions, period) {
  if (period === "All Time" || !period) return transactions

  const range = periodRange(period, new Date())
  if (!range) return transactions

  return transactions.filter((item) => {
    const date = new Date(item.date)
    if (Number.isNaN(date.getTime())) return false
    return date >= range.start && date <= range.end
  })
}

function scoreSavingsRate(rate) {
  if (rate >= 20) return 20
  if (rate >= 10) return 12
  if (rate > 0) return 6
  return 0
}

function scoreCashFlowMargin(margin) {
  if (margin >= 20) return 15
  if (margin >= 10) return 10
  if (margin > 0) return 5
  return 0
}

function scoreEmergencyFund(months) {
  if (months >= 6) return 20
  if (months >= 3) return 12
  if (months >= 1) return 6
  return 0
}

function scoreDebtToIncome(ratio) {
  if (ratio <= 20) return 15
  if (ratio <= 35) return 10
  if (ratio <= 50) return 5
  return 0
}

function scoreBudgetAdherence(adherence) {
  if (adherence >= 90) return 10
  if (adherence >= 75) return 7
  if (adherence >= 50) return 3
  return 0
}

function scoreNetWorth(netWorth, totalAssets, totalLiabilities) {
  if (netWorth <= 0) return 0
  return safeDiv(totalLiabilities, totalAssets) < 0.5 ? 10 : 5
}

function scoreInvestmentReturn(returnRate, hasInvestments) {
  if (!hasInvestments) return 0
  if (returnRate >= 10) return 5
  if (returnRate >= 0) return 3
  return 0
}

function scoreGoalProgress(progress) {
  if (progress >= 75) return 5
  if (progress >= 40) return 3
  if (progress > 0) return 1
  return 0
}

export function classifyHealthScore(score) {
  if (score >= 90) {
    return { label: "Excellent", color: "#22C55E", description: "Your finances are in excellent shape across nearly every measure." }
  }
  if (score >= 75) {
    return { label: "Strong", color: "#06B6D4", description: "Your financial position is strong, with only minor gaps to close." }
  }
  if (score >= 60) {
    return { label: "Stable", color: "#FACC15", description: "Your finances are stable, with room to strengthen a few areas." }
  }
  if (score >= 40) {
    return { label: "Weak", color: "#F97316", description: "Your financial position needs attention in several key areas." }
  }
  return { label: "Critical", color: "#EF4444", description: "Your finances need immediate attention across multiple areas." }
}

// Generic threshold logic for a KPI measured against a user-editable target.
export function getKpiStatus(value, target, higherIsBetter = true) {
  const safeValue = safeNum(value)
  const safeTarget = safeNum(target)

  if (safeTarget <= 0) {
    return { label: "Warning", color: "#FACC15" }
  }

  if (higherIsBetter) {
    if (safeValue >= safeTarget) return { label: "Excellent", color: "#22C55E" }
    const pctOfTarget = (safeValue / safeTarget) * 100
    if (pctOfTarget >= 75) return { label: "Good", color: "#06B6D4" }
    if (pctOfTarget >= 50) return { label: "Warning", color: "#FACC15" }
    return { label: "Critical", color: "#EF4444" }
  }

  if (safeValue <= safeTarget) return { label: "Excellent", color: "#22C55E" }
  if (safeValue <= safeTarget * 1.15) return { label: "Good", color: "#06B6D4" }
  if (safeValue <= safeTarget * 1.35) return { label: "Warning", color: "#FACC15" }
  return { label: "Critical", color: "#EF4444" }
}

function computePortfolioConcentration(investments) {
  if (!investments.length) return { pct: 0, risk: "diversified", topType: null }

  const totalsByType = {}
  let totalValue = 0

  investments.forEach((item) => {
    const type = item.type || "Other"
    const value = safeNum(item.value)
    totalsByType[type] = (totalsByType[type] || 0) + value
    totalValue += value
  })

  let topType = null
  let topValue = 0

  Object.entries(totalsByType).forEach(([type, value]) => {
    if (value > topValue) {
      topValue = value
      topType = type
    }
  })

  const pct = safeDiv(topValue, totalValue) * 100
  const risk = pct > 60 ? "high" : pct >= 35 ? "moderate" : "diversified"

  return { pct, risk, topType }
}

export const KPI_PERIODS = PERIODS

export default function useFinancialKPIs({
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
  period = "All Time",
}) {
  return useMemo(() => {
    const periodTransactions = filterTransactionsByPeriod(transactions, period)

    const totalIncome = periodTransactions
      .filter((item) => item.type === "income")
      .reduce((sum, item) => sum + safeNum(item.amount), 0)

    const totalExpenses = periodTransactions
      .filter((item) => item.type === "expense")
      .reduce((sum, item) => sum + safeNum(item.amount), 0)

    const totalBills = sumBy(bills, "amount")
    const freeCashFlow = totalIncome - totalExpenses - totalBills
    const savingsAmount = totalIncome - totalExpenses

    const savingsRate = safeDiv(savingsAmount, totalIncome) * 100
    const expenseRatio = safeDiv(totalExpenses, totalIncome) * 100
    const cashFlowMargin = safeDiv(freeCashFlow, totalIncome) * 100

    const totalBudget = sumBy(budgets, "amount")
    const budgetUtilization = safeDiv(totalExpenses, totalBudget) * 100

    let budgetAdherence = 0
    if (totalBudget > 0) {
      budgetAdherence =
        totalExpenses <= totalBudget
          ? 100
          : clamp(100 - ((totalExpenses - totalBudget) / totalBudget) * 100, 0, 100)
    }

    const totalAssets = sumBy(assets, "value")
    const totalLiabilities = sumBy(liabilities, "value")
    const netWorth = totalAssets - totalLiabilities

    const totalDebt = sumBy(debts, "balance")
    const monthlyDebtPayments = sumBy(debts, "payment")
    const debtToIncome = safeDiv(monthlyDebtPayments, safeNum(monthlyIncome)) * 100

    const emergencyFundCoverage = safeDiv(safeNum(emergencySavings), safeNum(monthlyExpenses))

    const totalSavingsTarget = sumBy(savingsPlans, "target")
    const totalSavingsCurrent = sumBy(savingsPlans, "current")
    const savingsGoalProgress = clamp(safeDiv(totalSavingsCurrent, totalSavingsTarget) * 100, 0, 999)

    const completedGoals = goals.filter(
      (goal) => safeDiv(safeNum(goal.saved), safeNum(goal.target)) * 100 >= 100
    ).length
    const goalCompletionRate = safeDiv(completedGoals, goals.length) * 100

    const investmentCost = sumBy(investments, "cost")
    const investmentValue = sumBy(investments, "value")
    const investmentProfit = investmentValue - investmentCost
    const investmentReturn = safeDiv(investmentProfit, investmentCost) * 100

    const portfolioConcentration = computePortfolioConcentration(investments)

    const components = [
      { key: "savings", label: "Savings", points: scoreSavingsRate(savingsRate), max: 20 },
      { key: "cashFlow", label: "Cash Flow", points: scoreCashFlowMargin(cashFlowMargin), max: 15 },
      { key: "emergencyFund", label: "Emergency Fund", points: scoreEmergencyFund(emergencyFundCoverage), max: 20 },
      { key: "debt", label: "Debt", points: scoreDebtToIncome(debtToIncome), max: 15 },
      { key: "budget", label: "Budget", points: scoreBudgetAdherence(budgetAdherence), max: 10 },
      { key: "netWorth", label: "Net Worth", points: scoreNetWorth(netWorth, totalAssets, totalLiabilities), max: 10 },
      { key: "investments", label: "Investments", points: scoreInvestmentReturn(investmentReturn, investments.length > 0), max: 5 },
      { key: "goals", label: "Goals", points: scoreGoalProgress(savingsGoalProgress), max: 5 },
    ].map((component) => ({
      ...component,
      normalized: clamp(safeDiv(component.points, component.max) * 100, 0, 100),
    }))

    const healthScore = clamp(
      components.reduce((sum, component) => sum + component.points, 0),
      0,
      100
    )

    const healthClassification = classifyHealthScore(healthScore)

    const strongestArea = components.reduce((best, item) => (item.normalized > best.normalized ? item : best), components[0])
    const weakestArea = components.reduce((worst, item) => (item.normalized < worst.normalized ? item : worst), components[0])

    return {
      period,
      totalIncome,
      totalExpenses,
      totalBills,
      freeCashFlow,
      savingsAmount,
      savingsRate,
      expenseRatio,
      cashFlowMargin,
      totalBudget,
      budgetUtilization,
      budgetAdherence,
      totalAssets,
      totalLiabilities,
      netWorth,
      totalDebt,
      monthlyDebtPayments,
      debtToIncome,
      emergencyFundCoverage,
      totalSavingsTarget,
      totalSavingsCurrent,
      savingsGoalProgress,
      goalCompletionRate,
      investmentCost,
      investmentValue,
      investmentProfit,
      investmentReturn,
      portfolioConcentration,
      healthScore,
      healthClassification,
      healthComponents: components,
      strongestArea,
      weakestArea,
    }
  }, [
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
    period,
  ])
}
