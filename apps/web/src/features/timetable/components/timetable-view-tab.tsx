/**
 * Timetable View Tab
 * Select a class and view its weekly timetable grid
 * (Reuses TimetableGrid component)
 */

import { useState, useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { PageLoader } from '@/components/ui/loading-spinner';
import { useClasses } from '@/features/classes/hooks/use-classes';
import { useClassTimetable } from '../hooks/queries';
import { TimetableGrid } from './timetable-grid';
import type { Class } from '@/features/classes/types';

export function TimetableViewTab() {
  const [selectedClassId, setSelectedClassId] = useState<string>('');

  const { data: classesData, isLoading: classesLoading } = useClasses({
    page_size: 200,
    is_deleted: false,
  });

  const {
    data: timetable,
    isLoading: timetableLoading,
    isError,
    error,
  } = useClassTimetable(selectedClassId || undefined);

  // Auto-select first class
  useEffect(() => {
    if (!selectedClassId && classesData?.data && classesData.data.length > 0) {
      setSelectedClassId(classesData.data[0].public_id);
    }
  }, [classesData, selectedClassId]);

  const classes: Class[] = classesData?.data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">View Timetable</h2>
          <p className="text-muted-foreground text-sm">
            Select a class to see its weekly timetable
          </p>
        </div>
        <div className="w-full sm:w-72">
          <Label className="text-xs">Class</Label>
          {classesLoading ? (
            <div className="bg-muted h-10 animate-pulse rounded-md" />
          ) : (
            <Select value={selectedClassId} onValueChange={setSelectedClassId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a class" />
              </SelectTrigger>
              <SelectContent>
                {classes.map((cls) => (
                  <SelectItem key={cls.public_id} value={cls.public_id}>
                    {cls.class_master?.name} - {cls.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Timetable */}
      {!selectedClassId ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="text-muted-foreground mb-3 text-5xl">📚</div>
          <h3 className="text-lg font-semibold">Select a Class</h3>
          <p className="text-muted-foreground mt-1 text-sm">
            Choose a class from the dropdown above to view its timetable.
          </p>
        </div>
      ) : timetableLoading ? (
        <PageLoader />
      ) : isError ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="text-destructive mb-3 text-5xl">⚠️</div>
          <h3 className="text-lg font-semibold">Error Loading Timetable</h3>
          <p className="text-muted-foreground mt-1 text-sm">
            {(error as Error)?.message || 'Something went wrong.'}
          </p>
        </div>
      ) : timetable ? (
        <TimetableGrid timetable={timetable} />
      ) : null}
    </div>
  );
}
