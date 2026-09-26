import { useMemo } from "react"
import { buildProjectionSnapshot } from "../financial/projection/projectionSnapshot.js"
import { runFinancialProjection } from "../financial/projection/projectionAuthority.js"

// V2 KPI -> projection integration. Feeds the useFinancialKPIs totals into the
// minor-unit projection authority, denominated in the explicit `currencyCode`
// (the user's reporting currency). When the simulation is inactive the actual
// KPI figures pass through unchanged, so V1 numbers are never re-derived here.
//
// Returns:
//   active        whether a projection ran
//   currencyCode  currency every figure is denominated in
//   snapshot      the actual KPI-derived snapshot
//   figures       projected figures when active, else the snapshot
//   netWorth      projected net worth when active, else financialKPIs.netWorth
//   authority     "minor-unit" | "legacy-fallback" | "actual"
//   fallbackReason  set only when the authority fell back
export default function useFinancialProjection({ financialKPIs, savingsPlans = [], levers, active = false, currencyCode }) {
  return useMemo(() => {
    const snapshot = buildProjectionSnapshot(financialKPIs, savingsPlans)
    if (!active) {
      return { active: false, currencyCode, snapshot, figures: snapshot, netWorth: financialKPIs.netWorth, authority: "actual", fallbackReason: null }
    }
    const projected = runFinancialProjection(snapshot, levers, { currencyCode })
    return { active: true, currencyCode, snapshot, figures: projected, netWorth: projected.netWorth, authority: projected.authority, fallbackReason: projected.fallbackReason }
  }, [financialKPIs, savingsPlans, levers, active, currencyCode])
}
