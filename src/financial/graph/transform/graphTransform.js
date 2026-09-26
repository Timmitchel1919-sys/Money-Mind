// Graph Transformations & Operations (Layer 4C): deterministic, non-mutating
// operations that derive a new, valid FinancialGraph from an existing
// FinancialGraph or FinancialGraphEngine (Layer 4A/4B). This module
// transforms graph STRUCTURE only — it performs no financial calculations
// (net worth, cash flow, debt payoff, investment return, ... stay in
// useFinancialKPIs / src/financial/projection/projectFinancials.js) and has
// no rendering/spatial/motion dependency whatsoever — see
// docs/v2/architecture/financial-graph-engine.md.
//
// Every exported function returns a FinancialGraph (never a bare array —
// that is Layer 4B's job), so the result of one transformation is always
// valid input to the next, and to createFinancialGraphEngine:
//
//   const debtNeighborhood = extractNeighborhood(
//     selectNodesByDomains(engine, ["debt"]),
//     debtNodeId,
//   )
//
// A derived graph keeps its source graph's `id` and `version` — a view is
// still identity-the-same financial graph, only restricted, per Layer 4A's
// own separation of identity from metadata. Provenance (which operation,
// with which parameters) is recorded in `metadata`, never folded into
// identity or used for ordering/equality.

import { createGraph } from "../contracts.js"
import { createFinancialGraphEngine } from "../engine/graphEngine.js"
import { GRAPH_ENGINE_ERROR_CODES, GraphEngineError } from "../engine/errors.js"
import { validateGraph } from "../validation/validateGraph.js"
import { isValidIdentifier } from "../identity.js"

// Accepts either a FinancialGraphEngine (duck-typed by its own shape) or a
// plain/graph-contract object, and always returns an engine — reusing
// Layer 4B's construction (which itself reuses Layer 4A's createGraph +
// validateGraph) rather than re-validating graphs here.
function resolveEngine(graphOrEngine, validationOptions) {
  if (graphOrEngine && typeof graphOrEngine.getGraph === "function" && typeof graphOrEngine.validate === "function") {
    return graphOrEngine
  }
  return createFinancialGraphEngine(graphOrEngine, validationOptions)
}

function normalizeIdList(value, field) {
  if (value == null) return []
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    throw new GraphEngineError(GRAPH_ENGINE_ERROR_CODES.INVALID_PARAMETER, `"${field}" must be an array of string identifiers`, { field, value })
  }
  return value
}

// Shared output construction for every transformation below: builds a new
// graph from already-filtered nodes/domains/edges, re-validates it with
// Layer 4A's validateGraph (never a second/parallel validator), and throws
// INVALID_DERIVED_GRAPH if that ever fails — a safety net, since every
// operation here is constructed so it never *should* fail (edges are always
// filtered to reference only retained nodes).
function buildDerivedGraph(sourceGraph, { nodes, domains, edges, operation, parameters }, validationOptions) {
  // `lineage` accumulates across composed transformations (oldest first), so a
  // pipeline's full provenance survives; `operation`/`parameters` keep
  // describing the most recent step.
  const lineage = Object.freeze([
    ...(Array.isArray(sourceGraph.metadata?.lineage) ? sourceGraph.metadata.lineage : []),
    Object.freeze({ operation, parameters }),
  ])
  const derived = createGraph({
    id: sourceGraph.id,
    version: sourceGraph.version,
    domains,
    nodes,
    edges,
    metadata: { ...sourceGraph.metadata, derivedFrom: sourceGraph.id, operation, parameters, lineage },
  })

  const validation = validateGraph(derived, validationOptions)
  if (!validation.valid) {
    throw new GraphEngineError(
      GRAPH_ENGINE_ERROR_CODES.INVALID_DERIVED_GRAPH,
      `Transformation "${operation}" produced an invalid graph`,
      { errors: validation.errors, operation, parameters }
    )
  }
  return derived
}

// Domains to retain for a set of retained nodes: every domain a retained node
// references, PLUS that domain's full parent chain — otherwise a node in a
// sub-domain (e.g. "savings-emergency" under "savings") would yield a derived
// graph whose domain references a parent that was dropped, which Layer 4A's
// validateGraph rightly rejects (DOMAIN_PARENT_MISSING). Returned in the source
// graph's original domains order. The seen-set bounds the walk even on a
// (validation-rejected) cyclic parent chain.
function retainDomains(graph, nodes) {
  const parentById = new Map(graph.domains.map((domain) => [domain.id, domain.parentId ?? null]))
  const keep = new Set()
  for (const node of nodes) {
    let current = node.domain
    while (current != null && !keep.has(current)) {
      keep.add(current)
      current = parentById.get(current) ?? null
    }
  }
  return graph.domains.filter((domain) => keep.has(domain.id))
}

