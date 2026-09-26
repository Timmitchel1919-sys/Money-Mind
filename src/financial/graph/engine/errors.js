// Structured errors shared by the Financial Graph Engine (Layer 4B) and
// Graph Transformations & Operations (Layer 4C) — one error type for both,
// since Layer 4C operates on the same graph/engine abstraction rather than
// introducing a second one.
//
// Distinct from validateGraph's issue list (Layer 4A): validateGraph reports
// on the shape of graph *data* (does this graph make sense on its own).
// GraphEngineError reports on misuse of the *engine or a transformation*
// built from data already known to be valid — e.g. asking for the neighbors
// of a node id that was never in the graph, or projecting with a malformed
// parameter.

export const GRAPH_ENGINE_ERROR_CODES = Object.freeze({
  INVALID_GRAPH: "INVALID_GRAPH",
  NODE_NOT_FOUND: "NODE_NOT_FOUND",
  INVALID_DOMAIN: "INVALID_DOMAIN",
  INVALID_RELATIONSHIP: "INVALID_RELATIONSHIP",
  INVALID_QUERY: "INVALID_QUERY",
  // Layer 4C additions:
  INVALID_PARAMETER: "INVALID_PARAMETER", // malformed/insufficient transformation arguments
  INVALID_DERIVED_GRAPH: "INVALID_DERIVED_GRAPH", // a transformation's own output failed validateGraph (a Layer 4C bug, not caller error)
})

export class GraphEngineError extends Error {
  constructor(code, message, details = {}) {
    super(message)
    this.name = "GraphEngineError"
    this.code = code
    this.details = details
  }
}
