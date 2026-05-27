import { useState, useMemo } from 'react';
import { Plus, Edit2, Trash2, Search } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useStore } from '../store/useStore';
import { Card, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal, FormField, Input, Select, Textarea } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { fmtCurrency, fmtPercent, fmtDate, fmtOrdinal } from '../utils/formatters';
import type { Liability, LiabilityType } from '../types';
import clsx from 'clsx';

const LIAB_TYPE_LABELS: Record<string, string> = {
  mortgage: 'Mortgage', auto_loan: 'Auto Loan', credit_card: 'Credit Card',
  personal_loan: 'Personal Loan', business_loan: 'Business Loan', sba_loan: 'SBA Loan',
  tax_debt: 'Tax Debt', heloc: 'HELOC', line_of_credit: 'Line of Credit', other: 'Other',
};

const emptyLiab = (): Omit<Liability, 'id'> => ({
  entityId: '', name: '', type: 'mortgage', balance: 0, originalAmount: 0,
  interestRate: 0, minimumPayment: 0, paymentDueDay: 1, startDate: '',
  creditor: '', accountNumber: '', description: '',
});

export function Liabilities() {
  const { liabilities, entities, addLiability, updateLiability, deleteLiability } = useStore();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Liability | null>(null);
  const [form, setForm] = useState<Omit<Liability, 'id'>>(emptyLiab());
  const [search, setSearch] = useState('');
  const [entityFilter, setEntityFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = useMemo(() => liabilities.filter((l) => {
    if (entityFilter !== 'all' && l.entityId !== entityFilter) return false;
    if (typeFilter !== 'all' && l.type !== typeFilter) return false;
    if (search && !l.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [liabilities, entityFilter, typeFilter, search]);

  const totalBalance = filtered.reduce((s, l) => s + l.balance, 0);
  const totalMinPayment = filtered.reduce((s, l) => s + l.minimumPayment, 0);
  const avgRate = filtered.length ? filtered.reduce((s, l) => s + l.interestRate, 0) / filtered.length : 0;

  const typeBreakdown = useMemo(() => {
    const g: Record<string, number> = {};
    for (const l of filtered) g[LIAB_TYPE_LABELS[l.type] ?? l.type] = (g[LIAB_TYPE_LABELS[l.type] ?? l.type] ?? 0) + l.balance;
    return Object.entries(g).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [filtered]);

  const openAdd = () => { setEditing(null); setForm({ ...emptyLiab(), entityId: entities[0]?.id ?? '' }); setOpen(true); };
  const openEdit = (l: Liability) => {
    setEditing(l);
    setForm({ entityId: l.entityId, name: l.name, type: l.type, balance: l.balance, originalAmount: l.originalAmount, interestRate: l.interestRate, minimumPayment: l.minimumPayment, paymentDueDay: l.paymentDueDay, startDate: l.startDate, endDate: l.endDate, creditor: l.creditor, accountNumber: l.accountNumber ?? '', description: l.description ?? '' });
    setOpen(true);
  };

  const handleSave = () => {
    if (!form.name || !form.entityId) return;
    if (editing) updateLiability(editing.id, form);
    else addLiability({ ...form, id: `liab-${Date.now()}` });
    setOpen(false);
  };

  return (
    <div className="space-y-5 max-w-screen-xl mx-auto">
      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <p className="text-xs text-slate-500 uppercase tracking-wide font-medium mb-1">Total Liabilities</p>
          <p className="text-3xl font-bold text-red-600">{fmtCurrency(totalBalance)}</p>
          <p className="text-xs text-slate-400 mt-1">{filtered.length} debts</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <p className="text-xs text-slate-500 uppercase tracking-wide font-medium mb-1">Monthly Min. Payments</p>
          <p className="text-3xl font-bold text-slate-900">{fmtCurrency(totalMinPayment)}</p>
          <p className="text-xs text-slate-400 mt-1">Required monthly</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <p className="text-xs text-slate-500 uppercase tracking-wide font-medium mb-1">Avg. Interest Rate</p>
          <p className="text-3xl font-bold text-slate-900">{fmtPercent(avgRate)}</p>
          <p className="text-xs text-slate-400 mt-1">Weighted average</p>
        </div>
      </div>

      {/* Chart + filters row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-2" padding="md">
          <CardHeader title="Liability Breakdown by Type" />
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={typeBreakdown} layout="vertical" margin={{ left: 20, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis type="number" tickFormatter={(v) => fmtCurrency(v, true)} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} width={100} />
              <Tooltip formatter={(v: number) => fmtCurrency(v)} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="value" fill="#EF4444" radius={[0, 4, 4, 0]} name="Balance" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card padding="md">
          <CardHeader title="Interest Rate Ladder" />
          <div className="space-y-2">
            {[...filtered].sort((a, b) => b.interestRate - a.interestRate).slice(0, 6).map((l) => (
              <div key={l.id} className="flex items-center justify-between">
                <span className="text-xs text-slate-600 truncate max-w-[130px]">{l.name}</span>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-1.5 bg-slate-100 rounded-full">
                    <div className="h-full rounded-full bg-red-400" style={{ width: `${Math.min((l.interestRate / 25) * 100, 100)}%` }} />
                  </div>
                  <span className={clsx('text-xs font-medium w-10 text-right', l.interestRate > 10 ? 'text-red-600' : l.interestRate > 5 ? 'text-amber-600' : 'text-slate-600')}>
                    {fmtPercent(l.interestRate)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." className="pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-52" />
        </div>
        <select value={entityFilter} onChange={(e) => setEntityFilter(e.target.value)} className="px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="all">All Entities</option>
          {entities.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
        </select>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="all">All Types</option>
          {Object.entries(LIAB_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <div className="ml-auto">
          <Button onClick={openAdd} size="sm"><Plus size={14} /> Add Liability</Button>
        </div>
      </div>

      {/* Table */}
      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Name / Creditor</th>
                <th className="text-left px-3 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Entity</th>
                <th className="text-left px-3 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Type</th>
                <th className="text-right px-3 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Balance</th>
                <th className="text-right px-3 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Original</th>
                <th className="text-right px-3 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Rate</th>
                <th className="text-right px-3 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Min Payment</th>
                <th className="text-right px-3 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Due Day</th>
                <th className="px-3 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((l) => {
                const entity = entities.find((e) => e.id === l.entityId);
                const paidPct = ((l.originalAmount - l.balance) / l.originalAmount) * 100;
                return (
                  <tr key={l.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3">
                      <p className="text-sm font-medium text-slate-900">{l.name}</p>
                      <div className="mt-1">
                        <div className="h-1 w-32 bg-slate-100 rounded-full">
                          <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${Math.min(paidPct, 100)}%` }} />
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">{paidPct.toFixed(1)}% paid · {l.creditor}</p>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: entity?.color }} />
                        {entity?.name.split(' ')[0]}
                      </span>
                    </td>
                    <td className="px-3 py-3"><Badge variant="gray">{LIAB_TYPE_LABELS[l.type]}</Badge></td>
                    <td className="px-3 py-3 text-right font-semibold text-red-700">{fmtCurrency(l.balance)}</td>
                    <td className="px-3 py-3 text-right text-sm text-slate-400">{fmtCurrency(l.originalAmount)}</td>
                    <td className="px-3 py-3 text-right">
                      <span className={clsx('text-sm font-medium', l.interestRate > 10 ? 'text-red-600' : l.interestRate > 5 ? 'text-amber-600' : 'text-emerald-600')}>
                        {fmtPercent(l.interestRate)}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right text-sm font-medium text-slate-700">{fmtCurrency(l.minimumPayment)}</td>
                    <td className="px-3 py-3 text-right text-sm text-slate-500">{fmtOrdinal(l.paymentDueDay)}</td>
                    <td className="px-3 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(l)} className="p-1.5 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors"><Edit2 size={13} /></button>
                        <button onClick={() => setDeleteId(l.id)} className="p-1.5 rounded hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50 border-t border-slate-200">
                <td colSpan={3} className="px-5 py-3 text-sm font-semibold text-slate-700">Totals ({filtered.length} liabilities)</td>
                <td className="px-3 py-3 text-right font-bold text-red-700">{fmtCurrency(totalBalance)}</td>
                <td colSpan={2} />
                <td className="px-3 py-3 text-right font-bold text-slate-900">{fmtCurrency(totalMinPayment)}/mo</td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>

      {/* Delete confirm */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Liability"
        footer={<><Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button><Button variant="danger" onClick={() => { deleteLiability(deleteId!); setDeleteId(null); }}>Delete</Button></>}>
        <p className="text-sm text-slate-600">Delete "{liabilities.find((l) => l.id === deleteId)?.name}"? This will also remove its debt schedule.</p>
      </Modal>

      {/* Add/Edit modal */}
      <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Edit Liability' : 'Add Liability'} size="lg"
        footer={<><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={handleSave} disabled={!form.name || !form.entityId}>Save</Button></>}>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Entity" required>
            <Select value={form.entityId} onChange={(e) => setForm({ ...form, entityId: e.target.value })}>
              <option value="">Select entity...</option>
              {entities.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
            </Select>
          </FormField>
          <FormField label="Type" required>
            <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as LiabilityType })}>
              {Object.entries(LIAB_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </Select>
          </FormField>
          <div className="col-span-2">
            <FormField label="Name" required>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Primary Mortgage – Chase" />
            </FormField>
          </div>
          <FormField label="Current Balance ($)" required>
            <Input type="number" min={0} step={0.01} value={form.balance || ''} onChange={(e) => setForm({ ...form, balance: parseFloat(e.target.value) || 0 })} />
          </FormField>
          <FormField label="Original Amount ($)">
            <Input type="number" min={0} step={0.01} value={form.originalAmount || ''} onChange={(e) => setForm({ ...form, originalAmount: parseFloat(e.target.value) || 0 })} />
          </FormField>
          <FormField label="Interest Rate (%)">
            <Input type="number" min={0} step={0.01} value={form.interestRate || ''} onChange={(e) => setForm({ ...form, interestRate: parseFloat(e.target.value) || 0 })} />
          </FormField>
          <FormField label="Minimum Payment ($)">
            <Input type="number" min={0} step={0.01} value={form.minimumPayment || ''} onChange={(e) => setForm({ ...form, minimumPayment: parseFloat(e.target.value) || 0 })} />
          </FormField>
          <FormField label="Creditor">
            <Input value={form.creditor} onChange={(e) => setForm({ ...form, creditor: e.target.value })} placeholder="Chase Bank" />
          </FormField>
          <FormField label="Account Number">
            <Input value={form.accountNumber ?? ''} onChange={(e) => setForm({ ...form, accountNumber: e.target.value })} placeholder="****1234" />
          </FormField>
          <FormField label="Payment Due Day">
            <Input type="number" min={1} max={31} value={form.paymentDueDay || ''} onChange={(e) => setForm({ ...form, paymentDueDay: parseInt(e.target.value) || 1 })} />
          </FormField>
          <FormField label="Start Date">
            <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
          </FormField>
        </div>
      </Modal>
    </div>
  );
}
