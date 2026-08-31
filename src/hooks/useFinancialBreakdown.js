import { useMemo } from "react"

// Layer 5 (V2 graph drill-down): a pure per-domain line-item selector, mirroring
// useFinancialKPIs in style. It reads already-loaded hook arrays only — no
// Firestore, no rendering concerns (ADR-0002). Output feeds the spatial adapter
// as `children` for each domain node.

const MAX_CHILDREN = 8

function num(value) {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

// Sort desc by amount; collapse the tail past MAX_CHILDREN into one "+N more"
// entry so nothing is silently dropped.
function rank(items) {
  const sorted = [...items].sort((a, b) => b.amount - a.amount)
  if (sorted.length <= MAX_CHILDREN) return sorted
  const head = sorted.slice(0, MAX_CHILDREN)
  const rest = sorted.slice(MAX_CHILDREN)
  const restTotal = rest.reduce((sum, item) => sum + item.amount, 0)
  return [...head, { id: "more", label: `+${rest.length} more`, amount: restTotal }]
}

function groupByCategory(transactions, type) {
  const totals = new Map()
  for (const tx of transactions) {
    if (tx.type !== type) continue
    const label = String(tx.category || "").trim() || "Uncategorized"
    totals.set(label, (totals.get(label) || 0) + Math.abs(num(tx.amount)))
  }
  return [...totals.entries()].map(([label, amount]) => ({ id: label, label, amount }))
}

function fromItems(items, valueKey) {
  return items.map((item, index) => ({
    id: item.id ?? String(index),
    label: String(item.name || "").trim() || `Item ${index + 1}`,
    amount: Math.abs(num(item[valueKey])),
  }))
}

/**
 * @returns {{ income: object[], expenses: object[], assets: object[],
 *   debt: object[], investments: object[], savings: object[] }}
 *   Each entry: { id, label, amount }, sorted desc, capped with a "+N more" tail.
 */
export default function useFinancialBreakdown({
  transactions = [],
  assets = [],
  debts = [],
  investments = [],
  savingsPlans = [],
}) {
  return useMemo(() => ({
    income: rank(groupByCategory(transactions, "income")),
    expenses: rank(groupByCategory(transactions, "expense")),
    assets: rank(fromItems(assets, "value")),
    debt: rank(fromItems(debts, "balance")),
    investments: rank(fromItems(investments, "value")),
    savings: rank(fromItems(savingsPlans, "current")),
  }), [transactions, assets, debts, investments, savingsPlans])
}
