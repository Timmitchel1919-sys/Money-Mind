import { useMemo } from "react"

export default function useFinancialNotifications({
  transactions = [],
  bills = [],
  debts = [],
  goals = [],
  investments = [],
  emergencySavings = 0,
  monthlyExpenses = 0,
  monthlyIncome = 0,
  billLeadTimeDays = 7,
}) {
  return useMemo(() => {
    const notifications = []

    const income = transactions
      .filter((item) => item.type === "income")
      .reduce((sum, item) => sum + Number(item.amount || 0), 0)

    const expenses = transactions
      .filter((item) => item.type === "expense")
      .reduce((sum, item) => sum + Number(item.amount || 0), 0)

    if (expenses > income) {
      notifications.push({
        id: "cashflow-negative",
        title: "Negative Cash Flow",
        message: `Expenses (SRD ${expenses.toFixed(2)}) exceed income (SRD ${income.toFixed(2)}) by SRD ${(expenses - income).toFixed(2)}.`,
        severity: "critical",
        category: "Cash Flow",
      })
    }

    const monthsCovered =
      Number(monthlyExpenses) > 0 ? Number(emergencySavings) / Number(monthlyExpenses) : 0

    if (monthsCovered < 3) {
      notifications.push({
        id: "emergency-low",
        title: "Emergency Fund Critically Low",
        message: `Your emergency fund covers only ${monthsCovered.toFixed(1)} months of expenses.`,
        severity: "high",
        category: "Emergency Fund",
      })
    } else if (monthsCovered < 6) {
      notifications.push({
        id: "emergency-medium",
        title: "Emergency Fund Below Target",
        message: `Your emergency fund covers ${monthsCovered.toFixed(1)} months. Aim for 6 months.`,
        severity: "medium",
        category: "Emergency Fund",
      })
    }

    const now = new Date()
    bills.forEach((bill) => {
      if (!bill.dueDate) return
      const due = new Date(bill.dueDate)
      if (Number.isNaN(due.getTime())) return

      const daysUntil = Math.ceil((due - now) / (1000 * 60 * 60 * 24))
      const leadTime = Number(billLeadTimeDays) > 0 ? Number(billLeadTimeDays) : 7

      if (daysUntil <= leadTime) {
        notifications.push({
          id: `bill-${bill.id}`,
          title: `${bill.name} Due Soon`,
          message:
            daysUntil < 0
              ? `${bill.name} was due ${Math.abs(daysUntil)} day(s) ago. Amount: SRD ${Number(bill.amount || 0).toFixed(2)}.`
              : `${bill.name} is due in ${daysUntil} day${daysUntil === 1 ? "" : "s"}. Amount: SRD ${Number(bill.amount || 0).toFixed(2)}.`,
          severity: "high",
          category: "Bills",
        })
      } else if (daysUntil <= leadTime + 7) {
        notifications.push({
          id: `bill-${bill.id}`,
          title: `${bill.name} Upcoming`,
          message: `${bill.name} is due in ${daysUntil} days. Amount: SRD ${Number(bill.amount || 0).toFixed(2)}.`,
          severity: "medium",
          category: "Bills",
        })
      }
    })

    const totalDebt = debts.reduce((sum, item) => sum + Number(item.balance || 0), 0)

    if (Number(monthlyIncome) > 0 && totalDebt > Number(monthlyIncome) * 3) {
      notifications.push({
        id: "debt-high",
        title: "High Debt Level",
        message: `Total debt (SRD ${totalDebt.toFixed(2)}) is more than 3x your monthly income.`,
        severity: "high",
        category: "Debt",
      })
    }

    const savingsRate = income > 0 ? ((income - expenses) / income) * 100 : 0

    if (income > 0 && savingsRate < 10) {
      notifications.push({
        id: "savings-low",
        title: "Low Savings Rate",
        message: `Your savings rate is ${savingsRate.toFixed(1)}%. Try to save at least 10% of income.`,
        severity: "medium",
        category: "Savings",
      })
    } else if (savingsRate >= 20) {
      notifications.push({
        id: "savings-strong",
        title: "Strong Savings Rate",
        message: `Your savings rate is ${savingsRate.toFixed(1)}%. Great job staying disciplined.`,
        severity: "positive",
        category: "Savings",
      })
    }

    goals.forEach((goal) => {
      const progress =
        Number(goal.target || 0) > 0 ? (Number(goal.saved || 0) / Number(goal.target || 0)) * 100 : 0

      if (progress >= 80) {
        notifications.push({
          id: `goal-${goal.id}`,
          title: `${goal.name} Almost There`,
          message: `You're ${progress.toFixed(0)}% of the way to your "${goal.name}" goal.`,
          severity: "positive",
          category: "Goals",
        })
      }
    })

    const totalCost = investments.reduce((sum, item) => sum + Number(item.cost || 0), 0)
    const totalValue = investments.reduce((sum, item) => sum + Number(item.value || 0), 0)
    const returnRate = totalCost > 0 ? ((totalValue - totalCost) / totalCost) * 100 : 0

    if (investments.length > 0 && returnRate < 0) {
      notifications.push({
        id: "investments-negative",
        title: "Portfolio Return Negative",
        message: `Your portfolio return is ${returnRate.toFixed(2)}%. Review your holdings.`,
        severity: "medium",
        category: "Investments",
      })
    } else if (investments.length > 0 && returnRate >= 10) {
      notifications.push({
        id: "investments-strong",
        title: "Strong Portfolio Performance",
        message: `Your portfolio return is ${returnRate.toFixed(2)}%. Keep up the strategy.`,
        severity: "positive",
        category: "Investments",
      })
    }

    return notifications
  }, [transactions, bills, debts, goals, investments, emergencySavings, monthlyExpenses, monthlyIncome, billLeadTimeDays])
}
