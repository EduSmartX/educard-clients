/**
 * Announcements List Card
 * Reusable filter + trimmed table (Subject, Delivery Type, Dates, Action)
 * used by the Email / SMS announcement pages.
 */

import { Eye, Loader2, RotateCcw } from 'lucide-react';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ResourceFilter } from '@/components/filters/resource-filter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';

import { useAnnouncementFilters } from '../hooks/use-announcement-filters';
import { useAnnouncements } from '../hooks';
import { AnnouncementsPagination } from './announcements-pagination';
import { ADMIN_FILTER_FIELDS } from '../constants/filter-fields';
import { ANNOUNCEMENT_STATUS_META, DELIVERY_METHOD_LABELS, type DeliveryMethod } from '../types';

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

interface AnnouncementsListCardProps {
  title: string;
  description: string;
  deliveryMethod: DeliveryMethod;
  onView: (publicId: string) => void;
  onRetry: (publicId: string) => void;
  isRetrying: boolean;
  retryingId: string | null;
}

export function AnnouncementsListCard({
  title,
  description,
  deliveryMethod,
  onView,
  onRetry,
  isRetrying,
  retryingId,
}: Readonly<AnnouncementsListCardProps>) {
  const { hasActiveFilters, queryFilters, filters, applyFilters, resetFilters, setPage } =
    useAnnouncementFilters(deliveryMethod);

  const { data, isLoading } = useAnnouncements(queryFilters);
  const items = data?.items ?? [];
  const pagination = data?.pagination;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <ResourceFilter
            fields={ADMIN_FILTER_FIELDS}
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
          if (items.length === 0) {
            return (
              <p className="py-8 text-center text-sm text-slate-500">
                {hasActiveFilters
                  ? 'No announcements match your filters.'
                  : 'No announcements sent yet.'}
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
                  {items.map((item) => {
                    const statusMeta = ANNOUNCEMENT_STATUS_META[item.status] ?? {
                      label: item.status,
                      variant: 'secondary' as const,
                    };
                    return (
                      <TableRow key={item.public_id}>
                        <TableCell className="font-medium">
                          {item.subject || item.event_name}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span>{DELIVERY_METHOD_LABELS[item.delivery_methods]}</span>
                            <Badge variant={statusMeta.variant}>{statusMeta.label}</Badge>
                          </div>
                        </TableCell>
                        <TableCell>{formatDateTime(item.sent_at ?? item.created_at)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => onView(item.public_id)}
                            >
                              <Eye className="mr-1.5 h-3.5 w-3.5" />
                              View
                            </Button>
                            {item.status === 'failed' ? (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => onRetry(item.public_id)}
                                disabled={isRetrying && retryingId === item.public_id}
                              >
                                {isRetrying && retryingId === item.public_id ? (
                                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <RotateCcw className="mr-2 h-3.5 w-3.5" />
                                )}
                                Retry
                              </Button>
                            ) : null}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
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
  );
}
