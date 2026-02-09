'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { SearchBar } from '@/components/SearchBar';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Keep minimal; Next will surface details in dev tools.
    // eslint-disable-next-line no-console
    console.error(error);
  }, [error]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Something went wrong</h1>
        <p className="text-text-secondary text-sm">
          We couldn&apos;t load this page. Try again, or use search to continue exploring.
        </p>
      </div>

      <section className="card card-hover rounded-[10.5px] p-4 sm:p-5 bg-card/50 backdrop-blur-[2px]">
        <SearchBar size="lg" className="w-full" />
      </section>

      <div className="card">
        <h2 className="card-header">Recovery</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => reset()}
            className="inline-flex items-center justify-center px-4 py-2 rounded-[7px] border border-card-border/50 bg-background-tertiary/40 text-white hover:bg-background-tertiary/60 transition-colors"
          >
            Try again
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center px-4 py-2 rounded-[7px] border border-card-border/50 bg-background-tertiary/40 text-white hover:bg-background-tertiary/60 transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>

        {error?.digest && (
          <div className="mt-4 text-[12.3px] leading-[18px] text-text-muted">
            Error reference: <span className="font-mono text-text-secondary">{error.digest}</span>
          </div>
        )}
      </div>
    </div>
  );
}

