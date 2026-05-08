/**
 * Exams List Page
 * View and manage individual exams (subject-wise)
 * 
 * Role-based access:
 * - Admin: Full CRUD (create, read, update, delete)
 * - Teacher: View only
 */

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Plus, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { PageHeader, DeletedViewToggle, DeleteConfirmationDialog, ReactivateConfirmationDialog } from '@/components/common';
import { ROUTES } from '@/constants';
import { useExams, useExamSessions } from '../hooks/use-exams';
import { useDeleteExam, useReactivateExam } from '../hooks/mutations';
import { createExamColumns } from '../components/exam-columns';
import { useDeletedView } from '@/hooks/use-deleted-view';
import { useRole } from '@/hooks/use-role';
import { useClasses } from '@/features/classes/hooks/use-classes';
import { EXAM_STATUS_OPTIONS, EXAM_SESSION_TYPE_LABELS, EXAM_STATUS_LABELS, type Exam } from '../types';
import { format } from 'date-fns';
import { downloadFile } from '@/lib/utils';

export function ExamsListPage() {
  const navigate = useNavigate();
  const { isAdmin } = useRole();

  // ── State ────────────────────────────────
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sessionFilter, setSessionFilter] = useState<string>('');
  const [classFilter, setClassFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [examToDelete, setExamToDelete] = useState<Exam | undefined>();
  const [examToReactivate, setExamToReactivate] = useState<Exam | undefined>();

  const { showDeleted, toggleDeletedView } = useDeletedView({
    onPageChange: setPage,
  });

  // Fetch sessions for filter
  const { data: sessionsData } = useExamSessions({ page_size: 100 });
  const sessions = sessionsData?.data || [];

  // Fetch classes for filter
  const { data: classesData } = useClasses({ page_size: 100 });
  const classes = classesData?.data || [];

  const { data: examsData, isLoading } = useExams({
    page,
    page_size: pageSize,
    session: sessionFilter || undefined,
    class_id: classFilter || undefined,
    status: statusFilter || undefined,
    is_deleted: showDeleted,
  });

  const exams = examsData?.data || [];
  const pagination = examsData?.pagination;

  // ── Mutations ──────────────────────────────────────────
  const deleteMutation = useDeleteExam({
    onSuccess: () => setExamToDelete(undefined),
  });
  const reactivateMutation = useReactivateExam({
    onSuccess: () => setExamToReactivate(undefined),
  });

  // ── Export functionality ───────────────────────────────
  const handleExport = () => {
    if (!exams.length) {
      return;
    }
    
    const headers = [
      'Session Name',
      'Session Type',
      'Session Start Date',
      'Session End Date',
      'Subject',
      'Class',
      'Status',
      'Exam Date',
      'Start Time',
      'End Time',
      'Max Marks',
      'Passing Marks',
    ];

    const rows = exams.map((exam) => [
      exam.session_name,
      EXAM_SESSION_TYPE_LABELS[exam.session_type] || exam.session_type,
      exam.session_start_date ? format(new Date(exam.session_start_date), 'dd/MM/yyyy') : '',
      exam.session_end_date ? format(new Date(exam.session_end_date), 'dd/MM/yyyy') : '',
      exam.subject_name,
      exam.class_name,
      EXAM_STATUS_LABELS[exam.status] || exam.status,
      exam.date ? format(new Date(exam.date), 'dd/MM/yyyy') : '',
      exam.start_time || '',
      exam.end_time || '',
      exam.max_marks,
      exam.passing_marks,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const filename = `exams_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    downloadFile(blob, filename);
  };

  // ── Column configurations ──────────────────────────────
  const columns = useMemo(
    () =>
      createExamColumns({
        onView: (e) => navigate(ROUTES.EXAMS_VIEW.replace(':id', e.public_id)),
        onEdit: isAdmin ? (e) => navigate(ROUTES.EXAMS_EDIT.replace(':id', e.public_id)) : undefined,
        onDelete: isAdmin ? (e) => {
          if (showDeleted) {
            setExamToReactivate(e);
          } else {
            setExamToDelete(e);
          }
        } : undefined,
        isDeletedView: showDeleted,
      }),
    [navigate, showDeleted, isAdmin]
  );

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Exams" 
        icon={FileText}
        description="View and manage subject-wise exams within sessions"
      />

      <Card className="border shadow-sm">
        <CardHeader className="flex flex-col gap-4 border-b bg-muted/30 px-6 py-4">
          <div className="flex flex-row items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">All Exams</h3>
              <p className="text-sm text-gray-500">
                {pagination?.count || 0} exam(s) found
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* Export Button */}
              <Button
                onClick={handleExport}
                variant="outline"
                className="gap-2"
                disabled={!exams.length}
              >
                <Download className="h-4 w-4" />
                Export
              </Button>
              {isAdmin && (
                <>
                  <Button
                    onClick={() => navigate(ROUTES.EXAMS_BULK_CREATE)}
                    variant="brandOutline"
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Bulk Create
                  </Button>
                  <Button
                    onClick={() => navigate(ROUTES.EXAMS_NEW)}
                    className="gap-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-md hover:from-purple-600 hover:to-purple-700"
                  >
                    <Plus className="h-4 w-4" />
                    New Exam
                  </Button>
                  <DeletedViewToggle showDeleted={showDeleted} onToggle={toggleDeletedView} />
                </>
              )}
            </div>
          </div>
          {/* Filters Row */}
          <div className="flex flex-wrap items-center gap-3">
            <Select
              value={sessionFilter || undefined}
              onValueChange={(value) => {
                setSessionFilter(value === 'all' ? '' : value);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Sessions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sessions</SelectItem>
                {sessions.map((session) => (
                  <SelectItem key={session.public_id} value={session.public_id}>
                    {session.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={classFilter || undefined}
              onValueChange={(value) => {
                setClassFilter(value === 'all' ? '' : value);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="All Classes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {classes.map((cls) => (
                  <SelectItem key={cls.public_id} value={cls.public_id}>
                    {cls.class_master.name} - {cls.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={statusFilter || undefined}
              onValueChange={(value) => {
                setStatusFilter(value === 'all' ? '' : value);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {EXAM_STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {(sessionFilter || classFilter || statusFilter) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSessionFilter('');
                  setClassFilter('');
                  setStatusFilter('');
                  setPage(1);
                }}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                Clear Filters
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={exams}
            isLoading={isLoading}
            pagination={pagination}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(1);
            }}
            emptyMessage={
              showDeleted
                ? 'No deleted exams found.'
                : 'No exams yet. Create exams within an exam session.'
            }
            emptyAction={
              isAdmin && !showDeleted && exams.length === 0
                ? { label: 'Create Exam', onClick: () => navigate(ROUTES.EXAMS_NEW) }
                : undefined
            }
            getRowKey={(row: Exam) => row.public_id}
          />
        </CardContent>
      </Card>

      {/* Delete Confirmation */}
      <DeleteConfirmationDialog
        open={!!examToDelete}
        onOpenChange={(open) => !open && setExamToDelete(undefined)}
        onConfirm={() => examToDelete && deleteMutation.mutate(examToDelete.public_id)}
        title="Delete Exam"
        description={`Are you sure you want to delete the exam for "${examToDelete?.subject_name}"? This action can be undone later.`}
        isDeleting={deleteMutation.isPending}
      />

      {/* Reactivate Confirmation */}
      <ReactivateConfirmationDialog
        open={!!examToReactivate}
        onOpenChange={(open) => !open && setExamToReactivate(undefined)}
        onConfirm={() => examToReactivate && reactivateMutation.mutate(examToReactivate.public_id)}
        title="Restore Exam"
        description={`Are you sure you want to restore the exam for "${examToReactivate?.subject_name}"?`}
        isReactivating={reactivateMutation.isPending}
      />
    </div>
  );
}

export default ExamsListPage;
