/**
 * An order's journey as a step bar: done steps ticked, the current one highlighted.
 * Orders without ID cards skip the two approval steps.
 */
import { Check } from 'lucide-react';
import { ORDER_STATUS_LABELS, orderSteps, type Order } from '@educard/shared';
import { cn } from '@/lib/utils';

export function OrderProgress({ order }: { order: Order }) {
  const steps = orderSteps(order.needs_approval);
  const current = steps.indexOf(order.status);

  return (
    <ol className="flex flex-wrap items-center gap-x-1 gap-y-2" aria-label="Order progress">
      {steps.map((step, index) => {
        const done = index < current;
        const active = index === current;
        return (
          <li key={step} className="flex items-center gap-1">
            <span
              aria-current={active ? 'step' : undefined}
              className={cn(
                'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium',
                done &&
                  'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300',
                active && 'border-primary bg-primary text-primary-foreground',
                !done && !active && 'text-muted-foreground'
              )}
            >
              {done && <Check className="h-3 w-3" aria-hidden />}
              {ORDER_STATUS_LABELS[step]}
            </span>
            {index < steps.length - 1 && (
              <span className="bg-border hidden h-px w-3 sm:block" aria-hidden />
            )}
          </li>
        );
      })}
    </ol>
  );
}
