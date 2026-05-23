/**
 * Homework Form Page
 * Create or Edit a single homework assignment
 * Detects mode from URL: /homework/new (create) vs /homework/:id/edit (edit)
 */

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { parse, format, addDays, isWeekend } from 'date-fns';
import {
  Link as LinkIcon,
  Loader2,
  CalendarDays,
  Paperclip,
  Trash2,
  FileText,
  Image as ImageIcon,
  Video,
  File,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { FormError } from '@/components/ui/form-error';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { FileUpload, type UploadedFile } from '@/components/ui/file-upload';
import { cn, formatFileSize } from '@/lib/utils';
import { applyFieldErrors } from '@/lib/utils/error-handler';
import { SUCCESS_MESSAGES } from '@/constants/app-config';
import { PageHeader } from '@/components/common';

import {
  useTeacherClasses,
  useHomeworkDetail,
  useCreateHomework,
  useUpdateHomework,
  useUploadAttachment,
  useDeleteAttachment,
} from '../hooks';
import {
  HOMEWORK_PRIORITY_OPTIONS,
  SUBMISSION_TYPE_OPTIONS,
  type HomeworkAttachment,
} from '../types';

// Allowed attachment file types
const ACCEPTED_FILE_TYPES = {
  'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'],
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/vnd.ms-excel': ['.xls'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'application/vnd.ms-powerpoint': ['.ppt'],
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILES = 5;

// Validation schema
const homeworkSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().optional(),
  instructions: z.string().optional(),
  subject_public_id: z.string().min(1, 'Subject is required'),
  assigned_date: z.date({ required_error: 'Assignment date is required' }),
  due_datetime: z.date({ required_error: 'Due date and time is required' }),
  status: z.enum(['draft', 'published']),
  priority: z.enum(['low', 'medium', 'high']),
  submission_type: z.enum(['online', 'offline', 'both']),
  reference_link: z.string().url('Must be a valid URL').optional().or(z.literal('')),
});

type HomeworkFormData = z.infer<typeof homeworkSchema>;

// Helper to get today or next working day
function getTodayOrNextWorkingDay(): Date {
  let date = new Date();
  while (isWeekend(date)) {
    date = addDays(date, 1);
  }
  return date;
}

