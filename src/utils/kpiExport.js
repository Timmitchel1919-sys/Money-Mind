import { downloadCsv } from "./csvExport"

// Reuses csvExport's BOM-prefixed, comma/quote/newline-safe writer.
// downloadCsv("money-mind-kpi-summary", ...) already yields the required
// money-mind-kpi-summary-YYYY-MM-DD.csv filename format.
export function exportKpiSummary(kpiRows) {
  const headers = ["KPI Name", "Current Value", "Target", "Gap", "Status", "Explanation"]

  const rows = kpiRows.map((row) => ({
    "KPI Name": row.name,
    "Current Value": row.current,
    Target: row.target,
    Gap: row.gap,
    Status: row.status,
    Explanation: row.explanation,
  }))

  downloadCsv("money-mind-kpi-summary", headers, rows)
}
