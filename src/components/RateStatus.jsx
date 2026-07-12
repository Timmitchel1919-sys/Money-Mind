import { useState } from "react"

const STATUS_META = {
  loading: { label: "Loading rates…", color: "text-[#A5ADB8]" },
  live: { label: "Live rates", color: "text-[#34D399]" },
  cached: { label: "Cached rates", color: "text-[#FBBF24]" },
  unavailable: { label: "Rates unavailable", color: "text-[#F87171]" },
}

// Shared "rate status" readout + Refresh button used by both Currency
// Center and Settings, so the two never drift out of sync (single
// implementation, per the freeze-panes-era rule against duplicating shared UI).
export default function RateStatus({ rateStatus, updatedAt, rateError, refreshRates, compact = false }) {
  const [refreshing, setRefreshing] = useState(false)
  const meta = STATUS_META[rateStatus] || STATUS_META.loading

  async function handleRefresh() {
    if (refreshing || !refreshRates) return
    setRefreshing(true)
    try {
      await refreshRates(true)
    } finally {
      setRefreshing(false)
    }
  }

  return (
    <div className={`flex flex-wrap items-center justify-between gap-3 ${compact ? "" : "rounded-2xl border border-[#BFC4CC]/20 bg-black/30 p-4"}`}>
      <div>
        <p className={`text-sm font-semibold ${meta.color}`}>● {meta.label}</p>
        <p className="mt-1 text-xs text-[#707680]">
          {updatedAt ? `Last updated: ${new Date(updatedAt).toLocaleString()}` : "Not yet fetched"}
        </p>
        {rateStatus === "cached" && (
          <p className="mt-1 text-xs text-[#A5ADB8]">Using the most recent available exchange rates.</p>
        )}
        {rateStatus === "unavailable" && rateError && (
          <p className="mt-1 text-xs text-[#F87171]">{rateError}</p>
        )}
      </div>

      <button
        type="button"
        onClick={handleRefresh}
        disabled={refreshing}
        className="shrink-0 rounded-xl border border-[#BFC4CC]/30 px-4 py-2 text-sm font-semibold text-[#D5D8DD] transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {refreshing ? "Refreshing…" : "Refresh Rates"}
      </button>
    </div>
  )
}
