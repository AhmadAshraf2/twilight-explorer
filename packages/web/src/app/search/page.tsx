'use client';

import { useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { SearchBar } from '@/components/SearchBar';

function classifyQuery(q: string): string | null {
  const query = q.trim();
  if (!query) return null;

  // Block height
  if (/^\d+$/.test(query)) return `/blocks/${query}`;

  // Transaction hash
  if (/^[A-Fa-f0-9]{64}$/.test(query)) return `/txs/${query.toUpperCase()}`;

  // Twilight address
  if (query.startsWith('twilight')) return `/accounts/${query}`;

  return null;
}

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const q = searchParams.get('q') ?? '';

  const destination = useMemo(() => classifyQuery(q), [q]);

  useEffect(() => {
    if (destination) router.replace(destination);
  }, [destination, router]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Search</h1>
          <p className="text-text-secondary text-sm">
            Enter a block height, transaction hash, or Twilight address.
          </p>
        </div>
        <Link href="/" className="text-primary-light hover:text-primary text-sm">
          Back to Dashboard
        </Link>
      </div>

      <section className="card card-hover rounded-[10.5px] p-4 sm:p-5 bg-card/50 backdrop-blur-[2px]">
        <SearchBar size="lg" className="w-full" />
      </section>

      {q.trim() && !destination && (
        <div className="card">
          <h2 className="card-header">Unrecognized query</h2>
          <div className="space-y-2 text-text-secondary text-sm">
            <p>
              We couldn&apos;t match <span className="text-white font-mono">{q.trim()}</span> to a known explorer
              identifier.
            </p>
            <div className="pt-2">
              <p className="text-[10.5px] leading-[14px] uppercase tracking-wider text-text-muted">
                Examples
              </p>
              <ul className="mt-2 space-y-1">
                <li>
                  <span className="text-text-muted">Block height:</span>{' '}
                  <span className="text-white font-mono">143</span>
                </li>
                <li>
                  <span className="text-text-muted">Transaction hash:</span>{' '}
                  <span className="text-white font-mono">64 hex characters</span>
                </li>
                <li>
                  <span className="text-text-muted">Twilight address:</span>{' '}
                  <span className="text-white font-mono">twilight...</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

