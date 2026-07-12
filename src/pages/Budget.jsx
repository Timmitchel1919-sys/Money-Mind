import Input from "../components/Input"
import Panel from "../components/Panel"
import CurrencySelect from "../components/CurrencySelect"
import MultiCurrencyAmount from "../components/MultiCurrencyAmount"
import { convertCurrency, formatCurrencyAmount } from "../utils/currencyConversion"

export default function Budget({
  income,
  setIncome,
  budgetCategory,
  setBudgetCategory,
  budgetAmount,
  setBudgetAmount,
  budgetCurrency,
  setBudgetCurrency,
  handleAddBudget,
  budgets,
  remainingBudget,
  baseCurrency = "SRD",
  rates,
  numberFormat,
  editingBudgetId,
  editBudgetCategory,
  setEditBudgetCategory,
  editBudgetAmount,
  setEditBudgetAmount,
  editBudgetCurrency,
  setEditBudgetCurrency,
  startEditBudget,
  cancelEditBudget,
  handleUpdateBudget,
  handleDeleteBudget,
}) {
  return (
    <section className="grid grid-cols-1 gap-6 xl:grid-cols-[420px_1fr]">
      <Panel title="Budget Planner">
        <form onSubmit={handleAddBudget} className="mt-6 space-y-4">
          <Input label="Monthly Income" type="number" value={income} onChange={setIncome} />
          <Input label="Category" placeholder="Food, Transport, Utilities..." value={budgetCategory} onChange={setBudgetCategory} />

          <div className="grid grid-cols-[1fr_140px] gap-3">
            <Input label="Amount" type="number" placeholder="1500" value={budgetAmount} onChange={setBudgetAmount} />
            <CurrencySelect label="Currency" value={budgetCurrency} onChange={setBudgetCurrency} />
          </div>

          <button className="metallic-button w-full rounded-xl p-3 font-semibold text-black">
            Add Budget
          </button>
        </form>
      </Panel>

      <Panel title="Budget Categories">
        <div className="mt-6 space-y-4">
          <div>
            <p className="text-[#A5ADB8]">
              Remaining budget: {formatCurrencyAmount(remainingBudget, baseCurrency, numberFormat)}
            </p>
            <MultiCurrencyAmount
              amount={remainingBudget}
              currency={baseCurrency}
              rates={rates}
              numberFormat={numberFormat}
              showPrimary={false}
              variant="inline"
              className="mt-1"
            />
          </div>

          {budgets.length === 0 ? (
            <p className="text-[#A5ADB8]">Nog geen budget categorieën toegevoegd.</p>
          ) : (
            budgets.map((item) => {
              // Legacy records saved before multi-currency support have no
              // currency field — treat those as SRD rather than breaking them.
              const itemCurrency = item.currency || "SRD"

              const amountInIncomeCurrency =
                itemCurrency === baseCurrency
                  ? Number(item.amount)
                  : convertCurrency({ amount: item.amount, fromCurrency: itemCurrency, toCurrency: baseCurrency, rates })

              const percentage =
                Number(item.income || income) > 0
                  ? (amountInIncomeCurrency / Number(item.income || income)) * 100
                  : 0

              const isEditing = editingBudgetId === item.id

              return (
                <div key={item.id} className="rounded-2xl border border-[#BFC4CC]/20 bg-black/30 p-4">
                  {isEditing ? (
                    <div className="space-y-3">
                      <Input label="Category" value={editBudgetCategory} onChange={setEditBudgetCategory} />

                      <div className="grid grid-cols-[1fr_140px] gap-3">
                        <Input label="Amount" type="number" value={editBudgetAmount} onChange={setEditBudgetAmount} />
                        <CurrencySelect label="Currency" value={editBudgetCurrency} onChange={setEditBudgetCurrency} />
                      </div>

                      <div className="flex gap-3">
                        <button onClick={() => handleUpdateBudget(item.id)} className="rounded-xl bg-[#C9CDD3] px-4 py-2 font-semibold text-black">
                          Save Changes
                        </button>
                        <button onClick={cancelEditBudget} className="rounded-xl border border-[#BFC4CC]/30 px-4 py-2 text-[#D5D8DD]">
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold">{item.category}</h3>
                          <p className="text-sm text-[#A5ADB8]">{percentage.toFixed(2)}% of income</p>
                        </div>

                        <div className="text-right">
                          <p className="text-xl font-bold">{formatCurrencyAmount(item.amount, itemCurrency, numberFormat)}</p>
                          <MultiCurrencyAmount
                            amount={item.amount}
                            currency={itemCurrency}
                            rates={rates}
                            numberFormat={numberFormat}
                            showPrimary={false}
                            variant="inline"
                          />
                          <div className="mt-2 flex gap-3">
                            <button onClick={() => startEditBudget(item)} className="text-sm text-[#C9CDD3] hover:text-white">Edit</button>
                            <button onClick={() => handleDeleteBudget(item.id)} className="text-sm text-red-400 hover:text-red-300">Delete</button>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 h-3 overflow-hidden rounded-full bg-[#2A313D]">
                        <div className="h-full rounded-full bg-[#C9CDD3]" style={{ width: `${Math.min(percentage, 100)}%` }} />
                      </div>
                    </>
                  )}
                </div>
              )
            })
          )}
        </div>
      </Panel>
    </section>
  )
}