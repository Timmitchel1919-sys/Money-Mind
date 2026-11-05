// Declarative V2 navigation registry. Financial workspaces stay in V1; this
// metadata only describes how authenticated users reach those existing views.
const workspace = (parentModuleId, id, label, route, order, icon) => ({
  id, parentModuleId, label, availability: "available", ...(icon ? { icon } : {}),
  destination: { kind: "workspace", route }, navigation: { order, restore: "spatial" },
})
const action = (parentModuleId, id, label, actionId, order, icon) => ({
  id, parentModuleId, label, availability: "available", ...(icon ? { icon } : {}),
  destination: { kind: "action", action: actionId }, navigation: { order, restore: "spatial" },
})

const registry = [
  { id: "dashboard", label: "Dashboard", icon: "LayoutDashboard", tone: "growth", order: 1, description: "Your overall financial position at a glance.", tagline: "Overview", spatial: { slot: 0, splineObjectId: "fcf26801-d51b-44f8-ac15-070fe8e24783" }, permissions: ["authenticated"], featureFlag: null,
    submodules: [workspace("dashboard", "overview", "Financial overview", "dashboard", 1, "LayoutDashboard")] },
  { id: "money-movement", label: "Money Movement", icon: "ArrowLeftRight", tone: "positive", order: 2, description: "Budgets, transactions, bills and cash flow.", tagline: "Cash in & out", spatial: { slot: 1, splineObjectId: "66f98909-e353-4ff4-9146-39f404f18082" }, permissions: ["authenticated"], featureFlag: null,
    submodules: [
      workspace("money-movement", "budget", "Monthly Budget", "budget", 1, "WalletCards"),
      workspace("money-movement", "transactions", "Transactions", "transactions", 2, "ArrowLeftRight"),
      workspace("money-movement", "bills", "Bills", "bills", 3, "ReceiptText"),
      workspace("money-movement", "cash-flow-forecast", "Cash Flow Forecast", "cashflowforecast", 4, "TrendingUp"),
      workspace("money-movement", "calendar", "Financial Calendar", "calendar", 5, "CalendarDays"),
    ] },
  { id: "wealth-building", label: "Wealth Building", icon: "Scale", tone: "stable", order: 3, description: "Net worth, goals, savings, debt and investments.", tagline: "Grow & protect", spatial: { slot: 2, splineObjectId: "0a7127e5-715f-490d-9e09-ad67dfe17e85" }, permissions: ["authenticated"], featureFlag: null,
    submodules: [
      workspace("wealth-building", "net-worth", "Net Worth", "networth", 1), workspace("wealth-building", "goals", "Financial Goals", "goals", 2),
      workspace("wealth-building", "savings", "Savings Planner", "savings", 3), workspace("wealth-building", "emergency-fund", "Emergency Fund", "emergency", 4),
      workspace("wealth-building", "debt", "Debt Manager", "debt", 5), workspace("wealth-building", "investments", "Investment Tracker", "investments", 6),
      workspace("wealth-building", "portfolio", "Portfolio Dashboard", "portfolio", 7), workspace("wealth-building", "dividends", "Dividend Tracker", "dividends", 8),
      workspace("wealth-building", "dividend-dashboard", "Dividend Dashboard", "dividendDashboard", 9), workspace("wealth-building", "retirement", "Retirement Planner", "retirement", 10),
      workspace("wealth-building", "inflation", "Inflation Calculator", "inflation", 11), workspace("wealth-building", "loan-payoff", "Loan Payoff", "loanpayoff", 12),
    ] },
  { id: "intelligence", label: "Intelligence", icon: "Sparkles", tone: "insight", order: 4, description: "Money AI, financial health, KPIs, reports and charts.", tagline: "Insight & AI", spatial: { slot: 4, splineObjectId: "50c333f6-a160-42d6-beff-ebbf37fd5ff5" }, permissions: ["authenticated"], featureFlag: null,
    submodules: [
      action("intelligence", "money-ai", "Money AI", "money-ai", 1, "Sparkles"), workspace("intelligence", "health", "Financial Health", "health", 2),
      workspace("intelligence", "kpis", "Financial KPIs", "kpis", 3), workspace("intelligence", "reports", "Reports", "reports", 4),
      workspace("intelligence", "charts", "Charts", "charts", 5), workspace("intelligence", "export", "Export Center", "export", 6),
    ] },
  { id: "settings", label: "Settings", icon: "Settings", tone: "system", order: 5, shortcut: "settings", description: "Preferences, currency, security and account.", tagline: "Preferences", spatial: { slot: 3, splineObjectId: "d0b57af6-fb3a-44c7-9989-f1bdfccbef84" }, permissions: ["authenticated"], featureFlag: null,
    submodules: [workspace("settings", "preferences", "Settings", "settings", 1), workspace("settings", "currency", "Currency Center", "currency", 2)] },
]

export const MODULE_REGISTRY = Object.freeze(registry.map((module) => Object.freeze({
  ...module, spatial: Object.freeze(module.spatial), permissions: Object.freeze(module.permissions),
  submodules: Object.freeze(module.submodules.map((submodule) => Object.freeze({ ...submodule, destination: Object.freeze(submodule.destination), navigation: Object.freeze(submodule.navigation) }))),
})))
