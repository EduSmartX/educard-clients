import { Badge } from '@/components/ui/badge';
import { TimesheetStatus, TimesheetStatusLabels, type TimesheetStatusValue } from '@/constants';

interface TimesheetStatusBadgeProps {
  status: TimesheetStatusValue;
  className?: string;
}

/**
 * Reusable badge component for displaying timesheet submission status
 * with consistent styling across the application
 */
export function TimesheetStatusBadge({ status, className }: TimesheetStatusBadgeProps) {
  const getStatusStyle = () => {
    switch (status) {
      case TimesheetStatus.SUBMITTED:
        return 'bg-yellow-500 hover:bg-yellow-600 text-white';
      case TimesheetStatus.APPROVED:
        return 'bg-green-600 hover:bg-green-700 text-white';
      case TimesheetStatus.REJECTED:
        return 'bg-red-600 hover:bg-red-700 text-white';
      case TimesheetStatus.RETURNED:
        return 'bg-orange-500 hover:bg-orange-600 text-white';
      case TimesheetStatus.DRAFT:
        return 'bg-gray-500 hover:bg-gray-600 text-white';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Badge className={`${getStatusStyle()} ${className || ''}`}>
      {TimesheetStatusLabels[status] || status}
    </Badge>
  );
}
