export function fmtCurrency(amount: number, compact = false): string {
  if (compact && Math.abs(amount) >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(2)}M`;
  }
  if (compact && Math.abs(amount) >= 1_000) {
    return `$${(amount / 1_000).toFixed(1)}K`;
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function fmtCurrencyFull(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function fmtPercent(value: number, decimals = 2): string {
  return `${value.toFixed(decimals)}%`;
}

export function fmtDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function fmtDateShort(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function fmtMonthYear(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

export function fmtFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function fmtOrdinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export function colorForAmount(amount: number, reverse = false): string {
  const positive = reverse ? amount < 0 : amount >= 0;
  return positive ? 'text-emerald-600' : 'text-red-600';
}

export function entityTypeLabel(type: string): string {
  const map: Record<string, string> = {
    personal: 'Personal',
    llc: 'LLC',
    business: 'Business',
    rental_property: 'Rental Property',
  };
  return map[type] ?? type;
}

export function frequencyLabel(freq: string): string {
  const map: Record<string, string> = {
    weekly: 'Weekly',
    biweekly: 'Bi-weekly',
    'semi-monthly': 'Semi-monthly',
    monthly: 'Monthly',
    quarterly: 'Quarterly',
    'semi-annual': 'Semi-annual',
    annual: 'Annual',
    'one-time': 'One-time',
  };
  return map[freq] ?? freq;
}

export function monthlyEquivalent(amount: number, frequency: string): number {
  const map: Record<string, number> = {
    weekly: (amount * 52) / 12,
    biweekly: (amount * 26) / 12,
    'semi-monthly': amount * 2,
    monthly: amount,
    quarterly: amount / 3,
    'semi-annual': amount / 6,
    annual: amount / 12,
    'one-time': 0,
  };
  return map[frequency] ?? amount;
}

export function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

export function addMonths(dateStr: string, n: number): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setMonth(d.getMonth() + n);
  return d.toISOString().split('T')[0];
}

export function isoMonths(startISO: string, count: number): string[] {
  return Array.from({ length: count }, (_, i) => addMonths(startISO, i));
}
