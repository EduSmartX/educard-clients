import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export interface LeaveRequest {
  id: string;
  userName: string;
  userAvatar?: string;
  leaveType: string;
  duration: string;
  supervisor?: string; // Added supervisor field
  status?: 'pending' | 'approved' | 'rejected';
}

interface LeaveRequestsListProps {
  title?: string;
  requests: LeaveRequest[];
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  onViewAll?: () => void;
  className?: string;
}

export function LeaveRequestsList({
  title = 'Recent Leave Requests',
  requests,
  onApprove,
  onReject,
  onViewAll,
  className,
}: LeaveRequestsListProps) {
  return (
    <div
      className={cn(
        'flex h-full flex-col rounded-xl border border-gray-100 bg-white p-6 shadow-sm',
        className
      )}
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {onViewAll && (
          <button
            onClick={onViewAll}
            className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
          >
            View All
          </button>
        )}
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto">
        {requests.map((request) => (
          <div
            key={request.id}
            className="flex items-center gap-4 rounded-lg border border-gray-100 p-4 transition-colors hover:border-gray-200"
          >
            {/* Avatar */}
            <div className="flex-shrink-0">
              {request.userAvatar ? (
                <img
                  src={request.userAvatar}
                  alt={request.userName}
                  className="h-10 w-10 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100">
                  <span className="text-sm font-semibold text-indigo-600">
                    {request.userName.charAt(0)}
                  </span>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-gray-900">{request.userName}</p>
              <p className="text-xs text-gray-500">
                {request.leaveType} - {request.duration}
              </p>
              {!!request.supervisor && (
                <p className="mt-1 text-xs text-gray-600">
                  <span className="font-medium">Supervisor:</span> {request.supervisor}
                </p>
              )}
            </div>

            {/* Actions */}
            {request.status === 'pending' && onApprove && onReject && (
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => onApprove(request.id)}
                  className="h-8 bg-green-600 px-3 text-xs font-semibold text-white hover:bg-green-700"
                >
                  Approve
                </Button>
                <Button
                  onClick={() => onReject(request.id)}
                  className="h-8 bg-red-600 px-3 text-xs font-semibold text-white hover:bg-red-700"
                >
                  Reject
                </Button>
              </div>
            )}

            {/* Status Badge */}
            {request.status && request.status !== 'pending' && (
              <span
                className={cn(
                  'rounded-full px-3 py-1 text-xs font-semibold',
                  request.status === 'approved'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                )}
              >
                {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
              </span>
            )}
          </div>
        ))}

        {requests.length === 0 && (
          <div className="py-8 text-center text-sm text-gray-500">
            No leave requests at the moment
          </div>
        )}
      </div>
    </div>
  );
}
