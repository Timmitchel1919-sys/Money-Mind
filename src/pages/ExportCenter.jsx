import Panel from "../components/Panel"
import StickyBar from "../components/StickyBar"
import PageInfoButton from "../components/PageInfoButton"
import { downloadCsv } from "../utils/csvExport"

function progressPct(saved, target) {
  return Number(target || 0) > 0 ? (Number(saved || 0) / Number(target || 0)) * 100 : 0
}

function buildDatasets({
  transactions,
  budgets,
  assets,
  liabilities,
  goals,
  debts,
  savingsPlans,
  investments,
  bills,
}) {
  return [
    {
      key: "transactions",
      label: "Transactions",
      data: transactions,
      headers: ["Date", "Type", "Category", "Description", "Amount"],
      mapRow: (item) => ({
        Date: item.date || "",
        Type: item.type || "",
        Category: item.category || "",
        Description: item.description || "",
        Amount: Number(item.amount || 0).toFixed(2),
      }),
    },
    {
      key: "budgets",
      label: "Budgets",
      data: budgets,
      headers: ["Category", "Amount", "Income"],
      mapRow: (item) => ({
        Category: item.category || "",
        Amount: Number(item.amount || 0).toFixed(2),
        Income: Number(item.income || 0).toFixed(2),
      }),
    },
    {
      key: "assets",
      label: "Assets",
      data: assets,
      headers: ["Name", "Value"],
      mapRow: (item) => ({
        Name: item.name || "",
        Value: Number(item.value || 0).toFixed(2),
      }),
    },
    {
      key: "liabilities",
      label: "Liabilities",
      data: liabilities,
      headers: ["Name", "Value"],
      mapRow: (item) => ({
        Name: item.name || "",
        Value: Number(item.value || 0).toFixed(2),
      }),
    },
    {
      key: "goals",
      label: "Goals",
      data: goals,
      headers: ["Name", "Target", "Saved", "Progress Percentage"],
      mapRow: (item) => ({
        Name: item.name || "",
        Target: Number(item.target || 0).toFixed(2),
        Saved: Number(item.saved || 0).toFixed(2),
        "Progress Percentage": progressPct(item.saved, item.target).toFixed(2),
      }),
    },
    {
      key: "debts",
      label: "Debts",
      data: debts,
      headers: ["Name", "Balance", "Interest Rate", "Monthly Payment"],
      mapRow: (item) => ({
        Name: item.name || "",
        Balance: Number(item.balance || 0).toFixed(2),
        "Interest Rate": Number(item.rate || 0).toFixed(2),
        "Monthly Payment": Number(item.payment || 0).toFixed(2),
      }),
    },
    {
      key: "savingsPlans",
      label: "Savings Plans",
      data: savingsPlans,
      headers: ["Name", "Target", "Current", "Monthly Saving", "Progress Percentage"],
      mapRow: (item) => ({
        Name: item.name || "",
        Target: Number(item.target || 0).toFixed(2),
        Current: Number(item.current || 0).toFixed(2),
        "Monthly Saving": Number(item.monthly || 0).toFixed(2),
        "Progress Percentage": progressPct(item.current, item.target).toFixed(2),
      }),
    },
    {
      key: "investments",
      label: "Investments",
      data: investments,
      headers: ["Name", "Type", "Purchase Cost", "Current Value", "Profit/Loss", "Return Percentage"],
      mapRow: (item) => {
        const cost = Number(item.cost || 0)
        const value = Number(item.value || 0)
        const profit = value - cost

        return {
          Name: item.name || "",
          Type: item.type || "",
          "Purchase Cost": cost.toFixed(2),
          "Current Value": value.toFixed(2),
          "Profit/Loss": profit.toFixed(2),
          "Return Percentage": (cost > 0 ? (profit / cost) * 100 : 0).toFixed(2),
        }
      },
    },
    {
      key: "bills",
      label: "Bills",
      data: bills,
      headers: ["Name", "Category", "Amount", "Due Date"],
      mapRow: (item) => ({
        Name: item.name || "",
        Category: item.category || "",
        Amount: Number(item.amount || 0).toFixed(2),
        "Due Date": item.dueDate || "",
      }),
    },
  ]
}

export default function ExportCenter({
  transactions = [],
  budgets = [],
  assets = [],
  liabilities = [],
  goals = [],
  debts = [],
  savingsPlans = [],
  investments = [],
  bills = [],
}) {
  const datasets = buildDatasets({
    transactions,
    budgets,
    assets,
    liabilities,
    goals,
    debts,
    savingsPlans,
    investments,
    bills,
  })

  function exportDataset(dataset) {
    if (dataset.data.length === 0) return
    downloadCsv(`money-mind-${dataset.key}`, dataset.headers, dataset.data.map(dataset.mapRow))
  }

  function exportAll() {
    datasets.filter((dataset) => dataset.data.length > 0).forEach(exportDataset)
  }

  const hasAnyData = datasets.some((dataset) => dataset.data.length > 0)

  return (
    <div className="space-y-6">
      <StickyBar
        title={
          <span className="flex items-center gap-3">
            Export Center
            <PageInfoButton pageKey="export" />
          </span>
        }
      >
        <p className="mt-2 text-[#A5ADB8]">
          Download your Money Mind data as CSV files. Exports run entirely in your browser —
          nothing is sent to a server.
        </p>

        <button
          onClick={exportAll}
          disabled={!hasAnyData}
          className="metallic-button mt-6 w-full rounded-xl p-3 font-semibold text-black disabled:cursor-not-allowed disabled:opacity-40 md:w-auto md:px-8"
        >
          Export All
        </button>
      </StickyBar>

      <Panel title="Datasets">
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {datasets.map((dataset) => (
            <div key={dataset.key} className="rounded-2xl border border-[#BFC4CC]/20 bg-black/30 p-5">
              <h3 className="text-lg font-semibold">{dataset.label}</h3>
              <p className="mt-2 text-sm text-[#A5ADB8]">
                {dataset.data.length} item{dataset.data.length === 1 ? "" : "s"} ready to export.
              </p>

              <button
                onClick={() => exportDataset(dataset)}
                disabled={dataset.data.length === 0}
                className="mt-4 w-full rounded-xl border border-[#BFC4CC]/30 p-3 font-semibold text-[#D5D8DD] transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
              >
                Export CSV
              </button>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  )
}
