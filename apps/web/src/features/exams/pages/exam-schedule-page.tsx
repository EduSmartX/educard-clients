/**
 * Exam Notifications Page
 *
 * Per-session, per-class view with:
 * - Calendar date blocks on the left
 * - Card-based exam list with status, time, marks
 * - Progress summary bar
 * - Send Schedule / Publish Results action buttons
 */

import { useState, useMemo } from 'react';
import {
  Calendar,
  Clock,
  Send,
  Award,
  AlertCircle,
  Loader2,
  FileText,
  Pencil,
  Eye,
  BarChart3,
} from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/components/common';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { useExamSessions, useExams } from '../hooks/use-exams';
import { useClasses } from '@/features/classes/hooks/use-classes';
import {
  useSendExamScheduleNotification,
  useSendExamResultsNotification,
  useSendExamProgressNotification,
} from '../hooks/mutations';
import { useRole } from '@/hooks/use-role';
import {
  EXAM_SESSION_TYPE_LABELS,
  EXAM_STATUS_LABELS,
  type Exam,
  type ExamSessionType,
  type ExamStatus,
} from '@educard/shared';
import { EXAM_STATUS_COLORS, EXAM_STATUS_DOT_COLORS } from './exam-overview-constants';
import { ROUTES } from '@/constants';

function formatExamTime(
  startTime: string | null | undefined,
  endTime: string | null | undefined
): string {
  if (startTime && endTime) {
    const start = format(new Date(`2000-01-01T${startTime}`), 'hh:mm a');
    const end = format(new Date(`2000-01-01T${endTime}`), 'hh:mm a');
    return `${start} - ${end}`;
  }
  if (startTime) {
    return format(new Date(`2000-01-01T${startTime}`), 'hh:mm a');
  }
  return '—';
}

