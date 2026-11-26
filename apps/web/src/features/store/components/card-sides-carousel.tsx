/**
 * An ID card's sides as slides: front, then back, one at a time with previous / next
 * arrows and dots. Each side is rendered exactly as it will print.
 */
import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { CardOrientation } from '@educard/shared';
import { cn } from '@/lib/utils';
import { CardPreview } from './card-preview';

interface CardSidesCarouselProps {
  frontPath: string;
  /** Empty when the card has no back. */
  backPath?: string;
  /** Show these students' real details instead of sample data. */
  student?: string;
  orientation?: CardOrientation;
  alt: string;
  className?: string;
}

export function CardSidesCarousel({
  frontPath,
  backPath,
  student,
  orientation = 'landscape',
  alt,
  className,
}: CardSidesCarouselProps) {
  const slides = [
    { label: 'Front', path: frontPath },
    ...(backPath ? [{ label: 'Back', path: backPath }] : []),
  ];
  const [index, setIndex] = useState(0);
  const current = Math.min(index, slides.length - 1);
  const slide = slides[current];
  const many = slides.length > 1;

  const go = (next: number) => setIndex((next + slides.length) % slides.length);

  return (
    <div className={cn('bg-muted/50 group relative rounded-lg p-3', className)}>
      <div className="flex min-h-36 items-center justify-center px-6">
        <CardPreview
          path={slide.path}
          student={student}
          orientation={orientation}
          alt={`${alt} ${slide.label.toLowerCase()}`}
        />
      </div>

      <span className="absolute top-2 left-2 rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-medium text-slate-700 shadow-sm">
        {slide.label}
      </span>

      {many && (
        <>
          <button
            type="button"
            aria-label="Previous side"
            onClick={() => go(current - 1)}
            className="absolute top-1/2 left-1 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow transition hover:bg-white focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:outline-none"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden />
          </button>
          <button
            type="button"
            aria-label="Next side"
            onClick={() => go(current + 1)}
            className="absolute top-1/2 right-1 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow transition hover:bg-white focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:outline-none"
          >
            <ChevronRight className="h-5 w-5" aria-hidden />
          </button>
          <div className="mt-2 flex justify-center gap-1.5">
            {slides.map((item, dot) => (
              <button
                key={item.label}
                type="button"
                aria-label={`Show ${item.label.toLowerCase()}`}
                aria-current={dot === current}
                onClick={() => go(dot)}
                className={cn(
                  'h-1.5 rounded-full transition-all',
                  dot === current ? 'w-4 bg-sky-600' : 'w-1.5 bg-slate-400/80 hover:bg-slate-500'
                )}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
