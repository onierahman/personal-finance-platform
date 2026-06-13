'use client';

import { useEffect, useState } from 'react';
import { ShieldCheck, Shield, Loader2, Copy, Check } from 'lucide-react';
import {
  listTotpFactors,
  enrollTotp,
  verifyTotpEnrollment,
  unenrollTotp,
  type TotpFactor,
  type EnrollResult,
} from '@/features/security/mfa';
import { cn } from '@/lib/utils';

type Phase = 'idle' | 'enrolling' | 'confirm-disable';

export function TwoFactorPanel({
  onSaved,
  onError,
}: {
  onSaved: (m: string) => void;
  onError: (m: string) => void;
}) {
  const [factors, setFactors] = useState<TotpFactor[]>([]);
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState<Phase>('idle');
  const [enroll, setEnroll] = useState<EnrollResult | null>(null);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const verified = factors.find((f) => f.status === 'verified');

  const refresh = async () => {
    setLoading(true);
    setFactors(await listTotpFactors());
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, []);

  const startEnroll = async () => {
    setBusy(true);
    const { data, error } = await enrollTotp();
    setBusy(false);
    if (error || !data) {
      onError(error ?? 'Could not start setup.');
      return;
    }
    setEnroll(data);
    setCode('');
    setPhase('enrolling');
  };

  const confirmEnroll = async () => {
    if (!enroll || code.length < 6) return;
    setBusy(true);
    const { error } = await verifyTotpEnrollment(enroll.factorId, code.trim());
    setBusy(false);
    if (error) {
      onError(error);
      return;
    }
    setPhase('idle');
    setEnroll(null);
    setCode('');
    onSaved('Two-factor authentication is on.');
    refresh();
  };

  const disable = async () => {
    if (!verified) return;
    setBusy(true);
    const { error } = await unenrollTotp(verified.id);
    setBusy(false);
    if (error) {
      onError(error);
      return;
    }
    setPhase('idle');
    onSaved('Two-factor authentication turned off.');
    refresh();
  };

  const copySecret = () => {
    if (!enroll) return;
    navigator.clipboard.writeText(enroll.secret).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-4">
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0',
            verified ? 'bg-success-50 dark:bg-success-900/20' : 'bg-slate-100 dark:bg-slate-800',
          )}
        >
          {verified ? (
            <ShieldCheck className="w-4 h-4 text-success-600" />
          ) : (
            <Shield className="w-4 h-4 text-slate-400" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Two-factor authentication
            </p>
            {verified && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-400">
                Enabled
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Add a one-time code from an authenticator app on top of your password.
          </p>
        </div>

        {!loading && phase === 'idle' && (
          <button
            type="button"
            onClick={verified ? () => setPhase('confirm-disable') : startEnroll}
            disabled={busy}
            className={cn(
              'flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50',
              verified
                ? 'border border-danger-200 dark:border-danger-500/30 text-danger-600 dark:text-danger-400 hover:bg-danger-50 dark:hover:bg-danger-500/10'
                : 'bg-primary-600 text-white hover:bg-primary-700',
            )}
          >
            {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {verified ? 'Turn off' : 'Set up'}
          </button>
        )}
      </div>

      {/* Enrollment flow */}
      {phase === 'enrolling' && enroll && (
        <div className="mt-4 rounded-lg bg-slate-50 dark:bg-slate-800/60 p-4 space-y-4">
          <div>
            <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
              1. Scan this QR code with your authenticator app
            </p>
            <div
              className="w-40 h-40 bg-white rounded-lg p-2 mx-auto [&_svg]:w-full [&_svg]:h-full"
              // Supabase returns a trusted, self-generated inline SVG QR code.
              dangerouslySetInnerHTML={{ __html: enroll.qrSvg }}
            />
          </div>

          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1.5">
              Or enter this code manually:
            </p>
            <button
              type="button"
              onClick={copySecret}
              className="w-full flex items-center justify-between gap-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-left"
            >
              <code className="text-xs font-mono text-slate-700 dark:text-slate-300 break-all">
                {enroll.secret}
              </code>
              {copied ? (
                <Check className="w-3.5 h-3.5 text-success-600 flex-shrink-0" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              )}
            </button>
          </div>

          <div>
            <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              2. Enter the 6-digit code to confirm
            </p>
            <div className="flex gap-2">
              <input
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                onKeyDown={(e) => e.key === 'Enter' && confirmEnroll()}
                placeholder="000000"
                className="flex-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm font-mono tracking-widest text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                autoFocus
              />
              <button
                type="button"
                onClick={confirmEnroll}
                disabled={busy || code.length < 6}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 disabled:opacity-50"
              >
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify'}
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={() => { setPhase('idle'); setEnroll(null); }}
            className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            Cancel setup
          </button>
        </div>
      )}

      {/* Disable confirmation */}
      {phase === 'confirm-disable' && (
        <div className="mt-4 rounded-lg bg-danger-50 dark:bg-danger-500/10 border border-danger-200 dark:border-danger-500/30 p-3 space-y-2">
          <p className="text-xs text-danger-700 dark:text-danger-400 font-medium">
            Turn off two-factor authentication? Your account will be protected by your password only.
          </p>
          <div className="flex gap-2">
            <button
              onClick={disable}
              disabled={busy}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-danger-600 text-white hover:bg-danger-700 disabled:opacity-50"
            >
              {busy && <Loader2 className="w-3 h-3 animate-spin" />}
              Yes, turn off
            </button>
            <button
              onClick={() => setPhase('idle')}
              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800"
            >
              Keep it on
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
