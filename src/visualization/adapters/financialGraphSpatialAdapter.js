// Layer 4D: Financial Graph -> Spatial adapter.
//
// The first (and only) boundary where a Layer 4A FinancialGraph — typically a
// Layer 4C view — becomes a renderer-neutral SpatialScene (src/spatial/
// contracts.js) for the existing Layer 2 runtime / Layer 3 motion engine.
//
//   Financial Graph ("what is connected?")
//     -> this adapter (identity, domain slot, kind, relationships)
//     -> SpatialScene ("how is it displayed?" stays with Layer 2/3)
//
// Boundaries:
// - No financial values. The adapter never reads, derives or recalculates an
//   amount. Display strings and relative magnitudes are supplied by the caller
//   in `presentation` (as financialSpatialAdapter takes pre-formatted `detail`).
// - No layout engine. Domain nodes take the SAME radial slots/tones as the
//   existing scene (FINANCIAL_SPATIAL_DOMAINS + financialDomainSlotPositions);
//   graph entities ring their domain via childRingPositions. No force layout,
//   physics, randomness or graph library.
// - No camera, animation, hover or motion policy: selection is returned as a
//   SpatialSelection value for the caller to hand to the existing motion engine
//   (e.g. selectNodeIntent); the adapter dispatches nothing.
// - No Firestore / React / Three.js imports.

import { createFinancialGraphEngine } from "../../financial/graph/engine/graphEngine.js"
import { assertSpatialScene } from "./financialVisualizationAdapter.js"
import { childRingPositions, financialDomainSlotPositions, FINANCIAL_SPATIAL_DOMAINS } from "./financialSpatialAdapter.js"

export const GRAPH_SPATIAL_ADAPTER_ERROR_CODES = Object.freeze({
  INVALID_GRAPH: "INVALID_GRAPH",
  INVALID_DOMAIN_HIERARCHY: "INVALID_DOMAIN_HIERARCHY",
  AMBIGUOUS_CORE: "AMBIGUOUS_CORE",
  IDENTITY_CONFLICT: "IDENTITY_CONFLICT",
  INVALID_PRESENTATION: "INVALID_PRESENTATION",
  INVALID_SELECTION: "INVALID_SELECTION",
})

export class GraphSpatialAdapterError extends Error {
  constructor(code, message, details = {}) {
    super(message)
    this.name = "GraphSpatialAdapterError"
    this.code = code
    this.details = details
  }
}

// Graph node type that maps to the scene's centre node. Everything else in a
// mapped domain becomes a "child" node ringing its domain's radial node.
export const GRAPH_CORE_NODE_TYPE = "core"

// Relationship names of the structural edges the adapter adds so the scene has
// the same core -> domain -> item shape the runtime already renders/reveals.
// Semantic graph edges keep their own Layer 4A relationship names.
export const STRUCTURAL_RELATIONSHIPS = Object.freeze({ coreDomain: "financial-domain", domainItem: "domain-item" })

const SPATIAL_DOMAIN_BY_ID = new Map(FINANCIAL_SPATIAL_DOMAINS.map((domain, index) => [domain.id, { ...domain, slot: index }]))

function fail(code, message, details) {
  throw new GraphSpatialAdapterError(code, message, details)
}

function resolveGraph(graphOrEngine) {
  if (graphOrEngine && typeof graphOrEngine.getGraph === "function" && typeof graphOrEngine.validate === "function") {
    return graphOrEngine.getGraph()
  }
  try {
    return createFinancialGraphEngine(graphOrEngine).getGraph()
  } catch (error) {
    return fail(GRAPH_SPATIAL_ADAPTER_ERROR_CODES.INVALID_GRAPH, `Cannot map an invalid financial graph: ${error.message}`, { cause: error, errors: error.details?.errors })
  }
}

// Every graph domain -> its top-level ancestor id (a sub-domain renders inside
// its top-level domain's slot). Layer 4A rejects missing/self parents; a longer
// parent cycle is rejected here rather than looped on.
function topLevelDomains(graph) {
  const byId = new Map(graph.domains.map((domain) => [domain.id, domain]))
  const result = new Map()
  for (const domain of graph.domains) {
    const seen = new Set()
    let current = domain
    while (current.parentId != null) {
      if (seen.has(current.id)) {
        fail(GRAPH_SPATIAL_ADAPTER_ERROR_CODES.INVALID_DOMAIN_HIERARCHY, `Domain "${domain.id}" has a cyclic parent chain`, { domainId: domain.id })
      }
      seen.add(current.id)
      current = byId.get(current.parentId)
    }
    result.set(domain.id, current.id)
  }
  return result
}

