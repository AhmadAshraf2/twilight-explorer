import { LucideIcon, Info } from 'lucide-react';
import clsx from 'clsx';
import Link from 'next/link';
import { Tooltip } from './Tooltip';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  badge?: string; // Badge in top-right (reference style - always green)
  href?: string; // Make card clickable
  tooltip?: string; // Tooltip text (shows info icon next to title)
}

export function StatsCard({
  title,
  value,
  icon: Icon,
  change,
  changeType = 'neutral',
  badge,
  href,
  tooltip,
}: StatsCardProps) {
  const cardContent = (
    <div className={clsx(
      'card rounded-[10.5px] p-[18.5px] bg-card/50 backdrop-blur-[2px] relative overflow-hidden',
      href && 'card-hover cursor-pointer'
    )}>
      {/* Subtle accent wash */}
      <div className="absolute inset-0 bg-gradient-hero opacity-[0.08] pointer-events-none" />

      <div className="relative">
        {/* Top row: Icon + Badge (reference style) */}
        <div className="flex items-start justify-between mb-[14px]">
          <div className="w-[34px] h-[34px] rounded-[7px] bg-background-tertiary/30 border border-card-border flex items-center justify-center shrink-0">
            <Icon className="w-5 h-5 text-primary-light" />
          </div>

          {/* Badge in top-right (reference style - consistent green color) */}
          {badge && (
            <span
              className="rounded-[3.5px] px-[7px] py-[3.5px] font-mono text-[10.5px] leading-[14px] bg-accent-green/10 text-accent-green"
            >
              {badge}
            </span>
          )}

          {/* Fallback: show change as badge if no badge provided and change is short */}
          {!badge && change && change.length <= 12 && (
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

        {/* Label with optional tooltip */}
        <div className="flex items-center gap-1.5">
          <p className="text-text-secondary text-[12.3px] leading-[18px] uppercase tracking-[0.613px]">
            {title}
          </p>
          {tooltip && (
            <Tooltip content={tooltip}>
              <Info className="w-3.5 h-3.5 text-text-secondary hover:text-text-primary transition-colors" />
            </Tooltip>
          )}
        </div>

        {/* Value */}
        <p className="mt-[3px] font-mono font-bold text-[21px] leading-[28px] tracking-[-0.525px] text-white">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </p>

        {/* Long change text below value (if no badge and change is long) - with consistent spacing */}
        {!badge && change && change.length > 12 ? (
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
        ) : (
          <div className="h-[18px] mt-2" />
        )}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {cardContent}
      </Link>
    );
  }

  return cardContent;
}
