'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import {
  Blocks,
  ArrowRightLeft,
  Users,
  Activity,
  Wallet,
  ShieldCheck,
  Zap,
  Clock,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { StatsCard } from '@/components/StatsCard';
import { LoadingCard, LoadingTable } from '@/components/Loading';
import { SearchBar } from '@/components/SearchBar';
import { getStats, getModuleStats, getBlocks, getRecentTransactions } from '@/lib/api';
import { HeroPanel } from '@/components/dashboard/HeroPanel';
//import { InfoFooter } from '@/components/dashboard/InfoFooter';
function formatAgeShort(ts: string) {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(ts).getTime()) / 1000));
  if (seconds < 60) return '<1m';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}
export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['stats'],
    queryFn: getStats,
  });

  const { data: moduleStats, isLoading: moduleStatsLoading } = useQuery({
    queryKey: ['moduleStats'],
    queryFn: getModuleStats,
  });

  const { data: blocksData, isLoading: blocksLoading } = useQuery({
    queryKey: ['blocks', 1, 8],
    queryFn: () => getBlocks(1, 8),
  });

  const { data: transactions, isLoading: txsLoading } = useQuery({
    queryKey: ['recentTxs'],
    queryFn: () => getRecentTransactions(8),
  });

  const recentBlocks = blocksData?.data?.slice(0, 8) ?? [];
  const recentTxs = transactions?.slice(0, 8) ?? [];

  return (
    <>
      {/*<div className="grain-overlay" />*/}

      <div className="space-y-8">
        {/* Hero */}
        <HeroPanel stats={stats} moduleStats={moduleStats} />

        {/* Primary Search (explorer high point) */}
        <section className="card card-hover rounded-[14px] p-5 sm:p-6 bg-card border border-primary/20 shadow-glow">
          <SearchBar size="lg" />
        </section>

        {/* Stats rows (reference-style rhythm) */}
        <section className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {statsLoading ? (
              <>
                <LoadingCard />
                <LoadingCard />
                <LoadingCard />
                <LoadingCard />
              </>
            ) : (
              <>
                <StatsCard
                  title="Total Blocks"
                  value={stats?.totalBlocks || 0}
                  icon={Blocks}
                  subtitle={stats?.latestBlock ? `Latest: #${stats.latestBlock.height}` : undefined}
                />
                <StatsCard
                  title="Total Transactions"
                  value={stats?.totalTransactions || 0}
                  icon={ArrowRightLeft}
                  change={`${stats?.transactionsLast24h || 0} in last 24h`}
                  changeType="positive"
                />
                <StatsCard title="Total Accounts" value={stats?.totalAccounts || 0} icon={Users} />
                <StatsCard
                  title="Success Rate"
                  value={
                    stats?.transactionsByStatus
                      ? `${(((stats.transactionsByStatus.success || 0) / (stats.totalTransactions || 1)) * 100).toFixed(1)}%`
                      : '0%'
                  }
                  icon={Activity}
                />
              </>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {moduleStatsLoading ? (
              <>
                <LoadingCard />
                <LoadingCard />
                <LoadingCard />
                <LoadingCard />
              </>
            ) : (
              <>
                <StatsCard title="BTC Deposits" value={moduleStats?.bridge.deposits || 0} icon={Wallet} />
                <StatsCard
                  title="BTC Withdrawals"
                  value={moduleStats?.bridge.withdrawals || 0}
                  icon={Wallet}
                />
                <StatsCard
                  title="Active Fragments"
                  value={moduleStats?.volt.activeFragments || 0}
                  icon={ShieldCheck}
                />
                <StatsCard title="zkOS Transfers" value={moduleStats?.zkos.transfers || 0} icon={Zap} />
              </>
            )}
          </div>
        </section>

        {/* Secondary row: recent blocks + recent tx cards (kept as explorer equivalent) */}
        <section className="space-y-6">
          {/* Recent Blocks */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-medium text-[15.8px] leading-[24px]">Recent Blocks</h2>
              <Link href="/blocks" className={"text-[12.5px] leading-[18px] font-medium text-primary-light hover:text-primary transition-colors"}>
                View All
              </Link>
            </div>

            {blocksLoading ? (
              <LoadingTable rows={3} />
            ) : recentBlocks.length ? (
              <div className="table-container">
                <table>
                  <thead>
  <tr>
    <th>Height</th>
    <th>Txns</th>
    <th>Proposer</th>
    <th>Hash</th>
    <th>Age</th>
  </tr>
</thead>
<tbody>
  {recentBlocks.map((block) => (
    <tr key={block.height}>
      <td>
        <Link href={`/blocks/${block.height}`} className="font-medium">
          #{block.height.toLocaleString()}
        </Link>
      </td>
      <td>
        <span className="badge badge-info">{block.txCount}</span>
      </td>
      <td className="text-text-secondary font-mono text-sm">
        {block.proposer ? `${block.proposer.substring(0, 10)}…${block.proposer.substring(block.proposer.length - 6)}` : '—'}
      </td>
      <td className="text-text-secondary font-mono text-sm">
        {block.hash.substring(0, 10)}…{block.hash.substring(block.hash.length - 6)}
      </td>
      <td>
        <div className="flex items-center gap-1 text-text-secondary text-sm">
          <Clock className="w-3 h-3" />
          {formatDistanceToNow(new Date(block.timestamp), { addSuffix: true })}
        </div>
      </td>
    </tr>
  ))}
</tbody>
                </table>
              </div>
            ) : (
              <div className="text-center text-text-secondary py-8">No blocks found</div>
            )}
          </div>

          {/* Recent Transactions */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-medium text-[15.8px] leading-[24px]">Recent Transactions</h2>
              <Link href="/txs" className="text-[12.5px] leading-[18px] font-medium text-primary-light hover:text-primary transition-colors">
                View All
              </Link>
            </div>

            {txsLoading ? (
              <LoadingTable rows={3} />
            ) : recentTxs.length ? (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Hash</th>
                      <th>Type</th>
                      <th>Status</th>
                      <th>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentTxs.map((tx) => (
                      <tr key={tx.hash}>
                        <td>
                          <Link href={`/txs/${tx.hash}`} className="font-mono text-sm">
                            {tx.hash.substring(0, 12)}...{tx.hash.substring(tx.hash.length - 6)}
                          </Link>
                        </td>
                        <td>
                          <span className="badge badge-primary">
                            {tx.type.split('.').pop()?.replace('Msg', '')}
                          </span>
                        </td>
                        <td>
                          <span className={tx.status === 'success' ? 'badge badge-success' : 'badge badge-error'}>
                            {tx.status === 'success' ? (
                              <CheckCircle className="w-3 h-3" />
                            ) : (
                              <XCircle className="w-3 h-3" />
                            )}
                            {tx.status}
                          </span>
                        </td>
                        <td>
                          <div className="flex items-center gap-1 text-text-secondary text-sm">
                            <Clock className="w-3 h-3" />
                            {formatDistanceToNow(new Date(tx.blockTime), { addSuffix: true })}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center text-text-secondary py-8">No transactions found</div>
            )}
          </div>
        </section>

        {/*<InfoFooter />*/}
      </div>
    </>
  );
}
