import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";
export function Skeleton({className,...props}:HTMLAttributes<HTMLDivElement>){return <div aria-hidden className={cn("animate-pulse rounded-[var(--mm-radius-sm)] bg-[linear-gradient(90deg,var(--mm-surface-subtle),var(--mm-surface-default),var(--mm-surface-subtle))] bg-[length:200%_100%]",className)} {...props}/>}
export function LoadingState({label="Loading"}:{label?:string}){return <div role="status" aria-live="polite" className="flex min-h-11 items-center gap-3 text-sm text-[var(--mm-text-secondary)]"><span aria-hidden className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--mm-glass-border-strong)] border-t-[var(--mm-primary)]"/><span>{label}</span></div>}
