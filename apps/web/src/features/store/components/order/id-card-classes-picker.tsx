/**
 * Choose the classes an ID card order is for: one, several, or every class at once.
 *
 * Each class prints with its own approved design and gets its own proof, so the cart gets
 * one line per class. Classes that cannot be ordered yet (no approved design, or no
 * students) are listed and skipped.
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { Class, IdCardTemplate } from '@educard/shared';
import { Button } from '@/components/ui/button';
import { MultiSelect } from '@/components/ui/multi-select';
import { Skeleton } from '@/components/ui/skeleton';
import { ROUTES } from '@/constants/app-config';
import { cn } from '@/lib/utils';
import { classLabel } from '../../utils/store-format';

export interface ClassCardPlan {
  section: Class;
  template: IdCardTemplate | undefined;
  /** Students in the class, when the class list reports it. */
  students: number | undefined;
  /** Has an approved design and at least one student. */
  ready: boolean;
}

type ClassScope = 'all' | 'selected';

function planProblem(plan: ClassCardPlan): string {
  if (!plan.template) {
    return 'No approved design';
  }
  return 'No students yet';
}

interface IdCardClassesPickerProps {
  sections: Class[];
  isLoading: boolean;
  value: string[];
  onChange: (classIds: string[]) => void;
  /** One entry per chosen class, in the order chosen. */
  plans: ClassCardPlan[];
}

export function IdCardClassesPicker({
  sections,
  isLoading,
  value,
  onChange,
  plans,
}: IdCardClassesPickerProps) {
  const [scope, setScope] = useState<ClassScope>('selected');

  if (isLoading) {
    return <Skeleton className="h-10 w-full" />;
  }

  const skipped = plans.filter((plan) => !plan.ready);
  const chooseScope = (next: ClassScope) => {
    setScope(next);
    // "All classes" takes every class; going back starts a fresh selection.
    onChange(next === 'all' ? sections.map((section) => section.public_id) : []);
  };

  return (
    <div className="space-y-3">
      <div className="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Which classes">
        {(
          [
            {
              key: 'all',
              title: `All classes (${sections.length})`,
              hint: 'Every class in the school',
            },
            {
              key: 'selected',
              title: 'Only selected classes',
              hint: 'Pick the classes yourself',
            },
          ] as const
        ).map((option) => {
          const selected = scope === option.key;
          return (
            <button
              key={option.key}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => chooseScope(option.key)}
              className={cn(
                'flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors',
                selected ? 'border-primary bg-primary/5 ring-primary ring-1' : 'hover:bg-muted/60'
              )}
            >
              <span
                className={cn(
                  'flex h-4 w-4 shrink-0 items-center justify-center rounded-full border',
                  selected && 'border-primary'
                )}
              >
                {selected && <span className="bg-primary h-2 w-2 rounded-full" />}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-medium">{option.title}</span>
                <span className="text-muted-foreground block text-xs">{option.hint}</span>
              </span>
            </button>
          );
        })}
      </div>

      {scope === 'selected' && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
          <MultiSelect
            className="min-w-0 flex-1"
            options={sections.map((section) => ({
              value: section.public_id,
              label: classLabel(section),
            }))}
            value={value}
            onChange={onChange}
            placeholder="Choose one or more classes"
            searchPlaceholder="Search classes"
            emptyMessage="No matching classes"
            maxBadges={6}
          />
          {value.length > 0 && (
            <Button type="button" variant="ghost" onClick={() => onChange([])}>
              Clear
            </Button>
          )}
        </div>
      )}

      {plans.length > 1 && (
        <ul className="max-h-80 divide-y overflow-y-auto rounded-lg border text-sm">
          {plans.map((plan) => (
            <li
              key={plan.section.public_id}
              className={cn(
                'flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-3 py-2',
                !plan.ready && 'bg-amber-50/60 dark:bg-amber-950/20'
              )}
            >
              <span className="flex items-center gap-2 font-medium">
                {plan.ready ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
                ) : (
                  <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" aria-hidden />
                )}
                {classLabel(plan.section)}
              </span>
              <span className="text-muted-foreground">
                {plan.ready
                  ? `${plan.students ?? '?'} card${plan.students === 1 ? '' : 's'} · ${plan.template?.name}`
                  : planProblem(plan)}
              </span>
            </li>
          ))}
        </ul>
      )}

      {plans.length > 1 && skipped.length > 0 && (
        <p className="flex items-start gap-2 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <span>
            {skipped.length} class{skipped.length === 1 ? ' is' : 'es are'} skipped and will not be
            added to the cart.{' '}
            {skipped.some((plan) => !plan.template) && (
              <Link to={ROUTES.STORE.SETUP} className="font-medium underline">
                Choose designs in Store setup
              </Link>
            )}
          </span>
        </p>
      )}
    </div>
  );
}
