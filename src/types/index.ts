// ─── Entities ──────────────────────────────────────────────────────────────
export type EntityType = 'personal' | 'llc' | 'business' | 'rental_property';

export interface Entity {
  id: string;
  name: string;
  type: EntityType;
  description?: string;
  taxId?: string;
  address?: string;
  color: string;
  createdAt: string;
}

// ─── Assets ────────────────────────────────────────────────────────────────
export type AssetType =
  | 'real_estate'
  | 'vehicle'
  | 'bank_account'
  | 'investment'
  | 'retirement'
  | 'equipment'
  | 'receivable'
  | 'other';

export interface Asset {
  id: string;
  entityId: string;
  name: string;
  type: AssetType;
  value: number;
  purchasePrice?: number;
  purchaseDate?: string;
  description?: string;
  address?: string;
  accountNumber?: string;
  institution?: string;
  lastUpdated: string;
}

// ─── Liabilities ───────────────────────────────────────────────────────────
export type LiabilityType =
  | 'mortgage'
  | 'auto_loan'
  | 'credit_card'
  | 'personal_loan'
  | 'business_loan'
  | 'sba_loan'
  | 'tax_debt'
  | 'heloc'
  | 'line_of_credit'
  | 'other';

export interface Liability {
  id: string;
  entityId: string;
  name: string;
  type: LiabilityType;
  balance: number;
  originalAmount: number;
  interestRate: number;
  minimumPayment: number;
  paymentDueDay: number;
  startDate: string;
  endDate?: string;
  creditor: string;
  accountNumber?: string;
  description?: string;
}

// ─── Debt Schedule ─────────────────────────────────────────────────────────
export interface DebtScheduleEntry {
  id: string;
  liabilityId: string;
  paymentNumber: number;
  paymentDate: string;
  beginningBalance: number;
  paymentAmount: number;
  principalAmount: number;
  interestAmount: number;
  endingBalance: number;
  status: 'paid' | 'pending' | 'overdue';
}

// ─── Bills ─────────────────────────────────────────────────────────────────
export type BillFrequency =
  | 'weekly'
  | 'biweekly'
  | 'monthly'
  | 'quarterly'
  | 'semi-annual'
  | 'annual'
  | 'one-time';

export interface Bill {
  id: string;
  entityId: string;
  name: string;
  category: string;
  amount: number;
  frequency: BillFrequency;
  dueDay: number;
  autoPay: boolean;
  vendor?: string;
  notes?: string;
  isActive: boolean;
  lastPaidDate?: string;
}

// ─── Income ────────────────────────────────────────────────────────────────
export type IncomeFrequency =
  | 'weekly'
  | 'biweekly'
  | 'semi-monthly'
  | 'monthly'
  | 'quarterly'
  | 'annual'
  | 'one-time';

export type IncomeType = 'business' | 'personal';

export type IncomeCategory =
  | 'salary'
  | 'wages'
  | 'self-employment'
  | 'rental'
  | 'dividends'
  | 'interest'
  | 'consulting'
  | 'other';

export interface IncomeItem {
  id: string;
  entityId: string;
  name: string;
  type: IncomeType;
  category: IncomeCategory;
  amount: number;
  frequency: IncomeFrequency;
  startDate?: string;
  endDate?: string;
  taxable: boolean;
  notes?: string;
  isActive: boolean;
}

// ─── Transactions ──────────────────────────────────────────────────────────
export interface Transaction {
  id: string;
  entityId: string;
  date: string;
  description: string;
  name?: string;
  originalDescription?: string;
  amount: number;
  type: 'debit' | 'credit';
  category?: string;
  subcategory?: string;
  account?: string;
  accountType?: 'checking' | 'savings' | 'credit' | 'business';
  notes?: string;
  importBatchId?: string;
  tags?: string[];
  reviewed: boolean;
  pending?: boolean;
}

export interface CategoryRule {
  id: string;
  name: string;
  matchType: 'contains' | 'starts_with' | 'ends_with' | 'exact';
  matchValue: string;
  category: string;
  subcategory?: string;
  entityId?: string;
  priority: number;
  isActive: boolean;
}

// ─── Documents ─────────────────────────────────────────────────────────────
export type DocumentType =
  | 'statement'
  | 'loan_doc'
  | 'tax'
  | 'contract'
  | 'insurance'
  | 'report'
  | 'deed'
  | 'other';

export interface Document {
  id: string;
  entityId: string;
  name: string;
  type: DocumentType;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadDate: string;
  description?: string;
  tags?: string[];
  year?: number;
  month?: number;
}

// ─── Alerts ────────────────────────────────────────────────────────────────
export type AlertType =
  | 'bill_due'
  | 'low_cash'
  | 'uncategorized'
  | 'large_expense'
  | 'debt_payment'
  | 'document_expiring';

export type AlertSeverity = 'info' | 'warning' | 'critical';

export interface Alert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  entityId?: string;
  relatedId?: string;
  amount?: number;
  dueDate?: string;
  createdAt: string;
  dismissed: boolean;
}

// ─── Charts / Derived ──────────────────────────────────────────────────────
export interface NetWorthSnapshot {
  date: string;
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
}

export interface CashFlowForecast {
  month: string;
  income: number;
  expenses: number;
  netCashFlow: number;
  projectedBalance: number;
}

export interface PLStatement {
  entityId: string | 'global';
  periodStart: string;
  periodEnd: string;
  revenue: { category: string; amount: number }[];
  expenses: { category: string; amount: number }[];
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
}
