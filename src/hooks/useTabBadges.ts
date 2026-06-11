'use client';
import { useNotifications } from '@/features/notifications/hooks';
import type { Notification } from '@/features/notifications/types';

/**
 * Maps an unread notification type to the nav route that should surface a
 * badge dot. Returning null means "don't badge any tab for this type".
 */
function badgeRouteForType(type: Notification['type']): string | null {
  switch (type) {
    case 'budget_exceeded': return '/budgets';
    case 'goal_achieved':   return '/goals';
    case 'low_balance':     return '/accounts';
    default:                return null;
  }
}

/**
 * Returns the set of nav hrefs that currently warrant an attention dot,
 * derived purely from unread notifications already fetched for the bell.
 * No extra network cost.
 */
export function useTabBadges(): Set<string> {
  const { data: notifications = [] } = useNotifications();

  const hrefs = new Set<string>();
  for (const n of notifications) {
    if (n.isRead) continue;
    const href = badgeRouteForType(n.type);
    if (href) hrefs.add(href);
  }
  return hrefs;
}
