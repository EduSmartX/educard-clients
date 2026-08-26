/**
 * Announcement Detail Dialog
 * Shows full details for a single announcement. The set of fields rendered
 * depends on the channel variant (email or sms) so each announcement
 * type gets its own focused view instead of one dialog mixing both.
 */

import type { ReactNode } from 'react';
import { format } from 'date-fns';
import { Mail, MessageSquare } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

import { useAnnouncementDetail } from '../hooks';
import {
  ANNOUNCEMENT_DELIVERY_METHODS,
  ANNOUNCEMENT_STATUS_META,
  DELIVERY_METHOD_LABELS,
  RECIPIENT_TYPE_LABELS,
  type DeliveryMethod,
} from '../types';

function formatDateTime(value: string | null): string {
  if (!value) {
    return '—';
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return '—';
  }
  return format(parsed, 'dd MMM yyyy, HH:mm');
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-slate-500">{label}</span>
      <span className="text-right font-medium text-slate-800">{value}</span>
    </div>
  );
}

function ChannelStatCard({
  icon,
  title,
  stat,
}: {
  icon: ReactNode;
  title: string;
  stat: { attempted: number; sent: number; failed: number };
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <div className="mb-2 flex items-center gap-2 font-medium text-slate-700">
        {icon}
        {title}
      </div>
      <div className="flex justify-between text-xs">
        <span className="text-slate-500">
          Attempted <b className="text-slate-800">{stat.attempted}</b>
        </span>
        <span className="text-green-600">
          Sent <b>{stat.sent}</b>
        </span>
        <span className="text-red-600">
          Failed <b>{stat.failed}</b>
        </span>
      </div>
    </div>
  );
}

interface AnnouncementDetailDialogProps {
  publicId: string | null;
  variant: DeliveryMethod;
  onClose: () => void;
}

export function AnnouncementDetailDialog({
  publicId,
  variant,
  onClose,
}: Readonly<AnnouncementDetailDialogProps>) {
  const { data, isLoading, isError } = useAnnouncementDetail(publicId);
  const statusMeta = data
    ? (ANNOUNCEMENT_STATUS_META[data.status] ?? {
        label: data.status,
        variant: 'secondary' as const,
      })
    : null;
  const channels = data?.delivery_stats?.channels;
  const emailChannel = channels?.[ANNOUNCEMENT_DELIVERY_METHODS.EMAIL];
  const smsChannel = channels?.[ANNOUNCEMENT_DELIVERY_METHODS.SMS];
  const showEmail = variant === ANNOUNCEMENT_DELIVERY_METHODS.EMAIL;
  const showSms = variant === ANNOUNCEMENT_DELIVERY_METHODS.SMS;

  return (
    <Dialog open={!!publicId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        {(() => {
          if (isLoading) {
            return (
              <div className="space-y-3 py-6">
                <Skeleton className="h-6 w-2/3" />
                <Skeleton className="h-24 w-full" />
              </div>
            );
          }
          if (isError || !data) {
            return (
              <p className="py-8 text-center text-sm text-slate-500">
                Could not load this announcement.
              </p>
            );
          }
          return (
            <>
              <DialogHeader>
                <div className="flex items-start justify-between gap-3">
                  <DialogTitle className="text-lg leading-snug">
                    {data.subject || data.event_name}
                  </DialogTitle>
                  {statusMeta ? (
                    <Badge variant={statusMeta.variant}>{statusMeta.label}</Badge>
                  ) : null}
                </div>
              </DialogHeader>

              <div className="space-y-4">
                {showEmail && (
                  <section>
                    <h4 className="mb-2 text-xs font-semibold tracking-wide text-slate-400 uppercase">
                      Message
                    </h4>
                    {data.body_html ? (
                      // body_html is sanitized to a safe allowlist on the server before storage.
                      <div
                        className="prose prose-sm max-w-none text-slate-700"
                        dangerouslySetInnerHTML={{ __html: data.body_html }}
                      />
                    ) : (
                      <p className="text-sm text-slate-500">No message content.</p>
                    )}
                  </section>
                )}

                {showSms && (data.event_name || data.event_date || data.event_note) && (
                  <section>
                    <h4 className="mb-2 text-xs font-semibold tracking-wide text-slate-400 uppercase">
                      Event details
                    </h4>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                      {data.event_name ? <DetailRow label="Event" value={data.event_name} /> : null}
                      {data.event_date ? (
                        <DetailRow label="Event date" value={data.event_date} />
                      ) : null}
                      {data.event_note ? <DetailRow label="Note" value={data.event_note} /> : null}
                    </div>
                  </section>
                )}

                <section className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                  <DetailRow
                    label="Delivery"
                    value={DELIVERY_METHOD_LABELS[data.delivery_methods]}
                  />
                  <DetailRow
                    label="Recipients"
                    value={RECIPIENT_TYPE_LABELS[data.recipient_type]}
                  />
                  <DetailRow label="Sent by" value={data.sent_by_name ?? '—'} />
                  <DetailRow
                    label="Sent at"
                    value={formatDateTime(data.sent_at ?? data.created_at)}
                  />
                  <DetailRow label="Sent to" value={String(data.recipient_count)} />
                  {showEmail && data.manual_emails ? (
                    <DetailRow label="Emails" value={data.manual_emails} />
                  ) : null}
                </section>

                {(showEmail && emailChannel) || (showSms && smsChannel) ? (
                  <section>
                    <h4 className="mb-2 text-xs font-semibold tracking-wide text-slate-400 uppercase">
                      Delivery breakdown
                    </h4>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {showEmail && emailChannel ? (
                        <ChannelStatCard
                          icon={<Mail className="h-4 w-4 text-blue-600" />}
                          title="Email"
                          stat={emailChannel}
                        />
                      ) : null}
                      {showSms && smsChannel ? (
                        <ChannelStatCard
                          icon={<MessageSquare className="h-4 w-4 text-violet-600" />}
                          title="SMS"
                          stat={smsChannel}
                        />
                      ) : null}
                    </div>
                  </section>
                ) : null}
              </div>
            </>
          );
        })()}
      </DialogContent>
    </Dialog>
  );
}
