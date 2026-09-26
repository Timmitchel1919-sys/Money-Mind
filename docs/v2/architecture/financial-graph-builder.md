# Financial Graph Builder: real records → FinancialGraph

- Status: implemented and validated; live in the signed-in `#spatial` view
  **only** behind the off-by-default `VITE_V2_GRAPH_BUILDER` flag (it requires
  `VITE_V2_ENABLED`). Production keeps V2 off.
- Code:
  - `src/financial/graph/builder/financialGraphBuilder.js`: `createFinancialGraphFromModel`
  - `src/hooks/useFinancialGraph.js`: memoized hook
  - `src/visualization/adapters/financialGraphPresentation.js`: display strings and sizes for 4D
  - Wiring: `src/App.jsx` and one prop on `src/spatial/SpatialExperience.jsx`
- Tests: `npm run test:financial-graph-builder`

## Pipeline

```
Firestore -> firestoreService -> domain hooks (useTransactions, useAssets,
             useDebt, useInvestments, useSavings)        <- authoritative source
          -> createFinancialGraphFromModel               <- this layer (pure)
          -> FinancialGraph (4A, validated) -> engine (4B) / views (4C)
          -> createFinancialGraphSpatialScene (4D) + presentation
          -> SpatialExperience -> Layer 2 runtime -> Layer 3 motion
```

The builder reads the arrays the hooks already hold in `App.jsx`. It never
queries Firestore, and it adds no new data source. `useFinancialKPIs` and
`useFinancialBreakdown` remain the authorities for totals.

## Input

```js
createFinancialGraphFromModel({
  currencyCode,            // required: reporting currency (settings.currency)
  transactions, assets, liabilities, debts, investments, savingsPlans,
})
```

Record shapes are the ones `App.jsx` writes (`handleAdd*`), with Firestore
document ids.

## Domains

The six canonical Layer 4A domains (`KNOWN_FINANCIAL_DOMAINS`), in canonical
order, plus two domains backed by real V1 data:
- `liabilities`: `useAssets().liabilities`, which feeds `useFinancialKPIs.totalLiabilities`.
- `net-worth`: hosts the single core node (`useFinancialKPIs.netWorth`).

Every domain is always declared, so empty domains are valid. **Not
represented yet**: goals, bills and budgets (real V1 data, not yet in the
graph).

## Nodes

| Source | Node | Id | Transported fields |
| --- | --- | --- | --- |
| — | exactly one core, type `core` | `net-worth-core-money-mind` | `reportingCurrency` |
| assets | `asset` in `assets` | `assets-asset-<key>` | `value` |
| liabilities | `liability` in `liabilities` | `liabilities-liability-<key>` | `value` |
| debts | `debt` in `debt` | `debt-debt-<key>` | `balance`, `payment`?, `ratePct`? |
| investments | `investment` in `investments` | `investments-investment-<key>` | `value`, `cost`?, `assetClass`? |
| savingsPlans | `savings-plan` in `savings` | `savings-savings-plan-<key>` | `current`, `target`?, `monthly`? |
| transactions (income/expense) | `category` in `income` / `expenses` | `<domain>-category-<key>` | `category`, `transactionCount`, `transactionIds`, `currencies` |

- `<key>` comes from the record's Firestore id (or, for categories, from the
  exact category label). A value that is already a valid identifier is used
  verbatim. Anything else (e.g. mixed-case Firestore ids) becomes a slug plus
  an FNV-1a hash of the exact original, so `AbC`/`abc` and `Food`/`food` never
  collide.
- Ids never use array positions, timestamps or randomness. Every record node
  keeps its `sourceCollection` and `sourceId`.
- Categories follow V1's own grouping rule: exact trimmed label, blank →
  "Uncategorized". Transactions of any other `type` are counted in
  `metadata.unclassifiedTransactionCount`, not dropped silently.
- Ordering: the core first, then canonical domain order, then node id. It
  doesn't depend on the order Firestore returned records in.

## Edges

Only the relationship the model actually defines: **net worth = assets −
liabilities** (`useFinancialKPIs`). That gives `asset → core` `increases` and
`liability → core` `reduces` (Layer 4A vocabulary). Records have no foreign
keys to one another, so no income → savings, debt → asset or similar edge is
created. Edges are sorted by id.

## Financial values

The builder **calculates nothing**. It transports each record's own fields as
minor-unit `Money` (`{ amountMinor, currency }`) through the Layer 1 boundary
(`projectionMoneyAdapter.toMinor`: rounded once to the currency's precision).
Category nodes carry membership, not totals. There is no net worth, cash flow,
projection or conversion here.

## Currency

- A record's own `currency` field wins (validated and normalized).
- Records without one are denominated in the **explicit** reporting currency
  the caller passes. That's the same interpretation `useFinancialKPIs`, the
  spatial model and the Layer 1 authority use. There is no default: a
  missing/invalid `currencyCode` is rejected.
- No conversion ever. SRD 10,000 stays SRD, and a USD record stays USD.
- Mixed currencies are kept per record. A category records every currency its
  transactions use.

**Known V1 inconsistency (not changed here):** the Dashboard cash-flow card
treats currency-less transactions as `"SRD"` and converts them with live
rates, while `useFinancialKPIs` treats them as the reporting currency. The two
agree only while the reporting currency is SRD (the default).

## Invalid data

`FinancialGraphBuilderError` with a `code`. Nothing is repaired:
- `INVALID_MODEL`: no model, or a collection that isn't an array or holds a non-record.
- `INVALID_CURRENCY`: missing/invalid reporting currency, or an invalid record currency.
- `MISSING_ID` / `DUPLICATE_ID`: per collection, including transactions.
- `INVALID_AMOUNT`: a required amount that is missing, a non-numeric or
  non-finite amount or rate, or an amount beyond safe minor units. Absent
  optional amounts are omitted, never zero-filled.
- `INVALID_GRAPH`: a safety net if the result ever failed `validateGraph`.

Every graph produced passes Layer 4A `validateGraph` (with the known
relationship vocabulary) before it's returned, and is accepted by the Layer 4B
engine.

## Live integration (`VITE_V2_GRAPH_BUILDER`)

- `useFinancialGraph` builds only when the flag is on. A rejection comes back
  as `error` and is never a partial graph.
- `App.jsx` builds the scene with the 4D adapter. Presentation
  (`financialGraphPresentation.js`) calculates nothing:
  - The core and the six domains reuse the **existing** scene's detail and
    magnitude (`createFinancialSpatialScene` over the same KPI/projection
    model), so figures match today's view, simulation included.
  - Record children show their own `Money`, formatted in their own currency.
    Sizes are compared only within one currency; a mixed-currency domain gets
    uniform sizes.
  - Category children show the `useFinancialBreakdown` total, but only when
    all their transactions are in the reporting currency. Otherwise they show
    the transaction count.
- A builder or adapter rejection logs a warning and keeps the existing scene.
- With the flag off, `SpatialExperience` gets `scene={null}` and behaves
  exactly as before (verified in the browser).

## Relationship to Layers 4A–4D

- The builder uses only Layer 4A constructors, identity, validation, domains
  and relationships.
- The result feeds the 4B engine, 4C views/pipelines and the 4D adapter
  unchanged; all of these are tested.
- 4D reports `liabilities`/`net-worth` as unmapped (no spatial slot), so the
  liability node and its `reduces` edge are omitted from the scene with a
  report. They are not lost from the graph.
