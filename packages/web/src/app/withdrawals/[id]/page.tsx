'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { format } from 'date-fns';
import {
  ArrowUpFromLine,
  ArrowLeft,
  Copy,
  Check,
  Bitcoin,
  ExternalLink,
  Clock,
  CheckCircle,
  XCircle,
} from 'lucide-react';

import { Loading } from '@/components/Loading';
import { StatsCard } from '@/components/StatsCard';
import { getWithdrawal } from '@/lib/api';

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

export default function WithdrawalDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const { data: withdrawal, isLoading, error } = useQuery({
    queryKey: ['withdrawal', id],
    queryFn: () => getWithdrawal(id),
    enabled: !!id,
  });

  if (isLoading) return <Loading />;

  if (error || !withdrawal) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-white mb-2">Withdrawal Not Found</h1>
        <p className="text-text-secondary">Withdrawal #{id} does not exist</p>
        <Link href="/withdrawals" className="text-primary-light mt-4 inline-block">
          Back to Withdrawals
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/withdrawals"
          className="p-2 hover:bg-background-tertiary/30 rounded-[7px] transition-colors"
          aria-label="Back to withdrawals"
        >
          <ArrowLeft className="w-5 h-5 text-text-secondary hover:text-white" />
        </Link>
        <div className="p-2 bg-accent-orange/20 rounded-[7px] border border-card-border/50">
          <ArrowUpFromLine className="w-6 h-6 text-accent-orange" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-white">Withdrawal #{withdrawal.withdrawIdentifier}</h1>
          <p className="text-text-secondary text-sm">
            Bitcoin withdrawal request from Twilight
          </p>
        </div>
        <div className="flex items-center gap-2">
          {withdrawal.isConfirmed ? (
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium bg-accent-green/10 text-accent-green border border-accent-green/20">
              <CheckCircle className="w-4 h-4" />
              Confirmed
            </span>
          ) : (
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium bg-accent-orange/10 text-accent-orange border border-accent-orange/20">
              <XCircle className="w-4 h-4" />
              Pending
            </span>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatsCard
          title="Amount"
          value={formatSatoshis(withdrawal.withdrawAmount)}
          icon={Bitcoin}
        />
        <StatsCard
          title="Reserve ID"
          value={`#${withdrawal.withdrawReserveId}`}
          icon={ArrowUpFromLine}
        />
        <StatsCard
          title="Twilight Block"
          value={`#${withdrawal.blockHeight.toLocaleString()}`}
          icon={Clock}
          href={`/blocks/${withdrawal.blockHeight}`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Withdrawal Details */}
        <div className="card">
          <h2 className="card-header">Withdrawal Information</h2>
          <div className="space-y-4">
            <div>
              <p className="text-[10.5px] leading-[14px] uppercase tracking-wider text-text-secondary mb-1">Amount</p>
              <p className="text-accent-orange font-medium text-lg">{formatSatoshis(withdrawal.withdrawAmount)}</p>
            </div>
            <div>
              <p className="text-[10.5px] leading-[14px] uppercase tracking-wider text-text-secondary mb-1">Twilight Address</p>
              <div className="flex items-center gap-2">
                <Link
                  href={`/accounts/${withdrawal.twilightAddress}`}
                  className="text-primary-light hover:text-primary font-mono text-sm break-all"
                >
                  {withdrawal.twilightAddress}
                </Link>
                <CopyButton text={withdrawal.twilightAddress} />
              </div>
            </div>
            <div>
              <p className="text-[10.5px] leading-[14px] uppercase tracking-wider text-text-secondary mb-1">BTC Withdraw Address</p>
              <div className="flex items-center gap-2">
                <a
                  href={`https://mempool.space/address/${withdrawal.withdrawAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-accent-yellow hover:underline font-mono text-sm break-all"
                >
                  {withdrawal.withdrawAddress}
                  <ExternalLink className="w-4 h-4 shrink-0" />
                </a>
                <CopyButton text={withdrawal.withdrawAddress} />
              </div>
            </div>
            <div>
              <p className="text-[10.5px] leading-[14px] uppercase tracking-wider text-text-secondary mb-1">Date</p>
              <p className="text-white font-mono">{format(new Date(withdrawal.createdAt), 'PPpp')}</p>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="card">
          <h2 className="card-header">Quick Links</h2>
          <div className="space-y-4">
            <div>
              <p className="text-[10.5px] leading-[14px] uppercase tracking-wider text-text-secondary mb-1">Check on Bitcoin</p>
              <a
                href={`https://mempool.space/address/${withdrawal.withdrawAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-accent-yellow hover:underline font-medium"
              >
                View address on Mempool.space
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
            <div>
              <p className="text-[10.5px] leading-[14px] uppercase tracking-wider text-text-secondary mb-1">Twilight Block</p>
              <Link href={`/blocks/${withdrawal.blockHeight}`} className="text-primary-light hover:text-primary font-mono">
                Block #{withdrawal.blockHeight.toLocaleString()}
              </Link>
            </div>
            <div>
              <p className="text-[10.5px] leading-[14px] uppercase tracking-wider text-text-secondary mb-1">Withdraw ID</p>
              <p className="text-white font-mono">#{withdrawal.withdrawIdentifier}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
