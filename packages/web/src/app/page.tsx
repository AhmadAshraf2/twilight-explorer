'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  Blocks,
  ArrowRightLeft,
  Users,
  Activity,
  Wallet,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { StatsCard } from '@/components/StatsCard';
import { BlockCard } from '@/components/BlockCard';
import { TxCard } from '@/components/TxCard';
import { Loading, LoadingCard } from '@/components/Loading';
import { SearchBar } from '@/components/SearchBar';
import { getStats, getModuleStats, getBlocks, getRecentTransactions } from '@/lib/api';
import { HeroPanel } from '@/components/dashboard/HeroPanel';
//import { InfoFooter } from '@/components/dashboard/InfoFooter';

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
    <>
      <div className="grain-overlay" />

      <div className="space-y-8">
        {/* Hero */}
        <HeroPanel stats={stats} moduleStats={moduleStats} />

        {/* Primary Search (explorer high point) */}
        <section className="card card-hover rounded-[10.5px] p-4 sm:p-5 bg-card/50 backdrop-blur-[2px]">
          <SearchBar size="lg" />
        </section>

        {/* Stats rows (reference-style rhythm) */}
        <section className="space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
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
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-medium text-[15.8px] leading-[24px]">Recent Blocks</h2>
              <Link
                href="/blocks"
                className="text-[10.5px] leading-[14px] text-primary hover:text-primary-light transition-colors"
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
                blocksData.data.map((block) => <BlockCard key={block.height} block={block} />)
              ) : (
                <div className="card text-center text-text-secondary py-8">No blocks found</div>
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-medium text-[15.8px] leading-[24px]">Recent Transactions</h2>
              <Link
                href="/txs"
                className="text-[10.5px] leading-[14px] text-primary hover:text-primary-light transition-colors"
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
                <div className="card text-center text-text-secondary py-8">No transactions found</div>
              )}
            </div>
          </div>
        </section>

        {/*<InfoFooter />*/}
      </div>
    </>
  );
}
