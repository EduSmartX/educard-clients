/**
 * A product's pictures: one large image with previous / next arrows and dots, and
 * optional thumbnails. Arrows and dots never trigger a parent's click (e.g. a card link).
 */
import { useState } from 'react';
import { ChevronLeft, ChevronRight, ImageOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getMediaUrl } from '@/lib/utils/media-utils';

interface ProductImageCarouselProps {
  images: string[];
  alt: string;
  /** Height/shape of the main picture, e.g. "h-44" or "aspect-square". */
  className?: string;
  /** Show a strip of clickable thumbnails under the picture. */
  thumbnails?: boolean;
}

export function ProductImageCarousel({
  images,
  alt,
  className = 'h-44',
  thumbnails = false,
}: ProductImageCarouselProps) {
  const [requested, setRequested] = useState(0);
  const count = images.length;
  // Photos can be removed while shown; never point past the end.
  const index = count === 0 ? 0 : Math.min(requested, count - 1);

  const go = (event: React.MouseEvent, next: number) => {
    event.stopPropagation();
    event.preventDefault();
    setRequested((next + count) % count);
  };

  return (
    <div className="space-y-2">
      <div className={cn('bg-muted group relative overflow-hidden rounded-lg', className)}>
        {count === 0 ? (
          <div className="flex h-full w-full items-center justify-center">
            <ImageOff className="text-muted-foreground h-10 w-10" aria-hidden />
          </div>
        ) : (
          <img
            src={getMediaUrl(images[index])}
            alt={`${alt} (${index + 1} of ${count})`}
            className="h-full w-full object-contain"
            loading="lazy"
          />
        )}

        {count > 1 && (
          <>
            <button
              type="button"
              aria-label="Previous picture"
              onClick={(event) => go(event, index - 1)}
              className="absolute top-1/2 left-2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-slate-700 shadow transition hover:bg-white focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:outline-none sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
            >
              <ChevronLeft className="h-5 w-5" aria-hidden />
            </button>
            <button
              type="button"
              aria-label="Next picture"
              onClick={(event) => go(event, index + 1)}
              className="absolute top-1/2 right-2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-slate-700 shadow transition hover:bg-white focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:outline-none sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
            >
              <ChevronRight className="h-5 w-5" aria-hidden />
            </button>
            <div className="absolute inset-x-0 bottom-2 flex justify-center gap-1.5">
              {images.map((_, dot) => (
                <button
                  key={dot}
                  type="button"
                  aria-label={`Show picture ${dot + 1}`}
                  aria-current={dot === index}
                  onClick={(event) => go(event, dot)}
                  className={cn(
                    'h-1.5 rounded-full transition-all',
                    dot === index ? 'w-4 bg-sky-600' : 'w-1.5 bg-slate-400/80 hover:bg-slate-500'
                  )}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {thumbnails && count > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((src, thumb) => (
            <button
              key={`${src}-${thumb}`}
              type="button"
              aria-label={`Show picture ${thumb + 1}`}
              onClick={(event) => go(event, thumb)}
              className={cn(
                'bg-muted h-14 w-14 shrink-0 overflow-hidden rounded-md border-2 transition',
                thumb === index ? 'border-sky-500' : 'border-transparent hover:border-sky-200'
              )}
            >
              <img src={getMediaUrl(src)} alt="" className="h-full w-full object-contain" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
