import { useFrame } from "@react-three/fiber"
import { useEffect, useMemo, useRef } from "react"
import { Color, Mesh } from "three"
import { useMotionEngine } from "../../../motion/core/motionContext"
import { clearHoverIntent, hoverNodeIntent, selectNodeIntent } from "../../../motion/input/motionIntents"
import { resolveNodeMotion } from "../../../motion/nodes/nodeMotion"
import { dampValue } from "../../../motion/performance/animationBudget"
import { nodeMaterialTier, nodePalette } from "./nodeMaterials"

// Toggle between two REAL functions. R3F ignores an `undefined` prop, so flipping
// `raycast` back to `undefined` would not restore the default method once it had
// been set to a no-op — the node would stay permanently unclickable.
const HIT_RAYCAST = Mesh.prototype.raycast
const NO_RAYCAST = () => null

// Touch has no real hover: a tap would leave the spotlight stuck on, dimming
// every other node. Only mouse/pen pointers hover; taps select (onClick).
const canHover = (event) => event.pointerType !== "touch"

export default function SpatialNode({ geometry, index, lighting, node }) {
  const mesh = useRef(null)
  const material = useRef(null)
  const brightness = useRef(1)
  const { activeTransition, dispatchIntent, getTransitionProgress, hoveredId, policy, selectedId } = useMotionEngine()
  const hovered = hoveredId === node.id
  const selected = selectedId === node.id
  const palette = nodePalette(node)
  const tier = nodeMaterialTier(lighting)
  // Allocated once per palette; the frame loop only copies/scales it.
  const baseColor = useMemo(() => new Color(palette.base), [palette.base])
  // Layer 4: the adapter emits a normalized magnitude (share of the peer group).
  // Applied here as a renderer-side multiplier so the Layer 3 motion policy stays
  // proportional — only each node's resting size differs.
  const magnitude = Number.isFinite(node.magnitude) ? node.magnitude : 1
  // Layer 5: a child node stays collapsed and inert until its parent domain (or
  // the child itself) is selected.
  const isChild = node.kind === "child"
  const revealed = !isChild || selectedId === node.parentId || selected
  const kindBase = node.kind === "core" ? 1 : isChild ? 0.52 : 0.58
  const baseScale = isChild && !revealed ? 0.0001 : kindBase * magnitude

  useEffect(() => () => {
    document.body.style.cursor = ""
  }, [])

  useFrame((_, delta) => {
    if (!mesh.current || !material.current) return
    const target = resolveNodeMotion({ activeTransition, hovered, hoveredId, index, kind: node.kind, parentId: node.parentId, policy, progress: getTransitionProgress(), revealed, selected, selectedId })
    mesh.current.scale.setScalar(dampValue(mesh.current.scale.x, target.scale * magnitude, policy.nodeDamping, delta))
    mesh.current.position.x = dampValue(mesh.current.position.x, node.position[0] * target.radialScale, policy.radialDamping, delta)
    mesh.current.position.y = dampValue(mesh.current.position.y, node.position[1] * target.radialScale, policy.radialDamping, delta)
    mesh.current.position.z = dampValue(mesh.current.position.z, node.position[2] * target.radialScale, policy.radialDamping, delta)
    material.current.emissiveIntensity = dampValue(material.current.emissiveIntensity, target.emissive, policy.nodeDamping, delta)
    material.current.opacity = dampValue(material.current.opacity, target.opacity, policy.nodeDamping, delta)
    // Chapter 7 hover spotlight: surface brightness damped with the same policy.
    brightness.current = dampValue(brightness.current, target.brightness, policy.nodeDamping, delta)
    material.current.color.copy(baseColor).multiplyScalar(brightness.current)
  })

  return (
    <mesh
      ref={mesh}
      geometry={geometry}
      position={node.position}
      scale={baseScale}
      raycast={isChild && !revealed ? NO_RAYCAST : HIT_RAYCAST}
      onClick={(event) => {
        event.stopPropagation()
        dispatchIntent(selectNodeIntent(node.id))
      }}
      onPointerEnter={(event) => {
        event.stopPropagation()
        if (!canHover(event)) return
        dispatchIntent(hoverNodeIntent(node.id))
        document.body.style.cursor = "pointer"
      }}
      onPointerLeave={() => {
        dispatchIntent(clearHoverIntent())
        document.body.style.cursor = ""
      }}
    >
      {tier.physical ? (
        <meshPhysicalMaterial
          ref={material}
          clearcoat={tier.clearcoat}
          clearcoatRoughness={tier.clearcoatRoughness}
          color={palette.base}
          emissive={palette.emissive}
          emissiveIntensity={0.42}
          metalness={tier.metalness}
          opacity={1}
          roughness={tier.roughness}
          specularIntensity={tier.specularIntensity}
          transparent
        />
      ) : (
        <meshStandardMaterial
          ref={material}
          color={palette.base}
          emissive={palette.emissive}
          emissiveIntensity={0.42}
          metalness={tier.metalness}
          opacity={1}
          roughness={tier.roughness}
          transparent
        />
      )}
    </mesh>
  )
}
