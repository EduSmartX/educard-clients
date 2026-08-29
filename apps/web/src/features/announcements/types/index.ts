/**
 * Announcements types and option constants
 */

export const ANNOUNCEMENT_DELIVERY_METHODS = {
  EMAIL: 'email',
  SMS: 'sms',
} as const;

export type DeliveryMethod =
  (typeof ANNOUNCEMENT_DELIVERY_METHODS)[keyof typeof ANNOUNCEMENT_DELIVERY_METHODS];

export const ANNOUNCEMENT_RECIPIENT_TYPES = {
  ALL_USERS: 'all_users',
  ALL_STUDENTS: 'all_students',
  ALL_TEACHERS: 'all_teachers',
  ALL_PARENTS: 'all_parents',
  SPECIFIC_CLASSES: 'specific_classes',
  MANUAL_EMAILS: 'manual_emails',
} as const;

export type RecipientType =
  (typeof ANNOUNCEMENT_RECIPIENT_TYPES)[keyof typeof ANNOUNCEMENT_RECIPIENT_TYPES];

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
    [ANNOUNCEMENT_DELIVERY_METHODS.EMAIL]?: AnnouncementChannelStat;
    [ANNOUNCEMENT_DELIVERY_METHODS.SMS]?: AnnouncementChannelStat;
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
  attachments: AnnouncementAttachment[];
}

export interface AnnouncementAttachment {
  public_id: string;
  file_name: string;
  file_url: string;
  mime_type: string;
  file_size: number;
}

export const DELIVERY_METHOD_OPTIONS: { value: DeliveryMethod; label: string }[] = [
  { value: ANNOUNCEMENT_DELIVERY_METHODS.EMAIL, label: 'Email' },
  { value: ANNOUNCEMENT_DELIVERY_METHODS.SMS, label: 'SMS' },
];

export const RECIPIENT_TYPE_OPTIONS: { value: RecipientType; label: string }[] = [
  { value: ANNOUNCEMENT_RECIPIENT_TYPES.ALL_USERS, label: 'All Users' },
  { value: ANNOUNCEMENT_RECIPIENT_TYPES.ALL_STUDENTS, label: 'All Students' },
  { value: ANNOUNCEMENT_RECIPIENT_TYPES.ALL_TEACHERS, label: 'All Teachers' },
  { value: ANNOUNCEMENT_RECIPIENT_TYPES.ALL_PARENTS, label: 'All Parents / Guardians' },
  { value: ANNOUNCEMENT_RECIPIENT_TYPES.SPECIFIC_CLASSES, label: 'Specific Classes' },
  { value: ANNOUNCEMENT_RECIPIENT_TYPES.MANUAL_EMAILS, label: 'Manual Email List' },
];

export const DELIVERY_METHOD_LABELS: Record<DeliveryMethod, string> = {
  [ANNOUNCEMENT_DELIVERY_METHODS.EMAIL]: 'Email',
  [ANNOUNCEMENT_DELIVERY_METHODS.SMS]: 'SMS',
};

export const RECIPIENT_TYPE_LABELS: Record<RecipientType, string> = {
  [ANNOUNCEMENT_RECIPIENT_TYPES.ALL_USERS]: 'All Users',
  [ANNOUNCEMENT_RECIPIENT_TYPES.ALL_STUDENTS]: 'All Students',
  [ANNOUNCEMENT_RECIPIENT_TYPES.ALL_TEACHERS]: 'All Teachers',
  [ANNOUNCEMENT_RECIPIENT_TYPES.ALL_PARENTS]: 'All Parents / Guardians',
  [ANNOUNCEMENT_RECIPIENT_TYPES.SPECIFIC_CLASSES]: 'Specific Classes',
  [ANNOUNCEMENT_RECIPIENT_TYPES.MANUAL_EMAILS]: 'Manual Email List',
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
