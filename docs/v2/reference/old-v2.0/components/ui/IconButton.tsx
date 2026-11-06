"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> { label: string; children: ReactNode; size?: "sm"|"md"|"lg"; }
export function IconButton({ label, children, size="md", className, ...props }: IconButtonProps) {
  const sizeClass={sm:"h-9 w-9",md:"h-11 w-11",lg:"h-[52px] w-[52px]"}[size];
  return <button type="button" aria-label={label} title={label} className={cn("inline-grid shrink-0 place-items-center rounded-[var(--mm-radius-md)] border border-[var(--mm-glass-border-default)] bg-[var(--mm-surface-subtle)] text-[var(--mm-text-secondary)] transition-colors hover:bg-[var(--mm-surface-default)] hover:text-[var(--mm-text-primary)] disabled:cursor-not-allowed disabled:opacity-45",sizeClass,className)} {...props}>{children}</button>;
}
