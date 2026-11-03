"use client";

import * as AvatarPrimitive from "@radix-ui/react-avatar";
import { cn } from "@/lib/utils/cn";
interface AvatarProps { src?:string; alt:string; initials:string; size?:"sm"|"md"|"lg"; loading?:boolean; }
export function Avatar({src,alt,initials,size="md",loading=false}:AvatarProps){const sizeClass={sm:"h-8 w-8 text-[10px]",md:"h-11 w-11 text-xs",lg:"h-16 w-16 text-sm"}[size];return <AvatarPrimitive.Root className={cn("mm-glass inline-grid shrink-0 place-items-center overflow-hidden rounded-full font-semibold text-[var(--mm-primary)]",sizeClass)}>{loading?<span className="h-full w-full animate-pulse bg-[var(--mm-surface-default)]"/>:<><AvatarPrimitive.Image src={src} alt={alt} className="h-full w-full object-cover"/><AvatarPrimitive.Fallback delayMs={250}>{initials}</AvatarPrimitive.Fallback></>}</AvatarPrimitive.Root>}
