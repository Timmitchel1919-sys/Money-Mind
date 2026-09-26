// Canonical Money Mind Financial Graph contract (Layer 4A).
//
// Plain, serializable data only — see
// docs/v2/architecture/financial-graph-engine.md for the full model and the
// financial/visualization boundary (ADR-0002, ADR-0003). Nothing in this
// module may reference Three.js, React, the DOM, or any renderer/camera/
// animation/motion state. That boundary is enforced by review, not by code
// in this file — this file simply never imports anything that could pull
// those concerns in.
//
// Construction here is deliberately light: factories check field *shape*
// (right type, non-empty, identifier syntax) but never cross-reference other
// parts of the graph (e.g. "does this edge's source node exist?"). That is
// validateGraph's job (./validation/validateGraph.js) — construction and
// validation stay separate so invalid data is never silently repaired.

import { isValidIdentifier } from "./identity.js"

/**
 * @typedef {object} GraphDomain
 * @property {string} id                 Deterministic, unique within the graph.
 * @property {string} label              Human-readable name.
 * @property {string=} description
 * @property {string|null=} parentId     Another domain id, for hierarchy; null/absent = top-level.
 * @property {Record<string, unknown>=} metadata  Open bag for future, non-rendering data.
 */

/**
 * @typedef {object} GraphNode
 * @property {string} id       Deterministic — see identity.js. Never an array index.
 * @property {string} type     Entity type, e.g. "core", "account", "category", "goal".
 * @property {string} domain   A GraphDomain id declared on the same graph.
 * @property {string} label
 * @property {string} status   e.g. "active" | "inactive" | "projected" | "archived".
 * @property {Record<string, unknown>=} metadata
 */

/**
 * @typedef {object} GraphEdge
 * @property {string} id            Deterministic — see identity.js.
 * @property {string} source        A GraphNode id.
 * @property {string} target        A GraphNode id.
 * @property {string} relationship  Semantic identifier, e.g. "funds", "contributes_to".
 * @property {string} status        e.g. "active" | "inactive" | "projected".
 * @property {Record<string, unknown>=} metadata
 */

/**
 * @typedef {object} FinancialGraph
 * @property {string} id            Deterministic, caller-supplied.
 * @property {string} version       Caller-supplied content/schema version — not identity.
 * @property {GraphDomain[]} domains
 * @property {GraphNode[]} nodes
 * @property {GraphEdge[]} edges
 * @property {Record<string, unknown>=} metadata  e.g. { generatedAt } — observational only, never identity.
 */

function freezeShallow(value) {
  return Object.freeze({ ...value })
}

function requireString(value, field) {
  if (typeof value !== "string" || value.length === 0) {
    throw new TypeError(`"${field}" must be a non-empty string`)
  }
  return value
}

function requireIdentifier(value, field) {
  if (!isValidIdentifier(value)) {
    throw new TypeError(`"${field}" must be a lowercase identifier, got: ${JSON.stringify(value)}`)
  }
  return value
}

/** @param {{ id: string, label: string, description?: string, parentId?: string|null, metadata?: object }} input */
export function createDomain({ id, label, description = "", parentId = null, metadata = {} }) {
  requireIdentifier(id, "domain.id")
  requireString(label, "domain.label")
  if (parentId != null) requireIdentifier(parentId, "domain.parentId")
  return freezeShallow({ id, label, description, parentId, metadata: freezeShallow(metadata) })
}

/** @param {{ id: string, type: string, domain: string, label: string, status?: string, metadata?: object }} input */
export function createNode({ id, type, domain, label, status = "active", metadata = {} }) {
  requireIdentifier(id, "node.id")
  requireIdentifier(type, "node.type")
  requireIdentifier(domain, "node.domain")
  requireString(label, "node.label")
  requireIdentifier(status, "node.status")
  return freezeShallow({ id, type, domain, label, status, metadata: freezeShallow(metadata) })
}

/** @param {{ id: string, source: string, target: string, relationship: string, status?: string, metadata?: object }} input */
export function createEdge({ id, source, target, relationship, status = "active", metadata = {} }) {
  requireIdentifier(id, "edge.id")
  requireIdentifier(source, "edge.source")
  requireIdentifier(target, "edge.target")
  requireIdentifier(relationship, "edge.relationship")
  requireIdentifier(status, "edge.status")
  return freezeShallow({ id, source, target, relationship, status, metadata: freezeShallow(metadata) })
}

/** @param {{ id: string, version?: string, domains?: GraphDomain[], nodes?: GraphNode[], edges?: GraphEdge[], metadata?: object }} input */
export function createGraph({ id, version = "1", domains = [], nodes = [], edges = [], metadata = {} }) {
  requireIdentifier(id, "graph.id")
  requireString(version, "graph.version")
  if (!Array.isArray(domains)) throw new TypeError('"graph.domains" must be an array')
  if (!Array.isArray(nodes)) throw new TypeError('"graph.nodes" must be an array')
  if (!Array.isArray(edges)) throw new TypeError('"graph.edges" must be an array')

  return Object.freeze({
    id,
    version,
    domains: Object.freeze([...domains]),
    nodes: Object.freeze([...nodes]),
    edges: Object.freeze([...edges]),
    metadata: freezeShallow(metadata),
  })
}

/** Structural clone: a new, independently frozen graph with the same content. */
export function cloneGraph(graph) {
  return createGraph({
    id: graph.id,
    version: graph.version,
    domains: graph.domains,
    nodes: graph.nodes,
    edges: graph.edges,
    metadata: graph.metadata,
  })
}

/** Plain-data graphs serialize with ordinary JSON — no custom encoding needed. */
export function serializeGraph(graph) {
  return JSON.stringify(graph)
}

/** Inverse of serializeGraph. Does not validate references — call validateGraph explicitly. */
export function deserializeGraph(json) {
  return createGraph(JSON.parse(json))
}

function replaceById(list, item) {
  const index = list.findIndex((existing) => existing.id === item.id)
  if (index === -1) return [...list, item]
  const next = [...list]
  next[index] = item
  return next
}

/** Returns a NEW graph with `node` appended, or replacing an existing node of the same id. The input graph is untouched. */
export function withNode(graph, node) {
  return createGraph({ ...graph, nodes: replaceById(graph.nodes, node) })
}

/** Returns a NEW graph with `edge` appended, or replacing an existing edge of the same id. The input graph is untouched. */
export function withEdge(graph, edge) {
  return createGraph({ ...graph, edges: replaceById(graph.edges, edge) })
}

/** Returns a NEW graph with `domain` appended, or replacing an existing domain of the same id. The input graph is untouched. */
export function withDomain(graph, domain) {
  return createGraph({ ...graph, domains: replaceById(graph.domains, domain) })
}
