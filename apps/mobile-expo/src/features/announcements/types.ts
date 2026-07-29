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

export const DELIVERY_METHOD_LABELS: Record<DeliveryMethod, string> = {
  email: 'Email',
  sms: 'SMS',
  both: 'Email and SMS',
};

export const RECIPIENT_TYPE_LABELS: Record<RecipientType, string> = {
  all_users: 'All Users',
  all_students: 'All Students',
  all_teachers: 'All Teachers',
  all_parents: 'All Parents / Guardians',
  specific_classes: 'Specific Classes',
  manual_emails: 'Manual Email List',
};
