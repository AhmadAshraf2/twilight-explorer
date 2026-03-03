'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import {
  Network,
  ShieldCheck,
  Copy,
  Check,
  ArrowLeft,
  ExternalLink,
  Blocks,
  TrendingUp,
  Clock,
  Percent,
  Users,
} from 'lucide-react';
import clsx from 'clsx';

import { Loading } from '@/components/Loading';
import { StatsCard } from '@/components/StatsCard';
import {
  getValidator,
  getValidatorBlockStats,
  getDelegates,
  type LcdStakingValidator,
  type DelegateKey,
} from '@/lib/api';

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
      aria-label="Copy to clipboard"
    >
      {copied ? <Check className="w-3 h-3 text-accent-green" /> : <Copy className="w-3 h-3 text-text-muted hover:text-white" />}
    </button>
  );
}

function formatRate(rate?: string) {
  if (!rate) return '—';
  const n = Number(rate);
  if (Number.isNaN(n)) return rate;
  return `${(n * 100).toFixed(2)}%`;
}

// Format tokens (voting power) - assuming base units (divide by 10^6 for nyks)
function formatTokens(tokens: string): string {
  const num = BigInt(tokens);
  const nyks = Number(num) / 1_000_000; // Convert from unyks to nyks
  
  if (nyks >= 1_000_000_000) {
    return `${(nyks / 1_000_000_000).toFixed(2)}B`;
  } else if (nyks >= 1_000_000) {
    return `${(nyks / 1_000_000).toFixed(2)}M`;
  } else if (nyks >= 1_000) {
    return `${(nyks / 1_000).toFixed(2)}K`;
  } else {
    return nyks.toFixed(2);
  }
}

function short(addr: string, head = 12, tail = 6) {
  if (addr.length <= head + tail + 2) return addr;
  return `${addr.slice(0, head)}…${addr.slice(-tail)}`;
}