// The induced subgraph over a node-id keep-set: retained nodes (in original
// graph.nodes order), retained domains (only those referenced by a retained
// node, in original graph.domains order), retained edges (only those whose
// source AND target are both retained, in original graph.edges order). This
// can never produce a dangling reference — an edge survives only when both
// endpoints do.
function induceSubgraph(engine, keepNodeIds, operation, parameters, validationOptions) {
  const graph = engine.getGraph()
  const nodes = graph.nodes.filter((node) => keepNodeIds.has(node.id))
  const domains = retainDomains(graph, nodes)
  const edges = graph.edges.filter((edge) => keepNodeIds.has(edge.source) && keepNodeIds.has(edge.target))
  return buildDerivedGraph(graph, { nodes, domains, edges, operation, parameters }, validationOptions)
}

// The edge-first counterpart: retained edges (in original order), retained
// nodes = only those touched by a retained edge (plus any explicit anchor
// nodes, e.g. the node a relationship view is centred on), retained domains =
// only those referenced by a retained node. Also dangling-reference-free by
// construction.
function induceFromEdgeIds(engine, keepEdgeIds, operation, parameters, validationOptions, anchorNodeIds = []) {
  const graph = engine.getGraph()
  const edges = graph.edges.filter((edge) => keepEdgeIds.has(edge.id))
  const retainedNodeIds = new Set(anchorNodeIds)
  for (const edge of edges) {
    retainedNodeIds.add(edge.source)
    retainedNodeIds.add(edge.target)
  }
  const nodes = graph.nodes.filter((node) => retainedNodeIds.has(node.id))
  const domains = retainDomains(graph, nodes)
  return buildDerivedGraph(graph, { nodes, domains, edges, operation, parameters }, validationOptions)
}

/**
 * The general multi-criteria node selector every named selector below is a
 * thin alias for. Retains every node matching ANY given criterion (a union,
 * not an intersection) — explicit `nodeIds` (each must already exist, or
 * this throws NODE_NOT_FOUND — a stale id is a caller bug), `domains`
 * (well-formed-but-currently-empty domains legitimately contribute nothing,
 * not an error), and `types` (same). At least one criterion must be given;
 * an entirely empty call is rejected as a likely mistake, not treated as
 * "select nothing."
 *
 * @param {unknown} graphOrEngine
 * @param {{ nodeIds?: string[], domains?: string[], types?: string[] }} [criteria]
 * @param {{ nodeTypes?: string[], relationships?: string[] }} [validationOptions]
 * @returns {import("../contracts.js").FinancialGraph}
 */
export function projectGraph(graphOrEngine, { nodeIds, domains, types } = {}, validationOptions) {
  const engine = resolveEngine(graphOrEngine, validationOptions)
  const nodeIdList = normalizeIdList(nodeIds, "nodeIds")
  const domainList = normalizeIdList(domains, "domains")
  const typeList = normalizeIdList(types, "types")

  if (nodeIdList.length === 0 && domainList.length === 0 && typeList.length === 0) {
    throw new GraphEngineError(
      GRAPH_ENGINE_ERROR_CODES.INVALID_PARAMETER,
      "projectGraph requires at least one of nodeIds, domains, or types",
      { nodeIds, domains, types }
    )
  }

  const keep = new Set()
  for (const nodeId of nodeIdList) {
    if (!engine.hasNode(nodeId)) {
      throw new GraphEngineError(GRAPH_ENGINE_ERROR_CODES.NODE_NOT_FOUND, `No node with id "${nodeId}"`, { nodeId })
    }
    keep.add(nodeId)
  }
  for (const domainId of domainList) {
    for (const node of engine.getNodesByDomain(domainId)) keep.add(node.id)
  }
  for (const type of typeList) {
    for (const node of engine.getNodesByType(type)) keep.add(node.id)
  }

  const parameters = { nodeIds: [...nodeIdList].sort(), domains: [...domainList].sort(), types: [...typeList].sort() }
  return induceSubgraph(engine, keep, "projectGraph", parameters, validationOptions)
}

/** Node selection: a domain view — every node in any of the given domains, plus edges between them. */
export function selectNodesByDomains(graphOrEngine, domainIds, validationOptions) {
  return projectGraph(graphOrEngine, { domains: domainIds }, validationOptions)
}

/** Node selection: every node of any of the given types, plus edges between them. */
export function selectNodesByTypes(graphOrEngine, types, validationOptions) {
  return projectGraph(graphOrEngine, { types }, validationOptions)
}

