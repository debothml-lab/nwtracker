import { useState, useMemo } from 'react';
import { Plus, Edit2, Trash2, CheckCircle, Clock, ChevronLeft, ChevronRight as ChevronRightIcon } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { useStore } from '../store/useStore';
import { Card, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal, FormField, Input, Select, Textarea } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { fmtCurrency, fmtOrdinal, frequencyLabel, monthlyEquivalent } from '../utils/formatters';
import { upcomingBills } from '../utils/calculations';
import type { Bill, BillFrequency } from '../types';
import clsx from 'clsx';

const CAT_COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#06B6D4', '#F97316', '#EC4899'];
const CATEGORIES = ['Housing', 'Mortgage', 'Utilities', 'Insurance', 'Transportation', 'Debt Payment', 'Subscriptions', 'Health & Fitness', 'Taxes', 'Telecom', 'Rent', 'Other'];

const emptyBill = (): Omit<Bill, 'id'> => ({
  entityId: '', name: '', category: 'Housing', amount: 0,
  frequency: 'monthly', dueDay: 1, autoPay: false, vendor: '', notes: '', isActive: true,
});

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

export function Bills() {
  const { bills, entities, addBill, updateBill, deleteBill } = useStore();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Bill | null>(null);
  const [form, setForm] = useState<Omit<Bill, 'id'>>(emptyBill());
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [view, setView] = useState<'calendar' | 'list'>('calendar');
  const [calMonth, setCalMonth] = useState(() => new Date());

  const activeBills = bills.filter((b) => b.isActive);
  const upcoming = useMemo(() => upcomingBills(activeBills, 30), [activeBills]);
  const totalMonthly = activeBills.reduce((s, b) => s + monthlyEquivalent(b.amount, b.frequency), 0);

  const catBreakdown = useMemo(() => {
    const g: Record<string, number> = {};
    for (const b of activeBills) g[b.category] = (g[b.category] ?? 0) + monthlyEquivalent(b.amount, b.frequency);
    return Object.entries(g).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [activeBills]);

  // Calendar logic
  const year = calMonth.getFullYear();
  const month = calMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = getDaysInMonth(year, month);
  const today = new Date();

  const billsByDay = useMemo(() => {
    const g: Record<number, Bill[]> = {};
    for (const b of activeBills) {
      if (!g[b.dueDay]) g[b.dueDay] = [];
      g[b.dueDay].push(b);
    }
    return g;
  }, [activeBills]);

  const openAdd = () => { setEditing(null); setForm({ ...emptyBill(), entityId: entities[0]?.id ?? '' }); setOpen(true); };
  const openEdit = (b: Bill) => {
    setEditing(b);
    setForm({ entityId: b.entityId, name: b.name, category: b.category, amount: b.amount, frequency: b.frequency, dueDay: b.dueDay, autoPay: b.autoPay, vendor: b.vendor ?? '', notes: b.notes ?? '', isActive: b.isActive });
    setOpen(true);
  };
  const handleSave = () => {
    if (!form.name || !form.entityId) return;
    if (editing) updateBill(editing.id, form);
    else addBill({ ...form, id: `bill-${Date.now()}` });
    setOpen(false);
  };

  return (
    <div className="space-y-5 max-w-screen-xl mx-auto">
      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Monthly Total</p>
          <p className="text-2xl font-bold text-slate-900">{fmtCurrency(totalMonthly)}</p>
          <p className="text-xs text-slate-400 mt-0.5">{activeBills.length} active bills</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Due Next 7 Days</p>
          <p className="text-2xl font-bold text-amber-600">{upcomingBills(activeBills, 7).length}</p>
          <p className="text-xs text-slate-400 mt-0.5">{fmtCurrency(upcomingBills(activeBills, 7).reduce((s, b) => s + b.amount, 0))}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Auto-Pay Bills</p>
          <p className="text-2xl font-bold text-emerald-600">{activeBills.filter((b) => b.autoPay).length}</p>
          <p className="text-xs text-slate-400 mt-0.5">of {activeBills.length} bills</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Annual Total</p>
          <p className="text-2xl font-bold text-slate-900">{fmtCurrency(totalMonthly * 12, true)}</p>
          <p className="text-xs text-slate-400 mt-0.5">Projected yearly</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
          <button onClick={() => setView('calendar')} className={clsx('px-3 py-1.5 text-sm rounded-md font-medium transition-colors', view === 'calendar' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-600 hover:text-slate-900')}>
            Calendar
          </button>
          <button onClick={() => setView('list')} className={clsx('px-3 py-1.5 text-sm rounded-md font-medium transition-colors', view === 'list' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-600 hover:text-slate-900')}>
            List
          </button>
        </div>
        <Button onClick={openAdd} size="sm"><Plus size={14} /> Add Bill</Button>
      </div>

      {view === 'calendar' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Calendar */}
          <Card className="lg:col-span-2" padding="md">
            <div className="flex items-center justify-between mb-4">
              <button onClick={() => setCalMonth(new Date(year, month - 1))} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                <ChevronLeft size={16} className="text-slate-600" />
              </button>
              <h3 className="text-sm font-semibold text-slate-900">
                {calMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h3>
              <button onClick={() => setCalMonth(new Date(year, month + 1))} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                <ChevronRightIcon size={16} className="text-slate-600" />
              </button>
            </div>

            {/* Day labels */}
            <div className="grid grid-cols-7 mb-1">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                <div key={d} className="text-center text-xs font-medium text-slate-400 py-1">{d}</div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-0.5">
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square" />
              ))}
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                const isToday = today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
                const dayBills = billsByDay[day] ?? [];
                return (
                  <div key={day} className={clsx(
                    'min-h-[60px] p-1 rounded-lg border transition-colors',
                    isToday ? 'border-blue-500 bg-blue-50' : 'border-slate-100 hover:bg-slate-50',
                  )}>
                    <p className={clsx('text-xs font-medium mb-0.5', isToday ? 'text-blue-700' : 'text-slate-600')}>{day}</p>
                    <div className="space-y-0.5">
                      {dayBills.slice(0, 2).map((b) => (
                        <div key={b.id} className={clsx('text-[9px] px-1 py-0.5 rounded truncate font-medium', b.autoPay ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700')}>
                          {b.name.length > 10 ? b.name.substring(0, 9) + '…' : b.name}
                        </div>
                      ))}
                      {dayBills.length > 2 && <div className="text-[9px] text-slate-400">+{dayBills.length - 2} more</div>}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-100">
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <span className="w-3 h-3 rounded bg-emerald-100 border border-emerald-300 inline-block" /> Auto-pay
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <span className="w-3 h-3 rounded bg-amber-100 border border-amber-300 inline-block" /> Manual
              </div>
            </div>
          </Card>

          {/* Upcoming bills + pie */}
          <div className="space-y-5">
            <Card padding="md">
              <CardHeader title="Due Next 30 Days" />
              <div className="space-y-2">
                {upcoming.slice(0, 8).map((b) => {
                  const daysLeft = Math.ceil((new Date(b.nextDue).getTime() - Date.now()) / 86400000);
                  return (
                    <div key={b.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        {b.autoPay
                          ? <CheckCircle size={13} className="text-emerald-500 flex-shrink-0" />
                          : <Clock size={13} className="text-amber-500 flex-shrink-0" />}
                        <span className="text-xs text-slate-700 truncate">{b.name}</span>
                      </div>
                      <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                        <span className="text-xs font-semibold text-slate-900">{fmtCurrency(b.amount)}</span>
                        <span className={clsx('text-[10px] px-1.5 py-0.5 rounded-full font-medium', daysLeft <= 3 ? 'bg-red-100 text-red-700' : daysLeft <= 7 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600')}>
                          {daysLeft}d
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
            <Card padding="md">
              <CardHeader title="By Category" />
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie data={catBreakdown} dataKey="value" cx="50%" cy="50%" outerRadius={60} paddingAngle={2}>
                    {catBreakdown.map((_, i) => <Cell key={i} fill={CAT_COLORS[i % CAT_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => fmtCurrency(v)} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1 mt-1">
                {catBreakdown.slice(0, 4).map((c, i) => (
                  <div key={c.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: CAT_COLORS[i % CAT_COLORS.length] }} />
                      <span className="text-slate-600">{c.name}</span>
                    </div>
                    <span className="font-medium text-slate-900">{fmtCurrency(c.value)}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      ) : (
        /* List view */
        <Card padding="none">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Bill</th>
                  <th className="text-left px-3 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Entity</th>
                  <th className="text-left px-3 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Category</th>
                  <th className="text-right px-3 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Amount</th>
                  <th className="text-left px-3 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Frequency</th>
                  <th className="text-right px-3 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Monthly</th>
                  <th className="text-right px-3 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Due Day</th>
                  <th className="text-center px-3 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Auto-Pay</th>
                  <th className="px-3 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {bills.map((b) => {
                  const entity = entities.find((e) => e.id === b.entityId);
                  return (
                    <tr key={b.id} className={clsx('hover:bg-slate-50 transition-colors', !b.isActive && 'opacity-50')}>
                      <td className="px-5 py-3">
                        <p className="text-sm font-medium text-slate-900">{b.name}</p>
                        {b.vendor && <p className="text-xs text-slate-400">{b.vendor}</p>}
                      </td>
                      <td className="px-3 py-3 text-xs text-slate-500">{entity?.name.split(' ')[0]}</td>
                      <td className="px-3 py-3"><Badge variant="gray">{b.category}</Badge></td>
                      <td className="px-3 py-3 text-right text-sm font-semibold text-slate-900">{fmtCurrency(b.amount)}</td>
                      <td className="px-3 py-3 text-sm text-slate-600">{frequencyLabel(b.frequency)}</td>
                      <td className="px-3 py-3 text-right text-sm text-slate-500">{fmtCurrency(monthlyEquivalent(b.amount, b.frequency))}</td>
                      <td className="px-3 py-3 text-right text-sm text-slate-500">{fmtOrdinal(b.dueDay)}</td>
                      <td className="px-3 py-3 text-center">
                        {b.autoPay
                          ? <CheckCircle size={16} className="mx-auto text-emerald-500" />
                          : <Clock size={16} className="mx-auto text-slate-300" />}
                      </td>
                      <td className="px-3 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openEdit(b)} className="p-1.5 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors"><Edit2 size={13} /></button>
                          <button onClick={() => setDeleteId(b.id)} className="p-1.5 rounded hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"><Trash2 size={13} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Delete confirm */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Bill"
        footer={<><Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button><Button variant="danger" onClick={() => { deleteBill(deleteId!); setDeleteId(null); }}>Delete</Button></>}>
        <p className="text-sm text-slate-600">Delete "{bills.find((b) => b.id === deleteId)?.name}"?</p>
      </Modal>

      {/* Add/Edit */}
      <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Edit Bill' : 'Add Bill'} size="md"
        footer={<><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={handleSave} disabled={!form.name || !form.entityId}>Save Bill</Button></>}>
        <div className="space-y-4">
          <FormField label="Entity" required>
            <Select value={form.entityId} onChange={(e) => setForm({ ...form, entityId: e.target.value })}>
              <option value="">Select entity...</option>
              {entities.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
            </Select>
          </FormField>
          <FormField label="Bill Name" required>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Austin Energy Electric" />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Category">
              <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </Select>
            </FormField>
            <FormField label="Vendor">
              <Input value={form.vendor ?? ''} onChange={(e) => setForm({ ...form, vendor: e.target.value })} placeholder="Vendor name" />
            </FormField>
            <FormField label="Amount ($)" required>
              <Input type="number" min={0} step={0.01} value={form.amount || ''} onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })} />
            </FormField>
            <FormField label="Frequency">
              <Select value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value as BillFrequency })}>
                <option value="weekly">Weekly</option>
                <option value="biweekly">Bi-weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="semi-annual">Semi-Annual</option>
                <option value="annual">Annual</option>
                <option value="one-time">One-Time</option>
              </Select>
            </FormField>
            <FormField label="Due Day (1–31)">
              <Input type="number" min={1} max={31} value={form.dueDay} onChange={(e) => setForm({ ...form, dueDay: parseInt(e.target.value) || 1 })} />
            </FormField>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="autoPay" checked={form.autoPay} onChange={(e) => setForm({ ...form, autoPay: e.target.checked })} className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
            <label htmlFor="autoPay" className="text-sm text-slate-700">Auto-pay enabled</label>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="isActive" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
            <label htmlFor="isActive" className="text-sm text-slate-700">Active</label>
          </div>
        </div>
      </Modal>
    </div>
  );
}
