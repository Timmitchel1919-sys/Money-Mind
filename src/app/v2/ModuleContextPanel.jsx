import { useEffect, useRef } from "react"
import { ArrowLeft, ArrowLeftRight, ChevronLeft, ChevronRight, CircleDot, LayoutDashboard, Scale, Settings, Sparkles } from "lucide-react"
import { adjacentModuleId, deriveSpatialNavigation, NAVIGATION_LEVELS, openModuleIntent, orderedSubmodules, returnToCoreIntent } from "./navigation/spatialNavigation"

// Layer 12 overlay: the active navigation context, rendered inside the spatial
// stage (reads the motion engine through `engine`). Registry-driven: no module
// ids appear here.
const ICONS = { ArrowLeftRight, LayoutDashboard, Scale, Settings, Sparkles }
const Icon = ({ name, ...props }) => {
  const Component = ICONS[name] || CircleDot
  return <Component aria-hidden="true" {...props} />
}

function bandPosition(index, count) {
  const angle = Math.PI + (count === 1 ? Math.PI / 2 : (index / (count - 1)) * Math.PI)
  return { "--band-x": `${50 + Math.cos(angle) * 46}%`, "--band-y": `${96 + Math.sin(angle) * 82}%` }
}

export default function ModuleContextPanel({ coreId, engine, modules, onNavigationChange, onOpenAction, onOpenWorkspace, onSelectSubmodule, selectedSubmoduleId = null }) {
  const { dispatchIntent, hoveredId, selectedId } = engine
  const navigation = deriveSpatialNavigation({ coreId, hoveredId, modules, selectedId, selectedSubmoduleId })
  const module = navigation.activeModule
  const submodules = orderedSubmodules(module)
  const lastPublished = useRef(null)

  useEffect(() => {
    if (selectedSubmoduleId && !navigation.activeSubmodule) onSelectSubmodule?.(null)
    const signature = `${navigation.activeModuleId || "core"}/${navigation.activeSubmoduleId || ""}`
    if (lastPublished.current === signature) return
    lastPublished.current = signature
    onNavigationChange?.({ moduleId: navigation.activeModuleId, submoduleId: navigation.activeSubmoduleId })
  }, [navigation.activeModuleId, navigation.activeSubmodule, navigation.activeSubmoduleId, onNavigationChange, onSelectSubmodule, selectedSubmoduleId])

  const openSubmodule = (submodule) => {
    if (submodule.availability !== "available") return
    onSelectSubmodule?.(submodule.id)
    onNavigationChange?.({ moduleId: module.id, submoduleId: submodule.id })
    if (submodule.destination.kind === "workspace") onOpenWorkspace?.(submodule.destination.route, { moduleId: module.id, submoduleId: submodule.id, submodule })
    if (submodule.destination.kind === "action") onOpenAction?.(submodule.destination.action, { moduleId: module.id, submoduleId: submodule.id, submodule })
  }

  // Arrow keys move between modules while one is active (not while typing).
  useEffect(() => {
    if (navigation.level !== NAVIGATION_LEVELS.module) return undefined
    const onKeyDown = (event) => {
      if (event.target instanceof HTMLElement && event.target.closest("input, select, textarea")) return
      if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return
      event.preventDefault()
      dispatchIntent(openModuleIntent(adjacentModuleId(modules, navigation.activeModuleId, event.key === "ArrowLeft" ? -1 : 1)))
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [dispatchIntent, modules, navigation.activeModuleId, navigation.level])

  return (
    <section aria-live="polite" className={`v2-context v2-context--${navigation.level}`} data-level={navigation.level} data-testid="v2-context">
      {module ? (
        <>
          <button className="v2-context__back" data-testid="v2-back-to-core" onClick={() => { onSelectSubmodule?.(null); dispatchIntent(returnToCoreIntent()) }} type="button">
            <ArrowLeft aria-hidden="true" size={15} /> Back to Core
          </button>
          <div className="v2-context__module">
            <span className={`v2-context__icon v2-tone--${module.tone}`}><Icon name={module.icon} size={18} /></span>
            <div>
              <h2 data-testid="v2-active-module">{module.label}</h2>
              <p>{module.description}</p>
            </div>
          </div>
          {submodules.length ? (
            <nav className="v2-context__submodules" aria-label={`${module.label} workspaces`}>
              <p className="v2-context__eyebrow">Choose a workspace</p>
              <ul>{submodules.map((sub, index) => (
                <li key={sub.id}>
                  <button
                    aria-current={navigation.activeSubmoduleId === sub.id ? "page" : undefined}
                    aria-disabled={sub.availability !== "available" || undefined}
                    data-testid={`v2-submodule-${sub.id}`}
                    disabled={sub.availability !== "available"}
                    onClick={() => openSubmodule(sub)}
                    style={bandPosition(index, submodules.length)}
                    type="button"
                  >{sub.label}</button>
                </li>
              ))}</ul>
            </nav>
          ) : null}
          <div className="v2-context__stepper">
            <button aria-label="Previous module" className="v2-icon-button" onClick={() => dispatchIntent(openModuleIntent(adjacentModuleId(modules, module.id, -1)))} type="button"><ChevronLeft aria-hidden="true" size={16} /></button>
            <button aria-label="Next module" className="v2-icon-button" onClick={() => dispatchIntent(openModuleIntent(adjacentModuleId(modules, module.id, 1)))} type="button"><ChevronRight aria-hidden="true" size={16} /></button>
          </div>
        </>
      ) : (
        <div className="v2-context__module">
          <span className="v2-context__icon v2-tone--core">M</span>
          <div>
            <h2>Money Mind Core</h2>
            <p>Choose a module to explore. Keyboard: Tab to a module, Enter to open, Escape to return.</p>
          </div>
        </div>
      )}
    </section>
  )
}
