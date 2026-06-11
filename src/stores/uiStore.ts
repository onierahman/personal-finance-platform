import { create } from 'zustand';
import { currentYearMonth } from '@/lib/formatters';

interface UiStore {
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
}

export const useUiStore = create<UiStore>((set) => ({
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
}));
