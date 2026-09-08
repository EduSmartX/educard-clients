import { Archive, Circle } from 'lucide-react';
import { NOTIFICATION_CATEGORY_LABELS, type UserNotification } from '@educard/shared';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatRelativeTime } from '@/lib/utils/date-utils';

interface NotificationItemProps {
  notification: UserNotification;
  onOpen: (notification: UserNotification) => void;
  onArchive?: (notification: UserNotification) => void;
  compact?: boolean;
}

export function NotificationItem({
  notification,
  onOpen,
  onArchive,
  compact = false,
}: Readonly<NotificationItemProps>) {
  const isUnread = !notification.is_read;

  return (
    <div
      className={cn(
        'group flex gap-3 rounded-xl border border-transparent p-3 transition-colors',
        isUnread ? 'bg-sky-50/70 hover:bg-sky-50' : 'hover:bg-slate-50'
      )}
    >
      <button
        type="button"
        onClick={() => onOpen(notification)}
        className="flex flex-1 items-start gap-3 text-left"
      >
        <Circle
          className={cn(
            'mt-1.5 h-2 w-2 flex-shrink-0',
            isUnread ? 'fill-sky-500 text-sky-500' : 'fill-slate-300 text-slate-300'
          )}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p
              className={cn(
                'truncate text-sm text-slate-900',
                isUnread ? 'font-semibold' : 'font-medium'
              )}
            >
              {notification.title}
            </p>
            <span className="flex-shrink-0 text-xs text-slate-400">
              {formatRelativeTime(notification.created_at)}
            </span>
          </div>
          {notification.body && (
            <p
              className={cn(
                'mt-1 text-sm text-slate-600',
                compact ? 'line-clamp-2' : 'line-clamp-3'
              )}
            >
              {notification.body}
            </p>
          )}
          {!compact && (
            <Badge variant="secondary" className="mt-2">
              {NOTIFICATION_CATEGORY_LABELS[notification.category] ?? notification.category}
            </Badge>
          )}
        </div>
      </button>

      {onArchive && (
        <Button
          variant="ghost"
          size="icon"
          aria-label="Archive notification"
          className="h-8 w-8 flex-shrink-0 self-center opacity-0 transition-opacity group-hover:opacity-100"
          onClick={() => onArchive(notification)}
        >
          <Archive className="h-4 w-4 text-slate-500" />
        </Button>
      )}
    </div>
  );
}
