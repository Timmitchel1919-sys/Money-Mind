// Financial Graph Builder deterministic tests — plain Node, no framework,
// mirrors the Layer 4A–4D validation scripts. Fixtures use the record shapes
// App.jsx actually writes to Firestore (see handleAdd* in src/App.jsx) and
// Firestore-style mixed-case document ids. The reporting currency is always
// passed explicitly (SRD = the app's default setting); nothing assumes USD.

import { createElement } from "react"
import { renderToString } from "react-dom/server"
import {
  createFinancialGraphEngine,
  createFinancialGraphFromModel,
  CORE_NODE_ID,
  FINANCIAL_GRAPH_BUILDER_ERROR_CODES,
  FINANCIAL_GRAPH_DOMAINS,
  FinancialGraphBuilderError,
  KNOWN_FINANCIAL_DOMAINS,
  KNOWN_RELATIONSHIPS,
  selectNodesByDomains,
  selectNodeRelationships,
  serializeGraph,
  validateGraph,
} from "../../src/financial/graph/index.js"
import { createFinancialGraphSpatialScene } from "../../src/visualization/adapters/financialGraphSpatialAdapter.js"
import { createFinancialGraphPresentation } from "../../src/visualization/adapters/financialGraphPresentation.js"
import { createFinancialSpatialScene } from "../../src/visualization/adapters/financialSpatialAdapter.js"
import useFinancialKPIs from "../../src/hooks/useFinancialKPIs.js"
import useFinancialBreakdown from "../../src/hooks/useFinancialBreakdown.js"
import useFinancialGraph from "../../src/hooks/useFinancialGraph.js"

let passed = 0
function assert(condition, message) {
  if (!condition) throw new Error(`FAIL: ${message}`)
  passed += 1
}
function assertBuilderThrows(fn, code, message) {
  try {
    fn()
  } catch (error) {
    assert(error instanceof FinancialGraphBuilderError, `${message} (expected FinancialGraphBuilderError, got ${error?.name}: ${error?.message})`)
    assert(error.code === code, `${message} (expected ${code}, got ${error.code})`)
    return
  }
  throw new Error(`FAIL: ${message} (expected a throw)`)
}
const nodeIds = (graph) => graph.nodes.map((n) => n.id)
const byType = (graph, type) => graph.nodes.filter((n) => n.type === type)
const deepFrozen = (value) => value === null || typeof value !== "object" || (Object.isFrozen(value) && Object.values(value).every(deepFrozen))

function assertValidGraph(graph, label) {
  assert(validateGraph(graph, { relationships: KNOWN_RELATIONSHIPS }).valid, `${label}: passes Layer 4A validateGraph`)
  const ids = new Set(nodeIds(graph))
  assert(graph.edges.every((e) => ids.has(e.source) && ids.has(e.target)), `${label}: no dangling edges`)
  assert(graph.nodes.filter((n) => n.type === "core").length === 1, `${label}: exactly one core node`)
  assert(deepFrozen(graph), `${label}: output graph is deeply frozen`)
  assert(Boolean(createFinancialGraphEngine(graph)), `${label}: accepted by the Layer 4B engine`)
}

// --- Fixtures (App.jsx record shapes) ---
const TX = [
  { id: "8fKq2LmN0pRsTuVw1XyZ", type: "income", category: "Salary", amount: 12500.1, description: "July", date: "2026-07-01" },
  { id: "aB3dE5fG7hJ9kL1mN3pQ", type: "income", category: "Salary", amount: 12500.1, description: "Aug", date: "2026-08-01" },
  { id: "cD4eF6gH8iJ0kL2mN4oP", type: "expense", category: "Rent", amount: 4200, description: "", date: "2026-08-02" },
  { id: "eF5gH7iJ9kL1mN3oP5qR", type: "expense", category: "Food & Drinks", amount: 310.45, description: "", date: "2026-08-03" },
  { id: "gH6iJ8kL0mN2oP4qR6sT", type: "expense", category: "", amount: 20, description: "", date: "2026-08-04" },
]
const ASSETS = [{ id: "As1Hou5e", name: "House", value: 185000.5 }, { id: "As2Car", name: "Car", value: 42000.25 }]
const LIABILITIES = [{ id: "Li1Mortgage", name: "Mortgage", value: 91000.4 }]
const DEBTS = [{ id: "De1Card", name: "Credit card", balance: 4500.75, rate: 18.5, payment: 125 }]
const INVESTMENTS = [{ id: "In1Etf", name: "World ETF", type: "ETF", cost: 40000, value: 51234.56 }, { id: "In2Stk", name: "ACME", type: "Stock", cost: 10000, value: 9870.12 }]
const SAVINGS = [{ id: "Sa1Buffer", name: "Emergency buffer", target: 20000, current: 8000, monthly: 400.25 }]
const FULL = { currencyCode: "SRD", transactions: TX, assets: ASSETS, liabilities: LIABILITIES, debts: DEBTS, investments: INVESTMENTS, savingsPlans: SAVINGS }

