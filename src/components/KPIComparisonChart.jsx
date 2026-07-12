import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts"

const TOOLTIP_STYLE = {
  backgroundColor: "#111827",
  border: "1px solid rgba(255,255,255,0.14)",
  borderRadius: "12px",
  color: "#F8FAFC",
}

// Horizontal "target vs actual" comparison — used for the KPI Target vs
// Actual chart (Savings Rate, Cash Flow Margin, Emergency Fund Coverage,
// Budget Adherence, Investment Return).
export default function KPIComparisonChart({ data, height = 320 }) {
  return (
    <div className="min-w-0 rounded-2xl" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
          <XAxis type="number" stroke="#707680" tick={{ fill: "#A5ADB8", fontSize: 12 }} />
          <YAxis type="category" dataKey="name" stroke="#707680" width={150} tick={{ fill: "#A5ADB8", fontSize: 12 }} />
          <Tooltip cursor={false} contentStyle={TOOLTIP_STYLE} />
          <Legend wrapperStyle={{ color: "#A5ADB8", fontSize: 12 }} />
          <Bar dataKey="actual" name="Actual" fill="#06B6D4" radius={[0, 8, 8, 0]} isAnimationActive={false} />
          <Bar dataKey="target" name="Target" fill="#FBBF24" radius={[0, 8, 8, 0]} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
