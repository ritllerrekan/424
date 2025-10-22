export type NotificationType =
  | 'batch_update'
  | 'quality_issue'
  | 'waste_threshold'
  | 'transaction_confirmation'
  | 'batch_rejection'
  | 'phase_change'
  | 'session_warning'
  | 'session_expiry';

export type NotificationSeverity = 'info' | 'warning' | 'error' | 'success';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  severity: NotificationSeverity;
  is_read: boolean;
  metadata: Record<string, any>;
  created_at: string;
  read_at?: string;
}

export interface NotificationMetadata {
  batch_id?: string;
  batch_number?: string;
  transaction_hash?: string;
  phase?: string;
  quality_score?: number;
  waste_amount?: number;
  threshold?: number;
  rejection_reason?: string;
}