export default function HomeworkFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const isEditMode = Boolean(id);
  const pageTitle = isEditMode ? 'Edit Homework' : 'Create Homework';

  // Get URL params for pre-filling (create mode)
  const initialSubjectId = searchParams.get('subject') || '';
  const initialDateStr = searchParams.get('date') || '';

  // Queries
  const { data: teacherClasses = [], isLoading: isLoadingClasses } = useTeacherClasses();
  const { data: existingHomework, isLoading: isLoadingHomework } = useHomeworkDetail(
    isEditMode ? id : undefined
  );

  // Mutations
  const createMutation = useCreateHomework();
  const updateMutation = useUpdateHomework();
  const uploadAttachmentMutation = useUploadAttachment();
  const deleteAttachmentMutation = useDeleteAttachment();

  // Attachment state
  const [newAttachments, setNewAttachments] = useState<UploadedFile[]>([]);
  const [existingAttachments, setExistingAttachments] = useState<HomeworkAttachment[]>([]);
  const [isUploadingAttachments, setIsUploadingAttachments] = useState(false);

  // Get all subjects from all classes
  const allSubjects = useMemo(() => {
    return teacherClasses.flatMap((cls) =>
      cls.subjects.map((subject) => ({
        ...subject,
        className: cls.name,
        classPublicId: cls.public_id,
      }))
    );
  }, [teacherClasses]);

  // Calculate default dates
  const getDefaultAssignedDate = () => {
    if (initialDateStr) {
      const parsedDate = parse(initialDateStr, 'yyyy-MM-dd', new Date());
      const today = getTodayOrNextWorkingDay();
      // Only use URL date if it's today or future
      if (parsedDate >= new Date(today.toDateString())) {
        return parsedDate;
      }
    }
    return getTodayOrNextWorkingDay();
  };

  const getDefaultDueDateTime = (assignedDate: Date) => {
    const dueDate = addDays(assignedDate, 1);
    dueDate.setHours(17, 0, 0, 0); // 5:00 PM
    return dueDate;
  };

  const initialAssignedDate = getDefaultAssignedDate();

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<HomeworkFormData>({
    resolver: zodResolver(homeworkSchema),
    defaultValues: {
      title: '',
      description: '',
      instructions: '',
      subject_public_id: initialSubjectId,
      assigned_date: initialAssignedDate,
      due_datetime: getDefaultDueDateTime(initialAssignedDate),
      status: 'published',
      priority: 'medium',
      submission_type: 'offline',
      reference_link: '',
    },
  });

  const watchedAssignedDate = watch('assigned_date');

  // Populate form when editing
  useEffect(() => {
    if (existingHomework && isEditMode) {
      reset({
        title: existingHomework.title,
        description: existingHomework.description || '',
        instructions: existingHomework.instructions || '',
        subject_public_id: existingHomework.subject_public_id,
        assigned_date: existingHomework.assigned_date
          ? parse(existingHomework.assigned_date, 'yyyy-MM-dd', new Date())
          : new Date(existingHomework.due_datetime),
        due_datetime: new Date(existingHomework.due_datetime),
        status: existingHomework.status as 'draft' | 'published',
        priority: existingHomework.priority,
        submission_type: existingHomework.submission_type,
        reference_link: existingHomework.reference_link || '',
      });
      // Load existing attachments
      if (existingHomework.attachments) {
        setExistingAttachments(existingHomework.attachments);
      }
    }
  }, [existingHomework, isEditMode, reset]);

  const handleBack = () => navigate(-1);

  // Handle deleting existing attachment
  const handleDeleteExistingAttachment = useCallback(
    async (attachmentId: string) => {
      if (!id) {
        return;
      }
      try {
        await deleteAttachmentMutation.mutateAsync({
          homeworkPublicId: id,
          attachmentId,
        });
        setExistingAttachments((prev) => prev.filter((a) => a.public_id !== attachmentId));
      } catch {
        // Error is handled by mutation
      }
    },
    [id, deleteAttachmentMutation]
  );

  // Upload attachments for a homework
  const uploadAttachments = async (homeworkPublicId: string) => {
    if (newAttachments.length === 0) {
      return;
    }

    setIsUploadingAttachments(true);
    const uploadPromises = newAttachments.map((attachment) =>
      uploadAttachmentMutation.mutateAsync({
        homeworkPublicId,
        file: attachment.file,
        fileName: attachment.name,
      })
    );

    try {
      await Promise.all(uploadPromises);
      setNewAttachments([]);
    } finally {
      setIsUploadingAttachments(false);
    }
  };

  // Helper to get file icon for existing attachments
  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image')) {
      return ImageIcon;
    }
    if (fileType === 'pdf' || fileType === 'document') {
      return FileText;
    }
    if (fileType === 'video') {
      return Video;
    }
    return File;
  };

  const onSubmit = async (data: HomeworkFormData) => {
    try {
      let homeworkPublicId: string;

      if (isEditMode && id) {
        // For edit mode, don't send assigned_date (it's not editable)
        const updatePayload = {
          title: data.title,
          description: data.description,
          instructions: data.instructions,
          due_datetime: data.due_datetime.toISOString(),
          status: data.status,
          priority: data.priority,
          submission_type: data.submission_type,
          reference_link: data.reference_link || undefined,
        };
        await updateMutation.mutateAsync({ publicId: id, data: updatePayload });
        homeworkPublicId = id;

        // Upload new attachments
        if (newAttachments.length > 0) {
          await uploadAttachments(homeworkPublicId);
        }

        toast.success(SUCCESS_MESSAGES.homeworkUpdated);
        navigate(`/homework/${id}`);
      } else {
        // For create mode, include assigned_date
        const createPayload = {
          title: data.title,
          description: data.description,
          instructions: data.instructions,
          subject_public_id: data.subject_public_id,
          assigned_date: format(data.assigned_date, 'yyyy-MM-dd'),
          due_datetime: data.due_datetime.toISOString(),
          status: data.status,
          priority: data.priority,
          submission_type: data.submission_type,
          reference_link: data.reference_link || undefined,
        };
        const result = await createMutation.mutateAsync(createPayload);
        homeworkPublicId = result.public_id;

        // Upload attachments after homework is created
        if (newAttachments.length > 0) {
          await uploadAttachments(homeworkPublicId);
        }

        toast.success(SUCCESS_MESSAGES.homeworkCreated);
        navigate(`/homework/${result.public_id}`);
      }
    } catch (error) {
      // Apply field-level validation errors to form fields
      const result = applyFieldErrors(error, setError);
      // Show toast only for non-field errors (server errors, network issues, etc.)
      if (!result.hasFieldErrors) {
        toast.error(isEditMode ? 'Failed to update homework' : 'Failed to create homework');
      }
    }
  };

  const isLoading = isLoadingClasses || (isEditMode && isLoadingHomework);
  const isSaving =
    createMutation.isPending || updateMutation.isPending || isSubmitting || isUploadingAttachments;

  if (isLoading) {
    return <HomeworkFormSkeleton />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={pageTitle}
        description={
          isEditMode
            ? 'Update the homework assignment details'
            : 'Create a new homework assignment for your students'
        }
        actions={[
          {
            label: 'Cancel',
            onClick: handleBack,
            variant: 'outline' as const,
          },
        ]}
      />

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="space-y-6 lg:col-span-2">
            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    placeholder="Enter homework title"
                    {...register('title')}
                    className={cn(errors.title && 'border-red-500')}
                  />
                  <FormError message={errors.title?.message} compact />
                </div>

                {/* Class & Subject - Show as disabled in edit mode */}
                {isEditMode && existingHomework ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Class</Label>
                      <Input value={existingHomework.class_name} disabled className="bg-slate-50" />
                    </div>
                    <div className="space-y-2">
                      <Label>Subject</Label>
                      <Input
                        value={existingHomework.subject_name}
                        disabled
                        className="bg-slate-50"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label>Subject & Class *</Label>
                    <Controller
                      name="subject_public_id"
                      control={control}
                      render={({ field }) => (
                        <SearchableSelect
                          options={allSubjects.map((subject) => ({
                            value: subject.public_id,
                            label: `${subject.subject_name} - ${subject.className}`,
                          }))}
                          value={field.value}
                          onValueChange={field.onChange}
                          placeholder="Select subject and class"
                          searchPlaceholder="Search subjects..."
                          className={cn(errors.subject_public_id && 'border-red-500')}
                        />
                      )}
                    />
                    <FormError message={errors.subject_public_id?.message} compact />
                  </div>
                )}

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Brief description of the homework"
                    rows={3}
                    {...register('description')}
                  />
                </div>

                {/* Instructions */}
                <div className="space-y-2">
                  <Label htmlFor="instructions">Instructions</Label>
                  <Textarea
                    id="instructions"
                    placeholder="Detailed instructions for students"
                    rows={4}
                    {...register('instructions')}
                  />
                </div>

                {/* Reference Link */}
                <div className="space-y-2">
                  <Label htmlFor="reference_link" className="flex items-center gap-2">
                    <LinkIcon className="h-4 w-4" />
                    Reference Link
                  </Label>
                  <Input
                    id="reference_link"
                    type="url"
                    placeholder="https://example.com/resource"
                    {...register('reference_link')}
                    className={cn(errors.reference_link && 'border-red-500')}
                  />
                  <FormError message={errors.reference_link?.message} compact />
                </div>
              </CardContent>
            </Card>

            {/* Attachments */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Paperclip className="h-4 w-4" />
                  Attachments
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Existing Attachments (Edit Mode) */}
                {existingAttachments.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-muted-foreground text-sm">Current Attachments</Label>
                    <div className="space-y-2">
                      {existingAttachments.map((attachment) => {
                        const FileIcon = getFileIcon(attachment.file_type);
                        return (
                          <div
                            key={attachment.public_id}
                            className="flex items-center justify-between rounded-lg border bg-slate-50 p-3 dark:bg-slate-800"
                          >
                            <div className="flex items-center gap-3">
                              <FileIcon className="h-5 w-5 text-slate-500" />
                              <div>
                                <p className="text-sm font-medium">{attachment.file_name}</p>
                                <p className="text-muted-foreground text-xs">
                                  {formatFileSize(attachment.file_size)}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => window.open(attachment.url, '_blank')}
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:text-destructive h-8 w-8"
                                onClick={() => handleDeleteExistingAttachment(attachment.public_id)}
                                disabled={deleteAttachmentMutation.isPending}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Upload New Attachments */}
                <div className="space-y-2">
                  {existingAttachments.length > 0 && (
                    <Label className="text-muted-foreground text-sm">Add New Attachments</Label>
                  )}
                  <FileUpload
                    files={newAttachments}
                    onFilesChange={setNewAttachments}
                    maxSize={MAX_FILE_SIZE}
                    maxFiles={MAX_FILES - existingAttachments.length}
                    accept={ACCEPTED_FILE_TYPES}
                    multiple
                    placeholder="Drag & drop files here, or click to select"
                    helperText={`Max ${MAX_FILES} files, up to 10MB each. Images, PDFs, and documents allowed.`}
                    showPreview
                    allowReorder
                    compact
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Assigned Date - The date FOR which homework is given */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4" />
                    Homework For Date *
                  </Label>
                  <Controller
                    name="assigned_date"
                    control={control}
                    render={({ field }) => (
                      <DateTimePicker
                        value={field.value}
                        onChange={(date) => {
                          field.onChange(date);
                          // Auto-update due date to next day when assigned date changes
                          if (date && !isEditMode) {
                            const newDueDate = addDays(date, 1);
                            newDueDate.setHours(17, 0, 0, 0);
                            setValue('due_datetime', newDueDate);
                          }
                        }}
                        showTimeSelect={false}
                        minDate={isEditMode ? undefined : getTodayOrNextWorkingDay()}
                        dateFormat="EEE, MMM d, yyyy"
                        error={!!errors.assigned_date}
                        disabled={isEditMode}
                      />
                    )}
                  />
                  <p className="text-muted-foreground text-xs">
                    The date for which homework is assigned
                  </p>
                  <FormError message={errors.assigned_date?.message} compact />
                </div>

                {/* Due Date & Time */}
                <div className="space-y-2">
                  <Label>Due Date & Time *</Label>
                  <Controller
                    name="due_datetime"
                    control={control}
                    render={({ field }) => (
                      <DateTimePicker
                        value={field.value}
                        onChange={field.onChange}
                        showTimeSelect
                        timeIntervals={15}
                        minDate={watchedAssignedDate || new Date()}
                        error={!!errors.due_datetime}
                      />
                    )}
                  />
                  <FormError message={errors.due_datetime?.message} compact />
                </div>

                {/* Priority */}
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Controller
                    name="priority"
                    control={control}
                    render={({ field }) => (
                      <SearchableSelect
                        options={HOMEWORK_PRIORITY_OPTIONS.map((opt) => ({
                          value: opt.value,
                          label: opt.label,
                        }))}
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder="Select priority"
                      />
                    )}
                  />
                </div>

                {/* Submission Type */}
                <div className="space-y-2">
                  <Label>Submission Type</Label>
                  <Controller
                    name="submission_type"
                    control={control}
                    render={({ field }) => (
                      <SearchableSelect
                        options={SUBMISSION_TYPE_OPTIONS.map((opt) => ({
                          value: opt.value,
                          label: opt.label,
                        }))}
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder="Select submission type"
                      />
                    )}
                  />
                </div>

                {/* Status */}
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Controller
                    name="status"
                    control={control}
                    render={({ field }) => (
                      <SearchableSelect
                        options={[
                          { value: 'draft', label: 'Draft' },
                          { value: 'published', label: 'Published' },
                        ]}
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder="Select status"
                      />
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col gap-3">
                  <Button type="submit" disabled={isSaving} className="w-full">
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isEditMode ? 'Save Changes' : 'Create Homework'}
                  </Button>
                  <Button type="button" variant="outline" onClick={handleBack} className="w-full">
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}

function HomeworkFormSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Skeleton className="h-96 w-full rounded-xl" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
