import { useMemo } from "react"

const ACTION_LIBRARY = [
  {
    key: "cashflow",
    title: "Reduce monthly expenses",
    detail: "Free cash flow is negative — expenses and bills are outpacing income. Trim discretionary categories first.",
    weight: (k) => (k.freeCashFlow < 0 ? 4 : 0),
  },
  {
    key: "emergency",
    title: "Build your emergency fund",
    detail: "Your emergency reserve covers fewer months than recommended. Automate a small, regular transfer until you reach 3-6 months.",
    weight: (k) => (k.emergencyFundCoverage < 1 ? 4 : k.emergencyFundCoverage < 3 ? 3 : k.emergencyFundCoverage < 6 ? 1 : 0),
  },
  {
    key: "savings",
    title: "Increase savings automation",
    detail: "Your savings rate has room to grow. Automate transfers on payday so saving happens before spending.",
    weight: (k) => (k.savingsRate < 0 ? 4 : k.savingsRate < 10 ? 3 : k.savingsRate < 20 ? 1 : 0),
  },
  {
    key: "debt",
    title: "Pay your highest-interest debt first",
    detail: "Your debt-to-income ratio is above a healthy range. Direct extra payments at the highest-rate balance.",
    weight: (k) => (k.debtToIncome > 50 ? 4 : k.debtToIncome > 35 ? 3 : k.debtToIncome > 20 ? 1 : 0),
  },
  {
    key: "budget",
    title: "Improve budget adherence",
    detail: "Actual spending is drifting from your budget plan. Revisit category limits so they reflect real habits.",
    weight: (k) => (k.budgetAdherence < 50 ? 4 : k.budgetAdherence < 75 ? 3 : k.budgetAdherence < 90 ? 1 : 0),
  },
  {
    key: "investments",
    title: "Diversify your investment portfolio",
    detail: "A large share of your portfolio sits in one asset type, or returns are currently negative. Spread risk across more categories.",
    weight: (k) =>
      (k.portfolioConcentration?.risk === "high" ? 3 : k.portfolioConcentration?.risk === "moderate" ? 1 : 0) +
      (k.investmentCost > 0 && k.investmentReturn < 0 ? 2 : 0),
  },
  {
    key: "retirement",
    title: "Increase retirement contribution",
    detail: "Long-term savings progress is early-stage. Consider raising your monthly retirement contribution as income allows.",
    weight: (k) => (k.savingsGoalProgress < 25 ? 1 : 0),
  },
]

function buildPrioritizedActions(kpis) {
  return ACTION_LIBRARY.map((item) => ({ ...item, score: item.weight(kpis) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
}

function generateCoachResponse(question, kpis) {
  const q = (question || "").toLowerCase()

  if (q.includes("savings rate") || q.includes("save more") || q.includes("saving")) {
    return `Your savings rate is currently ${kpis.savingsRate.toFixed(1)}%. ${
      kpis.savingsRate < 10
        ? "That's below the recommended minimum — try automating a fixed transfer to savings right after you're paid, even a small one, before it can be spent."
        : kpis.savingsRate < 20
        ? "You're making progress. Look for one recurring expense you could trim to push closer to a 20% savings rate."
        : "That's a strong rate — consider directing the surplus toward investments or accelerating a debt payoff."
    }`
  }

  if (q.includes("debt")) {
    return `Your debt-to-income ratio is ${kpis.debtToIncome.toFixed(1)}% and total debt is SRD ${kpis.totalDebt.toFixed(2)}. ${
      kpis.debtToIncome > 35
        ? "Prioritize the balance with the highest interest rate first (avalanche method) while keeping minimum payments on the rest."
        : "Your debt load looks manageable relative to income — keep making consistent payments and avoid new high-interest balances."
    }`
  }

  if (q.includes("emergency")) {
    return `Your emergency fund currently covers ${kpis.emergencyFundCoverage.toFixed(1)} months of expenses. ${
      kpis.emergencyFundCoverage < 3
        ? "The recommended minimum is 3 months, with 6 months being a stronger cushion. Redirect a portion of each paycheck there until you close the gap."
        : "You're at or above the recommended minimum — well positioned to absorb an unexpected expense."
    }`
  }

  if (q.includes("invest")) {
    return `Your portfolio return is ${kpis.investmentReturn.toFixed(2)}%, with a profit/loss of SRD ${kpis.investmentProfit.toFixed(2)}. ${
      kpis.portfolioConcentration?.risk === "high"
        ? `It's also concentrated in one category (${kpis.portfolioConcentration.topType || "your top holding"} at ${kpis.portfolioConcentration.pct.toFixed(0)}%) — diversifying could reduce risk.`
        : "Your allocation across categories looks reasonably diversified."
    }`
  }

  if (q.includes("retirement") || q.includes("on track")) {
    return `Your overall Financial Health Score is ${Math.round(kpis.healthScore)}/100 (${kpis.healthClassification.label}), and savings goal progress is at ${kpis.savingsGoalProgress.toFixed(1)}%. Staying consistent with contributions is the biggest lever for long-term retirement readiness.`
  }

  return `Here's a quick snapshot: savings rate ${kpis.savingsRate.toFixed(1)}%, cash flow ${
    kpis.freeCashFlow >= 0 ? "positive" : "negative"
  } (SRD ${kpis.freeCashFlow.toFixed(2)}), emergency fund ${kpis.emergencyFundCoverage.toFixed(1)} months, debt-to-income ${kpis.debtToIncome.toFixed(1)}%. Try one of the suggested questions above for a more specific breakdown.`
}

export default function useFinancialCoach(kpis) {
  const actions = useMemo(() => buildPrioritizedActions(kpis), [kpis])

  function askQuestion(question) {
    return generateCoachResponse(question, kpis)
  }

  return { actions, askQuestion }
}
