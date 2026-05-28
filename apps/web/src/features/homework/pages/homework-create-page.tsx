/**
 * Create Homework Page
 * Allows creating homework for multiple subjects at once
 */

import { useState, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { parse, format, isWeekend, addDays } from 'date-fns';
import { BookOpen, Link as LinkIcon, CalendarDays, CheckCircle2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { Form } from '@/components/ui/form';
import { FormError } from '@/components/ui/form-error';
import { Checkbox } from '@/components/ui/checkbox';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { ClassSelectField } from '@/components/form/class-select-field';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/constants/app-config';
import { PageHeader } from '@/components/common';
import { getSubjectColor, HOMEWORK_UI } from '@educard/shared';
import { toast } from 'sonner';

import { FileUpload, FILE_UPLOAD_PRESETS, type UploadedFile } from '@/components/ui/file-upload';
import { useTeacherClasses, useCreateHomework, useUploadAttachment } from '../hooks';
import { HOMEWORK_PRIORITY_OPTIONS, SUBMISSION_TYPE_OPTIONS } from '../types';

const homeworkItemSchema = z.object({
  enabled: z.boolean(),
  subject_public_id: z.string(),
  subject_name: z.string(),
  teacher_name: z.string().optional(),
  chapter: z.string().max(255).optional().or(z.literal('')),
  title: z.string().max(255),
  description: z.string().optional(),
  instructions: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']),
  submission_type: z.enum(['online', 'offline', 'both']),
  reference_link: z.string().url().optional().or(z.literal('')),
});

const formSchema = z.object({
  class_public_id: z.string().min(1, 'Class is required'),
  assigned_date: z.date({ required_error: 'Assignment date is required' }), // The date FOR which homework is given
  due_datetime: z.date({ required_error: 'Due date and time is required' }),
  status: z.enum(['draft', 'published']),
  items: z.array(homeworkItemSchema),
});

type FormData = z.infer<typeof formSchema>;

// Helper function to get today or next working day
function getTodayOrNextWorkingDay(): Date {
  let date = new Date();
  // If today is weekend, move to Monday
  while (isWeekend(date)) {
    date = addDays(date, 1);
  }
  return date;
}

export default function HomeworkCreatePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const initialClassId = searchParams.get('class') || '';
  const initialSubjectId = searchParams.get('subject') || '';
  const initialDateStr = searchParams.get('date') || '';

  // Get initial assigned date (today or next working day, never past)
  const getInitialAssignedDate = () => {
    const today = getTodayOrNextWorkingDay();

    if (initialDateStr) {
      const parsedDate = parse(initialDateStr, 'yyyy-MM-dd', new Date());
      // Only use URL date if it's today or future
      if (parsedDate >= new Date(today.toDateString())) {
        return parsedDate;
      }
    }
    return today;
  };

  // Set default due datetime to 5 PM on the day AFTER assigned date
  const getInitialDueDateTime = (assignedDate: Date) => {
    const dueDate = addDays(assignedDate, 1);
    dueDate.setHours(17, 0, 0, 0); // 5:00 PM
    return dueDate;
  };

  const initialAssignedDate = getInitialAssignedDate();

  const [uploadedFiles, setUploadedFiles] = useState<Record<string, UploadedFile[]>>({});

  const { data: teacherClasses = [], isLoading: isLoadingClasses } = useTeacherClasses();
  const createMutation = useCreateHomework();
  const uploadMutation = useUploadAttachment();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      class_public_id: initialClassId,
      assigned_date: initialAssignedDate,
      due_datetime: getInitialDueDateTime(initialAssignedDate),
      status: 'published',
      items: [],
    },
  });

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = form;

  const { fields, replace } = useFieldArray({ control, name: 'items' });
  const selectedClassId = watch('class_public_id');
  const watchedAssignedDate = watch('assigned_date');

  const selectedClass = useMemo(() => {
    return teacherClasses.find((c) => c.public_id === selectedClassId);
  }, [teacherClasses, selectedClassId]);

  // Initialize subjects when class changes
  useMemo(() => {
    if (selectedClass?.subjects && fields.length === 0) {
      const items = selectedClass.subjects.map((subject) => ({
        enabled: initialSubjectId ? subject.public_id === initialSubjectId : false,
        subject_public_id: subject.public_id,
        subject_name: subject.subject_name,
        teacher_name: subject.teacher_name,
        chapter: '',
        title: '',
        description: '',
        instructions: '',
        priority: 'medium' as const,
        submission_type: 'offline' as const, // Default to offline
        reference_link: '',
      }));
      replace(items);
    }
  }, [selectedClass?.subjects, fields.length, initialSubjectId, replace]);

  // Watch the entire items array to get proper re-renders
  const watchedItems = watch('items');
  const enabledCount = useMemo(() => {
    return watchedItems?.filter((item) => item?.enabled)?.length || 0;
  }, [watchedItems]);

  const handleToggleAll = useCallback(
    (enabled: boolean) => {
      fields.forEach((_, index) => {
        setValue(`items.${index}.enabled`, enabled);
      });
    },
    [fields, setValue]
  );

  const onSubmit = async (data: FormData) => {
    const enabledItems = data.items.filter((item) => item.enabled);

    if (enabledItems.length === 0) {
      toast.error(HOMEWORK_UI.SELECT_AT_LEAST_ONE_SUBJECT);
      return;
    }

    const itemsWithoutTitle = enabledItems.filter((item) => !item.title?.trim());
    if (itemsWithoutTitle.length > 0) {
      toast.error(
        `${HOMEWORK_UI.ADD_TITLE_FOR} ${itemsWithoutTitle.map((i) => i.subject_name).join(', ')}`
      );
      return;
    }

    let successCount = 0;
    let errorCount = 0;

    for (const item of enabledItems) {
      try {
        const result = await createMutation.mutateAsync({
          title: item.title,
          description: item.description,
          instructions: item.instructions,
          chapter: item.chapter || undefined,
          subject_public_id: item.subject_public_id,
          due_datetime: data.due_datetime.toISOString(),
          assigned_date: format(data.assigned_date, 'yyyy-MM-dd'),
          status: data.status,
          priority: item.priority,
          submission_type: item.submission_type,
          reference_link: item.reference_link || undefined,
        });

        const files = uploadedFiles[item.subject_public_id] || [];
        for (const file of files) {
          await uploadMutation.mutateAsync({
            homeworkPublicId: result.public_id,
            file: file.file,
          });
        }

        successCount++;
      } catch {
        errorCount++;
      }
    }

    if (successCount > 0) {
      toast.success(`Created ${successCount} homework assignment${successCount > 1 ? 's' : ''}`);
      // Navigate back with the same class and assigned date to maintain state
      const params = new URLSearchParams();
      if (selectedClassId) {
        params.set('class', selectedClassId);
      }
      params.set('date', format(data.assigned_date, 'yyyy-MM-dd'));
      navigate(`${ROUTES.HOMEWORK}?${params.toString()}`);
    }
    if (errorCount > 0) {
      toast.error(`Failed to create ${errorCount} homework assignment${errorCount > 1 ? 's' : ''}`);
    }
  };

  return (
    <Form {...form}>
      <div className="space-y-6">
        <PageHeader
          title="Create Homework"
          description="Create homework assignments for multiple subjects at once"
          actions={[
            {
              label: 'Cancel',
              onClick: () => navigate(-1),
              variant: 'outline' as const,
            },
          ]}
        />

        <form
          onSubmit={handleSubmit(onSubmit, () => {
            toast.error(HOMEWORK_UI.FIX_FORM_ERRORS);
          })}
          className="space-y-6"
        >
          {/* Class & Date Selection */}
          <div className="bg-card rounded-lg border p-6">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                {isLoadingClasses ? (
                  <>
                    <Label>Class *</Label>
                    <Skeleton className="h-10 w-full" />
                  </>
                ) : (
                  <ClassSelectField
                    control={control}
                    name="class_public_id"
                    label="Class *"
                    placeholder="Select class"
                    classes={teacherClasses.map((cls) => ({
                      public_id: cls.public_id,
                      name: cls.name,
                    }))}
                    disabled={!!initialClassId}
                    className={cn(
                      errors.class_public_id ? 'border-red-500' : '',
                      initialClassId ? 'cursor-not-allowed bg-slate-50' : ''
                    )}
                  />
                )}
                {!!errors.class_public_id && (
                  <FormError message={errors.class_public_id.message} compact />
                )}
              </div>
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
                        if (date) {
                          const newDueDate = addDays(date, 1);
                          newDueDate.setHours(17, 0, 0, 0);
                          setValue('due_datetime', newDueDate);
                        }
                      }}
                      placeholder="Select date"
                      error={!!errors.assigned_date}
                      showTimeSelect={false}
                      minDate={getTodayOrNextWorkingDay()}
                      dateFormat="EEE, MMM d, yyyy"
                    />
                  )}
                />
                <p className="text-muted-foreground text-xs">
                  The date for which homework is assigned
                </p>
                <FormError message={errors.assigned_date?.message} compact />
              </div>

              {/* Due Date & Time */}
              <div className="space-y-2 lg:col-span-2">
                <Label>Due Date & Time *</Label>
                <Controller
                  name="due_datetime"
                  control={control}
                  render={({ field }) => (
                    <DateTimePicker
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Select due date and time"
                      error={!!errors.due_datetime}
                      showTimeSelect
                      timeIntervals={15}
                      minDate={watchedAssignedDate || new Date()}
                    />
                  )}
                />
                <FormError message={errors.due_datetime?.message} compact />
              </div>
            </div>

            {/* Status */}
            <div className="bg-muted/50 mt-4 flex items-center justify-between rounded-lg p-4">
              <div>
                <Label className="text-base">Publish immediately</Label>
                <p className="text-muted-foreground text-sm">
                  Students will be notified when homework is published
                </p>
              </div>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Switch
                    checked={field.value === 'published'}
                    onCheckedChange={(checked) => field.onChange(checked ? 'published' : 'draft')}
                  />
                )}
              />
            </div>
          </div>

          {/* Subjects */}
          {selectedClass ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Subjects</h2>
                  <p className="text-muted-foreground text-sm">
                    {enabledCount} of {fields.length} subjects selected
                  </p>
                </div>
                {/* Hide Select All / Deselect All when subject is pre-selected */}
                {!initialSubjectId && (
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleAll(true)}
                    >
                      Select All
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleAll(false)}
                    >
                      Deselect All
                    </Button>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                {fields.map((field, index) => {
                  const color = getSubjectColor(field.subject_name);
                  const isEnabled = watch(`items.${index}.enabled`);
                  const isSubjectLocked =
                    !!initialSubjectId && field.subject_public_id === initialSubjectId;

                  return (
                    <div
                      key={field.id}
                      className={cn(
                        'rounded-xl border-2 transition-all',
                        color.border,
                        isEnabled ? 'bg-card shadow-sm' : 'bg-muted/30'
                      )}
                    >
                      {/* Subject Header */}
                      <div
                        className={cn(
                          'flex items-center justify-between border-b px-4 py-3',
                          color.bg
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <Controller
                            name={`items.${index}.enabled`}
                            control={control}
                            render={({ field: checkField }) => (
                              <Checkbox
                                checked={checkField.value}
                                onCheckedChange={checkField.onChange}
                                className="h-5 w-5"
                                disabled={isSubjectLocked}
                              />
                            )}
                          />
                          <div
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: color.hex }}
                          />
                          <div>
                            <h3 className={cn('font-semibold', color.text)}>
                              {field.subject_name}
                            </h3>
                            {!!field.teacher_name && (
                              <p className="text-muted-foreground text-xs">{field.teacher_name}</p>
                            )}
                          </div>
                        </div>
                        {isEnabled && watch(`items.${index}.title`) && (
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                        )}
                      </div>

                      {/* Subject Form */}
                      {isEnabled && (
                        <div className="space-y-4 p-4">
                          <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2 sm:col-span-2">
                              <Label>Chapter / Unit</Label>
                              <Input
                                placeholder="e.g., Chapter 5 - Photosynthesis"
                                {...register(`items.${index}.chapter`)}
                              />
                            </div>

                            <div className="space-y-2 sm:col-span-2">
                              <Label>Title *</Label>
                              <Input
                                placeholder={`Enter ${field.subject_name} homework title`}
                                {...register(`items.${index}.title`)}
                                className={errors.items?.[index]?.title ? 'border-red-500' : ''}
                              />
                            </div>

                            <div className="space-y-2 sm:col-span-2">
                              <Label>Description</Label>
                              <Textarea
                                placeholder="Brief description..."
                                rows={2}
                                {...register(`items.${index}.description`)}
                              />
                            </div>

                            <div className="space-y-2 sm:col-span-2">
                              <Label>Instructions</Label>
                              <Textarea
                                placeholder="Detailed instructions for students..."
                                rows={3}
                                {...register(`items.${index}.instructions`)}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label>Priority</Label>
                              <Controller
                                name={`items.${index}.priority`}
                                control={control}
                                render={({ field: priorityField }) => (
                                  <SearchableSelect
                                    options={HOMEWORK_PRIORITY_OPTIONS.map((opt) => ({
                                      value: opt.value,
                                      label: opt.label,
                                    }))}
                                    value={priorityField.value}
                                    onValueChange={priorityField.onChange}
                                    placeholder="Select priority"
                                  />
                                )}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label>Submission Type</Label>
                              <Controller
                                name={`items.${index}.submission_type`}
                                control={control}
                                render={({ field: subTypeField }) => (
                                  <SearchableSelect
                                    options={SUBMISSION_TYPE_OPTIONS.map((opt) => ({
                                      value: opt.value,
                                      label: opt.label,
                                    }))}
                                    value={subTypeField.value}
                                    onValueChange={subTypeField.onChange}
                                    placeholder="Select submission type"
                                  />
                                )}
                              />
                            </div>

                            <div className="space-y-2 sm:col-span-2">
                              <Label>Reference Link</Label>
                              <div className="relative">
                                <LinkIcon className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                                <Input
                                  type="url"
                                  placeholder="https://..."
                                  className="pl-9"
                                  {...register(`items.${index}.reference_link`)}
                                />
                              </div>
                            </div>

                            <div className="space-y-2 sm:col-span-2">
                              <Label>Attachments</Label>
                              <FileUpload
                                files={uploadedFiles[field.subject_public_id] || []}
                                onFilesChange={(files) => {
                                  setUploadedFiles((prev) => ({
                                    ...prev,
                                    [field.subject_public_id]: files,
                                  }));
                                }}
                                {...FILE_UPLOAD_PRESETS.attachments}
                                compact
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed py-16">
              <BookOpen className="text-muted-foreground/50 mb-4 h-12 w-12" />
              <h3 className="text-lg font-semibold">Select a Class</h3>
              <p className="text-muted-foreground text-sm">
                Choose a class to see available subjects
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => navigate(-1)}>
              Cancel
            </Button>
            <Button type="submit" variant="brand" disabled={isSubmitting || enabledCount === 0}>
              {isSubmitting ? 'Creating...' : `Create ${enabledCount} Homework`}
            </Button>
          </div>
        </form>
      </div>
    </Form>
  );
}
