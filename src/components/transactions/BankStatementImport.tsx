'use client';

import { useRef, useState } from 'react';
import Papa from 'papaparse';
import { X, Upload, Building2, Loader2, AlertTriangle, Info } from 'lucide-react';
import { CSVImport } from './CSVImport';
import { detectBank } from '@/lib/bankPresets';
import { autoDetectColumns, parseAndMapRows } from '@/lib/import';
import type { ColumnMapping, ParsedRow } from '@/lib/import';
import { PDF_SUPPORTED } from '@/lib/ocr';
import { useAccounts } from '@/features/accounts/api';

interface Props {
  onClose: () => void;
}

type BSState = 'idle' | 'bank-detected' | 'csv-import' | 'parsing-pdf' | 'pdf-preview' | 'error';

export function BankStatementImport({ onClose }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: accountsRes } = useAccounts();
  const accounts = accountsRes?.data ?? [];

  const [bsState, setBsState]         = useState<BSState>('idle');
  const [errorMsg, setErrorMsg]       = useState('');
  const [detectedBank, setDetectedBank] = useState<ReturnType<typeof detectBank>>(null);
  const [csvHeaders, setCsvHeaders]   = useState<string[]>([]);
  const [csvRows, setCsvRows]         = useState<Record<string, string>[]>([]);
  const [csvMapping, setCsvMapping]   = useState<ColumnMapping>({});
  const [pdfRows, setPdfRows]         = useState<ParsedRow[]>([]);
  const [accountId, setAccountId]     = useState<string>(accounts[0]?.id ?? '');

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.name.toLowerCase().endsWith('.pdf')) {
      if (!PDF_SUPPORTED) {
        setErrorMsg('PDF import requires the Claude API. Switch OCR_BACKEND to "api" in src/lib/ocr.ts, or export your bank statement as CSV instead.');
        setBsState('error');
        return;
      }
      handlePdf(file);
    } else {
      handleCsv(file);
    }
  }

  function handleCsv(file: File) {
    Papa.parse<Record<string, string>>(file, {
      header:         true,
      skipEmptyLines: true,
      complete: (results) => {
        const cols    = results.meta.fields ?? [];
        const rows    = results.data;
        const preset  = detectBank(cols);
        const mapping = preset?.columnMapping
          ? { ...preset.columnMapping }
          : autoDetectColumns(cols);

        setCsvHeaders(cols);
        setCsvRows(rows);
        setCsvMapping(mapping as ColumnMapping);
        setDetectedBank(preset);

        if (preset) {
          setBsState('bank-detected');
        } else {
          setBsState('csv-import');
        }
      },
      error: (err) => {
        setErrorMsg(`Could not parse file: ${err.message}`);
        setBsState('error');
      },
    });
  }

  async function handlePdf(file: File) {
    setBsState('parsing-pdf');
    try {
      const accId = accounts[0]?.id ?? accountId;
      const formData = new FormData();
      formData.append('image', file);
      formData.append('mode', 'bank-statement-pdf');

      const res  = await fetch('/api/ai/ocr', { method: 'POST', body: formData });
      const json = await res.json();

      if (!res.ok || json.error) {
        setErrorMsg(json.error ?? 'Failed to extract bank statement');
        setBsState('error');
        return;
      }

      const extracted: { date: string; amount: number; type: string; merchant: string }[] = json.data ?? [];
      const rows: ParsedRow[] = extracted.map(item => ({
        raw:     item as unknown as Record<string, string>,
        mapped:  {
          account_id:   accId,
          date:         item.date,
          amount:       item.amount,
          type:         (item.type as 'expense' | 'income') ?? 'expense',
          merchant:     item.merchant,
          category:     'Other',
          recurring_id: null,
        },
        errors:  [],
        isValid: !!(item.date && item.amount > 0),
      }));

      setPdfRows(rows);
      setBsState('pdf-preview');
    } catch {
      setErrorMsg('Network error — please try again');
      setBsState('error');
    }
  }

  // Show the CSV wizard with preset mapping
  if (bsState === 'csv-import' || (bsState === 'bank-detected' && !detectedBank)) {
    return (
      <CSVImport
        onClose={onClose}
        initialHeaders={csvHeaders}
        initialRows={csvRows}
        initialMapping={csvMapping}
        skipToStep={2}
        detectedBankName={detectedBank?.name ?? null}
      />
    );
  }

  // Show the CSV wizard with bank preset — skip to preview
  if (bsState === 'bank-detected' && detectedBank) {
    const previewData = parseAndMapRows(csvRows, csvMapping, accounts[0]?.id ?? '');
    return (
      <CSVImport
        onClose={onClose}
        initialHeaders={csvHeaders}
        initialRows={csvRows}
        initialMapping={csvMapping}
        skipToStep={3}
        previewRows={previewData.rows}
        detectedBankName={detectedBank.name}
      />
    );
  }

  // PDF transactions: show the CSV import wizard at preview step
  if (bsState === 'pdf-preview') {
    return (
      <CSVImport
        onClose={onClose}
        skipToStep={3}
        previewRows={pdfRows}
        detectedBankName="Bank Statement (PDF)"
      />
    );
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />

      <div className="relative z-10 bg-white rounded-2xl shadow-xl w-full max-w-sm">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-900">Bank Statement Import</h2>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-slate-100 transition-colors">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        <div className="p-5">
          {bsState === 'idle' && (
            <div className="flex flex-col items-center gap-5 py-4">
              <div className="w-14 h-14 rounded-full bg-purple-50 flex items-center justify-center">
                <Building2 className="w-7 h-7 text-purple-600" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-slate-800">Upload your bank statement</p>
                <p className="text-xs text-slate-500 mt-1">
                  Supports CSV exports from CBA, NAB, Westpac, ANZ, Chase, Barclays + PDF statements
                </p>
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-slate-300 rounded-xl p-6 flex flex-col items-center gap-2 hover:border-purple-400 hover:bg-purple-50/30 transition-colors"
              >
                <Upload className="w-7 h-7 text-slate-400" />
                <span className="text-sm font-medium text-slate-700">Click to upload</span>
                <span className="text-xs text-slate-500">
                  {PDF_SUPPORTED ? '.csv or .pdf' : '.csv only'}
                </span>
              </button>
              {!PDF_SUPPORTED && (
                <div className="flex items-start gap-2 p-2.5 bg-blue-50 border border-blue-200 rounded-lg w-full">
                  <Info className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-700">
                    PDF import is disabled (offline mode). Export your statement as CSV from your bank&apos;s website.
                  </p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept={PDF_SUPPORTED ? '.csv,.pdf' : '.csv'}
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          )}

          {bsState === 'parsing-pdf' && (
            <div className="flex flex-col items-center gap-4 py-8">
              <Loader2 className="w-10 h-10 text-purple-500 animate-spin" />
              <p className="text-sm text-slate-600">Extracting transactions from PDF…</p>
              <p className="text-xs text-slate-400">This may take a few seconds</p>
            </div>
          )}

          {bsState === 'error' && (
            <div className="flex flex-col items-center gap-4 py-6">
              <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
                <AlertTriangle className="w-7 h-7 text-red-500" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-slate-800">Import failed</p>
                <p className="text-xs text-slate-500 mt-1">{errorMsg}</p>
              </div>
              <button
                onClick={() => { setBsState('idle'); setErrorMsg(''); }}
                className="px-5 py-2.5 bg-slate-800 text-white text-sm font-medium rounded-lg hover:bg-slate-900 transition-colors"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
