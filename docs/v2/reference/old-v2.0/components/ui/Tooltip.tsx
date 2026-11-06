"use client";

import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import type { ReactNode } from "react";
export function Tooltip({content,children}:{content:string;children:ReactNode}){return <TooltipPrimitive.Provider delayDuration={350}><TooltipPrimitive.Root><TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger><TooltipPrimitive.Portal><TooltipPrimitive.Content sideOffset={7} className="z-50 max-w-60 rounded-[var(--mm-radius-sm)] border border-[var(--mm-glass-border-default)] bg-[var(--mm-bg-elevated)] px-3 py-2 text-xs text-[var(--mm-text-primary)] shadow-[var(--mm-shadow-2)]" role="tooltip">{content}<TooltipPrimitive.Arrow className="fill-[var(--mm-bg-elevated)]"/></TooltipPrimitive.Content></TooltipPrimitive.Portal></TooltipPrimitive.Root></TooltipPrimitive.Provider>}
