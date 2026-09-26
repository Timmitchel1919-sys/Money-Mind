import { useMemo } from "react"
import { createFinancialGraphFromModel, FinancialGraphBuilderError } from "../financial/graph/builder/financialGraphBuilder.js"

// Builds the canonical FinancialGraph from the arrays the domain hooks already
// loaded (no Firestore access here). Memoized on those arrays + currency.
// A builder rejection is returned as `error` (never a partial graph), so the
// caller can keep the existing view instead of rendering invalid data.
export default function useFinancialGraph({
  enabled = true,
  currencyCode,
  transactions = [],
  assets = [],
  liabilities = [],
  debts = [],
  investments = [],
  savingsPlans = [],
}) {
  return useMemo(() => {
    if (!enabled) return { graph: null, error: null }
    try {
      return { graph: createFinancialGraphFromModel({ currencyCode, transactions, assets, liabilities, debts, investments, savingsPlans }), error: null }
    } catch (error) {
      if (error instanceof FinancialGraphBuilderError) return { graph: null, error }
      throw error
    }
  }, [enabled, currencyCode, transactions, assets, liabilities, debts, investments, savingsPlans])
}