export function ExamSchedulePage() {
  const { isAdmin } = useRole();
  const navigate = useNavigate();
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [selectedClassId, setSelectedClassId] = useState<string>('');

  // Data fetching
  const { data: sessionsData } = useExamSessions({ page: 1, page_size: 100 });
  const { data: classesData } = useClasses({ page: 1, page_size: 200 });

  const { data: examsData, isLoading } = useExams(
    selectedSessionId && selectedClassId
      ? { page: 1, page_size: 500, session: selectedSessionId, class_id: selectedClassId }
      : { page: 1, page_size: 0 }
  );

  const sessions = useMemo(() => sessionsData?.data || [], [sessionsData]);
  const classes = useMemo(() => classesData?.data || [], [classesData]);
  const exams = useMemo(() => examsData?.data || [], [examsData]);

  // Mutation hooks
  const sendScheduleMutation = useSendExamScheduleNotification();
  const sendResultsMutation = useSendExamResultsNotification();
  const sendProgressMutation = useSendExamProgressNotification();

  // Stats
  const stats = useMemo(() => {
    const total = exams.length;
    const completed = exams.filter((e) => e.status === 'completed').length;
    const draft = exams.filter((e) => e.status === 'draft').length;
    const cancelled = exams.filter((e) => e.status === 'cancelled').length;
    const scheduled = exams.filter(
      (e) => e.status === 'scheduled' || e.status === 'in_progress' || e.status === 'completed'
    ).length;
    const nonCancelled = total - cancelled;

    // 1. Send Schedule: ALL exams must be scheduled (none in draft)
    const canSendSchedule = draft === 0 && nonCancelled > 0 && scheduled === nonCancelled;

    // 2. All completed: every non-cancelled exam has status 'completed'
    const allCompleted = completed === nonCancelled && nonCancelled > 0;

    // 3. All marks published: teacher confirmed marks for all completed exams
    const completedExams = exams.filter((e) => e.status === 'completed');
    const allMarksPublished = allCompleted && completedExams.every((e) => e.is_marks_published);

    const progressPercent = nonCancelled > 0 ? Math.round((completed / nonCancelled) * 100) : 0;

    return {
      total,
      completed,
      draft,
      nonCancelled,
      canSendSchedule,
      allCompleted,
      allMarksPublished,
      progressPercent,
    };
  }, [exams]);

  // Sort exams by date, then time, then subject
  const sortedExams = useMemo(() => {
    return [...exams].sort((a, b) => {
      if (a.date && b.date) {
        return a.date.localeCompare(b.date);
      }
      if (a.date) {
        return -1;
      }
      if (b.date) {
        return 1;
      }
      return a.subject_name.localeCompare(b.subject_name);
    });
  }, [exams]);

  const handleSendSchedule = () => {
    if (!selectedSessionId || !selectedClassId) {
      return;
    }
    sendScheduleMutation.mutate({ sessionId: selectedSessionId, classId: selectedClassId });
  };

  const handleSendResults = () => {
    if (!selectedSessionId || !selectedClassId) {
      return;
    }
    sendResultsMutation.mutate({ sessionId: selectedSessionId, classId: selectedClassId });
  };

  const handleSendProgress = () => {
    if (!selectedSessionId || !selectedClassId) {
      return;
    }
    sendProgressMutation.mutate({ sessionId: selectedSessionId, classId: selectedClassId });
  };

  const hasData = selectedSessionId && selectedClassId && !isLoading && exams.length > 0;

  const getScheduleTitle = () => {
    if (stats.draft > 0) {
      return `Cannot send: ${stats.draft} exam(s) still in draft. Schedule them first.`;
    }
    if (stats.nonCancelled === 0) {
      return 'No exams found';
    }
    return 'Send exam schedule notification to parents & staff';
  };

  const getResultsTitle = () => {
    if (!stats.allCompleted) {
      return `Cannot send: ${stats.nonCancelled - stats.completed} exam(s) not yet completed.`;
    }
    if (!stats.allMarksPublished) {
      return 'Cannot send: Marks not published for all exams. Publish marks first.';
    }
    return 'Send results published notification to parents & staff';
  };

  const getProgressTitle = () => {
    if (!stats.allCompleted) {
      return `Cannot send: ${stats.nonCancelled - stats.completed} exam(s) not yet completed.`;
    }
    if (!stats.allMarksPublished) {
      return 'Cannot send: Marks not published for all exams. Publish marks first.';
    }
    return "Send each parent their child's individual marks, percentage, grade & pass/fail status";
  };

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          title="Exam Notifications"
          icon={Calendar}
          description="View exam schedule and send notifications"
        />

        {/* Action Buttons — always visible when data loaded, disabled when criteria not met */}
        {hasData && isAdmin && (
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              className="gap-1.5 bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-sm hover:from-purple-600 hover:to-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
              onClick={handleSendSchedule}
              disabled={!stats.canSendSchedule || sendScheduleMutation.isPending}
              title={getScheduleTitle()}
            >
              {sendScheduleMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Send Schedule
            </Button>
            <Button
              size="sm"
              className="gap-1.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-sm hover:from-green-600 hover:to-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              onClick={handleSendResults}
              disabled={!stats.allMarksPublished || sendResultsMutation.isPending}
              title={getResultsTitle()}
            >
              {sendResultsMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Award className="h-4 w-4" />
              )}
              Publish Results
            </Button>
            <Button
              size="sm"
              className="gap-1.5 bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-sm hover:from-indigo-600 hover:to-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
              onClick={handleSendProgress}
              disabled={!stats.allMarksPublished || sendProgressMutation.isPending}
              title={getProgressTitle()}
            >
              {sendProgressMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <BarChart3 className="h-4 w-4" />
              )}
              Send Progress Reports
            </Button>
          </div>
        )}
      </div>

      {/* Top Section: Filters + Summary side by side */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Filters (Left) */}
        <Card className="border shadow-sm">
          <CardContent className="p-5">
            <div className="grid grid-cols-2 gap-3">
              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-gray-600">
                  Exam Session <span className="text-red-500">*</span>
                </span>
                <SearchableSelect
                  options={sessions.map((session) => ({
                    value: session.public_id,
                    label: `${session.name} (${EXAM_SESSION_TYPE_LABELS[session.session_type as ExamSessionType] || session.session_type})`,
                  }))}
                  value={selectedSessionId}
                  onValueChange={(val) => {
                    setSelectedSessionId(val);
                    setSelectedClassId('');
                  }}
                  placeholder="Select session..."
                  searchPlaceholder="Search sessions..."
                />
              </label>
              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-gray-600">
                  Class <span className="text-red-500">*</span>
                </span>
                <SearchableSelect
                  options={classes.map((cls) => ({
                    value: cls.public_id,
                    label: `${cls.class_master?.name || ''} - ${cls.name}`,
                  }))}
                  value={selectedClassId}
                  onValueChange={setSelectedClassId}
                  placeholder="Select class..."
                  searchPlaceholder="Search classes..."
                />
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Schedule Summary (Right) */}
        <Card className="border shadow-sm">
          <CardContent className="p-5">
            {hasData ? (
              <>
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-gray-900">Schedule Summary</h4>
                  <button
                    type="button"
                    onClick={() => navigate(ROUTES.EXAMS_LIST)}
                    className="text-sm font-medium text-purple-600 hover:text-purple-700"
                  >
                    View All
                  </button>
                </div>
                <p className="mt-2 text-sm text-gray-600">
                  Exam Progress:{' '}
                  <span className="font-semibold text-green-600">
                    {stats.completed}/{stats.nonCancelled} Completed
                  </span>
                  <span className="ml-3 text-gray-400">{stats.progressPercent}%</span>
                </p>
                <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-gray-200">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-green-400 to-green-500 transition-all duration-500"
                    style={{ width: `${stats.progressPercent}%` }}
                  />
                </div>
                {stats.draft > 0 && (
                  <p className="mt-2 flex items-center gap-1 text-xs text-amber-600">
                    <AlertCircle className="h-3 w-3" />
                    {stats.draft} exam(s) still in draft — schedule them to send notifications
                  </p>
                )}
                {stats.allCompleted && !stats.allMarksPublished && (
                  <p className="mt-2 flex items-center gap-1 text-xs text-amber-600">
                    <AlertCircle className="h-3 w-3" />
                    Marks not published for all subjects — publish marks from the Marks Entry page
                    to enable notifications
                  </p>
                )}
              </>
            ) : (
              <div className="flex h-full items-center justify-center py-4">
                <p className="text-sm text-gray-400">Select session & class to see summary</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Empty State */}
      {(!selectedSessionId || !selectedClassId) && (
        <Card className="py-16 text-center">
          <CardContent>
            <FileText className="mx-auto h-12 w-12 text-gray-300" />
            <h3 className="mt-4 text-lg font-medium text-gray-600">
              {selectedSessionId ? 'Select a Class' : 'Select an Exam Session'}
            </h3>
            <p className="mt-1 text-sm text-gray-400">
              Choose both a session and class to view the exam schedule and send notifications
            </p>
          </CardContent>
        </Card>
      )}

      {/* Loading */}
      {selectedSessionId && selectedClassId && isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
        </div>
      )}

      {/* No exams */}
      {selectedSessionId && selectedClassId && !isLoading && exams.length === 0 && (
        <Card className="py-12 text-center">
          <CardContent>
            <AlertCircle className="mx-auto h-10 w-10 text-amber-400" />
            <h3 className="mt-3 text-base font-medium text-gray-600">No exams found</h3>
            <p className="text-sm text-gray-400">
              No exams have been created for this session and class yet.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Exam Cards with Calendar Date Blocks */}
      {hasData && (
        <div className="space-y-3">
          {sortedExams.map((exam) => (
            <ExamCard
              key={exam.public_id}
              exam={exam}
              isAdmin={isAdmin}
              onEdit={() => navigate(ROUTES.EXAMS_EDIT.replace(':id', exam.public_id))}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Exam Card Component ────────────────────────────────────────────────────────

interface ExamCardProps {
  readonly exam: Exam;
  readonly isAdmin: boolean;
  readonly onEdit: () => void;
}

function ExamCard({ exam, isAdmin, onEdit }: ExamCardProps) {
  const [expanded, setExpanded] = useState(false);

  const dateObj = exam.date ? new Date(exam.date) : null;
  const monthStr = dateObj ? format(dateObj, 'MMM').toUpperCase() : '';
  const dayStr = dateObj ? format(dateObj, 'dd') : '';

  const statusLabel = EXAM_STATUS_LABELS[exam.status as ExamStatus] || exam.status;

  return (
    <Card className="overflow-hidden border shadow-sm transition-all hover:shadow-md">
      <CardContent className="p-0">
        <div className="flex items-stretch">
          {/* Calendar Date Block */}
          <div className="flex w-20 flex-shrink-0 flex-col items-center justify-center border-r bg-white p-3">
            {dateObj ? (
              <>
                <span className="rounded bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white uppercase">
                  {monthStr}
                </span>
                <span className="mt-1 text-2xl font-bold text-gray-800">{dayStr}</span>
              </>
            ) : (
              <span className="text-xs font-medium text-gray-400">TBA</span>
            )}
          </div>

          {/* Content */}
          <div className="flex flex-1 items-center justify-between gap-4 px-5 py-4">
            {/* Subject & Details */}
            <div className="min-w-0 flex-1">
              <h4 className="text-base font-semibold text-gray-900">{exam.subject_name}</h4>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {formatExamTime(exam.start_time, exam.end_time)}
                </span>
                <span className="flex items-center gap-1">
                  <FileText className="h-3.5 w-3.5" />
                  Max Marks: {exam.max_marks}
                </span>
                <span>% Pass Marks: {exam.passing_marks}</span>
              </div>
            </div>

            {/* Status Badge */}
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${EXAM_STATUS_COLORS[exam.status] || ''}`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${EXAM_STATUS_DOT_COLORS[exam.status] || ''}`}
                />
                {statusLabel}
              </span>
              {exam.status === 'completed' && exam.is_marks_published && (
                <span className="inline-flex items-center gap-1 rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-[10px] font-semibold text-green-700">
                  ✓ Marks Published
                </span>
              )}
            </div>

            {/* Action Button + Chevron */}
            <div className="flex items-center gap-2">
              {isAdmin && (
                <>
                  {exam.status === 'completed' ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 text-xs"
                      onClick={onEdit}
                    >
                      <Eye className="h-3.5 w-3.5" />
                      View Results
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 text-xs"
                      onClick={onEdit}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </Button>
                  )}
                </>
              )}
              <button
                type="button"
                onClick={() => setExpanded(!expanded)}
                className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <svg
                  className={`h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Expanded Details */}
        {expanded && (
          <div className="border-t bg-gray-50 px-5 py-3">
            <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
              <div>
                <span className="text-xs text-gray-400">Session</span>
                <p className="font-medium text-gray-700">{exam.session_name}</p>
              </div>
              <div>
                <span className="text-xs text-gray-400">Duration</span>
                <p className="font-medium text-gray-700">{exam.duration_formatted || '—'}</p>
              </div>
              <div>
                <span className="text-xs text-gray-400">Max Marks</span>
                <p className="font-medium text-gray-700">{exam.max_marks}</p>
              </div>
              <div>
                <span className="text-xs text-gray-400">Pass Marks</span>
                <p className="font-medium text-gray-700">{exam.passing_marks}</p>
              </div>
            </div>
            {exam.description && <p className="mt-2 text-xs text-gray-500">{exam.description}</p>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
