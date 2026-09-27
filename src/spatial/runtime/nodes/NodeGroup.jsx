import { useEffect, useMemo } from "react"
import { IcosahedronGeometry, SphereGeometry } from "three"
import MoneyMindCore from "./MoneyMindCore"
import SpatialNode from "./SpatialNode"

export default function NodeGroup({ detail, lighting, nodes }) {
  const geometries = useMemo(() => ({
    core: new IcosahedronGeometry(0.88, Math.min(detail + 1, 4)),
    radial: new SphereGeometry(0.72, detail === 1 ? 16 : 24, detail === 1 ? 12 : 18),
    child: new SphereGeometry(0.72, 16, 12),
  }), [detail])

  useEffect(() => () => {
    geometries.core.dispose()
    geometries.radial.dispose()
    geometries.child.dispose()
  }, [geometries])

  return nodes.map((node, index) => node.visual === "money-mind-core" ? (
    // Layer 10: the V2 application's Core has its own visual; everything else is a SpatialNode.
    <MoneyMindCore detail={detail} index={index} key={node.id} lighting={lighting} node={node} />
  ) : (
    <SpatialNode
      geometry={node.kind === "core" ? geometries.core : node.kind === "child" ? geometries.child : geometries.radial}
      key={node.id}
      index={index}
      lighting={lighting}
      node={node}
    />
  ))
}
