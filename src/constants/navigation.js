import {
  BadgePercent, Banknote, BriefcaseBusiness, CalendarDays, ChartCandlestick,
  ChartNoAxesCombined, CircleDollarSign, Coins, CreditCard, Download,
  FileChartColumn, Gauge, HandCoins, HeartPulse, Landmark, LayoutDashboard,
  PiggyBank, ReceiptText, Scale, ShieldCheck, Sparkles, Target, TrendingUp,
  WalletCards, ArrowLeftRight,
  Settings,
} from "lucide-react"

export const NAVIGATION = [
  { id: "overview", label: "Overview", items: [
    { label: "Dashboard", value: "dashboard", icon: LayoutDashboard },
  ]},
  { id: "money", label: "Money Management", icon: WalletCards, items: [
    { label: "Monthly Budget", value: "budget", icon: WalletCards },
    { label: "Transactions", value: "transactions", icon: ArrowLeftRight },
    { label: "Bills", value: "bills", icon: ReceiptText },
    { label: "Cash Flow Forecast", value: "cashflowforecast", icon: TrendingUp },
    { label: "Financial Calendar", value: "calendar", icon: CalendarDays },
  ]},
  { id: "wealth", label: "Wealth Building", icon: Scale, items: [
    { label: "Net Worth", value: "networth", icon: Scale },
    { label: "Financial Goals", value: "goals", icon: Target },
    { label: "Savings Planner", value: "savings", icon: PiggyBank },
    { label: "Emergency Fund", value: "emergency", icon: ShieldCheck },
    { label: "Debt Manager", value: "debt", icon: CreditCard },
    { label: "Investment Tracker", value: "investments", icon: ChartCandlestick },
    { label: "Portfolio Dashboard", value: "portfolio", icon: BriefcaseBusiness },
    { label: "Dividend Tracker", value: "dividends", icon: HandCoins },
    { label: "Dividend Dashboard", value: "dividendDashboard", icon: CircleDollarSign },
    { label: "Retirement Planner", value: "retirement", icon: Landmark },
    { label: "Inflation Calculator", value: "inflation", icon: BadgePercent },
    { label: "Loan Payoff", value: "loanpayoff", icon: Banknote },
  ]},
  { id: "intelligence", label: "Intelligence", icon: Sparkles, items: [
    { label: "AI Financial Assistant", action: "ai", icon: Sparkles },
    { label: "Financial Health", value: "health", icon: HeartPulse },
    { label: "Financial KPIs", value: "kpis", icon: Gauge },
    { label: "Reports", value: "reports", icon: FileChartColumn },
    { label: "Charts", value: "charts", icon: ChartNoAxesCombined },
    { label: "Export Center", value: "export", icon: Download },
    { label: "Currency Center", value: "currency", icon: Coins },
  ]},
  { id: "settings", label: "Settings", items: [
    { label: "Settings", value: "settings", icon: Settings },
  ]},
]

export const SEARCHABLE_NAVIGATION = NAVIGATION.flatMap((group) =>
  group.items.filter((item) => item.value).map((item) => ({ ...item, category: group.label })),
)

export function groupForPage(page) {
  return NAVIGATION.find((group) => group.items.some((item) => item.value === page))?.id
}
