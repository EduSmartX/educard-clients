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
    email?: AnnouncementChannelStat;
    sms?: AnnouncementChannelStat;
  };
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
