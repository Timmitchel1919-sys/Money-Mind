import Panel from "../components/Panel"
import Card from "../components/Card"
import Input from "../components/Input"
import PageHeader from "../components/PageHeader"
import CurrencySelect from "../components/CurrencySelect"
import MultiCurrencyAmount from "../components/MultiCurrencyAmount"
import { CURRENCIES, CURRENCY_CODES } from "../constants/currencies"
import { convertCurrency } from "../utils/currencyConversion"
import RateStatus from "../components/RateStatus"

export default function CurrencyCenter({
  rates,
  rateStatus,
  updatedAt,
  rateError,
  refreshRates,
  numberFormat,
  converterAmount,
  setConverterAmount,
  fromCurrency,
  setFromCurrency,
  toCurrency,
  setToCurrency,
}) {
  const convertedAmount = convertCurrency({
    amount: converterAmount,
    fromCurrency,
    toCurrency,
    rates,
  })

  function rateCard(code) {
    return (
      <Card
        key={code}
        title={`${CURRENCIES[code].flag} 1 ${code} / SRD`}
        value={
          rates?.[code]
            ? `SRD ${convertCurrency({ amount: 1, fromCurrency: code, toCurrency: "SRD", rates }).toFixed(4)}`
            : "—"
        }
        subtitle={CURRENCIES[code].name}
      />
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader pageKey="currency" />

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="space-y-6">
          {rateCard("USD")}

          <Panel title="Currency Converter">
            <div className="mt-6 space-y-4">
              <Input
                label="Amount"
                type="number"
                value={converterAmount}
                onChange={setConverterAmount}
                placeholder="100"
              />

              <CurrencySelect label="From" value={fromCurrency} onChange={setFromCurrency} />
              <CurrencySelect label="To" value={toCurrency} onChange={setToCurrency} />

              <div className="rounded-2xl border border-[#BFC4CC]/20 bg-black/30 p-5">
                <p className="text-sm text-[#A5ADB8]">Converted Amount</p>
                <MultiCurrencyAmount
                  amount={convertedAmount}
                  currency={toCurrency}
                  rates={rates}
                  numberFormat={numberFormat}
                  showEquivalents={false}
                  className="mt-2"
                />
              </div>
            </div>
          </Panel>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {rateCard("EUR")}
            <Card title={`${CURRENCIES.SRD.flag} SRD Base`} value="SRD 1.00" subtitle={CURRENCIES.SRD.name} />
          </div>

          <Panel title="Live Rate Status">
            <div className="mt-6 space-y-4">
              <RateStatus
                rateStatus={rateStatus}
                updatedAt={updatedAt}
                rateError={rateError}
                refreshRates={refreshRates}
              />

              <div className="rounded-2xl border border-[#BFC4CC]/20 bg-black/30 p-5">
                <p className="text-sm text-[#A5ADB8]">1 SRD equals</p>
                <div className="mt-3 space-y-2">
                  {CURRENCY_CODES.filter((code) => code !== "SRD").map((code) => (
                    <p key={code} className="flex items-center justify-between text-[#D5D8DD]">
                      <span>
                        {CURRENCIES[code].flag} {code}
                      </span>
                      <span className="font-semibold">{rates?.[code] ? rates[code].toFixed(4) : "—"}</span>
                    </p>
                  ))}
                </div>
              </div>

              <p className="text-sm text-[#A5ADB8]">
                Rates are provided by a free, keyless live exchange-rate service and refresh
                automatically in the background. Amounts entered elsewhere in Money Mind
                automatically show their SRD, USD, and EUR equivalents using these rates.
              </p>
            </div>
          </Panel>
        </div>
      </section>
    </div>
  )
}
