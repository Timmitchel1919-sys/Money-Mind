import { useThree } from "@react-three/fiber"
import CameraRig from "../camera/CameraRig"
import SpatialEdges from "../edges/SpatialEdges"
import SpatialLighting from "../lighting/SpatialLighting"
import NodeGroup from "../nodes/NodeGroup"
import { SPATIAL_RUNTIME_CONFIG } from "../core/runtimeConfig"

export default function SpatialScene({ motionPreference, quality, scene }) {
  const { size } = useThree()
  const responsiveScale = size.width < 560 ? 0.78 : size.width < 900 ? 0.9 : 1

  return (
    <>
      <color attach="background" args={[SPATIAL_RUNTIME_CONFIG.background]} />
      <fog attach="fog" args={[SPATIAL_RUNTIME_CONFIG.background, 9, 18]} />
      <CameraRig motionPreference={motionPreference} nodes={scene.nodes} />
      <SpatialLighting mode={quality.lighting} />
      <group scale={responsiveScale}>
        <SpatialEdges edges={scene.edges} nodes={scene.nodes} />
        <NodeGroup detail={quality.detail} motionPreference={motionPreference} nodes={scene.nodes} />
      </group>
    </>
  )
}
