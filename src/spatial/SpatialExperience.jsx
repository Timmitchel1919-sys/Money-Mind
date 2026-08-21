import { Component, lazy, Suspense, useState } from "react"
import { featureFlags } from "../core/feature-flags/featureFlags"
import { detectRenderingCapabilities } from "./performance/capabilities"

const SpatialRuntime = lazy(() => import("./runtime/SpatialRuntime"))

function SpatialFallback({ reason }) {
  const detail = reason === "webgl"
    ? "This device cannot initialize WebGL. Your financial information remains available in the standard dashboard."
    : "The spatial view could not start. Your financial information remains available in the standard dashboard."

  return (
    <section className="panel" aria-labelledby="spatial-fallback-title">
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

export default function SpatialExperience() {
  const [capabilities] = useState(() => detectRenderingCapabilities())

  if (!featureFlags.v2SpatialUI) return null
  if (!capabilities.webGL) return <SpatialFallback reason="webgl" />

  return (
    <SpatialErrorBoundary>
      <Suspense fallback={<section className="panel" role="status">Loading spatial experience…</section>}>
        <SpatialRuntime
          motionPreference={capabilities.reducedMotion ? "reduced" : "full"}
          renderingQuality={capabilities.mobileClass ? "low" : "auto"}
        />
      </Suspense>
    </SpatialErrorBoundary>
  )
}
