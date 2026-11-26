/**
 * "Whole school" or "Specific classes" (searchable multi-select, one entry per grade).
 * Used wherever the school applies something to the school or to several classes:
 * ID card designs, product photos and class differences.
 */
import { useMemo } from 'react';
import { School, Users } from 'lucide-react';
import { MultiSelect } from '@/components/ui/multi-select';
import { Skeleton } from '@/components/ui/skeleton';
import { useClasses } from '@/features/classes/hooks/use-classes';
import { cn } from '@/lib/utils';
import { classLabel } from '../utils/store-format';

export interface ClassScope {
  /** True = whole school; false = the listed classes. */
  wholeSchool: boolean;
  /** One section public ID per chosen grade. */
  classIds: string[];
}

export const WHOLE_SCHOOL_SCOPE: ClassScope = { wholeSchool: true, classIds: [] };

/** True once the scope is usable (whole school, or at least one class). */
export function isScopeComplete(scope: ClassScope): boolean {
  return scope.wholeSchool || scope.classIds.length > 0;
}

/** Class IDs to send to the API; empty = whole school. */
export function scopeClassIds(scope: ClassScope): string[] {
  return scope.wholeSchool ? [] : scope.classIds;
}

/** One option per grade ("Class 5"), valued by any one of its sections. */
export function useGradeOptions() {
  const { data, isLoading } = useClasses({ page_size: 100 });
  const options = useMemo(() => {
    const byGrade = new Map<string, { value: string; label: string; gradeId?: number }>();
    for (const section of data?.data ?? []) {
      const label = section.class_master?.name ?? classLabel(section);
      if (!byGrade.has(label)) {
        byGrade.set(label, {
          value: section.public_id,
          label,
          gradeId: section.class_master?.id,
        });
      }
    }
    return Array.from(byGrade.values());
  }, [data]);
  return { options, isLoading };
}

interface ClassScopePickerProps {
  value: ClassScope;
  onChange: (value: ClassScope) => void;
  /** Hide the "Whole school" choice (e.g. class differences). */
  classesOnly?: boolean;
  wholeSchoolLabel?: string;
}

export function ClassScopePicker({
  value,
  onChange,
  classesOnly = false,
  wholeSchoolLabel = 'Whole school',
}: ClassScopePickerProps) {
  const { options, isLoading } = useGradeOptions();

  const pill = (selected: boolean, onClick: () => void, Icon: typeof School, label: string) => (
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
      <Icon className="h-4 w-4" aria-hidden />
      {label}
    </button>
  );

  return (
    <div className="space-y-3">
      {!classesOnly && (
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Applies to">
          {pill(
            value.wholeSchool,
            () => onChange({ ...value, wholeSchool: true }),
            School,
            wholeSchoolLabel
          )}
          {pill(
            !value.wholeSchool,
            () => onChange({ ...value, wholeSchool: false }),
            Users,
            'Specific classes'
          )}
        </div>
      )}
      {(classesOnly || !value.wholeSchool) &&
        (isLoading ? (
          <Skeleton className="h-10 w-full" />
        ) : (
          <MultiSelect
            options={options}
            value={value.classIds}
            onChange={(classIds) => onChange({ wholeSchool: false, classIds })}
            placeholder="Search and select classes"
            searchPlaceholder="Class name"
            emptyMessage="No classes found"
            maxBadges={8}
          />
        ))}
    </div>
  );
}
