/**
 * Class Timetable Page
 * Select a class and view its weekly timetable grid
 */

import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PageHeader } from '@/components/common';
import { PageLoader } from '@/components/ui/loading-spinner';
import { useClasses } from '@/features/classes/hooks/use-classes';
import { useClassTimetable } from '../hooks/queries';
import { TimetableGrid } from '../components/timetable-grid';
import type { Class } from '@/features/classes/types';

export default function ClassTimetablePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const classIdFromUrl = searchParams.get('class');
  const [selectedClassId, setSelectedClassId] = useState<string>(classIdFromUrl ?? '');

  // Fetch all classes for the dropdown
  const { data: classesData, isLoading: classesLoading } = useClasses({
    page_size: 200,
    is_deleted: false,
  });

  // Fetch timetable for selected class
  const {
    data: timetable,
    isLoading: timetableLoading,
    isError,
    error,
  } = useClassTimetable(selectedClassId || undefined);

  // Sync URL param
  useEffect(() => {
    if (selectedClassId) {
      setSearchParams({ class: selectedClassId }, { replace: true });
    }
  }, [selectedClassId, setSearchParams]);

  // Auto-select first class if none selected
  useEffect(() => {
    if (!selectedClassId && classesData?.data && classesData.data.length > 0) {
      setSelectedClassId(classesData.data[0].public_id);
    }
  }, [classesData, selectedClassId]);

  const classes: Class[] = classesData?.data ?? [];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Timetable"
        description="View the weekly timetable for any class"
      >
        {/* Class Selector */}
        <div className="w-full sm:w-72">
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
      </PageHeader>

      {/* Timetable Grid */}
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
            {(error as Error)?.message || 'Something went wrong. Please try again.'}
          </p>
        </div>
      ) : timetable ? (
        <TimetableGrid timetable={timetable} />
      ) : null}
    </div>
  );
}