function readPresentation(presentation, id) {
  const entry = presentation[id]
  if (entry == null) return { detail: "", magnitude: 1 }
  if (typeof entry !== "object") fail(GRAPH_SPATIAL_ADAPTER_ERROR_CODES.INVALID_PRESENTATION, `presentation["${id}"] must be an object`, { id })
  const { detail = "", magnitude = 1 } = entry
  if (typeof detail !== "string") fail(GRAPH_SPATIAL_ADAPTER_ERROR_CODES.INVALID_PRESENTATION, `presentation["${id}"].detail must be a pre-formatted string`, { id })
  if (!Number.isFinite(magnitude) || magnitude <= 0 || magnitude > 1) {
    fail(GRAPH_SPATIAL_ADAPTER_ERROR_CODES.INVALID_PRESENTATION, `presentation["${id}"].magnitude must be in (0, 1]`, { id, magnitude })
  }
  return { detail, magnitude }
}

/**
 * Map a FinancialGraph (or FinancialGraphEngine) to a SpatialScene.
 *
 * @param {unknown} graphOrEngine  Validated through Layer 4B's engine (Layer 4A validateGraph); invalid graphs are rejected.
 * @param {object} [options]
 * @param {Record<string, { detail?: string, magnitude?: number }>} [options.presentation]
 *   Per spatial-node-id display data prepared by the app layer (formatted amounts,
 *   relative size). Domain radial nodes are keyed by domain id, others by graph node id.
 * @param {{ nodeId: string|null }|null} [options.selection]  A Layer 4B GraphSelection.
 * @param {boolean} [options.projected]
 * @param {number} [options.monthsForward]
 * @returns {Readonly<{
 *   scene: import("../../spatial/contracts.js").SpatialScene,
 *   selection: import("../../spatial/contracts.js").SpatialSelection,
 *   coverage: Readonly<{ unmappedDomains: string[], omittedNodeIds: string[], omittedEdgeIds: string[] }>,
 * }>}
 */
