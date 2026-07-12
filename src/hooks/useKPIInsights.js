import { useMemo } from "react"

export default function useKPIInsights(kpis) {
  return useMemo(() => {
    const insights = []

    if (kpis.savingsRate < 10) {
      insights.push({
        id: "savings-rate-low",
        priority: "High",
        category: "Savings",
        title: "Savings Rate Below Recommended Minimum",
        explanation:
          "Your savings rate is below the recommended minimum. Review discretionary spending and increase automatic savings.",
        action: "Automate a fixed transfer to savings on payday, even a small one, and trim one discretionary category.",
      })
    } else if (kpis.savingsRate >= 20) {
      insights.push({
        id: "savings-rate-strong",
        priority: "Positive",
        category: "Savings",
        title: "Strong Savings Rate",
        explanation: "Your savings rate is strong and supports long-term wealth building.",
        action: "Maintain your current savings automation and consider directing surplus toward investments.",
      })
    }

    if (kpis.expenseRatio > 80) {
      insights.push({
        id: "expense-ratio-high",
        priority: "High",
        category: "Expenses",
        title: "Expenses Consuming Most of Your Income",
        explanation:
          "Your expenses consume more than 80% of your income, leaving limited financial flexibility.",
        action: "Identify and reduce your largest non-essential expense categories in Transactions and Budget.",
      })
    }

    if (kpis.freeCashFlow < 0) {
      insights.push({
        id: "cash-flow-negative",
        priority: "Critical",
        category: "Cash Flow",
        title: "Negative Free Cash Flow",
        explanation: "Your current cash flow is negative. Expenses and bills exceed recorded income.",
        action: "Cut discretionary spending or increase income until free cash flow turns positive.",
      })
    }

    if (kpis.emergencyFundCoverage < 3) {
      insights.push({
        id: "emergency-fund-low",
        priority: "High",
        category: "Emergency Fund",
        title: "Emergency Reserve Below Minimum",
        explanation: "Your emergency reserve is below the recommended minimum of three months.",
        action: "Redirect a portion of monthly income into your emergency fund until you reach 3 months of expenses.",
      })
    }

    if (kpis.debtToIncome > 35) {
      insights.push({
        id: "debt-to-income-high",
        priority: "High",
        category: "Debt",
        title: "Debt Burden Above Preferred Threshold",
        explanation: "Your monthly debt burden is above the preferred threshold.",
        action: "Prioritize paying down your highest-interest debt before taking on new obligations.",
      })
    }

    if (kpis.budgetAdherence < 75) {
      insights.push({
        id: "budget-adherence-low",
        priority: "Medium",
        category: "Budget",
        title: "Spending Exceeding Budget Plan",
        explanation: "Your spending is materially exceeding your budget plan.",
        action: "Revisit your budget categories in Budget and adjust limits to match actual spending patterns.",
      })
    }

    if (kpis.investmentCost > 0 && kpis.investmentReturn < 0) {
      insights.push({
        id: "investment-return-negative",
        priority: "Medium",
        category: "Investments",
        title: "Portfolio Below Purchase Cost",
        explanation: "Your investment portfolio is currently below its purchase cost.",
        action: "Review underperforming holdings in Portfolio Dashboard and confirm your allocation still fits your goals.",
      })
    } else if (kpis.investmentReturn >= 10) {
      insights.push({
        id: "investment-return-strong",
        priority: "Positive",
        category: "Investments",
        title: "Strong Portfolio Return",
        explanation: "Your portfolio return is currently strong.",
        action: "Maintain your current strategy and rebalance periodically to lock in gains.",
      })
    }

    if (kpis.portfolioConcentration?.pct > 60) {
      insights.push({
        id: "portfolio-concentration-high",
        priority: "Medium",
        category: "Investments",
        title: "Portfolio Highly Concentrated",
        explanation: "Your portfolio is highly concentrated in one asset category.",
        action: `Consider diversifying beyond ${kpis.portfolioConcentration.topType || "your top holding"} to reduce concentration risk.`,
      })
    }

    if (kpis.savingsGoalProgress >= 80) {
      insights.push({
        id: "goal-progress-close",
        priority: "Positive",
        category: "Goals",
        title: "Close to Completing a Financial Goal",
        explanation: "You are close to completing one or more financial goals.",
        action: "Keep contributions consistent to cross the finish line.",
      })
    }

    return insights
  }, [kpis])
}
