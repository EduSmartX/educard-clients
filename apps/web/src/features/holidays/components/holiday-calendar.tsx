/**
 * Organization Holiday Calendar Page
 * Main component for managing organization-wide holidays
 * Features: Calendar view, Table view, Bulk upload (admin only)
 */

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, startOfMonth, endOfMonth, subMonths, addMonths } from 'date-fns';
import {
  Calendar as CalendarIcon,
  List,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { PageHeader } from '@/components/common';
import { useRole } from '@/hooks/use-role';
import type { ViewMode, Holiday } from '../types';
import { fetchHolidays, fetchWorkingDayPolicy } from '../api/holidays-api';
import { generateWeekendHolidays } from '../utils/holiday-utils';
import { CalendarView } from './calendar-view';
import { TableView } from './table-view';
import { BulkUploadDialog } from './bulk-upload-dialog';
import { HolidayFormDialog } from './holiday-form-dialog';

/**
 * Main Holiday Calendar Component
 * Automatically adapts UI based on user role
 */
export function HolidayCalendar() {
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Get user role to determine permissions
  const { role } = useRole();
  const isAdmin = role === 'ADMIN';

  // Calculate date range for fetching
  const { fetchFromDate, fetchToDate } = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);

    return {
      fetchFromDate: format(monthStart, 'yyyy-MM-dd'),
      fetchToDate: format(monthEnd, 'yyyy-MM-dd'),
    };
  }, [currentDate]);

  // Fetch working day policy (cached for 30 minutes)
  const { data: workingDayPolicyData } = useQuery({
    queryKey: ['working-day-policy'],
    queryFn: fetchWorkingDayPolicy,
    staleTime: 30 * 60 * 1000,
  });

  const workingDayPolicy = workingDayPolicyData?.data?.[0];

  // Fetch holidays for current month
  const {
    data: holidayData,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['holidays', fetchFromDate, fetchToDate],
    queryFn: () =>
      fetchHolidays({
        from_date: fetchFromDate,
        to_date: fetchToDate,
        ordering: 'start_date',
        page_size: 50,
      }),
    staleTime: 30 * 60 * 1000,
  });

  // Generate weekend holidays based on policy
  const generatedWeekendHolidays = useMemo(() => {
    if (!workingDayPolicy) {
      return [];
    }

    return generateWeekendHolidays({
      startDate: new Date(fetchFromDate),
      endDate: new Date(fetchToDate),
      sundayOff: workingDayPolicy.sunday_off,
      saturdayOffPattern: workingDayPolicy.saturday_off_pattern,
    });
  }, [workingDayPolicy, fetchFromDate, fetchToDate]);

  // Combine API holidays with generated weekend holidays
  const allHolidays: Holiday[] = useMemo(() => {
    const apiHolidays = holidayData?.data || [];
    return [...apiHolidays, ...generatedWeekendHolidays];
  }, [holidayData, generatedWeekendHolidays]);

  // Navigation handlers
  const handlePreviousMonth = () => {
    setCurrentDate((prev) => subMonths(prev, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate((prev) => addMonths(prev, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Holiday Calendar"
        description={
          isAdmin
            ? 'Manage organization-wide holidays and working days'
            : 'View organization-wide holidays and working days'
        }
      >
        {/* Action buttons - Only show for admins */}
        {isAdmin && (
          <div className="flex items-center gap-3">
            <BulkUploadDialog />
            <HolidayFormDialog mode="create" showTrigger={true} />
          </div>
        )}
      </PageHeader>

      {/* Main Card */}
      <Card className="shadow-lg border-0">
        <CardHeader className="pb-4 border-b bg-gradient-to-r from-emerald-50 to-teal-50">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Current Month Display */}
            <div className="flex items-center gap-3">
              <CalendarIcon className="h-6 w-6 text-emerald-600" />
              <div className="text-xl font-semibold text-gray-900">
                {format(currentDate, 'MMMM yyyy')}
              </div>
            </div>

            {/* Controls */}
            <div className="flex flex-wrap items-center gap-2">
              {/* View Toggle */}
              <Tabs
                value={viewMode}
                onValueChange={(v: string) => setViewMode(v as ViewMode)}
                className="bg-white rounded-lg shadow-sm"
              >
                <TabsList className="h-10">
                  <TabsTrigger value="calendar" className="gap-2">
                    <CalendarIcon className="h-4 w-4" />
                    <span className="hidden sm:inline">Calendar</span>
                  </TabsTrigger>
                  <TabsTrigger value="table" className="gap-2">
                    <List className="h-4 w-4" />
                    <span className="hidden sm:inline">Table</span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Date Navigation */}
              {viewMode !== 'bulk-upload' && (
                <div className="flex items-center gap-2 bg-white rounded-lg shadow-sm p-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handlePreviousMonth}
                    disabled={isLoading}
                    className="h-8 w-8"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={handleToday}
                    disabled={isLoading}
                    className="h-8 px-3 text-sm font-medium"
                  >
                    Today
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleNextMonth}
                    disabled={isLoading}
                    className="h-8 w-8"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          {/* Error State */}
          {isError && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                {error instanceof Error ? error.message : 'Failed to load holiday calendar'}
              </AlertDescription>
            </Alert>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-20">
              <div className="text-center space-y-4">
                <Loader2 className="h-10 w-10 animate-spin text-emerald-600 mx-auto" />
                <p className="text-sm text-gray-500">Loading calendar...</p>
              </div>
            </div>
          )}

          {/* Content */}
          {!isLoading && !isError && (
            <>
              {viewMode === 'calendar' && (
                <CalendarView currentDate={currentDate} holidays={allHolidays} />
              )}
              {viewMode === 'table' && (
                <TableView holidays={allHolidays} currentDate={currentDate} />
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
