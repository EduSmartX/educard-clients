/**
 * Homework List Page
 * Date-based, class-wise homework board with color-coded subjects
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { format, parseISO, isValid } from 'date-fns';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Plus,
  BookOpen,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Search,
  Loader2,
  X,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/constants/app-config';
import { getSubjectColor, type SubjectColorScheme } from '@educard/shared';
import { useNavigateWorkingDay } from '@/features/core';
import { PageHeader } from '@/components/common';

import { useTeacherClasses, useHomeworkList, useDeleteHomework } from '../hooks';
import type { Homework, HomeworkListParams } from '../types';

// Helper to get yesterday's date (fallback when API fails)
function getYesterday(): Date {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return date;
}

interface SubjectHomework {
  subject: { public_id: string; subject_name: string; teacher_name?: string };
  homework: Homework | null;
  color: SubjectColorScheme;
}

export default function HomeworkListPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Get initial values from URL params (for persistence across navigation)
  const initialClassId = searchParams.get('class') || '';
  const initialDateParam = searchParams.get('date');
  const initialDate =
    initialDateParam && isValid(parseISO(initialDateParam))
      ? parseISO(initialDateParam)
      : getYesterday();
  const initialTab = searchParams.get('tab') || 'all';

  const [selectedDate, setSelectedDate] = useState<Date>(initialDate);
  const [selectedClassId, setSelectedClassId] = useState<string>(initialClassId);
  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [searchQuery, setSearchQuery] = useState('');

  // Working day navigation mutation
  const { mutateAsync: navigateWorkingDay, isPending: isNavigating } = useNavigateWorkingDay();

  const { data: teacherClasses = [], isLoading: isLoadingClasses } = useTeacherClasses();

  const selectedClass = useMemo(() => {
    if (selectedClassId) {
      return teacherClasses.find((c) => c.public_id === selectedClassId) ?? null;
    }
    return teacherClasses[0] ?? null;
  }, [selectedClassId, teacherClasses]);

  // Set initial class from teacher classes if not already set
  useEffect(() => {
    if (teacherClasses.length > 0 && !selectedClassId) {
      const firstClassId = teacherClasses[0].public_id;
      setSelectedClassId(firstClassId);
    }
  }, [teacherClasses, selectedClassId]);

  // Update URL params when filters change (for persistence)
  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedClassId) {
      params.set('class', selectedClassId);
    }
    params.set('date', format(selectedDate, 'yyyy-MM-dd'));
    if (activeTab !== 'all') {
      params.set('tab', activeTab);
    }
    setSearchParams(params, { replace: true });
  }, [selectedClassId, selectedDate, activeTab, setSearchParams]);

  const filters: HomeworkListParams = useMemo(() => {
    const f: HomeworkListParams = {
      class_public_id: selectedClass?.public_id,
      assigned_date: format(selectedDate, 'yyyy-MM-dd'), // Filter by assigned date
    };
    if (activeTab !== 'all') {
      f.status = activeTab as HomeworkListParams['status'];
    }
    return f;
  }, [selectedClass, selectedDate, activeTab]);

  const { data: homeworkList = [], isLoading: isLoadingHomework } = useHomeworkList(
    selectedClass ? filters : undefined
  );

  const subjectsWithHomework: SubjectHomework[] = useMemo(() => {
    if (!selectedClass?.subjects) {
      return [];
    }

    return selectedClass.subjects.map((subject) => {
      const homework =
        homeworkList.find((hw) => hw.subject_public_id === subject.public_id) || null;
      const color = getSubjectColor(subject.subject_name);
      return { subject, homework, color };
    });
  }, [selectedClass?.subjects, homeworkList]);

  const filteredSubjects = useMemo(() => {
    if (!searchQuery) {
      return subjectsWithHomework;
    }
    const query = searchQuery.toLowerCase();
    return subjectsWithHomework.filter(
      (sh) =>
        sh.subject.subject_name.toLowerCase().includes(query) ||
        sh.homework?.title?.toLowerCase().includes(query)
    );
  }, [subjectsWithHomework, searchQuery]);

  const viewStats = useMemo(() => {
    const total = subjectsWithHomework.length;
    const assigned = subjectsWithHomework.filter((s) => s.homework).length;
    const published = subjectsWithHomework.filter((s) => s.homework?.status === 'published').length;
    const draft = subjectsWithHomework.filter((s) => s.homework?.status === 'draft').length;
    return { total, assigned, published, draft, pending: total - assigned };
  }, [subjectsWithHomework]);

  // Check if we can navigate to next day (max 1 week from today)
  const canNavigateNext = useMemo(() => {
    const oneWeekFromToday = new Date();
    oneWeekFromToday.setDate(oneWeekFromToday.getDate() + 7);
    return selectedDate < oneWeekFromToday;
  }, [selectedDate]);

  const handlePrevDay = useCallback(async () => {
    try {
      const result = await navigateWorkingDay({
        date: format(selectedDate, 'yyyy-MM-dd'),
        direction: 'previous',
        class_id: selectedClassId || undefined,
      });
      setSelectedDate(new Date(result.date));
    } catch {
      setSelectedDate((prev) => {
        const newDate = new Date(prev);
        newDate.setDate(newDate.getDate() - 1);
        return newDate;
      });
    }
  }, [selectedDate, selectedClassId, navigateWorkingDay]);

  const handleNextDay = useCallback(async () => {
    if (!canNavigateNext) {
      return;
    }

    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 7);

    try {
      const result = await navigateWorkingDay({
        date: format(selectedDate, 'yyyy-MM-dd'),
        direction: 'next',
        class_id: selectedClassId || undefined,
      });
      const resultDate = new Date(result.date);
      if (resultDate <= maxDate) {
        setSelectedDate(resultDate);
      }
    } catch {
      const newDate = new Date(selectedDate);
      newDate.setDate(newDate.getDate() + 1);
      if (newDate <= maxDate) {
        setSelectedDate(newDate);
      }
    }
  }, [selectedDate, selectedClassId, navigateWorkingDay, canNavigateNext]);

  const handleCreateHomework = useCallback(() => {
    // For creating homework, use today's date (not the currently viewed past date)
    const today = new Date();
    const dateStr = format(today, 'yyyy-MM-dd');
    navigate(`${ROUTES.HOMEWORK_NEW}?class=${selectedClass?.public_id}&date=${dateStr}`);
  }, [navigate, selectedClass]);

  const handleViewHomework = useCallback(
    (homework: Homework) => {
      navigate(ROUTES.HOMEWORK_VIEW.replace(':id', homework.public_id));
    },
    [navigate]
  );

  const handleAddSubjectHomework = useCallback(
    (subjectId: string) => {
      // For creating homework, use today's date (not the currently viewed past date)
      const today = new Date();
      const dateStr = format(today, 'yyyy-MM-dd');
      navigate(
        `${ROUTES.HOMEWORK_NEW}?class=${selectedClass?.public_id}&subject=${subjectId}&date=${dateStr}`
      );
    },
    [navigate, selectedClass]
  );

  const deleteHomework = useDeleteHomework();
  const handleDeleteHomework = useCallback(
    (publicId: string) => {
      deleteHomework.mutate(publicId);
    },
    [deleteHomework]
  );

  const isToday = format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
  const isYesterday = useMemo(() => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return format(selectedDate, 'yyyy-MM-dd') === format(yesterday, 'yyyy-MM-dd');
  }, [selectedDate]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Homework"
        description="Manage homework assignments for your classes"
        actions={[
          {
            label: 'Create Homework',
            onClick: handleCreateHomework,
            variant: 'default' as const,
            icon: Plus,
            disabled: !selectedClass,
          },
        ]}
      />

      {/* Date & Class Selection */}
      <div className="bg-card flex flex-col gap-4 rounded-lg border p-4 sm:flex-row sm:items-center">
        <div className="flex-1">
          <label className="text-muted-foreground mb-1.5 block text-sm font-medium">Class</label>
          {isLoadingClasses ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            <SearchableSelect
              options={teacherClasses.map((cls) => ({
                value: cls.public_id,
                label: cls.name,
              }))}
              value={selectedClassId}
              onValueChange={setSelectedClassId}
              placeholder="Select a class"
              searchPlaceholder="Search classes..."
              className="w-full sm:w-[250px]"
            />
          )}
        </div>

        <div className="flex items-center gap-2">
          <label className="text-muted-foreground mb-1.5 block text-sm font-medium sm:hidden">
            Date
          </label>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              onClick={handlePrevDay}
              className="h-10 w-10"
              disabled={isNavigating}
            >
              {isNavigating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'min-w-[220px] justify-start text-left font-normal',
                    isYesterday && 'border-primary bg-primary/5'
                  )}
                >
                  <CalendarDays className="mr-2 h-4 w-4" />
                  <span className="font-medium">{format(selectedDate, 'EEE, MMM d, yyyy')}</span>
                  {isYesterday && (
                    <Badge variant="secondary" className="ml-2">
                      Yesterday
                    </Badge>
                  )}
                  {isToday && (
                    <Badge variant="default" className="ml-2">
                      Today
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <Button
              variant="outline"
              size="icon"
              onClick={handleNextDay}
              className="h-10 w-10"
              disabled={isNavigating || !canNavigateNext}
            >
              {isNavigating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ChevronRight
                  className={`h-4 w-4 ${!canNavigateNext ? 'text-muted-foreground' : ''}`}
                />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Stats for Current View */}
      {selectedClass && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="bg-card rounded-lg border p-3">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">Total Subjects</span>
              <BookOpen className="h-4 w-4 text-blue-500" />
            </div>
            <p className="mt-1 text-2xl font-bold">{viewStats.total}</p>
          </div>
          <div className="bg-card rounded-lg border p-3">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">Assigned</span>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </div>
            <p className="mt-1 text-2xl font-bold text-green-600">{viewStats.assigned}</p>
          </div>
          <div className="bg-card rounded-lg border p-3">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">Published</span>
              <FileText className="h-4 w-4 text-emerald-500" />
            </div>
            <p className="mt-1 text-2xl font-bold text-emerald-600">{viewStats.published}</p>
          </div>
          <div className="bg-card rounded-lg border p-3">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">Pending</span>
              <AlertCircle className="h-4 w-4 text-amber-500" />
            </div>
            <p className="mt-1 text-2xl font-bold text-amber-600">{viewStats.pending}</p>
          </div>
        </div>
      )}

      {/* Tabs & Search */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="published">Published</TabsTrigger>
            <TabsTrigger value="draft">Drafts</TabsTrigger>
          </TabsList>

          <div className="relative w-full sm:w-[250px]">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              placeholder="Search subjects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <TabsContent value={activeTab} className="mt-6">
          {(isLoadingClasses || isLoadingHomework) && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-52 rounded-xl" />
              ))}
            </div>
          )}
          {!isLoadingClasses && !isLoadingHomework && !selectedClass && (
            <EmptyState
              icon={BookOpen}
              title="No Class Selected"
              description="Select a class to view homework assignments"
            />
          )}
          {!isLoadingClasses &&
            !isLoadingHomework &&
            selectedClass &&
            filteredSubjects.length === 0 && (
              <EmptyState
                icon={BookOpen}
                title="No Subjects Found"
                description={
                  searchQuery
                    ? 'No subjects match your search'
                    : 'This class has no subjects assigned'
                }
              />
            )}
          {!isLoadingClasses &&
            !isLoadingHomework &&
            selectedClass &&
            filteredSubjects.length > 0 && (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredSubjects.map(({ subject, homework, color }) => (
                  <SubjectCard
                    key={subject.public_id}
                    subject={subject}
                    homework={homework}
                    color={color}
                    onView={handleViewHomework}
                    onAdd={() => handleAddSubjectHomework(subject.public_id)}
                    onDelete={handleDeleteHomework}
                  />
                ))}
              </div>
            )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-muted/30 flex flex-col items-center justify-center rounded-xl border-2 border-dashed py-20">
      <Icon className="text-muted-foreground/50 mb-4 h-12 w-12" />
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-muted-foreground mt-1 text-sm">{description}</p>
    </div>
  );
}

