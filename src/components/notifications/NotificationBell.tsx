'use client';

import { useRef, useState, useEffect } from 'react';
import { Bell, Check, Trash2, X, BellOff } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  useNotifications,
  useUnreadCount,
  useMarkRead,
  useMarkAllRead,
  useClearAll,
} from '@/features/notifications/hooks';
import type { Notification } from '@/features/notifications/types';
import { formatDistanceToNow } from 'date-fns';

const TYPE_LABELS: Record<Notification['type'], string> = {
  bill_due:             'Upcoming Bill',
  budget_exceeded:      'Budget Alert',
  goal_achieved:        'Goal Reached',
  low_balance:          'Low Balance',
  recurring_generated:  'Auto-Posted',
  insight_ready:        'AI Insight',
  import_complete:      'Import Done',
  weekly_digest:        'Weekly Digest',
};

const TYPE_COLORS: Record<Notification['type'], string> = {
  bill_due:             'bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-400',
  budget_exceeded:      'bg-danger-100 text-danger-700 dark:bg-danger-900/30 dark:text-danger-400',
  goal_achieved:        'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-400',
  low_balance:          'bg-danger-100 text-danger-700 dark:bg-danger-900/30 dark:text-danger-400',
  recurring_generated:  'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400',
  insight_ready:        'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  import_complete:      'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-400',
  weekly_digest:        'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
};

function getNotificationLink(n: Notification): string | null {
  switch (n.type) {
    case 'bill_due':
    case 'recurring_generated':
      return '/recurring';
    case 'budget_exceeded':
      return '/budgets';
    case 'goal_achieved':
      return '/goals';
    case 'low_balance':
      return '/accounts';
    case 'import_complete':
      return '/transactions';
    default:
      return null;
  }
}

export function NotificationBell() {
  const [open, setOpen]     = useState(false);
  const ref                 = useRef<HTMLDivElement>(null);
  const router              = useRouter();
  const { data: notifications = [] } = useNotifications();
  const unreadCount         = useUnreadCount();
  const { mutate: markRead }    = useMarkRead();
  const { mutate: markAll }     = useMarkAllRead();
  const { mutate: clearAll }    = useClearAll();

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  function handleNotificationClick(n: Notification) {
    if (!n.isRead) markRead(n.id);
    const link = getNotificationLink(n);
    if (link) {
      router.push(link);
      setOpen(false);
    }
  }

  return (
    <div className="relative" ref={ref}>
      {/* Bell button */}
      <button
        onClick={() => setOpen(v => !v)}
        className="relative p-2 rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 flex items-center justify-center rounded-full bg-primary-600 text-white text-[10px] font-bold leading-none px-1">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 max-h-[480px] flex flex-col bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-slate-500" />
              <span className="text-sm font-semibold text-slate-900 dark:text-white">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 text-xs font-medium">
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={() => markAll()}
                  title="Mark all as read"
                  className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={() => clearAll()}
                  title="Clear all"
                  className="p-1.5 rounded-md text-slate-400 hover:text-danger-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2 text-slate-400">
                <BellOff className="w-8 h-8 opacity-40" />
                <p className="text-sm">No notifications yet</p>
              </div>
            ) : (
              <ul>
                {notifications.map(n => (
                  <li key={n.id}>
                    <button
                      onClick={() => handleNotificationClick(n)}
                      className={cn(
                        'w-full text-left px-4 py-3 flex gap-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border-b border-slate-50 dark:border-slate-800/50 last:border-0',
                        !n.isRead && 'bg-primary-50/40 dark:bg-primary-900/10',
                      )}
                    >
                      {/* Unread dot */}
                      <div className="mt-1 flex-shrink-0">
                        <div className={cn(
                          'w-2 h-2 rounded-full mt-0.5',
                          n.isRead ? 'bg-transparent' : 'bg-primary-500',
                        )} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className={cn(
                            'text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0',
                            TYPE_COLORS[n.type],
                          )}>
                            {TYPE_LABELS[n.type]}
                          </span>
                          <span className="text-[10px] text-slate-400 ml-auto flex-shrink-0">
                            {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                        <p className="text-xs font-medium text-slate-800 dark:text-slate-200 leading-snug">{n.title}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-snug line-clamp-2">{n.body}</p>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 border-t border-slate-100 dark:border-slate-800 flex-shrink-0">
            <p className="text-[10px] text-slate-400 text-center">
              Notifications auto-expire after 30 days
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
