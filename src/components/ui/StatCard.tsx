import clsx from 'clsx';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  change?: number;
  changeLabel?: string;
  icon?: React.ReactNode;
  iconBg?: string;
  valueColor?: string;
}

export function StatCard({
  title,
  value,
  subtitle,
  change,
  changeLabel,
  icon,
  iconBg = 'bg-blue-100',
  valueColor,
}: StatCardProps) {
  const isPositive = (change ?? 0) >= 0;
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{title}</p>
          <p className={clsx('text-2xl font-bold mt-1 leading-tight', valueColor ?? 'text-slate-900')}>
            {value}
          </p>
          {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
          {change !== undefined && (
            <div className={clsx('flex items-center gap-1 mt-2 text-xs font-medium', isPositive ? 'text-emerald-600' : 'text-red-600')}>
              {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              <span>{isPositive ? '+' : ''}{change.toFixed(1)}% {changeLabel ?? 'vs last month'}</span>
            </div>
          )}
        </div>
        {icon && (
          <div className={clsx('rounded-lg p-2.5 flex-shrink-0', iconBg)}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
