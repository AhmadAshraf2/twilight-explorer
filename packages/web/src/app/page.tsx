'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  Blocks,
  ArrowRightLeft,
  Users,
  Activity,
  TrendingUp,
  Wallet,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { StatsCard } from '@/components/StatsCard';
import { BlockCard } from '@/components/BlockCard';
import { TxCard } from '@/components/TxCard';
import { Loading, LoadingCard } from '@/components/Loading';
import { getStats, getModuleStats, getBlocks, getRecentTransactions } from '@/lib/api';

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
    queryKey: ['blocks', 1, 5],
    queryFn: () => getBlocks(1, 5),
  });

  const { data: transactions, isLoading: txsLoading } = useQuery({
    queryKey: ['recentTxs'],
    queryFn: () => getRecentTransactions(5),
  });

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center py-8">
        <h1 className="text-4xl font-bold text-white mb-2">Twilight Explorer</h1>
        <p className="text-text-secondary">
          Explore blocks, transactions, and zkOS operations on Twilight
        </p>
        {stats?.latestBlock && (
          <div className="flex items-center justify-center gap-2 mt-4">
            <span className="w-2 h-2 bg-accent-green rounded-full pulse-dot"></span>
            <span className="text-text-secondary text-sm">
              Latest Block: #{stats.latestBlock.height.toLocaleString()}
            </span>
          </div>
        )}
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
            <StatsCard
              title="Total Accounts"
              value={stats?.totalAccounts || 0}
              icon={Users}
            />
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

      {/* Module Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {moduleStatsLoading ? (
          <>
            <LoadingCard />
            <LoadingCard />
            <LoadingCard />
            <LoadingCard />
          </>
        ) : (
          <>
            <StatsCard
              title="BTC Deposits"
              value={moduleStats?.bridge.deposits || 0}
              icon={Wallet}
              subtitle="Bridge Module"
            />
            <StatsCard
              title="BTC Withdrawals"
              value={moduleStats?.bridge.withdrawals || 0}
              icon={Wallet}
              subtitle="Bridge Module"
            />
            <StatsCard
              title="Active Fragments"
              value={moduleStats?.volt.activeFragments || 0}
              icon={ShieldCheck}
              subtitle="Volt Module"
            />
            <StatsCard
              title="zkOS Transfers"
              value={moduleStats?.zkos.transfers || 0}
              icon={Zap}
              subtitle="zkOS Module"
            />
          </>
        )}
      </div>

      {/* Recent Blocks and Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Blocks */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">Recent Blocks</h2>
            <Link
              href="/blocks"
              className="text-primary-light hover:text-primary text-sm"
            >
              View All
            </Link>
          </div>
          <div className="space-y-3">
            {blocksLoading ? (
              <>
                <LoadingCard />
                <LoadingCard />
                <LoadingCard />
              </>
            ) : blocksData?.data.length ? (
              blocksData.data.map((block) => (
                <BlockCard key={block.height} block={block} />
              ))
            ) : (
              <div className="card text-center text-text-secondary py-8">
                No blocks found
              </div>
            )}
          </div>
        </div>

        {/* Recent Transactions */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">Recent Transactions</h2>
            <Link
              href="/txs"
              className="text-primary-light hover:text-primary text-sm"
            >
              View All
            </Link>
          </div>
          <div className="space-y-3">
            {txsLoading ? (
              <>
                <LoadingCard />
                <LoadingCard />
                <LoadingCard />
              </>
            ) : transactions?.length ? (
              transactions.map((tx) => <TxCard key={tx.hash} tx={tx} />)
            ) : (
              <div className="card text-center text-text-secondary py-8">
                No transactions found
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
