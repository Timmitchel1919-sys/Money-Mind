// Layer 4D deterministic adapter tests — plain Node, no framework, no browser,
// mirrors the Layer 4A/4B/4C validation scripts. Exercises
// src/visualization/adapters/financialGraphSpatialAdapter.js with small
// deterministic FinancialGraph fixtures only.

import { readFileSync } from "node:fs"
import {
  createDomain,
  createEdge,
  createEdgeId,
  createFinancialGraphEngine,
  createGraph,
  createNode,
  createNodeId,
  selectNodesByDomains,
  selectNodeRelationships,
  composeGraphTransforms,
  serializeGraph,
} from "../../src/financial/graph/index.js"
import {
  createFinancialGraphSpatialScene,
  financialGraphSpatialAdapter,
  GRAPH_SPATIAL_ADAPTER_ERROR_CODES,
  GraphSpatialAdapterError,
  STRUCTURAL_RELATIONSHIPS,
} from "../../src/visualization/adapters/financialGraphSpatialAdapter.js"
import { createFinancialSpatialScene, FINANCIAL_SPATIAL_DOMAINS } from "../../src/visualization/adapters/financialSpatialAdapter.js"
import { NODE_PALETTE } from "../../src/spatial/runtime/nodes/nodeMaterials.js"

let passed = 0

function assert(condition, message) {
  if (!condition) throw new Error(`FAIL: ${message}`)
  passed += 1
}

function assertThrows(fn, code, message) {
  try {
    fn()
  } catch (error) {
    assert(error instanceof GraphSpatialAdapterError, `${message} (expected GraphSpatialAdapterError, got ${error?.name})`)
    assert(error.code === code, `${message} (expected code ${code}, got ${error.code})`)
    return
  }
  throw new Error(`FAIL: ${message} (expected a throw, none occurred)`)
}

// What the Layer 2 runtime needs to render a scene (SpatialScene.jsx,
// SpatialNode.jsx, SpatialEdges.jsx, nodeMaterials.js).
function assertRenderable(scene, label) {
  const ids = new Set(scene.nodes.map((n) => n.id))
  assert(ids.size === scene.nodes.length, `${label}: spatial node ids are unique`)
  assert(new Set(scene.edges.map((e) => e.id)).size === scene.edges.length, `${label}: spatial edge ids are unique`)
  for (const node of scene.nodes) {
    assert(["core", "radial", "child"].includes(node.kind), `${label}: node ${node.id} has a runtime kind`)
    assert(Array.isArray(node.position) && node.position.length === 3 && node.position.every(Number.isFinite), `${label}: node ${node.id} has a finite 3D position`)
    assert(typeof node.label === "string" && node.label.length > 0, `${label}: node ${node.id} has a label`)
    assert(node.domain === "financial", `${label}: node ${node.id} uses the SpatialDomain "financial"`)
    if (node.kind !== "core") assert(Boolean(NODE_PALETTE[node.tone]), `${label}: node ${node.id} tone "${node.tone}" exists in the runtime palette`)
    if (node.kind === "child") assert(scene.nodes.some((p) => p.id === node.parentId && p.kind === "radial"), `${label}: child ${node.id} parent is a radial node`)
    assert(!("amount" in node), `${label}: node ${node.id} carries no financial amount`)
    assert(Object.isFrozen(node) && Object.isFrozen(node.position), `${label}: node ${node.id} is frozen`)
  }
  for (const edge of scene.edges) {
    assert(ids.has(edge.sourceId) && ids.has(edge.targetId), `${label}: edge ${edge.id} has no dangling endpoint`)
    assert(Object.isFrozen(edge), `${label}: edge ${edge.id} is frozen`)
  }
  assert(Object.isFrozen(scene) && Object.isFrozen(scene.nodes) && Object.isFrozen(scene.edges), `${label}: scene is frozen`)
}

