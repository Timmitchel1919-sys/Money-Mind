import { assertSpatialScene } from "./financialVisualizationAdapter.js"
import { createRadialPositions } from "../radial/createRadialPositions.js"

// Layer 11: main-module registry entries -> a renderer-neutral SpatialScene for
// the V2 Spatial Application (Money Mind Core + one node per module + Core ->
// module links). Separate from the financial-graph adapters on purpose: the
// Financial Graph is the semantic financial model; this is navigation.
// No financial calculation happens here; `core.detail` is pre-formatted by the app.

// Centralized spatial composition (no coordinates anywhere else).
export const MODULE_LAYOUT = Object.freeze({
  radius: 3.15, // same world ring as the existing radial scenes (label layer maps to it)
  startAngle: Math.PI / 2, // slot 0 at the top, then clockwise
  depth: 0, // modules sit on the Core's plane; depth comes from lighting, fog and atmosphere
})
export const MONEY_MIND_CORE_ID = "money-mind-core"
export const MODULE_LINK_RELATIONSHIP = "module-link"

/**
 * @param {{ modules: object[], core?: { label?: string, detail?: string } }} input
 * @returns {import("../../spatial/contracts.js").SpatialScene}
 */
export function createModuleSpatialScene({ modules = [], core = {} } = {}) {
  // Ring positions in slot order; ring size = number of visible modules, so a
  // module added later re-spaces the ring deterministically.
  const bySlot = [...modules].sort((a, b) => a.spatial.slot - b.spatial.slot)
  const positions = createRadialPositions({ count: bySlot.length, radius: MODULE_LAYOUT.radius, startAngle: MODULE_LAYOUT.startAngle })
  const positionById = new Map(bySlot.map((module, index) => [module.id, Object.freeze([positions[index][0], positions[index][1], MODULE_LAYOUT.depth])]))

  const coreNode = Object.freeze({
    id: MONEY_MIND_CORE_ID,
    kind: "core",
    visual: "money-mind-core",
    activation: "overview",
    label: core.label || "Money Mind",
    detail: core.detail || "",
    ariaLabel: `${core.label || "Money Mind"} Core — return to overview`,
    domain: "financial",
    position: Object.freeze([0, 0, 0]),
  })
  // Nodes in reading order (keyboard/tab order follows the registry `order`).
  const moduleNodes = modules.map((module) => Object.freeze({
    id: module.id,
    kind: "radial",
    visual: "module",
    label: module.label,
    detail: module.tagline || "",
    ariaLabel: `${module.label}: ${module.description}`,
    tone: module.tone,
    domain: "navigation",
    entityId: module.id,
    magnitude: 1,
    childCount: 0,
    position: positionById.get(module.id),
  }))
  const edges = modules.map((module) => Object.freeze({
    id: `${MONEY_MIND_CORE_ID}--${module.id}`,
    sourceId: MONEY_MIND_CORE_ID,
    targetId: module.id,
    relationship: MODULE_LINK_RELATIONSHIP,
  }))

  const scene = Object.freeze({
    id: "money-mind-universe",
    atmosphere: true,
    nodes: Object.freeze([coreNode, ...moduleNodes]),
    edges: Object.freeze(edges),
  })
  assertSpatialScene(scene)
  return scene
}
