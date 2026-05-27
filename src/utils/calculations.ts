import type {
  Asset,
  Liability,
  Bill,
  IncomeItem,
  Transaction,
  NetWorthSnapshot,
  CashFlowForecast,
} from '../types';
import { monthlyEquivalent, addMonths, isoMonths } from './formatters';

export function totalAssets(assets: Asset[], entityId?: string): number {
  const filtered = entityId ? assets.filter((a) => a.entityId === entityId) : assets;
  return filtered.reduce((s, a) => s + a.value, 0);
}

export function totalLiabilities(liabilities: Liability[], entityId?: string): number {
  const filtered = entityId
    ? liabilities.filter((l) => l.entityId === entityId)
    : liabilities;
  return filtered.reduce((s, l) => s + l.balance, 0);
}

export function netWorth(assets: Asset[], liabilities: Liability[], entityId?: string): number {
  return totalAssets(assets, entityId) - totalLiabilities(liabilities, entityId);
}

export function monthlyIncome(income: IncomeItem[], entityId?: string): number {
  const filtered = entityId ? income.filter((i) => i.entityId === entityId && i.isActive) : income.filter((i) => i.isActive);
  return filtered.reduce((s, i) => s + monthlyEquivalent(i.amount, i.frequency), 0);
}

export function monthlyBills(bills: Bill[], entityId?: string): number {
  const filtered = entityId
    ? bills.filter((b) => b.entityId === entityId && b.isActive)
    : bills.filter((b) => b.isActive);
  return filtered.reduce((s, b) => s + monthlyEquivalent(b.amount, b.frequency), 0);
}

export function cashBalance(assets: Asset[]): number {
  return assets
    .filter((a) => a.type === 'bank_account')
    .reduce((s, a) => s + a.value, 0);
}

export function buildNetWorthHistory(
  assets: Asset[],
  liabilities: Liability[],
  months = 12
): NetWorthSnapshot[] {
  const today = new Date().toISOString().split('T')[0];
  const nw = netWorth(assets, liabilities);
  // Simulate 12 months of gradual growth backwards
  return Array.from({ length: months }, (_, i) => {
    const offset = months - 1 - i;
    const factor = 1 - offset * 0.008 - (Math.random() * 0.005);
    const snap: NetWorthSnapshot = {
      date: addMonths(today, -offset),
      totalAssets: totalAssets(assets) * factor,
      totalLiabilities: totalLiabilities(liabilities) * (1 + offset * 0.003),
      netWorth: 0,
    };
    snap.netWorth = snap.totalAssets - snap.totalLiabilities;
    return snap;
  });
}

export function buildCashFlowForecast(
  assets: Asset[],
  income: IncomeItem[],
  bills: Bill[],
  liabilities: Liability[],
  months = 3
): CashFlowForecast[] {
  const today = new Date().toISOString().split('T')[0];
  const startBalance = cashBalance(assets);
  const monthlyInc = monthlyIncome(income);
  const monthlyExp = monthlyBills(bills);
  const debtPayments = liabilities.reduce((s, l) => s + l.minimumPayment, 0);
  const totalMonthlyOut = monthlyExp + debtPayments;

  let runningBalance = startBalance;

  return isoMonths(today, months).map((dateStr) => {
    const netFlow = monthlyInc - totalMonthlyOut;
    runningBalance += netFlow;
    return {
      month: dateStr,
      income: monthlyInc,
      expenses: totalMonthlyOut,
      netCashFlow: netFlow,
      projectedBalance: runningBalance,
    };
  });
}

export function categorizeTransactions(transactions: Transaction[]): Record<string, number> {
  const result: Record<string, number> = {};
  for (const t of transactions) {
    const cat = t.category ?? 'Uncategorized';
    if (t.type === 'debit') {
      result[cat] = (result[cat] ?? 0) + t.amount;
    }
  }
  return result;
}

export function generateAmortization(
  principal: number,
  annualRate: number,
  termMonths: number,
  startDate: string,
  liabilityId: string
): import('../types').DebtScheduleEntry[] {
  const monthlyRate = annualRate / 100 / 12;
  const payment =
    monthlyRate === 0
      ? principal / termMonths
      : (principal * monthlyRate * Math.pow(1 + monthlyRate, termMonths)) /
        (Math.pow(1 + monthlyRate, termMonths) - 1);

  const entries: import('../types').DebtScheduleEntry[] = [];
  let balance = principal;

  for (let i = 1; i <= termMonths && balance > 0.01; i++) {
    const interest = balance * monthlyRate;
    const principalPaid = Math.min(payment - interest, balance);
    const endingBal = Math.max(0, balance - principalPaid);
    const pmtDate = addMonths(startDate, i - 1);

    entries.push({
      id: `${liabilityId}-${i}`,
      liabilityId,
      paymentNumber: i,
      paymentDate: pmtDate,
      beginningBalance: balance,
      paymentAmount: payment,
      principalAmount: principalPaid,
      interestAmount: interest,
      endingBalance: endingBal,
      status: pmtDate < new Date().toISOString().split('T')[0] ? 'paid' : 'pending',
    });

    balance = endingBal;
  }

  return entries;
}

export function upcomingBills(bills: Bill[], withinDays = 30): (Bill & { nextDue: string })[] {
  const today = new Date();
  const result: (Bill & { nextDue: string })[] = [];

  for (const bill of bills.filter((b) => b.isActive)) {
    const dueDate = new Date(today.getFullYear(), today.getMonth(), bill.dueDay);
    if (dueDate < today) dueDate.setMonth(dueDate.getMonth() + 1);
    const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays <= withinDays) {
      result.push({
        ...bill,
        nextDue: dueDate.toISOString().split('T')[0],
      });
    }
  }

  return result.sort((a, b) => a.nextDue.localeCompare(b.nextDue));
}
