// Layer 4C deterministic transformation tests — plain Node, no framework,
// mirrors scripts/v2/validate-financial-graph-engine.mjs (Layer 4B) and
// scripts/v2/validate-financial-graph-contracts.mjs (Layer 4A). Exercises
// src/financial/graph/transform/ in isolation: no Firebase, no React, no
// renderer, no production data — a small deterministic fixture only.
//
// Test item 15 ("serialization/snapshot behavior if implemented") and 17
// ("conflicting identity handling if composition is implemented") are
// exercised only insofar as documented: Layer 4C introduces no new snapshot
// type (reuses Layer 4A's serializeGraph/deserializeGraph directly, proven
// below) and no graph merge at all (deliberately deferred — see
// docs/v2/architecture/financial-graph-engine.md), so there is no
// conflicting-identity behavior to test. Transformation *composition*
// (pipelines via composeGraphTransforms) is tested at the end of this file.

import {
  createDomain,
  createEdge,
  createEdgeId,
  createFinancialGraphEngine,
  createGraph,
  createNode,
  createNodeId,
  deserializeGraph,
  extractConnectedComponent,
  extractNeighborhood,
  GRAPH_ENGINE_ERROR_CODES,
  GraphEngineError,
  projectGraph,
  selectEdgesByRelationships,
  selectNodesByDomains,
  selectNodesByIds,
  selectNodesByTypes,
  serializeGraph,
  validateGraph,
  selectNodeRelationships,
  selectRelationshipsBetween,
  composeGraphTransforms,
} from "../../src/financial/graph/index.js"

let passed = 0

function assert(condition, message) {
  if (!condition) throw new Error(`FAIL: ${message}`)
  passed += 1
}

function assertThrows(fn, code, message) {
  try {
    fn()
  } catch (error) {
    assert(error instanceof GraphEngineError, `${message} (expected a GraphEngineError)`)
    assert(error.code === code, `${message} (expected code ${code}, got ${error.code})`)
    return
  }
  throw new Error(`FAIL: ${message} (expected a throw, none occurred)`)
}

function ids(nodes) {
  return nodes.map((n) => n.id).sort()
}

// --- Fixture: same relationships as Layer 4B's engine fixture (Income ->
// Savings, Income -> Expenses, Savings/Debt/Investments -> Net Worth), plus
// a declared-but-empty "goals" domain (valid empty result) and an isolated
// node with no edges at all (connected-component boundary check).

const DOMAINS = [
  createDomain({ id: "income", label: "Income" }),
  createDomain({ id: "expenses", label: "Expenses" }),
  createDomain({ id: "savings", label: "Savings" }),
  createDomain({ id: "debt", label: "Debt" }),
  createDomain({ id: "investments", label: "Investments" }),
  createDomain({ id: "net-worth", label: "Net Worth" }),
  createDomain({ id: "goals", label: "Goals" }),
]

const income = createNode({ id: createNodeId("income", "category", "salary"), type: "category", domain: "income", label: "Salary" })
const savings = createNode({ id: createNodeId("savings", "goal", "emergency"), type: "goal", domain: "savings", label: "Emergency fund" })
const expenses = createNode({ id: createNodeId("expenses", "category", "rent"), type: "category", domain: "expenses", label: "Rent" })
const debt = createNode({ id: createNodeId("debt", "account", "credit-card"), type: "account", domain: "debt", label: "Credit card" })
const investments = createNode({ id: createNodeId("investments", "account", "brokerage"), type: "account", domain: "investments", label: "Brokerage" })
const netWorth = createNode({ id: createNodeId("net-worth", "summary", "core"), type: "summary", domain: "net-worth", label: "Net Worth" })
const isolated = createNode({ id: createNodeId("investments", "account", "dormant"), type: "account", domain: "investments", label: "Dormant account" })

const NODES = [income, savings, expenses, debt, investments, netWorth, isolated]

