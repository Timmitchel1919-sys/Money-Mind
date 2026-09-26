// Deterministic Financial Graph Engine (Layer 4B): read-only query and
// traversal operations over a Layer 4A FinancialGraph. This module defines
// no competing graph model — it reuses Layer 4A's createGraph/validateGraph
// as the only source of truth for graph shape and correctness.
//
// The engine never performs financial calculations (those stay in
// src/financial/ calculation modules and the existing KPI hooks) and never
// touches rendering (Three.js/R3F/DOM/camera/motion state) — see
// docs/v2/architecture/financial-graph-engine.md.
//
// Error-handling policy used throughout this file:
//  - Simple existence lookups (getNode/getEdge/getDomain/hasNode/hasEdge/
//    hasDomain) return `null`/`false` for "not found," mirroring Map.get —
//    a missing id is a normal query outcome.
//  - Bucket queries (getNodesByDomain/getNodesByType/getEdgesByRelationship)
//    throw only on a malformed identifier (a caller bug); a well-formed id
//    with zero matches returns an empty array (a legitimate, valid state).
//  - Traversal anchored on a specific node (getConnectedEdges/getNeighbors/
//    getOutgoingNeighbors/getIncomingNeighbors/getConnectedNeighborhood/
//    getRelationships/getRelatedNodes/selectNode) throws NODE_NOT_FOUND when
//    that anchor node was never in the graph, since no meaningful traversal
//    result exists for an id the graph never had — that is almost always a
//    caller bug (e.g. a stale id), not "zero neighbors."

import { createGraph, serializeGraph, withEdge as withEdgeInGraph, withNode as withNodeInGraph } from "../contracts.js"
import { isValidIdentifier } from "../identity.js"
import { validateGraph } from "../validation/validateGraph.js"
import { GRAPH_ENGINE_ERROR_CODES, GraphEngineError } from "./errors.js"

const EMPTY_LIST = Object.freeze([])

function pushIndexed(map, key, value) {
  const list = map.get(key)
  if (list) {
    list.push(value)
  } else {
    map.set(key, [value])
  }
}

function freezeIndexArrays(map) {
  for (const [key, list] of map) map.set(key, Object.freeze(list))
  return map
}

// One O(nodes + edges) pass over an already-validated graph. Every array the
// index holds is frozen exactly once here, then handed out by reference on
// every later lookup — safe because neither the graph nor the index changes
// after construction.
function buildIndex(graph) {
  const nodeById = new Map()
  const edgeById = new Map()
  const domainById = new Map()
  const nodesByDomain = new Map()
  const nodesByType = new Map()
  const edgesByNode = new Map() // either endpoint — powers getConnectedEdges/getNeighbors
  const edgesBySource = new Map()
  const edgesByTarget = new Map()
  const edgesByRelationship = new Map()

  for (const domain of graph.domains) domainById.set(domain.id, domain)

  for (const node of graph.nodes) {
    nodeById.set(node.id, node)
    pushIndexed(nodesByDomain, node.domain, node)
    pushIndexed(nodesByType, node.type, node)
  }

  for (const edge of graph.edges) {
    edgeById.set(edge.id, edge)
    // validateGraph rejects self-referencing edges, so source !== target is
    // a guaranteed invariant here — both pushes always add a distinct entry.
    pushIndexed(edgesByNode, edge.source, edge)
    pushIndexed(edgesByNode, edge.target, edge)
    pushIndexed(edgesBySource, edge.source, edge)
    pushIndexed(edgesByTarget, edge.target, edge)
    pushIndexed(edgesByRelationship, edge.relationship, edge)
  }

  freezeIndexArrays(nodesByDomain)
  freezeIndexArrays(nodesByType)
  freezeIndexArrays(edgesByNode)
  freezeIndexArrays(edgesBySource)
  freezeIndexArrays(edgesByTarget)
  freezeIndexArrays(edgesByRelationship)

  return { nodeById, edgeById, domainById, nodesByDomain, nodesByType, edgesByNode, edgesBySource, edgesByTarget, edgesByRelationship }
}

/**
 * @typedef {object} GraphSelection
 * @property {string|null} nodeId
 */

/**
 * Build a read-only, deterministic engine over a FinancialGraph.
 *
 * Accepts either a plain graph-shaped object or an already-`createGraph`d
 * graph; either way it is re-normalized through Layer 4A's `createGraph` and
 * then checked with Layer 4A's `validateGraph` before any index is built, so
 * the engine can never be constructed over inconsistent data (e.g. an edge
 * pointing at a node that doesn't exist, or duplicate ids).
 *
 * The returned engine is a frozen plain object of closures — its indexes
 * live only in this function's closure scope, so there is no way for a
 * caller to reach (or mutate) the internal Maps.
 *
 * @param {unknown} graphInput
 * @param {{ nodeTypes?: string[], relationships?: string[] }} [validationOptions]
 *   Forwarded to validateGraph — optional closed vocabularies for node
 *   types / relationships. See docs/v2/architecture/financial-graph-engine.md.
 */