// --- Fixture: canonical six domains + a "goals" domain with no spatial slot,
// a savings sub-domain, a core node, and semantic edges.
const DOMAINS = [
  ...FINANCIAL_SPATIAL_DOMAINS.map((d) => createDomain({ id: d.id, label: d.label })),
  createDomain({ id: "savings-emergency", label: "Emergency savings", parentId: "savings" }),
  createDomain({ id: "net-worth", label: "Net Worth" }),
  createDomain({ id: "goals", label: "Goals" }),
]
const core = createNode({ id: "net-worth-core-money-mind", type: "core", domain: "net-worth", label: "Money Mind" })
const salary = createNode({ id: createNodeId("income", "category", "salary"), type: "category", domain: "income", label: "Salary" })
const bonus = createNode({ id: createNodeId("income", "category", "bonus"), type: "category", domain: "income", label: "Bonus" })
const rent = createNode({ id: createNodeId("expenses", "category", "rent"), type: "category", domain: "expenses", label: "Rent" })
const card = createNode({ id: createNodeId("debt", "account", "credit-card"), type: "account", domain: "debt", label: "Credit card" })
const buffer = createNode({ id: createNodeId("savings-emergency", "goal", "buffer"), type: "goal", domain: "savings-emergency", label: "Buffer", status: "projected" })
const house = createNode({ id: createNodeId("goals", "goal", "house"), type: "goal", domain: "goals", label: "House" })
const NODES = [core, salary, bonus, rent, card, buffer, house]
const edge = (source, relationship, target) => createEdge({ id: createEdgeId(source.id, relationship, target.id), source: source.id, target: target.id, relationship })
const EDGES = [
  edge(salary, "funds", rent),
  edge(salary, "contributes_to", buffer),
  edge(card, "reduces", core),
  edge(salary, "contributes_to", house), // endpoint in an unmapped domain
]
const graph = createGraph({ id: "layer-4d-fixture", domains: DOMAINS, nodes: NODES, edges: EDGES })
const graphJson = serializeGraph(graph)
const presentation = {
  [core.id]: { detail: "SRD 5,000.00" },
  income: { detail: "SRD 900.00", magnitude: 1 },
  debt: { detail: "SRD 400.00", magnitude: 0.44 },
  [salary.id]: { detail: "SRD 800.00", magnitude: 1 },
}

const result = createFinancialGraphSpatialScene(graph, { presentation, selection: { nodeId: salary.id } })
const { scene } = result

// 1. Valid graph -> valid, renderable spatial scene
assertRenderable(scene, "fixture scene")
assert(scene.id === "financial-graph-layer-4d-fixture", "scene id derives deterministically from graph id")

// 2. Node identity preservation
for (const node of [core, salary, bonus, rent, card, buffer]) {
  const spatial = scene.nodes.find((n) => n.id === node.id)
  assert(Boolean(spatial), `graph node ${node.id} keeps its id in the scene`)
  assert(spatial.entityId === node.id && spatial.label === node.label, `graph node ${node.id} keeps entityId/label`)
  assert(spatial.graphType === node.type && spatial.status === node.status && spatial.financialDomain === node.domain, `graph node ${node.id} keeps type/status/domain metadata`)
}
assert(scene.nodes.find((n) => n.id === core.id).kind === "core", "the core-type graph node becomes the scene core")
assert(JSON.stringify(scene.nodes.find((n) => n.id === core.id).position) === "[0,0,0]", "the core sits at the origin")

// 3. Edge identity + relationship preservation
for (const graphEdge of EDGES.slice(0, 3)) {
  const spatial = scene.edges.find((e) => e.id === graphEdge.id)
  assert(Boolean(spatial), `graph edge ${graphEdge.id} keeps its id`)
  assert(spatial.sourceId === graphEdge.source && spatial.targetId === graphEdge.target, `graph edge ${graphEdge.id} keeps direction`)
  assert(spatial.relationship === graphEdge.relationship && spatial.status === graphEdge.status, `graph edge ${graphEdge.id} keeps its canonical relationship/status`)
}

// 4. Domain mapping: canonical radial slots/tones, same positions as the existing scene
const reference = createFinancialSpatialScene({})
for (const domain of FINANCIAL_SPATIAL_DOMAINS) {
  const spatial = scene.nodes.find((n) => n.id === domain.id)
  const existing = reference.nodes.find((n) => n.id === domain.id)
  assert(spatial.kind === "radial" && spatial.tone === domain.tone, `domain ${domain.id} maps to a radial node with its canonical tone`)
  assert(JSON.stringify(spatial.position) === JSON.stringify(existing.position), `domain ${domain.id} uses the existing radial slot position`)
}
assert(scene.nodes.find((n) => n.id === buffer.id).parentId === "savings", "a sub-domain node renders in its top-level domain's slot")
assert(scene.nodes.find((n) => n.id === "income").childCount === 2, "radial childCount = mapped graph nodes in that domain")
assert(scene.nodes.filter((n) => n.kind === "radial").length === 6, "only canonical domains become radial nodes (no fabricated slot)")
assert(scene.edges.filter((e) => e.relationship === STRUCTURAL_RELATIONSHIPS.coreDomain).length === 6, "core -> domain structural edges for each mapped domain")
assert(scene.edges.filter((e) => e.relationship === STRUCTURAL_RELATIONSHIPS.domainItem).length === 5, "domain -> item structural edges for each child node")

