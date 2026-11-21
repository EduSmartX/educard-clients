/**
 * Building blocks of the store order page: numbered step cards and large radio cards.
 */
import { CheckCircle2, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OrderStepProps {
  step: number;
  title: string;
  description?: string;
  complete?: boolean;
  children: React.ReactNode;
}

export function OrderStep({ step, title, description, complete, children }: OrderStepProps) {
  return (
    <section className="bg-card rounded-xl border shadow-sm">
      <header className="flex items-start gap-3 border-b px-5 py-4">
        <span
          className={cn(
            'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold',
            complete ? 'bg-emerald-100 text-emerald-700' : 'bg-sky-100 text-sky-700'
          )}
          aria-hidden
        >
          {complete ? <CheckCircle2 className="h-4 w-4" /> : step}
        </span>
        <div className="min-w-0">
          <h2 className="leading-7 font-semibold">{title}</h2>
          {description && <p className="text-muted-foreground text-sm">{description}</p>}
        </div>
      </header>
      <div className="space-y-4 p-5">{children}</div>
    </section>
  );
}

interface ChoiceCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  selected: boolean;
  onSelect: () => void;
  disabled?: boolean;
}

export function ChoiceCard({
  icon: Icon,
  title,
  description,
  selected,
  onSelect,
  disabled,
}: ChoiceCardProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        'flex w-full items-start gap-3 rounded-lg border p-4 text-left transition-colors',
        'disabled:cursor-not-allowed disabled:opacity-50',
        selected
          ? 'border-sky-500 bg-sky-50 ring-1 ring-sky-500 dark:bg-sky-950/40'
          : 'hover:border-sky-300 hover:bg-sky-50/40'
      )}
    >
      <span
        className={cn(
          'rounded-md p-2',
          selected ? 'bg-sky-500 text-white' : 'bg-muted text-muted-foreground'
        )}
      >
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <span className="min-w-0">
        <span className="block font-medium">{title}</span>
        <span className="text-muted-foreground block text-sm">{description}</span>
      </span>
    </button>
  );
}

/** Small pill for a single choice, e.g. a size or colour. */
export function OptionPill({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm transition-colors',
        selected
          ? 'border-sky-500 bg-sky-100 font-medium text-sky-800'
          : 'border-input hover:border-sky-300 hover:bg-sky-50'
      )}
    >
      {children}
    </button>
  );
}