/** Node selection: exactly the given node ids (each must exist), plus edges between them — also covers "extract relationships involving these selected nodes." */
export function selectNodesByIds(graphOrEngine, nodeIds, validationOptions) {
  return projectGraph(graphOrEngine, { nodeIds }, validationOptions)
}

/**
 * Relationship view: every edge with any of the given relationships, plus
 * every node touched by a retained edge (not a domain/type-based node set —
 * a node with no edge of this relationship is not retained even if it
 * belongs to a retained domain).
 *
 * @param {unknown} graphOrEngine
 * @param {string[]} relationships
 */
export function selectEdgesByRelationships(graphOrEngine, relationships, validationOptions) {
  const engine = resolveEngine(graphOrEngine, validationOptions)
  const relationshipList = normalizeIdList(relationships, "relationships")
  if (relationshipList.length === 0) {
    throw new GraphEngineError(
      GRAPH_ENGINE_ERROR_CODES.INVALID_PARAMETER,
      "selectEdgesByRelationships requires at least one relationship",
      { relationships }
    )
  }

  const keepEdgeIds = new Set()
  for (const relationship of relationshipList) {
    for (const edge of engine.getEdgesByRelationship(relationship)) keepEdgeIds.add(edge.id)
  }

  const parameters = { relationships: [...relationshipList].sort() }
  return induceFromEdgeIds(engine, keepEdgeIds, "selectEdgesByRelationships", parameters, validationOptions)
}

/**
 * Subgraph extraction: nodeId plus (by default) every node reachable within
 * maxDepth hops, plus edges between retained nodes. Reuses Layer 4B's
 * getConnectedNeighborhood verbatim for the traversal itself — this
 * function only turns that node list into a valid induced graph.
 *
 * @param {unknown} graphOrEngine
 * @param {string} nodeId
 * @param {{ maxDepth?: number, includeAnchor?: boolean }} [options]
 */
export function extractNeighborhood(graphOrEngine, nodeId, { maxDepth = 1, includeAnchor = true } = {}, validationOptions) {
  const engine = resolveEngine(graphOrEngine, validationOptions)
  const neighborhood = engine.getConnectedNeighborhood(nodeId, { maxDepth })
  const keep = new Set(neighborhood.map((node) => node.id))
  if (includeAnchor) keep.add(nodeId)
  return induceSubgraph(engine, keep, "extractNeighborhood", { nodeId, maxDepth, includeAnchor }, validationOptions)
}

/**
 * Subgraph extraction: the full connected component containing nodeId (its
 * neighborhood at unbounded depth). Implemented as a thin reuse of Layer
 * 4B's bounded getConnectedNeighborhood with maxDepth set to the graph's
 * own node count — a safe upper bound, since no simple path in an
 * N-node graph can exceed N-1 hops. No separate traversal algorithm is
 * implemented here.
 *
 * @param {unknown} graphOrEngine
 * @param {string} nodeId
 */
export function extractConnectedComponent(graphOrEngine, nodeId, validationOptions) {
  const engine = resolveEngine(graphOrEngine, validationOptions)
  const graph = engine.getGraph()
  const bound = Math.max(1, graph.nodes.length)
  const component = engine.getConnectedNeighborhood(nodeId, { maxDepth: bound })
  const keep = new Set(component.map((node) => node.id))
  keep.add(nodeId)
  return induceSubgraph(engine, keep, "extractConnectedComponent", { nodeId }, validationOptions)
}

function normalizeRelationshipFilter(relationships) {
  const list = normalizeIdList(relationships, "relationships")
  for (const relationship of list) {
    if (!isValidIdentifier(relationship)) {
      throw new GraphEngineError(GRAPH_ENGINE_ERROR_CODES.INVALID_RELATIONSHIP, `"${relationship}" is not a valid relationship identifier`, { relationship })
    }
  }
  return list.length > 0 ? new Set(list) : null
}

const DIRECTIONS = new Set(["both", "outgoing", "incoming"])

/**
 * Relationship view anchored on one node: the node itself plus every edge
 * touching it in the given direction ("both" | "outgoing" | "incoming"),
 * optionally restricted to specific relationships, plus the nodes at the other
 * end of those edges. The anchor is always retained, so a node with no matching
 * relationship yields a valid one-node view rather than an empty graph.
 * Reuses Layer 4B's getConnectedEdges (adjacency index) — no graph scan.
 *
 * @param {unknown} graphOrEngine
 * @param {string} nodeId
 * @param {{ direction?: "both"|"outgoing"|"incoming", relationships?: string[] }} [options]
 */
