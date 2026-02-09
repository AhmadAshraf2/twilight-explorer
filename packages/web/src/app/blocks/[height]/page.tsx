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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/20 rounded-[7px] border border-card-border/50">
            <Blocks className="w-6 h-6 text-primary-light" />
          </div>
          <h1 className="text-2xl font-bold text-white">
            Block #{height.toLocaleString()}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/blocks/${height - 1}`}
            className={clsx(
              'p-2 rounded-[7px] bg-background-tertiary/60 border border-card-border/50 text-text-secondary hover:text-white transition-colors',
              height <= 1 && 'opacity-50 pointer-events-none'
            )}
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <Link
            href={`/blocks/${height + 1}`}
            className="p-2 rounded-[7px] bg-background-tertiary/60 border border-card-border/50 text-text-secondary hover:text-white transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </Link>
        </div>
      </div>

      {/* Block Details */}
      <div className="card">
        <h2 className="card-header">Block Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          <div className="md:col-span-2">
            <p className="text-[10.5px] leading-[14px] uppercase tracking-wider text-text-secondary">Block Hash</p>
            <p className="text-white font-mono text-sm break-all">{block.hash}</p>
          </div>
          {block.proposer && (
            <div className="md:col-span-2">
              <p className="text-[10.5px] leading-[14px] uppercase tracking-wider text-text-secondary">Proposer</p>
              <p className="text-white font-mono text-sm">{block.proposer}</p>
            </div>
          )}
        </div>
      </div>

      {/* Transactions */}
      {(block as any).transactions && (block as any).transactions.length > 0 && (
        <div className="card">
          <h2 className="card-header">
            Transactions ({(block as any).transactions.length})
          </h2>
          <div className="table-container">
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
                      <Link
                        href={`/txs/${tx.hash}`}
                        className="font-mono text-sm text-primary-light hover:text-primary"
                      >
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
        </div>
      )}
    </div>
  );
}
