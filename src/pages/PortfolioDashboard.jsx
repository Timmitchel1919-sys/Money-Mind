import { useState } from "react"
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
} from "recharts"
import Card from "../components/Card"
import Panel from "../components/Panel"
import Input from "../components/Input"
import MultiCurrencyAmount from "../components/MultiCurrencyAmount"
import { formatCurrencyAmount } from "../utils/currencyConversion"
const COLORS = ["#FBBF24", "#06B6D4", "#22C55E", "#8B5CF6", "#F97316", "#EC4899"]
export default function PortfolioDashboard({ investments, rates, numberFormat, baseCurrency = "SRD" }) {
  const [averageYield, setAverageYield] = useState(4)

  const totalCost = investments.reduce(
    (sum, item) => sum + Number(item.cost || 0),
    0
  )

  const totalValue = investments.reduce(
    (sum, item) => sum + Number(item.value || 0),
    0
  )

  const profitLoss = totalValue - totalCost
  const returnRate = totalCost > 0 ? (profitLoss / totalCost) * 100 : 0

  const bestPerformer = investments.reduce((best, item) => {
    const cost = Number(item.cost || 0)
    const value = Number(item.value || 0)
    const itemReturn = cost > 0 ? ((value - cost) / cost) * 100 : 0

    if (!best) return { ...item, returnRate: itemReturn }
    return itemReturn > best.returnRate ? { ...item, returnRate: itemReturn } : best
  }, null)

  const allocation = investments.reduce((acc, item) => {
    const type = item.type || "Other"
    acc[type] = (acc[type] || 0) + Number(item.value || 0)
    return acc
  }, {})
const allocationData = Object.entries(allocation).map(([name, value]) => ({
  name,
  value,
}))
const performanceData = [
  { month: "Jan", value: totalCost * 0.85 },
  { month: "Feb", value: totalCost * 0.9 },
  { month: "Mar", value: totalCost * 0.95 },
  { month: "Apr", value: totalCost },
  { month: "May", value: totalValue * 0.95 },
  { month: "Jun", value: totalValue },
]
  const annualDividend = totalValue * (Number(averageYield || 0) / 100)
  const monthlyDividend = annualDividend / 12

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card
          title="Total Invested"
          value={formatCurrencyAmount(totalCost, baseCurrency, numberFormat)}
          subtitle={<MultiCurrencyAmount amount={totalCost} currency={baseCurrency} rates={rates} numberFormat={numberFormat} showPrimary={false} variant="inline" />}
        />
        <Card
          title="Portfolio Value"
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

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Panel title="Asset Allocation">
  <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-[240px_1fr]">
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={allocationData}
            dataKey="value"
            nameKey="name"
            outerRadius={90}
            isAnimationActive={false}
            activeShape={false}
          >
            {allocationData.map((_, index) => (
              <Cell key={index} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip cursor={false} />
        </PieChart>
      </ResponsiveContainer>
    </div>

    <div className="space-y-3">
      {Object.keys(allocation).length === 0 ? (
        <p className="text-[#A5ADB8]">Geen asset allocatie beschikbaar.</p>
      ) : (
        Object.entries(allocation).map(([type, value], index) => {
          const percentage = totalValue > 0 ? (value / totalValue) * 100 : 0

          return (
            <div
              key={type}
              className="rounded-2xl border border-[#BFC4CC]/20 bg-black/30 p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <p className="font-semibold">{type}</p>
                </div>

                <p className="text-[#D5D8DD]">
                  SRD {value.toFixed(2)} • {percentage.toFixed(2)}%
                </p>
              </div>

              <div className="mt-3 h-3 overflow-hidden rounded-full bg-[#2A313D]">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.min(percentage, 100)}%`,
                    backgroundColor: COLORS[index % COLORS.length],
                  }}
                />
              </div>
            </div>
          )
        })
      )}
    </div>
  </div>
</Panel>
      </section>
       <Panel title="Portfolio Performance Trend">
  <div className="mt-6 h-72">
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={performanceData}>
        <XAxis dataKey="month" stroke="#A5ADB8" />
        <YAxis stroke="#A5ADB8" />
        <Tooltip cursor={false} />
        <Line
          type="monotone"
          dataKey="value"
          stroke="#FBBF24"
          strokeWidth={3}
          dot={{ r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  </div>
</Panel>
      <Panel title="Dividend Income Summary">
        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-[280px_1fr]">
          <Input
            label="Assumed Average Dividend Yield %"
            type="number"
            value={averageYield}
            onChange={(value) => setAverageYield(Number(value))}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-[#BFC4CC]/20 bg-black/30 p-4">
              <p className="text-sm text-[#A5ADB8]">Estimated Annual Dividend Income</p>
              <h3 className="mt-2 text-2xl font-bold text-[#FBBF24]">SRD {annualDividend.toFixed(2)}</h3>
            </div>

            <div className="rounded-2xl border border-[#BFC4CC]/20 bg-black/30 p-4">
              <p className="text-sm text-[#A5ADB8]">Estimated Monthly Dividend Income</p>
              <h3 className="mt-2 text-2xl font-bold text-[#FBBF24]">SRD {monthlyDividend.toFixed(2)}</h3>
            </div>
          </div>
        </div>
      </Panel>
      <Panel title="Portfolio Holdings">
        <div className="mt-6 space-y-4">
          {investments.length === 0 ? (
            <p className="text-[#A5ADB8]">Nog geen portfolio holdings toegevoegd.</p>
          ) : (
            investments.map((item) => {
              const cost = Number(item.cost || 0)
              const value = Number(item.value || 0)
              const itemProfit = value - cost
              const itemReturn = cost > 0 ? (itemProfit / cost) * 100 : 0

              return (
                <div
                  key={item.id}
                  className="grid grid-cols-1 items-center gap-4 rounded-2xl border border-[#BFC4CC]/20 bg-black/30 p-4 sm:grid-cols-2 xl:grid-cols-5"
                >
                  <div>
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-sm text-[#A5ADB8]">{item.type}</p>
                  </div>

                  <p className="text-[#D5D8DD]">Cost: SRD {cost.toFixed(2)}</p>
                  <p className="text-[#D5D8DD]">Value: SRD {value.toFixed(2)}</p>

                  <p className={itemProfit >= 0 ? "text-[#34D399]" : "text-[#F87171]"}>
                    {itemProfit >= 0 ? "+" : ""}SRD {itemProfit.toFixed(2)}
                  </p>

                  <p className={itemReturn >= 0 ? "text-[#34D399]" : "text-[#F87171]"}>
                    {itemReturn.toFixed(2)}%
                  </p>
                </div>
              )
            })
          )}
        </div>
      </Panel>
    </div>
  )
}