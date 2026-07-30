/**
 * Announcements Page
 * Compose and send a school-wide announcement (email / SMS) and review sent history.
 */

import { useMemo, useState, type ReactNode } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import {
  Send,
  Loader2,
  Megaphone,
  Paperclip,
  RotateCcw,
  Info,
  Eye,
  Search,
  X,
  Mail,
  MessageSquare,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { FormError } from '@/components/ui/form-error';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { DatePicker } from '@/components/ui/date-picker';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { FileUpload, type UploadedFile } from '@/components/ui/file-upload';
import { MultiSelect, type MultiSelectOption } from '@/components/ui/multi-select';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PageHeader } from '@/components/common';
import { applyFieldErrors } from '@/lib/utils/error-handler';
import { useClasses } from '@/features/classes/hooks/use-classes';

import {
  useAnnouncements,
  useAnnouncementDetail,
  useCreateAnnouncement,
  useRetryAnnouncement,
} from '../hooks';
import {
  DELIVERY_METHOD_OPTIONS,
  RECIPIENT_TYPE_OPTIONS,
  DELIVERY_METHOD_LABELS,
  RECIPIENT_TYPE_LABELS,
  ANNOUNCEMENT_STATUS_META,
  MAX_ATTACHMENTS,
  MAX_ATTACHMENT_SIZE,
  ATTACHMENT_ACCEPT,
  type CreateAnnouncementPayload,
  type AnnouncementListItem,
} from '../types';

const announcementSchema = z
  .object({
    subject: z.string().max(500).optional(),
    delivery_methods: z.enum(['email', 'sms', 'both']),
    recipient_type: z.enum([
      'all_users',
      'all_students',
      'all_teachers',
      'all_parents',
      'specific_classes',
      'manual_emails',
    ]),
    body_html: z.string().optional(),
    event_name: z.string().max(255).optional(),
    event_date: z.date().nullable().optional(),
    event_note: z.string().optional(),
    class_ids: z.array(z.string()),
    manual_emails: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const withEmail = data.delivery_methods === 'email' || data.delivery_methods === 'both';
    const withSms = data.delivery_methods === 'sms' || data.delivery_methods === 'both';
    if (withEmail && !data.subject?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['subject'],
        message: 'Subject is required',
      });
    }
    if (data.recipient_type === 'specific_classes' && data.class_ids.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['class_ids'],
        message: 'Select at least one class',
      });
    }
    if (data.recipient_type === 'manual_emails' && !data.manual_emails?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['manual_emails'],
        message: 'Enter at least one email address',
      });
    }
    if (withSms && !data.event_name?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['event_name'],
        message: 'Event name is required for SMS notifications',
      });
    }
  });

type AnnouncementFormData = z.infer<typeof announcementSchema>;

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

