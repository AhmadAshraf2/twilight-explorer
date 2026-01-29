'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';

export function SearchBar() {
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
    <form onSubmit={handleSubmit} className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by block, tx hash, or address..."
          className="w-full bg-background-tertiary border border-border rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
        />
      </div>
    </form>
  );
}