export default function ValidatorDetailPage() {
  const params = useParams();
  const address = params.address as string;

  const { data: validator, isLoading: validatorLoading, error: validatorError } = useQuery({
    queryKey: ['validator', address],
    queryFn: () => getValidator(address),
    enabled: !!address,
    staleTime: 600_000, // 10 minutes
    refetchInterval: false,
  });

  const { data: blockStats, isLoading: blockStatsLoading } = useQuery({
    queryKey: ['validator-blocks', address],
    queryFn: () => getValidatorBlockStats(address),
    enabled: !!address,
    staleTime: 30_000, // 30 seconds
    refetchInterval: false,
  });

  const { data: delegates } = useQuery({
    queryKey: ['delegates'],
    queryFn: getDelegates,
    staleTime: 600_000,
    refetchInterval: false,
  });

  const delegate = delegates?.find((d) => d.validatorAddress === address);

  if (validatorLoading) return <Loading />;

  if (validatorError || !validator) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-white mb-2">Validator Not Found</h1>
        <p className="text-text-secondary">Validator {address} does not exist</p>
        <Link href="/validators" className="text-primary-light mt-4 inline-block">
          Back to Validators
        </Link>
      </div>
    );
  }

  const moniker = validator.description?.moniker || 'Unknown';
  const website = validator.description?.website;
  const identity = validator.description?.identity;
  const details = validator.description?.details;
  const votingPower = formatTokens(validator.tokens || '0');
  const commission = formatRate(validator.commission?.commission_rates?.rate);
  const maxCommission = formatRate(validator.commission?.commission_rates?.max_rate);
  const maxChangeRate = formatRate(validator.commission?.commission_rates?.max_change_rate);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/validators"
          className="p-2 hover:bg-background-tertiary/30 rounded-[7px] transition-colors"
          aria-label="Back to validators"
        >
          <ArrowLeft className="w-5 h-5 text-text-secondary hover:text-white" />
        </Link>
        <div className="p-2 bg-primary/20 rounded-[7px] border border-card-border/50">
          <Network className="w-6 h-6 text-primary-light" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-white">{moniker}</h1>
          <p className="text-text-secondary text-sm font-mono truncate">{address}</p>
        </div>
        <div className="flex items-center gap-2">
          <CopyButton text={address} />
          {website && (
            <a
              href={website}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 hover:bg-background-tertiary/30 rounded-[7px] transition-colors"
              aria-label="Visit website"
            >
              <ExternalLink className="w-5 h-5 text-text-secondary hover:text-primary-light" />
            </a>
          )}
        </div>
      </div>

      {/* Status Badge */}
      <div className="flex items-center gap-3">
        <span
          className={clsx(
            'inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border',
            validator.status === 'BOND_STATUS_BONDED'
              ? 'bg-accent-green/10 text-accent-green border-accent-green/20'
              : validator.jailed
              ? 'bg-accent-red/10 text-accent-red border-accent-red/20'
              : 'bg-white/5 text-text-secondary border-white/10'
          )}
        >
          {validator.jailed
            ? 'Jailed'
            : validator.status === 'BOND_STATUS_BONDED'
            ? 'Bonded'
            : validator.status.replace('BOND_STATUS_', '').toLowerCase()}
        </span>
        {delegate && (
          <Link
            href="/fragments"
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium bg-primary/10 text-primary-light border border-primary/20 hover:bg-primary/15 transition-colors"
          >
            <ShieldCheck className="w-4 h-4" />
            Custodian Keys Registered
          </Link>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatsCard
          title="Voting Power"
          value={`${votingPower} NYKS`}
          icon={Users}
        />
        <StatsCard
          title="Total Blocks"
          value={blockStats?.totalBlocks ?? 0}
          icon={Blocks}
          badge={blockStats ? `${blockStats.percentage.toFixed(2)}%` : undefined}
        />
        <StatsCard
          title="Blocks (24H)"
          value={blockStats?.blocks24h ?? 0}
          icon={TrendingUp}
        />
        <StatsCard
          title="Commission Rate"
          value={commission}
          icon={Percent}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Main Content */}
        <section className="lg:col-span-2 space-y-6">
          {/* Validator Information */}
          <div className="card">
            <h2 className="card-header">Validator Information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-[10.5px] leading-[14px] uppercase tracking-wider text-text-secondary mb-1">Moniker</p>
                <p className="text-white font-medium">{moniker}</p>
              </div>
              <div>
                <p className="text-[10.5px] leading-[14px] uppercase tracking-wider text-text-secondary mb-1">Operator Address</p>
                <div className="flex items-center gap-2">
                  <p className="text-white font-mono text-sm break-all">{address}</p>
                  <CopyButton text={address} />
                </div>
              </div>
              {identity && (
                <div>
                  <p className="text-[10.5px] leading-[14px] uppercase tracking-wider text-text-secondary mb-1">Identity</p>
                  <p className="text-white font-medium">{identity}</p>
                </div>
              )}
              {website && (
                <div>
                  <p className="text-[10.5px] leading-[14px] uppercase tracking-wider text-text-secondary mb-1">Website</p>
                  <a
                    href={website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-light hover:text-primary transition-colors flex items-center gap-1"
                  >
                    {website}
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
              <div>
                <p className="text-[10.5px] leading-[14px] uppercase tracking-wider text-text-secondary mb-1">Status</p>
                <p className="text-white font-medium">
                  {validator.jailed
                    ? 'Jailed'
                    : validator.status === 'BOND_STATUS_BONDED'
                    ? 'Bonded'
                    : validator.status.replace('BOND_STATUS_', '').toLowerCase()}
                </p>
              </div>
              <div>
                <p className="text-[10.5px] leading-[14px] uppercase tracking-wider text-text-secondary mb-1">Voting Power</p>
                <p className="text-white font-medium font-mono">{votingPower} NYKS</p>
              </div>
            </div>
            {details && (
              <div className="mt-4 pt-4 border-t border-card-border">
                <p className="text-[10.5px] leading-[14px] uppercase tracking-wider text-text-secondary mb-2">Details</p>
                <p className="text-text-secondary text-sm leading-relaxed">{details}</p>
              </div>
            )}
          </div>

          {/* Block Production Stats */}
          {blockStatsLoading ? (
            <div className="card">
              <div className="py-8 text-center text-text-secondary">Loading block statistics...</div>
            </div>
          ) : blockStats ? (
            <div className="card">
              <h2 className="card-header">Block Production</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-[10.5px] leading-[14px] uppercase tracking-wider text-text-secondary mb-1">Total Blocks</p>
                  <p className="text-white font-medium font-mono">{blockStats.totalBlocks.toLocaleString()}</p>
                  <p className="text-text-muted text-xs mt-1">{blockStats.percentage.toFixed(2)}% of all blocks</p>
                </div>
                <div>
                  <p className="text-[10.5px] leading-[14px] uppercase tracking-wider text-text-secondary mb-1">Blocks (24H)</p>
                  <p className="text-white font-medium font-mono">{blockStats.blocks24h.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[10.5px] leading-[14px] uppercase tracking-wider text-text-secondary mb-1">Blocks (7D)</p>
                  <p className="text-white font-medium font-mono">{blockStats.blocks7d.toLocaleString()}</p>
                </div>
                {blockStats.lastBlock && (
                  <div>
                    <p className="text-[10.5px] leading-[14px] uppercase tracking-wider text-text-secondary mb-1">Last Block</p>
                    <Link
                      href={`/blocks/${blockStats.lastBlock.height}`}
                      className="text-primary-light hover:text-primary transition-colors font-mono text-sm"
                    >
                      #{blockStats.lastBlock.height.toLocaleString()}
                    </Link>
                    <p className="text-text-muted text-xs mt-1">
                      {formatDistanceToNow(new Date(blockStats.lastBlock.timestamp), { addSuffix: true })}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </section>

        {/* Sidebar */}
        <aside className="lg:col-span-1 space-y-6">
          {/* Commission Details */}
          <div className="card">
            <h2 className="card-header">Commission</h2>
            <div className="space-y-4">
              <div>
                <p className="text-[10.5px] leading-[14px] uppercase tracking-wider text-text-secondary mb-1">Current Rate</p>
                <p className="text-white font-medium font-mono">{commission}</p>
              </div>
              {maxCommission && (
                <div>
                  <p className="text-[10.5px] leading-[14px] uppercase tracking-wider text-text-secondary mb-1">Max Rate</p>
                  <p className="text-white font-medium font-mono">{maxCommission}</p>
                </div>
              )}
              {maxChangeRate && (
                <div>
                  <p className="text-[10.5px] leading-[14px] uppercase tracking-wider text-text-secondary mb-1">Max Change Rate</p>
                  <p className="text-white font-medium font-mono">{maxChangeRate}</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div className="card">
            <h2 className="card-header">Quick Links</h2>
            <div className="space-y-2">
              <Link
                href={`/accounts/${address}`}
                className="block text-primary-light hover:text-primary transition-colors text-sm"
              >
                View Account →
              </Link>
              {delegate && (
                <Link
                  href="/fragments"
                  className="block text-primary-light hover:text-primary transition-colors text-sm"
                >
                  View Fragments →
                </Link>
              )}
              <Link
                href="/validators"
                className="block text-primary-light hover:text-primary transition-colors text-sm"
              >
                All Validators →
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
