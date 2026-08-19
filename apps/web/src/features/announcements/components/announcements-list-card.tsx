/**
 * Announcements List Card
 * Reusable search/filter + trimmed table (Subject, Delivery Type, Dates, Action)
 * used by the Email / SMS / Both announcement pages.
 */

import { Eye, Loader2, RotateCcw, Search, X } from 'lucide-react';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
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
import {
  ANNOUNCEMENT_STATUS_META,
  DELIVERY_METHOD_LABELS,
  RECIPIENT_TYPE_OPTIONS,
  type AnnouncementListItem,
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

interface AnnouncementsListCardProps {
  title: string;
  description: string;
  items: AnnouncementListItem[];
  isLoading: boolean;
  onView: (publicId: string) => void;
  onRetry: (publicId: string) => void;
  isRetrying: boolean;
  retryingId: string | null;
}

export function AnnouncementsListCard({
  title,
  description,
  items,
  isLoading,
  onView,
  onRetry,
  isRetrying,
  retryingId,
}: Readonly<AnnouncementsListCardProps>) {
  const {
    search,
    setSearch,
    recipientFilter,
    setRecipientFilter,
    statusFilter,
    setStatusFilter,
    fromDate,
    setFromDate,
    toDate,
    setToDate,
    hasActiveFilters,
    filteredItems,
    clearFilters,
  } = useAnnouncementFilters(items);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex flex-wrap items-end gap-3">
          <div className="relative min-w-[200px] flex-1">
            <Search className="pointer-events-none absolute top-2.5 left-2.5 h-4 w-4 text-slate-400" />
            <Input
              className="pl-8"
              placeholder="Search by subject or event..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select
            value={recipientFilter}
            onValueChange={(v) => setRecipientFilter(v as typeof recipientFilter)}
          >
            <SelectTrigger className="w-[170px]">
              <SelectValue placeholder="Recipients" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All recipients</SelectItem>
              {RECIPIENT_TYPE_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}
          >
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All status</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex flex-col gap-1">
            <Label className="text-xs text-slate-500">From</Label>
            <Input
              type="date"
              className="w-[150px]"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-xs text-slate-500">To</Label>
            <Input
              type="date"
              className="w-[150px]"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>
          {hasActiveFilters ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={clearFilters}
              className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              <X className="mr-1 h-4 w-4" />
              Clear
            </Button>
          ) : null}
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
          if (filteredItems.length === 0) {
            return (
              <p className="py-8 text-center text-sm text-slate-500">
                {items.length === 0
                  ? 'No announcements sent yet.'
                  : 'No announcements match your filters.'}
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
                  {filteredItems.map((item) => {
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
      </CardContent>
    </Card>
  );
}
