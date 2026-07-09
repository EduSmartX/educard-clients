import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, FileText, Info, Loader2, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { PageHeader } from '@/components/common';
import { ROUTES } from '@/constants';
import { useClasses } from '@/features/classes/hooks/use-classes';
import { useRole } from '@/hooks/use-role';
import { useExamSessions, useExams } from '../hooks/use-exams';
import { useBulkUpdateExamStatuses, useUpdateExamStatus } from '../hooks/mutations';
import { ExamStatusChangeConfirmationDialog } from '../components/exam-status-change-confirmation-dialog';
import { EXAM_STATUS_COLORS } from './exam-overview-constants';
import {
  EXAM_STATUS_LABELS,
  EXAM_STATUS_OPTIONS,
  EXAM_SESSION_TYPE_LABELS,
  type Exam,
  type ExamStatus,
} from '@educard/shared';

const STATUS_ORDER: Record<ExamStatus, number> = {
  draft: 0,
  scheduled: 1,
  in_progress: 2,
  completed: 3,
  cancelled: 4,
};

type PendingChange =
  | {
      mode: 'single';
      examId: string;
      examName: string;
      fromStatus: ExamStatus;
      toStatus: ExamStatus;
    }
  | {
      mode: 'bulk';
      updates: Array<{ id: string; fromStatus: ExamStatus; toStatus: ExamStatus }>;
      fromStatus: ExamStatus;
      toStatus: ExamStatus;
      affectedCount: number;
    };

function isBackwardTransition(fromStatus: ExamStatus, toStatus: ExamStatus) {
  return STATUS_ORDER[toStatus] < STATUS_ORDER[fromStatus];
}

