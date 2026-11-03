"use client";
import { Menu } from "lucide-react";
import { Sheet } from "@/components/ui/Dialog";
import { IconButton } from "@/components/ui/IconButton";
import { BrandMark, SidebarNavigation } from "@/components/navigation/Sidebar";

export function MobileNavigation({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return <Sheet side="left" title="Money Mind navigation" hideHeading open={open} onOpenChange={onOpenChange} trigger={<IconButton label="Open navigation" className="lg:hidden"><Menu aria-hidden size={19}/></IconButton>}><div className="mb-7"><BrandMark/></div><div className="-mx-3 flex max-h-[calc(100dvh-8rem)] flex-col"><SidebarNavigation onNavigate={()=>onOpenChange(false)}/></div></Sheet>;
}
