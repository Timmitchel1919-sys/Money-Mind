// Domain identifiers already in use elsewhere in the app — useFinancialKPIs,
// useFinancialBreakdown, and financialSpatialAdapter's DOMAIN_ORDER all key
// their per-domain data by these same six ids. Reused here (not redefined)
// so a future graph-to-scene adapter can share identity with the existing
// spatial layer without a translation table.
//
// This is a convenience starting point, not a closed enum: a FinancialGraph
// may declare additional domains (e.g. "goals", "cashFlow", "netWorth") the
// moment a real model backs them — see
// docs/v2/architecture/financial-graph-engine.md.

import { createDomain } from "../contracts.js"

export const KNOWN_FINANCIAL_DOMAINS = Object.freeze([
  createDomain({ id: "income", label: "Income" }),
  createDomain({ id: "expenses", label: "Expenses" }),
  createDomain({ id: "assets", label: "Assets" }),
  createDomain({ id: "debt", label: "Debt" }),
  createDomain({ id: "savings", label: "Savings" }),
  createDomain({ id: "investments", label: "Investments" }),
])
