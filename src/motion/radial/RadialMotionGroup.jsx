import { useFrame } from "@react-three/fiber"
import { useRef } from "react"
import { useMotionEngine } from "../core/motionContext"
import { dampValue } from "../performance/animationBudget"
import { resolveRadialTarget } from "./radialMotion"

export function RadialMotionGroup({ children }) {
  const group = useRef(null)
  const { policy, sceneState, selectedId } = useMotionEngine()
  const target = resolveRadialTarget(sceneState, selectedId)

  useFrame((_, delta) => {
    if (!group.current) return
    group.current.rotation.z = dampValue(group.current.rotation.z, target.rotation, policy.radialDamping, delta)
  })

  return <group ref={group}>{children}</group>
}
