import { useFrame } from "@react-three/fiber"
import { Color } from "three"
import { useMemo, useRef } from "react"
import { useMotionEngine } from "../../../motion/core/motionContext"
import { resolveEdgeMotion } from "../../../motion/edges/edgeMotion"
import { dampValue } from "../../../motion/performance/animationBudget"

function SpatialEdge({ active, connectedToSelection, positions, revealed = true }) {
  const positionBuffer = useMemo(() => new Float32Array(positions), [positions])
  const material = useRef(null)
  const targetColor = useMemo(() => new Color(), [])
  const { activeTransition, getTransitionProgress, policy, selectedId } = useMotionEngine()

  useFrame((_, delta) => {
    if (!material.current) return
    const target = resolveEdgeMotion({ active, activeTransition, connectedToSelection, policy, progress: getTransitionProgress(), selectedId })
    material.current.opacity = dampValue(material.current.opacity, revealed ? target.opacity : 0, policy.edgeDamping, delta)
    targetColor.set(target.color)
    material.current.color.lerp(targetColor, policy.edgeDamping === Infinity ? 1 : 1 - Math.exp(-policy.edgeDamping * delta))
  })
  return (
    <line>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positionBuffer, 3]} count={2} />
      </bufferGeometry>
      <lineBasicMaterial ref={material} color="#45617e" opacity={0} transparent />
    </line>
  )
}

export default function SpatialEdges({ edges, nodes }) {
  const { hoveredId, selectedId } = useMotionEngine()
  const resolvedEdges = useMemo(() => {
    const nodeById = new Map(nodes.map((node) => [node.id, node]))
    return edges.flatMap((edge) => {
      const source = nodeById.get(edge.sourceId)
      const target = nodeById.get(edge.targetId)
      return source && target ? [{ ...edge, positions: [...source.position, ...target.position] }] : []
    })
  }, [edges, nodes])

  return resolvedEdges.map((edge) => {
    // Layer 5: a domain->item edge is hidden unless that domain, or the item
    // itself, is selected.
    const childEdge = edge.relationship === "domain-item"
    const revealed = !childEdge || selectedId === edge.sourceId || selectedId === edge.targetId
    return (
      <SpatialEdge
        active={[edge.sourceId, edge.targetId].includes(selectedId || hoveredId)}
        connectedToSelection={Boolean(selectedId && [edge.sourceId, edge.targetId].includes(selectedId))}
        key={edge.id}
        positions={edge.positions}
        revealed={revealed}
      />
    )
  })
}