// 1. Empty model
{
  const g = createFinancialGraphFromModel({ currencyCode: "SRD" })
  assertValidGraph(g, "empty")
  assert(g.nodes.length === 1 && g.nodes[0].id === CORE_NODE_ID && g.edges.length === 0, "empty model -> core only, no fabricated entities")
  assert(g.domains.length === FINANCIAL_GRAPH_DOMAINS.length, "empty model still declares every domain (valid empty domains)")
  assert(JSON.stringify(g.domains.slice(0, 6).map((d) => d.id)) === JSON.stringify(KNOWN_FINANCIAL_DOMAINS.map((d) => d.id)), "canonical 4A domains reused, in canonical order")
}

// 2. Income only / 3. expenses only / 4. income + expenses
{
  const income = createFinancialGraphFromModel({ currencyCode: "SRD", transactions: TX.slice(0, 2) })
  assertValidGraph(income, "income only")
  const salary = income.nodes.find((n) => n.domain === "income")
  assert(byType(income, "category").length === 1 && salary.metadata.transactionCount === 2, "two salary transactions -> one income category node")
  assert(JSON.stringify(salary.metadata.transactionIds) === JSON.stringify([TX[0].id, TX[1].id].sort()), "category records its member transaction ids")
  assert(!("amount" in salary.metadata) && !("total" in salary.metadata), "category carries no computed total")

  const expenses = createFinancialGraphFromModel({ currencyCode: "SRD", transactions: TX.slice(2) })
  assertValidGraph(expenses, "expenses only")
  assert(byType(expenses, "category").every((n) => n.domain === "expenses") && byType(expenses, "category").length === 3, "expense categories incl. Uncategorized")
  assert(expenses.nodes.some((n) => n.label === "Uncategorized"), "blank category -> 'Uncategorized' (V1 grouping rule)")

  const both = createFinancialGraphFromModel({ currencyCode: "SRD", transactions: TX })
  assertValidGraph(both, "income + expenses")
  assert(byType(both, "category").length === 4, "income + expense categories")
  assert(both.edges.length === 0, "no income -> expense/savings edge is fabricated")
  const sameLabel = createFinancialGraphFromModel({ currencyCode: "SRD", transactions: [{ id: "t1", type: "income", category: "Other", amount: 1 }, { id: "t2", type: "expense", category: "Other", amount: 1 }] })
  assert(sameLabel.nodes.filter((n) => n.label === "Other").length === 2, "same label in income and expenses -> two distinct nodes")
}

// 5. Savings / 6. debt / 7. assets / 8. investments
{
  const g = createFinancialGraphFromModel(FULL)
  assertValidGraph(g, "full model")
  const savings = byType(g, "savings-plan")[0]
  assert(savings.domain === "savings" && savings.metadata.current.amountMinor === 800000 && savings.metadata.monthly.amountMinor === 40025, "savings plan -> node with minor-unit current/target/monthly")
  const debt = byType(g, "debt")[0]
  assert(debt.domain === "debt" && debt.metadata.balance.amountMinor === 450075 && debt.metadata.payment.amountMinor === 12500 && debt.metadata.ratePct === 18.5, "debt -> node with balance/payment Money and rate")
  const house = byType(g, "asset").find((n) => n.label === "House")
  assert(house.domain === "assets" && house.metadata.value.amountMinor === 18500050, "asset -> node with minor-unit value")
  const etf = byType(g, "investment").find((n) => n.label === "World ETF")
  assert(etf.metadata.value.amountMinor === 5123456 && etf.metadata.cost.amountMinor === 4000000 && etf.metadata.assetClass === "ETF", "investment -> value/cost Money + asset class")
  assert(byType(g, "liability")[0].domain === "liabilities", "liabilities keep their own (real) domain")
}

