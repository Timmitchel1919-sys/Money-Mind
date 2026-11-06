"use client";

import { useEffect } from "react";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error("Money Mind route error", error);
  }, [error]);

  return (
    <main className="grid min-h-screen place-items-center px-5 text-center">
      <div className="max-w-md">
        <h1 className="text-3xl font-semibold">Something went wrong</h1>
        <p className="mt-4 text-[var(--mm-text-secondary)]">The page could not be loaded. Please try again.</p>
        <button type="button" onClick={reset} className="mt-7 min-h-11 rounded-[var(--mm-radius-md)] bg-[var(--mm-primary)] px-5 py-3 font-medium text-[var(--mm-text-inverse)]">
          Try again
        </button>
      </div>
    </main>
  );
}
