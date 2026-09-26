// Financial Graph Builder: the existing Money Mind domain records -> a canonical
// Layer 4A FinancialGraph.
//
// Source of truth: the arrays the per-domain hooks already load (useTransactions,
// useAssets [assets + liabilities], useDebt, useInvestments, useSavings). The
// builder never reads Firestore, React state, or the renderer.
//
// It is a MAPPING, not a calculation layer:
// - One node per real record (asset, liability, debt, investment, savings plan),
//   plus one node per real income/expense transaction category (the grouping
//   V1 itself uses: useFinancialKPIs / useFinancialBreakdown / budgets).
// - Monetary fields are transported per record as minor-unit Money
//   ({ amountMinor, currency }) using the Layer 1 currency-aware boundary
//   (projectionMoneyAdapter.toMinor). Nothing is summed, netted, projected or
//   converted — category nodes carry membership (transaction ids, currencies),
//   not totals.
// - Edges only where the model defines a relationship: net worth = assets -
//   liabilities (useFinancialKPIs), so asset -> core "increases" and liability
//   -> core "reduces". No other relationship exists between records today.
// - Currency: a record's own `currency` if present, otherwise the explicit
//   reporting currency the caller supplies. No default, no conversion.
// - Invalid input (missing/duplicate ids, malformed currency, non-numeric
//   amounts) is rejected with FinancialGraphBuilderError, never repaired.

import { createDomain, createEdge, createGraph, createNode } from "../contracts.js"
import { createEdgeId, createNodeId, isValidIdentifier } from "../identity.js"
import { validateGraph } from "../validation/validateGraph.js"
import { KNOWN_FINANCIAL_DOMAINS } from "../domains/knownFinancialDomains.js"
import { KNOWN_RELATIONSHIPS } from "../relationships/knownRelationships.js"
import { requireCurrencyCode, toMinor } from "../../projection/projectionMoneyAdapter.js"
import { DomainValidationError } from "../../domain/errors.js"

export const FINANCIAL_GRAPH_BUILDER_ERROR_CODES = Object.freeze({
  INVALID_MODEL: "INVALID_MODEL",
  INVALID_CURRENCY: "INVALID_CURRENCY",
  MISSING_ID: "MISSING_ID",
  DUPLICATE_ID: "DUPLICATE_ID",
  INVALID_AMOUNT: "INVALID_AMOUNT",
  INVALID_GRAPH: "INVALID_GRAPH",
})

export class FinancialGraphBuilderError extends Error {
  constructor(code, message, details = {}) {
    super(message)
    this.name = "FinancialGraphBuilderError"
    this.code = code
    this.details = details
  }
}

function fail(code, message, details) {
  throw new FinancialGraphBuilderError(code, message, details)
}

export const FINANCIAL_GRAPH_ID = "money-mind"

// Real V1 data domains that are not among the six canonical spatial domains.
// `liabilities` backs useFinancialKPIs.totalLiabilities (Net Worth page);
// `net-worth` hosts the single core node (useFinancialKPIs.netWorth).
const LIABILITIES_DOMAIN = createDomain({ id: "liabilities", label: "Liabilities" })
const NET_WORTH_DOMAIN = createDomain({ id: "net-worth", label: "Net Worth" })
export const FINANCIAL_GRAPH_DOMAINS = Object.freeze([...KNOWN_FINANCIAL_DOMAINS, LIABILITIES_DOMAIN, NET_WORTH_DOMAIN])

export const CORE_NODE_ID = createNodeId("net-worth", "core", "money-mind")

// --- identity ---------------------------------------------------------------

// Deterministic 32-bit FNV-1a, hex. Used only to keep identifier keys unique
// when a source id/label has to be normalized (Firestore ids are mixed-case).
function fnv1a(text) {
  let hash = 0x811c9dc5
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193) >>> 0
  }
  return hash.toString(16).padStart(8, "0")
}

