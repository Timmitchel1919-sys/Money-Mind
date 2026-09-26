// Structural + referential validation for a FinancialGraph (Layer 4A).
// Read-only: never mutates or repairs the input graph. Domain, node-type and
// relationship vocabularies are open by default (any well-formed identifier
// passes); pass `nodeTypes` / `relationships` to enforce a closed vocabulary
// for a given graph. See docs/v2/architecture/financial-graph-engine.md.

import { isValidIdentifier } from "../identity.js"

/**
 * @typedef {object} GraphValidationIssue
 * @property {string} code     Stable machine-readable code, e.g. "DUPLICATE_NODE_ID".
 * @property {string} message  Human-readable explanation.
 * @property {string} path     Best-effort pointer, e.g. "nodes[3]" or "edges[1].source".
 */

/**
 * @typedef {object} GraphValidationResult
 * @property {boolean} valid
 * @property {GraphValidationIssue[]} errors
 * @property {GraphValidationIssue[]} warnings
 */

function issue(code, message, path) {
  return { code, message, path }
}

function isPlainObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

/**
 * @param {unknown} graph
 * @param {{ nodeTypes?: string[], relationships?: string[] }} [options]
 * @returns {GraphValidationResult}
 */
export function validateGraph(graph, { nodeTypes, relationships } = {}) {
  const errors = []
  const warnings = []

  if (!isPlainObject(graph)) {
    errors.push(issue("GRAPH_MALFORMED", "Graph must be a plain object", "graph"))
    return { valid: false, errors, warnings }
  }
  if (!isValidIdentifier(graph.id)) {
    errors.push(issue("GRAPH_ID_INVALID", "Graph id must be a lowercase identifier", "graph.id"))
  }
  if (!Array.isArray(graph.domains)) errors.push(issue("GRAPH_MALFORMED", '"domains" must be an array', "graph.domains"))
  if (!Array.isArray(graph.nodes)) errors.push(issue("GRAPH_MALFORMED", '"nodes" must be an array', "graph.nodes"))
  if (!Array.isArray(graph.edges)) errors.push(issue("GRAPH_MALFORMED", '"edges" must be an array', "graph.edges"))

  if (errors.length > 0) return { valid: false, errors, warnings }

  const domains = graph.domains
  const nodes = graph.nodes
  const edges = graph.edges

  // --- Domains (two passes: collect ids, then validate parent references) ---
  const domainIds = new Set()
  const validDomainEntries = []
  domains.forEach((domain, index) => {
    const path = `domains[${index}]`
    if (!isPlainObject(domain) || !isValidIdentifier(domain.id)) {
      errors.push(issue("DOMAIN_MALFORMED", "Domain must have a valid identifier id", path))
      return
    }
    if (domainIds.has(domain.id)) {
      errors.push(issue("DUPLICATE_DOMAIN_ID", `Duplicate domain id "${domain.id}"`, path))
      return
    }
    domainIds.add(domain.id)
    validDomainEntries.push({ domain, path })
  })

  validDomainEntries.forEach(({ domain, path }) => {
    if (domain.parentId == null) return
    if (!isValidIdentifier(domain.parentId)) {
      errors.push(issue("DOMAIN_PARENT_INVALID", `Domain "${domain.id}" has an invalid parentId`, `${path}.parentId`))
    } else if (!domainIds.has(domain.parentId)) {
      errors.push(issue("DOMAIN_PARENT_MISSING", `Domain "${domain.id}" references unknown parent domain "${domain.parentId}"`, `${path}.parentId`))
    } else if (domain.parentId === domain.id) {
      errors.push(issue("DOMAIN_PARENT_SELF_REFERENCE", `Domain "${domain.id}" cannot be its own parent`, `${path}.parentId`))
    }
  })

  // --- Nodes ---
  const nodeIds = new Set()
  nodes.forEach((node, index) => {
    const path = `nodes[${index}]`
    if (!isPlainObject(node) || !isValidIdentifier(node.id)) {
      errors.push(issue("NODE_MALFORMED", "Node must have a valid identifier id", path))
      return
    }
    if (nodeIds.has(node.id)) {
      errors.push(issue("DUPLICATE_NODE_ID", `Duplicate node id "${node.id}"`, path))
      return
    }
    nodeIds.add(node.id)

    if (!isValidIdentifier(node.type)) {
      errors.push(issue("NODE_TYPE_INVALID", `Node "${node.id}" has an invalid type`, `${path}.type`))
    } else if (Array.isArray(nodeTypes) && !nodeTypes.includes(node.type)) {
      errors.push(issue("NODE_TYPE_UNKNOWN", `Node "${node.id}" type "${node.type}" is not in the declared vocabulary`, `${path}.type`))
    }

    if (!isValidIdentifier(node.domain)) {
      errors.push(issue("NODE_DOMAIN_INVALID", `Node "${node.id}" has an invalid domain`, `${path}.domain`))
    } else if (!domainIds.has(node.domain)) {
      errors.push(issue("NODE_DOMAIN_UNKNOWN", `Node "${node.id}" references unknown domain "${node.domain}"`, `${path}.domain`))
    }

    if (typeof node.label !== "string" || node.label.length === 0) {
      errors.push(issue("NODE_LABEL_MISSING", `Node "${node.id}" is missing a label`, `${path}.label`))
    }

    if (!isValidIdentifier(node.status)) {
      errors.push(issue("NODE_STATUS_INVALID", `Node "${node.id}" has an invalid status`, `${path}.status`))
    }
  })

  // --- Edges ---
  const edgeIds = new Set()
  edges.forEach((edge, index) => {
    const path = `edges[${index}]`
    if (!isPlainObject(edge) || !isValidIdentifier(edge.id)) {
      errors.push(issue("EDGE_MALFORMED", "Edge must have a valid identifier id", path))
      return
    }
    if (edgeIds.has(edge.id)) {
      errors.push(issue("DUPLICATE_EDGE_ID", `Duplicate edge id "${edge.id}"`, path))
      return
    }
    edgeIds.add(edge.id)

    const sourceOk = isValidIdentifier(edge.source)
    const targetOk = isValidIdentifier(edge.target)

    if (!sourceOk) {
      errors.push(issue("EDGE_SOURCE_INVALID", `Edge "${edge.id}" has an invalid source`, `${path}.source`))
    } else if (!nodeIds.has(edge.source)) {
      errors.push(issue("EDGE_SOURCE_MISSING", `Edge "${edge.id}" references missing source node "${edge.source}"`, `${path}.source`))
    }

    if (!targetOk) {
      errors.push(issue("EDGE_TARGET_INVALID", `Edge "${edge.id}" has an invalid target`, `${path}.target`))
    } else if (!nodeIds.has(edge.target)) {
      errors.push(issue("EDGE_TARGET_MISSING", `Edge "${edge.id}" references missing target node "${edge.target}"`, `${path}.target`))
    }

    if (sourceOk && targetOk && edge.source === edge.target) {
      errors.push(issue("EDGE_SELF_REFERENCE", `Edge "${edge.id}" connects "${edge.source}" to itself, which is not permitted`, path))
    }

    if (!isValidIdentifier(edge.relationship)) {
      errors.push(issue("EDGE_RELATIONSHIP_INVALID", `Edge "${edge.id}" has an invalid relationship`, `${path}.relationship`))
    } else if (Array.isArray(relationships) && !relationships.includes(edge.relationship)) {
      errors.push(issue("EDGE_RELATIONSHIP_UNKNOWN", `Edge "${edge.id}" relationship "${edge.relationship}" is not in the declared vocabulary`, `${path}.relationship`))
    }

    if (!isValidIdentifier(edge.status)) {
      errors.push(issue("EDGE_STATUS_INVALID", `Edge "${edge.id}" has an invalid status`, `${path}.status`))
    }
  })

  return { valid: errors.length === 0, errors, warnings }
}
