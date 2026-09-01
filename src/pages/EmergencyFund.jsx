import Input from "../components/Input"
import Panel from "../components/Panel"
import Card from "../components/Card"
import PageHeader from "../components/PageHeader"
import MultiCurrencyAmount from "../components/MultiCurrencyAmount"
import { formatCurrencyAmount } from "../utils/currencyConversion"

export default function EmergencyFund({
  emergencySavings,
  setEmergencySavings,
  monthlyExpenses,
  setMonthlyExpenses,
  rates,
  numberFormat,
  baseCurrency = "SRD",
}) {
  const monthsCovered =
    Number(monthlyExpenses || 0) > 0
      ? Number(emergencySavings || 0) / Number(monthlyExpenses || 0)
      : 0

  let status = "Low"
  let statusColor = "text-[#F87171]"

  if (monthsCovered >= 3) {
    status = "Good"
    statusColor = "text-[#FBBF24]"
  }

  if (monthsCovered >= 6) {
    status = "Strong"
    statusColor = "text-[#34D399]"
  }

  const progress = Math.min((monthsCovered / 6) * 100, 100)

  return (
    <div className="space-y-6">
      <PageHeader pageKey="emergency" />

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="space-y-6">
          <Card
            title="Emergency Savings"
            value={formatCurrencyAmount(emergencySavings, baseCurrency, numberFormat)}
            subtitle={<MultiCurrencyAmount amount={emergencySavings} currency={baseCurrency} rates={rates} numberFormat={numberFormat} showPrimary={false} variant="inline" />}
          />

          <Panel title="Emergency Fund Calculator">
            <div className="mt-6 space-y-4">
              <Input
                label="Current Emergency Savings"
                type="number"
                placeholder="30000"
                value={emergencySavings}
                onChange={setEmergencySavings}
              />

              <Input
                label="Monthly Essential Expenses"
                type="number"
                placeholder="5000"
                value={monthlyExpenses}
                onChange={setMonthlyExpenses}
              />
            </div>
          </Panel>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Card
              title="Monthly Expenses"
              value={formatCurrencyAmount(monthlyExpenses, baseCurrency, numberFormat)}
              subtitle={<MultiCurrencyAmount amount={monthlyExpenses} currency={baseCurrency} rates={rates} numberFormat={numberFormat} showPrimary={false} variant="inline" />}
            />
            <Card title="Months Covered" value={`${monthsCovered.toFixed(1)} Months`} />
          </div>

          <Panel title="Emergency Fund Status">
            <div className="mt-6 rounded-2xl border border-[#BFC4CC]/20 bg-black/30 p-6">
              <p className="text-sm text-[#A5ADB8]">Financial Safety Level</p>
              <h2 className={`mt-2 text-4xl font-bold ${statusColor}`}>{status}</h2>

              <p className="mt-4 text-[#D5D8DD]">
                Je noodfonds dekt momenteel ongeveer{" "}
                <strong>{monthsCovered.toFixed(1)} maanden</strong> aan essentiële uitgaven.
              </p>

              <div className="mt-6 h-4 overflow-hidden rounded-full bg-[#2A313D]">
                <div
                  className="h-full rounded-full bg-[#C9CDD3]"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <p className="mt-4 text-sm text-[#A5ADB8]">
                Doel: minimaal 6 maanden aan uitgaven.
              </p>
            </div>
          </Panel>
        </div>
      </section>
    </div>
  )
}