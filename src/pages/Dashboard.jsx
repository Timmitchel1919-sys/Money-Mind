import Card from "../components/Card"
import Panel from "../components/Panel"
import MultiCurrencyAmount from "../components/MultiCurrencyAmount"
import { formatCurrencyAmount } from "../utils/currencyConversion"
import useFinancialKPIs from "../hooks/useFinancialKPIs"

export default function Dashboard({
  transactionIncome,
  transactionExpenses,
  cashFlow,
  totalBudget,
  remainingBudget,
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
  setActivePage,
  rates,
  numberFormat,
  baseCurrency = "SRD",
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

  return (
    <>
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card
          title="Income"
          value={formatCurrencyAmount(transactionIncome, baseCurrency, numberFormat)}
          subtitle={<MultiCurrencyAmount amount={transactionIncome} currency={baseCurrency} rates={rates} numberFormat={numberFormat} showPrimary={false} variant="inline" />}
        />
        <Card
          title="Expenses"
          value={formatCurrencyAmount(transactionExpenses, baseCurrency, numberFormat)}
          subtitle={<MultiCurrencyAmount amount={transactionExpenses} currency={baseCurrency} rates={rates} numberFormat={numberFormat} showPrimary={false} variant="inline" />}
        />
        <Card title="Cash Flow" value={formatCurrencyAmount(cashFlow, baseCurrency, numberFormat)} />
        <Card title="Budgeted" value={formatCurrencyAmount(totalBudget, baseCurrency, numberFormat)} />
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Panel title="Financial Summary">
          <p className="mt-4 text-[#A5ADB8]">
            Your current financial overview based on budgets and transactions.
          </p>
        </Panel>

        <Panel title="Quick Insight">
          <p className="mt-4 text-[#A5ADB8]">
            Remaining budget: {formatCurrencyAmount(remainingBudget, baseCurrency, numberFormat)}
          </p>
        </Panel>
      </section>

      <Panel title="Financial KPIs">
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card
            title="Financial Health Score"
            value={`${Math.round(kpis.healthScore)}/100`}
            subtitle={kpis.healthClassification.label}
          />
          <Card title="Savings Rate" value={`${kpis.savingsRate.toFixed(1)}%`} />
          <Card title="Emergency Fund Coverage" value={`${kpis.emergencyFundCoverage.toFixed(1)} months`} />
          <Card title="Debt-to-Income Ratio" value={`${kpis.debtToIncome.toFixed(1)}%`} />
        </div>

        {setActivePage && (
          <button
            onClick={() => setActivePage("kpis")}
            className="metallic-button mt-6 rounded-xl px-6 py-3 font-semibold text-black"
          >
            View Full KPI Dashboard
          </button>
        )}
      </Panel>
    </>
  )
}
