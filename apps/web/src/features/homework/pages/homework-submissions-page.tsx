/**
 * Homework Submissions Page
 * Filter-based view to see and review student submissions
 * Teachers select Class → Date → Subject to view submissions
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { format, parseISO, isValid, subDays, isWeekend } from 'date-fns';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  BookOpen,
  RefreshCw,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { getSubjectColor } from '@educard/shared';

import { useTeacherClasses, useHomeworkList, useHomeworkSubmissions } from '../hooks';
import { SubmissionTable } from '../components/submission-table';
import type { Homework, HomeworkListParams } from '../types';
import { PageHeader } from '@/components/common';

// Helper to get previous working day (skip weekends)
function getPreviousWorkingDay(date: Date = new Date()): Date {
  let current = subDays(date, 1);
  while (isWeekend(current)) {
    current = subDays(current, 1);
  }
  return current;
}

// Stats Card Component
function StatsCard({
  icon: Icon,
  label,
  value,
  color = 'slate',
  isLoading = false,
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  color?: 'slate' | 'blue' | 'green' | 'amber' | 'red';
  isLoading?: boolean;
}) {
  const colorClasses = {
    slate: 'bg-slate-100 text-slate-600',
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    amber: 'bg-amber-100 text-amber-600',
    red: 'bg-red-100 text-red-600',
  };

  return (
    <div className="flex items-center gap-3 rounded-lg border bg-white p-4">
      <div className={cn('rounded-lg p-2', colorClasses[color])}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        {isLoading ? (
          <Skeleton className="h-6 w-12" />
        ) : (
          <p className="text-2xl font-bold text-slate-900">{value}</p>
        )}
        <p className="text-sm text-slate-500">{label}</p>
      </div>
    </div>
  );
}

// Empty State Component
function EmptyState({
  title,
  description,
  icon: Icon = FileText,
}: {
  title: string;
  description: string;
  icon?: React.ElementType;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed py-16 text-center">
      <Icon className="mb-4 h-12 w-12 text-slate-300" />
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>
    </div>
  );
}

// Homework Card for Selection
function HomeworkSelectCard({
  homework,
  isSelected,
  onClick,
}: {
  homework: Homework;
  isSelected: boolean;
  onClick: () => void;
}) {
  const subjectColor = getSubjectColor(homework.subject_name);
  const stats = homework.submission_stats;

  return (
    <div
      onClick={onClick}
      className={cn(
        'relative cursor-pointer overflow-hidden rounded-lg border-2 p-4 transition-all hover:shadow-md',
        isSelected ? 'ring-2 ring-offset-1' : 'hover:shadow-lg'
      )}
      style={{
        borderColor: isSelected ? subjectColor.hex : subjectColor.border,
        backgroundColor: isSelected ? subjectColor.bg : 'white',
        ...(isSelected && ({ '--tw-ring-color': subjectColor.hex } as React.CSSProperties)),
      }}
    >
      {/* Colored left accent bar */}
      <div
        className="absolute top-0 bottom-0 left-0 w-1.5 rounded-l"
        style={{ backgroundColor: subjectColor.hex }}
      />

      <div className="flex items-start justify-between gap-3 pl-2">
        <div className="min-w-0 flex-1">
          {/* Subject Badge */}
          <Badge
            variant="secondary"
            className="mb-2 font-medium"
            style={{
              backgroundColor: subjectColor.bg,
              color: subjectColor.text,
              borderColor: subjectColor.border,
              borderWidth: '1px',
            }}
          >
            {homework.subject_name}
          </Badge>

          {/* Title */}
          <h4 className="truncate font-semibold text-slate-900">{homework.title}</h4>

          {/* Due Date */}
          <p className="mt-1 text-sm text-slate-500">
            Due: {format(new Date(homework.due_datetime), 'MMM d, h:mm a')}
          </p>
        </div>

        {/* Submission Progress */}
        {stats && (
          <div className="text-right">
            <p className="text-lg font-bold" style={{ color: subjectColor.hex }}>
              {stats.submitted}/{stats.total_students}
            </p>
            <p className="text-xs text-slate-500">submitted</p>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      {stats && (
        <div className="mt-3 pl-2">
          <div
            className="h-2 w-full overflow-hidden rounded-full"
            style={{ backgroundColor: `${subjectColor.hex}20` }}
          >
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${stats.completion_rate}%`,
                backgroundColor: subjectColor.hex,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default function HomeworkSubmissionsPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Get initial values from URL params
  const initialClassId = searchParams.get('class') || '';
  const initialDateParam = searchParams.get('date');
  const initialDate =
    initialDateParam && isValid(parseISO(initialDateParam))
      ? parseISO(initialDateParam)
      : getPreviousWorkingDay();
  const initialHomeworkId = searchParams.get('homework') || '';

  // State
  const [selectedDate, setSelectedDate] = useState<Date>(initialDate);
  const [selectedClassId, setSelectedClassId] = useState<string>(initialClassId);
  const [selectedHomeworkId, setSelectedHomeworkId] = useState<string>(initialHomeworkId);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch teacher's classes
  const { data: teacherClasses = [], isLoading: isLoadingClasses } = useTeacherClasses();

  // Set initial class from teacher classes if not already set
  useEffect(() => {
    if (teacherClasses.length > 0 && !selectedClassId) {
      setSelectedClassId(teacherClasses[0].public_id);
    }
  }, [teacherClasses, selectedClassId]);

  // Get selected class details
  const selectedClass = useMemo(() => {
    return teacherClasses.find((c) => c.public_id === selectedClassId) || null;
  }, [teacherClasses, selectedClassId]);

  // Fetch homework for the selected class and date
  const homeworkFilters: HomeworkListParams = useMemo(
    () => ({
      class_public_id: selectedClassId || undefined,
      assigned_date: format(selectedDate, 'yyyy-MM-dd'),
      status: 'published', // Only show published homework for submissions
    }),
    [selectedClassId, selectedDate]
  );

  const {
    data: homeworkList = [],
    isLoading: isLoadingHomework,
    refetch: refetchHomework,
  } = useHomeworkList(selectedClassId ? homeworkFilters : undefined);

  // Get the selected homework
  const selectedHomework = useMemo(() => {
    return homeworkList.find((h) => h.public_id === selectedHomeworkId) || null;
  }, [homeworkList, selectedHomeworkId]);

  // Auto-select first homework when list loads
  useEffect(() => {
    if (homeworkList.length === 0) {
      setSelectedHomeworkId('');
      return;
    }
    if (!selectedHomeworkId || !homeworkList.some((h) => h.public_id === selectedHomeworkId)) {
      setSelectedHomeworkId(homeworkList[0].public_id);
    }
  }, [homeworkList, selectedHomeworkId]);

  // Fetch submissions for the selected homework
  const {
    data: submissionsData,
    isLoading: isLoadingSubmissions,
    refetch: refetchSubmissions,
  } = useHomeworkSubmissions(selectedHomeworkId);

  // Update URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedClassId) {
      params.set('class', selectedClassId);
    }
    params.set('date', format(selectedDate, 'yyyy-MM-dd'));
    if (selectedHomeworkId) {
      params.set('homework', selectedHomeworkId);
    }
    setSearchParams(params, { replace: true });
  }, [selectedClassId, selectedDate, selectedHomeworkId, setSearchParams]);

  // Filter submissions
  const filteredSubmissions = useMemo(() => {
    if (!submissionsData?.submissions) {
      return [];
    }

    let filtered = submissionsData.submissions;

    if (statusFilter === 'late') {
      filtered = filtered.filter((s) => s.is_late);
    }
    if (statusFilter !== 'all' && statusFilter !== 'late') {
      filtered = filtered.filter((s) => s.status === statusFilter);
    }

    if (!searchQuery) {
      return filtered;
    }

    const query = searchQuery.toLowerCase();
    return filtered.filter(
      (s) =>
        s.student_name.toLowerCase().includes(query) ||
        s.student_roll_number.toLowerCase().includes(query)
    );
  }, [submissionsData?.submissions, statusFilter, searchQuery]);

  // Handlers
  const handlePrevDay = useCallback(() => {
    let newDate = subDays(selectedDate, 1);
    while (isWeekend(newDate)) {
      newDate = subDays(newDate, 1);
    }
    setSelectedDate(newDate);
    setSelectedHomeworkId('');
  }, [selectedDate]);

  const handleNextDay = useCallback(() => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    while (isWeekend(newDate)) {
      newDate.setDate(newDate.getDate() + 1);
    }
    setSelectedDate(newDate);
    setSelectedHomeworkId('');
  }, [selectedDate]);

  const handleClassChange = useCallback((classId: string) => {
    setSelectedClassId(classId);
    setSelectedHomeworkId(''); // Reset homework selection
  }, []);

  const handleHomeworkSelect = useCallback((homeworkId: string) => {
    setSelectedHomeworkId(homeworkId);
    setStatusFilter('all'); // Reset status filter
    setSearchQuery(''); // Reset search
  }, []);

  const handleRefresh = useCallback(() => {
    refetchHomework();
    if (selectedHomeworkId) {
      refetchSubmissions();
    }
  }, [refetchHomework, refetchSubmissions, selectedHomeworkId]);

  const stats = submissionsData?.stats;
  const isToday = format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Homework Submissions"
        description="View and review student homework submissions"
        actions={[
          {
            label: 'Refresh',
            onClick: handleRefresh,
            variant: 'outline' as const,
            icon: RefreshCw,
          },
        ]}
      />

      {/* Filters */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Filter className="h-5 w-5" />
            Select Homework
          </CardTitle>
          <CardDescription>Choose class and date to view homework submissions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Class</label>
              {isLoadingClasses ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <SearchableSelect
                  options={teacherClasses.map((cls) => ({
                    value: cls.public_id,
                    label: cls.name,
                  }))}
                  value={selectedClassId}
                  onValueChange={handleClassChange}
                  placeholder="Select a class"
                  searchPlaceholder="Search classes..."
                  className="w-full"
                />
              )}
            </div>

            <div className="flex-1">
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Homework Date
              </label>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="icon" onClick={handlePrevDay} className="h-10 w-10">
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'flex-1 justify-start text-left font-normal',
                        isToday && 'border-blue-500 text-blue-600'
                      )}
                    >
                      <CalendarDays className="mr-2 h-4 w-4" />
                      {format(selectedDate, 'EEE, MMM d, yyyy')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => {
                        if (date) {
                          setSelectedDate(date);
                          setSelectedHomeworkId('');
                        }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>

                <Button variant="outline" size="icon" onClick={handleNextDay} className="h-10 w-10">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Homework Selection */}
          <div className="mt-6">
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Select Homework to View Submissions
            </label>

            {isLoadingHomework ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-32 w-full rounded-lg" />
                ))}
              </div>
            ) : homeworkList.length === 0 ? (
              <div className="rounded-lg border-2 border-dashed p-8 text-center">
                <BookOpen className="mx-auto h-10 w-10 text-slate-300" />
                <p className="mt-2 text-sm text-slate-500">
                  No published homework found for {selectedClass?.name} on{' '}
                  {format(selectedDate, 'MMM d, yyyy')}
                </p>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {homeworkList.map((homework) => (
                  <HomeworkSelectCard
                    key={homework.public_id}
                    homework={homework}
                    isSelected={homework.public_id === selectedHomeworkId}
                    onClick={() => handleHomeworkSelect(homework.public_id)}
                  />
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Submissions Section - Only show when homework is selected */}
      {selectedHomework && (
        <>
          {/* Stats */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <StatsCard
              icon={Users}
              label="Total Students"
              value={stats?.total_students || 0}
              color="slate"
              isLoading={isLoadingSubmissions}
            />
            <StatsCard
              icon={CheckCircle2}
              label="Submitted"
              value={stats?.submitted || 0}
              color="green"
              isLoading={isLoadingSubmissions}
            />
            <StatsCard
              icon={Clock}
              label="Pending"
              value={stats?.pending || 0}
              color="amber"
              isLoading={isLoadingSubmissions}
            />
            <StatsCard
              icon={FileText}
              label="Reviewed"
              value={stats?.reviewed || 0}
              color="blue"
              isLoading={isLoadingSubmissions}
            />
            <StatsCard
              icon={AlertCircle}
              label="Late"
              value={stats?.late || 0}
              color="red"
              isLoading={isLoadingSubmissions}
            />
          </div>

          {/* Submissions List */}
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-lg">{selectedHomework.title}</CardTitle>
                  <CardDescription>
                    {selectedHomework.subject_name} • {selectedClass?.name}
                  </CardDescription>
                </div>

                {/* Search and Filter */}
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      placeholder="Search students..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-[200px] pl-9"
                    />
                  </div>
                  <SearchableSelect
                    options={[
                      { value: 'all', label: 'All Status' },
                      { value: 'submitted', label: 'Submitted' },
                      { value: 'reviewed', label: 'Reviewed' },
                      { value: 'late', label: 'Late' },
                    ]}
                    value={statusFilter}
                    onValueChange={setStatusFilter}
                    placeholder="Status"
                    className="w-[140px]"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingSubmissions ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-16 w-full rounded-lg" />
                  ))}
                </div>
              ) : filteredSubmissions.length === 0 ? (
                <EmptyState
                  title={
                    searchQuery || statusFilter !== 'all'
                      ? 'No Matching Submissions'
                      : 'No Submissions Yet'
                  }
                  description={
                    searchQuery || statusFilter !== 'all'
                      ? 'Try adjusting your search or filter criteria.'
                      : "Students haven't submitted their homework yet."
                  }
                />
              ) : (
                <SubmissionTable
                  submissions={filteredSubmissions}
                  homeworkId={selectedHomeworkId}
                />
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Initial Empty State when no homework selected */}
      {!selectedHomework && homeworkList.length > 0 && (
        <Card>
          <CardContent className="py-16">
            <EmptyState
              title="Select Homework"
              description="Click on a homework card above to view its submissions."
              icon={BookOpen}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
