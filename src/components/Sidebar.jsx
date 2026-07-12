import {
  LayoutDashboard,
  WalletCards,
  ArrowLeftRight,
  ReceiptText,
  CalendarDays,
  TrendingUp,
  Scale,
  Target,
  ShieldCheck,
  CreditCard,
  PiggyBank,
  Coins,
  ChartCandlestick,
  BriefcaseBusiness,
  HandCoins,
  CircleDollarSign,
  Landmark,
  BadgePercent,
  Banknote,
  FileChartColumn,
  ChartNoAxesCombined,
  HeartPulse,
  Gauge,
  Bot,
  Download,
  Settings as SettingsIcon,
  LogOut,
  X,
} from "lucide-react"
import NavItem from "./NavItem"
import { SidebarLogo } from "./MoneyMindLogo"

const MAIN_NAV_ITEMS = [
  { label: "Dashboard", value: "dashboard", icon: LayoutDashboard },
  { label: "Budget", value: "budget", icon: WalletCards },
  { label: "Transactions", value: "transactions", icon: ArrowLeftRight },
  { label: "Bills", value: "bills", icon: ReceiptText },
  { label: "Financial Calendar", value: "calendar", icon: CalendarDays },
  { label: "Cash Flow Forecast", value: "cashflowforecast", icon: TrendingUp },
  { label: "Net Worth", value: "networth", icon: Scale },
  { label: "Goals", value: "goals", icon: Target },
  { label: "Emergency Fund", value: "emergency", icon: ShieldCheck },
  { label: "Debt Manager", value: "debt", icon: CreditCard },
  { label: "Savings Planner", value: "savings", icon: PiggyBank },
  { label: "Currency Center", value: "currency", icon: Coins },
  { label: "Investment Tracker", value: "investments", icon: ChartCandlestick },
  { label: "Portfolio Dashboard", value: "portfolio", icon: BriefcaseBusiness },
  { label: "Dividend Tracker", value: "dividends", icon: HandCoins },
  { label: "Dividend Dashboard", value: "dividendDashboard", icon: CircleDollarSign },
  { label: "Retirement Planner", value: "retirement", icon: Landmark },
  { label: "Inflation Calculator", value: "inflation", icon: BadgePercent },
  { label: "Loan Payoff", value: "loanpayoff", icon: Banknote },
  { label: "Reports", value: "reports", icon: FileChartColumn },
  { label: "Charts", value: "charts", icon: ChartNoAxesCombined },
  { label: "Financial Health", value: "health", icon: HeartPulse },
  { label: "Financial KPIs", value: "kpis", icon: Gauge },
  { label: "Money AI", value: "ai", icon: Bot },
  { label: "Export Center", value: "export", icon: Download },
]

const FOOTER_NAV_ITEMS = [{ label: "Settings", value: "settings", icon: SettingsIcon }]

export default function Sidebar({ activePage, setActivePage, handleLogout, isOpen, onClose }) {
  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 flex h-full w-72 max-w-[85vw] flex-col overflow-hidden border-r border-[#707680]/50 bg-[#0E1117]/95 backdrop-blur-xl transition-transform duration-300 ease-out md:static md:z-auto md:h-full md:w-auto md:max-w-none md:translate-x-0 md:rounded-3xl md:border md:bg-[#0E1117]/70 ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="relative flex shrink-0 flex-col items-center border-b border-[#707680]/30 px-6 pb-3 pt-6">
        <SidebarLogo />

        <button
          type="button"
          onClick={onClose}
          aria-label="Close menu"
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-xl text-[#A5ADB8] transition hover:bg-white/5 md:hidden"
        >
          <X size={18} />
        </button>
      </div>

      <nav className="scrollbar-transparent min-h-0 flex-1 space-y-3 overflow-y-auto p-6 text-[#D5D8DD]">
        {MAIN_NAV_ITEMS.map((item) => (
          <NavItem
            key={item.value}
            label={item.label}
            value={item.value}
            icon={item.icon}
            activePage={activePage}
            setActivePage={setActivePage}
          />
        ))}
      </nav>

      <div className="mt-3 shrink-0 space-y-3 border-t border-[#707680]/30 p-6 text-[#D5D8DD]">
        {FOOTER_NAV_ITEMS.map((item) => (
          <NavItem
            key={item.value}
            label={item.label}
            value={item.value}
            icon={item.icon}
            activePage={activePage}
            setActivePage={setActivePage}
          />
        ))}

        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl border border-[#F87171]/30 p-3 text-left text-[#F87171] transition hover:bg-[#F87171]/10"
        >
          <LogOut size={18} className="shrink-0" strokeWidth={1.75} aria-hidden="true" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  )
}
