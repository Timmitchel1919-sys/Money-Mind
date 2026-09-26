// Layer 4B deterministic engine tests — plain Node, no framework, mirrors
// scripts/v2/validate-financial-graph-contracts.mjs (Layer 4A) and
// scripts/v2/layer3-browser-acceptance.mjs. Exercises
// src/financial/graph/engine/ in isolation: no Firebase, no React, no
// renderer, no production user data — a small deterministic fixture only.

import {
  createDomain,
  createEdge,
  createEdgeId,
  createFinancialGraphEngine,
  createGraph,
  createNode,
  createNodeId,
  GRAPH_ENGINE_ERROR_CODES,
  GraphEngineError,
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

// --- Fixture: Income -> Savings, Income -> Expenses, Savings -> Net Worth,
// Debt -> Net Worth, Investments -> Net Worth. Illustrative only; relationship
// identifiers are the canonical Layer 4A vocabulary
// (src/financial/graph/relationships/knownRelationships.js).

const DOMAINS = [
  createDomain({ id: "income", label: "Income" }),
  createDomain({ id: "expenses", label: "Expenses" }),
  createDomain({ id: "savings", label: "Savings" }),
  createDomain({ id: "debt", label: "Debt" }),
  createDomain({ id: "investments", label: "Investments" }),
  createDomain({ id: "net-worth", label: "Net Worth" }),
]

const income = createNode({ id: createNodeId("income", "category", "salary"), type: "category", domain: "income", label: "Salary" })
const savings = createNode({ id: createNodeId("savings", "goal", "emergency"), type: "goal", domain: "savings", label: "Emergency fund" })
const expenses = createNode({ id: createNodeId("expenses", "category", "rent"), type: "category", domain: "expenses", label: "Rent" })
const debt = createNode({ id: createNodeId("debt", "account", "credit-card"), type: "account", domain: "debt", label: "Credit card" })
const investments = createNode({ id: createNodeId("investments", "account", "brokerage"), type: "account", domain: "investments", label: "Brokerage" })
const netWorth = createNode({ id: createNodeId("net-worth", "summary", "core"), type: "summary", domain: "net-worth", label: "Net Worth" })

const NODES = [income, savings, expenses, debt, investments, netWorth]

const EDGES = [
  createEdge({ id: createEdgeId(income.id, "contributes_to", savings.id), source: income.id, target: savings.id, relationship: "contributes_to" }),
  createEdge({ id: createEdgeId(income.id, "funds", expenses.id), source: income.id, target: expenses.id, relationship: "funds" }),
  createEdge({ id: createEdgeId(savings.id, "increases", netWorth.id), source: savings.id, target: netWorth.id, relationship: "increases" }),
  createEdge({ id: createEdgeId(debt.id, "reduces", netWorth.id), source: debt.id, target: netWorth.id, relationship: "reduces" }),
  createEdge({ id: createEdgeId(investments.id, "increases", netWorth.id), source: investments.id, target: netWorth.id, relationship: "increases" }),
]

function buildFixtureGraph() {
  return createGraph({ id: "layer-4b-fixture", domains: DOMAINS, nodes: NODES, edges: EDGES })
}

// 1 & 2. Graph creation / valid graph
{
  const engine = createFinancialGraphEngine(buildFixtureGraph())
  assert(engine.validate().valid === true, "engine should build over a valid graph and report it valid")
  assert(engine.getGraph().id === "layer-4b-fixture", "engine should expose the underlying graph")
}

// 3. Invalid graph is refused at construction
{
  assertThrows(
    () => createFinancialGraphEngine({ id: "broken", domains: [], nodes: [], edges: [createEdge({ id: "ghost-funds-x", source: "ghost", target: "x", relationship: "funds" })] }),
    GRAPH_ENGINE_ERROR_CODES.INVALID_GRAPH,
    "an engine must refuse to build over a graph with a dangling edge reference"
  )
}

const engine = createFinancialGraphEngine(buildFixtureGraph())

// 4. Node lookup
{
  assert(engine.getNode(income.id)?.label === "Salary", "getNode should return the matching node")
  assert(engine.getNode("does-not-exist") === null, "getNode should return null for an unknown id, not throw")
}

// 5. Edge lookup
{
  const edgeId = createEdgeId(income.id, "funds", expenses.id)
  assert(engine.getEdge(edgeId)?.relationship === "funds", "getEdge should return the matching edge")
  assert(engine.getEdge("does-not-exist") === null, "getEdge should return null for an unknown id, not throw")
}

// 6. Domain query
{
  const incomeNodes = engine.getNodesByDomain("income")
  assert(incomeNodes.length === 1 && incomeNodes[0].id === income.id, "getNodesByDomain should return only nodes in that domain")
  assert(engine.getNodesByDomain("goals").length === 0, "an unused-but-well-formed domain id should return an empty array, not throw")
  assertThrows(() => engine.getNodesByDomain("Not Valid!"), GRAPH_ENGINE_ERROR_CODES.INVALID_DOMAIN, "a malformed domain id should throw INVALID_DOMAIN")
}

// 7. Node type query
{
  const goals = engine.getNodesByType("goal")
  assert(goals.length === 1 && goals[0].id === savings.id, "getNodesByType should return only nodes of that type")
  assertThrows(() => engine.getNodesByType("Not Valid!"), GRAPH_ENGINE_ERROR_CODES.INVALID_QUERY, "a malformed node type should throw INVALID_QUERY")
}

// 8. Relationship query
{
  const increases = engine.getEdgesByRelationship("increases")
  assert(increases.length === 2, "getEdgesByRelationship should return every edge with that relationship (savings, investments -> net worth)")
  assertThrows(() => engine.getEdgesByRelationship("Not Valid!"), GRAPH_ENGINE_ERROR_CODES.INVALID_RELATIONSHIP, "a malformed relationship should throw INVALID_RELATIONSHIP")
}

// 9. Neighbor lookup
{
  const neighbors = engine.getNeighbors(netWorth.id).map((node) => node.id).sort()
  const expected = [savings.id, debt.id, investments.id].sort()
  assert(JSON.stringify(neighbors) === JSON.stringify(expected), "getNeighbors(netWorth) should be savings, debt, investments")
}

// 10. Connected edge lookup
{
  const connected = engine.getConnectedEdges(income.id)
  assert(connected.length === 2, "income has exactly two outgoing edges (savings, expenses)")
  assert(connected.every((edge) => edge.source === income.id), "both of income's connected edges should have income as source")
}

// 11. Missing node
{
  assertThrows(() => engine.getConnectedEdges("ghost"), GRAPH_ENGINE_ERROR_CODES.NODE_NOT_FOUND, "getConnectedEdges on an unknown node should throw NODE_NOT_FOUND")
  assertThrows(() => engine.getNeighbors("ghost"), GRAPH_ENGINE_ERROR_CODES.NODE_NOT_FOUND, "getNeighbors on an unknown node should throw NODE_NOT_FOUND")
  assert(engine.hasNode("ghost") === false, "hasNode should report false for an unknown id")
}

// 12. Missing edge
{
  assert(engine.hasEdge("ghost-edge") === false, "hasEdge should report false for an unknown id")
  assert(engine.getEdge("ghost-edge") === null, "getEdge should return null for an unknown id")
}

// 13. Duplicate identity protection
{
  const dupeNode = createNode({ ...savings, id: income.id })
  assertThrows(
    () => createFinancialGraphEngine(createGraph({ id: "dupe-fixture", domains: DOMAINS, nodes: [...NODES, dupeNode], edges: [] })),
    GRAPH_ENGINE_ERROR_CODES.INVALID_GRAPH,
    "an engine must refuse to build over a graph with a duplicate node id"
  )
}

// 14. Deterministic results
{
  const engineA = createFinancialGraphEngine(buildFixtureGraph())
  const engineB = createFinancialGraphEngine(buildFixtureGraph())
  assert(
    JSON.stringify(engineA.getNeighbors(netWorth.id)) === JSON.stringify(engineB.getNeighbors(netWorth.id)),
    "two engines built from equivalent graphs must return equal (ordered) results for the same query"
  )
  assert(
    JSON.stringify(engineA.getConnectedEdges(income.id)) === JSON.stringify(engineB.getConnectedEdges(income.id)),
    "getConnectedEdges must be stable across independently built engines"
  )
}

// 15. Immutable internal state
{
  const nodes = engine.getNodes()
  assert(Object.isFrozen(nodes), "getNodes() must return a frozen collection")
  let threw = false
  try {
    nodes.push(income)
  } catch {
    threw = true
  }
  assert(threw, "mutating the array returned by getNodes() must throw")

  const byDomain = engine.getNodesByDomain("income")
  assert(Object.isFrozen(byDomain), "getNodesByDomain() must return a frozen collection")

  const connected = engine.getConnectedEdges(income.id)
  assert(Object.isFrozen(connected), "getConnectedEdges() must return a frozen collection")

  assert(Object.isFrozen(engine), "the engine object itself must be frozen")
}

// 16. Selection
{
  assert(engine.getSelection().nodeId === null, "a freshly built engine should start with no selection")

  const selection = engine.selectNode(savings.id)
  assert(selection.nodeId === savings.id, "selectNode should return a selection pointing at the requested node")
  assert(Object.isFrozen(selection), "a selection value must be frozen")
  assert(JSON.stringify(selection) === '{"nodeId":"savings-goal-emergency"}', "a selection must be plain, serializable data")
  assert(engine.getSelection().nodeId === savings.id, "getSelection should reflect the most recent selectNode call")
  assertThrows(() => engine.selectNode("ghost"), GRAPH_ENGINE_ERROR_CODES.NODE_NOT_FOUND, "selecting an unknown node id should throw NODE_NOT_FOUND, never fabricate a selection")
  assert(engine.getSelection().nodeId === savings.id, "a rejected selectNode call must not change the current selection")
}

// 17. Clearing selection
{
  const cleared = engine.clearSelection()
  assert(cleared.nodeId === null, "clearSelection should return a selection with nodeId null")
  assert(Object.isFrozen(cleared), "a cleared selection value must be frozen")
  assert(engine.getSelection().nodeId === null, "getSelection should reflect the clear")

  const otherEngine = createFinancialGraphEngine(buildFixtureGraph())
  assert(otherEngine.getSelection().nodeId === null, "selection state must be per-engine-instance, never a shared global singleton")
}

// Relationship-direction traversal over the fixture (Income -> Savings,
// Income -> Expenses, Savings/Debt/Investments -> Net Worth).
{
  const fundedByIncome = engine.getRelatedNodes(income.id, "funds", "outgoing").map((n) => n.id)
  assert(JSON.stringify(fundedByIncome) === JSON.stringify([expenses.id]), "income --funds--> should reach only expenses")

  const increasesNetWorth = engine.getRelatedNodes(netWorth.id, "increases", "incoming").map((n) => n.id).sort()
  assert(JSON.stringify(increasesNetWorth) === JSON.stringify([savings.id, investments.id].sort()), "net worth <--increases-- should reach savings and investments")

  const reducesNetWorth = engine.getRelatedNodes(netWorth.id, "reduces", "incoming").map((n) => n.id)
  assert(JSON.stringify(reducesNetWorth) === JSON.stringify([debt.id]), "net worth <--reduces-- should reach only debt")

  const relBetween = engine.getRelationships(savings.id, netWorth.id)
  assert(relBetween.length === 1 && relBetween[0].relationship === "increases", "getRelationships should find the single edge between savings and net worth")

  assertThrows(() => engine.getRelatedNodes(income.id, "funds", "sideways"), GRAPH_ENGINE_ERROR_CODES.INVALID_QUERY, "an invalid direction should throw INVALID_QUERY")
}

// Domain membership
{
  assert(engine.hasDomain("income") === true, "hasDomain should report true for a declared domain")
  assert(engine.hasDomain("does-not-exist") === false, "hasDomain should report false for an undeclared domain")
}

// Directed neighbor queries (any relationship)
{
  const outgoing = engine.getOutgoingNeighbors(income.id).map((n) => n.id).sort()
  assert(JSON.stringify(outgoing) === JSON.stringify([savings.id, expenses.id].sort()), "getOutgoingNeighbors(income) should be savings and expenses")

  const incoming = engine.getIncomingNeighbors(netWorth.id).map((n) => n.id).sort()
  assert(JSON.stringify(incoming) === JSON.stringify([savings.id, debt.id, investments.id].sort()), "getIncomingNeighbors(netWorth) should be savings, debt, investments")

  assert(engine.getOutgoingNeighbors(netWorth.id).length === 0, "net worth has no outgoing edges in this fixture")
}

// Bounded neighborhood traversal (BFS)
{
  const oneHop = engine.getConnectedNeighborhood(income.id, { maxDepth: 1 }).map((n) => n.id).sort()
  assert(JSON.stringify(oneHop) === JSON.stringify([savings.id, expenses.id].sort()), "1-hop neighborhood of income should be savings and expenses")

  const twoHop = engine.getConnectedNeighborhood(income.id, { maxDepth: 2 }).map((n) => n.id).sort()
  assert(JSON.stringify(twoHop) === JSON.stringify([savings.id, expenses.id, netWorth.id].sort()), "2-hop neighborhood of income should additionally reach net worth via savings")
  assert(new Set(twoHop).size === twoHop.length, "a neighborhood must not contain duplicate nodes even when reachable by more than one path")

  assertThrows(() => engine.getConnectedNeighborhood(income.id, { maxDepth: 0 }), GRAPH_ENGINE_ERROR_CODES.INVALID_QUERY, "maxDepth 0 should throw INVALID_QUERY")
  assertThrows(() => engine.getConnectedNeighborhood("ghost"), GRAPH_ENGINE_ERROR_CODES.NODE_NOT_FOUND, "neighborhood traversal from an unknown node should throw NODE_NOT_FOUND")
}

// Immutable node/edge registration (withNode/withEdge never mutate the source engine)
{
  const bonus = createNode({ id: createNodeId("income", "category", "bonus"), type: "category", domain: "income", label: "Bonus" })
  const engineWithBonus = engine.withNode(bonus)
  assert(engineWithBonus !== engine, "withNode must return a new engine instance")
  assert(engine.hasNode(bonus.id) === false, "the original engine must be unaffected by withNode")
  assert(engineWithBonus.hasNode(bonus.id) === true, "the new engine must contain the registered node")
  assert(engineWithBonus.getNodes().length === engine.getNodes().length + 1, "the new engine's node count must be exactly one greater")

  const bonusFundsSavings = createEdge({ id: createEdgeId(bonus.id, "contributes_to", savings.id), source: bonus.id, target: savings.id, relationship: "contributes_to" })
  const engineWithEdge = engineWithBonus.withEdge(bonusFundsSavings)
  assert(engineWithEdge.hasEdge(bonusFundsSavings.id) === true, "the new engine must contain the registered edge")
  assert(engineWithBonus.hasEdge(bonusFundsSavings.id) === false, "the prior engine must be unaffected by withEdge")

  assertThrows(
    () => engine.withEdge(createEdge({ id: "ghost-funds-x", source: "ghost", target: expenses.id, relationship: "funds" })),
    GRAPH_ENGINE_ERROR_CODES.INVALID_GRAPH,
    "withEdge must refuse to register an edge whose source does not exist"
  )
}

// Serialization
{
  const json = engine.serialize()
  assert(json === JSON.stringify(engine.getGraph()), "serialize() must match serializeGraph(getGraph()) exactly")
  const rebuilt = createFinancialGraphEngine(JSON.parse(json))
  assert(rebuilt.getNode(income.id)?.label === "Salary", "an engine rebuilt from serialize() output must contain the same data")
}

console.log(`Financial graph engine tests: ${passed} assertions passed.`)