const EDGES = [
  createEdge({ id: createEdgeId(income.id, "contributes_to", savings.id), source: income.id, target: savings.id, relationship: "contributes_to" }),
  createEdge({ id: createEdgeId(income.id, "funds", expenses.id), source: income.id, target: expenses.id, relationship: "funds" }),
  createEdge({ id: createEdgeId(savings.id, "increases", netWorth.id), source: savings.id, target: netWorth.id, relationship: "increases" }),
  createEdge({ id: createEdgeId(debt.id, "reduces", netWorth.id), source: debt.id, target: netWorth.id, relationship: "reduces" }),
  createEdge({ id: createEdgeId(investments.id, "increases", netWorth.id), source: investments.id, target: netWorth.id, relationship: "increases" }),
]

function buildFixtureGraph() {
  return createGraph({ id: "layer-4c-fixture", domains: DOMAINS, nodes: NODES, edges: EDGES })
}

const engine = createFinancialGraphEngine(buildFixtureGraph())

// 1. Domain filtering
{
  const view = selectNodesByDomains(engine, ["income", "savings"])
  assert(JSON.stringify(ids(view.nodes)) === JSON.stringify([income.id, savings.id].sort()), "selectNodesByDomains should retain exactly the nodes in the given domains")
  assert(view.edges.length === 1 && view.edges[0].id === createEdgeId(income.id, "contributes_to", savings.id), "the domain view should retain only the edge between the two retained nodes")
  assert(view.domains.length === 2, "the domain view should retain only the referenced domains")
}

// 2. Node filtering (by explicit id, and by type)
{
  const view = selectNodesByIds(engine, [income.id, expenses.id])
  assert(JSON.stringify(ids(view.nodes)) === JSON.stringify([income.id, expenses.id].sort()), "selectNodesByIds should retain exactly the requested nodes")
  assertThrows(() => selectNodesByIds(engine, ["ghost"]), GRAPH_ENGINE_ERROR_CODES.NODE_NOT_FOUND, "selecting a nonexistent node id should throw NODE_NOT_FOUND")

  const byType = selectNodesByTypes(engine, ["account"])
  assert(JSON.stringify(ids(byType.nodes)) === JSON.stringify([debt.id, investments.id, isolated.id].sort()), "selectNodesByTypes should retain exactly the nodes of the given type")
}

// 3 & 4. Edge / relationship filtering
{
  const increasesView = selectEdgesByRelationships(engine, ["increases"])
  assert(increasesView.edges.length === 2, "selectEdgesByRelationships should retain exactly the matching edges")
  assert(JSON.stringify(ids(increasesView.nodes)) === JSON.stringify([savings.id, investments.id, netWorth.id].sort()), "the relationship view should retain only nodes touched by a matching edge — not, e.g., the unrelated isolated investments node")

  const multi = selectEdgesByRelationships(engine, ["reduces", "funds"])
  assert(multi.edges.length === 2, "selectEdgesByRelationships should union edges across multiple relationships")
}

// 5. Subgraph extraction (selectNodesByIds doubles as "relationships involving selected nodes")
{
  const view = selectNodesByIds(engine, [income.id, savings.id, expenses.id])
  assert(view.edges.length === 2, "a 3-node id selection should retain both edges between them")
}

// 6. Neighborhood extraction
{
  const oneHop = extractNeighborhood(engine, income.id, { maxDepth: 1 })
  assert(JSON.stringify(ids(oneHop.nodes)) === JSON.stringify([income.id, savings.id, expenses.id].sort()), "1-hop neighborhood of income should include income itself, savings, and expenses")

  const twoHop = extractNeighborhood(engine, income.id, { maxDepth: 2 })
  assert(JSON.stringify(ids(twoHop.nodes)) === JSON.stringify([income.id, savings.id, expenses.id, netWorth.id].sort()), "2-hop neighborhood of income should additionally reach net worth via savings")

  const withoutAnchor = extractNeighborhood(engine, income.id, { maxDepth: 1, includeAnchor: false })
  assert(!withoutAnchor.nodes.some((n) => n.id === income.id), "includeAnchor:false should exclude the anchor node itself")
}

