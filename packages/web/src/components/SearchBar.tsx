'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import clsx from 'clsx';

export function SearchBar({
  size = 'md',
  className,
}: {
  size?: 'md' | 'lg';
  className?: string;
}) {
  const [query, setQuery] = useState('');
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const q = query.trim();

    // Detect query type and redirect accordingly
    if (/^\d+$/.test(q)) {
      // Block height
      router.push(`/blocks/${q}`);
    } else if (/^[A-Fa-f0-9]{64}$/.test(q)) {
      // Transaction hash
      router.push(`/txs/${q.toUpperCase()}`);
    } else if (q.startsWith('twilight')) {
      // Twilight address
      router.push(`/accounts/${q}`);
    } else {
      // Generic search
      router.push(`/search?q=${encodeURIComponent(q)}`);
    }

    setQuery('');
  };

  return (
    <form onSubmit={handleSubmit} className={clsx('relative w-full', className)}>
      <div className="relative">
        <Search
          className={clsx(
            'absolute left-3 top-1/2 -translate-y-1/2 text-text-muted',
            size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'
          )}
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by block, tx hash, or address..."
          className={clsx(
            'w-full border text-white placeholder-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary',
            size === 'lg'
              ? 'bg-background-tertiary/80 border-primary/25 rounded-xl pl-12 pr-5 py-4 text-base shadow-card'
              : 'bg-background-tertiary border-border rounded-lg pl-10 pr-4 py-2 text-sm'
          )}
        />
      </div>
    </form>
  );
}
