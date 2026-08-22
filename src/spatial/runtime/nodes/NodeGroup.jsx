import { useEffect, useMemo } from "react"
import { IcosahedronGeometry, SphereGeometry } from "three"
import SpatialNode from "./SpatialNode"

export default function NodeGroup({ detail, nodes }) {
  const geometries = useMemo(() => ({
    core: new IcosahedronGeometry(0.88, Math.min(detail + 1, 4)),
    radial: new SphereGeometry(0.72, detail === 1 ? 16 : 24, detail === 1 ? 12 : 18),
  }), [detail])

  useEffect(() => () => {
    geometries.core.dispose()
    geometries.radial.dispose()
  }, [geometries])

  return nodes.map((node, index) => (
    <SpatialNode
      geometry={node.kind === "core" ? geometries.core : geometries.radial}
      key={node.id}
      index={index}
      node={node}
    />
  ))
}