// 9. Multiple domains: edges = the net-worth relationship only
{
  const g = createFinancialGraphFromModel(FULL)
  assert(g.edges.length === ASSETS.length + LIABILITIES.length, "edges only for assets and liabilities (net worth = assets - liabilities)")
  assert(g.edges.every((e) => e.target === CORE_NODE_ID), "every edge targets the core")
  assert(g.edges.filter((e) => e.relationship === "increases").length === 2 && g.edges.filter((e) => e.relationship === "reduces").length === 1, "assets increase, liabilities reduce")
  assert(g.edges.every((e) => KNOWN_RELATIONSHIPS.includes(e.relationship)), "canonical relationship vocabulary only")
  assert(!g.edges.some((e) => /debt|saving|investment|income|expense/.test(e.source.split("-")[0])), "no edges fabricated for debt/savings/investments/transactions")
}

// 10. Hierarchical domain data (sub-domain parent chains preserved by 4C views; 4D slots)
{
  const g = createFinancialGraphFromModel(FULL)
  const assetsView = selectNodesByDomains(g, ["assets", "net-worth"])
  assert(validateGraph(assetsView).valid && assetsView.nodes.length === 3 && assetsView.edges.length === 2, "4C domain view over the built graph: core + 2 assets + their edges")
  const coreView = selectNodeRelationships(g, CORE_NODE_ID, { direction: "incoming", relationships: ["reduces"] })
  assert(coreView.nodes.length === 2 && coreView.edges[0].relationship === "reduces", "4C relationship view: what reduces net worth")
  const scene = createFinancialGraphSpatialScene(g).scene
  assert(scene.nodes.filter((n) => n.kind === "radial").length === 6 && scene.nodes.some((n) => n.kind === "core" && n.id === CORE_NODE_ID), "4D: core + six canonical domain slots")
  const coverage = createFinancialGraphSpatialScene(g).coverage
  assert(JSON.stringify(coverage.unmappedDomains) === JSON.stringify(["liabilities", "net-worth"]) && coverage.omittedNodeIds.length === 1, "4D: liabilities reported as unmapped, not silently dropped")
}

// 11. Multiple currencies: preserved per record, never converted
{
  const g = createFinancialGraphFromModel({
    currencyCode: "SRD",
    assets: [{ id: "a-srd", name: "Land", value: 10000 }, { id: "a-usd", name: "Car", value: 10000, currency: "usd" }, { id: "a-eur", name: "Flat", value: 10000, currency: "EUR" }],
    transactions: [{ id: "t-srd", type: "income", category: "Salary", amount: 100 }, { id: "t-eur", type: "income", category: "Salary", amount: 50, currency: "EUR" }],
    investments: [{ id: "i-jpy", name: "Nikkei", value: 1234.6, currency: "JPY" }, { id: "i-bhd", name: "Bond", value: 10.1236, currency: "BHD" }],
  })
  assertValidGraph(g, "multi-currency")
  const asset = (id) => g.nodes.find((n) => n.metadata.sourceId === id)
  assert(asset("a-srd").metadata.value.currency === "SRD" && asset("a-srd").metadata.value.amountMinor === 1000000, "currency-less record -> reporting currency")
  assert(asset("a-usd").metadata.value.currency === "USD" && asset("a-usd").metadata.value.amountMinor === 1000000, "record currency preserved (normalized), SRD 10,000 never becomes USD and vice versa")
  assert(asset("a-eur").metadata.currency === "EUR", "EUR record stays EUR")
  assert(asset("i-jpy").metadata.value.amountMinor === 1235 && asset("i-bhd").metadata.value.amountMinor === 10124, "minor units follow each currency's precision (JPY 0, BHD 3 digits)")
  const salary = g.nodes.find((n) => n.type === "category")
  assert(JSON.stringify(salary.metadata.currencies) === JSON.stringify(["EUR", "SRD"]), "a mixed-currency category records both currencies and no total")
  assert(g.metadata.reportingCurrency === "SRD", "reporting currency recorded on the graph")
  const usdReporting = createFinancialGraphFromModel({ currencyCode: "USD", assets: [{ id: "a1", name: "X", value: 5 }] })
  assert(usdReporting.nodes[1].metadata.value.currency === "USD", "the reporting currency is whatever the caller passes (no SRD/USD default)")
}

