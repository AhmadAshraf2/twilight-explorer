'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { format } from 'date-fns';
import {
  ArrowRightLeft,
  CheckCircle,
  XCircle,
  Blocks,
  Clock,
  FileCode,
  Fuel,
} from 'lucide-react';
import { Loading } from '@/components/Loading';
import { MessageFormatter } from '@/components/MessageFormatter';
import { getTransaction } from '@/lib/api';
import clsx from 'clsx';

// Format coin amount - show raw values with denomination
function formatCoinAmount(amount: string, denom: string): string {
  const value = parseInt(amount);
  if (isNaN(value)) return `0 ${denom}`;
  return `${value.toLocaleString()} ${denom}`;
}

export default function TransactionDetailPage() {
  const params = useParams();
  const hash = params.hash as string;

  const { data: tx, isLoading, error } = useQuery({
    queryKey: ['transaction', hash],
    queryFn: () => getTransaction(hash),
    enabled: !!hash,
  });

  if (isLoading) return <Loading />;

  if (error || !tx) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-white mb-2">Transaction Not Found</h1>
        <p className="text-text-secondary">Transaction {hash} does not exist</p>
        <Link href="/txs" className="text-primary-light mt-4 inline-block">
          Back to Transactions
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div
          className={clsx(
            'p-2 rounded-[7px] border border-card-border/50',
            tx.status === 'success' ? 'bg-accent-green/20' : 'bg-accent-red/20'
          )}
        >
          {tx.status === 'success' ? (
            <CheckCircle className="w-6 h-6 text-accent-green" />
          ) : (
            <XCircle className="w-6 h-6 text-accent-red" />
          )}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Transaction Details</h1>
          <p className="text-text-secondary text-sm font-mono">{tx.hash}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Summary rail */}
        <aside className="order-1 lg:order-2 lg:col-span-1">
          <div className="lg:sticky lg:top-24 space-y-6">
            {/* Overview */}
            <div className="card">
              <h2 className="card-header">Overview</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
                <div>
                  <p className="text-[10.5px] leading-[14px] uppercase tracking-wider text-text-secondary">Status</p>
                  <span
                    className={clsx(
                      'badge mt-1',
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
                </div>
                <div>
                  <p className="text-[10.5px] leading-[14px] uppercase tracking-wider text-text-secondary">Block</p>
                  <Link
                    href={`/blocks/${tx.blockHeight}`}
                    className="text-primary-light hover:text-primary font-medium flex items-center gap-1 mt-1"
                  >
                    <Blocks className="w-4 h-4" />
                    #{tx.blockHeight.toLocaleString()}
                  </Link>
                </div>
                <div className="sm:col-span-2 lg:col-span-1">
                  <p className="text-[10.5px] leading-[14px] uppercase tracking-wider text-text-secondary">Timestamp</p>
                  <p className="text-white font-medium flex items-center gap-1 mt-1">
                    <Clock className="w-4 h-4 text-text-secondary" />
                    {format(new Date(tx.blockTime), 'PPpp')}
                  </p>
                </div>
                <div className="sm:col-span-2 lg:col-span-1">
                  <p className="text-[10.5px] leading-[14px] uppercase tracking-wider text-text-secondary">Gas Used</p>
                  <p className="text-white font-medium flex items-center gap-1 mt-1">
                    <Fuel className="w-4 h-4 text-text-secondary" />
                    {parseInt(tx.gasUsed).toLocaleString()}
                    {tx.gasWanted && (
                      <span className="text-text-muted">
                        / {parseInt(tx.gasWanted).toLocaleString()}
                      </span>
                    )}
                  </p>
                </div>
                {tx.memo && (
                  <div className="sm:col-span-2 lg:col-span-1">
                    <p className="text-[10.5px] leading-[14px] uppercase tracking-wider text-text-secondary">Memo</p>
                    <p className="text-white mt-1">{tx.memo}</p>
                  </div>
                )}
                {tx.errorLog && (
                  <div className="sm:col-span-2 lg:col-span-1">
                    <p className="text-[10.5px] leading-[14px] uppercase tracking-wider text-text-secondary">Error</p>
                    <p className="text-accent-red mt-1 font-mono text-sm">{tx.errorLog}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Fee */}
            {tx.fee && tx.fee.amount && tx.fee.amount.length > 0 && (
              <div className="card">
                <h2 className="card-header">Trading Fee</h2>
                <div className="flex flex-wrap gap-3">
                  {tx.fee.amount.map((coin: any, i: number) => (
                    <div
                      key={i}
                      className="bg-background-tertiary/40 rounded-[7px] px-4 py-2 border border-card-border/30"
                    >
                      <span className="text-accent-yellow font-semibold">
                        {formatCoinAmount(coin.amount, coin.denom)}
                      </span>
                    </div>
                  ))}
                  {tx.fee.gas_limit && (
                    <div className="bg-background-tertiary/40 rounded-[7px] px-4 py-2 border border-card-border/30">
                      <span className="text-text-secondary">Gas Limit: </span>
                      <span className="text-white">{parseInt(tx.fee.gas_limit).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Main content */}
        <section className="order-2 lg:order-1 lg:col-span-2">
          <div className="card">
            <div className="flex items-center justify-between gap-4 mb-4">
              <h2 className="text-white font-medium text-[15.8px] leading-[24px] flex items-center gap-2">
                <FileCode className="w-5 h-5" />
                Messages
              </h2>
              <span className="text-[10.5px] leading-[14px] uppercase tracking-wider text-text-muted">
                {tx.messages?.length ?? 0}
              </span>
            </div>

            {tx.messages && tx.messages.length > 0 ? (
              <div className="space-y-4">
                {tx.messages.map((msg: any, index: number) => {
                  // If this is a zkOS transfer message and we have decoded data, merge it in
                  const enrichedMsg =
                    msg.type?.includes('MsgTransferTx') && tx.zkosDecodedData
                      ? { ...msg, data: { ...msg.data, zkosDecodedData: tx.zkosDecodedData } }
                      : msg;
                  return <MessageFormatter key={index} message={enrichedMsg} />;
                })}
              </div>
            ) : (
              <div className="text-center text-text-secondary py-10">
                No messages found for this transaction
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
