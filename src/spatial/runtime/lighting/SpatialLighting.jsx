import { useThree } from "@react-three/fiber"
import { useEffect } from "react"
import { PMREMGenerator } from "three"
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js"

// Chapter 7 (Spatial Financial Universe): glossy nodes need something to
// reflect. `environment` is the intensity of a prefiltered RoomEnvironment
// (shipped inside the `three` package — no extra dependency, no post-processing)
// used only for PBR reflections; the scene background colour is unchanged.
// It degrades with quality: none on "basic" (low), softer on "standard".
const LIGHTING = Object.freeze({
  basic: { ambient: 0.7, key: 18, rim: 0, environment: 0 },
  standard: { ambient: 0.5, key: 24, rim: 12, environment: 0.55 },
  enhanced: { ambient: 0.42, key: 28, rim: 16, environment: 0.85 },
})

function useRoomEnvironment(intensity) {
  const gl = useThree((state) => state.gl)
  const scene = useThree((state) => state.scene)
  useEffect(() => {
    if (!(intensity > 0)) return undefined
    const pmrem = new PMREMGenerator(gl)
    const room = new RoomEnvironment()
    const target = pmrem.fromScene(room, 0.04)
    scene.environment = target.texture
    scene.environmentIntensity = intensity
    room.dispose()
    pmrem.dispose()
    return () => {
      if (scene.environment === target.texture) scene.environment = null
      target.dispose()
    }
  }, [gl, scene, intensity])
}

export default function SpatialLighting({ mode = "standard" }) {
  const config = LIGHTING[mode] || LIGHTING.standard
  useRoomEnvironment(config.environment)
  return (
    <>
      <ambientLight intensity={config.ambient} color="#b9c8e6" />
      <pointLight position={[4, 5, 6]} intensity={config.key} color="#e6efff" distance={18} />
      {config.rim > 0 ? <pointLight position={[-5, -2, 2]} intensity={config.rim} color="#5b7fd6" distance={16} /> : null}
    </>
  )
}
