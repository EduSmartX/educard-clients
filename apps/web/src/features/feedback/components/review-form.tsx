import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2, Loader2, Send } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FormError } from '@/components/ui/form-error';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { getErrorMessage } from '@/lib/utils/error-handler';
import { useMyReview, useSubmitReview } from '../hooks/use-feedback';
import { reviewFormSchema, type ReviewFormData } from '../schemas/feedback-schema';
import { StarRating } from './star-rating';

export function ReviewForm() {
  const { data: myReview, isLoading } = useMyReview();
  const submitReview = useSubmitReview();
  const existingReview = myReview?.data ?? null;

  const {
    control,
    handleSubmit,
    register,
    reset,
    formState: { errors },
  } = useForm<ReviewFormData>({
    resolver: zodResolver(reviewFormSchema),
    defaultValues: { rating: 0, review: '' },
  });

  useEffect(() => {
    if (existingReview) {
      reset({ rating: existingReview.rating, review: existingReview.review });
    }
  }, [existingReview, reset]);

  const onSubmit = (values: ReviewFormData) => {
    submitReview.mutate(
      { rating: values.rating, review: values.review?.trim() || '' },
      {
        onSuccess: (response) => {
          toast.success(response.message || 'Thank you! Your review has been saved.');
        },
        onError: (error) => {
          toast.error(getErrorMessage(error, 'Failed to save your review'));
        },
      }
    );
  };

  if (isLoading) {
    return <Skeleton className="h-72 rounded-xl" />;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardContent className="space-y-6 pt-6">
          {existingReview && (
            <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              You have already rated us. Submitting again updates your review.
            </div>
          )}

          <div className="flex flex-col items-center gap-3 rounded-xl bg-slate-50 py-8">
            <p className="text-base font-semibold text-slate-800">
              How would you rate your experience?
            </p>
            <Controller
              control={control}
              name="rating"
              render={({ field }) => <StarRating value={field.value} onChange={field.onChange} />}
            />
            <FormError message={errors.rating?.message} compact />
          </div>

          <div className="space-y-2">
            <Label htmlFor="review-text">
              Your review <span className="text-xs font-normal text-slate-400">(optional)</span>
            </Label>
            <Textarea
              id="review-text"
              rows={5}
              placeholder="What do you like, and what would make it a 5-star experience?"
              {...register('review')}
            />
            <FormError message={errors.review?.message} compact />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={submitReview.isPending}>
          {submitReview.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Send className="mr-2 h-4 w-4" />
          )}
          {existingReview ? 'Update review' : 'Submit review'}
        </Button>
      </div>
    </form>
  );
}
