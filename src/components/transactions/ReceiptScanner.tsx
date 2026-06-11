'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import {
  X, Camera, ImageIcon, Loader2, AlertTriangle,
  CheckCircle, RefreshCw, FlipHorizontal, Circle,
} from 'lucide-react';
import { useUiStore } from '@/stores/uiStore';
import { extractReceiptData, OCR_BACKEND } from '@/lib/ocr';
import type { OcrReceiptResult } from '@/lib/ocr';
import { cn } from '@/lib/utils';

type ScanState = 'idle' | 'camera' | 'preview' | 'scanning' | 'result' | 'error';
type OcrResult = OcrReceiptResult;
type FacingMode = 'environment' | 'user';

interface Props {
  onClose: () => void;
}

export function ReceiptScanner({ onClose }: Props) {
  const { setReceiptPrefill, openQuickAdd } = useUiStore();

  // Refs
  const videoRef      = useRef<HTMLVideoElement>(null);
  const canvasRef     = useRef<HTMLCanvasElement>(null);
  const streamRef     = useRef<MediaStream | null>(null);
  const galleryRef    = useRef<HTMLInputElement>(null);

  // State
  const [state, setState]           = useState<ScanState>('idle');
  const [facingMode, setFacingMode] = useState<FacingMode>('environment');
  const [imageFile, setImageFile]   = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [result, setResult]         = useState<OcrResult | null>(null);
  const [errorMsg, setErrorMsg]     = useState('');
  const [cameraError, setCameraError] = useState('');

  // Stop camera stream helper
  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  }, []);

  // Start camera with the given facing mode
  const startCamera = useCallback(async (facing: FacingMode) => {
    stopStream();
    setCameraError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('Permission') || msg.includes('NotAllowed')) {
        setCameraError('Camera permission denied. Please allow camera access in your browser settings, or use "Choose from Gallery" instead.');
      } else if (msg.includes('NotFound') || msg.includes('DevicesNotFound')) {
        setCameraError('No camera found on this device.');
      } else {
        setCameraError('Could not open camera. Try "Choose from Gallery" instead.');
      }
    }
  }, [stopStream]);

  // Open camera state
  function handleOpenCamera() {
    setState('camera');
    startCamera(facingMode);
  }

  // Flip between front / rear camera
  async function handleFlipCamera() {
    const next: FacingMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(next);
    await startCamera(next);
  }

  // Capture frame from video → File
  function handleCapture() {
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width  = video.videoWidth  || 1280;
    canvas.height = video.videoHeight || 720;
    canvas.getContext('2d')?.drawImage(video, 0, 0);

    canvas.toBlob(blob => {
      if (!blob) return;
      const file = new File([blob], 'receipt.jpg', { type: 'image/jpeg' });
      stopStream();
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setState('preview');
    }, 'image/jpeg', 0.92);
  }

  // Gallery file input change
  function handleGalleryChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setState('preview');
  }

  // Reset everything back to idle
  function reset() {
    stopStream();
    setImageFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setResult(null);
    setErrorMsg('');
    setCameraError('');
    setState('idle');
    if (galleryRef.current) galleryRef.current.value = '';
  }

  // Analyze with OCR
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

  // Confirm extracted data → pre-fill QuickAdd
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

  // Close modal — always stop camera first
  function handleClose() {
    stopStream();
    onClose();
  }

  // Cleanup stream if component unmounts while camera is open
  useEffect(() => () => stopStream(), [stopStream]);

  // ─── Camera state: takes over the full modal with black bg ───────────────
  if (state === 'camera') {
    return (
      <div className="fixed inset-0 z-[200] bg-black flex flex-col">
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-3 shrink-0">
          <button
            onClick={() => { stopStream(); setState('idle'); }}
            className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <span className="text-white text-sm font-medium">Scan Receipt</span>
          <button
            onClick={handleFlipCamera}
            className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
            title="Flip camera"
          >
            <FlipHorizontal className="w-5 h-5" />
          </button>
        </div>

        {/* Video feed */}
        <div className="flex-1 relative overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />

          {/* Receipt framing guide */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-[75%] h-[60%] rounded-2xl border-2 border-white/60 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
          </div>

          {/* Camera error overlay */}
          {cameraError && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/70 p-6">
              <div className="bg-white rounded-2xl p-5 text-center max-w-xs space-y-3">
                <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
                <p className="text-sm text-slate-700">{cameraError}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setState('idle'); setCameraError(''); }}
                    className="flex-1 py-2 border border-slate-200 rounded-lg text-sm text-slate-600"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => { setCameraError(''); startCamera(facingMode); }}
                    className="flex-1 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium"
                  >
                    Retry
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom bar — shutter */}
        <div className="shrink-0 py-6 flex items-center justify-center gap-8">
          {/* Gallery shortcut */}
          <button
            onClick={() => { stopStream(); setState('idle'); galleryRef.current?.click(); }}
            className="p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
            title="Choose from gallery"
          >
            <ImageIcon className="w-6 h-6" />
          </button>

          {/* Shutter */}
          <button
            onClick={handleCapture}
            disabled={!!cameraError}
            className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-lg active:scale-95 transition-transform disabled:opacity-40"
            title="Capture"
          >
            <Circle className="w-12 h-12 text-slate-800 fill-white stroke-slate-300" strokeWidth={2} />
          </button>

          {/* Spacer to balance layout */}
          <div className="w-12 h-12" />
        </div>

        {/* Hidden canvas for frame capture & hidden gallery input */}
        <canvas ref={canvasRef} className="hidden" />
        <input
          ref={galleryRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleGalleryChange}
        />
      </div>
    );
  }

  // ─── All other states: card modal ────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40" onClick={handleClose} />

      <div className="relative z-10 bg-white rounded-2xl shadow-xl w-full max-w-sm">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-900">Scan Receipt</h2>
          <button onClick={handleClose} className="p-1.5 rounded-md hover:bg-slate-100 transition-colors">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        <div className="p-5">
          {/* IDLE ─ two entry points */}
          {state === 'idle' && (
            <div className="flex flex-col items-center gap-5 py-4">
              <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center">
                <Camera className="w-8 h-8 text-blue-500" />
              </div>

              <div className="text-center">
                <p className="text-sm font-medium text-slate-800">Add a receipt</p>
                <p className="text-xs text-slate-500 mt-1">AI extracts the transaction details automatically</p>
                <span className="inline-block mt-2 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-500">
                  {OCR_BACKEND === 'tesseract' ? 'Offline OCR · free' : 'Claude Vision API'}
                </span>
              </div>

              {/* Primary: open live camera */}
              <button
                onClick={handleOpenCamera}
                className="w-full flex items-center justify-center gap-2 py-3 bg-primary-600 text-white text-sm font-semibold rounded-xl hover:bg-primary-700 active:scale-[0.98] transition-all"
              >
                <Camera className="w-4 h-4" />
                Take Photo
              </button>

              {/* Secondary: pick from gallery / file */}
              <button
                onClick={() => galleryRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 py-3 border border-slate-200 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-50 active:scale-[0.98] transition-all"
              >
                <ImageIcon className="w-4 h-4" />
                Choose from Gallery
              </button>

              {/* Hidden gallery input — no capture attribute so it opens the file picker / gallery */}
              <input
                ref={galleryRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleGalleryChange}
              />
            </div>
          )}

          {/* PREVIEW */}
          {state === 'preview' && previewUrl && (
            <div className="flex flex-col gap-4">
              <img
                src={previewUrl}
                alt="Receipt preview"
                className="w-full max-h-72 object-contain rounded-xl border border-slate-200 bg-slate-50"
              />
              <div className="flex gap-2">
                <button
                  onClick={reset}
                  className="flex-1 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Re-take
                </button>
                <button
                  onClick={handleAnalyze}
                  className="flex-1 py-2.5 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Analyze Receipt
                </button>
              </div>
            </div>
          )}

          {/* SCANNING */}
          {state === 'scanning' && (
            <div className="flex flex-col items-center gap-4 py-10">
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
                  <p className="text-xs text-amber-700">Low confidence — review values before saving.</p>
                </div>
              )}

              <div className="space-y-2.5">
                {result.amount   && <ResultRow label="Amount"   value={`$${result.amount.toFixed(2)}`} />}
                {result.merchant && <ResultRow label="Merchant" value={result.merchant} />}
                {result.date     && <ResultRow label="Date"     value={result.date} />}
                {result.type     && <ResultRow label="Type"     value={result.type === 'expense' ? 'Expense' : 'Income'} />}
                {result.category && <ResultRow label="Category" value={result.category} />}
                {result.note     && <ResultRow label="Note"     value={result.note} />}
              </div>

              <div className="flex gap-2 mt-1">
                <button
                  onClick={reset}
                  className="flex-1 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Retry
                </button>
                <button
                  onClick={handleConfirm}
                  className="flex-1 py-2.5 bg-success-500 text-white text-sm font-semibold rounded-lg hover:bg-success-600 transition-colors flex items-center justify-center gap-1.5"
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
