import { useMemo, useState } from "react"
import Input from "../components/Input"
import Panel from "../components/Panel"
import Card from "../components/Card"
import PageHeader from "../components/PageHeader"
import MultiCurrencyAmount from "../components/MultiCurrencyAmount"
import { formatCurrencyAmount } from "../utils/currencyConversion"

export default function DividendTracker({ rates, numberFormat, baseCurrency = "SRD" }) {
  const [assetName, setAssetName] = useState("Staatsolie Bond")
  const [shares, setShares] = useState(10)
  const [dividendPerShare, setDividendPerShare] = useState(50)
  const [frequency, setFrequency] = useState("quarterly")

  const paymentsPerYear = {
    monthly: 12,
    quarterly: 4,
    semiannual: 2,
    annual: 1,
  }[frequency]

  const annualDividend = useMemo(() => {
    return Number(shares || 0) * Number(dividendPerShare || 0) * paymentsPerYear
  }, [shares, dividendPerShare, paymentsPerYear])

  return (
    <div className="space-y-6">
      <PageHeader pageKey="dividends" />

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card title="Asset" value={assetName || "N/A"} />
        <Card title="Units" value={Number(shares || 0).toLocaleString()} />
        <Card title="Frequency" value={frequency} />
        <Card
          title="Annual Dividend"
          value={formatCurrencyAmount(annualDividend, baseCurrency, numberFormat)}
          subtitle={<MultiCurrencyAmount amount={annualDividend} currency={baseCurrency} rates={rates} numberFormat={numberFormat} showPrimary={false} variant="inline" />}
        />
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[420px_1fr]">
        <Panel title="Dividend Inputs">
          <div className="mt-6 space-y-4">
            <Input label="Asset Name" value={assetName} onChange={setAssetName} />
            <Input label="Shares / Units" type="number" value={shares} onChange={(value) => setShares(Number(value))} />
            <Input label="Dividend Per Share" type="number" value={dividendPerShare} onChange={(value) => setDividendPerShare(Number(value))} />

            <div>
              <label className="mb-2 block text-sm text-[#D5D8DD]">Payment Frequency</label>
              <select
                className="w-full rounded-xl border border-[#BFC4CC]/25 bg-black/35 p-3 text-white outline-none"
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
              >
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="semiannual">Semiannual</option>
                <option value="annual">Annual</option>
              </select>
            </div>
          </div>
        </Panel>

        <Panel title="Dividend Projection">
          <div className="mt-6 rounded-2xl border border-[#BFC4CC]/20 bg-black/30 p-6">
            <p className="text-sm text-[#A5ADB8]">Estimated Annual Dividend Income</p>
            <h2 className="mt-2 text-5xl font-bold text-[#FBBF24]">
              SRD {annualDividend.toLocaleString()}
            </h2>
            <p className="mt-4 text-[#D5D8DD]">
              Based on {shares} units, SRD {dividendPerShare} per unit, paid {frequency}.
            </p>
          </div>
        </Panel>
      </section>
    </div>
  )
}