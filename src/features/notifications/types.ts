export type NotificationType =
  | 'bill_due'
  | 'budget_exceeded'
  | 'goal_achieved'
  | 'low_balance'
  | 'recurring_generated'
  | 'insight_ready'
  | 'import_complete'
  | 'weekly_digest';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  isRead: boolean;
  emailSent: boolean;
  createdAt: string;
}

export interface GmailConnection {
  connected: boolean;
  email: string | null;
}
