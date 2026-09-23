import { useState } from 'react';
import { format } from 'date-fns';
import { Megaphone, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ResourceFilter } from '@/components/filters/resource-filter';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PageHeader } from '@/components/common';
import type { StudentAnnouncementListItem } from '@educard/shared';
import { AnnouncementsPagination } from '@/features/announcements/components/announcements-pagination';
import { RECIPIENT_FILTER_FIELDS } from '@/features/announcements/constants/filter-fields';
import { useAnnouncementFilters } from '@/features/announcements/hooks/use-announcement-filters';
import { useStudentAnnouncements, useStudentAnnouncementDetail } from './hooks';

const DELIVERY_LABELS: Record<string, string> = { email: 'Email', sms: 'SMS' };

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
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { filters, applyFilters, resetFilters, hasActiveFilters, queryFilters, setPage } =
    useAnnouncementFilters();

  const { data, isLoading } = useStudentAnnouncements(queryFilters);
  const announcements = data?.items ?? [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Announcements"
        description="Updates from your school 📢"
        icon={Megaphone}
      />

      <Card>
        <CardContent className="pt-6">
          <div className="mb-4">
            <ResourceFilter
              fields={RECIPIENT_FILTER_FIELDS}
              defaultValues={filters}
              onFilter={applyFilters}
              onReset={resetFilters}
              searchDebounceMs={500}
            />
          </div>

          {(() => {
            if (isLoading) {
              return (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              );
            }

            if (announcements.length === 0) {
              return (
                <p className="py-8 text-center text-sm text-slate-500">
                  {hasActiveFilters
                    ? 'No announcements match your filters.'
                    : 'No announcements yet.'}
                </p>
              );
            }

            return (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Subject</TableHead>
                      <TableHead>Delivery Type</TableHead>
                      <TableHead>Dates</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {announcements.map((item: StudentAnnouncementListItem) => (
                      <TableRow key={item.public_id}>
                        <TableCell className="font-medium text-slate-800">
                          {item.subject}
                          {item.event_name ? (
                            <span className="block text-xs text-slate-500">{item.event_name}</span>
                          ) : null}
                        </TableCell>
                        <TableCell>{DELIVERY_LABELS[item.delivery_methods] ?? '—'}</TableCell>
                        <TableCell className="text-slate-600">
                          {formatDate(item.sent_at ?? item.created_at)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedId(item.public_id)}
                          >
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            );
          })()}

          {pagination ? (
            <AnnouncementsPagination pagination={pagination} onPageChange={setPage} />
          ) : null}
        </CardContent>
      </Card>

      <AnnouncementDetailDialog publicId={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  );
}
