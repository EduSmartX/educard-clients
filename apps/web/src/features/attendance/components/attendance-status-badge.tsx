import { Badge } from '@/components/ui/badge';

interface AttendanceStatusBadgeProps {
  status: 'present' | 'absent' | 'leave' | 'holiday' | 'half_day';
  label?: string;
  className?: string;
}

/**
 * Reusable badge component for displaying attendance status
 * with consistent color coding across the application
 */
export function AttendanceStatusBadge({ 
  status, 
  label, 
  className 
}: AttendanceStatusBadgeProps) {
  const getStatusStyle = () => {
    switch (status) {
      case 'present':
        return 'bg-green-600 hover:bg-green-700 text-white';
      case 'absent':
        return 'bg-red-600 hover:bg-red-700 text-white';
      case 'leave':
        return 'bg-yellow-50 hover:bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'holiday':
        return 'bg-blue-50 hover:bg-blue-100 text-blue-800 border-blue-300';
      case 'half_day':
        return 'bg-orange-50 hover:bg-orange-100 text-orange-800 border-orange-300';
      default:
        return 'bg-gray-100 hover:bg-gray-200 text-gray-800';
    }
  };

  const getDefaultLabel = () => {
    switch (status) {
      case 'present':
        return 'Present';
      case 'absent':
        return 'Absent';
      case 'leave':
        return 'Leave';
      case 'holiday':
        return 'Holiday';
      case 'half_day':
        return 'Half Day';
      default:
        return status;
    }
  };

  const variant = ['leave', 'holiday', 'half_day'].includes(status) ? 'outline' : 'default';

  return (
    <Badge variant={variant} className={`${getStatusStyle()} ${className || ''}`}>
      {label || getDefaultLabel()}
    </Badge>
  );
}
