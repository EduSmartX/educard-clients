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
  Bell,
  Eye,
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
import { useSendHolidayNotification } from '../hooks';

/**
 * Main Holiday Calendar Component
 * Automatically adapts UI based on user role
 */
export function HolidayCalendar() {
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [currentDate, setCurrentDate] = useState(new Date());

  const { isAdmin } = useRole();
  const notifyMutation = useSendHolidayNotification();

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

  // Send notification for all non-weekend holidays in current month
  const handleSendNotification = () => {
    const apiHolidays = holidayData?.data || [];
    const realHolidays = apiHolidays.filter(
      (h) =>
        h.holiday_type !== 'SUNDAY' &&
        h.holiday_type !== 'SATURDAY' &&
        h.holiday_type !== 'SECOND_SATURDAY'
    );
    const holidayIds = realHolidays.map((h) => h.public_id);
    if (holidayIds.length === 0) {
      return;
    }
    notifyMutation.mutate(holidayIds);
  };

  const apiHolidayCount = (holidayData?.data || []).filter(
    (h) =>
      h.holiday_type !== 'SUNDAY' &&
      h.holiday_type !== 'SATURDAY' &&
      h.holiday_type !== 'SECOND_SATURDAY'
  ).length;

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
            <Button
              variant="outline"
              className="gap-2 border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100"
              onClick={handleSendNotification}
              disabled={notifyMutation.isPending || apiHolidayCount === 0}
              title={
                apiHolidayCount === 0
                  ? 'No holidays in current month to notify'
                  : `Send notification for ${apiHolidayCount} holiday(s) in this month`
              }
            >
              <Bell className="h-4 w-4" />
              {notifyMutation.isPending ? 'Sending...' : 'Notify'}
            </Button>
            <BulkUploadDialog />
            <HolidayFormDialog mode="create" showTrigger={true} />
          </div>
        )}
      </PageHeader>

      {/* View Only Banner for non-admin users */}
      {!isAdmin && (
        <Alert className="border-emerald-200 bg-emerald-50">
          <Eye className="h-4 w-4 text-emerald-600" />
          <AlertTitle className="text-emerald-900">View Only Mode</AlertTitle>
          <AlertDescription className="text-emerald-700">
            You can view the holiday calendar, but cannot create or modify holidays. Contact your
            administrator to make changes.
          </AlertDescription>
        </Alert>
      )}

      {/* Main Card */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="border-b bg-gradient-to-r from-emerald-50 to-teal-50 pb-4">
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
                onValueChange={(v: string) => setViewMode(v as ViewMode)} // NOSONAR
                className="rounded-lg bg-white shadow-sm"
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
                <div className="flex items-center gap-2 rounded-lg bg-white p-1 shadow-sm">
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
              <div className="space-y-4 text-center">
                <Loader2 className="mx-auto h-10 w-10 animate-spin text-emerald-600" />
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
