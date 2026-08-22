import { useFrame } from "@react-three/fiber"
import { useEffect, useRef } from "react"
import { useMotionEngine } from "../../../motion/core/motionContext"
import { clearHoverIntent, hoverNodeIntent, selectNodeIntent } from "../../../motion/input/motionIntents"
import { resolveNodeMotion } from "../../../motion/nodes/nodeMotion"
import { dampValue } from "../../../motion/performance/animationBudget"
import { nodePalette } from "./nodeMaterials"

export default function SpatialNode({ geometry, index, node }) {
  const mesh = useRef(null)
  const material = useRef(null)
  const { activeTransition, dispatchIntent, getTransitionProgress, hoveredId, policy, selectedId } = useMotionEngine()
  const hovered = hoveredId === node.id
  const selected = selectedId === node.id
  const palette = nodePalette(node)
  const baseScale = node.kind === "core" ? 1 : 0.58

  useEffect(() => () => {
    document.body.style.cursor = ""
  }, [])

  useFrame((_, delta) => {
    if (!mesh.current || !material.current) return
    const target = resolveNodeMotion({ activeTransition, hovered, index, kind: node.kind, policy, progress: getTransitionProgress(), selected, selectedId })
    mesh.current.scale.setScalar(dampValue(mesh.current.scale.x, target.scale, policy.nodeDamping, delta))
    mesh.current.position.x = dampValue(mesh.current.position.x, node.position[0] * target.radialScale, policy.radialDamping, delta)
    mesh.current.position.y = dampValue(mesh.current.position.y, node.position[1] * target.radialScale, policy.radialDamping, delta)
    mesh.current.position.z = dampValue(mesh.current.position.z, node.position[2] * target.radialScale, policy.radialDamping, delta)
    material.current.emissiveIntensity = dampValue(material.current.emissiveIntensity, target.emissive, policy.nodeDamping, delta)
    material.current.opacity = dampValue(material.current.opacity, target.opacity, policy.nodeDamping, delta)
  })

  return (
    <mesh
      ref={mesh}
      geometry={geometry}
      position={node.position}
      scale={baseScale}
      onClick={(event) => {
        event.stopPropagation()
        dispatchIntent(selectNodeIntent(node.id))
      }}
      onPointerEnter={(event) => {
        event.stopPropagation()
        dispatchIntent(hoverNodeIntent(node.id))
        document.body.style.cursor = "pointer"
      }}
      onPointerLeave={() => {
        dispatchIntent(clearHoverIntent())
        document.body.style.cursor = ""
      }}
    >
      <meshStandardMaterial
        ref={material}
        color={palette.base}
        emissive={palette.emissive}
        emissiveIntensity={0.38}
        metalness={0.42}
        opacity={1}
        roughness={0.28}
        transparent
      />
    </mesh>
  )
}