// 12. Partial model
{
  const g = createFinancialGraphFromModel({ currencyCode: "EUR", investments: INVESTMENTS, debts: [] })
  assertValidGraph(g, "partial")
  assert(g.nodes.length === 1 + INVESTMENTS.length && g.edges.length === 0, "partial model -> only the entities that exist")
  const optional = createFinancialGraphFromModel({ currencyCode: "SRD", debts: [{ id: "d1", name: "Loan", balance: 100 }], investments: [{ id: "i1", name: "Gift", value: 5 }] })
  assert(!("payment" in byType(optional, "debt")[0].metadata) && !("cost" in byType(optional, "investment")[0].metadata), "absent optional amounts are omitted, never zero-filled")
  const unnamed = createFinancialGraphFromModel({ currencyCode: "SRD", assets: [{ id: "x", value: 1 }] })
  assert(byType(unnamed, "asset")[0].label === "Unnamed asset", "unnamed record gets a label, identity still from its id")
  const other = createFinancialGraphFromModel({ currencyCode: "SRD", transactions: [{ id: "t", type: "transfer", category: "X", amount: 5 }] })
  assert(byType(other, "category").length === 0 && other.metadata.unclassifiedTransactionCount === 1, "non income/expense transactions are counted, not silently dropped")
}

// 13. Invalid identifiers / 14. duplicates / other invalid data
{
  const E = FINANCIAL_GRAPH_BUILDER_ERROR_CODES
  assertBuilderThrows(() => createFinancialGraphFromModel({ ...FULL, assets: [{ name: "No id", value: 1 }] }), E.MISSING_ID, "record without id is rejected")
  assertBuilderThrows(() => createFinancialGraphFromModel({ ...FULL, assets: [{ id: "  ", name: "Blank", value: 1 }] }), E.MISSING_ID, "blank id is rejected")
  assertBuilderThrows(() => createFinancialGraphFromModel({ ...FULL, debts: [DEBTS[0], { ...DEBTS[0] }] }), E.DUPLICATE_ID, "duplicate record id is rejected")
  assertBuilderThrows(() => createFinancialGraphFromModel({ ...FULL, transactions: [TX[0], TX[0]] }), E.DUPLICATE_ID, "duplicate transaction id is rejected")
  assertBuilderThrows(() => createFinancialGraphFromModel({ ...FULL, assets: [{ id: "a", name: "A", value: NaN }] }), E.INVALID_AMOUNT, "NaN amount is rejected (not repaired to 0)")
  assertBuilderThrows(() => createFinancialGraphFromModel({ ...FULL, assets: [{ id: "a", name: "A", value: "12,50" }] }), E.INVALID_AMOUNT, "malformed amount string is rejected")
  assertBuilderThrows(() => createFinancialGraphFromModel({ ...FULL, assets: [{ id: "a", name: "A" }] }), E.INVALID_AMOUNT, "missing required amount is rejected")
  assertBuilderThrows(() => createFinancialGraphFromModel({ ...FULL, transactions: [{ id: "t", type: "income", category: "X", amount: Infinity }] }), E.INVALID_AMOUNT, "infinite transaction amount is rejected")
  assertBuilderThrows(() => createFinancialGraphFromModel({ ...FULL, investments: [{ id: "i", name: "Huge", value: 1e20 }] }), E.INVALID_AMOUNT, "amount beyond safe minor units is rejected")
  assertBuilderThrows(() => createFinancialGraphFromModel({ ...FULL, assets: [{ id: "a", name: "A", value: 1, currency: "XYZ" }] }), E.INVALID_CURRENCY, "unknown currency code is rejected")
  assertBuilderThrows(() => createFinancialGraphFromModel({ ...FULL, currencyCode: undefined }), E.INVALID_CURRENCY, "missing reporting currency is rejected (no implicit USD/SRD)")
  assertBuilderThrows(() => createFinancialGraphFromModel({ ...FULL, currencyCode: "dollars" }), E.INVALID_CURRENCY, "malformed reporting currency is rejected")
  assertBuilderThrows(() => createFinancialGraphFromModel({ ...FULL, debts: [{ id: "d", name: "D", balance: 1, rate: "high" }] }), E.INVALID_AMOUNT, "non-numeric rate is rejected")
  assertBuilderThrows(() => createFinancialGraphFromModel({ ...FULL, assets: "nope" }), E.INVALID_MODEL, "non-array collection is rejected")
  assertBuilderThrows(() => createFinancialGraphFromModel(null), E.INVALID_MODEL, "missing model is rejected")
  // Case-distinct Firestore ids never collide.
  const cased = createFinancialGraphFromModel({ currencyCode: "SRD", assets: [{ id: "AbC", name: "1", value: 1 }, { id: "abc", name: "2", value: 1 }] })
  assert(new Set(nodeIds(cased)).size === 3, "case-distinct source ids map to distinct node ids")
  const food = createFinancialGraphFromModel({ currencyCode: "SRD", transactions: [{ id: "t1", type: "expense", category: "Food", amount: 1 }, { id: "t2", type: "expense", category: "food", amount: 1 }] })
  assert(byType(food, "category").length === 2, "'Food' and 'food' stay separate categories (V1 groups by exact label)")
}

