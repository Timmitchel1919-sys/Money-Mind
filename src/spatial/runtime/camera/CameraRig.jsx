import { useFrame, useThree } from "@react-three/fiber"
import { useMemo } from "react"
import { Vector3 } from "three"
import { useSpatialInteraction } from "../interaction/interactionContext"
import { calculateCameraState } from "./cameraUtils"

const MOTION_SPEED = Object.freeze({ full: 4.4, reduced: 10, minimal: 24, off: Infinity })

export default function CameraRig({ motionPreference, nodes }) {
  const { camera, size } = useThree()
  const { selectedId } = useSpatialInteraction()
  const selectedNode = nodes.find((node) => node.id === selectedId)
  const state = calculateCameraState({ selectedPosition: selectedNode?.position, mobile: size.width < 720 })
  const desiredPosition = useMemo(() => new Vector3(...state.position), [state.position])
  const desiredTarget = useMemo(() => new Vector3(...state.target), [state.target])
  const currentTarget = useMemo(() => new Vector3(0, 0, 0), [])

  useFrame((_, delta) => {
    const speed = MOTION_SPEED[motionPreference] ?? MOTION_SPEED.reduced
    if (speed === Infinity) {
      camera.position.copy(desiredPosition)
      currentTarget.copy(desiredTarget)
    } else {
      const alpha = 1 - Math.exp(-speed * delta)
      camera.position.lerp(desiredPosition, alpha)
      currentTarget.lerp(desiredTarget, alpha)
    }
    camera.lookAt(currentTarget)
  })

  return null
}
