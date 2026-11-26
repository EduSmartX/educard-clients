/**
 * The details a student's ID card design prints that are still empty in their profile.
 * Renders nothing when the card is complete (or no design applies).
 */
import { AlertTriangle } from 'lucide-react';
import type { StudentCard } from '@educard/shared';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface MissingCardFieldsProps {
  card: StudentCard | undefined;
  className?: string;
}

export function MissingCardFields({ card, className }: MissingCardFieldsProps) {
  const missing = card?.available ? (card.missing_fields ?? []) : [];
  if (missing.length === 0) {
    return null;
  }
  return (
    <Card
      className={cn(
        'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/40',
        className
      )}
    >
      <CardContent className="flex gap-3 p-4 text-amber-900 dark:text-amber-200">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
        <div className="space-y-1.5">
          <p className="font-medium">
            Missing on the ID card ({missing.length} detail{missing.length === 1 ? '' : 's'})
          </p>
          <ul className="flex flex-wrap gap-1.5" aria-label="Missing details">
            {missing.map((item) => (
              <li
                key={item.field}
                className="rounded-full border border-amber-300 bg-white/70 px-2.5 py-0.5 text-xs font-medium dark:border-amber-700 dark:bg-amber-900/40"
              >
                {item.label}
              </li>
            ))}
          </ul>
          <p className="text-xs">
            The card prints without these. Edit the student’s details below to fill them in.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
