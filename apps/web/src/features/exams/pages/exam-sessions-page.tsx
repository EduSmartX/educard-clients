/**
 * Exam Sessions Page
 * Manage exam sessions (Unit Tests, Quarterly, Half Yearly, Annual)
 *
 * Role-based access:
 * - Admin: Full CRUD (create, read, update, delete)
 * - Teacher: View only
 */

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, Plus, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { SearchableSelect } from '@/components/ui/searchable-select';
import {
  PageHeader,
  DeletedViewToggle,
  DeleteConfirmationDialog,
  ReactivateConfirmationDialog,
  HowItWorksDialog,
} from '@/components/common';
import { ROUTES } from '@/constants';
import { useExamSessions } from '../hooks/use-exams';
import { useDeleteExamSession, useReactivateExamSession } from '../hooks/mutations';
import { createExamSessionColumns } from '../components/exam-session-columns';
import { useDeletedView } from '@/hooks/use-deleted-view';
import { useRole } from '@/hooks/use-role';
import { useAcademicYears } from '@/features/organizations/hooks/queries';
import {
  EXAM_SESSION_TYPE_OPTIONS,
  EXAM_SESSION_TYPE_LABELS,
  type ExamSession,
} from '@educard/shared';
import { format } from 'date-fns';
import { downloadFile } from '@/lib/utils';

// How It Works content for Exam Sessions
const examSessionsHowItWorks = {
  title: 'How Exam Sessions Work',
  steps: [
    {
      title: 'Create an Exam Session',
      description: (
        <>
          An exam session represents a term or examination period like "Unit Test 1", "Quarterly
          Exam", "Half Yearly", or "Annual Exam". Set the date range for when exams will be
          conducted.
        </>
      ),
    },
    {
      title: 'Create Exams for Each Class',
      description: (
        <>
          Go to <strong>Exams → Create Exams (Bulk)</strong> to add exams for all subjects in a
          class at once. Select the session, class, and set dates/times for each subject.
        </>
      ),
    },
    {
      title: 'Enter Exam Marks',
      description: (
        <>
          After exams are conducted, enter marks for each student. Go to{' '}
          <strong>Exams → View Exam</strong> to enter or edit marks.
        </>
      ),
    },
  ],
  tips: [
    {
      title: 'Bulk Creation Tip',
      description: (
        <>
          Use <strong>Create Exams (Bulk)</strong> to quickly create exams for all subjects in a
          class. You can copy dates and times from one subject to others.
        </>
      ),
    },
  ],
  warnings: [
    {
      title: 'Important Notes',
      items: [
        "Exam dates must be within the session's date range",
        'Deleting a session will also delete all exams under it',
        'Make sure to set max marks and passing marks for each exam',
      ],
    },
  ],
};

