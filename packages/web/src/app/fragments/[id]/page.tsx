'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Puzzle,
  Users,
  Copy,
  Check,
  ArrowLeft,
  Bitcoin,
  CheckCircle,
  XCircle,
  Layers,
  Percent,
} from 'lucide-react';
import clsx from 'clsx';

import { Loading } from '@/components/Loading';
import { StatsCard } from '@/components/StatsCard';
import {
  getFragment,
  getSweepAddresses,
  getDelegates,
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

function short(addr: string, head = 12, tail = 6) {
  if (addr.length <= head + tail + 2) return addr;
  return `${addr.slice(0, head)}…${addr.slice(-tail)}`;
}

export default function FragmentDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const { data: fragment, isLoading, error } = useQuery({
    queryKey: ['fragment', id],
    queryFn: () => getFragment(id),
    enabled: !!id,
    staleTime: 600_000, // 10 minutes
    refetchInterval: false,
  });

  const { data: sweepData } = useQuery({
    queryKey: ['sweep-addresses', 100],
    queryFn: () => getSweepAddresses(100),
    staleTime: 600_000,
    refetchInterval: false,
  });

  const { data: delegates } = useQuery({
    queryKey: ['delegates'],
    queryFn: getDelegates,
    staleTime: 600_000,
    refetchInterval: false,
  });

  const judgeHasKeys = delegates?.some((d) => d.validatorAddress === fragment?.judgeAddress);

  const latestSweep = fragment
    ? sweepData?.proposeSweepAddressMsgs
        ?.filter((s) => s.judgeAddress === fragment.judgeAddress)
        ?.sort((a, b) => parseInt(b.roundId, 10) - parseInt(a.roundId, 10))[0]
    : undefined;

  if (isLoading) return <Loading />;

  if (error || !fragment) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-white mb-2">Fragment Not Found</h1>
        <p className="text-text-secondary">Fragment #{id} does not exist</p>
        <Link href="/fragments" className="text-primary-light mt-4 inline-block">
          Back to Fragments
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/fragments"
          className="p-2 hover:bg-background-tertiary/30 rounded-[7px] transition-colors"
          aria-label="Back to fragments"
        >
          <ArrowLeft className="w-5 h-5 text-text-secondary hover:text-white" />
        </Link>
        <div className="p-2 bg-primary/20 rounded-[7px] border border-card-border/50">
          <Puzzle className="w-6 h-6 text-primary-light" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-white">Fragment #{fragment.id}</h1>
          <p className="text-text-secondary text-sm font-mono">Judge: {short(fragment.judgeAddress, 16, 8)}</p>
        </div>
        <div className="flex items-center gap-2">
          <CopyButton text={fragment.judgeAddress} />
        </div>
      </div>

      {/* Status Badge */}
      <div className="flex items-center gap-3">
        <span
          className={clsx(
            'inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border',
            fragment.status
              ? 'bg-accent-green/10 text-accent-green border-accent-green/20'
              : 'bg-accent-red/10 text-accent-red border-accent-red/20'
          )}
        >
          {fragment.status ? (
            <>
              <CheckCircle className="w-4 h-4" />
              Active
            </>
          ) : (
            <>
              <XCircle className="w-4 h-4" />
              Inactive
            </>
          )}
        </span>
        {judgeHasKeys && (
          <Link
            href="/validators"
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium bg-primary/10 text-primary-light border border-primary/20 hover:bg-primary/15 transition-colors"
          >
            <Users className="w-4 h-4" />
            Judge Has Custody Keys
          </Link>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatsCard
          title="Signers"
          value={fragment.signersCount}
          icon={Users}
        />
        <StatsCard
          title="Threshold"
          value={fragment.threshold}
          icon={Layers}
        />
        <StatsCard
          title="Fee Pool"
          value={formatSatoshis(fragment.feePool)}
          icon={Bitcoin}
        />
        <StatsCard
          title="Fee Rate"
          value={`${fragment.feeBips} bips`}
          icon={Percent}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Main Content */}
        <section className="lg:col-span-2 space-y-6">
          {/* Fragment Information */}
          <div className="card">
            <h2 className="card-header">Fragment Information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-[10.5px] leading-[14px] uppercase tracking-wider text-text-secondary mb-1">Fragment ID</p>
                <p className="text-white font-medium font-mono">#{fragment.id}</p>
              </div>
              <div>
                <p className="text-[10.5px] leading-[14px] uppercase tracking-wider text-text-secondary mb-1">Judge Address</p>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/accounts/${fragment.judgeAddress}`}
                    className="text-primary-light hover:text-primary font-mono text-sm"
                  >
                    {fragment.judgeAddress}
                  </Link>
                  <CopyButton text={fragment.judgeAddress} />
                </div>
              </div>
              <div>
                <p className="text-[10.5px] leading-[14px] uppercase tracking-wider text-text-secondary mb-1">Status</p>
                <p className="text-white font-medium">
                  {fragment.status ? 'Active' : 'Inactive'}
                </p>
              </div>
              <div>
                <p className="text-[10.5px] leading-[14px] uppercase tracking-wider text-text-secondary mb-1">Threshold</p>
                <p className="text-white font-medium font-mono">{fragment.threshold}</p>
              </div>
              <div>
                <p className="text-[10.5px] leading-[14px] uppercase tracking-wider text-text-secondary mb-1">Fee Pool</p>
                <p className="text-accent-yellow font-medium font-mono">{formatSatoshis(fragment.feePool)}</p>
              </div>
              <div>
                <p className="text-[10.5px] leading-[14px] uppercase tracking-wider text-text-secondary mb-1">Fee Rate</p>
                <p className="text-white font-medium font-mono">{fragment.feeBips} bips</p>
              </div>
            </div>
            {fragment.reserveIds && fragment.reserveIds.length > 0 && (
              <div className="mt-4 pt-4 border-t border-card-border">
                <p className="text-[10.5px] leading-[14px] uppercase tracking-wider text-text-secondary mb-2">Reserve IDs</p>
                <div className="flex flex-wrap gap-2">
                  {fragment.reserveIds.map((rid) => (
                    <span key={rid} className="font-mono text-sm text-text-secondary">
                      #{rid}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Signers */}
          {fragment.signers && fragment.signers.length > 0 && (
            <div className="card">
              <h2 className="card-header">Signers ({fragment.signers.length})</h2>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Address</th>
                      <th>Status</th>
                      <th>Application Fee</th>
                      <th>Fee Bips</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fragment.signers.map((signer, idx) => (
                      <tr key={idx}>
                        <td>
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/accounts/${signer.signerAddress}`}
                              className="font-mono text-sm text-primary-light hover:text-primary"
                            >
                              {short(signer.signerAddress, 16, 8)}
                            </Link>
                            {delegates?.some((d) => d.validatorAddress === signer.signerAddress) && (
                              <Link
                                href="/validators"
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-primary/10 text-primary-light border border-primary/20"
                              >
                                Keys
                              </Link>
                            )}
                            <CopyButton text={signer.signerAddress} />
                          </div>
                        </td>
                        <td>
                          {signer.status ? (
                            <span className="text-accent-green text-xs">Active</span>
                          ) : (
                            <span className="text-accent-red text-xs">Inactive</span>
                          )}
                        </td>
                        <td className="font-mono text-sm text-accent-yellow">
                          {formatSatoshis(signer.applicationFee)}
                        </td>
                        <td className="font-mono text-sm text-text-secondary">{signer.feeBips} bips</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>

        {/* Sidebar */}
        <aside className="lg:col-span-1 space-y-6">
          {/* Latest BTC Reserve */}
          {latestSweep && (
            <div className="card">
              <h2 className="card-header flex items-center gap-2">
                <Bitcoin className="w-5 h-5 text-accent-yellow" />
                Latest BTC Reserve
              </h2>
              <div className="space-y-4">
                <div>
                  <p className="text-[10.5px] leading-[14px] uppercase tracking-wider text-text-secondary mb-1">Reserve ID</p>
                  <p className="text-white font-mono">#{latestSweep.reserveId}</p>
                </div>
                <div>
                  <p className="text-[10.5px] leading-[14px] uppercase tracking-wider text-text-secondary mb-1">Round ID</p>
                  <p className="text-white font-mono">#{latestSweep.roundId}</p>
                </div>
                <div>
                  <p className="text-[10.5px] leading-[14px] uppercase tracking-wider text-text-secondary mb-1">BTC Address</p>
                  <div className="flex items-start gap-2">
                    <a
                      href={`https://mempool.space/address/${latestSweep.btcAddress}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent-yellow hover:underline text-sm break-all"
                    >
                      {short(latestSweep.btcAddress, 12, 8)}
                    </a>
                    <CopyButton text={latestSweep.btcAddress} />
                  </div>
                </div>
                <div>
                  <p className="text-[10.5px] leading-[14px] uppercase tracking-wider text-text-secondary mb-1">Reserve Script</p>
                  <div className="flex items-start gap-2">
                    <code className="font-mono text-xs text-text-secondary break-all bg-background-primary/50 p-2 rounded-[7px] flex-1 border border-card-border/30">
                      {latestSweep.btcScript}
                    </code>
                    <CopyButton text={latestSweep.btcScript} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Quick Links */}
          <div className="card">
            <h2 className="card-header">Quick Links</h2>
            <div className="space-y-2">
              <Link
                href={`/accounts/${fragment.judgeAddress}`}
                className="block text-primary-light hover:text-primary transition-colors text-sm"
              >
                View Judge Account →
              </Link>
              {judgeHasKeys && (
                <Link
                  href="/validators"
                  className="block text-primary-light hover:text-primary transition-colors text-sm"
                >
                  View Validators →
                </Link>
              )}
              <Link
                href="/fragments"
                className="block text-primary-light hover:text-primary transition-colors text-sm"
              >
                All Fragments →
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
