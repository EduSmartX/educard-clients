/**
 * Announcements types and option constants
 */

export type DeliveryMethod = 'email' | 'sms' | 'both';

export type RecipientType =
  | 'all_users'
  | 'all_students'
  | 'all_teachers'
  | 'all_parents'
  | 'specific_classes'
  | 'manual_emails';

export type AnnouncementStatus = 'draft' | 'sent' | 'failed';

export interface AnnouncementChannelStat {
  attempted: number;
  sent: number;
  failed: number;
}

export interface AnnouncementRecipientStats {
  target_users?: number;
  active_users?: number;
  eligible_users?: number;
  eligible_email_users?: number;
  eligible_phone_users?: number;
  unverified_email_users?: number;
  unverified_phone_users?: number;
  manual_email_count?: number;
}

export interface AnnouncementDeliveryStats {
  recipients?: AnnouncementRecipientStats;
  channels?: {
    email?: AnnouncementChannelStat;
    sms?: AnnouncementChannelStat;
  };
}

export interface CreateAnnouncementPayload {
  subject: string;
  body_html?: string;
  event_name?: string;
  event_date?: string | null;
  event_note?: string;
  delivery_methods: DeliveryMethod;
  recipient_type: RecipientType;
  class_ids?: string[];
  manual_emails?: string;
  attachments?: File[];
}

export interface AnnouncementListItem {
  public_id: string;
  subject: string;
  event_name: string;
  event_date: string | null;
  delivery_methods: DeliveryMethod;
  recipient_type: RecipientType;
  status: AnnouncementStatus;
  sent_at: string | null;
  sent_by_name: string | null;
  recipient_count: number;
  delivery_stats?: AnnouncementDeliveryStats;
  created_at: string;
}

export interface AnnouncementDetail extends AnnouncementListItem {
  body_html: string;
  event_note: string;
  manual_emails: string;
}

export const DELIVERY_METHOD_OPTIONS: { value: DeliveryMethod; label: string }[] = [
  { value: 'email', label: 'Email' },
  { value: 'sms', label: 'SMS' },
  { value: 'both', label: 'Email & SMS' },
];

export const RECIPIENT_TYPE_OPTIONS: { value: RecipientType; label: string }[] = [
  { value: 'all_users', label: 'All Users' },
  { value: 'all_students', label: 'All Students' },
  { value: 'all_teachers', label: 'All Teachers' },
  { value: 'all_parents', label: 'All Parents / Guardians' },
  { value: 'specific_classes', label: 'Specific Classes' },
  { value: 'manual_emails', label: 'Manual Email List' },
];

export const DELIVERY_METHOD_LABELS: Record<DeliveryMethod, string> = {
  email: 'Email',
  sms: 'SMS',
  both: 'Email & SMS',
};

export const RECIPIENT_TYPE_LABELS: Record<RecipientType, string> = {
  all_users: 'All Users',
  all_students: 'All Students',
  all_teachers: 'All Teachers',
  all_parents: 'All Parents / Guardians',
  specific_classes: 'Specific Classes',
  manual_emails: 'Manual Email List',
};

export const ANNOUNCEMENT_STATUS_META: Record<
  AnnouncementStatus,
  { label: string; variant: 'success' | 'secondary' | 'destructive' }
> = {
  sent: { label: 'Sent', variant: 'success' },
  draft: { label: 'Draft', variant: 'secondary' },
  failed: { label: 'Failed', variant: 'destructive' },
};

// Email attachment limits — kept in sync with backend AnnouncementAttachmentConfig.
export const MAX_ATTACHMENTS = 5;
export const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024;

export const ATTACHMENT_ACCEPT: Record<string, string[]> = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/gif': ['.gif'],
  'image/webp': ['.webp'],
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/vnd.ms-excel': ['.xls'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'application/vnd.ms-powerpoint': ['.ppt'],
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
  'text/plain': ['.txt'],
  'text/csv': ['.csv'],
};