interface SubjectCardProps {
  subject: { public_id: string; subject_name: string; teacher_name?: string };
  homework: Homework | null;
  color: SubjectColorScheme;
  onView: (homework: Homework) => void;
  onAdd: () => void;
  onDelete: (publicId: string) => void;
}

function SubjectCard({ subject, homework, color, onView, onAdd, onDelete }: SubjectCardProps) {
  const hasHomework = !!homework;

  return (
    <div
      className={cn(
        'group relative rounded-xl border-2 transition-all duration-200',
        color.border,
        hasHomework ? 'hover:shadow-lg' : 'hover:border-dashed'
      )}
    >
      {/* Delete button - shown on hover like timetable */}
      {hasHomework && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(homework.public_id);
          }}
          className="absolute -top-2 -right-2 z-10 hidden h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white shadow-sm transition-all group-hover:flex hover:bg-red-600"
          title="Delete homework"
        >
          <X className="h-3 w-3" />
        </button>
      )}

      {/* Color accent bar */}
      <div className="h-2 rounded-t-[10px]" style={{ backgroundColor: color.hex }} />

      <div className="p-4">
        {/* Subject Header */}
        <div className="mb-3 flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className={cn('rounded-lg p-2', color.bg)}>
              <BookOpen className={cn('h-5 w-5', color.text)} />
            </div>
            <div>
              <h3 className={cn('font-semibold', color.text)}>{subject.subject_name}</h3>
              {!!subject.teacher_name && (
                <p className="text-muted-foreground text-xs">{subject.teacher_name}</p>
              )}
            </div>
          </div>
          {hasHomework ? (
            <Badge variant={homework.status === 'published' ? 'default' : 'secondary'}>
              {homework.status}
            </Badge>
          ) : (
            <Badge variant="outline" className="text-muted-foreground">
              No Homework
            </Badge>
          )}
        </div>

        {/* Content */}
        {hasHomework ? (
          <div className="space-y-3">
            <h4 className="line-clamp-2 leading-tight font-medium">{homework.title}</h4>

            {!!homework.description && (
              <p className="text-muted-foreground line-clamp-2 text-sm">{homework.description}</p>
            )}

            <div className="text-muted-foreground flex flex-wrap items-center gap-3 text-xs">
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                Due: {format(new Date(homework.due_datetime), 'h:mm a')}
              </span>
              {homework.attachment_count > 0 && (
                <span className="flex items-center gap-1">
                  <FileText className="h-3.5 w-3.5" />
                  {homework.attachment_count} files
                </span>
              )}
              {!!homework.reference_link && (
                <span className="flex items-center gap-1">
                  <ExternalLink className="h-3.5 w-3.5" />
                  Link
                </span>
              )}
            </div>

            {!!homework.submission_stats && (
              <div className="flex items-center gap-2">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-green-500 transition-all"
                    style={{ width: `${homework.submission_stats.completion_rate}%` }}
                  />
                </div>
                <span className="text-muted-foreground text-xs">
                  {homework.submission_stats.submitted}/{homework.submission_stats.total_students}
                </span>
              </div>
            )}

            <Button variant="outline" size="sm" className="w-full" onClick={() => onView(homework)}>
              View Details
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center py-4 text-center">
            <div className={cn('mb-2 rounded-full p-3')} style={{ backgroundColor: color.light }}>
              <Plus className={cn('h-5 w-5', color.text)} />
            </div>
            <p className="text-muted-foreground mb-3 text-sm">No homework assigned</p>
            <Button
              variant="outline"
              size="sm"
              onClick={onAdd}
              className={cn('border-dashed', color.border)}
            >
              <Plus className="mr-1 h-4 w-4" />
              Add Homework
            </Button>
          </div>
        )}
      </div>

      {/* Status indicator */}
      {hasHomework && (
        <div
          className={cn(
            'absolute top-5 right-3 h-2 w-2 rounded-full',
            homework.status === 'published' ? 'bg-emerald-500' : 'bg-amber-500'
          )}
        />
      )}
    </div>
  );
}
