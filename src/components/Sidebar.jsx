import { useEffect, useRef, useState } from "react"
import { ChevronDown, ChevronLeft, ChevronRight, LogOut, User } from "lucide-react"
import { SidebarLogo } from "./MoneyMindLogo"
import { NAVIGATION, groupForPage } from "../constants/navigation"

function NavButton({ item, activePage, collapsed, onNavigate, onOpenMoneyAI }) {
  const Icon = item.icon
  const active = item.value ? activePage === item.value : false
  return (
    <button
      type="button"
      onClick={() => item.action === "ai" ? onOpenMoneyAI() : onNavigate(item.value)}
      aria-current={active ? "page" : undefined}
      title={collapsed ? item.label : undefined}
      className={`group relative flex min-h-11 w-full items-center rounded-xl transition ${collapsed ? "justify-center px-2" : "gap-3 px-3"} ${active ? "nav-item-active text-white" : "text-[#D5D8DD] hover:bg-white/5"}`}
    >
      {active && <span className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-[var(--brand-primary)]" aria-hidden="true" />}
      <Icon size={19} className="shrink-0" strokeWidth={1.8} aria-hidden="true" />
      {!collapsed && <span className="min-w-0 truncate text-sm font-medium">{item.label}</span>}
    </button>
  )
}

export default function Sidebar({ activePage, handleLogout, isOpen, onClose, onNavigate, onOpenMoneyAI, collapsed, onCollapsedChange, profile }) {
  const [openGroup, setOpenGroup] = useState(() => groupForPage(activePage) || "money")
  const [floatingGroup, setFloatingGroup] = useState(null)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const asideRef = useRef(null)

  useEffect(() => {
    const group = groupForPage(activePage)
    if (group && group !== "overview") setOpenGroup(group)
  }, [activePage])

  useEffect(() => {
    function closeFloating(event) {
      if (event.key === "Escape") setFloatingGroup(null)
      if (event.type === "mousedown" && asideRef.current && !asideRef.current.contains(event.target)) setFloatingGroup(null)
    }
    document.addEventListener("keydown", closeFloating)
    document.addEventListener("mousedown", closeFloating)
    return () => { document.removeEventListener("keydown", closeFloating); document.removeEventListener("mousedown", closeFloating) }
  }, [])

  return (
    <aside
      ref={asideRef}
      aria-label="Primary navigation"
      className={`navigation-glass fixed inset-y-0 left-0 z-50 flex min-h-dvh flex-col overflow-hidden transition-[width,transform] duration-200 ease-out md:translate-x-0 ${collapsed ? "md:w-[76px]" : "md:w-[272px]"} ${isOpen ? "w-[272px] translate-x-0" : "w-[272px] -translate-x-full"}`}
    >
      <div className={`flex h-16 shrink-0 items-center border-b border-[var(--border)] ${collapsed ? "justify-center px-2" : "justify-between gap-2 px-4"}`}>
        <SidebarLogo collapsed={collapsed} markOnly />
        <button type="button" onClick={() => onCollapsedChange(!collapsed)} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} aria-expanded={!collapsed} className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-xl text-[var(--text-secondary)] hover:bg-white/5 md:flex">
          {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
        <button type="button" onClick={onClose} aria-label="Close navigation" className="flex h-11 w-11 items-center justify-center rounded-xl md:hidden"><ChevronLeft size={20} /></button>
      </div>

      <nav className={`scrollbar-transparent min-h-0 flex-1 overflow-y-auto py-4 ${collapsed ? "px-2" : "px-3"}`}>
        {NAVIGATION.map((group) => {
          const isFlat = group.items.length === 1 && !group.icon
          const isExpanded = isFlat || openGroup === group.id
          const GroupIcon = group.icon
          return (
            <div key={group.id} className="mb-2">
              {isFlat ? (
                <>
                  {!collapsed && <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[.16em] text-[var(--text-muted)]">{group.label}</p>}
                  <NavButton item={group.items[0]} activePage={activePage} collapsed={collapsed} onNavigate={onNavigate} onOpenMoneyAI={onOpenMoneyAI} />
                </>
              ) : (
                <>
                  <button type="button" onClick={() => collapsed ? setFloatingGroup(floatingGroup === group.id ? null : group.id) : setOpenGroup(isExpanded ? "" : group.id)} aria-expanded={collapsed ? floatingGroup === group.id : isExpanded} title={collapsed ? group.label : undefined} className={`flex min-h-11 w-full items-center rounded-xl text-[var(--text-secondary)] hover:bg-white/5 ${collapsed ? "justify-center" : "gap-3 px-3"}`}>
                    <GroupIcon size={19} className="shrink-0" aria-hidden="true" />
                    {!collapsed && <><span className="min-w-0 flex-1 truncate text-left text-sm font-semibold">{group.label}</span><ChevronDown size={16} className={`transition-transform ${isExpanded ? "rotate-180" : ""}`} /></>}
                  </button>
                  {isExpanded && !collapsed && <div className="ml-3 mt-1 space-y-1 border-l border-[var(--border)] pl-2">{group.items.map((item) => <NavButton key={item.value || item.action} item={item} activePage={activePage} collapsed={false} onNavigate={onNavigate} onOpenMoneyAI={onOpenMoneyAI} />)}</div>}
                </>
              )}
            </div>
          )
        })}
      </nav>

      {collapsed && floatingGroup && (() => {
        const group = NAVIGATION.find((entry) => entry.id === floatingGroup)
        return <div className="navigation-popover fixed bottom-4 left-[84px] top-auto z-[60] max-h-[calc(100dvh-2rem)] w-64 overflow-y-auto rounded-2xl p-2"><p className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">{group.label}</p>{group.items.map((item) => <NavButton key={item.value || item.action} item={item} activePage={activePage} collapsed={false} onNavigate={(page) => { setFloatingGroup(null); onNavigate(page) }} onOpenMoneyAI={() => { setFloatingGroup(null); onOpenMoneyAI() }} />)}</div>
      })()}

      <div className={`shrink-0 space-y-1 border-t border-[var(--border)] p-2 ${collapsed ? "items-center" : ""}`}>
        {profileMenuOpen && <div className="navigation-popover absolute bottom-[68px] left-2 right-2 rounded-xl p-2"><button type="button" onClick={() => { setProfileMenuOpen(false); onNavigate("settings") }} className="flex min-h-10 w-full items-center gap-3 rounded-lg px-3 text-sm hover:bg-white/5"><User size={17} />My Profile</button><button type="button" onClick={handleLogout} className="flex min-h-10 w-full items-center gap-3 rounded-lg px-3 text-sm text-[var(--negative)] hover:bg-red-500/10"><LogOut size={17} />Sign Out</button></div>}
        <button type="button" onClick={() => setProfileMenuOpen((open) => !open)} aria-expanded={profileMenuOpen} className={`flex min-h-12 w-full items-center rounded-xl bg-black/20 hover:bg-white/5 ${collapsed ? "justify-center" : "gap-3 px-3"}`} title={collapsed ? (profile?.displayName || "My Profile") : undefined}>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--surface-elevated)]"><User size={18} /></span>
          {!collapsed && <><div className="min-w-0 flex-1 text-left"><p className="truncate text-sm font-semibold text-[var(--text-primary)]">{profile?.displayName || "User"}</p><p className="truncate text-xs text-[var(--text-muted)]">My Profile</p></div><ChevronDown size={16} /></>}
        </button>
      </div>
    </aside>
  )
}