// 7. Projection (multi-criteria union)
{
  const view = projectGraph(engine, { nodeIds: [debt.id], domains: ["income"], types: ["summary"] })
  const expected = [debt.id, income.id, netWorth.id].sort()
  assert(JSON.stringify(ids(view.nodes)) === JSON.stringify(expected), "projectGraph should union nodeIds, domains, and types")
}

// 8. Valid empty results
{
  const emptyDomainView = selectNodesByDomains(engine, ["goals"])
  assert(emptyDomainView.nodes.length === 0 && emptyDomainView.edges.length === 0 && emptyDomainView.domains.length === 0, "selecting a declared-but-empty domain should return a valid empty graph, not an error")
  assert(validateGraph(emptyDomainView).valid === true, "a valid empty derived graph must itself validate")
}

// 9. Invalid transformation parameters
{
  assertThrows(() => projectGraph(engine, {}), GRAPH_ENGINE_ERROR_CODES.INVALID_PARAMETER, "projectGraph with no criteria at all should throw INVALID_PARAMETER")
  assertThrows(() => selectEdgesByRelationships(engine, []), GRAPH_ENGINE_ERROR_CODES.INVALID_PARAMETER, "selectEdgesByRelationships with an empty list should throw INVALID_PARAMETER")
  assertThrows(() => selectNodesByIds(engine, [42]), GRAPH_ENGINE_ERROR_CODES.INVALID_PARAMETER, "a non-string entry in an id list should throw INVALID_PARAMETER")
  assertThrows(() => extractNeighborhood(engine, income.id, { maxDepth: 0 }), GRAPH_ENGINE_ERROR_CODES.INVALID_QUERY, "maxDepth 0 should throw INVALID_QUERY (delegated to Layer 4B)")
  assertThrows(() => extractNeighborhood(engine, "ghost"), GRAPH_ENGINE_ERROR_CODES.NODE_NOT_FOUND, "extractNeighborhood from an unknown node should throw NODE_NOT_FOUND")
}

// 10. Dangling-edge prevention
{
  const view = selectNodesByDomains(engine, ["net-worth"])
  const nodeIdSet = new Set(view.nodes.map((n) => n.id))
  assert(view.edges.every((edge) => nodeIdSet.has(edge.source) && nodeIdSet.has(edge.target)), "no derived graph may contain an edge referencing a node outside its own node set")
  assert(view.edges.length === 0, "net worth alone (no incoming domain) has none of its incoming edges retained, since savings/debt/investments were not selected")
}

// 11. Deterministic ordering
{
  const a = selectNodesByDomains(engine, ["debt", "income"])
  const b = selectNodesByDomains(engine, ["income", "debt"]) // reversed parameter order
  assert(JSON.stringify(a.nodes) === JSON.stringify(b.nodes), "node order in the result must depend on the source graph's order, not on the order criteria were supplied in")
  assert(JSON.stringify(a) === JSON.stringify(selectNodesByDomains(engine, ["debt", "income"])), "the same call must produce byte-identical output every time")
}

// 12. Immutability
{
  const before = engine.getGraph()
  const view = selectNodesByDomains(engine, ["debt"])
  assert(engine.getGraph() === before, "a transformation must never change the source engine's graph")
  assert(Object.isFrozen(view), "a derived graph must be frozen")
  assert(Object.isFrozen(view.nodes) && Object.isFrozen(view.edges) && Object.isFrozen(view.domains), "a derived graph's collections must be frozen")
}

// 13. Transformation composition
{
  const chained = selectEdgesByRelationships(
    extractNeighborhood(selectNodesByDomains(engine, ["income", "savings", "expenses", "net-worth"]), income.id, { maxDepth: 2 }),
    ["increases"]
  )
  assert(chained.edges.length === 1 && chained.edges[0].relationship === "increases", "a 3-stage pipeline (domain filter -> neighborhood -> relationship filter) should compose correctly")
  assert(JSON.stringify(ids(chained.nodes)) === JSON.stringify([savings.id, netWorth.id].sort()), "the composed pipeline should land on exactly savings and net worth")
}

