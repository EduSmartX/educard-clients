import { MessageSquareHeart } from 'lucide-react';
import type { Review } from '@educard/shared';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { Skeleton } from '@/components/ui/skeleton';
import { ReviewCard } from './review-card';

interface ReviewsSectionProps {
  reviews: Review[];
  isLoading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
}

export function ReviewsSection({
  reviews,
  isLoading = false,
  emptyTitle = 'No reviews yet',
  emptyDescription = 'Be the first reviewer for us!',
}: Readonly<ReviewsSectionProps>) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((key) => (
          <Skeleton key={key} className="h-56 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed py-16 text-center">
        <MessageSquareHeart className="text-primary/40 h-10 w-10" />
        <h3 className="text-foreground text-lg font-semibold">{emptyTitle}</h3>
        <p className="text-muted-foreground max-w-sm text-sm">{emptyDescription}</p>
      </div>
    );
  }

  return (
    <Carousel opts={{ align: 'start', loop: reviews.length > 3 }} className="w-full">
      <CarouselContent>
        {reviews.map((review) => (
          <CarouselItem key={review.public_id} className="md:basis-1/2 lg:basis-1/3">
            <div className="p-2">
              <ReviewCard
                review={review}
                className="h-full border-2 transition-all duration-300 hover:shadow-xl"
              />
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      {reviews.length > 3 && (
        <>
          <CarouselPrevious className="hidden md:flex" />
          <CarouselNext className="hidden md:flex" />
        </>
      )}
    </Carousel>
  );
}