// 5. Missing spatial domain: documented, not fabricated, no dangling edges
assert(JSON.stringify(result.coverage.unmappedDomains) === JSON.stringify(["net-worth", "goals"]), "domains without a spatial slot are reported")
assert(JSON.stringify(result.coverage.omittedNodeIds) === JSON.stringify([house.id]), "nodes in unmapped domains are omitted and reported (core is exempt)")
assert(JSON.stringify(result.coverage.omittedEdgeIds) === JSON.stringify([EDGES[3].id]), "edges touching an omitted node are omitted and reported")
assert(!scene.nodes.some((n) => n.id === "goals" || n.id === house.id), "no spatial node is fabricated for the unmapped domain")

// 6. Presentation passthrough (no financial calculation)
assert(scene.nodes.find((n) => n.id === "income").detail === "SRD 900.00", "domain detail comes verbatim from presentation")
assert(scene.nodes.find((n) => n.id === "debt").magnitude === 0.44, "magnitude comes verbatim from presentation")
assert(scene.nodes.find((n) => n.id === rent.id).magnitude === 1 && scene.nodes.find((n) => n.id === rent.id).detail === "", "absent presentation defaults to uniform size and no detail")
const adapterSource = readFileSync(new URL("../../src/visualization/adapters/financialGraphSpatialAdapter.js", import.meta.url), "utf8")
assert(!/\.amount\b|amountMinor|toMinor|projectFinancials|useFinancialKPIs/.test(adapterSource), "adapter source reads no amounts and calls no financial calculation")
assert(!/from\s+["'](three|@react-three|react|firebase)/.test(adapterSource) && !/firestore/i.test(adapterSource.replace(/\/\/.*$/gm, "")), "adapter imports no Three.js/R3F/React/Firebase")
assert(!/Math\.random|Date\.now|force|physics/i.test(adapterSource.replace(/\/\/.*$/gm, "")), "adapter has no randomness, clock, force layout or physics")
assertThrows(() => createFinancialGraphSpatialScene(graph, { presentation: { income: { magnitude: 5 } } }), GRAPH_SPATIAL_ADAPTER_ERROR_CODES.INVALID_PRESENTATION, "out-of-range magnitude is rejected")
assertThrows(() => createFinancialGraphSpatialScene(graph, { presentation: { income: { detail: 900 } } }), GRAPH_SPATIAL_ADAPTER_ERROR_CODES.INVALID_PRESENTATION, "a raw number as detail is rejected (formatting stays in the app layer)")

// 7. Selection mapping (GraphSelection -> SpatialSelection)
assert(result.selection.nodeId === salary.id && result.selection.edgeId === null, "a mapped selected graph node becomes the spatial selection")
assert(Object.isFrozen(result.selection), "selection is frozen")
assert(createFinancialGraphSpatialScene(graph).selection.nodeId === null, "no selection -> empty spatial selection")
assert(createFinancialGraphSpatialScene(graph, { selection: { nodeId: house.id } }).selection.nodeId === null, "selecting an omitted node yields no spatial selection (not a dangling one)")
const graphEngine = createFinancialGraphEngine(graph)
assert(createFinancialGraphSpatialScene(graphEngine, { selection: graphEngine.selectNode(card.id) }).selection.nodeId === card.id, "a Layer 4B engine selection maps directly")
assertThrows(() => createFinancialGraphSpatialScene(graph, { selection: { nodeId: "ghost" } }), GRAPH_SPATIAL_ADAPTER_ERROR_CODES.INVALID_SELECTION, "selecting a node not in the graph is rejected")

// 8. Invalid graph rejection
const dangling = { id: "broken", version: "1", domains: [createDomain({ id: "income", label: "Income" })], nodes: [salary], edges: [edge(salary, "funds", rent)], metadata: {} }
assertThrows(() => createFinancialGraphSpatialScene(dangling), GRAPH_SPATIAL_ADAPTER_ERROR_CODES.INVALID_GRAPH, "a graph with a dangling edge is rejected")
assertThrows(() => createFinancialGraphSpatialScene(null), GRAPH_SPATIAL_ADAPTER_ERROR_CODES.INVALID_GRAPH, "a non-graph is rejected")
const twoCores = createGraph({ id: "two-cores", domains: DOMAINS, nodes: [core, createNode({ id: "net-worth-core-other", type: "core", domain: "net-worth", label: "Other" })] })
assertThrows(() => createFinancialGraphSpatialScene(twoCores), GRAPH_SPATIAL_ADAPTER_ERROR_CODES.AMBIGUOUS_CORE, "two core nodes are rejected")
const clash = createGraph({ id: "clash", domains: DOMAINS, nodes: [createNode({ id: "income", type: "category", domain: "income", label: "Income item" })] })
assertThrows(() => createFinancialGraphSpatialScene(clash), GRAPH_SPATIAL_ADAPTER_ERROR_CODES.IDENTITY_CONFLICT, "a graph node reusing a domain's spatial id is rejected")
const cyclic = { id: "cyclic", version: "1", domains: [{ id: "a", label: "A", parentId: "b" }, { id: "b", label: "B", parentId: "a" }], nodes: [], edges: [], metadata: {} }
assertThrows(() => createFinancialGraphSpatialScene(cyclic), GRAPH_SPATIAL_ADAPTER_ERROR_CODES.INVALID_DOMAIN_HIERARCHY, "a cyclic domain hierarchy is rejected")

// 9. Determinism
assert(JSON.stringify(createFinancialGraphSpatialScene(graph, { presentation, selection: { nodeId: salary.id } })) === JSON.stringify(result), "identical input -> identical output")
const reordered = createGraph({ ...graph, domains: [...DOMAINS].reverse() })
assert(JSON.stringify(createFinancialGraphSpatialScene(reordered).scene.nodes.filter((n) => n.kind === "radial").map((n) => n.id)) === JSON.stringify(FINANCIAL_SPATIAL_DOMAINS.map((d) => d.id)), "radial order follows the canonical spatial order, not graph declaration order")

// 10. Immutability (input untouched, output frozen)
assert(serializeGraph(graph) === graphJson, "the source graph is never mutated")
assert(Object.isFrozen(result) && Object.isFrozen(result.coverage) && Object.isFrozen(result.coverage.omittedNodeIds), "result and coverage are frozen")

// 11. Layer 4C views map directly (graph -> transformation -> adapter)
const debtView = selectNodesByDomains(graph, ["debt", "net-worth"])
const debtScene = createFinancialGraphSpatialScene(debtView).scene
assertRenderable(debtScene, "debt view scene")
assert(JSON.stringify(debtScene.nodes.map((n) => n.id)) === JSON.stringify([core.id, "debt", card.id]), "a domain view maps to core + its domain + its items only")
assert(debtScene.edges.some((e) => e.id === EDGES[2].id), "the view's semantic edge survives mapping")
const salaryView = composeGraphTransforms((g) => selectNodeRelationships(g, salary.id, { direction: "outgoing" }))(graph)
const salaryScene = createFinancialGraphSpatialScene(salaryView).scene
assertRenderable(salaryScene, "composed view scene")
assert(!salaryScene.nodes.some((n) => n.kind === "core"), "a view without a core node maps to a scene without a core (no fabricated core)")

// 12. Empty graph behavior
const empty = createFinancialGraphSpatialScene(createGraph({ id: "empty" }))
assert(empty.scene.nodes.length === 0 && empty.scene.edges.length === 0, "an empty graph maps to an empty, valid scene")
const domainsOnly = createFinancialGraphSpatialScene(createGraph({ id: "domains-only", domains: DOMAINS.slice(0, 6) })).scene
assertRenderable(domainsOnly, "domains-only scene")
assert(domainsOnly.nodes.length === 6 && domainsOnly.edges.length === 0, "declared domains with no nodes map to bare radial nodes, no edges")

// FinancialVisualizationAdapter conformance
assert(JSON.stringify(financialGraphSpatialAdapter.toScene(graph, { presentation })) === JSON.stringify(createFinancialGraphSpatialScene(graph, { presentation }).scene), "toScene returns the same scene")

console.log(`Financial graph spatial adapter tests: ${passed} assertions passed.`)
