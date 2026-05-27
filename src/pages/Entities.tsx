import { useState } from 'react';
import { Plus, Edit2, Trash2, Building2, TrendingUp } from 'lucide-react';
import { useStore } from '../store/useStore';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal, FormField, Input, Select, Textarea } from '../components/ui/Modal';
import { entityTypeBadge } from '../components/ui/Badge';
import { totalAssets, totalLiabilities, netWorth } from '../utils/calculations';
import { fmtCurrency } from '../utils/formatters';
import type { Entity, EntityType } from '../types';
import clsx from 'clsx';

const ENTITY_COLORS = ['#3B82F6', '#8B5CF6', '#06B6D4', '#F59E0B', '#10B981', '#EF4444', '#EC4899'];

const emptyEntity: Omit<Entity, 'id' | 'createdAt'> = {
  name: '', type: 'personal', description: '', taxId: '', address: '', color: '#3B82F6'
};

export function Entities() {
  const { entities, assets, liabilities, addEntity, updateEntity, deleteEntity } = useStore();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Entity | null>(null);
  const [form, setForm] = useState(emptyEntity);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const openAdd = () => { setEditing(null); setForm(emptyEntity); setOpen(true); };
  const openEdit = (e: Entity) => { setEditing(e); setForm({ name: e.name, type: e.type, description: e.description ?? '', taxId: e.taxId ?? '', address: e.address ?? '', color: e.color }); setOpen(true); };

  const handleSave = () => {
    if (!form.name) return;
    if (editing) {
      updateEntity(editing.id, form);
    } else {
      addEntity({ ...form, id: `ent-${Date.now()}`, createdAt: new Date().toISOString().split('T')[0] });
    }
    setOpen(false);
  };

  return (
    <div className="space-y-5 max-w-screen-xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">{entities.length} entities tracked</p>
        </div>
        <Button onClick={openAdd} size="sm">
          <Plus size={14} /> Add Entity
        </Button>
      </div>

      {/* Entity cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-5">
        {entities.map((entity) => {
          const eAssets = totalAssets(assets, entity.id);
          const eLiab = totalLiabilities(liabilities, entity.id);
          const eNW = netWorth(assets, liabilities, entity.id);
          const assetsList = assets.filter((a) => a.entityId === entity.id);
          const liabList = liabilities.filter((l) => l.entityId === entity.id);

          return (
            <Card key={entity.id} padding="none" className="overflow-hidden">
              {/* Color bar */}
              <div className="h-1.5 w-full" style={{ backgroundColor: entity.color }} />
              <div className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white flex-shrink-0"
                      style={{ backgroundColor: entity.color }}>
                      <Building2 size={20} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">{entity.name}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        {entityTypeBadge(entity.type)}
                        {entity.taxId && <span className="text-xs text-slate-400">{entity.taxId}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEdit(entity)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => setDeleteConfirm(entity.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {entity.description && (
                  <p className="text-xs text-slate-500 mb-4">{entity.description}</p>
                )}

                {/* Metrics */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-0.5">Assets</p>
                    <p className="text-sm font-bold text-slate-900">{fmtCurrency(eAssets, true)}</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-0.5">Liabilities</p>
                    <p className="text-sm font-bold text-red-600">{fmtCurrency(eLiab, true)}</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-0.5">Net Worth</p>
                    <p className={clsx('text-sm font-bold', eNW >= 0 ? 'text-emerald-600' : 'text-red-600')}>
                      {fmtCurrency(eNW, true)}
                    </p>
                  </div>
                </div>

                {/* Counts */}
                <div className="flex items-center gap-4 text-xs text-slate-400">
                  <span>{assetsList.length} assets</span>
                  <span>{liabList.length} liabilities</span>
                  {entity.address && <span className="truncate">{entity.address.split(',').slice(-2).join(',').trim()}</span>}
                </div>
              </div>
            </Card>
          );
        })}

        {/* Add new card */}
        <button
          onClick={openAdd}
          className="border-2 border-dashed border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center gap-3 hover:border-blue-300 hover:bg-blue-50/50 transition-colors group"
        >
          <div className="w-10 h-10 rounded-xl bg-slate-100 group-hover:bg-blue-100 flex items-center justify-center transition-colors">
            <Plus size={20} className="text-slate-400 group-hover:text-blue-600" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-slate-500 group-hover:text-blue-600">Add Entity</p>
            <p className="text-xs text-slate-400 mt-0.5">Personal, LLC, Business, Rental</p>
          </div>
        </button>
      </div>

      {/* Summary bar */}
      <Card padding="md" className="bg-navy-900 border-navy-800">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <TrendingUp size={20} className="text-blue-400" />
            <span className="text-white font-semibold">Portfolio Summary</span>
          </div>
          <div className="flex items-center gap-8">
            <div className="text-center">
              <p className="text-xs text-slate-400">Total Assets</p>
              <p className="text-lg font-bold text-emerald-400">{fmtCurrency(totalAssets(assets), true)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-400">Total Liabilities</p>
              <p className="text-lg font-bold text-red-400">{fmtCurrency(totalLiabilities(liabilities), true)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-400">Net Worth</p>
              <p className="text-2xl font-bold text-white">{fmtCurrency(netWorth(assets, liabilities), true)}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Delete confirm */}
      {deleteConfirm && (
        <Modal open title="Delete Entity" onClose={() => setDeleteConfirm(null)}
          footer={
            <>
              <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
              <Button variant="danger" onClick={() => { deleteEntity(deleteConfirm); setDeleteConfirm(null); }}>Delete</Button>
            </>
          }>
          <p className="text-sm text-slate-600">
            Are you sure you want to delete "{entities.find((e) => e.id === deleteConfirm)?.name}"?
            This will not delete associated assets or liabilities.
          </p>
        </Modal>
      )}

      {/* Add/Edit modal */}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? 'Edit Entity' : 'Add Entity'}
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!form.name}>Save Entity</Button>
          </>
        }
      >
        <div className="space-y-4">
          <FormField label="Entity Name" required>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Johnson Properties LLC" />
          </FormField>
          <FormField label="Entity Type" required>
            <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as EntityType })}>
              <option value="personal">Personal Household</option>
              <option value="llc">LLC</option>
              <option value="business">Business</option>
              <option value="rental_property">Rental Property</option>
            </Select>
          </FormField>
          <FormField label="Color">
            <div className="flex items-center gap-2 flex-wrap">
              {ENTITY_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setForm({ ...form, color: c })}
                  className={clsx('w-7 h-7 rounded-full border-2 transition-all', form.color === c ? 'border-slate-900 scale-110' : 'border-transparent')}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </FormField>
          <FormField label="Tax ID / EIN">
            <Input value={form.taxId} onChange={(e) => setForm({ ...form, taxId: e.target.value })} placeholder="XX-XXXXXXX" />
          </FormField>
          <FormField label="Address">
            <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="123 Main St, Austin, TX 78701" />
          </FormField>
          <FormField label="Description">
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Brief description..." />
          </FormField>
        </div>
      </Modal>
    </div>
  );
}
