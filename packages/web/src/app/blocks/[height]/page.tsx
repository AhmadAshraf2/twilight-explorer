'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { format } from 'date-fns';
import {
  Blocks,
  Clock,
  Hash,
  ChevronLeft,
  ChevronRight,
  ArrowRightLeft,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { Loading } from '@/components/Loading';
import { getBlock } from '@/lib/api';
import clsx from 'clsx';

export default function BlockDetailPage() {
  const params = useParams();
  const height = parseInt(params.height as string, 10);

  const { data: block, isLoading, error } = useQuery({
    queryKey: ['block', height],
    queryFn: () => getBlock(height),
    enabled: !isNaN(height),
  });

  if (isLoading) return <Loading />;

  if (error || !block) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-white mb-2">Block Not Found</h1>
        <p className="text-text-secondary">Block #{height} does not exist</p>
        <Link href="/blocks" className="text-primary-light mt-4 inline-block">
          Back to Blocks
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/20 rounded-[7px] border border-card-border/50">
          <Blocks className="w-6 h-6 text-primary-light" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-white">Block #{height.toLocaleString()}</h1>
          <p className="text-text-secondary text-sm font-mono truncate">{block.hash}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Summary rail */}
        <aside className="order-1 lg:order-2 lg:col-span-1">
          <div className="lg:sticky lg:top-24 space-y-6">
            {/* Navigation */}
            <div className="card">
              <div className="flex items-center justify-between">
                <h2 className="text-white font-medium text-[15.8px] leading-[24px]">Navigate</h2>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/blocks/${height - 1}`}
                    className={clsx(
                      'p-2 rounded-[7px] bg-background-tertiary/60 border border-card-border/50 text-text-secondary hover:text-white transition-colors',
                      height <= 1 && 'opacity-50 pointer-events-none'
                    )}
                    aria-label="Previous block"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </Link>
                  <Link
                    href={`/blocks/${height + 1}`}
                    className="p-2 rounded-[7px] bg-background-tertiary/60 border border-card-border/50 text-text-secondary hover:text-white transition-colors"
                    aria-label="Next block"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Block Details */}
            <div className="card">
              <h2 className="card-header">Block Details</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
                <div>
                  <p className="text-[10.5px] leading-[14px] uppercase tracking-wider text-text-secondary">Height</p>
                  <p className="text-white font-medium">{height.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[10.5px] leading-[14px] uppercase tracking-wider text-text-secondary">Timestamp</p>
                  <p className="text-white font-medium">
                    {format(new Date(block.timestamp), 'PPpp')}
                  </p>
                </div>
                <div>
                  <p className="text-[10.5px] leading-[14px] uppercase tracking-wider text-text-secondary">Transactions</p>
                  <p className="text-white font-medium">{block.txCount}</p>
                </div>
                <div>
                  <p className="text-[10.5px] leading-[14px] uppercase tracking-wider text-text-secondary">Gas Used</p>
                  <p className="text-white font-medium">
                    {parseInt(block.gasUsed).toLocaleString()}
                  </p>
                </div>
                {block.proposer && (
                  <div className="sm:col-span-2 lg:col-span-1">
                    <p className="text-[10.5px] leading-[14px] uppercase tracking-wider text-text-secondary">Proposer</p>
                    <p className="text-white font-mono text-sm break-all">{block.proposer}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <section className="order-2 lg:order-1 lg:col-span-2">
          <div className="card">
            <div className="flex items-center justify-between gap-4 mb-4">
              <h2 className="text-white font-medium text-[15.8px] leading-[24px]">
                Transactions
              </h2>
              <span className="text-[10.5px] leading-[14px] uppercase tracking-wider text-text-muted">
                {(block as any).transactions?.length ?? 0}
              </span>
            </div>

            {(block as any).transactions && (block as any).transactions.length > 0 ? (
              <>
                {/* Mobile: card layout */}
                <div className="md:hidden space-y-3">
                  {(block as any).transactions.map((tx: any) => (
                    <Link
                      key={tx.hash}
                      href={`/txs/${tx.hash}`}
                      className="block p-4 rounded-[10.5px] border border-card-border bg-black/30 hover:bg-background-tertiary/30 transition-colors"
                    >
                      <div className="font-mono text-sm text-primary-light truncate">
                        {tx.hash.substring(0, 16)}...
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span className="badge badge-primary">
                          {tx.type.split('.').pop()?.replace('Msg', '')}
                        </span>
                        <span
                          className={clsx(
                            'badge',
                            tx.status === 'success' ? 'badge-success' : 'badge-error'
                          )}
                        >
                          {tx.status === 'success' ? (
                            <CheckCircle className="w-3 h-3 mr-1" />
                          ) : (
                            <XCircle className="w-3 h-3 mr-1" />
                          )}
                          {tx.status}
                        </span>
                        <span className="text-text-secondary text-sm">
                          {parseInt(tx.gasUsed).toLocaleString()} gas
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
                {/* Desktop: table */}
                <div className="hidden md:block table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Hash</th>
                        <th>Type</th>
                        <th>Status</th>
                        <th>Gas Used</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(block as any).transactions.map((tx: any) => (
                        <tr key={tx.hash}>
                          <td>
                            <Link href={`/txs/${tx.hash}`} className="font-mono text-sm">
                              {tx.hash.substring(0, 16)}...
                            </Link>
                          </td>
                          <td>
                            <span className="badge badge-primary">
                              {tx.type.split('.').pop()?.replace('Msg', '')}
                            </span>
                          </td>
                          <td>
                            <span
                              className={clsx(
                                'badge',
                                tx.status === 'success' ? 'badge-success' : 'badge-error'
                              )}
                            >
                              {tx.status === 'success' ? (
                                <CheckCircle className="w-3 h-3 mr-1" />
                              ) : (
                                <XCircle className="w-3 h-3 mr-1" />
                              )}
                              {tx.status}
                            </span>
                          </td>
                          <td className="text-text-secondary">
                            {parseInt(tx.gasUsed).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className="text-center text-text-secondary py-10">
                No transactions found for this block
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
