import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, Settings2 } from 'lucide-react';
import { NOTIFICATION_BADGE_MAX, type UserNotification } from '@educard/shared';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { ROUTES } from '@/constants';
import { cn } from '@/lib/utils';
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotificationInbox,
  useUnreadNotificationCount,
} from '../hooks/use-notifications';
import { useWebPush } from '../hooks/use-web-push';
import { resolveNotificationPath } from '../utils/notification-routes';
import { NotificationItem } from './notification-item';

const RECENT_PAGE_SIZE = 6;

interface NotificationBellProps {
  userRole?: string;
  badgeRingClassName?: string;
}

export function NotificationBell({
  userRole,
  badgeRingClassName,
}: Readonly<NotificationBellProps>) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const { pushEnabled } = useWebPush();
  const { data: countData } = useUnreadNotificationCount({ poll: !pushEnabled });
  const unreadCount = countData?.data?.unread_count ?? 0;
  // Recent items are only fetched while the popover is open.
  const { data: inboxData, isLoading } = useNotificationInbox(
    open ? { page_size: RECENT_PAGE_SIZE } : {}
  );
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const notifications = open ? (inboxData?.data ?? []) : [];

  const handleOpen = (notification: UserNotification) => {
    if (!notification.is_read) {
      markRead.mutate(notification.public_id);
    }
    setOpen(false);
    const path = resolveNotificationPath(notification, userRole);
    navigate(path ?? ROUTES.NOTIFICATIONS);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
          className="relative h-11 w-11 rounded-xl text-white/90 transition-colors hover:bg-white/15 hover:text-white"
        >
          <Bell className="h-5 w-5" strokeWidth={2} />
          {unreadCount > 0 && (
            <span
              className={cn(
                'absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-gradient-to-r from-rose-500 to-pink-500 px-1 text-[10px] font-bold text-white shadow-lg ring-2',
                badgeRingClassName
              )}
            >
              {unreadCount > NOTIFICATION_BADGE_MAX ? `${NOTIFICATION_BADGE_MAX}+` : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-96 p-0">
        <div className="flex items-center justify-between px-4 py-3">
          <p className="text-sm font-semibold text-slate-900">Notifications</p>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Mark all as read"
              className="h-8 w-8"
              disabled={unreadCount === 0 || markAllRead.isPending}
              onClick={() => markAllRead.mutate()}
            >
              <CheckCheck className="h-4 w-4 text-slate-500" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Notification settings"
              className="h-8 w-8"
              onClick={() => {
                setOpen(false);
                navigate(ROUTES.NOTIFICATION_PREFERENCES);
              }}
            >
              <Settings2 className="h-4 w-4 text-slate-500" />
            </Button>
          </div>
        </div>

        <Separator />

        <div className="max-h-96 overflow-y-auto p-2">
          {isLoading && (
            <div className="space-y-2 p-2">
              {['a', 'b', 'c'].map((key) => (
                <Skeleton key={key} className="h-16 w-full rounded-xl" />
              ))}
            </div>
          )}

          {!isLoading && notifications.length === 0 && (
            <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
              <Bell className="h-8 w-8 text-slate-300" />
              <p className="text-sm font-medium text-slate-700">You are all caught up</p>
              <p className="text-xs text-slate-500">New notifications will appear here.</p>
            </div>
          )}

          {!isLoading &&
            notifications.map((notification) => (
              <NotificationItem
                key={notification.public_id}
                notification={notification}
                onOpen={handleOpen}
                compact
              />
            ))}
        </div>

        <Separator />

        <div className="p-2">
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => {
              setOpen(false);
              navigate(ROUTES.NOTIFICATIONS);
            }}
          >
            View all notifications
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
