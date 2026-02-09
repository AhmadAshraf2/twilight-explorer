import { LucideIcon } from 'lucide-react';
import clsx from 'clsx';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  subtitle?: string;
}

export function StatsCard({
  title,
  value,
  icon: Icon,
  change,
  changeType = 'neutral',
  subtitle,
}: StatsCardProps) {
  return (
    <div className="card card-hover rounded-[10.5px] p-[18.5px] bg-card/50 backdrop-blur-[2px] relative overflow-hidden">
      {/* Subtle accent wash (no nested card) */}
      <div className="absolute inset-0 bg-gradient-hero opacity-[0.08] pointer-events-none" />

      <div className="relative">
        {/* Top row: Icon + (optional) badge */}
        <div className="flex items-start justify-between mb-[14px]">
          <div className="w-[34px] h-[34px] rounded-[7px] bg-background-tertiary/30 border border-card-border flex items-center justify-center shrink-0">
            <Icon className="w-5 h-5 text-primary-light" />
          </div>

          {/* Optional badge (use when `change` is short; otherwise omit) */}
          {change && change.length <= 12 && (
            <span
              className={clsx(
                'rounded-[3.5px] px-[7px] py-[3.5px] font-mono text-[10.5px] leading-[14px]',
                changeType === 'positive' && 'bg-accent-green/10 text-accent-green',
                changeType === 'negative' && 'bg-accent-red/10 text-accent-red',
                changeType === 'neutral' && 'bg-white/5 text-text-secondary'
              )}
            >
              {change}
            </span>
          )}
        </div>

        {/* Label */}
        <p className="text-text-secondary text-[12.3px] leading-[18px] uppercase tracking-[0.613px]">
          {title}
        </p>

        {/* Value */}
        <p className="mt-[3px] font-mono font-bold text-[21px] leading-[28px] tracking-[-0.525px] text-white">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </p>

        {/* Supporting lines */}
        {subtitle && <p className="text-text-muted text-xs mt-1 truncate">{subtitle}</p>}

        {/* If `change` is long, keep it as the bottom line (like before) */}
        {change && change.length > 12 && (
          <p
            className={clsx(
              'text-[10.5px] leading-[14px] mt-2 font-mono',
              changeType === 'positive' && 'text-accent-green',
              changeType === 'negative' && 'text-accent-red',
              changeType === 'neutral' && 'text-text-secondary'
            )}
          >
            {change}
          </p>
        )}
      </div>
    </div>
  );
}
