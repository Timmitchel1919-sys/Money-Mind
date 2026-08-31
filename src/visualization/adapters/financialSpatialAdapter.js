import { assertSpatialScene } from "./financialVisualizationAdapter"
import { createRadialPositions } from "../radial/createRadialPositions"

// Domain identity, order and tone stay in lockstep with proofFinancialDomains
// (../mock/proofFinancialDomains.js) so the runtime palette
// (runtime/nodes/nodeMaterials.nodePalette) and radial camera layout are
// unchanged. Layer 4 only swaps the mock's uniform placeholders for the
// signed-in user's real per-domain totals and relative magnitudes.
const DOMAIN_ORDER = Object.freeze([
  { id: "income", label: "Income", tone: "positive" },
  { id: "investments", label: "Investments", tone: "growth" },
  { id: "assets", label: "Assets", tone: "stable" },
  { id: "debt", label: "Debt", tone: "liability" },
  { id: "expenses", label: "Expenses", tone: "outflow" },
  { id: "savings", label: "Savings", tone: "reserve" },
])

// A domain with little or no money still renders a visible, selectable node.
const MIN_MAGNITUDE = 0.35
const RADIAL_RADIUS = 3.15

function magnitudeOf(amount) {
  const value = Number(amount)
  return Number.isFinite(value) ? Math.abs(value) : 0
}

/**
 * Pure adapter: a normalized financial model -> a renderer-neutral SpatialScene.
 * Never touches Firebase and never formats currency itself — the caller passes
 * the already-formatted `detail` strings (presentation stays in the app layer,
 * see ADR-0002).
 *
 * model = {
 *   core?:    { label?: string, detail?: string, healthScore?: number },
 *   domains?: { [id in DOMAIN_ORDER.id]?: { amount?: number, detail?: string } },
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

  const radialNodes = DOMAIN_ORDER.map((domain, index) => Object.freeze({
    id: domain.id,
    label: domain.label,
    tone: domain.tone,
    domain: "financial",
    kind: "radial",
    entityId: domain.id,
    detail: domainsInput[domain.id]?.detail || "",
    amount: magnitudes[index],
    // Relative to the largest domain so the scene reads spatially; uniform when
    // there is no data yet (new user, or the signed-out demo scene).
    magnitude: peak > 0 ? Math.min(1, Math.max(MIN_MAGNITUDE, magnitudes[index] / peak)) : 1,
    position: positions[index],
  }))

  const edges = DOMAIN_ORDER.map((domain) => Object.freeze({
    id: `core-${domain.id}`,
    sourceId: core.id,
    targetId: domain.id,
    relationship: "financial-domain",
  }))

  const scene = Object.freeze({
    id: "money-mind-financial",
    nodes: Object.freeze([core, ...radialNodes]),
    edges: Object.freeze(edges),
  })

  assertSpatialScene(scene)
  return scene
}
