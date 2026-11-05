import { useEffect, useMemo, useState } from "react"
import { MotionProvider } from "../../../motion/core/MotionProvider"
import { useMotionEngine } from "../../../motion/core/motionContext"
import { resetViewIntent } from "../../../motion/input/motionIntents"
import { resolveQualityPreset } from "../quality/qualityPresets"
import SpatialStage from "./SpatialStage"
import SplineStage from "../../spline/SplineStage"
import "../../../styles/v2-tokens.css"
import "../spatial-runtime.css"

// Layer 9: the V2 Spatial Application's viewport. Same MotionProvider, stage,
// canvas, camera, nodes, edges, lighting and quality presets as the financial
// workspace — only the chrome differs. App chrome (topbar, overlays) is passed
// in as render props so it can read the motion engine without owning it.
function SpatialAppFrame({ capabilities, initialQuality, overlay, scene, splineModules, topbar }) {
  const [requestedQuality, setRequestedQuality] = useState(initialQuality)
  const engine = useMotionEngine()
  const quality = useMemo(() => resolveQualityPreset(requestedQuality, capabilities), [capabilities, requestedQuality])
  const { dispatchIntent, selectedId } = engine

  // Keyboard return: Escape leaves the current selection (back to the Core).
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape" && selectedId) dispatchIntent(resetViewIntent())
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [dispatchIntent, selectedId])

  const context = { engine, quality, requestedQuality, setRequestedQuality }
  return (
    <>
      {topbar ? topbar(context) : null}
      {splineModules ? <SplineStage modules={splineModules} fallback={<SpatialStage className="spatial-stage--app" lostMessage="Rendering paused. Classic view remains available." quality={quality} scene={scene}>{overlay ? overlay(context) : null}</SpatialStage>}>
        {overlay ? overlay(context) : null}
      </SplineStage> : <SpatialStage
        className="spatial-stage--app"
        lostMessage="Rendering paused while the graphics context recovers. Classic view remains available from your profile menu."
        quality={quality}
        scene={scene}
      >
        {overlay ? overlay(context) : null}
      </SpatialStage>}
    </>
  )
}

export default function SpatialAppRuntime({ capabilities, initialSelectedId = null, motionPreference = "reduced", overlay = null, renderingQuality = "auto", scene, splineModules = null, topbar = null }) {
  return (
    <MotionProvider initialSelectedId={initialSelectedId} motionPreference={motionPreference}>
      <SpatialAppFrame capabilities={capabilities} initialQuality={renderingQuality} overlay={overlay} scene={scene} splineModules={splineModules} topbar={topbar} />
    </MotionProvider>
  )
}