export function createFinancialGraphSpatialScene(graphOrEngine, { presentation = {}, selection = null, projected = false, monthsForward = 0 } = {}) {
  const graph = resolveGraph(graphOrEngine)
  if (presentation == null || typeof presentation !== "object") {
    fail(GRAPH_SPATIAL_ADAPTER_ERROR_CODES.INVALID_PRESENTATION, "presentation must be an object keyed by spatial node id")
  }
  const topLevel = topLevelDomains(graph)

  // --- Core ---
  const coreNodes = graph.nodes.filter((node) => node.type === GRAPH_CORE_NODE_TYPE)
  if (coreNodes.length > 1) {
    fail(GRAPH_SPATIAL_ADAPTER_ERROR_CODES.AMBIGUOUS_CORE, `A graph may map at most one "${GRAPH_CORE_NODE_TYPE}" node, found ${coreNodes.length}`, { nodeIds: coreNodes.map((node) => node.id) })
  }
  const coreSource = coreNodes[0] ?? null

  // --- Domain mapping (graph domain -> existing spatial radial slot) ---
  const declaredTopLevel = new Set(topLevel.values())
  const mappedDomains = FINANCIAL_SPATIAL_DOMAINS.filter((domain) => declaredTopLevel.has(domain.id))
  const unmappedDomains = graph.domains
    .filter((domain) => domain.parentId == null && !SPATIAL_DOMAIN_BY_ID.has(domain.id))
    .map((domain) => domain.id)

  // --- Child placement (graph order within each domain) ---
  const childrenByDomain = new Map(mappedDomains.map((domain) => [domain.id, []]))
  const omittedNodeIds = []
  for (const node of graph.nodes) {
    if (node === coreSource) continue
    const bucket = childrenByDomain.get(topLevel.get(node.domain))
    if (bucket) bucket.push(node)
    else omittedNodeIds.push(node.id)
  }

  const slotPositions = financialDomainSlotPositions()
  const graphDomainById = new Map(graph.domains.map((domain) => [domain.id, domain]))
  const nodes = []
  const edges = []

  if (coreSource) {
    const { detail } = readPresentation(presentation, coreSource.id)
    nodes.push(Object.freeze({
      id: coreSource.id,
      label: coreSource.label,
      detail,
      domain: "financial",
      kind: "core",
      entityId: coreSource.id,
      financialDomain: coreSource.domain,
      graphType: coreSource.type,
      status: coreSource.status,
      position: Object.freeze([0, 0, 0]),
    }))
  }

  const childNodes = []
  const childEdges = []
  for (const domain of mappedDomains) {
    const spatialDomain = SPATIAL_DOMAIN_BY_ID.get(domain.id)
    const position = slotPositions[spatialDomain.slot]
    const kids = childrenByDomain.get(domain.id)
    const ring = childRingPositions(position, kids.length)
    const { detail, magnitude } = readPresentation(presentation, domain.id)

    nodes.push(Object.freeze({
      id: domain.id,
      label: graphDomainById.get(domain.id).label,
      detail,
      tone: spatialDomain.tone,
      domain: "financial",
      kind: "radial",
      entityId: domain.id,
      financialDomain: domain.id,
      magnitude,
      childCount: kids.length,
      position,
    }))
    if (coreSource) {
      edges.push(Object.freeze({ id: `${coreSource.id}--${domain.id}`, sourceId: coreSource.id, targetId: domain.id, relationship: STRUCTURAL_RELATIONSHIPS.coreDomain }))
    }

    kids.forEach((node, index) => {
      const childPresentation = readPresentation(presentation, node.id)
      childNodes.push(Object.freeze({
        id: node.id,
        label: node.label,
        detail: childPresentation.detail,
        tone: spatialDomain.tone,
        domain: "financial",
        kind: "child",
        parentId: domain.id,
        entityId: node.id,
        financialDomain: node.domain,
        graphType: node.type,
        status: node.status,
        magnitude: childPresentation.magnitude,
        position: ring[index],
      }))
      // "--" can never appear in a Layer 4A identifier, so structural edge ids
      // cannot collide with graph edge ids.
      childEdges.push(Object.freeze({ id: `${domain.id}--${node.id}`, sourceId: domain.id, targetId: node.id, relationship: STRUCTURAL_RELATIONSHIPS.domainItem }))
    })
  }
  nodes.push(...childNodes)
  edges.push(...childEdges)

  // Radial node ids are domain ids; refuse a graph node that reuses one rather
  // than silently merging two identities.
  const nodeIds = new Set()
  for (const node of nodes) {
    if (nodeIds.has(node.id)) {
      fail(GRAPH_SPATIAL_ADAPTER_ERROR_CODES.IDENTITY_CONFLICT, `Spatial node id "${node.id}" is used by both a domain and a graph node`, { nodeId: node.id })
    }
    nodeIds.add(node.id)
  }

  // --- Semantic edges: kept only when both endpoints are in the scene ---
  const omittedEdgeIds = []
  for (const edge of graph.edges) {
    if (nodeIds.has(edge.source) && nodeIds.has(edge.target)) {
      edges.push(Object.freeze({ id: edge.id, sourceId: edge.source, targetId: edge.target, relationship: edge.relationship, status: edge.status }))
    } else {
      omittedEdgeIds.push(edge.id)
    }
  }

  // --- Selection mapping (GraphSelection -> SpatialSelection) ---
  let selectedNodeId = null
  if (selection != null) {
    const requested = selection.nodeId ?? null
    if (requested !== null && !graph.nodes.some((node) => node.id === requested)) {
      fail(GRAPH_SPATIAL_ADAPTER_ERROR_CODES.INVALID_SELECTION, `Selected node "${requested}" is not in the graph`, { nodeId: requested })
    }
    selectedNodeId = requested !== null && nodeIds.has(requested) ? requested : null
  }

  const scene = Object.freeze({
    id: `financial-graph-${graph.id}`,
    projected: Boolean(projected),
    monthsForward: Number(monthsForward) || 0,
    nodes: Object.freeze(nodes),
    edges: Object.freeze(edges),
  })
  assertSpatialScene(scene)

  return Object.freeze({
    scene,
    selection: Object.freeze({ nodeId: selectedNodeId, edgeId: null }),
    coverage: Object.freeze({
      unmappedDomains: Object.freeze(unmappedDomains),
      omittedNodeIds: Object.freeze(omittedNodeIds),
      omittedEdgeIds: Object.freeze(omittedEdgeIds),
    }),
  })
}

/** FinancialVisualizationAdapter-conformant wrapper (see financialVisualizationAdapter.js). */
export const financialGraphSpatialAdapter = Object.freeze({
  toScene: (graphOrEngine, options) => createFinancialGraphSpatialScene(graphOrEngine, options).scene,
})
