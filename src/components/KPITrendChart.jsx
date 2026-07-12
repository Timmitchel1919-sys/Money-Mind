import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts"

const TOOLTIP_STYLE = {
  backgroundColor: "#111827",
  border: "1px solid rgba(255,255,255,0.14)",
  borderRadius: "12px",
  color: "#F8FAFC",
}

// Generic vertical bar chart for a small set of named, semantically
// colored values. Reused for both the Financial Performance Overview
// (Income/Expenses/Savings/Free Cash Flow) and the Financial Position
// Overview (Assets/Liabilities/Net Worth/Debt) — this data model has no
// historical time series yet, so both render current snapshot values.
export default function KPITrendChart({ data, height = 300 }) {
  return (
    <div className="min-w-0 rounded-2xl" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
          <XAxis dataKey="name" stroke="#707680" tick={{ fill: "#A5ADB8", fontSize: 12 }} />
          <YAxis stroke="#707680" tick={{ fill: "#A5ADB8", fontSize: 12 }} />
          <Tooltip cursor={false} contentStyle={TOOLTIP_STYLE} />
          <Bar dataKey="value" radius={[8, 8, 0, 0]} isAnimationActive={false}>
            {data.map((entry, index) => (
              <Cell key={entry.name || index} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