export function ExamSessionsPage() {
  const navigate = useNavigate();
  const { isAdmin } = useRole();

  // ── State ────────────────────────────────
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sessionTypeFilter, setSessionTypeFilter] = useState<string>('');
  const [academicYearFilter, setAcademicYearFilter] = useState<string>('');
  const [sessionToDelete, setSessionToDelete] = useState<ExamSession | undefined>();
  const [sessionToReactivate, setSessionToReactivate] = useState<ExamSession | undefined>();

  const { data: academicYears = [] } = useAcademicYears();

  const { showDeleted, toggleDeletedView } = useDeletedView({
    onPageChange: setPage,
  });

  const { data: sessionsData, isLoading } = useExamSessions({
    page,
    page_size: pageSize,
    session_type: sessionTypeFilter || undefined,
    academic_year: academicYearFilter || undefined,
    is_deleted: showDeleted,
  });

  const sessions = sessionsData?.data || [];
  const pagination = sessionsData?.pagination;

  // ── Mutations ──────────────────────────────────────────
  const deleteMutation = useDeleteExamSession({
    onSuccess: () => setSessionToDelete(undefined),
  });
  const reactivateMutation = useReactivateExamSession({
    onSuccess: () => setSessionToReactivate(undefined),
  });

  // ── Export functionality ───────────────────────────────
  const handleExport = () => {
    if (!sessions.length) {
      return;
    }

    const headers = [
      'Session Name',
      'Session Type',
      'Academic Year',
      'Start Date',
      'End Date',
      'Exam Count',
      'Description',
    ];

    const rows = sessions.map((session) => [
      session.name,
      EXAM_SESSION_TYPE_LABELS[session.session_type] || session.session_type,
      session.academic_year,
      session.start_date ? format(new Date(session.start_date), 'dd/MM/yyyy') : '',
      session.end_date ? format(new Date(session.end_date), 'dd/MM/yyyy') : '',
      session.exam_count,
      session.description || '',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const filename = `exam_sessions_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    downloadFile(blob, filename);
  };

  // ── Column configurations ──────────────────────────────
  const columns = useMemo(
    () =>
      createExamSessionColumns({
        onView: (s) => navigate(ROUTES.EXAM_SESSIONS_VIEW.replace(':id', s.public_id)),
        onEdit: isAdmin
          ? (s) => navigate(ROUTES.EXAM_SESSIONS_EDIT.replace(':id', s.public_id))
          : undefined,
        onDelete: isAdmin
          ? (s) => {
              if (showDeleted) {
                setSessionToReactivate(s);
              } else {
                setSessionToDelete(s);
              }
            }
          : undefined,
        isDeletedView: showDeleted,
      }),
    [navigate, showDeleted, isAdmin]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Exam Sessions"
        icon={ClipboardList}
        description="Manage exam terms like Unit Tests, Quarterly, Half Yearly, Annual exams"
      >
        <HowItWorksDialog {...examSessionsHowItWorks} />
      </PageHeader>

      <Card className="border shadow-sm">
        <CardHeader className="bg-muted/30 flex flex-col gap-4 border-b px-6 py-4">
          <div className="flex flex-row items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">All Exam Sessions</h3>
              <p className="text-sm text-gray-500">{pagination?.count || 0} session(s) found</p>
            </div>
            <div className="flex items-center gap-3">
              {/* Export Button */}
              <Button
                onClick={handleExport}
                variant="outline"
                className="gap-2"
                disabled={!sessions.length}
              >
                <Download className="h-4 w-4" />
                Export
              </Button>
              {isAdmin && (
                <Button
                  onClick={() => navigate(ROUTES.EXAM_SESSIONS_NEW)}
                  className="gap-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md hover:from-blue-600 hover:to-blue-700"
                >
                  <Plus className="h-4 w-4" />
                  New Session
                </Button>
              )}
              {isAdmin && (
                <DeletedViewToggle showDeleted={showDeleted} onToggle={toggleDeletedView} />
              )}
            </div>
          </div>
          {/* Filters Row */}
          <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <SearchableSelect
              options={[
                { value: 'all', label: 'All Types' },
                ...EXAM_SESSION_TYPE_OPTIONS.map((opt) => ({
                  value: opt.value,
                  label: opt.label,
                })),
              ]}
              value={sessionTypeFilter || 'all'}
              onValueChange={(value) => {
                setSessionTypeFilter(value === 'all' ? '' : value);
                setPage(1);
              }}
              placeholder="Session Type"
              searchPlaceholder="Search session types..."
              className="w-full"
            />
            <SearchableSelect
              options={[
                { value: 'all', label: 'All Years' },
                ...academicYears.map((y) => ({
                  value: y.public_id,
                  label: `${y.name}${y.is_current ? ' (Current)' : ''}`,
                })),
              ]}
              value={academicYearFilter || 'all'}
              onValueChange={(value) => {
                setAcademicYearFilter(value === 'all' ? '' : value);
                setPage(1);
              }}
              placeholder="Academic Year"
              className="w-full"
            />
            {(sessionTypeFilter || academicYearFilter) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSessionTypeFilter('');
                  setAcademicYearFilter('');
                  setPage(1);
                }}
                className="h-10 justify-start text-xs text-gray-500 hover:text-gray-700"
              >
                Clear Filters
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={sessions}
            isLoading={isLoading}
            pagination={pagination}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(1);
            }}
            emptyMessage={
              showDeleted
                ? 'No deleted exam sessions found.'
                : 'No exam sessions yet. Create your first exam session to get started.'
            }
            emptyAction={
              isAdmin && !showDeleted && sessions.length === 0
                ? {
                    label: 'Create Exam Session',
                    onClick: () => navigate(ROUTES.EXAM_SESSIONS_NEW),
                  }
                : undefined
            }
            getRowKey={(row: ExamSession) => row.public_id}
          />
        </CardContent>
      </Card>

      {/* Delete Confirmation */}
      <DeleteConfirmationDialog
        open={!!sessionToDelete}
        onOpenChange={(open) => !open && setSessionToDelete(undefined)}
        onConfirm={() => sessionToDelete && deleteMutation.mutate(sessionToDelete.public_id)}
        title="Delete Exam Session"
        description={`Are you sure you want to delete "${sessionToDelete?.name}"? This action can be undone later.`}
        isDeleting={deleteMutation.isPending}
      />

      {/* Reactivate Confirmation */}
      <ReactivateConfirmationDialog
        open={!!sessionToReactivate}
        onOpenChange={(open) => !open && setSessionToReactivate(undefined)}
        onConfirm={() =>
          sessionToReactivate && reactivateMutation.mutate(sessionToReactivate.public_id)
        }
        title="Restore Exam Session"
        description={`Are you sure you want to restore "${sessionToReactivate?.name}"?`}
        isReactivating={reactivateMutation.isPending}
      />
    </div>
  );
}

export default ExamSessionsPage;
