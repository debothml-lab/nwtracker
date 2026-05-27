import clsx from 'clsx';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'blue' | 'purple' | 'cyan' | 'amber' | 'green' | 'red' | 'gray' | 'orange';
  size?: 'sm' | 'md';
  className?: string;
}

const variants = {
  blue: 'bg-blue-100 text-blue-800',
  purple: 'bg-purple-100 text-purple-800',
  cyan: 'bg-cyan-100 text-cyan-800',
  amber: 'bg-amber-100 text-amber-800',
  green: 'bg-emerald-100 text-emerald-800',
  red: 'bg-red-100 text-red-800',
  gray: 'bg-slate-100 text-slate-700',
  orange: 'bg-orange-100 text-orange-800',
};

export function Badge({ children, variant = 'gray', size = 'sm', className }: BadgeProps) {
  return (
    <span className={clsx(
      'inline-flex items-center font-medium rounded-full',
      size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm',
      variants[variant],
      className
    )}>
      {children}
    </span>
  );
}

export function entityTypeBadge(type: string) {
  const map: Record<string, { label: string; variant: BadgeProps['variant'] }> = {
    personal: { label: 'Personal', variant: 'blue' },
    llc: { label: 'LLC', variant: 'purple' },
    business: { label: 'Business', variant: 'amber' },
    rental_property: { label: 'Rental', variant: 'green' },
  };
  const { label, variant } = map[type] ?? { label: type, variant: 'gray' };
  return <Badge variant={variant}>{label}</Badge>;
}

export function severityBadge(severity: string) {
  const map: Record<string, BadgeProps['variant']> = {
    info: 'blue',
    warning: 'amber',
    critical: 'red',
  };
  return <Badge variant={map[severity] ?? 'gray'}>{severity}</Badge>;
}
