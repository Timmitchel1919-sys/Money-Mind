import Input from "../components/Input"
import Panel from "../components/Panel"
import Card from "../components/Card"
import MultiCurrencyAmount from "../components/MultiCurrencyAmount"
import { formatCurrencyAmount } from "../utils/currencyConversion"

export default function InvestmentTracker({
  investments,
  investmentName,
  setInvestmentName,
  investmentType,
  setInvestmentType,
  investmentCost,
  setInvestmentCost,
  investmentValue,
  setInvestmentValue,
  handleAddInvestment,
  handleDeleteInvestment,
  rates,
  numberFormat,
  baseCurrency = "SRD",
}) {
  const totalCost = investments.reduce((sum, item) => sum + Number(item.cost || 0), 0)
  const totalValue = investments.reduce((sum, item) => sum + Number(item.value || 0), 0)
  const profitLoss = totalValue - totalCost
  const returnRate = totalCost > 0 ? (profitLoss / totalCost) * 100 : 0

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card
          title="Total Invested"
          value={formatCurrencyAmount(totalCost, baseCurrency, numberFormat)}
          subtitle={<MultiCurrencyAmount amount={totalCost} currency={baseCurrency} rates={rates} numberFormat={numberFormat} showPrimary={false} variant="inline" />}
        />
        <Card
          title="Current Value"
          value={formatCurrencyAmount(totalValue, baseCurrency, numberFormat)}
          subtitle={<MultiCurrencyAmount amount={totalValue} currency={baseCurrency} rates={rates} numberFormat={numberFormat} showPrimary={false} variant="inline" />}
        />
        <Card
          title="Profit / Loss"
          value={formatCurrencyAmount(profitLoss, baseCurrency, numberFormat)}
          subtitle={<MultiCurrencyAmount amount={profitLoss} currency={baseCurrency} rates={rates} numberFormat={numberFormat} showPrimary={false} variant="inline" />}
        />
        <Card title="Return" value={`${returnRate.toFixed(2)}%`} />
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[420px_1fr]">
        <Panel title="Add Investment">
          <form onSubmit={handleAddInvestment} className="mt-6 space-y-4">
            <Input label="Investment Name" placeholder="Gold, Staatsolie Bond, ETF..." value={investmentName} onChange={setInvestmentName} />

            <div>
              <label className="mb-2 block text-sm text-[#D5D8DD]">Type</label>
              <select
                className="w-full rounded-xl border border-[#BFC4CC]/25 bg-black/35 p-3 text-white outline-none"
                value={investmentType}
                onChange={(e) => setInvestmentType(e.target.value)}
              >
                <option value="Stock">Stock</option>
                <option value="ETF">ETF</option>
                <option value="Bond">Bond</option>
                <option value="Crypto">Crypto</option>
                <option value="Gold">Gold</option>
                <option value="Cash">Cash</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <Input label="Purchase Cost" type="number" placeholder="10000" value={investmentCost} onChange={setInvestmentCost} />
            <Input label="Current Value" type="number" placeholder="12000" value={investmentValue} onChange={setInvestmentValue} />

            <button className="metallic-button w-full rounded-xl p-3 font-semibold text-black">
              Add Investment
            </button>
          </form>
        </Panel>

        <Panel title="Portfolio">
          <div className="mt-6 space-y-4">
            {investments.length === 0 ? (
              <p className="text-[#A5ADB8]">Nog geen investeringen toegevoegd.</p>
            ) : (
              investments.map((item) => {
                const itemProfit = Number(item.value || 0) - Number(item.cost || 0)
                const itemReturn = Number(item.cost || 0) > 0 ? (itemProfit / Number(item.cost || 0)) * 100 : 0

                return (
                  <div key={item.id} className="rounded-2xl border border-[#BFC4CC]/20 bg-black/30 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold">{item.name}</h3>
                        <p className="text-sm text-[#A5ADB8]">{item.type}</p>
                      </div>

                      <div className="text-right">
                        <p className="text-xl font-bold">{formatCurrencyAmount(item.value || 0, baseCurrency, numberFormat)}</p>
                        <p className={itemProfit >= 0 ? "text-sm text-[#34D399]" : "text-sm text-[#F87171]"}>
                          {itemProfit >= 0 ? "+" : ""}
                          {formatCurrencyAmount(itemProfit, baseCurrency, numberFormat)} • {itemReturn.toFixed(2)}%
                        </p>
                        <button onClick={() => handleDeleteInvestment(item.id)} className="mt-2 text-sm text-red-400 hover:text-red-300">
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </Panel>
      </section>
    </div>
  )
}