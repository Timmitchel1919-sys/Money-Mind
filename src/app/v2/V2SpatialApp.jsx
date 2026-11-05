import { Component, lazy, Suspense, useEffect, useMemo, useState } from "react"
import useFinancialNotifications from "../../hooks/useFinancialNotifications"
import { detectRenderingCapabilities } from "../../spatial/performance/capabilities"
import { resolveMotionPreference } from "../../spatial/performance/motionPreference"
import { QUALITY_OPTIONS } from "../../spatial/runtime/quality/qualityPresets"
import { featureFlags } from "../../core/feature-flags/featureFlags"
import { createModuleSpatialScene, MONEY_MIND_CORE_ID } from "../../visualization/adapters/moduleSpatialAdapter"
import GlobalSpatialTopbar from "./GlobalSpatialTopbar"
import ModuleContextPanel from "./ModuleContextPanel"
import { openModuleIntent, returnToCoreIntent } from "./navigation/spatialNavigation"
import { MODULE_REGISTRY } from "./modules/moduleRegistry"
import { resolveVisibleModules } from "./modules/moduleModel"
import "../../styles/v2-tokens.css"
import "./v2-app.css"

// Layer 9: the permanent V2 Spatial Application shell.
//
//   V2SpatialApp
//   ├── background (solid theme surface; in-scene atmosphere comes from runtime)
//   ├── SpatialAppRuntime (lazy: MotionProvider + shared SpatialStage)
//   │    ├── GlobalSpatialTopbar (render prop, reads the motion engine)
//   │    └── overlay layer (render prop)
//   └── fallback layer (no WebGL / runtime failure): topbar + accessible content
const SpatialAppRuntime = lazy(() => import("../../spatial/runtime").then((module) => ({ default: module.SpatialAppRuntime })))

class RuntimeBoundary extends Component {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() { return this.state.failed ? this.props.fallback : this.props.children }
}

export default function V2SpatialApp({ coreDetail = "", financialData = {}, initialModuleId = null, initialSubmoduleId = null, onNavigationChange, onOpenAction, onOpenClassic, onOpenWorkspace, onSignOut, profile, settings = {}, updateSetting, user }) {
  const [capabilities] = useState(() => detectRenderingCapabilities())
  const [selectedSubmoduleId, setSelectedSubmoduleId] = useState(initialSubmoduleId)
  const notifications = useFinancialNotifications({ ...financialData, billLeadTimeDays: settings.notificationPreferences?.billLeadTimeDays })
  // Layer 11: everything spatial derives from the registry.
  const modules = useMemo(() => resolveVisibleModules(MODULE_REGISTRY, { flags: featureFlags }), [])
  const scene = useMemo(() => createModuleSpatialScene({ modules, core: { label: "Money Mind", detail: coreDetail } }), [modules, coreDetail])
  const settingsModule = modules.find((module) => module.shortcut === "settings")
  const hydratedModuleId = modules.some((module) => module.id === initialModuleId) ? initialModuleId : null
  useEffect(() => setSelectedSubmoduleId(initialSubmoduleId), [initialSubmoduleId])
  const topbarProps = {
    displayName: profile?.displayName || user?.displayName,
    email: user?.email,
    language: settings.language || "en",
    notifications,
    onLanguageChange: (value) => updateSetting?.("language", value),
    onOpenClassic,
    onSignOut,
  }

  const fallback = (reason) => (
    <>
      <GlobalSpatialTopbar {...topbarProps} />
      <section className="v2-fallback" data-testid="v2-fallback" aria-labelledby="v2-fallback-title">
        <h1 id="v2-fallback-title">Money Mind</h1>
        <p>{reason === "webgl" ? "This device cannot run the 3D universe (WebGL is unavailable)." : "The 3D universe could not start."} Your finances stay fully available in Classic view.</p>
        <button className="v2-primary-button" data-testid="v2-fallback-classic" onClick={onOpenClassic} type="button">Open Classic view</button>
      </section>
    </>
  )

  const topbar = ({ engine, requestedQuality, setRequestedQuality }) => (
    <GlobalSpatialTopbar
      {...topbarProps}
      onOpenSettings={settingsModule ? () => engine.dispatchIntent(openModuleIntent(settingsModule.id)) : undefined}
      onOverview={() => engine.dispatchIntent(returnToCoreIntent())}
      overviewDisabled={!engine.selectedId}
      quality={{ onChange: setRequestedQuality, options: QUALITY_OPTIONS, value: requestedQuality }}
    />
  )

  return (
    <main className="v2-app" data-testid="v2-app" aria-label="Money Mind">
      <div aria-hidden="true" className="v2-app__background" />
      {capabilities.webGL ? (
        <RuntimeBoundary fallback={fallback("runtime")}>
          <Suspense fallback={<p className="v2-loading" role="status">Entering the Money Mind universe…</p>}>
            <SpatialAppRuntime
              capabilities={capabilities}
              initialSelectedId={hydratedModuleId}
              motionPreference={resolveMotionPreference(capabilities)}
              renderingQuality="auto"
              overlay={({ engine }) => (
                <ModuleContextPanel
                  coreId={MONEY_MIND_CORE_ID}
                  engine={engine}
                  modules={modules}
                  onNavigationChange={onNavigationChange}
                  onOpenAction={onOpenAction}
                  onOpenWorkspace={onOpenWorkspace}
                  onSelectSubmodule={setSelectedSubmoduleId}
                  selectedSubmoduleId={selectedSubmoduleId}
                />
              )}
              scene={scene}
              topbar={topbar}
            />
          </Suspense>
        </RuntimeBoundary>
      ) : fallback("webgl")}
    </main>
  )
}
