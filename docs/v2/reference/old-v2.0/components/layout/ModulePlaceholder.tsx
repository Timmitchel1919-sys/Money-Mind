import { Construction } from "lucide-react";
import { GlassCard } from "@/components/glass/GlassCard";
import { PageHeader } from "@/components/layout/PageHeader";

export interface ModulePlaceholderProps { title: string; description: string; layer: number; }
export function ModulePlaceholder({ title, description, layer }: ModulePlaceholderProps) {
  return <div className="space-y-8"><PageHeader title={title} description={description}/><GlassCard level="subtle" className="min-h-64"><div className="flex min-h-52 flex-col items-center justify-center text-center"><span className="grid h-12 w-12 place-items-center rounded-xl bg-[var(--mm-surface-subtle)] text-[var(--mm-primary)]"><Construction aria-hidden size={21}/></span><h2 className="mm-heading-4 mt-4">Workspace ready</h2><p className="mm-body-small mt-2 max-w-md text-[var(--mm-text-secondary)]">This module will be implemented in Layer {layer}. The application shell and navigation are ready for it.</p></div></GlassCard></div>;
}