// A source id/label -> a Layer 4A identifier part. Already-valid identifiers are
// kept verbatim; anything else is slugged and suffixed with a hash of the exact
// original, so "Food" / "food" or "AbC" / "abc" never collide.
export function toIdentifierKey(raw) {
  const text = String(raw)
  if (isValidIdentifier(text)) return text
  const slug = text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
  return slug ? `${slug}-${fnv1a(text)}` : `k-${fnv1a(text)}`
}

function sourceIdOf(record, collection, index) {
  const id = record?.id
  if ((typeof id !== "string" || id.trim() === "") && typeof id !== "number") {
    fail(FINANCIAL_GRAPH_BUILDER_ERROR_CODES.MISSING_ID, `${collection}[${index}] has no id`, { collection, index })
  }
  return String(id)
}

// --- money ------------------------------------------------------------------

function recordCurrency(record, reportingCurrency, collection, sourceId) {
  if (record.currency == null || record.currency === "") return reportingCurrency
  try {
    return requireCurrencyCode(record.currency)
  } catch (error) {
    return fail(FINANCIAL_GRAPH_BUILDER_ERROR_CODES.INVALID_CURRENCY, `${collection} "${sourceId}" has an invalid currency: ${JSON.stringify(record.currency)}`, { collection, sourceId, cause: error })
  }
}

// Transport one monetary field as minor-unit Money. `required` fields must be
// finite numbers; optional fields that are absent are omitted (never zero-filled).
function money(record, field, currency, { collection, sourceId, required }) {
  const value = record[field]
  if (value == null || value === "") {
    if (required) fail(FINANCIAL_GRAPH_BUILDER_ERROR_CODES.INVALID_AMOUNT, `${collection} "${sourceId}" is missing "${field}"`, { collection, sourceId, field })
    return undefined
  }
  const number = typeof value === "number" ? value : typeof value === "string" && /^[+-]?\d+(\.\d+)?$/.test(value.trim()) ? Number(value) : NaN
  if (!Number.isFinite(number)) {
    fail(FINANCIAL_GRAPH_BUILDER_ERROR_CODES.INVALID_AMOUNT, `${collection} "${sourceId}" has a non-numeric "${field}": ${JSON.stringify(value)}`, { collection, sourceId, field })
  }
  try {
    return Object.freeze(toMinor(number, currency))
  } catch (error) {
    if (!(error instanceof DomainValidationError)) throw error
    return fail(FINANCIAL_GRAPH_BUILDER_ERROR_CODES.INVALID_AMOUNT, `${collection} "${sourceId}" "${field}" cannot be represented in ${currency} minor units`, { collection, sourceId, field, cause: error })
  }
}

function plainNumber(record, field, { collection, sourceId }) {
  const value = record[field]
  if (value == null || value === "") return undefined
  if (typeof value !== "number" || !Number.isFinite(value)) {
    fail(FINANCIAL_GRAPH_BUILDER_ERROR_CODES.INVALID_AMOUNT, `${collection} "${sourceId}" has a non-numeric "${field}"`, { collection, sourceId, field })
  }
  return value
}

function withoutUndefined(object) {
  return Object.fromEntries(Object.entries(object).filter(([, value]) => value !== undefined))
}

function labelOf(record, fallback) {
  const name = typeof record.name === "string" ? record.name.trim() : ""
  return name || fallback
}

// --- record collections -----------------------------------------------------

