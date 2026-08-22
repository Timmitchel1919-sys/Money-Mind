import { useFrame, useThree } from "@react-three/fiber"
import { useMemo } from "react"
import { Vector3 } from "three"
import { resolveCameraMotion } from "../../../motion/camera/cameraMotion"
import { useMotionEngine } from "../../../motion/core/motionContext"

export default function CameraRig({ nodes }) {
  const { camera, size } = useThree()
  const { policy, selectedId } = useMotionEngine()
  const selectedNode = nodes.find((node) => node.id === selectedId)
  const state = resolveCameraMotion({ selectedPosition: selectedNode?.position, mobile: size.width < 720, policy })
  const desiredPosition = useMemo(() => new Vector3(...state.position), [state.position])
  const desiredTarget = useMemo(() => new Vector3(...state.target), [state.target])
  const currentTarget = useMemo(() => new Vector3(0, 0, 0), [])

  useFrame((_, delta) => {
    const speed = policy.cameraDamping
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
