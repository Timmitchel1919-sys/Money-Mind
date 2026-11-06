"use client";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { usePathname } from "next/navigation";
import { getNavigationItem } from "@/config/navigation";

export function Breadcrumbs() {
  const item = getNavigationItem(usePathname());
  return <nav aria-label="Breadcrumb"><ol className="flex min-w-0 items-center gap-1.5 text-xs text-[var(--mm-text-muted)]"><li><Link href="/dashboard" className="rounded-sm transition-colors hover:text-[var(--mm-text-primary)]">Money Mind</Link></li><li aria-hidden><ChevronRight size={13}/></li><li className="truncate text-[var(--mm-text-secondary)]" aria-current="page">{item.label}</li></ol></nav>;
}
