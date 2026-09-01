import Input from "../components/Input"
import Panel from "../components/Panel"
import Card from "../components/Card"
import PageHeader from "../components/PageHeader"
import MultiCurrencyAmount from "../components/MultiCurrencyAmount"
import { formatCurrencyAmount } from "../utils/currencyConversion"

export default function Goals({
  goals,
  goalName,
  setGoalName,
  goalTarget,
  setGoalTarget,
  goalSaved,
  setGoalSaved,
  handleAddGoal,
  handleDeleteGoal,
  rates,
  numberFormat,
  baseCurrency = "SRD",
}) {
  const totalTarget = goals.reduce((sum, item) => sum + Number(item.target || 0), 0)
  const totalSaved = goals.reduce((sum, item) => sum + Number(item.saved || 0), 0)
  const overallProgress = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0

  return (
    <div className="space-y-6">
      <PageHeader pageKey="goals" />

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Card
              title="Total Saved"
              value={formatCurrencyAmount(totalSaved, baseCurrency, numberFormat)}
              subtitle={<MultiCurrencyAmount amount={totalSaved} currency={baseCurrency} rates={rates} numberFormat={numberFormat} showPrimary={false} variant="inline" />}
            />
            <Card title="Overall Progress" value={`${overallProgress.toFixed(2)}%`} />
          </div>

          <Panel title="Your Goals">
            <div className="mt-6 space-y-4">
              {goals.length === 0 ? (
                <p className="text-[#A5ADB8]">Nog geen financiële doelen toegevoegd.</p>
              ) : (
                goals.map((item) => {
                  const progress =
                    Number(item.target || 0) > 0
                      ? (Number(item.saved || 0) / Number(item.target || 0)) * 100
                      : 0

                  return (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-[#BFC4CC]/20 bg-black/30 p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold">{item.name}</h3>
                          <p className="text-sm text-[#A5ADB8]">
                            {formatCurrencyAmount(item.saved, baseCurrency, numberFormat)} saved of{" "}
                            {formatCurrencyAmount(item.target, baseCurrency, numberFormat)}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="text-xl font-bold">{progress.toFixed(2)}%</p>
                          <button
                            onClick={() => handleDeleteGoal(item.id)}
                            className="mt-2 text-sm text-red-400 hover:text-red-300"
                          >
                            Delete
                          </button>
                        </div>
                      </div>

                      <div className="mt-4 h-3 overflow-hidden rounded-full bg-[#2A313D]">
                        <div
                          className="h-full rounded-full bg-[#C9CDD3]"
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </Panel>
        </div>

        <div className="space-y-6">
          <Card
            title="Total Goal Target"
            value={formatCurrencyAmount(totalTarget, baseCurrency, numberFormat)}
            subtitle={<MultiCurrencyAmount amount={totalTarget} currency={baseCurrency} rates={rates} numberFormat={numberFormat} showPrimary={false} variant="inline" />}
          />

          <Panel title="Add Financial Goal">
            <form onSubmit={handleAddGoal} className="mt-6 space-y-4">
              <Input
                label="Goal Name"
                placeholder="Car, House, Emergency Fund..."
                value={goalName}
                onChange={setGoalName}
              />

              <Input
                label="Target Amount"
                type="number"
                placeholder="50000"
                value={goalTarget}
                onChange={setGoalTarget}
              />

              <Input
                label="Current Saved Amount"
                type="number"
                placeholder="5000"
                value={goalSaved}
                onChange={setGoalSaved}
              />

              <button className="metallic-button w-full rounded-xl p-3 font-semibold text-black">
                Add Goal
              </button>
            </form>
          </Panel>
        </div>
      </section>
    </div>
  )
}