export function createFinancialGraphEngine(graphInput, validationOptions = {}) {
  let graph
  try {
    graph = createGraph(graphInput)
  } catch (error) {
    throw new GraphEngineError(GRAPH_ENGINE_ERROR_CODES.INVALID_GRAPH, `Cannot build a graph engine: ${error.message}`, { cause: error })
  }

  const validation = validateGraph(graph, validationOptions)
  if (!validation.valid) {
    throw new GraphEngineError(GRAPH_ENGINE_ERROR_CODES.INVALID_GRAPH, "Cannot build a graph engine over an invalid graph", { errors: validation.errors })
  }

  const index = buildIndex(graph)

  function requireNode(nodeId) {
    const node = index.nodeById.get(nodeId)
    if (!node) throw new GraphEngineError(GRAPH_ENGINE_ERROR_CODES.NODE_NOT_FOUND, `No node with id "${nodeId}"`, { nodeId })
    return node
  }

  function getGraph() {
    return graph
  }

  function validate(options) {
    return validateGraph(graph, options)
  }

  // --- Lookups (existence-style: null, not a throw, for "not found") ---

  function getNode(nodeId) {
    return index.nodeById.get(nodeId) ?? null
  }

  function hasNode(nodeId) {
    return index.nodeById.has(nodeId)
  }

  function getEdge(edgeId) {
    return index.edgeById.get(edgeId) ?? null
  }

  function hasEdge(edgeId) {
    return index.edgeById.has(edgeId)
  }

  function getDomain(domainId) {
    return index.domainById.get(domainId) ?? null
  }

  function hasDomain(domainId) {
    return index.domainById.has(domainId)
  }

  // --- Collections (already frozen by Layer 4A's createGraph) ---

  function getNodes() {
    return graph.nodes
  }

  function getEdges() {
    return graph.edges
  }

  function getDomains() {
    return graph.domains
  }

  // --- Bucket queries (throw only on a malformed identifier) ---

  function getNodesByDomain(domainId) {
    if (!isValidIdentifier(domainId)) {
      throw new GraphEngineError(GRAPH_ENGINE_ERROR_CODES.INVALID_DOMAIN, `"${domainId}" is not a valid domain identifier`, { domainId })
    }
    return index.nodesByDomain.get(domainId) ?? EMPTY_LIST
  }

  function getNodesByType(type) {
    if (!isValidIdentifier(type)) {
      throw new GraphEngineError(GRAPH_ENGINE_ERROR_CODES.INVALID_QUERY, `"${type}" is not a valid node type identifier`, { type })
    }
    return index.nodesByType.get(type) ?? EMPTY_LIST
  }

  function getEdgesByRelationship(relationship) {
    if (!isValidIdentifier(relationship)) {
      throw new GraphEngineError(GRAPH_ENGINE_ERROR_CODES.INVALID_RELATIONSHIP, `"${relationship}" is not a valid relationship identifier`, { relationship })
    }
    return index.edgesByRelationship.get(relationship) ?? EMPTY_LIST
  }

  // --- Traversal (anchored on a node that must exist) ---

  // Every edge touching nodeId, as either source or target. Order follows
  // graph.edges (edge-declaration order), not insertion into either side.
  function getConnectedEdges(nodeId) {
    requireNode(nodeId)
    return index.edgesByNode.get(nodeId) ?? EMPTY_LIST
  }

  // The node at the other end of every edge touching nodeId. A node
  // reachable by more than one edge appears once per edge — callers that
  // want a unique set can wrap the result in `new Set(...)`.
  function getNeighbors(nodeId) {
    requireNode(nodeId)
    return Object.freeze(
      getConnectedEdges(nodeId).map((edge) => index.nodeById.get(edge.source === nodeId ? edge.target : edge.source))
    )
  }

  // Nodes reached by an edge where nodeId is the source, any relationship.
  function getOutgoingNeighbors(nodeId) {
    requireNode(nodeId)
    return Object.freeze((index.edgesBySource.get(nodeId) ?? EMPTY_LIST).map((edge) => index.nodeById.get(edge.target)))
  }

  // Nodes reached by an edge where nodeId is the target, any relationship.
  function getIncomingNeighbors(nodeId) {
    requireNode(nodeId)
    return Object.freeze((index.edgesByTarget.get(nodeId) ?? EMPTY_LIST).map((edge) => index.nodeById.get(edge.source)))
  }

  // Bounded breadth-first neighborhood: every node reachable from nodeId in
  // at most maxDepth hops (undirected), deduplicated, nearest-first. Plain
  // queue-based BFS over the existing adjacency index — no graph library,
  // no unbounded traversal.
  function getConnectedNeighborhood(nodeId, { maxDepth = 1 } = {}) {
    requireNode(nodeId)
    if (!Number.isInteger(maxDepth) || maxDepth < 1) {
      throw new GraphEngineError(GRAPH_ENGINE_ERROR_CODES.INVALID_QUERY, `maxDepth must be a positive integer, got ${maxDepth}`, { maxDepth })
    }
    const visited = new Set([nodeId])
    const order = []
    let frontier = [nodeId]
    for (let depth = 0; depth < maxDepth && frontier.length > 0; depth += 1) {
      const nextFrontier = []
      for (const currentId of frontier) {
        for (const edge of index.edgesByNode.get(currentId) ?? EMPTY_LIST) {
          const neighborId = edge.source === currentId ? edge.target : edge.source
          if (visited.has(neighborId)) continue
          visited.add(neighborId)
          order.push(neighborId)
          nextFrontier.push(neighborId)
        }
      }
      frontier = nextFrontier
    }
    return Object.freeze(order.map((id) => index.nodeById.get(id)))
  }

  // Every edge directly between sourceId and targetId, in either direction.
  function getRelationships(sourceId, targetId) {
    requireNode(sourceId)
    requireNode(targetId)
    return Object.freeze(
      getConnectedEdges(sourceId).filter(
        (edge) => (edge.source === sourceId && edge.target === targetId) || (edge.source === targetId && edge.target === sourceId)
      )
    )
  }

  // node -> relationship -> related nodes, in one direction. One generic
  // function covers every semantic query the spec calls out ("nodes funded
  // by X" = getRelatedNodes(x, "funds", "outgoing"); "nodes that fund X" =
  // getRelatedNodes(x, "funds", "incoming")) without one function per
  // relationship string.
  function getRelatedNodes(nodeId, relationship, direction = "outgoing") {
    requireNode(nodeId)
    if (!isValidIdentifier(relationship)) {
      throw new GraphEngineError(GRAPH_ENGINE_ERROR_CODES.INVALID_RELATIONSHIP, `"${relationship}" is not a valid relationship identifier`, { relationship })
    }
    if (direction !== "outgoing" && direction !== "incoming") {
      throw new GraphEngineError(GRAPH_ENGINE_ERROR_CODES.INVALID_QUERY, `direction must be "outgoing" or "incoming", got "${direction}"`, { direction })
    }
    const bySide = direction === "outgoing" ? index.edgesBySource : index.edgesByTarget
    const otherEnd = direction === "outgoing" ? (edge) => edge.target : (edge) => edge.source
    const edges = bySide.get(nodeId) ?? EMPTY_LIST
    return Object.freeze(
      edges.filter((edge) => edge.relationship === relationship).map((edge) => index.nodeById.get(otherEnd(edge)))
    )
  }

  // --- Selection ---
  //
  // A GraphSelection is a plain, frozen value — `{ nodeId }` — and its
  // *shape* mirrors the existing SpatialSelection typedef
  // (src/spatial/contracts.js). Unlike that typedef, the engine here holds
  // the current selection as instance state (one `let` per engine, private
  // to this closure — never a module-level/global singleton, and never
  // reachable or mutable from outside except through selectNode/
  // clearSelection). This is semantic, graph-level selection only: no
  // Three.js, no React, no camera/animation state, and no duplication of
  // MotionProvider, which owns the separate concern of *visual* selection
  // and focus state for the spatial scene.
  //
  // Because selection is stateful, getSelection() is intentionally the one
  // query in this module whose result depends on call order, not just
  // input — every other query/traversal function above remains a pure
  // function of the graph and its arguments.

  let selection = Object.freeze({ nodeId: null })

  function selectNode(nodeId) {
    requireNode(nodeId)
    selection = Object.freeze({ nodeId })
    return selection
  }

  function clearSelection() {
    selection = Object.freeze({ nodeId: null })
    return selection
  }

  function getSelection() {
    return selection
  }

  // --- Immutable registration ---
  //
  // "Registering" a node/edge never mutates this engine (or its graph) in
  // place — it reuses Layer 4A's withNode/withEdge to build a new graph,
  // then builds and returns a brand-new engine over it (re-validated,
  // re-indexed). The engine this was called on is completely unaffected.

  function withNode(node) {
    return createFinancialGraphEngine(withNodeInGraph(graph, node), validationOptions)
  }

  function withEdge(edge) {
    return createFinancialGraphEngine(withEdgeInGraph(graph, edge), validationOptions)
  }

  // --- Serialization ---

  function serialize() {
    return serializeGraph(graph)
  }

  return Object.freeze({
    getGraph,
    validate,
    serialize,
    getNode,
    hasNode,
    getEdge,
    hasEdge,
    getDomain,
    hasDomain,
    getNodes,
    getEdges,
    getDomains,
    getNodesByDomain,
    getNodesByType,
    getEdgesByRelationship,
    getConnectedEdges,
    getNeighbors,
    getOutgoingNeighbors,
    getIncomingNeighbors,
    getConnectedNeighborhood,
    getRelationships,
    getRelatedNodes,
    withNode,
    withEdge,
    selectNode,
    clearSelection,
    getSelection,
  })
}
