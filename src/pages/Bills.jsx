import Input from "../components/Input"
import Panel from "../components/Panel"
import Card from "../components/Card"
import MultiCurrencyAmount from "../components/MultiCurrencyAmount"
import { formatCurrencyAmount } from "../utils/currencyConversion"

export default function Bills({
  bills,
  billName,
  setBillName,
  billAmount,
  setBillAmount,
  billDueDate,
  setBillDueDate,
  billCategory,
  setBillCategory,
  handleAddBill,
  handleDeleteBill,
  rates,
  numberFormat,
  baseCurrency = "SRD",
}) {
  const totalBills = bills.reduce((sum, item) => sum + Number(item.amount || 0), 0)

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Card title="Active Bills" value={bills.length} />
            <Card title="Next Due" value={bills[0]?.dueDate || "N/A"} />
          </div>

          <Panel title="Upcoming Bills">
            <div className="mt-6 space-y-4">
              {bills.length === 0 ? (
                <p className="text-[#A5ADB8]">Nog geen bills of subscriptions toegevoegd.</p>
              ) : (
                bills.map((item) => (
                  <div key={item.id} className="flex items-center justify-between rounded-2xl border border-[#BFC4CC]/20 bg-black/30 p-4">
                    <div>
                      <h3 className="text-lg font-semibold">{item.name}</h3>
                      <p className="text-sm text-[#A5ADB8]">
                        {item.category || "General"} • Due: {item.dueDate}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-xl font-bold">{formatCurrencyAmount(item.amount, baseCurrency, numberFormat)}</p>
                      <button onClick={() => handleDeleteBill(item.id)} className="mt-2 text-sm text-red-400 hover:text-red-300">
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Panel>
        </div>

        <div className="space-y-6">
          <Card
            title="Monthly Bills"
            value={formatCurrencyAmount(totalBills, baseCurrency, numberFormat)}
            subtitle={<MultiCurrencyAmount amount={totalBills} currency={baseCurrency} rates={rates} numberFormat={numberFormat} showPrimary={false} variant="inline" />}
          />

          <Panel title="Add Bill / Subscription">
            <form onSubmit={handleAddBill} className="mt-6 space-y-4">
              <Input label="Bill Name" placeholder="Internet, Netflix, Electricity..." value={billName} onChange={setBillName} />
              <Input label="Category" placeholder="Utilities, Subscription, Loan..." value={billCategory} onChange={setBillCategory} />
              <Input label="Amount" type="number" placeholder="500" value={billAmount} onChange={setBillAmount} />
              <Input label="Due Date" type="date" value={billDueDate} onChange={setBillDueDate} />

              <button className="metallic-button w-full rounded-xl p-3 font-semibold text-black">
                Add Bill
              </button>
            </form>
          </Panel>
        </div>
      </section>
    </div>
  )
}