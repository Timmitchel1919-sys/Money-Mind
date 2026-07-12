export default function KPIStatusBadge({ status }) {
  if (!status) return null

  return (
    <span
      className="rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide"
      style={{ backgroundColor: `${status.color}26`, color: status.color }}
    >
      {status.label}
    </span>
  )
}
