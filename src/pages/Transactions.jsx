import Input from "../components/Input"
import Panel from "../components/Panel"
import SmallStat from "../components/SmallStat"
import MultiCurrencyAmount from "../components/MultiCurrencyAmount"
import { formatCurrencyAmount } from "../utils/currencyConversion"

export default function Transactions({
  transactionType,
  setTransactionType,
  transactionCategory,
  setTransactionCategory,
  transactionAmount,
  setTransactionAmount,
  transactionDate,
  setTransactionDate,
  transactionDescription,
  setTransactionDescription,
  handleAddTransaction,
  transactions,
  transactionIncome,
  transactionExpenses,
  cashFlow,
  editingTransactionId,
  editTransactionType,
  setEditTransactionType,
  editTransactionCategory,
  setEditTransactionCategory,
  editTransactionAmount,
  setEditTransactionAmount,
  editTransactionDate,
  setEditTransactionDate,
  editTransactionDescription,
  setEditTransactionDescription,
  startEditTransaction,
  cancelEditTransaction,
  handleUpdateTransaction,
  handleDeleteTransaction,
  rates,
  numberFormat,
  baseCurrency = "SRD",
}) {
  return (
    <section className="grid grid-cols-1 gap-6 xl:grid-cols-[420px_1fr]">
      <Panel title="Add Transaction">
        <form onSubmit={handleAddTransaction} className="mt-6 space-y-4">
          <div>
            <label className="mb-2 block text-sm text-[#D5D8DD]">Type</label>
            <select
              className="w-full rounded-xl border border-[#BFC4CC]/25 bg-black/35 p-3 text-white outline-none"
              value={transactionType}
              onChange={(e) => setTransactionType(e.target.value)}
            >
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
          </div>

          <Input label="Category" placeholder="Salary, Food, Transport..." value={transactionCategory} onChange={setTransactionCategory} />
          <Input label="Amount" type="number" placeholder="250" value={transactionAmount} onChange={setTransactionAmount} />
          <Input label="Date" type="date" value={transactionDate} onChange={setTransactionDate} />
          <Input label="Description" placeholder="Optional note" value={transactionDescription} onChange={setTransactionDescription} />

          <button className="metallic-button w-full rounded-xl p-3 font-semibold text-black">
            Add Transaction
          </button>
        </form>
      </Panel>

      <Panel title="Recent Transactions">
        <div className="mt-6 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <SmallStat
              title="Income"
              value={formatCurrencyAmount(transactionIncome, baseCurrency, numberFormat)}
              subtitle={<MultiCurrencyAmount amount={transactionIncome} currency={baseCurrency} rates={rates} numberFormat={numberFormat} showPrimary={false} variant="inline" />}
            />
            <SmallStat
              title="Expenses"
              value={formatCurrencyAmount(transactionExpenses, baseCurrency, numberFormat)}
              subtitle={<MultiCurrencyAmount amount={transactionExpenses} currency={baseCurrency} rates={rates} numberFormat={numberFormat} showPrimary={false} variant="inline" />}
            />
            <SmallStat
              title="Cash Flow"
              value={formatCurrencyAmount(cashFlow, baseCurrency, numberFormat)}
              subtitle={<MultiCurrencyAmount amount={cashFlow} currency={baseCurrency} rates={rates} numberFormat={numberFormat} showPrimary={false} variant="inline" />}
            />
          </div>

          {transactions.length === 0 ? (
            <p className="text-[#A5ADB8]">Nog geen transacties toegevoegd.</p>
          ) : (
            transactions.map((item) => {
              const isEditing = editingTransactionId === item.id

              return (
                <div key={item.id} className="rounded-2xl border border-[#BFC4CC]/20 bg-black/30 p-4">
                  {isEditing ? (
                    <div className="space-y-3">
                      <div>
                        <label className="mb-2 block text-sm text-[#D5D8DD]">Type</label>
                        <select
                          className="w-full rounded-xl border border-[#BFC4CC]/25 bg-black/35 p-3 text-white outline-none"
                          value={editTransactionType}
                          onChange={(e) => setEditTransactionType(e.target.value)}
                        >
                          <option value="expense">Expense</option>
                          <option value="income">Income</option>
                        </select>
                      </div>

                      <Input label="Category" value={editTransactionCategory} onChange={setEditTransactionCategory} />
                      <Input label="Amount" type="number" value={editTransactionAmount} onChange={setEditTransactionAmount} />
                      <Input label="Date" type="date" value={editTransactionDate} onChange={setEditTransactionDate} />
                      <Input label="Description" value={editTransactionDescription} onChange={setEditTransactionDescription} />

                      <div className="flex gap-3">
                        <button onClick={() => handleUpdateTransaction(item.id)} className="rounded-xl bg-[#C9CDD3] px-4 py-2 font-semibold text-black">
                          Save Changes
                        </button>
                        <button onClick={cancelEditTransaction} className="rounded-xl border border-[#BFC4CC]/30 px-4 py-2 text-[#D5D8DD]">
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold">{item.category}</h3>
                        <p className="text-sm text-[#A5ADB8]">
                          {item.date} • {item.description || "No description"}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className={`text-xl font-bold ${item.type === "income" ? "text-[#34D399]" : "text-[#F87171]"}`}>
                          {item.type === "income" ? "+" : "-"} SRD {Number(item.amount).toFixed(2)}
                        </p>

                        <div className="mt-2 flex justify-end gap-3">
                          <button onClick={() => startEditTransaction(item)} className="text-sm text-[#C9CDD3] hover:text-white">Edit</button>
                          <button onClick={() => handleDeleteTransaction(item.id)} className="text-sm text-red-400 hover:text-red-300">Delete</button>
                        </div>
                      </div>
                    </div>
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