// 15. Determinism + immutability
{
  const snapshot = JSON.stringify(FULL)
  const a = createFinancialGraphFromModel(FULL)
  const b = createFinancialGraphFromModel(FULL)
  assert(serializeGraph(a) === serializeGraph(b), "repeated builds are identical")
  const shuffled = { ...FULL, transactions: [...TX].reverse(), assets: [...ASSETS].reverse(), investments: [...INVESTMENTS].reverse() }
  assert(serializeGraph(createFinancialGraphFromModel(shuffled)) === serializeGraph(a), "input order does not change ids or ordering")
  assert(JSON.stringify(FULL) === snapshot, "the source model is not mutated")
  assert(nodeIds(a).every((id) => !/-\d+$/.test(id) || /-[0-9a-f]{8}$/.test(id)), "no index-based node ids")
  assert(nodeIds(a).includes("assets-asset-as1hou5e-" + nodeIds(a).find((id) => id.startsWith("assets-asset-as1hou5e-")).split("-").pop()), "node id derives from the source record id")
  assert(!serializeGraph(a).includes("Math.random") && !("generatedAt" in a.metadata), "no timestamp or random identity")
  const domainOrder = a.nodes.slice(1).map((n) => FINANCIAL_GRAPH_DOMAINS.findIndex((d) => d.id === n.domain))
  assert(domainOrder.every((v, i) => i === 0 || v >= domainOrder[i - 1]), "nodes ordered by canonical domain order")
  assert(a.edges.every((e, i) => i === 0 || a.edges[i - 1].id < e.id), "edges ordered by id")
}

