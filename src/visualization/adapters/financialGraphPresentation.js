// Presentation for a builder-produced FinancialGraph scene: the pre-formatted
// `detail` strings and relative `magnitude`s the Layer 4D adapter accepts.
//
// No financial calculation happens here:
// - Core and domain nodes reuse the EXISTING scene's presentation verbatim
//   (createFinancialSpatialScene over the app's KPI/projection model), so the
//   graph path shows exactly the figures the current view shows.
// - Record nodes display their own transported Money, formatted in their own
//   currency. Sizes are compared only between records of ONE currency; a domain
//   holding several currencies gets uniform sizes (no cross-currency comparison).
// - Category nodes carry no totals in the graph; their figure comes from the
//   existing useFinancialBreakdown selector, and only when every transaction in
//   the category is in the reporting currency (otherwise that sum would mix
//   currencies) — else the detail is the transaction count.

import { toMajor } from "../../financial/projection/projectionMoneyAdapter.js"
import { MIN_CHILD_MAGNITUDE } from "./financialSpatialAdapter.js"

// Which transported Money field a record node is shown by.
const PRIMARY_FIELD = Object.freeze({
  asset: "value",
  liability: "value",
  investment: "value",
  debt: "balance",
  "savings-plan": "current",
})

function relative(entries) {
  // entries: [{ id, size }] of one currency -> { id: magnitude }
  const peak = Math.max(0, ...entries.map((entry) => entry.size))
  return Object.fromEntries(entries.map((entry) => [entry.id, peak > 0 ? Math.min(1, Math.max(MIN_CHILD_MAGNITUDE, entry.size / peak)) : 1]))
}

/**
 * @param {object} input
 * @param {import("../../financial/graph/contracts.js").FinancialGraph} input.graph  From createFinancialGraphFromModel.
 * @param {import("../../spatial/contracts.js").SpatialScene} input.baseScene  createFinancialSpatialScene(model) for the same state.
 * @param {{ income?: {label: string, amount: number}[], expenses?: {label: string, amount: number}[] }} [input.categoryTotals]  useFinancialBreakdown output.
 * @param {(amount: number, currencyCode: string) => string} input.formatAmount  App-layer formatter (formatCurrencyAmount + numberFormat).
 * @param {string} input.coreNodeId
 * @returns {Record<string, { detail?: string, magnitude?: number }>}
 */
export function createFinancialGraphPresentation({ graph, baseScene, categoryTotals = {}, formatAmount, coreNodeId }) {
  const presentation = {}
  const reportingCurrency = graph.metadata?.reportingCurrency

  const baseCore = baseScene.nodes.find((node) => node.kind === "core")
  if (baseCore && coreNodeId) presentation[coreNodeId] = { detail: baseCore.detail || "" }
  for (const node of baseScene.nodes) {
    if (node.kind === "radial") presentation[node.id] = { detail: node.detail || "", magnitude: node.magnitude }
  }

  const byDomain = new Map()
  for (const node of graph.nodes) {
    if (node.type === "core") continue
    const list = byDomain.get(node.domain) ?? []
    list.push(node)
    byDomain.set(node.domain, list)
  }

  for (const [domain, nodes] of byDomain) {
    const sized = []
    for (const node of nodes) {
      if (node.type === "category") {
        const single = node.metadata.currencies.length === 1 && node.metadata.currencies[0] === reportingCurrency
        const total = single ? (categoryTotals[domain] || []).find((entry) => entry.label === node.metadata.category && entry.id !== "more") : null
        if (total && Number.isFinite(total.amount)) {
          presentation[node.id] = { detail: formatAmount(total.amount, reportingCurrency) }
          sized.push({ id: node.id, currency: reportingCurrency, size: Math.abs(total.amount) })
        } else {
          const count = node.metadata.transactionCount
          presentation[node.id] = { detail: `${count} transaction${count === 1 ? "" : "s"}`, magnitude: MIN_CHILD_MAGNITUDE }
        }
        continue
      }
      const money = node.metadata[PRIMARY_FIELD[node.type]]
      if (!money) continue
      presentation[node.id] = { detail: formatAmount(toMajor(money), money.currency) }
      sized.push({ id: node.id, currency: money.currency, size: Math.abs(money.amountMinor) })
    }
    const currencies = new Set(sized.map((entry) => entry.currency))
    const magnitudes = currencies.size === 1 ? relative(sized) : Object.fromEntries(sized.map((entry) => [entry.id, 1]))
    for (const [id, magnitude] of Object.entries(magnitudes)) presentation[id] = { ...presentation[id], magnitude }
  }

  return presentation
}
