'use client';

import { useState } from 'react';
import { Upload, ChevronDown, ScanLine, FileSpreadsheet, Building2 } from 'lucide-react';
import { useUiStore } from '@/stores/uiStore';

export function ImportMenu() {
  const [open, setOpen] = useState(false);
  const { openImport }  = useUiStore();

  function handleSelect(mode: 'receipt' | 'csv' | 'bank') {
    setOpen(false);
    openImport(mode);
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(p => !p)}
        className="flex items-center gap-1.5 px-3 py-2 rounded-md border border-slate-200 bg-white text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
      >
        <Upload className="w-4 h-4" />
        Import
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1.5 z-20 w-52 card shadow-dropdown py-1.5">
            <button
              onClick={() => handleSelect('receipt')}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <ScanLine className="w-4 h-4 text-blue-500" />
              Scan Receipt
            </button>
            <button
              onClick={() => handleSelect('csv')}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4 text-green-600" />
              Import CSV
            </button>
            <button
              onClick={() => handleSelect('bank')}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <Building2 className="w-4 h-4 text-purple-600" />
              Bank Statement
            </button>
          </div>
        </>
      )}
    </div>
  );
}
