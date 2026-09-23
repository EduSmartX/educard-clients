import { ArrowLeft, ExternalLink, Loader2, Mail, Paperclip } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '@/components/common';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatFileSize } from '@/lib/utils';
import { useAnnouncementDetail } from '../hooks';
import {
  ANNOUNCEMENT_DELIVERY_METHODS,
  ANNOUNCEMENT_STATUS_META,
  DELIVERY_METHOD_LABELS,
  RECIPIENT_TYPE_LABELS,
} from '../types';

function formatDateTime(value: string | null) {
  return value ? format(new Date(value), 'dd MMM yyyy, HH:mm') : '—';
}

export default function AnnouncementDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { data, isLoading, isError } = useAnnouncementDetail(id);

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-7 w-7 animate-spin text-slate-400" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="space-y-6">
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Card>
          <CardContent className="py-12 text-center text-sm text-slate-500">
            This announcement is unavailable.
          </CardContent>
        </Card>
      </div>
    );
  }

  const status = ANNOUNCEMENT_STATUS_META[data.status] ?? {
    label: data.status,
    variant: 'secondary' as const,
  };
  const isEmail = data.delivery_methods === ANNOUNCEMENT_DELIVERY_METHODS.EMAIL;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        title="Announcement"
        description={formatDateTime(data.sent_at ?? data.created_at)}
        icon={Mail}
      >
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to announcements
        </Button>
      </PageHeader>
      <Card>
        <CardHeader className="border-b bg-slate-50/70">
          <div className="flex items-start justify-between gap-4">
            <CardTitle className="text-lg">{data.subject || data.event_name}</CardTitle>
            <Badge variant={status.variant}>{status.label}</Badge>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            <Badge variant="secondary">{DELIVERY_METHOD_LABELS[data.delivery_methods]}</Badge>
            <Badge variant="secondary">{RECIPIENT_TYPE_LABELS[data.recipient_type]}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-7 py-6">
          <section className="grid gap-3 text-sm sm:grid-cols-3">
            <div>
              <p className="text-xs text-slate-400">Sent by</p>
              <p className="font-medium text-slate-800">{data.sent_by_name ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Recipients</p>
              <p className="font-medium text-slate-800">{data.recipient_count}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Delivery</p>
              <p className="font-medium text-slate-800">
                {formatDateTime(data.sent_at ?? data.created_at)}
              </p>
            </div>
          </section>
          {isEmail && (
            <section className="space-y-2">
              <h2 className="text-sm font-semibold text-slate-800">Message</h2>
              {data.body_html ? (
                <div
                  className="prose prose-sm max-w-none text-slate-700"
                  dangerouslySetInnerHTML={{ __html: data.body_html }}
                />
              ) : (
                <p className="text-sm text-slate-500">No message content.</p>
              )}
            </section>
          )}
          {!isEmail && (
            <section className="space-y-2">
              <h2 className="text-sm font-semibold text-slate-800">Event details</h2>
              <p className="text-sm text-slate-600">{data.event_name}</p>
              {data.event_date && <p className="text-sm text-slate-500">{data.event_date}</p>}
              {data.event_note && (
                <p className="text-sm whitespace-pre-wrap text-slate-600">{data.event_note}</p>
              )}
            </section>
          )}
          {isEmail && data.attachments.length > 0 && (
            <section className="space-y-3 border-t pt-5">
              <h2 className="text-sm font-semibold text-slate-800">Attachments</h2>
              <div className="flex flex-wrap gap-2">
                {data.attachments.map((attachment) => (
                  <a
                    key={attachment.public_id}
                    href={attachment.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
                  >
                    <Paperclip className="h-4 w-4" />
                    <span className="max-w-[16rem] truncate">{attachment.file_name}</span>
                    <span className="text-xs text-slate-400">
                      {formatFileSize(attachment.file_size)}
                    </span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                ))}
              </div>
            </section>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
