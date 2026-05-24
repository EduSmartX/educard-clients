/**
 * Homework Form Component
 * Create/Edit homework with drag & drop file upload
 */

import { memo, useMemo, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link as LinkIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { FormError } from '@/components/ui/form-error';
import { SearchableSelect } from '@/components/ui/searchable-select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FileUpload, FILE_UPLOAD_PRESETS, type UploadedFile } from '@/components/ui/file-upload';
import { cn } from '@/lib/utils';

import {
  HOMEWORK_PRIORITY_OPTIONS,
  SUBMISSION_TYPE_OPTIONS,
  type HomeworkCreatePayload,
  type HomeworkDetail,
  type TeacherClass,
} from '../types';

// Validation schema
const homeworkSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().optional(),
  instructions: z.string().optional(),
  subject_public_id: z.string().min(1, 'Subject is required'),
  due_datetime: z.date({ required_error: 'Due date and time is required' }),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  priority: z.enum(['low', 'medium', 'high']),
  submission_type: z.enum(['online', 'offline', 'both']),
  reference_link: z.string().url('Must be a valid URL').optional().or(z.literal('')),
});

type HomeworkFormData = z.infer<typeof homeworkSchema>;

interface HomeworkFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: HomeworkCreatePayload, files: File[]) => Promise<void>;
  initialData?: HomeworkDetail;
  classes: TeacherClass[];
  isSubmitting?: boolean;
  mode?: 'create' | 'edit';
}

export const HomeworkForm = memo(
  ({
    open,
    onOpenChange,
    onSubmit,
    initialData,
    classes,
    isSubmitting = false,
    mode = 'create',
  }: HomeworkFormProps) => {
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

    const {
      register,
      control,
      handleSubmit,
      reset,
      formState: { errors },
    } = useForm<HomeworkFormData>({
      resolver: zodResolver(homeworkSchema),
      defaultValues: {
        title: initialData?.title || '',
        description: initialData?.description || '',
        instructions: initialData?.instructions || '',
        subject_public_id: initialData?.subject_public_id || '',
        due_datetime: initialData?.due_datetime ? new Date(initialData.due_datetime) : undefined,
        status: initialData?.status || 'draft',
        priority: initialData?.priority || 'medium',
        submission_type: initialData?.submission_type || 'online',
        reference_link: initialData?.reference_link || '',
      },
    });

    // Get all subjects from all classes
    const allSubjects = useMemo(() => {
      return classes.flatMap((cls) =>
        cls.subjects.map((subject) => ({
          ...subject,
          className: cls.name,
        }))
      );
    }, [classes]);

    // Form submission
    const onFormSubmit = async (data: HomeworkFormData) => {
      const payload: HomeworkCreatePayload = {
        ...data,
        due_datetime: data.due_datetime.toISOString(),
      };

      await onSubmit(
        payload,
        uploadedFiles.map((f) => f.file)
      );
      reset();
      setUploadedFiles([]);
      onOpenChange(false);
    };

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{mode === 'create' ? 'Create New Homework' : 'Edit Homework'}</DialogTitle>
            <DialogDescription>
              {mode === 'create'
                ? 'Create a new homework assignment for your students.'
                : 'Update the homework assignment details.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="Enter homework title"
                {...register('title')}
                className={errors.title ? 'border-red-500' : ''}
              />
              <FormError message={errors.title?.message} compact />
            </div>

            {/* Subject */}
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
                    className={errors.subject_public_id ? 'border-red-500' : ''}
                  />
                )}
              />
              <FormError message={errors.subject_public_id?.message} compact />
            </div>

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

            {/* Due Date & Time - Using reusable DateTimePicker */}
            <div className="space-y-2">
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
                    minDate={new Date()}
                  />
                )}
              />
              <FormError message={errors.due_datetime?.message} compact />
            </div>

            {/* Priority, Submission Type & Status */}
            <div className="grid gap-4 sm:grid-cols-3">
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
            </div>

            {/* Reference Link */}
            <div className="space-y-2">
              <Label htmlFor="reference_link">Reference Link (Optional)</Label>
              <div className="relative">
                <LinkIcon className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                <Input
                  id="reference_link"
                  type="url"
                  placeholder="https://example.com/resource"
                  className={cn('pl-9', errors.reference_link && 'border-red-500')}
                  {...register('reference_link')}
                />
              </div>
              <FormError message={errors.reference_link?.message} compact />
              <p className="text-muted-foreground text-xs">
                Add a link to external resources (YouTube video, article, etc.)
              </p>
            </div>

            {/* File Upload - Using Shared Component */}
            <div className="space-y-2">
              <Label>Attachments</Label>
              <FileUpload
                files={uploadedFiles}
                onFilesChange={setUploadedFiles}
                {...FILE_UPLOAD_PRESETS.attachments}
                multiple
                allowReorder
                showPreview
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && 'Saving...'}
                {!isSubmitting && mode === 'create' && 'Create Homework'}
                {!isSubmitting && mode !== 'create' && 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    );
  }
);

export default HomeworkForm;
