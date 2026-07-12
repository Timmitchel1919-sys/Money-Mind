import KPIStatusBadge from "./KPIStatusBadge"
import KPIProgressBar from "./KPIProgressBar"

export default function KPICard({
  title,
  value,
  target,
  gap,
  status,
  explanation,
  progressValue,
  icon,
}) {
  return (
    <div className="group relative overflow-hidden rounded-3xl border border-[#707680]/40 bg-[#1F242D]/70 p-6 backdrop-blur-xl transition-all duration-300 hover:border-[#C9CDD3]/50">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium uppercase tracking-wide text-[#A5ADB8]">{title}</p>
          <h3 className="mt-2 text-3xl font-bold text-[#FAFAFA]">{value}</h3>
        </div>

        {icon && (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/5 text-lg text-[#C9CDD3]">
            {icon}
          </span>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <KPIStatusBadge status={status} />
        {target != null && <span className="text-xs text-[#A5ADB8]">Target: {target}</span>}
      </div>

      {progressValue != null && (
        <div className="mt-4">
          <KPIProgressBar value={progressValue} color={status?.color} />
        </div>
      )}

      {gap != null && <p className="mt-3 text-xs text-[#A5ADB8]">{gap}</p>}
      {explanation && <p className="mt-3 text-sm text-[#A5ADB8]">{explanation}</p>}
    </div>
  )
}
