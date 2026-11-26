/**
 * Pick students from one or more classes: a search box (searched on the server, by name,
 * roll number or admission number), results grouped by class, and the chosen students
 * shown as chips. Chosen students stay chosen while the search changes.
 *
 * Reusable: give it the class IDs to search in and keep the chosen students in state.
 */
import { useMemo, useState } from 'react';
import { Check, ChevronsUpDown, Loader2, X } from 'lucide-react';
import { useDebounce, type StudentListItem } from '@educard/shared';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useStudentSearch } from '../hooks/use-student-search';

export function studentClassLabel(student: StudentListItem): string {
  return [student.class_master_name, student.class_name].filter(Boolean).join(' - ');
}

interface StudentMultiPickerProps {
  /** Class section public IDs to pick from. */
  classIds: string[];
  /** The chosen students (full rows, so chips and counts survive a new search). */
  value: StudentListItem[];
  onChange: (students: StudentListItem[]) => void;
  placeholder?: string;
  disabled?: boolean;
  /** Chips to show before "+N more". */
  maxBadges?: number;
}

export function StudentMultiPicker({
  classIds,
  value,
  onChange,
  placeholder = 'Search and select students',
  disabled = false,
  maxBadges = 8,
}: StudentMultiPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const debounced = useDebounce(search, 300);
  const { students, total, isLoading, isFetching } = useStudentSearch({
    classIds,
    search: debounced,
    enabled: open,
  });

  const chosenIds = useMemo(() => new Set(value.map((student) => student.public_id)), [value]);
  const showClass = classIds.length > 1;
  const groups = useMemo(() => {
    const byClass = new Map<string, StudentListItem[]>();
    for (const student of students) {
      const label = showClass ? studentClassLabel(student) : '';
      byClass.set(label, [...(byClass.get(label) ?? []), student]);
    }
    return Array.from(byClass);
  }, [students, showClass]);

  const toggle = (student: StudentListItem) => {
    onChange(
      chosenIds.has(student.public_id)
        ? value.filter((item) => item.public_id !== student.public_id)
        : [...value, student]
    );
  };
  const unchosenShown = students.filter((student) => !chosenIds.has(student.public_id));
  const selectShown = () => onChange([...value, ...unchosenShown]);

  const chipLabel = (student: StudentListItem) =>
    showClass ? `${student.full_name} · ${studentClassLabel(student)}` : student.full_name;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled || classIds.length === 0}
          className={cn(
            'h-auto min-h-10 w-full justify-between',
            value.length === 0 && 'text-muted-foreground'
          )}
        >
          <div className="flex flex-1 flex-wrap gap-1 text-left">
            {value.length === 0 ? (
              <span>{placeholder}</span>
            ) : (
              value.slice(0, maxBadges).map((student) => (
                <Badge key={student.public_id} variant="secondary">
                  {chipLabel(student)}
                  <span
                    role="button"
                    tabIndex={0}
                    aria-label={`Remove ${student.full_name}`}
                    className="ml-1 rounded-full outline-none focus-visible:ring-2"
                    onClick={(event) => {
                      event.stopPropagation();
                      toggle(student);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        event.stopPropagation();
                        toggle(student);
                      }
                    }}
                  >
                    <X className="h-3 w-3" />
                  </span>
                </Badge>
              ))
            )}
            {value.length > maxBadges && (
              <Badge variant="outline">+{value.length - maxBadges} more</Badge>
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <div className="relative border-b p-2">
          <Input
            autoFocus
            placeholder="Name, roll number or admission number"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="h-8 pr-8"
          />
          {isFetching && (
            <Loader2 className="text-muted-foreground absolute top-1/2 right-4 h-4 w-4 -translate-y-1/2 animate-spin" />
          )}
        </div>

        <div className="max-h-72 overflow-y-auto p-1" role="listbox" aria-multiselectable>
          {isLoading ? (
            <p className="text-muted-foreground py-3 text-center text-sm">Loading students…</p>
          ) : students.length === 0 ? (
            <p className="text-muted-foreground py-3 text-center text-sm">No matching students</p>
          ) : (
            groups.map(([label, rows]) => (
              <div key={label || 'all'}>
                {label && (
                  <p className="text-muted-foreground px-2 pt-2 pb-1 text-xs font-medium tracking-wide uppercase">
                    {label}
                  </p>
                )}
                {rows.map((student) => {
                  const chosen = chosenIds.has(student.public_id);
                  return (
                    <div
                      key={student.public_id}
                      role="option"
                      aria-selected={chosen}
                      tabIndex={0}
                      className="hover:bg-muted flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm"
                      onClick={() => toggle(student)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          toggle(student);
                        }
                      }}
                    >
                      <span
                        className={cn(
                          'flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border',
                          chosen && 'bg-primary border-primary text-primary-foreground'
                        )}
                      >
                        {chosen && <Check className="h-3 w-3" />}
                      </span>
                      <span className="min-w-0 flex-1 truncate">{student.full_name}</span>
                      {student.roll_number && (
                        <span className="text-muted-foreground shrink-0 text-xs">
                          Roll {student.roll_number}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>

        <div className="flex items-center justify-between gap-2 border-t p-2 text-xs">
          <span className="text-muted-foreground">
            {total > students.length
              ? `Showing ${students.length} of ${total}. Search to narrow down.`
              : `${value.length} selected`}
          </span>
          <div className="flex gap-1">
            {unchosenShown.length > 0 && (
              <Button type="button" size="sm" variant="ghost" onClick={selectShown}>
                Select {unchosenShown.length} shown
              </Button>
            )}
            {value.length > 0 && (
              <Button type="button" size="sm" variant="ghost" onClick={() => onChange([])}>
                Clear
              </Button>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
