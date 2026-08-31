import { assertSpatialScene } from "./financialVisualizationAdapter"
import { createRadialPositions } from "../radial/createRadialPositions"

// Domain identity, order and tone stay in lockstep with proofFinancialDomains
// (../mock/proofFinancialDomains.js) so the runtime palette
// (runtime/nodes/nodeMaterials.nodePalette) and radial camera layout are
// unchanged. Layer 4 swaps the mock's uniform placeholders for the signed-in
// user's real per-domain totals and relative magnitudes; Layer 5 adds one level
// of child nodes per domain (a line-item graph) when the model carries them.
const DOMAIN_ORDER = Object.freeze([
  { id: "income", label: "Income", tone: "positive" },
  { id: "investments", label: "Investments", tone: "growth" },
  { id: "assets", label: "Assets", tone: "stable" },
  { id: "debt", label: "Debt", tone: "liability" },
  { id: "expenses", label: "Expenses", tone: "outflow" },
  { id: "savings", label: "Savings", tone: "reserve" },
])

// A domain (or child) with little or no money still renders a visible node.
const MIN_MAGNITUDE = 0.35
const MIN_CHILD_MAGNITUDE = 0.55
const RADIAL_RADIUS = 3.15
const CHILD_RADIUS = 1.2

function magnitudeOf(amount) {
  const value = Number(amount)
  return Number.isFinite(value) ? Math.abs(value) : 0
}

function clampMagnitude(value, floor) {
  return Math.min(1, Math.max(floor, value))
}

// Child nodes ring their parent domain node's world position.
function childNodesFor(domain, domainPosition, children) {
  const kids = Array.isArray(children) ? children : []
  if (kids.length === 0) return { nodes: [], edges: [] }

  const magnitudes = kids.map((child) => magnitudeOf(child.amount))
  const peak = Math.max(0, ...magnitudes)
  const ring = createRadialPositions({ count: kids.length, radius: CHILD_RADIUS })

  const nodes = kids.map((child, index) => {
    const [ox, oy, oz] = ring[index]
    return Object.freeze({
      id: `${domain.id}-item-${index}`,
      label: child.label || `Item ${index + 1}`,
      tone: domain.tone,
      domain: "financial",
      kind: "child",
      parentId: domain.id,
      entityId: child.id != null ? String(child.id) : `${domain.id}-item-${index}`,
      detail: child.detail || "",
      amount: magnitudes[index],
      magnitude: peak > 0 ? clampMagnitude(magnitudes[index] / peak, MIN_CHILD_MAGNITUDE) : 1,
      position: Object.freeze([domainPosition[0] + ox, domainPosition[1] + oy, domainPosition[2] + oz]),
    })
  })

  const edges = nodes.map((node) => Object.freeze({
    id: `${node.id}-edge`,
    sourceId: domain.id,
    targetId: node.id,
    relationship: "domain-item",
  }))

  return { nodes, edges }
}

/**
 * Pure adapter: a normalized financial model -> a renderer-neutral SpatialScene.
 * Never touches Firebase and never formats currency itself — the caller passes
 * the already-formatted `detail` strings (presentation stays in the app layer,
 * see ADR-0002).
 *
 * model = {
 *   core?:    { label?: string, detail?: string, healthScore?: number },
 *   domains?: { [id in DOMAIN_ORDER.id]?: {
 *     amount?: number, detail?: string,
 *     children?: { id, label, amount, detail? }[]   // Layer 5, optional
 *   } },
 * }
 *
 * @param {object} [model]
 * @returns {import("../../spatial/contracts.js").SpatialScene}
 */
export function createFinancialSpatialScene(model) {
  const domainsInput = (model && model.domains) || {}
  const magnitudes = DOMAIN_ORDER.map((domain) => magnitudeOf(domainsInput[domain.id]?.amount))
  const peak = Math.max(0, ...magnitudes)

  const positions = createRadialPositions({ count: DOMAIN_ORDER.length, radius: RADIAL_RADIUS })

  const core = Object.freeze({
    id: "financial-core",
    label: model?.core?.label || "Money Mind",
    detail: model?.core?.detail || "Financial Core",
    domain: "financial",
    kind: "core",
    healthScore: Number.isFinite(model?.core?.healthScore) ? model.core.healthScore : null,
    position: Object.freeze([0, 0, 0]),
  })

  const childNodes = []
  const childEdges = []

  const radialNodes = DOMAIN_ORDER.map((domain, index) => {
    const input = domainsInput[domain.id] || {}
    const { nodes, edges } = childNodesFor(domain, positions[index], input.children)
    childNodes.push(...nodes)
    childEdges.push(...edges)
    return Object.freeze({
      id: domain.id,
      label: domain.label,
      tone: domain.tone,
      domain: "financial",
      kind: "radial",
      entityId: domain.id,
      detail: input.detail || "",
      amount: magnitudes[index],
      // Relative to the largest domain so the scene reads spatially; uniform
      // when there is no data yet (new user, or the signed-out demo scene).
      magnitude: peak > 0 ? clampMagnitude(magnitudes[index] / peak, MIN_MAGNITUDE) : 1,
      childCount: nodes.length,
      position: positions[index],
    })
  })

  const domainEdges = DOMAIN_ORDER.map((domain) => Object.freeze({
    id: `core-${domain.id}`,
    sourceId: core.id,
    targetId: domain.id,
    relationship: "financial-domain",
  }))

  const scene = Object.freeze({
    id: "money-mind-financial",
    nodes: Object.freeze([core, ...radialNodes, ...childNodes]),
    edges: Object.freeze([...domainEdges, ...childEdges]),
  })

  assertSpatialScene(scene)
  return scene
}
