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
    <div className="card card-hover rounded-[10.5px] p-[18.5px] bg-card/50 backdrop-blur-[2px]">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-text-secondary text-[12.3px] leading-[18px] uppercase tracking-[0.613px]">
            {title}
          </p>
          <p className="mt-[3px] font-mono font-bold text-[21px] leading-[28px] tracking-[-0.525px] text-white">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          {subtitle && (
            <p className="text-text-muted text-xs mt-1 truncate">{subtitle}</p>
          )}
          {change && (
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

        <div className="w-[34px] h-[34px] rounded-[7px] bg-background-tertiary/30 border border-card-border flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5 text-primary-light" />
        </div>
      </div>
    </div>
  );
}
