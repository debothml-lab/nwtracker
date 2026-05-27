import { useState, useMemo } from 'react';
import { Plus, Edit2, Trash2, Search, TrendingUp } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { useStore } from '../store/useStore';
import { Card, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal, FormField, Input, Select, Textarea } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { fmtCurrency, fmtDate, entityTypeLabel } from '../utils/formatters';
import type { Asset, AssetType } from '../types';
import clsx from 'clsx';

const ASSET_TYPE_COLORS: Record<string, string> = {
  real_estate: '#3B82F6', vehicle: '#F59E0B', bank_account: '#10B981',
  investment: '#8B5CF6', retirement: '#06B6D4', equipment: '#F97316',
  receivable: '#EC4899', other: '#94A3B8',
};

const ASSET_TYPE_LABELS: Record<string, string> = {
  real_estate: 'Real Estate', vehicle: 'Vehicle', bank_account: 'Bank Account',
  investment: 'Investment', retirement: 'Retirement', equipment: 'Equipment',
  receivable: 'Receivable', other: 'Other',
};

const emptyAsset = (): Omit<Asset, 'id' | 'lastUpdated'> => ({
  entityId: '', name: '', type: 'bank_account', value: 0,
  purchasePrice: undefined, purchaseDate: '', description: '', accountNumber: '', institution: '',
});

