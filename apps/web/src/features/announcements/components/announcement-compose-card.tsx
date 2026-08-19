/**
 * Announcement Compose Card
 * Compose form for a single delivery channel (email or sms). The
 * delivery method is fixed per page, so only the relevant fields render.
 */

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { Send, Loader2, Paperclip } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { FormError } from '@/components/ui/form-error';
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
import { applyFieldErrors } from '@/lib/utils/error-handler';
import { useClasses } from '@/features/classes/hooks/use-classes';

import { useCreateAnnouncement } from '../hooks';
import {
  RECIPIENT_TYPE_OPTIONS,
  ANNOUNCEMENT_DELIVERY_METHODS,
  ANNOUNCEMENT_RECIPIENT_TYPES,
  MAX_ATTACHMENTS,
  MAX_ATTACHMENT_SIZE,
  ATTACHMENT_ACCEPT,
  type DeliveryMethod,
  type CreateAnnouncementPayload,
} from '../types';

const composeBaseSchema = z.object({
  subject: z.string().max(500).optional(),
  recipient_type: z.enum([
    ANNOUNCEMENT_RECIPIENT_TYPES.ALL_USERS,
    ANNOUNCEMENT_RECIPIENT_TYPES.ALL_STUDENTS,
    ANNOUNCEMENT_RECIPIENT_TYPES.ALL_TEACHERS,
    ANNOUNCEMENT_RECIPIENT_TYPES.ALL_PARENTS,
    ANNOUNCEMENT_RECIPIENT_TYPES.SPECIFIC_CLASSES,
    ANNOUNCEMENT_RECIPIENT_TYPES.MANUAL_EMAILS,
  ]),
  body_html: z.string().optional(),
  event_name: z.string().max(255).optional(),
  event_date: z.date().nullable().optional(),
  event_note: z.string().optional(),
  class_ids: z.array(z.string()),
  manual_emails: z.string().optional(),
});

type ComposeFormData = z.infer<typeof composeBaseSchema>;

interface AnnouncementComposeCardProps {
  fixedMethod: DeliveryMethod;
  title: string;
  description: string;
}

export function AnnouncementComposeCard({
  fixedMethod,
  title,
  description,
}: Readonly<AnnouncementComposeCardProps>) {
  const includesEmail = fixedMethod === ANNOUNCEMENT_DELIVERY_METHODS.EMAIL;
  const includesSms = fixedMethod === ANNOUNCEMENT_DELIVERY_METHODS.SMS;

  // A manual email list resolves to zero phone recipients, so it is email-only.
  const recipientOptions = includesSms
    ? RECIPIENT_TYPE_OPTIONS.filter(
        (opt) => opt.value !== ANNOUNCEMENT_RECIPIENT_TYPES.MANUAL_EMAILS
      )
    : RECIPIENT_TYPE_OPTIONS;

  const { data: classesData, isLoading: isLoadingClasses } = useClasses({
    page: 1,
    page_size: 200,
  });
  const createMutation = useCreateAnnouncement();
  const [attachments, setAttachments] = useState<UploadedFile[]>([]);

  const classOptions = classesData?.data
    ? classesData.data.map<MultiSelectOption>((cls) => ({
        value: cls.public_id,
        label: cls.class_master?.name ? `${cls.class_master.name} - ${cls.name}` : cls.name,
      }))
    : [];

  const schema = composeBaseSchema.superRefine((data, ctx) => {
    if (
      data.recipient_type === ANNOUNCEMENT_RECIPIENT_TYPES.SPECIFIC_CLASSES &&
      data.class_ids.length === 0
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['class_ids'],
        message: 'Select at least one class',
      });
    }
    if (
      data.recipient_type === ANNOUNCEMENT_RECIPIENT_TYPES.MANUAL_EMAILS &&
      !data.manual_emails?.trim()
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['manual_emails'],
        message: 'Enter at least one email address',
      });
    }
    if (includesEmail && !data.subject?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['subject'],
        message: 'Subject is required',
      });
    }
    if (includesSms && !data.event_name?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['event_name'],
        message: 'Event name is required for SMS notifications',
      });
    }
  });

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    setError,
    formState: { errors },
  } = useForm<ComposeFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      subject: '',
      recipient_type: ANNOUNCEMENT_RECIPIENT_TYPES.ALL_PARENTS,
      body_html: '',
      event_name: '',
      event_date: null,
      event_note: '',
      class_ids: [],
      manual_emails: '',
    },
  });

  const recipientType = watch('recipient_type');

  const onSubmit = (data: ComposeFormData) => {
    const eventName = data.event_name?.trim() ?? '';
    const payload: CreateAnnouncementPayload = {
      subject: includesEmail ? (data.subject?.trim() ?? '') : eventName || 'SMS announcement',
      delivery_methods: fixedMethod,
      recipient_type: data.recipient_type,
      body_html: includesEmail ? (data.body_html ?? '') : '',
      event_name: includesSms ? eventName : '',
      event_note: includesSms ? (data.event_note ?? '') : '',
      event_date: includesSms && data.event_date ? format(data.event_date, 'yyyy-MM-dd') : null,
      class_ids:
        data.recipient_type === ANNOUNCEMENT_RECIPIENT_TYPES.SPECIFIC_CLASSES ? data.class_ids : [],
      manual_emails:
        data.recipient_type === ANNOUNCEMENT_RECIPIENT_TYPES.MANUAL_EMAILS
          ? (data.manual_emails ?? '')
          : '',
      attachments: includesEmail ? attachments.map((item) => item.file) : [],
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
                    {recipientOptions.map((opt) => (
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

          {recipientType === ANNOUNCEMENT_RECIPIENT_TYPES.SPECIFIC_CLASSES && (
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

          {recipientType === ANNOUNCEMENT_RECIPIENT_TYPES.MANUAL_EMAILS && (
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
  );
}
