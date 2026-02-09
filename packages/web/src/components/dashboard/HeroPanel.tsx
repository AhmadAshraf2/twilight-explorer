import { ShieldCheck, Zap, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { Stats, ModuleStats } from '@/lib/api';

export function HeroPanel({
  stats,
  moduleStats,
}: {
  stats?: Stats;
  moduleStats?: ModuleStats;
}) {
  const latest = stats?.latestBlock;
  const formatUpdated = (ts?: string) => {
  if (!ts) return '—';
  const text = formatDistanceToNow(new Date(ts), { addSuffix: true });
  return text.startsWith('less than a minute') ? '< 1 min ago' : text;
};
  return (
    <section
      className="relative overflow-hidden rounded-[14px] border border-card-border shadow-card"
      style={{
        background: '#0E0E10', // reference hero base
      }}
    >
      {/* ============ BACKGROUND LAYERS (match reference) ============ */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Orange gradients (layer 1) */}
        <img
          src="/orange_gradients.svg"
          alt=""
          aria-hidden="true"
          className="absolute pointer-events-none"
          style={{
            width: '820px',
            height: '145%',
            right: '-30px',
            top: '-8%',
            opacity: 0.92,
            objectFit: 'cover',
            filter: 'saturate(1.12) brightness(1.02) blur(2.25px)',
            transform: 'scaleY(1.08)',
          }}
        />

        {/* Orange gradients (layer 2) */}
        <img
          src="/orange_gradients.svg"
          alt=""
          aria-hidden="true"
          className="absolute pointer-events-none"
          style={{
            width: '780px',
            height: '135%',
            right: '-18px',
            top: '-26%',
            opacity: 0.68,
            objectFit: 'cover',
            filter: 'blur(0.75px)',
            transform: 'scaleY(1.04)',
          }}
        />

        {/* Fade slab from left (this is the “pattern” you’re noticing) */}
        <div
          className="absolute pointer-events-none"
          style={{
            width: '500px',
            height: '150%',
            right: '380px',
            top: '-25%',
            background:
              'linear-gradient(90deg, #0E0E10 0%, #0E0E10 35%, rgba(14, 14, 16, 0) 100%)',
          }}
        />

        {/* Hero-only grain */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            opacity: 0.06,
            mixBlendMode: 'overlay',
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")",
          }}
        />
      </div>

      {/* ============ CONTENT (smaller + reference type metrics) ============ */}
      <div className="relative z-10 px-6 py-3 sm:px-8 sm:py-4">
        <div className="grid grid-cols-1 lg:grid-cols-[1.25fr_0.75fr] gap-6 lg:gap-8 items-end">
          {/* Left */}
          <div style={{ maxWidth: '588px' }}>
            {/* Badge (keep) */}
            <div className="inline-flex items-center gap-2 pl-[10px] pr-[14px] py-[5px] rounded-full border border-accent-green/20 bg-accent-green/10">
              <span className="w-[5.25px] h-[5.25px] rounded-full bg-accent-green pulse-dot" />
              <span className="font-mono font-medium text-[10.5px] leading-[14px] tracking-[0.263px] uppercase text-white">
                Explorer Live
              </span>
            </div> 
            {/* Headline: lighter + tighter like reference */}
            <h1
              style={{
                fontFamily: 'var(--font-serif)',
                fontWeight: 400,
                fontSize: '44px',
                lineHeight: '48px',
                letterSpacing: '-1.05px',
                color: '#FFFFFF',
                marginTop: '14px',
                transform: 'scaleX(0.85)',
                transformOrigin: 'left',
              }}
            >
              Twilight Explorer
            </h1>
              
            {/* Subtitle */}
            <p
              style={{
                fontFamily: 'var(--font-sans)',
                fontWeight: 400,
                fontSize: '15.8px',
                lineHeight: '26px',
                color: 'rgb(var(--text-secondary))',
                marginTop: '10px',
              }}
            >
              Search blocks, transactions, and shielded operations with real-time indexing.
            </p>

            {/* Chips */}
            <div className="mt-2 flex flex-wrap gap-[10px]">
              <span className="inline-flex items-center gap-2 px-[12px] py-[7px] rounded-[3.5px] bg-black/40 border border-card-border text-[12.3px] leading-[18px] text-text-secondary">
                <ShieldCheck className="w-4 h-4 text-accent-green" />
                Live indexing
              </span>
              <span className="inline-flex items-center gap-2 px-[12px] py-[7px] rounded-[3.5px] bg-black/40 border border-card-border text-[12.3px] leading-[18px] text-text-secondary">
                <Zap className="w-4 h-4 text-primary" />
                Shielded transactions decoded
              </span>
            </div>
          </div>
           {/* Right module (keep what you already liked) */}
          <div className="justify-self-start lg:justify-self-end w-full lg:w-[280px]">
  <div className="bg-black/60 backdrop-blur-[4px] border border-card-border/60 rounded-[10.5px] px-6 py-5">
    <div className="flex items-center justify-between gap-2 text-[15.3px] leading-[20px] text-white">
      <span>Network status</span>
      <span className="font-mono font-medium text-[10.5px] leading-[14px] tracking-[0.263px] uppercase text-accent-green">
        Streaming
      </span>
    </div>

    <div className="mt-3 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[10.5px] leading-[14px] uppercase tracking-wider text-white/70">
          Latest block
        </span>
        <span className="font-mono text-white text-[12.3px] leading-[18px]">
          {latest?.height ? `#${latest.height.toLocaleString()}` : '—'}
        </span>
      </div>

      <div className="flex items-center justify-between gap-3">
        <span className="text-[10.5px] leading-[14px] uppercase tracking-wider text-white/70">
          Updated
        </span>
        <span className="font-mono text-white text-[12.3px] leading-[18px]">
          {formatUpdated(latest?.timestamp)}
        </span>
      </div>
    </div>
  </div>
</div>

          {/* end right module */}
        </div>
      </div>
    </section>
  );
}