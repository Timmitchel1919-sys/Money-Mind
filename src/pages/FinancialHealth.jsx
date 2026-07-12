import Card from "../components/Card"
import Panel from "../components/Panel"

export default function FinancialHealth({
  transactions,
  debts,
  emergencySavings,
  monthlyExpenses,
}) {
  const income = transactions
    .filter((item) => item.type === "income")
    .reduce((sum, item) => sum + Number(item.amount || 0), 0)

  const expenses = transactions
    .filter((item) => item.type === "expense")
    .reduce((sum, item) => sum + Number(item.amount || 0), 0)

  const totalDebt = debts.reduce((sum, item) => sum + Number(item.balance || 0), 0)
  const cashFlow = income - expenses
  const savingsRate = income > 0 ? (cashFlow / income) * 100 : 0

  const monthsCovered =
    Number(monthlyExpenses || 0) > 0
      ? Number(emergencySavings || 0) / Number(monthlyExpenses || 0)
      : 0

  let score = 0

  if (savingsRate >= 20) score += 30
  else if (savingsRate >= 10) score += 20
  else if (savingsRate > 0) score += 10

  if (cashFlow > 0) score += 25

  if (monthsCovered >= 6) score += 25
  else if (monthsCovered >= 3) score += 15
  else if (monthsCovered >= 1) score += 8

  if (totalDebt === 0) score += 20
  else if (income > 0 && totalDebt < income * 3) score += 10

  let status = "Weak"
  let color = "text-[#F87171]"

  if (score >= 70) {
    status = "Strong"
    color = "text-[#34D399]"
  } else if (score >= 45) {
    status = "Moderate"
    color = "text-[#FBBF24]"
  }

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card title="Health Score" value={`${score}/100`} />
        <Card title="Status" value={status} />
        <Card title="Savings Rate" value={`${savingsRate.toFixed(2)}%`} />
        <Card title="Emergency Cover" value={`${monthsCovered.toFixed(1)} months`} />
      </section>

      <Panel title="Financial Health Analysis">
        <div className="mt-6 rounded-2xl border border-[#BFC4CC]/20 bg-black/30 p-6">
          <p className="text-sm text-[#A5ADB8]">Money Mind Score</p>
          <h2 className={`mt-2 text-5xl font-bold ${color}`}>{score}/100</h2>

          <div className="mt-6 h-4 overflow-hidden rounded-full bg-[#2A313D]">
            <div
              className="h-full rounded-full bg-[#C9CDD3]"
              style={{ width: `${score}%` }}
            />
          </div>

          <p className="mt-6 text-[#D5D8DD]">
            {score >= 70
              ? "Je financiële positie is sterk. Blijf consistent sparen, schulden beperken en je cashflow bewaken."
              : score >= 45
              ? "Je financiële positie is redelijk, maar er is ruimte voor verbetering. Focus op meer spaargeld, lagere schulden en stabielere cashflow."
              : "Je financiële positie is kwetsbaar. Focus eerst op cashflow, noodfonds en schuldverlaging."}
          </p>
        </div>
      </Panel>
    </div>
  )
}