export function ExamStatusControlPage() {
  const navigate = useNavigate();
  const { isAdmin } = useRole();

  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [bulkTargetStatus, setBulkTargetStatus] = useState<ExamStatus | ''>('completed');
  const [pendingChange, setPendingChange] = useState<PendingChange | null>(null);
  const [singleTargetStatus, setSingleTargetStatus] = useState<Record<string, ExamStatus>>({});

  const { data: sessionsData } = useExamSessions({ page: 1, page_size: 100 });
  const { data: classesData } = useClasses({
    page: 1,
    page_size: 200,
    ...(isAdmin ? {} : { my_classes_only: true }),
  });

  const statusOptions = useMemo(
    () => EXAM_STATUS_OPTIONS.filter((o) => o.value !== 'in_progress'),
    []
  );

  const shouldFetchExams = Boolean(selectedSessionId && selectedClassId);
  const { data: examsData, isLoading } = useExams(
    shouldFetchExams
      ? {
          page: 1,
          page_size: 500,
          session: selectedSessionId,
          class_id: selectedClassId,
        }
      : { page: 1, page_size: 0 }
  );

  const sessions = useMemo(() => sessionsData?.data || [], [sessionsData?.data]);
  const classes = useMemo(() => classesData?.data || [], [classesData?.data]);
  const exams = useMemo(() => examsData?.data || [], [examsData?.data]);

  const updateExamStatusMutation = useUpdateExamStatus({
    onSuccess: () => setPendingChange(null),
  });

  const bulkUpdateStatusesMutation = useBulkUpdateExamStatuses({
    onSuccess: () => setPendingChange(null),
  });

  const isMutating = updateExamStatusMutation.isPending || bulkUpdateStatusesMutation.isPending;

  const selectedClassName = useMemo(() => {
    const selectedClass = classes.find((item) => item.public_id === selectedClassId);
    return selectedClass
      ? `${selectedClass.class_master?.name || 'Class'} - ${selectedClass.name}`
      : 'Selected Class';
  }, [classes, selectedClassId]);

  const stats = useMemo(() => {
    const counts: Record<ExamStatus, number> = {
      draft: 0,
      scheduled: 0,
      in_progress: 0,
      completed: 0,
      cancelled: 0,
    };

    exams.forEach((exam) => {
      counts[exam.status] += 1;
    });

    return counts;
  }, [exams]);

  const openSingleUpdate = (exam: Exam) => {
    const targetStatus = singleTargetStatus[exam.public_id] || exam.status;

    if (targetStatus === exam.status) {
      toast.info('Select a different status to update.');
      return;
    }

    if (isBackwardTransition(exam.status, targetStatus)) {
      setPendingChange({
        mode: 'single',
        examId: exam.public_id,
        examName: exam.subject_name,
        fromStatus: exam.status,
        toStatus: targetStatus,
      });
      return;
    }

    updateExamStatusMutation.mutate({ id: exam.public_id, status: targetStatus });
  };

  const openBulkUpdate = () => {
    if (!bulkTargetStatus) {
      toast.error('Please select a target status for class-level update.');
      return;
    }

    const updates = exams
      .filter((exam) => exam.status !== bulkTargetStatus)
      .map((exam) => ({
        id: exam.public_id,
        fromStatus: exam.status,
        toStatus: bulkTargetStatus,
      }));

    if (updates.length === 0) {
      toast.info('All exams already have the selected status.');
      return;
    }

    const firstBackward = updates.find((item) =>
      isBackwardTransition(item.fromStatus, item.toStatus)
    );

    if (firstBackward) {
      setPendingChange({
        mode: 'bulk',
        updates,
        fromStatus: firstBackward.fromStatus,
        toStatus: firstBackward.toStatus,
        affectedCount: updates.length,
      });
      return;
    }

    bulkUpdateStatusesMutation.mutate({
      updates: updates.map((item) => ({ id: item.id, status: item.toStatus })),
    });
  };

  const handleConfirmPendingChange = () => {
    if (!pendingChange) {
      return;
    }

    if (pendingChange.mode === 'single') {
      updateExamStatusMutation.mutate({ id: pendingChange.examId, status: pendingChange.toStatus });
      return;
    }

    bulkUpdateStatusesMutation.mutate({
      updates: pendingChange.updates.map((item) => ({
        id: item.id,
        status: item.toStatus,
      })),
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Exam Status Control"
        icon={RotateCcw}
        description="Update exam status for a full class or for individual exams before marks entry"
      >
        <Button
          variant="brandOutline"
          onClick={() => navigate(ROUTES.EXAMS_LIST)}
          className="gap-2"
        >
          <FileText className="h-4 w-4" />
          Back to Exams
        </Button>
      </PageHeader>

      <Card className="border shadow-sm">
        <CardHeader className="bg-muted/30 border-b px-6 py-4">
          <CardTitle className="text-lg">Select Session and Class</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-medium text-gray-700">Exam Session</span>
            <SearchableSelect
              options={sessions.map((session) => ({
                value: session.public_id,
                label: `${session.name} (${EXAM_SESSION_TYPE_LABELS[session.session_type] || session.session_type})`,
              }))}
              value={selectedSessionId}
              onValueChange={(value) => {
                setSelectedSessionId(value);
                setSelectedClassId('');
                setSingleTargetStatus({});
              }}
              placeholder="Select session"
              searchPlaceholder="Search sessions..."
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium text-gray-700">Class</span>
            <SearchableSelect
              options={classes.map((item) => ({
                value: item.public_id,
                label: `${item.class_master?.name || 'Class'} - ${item.name}`,
              }))}
              value={selectedClassId}
              onValueChange={(value) => {
                setSelectedClassId(value);
                setSingleTargetStatus({});
              }}
              placeholder="Select class"
              searchPlaceholder="Search classes..."
              disabled={!selectedSessionId}
            />
          </label>
        </CardContent>
      </Card>

      {!isAdmin && classes.length === 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="flex items-center gap-2 py-8 text-sm text-blue-700">
            <Info className="h-4 w-4 shrink-0" />
            You are not a class teacher. Only class teachers can update exam statuses.
          </CardContent>
        </Card>
      )}

      {shouldFetchExams && (
        <>
          <Card className="border shadow-sm">
            <CardContent className="p-6">
              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Class-Level Bulk Update</h3>
                  <p className="text-sm text-gray-500">
                    Apply a status to all exams in {selectedClassName}
                  </p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <SearchableSelect
                    options={statusOptions.map((option) => ({
                      value: option.value,
                      label: option.label,
                    }))}
                    value={bulkTargetStatus}
                    onValueChange={(value) => setBulkTargetStatus(value as ExamStatus)}
                    placeholder="Select target status"
                    className="w-[200px]"
                  />
                  <Button
                    variant="warning"
                    onClick={openBulkUpdate}
                    disabled={!exams.length || isMutating || !bulkTargetStatus}
                    className="gap-2"
                  >
                    {bulkUpdateStatusesMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4" />
                    )}
                    Update Class Exams
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                {(
                  ['draft', 'scheduled', 'in_progress', 'completed', 'cancelled'] as ExamStatus[]
                ).map((status) => (
                  <div key={status} className="rounded-xl border bg-gray-50 p-3 text-center">
                    <p className="text-xs font-medium text-gray-500">
                      {EXAM_STATUS_LABELS[status]}
                    </p>
                    <p className="mt-1 text-xl font-semibold text-gray-900">{stats[status]}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border shadow-sm">
            <CardHeader className="bg-muted/30 border-b px-6 py-4">
              <CardTitle className="text-lg">Individual Exam Status Update</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              ) : exams.length === 0 ? (
                <div className="px-6 py-12 text-center text-sm text-gray-500">
                  No exams found for this session and class.
                </div>
              ) : (
                <div className="divide-y">
                  {exams.map((exam) => (
                    <div
                      key={exam.public_id}
                      className="flex flex-col gap-3 px-6 py-4 md:flex-row md:items-center md:justify-between"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-gray-900">
                          {exam.subject_name}
                        </p>
                        <p className="text-xs text-gray-500">{exam.date || 'Date not set'}</p>
                        <Badge
                          variant="outline"
                          className={`mt-2 text-xs ${EXAM_STATUS_COLORS[exam.status] || ''}`}
                        >
                          Current: {EXAM_STATUS_LABELS[exam.status] || exam.status}
                        </Badge>
                      </div>
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <SearchableSelect
                          options={statusOptions.map((option) => ({
                            value: option.value,
                            label: option.label,
                          }))}
                          value={singleTargetStatus[exam.public_id] || exam.status}
                          onValueChange={(value) =>
                            setSingleTargetStatus((prev) => ({
                              ...prev,
                              [exam.public_id]: value as ExamStatus,
                            }))
                          }
                          className="w-[200px]"
                        />
                        <Button
                          variant="info"
                          onClick={() => openSingleUpdate(exam)}
                          disabled={isMutating}
                          className="gap-2"
                        >
                          {updateExamStatusMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <RotateCcw className="h-4 w-4" />
                          )}
                          Update
                        </Button>
                        <Button
                          variant="success"
                          onClick={() =>
                            navigate(
                              `${ROUTES.MARKS_ENTRY}?session=${exam.session_public_id}&class=${exam.class_public_id}&exam=${exam.public_id}`
                            )
                          }
                          disabled={exam.status !== 'completed'}
                          title={
                            exam.status === 'completed'
                              ? 'Enter marks for this exam'
                              : 'Only completed exams allow marks entry'
                          }
                        >
                          Enter Marks
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      <ExamStatusChangeConfirmationDialog
        open={!!pendingChange}
        onOpenChange={(open) => !open && setPendingChange(null)}
        onConfirm={handleConfirmPendingChange}
        isLoading={isMutating}
        fromStatus={pendingChange?.fromStatus || 'scheduled'}
        toStatus={pendingChange?.toStatus || 'draft'}
        examName={pendingChange?.mode === 'single' ? pendingChange.examName : undefined}
        affectedCount={pendingChange?.mode === 'bulk' ? pendingChange.affectedCount : undefined}
      />
    </div>
  );
}

export default ExamStatusControlPage;
