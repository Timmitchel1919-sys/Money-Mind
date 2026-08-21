import { Canvas, useThree } from "@react-three/fiber"
import { useEffect } from "react"
import { useSpatialInteraction } from "../interaction/interactionContext"
import SpatialScene from "../scene/SpatialScene"
import { SPATIAL_RUNTIME_CONFIG } from "./runtimeConfig"

function ContextLifecycle({ onContextStateChange }) {
  const { gl } = useThree()

  useEffect(() => {
    const canvas = gl.domElement
    const handleLost = (event) => {
      event.preventDefault()
      onContextStateChange("lost")
    }
    const handleRestored = () => onContextStateChange("ready")
    canvas.addEventListener("webglcontextlost", handleLost)
    canvas.addEventListener("webglcontextrestored", handleRestored)
    return () => {
      canvas.removeEventListener("webglcontextlost", handleLost)
      canvas.removeEventListener("webglcontextrestored", handleRestored)
    }
  }, [gl, onContextStateChange])

  return null
}

export default function SpatialCanvas({ motionPreference, onContextStateChange, quality, scene }) {
  const { resetSelection } = useSpatialInteraction()

  return (
    <Canvas
      camera={{
        position: SPATIAL_RUNTIME_CONFIG.camera.overview,
        fov: SPATIAL_RUNTIME_CONFIG.camera.fov,
        near: SPATIAL_RUNTIME_CONFIG.camera.near,
        far: SPATIAL_RUNTIME_CONFIG.camera.far,
      }}
      dpr={quality.dpr}
      fallback={<p role="status">Spatial rendering is unavailable. Use the standard dashboard instead.</p>}
      frameloop="always"
      gl={{
        antialias: quality.antialias,
        alpha: false,
        powerPreference: quality.id === "low" ? "default" : "high-performance",
      }}
      onCreated={({ gl }) => {
        gl.outputColorSpace = "srgb"
        gl.setClearColor(SPATIAL_RUNTIME_CONFIG.background, 1)
        onContextStateChange("ready")
      }}
      onPointerMissed={resetSelection}
    >
      <ContextLifecycle onContextStateChange={onContextStateChange} />
      <SpatialScene motionPreference={motionPreference} quality={quality} scene={scene} />
    </Canvas>
  )
}
