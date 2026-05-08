/**
 * Common Table Columns Utilities
 * Reusable column definitions and action handlers for DataTable components
 * Provides standardized columns for Created By, Updated By, and Actions
 */

import { Edit, Eye, Trash2, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Column } from '@/components/ui/data-table';

/**
 * Base interface for rows that support common columns
 */
export interface CommonRowData {
  created_by_name?: string | null;
  created_at: string;
  updated_by_name?: string | null;
  updated_at: string;
  can_manage?: boolean; // NEW: Permission flag for edit/delete actions
}

/**
 * Callbacks for action buttons
 */
export interface ActionCallbacks<T> {
  onView?: (row: T) => void;
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  onCustomAction?: (row: T, actionKey: string) => void;
}

/**
 * Custom action button configuration
 */
export interface CustomAction {
  key: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  variant?: 'default' | 'destructive' | 'success' | 'warning';
  className?: string;
}

/**
 * Options for the actions column
 */
export interface ActionsColumnOptions {
  variant?: 'buttons' | 'dropdown'; // Display as buttons or dropdown menu
  showLabels?: boolean; // Show text labels alongside icons
  align?: 'left' | 'center' | 'right';
  customActions?: CustomAction[];
}

/**
 * Format date for display in common columns
 */
function formatDateForDisplay(dateString: string): string {
  try {
    const date = new Date(dateString);
    const formatted = date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    return `(${formatted})`;
  } catch {
    return dateString;
  }
}

/**
 * Action button configuration
 */
interface ActionButtonConfig {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  colorClass: string;
}

/**
 * Creates the "Actions" column with View, Edit, and Delete buttons (Button variant)
 */
function createButtonActions<T extends CommonRowData>(
  row: T,
  callbacks: ActionCallbacks<T>,
  options?: ActionsColumnOptions
) {
  const { onView, onEdit, onDelete, onCustomAction } = callbacks;
  const { showLabels = false, customActions = [] } = options || {};
  
  // Check if user can manage this row (edit/delete)
  const canManage = row.can_manage ?? true; // Default to true for admins

  const actionButtons: ActionButtonConfig[] = [];

  // View is always available
  if (onView) {
    actionButtons.push({
      icon: Eye,
      label: 'View',
      onClick: () => onView(row),
      colorClass: 'text-blue-600 hover:text-blue-700 hover:bg-blue-50',
    });
  }

  // Edit only if user can manage
  if (onEdit && canManage) {
    actionButtons.push({
      icon: Edit,
      label: 'Edit',
      onClick: () => onEdit(row),
      colorClass: 'text-green-600 hover:text-green-700 hover:bg-green-50',
    });
  }

  // Delete only if user can manage
  if (onDelete && canManage) {
    actionButtons.push({
      icon: Trash2,
      label: 'Delete',
      onClick: () => onDelete(row),
      colorClass: 'text-red-600 hover:text-red-700 hover:bg-red-50',
    });
  }

  const variantClasses = {
    default: 'text-gray-600 hover:text-gray-700 hover:bg-gray-50',
    destructive: 'text-red-600 hover:text-red-700 hover:bg-red-50',
    success: 'text-green-600 hover:text-green-700 hover:bg-green-50',
    warning: 'text-amber-600 hover:text-amber-700 hover:bg-amber-50',
  };

  return (
    <div className="flex items-center gap-1">
      {actionButtons.map((action) => {
        const Icon = action.icon;
        return (
          <Button
            key={action.label}
            variant="ghost"
            size={showLabels ? 'sm' : 'icon'}
            onClick={(e) => {
              e.stopPropagation();
              action.onClick();
            }}
            className={action.colorClass}
            title={action.label}
          >
            <Icon className="h-4 w-4" />
            {showLabels && <span className="ml-2">{action.label}</span>}
          </Button>
        );
      })}
      {customActions.map((action) => {
        const Icon = action.icon;
        return (
          <Button
            key={action.key}
            variant="ghost"
            size={showLabels ? 'sm' : 'icon'}
            onClick={(e) => {
              e.stopPropagation();
              onCustomAction?.(row, action.key);
            }}
            className={action.className || variantClasses[action.variant || 'default']}
            title={action.label}
          >
            {Icon && <Icon className="h-4 w-4" />}
            {showLabels && <span className="ml-2">{action.label}</span>}
          </Button>
        );
      })}
    </div>
  );
}

