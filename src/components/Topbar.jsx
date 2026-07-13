import { Menu } from "lucide-react"
import LiveDateTime from "./LiveDateTime"

export default function Topbar({ profile, settings, onMenuClick }) {
  const displayName = profile?.displayName || "Shaquil"

  return (
    <header className="flex shrink-0 flex-col gap-4 rounded-3xl border border-[#707680]/50 bg-[#0E1117]/70 p-6 backdrop-blur-xl md:flex-row md:items-center md:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open menu"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#BFC4CC]/30 text-[#D5D8DD] transition hover:bg-white/5 md:hidden"
        >
          <Menu size={20} />
        </button>

        <div className="min-w-0">
          <h1 className="truncate text-4xl font-bold">Welcome {displayName}</h1>
          <p className="mt-1 truncate text-base font-medium text-white">Let's build wealth today</p>
        </div>
      </div>

      <LiveDateTime
        timeFormat={settings?.timeFormat}
        dateFormat={settings?.dateFormat}
        language={settings?.language}
        className="shrink-0 self-start md:self-auto"
      />
    </header>
  )
}
