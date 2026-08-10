import { useState } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { Megaphone, CalendarDays, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PageHeader } from '@/components/common';
import type { StudentAnnouncementListItem } from '@educard/shared';
import { useStudentAnnouncements, useStudentAnnouncementDetail } from './hooks';

function formatDate(value: string | null): string {
  if (!value) {
    return '';
  }
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '' : format(d, 'd MMM yyyy');
}

function AnnouncementDetailDialog({
  publicId,
  onClose,
}: {
  publicId: string | null;
  onClose: () => void;
}) {
  const { data, isLoading, isError } = useStudentAnnouncementDetail(publicId);

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
                <DialogTitle className="text-lg leading-snug">{data.subject}</DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                {(data.event_name || data.event_date) && (
                  <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
                    {data.event_name && <span className="font-medium">{data.event_name}</span>}
                    {data.event_date && (
                      <span className="inline-flex items-center gap-1 text-slate-500">
                        <CalendarDays className="h-3.5 w-3.5" />
                        {formatDate(data.event_date)}
                      </span>
                    )}
                  </div>
                )}

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

                {data.event_note && (
                  <section>
                    <h4 className="mb-2 text-xs font-semibold tracking-wide text-slate-400 uppercase">
                      Note
                    </h4>
                    <p className="text-sm whitespace-pre-line text-slate-700">{data.event_note}</p>
                  </section>
                )}

                <p className="text-xs text-slate-400">
                  {formatDate(data.sent_at ?? data.created_at)}
                </p>
              </div>
            </>
          );
        })()}
      </DialogContent>
    </Dialog>
  );
}

export default function StudentAnnouncementsPage() {
  const { data: announcements = [], isLoading } = useStudentAnnouncements();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Announcements"
        description="Updates from your school 📢"
        icon={Megaphone}
      />

      {(() => {
        if (isLoading) {
          return (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full rounded-xl" />
              ))}
            </div>
          );
        }

        if (announcements.length === 0) {
          return (
            <Card>
              <CardContent className="flex flex-col items-center justify-center gap-3 py-14 text-center">
                <div className="rounded-full bg-slate-100 p-4">
                  <Megaphone className="h-7 w-7 text-slate-400" />
                </div>
                <p className="text-sm text-slate-500">No announcements yet.</p>
              </CardContent>
            </Card>
          );
        }

        return (
          <div className="space-y-3">
            {announcements.map((item: StudentAnnouncementListItem, index: number) => (
              <motion.button
                key={item.public_id}
                type="button"
                onClick={() => setSelectedId(item.public_id)}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04, duration: 0.3 }}
                className="w-full text-left"
              >
                <Card className="transition-shadow hover:shadow-md">
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="shrink-0 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 p-3">
                      <Megaphone className="h-5 w-5 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-slate-800">{item.subject}</p>
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500">
                        {item.event_name && <span className="truncate">{item.event_name}</span>}
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays className="h-3 w-3" />
                          {formatDate(item.sent_at ?? item.created_at)}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
                  </CardContent>
                </Card>
              </motion.button>
            ))}
          </div>
        );
      })()}

      <AnnouncementDetailDialog publicId={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  );
}
