export default function KPIProgressBar({ value, color = "#06B6D4" }) {
  const pct = Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : 0

  return (
    <div className="h-3 w-full overflow-hidden rounded-full bg-[#2A313D]">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${pct}%`, backgroundColor: color }}
      />
    </div>
  )
}
