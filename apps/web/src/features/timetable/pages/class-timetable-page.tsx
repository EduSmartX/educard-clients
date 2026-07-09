/**
 * Class Timetable Page
 * Select a class and view its weekly timetable grid
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarRange } from 'lucide-react';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/common';
import { PageLoader } from '@/components/ui/loading-spinner';
import { ROUTES } from '@/constants/app-config';
import { useClasses } from '@/features/classes/hooks/use-classes';
import { useRole } from '@/hooks/use-role';
import { useClassTimetable } from '../hooks/queries';
import { TimetableGrid } from '../components/timetable-grid';
import type { Class } from '@/features/classes/types';

export default function ClassTimetablePage() {
  const navigate = useNavigate();
  const { isAdmin } = useRole();
  const [selectedClassId, setSelectedClassId] = useState<string>('');

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
      <PageHeader title="Timetable" description="View the weekly timetable for any class">
        {isAdmin && (
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(ROUTES.TIMETABLE_OVERRIDES)}
          >
            <CalendarRange className="mr-2 h-4 w-4" />
            Period Overrides
          </Button>
        )}
        {/* Class Selector */}
        <div className="w-full sm:w-72">
          {classesLoading ? (
            <div className="bg-muted h-10 animate-pulse rounded-md" />
          ) : (
            <SearchableSelect
              options={classes.map((cls) => ({
                value: cls.public_id,
                label: `${cls.class_master?.name} - ${cls.name}`,
              }))}
              value={selectedClassId}
              onValueChange={setSelectedClassId}
              placeholder="Select a class"
              searchPlaceholder="Search classes..."
            />
          )}
        </div>
      </PageHeader>

      {/* Timetable Grid */}
      {!selectedClassId && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="text-muted-foreground mb-3 text-5xl">📚</div>
          <h3 className="text-lg font-semibold">Select a Class</h3>
          <p className="text-muted-foreground mt-1 text-sm">
            Choose a class from the dropdown above to view its timetable.
          </p>
        </div>
      )}
      {selectedClassId && timetableLoading && <PageLoader />}
      {selectedClassId && !timetableLoading && isError && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="text-destructive mb-3 text-5xl">⚠️</div>
          <h3 className="text-lg font-semibold">Error Loading Timetable</h3>
          <p className="text-muted-foreground mt-1 text-sm">
            {(error as Error)?.message || 'Something went wrong. Please try again.'}
          </p>
        </div>
      )}
      {selectedClassId && !timetableLoading && !isError && timetable && (
        <TimetableGrid timetable={timetable} />
      )}
    </div>
  );
}
