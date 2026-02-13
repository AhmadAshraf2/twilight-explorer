'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  Puzzle,
  Users,
  CheckCircle,
  XCircle,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Layers,
  ShieldCheck,
} from 'lucide-react';
import clsx from 'clsx';
import { LoadingTable, LoadingCard } from '@/components/Loading';
import { StatsCard } from '@/components/StatsCard';
import {
  getDelegates,
  getFragmentsLive,
  getSweepAddresses,
  type DelegateKey,
  type FragmentLive,
  type SweepAddress,
} from '@/lib/api';
import { useState, useMemo } from 'react';

function formatSatoshis(satoshis: string): string {
  const btc = parseInt(satoshis) / 100000000;
  return btc.toFixed(8) + ' BTC';
}

type SortField = 'id' | 'status' | 'signers' | 'feePool' | 'threshold';
type SortDirection = 'asc' | 'desc';

function FragmentRow({
  fragment,
  sweepAddress,
  delegateByValidator,
}: {
  fragment: FragmentLive;
  sweepAddress?: SweepAddress;
  delegateByValidator: Map<string, DelegateKey>;
}) {
  const judgeHasKeys = delegateByValidator.has(fragment.judgeAddress);

  return (
    <tr className="hover:bg-background-tertiary transition-colors">
      <td className="font-medium font-mono">#{fragment.id}</td>
      <td>
        {fragment.status ? (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-accent-green/20 text-accent-green">
            <CheckCircle className="w-3 h-3" />
            Active
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-accent-red/20 text-accent-red">
            <XCircle className="w-3 h-3" />
            Inactive
          </span>
        )}
      </td>
      <td>
        <div className="flex items-center gap-2">
          <Link
            href={`/accounts/${fragment.judgeAddress}`}
            className="font-mono text-sm text-primary-light hover:text-primary"
          >
            {fragment.judgeAddress.substring(0, 20)}...
          </Link>
          {judgeHasKeys && (
            <Link
              href="/validators"
              className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-medium bg-primary/10 text-primary-light border border-primary/20 hover:bg-primary/15 transition-colors"
              title="Judge has custody delegate keys registered (Forks module)"
            >
              <Users className="w-3 h-3" />
              Keys
            </Link>
          )}
        </div>
      </td>
      <td className="text-text-secondary">{fragment.threshold}</td>
      <td>
        <span className="inline-flex items-center gap-1 text-text-secondary">
          <Users className="w-3 h-3" />
          {fragment.signersCount}
        </span>
      </td>
      <td>
        <span className="text-accent-yellow font-medium">
          {formatSatoshis(fragment.feePool)}
        </span>
      </td>
      <td className="text-text-secondary">{fragment.feeBips} bips</td>
      <td>
        {sweepAddress ? (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-primary/20 text-primary-light">
            Round #{sweepAddress.roundId}
          </span>
        ) : (
          <span className="text-text-muted text-xs">-</span>
        )}
      </td>
      <td>
        <Link
          href={`/fragments/${fragment.id}`}
          className="text-primary-light hover:text-primary transition-colors text-sm font-medium"
        >
          View Details →
        </Link>
      </td>
    </tr>
  );
}

