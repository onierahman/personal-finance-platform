'use client';

import { useCallback, useEffect, useState } from 'react';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? '';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
  return output;
}

interface PushState {
  supported: boolean;
  configured: boolean;
  permission: NotificationPermission | 'default';
  subscribed: boolean;
  loading: boolean;
}

/**
 * Client controller for Web Push: registers the service worker, manages the
 * browser subscription, and syncs it with the server. Degrades cleanly when
 * the browser doesn't support push or no VAPID key is configured.
 */
export function usePushNotifications() {
  const supported =
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window;
  const configured = Boolean(VAPID_PUBLIC_KEY);

  const [state, setState] = useState<PushState>({
    supported,
    configured,
    permission: 'default',
    subscribed: false,
    loading: true,
  });

  // Read current subscription status on mount.
  useEffect(() => {
    if (!supported) {
      setState((s) => ({ ...s, loading: false }));
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const reg = await navigator.serviceWorker.getRegistration();
        const sub = reg ? await reg.pushManager.getSubscription() : null;
        if (!cancelled) {
          setState((s) => ({
            ...s,
            permission: Notification.permission,
            subscribed: Boolean(sub),
            loading: false,
          }));
        }
      } catch {
        if (!cancelled) setState((s) => ({ ...s, loading: false }));
      }
    })();
    return () => { cancelled = true; };
  }, [supported]);

  const subscribe = useCallback(async (): Promise<{ ok: boolean; error?: string }> => {
    if (!supported) return { ok: false, error: 'Push is not supported on this device.' };
    if (!configured) return { ok: false, error: 'Push notifications are not configured yet.' };

    setState((s) => ({ ...s, loading: true }));
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setState((s) => ({ ...s, permission, loading: false }));
        return { ok: false, error: 'Permission denied.' };
      }

      const reg = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
      });

      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub.toJSON()),
      });
      if (!res.ok) throw new Error('Failed to save subscription');

      setState((s) => ({ ...s, subscribed: true, permission, loading: false }));
      return { ok: true };
    } catch (e) {
      setState((s) => ({ ...s, loading: false }));
      return { ok: false, error: e instanceof Error ? e.message : 'Could not enable push.' };
    }
  }, [supported, configured]);

  const unsubscribe = useCallback(async (): Promise<{ ok: boolean; error?: string }> => {
    if (!supported) return { ok: false };
    setState((s) => ({ ...s, loading: true }));
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = reg ? await reg.pushManager.getSubscription() : null;
      if (sub) {
        await fetch('/api/push/unsubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setState((s) => ({ ...s, subscribed: false, loading: false }));
      return { ok: true };
    } catch (e) {
      setState((s) => ({ ...s, loading: false }));
      return { ok: false, error: e instanceof Error ? e.message : 'Could not disable push.' };
    }
  }, [supported]);

  return { ...state, subscribe, unsubscribe };
}
