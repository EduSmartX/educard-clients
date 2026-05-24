/**
 * Class Table Columns Configuration for DataTable
 * Creates column definitions for the classes list table
 */

import { Eye, RotateCcw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Column } from '@/components/ui/data-table';
import type { Class } from '../types';
import { createCommonColumns } from '@/components/tables/common-columns';

interface CreateColumnsParams {
  onView: (classItem: Class) => void;
  onEdit: (classItem: Class) => void;
  onDelete?: (classItem: Class) => void;
  isDeletedView?: boolean;
  viewMode?: 'admin' | 'employee'; // Admin = show all, Employee = hide actions
}

export function createClassListColumns({
  onView,
  onEdit,
  onDelete,
  isDeletedView = false,
  viewMode = 'admin',
}: CreateColumnsParams): Column<Class>[] {
  const isEmployeeView = viewMode === 'employee';
  return [
    {
      header: 'Class',
      accessor: (row) => (
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-medium">
            {row.class_master.name}
          </Badge>
          <span className="text-gray-500">-</span>
          <Badge variant="outline">{row.name}</Badge>
        </div>
      ),
      sortable: true,
      sortKey: 'class_master__name',
      width: 200,
    },
    {
      header: 'Class Teacher',
      accessor: (row) => (
        <div className="flex flex-col">
          {row.class_teacher ? (
            <>
              <span className="font-medium text-gray-900">{row.class_teacher.full_name}</span>
              <span className="text-sm text-gray-500">{row.class_teacher.employee_id}</span>
            </>
          ) : (
            <span className="text-gray-400">Not assigned</span>
          )}
        </div>
      ),
      width: 200,
    },
    {
      header: 'Capacity',
      accessor: (row) => <span className="text-gray-700">{row.capacity || '—'}</span>,
      sortable: true,
      sortKey: 'capacity',
      width: 100,
    },
    {
      header: 'Room',
      accessor: (row) => <span className="text-gray-700">{row.room_number || '—'}</span>,
      sortable: true,
      sortKey: 'room_number',
      width: 100,
    },
    {
      header: 'Students',
      accessor: (row) => <span className="font-medium text-gray-900">{row.student_count}</span>,
      sortable: true,
      sortKey: 'student_count',
      width: 100,
    },
    // Common columns: Created, Updated, Actions (Actions hidden for employee view)
    ...getActionColumns(isEmployeeView, isDeletedView, onView, onEdit, onDelete),
  ];
}

function getActionColumns(
  isEmployeeView: boolean,
  isDeletedView: boolean,
  onView: (item: Class) => void,
  onEdit?: (item: Class) => void,
  onDelete?: (item: Class) => void
): Column<Class>[] {
  if (isEmployeeView) {
    return [];
  }

  if (isDeletedView) {
    return [
      {
        header: 'Actions',
        accessor: (classItem) => (
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                onView(classItem);
              }}
              className="text-blue-600 hover:bg-blue-50 hover:text-blue-700"
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
                  onDelete(classItem);
                }}
                className="text-green-600 hover:bg-green-50 hover:text-green-700"
                title="Restore Class"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            )}
          </div>
        ),
        headerClassName: 'text-left',
      } as Column<Class>,
    ];
  }

  return createCommonColumns<Class>(
    { onView, onEdit, onDelete },
    {
      includeCreated: true,
      includeUpdated: true,
      actionsOptions: {
        variant: 'buttons',
        showLabels: false,
        align: 'left',
      },
    }
  );
}
