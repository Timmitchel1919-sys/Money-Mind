"use client";

import * as Menu from "@radix-ui/react-dropdown-menu";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
export interface DropdownItem { label:string; icon?:ReactNode; disabled?:boolean; destructive?:boolean; onSelect?:()=>void; }
export function DropdownMenu({trigger,label,items}:{trigger:ReactNode;label:string;items:Array<DropdownItem|"separator">}){return <Menu.Root><Menu.Trigger asChild aria-label={label}>{trigger}</Menu.Trigger><Menu.Portal><Menu.Content sideOffset={7} align="end" className="mm-glass mm-glass-elevated z-50 min-w-48 rounded-[var(--mm-radius-md)] p-1"><Menu.Label className="px-3 py-2 text-[11px] font-semibold uppercase tracking-[.08em] text-[var(--mm-text-muted)]">{label}</Menu.Label>{items.map((item,index)=>item==="separator"?<Menu.Separator key={`separator-${index}`} className="my-1 h-px bg-[var(--mm-glass-border-default)]"/>:<Menu.Item key={item.label} disabled={item.disabled} onSelect={item.onSelect} className={cn("flex min-h-10 cursor-default items-center gap-2.5 rounded-[var(--mm-radius-sm)] px-3 text-sm text-[var(--mm-text-secondary)] outline-none data-[highlighted]:bg-[var(--mm-surface-default)] data-[highlighted]:text-[var(--mm-text-primary)] data-[disabled]:opacity-40",item.destructive&&"text-[var(--mm-danger)]")}>{item.icon}{item.label}</Menu.Item>)}</Menu.Content></Menu.Portal></Menu.Root>}
