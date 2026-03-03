import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { ArrowRightLeft, Clock, CheckCircle, XCircle } from 'lucide-react';
import clsx from 'clsx';
import type { Transaction } from '@/lib/api';

function shortType(type: string): string {
  const parts = type.split('.');
  const name = parts[parts.length - 1];
  return name.replace(/^Msg/, '');
}

export function RecentActivityPanel({
  transactions,
  title = 'Recent Activity',
  viewAllHref = '/txs',
}: {
  transactions?: Transaction[];
  title?: string;
  viewAllHref?: string;
}) {
  return (
    <section className="card card-hover p-[22px]">
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-medium text-[15.8px] leading-[24px] text-white">{title}</h2>
        <Link
          href={viewAllHref}
          className="text-[10.5px] leading-[14px] text-primary hover:text-primary-light transition-colors"
        >
          View All
        </Link>
      </div>

      <div className="mt-4 bg-black/30 border border-card-border rounded-[7px] overflow-hidden">
        {/* Desktop: table-like header */}
        <div className="hidden md:grid h-9 bg-background-tertiary/40 grid-cols-[1fr_1.5fr_1fr_1fr] items-center px-[10.5px]">
          <span className="text-[10.5px] leading-[14px] font-medium text-text-secondary">Time</span>
          <span className="text-[10.5px] leading-[14px] font-medium text-text-secondary">Hash</span>
          <span className="text-[10.5px] leading-[14px] font-medium text-text-secondary text-right">Type</span>
          <span className="text-[10.5px] leading-[14px] font-medium text-text-secondary text-right">Status</span>
        </div>

        {/* Rows */}
        <div>
          {!transactions?.length ? (
            <div className="p-4 text-sm text-text-secondary">No activity</div>
          ) : (
            transactions.map((tx, idx) => (
              <div
                key={tx.hash}
                className={clsx(
                  idx !== 0 && 'border-t border-card-border/50'
                )}
              >
                {/* Mobile: card layout */}
                <div className="md:hidden px-[10.5px] py-3">
                  <Link
                    href={`/txs/${tx.hash}`}
                    className="font-mono text-[12.3px] leading-[18px] text-primary-light hover:text-primary transition-colors flex items-center gap-2"
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5 opacity-70 shrink-0" />
                    <span className="truncate">{tx.hash.substring(0, 10)}...{tx.hash.substring(tx.hash.length - 6)}</span>
                  </Link>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-[12.3px] text-text-secondary">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 opacity-80" />
                      {formatDistanceToNow(new Date(tx.blockTime), { addSuffix: true })}
                    </span>
                    <span className="font-mono text-white">{shortType(tx.type)}</span>
                    <span
                      className={clsx(
                        'flex items-center gap-1',
                        tx.status === 'success' ? 'text-accent-green' : 'text-accent-red'
                      )}
                    >
                      {tx.status === 'success' ? (
                        <CheckCircle className="w-3.5 h-3.5" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5" />
                      )}
                      {tx.status}
                    </span>
                  </div>
                </div>

                {/* Desktop: table row */}
                <div className="hidden md:grid h-[38.5px] grid-cols-[1fr_1.5fr_1fr_1fr] items-center px-[10.5px]">
                  <span className="text-[12.3px] leading-[18px] text-text-secondary flex items-center gap-2">
                    <Clock className="w-3 h-3 opacity-80 shrink-0" />
                    {formatDistanceToNow(new Date(tx.blockTime), { addSuffix: true })}
                  </span>
                  <Link
                    href={`/txs/${tx.hash}`}
                    className="font-mono text-[12.3px] leading-[18px] text-primary-light hover:text-primary transition-colors inline-flex items-center gap-2 truncate"
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5 opacity-70 shrink-0" />
                    {tx.hash.substring(0, 10)}...{tx.hash.substring(tx.hash.length - 6)}
                  </Link>
                  <span className="text-right">
                    <span className="inline-flex items-center justify-end font-mono text-[12.3px] leading-[18px] text-white">
                      {shortType(tx.type)}
                    </span>
                  </span>
                  <span className="text-right">
                    <span
                      className={clsx(
                        'inline-flex items-center justify-end gap-1 font-mono text-[12.3px] leading-[18px]',
                        tx.status === 'success' ? 'text-accent-green' : 'text-accent-red'
                      )}
                    >
                      {tx.status === 'success' ? (
                        <CheckCircle className="w-3.5 h-3.5" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5" />
                      )}
                      {tx.status}
                    </span>
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="h-9 flex items-center justify-center border-t border-card-border/50 opacity-60">
          <span className="text-[10.5px] leading-[14px] italic text-text-secondary">
            Real-time feed active...
          </span>
        </div>
      </div>
    </section>
  );
}