export function selectNodeRelationships(graphOrEngine, nodeId, { direction = "both", relationships } = {}, validationOptions) {
  const engine = resolveEngine(graphOrEngine, validationOptions)
  if (!DIRECTIONS.has(direction)) {
    throw new GraphEngineError(GRAPH_ENGINE_ERROR_CODES.INVALID_PARAMETER, `direction must be "both", "outgoing" or "incoming", got "${direction}"`, { direction })
  }
  const relationshipFilter = normalizeRelationshipFilter(relationships)
  const keepEdgeIds = new Set()
  for (const edge of engine.getConnectedEdges(nodeId)) {
    if (direction === "outgoing" && edge.source !== nodeId) continue
    if (direction === "incoming" && edge.target !== nodeId) continue
    if (relationshipFilter && !relationshipFilter.has(edge.relationship)) continue
    keepEdgeIds.add(edge.id)
  }
  const parameters = { nodeId, direction, relationships: relationshipFilter ? [...relationshipFilter].sort() : [] }
  return induceFromEdgeIds(engine, keepEdgeIds, "selectNodeRelationships", parameters, validationOptions, [nodeId])
}

/**
 * Source -> target relationship view: both nodes plus the edges directly
 * between them. `directed: true` keeps only edges from sourceId to targetId;
 * the default keeps both directions. Optionally restricted to relationships.
 * Reuses Layer 4B's getRelationships.
 *
 * @param {unknown} graphOrEngine
 * @param {string} sourceId
 * @param {string} targetId
 * @param {{ directed?: boolean, relationships?: string[] }} [options]
 */
export function selectRelationshipsBetween(graphOrEngine, sourceId, targetId, { directed = false, relationships } = {}, validationOptions) {
  const engine = resolveEngine(graphOrEngine, validationOptions)
  if (typeof directed !== "boolean") {
    throw new GraphEngineError(GRAPH_ENGINE_ERROR_CODES.INVALID_PARAMETER, "directed must be a boolean", { directed })
  }
  const relationshipFilter = normalizeRelationshipFilter(relationships)
  const keepEdgeIds = new Set()
  for (const edge of engine.getRelationships(sourceId, targetId)) {
    if (directed && edge.source !== sourceId) continue
    if (relationshipFilter && !relationshipFilter.has(edge.relationship)) continue
    keepEdgeIds.add(edge.id)
  }
  const parameters = { sourceId, targetId, directed, relationships: relationshipFilter ? [...relationshipFilter].sort() : [] }
  return induceFromEdgeIds(engine, keepEdgeIds, "selectRelationshipsBetween", parameters, validationOptions, [sourceId, targetId])
}

/**
 * Transformation composition (a pipeline — not graph merge, which stays
 * deferred). Each step is a function `(graph) => FinancialGraph`, typically a
 * partially-applied transformation above:
 *
 *   const debtFocus = composeGraphTransforms(
 *     (g) => selectNodesByDomains(g, ["debt", "net-worth"]),
 *     (g) => extractNeighborhood(g, debtNodeId),
 *   )
 *   const view = debtFocus(engine)
 *
 * Steps run left to right. Every intermediate result is re-validated when the
 * next step builds its engine, and the final result is checked with Layer 4A's
 * validateGraph — a step that returns an invalid graph throws
 * INVALID_DERIVED_GRAPH instead of propagating it. Provenance accumulates in
 * `metadata.lineage`.
 *
 * @param {...(graph: import("../contracts.js").FinancialGraph) => import("../contracts.js").FinancialGraph} steps
 * @returns {(graphOrEngine: unknown, validationOptions?: object) => import("../contracts.js").FinancialGraph}
 */
export function composeGraphTransforms(...steps) {
  if (steps.length === 0 || steps.some((step) => typeof step !== "function")) {
    throw new GraphEngineError(GRAPH_ENGINE_ERROR_CODES.INVALID_PARAMETER, "composeGraphTransforms requires one or more step functions", { stepCount: steps.length })
  }
  return function composedGraphTransform(graphOrEngine, validationOptions) {
    let current = resolveEngine(graphOrEngine, validationOptions).getGraph()
    steps.forEach((step, index) => {
      const next = step(current)
      const validation = validateGraph(next, validationOptions)
      if (!validation.valid) {
        throw new GraphEngineError(GRAPH_ENGINE_ERROR_CODES.INVALID_DERIVED_GRAPH, `Composed step ${index} produced an invalid graph`, { errors: validation.errors, step: index })
      }
      // Re-normalize through Layer 4A so a hand-written step can't leak a mutable graph.
      current = createGraph(next)
    })
    return current
  }
}
