import { useState, useMemo } from 'react';
import { Plus, Edit2, Trash2, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useStore } from '../store/useStore';
import { Card, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal, FormField, Input, Select, Textarea } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { fmtCurrency, frequencyLabel, monthlyEquivalent, isoMonths, fmtMonthYear } from '../utils/formatters';
import type { IncomeItem, IncomeFrequency, IncomeType, IncomeCategory } from '../types';
import clsx from 'clsx';

const emptyIncome = (): Omit<IncomeItem, 'id'> => ({
  entityId: '', name: '', type: 'personal', category: 'salary',
  amount: 0, frequency: 'monthly', taxable: true, isActive: true, notes: '',
});

export function Income() {
  const { incomeItems, entities, addIncomeItem, updateIncomeItem, deleteIncomeItem } = useStore();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<IncomeItem | null>(null);
  const [form, setForm] = useState<Omit<IncomeItem, 'id'>>(emptyIncome());
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('all');

  const activeIncome = incomeItems.filter((i) => i.isActive);
  const filtered = filterType === 'all' ? incomeItems : incomeItems.filter((i) => i.type === filterType);

  const totalMonthly = activeIncome.reduce((s, i) => s + monthlyEquivalent(i.amount, i.frequency), 0);
  const businessMonthly = activeIncome.filter((i) => i.type === 'business').reduce((s, i) => s + monthlyEquivalent(i.amount, i.frequency), 0);
  const personalMonthly = activeIncome.filter((i) => i.type === 'personal').reduce((s, i) => s + monthlyEquivalent(i.amount, i.frequency), 0);
  const annualProjected = totalMonthly * 12;

  // 6-month forecast by entity
  const forecastData = useMemo(() => {
    const months = isoMonths(new Date().toISOString().split('T')[0], 6);
    return months.map((m) => {
      const row: Record<string, string | number> = { month: m };
      for (const entity of entities) {
        const entityIncome = activeIncome
          .filter((i) => i.entityId === entity.id)
          .reduce((s, i) => s + monthlyEquivalent(i.amount, i.frequency), 0);
        row[entity.name.split(' ')[0]] = entityIncome;
      }
      return row;
    });
  }, [activeIncome, entities]);

  const ENTITY_COLORS = entities.map((e) => e.color);

  const openAdd = () => { setEditing(null); setForm({ ...emptyIncome(), entityId: entities[0]?.id ?? '' }); setOpen(true); };
  const openEdit = (i: IncomeItem) => {
    setEditing(i);
    setForm({ entityId: i.entityId, name: i.name, type: i.type, category: i.category, amount: i.amount, frequency: i.frequency, taxable: i.taxable, isActive: i.isActive, notes: i.notes ?? '', startDate: i.startDate, endDate: i.endDate });
    setOpen(true);
  };
  const handleSave = () => {
    if (!form.name || !form.entityId) return;
    if (editing) updateIncomeItem(editing.id, form);
    else addIncomeItem({ ...form, id: `inc-${Date.now()}` });
    setOpen(false);
  };

  return (
    <div className="space-y-5 max-w-screen-xl mx-auto">
      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Total Monthly</p>
          <p className="text-2xl font-bold text-emerald-600">{fmtCurrency(totalMonthly)}</p>
          <p className="text-xs text-slate-400 mt-0.5">{activeIncome.length} sources</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Business Income</p>
          <p className="text-2xl font-bold text-blue-600">{fmtCurrency(businessMonthly)}</p>
          <p className="text-xs text-slate-400 mt-0.5">{fmtCurrency((businessMonthly / totalMonthly) * 100)}%</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Personal Income</p>
          <p className="text-2xl font-bold text-purple-600">{fmtCurrency(personalMonthly)}</p>
          <p className="text-xs text-slate-400 mt-0.5">{activeIncome.filter((i) => i.type === 'personal').length} sources</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Annual Projected</p>
          <p className="text-2xl font-bold text-slate-900">{fmtCurrency(annualProjected, true)}</p>
          <p className="text-xs text-slate-400 mt-0.5">Recurring only</p>
        </div>
      </div>

      {/* Forecast chart */}
      <Card padding="md">
        <CardHeader title="6-Month Income Forecast by Entity" subtitle="Monthly recurring income projection" />
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={forecastData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="month" tickFormatter={fmtMonthYear} tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
            <YAxis tickFormatter={(v) => fmtCurrency(v, true)} tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} width={65} />
            <Tooltip formatter={(v: number) => fmtCurrency(v)} labelFormatter={fmtMonthYear} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
            <Legend iconType="square" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
            {entities.map((e, i) => (
              <Bar key={e.id} dataKey={e.name.split(' ')[0]} fill={ENTITY_COLORS[i]} radius={[4, 4, 0, 0]} stackId="a" />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Controls */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          {['all', 'personal', 'business'].map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={clsx('px-3 py-1.5 text-sm rounded-lg font-medium transition-colors', filterType === t ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200')}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
        <Button onClick={openAdd} size="sm"><Plus size={14} /> Add Income</Button>
      </div>

      {/* Income table */}
      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Name</th>
                <th className="text-left px-3 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Entity</th>
                <th className="text-left px-3 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Type</th>
                <th className="text-left px-3 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Category</th>
                <th className="text-right px-3 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Amount</th>
                <th className="text-left px-3 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Frequency</th>
                <th className="text-right px-3 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Monthly</th>
                <th className="text-center px-3 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Taxable</th>
                <th className="text-center px-3 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Active</th>
                <th className="px-3 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((inc) => {
                const entity = entities.find((e) => e.id === inc.entityId);
                const monthly = monthlyEquivalent(inc.amount, inc.frequency);
                return (
                  <tr key={inc.id} className={clsx('hover:bg-slate-50 transition-colors', !inc.isActive && 'opacity-50')}>
                    <td className="px-5 py-3">
                      <p className="text-sm font-medium text-slate-900">{inc.name}</p>
                      {inc.notes && <p className="text-xs text-slate-400 mt-0.5">{inc.notes}</p>}
                    </td>
                    <td className="px-3 py-3">
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: entity?.color }} />
                        {entity?.name.split(' ')[0]}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <Badge variant={inc.type === 'business' ? 'blue' : 'purple'}>{inc.type}</Badge>
                    </td>
                    <td className="px-3 py-3"><Badge variant="gray">{inc.category}</Badge></td>
                    <td className="px-3 py-3 text-right text-sm font-semibold text-emerald-700">{fmtCurrency(inc.amount)}</td>
                    <td className="px-3 py-3 text-sm text-slate-600">{frequencyLabel(inc.frequency)}</td>
                    <td className="px-3 py-3 text-right text-sm font-medium text-emerald-700">{fmtCurrency(monthly)}</td>
                    <td className="px-3 py-3 text-center text-xs text-slate-500">{inc.taxable ? '✓' : '—'}</td>
                    <td className="px-3 py-3 text-center">
                      <span className={clsx('text-xs font-medium', inc.isActive ? 'text-emerald-600' : 'text-slate-400')}>{inc.isActive ? 'Active' : 'Inactive'}</span>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(inc)} className="p-1.5 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors"><Edit2 size={13} /></button>
                        <button onClick={() => setDeleteId(inc.id)} className="p-1.5 rounded hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50 border-t border-slate-200">
                <td colSpan={6} className="px-5 py-3 text-sm font-semibold text-slate-700">Monthly Total (active)</td>
                <td className="px-3 py-3 text-right font-bold text-emerald-700">{fmtCurrency(totalMonthly)}</td>
                <td colSpan={3} />
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>

      {/* Integration placeholder */}
      <Card padding="md" className="border-dashed border-slate-300 bg-slate-50/50">
        <div className="flex items-center gap-4">
          <TrendingUp size={20} className="text-slate-400" />
          <div>
            <p className="text-sm font-medium text-slate-600">Retirement Account Sync — Coming Soon</p>
            <p className="text-xs text-slate-400 mt-0.5">Connect Fidelity, Vanguard, and Schwab for automatic balance and dividend updates.</p>
          </div>
          <Button variant="outline" size="sm" className="ml-auto" disabled>Connect</Button>
        </div>
      </Card>

      {/* Delete */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Income Source"
        footer={<><Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button><Button variant="danger" onClick={() => { deleteIncomeItem(deleteId!); setDeleteId(null); }}>Delete</Button></>}>
        <p className="text-sm text-slate-600">Delete "{incomeItems.find((i) => i.id === deleteId)?.name}"?</p>
      </Modal>

      {/* Add/Edit */}
      <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Edit Income' : 'Add Income Source'} size="md"
        footer={<><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={handleSave} disabled={!form.name || !form.entityId}>Save</Button></>}>
        <div className="space-y-4">
          <FormField label="Entity" required>
            <Select value={form.entityId} onChange={(e) => setForm({ ...form, entityId: e.target.value })}>
              <option value="">Select entity...</option>
              {entities.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
            </Select>
          </FormField>
          <FormField label="Name" required>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Michael – Salary" />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Type">
              <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as IncomeType })}>
                <option value="personal">Personal</option>
                <option value="business">Business</option>
              </Select>
            </FormField>
            <FormField label="Category">
              <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as IncomeCategory })}>
                <option value="salary">Salary</option>
                <option value="wages">Wages</option>
                <option value="self-employment">Self-Employment</option>
                <option value="rental">Rental</option>
                <option value="dividends">Dividends</option>
                <option value="interest">Interest</option>
                <option value="consulting">Consulting</option>
                <option value="other">Other</option>
              </Select>
            </FormField>
            <FormField label="Amount ($)" required>
              <Input type="number" min={0} step={0.01} value={form.amount || ''} onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })} />
            </FormField>
            <FormField label="Frequency">
              <Select value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value as IncomeFrequency })}>
                <option value="weekly">Weekly</option>
                <option value="biweekly">Bi-weekly</option>
                <option value="semi-monthly">Semi-monthly (twice/mo)</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="annual">Annual</option>
                <option value="one-time">One-Time</option>
              </Select>
            </FormField>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={form.taxable} onChange={(e) => setForm({ ...form, taxable: e.target.checked })} className="w-4 h-4 rounded border-slate-300 text-blue-600" />
              Taxable income
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="w-4 h-4 rounded border-slate-300 text-blue-600" />
              Active
            </label>
          </div>
          <FormField label="Notes">
            <Textarea value={form.notes ?? ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Additional notes..." />
          </FormField>
        </div>
      </Modal>
    </div>
  );
}
