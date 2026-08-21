import Panel from "../components/Panel"
import Card from "../components/Card"
import PageHeader from "../components/PageHeader"
import MultiCurrencyAmount from "../components/MultiCurrencyAmount"
import { formatCurrencyAmount } from "../utils/currencyConversion"

export default function FinancialCalendar({ bills, rates, numberFormat, baseCurrency = "SRD" }) {
  const sortedBills = [...bills].sort((a, b) =>
    String(a.dueDate).localeCompare(String(b.dueDate))
  )

  const totalUpcoming = bills.reduce((sum, item) => sum + Number(item.amount || 0), 0)

  return (
    <div className="space-y-6">
      <PageHeader pageKey="calendar" />

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card title="Upcoming Bills" value={bills.length} />
        <Card
          title="Total Due"
          value={formatCurrencyAmount(totalUpcoming, baseCurrency, numberFormat)}
          subtitle={<MultiCurrencyAmount amount={totalUpcoming} currency={baseCurrency} rates={rates} numberFormat={numberFormat} showPrimary={false} variant="inline" />}
        />
        <Card title="Next Payment" value={sortedBills[0]?.dueDate || "N/A"} />
      </section>

      <Panel title="Financial Calendar">
        <div className="mt-6 space-y-4">
          {sortedBills.length === 0 ? (
            <p className="text-[#A5ADB8]">Geen geplande betalingen gevonden.</p>
          ) : (
            sortedBills.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-2xl border border-[#BFC4CC]/20 bg-black/30 p-4"
              >
                <div>
                  <h3 className="text-lg font-semibold">{item.name}</h3>
                  <p className="text-sm text-[#A5ADB8]">
                    {item.category || "General"} • Due: {item.dueDate}
                  </p>
                </div>

                <p className="text-xl font-bold">
                  SRD {Number(item.amount || 0).toFixed(2)}
                </p>
              </div>
            ))
          )}
        </div>
      </Panel>
    </div>
  )
}