// End-to-end through the REAL hooks (react-dom/server): records -> useFinancialKPIs /
// useFinancialBreakdown / useFinancialGraph -> presentation -> 4D scene.
{
  let captured
  function Probe() {
    const kpis = useFinancialKPIs({ transactions: TX, assets: ASSETS, liabilities: LIABILITIES, debts: DEBTS, investments: INVESTMENTS, savingsPlans: SAVINGS })
    const breakdown = useFinancialBreakdown({ transactions: TX, assets: ASSETS, debts: DEBTS, investments: INVESTMENTS, savingsPlans: SAVINGS })
    const { graph, error } = useFinancialGraph({ currencyCode: "SRD", transactions: TX, assets: ASSETS, liabilities: LIABILITIES, debts: DEBTS, investments: INVESTMENTS, savingsPlans: SAVINGS })
    const off = useFinancialGraph({ enabled: false, currencyCode: "SRD", assets: ASSETS })
    const bad = useFinancialGraph({ currencyCode: "SRD", assets: [{ name: "no id", value: 1 }] })
    captured = { kpis, breakdown, graph, error, off, bad }
    return null
  }
  renderToString(createElement(Probe))
  const { kpis, breakdown, graph, error, off, bad } = captured
  assert(error === null && graph && validateGraph(graph).valid, "useFinancialGraph builds a valid graph from hook data")
  assert(off.graph === null && off.error === null, "flag off -> no graph built")
  assert(bad.graph === null && bad.error instanceof FinancialGraphBuilderError, "rejection is returned as error, never a partial graph")

  // Same Intl call as src/utils/currencyConversion.js formatCurrencyAmount for numberFormat "1,234.56"
  // (that module isn't importable in plain Node: extensionless import).
  const format = (amount, code) => new Intl.NumberFormat("en-US", { style: "currency", currency: code, minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount)
  const model = {
    core: { label: "Money Mind", detail: format(kpis.netWorth, "SRD"), healthScore: kpis.healthScore },
    domains: {
      income: { amount: kpis.totalIncome, detail: format(kpis.totalIncome, "SRD") },
      investments: { amount: kpis.investmentValue, detail: format(kpis.investmentValue, "SRD") },
      assets: { amount: kpis.totalAssets, detail: format(kpis.totalAssets, "SRD") },
      debt: { amount: kpis.totalDebt, detail: format(kpis.totalDebt, "SRD") },
      expenses: { amount: kpis.totalExpenses, detail: format(kpis.totalExpenses, "SRD") },
      savings: { amount: kpis.totalSavingsCurrent, detail: format(kpis.totalSavingsCurrent, "SRD") },
    },
  }
  const baseScene = createFinancialSpatialScene(model)
  const presentation = createFinancialGraphPresentation({ graph, baseScene, categoryTotals: breakdown, formatAmount: format, coreNodeId: CORE_NODE_ID })
  const { scene, coverage } = createFinancialGraphSpatialScene(graph, { presentation })
  const node = (id) => scene.nodes.find((n) => n.id === id)
  assert(node(CORE_NODE_ID).detail === baseScene.nodes.find((n) => n.kind === "core").detail, "core shows the existing KPI net worth, not a recomputed one")
  for (const radial of baseScene.nodes.filter((n) => n.kind === "radial")) {
    assert(node(radial.id).detail === radial.detail && node(radial.id).magnitude === radial.magnitude && JSON.stringify(node(radial.id).position) === JSON.stringify(radial.position), `domain ${radial.id} matches the existing scene exactly`)
  }
  const houseNode = scene.nodes.find((n) => n.label === "House")
  assert(houseNode.kind === "child" && houseNode.parentId === "assets" && houseNode.detail === format(185000.5, "SRD"), "asset child shows its own record value in its own currency")
  const salaryNode = scene.nodes.find((n) => n.label === "Salary")
  assert(salaryNode.detail === format(25000.2, "SRD"), "category detail comes from the existing useFinancialBreakdown total")
  assert(scene.nodes.every((n) => !("amount" in n)), "scene nodes carry no raw amounts")
  const ids = new Set(scene.nodes.map((n) => n.id))
  assert(scene.edges.every((e) => ids.has(e.sourceId) && ids.has(e.targetId)), "no dangling spatial edges end-to-end")
  assert(scene.edges.filter((e) => e.relationship === "increases").length === 2, "asset -> core semantic edges reach the scene")
  assert(coverage.omittedNodeIds.length === 1 && coverage.omittedEdgeIds.length === 1, "liability node/edge reported as omitted (no spatial slot)")

  // Mixed-currency domain: no cross-currency size comparison; no breakdown sum for a mixed category.
  const mixed = createFinancialGraphFromModel({ currencyCode: "SRD", assets: [{ id: "a1", name: "Land", value: 100 }, { id: "a2", name: "Car", value: 1, currency: "EUR" }], transactions: [{ id: "t1", type: "income", category: "Salary", amount: 10 }, { id: "t2", type: "income", category: "Salary", amount: 5, currency: "EUR" }] })
  const mixedPresentation = createFinancialGraphPresentation({ graph: mixed, baseScene, categoryTotals: { income: [{ id: "Salary", label: "Salary", amount: 15 }] }, formatAmount: format, coreNodeId: CORE_NODE_ID })
  const mixedAssets = mixed.nodes.filter((n) => n.type === "asset").map((n) => mixedPresentation[n.id])
  assert(mixedAssets.every((p) => p.magnitude === 1) && mixedAssets.some((p) => p.detail.includes("€")), "mixed-currency domain: uniform sizes, each record in its own currency")
  const mixedSalary = mixedPresentation[mixed.nodes.find((n) => n.type === "category").id]
  assert(mixedSalary.detail === "2 transactions", "mixed-currency category never shows a mixed-currency sum")
}

console.log(`Financial graph builder tests: ${passed} assertions passed.`)
