import { Activity, ArrowLeftRight, ChartNoAxesCombined, ChartPie, CircleDollarSign, CircleHelp, CreditCard, Gauge, Landmark, LayoutDashboard, Library, Scale, Settings, Sparkles, Target, TrendingUp, WalletCards, type LucideIcon } from "lucide-react";

export type NavigationSection = "Core" | "Wealth" | "Intelligence" | "System";
export interface NavigationItem { label: string; href: string; icon: LucideIcon; section: NavigationSection; accent?: boolean; }

export const navigationSections: readonly NavigationSection[] = ["Core", "Wealth", "Intelligence", "System"];
export const navigationItems: readonly NavigationItem[] = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard, section: "Core" },
  { label: "Money", href: "/dashboard/money", icon: WalletCards, section: "Core" },
  { label: "Accounts", href: "/dashboard/accounts", icon: Landmark, section: "Core" },
  { label: "Transactions", href: "/dashboard/transactions", icon: ArrowLeftRight, section: "Core" },
  { label: "Budget & Bills", href: "/dashboard/budget", icon: ChartPie, section: "Core" },
  { label: "Cash Flow", href: "/dashboard/cash-flow", icon: Activity, section: "Core" },
  { label: "Net Worth", href: "/dashboard/net-worth", icon: Scale, section: "Wealth" },
  { label: "Goals & Savings", href: "/dashboard/goals", icon: Target, section: "Wealth" },
  { label: "Debt Manager", href: "/dashboard/debt", icon: CreditCard, section: "Wealth" },
  { label: "Investments", href: "/dashboard/investments", icon: TrendingUp, section: "Wealth" },
  { label: "Financial Health", href: "/dashboard/financial-health", icon: Gauge, section: "Wealth" },
  { label: "Reports", href: "/dashboard/reports", icon: ChartNoAxesCombined, section: "Intelligence" },
  { label: "Currency Center", href: "/dashboard/currency", icon: CircleDollarSign, section: "Intelligence" },
  { label: "Resources", href: "/dashboard/resources", icon: Library, section: "Intelligence" },
  { label: "Money AI", href: "/dashboard/ai", icon: Sparkles, section: "Intelligence", accent: true },
  { label: "Settings", href: "/dashboard/settings", icon: Settings, section: "System" },
  { label: "Help", href: "/dashboard/help", icon: CircleHelp, section: "System" },
] as const;

export function isNavigationItemActive(pathname: string, href: string): boolean {
  return href === "/dashboard" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}
export function getNavigationItem(pathname: string): NavigationItem {
  return navigationItems.find((item) => isNavigationItemActive(pathname, item.href)) ?? navigationItems[0];
}
