import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { Loader2, Paperclip, Send } from 'lucide-react';
import { toast } from 'sonner';
import {
  FEEDBACK_MAX_ATTACHMENTS,
  FEEDBACK_MAX_ATTACHMENT_SIZE,
  FEEDBACK_MODULE_OPTIONS,
  FEEDBACK_SUBJECT_MAX_LENGTH,
  FEEDBACK_TYPE,
  FEEDBACK_TYPE_OPTIONS,
} from '@educard/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FileUpload, type UploadedFile } from '@/components/ui/file-upload';
import { FormError } from '@/components/ui/form-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { getErrorMessage } from '@/lib/utils/error-handler';
import { useCreateFeedback } from '../hooks/use-feedback';
import {
  FEEDBACK_ATTACHMENT_ACCEPT,
  FEEDBACK_ATTACHMENT_HELPER_TEXT,
  feedbackFormSchema,
  validateAttachment,
  type FeedbackFormData,
} from '../schemas/feedback-schema';
import { FEEDBACK_TYPE_ICONS } from './feedback-type-icons';

const NO_MODULE = 'none';

export function FeedbackForm() {
  const [attachments, setAttachments] = useState<UploadedFile[]>([]);
  const createFeedback = useCreateFeedback();

  const {
    control,
    handleSubmit,
    register,
    reset,
    watch,
    formState: { errors },
  } = useForm<FeedbackFormData>({
    resolver: zodResolver(feedbackFormSchema),
    defaultValues: {
      feedback_type: FEEDBACK_TYPE.SUGGESTION,
      module: '',
      subject: '',
      description: '',
    },
  });

  const selectedType = watch('feedback_type');
  const subjectLength = watch('subject')?.length ?? 0;

  const onSubmit = (values: FeedbackFormData) => {
    createFeedback.mutate(
      {
        feedback_type: values.feedback_type,
        module: values.module || undefined,
        subject: values.subject,
        description: values.description,
        attachments: attachments.map((item) => item.file),
      },
      {
        onSuccess: (response) => {
          toast.success(response.message || 'Thank you! Your feedback has been submitted.', {
            description: `Ticket ${response.data.ticket_number}`,
          });
          reset();
          setAttachments([]);
        },
        onError: (error) => {
          toast.error(getErrorMessage(error, 'Failed to submit feedback'));
        },
      }
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardContent className="space-y-6 pt-6">
          <fieldset className="space-y-3">
            <legend className="text-sm font-semibold text-slate-800">
              What kind of feedback is this? <span className="text-red-500">*</span>
            </legend>
            <Controller
              control={control}
              name="feedback_type"
              render={({ field }) => (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {FEEDBACK_TYPE_OPTIONS.map((option) => {
                    const Icon = FEEDBACK_TYPE_ICONS[option.icon];
                    const isSelected = field.value === option.value;
                    return (
                      <motion.button
                        key={option.value}
                        type="button"
                        whileTap={{ scale: 0.97 }}
                        onClick={() => field.onChange(option.value)}
                        aria-pressed={isSelected}
                        className={cn(
                          'flex flex-col items-start gap-2 rounded-xl border-2 p-4 text-left transition-all',
                          'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
                          isSelected
                            ? 'shadow-sm'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                        )}
                        style={
                          isSelected
                            ? {
                                borderColor: option.borderColor,
                                backgroundColor: option.bgColor,
                              }
                            : undefined
                        }
                      >
                        <span
                          className="flex h-10 w-10 items-center justify-center rounded-lg"
                          style={{ backgroundColor: option.bgColor }}
                        >
                          <Icon className="h-5 w-5" style={{ color: option.color }} />
                        </span>
                        <span className="text-sm font-semibold text-slate-900">{option.label}</span>
                        <span className="text-xs leading-snug text-slate-500">
                          {option.description}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              )}
            />
            <FormError message={errors.feedback_type?.message} compact />
          </fieldset>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="feedback-module">
                Module <span className="text-xs font-normal text-slate-400">(optional)</span>
              </Label>
              <Controller
                control={control}
                name="module"
                render={({ field }) => (
                  <Select
                    value={field.value || NO_MODULE}
                    onValueChange={(value) => field.onChange(value === NO_MODULE ? '' : value)}
                  >
                    <SelectTrigger id="feedback-module">
                      <SelectValue placeholder="Which area is this about?" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NO_MODULE}>Not specific to a module</SelectItem>
                      {FEEDBACK_MODULE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FormError message={errors.module?.message} compact />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="feedback-subject">
                  Subject <span className="text-red-500">*</span>
                </Label>
                <span className="text-xs text-slate-400">
                  {subjectLength}/{FEEDBACK_SUBJECT_MAX_LENGTH}
                </span>
              </div>
              <Input
                id="feedback-subject"
                maxLength={FEEDBACK_SUBJECT_MAX_LENGTH}
                placeholder={
                  selectedType === FEEDBACK_TYPE.COMPLAINT
                    ? 'Briefly, what went wrong?'
                    : 'Summarise your feedback in a line'
                }
                {...register('subject')}
              />
              <FormError message={errors.subject?.message} compact />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="feedback-description">
              Description <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="feedback-description"
              rows={6}
              placeholder="Tell us what happened, what you expected, and anything that would help us act on it."
              {...register('description')}
            />
            <FormError message={errors.description?.message} compact />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <Paperclip className="h-4 w-4" />
              Attachments{' '}
              <span className="text-xs font-normal text-slate-400">
                (optional, up to {FEEDBACK_MAX_ATTACHMENTS})
              </span>
            </Label>
            <FileUpload
              files={attachments}
              onFilesChange={setAttachments}
              maxFiles={FEEDBACK_MAX_ATTACHMENTS}
              maxSize={FEEDBACK_MAX_ATTACHMENT_SIZE}
              accept={FEEDBACK_ATTACHMENT_ACCEPT}
              validator={(file) => Promise.resolve(validateAttachment(file))}
              multiple
              allowReorder={false}
              placeholder="Drag screenshots or documents here, or click to browse"
              helperText={FEEDBACK_ATTACHMENT_HELPER_TEXT}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          disabled={createFeedback.isPending}
          onClick={() => {
            reset();
            setAttachments([]);
          }}
        >
          Clear
        </Button>
        <Button type="submit" disabled={createFeedback.isPending}>
          {createFeedback.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Send className="mr-2 h-4 w-4" />
          )}
          Submit feedback
        </Button>
      </div>
    </form>
  );
}
