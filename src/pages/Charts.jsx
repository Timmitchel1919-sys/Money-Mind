import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import Panel from "../components/Panel"
import Card from "../components/Card"

const COLORS = {
  cyan: "#06B6D4",
  gold: "#FBBF24",
  yellow: "#FACC15",
  green: "#22C55E",
  pink: "#EC4899",
  purple: "#8B5CF6",
  orange: "#F97316",
  blue: "#3B82F6",
}

const tooltipStyle = {
  backgroundColor: "#15181D",
  border: "1px solid #30343A",
  borderRadius: "12px",
  color: "#FFFFFF",
}

export default function Charts({ transactions, budgets, assets, liabilities, savingsPlans }) {
  const income = transactions
    .filter((item) => item.type === "income")
    .reduce((sum, item) => sum + Number(item.amount || 0), 0)

  const expenses = transactions
    .filter((item) => item.type === "expense")
    .reduce((sum, item) => sum + Number(item.amount || 0), 0)

  const totalAssets = assets.reduce((sum, item) => sum + Number(item.value || 0), 0)
  const totalLiabilities = liabilities.reduce((sum, item) => sum + Number(item.value || 0), 0)
  const netWorth = totalAssets - totalLiabilities

  const totalSavingsTarget = savingsPlans.reduce((sum, item) => sum + Number(item.target || 0), 0)
  const totalSavingsCurrent = savingsPlans.reduce((sum, item) => sum + Number(item.current || 0), 0)

  const cashFlowData = [
    { name: "Income", value: income },
    { name: "Expenses", value: expenses },
  ]

  const netWorthData = [
    { name: "Assets", value: totalAssets },
    { name: "Liabilities", value: totalLiabilities },
    { name: "Net Worth", value: netWorth },
  ]

  const savingsData = [
    { name: "Saved", value: totalSavingsCurrent },
    { name: "Remaining", value: Math.max(totalSavingsTarget - totalSavingsCurrent, 0) },
  ]

  const budgetData = budgets.map((item) => ({
    name: item.category,
    value: Number(item.amount || 0),
  }))

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card title="Income" value={`SRD ${income.toFixed(2)}`} />
        <Card title="Expenses" value={`SRD ${expenses.toFixed(2)}`} />
        <Card title="Net Worth" value={`SRD ${netWorth.toFixed(2)}`} />
        <Card title="Savings" value={`SRD ${totalSavingsCurrent.toFixed(2)}`} />
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Panel title="Income vs Expenses">
          <div className="mt-6 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cashFlowData}>
                <XAxis dataKey="name" stroke="#A5ADB8" />
                <YAxis stroke="#A5ADB8" />
                <Tooltip cursor={false} contentStyle={tooltipStyle} />
                <Bar dataKey="value" fill={COLORS.cyan} radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Budget Allocation">
          <div className="mt-6 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={budgetData}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={95}
                  label
                  isAnimationActive={false}
                  activeShape={false}
                >
                  {budgetData.map((_, index) => (
                    <Cell
                      key={index}
                      fill={[
                        COLORS.gold,
                        COLORS.cyan,
                        COLORS.green,
                        COLORS.purple,
                        COLORS.orange,
                        COLORS.pink,
                        COLORS.yellow,
                        COLORS.blue,
                      ][index % 8]}
                    />
                  ))}
                </Pie>
                <Tooltip cursor={false} contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Net Worth Breakdown">
          <div className="mt-6 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={netWorthData}>
                <XAxis dataKey="name" stroke="#A5ADB8" />
                <YAxis stroke="#A5ADB8" />
                <Tooltip cursor={false} contentStyle={tooltipStyle} />
                <Bar dataKey="value" fill={COLORS.gold} radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Savings Progress">
          <div className="mt-6 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={savingsData}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={95}
                  label
                  isAnimationActive={false}
                  activeShape={false}
                >
                  <Cell fill={COLORS.green} />
                  <Cell fill={COLORS.pink} />
                </Pie>
                <Tooltip cursor={false} contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </section>
    </div>
  )
}