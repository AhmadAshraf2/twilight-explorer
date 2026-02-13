import Link from 'next/link';
import { SearchBar } from '@/components/SearchBar';

export default function NotFound() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Page not found</h1>
        <p className="text-text-secondary text-sm">
          The page you&apos;re looking for doesn&apos;t exist or may have moved.
        </p>
      </div>

      <section className="card card-hover rounded-[10.5px] p-4 sm:p-5 bg-card/50 backdrop-blur-[2px]">
        <SearchBar size="lg" className="w-full" />
      </section>

      <div className="card">
        <h2 className="card-header">Next steps</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/"
            className="inline-flex items-center justify-center px-4 py-2 rounded-[7px] border border-card-border/50 bg-background-tertiary/40 text-white hover:bg-background-tertiary/60 transition-colors"
          >
            Back to Dashboard
          </Link>
          <Link
            href="/blocks"
            className="inline-flex items-center justify-center px-4 py-2 rounded-[7px] border border-card-border/50 bg-background-tertiary/40 text-white hover:bg-background-tertiary/60 transition-colors"
          >
            Browse Blocks
          </Link>
          <Link
            href="/txs"
            className="inline-flex items-center justify-center px-4 py-2 rounded-[7px] border border-card-border/50 bg-background-tertiary/40 text-white hover:bg-background-tertiary/60 transition-colors"
          >
            Browse Transactions
          </Link>
        </div>
      </div>
    </div>
  );
}