// 14. Graph validation
{
  const view = selectNodesByDomains(engine, ["debt"])
  const result = validateGraph(view)
  assert(result.valid === true && result.errors.length === 0, "every derived graph must independently pass Layer 4A's validateGraph")
}

// 15. Serialization/snapshot behavior (Layer 4C introduces no new snapshot type — reuses Layer 4A's serializeGraph/deserializeGraph directly)
{
  const view = selectNodesByDomains(engine, ["income", "savings"])
  const json = serializeGraph(view)
  const restored = deserializeGraph(json)
  assert(JSON.stringify(restored) === JSON.stringify(view), "a derived graph must round-trip through Layer 4A's existing serializeGraph/deserializeGraph unchanged")
}

// 16. Identity preservation
{
  const view = selectNodesByDomains(engine, ["debt"])
  assert(view.id === engine.getGraph().id, "a derived graph must preserve the source graph's id — a view is the same financial graph, restricted")
  assert(view.version === engine.getGraph().version, "a derived graph must preserve the source graph's version")
  assert(view.metadata.derivedFrom === engine.getGraph().id, "a derived graph must record its provenance in metadata, not identity")
  assert(view.metadata.operation === "projectGraph", "a derived graph must record which operation produced it")
}

// Connected component extraction — the isolated node must never be pulled
// in by a component that doesn't touch it, and must form its own
// singleton component.
{
  const component = extractConnectedComponent(engine, income.id)
  assert(JSON.stringify(ids(component.nodes)) === JSON.stringify([income.id, savings.id, expenses.id, debt.id, investments.id, netWorth.id].sort()), "the connected component containing income should be every node except the isolated one")
  assert(!component.nodes.some((n) => n.id === isolated.id), "the isolated node must not appear in a component it has no edge into")

  const isolatedComponent = extractConnectedComponent(engine, isolated.id)
  assert(isolatedComponent.nodes.length === 1 && isolatedComponent.nodes[0].id === isolated.id, "an isolated node's own connected component is just itself")
  assert(isolatedComponent.edges.length === 0, "a singleton component has no edges")
}

// --- Hierarchical domains: a retained sub-domain keeps its parent chain ---
{
  const hierarchy = createGraph({
    id: "layer-4c-hierarchy",
    domains: [
      createDomain({ id: "savings", label: "Savings" }),
      createDomain({ id: "savings-emergency", label: "Emergency", parentId: "savings" }),
      createDomain({ id: "savings-emergency-cash", label: "Cash buffer", parentId: "savings-emergency" }),
      createDomain({ id: "income", label: "Income" }),
    ],
    nodes: [
      createNode({ id: "income-category-salary", type: "category", domain: "income", label: "Salary" }),
      createNode({ id: "savings-emergency-cash-goal-buffer", type: "goal", domain: "savings-emergency-cash", label: "Buffer" }),
    ],
    edges: [createEdge({ id: "salary-funds-buffer", source: "income-category-salary", target: "savings-emergency-cash-goal-buffer", relationship: "funds" })],
  })
  const byNode = selectNodesByIds(hierarchy, ["savings-emergency-cash-goal-buffer"])
  assert(validateGraph(byNode).valid, "a node view over a sub-sub-domain node must stay valid")
  assert(JSON.stringify(byNode.domains.map((d) => d.id)) === JSON.stringify(["savings", "savings-emergency", "savings-emergency-cash"]), "the retained sub-domain keeps its full parent chain, in original order")
  const byRelationship = selectEdgesByRelationships(hierarchy, ["funds"])
  assert(validateGraph(byRelationship).valid && byRelationship.domains.length === 4, "edge-first views keep parent chains too")
  const byNodeView = selectNodeRelationships(hierarchy, "income-category-salary", { direction: "outgoing" })
  assert(validateGraph(byNodeView).valid, "node relationship view over a hierarchy stays valid")
}

