import { Component, lazy, Suspense, useMemo, useState } from "react"
import { featureFlags } from "../core/feature-flags/featureFlags"
import { detectRenderingCapabilities } from "./performance/capabilities"
import { createProofSpatialScene } from "../visualization/adapters/createProofSpatialScene"
import { createFinancialSpatialScene } from "../visualization/adapters/financialSpatialAdapter"
import "./spatial-fallback.css"

const SpatialRuntime = lazy(() => import("./runtime"))
const MOTION_PREFERENCES = new Set(["full", "reduced", "minimal", "off"])

function resolveMotionPreference(capabilities) {
  const detectedPreference = capabilities.reducedMotion ? "reduced" : "full"
  if (!import.meta.env.DEV) return detectedPreference

  const requestedPreference = new URLSearchParams(window.location.search).get("spatialMotion")
  return MOTION_PREFERENCES.has(requestedPreference) ? requestedPreference : detectedPreference
}

function SpatialFallback({ reason }) {
  const detail = reason === "webgl"
    ? "This device cannot initialize WebGL. Your financial information remains available in the standard dashboard."
    : "The spatial view could not start. Your financial information remains available in the standard dashboard."

  return (
    <section className="spatial-capability-fallback" aria-labelledby="spatial-fallback-title">
      <h2 id="spatial-fallback-title">Spatial view unavailable</h2>
      <p>{detail}</p>
    </section>
  )
}

class SpatialErrorBoundary extends Component {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    return this.state.failed ? <SpatialFallback reason="initialization" /> : this.props.children
  }
}

export default function SpatialExperience({ model = null }) {
  const [capabilities] = useState(() => detectRenderingCapabilities())
  // Real per-user finances when a model is supplied (signed in); the mock
  // proof scene otherwise (signed-out demo surface).
  const scene = useMemo(
    () => (model ? createFinancialSpatialScene(model) : createProofSpatialScene()),
    [model],
  )

  if (!featureFlags.v2SpatialUI) return null
  if (!capabilities.webGL) return <SpatialFallback reason="webgl" />

  return (
    <SpatialErrorBoundary>
      <Suspense fallback={<section className="panel" role="status">Loading spatial experience…</section>}>
        <SpatialRuntime
          capabilities={capabilities}
          motionPreference={resolveMotionPreference(capabilities)}
          renderingQuality="auto"
          scene={scene}
        />
      </Suspense>
    </SpatialErrorBoundary>
  )
}
