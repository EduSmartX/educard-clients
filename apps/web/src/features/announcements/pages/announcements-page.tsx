/**
 * Announcements Page
 * Compose and send a school-wide announcement (email / SMS) and review sent history.
 */

import { useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { Send, Loader2, Megaphone } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { FormError } from '@/components/ui/form-error';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { DatePicker } from '@/components/ui/date-picker';
import { MultiSelect, type MultiSelectOption } from '@/components/ui/multi-select';
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
import { PageHeader } from '@/components/common';
import { applyFieldErrors } from '@/lib/utils/error-handler';
import { useClasses } from '@/features/classes/hooks/use-classes';

import { useAnnouncements, useCreateAnnouncement } from '../hooks';
import {
  DELIVERY_METHOD_OPTIONS,
  RECIPIENT_TYPE_OPTIONS,
  DELIVERY_METHOD_LABELS,
  RECIPIENT_TYPE_LABELS,
  ANNOUNCEMENT_STATUS_META,
  type CreateAnnouncementPayload,
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

export default function AnnouncementsPage() {
  const { data: classesData, isLoading: isLoadingClasses } = useClasses({
    page: 1,
    page_size: 200,
  });
  const { data: announcements = [], isLoading: isLoadingAnnouncements } = useAnnouncements();
  const createMutation = useCreateAnnouncement();

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
    };

    createMutation.mutate(payload, {
      onSuccess: () => {
        toast.success('Announcement queued for delivery');
        reset();
      },
      onError: (error) => {
        const { toastMessage } = applyFieldErrors(error, setError);
        toast.error(toastMessage || 'Failed to send announcement');
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
                <Textarea
                  id="body_html"
                  rows={6}
                  placeholder="Write the email message. Basic HTML is supported."
                  {...register('body_html')}
                />
                <FormError message={errors.body_html?.message} />
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
          {isLoadingAnnouncements ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : announcements.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">No announcements sent yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subject</TableHead>
                    <TableHead>Delivery</TableHead>
                    <TableHead>Recipients</TableHead>
                    <TableHead className="text-right">Sent to</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Sent</TableHead>
                    <TableHead>By</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {announcements.map((item) => {
                    const statusMeta = ANNOUNCEMENT_STATUS_META[item.status] ?? {
                      label: item.status,
                      variant: 'secondary' as const,
                    };
                    return (
                      <TableRow key={item.public_id}>
                        <TableCell className="font-medium">{item.subject}</TableCell>
                        <TableCell>{DELIVERY_METHOD_LABELS[item.delivery_methods]}</TableCell>
                        <TableCell>{RECIPIENT_TYPE_LABELS[item.recipient_type]}</TableCell>
                        <TableCell className="text-right">{item.recipient_count}</TableCell>
                        <TableCell>
                          <Badge variant={statusMeta.variant}>{statusMeta.label}</Badge>
                        </TableCell>
                        <TableCell>{formatDateTime(item.sent_at ?? item.created_at)}</TableCell>
                        <TableCell>{item.sent_by_name ?? '—'}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