export function Assets() {
  const { assets, entities, addAsset, updateAsset, deleteAsset, selectedEntityId } = useStore();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Asset | null>(null);
  const [form, setForm] = useState<Omit<Asset, 'id' | 'lastUpdated'>>(emptyAsset());
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [entityFilter, setEntityFilter] = useState<string>(selectedEntityId ?? 'all');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return assets.filter((a) => {
      if (entityFilter !== 'all' && a.entityId !== entityFilter) return false;
      if (typeFilter !== 'all' && a.type !== typeFilter) return false;
      if (search && !a.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [assets, entityFilter, typeFilter, search]);

  const totalValue = filtered.reduce((s, a) => s + a.value, 0);

  const typeBreakdown = useMemo(() => {
    const g: Record<string, number> = {};
    for (const a of filtered) g[a.type] = (g[a.type] ?? 0) + a.value;
    return Object.entries(g).map(([type, value]) => ({ type, value, label: ASSET_TYPE_LABELS[type] ?? type }));
  }, [filtered]);

  const openAdd = () => {
    setEditing(null);
    setForm({ ...emptyAsset(), entityId: entities[0]?.id ?? '' });
    setOpen(true);
  };

  const openEdit = (a: Asset) => {
    setEditing(a);
    setForm({ entityId: a.entityId, name: a.name, type: a.type, value: a.value, purchasePrice: a.purchasePrice, purchaseDate: a.purchaseDate ?? '', description: a.description ?? '', accountNumber: a.accountNumber ?? '', institution: a.institution ?? '' });
    setOpen(true);
  };

  const handleSave = () => {
    if (!form.name || !form.entityId) return;
    if (editing) {
      updateAsset(editing.id, { ...form, lastUpdated: new Date().toISOString().split('T')[0] });
    } else {
      addAsset({ ...form, id: `ast-${Date.now()}`, lastUpdated: new Date().toISOString().split('T')[0] });
    }
    setOpen(false);
  };

  const grouped = useMemo(() => {
    const g: Record<string, Asset[]> = {};
    for (const a of filtered) {
      const entity = entities.find((e) => e.id === a.entityId)?.name ?? 'Unknown';
      g[entity] = [...(g[entity] ?? []), a];
    }
    return g;
  }, [filtered, entities]);

  return (
    <div className="space-y-5 max-w-screen-xl mx-auto">
      {/* Summary row */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-3 bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Total Assets</p>
              <p className="text-3xl font-bold text-slate-900">{fmtCurrency(totalValue)}</p>
            </div>
            <Button onClick={openAdd} size="sm"><Plus size={14} /> Add Asset</Button>
          </div>
          <div className="flex flex-wrap gap-3">
            {typeBreakdown.map((t) => (
              <div key={t.type} className="flex items-center gap-1.5 bg-slate-50 rounded-lg px-3 py-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ASSET_TYPE_COLORS[t.type] }} />
                <span className="text-xs text-slate-600">{t.label}</span>
                <span className="text-xs font-semibold text-slate-900">{fmtCurrency(t.value, true)}</span>
              </div>
            ))}
          </div>
        </div>
        <Card padding="md">
          <CardHeader title="By Type" />
          <ResponsiveContainer width="100%" height={120}>
            <PieChart>
              <Pie data={typeBreakdown} dataKey="value" cx="50%" cy="50%" outerRadius={55} paddingAngle={2}>
                {typeBreakdown.map((t) => (
                  <Cell key={t.type} fill={ASSET_TYPE_COLORS[t.type] ?? '#94a3b8'} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => fmtCurrency(v, true)} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search assets..."
            className="pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-56"
          />
        </div>
        <select value={entityFilter} onChange={(e) => setEntityFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
          <option value="all">All Entities</option>
          {entities.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
        </select>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
          <option value="all">All Types</option>
          {Object.entries(ASSET_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <span className="text-sm text-slate-500">{filtered.length} assets</span>
      </div>

      {/* Assets table grouped by entity */}
      {Object.entries(grouped).map(([entityName, entityAssets]) => (
        <Card key={entityName} padding="none">
          <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-700">{entityName}</span>
            <span className="text-sm font-bold text-slate-900">{fmtCurrency(entityAssets.reduce((s, a) => s + a.value, 0))}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Asset</th>
                  <th className="text-left px-3 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Type</th>
                  <th className="text-right px-3 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Current Value</th>
                  <th className="text-right px-3 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Purchase Price</th>
                  <th className="text-right px-3 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Gain/Loss</th>
                  <th className="text-right px-3 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Last Updated</th>
                  <th className="px-3 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {entityAssets.map((asset) => {
                  const gain = asset.purchasePrice ? asset.value - asset.purchasePrice : null;
                  return (
                    <tr key={asset.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: ASSET_TYPE_COLORS[asset.type] }} />
                          <div>
                            <p className="text-sm font-medium text-slate-900">{asset.name}</p>
                            {asset.institution && <p className="text-xs text-slate-400">{asset.institution} {asset.accountNumber}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <Badge variant="gray" size="sm">{ASSET_TYPE_LABELS[asset.type]}</Badge>
                      </td>
                      <td className="px-3 py-3 text-right">
                        <span className="text-sm font-semibold text-slate-900">{fmtCurrency(asset.value)}</span>
                      </td>
                      <td className="px-3 py-3 text-right text-sm text-slate-500">
                        {asset.purchasePrice ? fmtCurrency(asset.purchasePrice) : '—'}
                      </td>
                      <td className="px-3 py-3 text-right">
                        {gain !== null ? (
                          <span className={clsx('text-sm font-medium', gain >= 0 ? 'text-emerald-600' : 'text-red-600')}>
                            {gain >= 0 ? '+' : ''}{fmtCurrency(gain, true)}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-3 py-3 text-right text-xs text-slate-400">
                        {fmtDate(asset.lastUpdated)}
                      </td>
                      <td className="px-3 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openEdit(asset)} className="p-1.5 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors">
                            <Edit2 size={13} />
                          </button>
                          <button onClick={() => setDeleteId(asset.id)} className="p-1.5 rounded hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      ))}

      {filtered.length === 0 && (
        <Card padding="lg" className="text-center">
          <TrendingUp size={32} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500 text-sm">No assets found. Add your first asset to get started.</p>
        </Card>
      )}

      {/* Delete confirm */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Asset"
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="danger" onClick={() => { deleteAsset(deleteId!); setDeleteId(null); }}>Delete</Button>
          </>
        }>
        <p className="text-sm text-slate-600">Are you sure you want to delete "{assets.find((a) => a.id === deleteId)?.name}"? This cannot be undone.</p>
      </Modal>

      {/* Add/Edit modal */}
      <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Edit Asset' : 'Add Asset'} size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!form.name || !form.entityId}>Save Asset</Button>
          </>
        }>
        <div className="space-y-4">
          <FormField label="Entity" required>
            <Select value={form.entityId} onChange={(e) => setForm({ ...form, entityId: e.target.value })}>
              <option value="">Select entity...</option>
              {entities.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
            </Select>
          </FormField>
          <FormField label="Asset Name" required>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Chase Checking Account" />
          </FormField>
          <FormField label="Asset Type" required>
            <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as AssetType })}>
              {Object.entries(ASSET_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </Select>
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Current Value ($)" required>
              <Input type="number" min={0} step={0.01} value={form.value || ''} onChange={(e) => setForm({ ...form, value: parseFloat(e.target.value) || 0 })} placeholder="0.00" />
            </FormField>
            <FormField label="Purchase Price ($)">
              <Input type="number" min={0} step={0.01} value={form.purchasePrice ?? ''} onChange={(e) => setForm({ ...form, purchasePrice: e.target.value ? parseFloat(e.target.value) : undefined })} placeholder="0.00" />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Institution">
              <Input value={form.institution ?? ''} onChange={(e) => setForm({ ...form, institution: e.target.value })} placeholder="Chase Bank" />
            </FormField>
            <FormField label="Account Number">
              <Input value={form.accountNumber ?? ''} onChange={(e) => setForm({ ...form, accountNumber: e.target.value })} placeholder="****1234" />
            </FormField>
          </div>
          <FormField label="Purchase Date">
            <Input type="date" value={form.purchaseDate ?? ''} onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })} />
          </FormField>
          <FormField label="Description">
            <Textarea value={form.description ?? ''} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Additional notes..." />
          </FormField>
        </div>
      </Modal>
    </div>
  );
}
