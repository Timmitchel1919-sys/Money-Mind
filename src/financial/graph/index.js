// Public API of the Layer 4A Financial Graph contract layer.
// See docs/v2/architecture/financial-graph-engine.md.

export {
  createGraph,
  createNode,
  createEdge,
  createDomain,
  cloneGraph,
  serializeGraph,
  deserializeGraph,
  withNode,
  withEdge,
  withDomain,
} from "./contracts.js"

export { createNodeId, createEdgeId, isValidIdentifier } from "./identity.js"
export { validateGraph } from "./validation/validateGraph.js"
export { KNOWN_FINANCIAL_DOMAINS } from "./domains/knownFinancialDomains.js"
export { KNOWN_RELATIONSHIPS } from "./relationships/knownRelationships.js"

// Layer 4B — Financial Graph Engine core
export { createFinancialGraphEngine } from "./engine/graphEngine.js"
export { GRAPH_ENGINE_ERROR_CODES, GraphEngineError } from "./engine/errors.js"

// Layer 4C — Graph Transformations & Operations
export {
  projectGraph,
  selectNodesByDomains,
  selectNodesByTypes,
  selectNodesByIds,
  selectEdgesByRelationships,
  extractNeighborhood,
  extractConnectedComponent,
} from "./transform/graphTransform.js"
