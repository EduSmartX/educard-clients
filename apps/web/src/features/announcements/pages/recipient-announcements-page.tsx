import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { CalendarDays, ChevronRight, Megaphone } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/common';
import {
  fetchRecipientAnnouncementDetail,
  fetchRecipientAnnouncements,
} from '../api/announcements-api';

function formatDate(value: string | null): string {
  if (!value) {
    return '';
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : format(date, 'd MMM yyyy');
}

export default function RecipientAnnouncementsPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { data: announcements = [], isLoading } = useQuery({
    queryKey: ['recipient-announcements'],
    queryFn: fetchRecipientAnnouncements,
  });
  const { data: detail, isLoading: detailLoading } = useQuery({
    queryKey: ['recipient-announcement', selectedId],
    queryFn: () => fetchRecipientAnnouncementDetail(selectedId as string),
    enabled: Boolean(selectedId),
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Announcements" description="Updates from your school" icon={Megaphone} />

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((item) => (
            <Skeleton key={item} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : announcements.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-14 text-center">
            <Megaphone className="h-7 w-7 text-slate-400" />
            <p className="text-sm text-slate-500">No announcements yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {announcements.map((item) => (
            <button
              key={item.public_id}
              type="button"
              onClick={() => setSelectedId(item.public_id)}
              className="w-full text-left"
            >
              <Card className="transition-shadow hover:shadow-md">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="shrink-0 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 p-3">
                    <Megaphone className="h-5 w-5 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-slate-800">{item.subject}</p>
                    <div className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                      <CalendarDays className="h-3 w-3" />
                      {formatDate(item.sent_at ?? item.created_at)}
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
                </CardContent>
              </Card>
            </button>
          ))}
        </div>
      )}

      <Dialog open={Boolean(selectedId)} onOpenChange={(open) => !open && setSelectedId(null)}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
          {detailLoading || !detail ? (
            <div className="space-y-3 py-6">
              <Skeleton className="h-6 w-2/3" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="text-lg leading-snug">{detail.subject}</DialogTitle>
              </DialogHeader>
              {(detail.event_name || detail.event_date) && (
                <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
                  {detail.event_name && <span className="font-medium">{detail.event_name}</span>}
                  {detail.event_date && <span>{formatDate(detail.event_date)}</span>}
                </div>
              )}
              <section>
                <h4 className="mb-2 text-xs font-semibold tracking-wide text-slate-400 uppercase">
                  Message
                </h4>
                {detail.body_html ? (
                  <div
                    className="prose prose-sm max-w-none text-slate-700"
                    dangerouslySetInnerHTML={{ __html: detail.body_html }}
                  />
                ) : (
                  <p className="text-sm text-slate-500">No message content.</p>
                )}
              </section>
              {detail.event_note && (
                <p className="text-sm whitespace-pre-line text-slate-700">{detail.event_note}</p>
              )}
              <p className="text-xs text-slate-400">
                {formatDate(detail.sent_at ?? detail.created_at)}
              </p>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
