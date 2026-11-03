import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { AuthGuard } from "@/components/auth/AuthGuard";
export default function ApplicationLayout({ children }: { children: ReactNode }) { return <AuthGuard><AppShell>{children}</AppShell></AuthGuard>; }
