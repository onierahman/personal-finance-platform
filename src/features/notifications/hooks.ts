import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  clearAllNotifications,
  fetchGmailConnection,
  disconnectGmail,
  sendTestEmail,
} from './api';

const KEYS = {
  list:  ['notifications'] as const,
  gmail: ['gmail-connection'] as const,
};

export function useNotifications() {
  return useQuery({
    queryKey: KEYS.list,
    queryFn:  () => fetchNotifications(30),
    refetchInterval: 30_000,
  });
}

export function useUnreadCount() {
  const { data } = useNotifications();
  return (data ?? []).filter(n => !n.isRead).length;
}

export function useMarkRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.list }),
  });
}

export function useMarkAllRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.list }),
  });
}

export function useClearAll() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: clearAllNotifications,
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.list }),
  });
}

export function useGmailConnection() {
  return useQuery({
    queryKey: KEYS.gmail,
    queryFn:  fetchGmailConnection,
  });
}

export function useDisconnectGmail() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: disconnectGmail,
    onSuccess:  () => qc.invalidateQueries({ queryKey: KEYS.gmail }),
  });
}

export function useSendTestEmail() {
  return useMutation({ mutationFn: sendTestEmail });
}
