'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { format, formatDistanceToNow } from 'date-fns';
import {
  ArrowUpFromLine,
  CheckCircle,
  XCircle,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Copy,
  Check,
  Wallet,
  ExternalLink,
  Clock,
} from 'lucide-react';
import clsx from 'clsx';
import { Pagination } from '@/components/Pagination';
import { LoadingTable, LoadingCard } from '@/components/Loading';
import { StatsCard } from '@/components/StatsCard';
import { getWithdrawals, getBridgeAnalytics, getModuleStats } from '@/lib/api';

function formatSatoshis(satoshis: string): string {
  const btc = parseInt(satoshis) / 100000000;
  return btc.toFixed(8) + ' BTC';
}

function formatBTC(satoshis: string | number): string {
  const sats = typeof satoshis === 'string' ? BigInt(satoshis) : BigInt(satoshis);
  const btc = Number(sats) / 100_000_000;
  if (btc >= 1_000_000) return `${(btc / 1_000_000).toFixed(2)}M`;
  if (btc >= 1_000) return `${(btc / 1_000).toFixed(2)}K`;
  if (btc >= 1) return btc.toFixed(2);
  return btc.toFixed(4);
}

function short(addr: string, head = 10, tail = 6) {
  if (addr.length <= head + tail + 2) return addr;
  return `${addr.slice(0, head)}…${addr.slice(-tail)}`;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button
      onClick={handleCopy}
      className="p-1 hover:bg-background-tertiary/30 rounded-[3.5px] transition-colors"
      title="Copy"
    >
      {copied ? <Check className="w-3 h-3 text-accent-green" /> : <Copy className="w-3 h-3 text-text-muted hover:text-white" />}
    </button>
  );
}

type SortField = 'id' | 'amount' | 'blockHeight' | 'createdAt';
type SortDirection = 'asc' | 'desc';
type StatusFilter = 'all' | 'pending' | 'confirmed';

