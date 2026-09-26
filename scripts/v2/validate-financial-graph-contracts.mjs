// Layer 4A deterministic contract tests — plain Node, no framework, mirrors
// the assert-style of scripts/v2/layer3-browser-acceptance.mjs. Exercises
// src/financial/graph/ in isolation: no Firebase, no React, no renderer.

import {
  cloneGraph,
  createEdge,
  createEdgeId,
  createGraph,
  createNode,
  createNodeId,
  deserializeGraph,
  KNOWN_FINANCIAL_DOMAINS,
  KNOWN_RELATIONSHIPS,
  serializeGraph,
  validateGraph,
  withNode,
} from "../../src/financial/graph/index.js"

let passed = 0

function assert(condition, message) {
  if (!condition) throw new Error(`FAIL: ${message}`)
  passed += 1
}

function buildValidGraph() {
  const domains = KNOWN_FINANCIAL_DOMAINS
  const salary = createNode({ id: createNodeId("income", "category", "salary"), type: "category", domain: "income", label: "Salary" })
  const savingsGoal = createNode({ id: createNodeId("savings", "goal", "vacation"), type: "goal", domain: "savings", label: "Vacation fund" })
  const edge = createEdge({
    id: createEdgeId(salary.id, "funds", savingsGoal.id),
    source: salary.id,
    target: savingsGoal.id,
    relationship: "funds",
  })
  return createGraph({ id: "money-mind-financial-graph", domains, nodes: [salary, savingsGoal], edges: [edge] })
}

// 1. Valid graph
{
  const graph = buildValidGraph()
  const result = validateGraph(graph)
  assert(result.valid === true, "a well-formed graph should validate")
  assert(result.errors.length === 0, "a well-formed graph should have zero errors")
}

// 2. Empty graph
{
  const graph = createGraph({ id: "empty-graph" })
  const result = validateGraph(graph)
  assert(result.valid === true, "an empty graph (no domains/nodes/edges) should validate")
}

// 3. Duplicate node ID
{
  const graph = buildValidGraph()
  const dupeNode = createNode({ ...graph.nodes[1], id: graph.nodes[0].id })
  const graphWithDupe = createGraph({ ...graph, nodes: [...graph.nodes, dupeNode] })
  const result = validateGraph(graphWithDupe)
  assert(result.valid === false, "duplicate node id should fail validation")
  assert(result.errors.some((e) => e.code === "DUPLICATE_NODE_ID"), "duplicate node id should raise DUPLICATE_NODE_ID")
}

// 4. Duplicate edge ID
{
  const graph = buildValidGraph()
  const dupeEdge = createEdge({ ...graph.edges[0], id: graph.edges[0].id })
  const graphWithDupe = createGraph({ ...graph, edges: [...graph.edges, dupeEdge] })
  const result = validateGraph(graphWithDupe)
  assert(result.errors.some((e) => e.code === "DUPLICATE_EDGE_ID"), "duplicate edge id should raise DUPLICATE_EDGE_ID")
}

// 5. Missing source
{
  const graph = buildValidGraph()
  const badEdge = createEdge({ id: "ghost-funds-target", source: "does-not-exist", target: graph.nodes[1].id, relationship: "funds" })
  const result = validateGraph(createGraph({ ...graph, edges: [badEdge] }))
  assert(result.errors.some((e) => e.code === "EDGE_SOURCE_MISSING"), "an edge referencing a missing source node should raise EDGE_SOURCE_MISSING")
}

// 6. Missing target
{
  const graph = buildValidGraph()
  const badEdge = createEdge({ id: "source-funds-ghost", source: graph.nodes[0].id, target: "does-not-exist", relationship: "funds" })
  const result = validateGraph(createGraph({ ...graph, edges: [badEdge] }))
  assert(result.errors.some((e) => e.code === "EDGE_TARGET_MISSING"), "an edge referencing a missing target node should raise EDGE_TARGET_MISSING")
}

