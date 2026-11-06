import Link from "next/link";
import { appConfig } from "@/config/app";

export default function LandingPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-5 py-6 sm:px-8 lg:px-10">
      <nav aria-label="Primary" className="flex items-center justify-between">
        <Link href="/" className="rounded-sm font-semibold tracking-[0.18em]">
          {appConfig.name.toUpperCase()}
        </Link>
        <Link href="/login" className="mm-glass rounded-full px-5 py-2 text-sm">
          Sign in
        </Link>
      </nav>

      <section className="grid flex-1 items-center gap-12 py-16 lg:grid-cols-2">
        <div>
          <h1 className="max-w-3xl text-5xl font-semibold leading-[1.03] tracking-tight sm:text-6xl md:text-7xl">
            See your money as one connected system.
          </h1>
          <p className="mt-6 max-w-xl text-base leading-8 text-[var(--mm-text-secondary)] sm:text-lg">
            A personal financial intelligence operating system for understanding, planning, and building wealth.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link href="/register" className="inline-flex min-h-11 items-center rounded-[var(--mm-radius-md)] bg-[var(--mm-primary)] px-6 py-3 font-medium text-[var(--mm-text-inverse)]">
              Create account
            </Link>
            <Link href="/dashboard" className="mm-glass rounded-full px-6 py-3">
              View foundation
            </Link>
          </div>
        </div>

        <div aria-hidden="true" className="relative mx-auto aspect-square w-full max-w-lg">
          <div className="absolute inset-[18%] rounded-full border border-[var(--mm-glass-border-default)] bg-[radial-gradient(circle,rgba(101,221,184,.2),rgba(85,216,208,.03)_54%,transparent_72%)] shadow-[0_0_100px_rgba(85,216,208,.12)]" />
          <div className="absolute inset-0 grid place-items-center text-center">
            <div>
              <div className="text-xs uppercase tracking-[0.25em] text-white/35">Money Mind</div>
              <div className="mt-2 text-3xl font-semibold">2.0</div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
