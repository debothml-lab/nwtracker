import { useState, useMemo, useRef } from 'react';
import { Upload, Search, FileText, Trash2, Download, Eye, Plus } from 'lucide-react';
import { useStore } from '../store/useStore';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal, FormField, Input, Select, Textarea } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { fmtDate, fmtFileSize } from '../utils/formatters';
import type { Document, DocumentType } from '../types';
import clsx from 'clsx';

const DOC_TYPE_LABELS: Record<string, string> = {
  statement: 'Statement', loan_doc: 'Loan Document', tax: 'Tax Document',
  contract: 'Contract', insurance: 'Insurance', report: 'Report', deed: 'Deed', other: 'Other',
};

const DOC_TYPE_COLORS: Record<string, string> = {
  statement: 'blue', loan_doc: 'purple', tax: 'red',
  contract: 'cyan', insurance: 'amber', report: 'green', deed: 'orange', other: 'gray',
};

const emptyDoc = (): Omit<Document, 'id' | 'uploadDate'> => ({
  entityId: '', name: '', type: 'statement', fileName: '', fileSize: 0,
  mimeType: 'application/pdf', description: '', tags: [], year: new Date().getFullYear(),
});

export function Documents() {
  const { documents, entities, addDocument, updateDocument, deleteDocument } = useStore();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Omit<Document, 'id' | 'uploadDate'>>(emptyDoc());
  const [search, setSearch] = useState('');
  const [entityFilter, setEntityFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [demoToast, setDemoToast] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const showDemoToast = (msg: string) => {
    setDemoToast(msg);
    setTimeout(() => setDemoToast(null), 3000);
  };

  const filtered = useMemo(() => {
    return documents.filter((d) => {
      if (entityFilter !== 'all' && d.entityId !== entityFilter) return false;
      if (typeFilter !== 'all' && d.type !== typeFilter) return false;
      if (search && !d.name.toLowerCase().includes(search.toLowerCase()) && !(d.tags ?? []).join(' ').toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    }).sort((a, b) => b.uploadDate.localeCompare(a.uploadDate));
  }, [documents, entityFilter, typeFilter, search]);

  const typeBreakdown = useMemo(() => {
    const g: Record<string, number> = {};
    for (const d of documents) g[d.type] = (g[d.type] ?? 0) + 1;
    return Object.entries(g).map(([type, count]) => ({ type, count }));
  }, [documents]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedFile(file);
    setForm((f) => ({
      ...f,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type || 'application/pdf',
      name: f.name || file.name.replace(/\.[^/.]+$/, ''),
    }));
    e.target.value = '';
  };

  const handleSave = () => {
    if (!form.name || !form.entityId) return;
    addDocument({
      ...form,
      id: `doc-${Date.now()}`,
      uploadDate: new Date().toISOString().split('T')[0],
    });
    setOpen(false);
    setUploadedFile(null);
    setForm({ ...emptyDoc(), entityId: entities[0]?.id ?? '' });
  };

  const openAdd = () => {
    setForm({ ...emptyDoc(), entityId: entities[0]?.id ?? '' });
    setUploadedFile(null);
    setOpen(true);
  };

  return (
    <div className="space-y-5 max-w-screen-xl mx-auto">
      {/* Demo toast */}
      {demoToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-800 text-white text-sm px-5 py-3 rounded-xl shadow-lg max-w-md text-center">
          {demoToast}
        </div>
      )}
      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Total Documents</p>
          <p className="text-2xl font-bold text-slate-900">{documents.length}</p>
        </div>
        {typeBreakdown.slice(0, 3).map((t) => (
          <div key={t.type} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">{DOC_TYPE_LABELS[t.type]}</p>
            <p className="text-2xl font-bold text-slate-900">{t.count}</p>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search documents..." className="pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-56" />
        </div>
        <select value={entityFilter} onChange={(e) => setEntityFilter(e.target.value)} className="px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="all">All Entities</option>
          {entities.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
        </select>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="all">All Types</option>
          {Object.entries(DOC_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <div className="ml-auto">
          <Button onClick={openAdd} size="sm"><Upload size={13} /> Upload Document</Button>
        </div>
      </div>

      {/* Document grid */}
      {filtered.length === 0 ? (
        <Card padding="lg" className="text-center">
          <FileText size={32} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500 text-sm">No documents found. Upload your first document.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((doc) => {
            const entity = entities.find((e) => e.id === doc.entityId);
            return (
              <div key={doc.id} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-4">
                <div className="flex items-start gap-3">
                  <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
                    doc.mimeType === 'application/pdf' ? 'bg-red-100' : 'bg-blue-100')}>
                    <FileText size={18} className={doc.mimeType === 'application/pdf' ? 'text-red-600' : 'text-blue-600'} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{doc.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5 truncate">{doc.fileName}</p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <Badge variant={DOC_TYPE_COLORS[doc.type] as any}>{DOC_TYPE_LABELS[doc.type]}</Badge>
                      {entity && (
                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entity.color }} />
                          {entity.name.split(' ')[0]}
                        </span>
                      )}
                      {doc.year && <span className="text-[10px] text-slate-400">{doc.year}</span>}
                    </div>
                  </div>
                  <button onClick={() => setDeleteId(doc.id)} className="p-1 rounded hover:bg-red-50 text-slate-300 hover:text-red-500 transition-colors flex-shrink-0">
                    <Trash2 size={14} />
                  </button>
                </div>

                {doc.description && (
                  <p className="text-xs text-slate-500 mt-3 border-t border-slate-100 pt-3">{doc.description}</p>
                )}

                {(doc.tags ?? []).length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {doc.tags!.map((tag) => (
                      <span key={tag} className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">#{tag}</span>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                  <span className="text-xs text-slate-400">
                    {fmtFileSize(doc.fileSize)} · Uploaded {fmtDate(doc.uploadDate)}
                  </span>
                  <div className="flex items-center gap-1">
                    <button onClick={() => showDemoToast(`Preview requires file storage backend — "${doc.fileName}" metadata saved.`)} className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors" title="Preview (requires backend)">
                      <Eye size={13} />
                    </button>
                    <button onClick={() => showDemoToast(`Download requires file storage backend — "${doc.fileName}" metadata saved.`)} className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors" title="Download (requires backend)">
                      <Download size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* AI parsing placeholder */}
      <Card padding="md" className="border-dashed border-slate-300 bg-slate-50/50">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
            <Eye size={18} className="text-purple-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-600">AI Document Parsing — Coming Soon</p>
            <p className="text-xs text-slate-400 mt-0.5">Auto-extract loan terms, account numbers, and payment schedules from uploaded PDFs.</p>
          </div>
          <Button variant="outline" size="sm" className="ml-auto" disabled>Enable AI Parse</Button>
        </div>
      </Card>

      {/* Delete confirm */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Document"
        footer={<><Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button><Button variant="danger" onClick={() => { deleteDocument(deleteId!); setDeleteId(null); }}>Delete</Button></>}>
        <p className="text-sm text-slate-600">Delete "{documents.find((d) => d.id === deleteId)?.name}"? This cannot be undone.</p>
      </Modal>

      {/* Upload modal */}
      <Modal open={open} onClose={() => setOpen(false)} title="Upload Document" size="md"
        footer={<><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={handleSave} disabled={!form.name || !form.entityId}>Save Document</Button></>}>
        <div className="space-y-4">
          {/* Drop zone */}
          <div
            className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-blue-400 transition-colors cursor-pointer"
            onClick={() => fileRef.current?.click()}
          >
            <input type="file" accept=".pdf,.doc,.docx,.jpg,.png,.csv" ref={fileRef} className="hidden" onChange={handleFileSelect} />
            {uploadedFile ? (
              <div className="flex items-center justify-center gap-2">
                <FileText size={20} className="text-blue-600" />
                <div className="text-left">
                  <p className="text-sm font-medium text-slate-900">{uploadedFile.name}</p>
                  <p className="text-xs text-slate-400">{fmtFileSize(uploadedFile.size)}</p>
                </div>
              </div>
            ) : (
              <>
                <Upload size={24} className="mx-auto text-slate-300 mb-2" />
                <p className="text-sm text-slate-500">Click to select file</p>
                <p className="text-xs text-slate-400 mt-1">PDF, DOC, DOCX, JPG, PNG, CSV</p>
              </>
            )}
          </div>

          <FormField label="Entity" required>
            <Select value={form.entityId} onChange={(e) => setForm({ ...form, entityId: e.target.value })}>
              <option value="">Select entity...</option>
              {entities.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
            </Select>
          </FormField>
          <FormField label="Document Name" required>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Chase Mortgage Statement Apr 2025" />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Document Type">
              <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as DocumentType })}>
                {Object.entries(DOC_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </Select>
            </FormField>
            <FormField label="Year">
              <Input type="number" min={2000} max={2099} value={form.year ?? ''} onChange={(e) => setForm({ ...form, year: parseInt(e.target.value) || undefined })} placeholder="2025" />
            </FormField>
          </div>
          <FormField label="Description">
            <Textarea value={form.description ?? ''} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Brief description or notes..." />
          </FormField>
          <FormField label="Tags (comma-separated)">
            <Input
              value={(form.tags ?? []).join(', ')}
              onChange={(e) => setForm({ ...form, tags: e.target.value.split(',').map((t) => t.trim()).filter(Boolean) })}
              placeholder="mortgage, chase, 2025"
            />
          </FormField>
        </div>
      </Modal>
    </div>
  );
}
