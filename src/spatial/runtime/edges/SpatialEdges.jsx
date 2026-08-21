import { useMemo } from "react"
import { useSpatialInteraction } from "../interaction/interactionContext"

function SpatialEdge({ active, positions }) {
  const positionBuffer = useMemo(() => new Float32Array(positions), [positions])
  return (
    <line>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positionBuffer, 3]} count={2} />
      </bufferGeometry>
      <lineBasicMaterial color={active ? "#a9c8ef" : "#45617e"} opacity={active ? 0.82 : 0.32} transparent />
    </line>
  )
}

export default function SpatialEdges({ edges, nodes }) {
  const { hoveredId, selectedId } = useSpatialInteraction()
  const resolvedEdges = useMemo(() => {
    const nodeById = new Map(nodes.map((node) => [node.id, node]))
    return edges.flatMap((edge) => {
      const source = nodeById.get(edge.sourceId)
      const target = nodeById.get(edge.targetId)
      return source && target ? [{ ...edge, positions: [...source.position, ...target.position] }] : []
    })
  }, [edges, nodes])

  return resolvedEdges.map((edge) => (
    <SpatialEdge
      active={[edge.sourceId, edge.targetId].includes(selectedId || hoveredId)}
      key={edge.id}
      positions={edge.positions}
    />
  ))
}
