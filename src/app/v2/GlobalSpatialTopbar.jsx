import { useEffect, useRef, useState } from "react"
import { Bell, Globe, LogOut, Maximize2, MonitorSmartphone, Search, Settings, UserRound } from "lucide-react"

// Layer 9: the V2 global control surface. Floating solid bar, no sidebar.
// Controls are data/props-driven; spatial controls (overview, quality) only
// appear when a runtime is present (not in the WebGL fallback).
function Popover({ id, label, open, children }) {
  if (!open) return null
  return <div className="v2-popover" id={id} role="dialog" aria-label={label}>{children}</div>
}

export default function GlobalSpatialTopbar({
  displayName,
  email,
  language,
  notifications = [],
  onLanguageChange,
  onOpenClassic,
  onOpenSettings,
  onOverview,
  onSignOut,
  overviewDisabled = true,
  quality = null,
}) {
  const [panel, setPanel] = useState(null)
  const bar = useRef(null)
  useEffect(() => {
    if (!panel) return undefined
    const close = (event) => { if (event.key === "Escape" || (event.type === "pointerdown" && !bar.current?.contains(event.target))) setPanel(null) }
    window.addEventListener("keydown", close)
    window.addEventListener("pointerdown", close)
    return () => { window.removeEventListener("keydown", close); window.removeEventListener("pointerdown", close) }
  }, [panel])
  const toggle = (name) => setPanel((current) => (current === name ? null : name))

  return (
    <header className="v2-topbar" data-testid="v2-topbar" ref={bar}>
      <button className="v2-brand" onClick={onOverview} type="button" aria-label="Money Mind — return to the Core" disabled={!onOverview}>
        <img alt="" height="28" src="/money-mind-logo-clean.png" width="28" />
        <span>Money Mind</span>
      </button>

      <label className="v2-search">
        <Search aria-hidden="true" size={15} />
        <span className="v2-sr-only">Search Money Mind</span>
        <input aria-describedby="v2-search-note" disabled placeholder="Search Money Mind" type="search" />
        <span className="v2-sr-only" id="v2-search-note">Search arrives with the module content layers.</span>
      </label>

      <nav className="v2-topbar__controls" aria-label="Global controls">
        {onOverview ? (
          <button className="v2-icon-button" data-testid="v2-overview" disabled={overviewDisabled} onClick={onOverview} title="Return to the Money Mind Core" type="button">
            <Maximize2 aria-hidden="true" size={17} /><span className="v2-sr-only">Return to the Money Mind Core</span>
          </button>
        ) : null}
        {quality ? (
          <label className="v2-select v2-hide-mobile" title="Rendering quality">
            <MonitorSmartphone aria-hidden="true" size={15} />
            <select aria-label="Rendering quality" onChange={(event) => quality.onChange(event.target.value)} value={quality.value}>
              {quality.options.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
        ) : null}
        <label className="v2-select v2-hide-mobile" title="Language">
          <Globe aria-hidden="true" size={15} />
          <select aria-label="Language" onChange={(event) => onLanguageChange?.(event.target.value)} value={language}>
            <option value="en">EN</option>
            <option value="nl">NL</option>
          </select>
        </label>
        <div className="v2-anchor">
          <button aria-controls="v2-notifications" aria-expanded={panel === "notifications"} aria-label={`${notifications.length} notifications`} className="v2-icon-button" data-testid="v2-notifications" onClick={() => toggle("notifications")} type="button">
            <Bell aria-hidden="true" size={17} />
            {notifications.length > 0 ? <span className="v2-badge">{Math.min(notifications.length, 99)}</span> : null}
          </button>
          <Popover id="v2-notifications" label="Notifications" open={panel === "notifications"}>
            <p className="v2-popover__title">Notifications</p>
            {notifications.length ? notifications.slice(0, 6).map((item) => (
              <div className="v2-popover__item" key={item.id}><strong>{item.title}</strong><span>{item.message}</span></div>
            )) : <p className="v2-popover__empty">You're all caught up.</p>}
          </Popover>
        </div>
        {onOpenSettings ? (
          <button className="v2-icon-button" data-testid="v2-settings" onClick={onOpenSettings} title="Settings" type="button">
            <Settings aria-hidden="true" size={17} /><span className="v2-sr-only">Settings</span>
          </button>
        ) : null}
        <div className="v2-anchor">
          <button aria-controls="v2-profile" aria-expanded={panel === "profile"} className="v2-icon-button v2-profile-button" data-testid="v2-profile" onClick={() => toggle("profile")} type="button">
            <UserRound aria-hidden="true" size={17} /><span className="v2-sr-only">Profile</span>
          </button>
          <Popover id="v2-profile" label="Profile" open={panel === "profile"}>
            <p className="v2-popover__title">{displayName || "Money Mind member"}</p>
            {email ? <p className="v2-popover__empty">{email}</p> : null}
            <button className="v2-menu-item" data-testid="v2-classic-view" onClick={onOpenClassic} type="button">Open Classic view</button>
            <button className="v2-menu-item" data-testid="v2-sign-out" onClick={onSignOut} type="button"><LogOut aria-hidden="true" size={14} /> Sign out</button>
          </Popover>
        </div>
      </nav>
    </header>
  )
}