const RECORD_COLLECTIONS = Object.freeze([
  {
    collection: "assets", domain: "assets", type: "asset", fallbackLabel: "Unnamed asset",
    fields: (r, c, ctx) => ({ value: money(r, "value", c, { ...ctx, required: true }) }),
    edge: "increases",
  },
  {
    collection: "liabilities", domain: "liabilities", type: "liability", fallbackLabel: "Unnamed liability",
    fields: (r, c, ctx) => ({ value: money(r, "value", c, { ...ctx, required: true }) }),
    edge: "reduces",
  },
  {
    collection: "debts", domain: "debt", type: "debt", fallbackLabel: "Unnamed debt",
    fields: (r, c, ctx) => ({
      balance: money(r, "balance", c, { ...ctx, required: true }),
      payment: money(r, "payment", c, { ...ctx, required: false }),
      ratePct: plainNumber(r, "rate", ctx),
    }),
  },
  {
    collection: "investments", domain: "investments", type: "investment", fallbackLabel: "Unnamed investment",
    fields: (r, c, ctx) => ({
      value: money(r, "value", c, { ...ctx, required: true }),
      cost: money(r, "cost", c, { ...ctx, required: false }),
      assetClass: typeof r.type === "string" && r.type.trim() ? r.type.trim() : undefined,
    }),
  },
  {
    collection: "savingsPlans", domain: "savings", type: "savings-plan", fallbackLabel: "Unnamed savings plan",
    fields: (r, c, ctx) => ({
      current: money(r, "current", c, { ...ctx, required: true }),
      target: money(r, "target", c, { ...ctx, required: false }),
      monthly: money(r, "monthly", c, { ...ctx, required: false }),
    }),
  },
])

function requireArray(model, key) {
  const value = model[key]
  if (value == null) return []
  if (!Array.isArray(value)) fail(FINANCIAL_GRAPH_BUILDER_ERROR_CODES.INVALID_MODEL, `"${key}" must be an array`, { key })
  return value
}

function recordNodes(model, reportingCurrency, spec) {
  const records = requireArray(model, spec.collection)
  const seen = new Set()
  return records.map((record, index) => {
    if (record == null || typeof record !== "object") fail(FINANCIAL_GRAPH_BUILDER_ERROR_CODES.INVALID_MODEL, `${spec.collection}[${index}] is not a record`, { collection: spec.collection, index })
    const sourceId = sourceIdOf(record, spec.collection, index)
    if (seen.has(sourceId)) fail(FINANCIAL_GRAPH_BUILDER_ERROR_CODES.DUPLICATE_ID, `Duplicate ${spec.collection} id "${sourceId}"`, { collection: spec.collection, sourceId })
    seen.add(sourceId)
    const currency = recordCurrency(record, reportingCurrency, spec.collection, sourceId)
    const ctx = { collection: spec.collection, sourceId }
    return createNode({
      id: createNodeId(spec.domain, spec.type, toIdentifierKey(sourceId)),
      type: spec.type,
      domain: spec.domain,
      label: labelOf(record, spec.fallbackLabel),
      metadata: withoutUndefined({ sourceCollection: spec.collection, sourceId, currency, ...spec.fields(record, currency, ctx) }),
    })
  })
}

// Income / expense categories: the grouping V1 already uses. A category node
// records WHICH transactions belong to it and in which currencies — not a total.
function categoryNodes(model, reportingCurrency) {
  const transactions = requireArray(model, "transactions")
  const seen = new Set()
  const groups = new Map() // `${type}\u0000${label}` -> { type, label, ids, currencies }
  let unclassified = 0
  transactions.forEach((tx, index) => {
    if (tx == null || typeof tx !== "object") fail(FINANCIAL_GRAPH_BUILDER_ERROR_CODES.INVALID_MODEL, `transactions[${index}] is not a record`, { collection: "transactions", index })
    const sourceId = sourceIdOf(tx, "transactions", index)
    if (seen.has(sourceId)) fail(FINANCIAL_GRAPH_BUILDER_ERROR_CODES.DUPLICATE_ID, `Duplicate transactions id "${sourceId}"`, { collection: "transactions", sourceId })
    seen.add(sourceId)
    const currency = recordCurrency(tx, reportingCurrency, "transactions", sourceId)
    money(tx, "amount", currency, { collection: "transactions", sourceId, required: true }) // validates; not aggregated
    if (tx.type !== "income" && tx.type !== "expense") {
      unclassified += 1
      return
    }
    const label = String(tx.category || "").trim() || "Uncategorized"
    const key = `${tx.type}\u0000${label}`
    const group = groups.get(key) ?? { type: tx.type, label, ids: [], currencies: new Set() }
    group.ids.push(sourceId)
    group.currencies.add(currency)
    groups.set(key, group)
  })
  const nodes = [...groups.values()].map((group) => {
    const domain = group.type === "income" ? "income" : "expenses"
    return createNode({
      id: createNodeId(domain, "category", toIdentifierKey(group.label)),
      type: "category",
      domain,
      label: group.label,
      metadata: {
        sourceCollection: "transactions",
        category: group.label,
        transactionCount: group.ids.length,
        transactionIds: Object.freeze([...group.ids].sort()),
        currencies: Object.freeze([...group.currencies].sort()),
      },
    })
  })
  return { nodes, unclassified }
}

