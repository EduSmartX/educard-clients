import { Check } from 'lucide-react';
import { FEEDBACK_PROGRESS_STEPS } from '@educard/shared';
import { cn } from '@/lib/utils';

interface FeedbackStatusProgressProps {
  /** 1-based current step (1 = Open, 2 = In Progress, 3 = Resolved). */
  step: number;
  className?: string;
}

export function FeedbackStatusProgress({ step, className }: Readonly<FeedbackStatusProgressProps>) {
  return (
    <div className={cn('flex items-center', className)}>
      {FEEDBACK_PROGRESS_STEPS.map((label, index) => {
        const stepNumber = index + 1;
        const isComplete = stepNumber < step;
        const isCurrent = stepNumber === step;
        const isLast = index === FEEDBACK_PROGRESS_STEPS.length - 1;

        return (
          <div key={label} className={cn('flex items-center', !isLast && 'flex-1')}>
            <div className="flex flex-col items-center gap-1.5">
              <span
                className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-full border-2 text-xs font-semibold transition-colors',
                  isComplete && 'border-emerald-600 bg-emerald-600 text-white',
                  isCurrent && 'border-amber-500 bg-amber-500 text-white',
                  !isComplete && !isCurrent && 'border-slate-200 bg-white text-slate-400'
                )}
              >
                {isComplete ? <Check className="h-3.5 w-3.5" /> : stepNumber}
              </span>
              <span
                className={cn(
                  'text-[11px] font-medium whitespace-nowrap',
                  (isComplete || isCurrent) && 'text-slate-700',
                  !isComplete && !isCurrent && 'text-slate-400'
                )}
              >
                {label}
              </span>
            </div>
            {!isLast && (
              <div
                className={cn(
                  'mx-2 h-0.5 flex-1 rounded-full',
                  isComplete ? 'bg-emerald-600' : 'bg-slate-200'
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
