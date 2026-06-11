'use client';

import { useRef, useState } from 'react';
import { X, Camera, Loader2, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import { useUiStore } from '@/stores/uiStore';
import { extractReceiptData, OCR_BACKEND } from '@/lib/ocr';
import type { OcrReceiptResult } from '@/lib/ocr';
import { cn } from '@/lib/utils';

type ScanState = 'idle' | 'preview' | 'scanning' | 'result' | 'error';
type OcrResult = OcrReceiptResult;

interface Props {
  onClose: () => void;
}

export function ReceiptScanner({ onClose }: Props) {
  const { setReceiptPrefill, openQuickAdd } = useUiStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [state, setState]         = useState<ScanState>('idle');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [result, setResult]       = useState<OcrResult | null>(null);
  const [errorMsg, setErrorMsg]   = useState<string>('');

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setState('preview');
  }

  function reset() {
    setImageFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setResult(null);
    setErrorMsg('');
    setState('idle');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function handleAnalyze() {
    if (!imageFile) return;
    setState('scanning');

    try {
      const data = await extractReceiptData(imageFile);
      setResult(data);
      setState('result');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to read receipt — try a clearer photo');
      setState('error');
    }
  }

  function handleConfirm() {
    if (!result) return;
    const prefill: Record<string, unknown> = {};
    if (result.amount)   prefill.amount   = result.amount;
    if (result.date)     prefill.date     = result.date;
    if (result.merchant) prefill.merchant = result.merchant;
    if (result.category) prefill.category = result.category;
    if (result.note)     prefill.note     = result.note;
    if (result.type)     prefill.type     = result.type;
    setReceiptPrefill(prefill as never);
    onClose();
    openQuickAdd(result.type ?? 'expense');
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />

      <div className="relative z-10 bg-white rounded-2xl shadow-xl w-full max-w-sm">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-900">Scan Receipt</h2>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-slate-100 transition-colors">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        <div className="p-5">
          {/* IDLE */}
          {state === 'idle' && (
            <div className="flex flex-col items-center gap-4 py-6">
              <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center">
                <Camera className="w-8 h-8 text-blue-500" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-slate-800">Take a photo or upload a receipt</p>
                <p className="text-xs text-slate-500 mt-1">AI will extract the transaction details automatically</p>
                <span className="inline-block mt-2 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-500">
                  {OCR_BACKEND === 'tesseract' ? 'Offline OCR (free)' : 'Claude Vision API'}
                </span>
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-5 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
              >
                Choose Photo
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          )}

          {/* PREVIEW */}
          {state === 'preview' && previewUrl && (
            <div className="flex flex-col gap-4">
              <img
                src={previewUrl}
                alt="Receipt preview"
                className="w-full max-h-64 object-contain rounded-lg border border-slate-200"
              />
              <div className="flex gap-2">
                <button
                  onClick={reset}
                  className="flex-1 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Re-take
                </button>
                <button
                  onClick={handleAnalyze}
                  className="flex-1 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Analyze Receipt
                </button>
              </div>
            </div>
          )}

          {/* SCANNING */}
          {state === 'scanning' && (
            <div className="flex flex-col items-center gap-4 py-8">
              <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
              <p className="text-sm text-slate-600">Reading receipt…</p>
            </div>
          )}

          {/* RESULT */}
          {state === 'result' && result && (
            <div className="flex flex-col gap-4">
              {result.confidence !== undefined && result.confidence < 0.7 && (
                <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-amber-700">Low confidence — please review the extracted values carefully.</p>
                </div>
              )}

              <div className="space-y-2.5">
                {result.amount && (
                  <ResultRow label="Amount" value={`$${result.amount.toFixed(2)}`} />
                )}
                {result.merchant && (
                  <ResultRow label="Merchant" value={result.merchant} />
                )}
                {result.date && (
                  <ResultRow label="Date" value={result.date} />
                )}
                {result.type && (
                  <ResultRow label="Type" value={result.type === 'expense' ? 'Expense' : 'Income'} />
                )}
                {result.category && (
                  <ResultRow label="Category" value={result.category} />
                )}
                {result.note && (
                  <ResultRow label="Note" value={result.note} />
                )}
              </div>

              <div className="flex gap-2 mt-2">
                <button
                  onClick={reset}
                  className="flex-1 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Retry
                </button>
                <button
                  onClick={handleConfirm}
                  className="flex-1 py-2 bg-success-500 text-white text-sm font-medium rounded-lg hover:bg-success-600 transition-colors flex items-center justify-center gap-1.5"
                >
                  <CheckCircle className="w-3.5 h-3.5" /> Confirm & Add
                </button>
              </div>
            </div>
          )}

          {/* ERROR */}
          {state === 'error' && (
            <div className="flex flex-col items-center gap-4 py-6">
              <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
                <AlertTriangle className="w-7 h-7 text-red-500" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-slate-800">Could not read receipt</p>
                <p className="text-xs text-slate-500 mt-1">{errorMsg}</p>
              </div>
              <button
                onClick={reset}
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

function ResultRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
      <span className={cn('text-xs font-medium text-slate-500 w-20 shrink-0')}>{label}</span>
      <span className="text-sm text-slate-800 text-right">{value}</span>
    </div>
  );
}