/**
 * Creates the "Actions" column with dropdown menu
 */
function createDropdownActions<T extends CommonRowData>(
  row: T,
  callbacks: ActionCallbacks<T>,
  options?: ActionsColumnOptions
) {
  const { onView, onEdit, onDelete, onCustomAction } = callbacks;
  const { customActions = [] } = options || {};
  
  // Check if user can manage this row (edit/delete)
  const canManage = row.can_manage ?? true; // Default to true for admins

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()} title="Actions">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {onView && (
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              onView(row);
            }}
            className="cursor-pointer"
          >
            <Eye className="mr-2 h-4 w-4 text-blue-600" />
            View
          </DropdownMenuItem>
        )}
        {onEdit && canManage && (
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              onEdit(row);
            }}
            className="cursor-pointer"
          >
            <Edit className="mr-2 h-4 w-4 text-green-600" />
            Edit
          </DropdownMenuItem>
        )}
        {customActions.map((action) => {
          const Icon = action.icon;
          return (
            <DropdownMenuItem
              key={action.key}
              onClick={(e) => {
                e.stopPropagation();
                onCustomAction?.(row, action.key);
              }}
              className="cursor-pointer"
            >
              {Icon && <Icon className="mr-2 h-4 w-4" />}
              {action.label}
            </DropdownMenuItem>
          );
        })}
        {onDelete && canManage && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onDelete(row);
              }}
              className="cursor-pointer text-red-600 focus:text-red-700"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Creates the "Actions" column with View, Edit, and Delete buttons
 * Supports both button and dropdown variants
 */
export function createActionsColumn<T extends CommonRowData>(
  callbacks: ActionCallbacks<T>,
  options?: ActionsColumnOptions
): Column<T> {
  const { variant = 'buttons', align = 'right' } = options || {};

  return {
    header: 'Actions',
    accessor: (row) =>
      variant === 'dropdown'
        ? createDropdownActions(row, callbacks, options)
        : createButtonActions(row, callbacks, options),
    headerClassName: align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : '',
  };
}

/**
 * Creates the "Created" column (name and timestamp)
 */
export function createCreatedAtColumn<T extends CommonRowData>(): Column<T> {
  return {
    header: 'Created',
    accessor: (row) => (
      <div className="text-sm">
        <div className="font-medium text-gray-900">{row.created_by_name || 'System'}</div>
        <div className="text-xs text-muted-foreground">{formatDateForDisplay(row.created_at)}</div>
      </div>
    ),
    sortable: true,
    sortKey: 'created_at',
  };
}

/**
 * Creates the "Updated" column (name and timestamp)
 */
export function createUpdatedAtColumn<T extends CommonRowData>(): Column<T> {
  return {
    header: 'Updated',
    accessor: (row) => (
      <div className="text-sm">
        <div className="font-medium text-gray-900">{row.updated_by_name || 'System'}</div>
        <div className="text-xs text-muted-foreground">{formatDateForDisplay(row.updated_at)}</div>
      </div>
    ),
    sortable: true,
    sortKey: 'updated_at',
  };
}

/**
 * Creates all common columns (Created, Updated, Actions)
 */
export function createCommonColumns<T extends CommonRowData>(
  callbacks: ActionCallbacks<T>,
  options?: {
    includeCreated?: boolean;
    includeUpdated?: boolean;
    actionsOptions?: ActionsColumnOptions;
  }
): Column<T>[] {
  const { includeCreated = true, includeUpdated = true, actionsOptions } = options || {};

  const columns: Column<T>[] = [];

  if (includeCreated) {
    columns.push(createCreatedAtColumn<T>());
  }

  if (includeUpdated) {
    columns.push(createUpdatedAtColumn<T>());
  }

  columns.push(createActionsColumn<T>(callbacks, actionsOptions));

  return columns;
}
