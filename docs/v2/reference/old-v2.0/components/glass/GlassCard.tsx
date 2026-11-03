import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export type GlassLevel = "subtle" | "standard" | "elevated" | "premium";

type GlassCardProps<T extends ElementType> = {
  as?: T;
  children: ReactNode;
  level?: GlassLevel;
  className?: string;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "children" | "className">;

export function GlassCard<T extends ElementType = "section">({
  as,
  children,
  level = "standard",
  className,
  ...props
}: GlassCardProps<T>) {
  const Component = as ?? "section";

  return (
    <Component className={cn("mm-glass overflow-hidden rounded-[var(--mm-radius-xl)] p-6", level === "subtle" && "mm-glass-subtle", level === "elevated" && "mm-glass-elevated", level === "premium" && "mm-glass-premium", className)} {...props}>
      <div className="relative z-10">{children}</div>
    </Component>
  );
}
