import { ShieldCheck, Zap } from 'lucide-react';
import type { Stats, ModuleStats } from '@/lib/api';

export function HeroPanel({
  stats,
  moduleStats,
}: {
  stats?: Stats;
  moduleStats?: ModuleStats;
}) {
  return (
    <section className="relative overflow-hidden rounded-[14px] border border-card-border bg-card-hover shadow-card">
      {/* Background layers */}
      <div className="absolute inset-0">
        {/* Energy bloom (right side) - layered for the reference look */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse at 72% 48%, rgba(217, 126, 72, 0.72) 0%, rgba(232, 158, 40, 0.46) 32%, rgba(63, 29, 29, 0.22) 52%, rgba(5, 5, 5, 0) 72%)',
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse at 80% 40%, rgba(232, 158, 40, 0.34) 0%, rgba(246, 180, 108, 0.22) 35%, rgba(5, 5, 5, 0) 68%)',
            filter: 'blur(2px)',
            opacity: 0.9,
          }}
        />
        {/* Fade to left */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(90deg, rgba(14, 14, 16, 0.92) 0%, rgba(14, 14, 16, 0.88) 44%, rgba(14, 14, 16, 0.22) 66%, rgba(14, 14, 16, 0) 80%)',
          }}
        />
        <div className="bg-noise" />
      </div>

      {/* Content */}
      <div className="relative z-10 p-[24px] sm:p-[32px] flex flex-col gap-6">
        {/* Left */}
        <div className="max-w-[588px]">
          {/* Live badge */}
          <div className="inline-flex items-center gap-2 px-[14px] py-[5px] rounded-full border border-accent-green/20 bg-accent-green/10">
            <span className="w-[7px] h-[7px] rounded-full bg-accent-green pulse-dot" />
            <span className="text-white text-[12.3px] leading-[18px] uppercase tracking-[0.306px] font-bold">
              Explorer Live
            </span>
            <span className="text-text-muted">|</span>
            <span className="font-mono text-[10.5px] leading-[14px] tracking-[0.263px] uppercase text-accent-green">
              Streaming
            </span>
          </div>

          <h1 className="mt-[14px] font-display text-[42px] leading-[42px] tracking-[-1.05px] text-white">
            Twilight Explorer
          </h1>

          <div className="mt-[17px] space-y-1">
            <p className="text-text-secondary text-[15.8px] leading-[26px]">
              Explore blocks, transactions, and zkOS operations on Twilight.
            </p>
            <p className="text-text-secondary text-[15.8px] leading-[26px]">
              Fast lookup, real-time updates, and rich message decoding.
            </p>
          </div>

          {/* Feature chips */}
          <div className="mt-[22px] flex flex-wrap gap-[14px]">
            <span className="inline-flex items-center gap-2 px-[12px] py-[7px] rounded-[3.5px] bg-black/40 border border-card-border text-[12.3px] leading-[18px] text-text-secondary">
              <ShieldCheck className="w-4 h-4 text-accent-green" />
              Live indexing
            </span>
            <span className="inline-flex items-center gap-2 px-[12px] py-[7px] rounded-[3.5px] bg-black/40 border border-card-border text-[12.3px] leading-[18px] text-text-secondary">
              <Zap className="w-4 h-4 text-primary" />
              zkOS decoded
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

