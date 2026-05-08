/**
 * Exam Session Table Columns Configuration
 */

import { Eye, Pencil, Trash2, RotateCcw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Column } from '@/components/ui/data-table';
import { EXAM_SESSION_TYPE_LABELS, type ExamSession, type ExamSessionType } from '../types';
import { format } from 'date-fns';

interface CreateColumnsParams {
  onView: (session: ExamSession) => void;
  onEdit?: (session: ExamSession) => void;
  onDelete?: (session: ExamSession) => void;
  isDeletedView?: boolean;
}

const sessionTypeBadgeVariant: Record<ExamSessionType, string> = {
  unit_test: 'bg-blue-50 text-blue-700 border-blue-200',
  quarterly: 'bg-purple-50 text-purple-700 border-purple-200',
  half_yearly: 'bg-amber-50 text-amber-700 border-amber-200',
  annual: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  custom: 'bg-gray-50 text-gray-700 border-gray-200',
};

export function createExamSessionColumns({
  onView,
  onEdit,
  onDelete,
  isDeletedView = false,
}: CreateColumnsParams): Column<ExamSession>[] {
  return [
    {
      header: 'Session Name',
      accessor: (row) => (
        <div className="flex flex-col gap-1">
          <span className="font-semibold text-gray-900">{row.name}</span>
          {row.description && (
            <span className="line-clamp-1 text-xs text-gray-500">{row.description}</span>
          )}
        </div>
      ),
      sortable: true,
      sortKey: 'name',
      width: 220,
    },
    {
      header: 'Type',
      accessor: (row) => (
        <Badge
          variant="outline"
          className={`text-xs font-medium ${sessionTypeBadgeVariant[row.session_type] || ''}`}
        >
          {EXAM_SESSION_TYPE_LABELS[row.session_type] || row.session_type}
        </Badge>
      ),
      sortable: true,
      sortKey: 'session_type',
      width: 140,
    },
    {
      header: 'Academic Year',
      accessor: (row) => (
        <span className="font-mono text-sm text-gray-700">{row.academic_year}</span>
      ),
      sortable: true,
      sortKey: 'academic_year',
      width: 130,
    },
    {
      header: 'Duration',
      accessor: (row) => {
        if (!row.start_date && !row.end_date) {
          return <span className="text-gray-400 italic">Not set</span>;
        }
        return (
          <div className="flex flex-col gap-0.5 text-sm text-gray-700">
            {row.start_date && <span>{format(new Date(row.start_date), 'dd MMM yyyy')}</span>}
            {row.start_date && row.end_date && <span className="text-gray-400">to</span>}
            {row.end_date && <span>{format(new Date(row.end_date), 'dd MMM yyyy')}</span>}
          </div>
        );
      },
      width: 140,
    },
    {
      header: 'Exams',
      accessor: (row) => (
        <Badge variant="secondary" className="font-medium">
          {row.exam_count}
        </Badge>
      ),
      width: 80,
    },
    {
      header: 'Created',
      accessor: (row) => (
        <div className="flex flex-col gap-0.5">
          <span className="text-sm text-gray-700">
            {format(new Date(row.created_at), 'dd MMM yyyy')}
          </span>
          {row.created_by_name && (
            <span className="text-xs text-gray-500">by {row.created_by_name}</span>
          )}
        </div>
      ),
      sortable: true,
      sortKey: 'created_at',
      width: 140,
    },
    {
      header: 'Actions',
      accessor: (session) => (
        <div className="flex items-center gap-1">
          {isDeletedView ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.(session);
              }}
              title="Restore"
            >
              <RotateCcw className="h-4 w-4 text-green-600" />
            </Button>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onView(session);
                }}
                title="View"
              >
                <Eye className="h-4 w-4" />
              </Button>
              {onEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(session);
                  }}
                  title="Edit"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(session);
                  }}
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              )}
            </>
          )}
        </div>
      ),
      width: 120,
    },
  ];
}