/**
 * Build the canonical FinancialGraph from Money Mind's loaded domain records.
 *
 * @param {object} model
 * @param {string} model.currencyCode  Reporting currency (settings.currency): denominates records without their own `currency`.
 * @param {object[]} [model.transactions]  useTransactions
 * @param {object[]} [model.assets]        useAssets().assets
 * @param {object[]} [model.liabilities]   useAssets().liabilities
 * @param {object[]} [model.debts]         useDebt
 * @param {object[]} [model.investments]   useInvestments
 * @param {object[]} [model.savingsPlans]  useSavings
 * @returns {import("../contracts.js").FinancialGraph}
 */
export function createFinancialGraphFromModel(model) {
  if (model == null || typeof model !== "object") fail(FINANCIAL_GRAPH_BUILDER_ERROR_CODES.INVALID_MODEL, "A financial model object is required")
  let reportingCurrency
  try {
    reportingCurrency = requireCurrencyCode(model.currencyCode)
  } catch (error) {
    fail(FINANCIAL_GRAPH_BUILDER_ERROR_CODES.INVALID_CURRENCY, `The model needs an explicit, valid reporting currencyCode (got ${JSON.stringify(model.currencyCode)})`, { cause: error })
  }

  const core = createNode({ id: CORE_NODE_ID, type: "core", domain: "net-worth", label: "Money Mind", metadata: { reportingCurrency } })
  const byCollection = Object.fromEntries(RECORD_COLLECTIONS.map((spec) => [spec.collection, recordNodes(model, reportingCurrency, spec)]))
  const categories = categoryNodes(model, reportingCurrency)

  // Deterministic order: domain order, then node id — independent of the order
  // Firestore returned records in.
  const domainRank = new Map(FINANCIAL_GRAPH_DOMAINS.map((domain, index) => [domain.id, index]))
  const entities = [...categories.nodes, ...Object.values(byCollection).flat()]
    .sort((a, b) => domainRank.get(a.domain) - domainRank.get(b.domain) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))

  const edges = RECORD_COLLECTIONS.filter((spec) => spec.edge)
    .flatMap((spec) => byCollection[spec.collection].map((node) => createEdge({
      id: createEdgeId(node.id, spec.edge, CORE_NODE_ID),
      source: node.id,
      target: CORE_NODE_ID,
      relationship: spec.edge,
    })))
    .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))

  const graph = createGraph({
    id: FINANCIAL_GRAPH_ID,
    version: "1",
    domains: FINANCIAL_GRAPH_DOMAINS,
    nodes: [core, ...entities],
    edges,
    metadata: { builder: "financial-graph-builder", reportingCurrency, unclassifiedTransactionCount: categories.unclassified },
  })

  const validation = validateGraph(graph, { relationships: KNOWN_RELATIONSHIPS })
  if (!validation.valid) {
    fail(FINANCIAL_GRAPH_BUILDER_ERROR_CODES.INVALID_GRAPH, "The builder produced an invalid graph", { errors: validation.errors })
  }
  return graph
}
