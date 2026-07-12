import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts"

const TOOLTIP_STYLE = {
  backgroundColor: "#111827",
  border: "1px solid rgba(255,255,255,0.14)",
  borderRadius: "12px",
  color: "#F8FAFC",
}

// Normalized (0-100) Financial Health Score components: Savings, Cash
// Flow, Emergency Fund, Debt, Budget, Net Worth, Investments, Goals.
export default function KPIRadarChart({ data, height = 320 }) {
  return (
    <div className="min-w-0 rounded-2xl" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} outerRadius="72%">
          <PolarGrid stroke="rgba(255,255,255,0.12)" />
          <PolarAngleAxis dataKey="name" tick={{ fill: "#A5ADB8", fontSize: 12 }} />
          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: "#707680", fontSize: 10 }} stroke="#707680" />
          <Radar
            name="Score"
            dataKey="score"
            stroke="#8B5CF6"
            fill="#8B5CF6"
            fillOpacity={0.35}
            isAnimationActive={false}
          />
          <Tooltip cursor={false} contentStyle={TOOLTIP_STYLE} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}
