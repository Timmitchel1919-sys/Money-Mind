import { useCallback, useMemo, useState } from "react"
import { MotionProvider } from "../../../motion/core/MotionProvider"
import { useMotionEngine } from "../../../motion/core/motionContext"
import { resetViewIntent } from "../../../motion/input/motionIntents"
import NodeLabels from "../nodes/NodeLabels"
import { QUALITY_OPTIONS, resolveQualityPreset } from "../quality/qualityPresets"
import SpatialCanvas from "./SpatialCanvas"
import "../../../styles/v2-tokens.css"
import "../spatial-runtime.css"

function SpatialWorkspace({ capabilities, initialQuality, motionPreference, scene }) {
  const [requestedQuality, setRequestedQuality] = useState(initialQuality)
  const [contextState, setContextState] = useState("initializing")
  const { activeTransition, dispatchIntent, sceneState, selectedId } = useMotionEngine()
  const quality = useMemo(() => resolveQualityPreset(requestedQuality, capabilities), [capabilities, requestedQuality])
  const selectedNode = scene.nodes.find((node) => node.id === selectedId)
  const handleContextStateChange = useCallback((state) => setContextState(state), [])
  const capabilityState = capabilities.webGL
    ? (capabilities.mobileClass || capabilities.reducedMotion ? "Degraded" : "Supported")
    : "Unsupported"

  return (
    <section className="spatial-workspace" aria-labelledby="spatial-runtime-title">
      <header className="spatial-toolbar">
        <div>
          <p className="spatial-toolbar__product">Money Mind V2</p>
          <h2 id="spatial-runtime-title">Spatial Financial Workspace</h2>
        </div>
        <div className="spatial-toolbar__controls" aria-label="Spatial workspace controls">
          <button className="spatial-control" disabled={!selectedId} onClick={() => dispatchIntent(resetViewIntent())} type="button">
            Overview
          </button>
          <button className="spatial-control" disabled={!selectedId} onClick={() => dispatchIntent(resetViewIntent())} type="button">
            Reset camera
          </button>
          <label className="spatial-quality-control">
            <span>Quality</span>
            <select aria-label="Rendering quality" onChange={(event) => setRequestedQuality(event.target.value)} value={requestedQuality}>
              {QUALITY_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
        </div>
      </header>

      <div className="spatial-stage" data-active-transition={activeTransition?.name || "none"} data-context-state={contextState} data-scene-state={sceneState}>
        <SpatialCanvas
          onContextStateChange={handleContextStateChange}
          quality={quality}
          scene={scene}
        />
        <NodeLabels nodes={scene.nodes} />
        <div className="spatial-stage__status" aria-live="polite">
          <span>{capabilityState}</span>
          <span>{quality.id} · DPR {quality.dpr[1]}</span>
          <span>{motionPreference} motion</span>
        </div>
        {contextState === "lost" ? (
          <div className="spatial-context-notice" role="alert">
            Rendering paused while the graphics context recovers. The standard dashboard remains available.
          </div>
        ) : null}
      </div>

      <footer className="spatial-inspector" aria-live="polite">
        <div>
          <span>Current focus</span>
          <strong>{selectedNode?.label || "Financial overview"}</strong>
        </div>
        {selectedNode?.detail ? <p className="spatial-inspector__amount">{selectedNode.detail}</p> : null}
        <p>{selectedNode ? `${selectedNode.label} is selected. Choose it again or use Overview to return.` : "Select a financial domain to test focus and camera control."}</p>
      </footer>
    </section>
  )
}

export default function SpatialRuntime({ capabilities, motionPreference = "reduced", renderingQuality = "auto", scene }) {
  if (!scene?.nodes?.length || !Array.isArray(scene.edges)) {
    return <section className="spatial-runtime-fallback" role="alert">The spatial model is unavailable. Use the standard dashboard instead.</section>
  }

  return (
    <MotionProvider motionPreference={motionPreference}>
      <SpatialWorkspace
        capabilities={capabilities}
        initialQuality={renderingQuality}
        motionPreference={motionPreference}
        scene={scene}
      />
    </MotionProvider>
  )
}
