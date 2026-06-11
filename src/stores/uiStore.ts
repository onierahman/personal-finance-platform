import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { currentYearMonth } from '@/lib/formatters';
import type { TransactionFormValues } from '@/features/transactions/schema';

interface UiStore {
  // Theme
  theme: 'light' | 'dark';
  toggleTheme: () => void;

  // Quick-add transaction sheet
  quickAddOpen: boolean;
  quickAddType: 'expense' | 'income';
  openQuickAdd: (type?: 'expense' | 'income') => void;
  closeQuickAdd: () => void;

  // Active month filter (dashboard + transactions)
  activeMonth: string;
  setActiveMonth: (month: string) => void;

  // Mobile sidebar
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;

  // Desktop sidebar collapse
  sidebarCollapsed: boolean;
  toggleSidebarCollapsed: () => void;

  // Edit transaction modal
  editTransactionId: string | null;
  openEditTransaction: (id: string) => void;
  closeEditTransaction: () => void;

  // Import modals
  importOpen: boolean;
  importMode: 'receipt' | 'csv' | 'bank' | null;
  openImport: (mode: 'receipt' | 'csv' | 'bank') => void;
  closeImport: () => void;

  // Receipt OCR pre-fill for QuickAdd
  receiptPrefill: Partial<TransactionFormValues> | null;
  setReceiptPrefill: (data: Partial<TransactionFormValues> | null) => void;
}

export const useUiStore = create<UiStore>()(
  persist(
    (set) => ({
      theme: 'light',
      toggleTheme: () => set((s) => ({ theme: s.theme === 'light' ? 'dark' : 'light' })),

      quickAddOpen:  false,
      quickAddType:  'expense',
      openQuickAdd:  (type = 'expense') => set({ quickAddOpen: true, quickAddType: type }),
      closeQuickAdd: () => set({ quickAddOpen: false }),

      activeMonth:    currentYearMonth(),
      setActiveMonth: (month) => set({ activeMonth: month }),

      sidebarOpen:   false,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

      sidebarCollapsed:       false,
      toggleSidebarCollapsed: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

      editTransactionId:    null,
      openEditTransaction:  (id) => set({ editTransactionId: id }),
      closeEditTransaction: () => set({ editTransactionId: null }),

      importOpen: false,
      importMode: null,
      openImport:  (mode) => set({ importOpen: true, importMode: mode }),
      closeImport: () => set({ importOpen: false, importMode: null }),

      receiptPrefill:    null,
      setReceiptPrefill: (data) => set({ receiptPrefill: data }),
    }),
    {
      name: 'ui-theme',
      partialize: (s) => ({ theme: s.theme }),
    },
  ),
);
