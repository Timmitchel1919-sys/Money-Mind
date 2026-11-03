"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PanelLeftClose, PanelLeftOpen, Sparkles } from "lucide-react";
import { navigationItems, navigationSections, isNavigationItemActive } from "@/config/navigation";
import { Tooltip } from "@/components/ui/Tooltip";
import { cn } from "@/lib/utils/cn";

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return <Link href="/dashboard" className="flex min-w-0 items-center gap-3 rounded-lg" aria-label="Money Mind dashboard"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-[rgb(101_221_184_/_24%)] bg-[rgb(101_221_184_/_10%)] text-[var(--mm-primary)]"><Sparkles aria-hidden size={17} /></span>{!compact && <span className="truncate text-sm font-semibold tracking-[0.16em]">MONEY MIND</span>}</Link>;
}

export function SidebarNavigation({ collapsed = false, onNavigate }: { collapsed?: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();
  return <nav aria-label="Primary navigation" className="mm-scrollbar flex-1 overflow-y-auto px-3 pb-4">{navigationSections.map((section) => <div key={section} className="mb-5">{!collapsed && <p className="mm-micro mb-2 px-3 text-[var(--mm-text-muted)]">{section}</p>}<ul className="space-y-1">{navigationItems.filter((item) => item.section === section).map((item) => { const active=isNavigationItemActive(pathname,item.href); const Icon=item.icon; const link=<Link href={item.href} onClick={onNavigate} aria-current={active?"page":undefined} className={cn("relative flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors duration-[var(--mm-motion-fast)]",collapsed&&"justify-center px-0",active?"bg-[rgb(101_221_184_/_10%)] text-[var(--mm-text-primary)]":"text-[var(--mm-text-secondary)] hover:bg-[var(--mm-surface-subtle)] hover:text-[var(--mm-text-primary)]",item.accent&&!active&&"text-[var(--mm-secondary)]")}>{active&&<span aria-hidden className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-[var(--mm-primary)]"/>}<Icon aria-hidden size={19} strokeWidth={1.8} className="shrink-0"/>{!collapsed&&<span className="truncate">{item.label}</span>}</Link>; return <li key={item.href}>{collapsed?<Tooltip content={item.label}>{link}</Tooltip>:link}</li>; })}</ul></div>)}</nav>;
}

export function Sidebar({ collapsed, onCollapsedChange }: { collapsed: boolean; onCollapsedChange: (value: boolean) => void }) {
  return <aside className="mm-glass mm-glass-subtle fixed inset-y-0 left-0 z-30 hidden w-[var(--mm-sidebar-expanded)] flex-col rounded-none border-y-0 border-l-0 transition-[width] duration-[var(--mm-motion-normal)] ease-[var(--mm-ease-premium)] lg:flex data-[collapsed=true]:w-[var(--mm-sidebar-collapsed)]" data-collapsed={collapsed}><div className={cn("flex h-[var(--mm-topbar-height)] shrink-0 items-center justify-between gap-2 border-b border-[var(--mm-glass-border-subtle)] px-4",collapsed&&"justify-center px-3")}><BrandMark compact={collapsed}/>{!collapsed&&<button type="button" onClick={()=>onCollapsedChange(true)} aria-label="Collapse sidebar" className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-[var(--mm-text-secondary)] transition-colors hover:bg-[var(--mm-surface-subtle)] hover:text-[var(--mm-text-primary)]"><PanelLeftClose aria-hidden size={18}/></button>}</div>{collapsed&&<button type="button" onClick={()=>onCollapsedChange(false)} aria-label="Expand sidebar" className="mx-auto my-3 grid h-11 w-11 place-items-center rounded-xl text-[var(--mm-text-secondary)] transition-colors hover:bg-[var(--mm-surface-subtle)] hover:text-[var(--mm-text-primary)]"><PanelLeftOpen aria-hidden size={18}/></button>}<SidebarNavigation collapsed={collapsed}/></aside>;
}
