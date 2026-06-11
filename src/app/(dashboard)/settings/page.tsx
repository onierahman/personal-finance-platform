'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/hooks/useUser';
import { useUpdateProfile, useChangePassword } from '@/features/settings/hooks';
import {
  getNotificationPreferences,
  saveNotificationPreferences,
  deleteAccount,
  type NotificationPreferences,
} from '@/features/settings/api';
import { CURRENCIES } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import {
  User, Lock, Bell, Trash2, Check, AlertTriangle,
  ChevronRight, Globe, DollarSign, Eye, EyeOff,
} from 'lucide-react';

// ── Timezones ──────────────────────────────────────────────────
const TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Toronto',
  'America/Vancouver',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Amsterdam',
  'Europe/Madrid',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Asia/Seoul',
  'Asia/Shanghai',
  'Australia/Sydney',
  'Australia/Melbourne',
  'Pacific/Auckland',
] as const;

type Tab = 'profile' | 'security' | 'notifications' | 'danger';

const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: 'profile',       label: 'Profile & Preferences', icon: User  },
  { key: 'security',      label: 'Security',               icon: Lock  },
  { key: 'notifications', label: 'Notifications',          icon: Bell  },
  { key: 'danger',        label: 'Danger Zone',            icon: Trash2 },
];

// ── Toast ──────────────────────────────────────────────────────
function Toast({ message, type }: { message: string; type: 'success' | 'error' }) {
  return (
    <div className={cn(
      'fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium animate-in slide-in-from-bottom-4',
      type === 'success' ? 'bg-success-50 text-success-700 border border-success-200' : 'bg-danger-50 text-danger-700 border border-danger-200',
    )}>
      {type === 'success' ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
      {message}
    </div>
  );
}

// ── Profile Tab ────────────────────────────────────────────────
function ProfileTab({ onSaved }: { onSaved: (msg: string) => void; onError: (msg: string) => void }) {
  const { user } = useUser();
  const { mutate: updateProfile, isPending } = useUpdateProfile();

  const [name, setName]         = useState('');
  const [currency, setCurrency] = useState('USD');
  const [timezone, setTimezone] = useState('UTC');

  useEffect(() => {
    if (user) {
      setName(user.name);
      setCurrency(user.currency);
      setTimezone(user.timezone);
    }
  }, [user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    updateProfile(
      { name: name.trim(), currency, timezone },
      {
        onSuccess: (res) => {
          if (res.error) onSaved(''); // handled below
          else onSaved('Profile updated successfully.');
        },
        onError: () => onSaved(''),
      },
    );
  };

  const initial = (user?.name ?? 'U').charAt(0).toUpperCase();

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Avatar */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
          <span className="text-2xl font-bold text-primary-700">{initial}</span>
        </div>
        <div>
          <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{user?.name}</p>
          <p className="text-xs text-slate-400 dark:text-slate-500">{user?.email}</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Avatar is auto-generated from your initials</p>
        </div>
      </div>

      <div className="h-px bg-slate-100 dark:bg-slate-800" />

      {/* Name */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Display Name</label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Your name"
          className="w-full max-w-sm border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          required
        />
      </div>

      {/* Email (read-only) */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Email Address</label>
        <input
          type="email"
          value={user?.email ?? ''}
          disabled
          className="w-full max-w-sm border border-slate-100 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800/50 cursor-not-allowed"
        />
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Email cannot be changed here.</p>
      </div>

      <div className="h-px bg-slate-100 dark:bg-slate-800" />

      {/* Currency */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
          <span className="flex items-center gap-1.5"><DollarSign className="w-3.5 h-3.5" /> Default Currency</span>
        </label>
        <select
          value={currency}
          onChange={e => setCurrency(e.target.value)}
          className="w-full max-w-sm border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-slate-800"
        >
          {CURRENCIES.map(c => (
            <option key={c.code} value={c.code}>
              {c.symbol} — {c.name} ({c.code})
            </option>
          ))}
        </select>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Used for all amounts throughout the app.</p>
      </div>

      {/* Timezone */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
          <span className="flex items-center gap-1.5"><Globe className="w-3.5 h-3.5" /> Timezone</span>
        </label>
        <select
          value={timezone}
          onChange={e => setTimezone(e.target.value)}
          className="w-full max-w-sm border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-slate-800"
        >
          {TIMEZONES.map(tz => (
            <option key={tz} value={tz}>{tz.replace(/_/g, ' ')}</option>
          ))}
        </select>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Affects date grouping and bill due date calculations.</p>
      </div>

      <div>
        <button
          type="submit"
          disabled={isPending || !name.trim()}
          className="px-5 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isPending ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}

// ── Security Tab ───────────────────────────────────────────────
function SecurityTab({
  onSaved,
  onError,
}: {
  onSaved: (msg: string) => void;
  onError: (msg: string) => void;
}) {
  const { mutate: changePassword, isPending } = useChangePassword();
  const [newPassword, setNewPassword]         = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [mismatch, setMismatch]               = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMismatch(true);
      return;
    }
    setMismatch(false);
    changePassword(
      { newPassword },
      {
        onSuccess: (res) => {
          if (res.error) {
            onError(res.error);
          } else {
            setNewPassword('');
            setConfirmPassword('');
            onSaved('Password changed successfully.');
          }
        },
        onError: (err) => onError(err.message),
      },
    );
  };

  const strength = (() => {
    if (!newPassword) return null;
    if (newPassword.length < 6) return { label: 'Too short', color: 'bg-danger-500', width: '20%' };
    if (newPassword.length < 8) return { label: 'Weak', color: 'bg-warning-500', width: '40%' };
    const hasUpper = /[A-Z]/.test(newPassword);
    const hasNum   = /\d/.test(newPassword);
    const hasSym   = /[^A-Za-z0-9]/.test(newPassword);
    const score    = [hasUpper, hasNum, hasSym].filter(Boolean).length;
    if (score === 0) return { label: 'Fair',   color: 'bg-warning-400', width: '55%' };
    if (score === 1) return { label: 'Good',   color: 'bg-success-400', width: '75%' };
    return               { label: 'Strong',  color: 'bg-success-600', width: '100%' };
  })();

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-sm">
      <div>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Change your password. You are signed in via email — choose a strong password with at least 8 characters.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">New Password</label>
        <input
          type="password"
          value={newPassword}
          onChange={e => setNewPassword(e.target.value)}
          placeholder="Minimum 8 characters"
          minLength={6}
          required
          className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
        {strength && (
          <div className="mt-2 space-y-1">
            <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <div className={cn('h-full rounded-full transition-all', strength.color)} style={{ width: strength.width }} />
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500">{strength.label}</p>
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Confirm New Password</label>
        <input
          type="password"
          value={confirmPassword}
          onChange={e => { setConfirmPassword(e.target.value); setMismatch(false); }}
          placeholder="Repeat your new password"
          required
          className={cn(
            'w-full border rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:border-transparent',
            mismatch
              ? 'border-danger-300 focus:ring-danger-400'
              : 'border-slate-200 dark:border-slate-700 focus:ring-primary-500',
          )}
        />
        {mismatch && <p className="text-xs text-danger-600 mt-1">Passwords do not match.</p>}
      </div>

      <button
        type="submit"
        disabled={isPending || !newPassword || !confirmPassword}
        className="px-5 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isPending ? 'Updating…' : 'Update Password'}
      </button>
    </form>
  );
}

// ── Notification Toggle ─────────────────────────────────────────
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
        checked ? 'bg-primary-600' : 'bg-slate-200 dark:bg-slate-700',
      )}
    >
      <span
        className={cn(
          'inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform',
          checked ? 'translate-x-4.5' : 'translate-x-0.5',
        )}
      />
    </button>
  );
}

// ── Notifications Tab ──────────────────────────────────────────
function NotificationsTab({ onSaved }: { onSaved: (msg: string) => void }) {
  const [prefs, setPrefs] = useState<NotificationPreferences>(getNotificationPreferences);

  const toggle = (key: keyof NotificationPreferences) => {
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    saveNotificationPreferences(next);
    onSaved('Notification preferences saved.');
  };

  const items: { key: keyof NotificationPreferences; label: string; description: string }[] = [
    { key: 'billDue',             label: 'Upcoming Bills',          description: 'Alert 3 days before a recurring bill is due.' },
    { key: 'budgetExceeded',      label: 'Budget Exceeded',         description: 'Notify when a category budget goes over 90%.' },
    { key: 'goalAchieved',        label: 'Goal Achieved',           description: 'Celebrate when you reach a savings goal.' },
    { key: 'lowBalance',          label: 'Low Balance',             description: 'Warn when an account balance falls below a threshold.' },
    { key: 'recurringGenerated',  label: 'Recurring Auto-Created',  description: 'Confirm when a recurring transaction is auto-posted.' },
    { key: 'insightReady',        label: 'AI Insights Ready',       description: 'Get notified when new spending insights are available.' },
  ];

  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-500">
        Choose which in-app alerts you want to receive. Preferences are saved instantly.
      </p>

      <ul className="divide-y divide-slate-100 dark:divide-slate-800">
        {items.map(item => (
          <li key={item.key} className="flex items-center justify-between py-4 gap-4">
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{item.label}</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{item.description}</p>
            </div>
            <Toggle checked={prefs[item.key]} onChange={() => toggle(item.key)} />
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── Danger Zone Tab ────────────────────────────────────────────
function DangerZoneTab({ onError }: { onError: (msg: string) => void }) {
  const router  = useRouter();
  const [step, setStep]           = useState<'idle' | 'confirm'>('idle');
  const [password, setPassword]   = useState('');
  const [showPw, setShowPw]       = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!password) return;
    setIsDeleting(true);
    const result = await deleteAccount(password);
    setIsDeleting(false);
    if (result.error) {
      onError(result.error);
    } else {
      router.push('/login');
    }
  };

  const handleCancel = () => {
    setStep('idle');
    setPassword('');
    setShowPw(false);
  };

  return (
    <div className="space-y-6 max-w-lg">
      <div className="rounded-xl border border-danger-200 dark:border-danger-500/30 bg-danger-50 dark:bg-danger-500/10 p-5">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-danger-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-danger-800 dark:text-danger-400">Delete Account</h3>
            <p className="text-xs text-danger-600 dark:text-danger-400 mt-1">
              This will permanently delete your profile and all associated data — transactions, budgets, goals, accounts, and investments. This action cannot be undone.
            </p>
          </div>
        </div>

        {step === 'idle' ? (
          <button
            type="button"
            onClick={() => setStep('confirm')}
            className="mt-4 px-4 py-2 bg-danger-600 text-white text-sm font-medium rounded-lg hover:bg-danger-700 transition-colors"
          >
            Delete my account
          </button>
        ) : (
          <div className="mt-4 space-y-3">
            <div>
              <p className="text-xs font-medium text-danger-700 dark:text-danger-400 mb-1.5">
                Enter your current password to confirm deletion:
              </p>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && password && handleDelete()}
                  placeholder="Current password"
                  autoFocus
                  className="w-full border border-danger-300 dark:border-danger-500 rounded-lg px-3 py-2 pr-10 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-danger-400 bg-white dark:bg-slate-800 placeholder:text-slate-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  tabIndex={-1}
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleDelete}
                disabled={!password || isDeleting}
                className="px-4 py-2 bg-danger-600 text-white text-sm font-medium rounded-lg hover:bg-danger-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isDeleting ? 'Verifying…' : 'Permanently Delete'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm font-medium rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Page ────────────────────────────────────────────────────────
export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [toast, setToast]         = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Settings</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Manage your profile, preferences, and account.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar nav */}
        <nav className="lg:col-span-1">
          <ul className="space-y-0.5">
            {TABS.map(tab => {
              const Icon = tab.icon;
              const active = activeTab === tab.key;
              return (
                <li key={tab.key}>
                  <button
                    type="button"
                    onClick={() => setActiveTab(tab.key)}
                    className={cn(
                      'w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left',
                      active
                        ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white',
                      tab.key === 'danger' && !active && 'text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-500/10 hover:text-danger-700',
                      tab.key === 'danger' && active && 'bg-danger-50 dark:bg-danger-500/10 text-danger-700 dark:text-danger-400',
                    )}
                  >
                    <span className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      {tab.label}
                    </span>
                    <ChevronRight className={cn('w-3.5 h-3.5 opacity-40', active && 'opacity-80')} />
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Content panel */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl shadow-sm p-6">
          {activeTab === 'profile' && (
            <ProfileTab
              onSaved={(msg) => showToast(msg, 'success')}
              onError={(msg) => showToast(msg, 'error')}
            />
          )}
          {activeTab === 'security' && (
            <SecurityTab
              onSaved={(msg) => showToast(msg, 'success')}
              onError={(msg) => showToast(msg, 'error')}
            />
          )}
          {activeTab === 'notifications' && (
            <NotificationsTab
              onSaved={(msg) => showToast(msg, 'success')}
            />
          )}
          {activeTab === 'danger' && (
            <DangerZoneTab
              onError={(msg) => showToast(msg, 'error')}
            />
          )}
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  );
}
