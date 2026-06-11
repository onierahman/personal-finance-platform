'use client';

import { useRef, useState } from 'react';
import Papa from 'papaparse';
import { X, Upload, AlertTriangle, CheckCircle, ChevronDown, Loader2 } from 'lucide-react';
import { useBulkCreateTransactions } from '@/features/transactions/hooks';
import { useAccounts } from '@/features/accounts/api';
import { autoDetectColumns, parseAndMapRows } from '@/lib/import';
import type { ColumnMapping, ParsedRow, ImportResult } from '@/lib/import';
import type { InsertTransaction } from '@/types/database';
import { cn } from '@/lib/utils';

const FIELD_OPTIONS: { value: string; label: string }[] = [
  { value: 'amount',   label: 'Amount' },
  { value: 'date',     label: 'Date' },
  { value: 'merchant', label: 'Merchant / Description' },
  { value: 'type',     label: 'Type (debit/credit)' },
  { value: 'category', label: 'Category' },
  { value: 'note',     label: 'Note / Reference' },
  { value: 'skip',     label: '— Skip column —' },
];

type Step = 1 | 2 | 3 | 4;

interface Props {
  onClose: () => void;
  initialMapping?: ColumnMapping;
  initialHeaders?: string[];
  initialRows?: Record<string, string>[];
  skipToStep?: Step;
  previewRows?: ParsedRow[];
  detectedBankName?: string | null;
}

