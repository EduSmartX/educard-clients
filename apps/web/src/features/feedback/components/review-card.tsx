import { useState } from 'react';
import { Star } from 'lucide-react';
import {
  FEEDBACK_MAX_RATING,
  USER_ROLE_LABELS,
  type Review,
  type UserRoleValue,
} from '@educard/shared';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { UserAvatar } from '@/components/common/user-avatar';
import { formatDate } from '@/lib/utils/date-utils';

/** Message text longer than this is truncated with a tooltip for the rest. */
const REVIEW_MESSAGE_PREVIEW_LENGTH = 100;

interface ReviewCardProps {
  review: Review;
  className?: string;
}

export function ReviewCard({ review, className }: Readonly<ReviewCardProps>) {
  const [open, setOpen] = useState(false);
  const message = review.review.trim();
  const isTruncated = message.length > REVIEW_MESSAGE_PREVIEW_LENGTH;
  const preview = isTruncated ? `${message.slice(0, REVIEW_MESSAGE_PREVIEW_LENGTH)}…` : message;

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <UserAvatar
            thumbnailUrl={review.user_profile_image}
            name={review.user_name}
            className="h-12 w-12"
            disablePopup
          />
          <div className="min-w-0">
            <h4 className="text-foreground truncate text-sm font-semibold">{review.user_name}</h4>
            <p className="text-primary truncate text-xs font-medium">
              {USER_ROLE_LABELS[review.user_role as UserRoleValue] ?? review.user_role}
            </p>
            <p className="text-muted-foreground text-[11px]">{formatDate(review.created_at)}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div
          className="flex gap-0.5"
          aria-label={`${review.rating} out of ${FEEDBACK_MAX_RATING} stars`}
        >
          {Array.from({ length: FEEDBACK_MAX_RATING }, (_, index) => index + 1).map((star) => (
            <Star
              key={star}
              className={
                star <= review.rating
                  ? 'h-3.5 w-3.5 fill-amber-400 text-amber-400'
                  : 'h-3.5 w-3.5 fill-transparent text-slate-300'
              }
            />
          ))}
        </div>

        {isTruncated ? (
          <TooltipProvider>
            <Tooltip open={open} onOpenChange={setOpen}>
              <TooltipTrigger asChild>
                <p
                  className="text-muted-foreground cursor-help text-sm leading-relaxed"
                  onClick={() => setOpen((prev) => !prev)}
                >
                  &ldquo;{preview}&rdquo;
                </p>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs text-xs leading-relaxed">
                {message}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <p className="text-muted-foreground text-sm leading-relaxed">&ldquo;{message}&rdquo;</p>
        )}
      </CardContent>
    </Card>
  );
}
