import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Megaphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
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
import { fetchRecipientAnnouncementDetail } from '../api/announcements-api';
import { AnnouncementsPagination } from '../components/announcements-pagination';
import { RECIPIENT_FILTER_FIELDS } from '../constants/filter-fields';
import { useRecipientAnnouncements } from '../hooks';
import { useAnnouncementFilters } from '../hooks/use-announcement-filters';
import { DELIVERY_METHOD_LABELS } from '../types';

function formatDate(value: string | null): string {
  if (!value) {
    return '—';
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : format(date, 'd MMM yyyy');
}

export default function RecipientAnnouncementsPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { filters, applyFilters, resetFilters, hasActiveFilters, queryFilters, setPage } =
    useAnnouncementFilters();

  const { data, isLoading } = useRecipientAnnouncements(queryFilters);
  const announcements = data?.items ?? [];
  const pagination = data?.pagination;

  const { data: detail, isLoading: detailLoading } = useQuery({
    queryKey: ['recipient-announcement', selectedId],
    queryFn: () => fetchRecipientAnnouncementDetail(selectedId as string),
    enabled: Boolean(selectedId),
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Announcements" description="Updates from your school" icon={Megaphone} />

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
                    {announcements.map((item) => (
                      <TableRow key={item.public_id}>
                        <TableCell className="font-medium text-slate-800">
                          {item.subject}
                          {item.event_name ? (
                            <span className="block text-xs text-slate-500">{item.event_name}</span>
                          ) : null}
                        </TableCell>
                        <TableCell>
                          {DELIVERY_METHOD_LABELS[item.delivery_methods] ?? '—'}
                        </TableCell>
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
