import Panel from "../components/Panel"
import Card from "../components/Card"
import PageHeader from "../components/PageHeader"
import MultiCurrencyAmount from "../components/MultiCurrencyAmount"
import { formatCurrencyAmount } from "../utils/currencyConversion"

export default function CashFlowForecast({ transactions, bills, rates, numberFormat, baseCurrency = "SRD" }) {
  const income = transactions
    .filter((item) => item.type === "income")
    .reduce((sum, item) => sum + Number(item.amount || 0), 0)

  const expenses = transactions
    .filter((item) => item.type === "expense")
    .reduce((sum, item) => sum + Number(item.amount || 0), 0)

  const billTotal = bills.reduce((sum, item) => sum + Number(item.amount || 0), 0)

  const projectedCashFlow = income - expenses - billTotal

  return (
    <div className="space-y-6">
      <PageHeader pageKey="cashflowforecast" />

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card
          title="Projected Income"
          value={formatCurrencyAmount(income, baseCurrency, numberFormat)}
          subtitle={<MultiCurrencyAmount amount={income} currency={baseCurrency} rates={rates} numberFormat={numberFormat} showPrimary={false} variant="inline" />}
        />
        <Card
          title="Expenses"
          value={formatCurrencyAmount(expenses, baseCurrency, numberFormat)}
          subtitle={<MultiCurrencyAmount amount={expenses} currency={baseCurrency} rates={rates} numberFormat={numberFormat} showPrimary={false} variant="inline" />}
        />
        <Card
          title="Bills"
          value={formatCurrencyAmount(billTotal, baseCurrency, numberFormat)}
          subtitle={<MultiCurrencyAmount amount={billTotal} currency={baseCurrency} rates={rates} numberFormat={numberFormat} showPrimary={false} variant="inline" />}
        />
        <Card
          title="Projected Cash Flow"
          value={formatCurrencyAmount(projectedCashFlow, baseCurrency, numberFormat)}
          subtitle={<MultiCurrencyAmount amount={projectedCashFlow} currency={baseCurrency} rates={rates} numberFormat={numberFormat} showPrimary={false} variant="inline" />}
        />
      </section>

      <Panel title="Cash Flow Forecast">
        <div className="mt-6 rounded-2xl border border-[#BFC4CC]/20 bg-black/30 p-6">
          <p className="text-sm text-[#A5ADB8]">Forecast Result</p>

          <h2
            className={`mt-2 text-4xl font-bold ${
              projectedCashFlow >= 0 ? "text-[#34D399]" : "text-[#F87171]"
            }`}
          >
            SRD {projectedCashFlow.toFixed(2)}
          </h2>

          <p className="mt-4 text-[#D5D8DD]">
            {projectedCashFlow >= 0
              ? "Je verwachte cashflow is positief. Je hebt ruimte om te sparen, investeren of schulden af te lossen."
              : "Je verwachte cashflow is negatief. Je geplande kosten zijn hoger dan je inkomsten."}
          </p>
        </div>
      </Panel>
    </div>
  )
}