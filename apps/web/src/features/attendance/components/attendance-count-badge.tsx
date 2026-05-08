interface AttendanceCountBadgeProps {
  count: number;
  type: 'present' | 'absent' | 'leave';
  className?: string;
}

/**
 * Reusable count badge component for displaying attendance counts
 * Used in tables and summary views
 */
export function AttendanceCountBadge({ count, type, className }: AttendanceCountBadgeProps) {
  const getTypeStyle = () => {
    switch (type) {
      case 'present':
        return 'text-green-800 bg-green-100';
      case 'absent':
        return 'text-red-800 bg-red-100';
      case 'leave':
        return 'text-yellow-800 bg-yellow-100';
      default:
        return 'text-gray-800 bg-gray-100';
    }
  };

  return (
    <span
      className={`inline-flex items-center justify-center px-2 py-1 text-xs font-bold rounded-full ${getTypeStyle()} ${className || ''}`}
    >
      {count}
    </span>
  );
}
