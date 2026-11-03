import { useEffect } from "react"
import { ArrowLeft, ArrowLeftRight, ChevronLeft, ChevronRight, CircleDot, LayoutDashboard, Scale, Settings, Sparkles } from "lucide-react"
import { adjacentModuleId, deriveSpatialNavigation, NAVIGATION_LEVELS, openModuleIntent, returnToCoreIntent } from "./navigation/spatialNavigation"

// Layer 12 overlay: the active navigation context, rendered inside the spatial
// stage (reads the motion engine through `engine`). Registry-driven: no module
// ids appear here.
const ICONS = { ArrowLeftRight, LayoutDashboard, Scale, Settings, Sparkles }
const Icon = ({ name, ...props }) => {
  const Component = ICONS[name] || CircleDot
  return <Component aria-hidden="true" {...props} />
}

export default function ModuleContextPanel({ coreId, engine, modules, onOpenWorkspace, onSelectSubmodule, selectedSubmoduleId = null }) {
  const { dispatchIntent, hoveredId, selectedId } = engine
  const navigation = deriveSpatialNavigation({ coreId, hoveredId, modules, selectedId, selectedSubmoduleId })
  const module = navigation.activeModule

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
          {module.submodules.length ? (
            <div className="v2-context__submodules">
              <p className="v2-context__eyebrow">Arriving in the submodule band</p>
              <ul>{module.submodules.map((sub) => (
                <li key={sub.id}>
                  <button
                    aria-current={navigation.activeSubmoduleId === sub.id ? "page" : undefined}
                    data-testid={`v2-submodule-${sub.id}`}
                    onClick={() => { onSelectSubmodule?.(sub.id); onOpenWorkspace?.(sub.legacyPage, { moduleId: module.id, submoduleId: sub.id }) }}
                    type="button"
                  >{sub.label}</button>
                </li>
              ))}</ul>
            </div>
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
