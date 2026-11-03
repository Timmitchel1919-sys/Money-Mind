import Link from "next/link";

export default function NotFoundPage() {
  return (
    <main className="grid min-h-screen place-items-center px-5 text-center">
      <div className="max-w-md">
        <p className="text-sm text-[var(--mm-primary)]">404</p>
        <h1 className="mt-3 text-3xl font-semibold">Page not found</h1>
        <p className="mt-4 text-[var(--mm-text-secondary)]">The page you requested does not exist.</p>
        <Link href="/" className="mt-7 inline-flex min-h-11 items-center rounded-[var(--mm-radius-md)] bg-[var(--mm-primary)] px-5 py-3 font-medium text-[var(--mm-text-inverse)]">
          Return home
        </Link>
      </div>
    </main>
  );
}
