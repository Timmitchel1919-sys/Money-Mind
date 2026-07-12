import { useEffect, useMemo, useState } from "react"
import Input from "../components/Input"
import Panel from "../components/Panel"
import Card from "../components/Card"
import CurrencySelect from "../components/CurrencySelect"
import MultiCurrencyAmount from "../components/MultiCurrencyAmount"
import { formatCurrencyAmount } from "../utils/currencyConversion"

export default function InflationCalculator({ rates, rateStatus, numberFormat, defaultCurrency = "SRD" }) {
  const [currentAmount, setCurrentAmount] = useState(10000)
  const [inflationRate, setInflationRate] = useState(20)
  const [years, setYears] = useState(5)
  const [currency, setCurrency] = useState(defaultCurrency)

  useEffect(() => {
    setCurrency(defaultCurrency)
  }, [defaultCurrency])

  const futureCost = useMemo(() => {
    return Number(currentAmount || 0) * Math.pow(1 + Number(inflationRate || 0) / 100, Number(years || 0))
  }, [currentAmount, inflationRate, years])

  const purchasingPowerLoss = futureCost - Number(currentAmount || 0)
  const loadingRates = rateStatus === "loading"

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card title="Current Amount" value={formatCurrencyAmount(currentAmount, currency, numberFormat)} />
        <Card title="Inflation Rate" value={`${inflationRate}%`} />
        <Card title="Years" value={years} />
        <Card title="Future Cost" value={formatCurrencyAmount(futureCost, currency, numberFormat)} />
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[420px_1fr]">
        <Panel title="Inflation Inputs">
          <div className="mt-6 space-y-4">
            <div className="grid grid-cols-[1fr_150px] gap-3">
              <Input label="Current Amount" type="number" value={currentAmount} onChange={(value) => setCurrentAmount(Number(value))} />
              <CurrencySelect label="Currency" value={currency} onChange={setCurrency} />
            </div>

            <MultiCurrencyAmount
              amount={currentAmount}
              currency={currency}
              rates={rates}
              numberFormat={numberFormat}
              showPrimary={false}
              loading={loadingRates}
            />

            <Input label="Annual Inflation Rate %" type="number" value={inflationRate} onChange={(value) => setInflationRate(Number(value))} />
            <Input label="Years" type="number" value={years} onChange={(value) => setYears(Number(value))} />
          </div>
        </Panel>

        <Panel title="Purchasing Power Impact">
          <div className="mt-6 rounded-2xl border border-[#BFC4CC]/20 bg-black/30 p-6">
            <p className="text-sm text-[#A5ADB8]">Estimated Future Cost</p>
            <h2 className="mt-2 text-5xl font-bold text-[#FBBF24]">
              {formatCurrencyAmount(futureCost, currency, numberFormat)}
            </h2>

            <MultiCurrencyAmount
              amount={futureCost}
              currency={currency}
              rates={rates}
              numberFormat={numberFormat}
              showPrimary={false}
              loading={loadingRates}
              className="mt-3"
            />

            <p className="mt-4 text-[#D5D8DD]">
              Bij {inflationRate}% inflatie per jaar kost iets van{" "}
              {formatCurrencyAmount(currentAmount, currency, numberFormat)} over {years} jaar ongeveer{" "}
              {formatCurrencyAmount(futureCost, currency, numberFormat)}.
            </p>
            <p className="mt-4 text-[#F87171]">
              Koopkrachtverlies: {formatCurrencyAmount(purchasingPowerLoss, currency, numberFormat)}
            </p>
          </div>
        </Panel>
      </section>
    </div>
  )
}
