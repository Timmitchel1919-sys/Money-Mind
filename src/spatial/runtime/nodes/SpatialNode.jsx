import { useFrame } from "@react-three/fiber"
import { MathUtils } from "three"
import { useEffect, useRef } from "react"
import { useSpatialInteraction } from "../interaction/interactionContext"
import { nodePalette } from "./nodeMaterials"

export default function SpatialNode({ geometry, motionPreference, node }) {
  const mesh = useRef(null)
  const material = useRef(null)
  const { hoveredId, selectedId, setHoveredId, toggleSelection } = useSpatialInteraction()
  const hovered = hoveredId === node.id
  const selected = selectedId === node.id
  const muted = Boolean(selectedId && !selected)
  const palette = nodePalette(node)
  const baseScale = node.kind === "core" ? 1 : 0.58
  const targetScale = baseScale * (selected ? 1.2 : hovered ? 1.1 : 1)

  useEffect(() => () => {
    document.body.style.cursor = ""
  }, [])

  useFrame((_, delta) => {
    if (!mesh.current || !material.current) return
    const speed = motionPreference === "full" ? 8 : motionPreference === "reduced" ? 16 : Infinity
    const next = speed === Infinity ? targetScale : MathUtils.damp(mesh.current.scale.x, targetScale, speed, delta)
    mesh.current.scale.setScalar(next)
    material.current.emissiveIntensity = speed === Infinity
      ? (selected ? 1.05 : hovered ? 0.78 : 0.38)
      : MathUtils.damp(material.current.emissiveIntensity, selected ? 1.05 : hovered ? 0.78 : 0.38, speed, delta)
    material.current.opacity = muted ? 0.48 : 1
  })

  return (
    <mesh
      ref={mesh}
      geometry={geometry}
      position={node.position}
      scale={baseScale}
      onClick={(event) => {
        event.stopPropagation()
        toggleSelection(node.id)
      }}
      onPointerEnter={(event) => {
        event.stopPropagation()
        setHoveredId(node.id)
        document.body.style.cursor = "pointer"
      }}
      onPointerLeave={() => {
        setHoveredId(null)
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
