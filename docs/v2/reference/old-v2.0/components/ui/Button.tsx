"use client";

import { LoaderCircle } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "premium" | "danger";
export type ButtonSize = "sm" | "md" | "lg" | "icon";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant; size?: ButtonSize; loading?: boolean; leadingIcon?: ReactNode;
}

const variants: Record<ButtonVariant, string> = {
  primary: "bg-[var(--mm-primary)] text-[var(--mm-text-inverse)] hover:bg-[#7be5c3] active:bg-[#56cda8]",
  secondary: "bg-[var(--mm-bg-elevated)] text-[var(--mm-text-primary)] border border-[var(--mm-glass-border-default)] hover:bg-[var(--mm-glass-teal)]",
  outline: "border border-[var(--mm-glass-border-strong)] text-[var(--mm-text-primary)] hover:bg-[var(--mm-surface-subtle)]",
  ghost: "text-[var(--mm-text-secondary)] hover:bg-[var(--mm-surface-subtle)] hover:text-[var(--mm-text-primary)]",
  premium: "border border-[rgb(215_188_120_/_36%)] bg-[linear-gradient(135deg,rgb(215_188_120_/_18%),rgb(215_188_120_/_6%))] text-[var(--mm-soft-gold)] hover:border-[rgb(215_188_120_/_55%)]",
  danger: "border border-[rgb(215_124_153_/_30%)] bg-[rgb(215_124_153_/_14%)] text-[#efadc1] hover:bg-[rgb(215_124_153_/_20%)]",
};
const sizes: Record<ButtonSize, string> = { sm: "min-h-9 px-3.5 text-xs", md: "min-h-11 px-5 text-sm", lg: "min-h-[52px] px-6 text-base", icon: "h-11 w-11 p-0" };

export function Button({ className, variant="primary", size="md", loading=false, disabled, leadingIcon, children, ...props }: ButtonProps) {
  return <button type="button" className={cn("inline-flex shrink-0 items-center justify-center gap-2 rounded-[var(--mm-radius-md)] font-semibold transition-[background-color,border-color,color,transform] duration-[var(--mm-motion-fast)] ease-[var(--mm-ease-standard)] enabled:active:translate-y-px disabled:cursor-not-allowed disabled:opacity-45", variants[variant], sizes[size], className)} disabled={disabled || loading} aria-busy={loading || undefined} {...props}>
    {loading ? <LoaderCircle aria-hidden className="animate-spin" size={16}/> : leadingIcon}{children}
  </button>;
}
