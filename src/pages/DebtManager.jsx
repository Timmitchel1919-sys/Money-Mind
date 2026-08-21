import Input from "../components/Input"
import Panel from "../components/Panel"
import Card from "../components/Card"
import PageHeader from "../components/PageHeader"
import MultiCurrencyAmount from "../components/MultiCurrencyAmount"
import { formatCurrencyAmount } from "../utils/currencyConversion"
export default function DebtManager({
  debts,
  debtName,
  setDebtName,
  debtBalance,
  setDebtBalance,
  debtRate,
  setDebtRate,
  debtPayment,
  setDebtPayment,
  handleAddDebt,
  handleDeleteDebt,
  rates,
  numberFormat,
  baseCurrency = "SRD",
}) {
  const totalDebt = debts.reduce((sum, item) => sum + Number(item.balance || 0), 0)
  const totalMonthlyPayments = debts.reduce((sum, item) => sum + Number(item.payment || 0), 0)

  return (
    <div className="space-y-6">
      <PageHeader pageKey="debt" />

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Card
              title="Monthly Payments"
              value={formatCurrencyAmount(totalMonthlyPayments, baseCurrency, numberFormat)}
              subtitle={<MultiCurrencyAmount amount={totalMonthlyPayments} currency={baseCurrency} rates={rates} numberFormat={numberFormat} showPrimary={false} variant="inline" />}
            />
            <Card title="Debt Accounts" value={debts.length} />
          </div>

          <Panel title="Debt Overview">
            <div className="mt-6 space-y-4">
              {debts.length === 0 ? (
                <p className="text-[#A5ADB8]">Nog geen schulden toegevoegd.</p>
              ) : (
                debts.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-[#BFC4CC]/20 bg-black/30 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold">{item.name}</h3>
                        <p className="text-sm text-[#A5ADB8]">
                          Interest: {Number(item.rate || 0).toFixed(2)}% • Monthly:{" "}
                          {formatCurrencyAmount(item.payment || 0, baseCurrency, numberFormat)}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-xl font-bold text-[#F87171]">
                          {formatCurrencyAmount(item.balance || 0, baseCurrency, numberFormat)}
                        </p>
                        <button onClick={() => handleDeleteDebt(item.id)} className="mt-2 text-sm text-red-400 hover:text-red-300">
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Panel>
        </div>

        <div className="space-y-6">
          <Card
            title="Total Debt"
            value={formatCurrencyAmount(totalDebt, baseCurrency, numberFormat)}
            subtitle={<MultiCurrencyAmount amount={totalDebt} currency={baseCurrency} rates={rates} numberFormat={numberFormat} showPrimary={false} variant="inline" />}
          />

          <Panel title="Add Debt">
            <form onSubmit={handleAddDebt} className="mt-6 space-y-4">
              <Input label="Debt Name" placeholder="Car Loan, Personal Loan..." value={debtName} onChange={setDebtName} />
              <Input label="Balance" type="number" placeholder="10000" value={debtBalance} onChange={setDebtBalance} />
              <Input label="Interest Rate %" type="number" placeholder="12" value={debtRate} onChange={setDebtRate} />
              <Input label="Monthly Payment" type="number" placeholder="500" value={debtPayment} onChange={setDebtPayment} />

              <button className="metallic-button w-full rounded-xl p-3 font-semibold text-black">
                Add Debt
              </button>
            </form>
          </Panel>
        </div>
      </section>
    </div>
  )
}