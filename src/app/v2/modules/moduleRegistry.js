// Layer 11: the declarative registry of Money Mind main modules.
//
// Adding a module = adding an entry here (+ its submodules/content and domain
// integration in later layers). The spatial engine, layout, navigation and
// accessible label layer are all derived from this data — nothing branches on a
// module id.
//
//   id           stable identifier (also the spatial node id)
//   label        display name
//   description  one-line purpose (overlay + accessible description)
//   tagline      short label sub-text in the 3D scene
//   icon         lucide icon key (resolved by the UI; the registry stays framework-free)
//   tone         visual tone key in the runtime palette (nodeMaterials.NODE_PALETTE)
//   order        reading / keyboard order
//   spatial.slot position on the Core ring: 0 = top, then clockwise
//   permissions  required capabilities ("authenticated" for all current modules)
//   featureFlag  optional feature-flag key that must be on for the module to show
//   shortcut     optional global-control role (e.g. the topbar Settings button opens
//                the module with shortcut "settings")
//   submodules   future submodule band (Layer 13+). `legacyPage` points at the V1
//                screen that currently implements it (migration target).
export const MODULE_REGISTRY = Object.freeze([
  {
    id: "dashboard", label: "Dashboard", icon: "LayoutDashboard", tone: "growth", order: 1,
    description: "Your overall financial position at a glance.", tagline: "Overview",
    spatial: { slot: 0 }, permissions: ["authenticated"], featureFlag: null,
    submodules: [
      { id: "overview", label: "Financial overview", legacyPage: "dashboard" },
    ],
  },
  {
    id: "money-movement", label: "Money Movement", icon: "ArrowLeftRight", tone: "positive", order: 2,
    description: "Budgets, transactions, bills and cash flow.", tagline: "Cash in & out",
    spatial: { slot: 1 }, permissions: ["authenticated"], featureFlag: null,
    submodules: [
      { id: "budget", label: "Monthly Budget", legacyPage: "budget" },
      { id: "transactions", label: "Transactions", legacyPage: "transactions" },
      { id: "bills", label: "Bills", legacyPage: "bills" },
      { id: "cash-flow-forecast", label: "Cash Flow Forecast", legacyPage: "cashflowforecast" },
      { id: "calendar", label: "Financial Calendar", legacyPage: "calendar" },
    ],
  },
  {
    id: "wealth-building", label: "Wealth Building", icon: "Scale", tone: "stable", order: 3,
    description: "Net worth, goals, savings, debt and investments.", tagline: "Grow & protect",
    spatial: { slot: 2 }, permissions: ["authenticated"], featureFlag: null,
    submodules: [
      { id: "net-worth", label: "Net Worth", legacyPage: "networth" },
      { id: "goals", label: "Financial Goals", legacyPage: "goals" },
      { id: "savings", label: "Savings Planner", legacyPage: "savings" },
      { id: "emergency-fund", label: "Emergency Fund", legacyPage: "emergency" },
      { id: "debt", label: "Debt Manager", legacyPage: "debt" },
      { id: "investments", label: "Investment Tracker", legacyPage: "investments" },
      { id: "portfolio", label: "Portfolio Dashboard", legacyPage: "portfolio" },
      { id: "dividends", label: "Dividend Tracker", legacyPage: "dividends" },
      { id: "dividend-dashboard", label: "Dividend Dashboard", legacyPage: "dividendDashboard" },
      { id: "retirement", label: "Retirement Planner", legacyPage: "retirement" },
      { id: "inflation", label: "Inflation Calculator", legacyPage: "inflation" },
      { id: "loan-payoff", label: "Loan Payoff", legacyPage: "loanpayoff" },
    ],
  },
  {
    id: "intelligence", label: "Intelligence", icon: "Sparkles", tone: "insight", order: 4,
    description: "Money AI, financial health, KPIs, reports and charts.", tagline: "Insight & AI",
    spatial: { slot: 4 }, permissions: ["authenticated"], featureFlag: null,
    submodules: [
      { id: "health", label: "Financial Health", legacyPage: "health" },
      { id: "kpis", label: "Financial KPIs", legacyPage: "kpis" },
      { id: "reports", label: "Reports", legacyPage: "reports" },
      { id: "charts", label: "Charts", legacyPage: "charts" },
      { id: "export", label: "Export Center", legacyPage: "export" },
    ],
  },
  {
    id: "settings", label: "Settings", icon: "Settings", tone: "system", order: 5, shortcut: "settings",
    description: "Preferences, currency, security and account.", tagline: "Preferences",
    spatial: { slot: 3 }, permissions: ["authenticated"], featureFlag: null,
    submodules: [
      { id: "preferences", label: "Settings", legacyPage: "settings" },
      { id: "currency", label: "Currency Center", legacyPage: "currency" },
    ],
  },
].map((module) => Object.freeze({ ...module, spatial: Object.freeze(module.spatial), permissions: Object.freeze(module.permissions), submodules: Object.freeze(module.submodules.map((s) => Object.freeze(s))) })))
