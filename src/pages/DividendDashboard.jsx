import { useMemo, useState } from "react"
import Input from "../components/Input"
import Panel from "../components/Panel"
import Card from "../components/Card"
import MultiCurrencyAmount from "../components/MultiCurrencyAmount"
import { formatCurrencyAmount } from "../utils/currencyConversion"

export default function DividendDashboard({ rates, numberFormat, baseCurrency = "SRD" }) {
  const [portfolioValue, setPortfolioValue] = useState(50000)
  const [averageYield, setAverageYield] = useState(6)
  const [targetMonthlyIncome, setTargetMonthlyIncome] = useState(5000)

  const annualDividend = useMemo(() => {
    return Number(portfolioValue || 0) * (Number(averageYield || 0) / 100)
  }, [portfolioValue, averageYield])

  const monthlyDividend = annualDividend / 12
  const progress =
    Number(targetMonthlyIncome || 0) > 0
      ? (monthlyDividend / Number(targetMonthlyIncome)) * 100
      : 0

  const requiredPortfolio =
    Number(averageYield || 0) > 0
      ? (Number(targetMonthlyIncome || 0) * 12) / (Number(averageYield) / 100)
      : 0

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card
          title="Portfolio Value"
          value={formatCurrencyAmount(portfolioValue, baseCurrency, numberFormat)}
          subtitle={<MultiCurrencyAmount amount={portfolioValue} currency={baseCurrency} rates={rates} numberFormat={numberFormat} showPrimary={false} variant="inline" />}
        />
        <Card title="Average Yield" value={`${averageYield}%`} />
        <Card
          title="Monthly Dividend"
          value={formatCurrencyAmount(monthlyDividend, baseCurrency, numberFormat)}
          subtitle={<MultiCurrencyAmount amount={monthlyDividend} currency={baseCurrency} rates={rates} numberFormat={numberFormat} showPrimary={false} variant="inline" />}
        />
        <Card
          title="Annual Dividend"
          value={formatCurrencyAmount(annualDividend, baseCurrency, numberFormat)}
          subtitle={<MultiCurrencyAmount amount={annualDividend} currency={baseCurrency} rates={rates} numberFormat={numberFormat} showPrimary={false} variant="inline" />}
        />
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[420px_1fr]">
        <Panel title="Dividend Inputs">
          <div className="mt-6 space-y-4">
            <Input
              label="Portfolio Value"
              type="number"
              value={portfolioValue}
              onChange={(value) => setPortfolioValue(Number(value))}
            />

            <Input
              label="Average Dividend Yield %"
              type="number"
              value={averageYield}
              onChange={(value) => setAverageYield(Number(value))}
            />

            <Input
              label="Target Monthly Dividend Income"
              type="number"
              value={targetMonthlyIncome}
              onChange={(value) => setTargetMonthlyIncome(Number(value))}
            />
          </div>
        </Panel>

        <Panel title="Dividend Independence Progress">
          <div className="mt-6 rounded-2xl border border-[#BFC4CC]/20 bg-black/30 p-6">
            <p className="text-sm text-[#A5ADB8]">Monthly Passive Income Progress</p>

            <h2 className="mt-2 text-5xl font-bold text-[#FBBF24]">
              {progress.toFixed(2)}%
            </h2>

            <div className="mt-6 h-4 overflow-hidden rounded-full bg-[#2A313D]">
              <div
                className="h-full rounded-full bg-[#FBBF24]"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>

            <p className="mt-6 text-[#D5D8DD]">
              To reach SRD {Number(targetMonthlyIncome).toLocaleString()} per month
              at {averageYield}% yield, you need approximately{" "}
              <strong>
                SRD {requiredPortfolio.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </strong>{" "}
              invested.
            </p>
          </div>
        </Panel>
      </section>
    </div>
  )
}