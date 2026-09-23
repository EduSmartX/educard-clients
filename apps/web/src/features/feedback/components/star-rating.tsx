import { useState } from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { FEEDBACK_MAX_RATING, FEEDBACK_RATING_LABELS } from '@educard/shared';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  value: number;
  onChange?: (rating: number) => void;
  size?: number;
  readOnly?: boolean;
  showLabel?: boolean;
  className?: string;
}

export function StarRating({
  value,
  onChange,
  size = 36,
  readOnly = false,
  showLabel = true,
  className,
}: StarRatingProps) {
  const [hovered, setHovered] = useState(0);
  const active = hovered || value;

  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      <div
        className="flex items-center gap-1.5"
        role={readOnly ? undefined : 'radiogroup'}
        aria-label="Rating"
        onMouseLeave={() => setHovered(0)}
      >
        {Array.from({ length: FEEDBACK_MAX_RATING }, (_, index) => index + 1).map((star) => {
          const filled = star <= active;
          return (
            <motion.button
              key={star}
              type="button"
              role={readOnly ? undefined : 'radio'}
              aria-checked={readOnly ? undefined : star === value}
              aria-label={`${star} star${star > 1 ? 's' : ''}`}
              disabled={readOnly}
              whileTap={readOnly ? undefined : { scale: 0.85 }}
              whileHover={readOnly ? undefined : { scale: 1.15 }}
              onMouseEnter={() => !readOnly && setHovered(star)}
              onFocus={() => !readOnly && setHovered(star)}
              onClick={() => !readOnly && onChange?.(star)}
              className={cn(
                'rounded-full p-0.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400',
                readOnly ? 'cursor-default' : 'cursor-pointer'
              )}
            >
              <Star
                size={size}
                strokeWidth={1.5}
                className={cn(
                  'transition-colors',
                  filled ? 'fill-amber-400 text-amber-400' : 'fill-transparent text-slate-300'
                )}
              />
            </motion.button>
          );
        })}
      </div>

      {showLabel && (
        <p className="h-5 text-sm font-medium text-slate-600">
          {active ? FEEDBACK_RATING_LABELS[active] : 'Tap a star to rate'}
        </p>
      )}
    </div>
  );
}
