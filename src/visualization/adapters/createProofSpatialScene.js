import { proofFinancialDomains } from "../mock/proofFinancialDomains"
import { createRadialPositions } from "../radial/createRadialPositions"

export function createProofSpatialScene() {
  const core = Object.freeze({
    id: "financial-core",
    label: "Money Mind",
    detail: "Financial Core",
    domain: "financial",
    kind: "core",
    position: Object.freeze([0, 0, 0]),
  })
  const positions = createRadialPositions({ count: proofFinancialDomains.length, radius: 3.15 })
  const nodes = [
    core,
    ...proofFinancialDomains.map((domain, index) => Object.freeze({
      ...domain,
      kind: "radial",
      position: positions[index],
    })),
  ]
  const edges = proofFinancialDomains.map((domain) => Object.freeze({
    id: `core-${domain.id}`,
    sourceId: core.id,
    targetId: domain.id,
    relationship: "financial-domain",
  }))

  return Object.freeze({ id: "money-mind-proof", nodes: Object.freeze(nodes), edges: Object.freeze(edges) })
}