// --- Relationship views anchored on a node / between two nodes ---

function assertValidDerived(view, label) {
  assert(validateGraph(view).valid, `${label}: derived graph must pass Layer 4A validateGraph`)
  const nodeIds = new Set(view.nodes.map((n) => n.id))
  assert(view.edges.every((e) => nodeIds.has(e.source) && nodeIds.has(e.target)), `${label}: no dangling edges`)
  assert(Object.isFrozen(view) && Object.isFrozen(view.nodes) && Object.isFrozen(view.edges), `${label}: derived graph must be frozen`)
}

{
  const both = selectNodeRelationships(engine, income.id)
  assertValidDerived(both, "selectNodeRelationships both")
  assert(JSON.stringify(ids(both.nodes)) === JSON.stringify([income.id, savings.id, expenses.id].sort()), "both-direction view of income = income + its two neighbors")
  assert(both.edges.length === 2, "both-direction view of income keeps its two edges")

  const incoming = selectNodeRelationships(engine, netWorth.id, { direction: "incoming" })
  assertValidDerived(incoming, "selectNodeRelationships incoming")
  assert(incoming.edges.length === 3 && incoming.edges.every((e) => e.target === netWorth.id), "incoming view of net worth keeps only edges targeting it")

  const outgoingOfNetWorth = selectNodeRelationships(engine, netWorth.id, { direction: "outgoing" })
  assert(outgoingOfNetWorth.nodes.length === 1 && outgoingOfNetWorth.nodes[0].id === netWorth.id && outgoingOfNetWorth.edges.length === 0, "a node with no outgoing edges yields a valid one-node view (anchor retained)")

  const reducesOnly = selectNodeRelationships(engine, netWorth.id, { relationships: ["reduces"] })
  assert(reducesOnly.edges.length === 1 && reducesOnly.edges[0].relationship === "reduces", "relationship filter restricts the node view")
  assert(JSON.stringify(ids(reducesOnly.nodes)) === JSON.stringify([debt.id, netWorth.id].sort()), "relationship-filtered node view keeps only touched nodes + anchor")

  const isolatedView = selectNodeRelationships(engine, isolated.id)
  assert(isolatedView.nodes.length === 1 && isolatedView.edges.length === 0, "isolated node view is the node alone")

  assertThrows(() => selectNodeRelationships(engine, "ghost"), GRAPH_ENGINE_ERROR_CODES.NODE_NOT_FOUND, "node view of a missing node throws NODE_NOT_FOUND")
  assertThrows(() => selectNodeRelationships(engine, income.id, { direction: "sideways" }), GRAPH_ENGINE_ERROR_CODES.INVALID_PARAMETER, "unknown direction throws INVALID_PARAMETER")
  assertThrows(() => selectNodeRelationships(engine, income.id, { relationships: ["Not Valid"] }), GRAPH_ENGINE_ERROR_CODES.INVALID_RELATIONSHIP, "malformed relationship throws INVALID_RELATIONSHIP")
  assertThrows(() => selectNodeRelationships(engine, income.id, { relationships: "funds" }), GRAPH_ENGINE_ERROR_CODES.INVALID_PARAMETER, "non-array relationships throws INVALID_PARAMETER")
}

