import { useState, useMemo, useRef } from 'react';
import Papa from 'papaparse';
import {
  Upload, Search, Filter, Tag, CheckCircle, AlertCircle,
  Trash2, Edit2, Plus, ChevronRight, Settings, X
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { Card, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal, FormField, Input, Select } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { fmtCurrency, fmtDate } from '../utils/formatters';
import type { Transaction, CategoryRule } from '../types';
import clsx from 'clsx';

const CATEGORIES = [
  'Income', 'Housing', 'Utilities', 'Groceries', 'Food & Dining', 'Transportation',
  'Insurance', 'Healthcare', 'Entertainment', 'Shopping', 'Subscriptions',
  'Debt Payment', 'Savings', 'Transfer', 'Taxes', 'Payroll', 'Revenue',
  'Cost of Goods', 'Marketing', 'Professional Services', 'Other',
];

const ACCOUNT_TYPES = ['checking', 'savings', 'credit', 'business'];

// ─── CSV Upload Wizard ──────────────────────────────────────────────────────
type CSVRow = Record<string, string>;

interface ImportState {
  step: 'upload' | 'map' | 'review';
  rows: CSVRow[];
  headers: string[];
  dateCol: string;
  descCol: string;
  amountCol: string;
  typeCol: string;
  entityId: string;
  accountName: string;
  mapped: Transaction[];
}

function parseType(val: string, amount: number): 'debit' | 'credit' {
  const v = val?.toLowerCase();
  if (v === 'credit' || v === 'deposit' || v === 'cr') return 'credit';
  if (v === 'debit' || v === 'withdrawal' || v === 'dr') return 'debit';
  return amount >= 0 ? 'credit' : 'debit';
}

export function Transactions() {
  const { transactions, entities, categoryRules, addTransactions, updateTransaction, deleteTransaction,
    categorizeTransaction, bulkCategorize, markReviewed, applyRulesToTransactions,
    addCategoryRule, updateCategoryRule, deleteCategoryRule } = useStore();

  const [search, setSearch] = useState('');
  const [entityFilter, setEntityFilter] = useState('all');
  const [catFilter, setCatFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [reviewFilter, setReviewFilter] = useState('all');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkCat, setBulkCat] = useState('');
  const [editTx, setEditTx] = useState<Transaction | null>(null);
  const [showRules, setShowRules] = useState(false);
  const [ruleForm, setRuleForm] = useState<Partial<CategoryRule>>({});
  const [importState, setImportState] = useState<ImportState | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [page, setPage] = useState(1);
  const PER_PAGE = 25;

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      if (entityFilter !== 'all' && t.entityId !== entityFilter) return false;
      if (catFilter !== 'all' && (t.category ?? 'Uncategorized') !== catFilter) return false;
      if (typeFilter !== 'all' && t.type !== typeFilter) return false;
      if (reviewFilter === 'unreviewed' && t.reviewed) return false;
      if (reviewFilter === 'reviewed' && !t.reviewed) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!t.description.toLowerCase().includes(q) && !(t.category ?? '').toLowerCase().includes(q)) return false;
      }
      return true;
    }).sort((a, b) => b.date.localeCompare(a.date));
  }, [transactions, entityFilter, catFilter, typeFilter, reviewFilter, search]);

  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const totalPages = Math.ceil(filtered.length / PER_PAGE);

  const totalCredits = filtered.filter((t) => t.type === 'credit').reduce((s, t) => s + t.amount, 0);
  const totalDebits = filtered.filter((t) => t.type === 'debit').reduce((s, t) => s + t.amount, 0);
  const unreviewedCount = transactions.filter((t) => !t.reviewed).length;

  const toggleSelect = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
  };

  const handleCSVFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    Papa.parse<CSVRow>(file, {
      header: true, skipEmptyLines: true,
      complete: (results) => {
        const headers = results.meta.fields ?? [];
        setImportState({
          step: 'map', rows: results.data, headers,
          dateCol: headers.find((h) => /date/i.test(h)) ?? headers[0],
          descCol: headers.find((h) => /desc|memo|name/i.test(h)) ?? headers[1],
          amountCol: headers.find((h) => /amount|amt/i.test(h)) ?? headers[2],
          typeCol: headers.find((h) => /type|dr|cr/i.test(h)) ?? '',
          entityId: entities[0]?.id ?? '',
          accountName: '',
          mapped: [],
        });
      },
    });
    e.target.value = '';
  };

  const buildMapped = (state: ImportState): Transaction[] => {
    return state.rows.map((row, i) => {
      const amount = Math.abs(parseFloat(row[state.amountCol] ?? '0') || 0);
      const rawType = row[state.typeCol] ?? '';
      const rawAmount = parseFloat(row[state.amountCol] ?? '0');
      const type = parseType(rawType, rawAmount);
      return {
        id: `csv-${Date.now()}-${i}`,
        entityId: state.entityId,
        date: row[state.dateCol] ?? '',
        description: row[state.descCol] ?? '',
        originalDescription: row[state.descCol] ?? '',
        amount,
        type,
        account: state.accountName || undefined,
        accountType: 'checking' as const,
        reviewed: false,
        importBatchId: `batch-${Date.now()}`,
      };
    });
  };

  const confirmImport = () => {
    if (!importState) return;
    addTransactions(importState.mapped);
    setImportState(null);
  };

  return (
    <div className="space-y-5 max-w-screen-xl mx-auto">
      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Total Transactions</p>
          <p className="text-2xl font-bold text-slate-900">{filtered.length}</p>
          <p className="text-xs text-slate-400">{transactions.length} total</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Total In</p>
          <p className="text-2xl font-bold text-emerald-600">{fmtCurrency(totalCredits, true)}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Total Out</p>
          <p className="text-2xl font-bold text-red-600">{fmtCurrency(totalDebits, true)}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Unreviewed</p>
          <p className={clsx('text-2xl font-bold', unreviewedCount > 0 ? 'text-amber-600' : 'text-emerald-600')}>{unreviewedCount}</p>
          <p className="text-xs text-slate-400">need categorization</p>
        </div>
      </div>

      {/* Action bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search transactions..." className="pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-56" />
        </div>
        <select value={entityFilter} onChange={(e) => { setEntityFilter(e.target.value); setPage(1); }} className="px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="all">All Entities</option>
          {entities.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
        </select>
        <select value={catFilter} onChange={(e) => { setCatFilter(e.target.value); setPage(1); }} className="px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="all">All Categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          <option value="Uncategorized">Uncategorized</option>
        </select>
        <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }} className="px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="all">All Types</option>
          <option value="credit">Credits</option>
          <option value="debit">Debits</option>
        </select>
        <select value={reviewFilter} onChange={(e) => { setReviewFilter(e.target.value); setPage(1); }} className="px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="all">All</option>
          <option value="unreviewed">Unreviewed</option>
          <option value="reviewed">Reviewed</option>
        </select>

        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => { applyRulesToTransactions(); }}>
            <Tag size={13} /> Auto-Categorize
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowRules(true)}>
            <Settings size={13} /> Rules
          </Button>
          <input type="file" accept=".csv" ref={fileRef} className="hidden" onChange={handleCSVFile} />
          <Button size="sm" onClick={() => fileRef.current?.click()}>
            <Upload size={13} /> Import CSV
          </Button>
        </div>
      </div>

      {/* Bulk actions */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
          <span className="text-sm font-medium text-blue-800">{selected.size} selected</span>
          <select value={bulkCat} onChange={(e) => setBulkCat(e.target.value)} className="px-3 py-1.5 text-sm border border-blue-300 rounded-lg bg-white focus:outline-none">
            <option value="">Assign category...</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <Button size="sm" disabled={!bulkCat} onClick={() => { bulkCategorize([...selected], bulkCat); setSelected(new Set()); setBulkCat(''); }}>
            Apply
          </Button>
          <button onClick={() => setSelected(new Set())} className="ml-auto text-blue-600 hover:text-blue-800">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Transaction table */}
      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-4 py-3 w-8">
                  <input type="checkbox" onChange={(e) => {
                    if (e.target.checked) setSelected(new Set(paginated.map((t) => t.id)));
                    else setSelected(new Set());
                  }} checked={selected.size === paginated.length && paginated.length > 0} className="w-4 h-4 rounded border-slate-300 text-blue-600" />
                </th>
                <th className="text-left px-3 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Date</th>
                <th className="text-left px-3 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Description</th>
                <th className="text-left px-3 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Entity</th>
                <th className="text-left px-3 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Category</th>
                <th className="text-left px-3 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Account</th>
                <th className="text-right px-3 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Amount</th>
                <th className="text-center px-3 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Status</th>
                <th className="px-3 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paginated.map((tx) => {
                const entity = entities.find((e) => e.id === tx.entityId);
                return (
                  <tr key={tx.id} className={clsx('hover:bg-slate-50 transition-colors', selected.has(tx.id) && 'bg-blue-50')}>
                    <td className="px-4 py-3">
                      <input type="checkbox" checked={selected.has(tx.id)} onChange={() => toggleSelect(tx.id)} className="w-4 h-4 rounded border-slate-300 text-blue-600" />
                    </td>
                    <td className="px-3 py-3 text-xs text-slate-500 whitespace-nowrap">{fmtDate(tx.date)}</td>
                    <td className="px-3 py-3">
                      <p className="text-sm text-slate-900 max-w-[220px] truncate">{tx.description}</p>
                      {tx.notes && <p className="text-xs text-slate-400">{tx.notes}</p>}
                    </td>
                    <td className="px-3 py-3">
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: entity?.color }} />
                        {entity?.name.split(' ')[0]}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <select
                        value={tx.category ?? ''}
                        onChange={(e) => categorizeTransaction(tx.id, e.target.value)}
                        className="text-xs border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-1 py-0.5 text-slate-700 cursor-pointer hover:bg-slate-100"
                      >
                        <option value="">Uncategorized</option>
                        {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </td>
                    <td className="px-3 py-3 text-xs text-slate-400">{tx.account ?? '—'}</td>
                    <td className="px-3 py-3 text-right">
                      <span className={clsx('text-sm font-semibold', tx.type === 'credit' ? 'text-emerald-600' : 'text-slate-900')}>
                        {tx.type === 'credit' ? '+' : '−'}{fmtCurrency(tx.amount)}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      {tx.reviewed
                        ? <CheckCircle size={14} className="mx-auto text-emerald-500" />
                        : <button onClick={() => markReviewed(tx.id)}><AlertCircle size={14} className="mx-auto text-amber-500 hover:text-amber-700" /></button>}
                    </td>
                    <td className="px-3 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => setEditTx(tx)} className="p-1.5 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors"><Edit2 size={13} /></button>
                        <button onClick={() => deleteTransaction(tx.id)} className="p-1.5 rounded hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100">
            <span className="text-xs text-slate-500">{filtered.length} transactions · Page {page} of {totalPages}</span>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="xs" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</Button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                return (
                  <button key={p} onClick={() => setPage(p)} className={clsx('w-7 h-7 text-xs rounded font-medium', p === page ? 'bg-blue-600 text-white' : 'hover:bg-slate-100 text-slate-600')}>
                    {p}
                  </button>
                );
              })}
              <Button variant="ghost" size="xs" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
            </div>
          </div>
        )}
      </Card>

      {/* Plaid placeholder */}
      <Card padding="md" className="border-dashed border-slate-300 bg-slate-50/50">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-slate-200 rounded-xl flex items-center justify-center">
            <Upload size={18} className="text-slate-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-600">Plaid Bank Sync — Coming Soon</p>
            <p className="text-xs text-slate-400 mt-0.5">Connect your bank accounts for automatic transaction import. Manual CSV import is available now.</p>
          </div>
          <Button variant="outline" size="sm" className="ml-auto" disabled>Connect Plaid</Button>
        </div>
      </Card>

      {/* CSV Import wizard */}
      {importState && importState.step === 'map' && (
        <Modal open title="Map CSV Columns" size="lg" onClose={() => setImportState(null)}
          footer={
            <>
              <Button variant="outline" onClick={() => setImportState(null)}>Cancel</Button>
              <Button onClick={() => {
                const mapped = buildMapped(importState);
                setImportState({ ...importState, step: 'review', mapped });
              }}>Preview Transactions</Button>
            </>
          }>
          <div className="space-y-4">
            <p className="text-sm text-slate-600">Found {importState.rows.length} rows with {importState.headers.length} columns. Map each field:</p>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Date Column" required>
                <Select value={importState.dateCol} onChange={(e) => setImportState({ ...importState, dateCol: e.target.value })}>
                  {importState.headers.map((h) => <option key={h} value={h}>{h}</option>)}
                </Select>
              </FormField>
              <FormField label="Description Column" required>
                <Select value={importState.descCol} onChange={(e) => setImportState({ ...importState, descCol: e.target.value })}>
                  {importState.headers.map((h) => <option key={h} value={h}>{h}</option>)}
                </Select>
              </FormField>
              <FormField label="Amount Column" required>
                <Select value={importState.amountCol} onChange={(e) => setImportState({ ...importState, amountCol: e.target.value })}>
                  {importState.headers.map((h) => <option key={h} value={h}>{h}</option>)}
                </Select>
              </FormField>
              <FormField label="Type Column (optional)">
                <Select value={importState.typeCol} onChange={(e) => setImportState({ ...importState, typeCol: e.target.value })}>
                  <option value="">Not in file (auto-detect)</option>
                  {importState.headers.map((h) => <option key={h} value={h}>{h}</option>)}
                </Select>
              </FormField>
              <FormField label="Assign to Entity" required>
                <Select value={importState.entityId} onChange={(e) => setImportState({ ...importState, entityId: e.target.value })}>
                  {entities.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
                </Select>
              </FormField>
              <FormField label="Account Name">
                <Input value={importState.accountName} onChange={(e) => setImportState({ ...importState, accountName: e.target.value })} placeholder="e.g. Chase Checking (...4821)" />
              </FormField>
            </div>
            {/* Sample */}
            <div className="bg-slate-50 rounded-lg p-3 overflow-x-auto">
              <p className="text-xs font-medium text-slate-500 mb-2 uppercase tracking-wide">Sample (first 3 rows)</p>
              <table className="text-xs">
                <thead>
                  <tr>{importState.headers.map((h) => <th key={h} className="px-2 py-1 text-left text-slate-500 font-medium">{h}</th>)}</tr>
                </thead>
                <tbody>
                  {importState.rows.slice(0, 3).map((row, i) => (
                    <tr key={i}>{importState.headers.map((h) => <td key={h} className="px-2 py-1 text-slate-700">{row[h]}</td>)}</tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Modal>
      )}

      {importState && importState.step === 'review' && (
        <Modal open title="Review Transactions Before Import" size="2xl" onClose={() => setImportState(null)}
          footer={<><Button variant="outline" onClick={() => setImportState({ ...importState, step: 'map' })}>Back</Button><Button onClick={confirmImport}>Import {importState.mapped.length} Transactions</Button></>}>
          <p className="text-sm text-slate-600 mb-3">Review parsed transactions. Categories will be applied automatically after import based on your rules.</p>
          <div className="overflow-x-auto max-h-96 border border-slate-200 rounded-lg">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-slate-500">Date</th>
                  <th className="px-3 py-2 text-left font-medium text-slate-500">Description</th>
                  <th className="px-3 py-2 text-right font-medium text-slate-500">Amount</th>
                  <th className="px-3 py-2 text-left font-medium text-slate-500">Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {importState.mapped.slice(0, 100).map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50">
                    <td className="px-3 py-1.5 text-slate-500">{t.date}</td>
                    <td className="px-3 py-1.5 text-slate-700 max-w-[250px] truncate">{t.description}</td>
                    <td className={clsx('px-3 py-1.5 text-right font-medium', t.type === 'credit' ? 'text-emerald-600' : 'text-slate-900')}>
                      {t.type === 'credit' ? '+' : '−'}{fmtCurrency(t.amount)}
                    </td>
                    <td className="px-3 py-1.5">
                      <Badge variant={t.type === 'credit' ? 'green' : 'gray'}>{t.type}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {importState.mapped.length > 100 && <p className="text-xs text-slate-400 mt-2">Showing first 100 of {importState.mapped.length} rows</p>}
        </Modal>
      )}

      {/* Category Rules */}
      <Modal open={showRules} onClose={() => setShowRules(false)} title="Category Rules" subtitle="Rules auto-categorize imported transactions" size="xl">
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => setRuleForm({ matchType: 'contains', priority: 5, isActive: true })}>
              <Plus size={13} /> Add Rule
            </Button>
          </div>

          {ruleForm.matchType !== undefined && (
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 grid grid-cols-2 gap-3">
              <FormField label="Rule Name">
                <Input value={ruleForm.name ?? ''} onChange={(e) => setRuleForm({ ...ruleForm, name: e.target.value })} placeholder="Whole Foods Grocery" />
              </FormField>
              <FormField label="Match Type">
                <Select value={ruleForm.matchType} onChange={(e) => setRuleForm({ ...ruleForm, matchType: e.target.value as CategoryRule['matchType'] })}>
                  <option value="contains">Contains</option>
                  <option value="starts_with">Starts With</option>
                  <option value="ends_with">Ends With</option>
                  <option value="exact">Exact</option>
                </Select>
              </FormField>
              <FormField label="Match Value">
                <Input value={ruleForm.matchValue ?? ''} onChange={(e) => setRuleForm({ ...ruleForm, matchValue: e.target.value })} placeholder="WHOLE FOODS" />
              </FormField>
              <FormField label="Assign Category">
                <Select value={ruleForm.category ?? ''} onChange={(e) => setRuleForm({ ...ruleForm, category: e.target.value })}>
                  <option value="">Select...</option>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </Select>
              </FormField>
              <div className="col-span-2 flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setRuleForm({})}>Cancel</Button>
                <Button size="sm" onClick={() => {
                  if (!ruleForm.name || !ruleForm.matchValue || !ruleForm.category) return;
                  addCategoryRule({ ...ruleForm as CategoryRule, id: `rule-${Date.now()}` });
                  setRuleForm({});
                }}>Save Rule</Button>
              </div>
            </div>
          )}

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">Rule Name</th>
                  <th className="px-3 py-2.5 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">Match</th>
                  <th className="px-3 py-2.5 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">Category</th>
                  <th className="px-3 py-2.5 text-center text-xs font-medium text-slate-500 uppercase tracking-wide">Priority</th>
                  <th className="px-3 py-2.5 text-center text-xs font-medium text-slate-500 uppercase tracking-wide">Active</th>
                  <th className="px-3 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {categoryRules.map((rule) => (
                  <tr key={rule.id} className={clsx('hover:bg-slate-50', !rule.isActive && 'opacity-50')}>
                    <td className="px-4 py-2.5 font-medium text-slate-900">{rule.name}</td>
                    <td className="px-3 py-2.5 text-slate-500">
                      <span className="text-xs bg-slate-100 px-2 py-0.5 rounded">{rule.matchType}</span> "{rule.matchValue}"
                    </td>
                    <td className="px-3 py-2.5"><Badge variant="blue">{rule.category}</Badge></td>
                    <td className="px-3 py-2.5 text-center text-xs text-slate-500">{rule.priority}</td>
                    <td className="px-3 py-2.5 text-center">
                      <input type="checkbox" checked={rule.isActive} onChange={(e) => updateCategoryRule(rule.id, { isActive: e.target.checked })} className="w-4 h-4 rounded border-slate-300 text-blue-600" />
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <button onClick={() => deleteCategoryRule(rule.id)} className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-600"><Trash2 size={13} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Modal>

      {/* Edit transaction */}
      {editTx && (
        <Modal open title="Edit Transaction" size="md" onClose={() => setEditTx(null)}
          footer={<><Button variant="outline" onClick={() => setEditTx(null)}>Cancel</Button><Button onClick={() => { updateTransaction(editTx.id, editTx); setEditTx(null); }}>Save</Button></>}>
          <div className="space-y-3">
            <FormField label="Description">
              <Input value={editTx.description} onChange={(e) => setEditTx({ ...editTx, description: e.target.value })} />
            </FormField>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Date">
                <Input type="date" value={editTx.date} onChange={(e) => setEditTx({ ...editTx, date: e.target.value })} />
              </FormField>
              <FormField label="Amount">
                <Input type="number" min={0} step={0.01} value={editTx.amount} onChange={(e) => setEditTx({ ...editTx, amount: parseFloat(e.target.value) || 0 })} />
              </FormField>
              <FormField label="Type">
                <Select value={editTx.type} onChange={(e) => setEditTx({ ...editTx, type: e.target.value as 'debit' | 'credit' })}>
                  <option value="debit">Debit</option>
                  <option value="credit">Credit</option>
                </Select>
              </FormField>
              <FormField label="Category">
                <Select value={editTx.category ?? ''} onChange={(e) => setEditTx({ ...editTx, category: e.target.value })}>
                  <option value="">Uncategorized</option>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </Select>
              </FormField>
              <FormField label="Entity">
                <Select value={editTx.entityId} onChange={(e) => setEditTx({ ...editTx, entityId: e.target.value })}>
                  {entities.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
                </Select>
              </FormField>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