function RecipientStatsCell({ item }: { item: AnnouncementListItem }) {
  const recipients = item.delivery_stats?.recipients;
  const totalUsers = recipients?.target_users;
  const eligibleUsers = recipients?.eligible_users;
  const hasStats = recipients !== undefined && totalUsers !== undefined;

  const rows: { label: string; value: number | undefined }[] = [
    { label: 'Total users', value: recipients?.target_users },
    { label: 'Active users', value: recipients?.active_users },
    { label: 'Verified (reachable)', value: recipients?.eligible_users },
    { label: 'Verified email', value: recipients?.eligible_email_users },
    { label: 'Verified phone', value: recipients?.eligible_phone_users },
    { label: 'Unverified email', value: recipients?.unverified_email_users },
    { label: 'Unverified phone', value: recipients?.unverified_phone_users },
  ];

  return (
    <div className="flex flex-col items-end gap-0.5">
      <div className="flex items-center gap-1">
        <span className="font-medium">{item.recipient_count}</span>
        {hasStats && totalUsers ? (
          <span className="text-xs text-slate-400">/ {totalUsers}</span>
        ) : null}
        {hasStats ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="text-slate-400 hover:text-slate-600"
                  aria-label="Delivery statistics"
                >
                  <Info className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-[220px] bg-white text-slate-700 shadow-md ring-1 ring-slate-200">
                <div className="space-y-1">
                  <p className="font-semibold text-slate-900">Recipient breakdown</p>
                  {rows
                    .filter((r) => r.value !== undefined)
                    .map((r) => (
                      <div key={r.label} className="flex justify-between gap-4">
                        <span className="text-slate-500">{r.label}</span>
                        <span className="font-medium text-slate-800">{r.value}</span>
                      </div>
                    ))}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : null}
      </div>
      {hasStats && eligibleUsers !== undefined && totalUsers !== undefined ? (
        <span className="text-[11px] text-slate-400">{eligibleUsers} verified</span>
      ) : null}
    </div>
  );
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

function AnnouncementDetailDialog({
  publicId,
  onClose,
}: {
  publicId: string | null;
  onClose: () => void;
}) {
  const { data, isLoading, isError } = useAnnouncementDetail(publicId);
  const statusMeta = data
    ? (ANNOUNCEMENT_STATUS_META[data.status] ?? {
        label: data.status,
        variant: 'secondary' as const,
      })
    : null;
  const channels = data?.delivery_stats?.channels;

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
                  <DialogTitle className="text-lg leading-snug">{data.subject}</DialogTitle>
                  {statusMeta ? (
                    <Badge variant={statusMeta.variant}>{statusMeta.label}</Badge>
                  ) : null}
                </div>
              </DialogHeader>

              <div className="space-y-4">
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

                <section className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                  <DetailRow
                    label="Delivery"
                    value={DELIVERY_METHOD_LABELS[data.delivery_methods]}
                  />
                  <DetailRow
                    label="Recipients"
                    value={RECIPIENT_TYPE_LABELS[data.recipient_type]}
                  />
                  {data.event_name ? <DetailRow label="Event" value={data.event_name} /> : null}
                  {data.event_date ? (
                    <DetailRow label="Event date" value={data.event_date} />
                  ) : null}
                  <DetailRow label="Sent by" value={data.sent_by_name ?? '—'} />
                  <DetailRow
                    label="Sent at"
                    value={formatDateTime(data.sent_at ?? data.created_at)}
                  />
                  <DetailRow label="Sent to" value={String(data.recipient_count)} />
                  {data.event_note ? <DetailRow label="Note" value={data.event_note} /> : null}
                  {data.manual_emails ? (
                    <DetailRow label="Emails" value={data.manual_emails} />
                  ) : null}
                </section>

                {channels?.email || channels?.sms ? (
                  <section>
                    <h4 className="mb-2 text-xs font-semibold tracking-wide text-slate-400 uppercase">
                      Delivery breakdown
                    </h4>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {channels?.email ? (
                        <ChannelStatCard
                          icon={<Mail className="h-4 w-4 text-blue-600" />}
                          title="Email"
                          stat={channels.email}
                        />
                      ) : null}
                      {channels?.sms ? (
                        <ChannelStatCard
                          icon={<MessageSquare className="h-4 w-4 text-violet-600" />}
                          title="SMS"
                          stat={channels.sms}
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

export default function AnnouncementsPage() {
  const { data: classesData, isLoading: isLoadingClasses } = useClasses({
    page: 1,
    page_size: 200,
  });
  const { data: announcements = [], isLoading: isLoadingAnnouncements } = useAnnouncements();
  const createMutation = useCreateAnnouncement();
  const retryMutation = useRetryAnnouncement();
  const [attachments, setAttachments] = useState<UploadedFile[]>([]);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [deliveryFilter, setDeliveryFilter] = useState('all');
  const [recipientFilter, setRecipientFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const hasActiveFilters =
    search.trim() !== '' ||
    deliveryFilter !== 'all' ||
    recipientFilter !== 'all' ||
    statusFilter !== 'all' ||
    fromDate !== '' ||
    toDate !== '';

  const filteredAnnouncements = useMemo(() => {
    const q = search.trim().toLowerCase();
    return announcements.filter((item) => {
      if (
        q &&
        !item.subject.toLowerCase().includes(q) &&
        !item.event_name.toLowerCase().includes(q)
      ) {
        return false;
      }
      if (deliveryFilter !== 'all' && item.delivery_methods !== deliveryFilter) {
        return false;
      }
      if (recipientFilter !== 'all' && item.recipient_type !== recipientFilter) {
        return false;
      }
      if (statusFilter !== 'all' && item.status !== statusFilter) {
        return false;
      }
      const when = (item.sent_at ?? item.created_at)?.slice(0, 10);
      if (fromDate && when && when < fromDate) {
        return false;
      }
      if (toDate && when && when > toDate) {
        return false;
      }
      return true;
    });
  }, [announcements, search, deliveryFilter, recipientFilter, statusFilter, fromDate, toDate]);

  const clearFilters = () => {
    setSearch('');
    setDeliveryFilter('all');
    setRecipientFilter('all');
    setStatusFilter('all');
    setFromDate('');
    setToDate('');
  };

  const classOptions = useMemo<MultiSelectOption[]>(
    () =>
      (classesData?.data ?? []).map((cls) => ({
        value: cls.public_id,
        label: cls.class_master?.name ? `${cls.class_master.name} - ${cls.name}` : cls.name,
      })),
    [classesData]
  );

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    setError,
    formState: { errors },
  } = useForm<AnnouncementFormData>({
    resolver: zodResolver(announcementSchema),
    defaultValues: {
      subject: '',
      delivery_methods: 'email',
      recipient_type: 'all_parents',
      body_html: '',
      event_name: '',
      event_date: null,
      event_note: '',
      class_ids: [],
      manual_emails: '',
    },
  });

  const deliveryMethods = watch('delivery_methods');
  const recipientType = watch('recipient_type');
  const includesSms = deliveryMethods === 'sms' || deliveryMethods === 'both';
  const includesEmail = deliveryMethods === 'email' || deliveryMethods === 'both';

  const onSubmit = (data: AnnouncementFormData) => {
    const withEmail = data.delivery_methods === 'email' || data.delivery_methods === 'both';
    const withSms = data.delivery_methods === 'sms' || data.delivery_methods === 'both';
    const eventName = data.event_name?.trim() ?? '';
    const payload: CreateAnnouncementPayload = {
      subject: withEmail ? (data.subject?.trim() ?? '') : eventName || 'SMS announcement',
      delivery_methods: data.delivery_methods,
      recipient_type: data.recipient_type,
      body_html: withEmail ? (data.body_html ?? '') : '',
      event_name: withSms ? eventName : '',
      event_note: withSms ? (data.event_note ?? '') : '',
      event_date: withSms && data.event_date ? format(data.event_date, 'yyyy-MM-dd') : null,
      class_ids: data.recipient_type === 'specific_classes' ? data.class_ids : [],
      manual_emails: data.recipient_type === 'manual_emails' ? (data.manual_emails ?? '') : '',
      attachments: withEmail ? attachments.map((item) => item.file) : [],
    };

    createMutation.mutate(payload, {
      onSuccess: () => {
        toast.success('Announcement queued for delivery');
        reset();
        setAttachments([]);
      },
      onError: (error) => {
        const { toastMessage } = applyFieldErrors(error, setError);
        toast.error(toastMessage || 'Failed to send announcement');
      },
    });
  };

  const handleRetry = (publicId: string) => {
    setRetryingId(publicId);
    retryMutation.mutate(publicId, {
      onSuccess: () => {
        toast.success('Failed announcement queued for retry');
      },
      onError: (error) => {
        const { toastMessage } = applyFieldErrors(error, setError);
        toast.error(toastMessage || 'Failed to retry announcement');
      },
      onSettled: () => {
        setRetryingId(null);
      },
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Announcements"
        description="Send email and SMS announcements to students, teachers, parents or specific classes."
        icon={Megaphone}
      />

      <Card>
        <CardHeader>
          <CardTitle>Compose announcement</CardTitle>
          <CardDescription>
            Choose how to deliver the message and who should receive it.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="delivery_methods">Delivery method</Label>
                <Controller
                  control={control}
                  name="delivery_methods"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="delivery_methods">
                        <SelectValue placeholder="Select delivery method" />
                      </SelectTrigger>
                      <SelectContent>
                        {DELIVERY_METHOD_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <FormError message={errors.delivery_methods?.message} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="recipient_type">Recipients</Label>
                <Controller
                  control={control}
                  name="recipient_type"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="recipient_type">
                        <SelectValue placeholder="Select recipients" />
                      </SelectTrigger>
                      <SelectContent>
                        {RECIPIENT_TYPE_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <FormError message={errors.recipient_type?.message} />
              </div>
            </div>

            {recipientType === 'specific_classes' && (
              <div className="space-y-2">
                <Label>Classes</Label>
                <Controller
                  control={control}
                  name="class_ids"
                  render={({ field }) => (
                    <MultiSelect
                      options={classOptions}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder={isLoadingClasses ? 'Loading classes...' : 'Select classes'}
                      searchPlaceholder="Search classes..."
                      emptyMessage="No classes found."
                      disabled={isLoadingClasses}
                    />
                  )}
                />
                <FormError message={errors.class_ids?.message} />
              </div>
            )}

            {recipientType === 'manual_emails' && (
              <div className="space-y-2">
                <Label htmlFor="manual_emails">Email addresses</Label>
                <Textarea
                  id="manual_emails"
                  rows={3}
                  placeholder="Enter email addresses separated by commas or new lines"
                  {...register('manual_emails')}
                />
                <FormError message={errors.manual_emails?.message} />
              </div>
            )}

            {includesEmail && (
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input id="subject" placeholder="Announcement subject" {...register('subject')} />
                <FormError message={errors.subject?.message} />
              </div>
            )}

            {includesEmail && (
              <div className="space-y-2">
                <Label htmlFor="body_html">Email body</Label>
                <Controller
                  control={control}
                  name="body_html"
                  render={({ field }) => (
                    <RichTextEditor
                      id="body_html"
                      value={field.value ?? ''}
                      onChange={field.onChange}
                      placeholder="Write the email message. Use the toolbar to format text, add lists and links."
                      error={!!errors.body_html}
                    />
                  )}
                />
                <FormError message={errors.body_html?.message} />
              </div>
            )}

            {includesEmail && (
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  <Paperclip className="h-4 w-4" />
                  Attachments
                </Label>
                <FileUpload
                  files={attachments}
                  onFilesChange={setAttachments}
                  maxFiles={MAX_ATTACHMENTS}
                  maxSize={MAX_ATTACHMENT_SIZE}
                  accept={ATTACHMENT_ACCEPT}
                  multiple
                  placeholder="Drag files here or click to attach"
                  helperText={`Up to ${MAX_ATTACHMENTS} files, 10 MB each (25 MB total). Images, PDF, Word, Excel, PowerPoint, text and CSV.`}
                />
              </div>
            )}

            {includesSms && (
              <div className="space-y-4 rounded-lg border border-slate-200 p-4">
                <div>
                  <p className="text-sm font-semibold text-slate-800">SMS details</p>
                  <p className="text-xs text-slate-500">
                    These fields build the SMS message. Event name is required.
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="event_name">Event name *</Label>
                    <Input
                      id="event_name"
                      placeholder="e.g. Annual Day"
                      {...register('event_name')}
                    />
                    <FormError message={errors.event_name?.message} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="event_date">Event date</Label>
                    <Controller
                      control={control}
                      name="event_date"
                      render={({ field }) => (
                        <DatePicker
                          value={field.value ?? null}
                          onChange={field.onChange}
                          placeholder="Select event date"
                        />
                      )}
                    />
                    <FormError message={errors.event_date?.message} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="event_note">Event note</Label>
                  <Textarea
                    id="event_note"
                    rows={2}
                    placeholder="Additional details (venue, time, etc.)"
                    {...register('event_note')}
                  />
                  <FormError message={errors.event_note?.message} />
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                Send announcement
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sent announcements</CardTitle>
          <CardDescription>The 50 most recent announcements for your school.</CardDescription>
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
            <Select value={deliveryFilter} onValueChange={setDeliveryFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Delivery" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All delivery</SelectItem>
                {DELIVERY_METHOD_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={recipientFilter} onValueChange={setRecipientFilter}>
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
            <Select value={statusFilter} onValueChange={setStatusFilter}>
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
            if (isLoadingAnnouncements) {
              return (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              );
            }
            if (filteredAnnouncements.length === 0) {
              return (
                <p className="py-8 text-center text-sm text-slate-500">
                  {announcements.length === 0
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
                      <TableHead>Delivery</TableHead>
                      <TableHead>Recipients</TableHead>
                      <TableHead className="text-right">Sent to / Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Sent</TableHead>
                      <TableHead>By</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAnnouncements.map((item) => {
                      const statusMeta = ANNOUNCEMENT_STATUS_META[item.status] ?? {
                        label: item.status,
                        variant: 'secondary' as const,
                      };
                      return (
                        <TableRow key={item.public_id}>
                          <TableCell className="font-medium">{item.subject}</TableCell>
                          <TableCell>{DELIVERY_METHOD_LABELS[item.delivery_methods]}</TableCell>
                          <TableCell>{RECIPIENT_TYPE_LABELS[item.recipient_type]}</TableCell>
                          <TableCell className="text-right">
                            <RecipientStatsCell item={item} />
                          </TableCell>
                          <TableCell>
                            <Badge variant={statusMeta.variant}>{statusMeta.label}</Badge>
                          </TableCell>
                          <TableCell>{formatDateTime(item.sent_at ?? item.created_at)}</TableCell>
                          <TableCell>{item.sent_by_name ?? '—'}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setDetailId(item.public_id)}
                              >
                                <Eye className="mr-1.5 h-3.5 w-3.5" />
                                View
                              </Button>
                              {item.status === 'failed' ? (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleRetry(item.public_id)}
                                  disabled={
                                    retryMutation.isPending && retryingId === item.public_id
                                  }
                                >
                                  {retryMutation.isPending && retryingId === item.public_id ? (
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

      <AnnouncementDetailDialog publicId={detailId} onClose={() => setDetailId(null)} />
    </div>
  );
}
