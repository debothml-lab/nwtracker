import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Entity, Asset, Liability, DebtScheduleEntry, Bill,
  IncomeItem, Transaction, Document, Alert, CategoryRule
} from '../types';
import {
  ENTITIES, ASSETS, LIABILITIES, DEBT_SCHEDULES, BILLS,
  INCOME_ITEMS, TRANSACTIONS, DOCUMENTS, ALERTS, CATEGORY_RULES
} from '../data/sampleData';

interface AuthState {
  isAuthenticated: boolean;
  userEmail: string | null;
}

interface UIState {
  selectedEntityId: string | null; // null = global/all
  sidebarOpen: boolean;
}

interface AppStore extends AuthState, UIState {
  entities: Entity[];
  assets: Asset[];
  liabilities: Liability[];
  debtSchedules: DebtScheduleEntry[];
  bills: Bill[];
  incomeItems: IncomeItem[];
  transactions: Transaction[];
  documents: Document[];
  alerts: Alert[];
  categoryRules: CategoryRule[];

  // Auth
  login: (email: string, password: string) => boolean;
  logout: () => void;

  // UI
  setSelectedEntity: (id: string | null) => void;
  setSidebarOpen: (open: boolean) => void;

  // Entities
  addEntity: (entity: Entity) => void;
  updateEntity: (id: string, updates: Partial<Entity>) => void;
  deleteEntity: (id: string) => void;

  // Assets
  addAsset: (asset: Asset) => void;
  updateAsset: (id: string, updates: Partial<Asset>) => void;
  deleteAsset: (id: string) => void;

  // Liabilities
  addLiability: (liability: Liability) => void;
  updateLiability: (id: string, updates: Partial<Liability>) => void;
  deleteLiability: (id: string) => void;

  // Debt Schedules
  addDebtScheduleEntries: (entries: DebtScheduleEntry[]) => void;
  deleteDebtSchedule: (liabilityId: string) => void;

  // Bills
  addBill: (bill: Bill) => void;
  updateBill: (id: string, updates: Partial<Bill>) => void;
  deleteBill: (id: string) => void;

  // Income
  addIncomeItem: (item: IncomeItem) => void;
  updateIncomeItem: (id: string, updates: Partial<IncomeItem>) => void;
  deleteIncomeItem: (id: string) => void;

  // Transactions
  addTransaction: (tx: Transaction) => void;
  addTransactions: (txs: Transaction[]) => void;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  categorizeTransaction: (id: string, category: string, subcategory?: string) => void;
  bulkCategorize: (ids: string[], category: string, subcategory?: string) => void;
  markReviewed: (id: string) => void;

  // Documents
  addDocument: (doc: Document) => void;
  updateDocument: (id: string, updates: Partial<Document>) => void;
  deleteDocument: (id: string) => void;

  // Alerts
  dismissAlert: (id: string) => void;
  dismissAllAlerts: () => void;
  addAlert: (alert: Alert) => void;

  // Category Rules
  addCategoryRule: (rule: CategoryRule) => void;
  updateCategoryRule: (id: string, updates: Partial<CategoryRule>) => void;
  deleteCategoryRule: (id: string) => void;
  applyRulesToTransactions: () => void;

  // Reset
  resetToSampleData: () => void;
}

const DEMO_CREDENTIALS = [
  { email: 'demo@propertyflow.com', password: 'demo1234' },
  { email: 'admin@propertyflow.com', password: 'admin123' },
  { email: 'michael@johnson.com', password: 'johnson2025' },
];

