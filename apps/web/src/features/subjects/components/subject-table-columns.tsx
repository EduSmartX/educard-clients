/**
 * Subject Table Columns Configuration for DataTable
 * Creates column definitions for the subjects list table
 */

import { Eye, RotateCcw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Column } from '@/components/ui/data-table';
import type { Subject } from '../types';
import { createCommonColumns } from '@/components/tables/common-columns';

interface CreateColumnsParams {
  onView: (subject: Subject) => void;
  onEdit: (subject: Subject) => void;
  onDelete?: (subject: Subject) => void;
  isDeletedView?: boolean;
}

export function createSubjectListColumns({
  onView,
  onEdit,
  onDelete,
  isDeletedView = false,
}: CreateColumnsParams): Column<Subject>[] {
  return [
    {
      header: 'Subject',
      accessor: (row) => (
        <div className="flex flex-col gap-1">
          <span className="font-medium text-gray-900">{row.subject_info.name}</span>
          <Badge variant="outline" className="w-fit font-mono text-xs">
            {row.subject_info.code}
          </Badge>
        </div>
      ),
      sortable: true,
      sortKey: 'subject_master__name',
      width: 180,
    },
    {
      header: 'Class',
      accessor: (row) => (
        <span className="text-gray-700">
          {row.class_info.class_master_name} - {row.class_info.name}
        </span>
      ),
      sortable: true,
      sortKey: 'class_assigned__name',
      width: 150,
    },
    {
      header: 'Teacher',
      accessor: (row) => (
        <div className="flex flex-col gap-0.5">
          {row.teacher_info ? (
            <>
              <span className="font-medium text-gray-900">{row.teacher_info.full_name}</span>
              <span className="text-xs text-gray-500">{row.teacher_info.employee_id}</span>
            </>
          ) : (
            <span className="text-gray-400 italic">Not assigned</span>
          )}
        </div>
      ),
      width: 200,
    },
    {
      header: 'Description',
      accessor: (row) => <span className="text-gray-700">{row.description || '—'}</span>,
      width: 200,
    },
    // Common columns with can_manage support: Created, Updated, Actions
    ...(isDeletedView
      ? [
          {
            header: 'Actions',
            accessor: (subject) => (
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    onView(subject);
                  }}
                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                  title="View details"
                >
                  <Eye className="h-4 w-4" />
                </Button>
                {onDelete && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(subject);
                    }}
                    className="text-green-600 hover:text-green-700 hover:bg-green-50"
                    title="Restore Subject"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ),
            headerClassName: 'text-left',
          } as Column<Subject>,
        ]
      : createCommonColumns<Subject>(
          {
            onView,
            onEdit,
            onDelete,
          },
          {
            includeCreated: true,
            includeUpdated: true,
            actionsOptions: {
              variant: 'buttons',
              showLabels: false,
              align: 'left',
            },
          }
        )),
  ];
}
