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
    <div className="card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-text-secondary text-sm">{title}</p>
          <p className="text-2xl font-bold text-white mt-1">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          {subtitle && (
            <p className="text-text-muted text-xs mt-1">{subtitle}</p>
          )}
          {change && (
            <p
              className={clsx(
                'text-xs mt-2',
                changeType === 'positive' && 'text-accent-green',
                changeType === 'negative' && 'text-accent-red',
                changeType === 'neutral' && 'text-text-secondary'
              )}
            >
              {change}
            </p>
          )}
        </div>
        <div className="p-3 bg-primary/20 rounded-lg">
          <Icon className="w-6 h-6 text-primary-light" />
        </div>
      </div>
    </div>
  );
}
