import { useState, useMemo, useRef } from 'react';
import Papa from 'papaparse';
import { Car, Upload, Plus, ChevronDown, ChevronRight, AlertCircle, CheckCircle } from 'lucide-react';
import { useStore } from '../store/useStore';
import { Card, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal, FormField, Input, Select } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { generateAmortization } from '../utils/calculations';
import { fmtCurrency, fmtDate, fmtPercent } from '../utils/formatters';
import type { DebtScheduleEntry } from '../types';
import clsx from 'clsx';

export function Loans() {
  const { liabilities, entities, debtSchedules, addDebtScheduleEntries, deleteDebtSchedule } = useStore();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [uploadLiabId, setUploadLiabId] = useState<string | null>(null);
  const [csvPreview, setCsvPreview] = useState<DebtScheduleEntry[] | null>(null);
  const [manualOpen, setManualOpen] = useState(false);
  const [genOpen, setGenOpen] = useState(false);
  const [genForm, setGenForm] = useState({ liabilityId: '', principal: '', rate: '', months: '', startDate: '' });
  const fileRef = useRef<HTMLInputElement>(null);

  const loansWithSchedules = useMemo(() => {
    return liabilities.map((l) => ({
      ...l,
      schedule: debtSchedules.filter((d) => d.liabilityId === l.id).sort((a, b) => a.paymentNumber - b.paymentNumber),
      entity: entities.find((e) => e.id === l.entityId),
    }));
  }, [liabilities, entities, debtSchedules]);

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>, liabId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const entries: DebtScheduleEntry[] = results.data.map((row, i) => ({
          id: `${liabId}-csv-${i + 1}`,
          liabilityId: liabId,
          paymentNumber: parseInt(row['payment_number'] ?? row['#'] ?? String(i + 1)),
          paymentDate: row['payment_date'] ?? row['date'] ?? '',
          beginningBalance: parseFloat(row['beginning_balance'] ?? row['balance'] ?? '0'),
          paymentAmount: parseFloat(row['payment_amount'] ?? row['payment'] ?? '0'),
          principalAmount: parseFloat(row['principal'] ?? '0'),
          interestAmount: parseFloat(row['interest'] ?? '0'),
          endingBalance: parseFloat(row['ending_balance'] ?? '0'),
          status: 'pending' as const,
        }));
        setCsvPreview(entries);
        setUploadLiabId(liabId);
      },
    });
    e.target.value = '';
  };

  const confirmUpload = () => {
    if (!csvPreview || !uploadLiabId) return;
    deleteDebtSchedule(uploadLiabId);
    addDebtScheduleEntries(csvPreview);
    setCsvPreview(null);
    setUploadLiabId(null);
  };

  const handleGenerate = () => {
    const { liabilityId, principal, rate, months, startDate } = genForm;
    if (!liabilityId || !principal || !rate || !months || !startDate) return;
    const entries = generateAmortization(parseFloat(principal), parseFloat(rate), parseInt(months), startDate, liabilityId);
    deleteDebtSchedule(liabilityId);
    addDebtScheduleEntries(entries);
    setGenOpen(false);
  };

  return (
    <div className="space-y-5 max-w-screen-xl mx-auto">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{loansWithSchedules.length} liabilities · {debtSchedules.length} schedule entries</p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setGenOpen(true)}>
            <Plus size={14} /> Generate Schedule
          </Button>
        </div>
      </div>

      {/* Loan cards */}
      {loansWithSchedules.map((loan) => {
        const expanded = expandedId === loan.id;
        const hasSchedule = loan.schedule.length > 0;
        const paidCount = loan.schedule.filter((s) => s.status === 'paid').length;
        const totalInterest = loan.schedule.reduce((s, e) => s + e.interestAmount, 0);
        const payoffDate = loan.schedule[loan.schedule.length - 1]?.paymentDate;
        const nextPayment = loan.schedule.find((s) => s.status === 'pending');

        return (
          <Card key={loan.id} padding="none">
            {/* Header */}
            <div
              className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-slate-50 transition-colors"
              onClick={() => setExpandedId(expanded ? null : loan.id)}
            >
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Car size={18} className="text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-semibold text-slate-900">{loan.name}</h3>
                  <Badge variant="gray">{loan.entity?.name.split(' ')[0]}</Badge>
                  {loan.type === 'auto_loan' && <Badge variant="blue">Auto</Badge>}
                  {loan.type === 'mortgage' && <Badge variant="purple">Mortgage</Badge>}
                  {loan.type === 'sba_loan' && <Badge variant="amber">SBA</Badge>}
                  {!hasSchedule && <Badge variant="gray">No Schedule</Badge>}
                </div>
                <div className="flex items-center gap-4 mt-1 flex-wrap">
                  <span className="text-xs text-slate-500">Creditor: {loan.creditor}</span>
                  <span className="text-xs text-slate-500">{fmtPercent(loan.interestRate)} APR</span>
                  {nextPayment && <span className="text-xs text-slate-500">Next: {fmtDate(nextPayment.paymentDate)}</span>}
                  {payoffDate && <span className="text-xs text-emerald-600">Payoff: {fmtDate(payoffDate)}</span>}
                </div>
              </div>
              <div className="text-right flex-shrink-0 hidden sm:block">
                <p className="text-lg font-bold text-red-700">{fmtCurrency(loan.balance)}</p>
                <p className="text-xs text-slate-400">remaining</p>
              </div>
              <div className="text-right flex-shrink-0 hidden md:block">
                <p className="text-sm font-medium text-slate-700">{fmtCurrency(loan.minimumPayment)}/mo</p>
                <p className="text-xs text-slate-400">min payment</p>
              </div>
              {hasSchedule && (
                <div className="text-right flex-shrink-0 hidden lg:block">
                  <p className="text-sm font-medium text-slate-700">{fmtCurrency(totalInterest, true)}</p>
                  <p className="text-xs text-slate-400">total interest</p>
                </div>
              )}
              <div className="flex items-center gap-2 ml-2">
                <input
                  type="file"
                  accept=".csv"
                  className="hidden"
                  id={`csv-${loan.id}`}
                  onChange={(e) => handleCSVUpload(e, loan.id)}
                />
                <label htmlFor={`csv-${loan.id}`}>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md cursor-pointer transition-colors">
                    <Upload size={12} /> CSV
                  </span>
                </label>
                {expanded ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-400" />}
              </div>
            </div>

            {/* Progress bar */}
            {hasSchedule && (
              <div className="px-5 pb-3">
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>{paidCount} of {loan.schedule.length} payments</span>
                  <span>{((paidCount / loan.schedule.length) * 100).toFixed(1)}% complete</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full">
                  <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${(paidCount / loan.schedule.length) * 100}%` }} />
                </div>
              </div>
            )}

            {/* Amortization table */}
            {expanded && (
              <div className="border-t border-slate-100">
                {!hasSchedule ? (
                  <div className="p-8 text-center">
                    <Upload size={24} className="mx-auto text-slate-300 mb-3" />
                    <p className="text-sm text-slate-500 mb-3">No amortization schedule uploaded yet.</p>
                    <div className="flex justify-center gap-3">
                      <label htmlFor={`csv-${loan.id}`}>
                        <span className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition-colors">
                          <Upload size={14} /> Upload CSV Schedule
                        </span>
                      </label>
                      <Button variant="outline" size="sm" onClick={() => { setGenForm({ liabilityId: loan.id, principal: String(loan.originalAmount), rate: String(loan.interestRate), months: '', startDate: loan.startDate }); setGenOpen(true); }}>
                        Generate Schedule
                      </Button>
                    </div>
                    <p className="text-xs text-slate-400 mt-3">
                      CSV columns: payment_number, payment_date, beginning_balance, payment_amount, principal, interest, ending_balance
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto max-h-96">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 z-10">
                        <tr>
                          {['#', 'Date', 'Status', 'Beg. Balance', 'Payment', 'Principal', 'Interest', 'End. Balance'].map((h) => (
                            <th key={h} className={clsx('px-4 py-2.5 text-xs font-medium text-slate-500 uppercase tracking-wide whitespace-nowrap', h === '#' || h === 'Status' ? 'text-left' : 'text-right')}>
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {loan.schedule.map((entry) => (
                          <tr key={entry.id} className={clsx('hover:bg-slate-50 transition-colors', entry.status === 'paid' && 'opacity-60')}>
                            <td className="px-4 py-2 text-xs text-slate-500">{entry.paymentNumber}</td>
                            <td className="px-4 py-2 text-xs text-slate-700 whitespace-nowrap">{fmtDate(entry.paymentDate)}</td>
                            <td className="px-4 py-2">
                              {entry.status === 'paid' ? (
                                <span className="inline-flex items-center gap-1 text-xs text-emerald-600"><CheckCircle size={11} /> Paid</span>
                              ) : entry.status === 'overdue' ? (
                                <span className="inline-flex items-center gap-1 text-xs text-red-600"><AlertCircle size={11} /> Overdue</span>
                              ) : (
                                <span className="text-xs text-slate-400">Pending</span>
                              )}
                            </td>
                            <td className="px-4 py-2 text-right text-xs text-slate-600">{fmtCurrency(entry.beginningBalance)}</td>
                            <td className="px-4 py-2 text-right text-xs font-medium text-slate-900">{fmtCurrency(entry.paymentAmount)}</td>
                            <td className="px-4 py-2 text-right text-xs text-emerald-700">{fmtCurrency(entry.principalAmount)}</td>
                            <td className="px-4 py-2 text-right text-xs text-red-600">{fmtCurrency(entry.interestAmount)}</td>
                            <td className="px-4 py-2 text-right text-xs font-medium text-slate-900">{fmtCurrency(entry.endingBalance)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </Card>
        );
      })}

      {/* CSV Preview modal */}
      <Modal open={!!csvPreview} onClose={() => setCsvPreview(null)} title="Review Uploaded Schedule" size="2xl"
        footer={<><Button variant="outline" onClick={() => setCsvPreview(null)}>Cancel</Button><Button onClick={confirmUpload}>Import {csvPreview?.length} Entries</Button></>}>
        <p className="text-sm text-slate-600 mb-4">Review the schedule below before importing. This will replace any existing schedule for this loan.</p>
        <div className="overflow-x-auto max-h-96 border border-slate-200 rounded-lg">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-slate-50 border-b border-slate-200">
              <tr>
                {['#', 'Date', 'Beg. Balance', 'Payment', 'Principal', 'Interest', 'End Balance'].map((h) => (
                  <th key={h} className="px-3 py-2 text-left font-medium text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {(csvPreview ?? []).slice(0, 100).map((e) => (
                <tr key={e.id} className="hover:bg-slate-50">
                  <td className="px-3 py-2 text-slate-500">{e.paymentNumber}</td>
                  <td className="px-3 py-2">{e.paymentDate}</td>
                  <td className="px-3 py-2 text-right">{fmtCurrency(e.beginningBalance)}</td>
                  <td className="px-3 py-2 text-right font-medium">{fmtCurrency(e.paymentAmount)}</td>
                  <td className="px-3 py-2 text-right text-emerald-600">{fmtCurrency(e.principalAmount)}</td>
                  <td className="px-3 py-2 text-right text-red-600">{fmtCurrency(e.interestAmount)}</td>
                  <td className="px-3 py-2 text-right">{fmtCurrency(e.endingBalance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {(csvPreview?.length ?? 0) > 100 && (
          <p className="text-xs text-slate-400 mt-2">Showing first 100 of {csvPreview?.length} rows</p>
        )}
      </Modal>

      {/* Generate Schedule modal */}
      <Modal open={genOpen} onClose={() => setGenOpen(false)} title="Generate Amortization Schedule" size="md"
        footer={<><Button variant="outline" onClick={() => setGenOpen(false)}>Cancel</Button><Button onClick={handleGenerate}>Generate</Button></>}>
        <div className="space-y-4">
          <FormField label="Liability" required>
            <Select value={genForm.liabilityId} onChange={(e) => setGenForm({ ...genForm, liabilityId: e.target.value })}>
              <option value="">Select liability...</option>
              {liabilities.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
            </Select>
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Loan Principal ($)" required>
              <Input type="number" value={genForm.principal} onChange={(e) => setGenForm({ ...genForm, principal: e.target.value })} placeholder="50000" />
            </FormField>
            <FormField label="Annual Rate (%)">
              <Input type="number" step={0.01} value={genForm.rate} onChange={(e) => setGenForm({ ...genForm, rate: e.target.value })} placeholder="4.90" />
            </FormField>
            <FormField label="Term (months)" required>
              <Input type="number" value={genForm.months} onChange={(e) => setGenForm({ ...genForm, months: e.target.value })} placeholder="60" />
            </FormField>
            <FormField label="Start Date" required>
              <Input type="date" value={genForm.startDate} onChange={(e) => setGenForm({ ...genForm, startDate: e.target.value })} />
            </FormField>
          </div>
        </div>
      </Modal>
    </div>
  );
}
