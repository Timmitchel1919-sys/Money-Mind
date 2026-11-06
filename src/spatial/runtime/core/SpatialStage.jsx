import { useCallback, useState } from "react"
import { useMotionEngine } from "../../../motion/core/motionContext"
import NodeLabels from "../nodes/NodeLabels"
import SpatialCanvas from "./SpatialCanvas"

// The one spatial stage: WebGL canvas + accessible DOM label layer + context-loss
// notice. Shared by the financial workspace (SpatialRuntime) and the V2 Spatial
// Application (SpatialAppRuntime), so both run on the same runtime.
export default function SpatialStage({ children = null, className = "", lostMessage, quality, scene, status = null }) {
  const [contextState, setContextState] = useState("initializing")
  const { activeTransition, sceneState } = useMotionEngine()
  const handleContextStateChange = useCallback((state) => setContextState(state), [])

  return (
    <div className={`spatial-stage${className ? ` ${className}` : ""}`} data-active-transition={activeTransition?.name || "none"} data-context-state={contextState} data-scene-state={sceneState} data-testid="spatial-stage">
      <SpatialCanvas onContextStateChange={handleContextStateChange} quality={quality} scene={scene} />
      <NodeLabels nodes={scene.nodes} />
      {status}
      {contextState === "lost" ? (
        <div className="spatial-context-notice" role="alert">{lostMessage}</div>
      ) : null}
      {children}
    </div>
  )
}