export function CSVImport({
  onClose,
  initialMapping,
  initialHeaders,
  initialRows,
  skipToStep = 1,
  previewRows: externalPreviewRows,
  detectedBankName,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bulkCreate   = useBulkCreateTransactions();
  const { data: accountsRes } = useAccounts();
  const accounts = accountsRes?.data ?? [];

  const [step, setStep]             = useState<Step>(skipToStep);
  const [headers, setHeaders]       = useState<string[]>(initialHeaders ?? []);
  const [rawRows, setRawRows]       = useState<Record<string, string>[]>(initialRows ?? []);
  const [mapping, setMapping]       = useState<ColumnMapping>(initialMapping ?? {});
  const [accountId, setAccountId]   = useState<string>(accounts[0]?.id ?? '');
  const [parseError, setParseError] = useState<string>('');
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importSummary, setImportSummary] = useState<{ imported: number; skipped: number } | null>(null);

  const previewRows = externalPreviewRows ?? (importResult?.rows ?? []);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setParseError('');

    Papa.parse<Record<string, string>>(file, {
      header:         true,
      skipEmptyLines: true,
      complete: (results) => {
        if (!results.data.length) {
          setParseError('The file appears to be empty or has no data rows.');
          return;
        }
        const cols = results.meta.fields ?? [];
        setHeaders(cols);
        setRawRows(results.data);
        const detected = autoDetectColumns(cols);
        setMapping(detected);
        setStep(2);
      },
      error: (err) => {
        setParseError(`Could not parse CSV: ${err.message}`);
      },
    });
  }

  function handleMappingChange(header: string, field: string) {
    setMapping(prev => ({ ...prev, [header]: field as ColumnMapping[string] }));
  }

  const amountMapped = Object.values(mapping).includes('amount');
  const dateMapped   = Object.values(mapping).includes('date');
  const canProceed   = amountMapped && dateMapped && !!accountId;

  function handlePreview() {
    if (!canProceed) return;
    const result = parseAndMapRows(rawRows, mapping, accountId);
    setImportResult(result);
    setStep(3);
  }

  async function handleImport() {
    const rows = importResult?.rows ?? externalPreviewRows ?? [];
    const validPayloads = rows
      .filter(r => r.isValid)
      .map(r => ({
        ...r.mapped,
        account_id: accountId,
        recurring_id: null,
      } as InsertTransaction));

    if (!validPayloads.length) return;
    setStep(4);

    const res = await bulkCreate.mutateAsync(validPayloads);
    const imported = res.data?.length ?? 0;
    const skipped  = rows.length - validPayloads.length;
    setImportSummary({ imported, skipped });
  }

  const totalRows = importResult?.rows.length ?? externalPreviewRows?.length ?? 0;
  const validCount = importResult?.validCount ?? externalPreviewRows?.filter(r => r.isValid).length ?? 0;
  const invalidCount = importResult?.invalidCount ?? externalPreviewRows?.filter(r => !r.isValid).length ?? 0;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />

      <div className="relative z-10 bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Import CSV</h2>
            {detectedBankName && (
              <p className="text-xs text-slate-500 mt-0.5">Detected: {detectedBankName}</p>
            )}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-slate-100 transition-colors">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 px-6 py-3 border-b border-slate-100 shrink-0">
          {([1, 2, 3, 4] as Step[]).map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={cn(
                'w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold',
                step === s ? 'bg-primary-600 text-white' :
                step > s  ? 'bg-success-500 text-white' :
                'bg-slate-100 text-slate-400'
              )}>
                {step > s ? '✓' : s}
              </div>
              {s < 4 && <div className={cn('flex-1 h-0.5 w-8', step > s ? 'bg-success-400' : 'bg-slate-200')} />}
            </div>
          ))}
          <span className="ml-2 text-xs text-slate-500">
            {step === 1 ? 'Upload' : step === 2 ? 'Map Columns' : step === 3 ? 'Preview' : 'Done'}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {/* STEP 1: Upload */}
          {step === 1 && (
            <div className="flex flex-col items-center gap-5 py-6">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full max-w-sm border-2 border-dashed border-slate-300 rounded-xl p-10 flex flex-col items-center gap-3 hover:border-primary-400 hover:bg-primary-50/30 transition-colors cursor-pointer"
              >
                <Upload className="w-10 h-10 text-slate-400" />
                <div className="text-center">
                  <p className="text-sm font-medium text-slate-700">Click to upload CSV</p>
                  <p className="text-xs text-slate-500 mt-1">.csv or .txt files</p>
                </div>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt"
                className="hidden"
                onChange={handleFileChange}
              />
              {parseError && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg w-full">
                  <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-red-700">{parseError}</p>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Map Columns */}
          {step === 2 && (
            <div className="space-y-4">
              {/* Account selector */}
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1.5">
                  Import to account <span className="text-red-500">*</span>
                </label>
                <div className="relative w-64">
                  <select
                    value={accountId}
                    onChange={e => setAccountId(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md outline-none focus:border-primary-500 appearance-none bg-white"
                  >
                    {!accounts.length && <option value="">No accounts found</option>}
                    {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {(!amountMapped || !dateMapped) && (
                <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700">
                    {!amountMapped && !dateMapped ? 'Map at least "Amount" and "Date" to continue.' :
                     !amountMapped ? 'Map the "Amount" column to continue.' :
                     'Map the "Date" column to continue.'}
                  </p>
                </div>
              )}

              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      <th className="px-4 py-2.5 text-left">CSV Column</th>
                      <th className="px-4 py-2.5 text-left">Maps to</th>
                      <th className="px-4 py-2.5 text-left text-slate-400">Sample</th>
                    </tr>
                  </thead>
                  <tbody>
                    {headers.map((header) => (
                      <tr key={header} className="border-t border-slate-100">
                        <td className="px-4 py-2.5 font-medium text-slate-700 whitespace-nowrap">{header}</td>
                        <td className="px-4 py-2.5">
                          <div className="relative w-52">
                            <select
                              value={mapping[header] ?? 'skip'}
                              onChange={e => handleMappingChange(header, e.target.value)}
                              className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-md outline-none focus:border-primary-500 appearance-none bg-white"
                            >
                              {FIELD_OPTIONS.map(o => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                              ))}
                            </select>
                            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
                          </div>
                        </td>
                        <td className="px-4 py-2.5 text-slate-400 text-xs max-w-[140px] truncate">
                          {rawRows[0]?.[header] ?? ''}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* STEP 3: Preview */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-success-500" />
                <span className="text-sm text-slate-700">
                  <strong>{validCount}</strong> of <strong>{totalRows}</strong> rows valid
                  {invalidCount > 0 && <span className="text-slate-500"> — {invalidCount} will be skipped</span>}
                </span>
              </div>

              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-50 font-semibold text-slate-500 uppercase tracking-wide">
                      <th className="px-3 py-2 text-left">Date</th>
                      <th className="px-3 py-2 text-left">Merchant</th>
                      <th className="px-3 py-2 text-left">Category</th>
                      <th className="px-3 py-2 text-right">Amount</th>
                      <th className="px-3 py-2 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.slice(0, 8).map((row, i) => (
                      <tr key={i} className="border-t border-slate-100">
                        <td className="px-3 py-2 text-slate-600">{row.mapped.date ?? '—'}</td>
                        <td className="px-3 py-2 text-slate-700 max-w-[120px] truncate">{row.mapped.merchant ?? '—'}</td>
                        <td className="px-3 py-2 text-slate-600">{row.mapped.category ?? '—'}</td>
                        <td className="px-3 py-2 text-right font-medium">
                          {row.mapped.amount != null
                            ? `${row.mapped.type === 'income' ? '+' : '-'}$${Number(row.mapped.amount).toFixed(2)}`
                            : '—'}
                        </td>
                        <td className="px-3 py-2 text-center">
                          {row.isValid
                            ? <span className="text-success-600">✓</span>
                            : <span className="text-red-500" title={row.errors.join(', ')}>✗</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {totalRows > 8 && (
                  <div className="px-3 py-2 bg-slate-50 border-t border-slate-100 text-xs text-slate-500 text-center">
                    + {totalRows - 8} more rows
                  </div>
                )}
              </div>

              {invalidCount > 0 && (
                <details className="text-xs">
                  <summary className="cursor-pointer text-slate-500 hover:text-slate-700 font-medium">
                    Show {invalidCount} skipped row{invalidCount > 1 ? 's' : ''}
                  </summary>
                  <div className="mt-2 space-y-1">
                    {previewRows
                      .filter(r => !r.isValid)
                      .slice(0, 10)
                      .map((r, i) => (
                        <div key={i} className="flex gap-2 p-2 bg-red-50 rounded text-red-700">
                          <span className="font-medium">Row {i + 1}:</span>
                          <span>{r.errors.join(', ')}</span>
                        </div>
                      ))}
                  </div>
                </details>
              )}
            </div>
          )}

          {/* STEP 4: Done */}
          {step === 4 && (
            <div className="flex flex-col items-center gap-5 py-8">
              {bulkCreate.isPending && (
                <>
                  <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
                  <p className="text-sm text-slate-600">Importing transactions…</p>
                </>
              )}
              {importSummary && !bulkCreate.isPending && (
                <>
                  <div className="w-16 h-16 rounded-full bg-success-50 flex items-center justify-center">
                    <CheckCircle className="w-8 h-8 text-success-500" />
                  </div>
                  <div className="text-center">
                    <p className="text-base font-semibold text-slate-900">Import complete!</p>
                    <p className="text-sm text-slate-600 mt-1">
                      <span className="text-success-600 font-medium">{importSummary.imported} imported</span>
                      {importSummary.skipped > 0 && (
                        <span className="text-slate-500">, {importSummary.skipped} skipped</span>
                      )}
                    </p>
                  </div>
                  <button
                    onClick={onClose}
                    className="px-6 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    Done
                  </button>
                </>
              )}
              {bulkCreate.isError && (
                <div className="text-center">
                  <p className="text-sm text-red-600 font-medium">Import failed</p>
                  <p className="text-xs text-slate-500 mt-1">{String(bulkCreate.error)}</p>
                  <button
                    onClick={() => setStep(3)}
                    className="mt-3 px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50"
                  >
                    Back
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer buttons */}
        {(step === 2 || step === 3) && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 shrink-0">
            <button
              onClick={() => setStep(step === 2 ? 1 : 2)}
              className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Back
            </button>
            {step === 2 && (
              <button
                onClick={handlePreview}
                disabled={!canProceed}
                className="px-5 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Preview →
              </button>
            )}
            {step === 3 && (
              <button
                onClick={handleImport}
                disabled={validCount === 0}
                className="px-5 py-2 bg-success-500 text-white text-sm font-medium rounded-lg hover:bg-success-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Import {validCount} transaction{validCount !== 1 ? 's' : ''}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
