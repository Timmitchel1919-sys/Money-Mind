import Link from "next/link";
import type { ReactNode } from "react";
import { GlassCard } from "@/components/glass/GlassCard";
import { appConfig } from "@/config/app";

interface AuthShellProps {
  title: string;
  description: string;
  alternateHref?: "/login" | "/register";
  alternateLabel?: string;
  children: ReactNode;
}

export function AuthShell({
  title,
  description,
  alternateHref,
  alternateLabel,
  children,
}: AuthShellProps) {
  return (
    <main className="grid min-h-screen place-items-center px-5 py-12">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-8 inline-block rounded-sm font-semibold tracking-[0.18em]">
          {appConfig.name.toUpperCase()}
        </Link>
        <GlassCard aria-labelledby="auth-title">
          <h1 id="auth-title" className="text-3xl font-semibold">{title}</h1>
          <p className="mt-3 leading-7 text-[var(--mm-text-secondary)]">{description}</p>
          <div className="mt-8">{children}</div>
          {alternateHref&&alternateLabel?<Link href={alternateHref} className="mt-6 inline-block rounded-sm text-sm text-[var(--mm-primary)]">{alternateLabel}</Link>:null}
        </GlassCard>
      </div>
    </main>
  );
}
