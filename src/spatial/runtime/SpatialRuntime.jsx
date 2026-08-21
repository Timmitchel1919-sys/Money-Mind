import { Canvas, useFrame } from "@react-three/fiber"
import { useRef } from "react"

const QUALITY_DPR = Object.freeze({ low: [1, 1], medium: [1, 1.25], high: [1, 1.5], ultra: [1, 2], auto: [1, 1.5] })

function FoundationScene({ motionPreference }) {
  const core = useRef(null)

  useFrame((_, delta) => {
    if (motionPreference === "full" && core.current) core.current.rotation.y += delta * 0.18
  })

  return (
    <>
      <ambientLight intensity={0.45} />
      <pointLight position={[3, 4, 5]} intensity={18} color="#66f0b3" />
      <mesh ref={core} aria-label="Money Mind spatial foundation core">
        <icosahedronGeometry args={[1, 2]} />
        <meshStandardMaterial color="#163b32" emissive="#2a8f6a" emissiveIntensity={0.55} roughness={0.32} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[2, 0.012, 8, 96]} />
        <meshBasicMaterial color="#66f0b3" transparent opacity={0.42} />
      </mesh>
    </>
  )
}

export default function SpatialRuntime({ motionPreference = "reduced", renderingQuality = "auto" }) {
  const dpr = QUALITY_DPR[renderingQuality] || QUALITY_DPR.auto

  return (
    <section aria-labelledby="spatial-foundation-title">
      <h2 id="spatial-foundation-title">Money Mind Spatial Foundation</h2>
      <div style={{ height: "min(68vh, 720px)", minHeight: 360, borderRadius: 24, overflow: "hidden", background: "#030712" }}>
        <Canvas
          camera={{ position: [0, 0, 5.5], fov: 45 }}
          dpr={dpr}
          fallback={<p role="status">Spatial rendering is unavailable. Use the standard dashboard instead.</p>}
          gl={{ antialias: renderingQuality !== "low", alpha: false, powerPreference: "high-performance" }}
        >
          <color attach="background" args={["#030712"]} />
          <FoundationScene motionPreference={motionPreference} />
        </Canvas>
      </div>
      <p>Foundation preview only. Financial information remains available through the standard dashboard.</p>
    </section>
  )
}
