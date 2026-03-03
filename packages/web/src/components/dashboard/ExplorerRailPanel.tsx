import Link from 'next/link';
import { Activity, Blocks, ArrowRightLeft, Users } from 'lucide-react';
import type { Stats, ModuleStats } from '@/lib/api';

export function ExplorerRailPanel({
  stats,
  moduleStats,
}: {
  stats?: Stats;
  moduleStats?: ModuleStats;
}) {
  const totalTxs = stats?.totalTransactions ?? 0;
  const success = stats?.transactionsByStatus?.success ?? 0;
  const successRate = totalTxs > 0 ? (success / totalTxs) * 100 : 0;

  return (
    <section className="card p-0 overflow-hidden">
      {/* Header */}
      <div className="bg-background-tertiary/40 px-3 py-3 border-b border-card-border">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-[7px] h-[7px] rounded-full bg-accent-green pulse-dot" />
            <span className="text-white text-[12.3px] leading-[18px] uppercase tracking-[0.306px] font-bold">
              Explorer Live
            </span>
          </div>
          <Link
            href="/txs"
            className="text-[10.5px] leading-[14px] text-primary hover:text-primary-light transition-colors"
          >
            View Txs
          </Link>
        </div>

        <div className="mt-2 flex items-center gap-2 text-[10.5px] leading-[14px] text-text-secondary">
          <span className="inline-flex items-center gap-2 px-2 py-1 rounded-[3.5px] bg-accent-green/10 border border-accent-green/20 text-accent-green">
            <Activity className="w-3 h-3" />
            Streaming
          </span>
          <span className="text-text-muted">|</span>
          <span>Continuous Updates</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-[14px]">
        {/* Stats box */}
        <div className="bg-black/30 border border-card-border rounded-[7px] p-3 grid grid-cols-3 gap-0">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1 text-text-secondary">
              <Blocks className="w-3 h-3 opacity-80" />
              <span className="text-[10px] leading-[15px] tracking-[0.5px] uppercase">Blocks</span>
            </div>
            <span className="font-mono text-[12.3px] leading-[18px] text-white">
              {(stats?.totalBlocks ?? 0).toLocaleString()}
            </span>
          </div>

          <div className="flex flex-col gap-1 border-l border-card-border/50 pl-[15px]">
            <div className="flex items-center gap-1 text-text-secondary">
              <ArrowRightLeft className="w-3 h-3 opacity-80" />
              <span className="text-[10px] leading-[15px] tracking-[0.5px] uppercase">Txs</span>
            </div>
            <span className="font-mono text-[12.3px] leading-[18px] text-white">
              {totalTxs.toLocaleString()}
            </span>
          </div>

          <div className="flex flex-col gap-1 border-l border-card-border/50 pl-[15px]">
            <div className="flex items-center gap-1 text-text-secondary">
              <Users className="w-3 h-3 opacity-80" />
              <span className="text-[10px] leading-[15px] tracking-[0.5px] uppercase">Accounts</span>
            </div>
            <span className="font-mono text-[12.3px] leading-[18px] text-primary-light">
              {(stats?.totalAccounts ?? 0).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Secondary metrics */}
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div className="bg-background-primary/30 rounded-[7px] border border-card-border/30 p-3">
            <p className="text-[10px] leading-[15px] uppercase tracking-[0.5px] text-text-secondary">
              Success Rate
            </p>
            <p className="mt-1 font-mono text-white text-[14px] leading-[20px]">
              {successRate.toFixed(1)}%
            </p>
          </div>
          <div className="bg-background-primary/30 rounded-[7px] border border-card-border/30 p-3">
            <p className="text-[10px] leading-[15px] uppercase tracking-[0.5px] text-text-secondary">
              zkOS Transfers
            </p>
            <p className="mt-1 font-mono text-white text-[14px] leading-[20px]">
              {(moduleStats?.zkos.transfers ?? 0).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3">
          <div className="bg-background-primary/30 rounded-[7px] border border-card-border/30 p-3">
            <p className="text-[10px] leading-[15px] uppercase tracking-[0.5px] text-text-secondary">
              BTC Deposits
            </p>
            <p className="mt-1 font-mono text-white text-[14px] leading-[20px]">
              {(moduleStats?.bridge.deposits ?? 0).toLocaleString()}
            </p>
          </div>
          <div className="bg-background-primary/30 rounded-[7px] border border-card-border/30 p-3">
            <p className="text-[10px] leading-[15px] uppercase tracking-[0.5px] text-text-secondary">
              Active Fragments
            </p>
            <p className="mt-1 font-mono text-white text-[14px] leading-[20px]">
              {(moduleStats?.volt.activeFragments ?? 0).toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

