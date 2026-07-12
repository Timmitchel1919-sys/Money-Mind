import Card from "../components/Card"
import Panel from "../components/Panel"
import MultiCurrencyAmount from "../components/MultiCurrencyAmount"
import { formatCurrencyAmount } from "../utils/currencyConversion"

export default function Reports({ transactions, budgets, income, rates, numberFormat, baseCurrency = "SRD" }) {
  const totalIncome = transactions
    .filter((item) => item.type === "income")
    .reduce((sum, item) => sum + Number(item.amount || 0), 0)

  const totalExpenses = transactions
    .filter((item) => item.type === "expense")
    .reduce((sum, item) => sum + Number(item.amount || 0), 0)

  const totalBudget = budgets.reduce((sum, item) => sum + Number(item.amount || 0), 0)

  const savings = totalIncome - totalExpenses
  const savingsRate = totalIncome > 0 ? (savings / totalIncome) * 100 : 0
  const expenseRatio = totalIncome > 0 ? (totalExpenses / totalIncome) * 100 : 0
  const budgetUsage = Number(income || 0) > 0 ? (totalBudget / Number(income || 0)) * 100 : 0

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card
          title="Total Income"
          value={formatCurrencyAmount(totalIncome, baseCurrency, numberFormat)}
          subtitle={<MultiCurrencyAmount amount={totalIncome} currency={baseCurrency} rates={rates} numberFormat={numberFormat} showPrimary={false} variant="inline" />}
        />
        <Card
          title="Total Expenses"
          value={formatCurrencyAmount(totalExpenses, baseCurrency, numberFormat)}
          subtitle={<MultiCurrencyAmount amount={totalExpenses} currency={baseCurrency} rates={rates} numberFormat={numberFormat} showPrimary={false} variant="inline" />}
        />
        <Card title="Savings Rate" value={`${savingsRate.toFixed(2)}%`} />
        <Card title="Budget Usage" value={`${budgetUsage.toFixed(2)}%`} />
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Panel title="Financial Performance">
          <div className="mt-6 space-y-4">
            <ReportRow label="Income" value={formatCurrencyAmount(totalIncome, baseCurrency, numberFormat)} />
            <ReportRow label="Expenses" value={formatCurrencyAmount(totalExpenses, baseCurrency, numberFormat)} />
            <ReportRow label="Savings" value={formatCurrencyAmount(savings, baseCurrency, numberFormat)} />
            <ReportRow label="Expense Ratio" value={`${expenseRatio.toFixed(2)}%`} />
          </div>
        </Panel>

        <Panel title="Money Mind Insight">
          <div className="mt-6 rounded-2xl border border-[#BFC4CC]/20 bg-black/30 p-6">
            <p className="text-[#D5D8DD]">
              {savingsRate >= 20
                ? "Sterk. Je spaart minimaal 20% van je inkomen. Dit is gezond financieel gedrag."
                : savingsRate >= 10
                ? "Redelijk. Je spaart iets, maar er is ruimte om je savings rate te verhogen."
                : "Zwak. Je spaart weinig of niets. Controleer je uitgaven en budgetten."}
            </p>
          </div>
        </Panel>
      </section>
    </div>
  )
}

function ReportRow({ label, value }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-[#BFC4CC]/20 bg-black/30 p-4">
      <p className="text-[#A5ADB8]">{label}</p>
      <p className="font-bold text-[#FAFAFA]">{value}</p>
    </div>
  )
}