// 7. Invalid relationship (malformed, and unknown-vocabulary)
{
  const graph = buildValidGraph()
  let threw = false
  try {
    createEdge({ id: "bad-rel", source: graph.nodes[0].id, target: graph.nodes[1].id, relationship: "Not Valid!" })
  } catch {
    threw = true
  }
  assert(threw, "createEdge should reject a malformed relationship at construction time")

  const unknownRelEdge = createEdge({ id: "unknown-rel-edge", source: graph.nodes[0].id, target: graph.nodes[1].id, relationship: "teleports_to" })
  const result = validateGraph(createGraph({ ...graph, edges: [unknownRelEdge] }), { relationships: KNOWN_RELATIONSHIPS })
  assert(result.errors.some((e) => e.code === "EDGE_RELATIONSHIP_UNKNOWN"), "a relationship outside a declared vocabulary should raise EDGE_RELATIONSHIP_UNKNOWN")
}

// 8. Invalid domain
{
  const badNode = createNode({ id: createNodeId("mystery", "category", "x"), type: "category", domain: "mystery", label: "Mystery" })
  const graph = createGraph({ id: "invalid-domain-graph", domains: KNOWN_FINANCIAL_DOMAINS, nodes: [badNode] })
  const result = validateGraph(graph)
  assert(result.errors.some((e) => e.code === "NODE_DOMAIN_UNKNOWN"), "a node referencing an undeclared domain should raise NODE_DOMAIN_UNKNOWN")
}

// 8b. Self-reference prohibited
{
  const graph = buildValidGraph()
  const loop = createEdge({ id: "self-loop", source: graph.nodes[0].id, target: graph.nodes[0].id, relationship: "funds" })
  const result = validateGraph(createGraph({ ...graph, edges: [loop] }))
  assert(result.errors.some((e) => e.code === "EDGE_SELF_REFERENCE"), "an edge from a node to itself should raise EDGE_SELF_REFERENCE")
}

// 8c. Malformed graph
{
  const result = validateGraph(null)
  assert(result.valid === false && result.errors[0].code === "GRAPH_MALFORMED", "a non-object graph should raise GRAPH_MALFORMED")

  const shapeResult = validateGraph({ id: "bad-shape", domains: [], nodes: "not-an-array", edges: [] })
  assert(shapeResult.errors.some((e) => e.code === "GRAPH_MALFORMED"), "a graph with a non-array nodes field should raise GRAPH_MALFORMED")
}

// 9. Deterministic identity
{
  const idA = createNodeId("income", "category", "salary")
  const idB = createNodeId("income", "category", "salary")
  assert(idA === idB, "createNodeId must be deterministic for the same inputs")

  const edgeIdA = createEdgeId("a", "funds", "b")
  const edgeIdB = createEdgeId("a", "funds", "b")
  assert(edgeIdA === edgeIdB, "createEdgeId must be deterministic for the same inputs")
}

// 10. Serialization
{
  const graph = buildValidGraph()
  const json = serializeGraph(graph)
  const restored = deserializeGraph(json)
  assert(JSON.stringify(restored) === JSON.stringify(graph), "serializeGraph -> deserializeGraph must round-trip losslessly")
  assert(validateGraph(restored).valid === true, "a round-tripped valid graph must still validate")
}

// 11. Immutable transformation behavior
{
  const graph = buildValidGraph()
  assert(Object.isFrozen(graph), "a constructed graph must be frozen")
  assert(Object.isFrozen(graph.nodes) && Object.isFrozen(graph.edges) && Object.isFrozen(graph.domains), "graph collections must be frozen")

  let threw = false
  try {
    graph.nodes.push(createNode({ id: "x-a-1", type: "a", domain: "income", label: "X" }))
  } catch {
    threw = true
  }
  assert(threw, "mutating a frozen graph's nodes array must throw")

  const extraNode = createNode({ id: createNodeId("income", "category", "bonus"), type: "category", domain: "income", label: "Bonus" })
  const nextGraph = withNode(graph, extraNode)
  assert(nextGraph !== graph, "withNode must return a new graph instance")
  assert(graph.nodes.length === 2, "the original graph must be unchanged after withNode")
  assert(nextGraph.nodes.length === 3, "the new graph must contain the added node")

  const clone = cloneGraph(graph)
  assert(clone !== graph && JSON.stringify(clone) === JSON.stringify(graph), "cloneGraph must produce an equal but distinct graph")
}

console.log(`Financial graph contract tests: ${passed} assertions passed.`)
