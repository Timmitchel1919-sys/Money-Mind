import Input from "../components/Input"
import Panel from "../components/Panel"
import Card from "../components/Card"
import MultiCurrencyAmount from "../components/MultiCurrencyAmount"
import { formatCurrencyAmount } from "../utils/currencyConversion"

export default function SavingsPlanner({
  savingsPlans,
  savingName,
  setSavingName,
  savingTarget,
  setSavingTarget,
  savingCurrent,
  setSavingCurrent,
  savingMonthly,
  setSavingMonthly,
  handleAddSavingPlan,
  handleDeleteSavingPlan,
  rates,
  numberFormat,
  baseCurrency = "SRD",
}) {
  const totalTarget = savingsPlans.reduce((sum, item) => sum + Number(item.target || 0), 0)
  const totalCurrent = savingsPlans.reduce((sum, item) => sum + Number(item.current || 0), 0)
  const totalMonthly = savingsPlans.reduce((sum, item) => sum + Number(item.monthly || 0), 0)
  const progress = totalTarget > 0 ? (totalCurrent / totalTarget) * 100 : 0

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card
          title="Total Target"
          value={formatCurrencyAmount(totalTarget, baseCurrency, numberFormat)}
          subtitle={<MultiCurrencyAmount amount={totalTarget} currency={baseCurrency} rates={rates} numberFormat={numberFormat} showPrimary={false} variant="inline" />}
        />
        <Card
          title="Currently Saved"
          value={formatCurrencyAmount(totalCurrent, baseCurrency, numberFormat)}
          subtitle={<MultiCurrencyAmount amount={totalCurrent} currency={baseCurrency} rates={rates} numberFormat={numberFormat} showPrimary={false} variant="inline" />}
        />
        <Card
          title="Monthly Saving"
          value={formatCurrencyAmount(totalMonthly, baseCurrency, numberFormat)}
          subtitle={<MultiCurrencyAmount amount={totalMonthly} currency={baseCurrency} rates={rates} numberFormat={numberFormat} showPrimary={false} variant="inline" />}
        />
        <Card title="Progress" value={`${progress.toFixed(2)}%`} />
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[420px_1fr]">
        <Panel title="Add Savings Plan">
          <form onSubmit={handleAddSavingPlan} className="mt-6 space-y-4">
            <Input label="Savings Goal Name" placeholder="Car, House, Business..." value={savingName} onChange={setSavingName} />
            <Input label="Target Amount" type="number" placeholder="50000" value={savingTarget} onChange={setSavingTarget} />
            <Input label="Current Saved" type="number" placeholder="5000" value={savingCurrent} onChange={setSavingCurrent} />
            <Input label="Monthly Saving" type="number" placeholder="1500" value={savingMonthly} onChange={setSavingMonthly} />

            <button className="metallic-button w-full rounded-xl p-3 font-semibold text-black">
              Add Savings Plan
            </button>
          </form>
        </Panel>

        <Panel title="Savings Plans">
          <div className="mt-6 space-y-4">
            {savingsPlans.length === 0 ? (
              <p className="text-[#A5ADB8]">Nog geen savings plans toegevoegd.</p>
            ) : (
              savingsPlans.map((item) => {
                const itemProgress =
                  Number(item.target || 0) > 0
                    ? (Number(item.current || 0) / Number(item.target || 0)) * 100
                    : 0

                const remaining = Number(item.target || 0) - Number(item.current || 0)
                const monthsLeft =
                  Number(item.monthly || 0) > 0 ? remaining / Number(item.monthly || 0) : 0

                return (
                  <div key={item.id} className="rounded-2xl border border-[#BFC4CC]/20 bg-black/30 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold">{item.name}</h3>
                        <p className="text-sm text-[#A5ADB8]">
                          {formatCurrencyAmount(item.current, baseCurrency, numberFormat)} of{" "}
                          {formatCurrencyAmount(item.target, baseCurrency, numberFormat)}
                        </p>
                        <p className="mt-1 text-sm text-[#A5ADB8]">
                          Estimated completion: {monthsLeft > 0 ? `${Math.ceil(monthsLeft)} months` : "N/A"}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-xl font-bold">{itemProgress.toFixed(2)}%</p>
                        <button onClick={() => handleDeleteSavingPlan(item.id)} className="mt-2 text-sm text-red-400 hover:text-red-300">
                          Delete
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 h-3 overflow-hidden rounded-full bg-[#2A313D]">
                      <div className="h-full rounded-full bg-[#C9CDD3]" style={{ width: `${Math.min(itemProgress, 100)}%` }} />
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