export default function WithdrawalsPage() {
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortField, setSortField] = useState<SortField>('blockHeight');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const limit = 20;

  const confirmedParam =
    statusFilter === 'confirmed' ? true : statusFilter === 'pending' ? false : undefined;

  const { data, isLoading } = useQuery({
    queryKey: ['withdrawals', page, limit, statusFilter, searchQuery],
    queryFn: () =>
      getWithdrawals(page, limit, {
        confirmed: confirmedParam,
        search: searchQuery.trim() || undefined,
      }),
  });

  const { data: bridgeAnalytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['bridge-analytics'],
    queryFn: getBridgeAnalytics,
    staleTime: 60_000,
  });

  const { data: moduleStats } = useQuery({
    queryKey: ['moduleStats'],
    queryFn: getModuleStats,
    staleTime: 60_000,
  });

  const withdrawals = data?.data ?? [];
  const sortedWithdrawals = [...withdrawals].sort((a, b) => {
    let aVal: string | number;
    let bVal: string | number;
    switch (sortField) {
      case 'id':
        aVal = a.id;
        bVal = b.id;
        break;
      case 'amount':
        aVal = parseInt(a.withdrawAmount, 10);
        bVal = parseInt(b.withdrawAmount, 10);
        break;
      case 'blockHeight':
        aVal = a.blockHeight;
        bVal = b.blockHeight;
        break;
      case 'createdAt':
        aVal = new Date(a.createdAt).getTime();
        bVal = new Date(b.createdAt).getTime();
        break;
      default:
        return 0;
    }
    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const SortHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <button
      onClick={() => handleSort(field)}
      className={clsx(
        'flex items-center gap-1 hover:text-white transition-colors text-left',
        sortField === field ? 'text-white' : 'text-text-secondary'
      )}
    >
      {children}
      {sortField === field ? (
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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-accent-orange/20 rounded-[7px] border border-card-border/50">
          <ArrowUpFromLine className="w-6 h-6 text-accent-orange" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">BTC Withdrawals</h1>
          <p className="text-text-secondary text-sm">
            Bitcoin withdrawal requests from Twilight
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {analyticsLoading ? (
          <>
            <LoadingCard />
            <LoadingCard />
            <LoadingCard />
            <LoadingCard />
          </>
        ) : (
          <>
            <StatsCard
              title="Total Withdrawals"
              value={moduleStats?.bridge.withdrawals ?? 0}
              icon={Wallet}
              badge="All time"
            />
            <StatsCard
              title="Total Volume"
              value={bridgeAnalytics ? `${formatBTC(bridgeAnalytics.totalVolume)} BTC` : '—'}
              icon={ArrowUpFromLine}
              badge="Cumulative"
            />
            <StatsCard
              title="Pending"
              value={bridgeAnalytics?.pendingWithdrawals ?? 0}
              icon={Clock}
              badge="Awaiting"
            />
            <StatsCard
              title="Success Rate"
              value={bridgeAnalytics ? `${bridgeAnalytics.withdrawalSuccessRate}%` : '—'}
              icon={CheckCircle}
              badge="Confirmed"
            />
          </>
        )}
      </div>

      <div className="card">
        <div className="flex flex-col gap-4 mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-white font-medium text-[15.8px] leading-[24px]">All Withdrawals</h2>
              <p className="text-text-secondary text-sm">
                {isLoading
                  ? 'Loading…'
                  : data
                    ? `Showing ${sortedWithdrawals.length} of ${data.pagination.total.toLocaleString()}`
                    : '—'}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex items-center gap-2">
                <span className="text-text-secondary text-sm">Status:</span>
                <div className="flex items-center gap-1">
                  {(['all', 'pending', 'confirmed'] as const).map((status) => (
                    <button
                      key={status}
                      onClick={() => {
                        setStatusFilter(status);
                        setPage(1);
                      }}
                      className={clsx(
                        'px-3 py-1.5 rounded-[7px] text-sm font-medium transition-colors',
                        statusFilter === status
                          ? 'bg-primary/20 text-primary-light border border-primary/30'
                          : 'bg-background-tertiary/30 text-text-secondary hover:text-white border border-transparent'
                      )}
                    >
                      {status === 'all' ? 'All' : status === 'pending' ? 'Pending' : 'Confirmed'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  type="text"
                  placeholder="Search by Twilight or BTC address..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1);
                  }}
                  className="pl-9 pr-4 py-2 bg-background-tertiary/50 border border-card-border rounded-[7px] text-white text-sm placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-primary/50 w-full sm:w-72"
                />
              </div>
            </div>
          </div>
        </div>

        {isLoading ? (
          <LoadingTable rows={10} />
        ) : sortedWithdrawals.length ? (
          <>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th><SortHeader field="id">ID</SortHeader></th>
                    <th>Twilight Address</th>
                    <th>BTC Address</th>
                    <th>Status</th>
                    <th><SortHeader field="amount">Amount</SortHeader></th>
                    <th>Reserve ID</th>
                    <th><SortHeader field="blockHeight">Block</SortHeader></th>
                    <th><SortHeader field="createdAt">Time</SortHeader></th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {sortedWithdrawals.map((withdrawal) => (
                    <tr key={withdrawal.id} className="hover:bg-background-tertiary transition-colors">
                      <td className="font-medium font-mono">#{withdrawal.withdrawIdentifier}</td>
                      <td>
                        <div className="flex items-center gap-1">
                          <Link
                            href={`/accounts/${withdrawal.twilightAddress}`}
                            className="font-mono text-sm text-primary-light hover:text-primary"
                          >
                            {short(withdrawal.twilightAddress)}
                          </Link>
                          <CopyButton text={withdrawal.twilightAddress} />
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-1">
                          <a
                            href={`https://mempool.space/address/${withdrawal.withdrawAddress}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 font-mono text-sm text-accent-yellow hover:underline"
                          >
                            {short(withdrawal.withdrawAddress)}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                          <CopyButton text={withdrawal.withdrawAddress} />
                        </div>
                      </td>
                      <td>
                        {withdrawal.isConfirmed ? (
                          <span className="badge badge-success flex items-center gap-1 w-fit">
                            <CheckCircle className="w-3 h-3" />
                            Confirmed
                          </span>
                        ) : (
                          <span className="badge badge-warning flex items-center gap-1 w-fit">
                            <XCircle className="w-3 h-3" />
                            Pending
                          </span>
                        )}
                      </td>
                      <td>
                        <span className="text-accent-red font-medium">
                          {formatSatoshis(withdrawal.withdrawAmount)}
                        </span>
                      </td>
                      <td className="text-text-secondary font-mono text-sm">
                        #{withdrawal.withdrawReserveId}
                      </td>
                      <td>
                        <Link
                          href={`/blocks/${withdrawal.blockHeight}`}
                          className="text-text-secondary hover:text-primary-light font-mono text-sm"
                        >
                          #{withdrawal.blockHeight.toLocaleString()}
                        </Link>
                      </td>
                      <td>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-text-secondary text-sm" title={format(new Date(withdrawal.createdAt), 'PPpp')}>
                            {formatDistanceToNow(new Date(withdrawal.createdAt), { addSuffix: true })}
                          </span>
                          <span className="text-text-muted text-xs">
                            {format(new Date(withdrawal.createdAt), 'MMM d, yyyy')}
                          </span>
                        </div>
                      </td>
                      <td>
                        <Link
                          href={`/withdrawals/${withdrawal.id}`}
                          className="text-primary-light hover:text-primary text-sm font-medium"
                        >
                          View →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {data && data.pagination.totalPages > 1 && (
              <div className="mt-4">
                <Pagination
                  currentPage={page}
                  totalPages={data.pagination.totalPages}
                  onPageChange={setPage}
                />
              </div>
            )}
          </>
        ) : (
          <div className="text-center text-text-secondary py-10">No withdrawals found</div>
        )}
      </div>
    </div>
  );
}
