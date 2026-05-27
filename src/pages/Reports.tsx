import { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Printer, Download, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { useStore } from '../store/useStore';
import { Card, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import {
  totalAssets, totalLiabilities, netWorth, monthlyIncome,
  monthlyBills, cashBalance, buildCashFlowForecast, categorizeTransactions
} from '../utils/calculations';
import { fmtCurrency, fmtCurrencyFull, fmtDate, fmtMonthYear, isoMonths, monthlyEquivalent, addMonths } from '../utils/formatters';
import clsx from 'clsx';

type ReportType = 'pl' | 'balance_sheet' | 'cash_flow';

function dateRange(months: number): { start: string; end: string } {
  const end = new Date().toISOString().split('T')[0];
  const start = addMonths(end, -months + 1).substring(0, 7) + '-01';
  return { start, end };
}

export function Reports() {
  const { entities, assets, liabilities, incomeItems, bills, transactions, selectedEntityId } = useStore();
  const [reportType, setReportType] = useState<ReportType>('pl');
  const [entityId, setEntityId] = useState<string>(selectedEntityId ?? 'global');
  const [periodMonths, setPeriodMonths] = useState(3);
  const [forecastMonths, setForecastMonths] = useState(3);

  const entity = entities.find((e) => e.id === entityId);
  const isGlobal = entityId === 'global';

  const filteredAssets = isGlobal ? assets : assets.filter((a) => a.entityId === entityId);
  const filteredLiabs = isGlobal ? liabilities : liabilities.filter((l) => l.entityId === entityId);
  const filteredIncome = isGlobal ? incomeItems : incomeItems.filter((i) => i.entityId === entityId);
  const filteredBills = isGlobal ? bills : bills.filter((b) => b.entityId === entityId);
  const filteredTxs = isGlobal ? transactions : transactions.filter((t) => t.entityId === entityId);

  const { start, end } = dateRange(periodMonths);
  const periodTxs = filteredTxs.filter((t) => t.date >= start && t.date <= end);

  // ── P&L ──────────────────────────────────────────────────────────────────
  const revenue = useMemo(() => {
    const cats: Record<string, number> = {};
    for (const t of periodTxs.filter((t) => t.type === 'credit' && t.category !== 'Transfer')) {
      const c = t.category ?? 'Other Income';
      cats[c] = (cats[c] ?? 0) + t.amount;
    }
    return cats;
  }, [periodTxs]);

  const expenses = useMemo(() => {
    const cats: Record<string, number> = {};
    for (const t of periodTxs.filter((t) => t.type === 'debit' && t.category !== 'Transfer' && t.category !== 'Savings')) {
      const c = t.category ?? 'Uncategorized';
      cats[c] = (cats[c] ?? 0) + t.amount;
    }
    return cats;
  }, [periodTxs]);

  const totalRevenue = Object.values(revenue).reduce((s, v) => s + v, 0);
  const totalExpenses = Object.values(expenses).reduce((s, v) => s + v, 0);
  const netIncome = totalRevenue - totalExpenses;

  // ── Balance Sheet ─────────────────────────────────────────────────────────
  const assetsByType = useMemo(() => {
    const g: Record<string, { items: typeof filteredAssets; total: number }> = {};
    for (const a of filteredAssets) {
      const label = a.type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      if (!g[label]) g[label] = { items: [], total: 0 };
      g[label].items.push(a);
      g[label].total += a.value;
    }
    return g;
  }, [filteredAssets]);

  const liabsByType = useMemo(() => {
    const g: Record<string, { items: typeof filteredLiabs; total: number }> = {};
    for (const l of filteredLiabs) {
      const label = l.type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      if (!g[label]) g[label] = { items: [], total: 0 };
      g[label].items.push(l);
      g[label].total += l.balance;
    }
    return g;
  }, [filteredLiabs]);

  const totalAss = totalAssets(filteredAssets);
  const totalLiab = totalLiabilities(filteredLiabs);
  const nw = totalAss - totalLiab;

  // ── Cash Flow Forecast ────────────────────────────────────────────────────
  const cashForecast = useMemo(() => buildCashFlowForecast(filteredAssets, filteredIncome, filteredBills, filteredLiabs, forecastMonths), [filteredAssets, filteredIncome, filteredBills, filteredLiabs, forecastMonths]);

  const handlePrint = () => window.print();

  return (
    <div className="space-y-5 max-w-screen-xl mx-auto">
      {/* Controls */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 no-print">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <p className="text-xs text-slate-500 mb-1 font-medium uppercase tracking-wide">Report Type</p>
            <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
              {([['pl', 'P&L Statement'], ['balance_sheet', 'Balance Sheet'], ['cash_flow', 'Cash Flow Forecast']] as [ReportType, string][]).map(([type, label]) => (
                <button key={type} onClick={() => setReportType(type)}
                  className={clsx('px-3 py-1.5 text-sm rounded-md font-medium transition-colors', reportType === type ? 'bg-white shadow-sm text-slate-900' : 'text-slate-600 hover:text-slate-900')}>
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1 font-medium uppercase tracking-wide">Entity</p>
            <select value={entityId} onChange={(e) => setEntityId(e.target.value)} className="px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="global">Global (All Entities)</option>
              {entities.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </div>
          {reportType === 'pl' && (
            <div>
              <p className="text-xs text-slate-500 mb-1 font-medium uppercase tracking-wide">Period</p>
              <select value={periodMonths} onChange={(e) => setPeriodMonths(parseInt(e.target.value))} className="px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none">
                <option value={1}>Last Month</option>
                <option value={3}>Last 3 Months</option>
                <option value={6}>Last 6 Months</option>
                <option value={12}>Last 12 Months</option>
              </select>
            </div>
          )}
          {reportType === 'cash_flow' && (
            <div>
              <p className="text-xs text-slate-500 mb-1 font-medium uppercase tracking-wide">Forecast</p>
              <select value={forecastMonths} onChange={(e) => setForecastMonths(parseInt(e.target.value))} className="px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none">
                <option value={1}>1 Month</option>
                <option value={3}>3 Months</option>
                <option value={6}>6 Months</option>
                <option value={12}>12 Months</option>
              </select>
            </div>
          )}
          <div className="ml-auto flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer size={13} /> Print / PDF
            </Button>
          </div>
        </div>
      </div>

      {/* ── P&L Report ── */}
      {reportType === 'pl' && (
        <div className="space-y-5">
          <div className="print-header bg-navy-900 text-white rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-300 text-xs font-medium uppercase tracking-wide mb-1">Property Flow Global Finance</p>
                <h2 className="text-xl font-bold">Profit & Loss Statement</h2>
                <p className="text-blue-200 text-sm mt-1">
                  {isGlobal ? 'All Entities Combined' : entity?.name} · {fmtDate(start)} – {fmtDate(end)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-blue-300">Net Income</p>
                <p className={clsx('text-2xl font-bold', netIncome >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                  {fmtCurrency(netIncome, true)}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Revenue */}
            <Card padding="none">
              <div className="px-5 py-3 bg-emerald-50 border-b border-emerald-100">
                <h3 className="text-sm font-semibold text-emerald-800 flex items-center gap-2">
                  <TrendingUp size={15} /> Revenue
                </h3>
              </div>
              <table className="w-full">
                <tbody>
                  {Object.entries(revenue).sort(([, a], [, b]) => b - a).map(([cat, amt]) => (
                    <tr key={cat} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="px-5 py-2.5 text-sm text-slate-700">{cat}</td>
                      <td className="px-5 py-2.5 text-right text-sm font-medium text-emerald-700">{fmtCurrencyFull(amt)}</td>
                      <td className="px-5 py-2.5 text-right text-xs text-slate-400">{((amt / totalRevenue) * 100).toFixed(1)}%</td>
                    </tr>
                  ))}
                  {Object.keys(revenue).length === 0 && (
                    <tr><td colSpan={3} className="px-5 py-4 text-sm text-slate-400 text-center">No revenue in this period</td></tr>
                  )}
                </tbody>
                <tfoot>
                  <tr className="bg-emerald-50 border-t border-emerald-200">
                    <td className="px-5 py-3 text-sm font-bold text-emerald-900">Total Revenue</td>
                    <td className="px-5 py-3 text-right font-bold text-emerald-700">{fmtCurrencyFull(totalRevenue)}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </Card>

            {/* Expenses */}
            <Card padding="none">
              <div className="px-5 py-3 bg-red-50 border-b border-red-100">
                <h3 className="text-sm font-semibold text-red-800 flex items-center gap-2">
                  <TrendingDown size={15} /> Expenses
                </h3>
              </div>
              <table className="w-full">
                <tbody>
                  {Object.entries(expenses).sort(([, a], [, b]) => b - a).map(([cat, amt]) => (
                    <tr key={cat} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="px-5 py-2.5 text-sm text-slate-700">{cat}</td>
                      <td className="px-5 py-2.5 text-right text-sm font-medium text-red-700">{fmtCurrencyFull(amt)}</td>
                      <td className="px-5 py-2.5 text-right text-xs text-slate-400">{((amt / totalExpenses) * 100).toFixed(1)}%</td>
                    </tr>
                  ))}
                  {Object.keys(expenses).length === 0 && (
                    <tr><td colSpan={3} className="px-5 py-4 text-sm text-slate-400 text-center">No expenses in this period</td></tr>
                  )}
                </tbody>
                <tfoot>
                  <tr className="bg-red-50 border-t border-red-200">
                    <td className="px-5 py-3 text-sm font-bold text-red-900">Total Expenses</td>
                    <td className="px-5 py-3 text-right font-bold text-red-700">{fmtCurrencyFull(totalExpenses)}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </Card>
          </div>

          {/* Net income summary */}
          <Card padding="md">
            <div className="grid grid-cols-3 gap-6 text-center">
              <div>
                <p className="text-xs text-slate-500 mb-1">Total Revenue</p>
                <p className="text-xl font-bold text-emerald-600">{fmtCurrencyFull(totalRevenue)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Total Expenses</p>
                <p className="text-xl font-bold text-red-600">{fmtCurrencyFull(totalExpenses)}</p>
              </div>
              <div className="border-l border-slate-200 pl-6">
                <p className="text-xs text-slate-500 mb-1">Net Income</p>
                <p className={clsx('text-xl font-bold', netIncome >= 0 ? 'text-emerald-600' : 'text-red-600')}>{fmtCurrencyFull(netIncome)}</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {totalRevenue > 0 ? `${((netIncome / totalRevenue) * 100).toFixed(1)}% margin` : ''}
                </p>
              </div>
            </div>
          </Card>

          {/* Chart */}
          <Card padding="md">
            <CardHeader title="Revenue vs. Expenses" />
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={[{ name: `${periodMonths}mo Period`, Revenue: totalRevenue, Expenses: totalExpenses, 'Net Income': netIncome }]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={(v) => fmtCurrency(v, true)} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v: number) => fmtCurrency(v)} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="Revenue" fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Expenses" fill="#EF4444" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Net Income" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      )}

      {/* ── Balance Sheet ── */}
      {reportType === 'balance_sheet' && (
        <div className="space-y-5">
          <div className="bg-navy-900 text-white rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-300 text-xs font-medium uppercase tracking-wide mb-1">Property Flow Global Finance</p>
                <h2 className="text-xl font-bold">Balance Sheet</h2>
                <p className="text-blue-200 text-sm mt-1">
                  {isGlobal ? 'All Entities Combined' : entity?.name} · As of {fmtDate(new Date().toISOString().split('T')[0])}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-blue-300">Net Worth</p>
                <p className={clsx('text-2xl font-bold', nw >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                  {fmtCurrency(nw, true)}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Assets */}
            <Card padding="none">
              <div className="px-5 py-3 bg-blue-50 border-b border-blue-100">
                <h3 className="text-sm font-semibold text-blue-800">Assets</h3>
              </div>
              {Object.entries(assetsByType).map(([type, { items, total }]) => (
                <div key={type}>
                  <div className="px-5 py-2 bg-slate-50 border-b border-slate-100">
                    <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">{type}</span>
                    <span className="float-right text-xs font-semibold text-slate-700">{fmtCurrencyFull(total)}</span>
                  </div>
                  {items.map((a) => (
                    <div key={a.id} className="flex justify-between px-7 py-2 border-b border-slate-50 hover:bg-slate-50 text-sm">
                      <span className="text-slate-700 truncate max-w-[200px]">{a.name}</span>
                      <span className="font-medium text-slate-900 ml-4">{fmtCurrencyFull(a.value)}</span>
                    </div>
                  ))}
                </div>
              ))}
              <div className="px-5 py-3 bg-blue-50 border-t border-blue-200 flex justify-between">
                <span className="text-sm font-bold text-blue-900">TOTAL ASSETS</span>
                <span className="text-sm font-bold text-blue-900">{fmtCurrencyFull(totalAss)}</span>
              </div>
            </Card>

            {/* Liabilities + Net Worth */}
            <div className="space-y-5">
              <Card padding="none">
                <div className="px-5 py-3 bg-red-50 border-b border-red-100">
                  <h3 className="text-sm font-semibold text-red-800">Liabilities</h3>
                </div>
                {Object.entries(liabsByType).map(([type, { items, total }]) => (
                  <div key={type}>
                    <div className="px-5 py-2 bg-slate-50 border-b border-slate-100">
                      <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">{type}</span>
                      <span className="float-right text-xs font-semibold text-red-700">{fmtCurrencyFull(total)}</span>
                    </div>
                    {items.map((l) => (
                      <div key={l.id} className="flex justify-between px-7 py-2 border-b border-slate-50 hover:bg-slate-50 text-sm">
                        <span className="text-slate-700 truncate max-w-[200px]">{l.name}</span>
                        <span className="font-medium text-red-700 ml-4">{fmtCurrencyFull(l.balance)}</span>
                      </div>
                    ))}
                  </div>
                ))}
                <div className="px-5 py-3 bg-red-50 border-t border-red-200 flex justify-between">
                  <span className="text-sm font-bold text-red-900">TOTAL LIABILITIES</span>
                  <span className="text-sm font-bold text-red-900">{fmtCurrencyFull(totalLiab)}</span>
                </div>
              </Card>

              <Card padding="md" className="bg-slate-900 border-slate-800">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Total Assets</span>
                    <span className="text-emerald-400 font-semibold">{fmtCurrencyFull(totalAss)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Total Liabilities</span>
                    <span className="text-red-400 font-semibold">({fmtCurrencyFull(totalLiab)})</span>
                  </div>
                  <div className="border-t border-slate-700 pt-3 flex justify-between">
                    <span className="text-white font-bold">NET WORTH</span>
                    <span className={clsx('text-xl font-bold', nw >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                      {fmtCurrencyFull(nw)}
                    </span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* ── Cash Flow Forecast ── */}
      {reportType === 'cash_flow' && (
        <div className="space-y-5">
          <div className="bg-navy-900 text-white rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-300 text-xs font-medium uppercase tracking-wide mb-1">Property Flow Global Finance</p>
                <h2 className="text-xl font-bold">Cash Flow Forecast</h2>
                <p className="text-blue-200 text-sm mt-1">
                  {isGlobal ? 'All Entities Combined' : entity?.name} · {forecastMonths}-Month Projection
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-blue-300">Current Cash</p>
                <p className="text-2xl font-bold text-white">{fmtCurrency(cashBalance(filteredAssets), true)}</p>
              </div>
            </div>
          </div>

          {/* Assumptions */}
          <Card padding="md">
            <CardHeader title="Forecast Assumptions" subtitle="Based on recurring income and bills" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div className="bg-emerald-50 rounded-lg p-3">
                <p className="text-xs text-emerald-600 font-medium mb-0.5">Monthly Income</p>
                <p className="text-lg font-bold text-emerald-700">{fmtCurrency(monthlyIncome(filteredIncome))}</p>
              </div>
              <div className="bg-red-50 rounded-lg p-3">
                <p className="text-xs text-red-600 font-medium mb-0.5">Monthly Bills</p>
                <p className="text-lg font-bold text-red-700">{fmtCurrency(monthlyBills(filteredBills))}</p>
              </div>
              <div className="bg-red-50 rounded-lg p-3">
                <p className="text-xs text-red-600 font-medium mb-0.5">Debt Payments</p>
                <p className="text-lg font-bold text-red-700">{fmtCurrency(filteredLiabs.reduce((s, l) => s + l.minimumPayment, 0))}</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-3">
                <p className="text-xs text-blue-600 font-medium mb-0.5">Monthly Net</p>
                <p className={clsx('text-lg font-bold', cashForecast[0]?.netCashFlow >= 0 ? 'text-blue-700' : 'text-red-700')}>
                  {fmtCurrency(cashForecast[0]?.netCashFlow ?? 0)}
                </p>
              </div>
            </div>
          </Card>

          {/* Forecast table */}
          <Card padding="none">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Month</th>
                    <th className="text-right px-3 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Expected Income</th>
                    <th className="text-right px-3 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Expected Expenses</th>
                    <th className="text-right px-3 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Net Cash Flow</th>
                    <th className="text-right px-3 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Projected Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {cashForecast.map((row, i) => (
                    <tr key={row.month} className={clsx('hover:bg-slate-50', i === 0 && 'bg-blue-50/30')}>
                      <td className="px-5 py-3 text-sm font-medium text-slate-900">
                        {fmtMonthYear(row.month)}
                        {i === 0 && <Badge variant="blue" size="sm" className="ml-2">Current</Badge>}
                      </td>
                      <td className="px-3 py-3 text-right text-sm text-emerald-600 font-medium">{fmtCurrencyFull(row.income)}</td>
                      <td className="px-3 py-3 text-right text-sm text-red-600 font-medium">{fmtCurrencyFull(row.expenses)}</td>
                      <td className="px-3 py-3 text-right">
                        <span className={clsx('text-sm font-semibold', row.netCashFlow >= 0 ? 'text-emerald-600' : 'text-red-600')}>
                          {row.netCashFlow >= 0 ? '+' : ''}{fmtCurrencyFull(row.netCashFlow)}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right">
                        <span className={clsx('text-sm font-bold', row.projectedBalance >= 0 ? 'text-slate-900' : 'text-red-600')}>
                          {fmtCurrencyFull(row.projectedBalance)}
                        </span>
                        {row.projectedBalance < 10000 && (
                          <p className="text-[10px] text-red-500 mt-0.5">⚠ Low cash</p>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Forecast chart */}
          <Card padding="md">
            <CardHeader title="Projected Cash Balance" />
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={cashForecast} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tickFormatter={fmtMonthYear} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={(v) => fmtCurrency(v, true)} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={70} />
                <Tooltip formatter={(v: number) => fmtCurrencyFull(v)} labelFormatter={fmtMonthYear} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                <Line type="monotone" dataKey="projectedBalance" stroke="#3B82F6" strokeWidth={2.5} dot={{ fill: '#3B82F6', r: 4 }} name="Projected Balance" />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </div>
      )}
    </div>
  );
}
