import { useMemo } from 'react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
  TrendingUp, Wallet, CreditCard, DollarSign,
  AlertTriangle, ChevronRight, Clock, CheckCircle
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { StatCard } from '../components/ui/StatCard';
import { Card, CardHeader } from '../components/ui/Card';
import { Badge, severityBadge } from '../components/ui/Badge';
import {
  totalAssets, totalLiabilities, netWorth, monthlyIncome,
  monthlyBills, cashBalance, buildNetWorthHistory,
  buildCashFlowForecast, upcomingBills, categorizeTransactions
} from '../utils/calculations';
import { fmtCurrency, fmtMonthYear, fmtDate, fmtDateShort } from '../utils/formatters';
import { Link } from 'react-router-dom';
import clsx from 'clsx';

const ASSET_COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#06B6D4'];

export function Dashboard() {
  const { assets, liabilities, bills, incomeItems, transactions, alerts, entities, selectedEntityId } = useStore();

  const filteredAssets = selectedEntityId ? assets.filter((a) => a.entityId === selectedEntityId) : assets;
  const filteredLiabilities = selectedEntityId ? liabilities.filter((l) => l.entityId === selectedEntityId) : liabilities;
  const filteredBills = selectedEntityId ? bills.filter((b) => b.entityId === selectedEntityId) : bills;
  const filteredIncome = selectedEntityId ? incomeItems.filter((i) => i.entityId === selectedEntityId) : incomeItems;
  const filteredTxs = selectedEntityId ? transactions.filter((t) => t.entityId === selectedEntityId) : transactions;

  const nwHistory = useMemo(() => buildNetWorthHistory(filteredAssets, filteredLiabilities), [filteredAssets, filteredLiabilities]);
  const cashFlow = useMemo(() => buildCashFlowForecast(filteredAssets, filteredIncome, filteredBills, filteredLiabilities, 6), [filteredAssets, filteredIncome, filteredBills, filteredLiabilities]);
  const upcoming = useMemo(() => upcomingBills(filteredBills, 30).slice(0, 6), [filteredBills]);
  const recentTxs = useMemo(() => [...filteredTxs].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8), [filteredTxs]);
  const activeAlerts = useMemo(() => alerts.filter((a) => !a.dismissed).slice(0, 4), [alerts]);
  const unreviewedCount = filteredTxs.filter((t) => !t.reviewed).length;

  // Asset allocation by type
  const assetAllocation = useMemo(() => {
    const groups: Record<string, number> = {};
    for (const a of filteredAssets) {
      const label = a.type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      groups[label] = (groups[label] ?? 0) + a.value;
    }
    return Object.entries(groups).map(([name, value]) => ({ name, value }));
  }, [filteredAssets]);

  // Liability breakdown by type
  const liabilityBreakdown = useMemo(() => {
    const groups: Record<string, number> = {};
    for (const l of filteredLiabilities) {
      const label = l.type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      groups[label] = (groups[label] ?? 0) + l.balance;
    }
    return Object.entries(groups).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [filteredLiabilities]);

  // Category spending
  const catSpend = useMemo(() => {
    const data = categorizeTransactions(filteredTxs.filter((t) => {
      const d = new Date(t.date);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }));
    return Object.entries(data)
      .filter(([cat]) => cat !== 'Uncategorized' && cat !== 'Transfer' && cat !== 'Income')
      .sort(([, a], [, b]) => b - a)
      .slice(0, 6)
      .map(([name, value]) => ({ name, value }));
  }, [filteredTxs]);

  const totalNW = netWorth(filteredAssets, filteredLiabilities);
  const totalAss = totalAssets(filteredAssets);
  const totalLiab = totalLiabilities(filteredLiabilities);
  const cash = cashBalance(filteredAssets);
  const mIncome = monthlyIncome(filteredIncome);
  const mExpenses = monthlyBills(filteredBills);

  return (
    <div className="space-y-5 max-w-screen-2xl mx-auto">
      {/* Alert banner */}
      {activeAlerts.length > 0 && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <AlertTriangle size={18} className="text-amber-600 flex-shrink-0" />
          <span className="text-sm text-amber-800 font-medium">
            {activeAlerts.length} active alert{activeAlerts.length !== 1 ? 's' : ''} require attention
          </span>
          <Link to="/alerts" className="ml-auto text-sm text-amber-700 hover:text-amber-900 font-medium flex items-center gap-1">
            View all <ChevronRight size={14} />
          </Link>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Net Worth"
          value={fmtCurrency(totalNW, true)}
          subtitle={`Assets ${fmtCurrency(totalAss, true)} · Liabilities ${fmtCurrency(totalLiab, true)}`}
          change={2.4}
          icon={<TrendingUp size={20} className="text-blue-600" />}
          iconBg="bg-blue-50"
          valueColor={totalNW >= 0 ? 'text-slate-900' : 'text-red-600'}
        />
        <StatCard
          title="Cash Balance"
          value={fmtCurrency(cash, true)}
          subtitle="Across all checking & savings"
          change={1.2}
          icon={<Wallet size={20} className="text-emerald-600" />}
          iconBg="bg-emerald-50"
        />
        <StatCard
          title="Monthly Income"
          value={fmtCurrency(mIncome, true)}
          subtitle="All recurring sources"
          icon={<DollarSign size={20} className="text-purple-600" />}
          iconBg="bg-purple-50"
        />
        <StatCard
          title="Monthly Expenses"
          value={fmtCurrency(mExpenses, true)}
          subtitle="Bills & debt payments"
          icon={<CreditCard size={20} className="text-orange-600" />}
          iconBg="bg-orange-50"
          valueColor="text-red-700"
        />
      </div>

      {/* Net worth chart + asset allocation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-2" padding="md">
          <CardHeader
            title="Net Worth Trend"
            subtitle="12-month history"
            action={<Badge variant="green">↑ 2.4% MTM</Badge>}
          />
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={nwHistory} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="nwGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tickFormatter={(v) => fmtMonthYear(v)} tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
              <YAxis tickFormatter={(v) => fmtCurrency(v, true)} tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} width={70} />
              <Tooltip formatter={(v: number) => [fmtCurrency(v), '']} labelFormatter={(l) => fmtMonthYear(l)} contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
              <Area type="monotone" dataKey="netWorth" stroke="#3B82F6" strokeWidth={2.5} fill="url(#nwGrad)" name="Net Worth" />
              <Area type="monotone" dataKey="totalAssets" stroke="#10B981" strokeWidth={1.5} fill="none" name="Total Assets" strokeDasharray="4 2" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card padding="md">
          <CardHeader title="Asset Allocation" subtitle="By category" />
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={assetAllocation} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" paddingAngle={2}>
                {assetAllocation.map((_, i) => (
                  <Cell key={i} fill={ASSET_COLORS[i % ASSET_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => fmtCurrency(v, true)} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-2 space-y-1">
            {assetAllocation.slice(0, 5).map((item, i) => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: ASSET_COLORS[i % ASSET_COLORS.length] }} />
                  <span className="text-slate-600 truncate max-w-[110px]">{item.name}</span>
                </div>
                <span className="font-medium text-slate-900">{fmtCurrency(item.value, true)}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Cash flow forecast + liability breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-2" padding="md">
          <CardHeader
            title="Cash Flow Forecast"
            subtitle="6-month projection"
            action={
              <Link to="/reports" className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1">
                Full Report <ChevronRight size={12} />
              </Link>
            }
          />
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={cashFlow} margin={{ top: 5, right: 10, left: 0, bottom: 5 }} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tickFormatter={(v) => fmtMonthYear(v)} tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
              <YAxis tickFormatter={(v) => fmtCurrency(v, true)} tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} width={70} />
              <Tooltip formatter={(v: number) => fmtCurrency(v)} labelFormatter={(l) => fmtMonthYear(l)} contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
              <Legend iconType="square" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="income" fill="#10B981" radius={[4, 4, 0, 0]} name="Income" />
              <Bar dataKey="expenses" fill="#EF4444" radius={[4, 4, 0, 0]} name="Expenses" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card padding="md">
          <CardHeader
            title="Liability Breakdown"
            subtitle="Current balances"
            action={
              <Link to="/liabilities" className="text-xs text-blue-600 hover:text-blue-800 font-medium">
                View all
              </Link>
            }
          />
          <div className="space-y-2.5 mt-1">
            {liabilityBreakdown.slice(0, 6).map((item) => {
              const pct = (item.value / (totalLiab || 1)) * 100;
              return (
                <div key={item.name}>
                  <div className="flex justify-between text-xs mb-0.5">
                    <span className="text-slate-600 truncate max-w-[120px]">{item.name}</span>
                    <span className="font-medium text-slate-900">{fmtCurrency(item.value, true)}</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full">
                    <div className="h-full bg-red-400 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between">
            <span className="text-xs text-slate-500">Total Liabilities</span>
            <span className="text-sm font-bold text-red-600">{fmtCurrency(totalLiab)}</span>
          </div>
        </Card>
      </div>

      {/* Upcoming bills + recent transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Upcoming Bills */}
        <Card padding="none">
          <div className="p-5 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Upcoming Bills</h3>
                <p className="text-xs text-slate-500 mt-0.5">Next 30 days</p>
              </div>
              <Link to="/bills" className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1">
                View all <ChevronRight size={12} />
              </Link>
            </div>
          </div>
          {upcoming.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">No bills due in the next 30 days</div>
          ) : (
            <div className="divide-y divide-slate-50">
              {upcoming.map((bill) => {
                const daysLeft = Math.ceil((new Date(bill.nextDue).getTime() - Date.now()) / 86400000);
                const urgency = daysLeft <= 3 ? 'text-red-600' : daysLeft <= 7 ? 'text-amber-600' : 'text-slate-500';
                const entity = entities.find((e) => e.id === bill.entityId);
                return (
                  <div key={bill.id} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={clsx('p-1.5 rounded-lg', bill.autoPay ? 'bg-green-50' : 'bg-slate-100')}>
                        {bill.autoPay
                          ? <CheckCircle size={14} className="text-green-600" />
                          : <Clock size={14} className="text-slate-500" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{bill.name}</p>
                        <p className="text-xs text-slate-400">{entity?.name}</p>
                      </div>
                    </div>
                    <div className="text-right ml-4 flex-shrink-0">
                      <p className="text-sm font-semibold text-slate-900">{fmtCurrency(bill.amount)}</p>
                      <p className={clsx('text-xs', urgency)}>
                        {daysLeft === 0 ? 'Today' : daysLeft === 1 ? 'Tomorrow' : `${daysLeft}d`}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Recent Transactions */}
        <Card padding="none">
          <div className="p-5 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Recent Transactions</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {unreviewedCount > 0 ? (
                    <span className="text-amber-600 font-medium">{unreviewedCount} uncategorized</span>
                  ) : 'All reviewed'}
                </p>
              </div>
              <Link to="/transactions" className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1">
                View all <ChevronRight size={12} />
              </Link>
            </div>
          </div>
          <div className="divide-y divide-slate-50">
            {recentTxs.map((tx) => {
              const entity = entities.find((e) => e.id === tx.entityId);
              return (
                <div key={tx.id} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={clsx(
                      'w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0',
                      tx.type === 'credit' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                    )}>
                      {tx.type === 'credit' ? '+' : '−'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-slate-900 truncate max-w-[180px]">{tx.description}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-xs text-slate-400">{fmtDateShort(tx.date)}</span>
                        {tx.category && (
                          <Badge variant="gray" size="sm">{tx.category}</Badge>
                        )}
                        {!tx.reviewed && (
                          <Badge variant="amber" size="sm">Unreviewed</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right ml-4 flex-shrink-0">
                    <p className={clsx('text-sm font-semibold', tx.type === 'credit' ? 'text-emerald-600' : 'text-slate-900')}>
                      {tx.type === 'credit' ? '+' : '−'}{fmtCurrency(tx.amount)}
                    </p>
                    {entity && (
                      <span className="text-[10px] text-slate-400">{entity.name.split(' ')[0]}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Spending by category */}
      {catSpend.length > 0 && (
        <Card padding="md">
          <CardHeader title="Monthly Spending by Category" subtitle="Current month debits" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {catSpend.map((item, i) => (
              <div key={item.name} className="text-center">
                <div className="w-12 h-12 rounded-xl mx-auto mb-2 flex items-center justify-center text-white text-sm font-bold"
                  style={{ backgroundColor: ASSET_COLORS[i % ASSET_COLORS.length] }}>
                  {item.name.charAt(0)}
                </div>
                <p className="text-xs text-slate-500 truncate">{item.name}</p>
                <p className="text-sm font-semibold text-slate-900">{fmtCurrency(item.value)}</p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