{
  const forward = selectRelationshipsBetween(engine, income.id, savings.id, { directed: true })
  assertValidDerived(forward, "selectRelationshipsBetween directed")
  assert(forward.edges.length === 1 && forward.edges[0].source === income.id, "directed source->target view keeps the income->savings edge")

  const backward = selectRelationshipsBetween(engine, savings.id, income.id, { directed: true })
  assert(backward.edges.length === 0 && backward.nodes.length === 2, "reverse directed view has no edges but keeps both endpoints")

  const undirected = selectRelationshipsBetween(engine, savings.id, income.id)
  assert(undirected.edges.length === 1, "undirected view finds the edge in either direction")

  const unrelated = selectRelationshipsBetween(engine, income.id, debt.id)
  assert(unrelated.edges.length === 0 && unrelated.nodes.length === 2, "two unconnected nodes yield a valid edge-less view")

  const filteredOut = selectRelationshipsBetween(engine, income.id, savings.id, { relationships: ["funds"] })
  assert(filteredOut.edges.length === 0, "relationship filter applies to source->target view")

  assertThrows(() => selectRelationshipsBetween(engine, income.id, "ghost"), GRAPH_ENGINE_ERROR_CODES.NODE_NOT_FOUND, "missing endpoint throws NODE_NOT_FOUND")
  assertThrows(() => selectRelationshipsBetween(engine, income.id, savings.id, { directed: "yes" }), GRAPH_ENGINE_ERROR_CODES.INVALID_PARAMETER, "non-boolean directed throws INVALID_PARAMETER")
}

// --- Composition (pipeline): domain filter -> neighborhood -> relationship filter ---
{
  const before = serializeGraph(engine.getGraph())
  const pipeline = composeGraphTransforms(
    (g) => selectNodesByDomains(g, ["savings", "debt", "investments", "net-worth"]),
    (g) => extractNeighborhood(g, netWorth.id),
    (g) => selectEdgesByRelationships(g, ["increases"]),
  )
  const composed = pipeline(engine)
  assertValidDerived(composed, "composed pipeline")
  assert(JSON.stringify(ids(composed.nodes)) === JSON.stringify([savings.id, investments.id, netWorth.id].sort()), "pipeline result = the 'increases' contributors to net worth")
  assert(composed.edges.every((e) => e.relationship === "increases"), "pipeline result keeps only 'increases' edges")

  const manual = selectEdgesByRelationships(extractNeighborhood(selectNodesByDomains(engine, ["savings", "debt", "investments", "net-worth"]), netWorth.id), ["increases"])
  assert(serializeGraph(composed) === serializeGraph(manual), "composition is identical to manual chaining")
  assert(serializeGraph(pipeline(engine)) === serializeGraph(composed), "composition is deterministic")
  assert(serializeGraph(engine.getGraph()) === before, "composition never mutates the source graph")

  assert(composed.metadata.lineage.length === 3, "lineage records every composed step")
  assert(JSON.stringify(composed.metadata.lineage.map((step) => step.operation)) === JSON.stringify(["projectGraph", "extractNeighborhood", "selectEdgesByRelationships"]), "lineage keeps step order")
  assert(composed.id === engine.getGraph().id, "composition preserves graph identity")

  const plainStep = composeGraphTransforms((g) => ({ ...g, nodes: [...g.nodes], edges: [...g.edges], domains: [...g.domains] }))
  const normalized = plainStep(engine)
  assert(Object.isFrozen(normalized) && Object.isFrozen(normalized.nodes), "a hand-written step's plain result is re-frozen by composition")

  const danglingStep = composeGraphTransforms((g) => ({ ...g, nodes: g.nodes.filter((n) => n.id !== savings.id) }))
  assertThrows(() => danglingStep(engine), GRAPH_ENGINE_ERROR_CODES.INVALID_DERIVED_GRAPH, "a step that leaves a dangling edge is rejected, not repaired")
  assertThrows(() => composeGraphTransforms(), GRAPH_ENGINE_ERROR_CODES.INVALID_PARAMETER, "empty composition is rejected")
  assertThrows(() => composeGraphTransforms("not-a-function"), GRAPH_ENGINE_ERROR_CODES.INVALID_PARAMETER, "non-function step is rejected")

  const emptyThenMore = composeGraphTransforms((g) => selectNodesByDomains(g, ["goals"]))(engine)
  assertValidDerived(emptyThenMore, "empty composed result")
  assert(emptyThenMore.nodes.length === 0 && emptyThenMore.edges.length === 0, "a composition may validly end in an empty graph")
}

console.log(`Financial graph transform tests: ${passed} assertions passed.`)
