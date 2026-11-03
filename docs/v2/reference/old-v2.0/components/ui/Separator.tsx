"use client";

import * as SeparatorPrimitive from "@radix-ui/react-separator";
import { cn } from "@/lib/utils/cn";
export function Separator({orientation="horizontal",className}:{orientation?:"horizontal"|"vertical";className?:string}){return <SeparatorPrimitive.Root decorative orientation={orientation} className={cn("shrink-0 bg-[var(--mm-glass-border-subtle)]",orientation==="horizontal"?"h-px w-full":"h-full w-px",className)}/>}
