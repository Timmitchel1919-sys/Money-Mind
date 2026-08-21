import { useEffect, useMemo, useRef, useState } from "react"
import { Bell, Menu, Plus, Search, X } from "lucide-react"
import pageInfo from "../constants/pageInfo"
import { SEARCHABLE_NAVIGATION } from "../constants/navigation"
import useFinancialNotifications from "../hooks/useFinancialNotifications"

const QUICK_ACTIONS = [
  ["Add Income", "transactions"], ["Add Expense", "transactions"], ["Add Transaction", "transactions"],
  ["Add Bill", "bills"], ["Create Budget", "budget"], ["Create Savings Goal", "goals"],
  ["Add Debt", "debt"], ["Add Investment", "investments"], ["Export Data", "export"],
]

function Popover({ open, className = "", children }) {
  if (!open) return null
  return <div className={`navigation-popover absolute right-0 top-[calc(100%+.65rem)] z-50 rounded-2xl p-2 ${className}`}>{children}</div>
}

export default function Topbar({ settings, activePage, onNavigate, onMenuClick, financialData }) {
  const [panel, setPanel] = useState(null)
  const [query, setQuery] = useState("")
  const rootRef = useRef(null)
  const searchRef = useRef(null)
  const notifications = useFinancialNotifications({ ...financialData, billLeadTimeDays: settings?.notificationPreferences?.billLeadTimeDays })
  const title = pageInfo[activePage]?.title || "Money Mind"
  const results = useMemo(() => query.trim() ? SEARCHABLE_NAVIGATION.filter((item) => item.label.toLowerCase().includes(query.toLowerCase())).slice(0, 8) : SEARCHABLE_NAVIGATION.slice(0, 5), [query])

  useEffect(() => {
    function keydown(event) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") { event.preventDefault(); setPanel("search"); searchRef.current?.focus() }
      if (event.key === "Escape") setPanel(null)
    }
    function outside(event) { if (rootRef.current && !rootRef.current.contains(event.target)) setPanel(null) }
    document.addEventListener("keydown", keydown)
    document.addEventListener("mousedown", outside)
    return () => { document.removeEventListener("keydown", keydown); document.removeEventListener("mousedown", outside) }
  }, [])

  function navigate(page) { setPanel(null); setQuery(""); onNavigate(page) }

  return (
    <header ref={rootRef} className="relative z-30 mx-auto flex h-16 w-full max-w-[1440px] shrink-0 items-center gap-3">
      <button type="button" onClick={onMenuClick} aria-label="Open navigation" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl hover:bg-white/5 md:hidden"><Menu size={20} /></button>
      <div className="min-w-0 shrink-0 md:w-44"><h1 className="truncate text-lg font-bold text-[var(--text-primary)]">{title}</h1><p className="hidden truncate text-xs text-[var(--text-muted)] md:block">Overview / {title}</p></div>

      <div className="relative min-w-0 flex-1">
        <div className="flex h-11 w-full items-center gap-2 rounded-xl border border-[var(--border)] bg-black/20 px-3 text-sm text-[var(--text-muted)]"><Search size={18} className="shrink-0" /><input ref={searchRef} value={query} onFocus={() => setPanel("search")} onChange={(e) => { setQuery(e.target.value); setPanel("search") }} placeholder="Search transactions, accounts, goals, reports…" aria-label="Search Money Mind" className="min-w-0 flex-1 bg-transparent text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]" />{query ? <button type="button" onClick={() => { setQuery(""); searchRef.current?.focus() }} aria-label="Clear search" className="shrink-0"><X size={18} /></button> : <kbd className="ml-auto hidden rounded-md border border-[var(--border)] px-1.5 py-0.5 text-[10px] lg:block">Ctrl K</kbd>}</div>
        {panel === "search" && <div className="search-results-popover absolute left-0 top-[calc(100%+.65rem)] z-50 w-[min(520px,calc(100vw-2rem))] rounded-2xl p-3"><p className="px-2 pb-2 pt-1 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">{query ? "Results" : "Suggested modules"}</p>{results.length ? results.map((item) => <button key={item.value} onClick={() => navigate(item.value)} className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left hover:bg-white/5"><item.icon size={18} /><span className="flex-1 text-sm">{item.label}</span><span className="text-xs text-[var(--text-muted)]">{item.category}</span></button>) : <p className="p-4 text-center text-sm text-[var(--text-muted)]">No matching modules found.</p>}</div>}
      </div>

      <div className="relative"><button onClick={() => setPanel(panel === "quick" ? null : "quick")} className="flex h-11 items-center gap-2 rounded-xl bg-[var(--brand-primary)] px-3 font-semibold text-[var(--brand-contrast)]"><Plus size={18} /><span className="hidden xl:inline">Quick Add</span></button><Popover open={panel === "quick"} className="w-56"><p className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Quick actions</p>{QUICK_ACTIONS.map(([label,page]) => <button key={label} onClick={() => navigate(page)} className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm hover:bg-white/5"><Plus size={16} />{label}</button>)}</Popover></div>

      <div className="relative"><button onClick={() => setPanel(panel === "notifications" ? null : "notifications")} aria-label={`${notifications.length} notifications`} className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--border)]"><Bell size={19} />{notifications.length > 0 && <span className="absolute right-1 top-1 min-w-4 rounded-full bg-[var(--negative)] px-1 text-center text-[10px] text-white">{Math.min(notifications.length,99)}</span>}</button><Popover open={panel === "notifications"} className="w-[min(360px,calc(100vw-2rem))]"><div className="flex items-center justify-between px-3 py-2"><p className="font-semibold">Notifications</p><button onClick={() => navigate("settings")} className="text-xs text-[var(--text-muted)]">Settings</button></div><div className="max-h-80 overflow-y-auto">{notifications.length ? notifications.slice(0,8).map((item) => <div key={item.id} className="border-t border-[var(--border)] p-3"><p className="text-sm font-semibold">{item.title}</p><p className="mt-1 text-xs text-[var(--text-muted)]">{item.message}</p></div>) : <p className="p-6 text-center text-sm text-[var(--text-muted)]">You’re all caught up.</p>}</div></Popover></div>

    </header>
  )
}
