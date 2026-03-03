'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { format } from 'date-fns';
import {
  ArrowDownToLine,
  ArrowLeft,
  Copy,
  Check,
  Bitcoin,
  ExternalLink,
  Clock,
} from 'lucide-react';

import { Loading } from '@/components/Loading';
import { StatsCard } from '@/components/StatsCard';
import { getDeposit } from '@/lib/api';

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button
      onClick={handleCopy}
      className="p-1 hover:bg-background-tertiary/30 rounded-[3.5px] transition-colors"
      title="Copy to clipboard"
    >
      {copied ? (
        <Check className="w-3 h-3 text-accent-green" />
      ) : (
        <Copy className="w-3 h-3 text-text-muted hover:text-white" />
      )}
    </button>
  );
}

function formatSatoshis(satoshis: string): string {
  const btc = parseInt(satoshis) / 100000000;
  return btc.toFixed(8) + ' BTC';
}

export default function DepositDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const { data: deposit, isLoading, error } = useQuery({
    queryKey: ['deposit', id],
    queryFn: () => getDeposit(id),
    enabled: !!id,
  });

  if (isLoading) return <Loading />;

  if (error || !deposit) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-white mb-2">Deposit Not Found</h1>
        <p className="text-text-secondary">Deposit #{id} does not exist</p>
        <Link href="/deposits" className="text-primary-light mt-4 inline-block">
          Back to Deposits
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/deposits"
          className="p-2 hover:bg-background-tertiary/30 rounded-[7px] transition-colors"
          aria-label="Back to deposits"
        >
          <ArrowLeft className="w-5 h-5 text-text-secondary hover:text-white" />
        </Link>
        <div className="p-2 bg-accent-green/20 rounded-[7px] border border-card-border/50">
          <ArrowDownToLine className="w-6 h-6 text-accent-green" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-white">Deposit #{deposit.id}</h1>
          <p className="text-text-secondary text-sm">
            Confirmed Bitcoin deposit to Twilight
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatsCard
          title="Amount"
          value={formatSatoshis(deposit.depositAmount)}
          icon={Bitcoin}
        />
        <StatsCard
          title="BTC Height"
          value={parseInt(deposit.btcHeight).toLocaleString()}
          icon={Clock}
        />
        <StatsCard
          title="Twilight Block"
          value={`#${deposit.blockHeight.toLocaleString()}`}
          icon={ArrowDownToLine}
          href={`/blocks/${deposit.blockHeight}`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Deposit Details */}
        <div className="card">
          <h2 className="card-header">Deposit Information</h2>
          <div className="space-y-4">
            <div>
              <p className="text-[10.5px] leading-[14px] uppercase tracking-wider text-text-secondary mb-1">Amount</p>
              <p className="text-accent-green font-medium text-lg">{formatSatoshis(deposit.depositAmount)}</p>
            </div>
            <div>
              <p className="text-[10.5px] leading-[14px] uppercase tracking-wider text-text-secondary mb-1">Twilight Deposit Address</p>
              <div className="flex items-center gap-2">
                <Link
                  href={`/accounts/${deposit.twilightDepositAddress}`}
                  className="text-primary-light hover:text-primary font-mono text-sm break-all"
                >
                  {deposit.twilightDepositAddress}
                </Link>
                <CopyButton text={deposit.twilightDepositAddress} />
              </div>
            </div>
            <div>
              <p className="text-[10.5px] leading-[14px] uppercase tracking-wider text-text-secondary mb-1">Reserve Address</p>
              <div className="flex items-center gap-2">
                <Link
                  href={`/scripts/${deposit.reserveAddress}`}
                  className="text-primary-light hover:text-primary font-mono text-sm break-all"
                >
                  {deposit.reserveAddress}
                </Link>
                <CopyButton text={deposit.reserveAddress} />
              </div>
            </div>
            <div>
              <p className="text-[10.5px] leading-[14px] uppercase tracking-wider text-text-secondary mb-1">Date</p>
              <p className="text-white font-mono">{format(new Date(deposit.createdAt), 'PPpp')}</p>
            </div>
          </div>
        </div>

        {/* Transaction Links */}
        <div className="card">
          <h2 className="card-header">Transaction Links</h2>
          <div className="space-y-4">
            <div>
              <p className="text-[10.5px] leading-[14px] uppercase tracking-wider text-text-secondary mb-1">Twilight Transaction</p>
              <div className="flex items-center gap-2">
                <Link
                  href={`/txs/${deposit.txHash}`}
                  className="text-primary-light hover:text-primary font-mono text-sm break-all"
                >
                  {deposit.txHash}
                </Link>
                <CopyButton text={deposit.txHash} />
              </div>
            </div>
            <div>
              <p className="text-[10.5px] leading-[14px] uppercase tracking-wider text-text-secondary mb-1">Bitcoin Transaction</p>
              <div className="flex items-center gap-2">
                <a
                  href={`https://mempool.space/tx/${deposit.btcHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-accent-yellow hover:underline font-mono text-sm break-all"
                >
                  {deposit.btcHash}
                  <ExternalLink className="w-4 h-4 shrink-0" />
                </a>
                <CopyButton text={deposit.btcHash} />
              </div>
            </div>
            <div>
              <p className="text-[10.5px] leading-[14px] uppercase tracking-wider text-text-secondary mb-1">Twilight Block</p>
              <Link href={`/blocks/${deposit.blockHeight}`} className="text-primary-light hover:text-primary font-mono">
                #{deposit.blockHeight.toLocaleString()}
              </Link>
            </div>
            <div>
              <p className="text-[10.5px] leading-[14px] uppercase tracking-wider text-text-secondary mb-1">Oracle Address</p>
              <div className="flex items-center gap-2">
                <Link
                  href={`/accounts/${deposit.oracleAddress}`}
                  className="text-primary-light hover:text-primary font-mono text-sm break-all"
                >
                  {deposit.oracleAddress}
                </Link>
                <CopyButton text={deposit.oracleAddress} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
