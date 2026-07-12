const PRIORITY_STYLES = {
  Critical: { border: "border-[#EF4444]/40", badge: "bg-[#EF4444]/15 text-[#EF4444]" },
  High: { border: "border-[#F97316]/40", badge: "bg-[#F97316]/15 text-[#F97316]" },
  Medium: { border: "border-[#FACC15]/40", badge: "bg-[#FACC15]/15 text-[#FACC15]" },
  Positive: { border: "border-[#22C55E]/40", badge: "bg-[#22C55E]/15 text-[#22C55E]" },
  Information: { border: "border-[#06B6D4]/40", badge: "bg-[#06B6D4]/15 text-[#06B6D4]" },
}

export default function KPIInsightCard({ insight }) {
  const style = PRIORITY_STYLES[insight.priority] || PRIORITY_STYLES.Information

  return (
    <div className={`rounded-2xl border ${style.border} bg-black/30 p-4`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="font-semibold">{insight.title}</h4>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-[#A5ADB8]">{insight.category}</span>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${style.badge}`}>
            {insight.priority}
          </span>
        </div>
      </div>

      <p className="mt-2 text-sm text-[#A5ADB8]">{insight.explanation}</p>

      {insight.action && (
        <p className="mt-2 text-sm text-[#D5D8DD]">
          <span className="font-semibold text-[#C9CDD3]">Recommended action: </span>
          {insight.action}
        </p>
      )}
    </div>
  )
}