export default function FragmentsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('id');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const { data, isLoading } = useQuery({
    queryKey: ['fragments-live'],
    queryFn: getFragmentsLive,
    staleTime: 600_000, // 10 minutes (matches cache TTL)
    refetchInterval: false,
  });

  const { data: delegates } = useQuery({
    queryKey: ['delegates'],
    queryFn: getDelegates,
    staleTime: 600_000,
    refetchInterval: false,
  });

  const { data: sweepData } = useQuery({
    queryKey: ['sweep-addresses', 100],
    queryFn: () => getSweepAddresses(100),
    staleTime: 600_000,
    refetchInterval: false,
  });

  const delegateByValidator = useMemo(() => {
    const map = new Map<string, DelegateKey>();
    for (const d of delegates ?? []) map.set(d.validatorAddress, d);
    return map;
  }, [delegates]);

  // Create a map of judgeAddress to their latest sweep address (highest roundId)
  const latestSweepByJudge = useMemo(() => {
    if (!sweepData?.proposeSweepAddressMsgs) return new Map<string, SweepAddress>();

    const map = new Map<string, SweepAddress>();
    for (const sweep of sweepData.proposeSweepAddressMsgs) {
      const existing = map.get(sweep.judgeAddress);
      if (!existing || parseInt(sweep.roundId) > parseInt(existing.roundId)) {
        map.set(sweep.judgeAddress, sweep);
      }
    }
    return map;
  }, [sweepData]);

  // Stats derived from live data
  const stats = useMemo(() => {
    const fragments = data?.data ?? [];
    const active = fragments.filter((f) => f.status).length;
    const inactive = fragments.length - active;
    const totalSigners = fragments.reduce((sum, f) => sum + f.signersCount, 0);

    return {
      total: fragments.length,
      active,
      inactive,
      totalSigners,
    };
  }, [data]);

  // Filter and sort fragments
  const filteredAndSorted = useMemo(() => {
    let fragments = data?.data ?? [];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      fragments = fragments.filter(
        (f) =>
          String(f.id).toLowerCase().includes(q) ||
          f.judgeAddress.toLowerCase().includes(q)
      );
    }

    const sorted = [...fragments].sort((a, b) => {
      let aVal: string | number | boolean;
      let bVal: string | number | boolean;

      switch (sortField) {
        case 'id':
          aVal = parseInt(String(a.id), 10) || 0;
          bVal = parseInt(String(b.id), 10) || 0;
          break;
        case 'status':
          aVal = a.status ? 1 : 0;
          bVal = b.status ? 1 : 0;
          break;
        case 'signers':
          aVal = a.signersCount;
          bVal = b.signersCount;
          break;
        case 'feePool':
          aVal = parseInt(a.feePool, 10) || 0;
          bVal = parseInt(b.feePool, 10) || 0;
          break;
        case 'threshold':
          aVal = a.threshold;
          bVal = b.threshold;
          break;
        default:
          return 0;
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [data, searchQuery, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => {
    const isActive = sortField === field;
    return (
      <button
        onClick={() => handleSort(field)}
        className={clsx(
          'flex items-center gap-1 hover:text-white transition-colors',
          isActive ? 'text-white' : 'text-text-secondary'
        )}
      >
        {children}
        {isActive ? (
          sortDirection === 'asc' ? (
            <ArrowUp className="w-3 h-3" />
          ) : (
            <ArrowDown className="w-3 h-3" />
          )
        ) : (
          <ArrowUpDown className="w-3 h-3 opacity-50" />
        )}
      </button>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/20 rounded-[7px] border border-card-border/50">
          <Puzzle className="w-6 h-6 text-primary-light" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Fragments</h1>
          <p className="text-text-secondary text-sm">
            Multi-signature fragments for reserve management
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {isLoading ? (
          <>
            <LoadingCard />
            <LoadingCard />
            <LoadingCard />
            <LoadingCard />
          </>
        ) : (
          <>
            <StatsCard
              title="Total Fragments"
              value={stats.total}
              icon={Layers}
              badge="All"
            />
            <StatsCard
              title="Active Fragments"
              value={stats.active}
              icon={CheckCircle}
              badge="Online"
            />
            <StatsCard
              title="Inactive Fragments"
              value={stats.inactive}
              icon={ShieldCheck}
              badge="Offline"
            />
            <StatsCard
              title="Total Signers"
              value={stats.totalSigners}
              icon={Users}
            />
          </>
        )}
      </div>

      {/* Search */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              placeholder="Search by fragment ID or judge address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-background-tertiary/30 border border-card-border rounded-[7px] text-white placeholder-text-muted focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>
          <div className="text-sm text-text-secondary">
            Showing {filteredAndSorted.length} of {stats.total} fragments
          </div>
        </div>
      </div>

      {isLoading ? (
        <LoadingTable rows={10} />
      ) : (
        <>
          <div className="card">
            <div className="flex items-center justify-between gap-4 mb-4">
              <h2 className="text-white font-medium text-[15.8px] leading-[24px]">All Fragments</h2>
              <div className="text-[10.5px] leading-[14px] uppercase tracking-wider text-text-muted">
                Total: <span className="text-text-secondary font-mono">{stats.total}</span>
              </div>
            </div>

            {filteredAndSorted.length > 0 ? (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>
                        <SortButton field="id">ID</SortButton>
                      </th>
                      <th>
                        <SortButton field="status">Status</SortButton>
                      </th>
                      <th>Judge Address</th>
                      <th>
                        <SortButton field="threshold">Threshold</SortButton>
                      </th>
                      <th>
                        <SortButton field="signers">Signers</SortButton>
                      </th>
                      <th>
                        <SortButton field="feePool">Fee Pool</SortButton>
                      </th>
                      <th>Fee Rate</th>
                      <th>Latest Round</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAndSorted.map((fragment) => (
                      <FragmentRow
                        key={fragment.id}
                        fragment={fragment}
                        sweepAddress={latestSweepByJudge.get(fragment.judgeAddress)}
                        delegateByValidator={delegateByValidator}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-10 text-text-secondary">
                {searchQuery ? 'No fragments match your search' : 'No fragments found'}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
