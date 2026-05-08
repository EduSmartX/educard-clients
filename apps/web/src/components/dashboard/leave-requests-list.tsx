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
        'bg-white rounded-xl p-6 shadow-sm border border-gray-100 h-full flex flex-col',
        className
      )}
    >
      <div className="flex items-center justify-between mb-4">
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

      <div className="space-y-4 flex-1 overflow-y-auto">
        {requests.map((request) => (
          <div
            key={request.id}
            className="flex items-center gap-4 p-4 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors"
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
                <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                  <span className="text-sm font-semibold text-indigo-600">
                    {request.userName.charAt(0)}
                  </span>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{request.userName}</p>
              <p className="text-xs text-gray-500">
                {request.leaveType} - {request.duration}
              </p>
              {request.supervisor && (
                <p className="text-xs text-gray-600 mt-1">
                  <span className="font-medium">Supervisor:</span> {request.supervisor}
                </p>
              )}
            </div>

            {/* Actions */}
            {request.status === 'pending' && onApprove && onReject && (
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => onApprove(request.id)}
                  className="h-8 px-3 text-xs font-semibold bg-green-600 hover:bg-green-700 text-white"
                >
                  Approve
                </Button>
                <Button
                  onClick={() => onReject(request.id)}
                  className="h-8 px-3 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white"
                >
                  Reject
                </Button>
              </div>
            )}

            {/* Status Badge */}
            {request.status && request.status !== 'pending' && (
              <span
                className={cn(
                  'px-3 py-1 text-xs font-semibold rounded-full',
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
          <div className="text-center py-8 text-gray-500 text-sm">
            No leave requests at the moment
          </div>
        )}
      </div>
    </div>
  );
}
