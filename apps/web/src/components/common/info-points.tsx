/**
 * Short guidance as easy-to-scan points instead of a paragraph.
 * Empty items (null / false / '') are skipped, so points can be conditional.
 */
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type Tone = 'default' | 'muted';

interface InfoPointsProps {
  items: ReactNode[];
  tone?: Tone;
  className?: string;
}

export function InfoPoints({ items, tone = 'default', className }: InfoPointsProps) {
  const shown = items.filter((item) => item !== null && item !== false && item !== '');
  if (shown.length === 0) {
    return null;
  }
  return (
    <ul
      className={cn(
        'space-y-2 text-sm leading-relaxed',
        tone === 'muted' ? 'text-muted-foreground' : 'text-foreground',
        className
      )}
    >
      {shown.map((item, index) => (
        <li key={index} className="flex gap-2.5">
          <span
            className="bg-primary/70 mt-[0.5rem] h-1.5 w-1.5 shrink-0 rounded-full"
            aria-hidden
          />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