export const useStore = create<AppStore>()(
  persist(
    (set, get) => ({
      // Auth
      isAuthenticated: false,
      userEmail: null,

      // UI
      selectedEntityId: null,
      sidebarOpen: true,

      // Data
      entities: ENTITIES,
      assets: ASSETS,
      liabilities: LIABILITIES,
      debtSchedules: DEBT_SCHEDULES,
      bills: BILLS,
      incomeItems: INCOME_ITEMS,
      transactions: TRANSACTIONS,
      documents: DOCUMENTS,
      alerts: ALERTS,
      categoryRules: CATEGORY_RULES,

      // Auth actions
      login: (email, password) => {
        const match = DEMO_CREDENTIALS.find(
          (c) => c.email.toLowerCase() === email.toLowerCase() && c.password === password
        );
        if (match) {
          set({ isAuthenticated: true, userEmail: match.email });
          return true;
        }
        return false;
      },
      logout: () => set({ isAuthenticated: false, userEmail: null }),

      // UI actions
      setSelectedEntity: (id) => set({ selectedEntityId: id }),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),

      // Entity actions
      addEntity: (entity) => set((s) => ({ entities: [...s.entities, entity] })),
      updateEntity: (id, updates) =>
        set((s) => ({ entities: s.entities.map((e) => (e.id === id ? { ...e, ...updates } : e)) })),
      deleteEntity: (id) => set((s) => ({ entities: s.entities.filter((e) => e.id !== id) })),

      // Asset actions
      addAsset: (asset) => set((s) => ({ assets: [...s.assets, asset] })),
      updateAsset: (id, updates) =>
        set((s) => ({ assets: s.assets.map((a) => (a.id === id ? { ...a, ...updates } : a)) })),
      deleteAsset: (id) => set((s) => ({ assets: s.assets.filter((a) => a.id !== id) })),

      // Liability actions
      addLiability: (liability) => set((s) => ({ liabilities: [...s.liabilities, liability] })),
      updateLiability: (id, updates) =>
        set((s) => ({ liabilities: s.liabilities.map((l) => (l.id === id ? { ...l, ...updates } : l)) })),
      deleteLiability: (id) =>
        set((s) => ({ liabilities: s.liabilities.filter((l) => l.id !== id) })),

      // Debt Schedule actions
      addDebtScheduleEntries: (entries) =>
        set((s) => ({ debtSchedules: [...s.debtSchedules, ...entries] })),
      deleteDebtSchedule: (liabilityId) =>
        set((s) => ({ debtSchedules: s.debtSchedules.filter((d) => d.liabilityId !== liabilityId) })),

      // Bill actions
      addBill: (bill) => set((s) => ({ bills: [...s.bills, bill] })),
      updateBill: (id, updates) =>
        set((s) => ({ bills: s.bills.map((b) => (b.id === id ? { ...b, ...updates } : b)) })),
      deleteBill: (id) => set((s) => ({ bills: s.bills.filter((b) => b.id !== id) })),

      // Income actions
      addIncomeItem: (item) => set((s) => ({ incomeItems: [...s.incomeItems, item] })),
      updateIncomeItem: (id, updates) =>
        set((s) => ({ incomeItems: s.incomeItems.map((i) => (i.id === id ? { ...i, ...updates } : i)) })),
      deleteIncomeItem: (id) => set((s) => ({ incomeItems: s.incomeItems.filter((i) => i.id !== id) })),

      // Transaction actions
      addTransaction: (tx) => set((s) => ({ transactions: [tx, ...s.transactions] })),
      addTransactions: (txs) => set((s) => ({ transactions: [...txs, ...s.transactions] })),
      updateTransaction: (id, updates) =>
        set((s) => ({ transactions: s.transactions.map((t) => (t.id === id ? { ...t, ...updates } : t)) })),
      deleteTransaction: (id) =>
        set((s) => ({ transactions: s.transactions.filter((t) => t.id !== id) })),
      categorizeTransaction: (id, category, subcategory) =>
        set((s) => ({
          transactions: s.transactions.map((t) =>
            t.id === id ? { ...t, category, subcategory, reviewed: true } : t
          ),
        })),
      bulkCategorize: (ids, category, subcategory) =>
        set((s) => ({
          transactions: s.transactions.map((t) =>
            ids.includes(t.id) ? { ...t, category, subcategory, reviewed: true } : t
          ),
        })),
      markReviewed: (id) =>
        set((s) => ({
          transactions: s.transactions.map((t) => (t.id === id ? { ...t, reviewed: true } : t)),
        })),

      // Document actions
      addDocument: (doc) => set((s) => ({ documents: [doc, ...s.documents] })),
      updateDocument: (id, updates) =>
        set((s) => ({ documents: s.documents.map((d) => (d.id === id ? { ...d, ...updates } : d)) })),
      deleteDocument: (id) => set((s) => ({ documents: s.documents.filter((d) => d.id !== id) })),

      // Alert actions
      dismissAlert: (id) =>
        set((s) => ({ alerts: s.alerts.map((a) => (a.id === id ? { ...a, dismissed: true } : a)) })),
      dismissAllAlerts: () =>
        set((s) => ({ alerts: s.alerts.map((a) => ({ ...a, dismissed: true })) })),
      addAlert: (alert) => set((s) => ({ alerts: [alert, ...s.alerts] })),

      // Category Rule actions
      addCategoryRule: (rule) => set((s) => ({ categoryRules: [...s.categoryRules, rule] })),
      updateCategoryRule: (id, updates) =>
        set((s) => ({
          categoryRules: s.categoryRules.map((r) => (r.id === id ? { ...r, ...updates } : r)),
        })),
      deleteCategoryRule: (id) =>
        set((s) => ({ categoryRules: s.categoryRules.filter((r) => r.id !== id) })),
      applyRulesToTransactions: () => {
        const { transactions, categoryRules } = get();
        const active = [...categoryRules]
          .filter((r) => r.isActive)
          .sort((a, b) => a.priority - b.priority);
        const updated = transactions.map((tx) => {
          if (tx.reviewed) return tx;
          for (const rule of active) {
            const desc = tx.description.toUpperCase();
            const val = rule.matchValue.toUpperCase();
            let match = false;
            if (rule.matchType === 'contains') match = desc.includes(val);
            else if (rule.matchType === 'starts_with') match = desc.startsWith(val);
            else if (rule.matchType === 'ends_with') match = desc.endsWith(val);
            else if (rule.matchType === 'exact') match = desc === val;
            if (match) return { ...tx, category: rule.category, subcategory: rule.subcategory, reviewed: true };
          }
          return tx;
        });
        set({ transactions: updated });
      },

      // Reset
      resetToSampleData: () =>
        set({
          entities: ENTITIES,
          assets: ASSETS,
          liabilities: LIABILITIES,
          debtSchedules: DEBT_SCHEDULES,
          bills: BILLS,
          incomeItems: INCOME_ITEMS,
          transactions: TRANSACTIONS,
          documents: DOCUMENTS,
          alerts: ALERTS,
          categoryRules: CATEGORY_RULES,
        }),
    }),
    {
      name: 'property-flow-store',
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        userEmail: state.userEmail,
        entities: state.entities,
        assets: state.assets,
        liabilities: state.liabilities,
        debtSchedules: state.debtSchedules,
        bills: state.bills,
        incomeItems: state.incomeItems,
        transactions: state.transactions,
        documents: state.documents,
        alerts: state.alerts,
        categoryRules: state.categoryRules,
        selectedEntityId: state.selectedEntityId,
      }),
    }
  )
);
