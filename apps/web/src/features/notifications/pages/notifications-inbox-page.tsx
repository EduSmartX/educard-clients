import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, Settings2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  NOTIFICATION_CATEGORY_LABELS,
  type NotificationCategory,
  type UserNotification,
} from '@educard/shared';
import { PageHeader } from '@/components/common/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Pagination } from '@/components/ui/pagination';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ROUTES } from '@/constants';
import { useAuth } from '@/hooks/use-auth';
import { getErrorMessage } from '@/lib/utils/error-handler';
import { NotificationItem } from '../components/notification-item';
import {
  useArchiveNotification,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotificationInbox,
} from '../hooks/use-notifications';
import { resolveNotificationPath } from '../utils/notification-routes';

const PAGE_SIZE = 20;
const ALL_CATEGORIES = 'all';

export default function NotificationsInboxPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [category, setCategory] = useState<string>(ALL_CATEGORIES);

  const { data, isLoading, isError } = useNotificationInbox({
    page,
    page_size: PAGE_SIZE,
    ...(unreadOnly ? { unread: true } : {}),
    ...(category === ALL_CATEGORIES ? {} : { category: category as NotificationCategory }),
  });

  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const archive = useArchiveNotification();

  const notifications = data?.data ?? [];
  const pagination = data?.pagination;

  const handleOpen = (notification: UserNotification) => {
    if (!notification.is_read) {
      markRead.mutate(notification.public_id);
    }
    const path = resolveNotificationPath(notification, user?.role);
    if (path) {
      navigate(path);
    }
  };

  const handleArchive = (notification: UserNotification) => {
    archive.mutate(notification.public_id, {
      onError: (error) => toast.error(getErrorMessage(error, 'Failed to archive')),
    });
  };

  const resetToFirstPage = (apply: () => void) => {
    apply();
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description="Everything addressed to you, newest first."
        icon={Bell}
        actions={[
          {
            label: 'Mark all read',
            icon: CheckCheck,
            variant: 'outline',
            disabled: markAllRead.isPending,
            onClick: () => markAllRead.mutate(),
          },
          {
            label: 'Settings',
            icon: Settings2,
            variant: 'brand',
            onClick: () => navigate(ROUTES.NOTIFICATION_PREFERENCES),
          },
        ]}
      />

      <div className="flex flex-wrap items-center gap-3">
        <Tabs
          value={unreadOnly ? 'unread' : 'all'}
          onValueChange={(value) => resetToFirstPage(() => setUnreadOnly(value === 'unread'))}
        >
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="unread">Unread</TabsTrigger>
          </TabsList>
        </Tabs>

        <select
          aria-label="Filter by category"
          value={category}
          onChange={(event) => resetToFirstPage(() => setCategory(event.target.value))}
          className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:ring-2 focus:ring-sky-200 focus:outline-none"
        >
          <option value={ALL_CATEGORIES}>All categories</option>
          {Object.entries(NOTIFICATION_CATEGORY_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <Card>
        <CardContent className="p-2">
          {isLoading && (
            <div className="space-y-2 p-2">
              {['a', 'b', 'c', 'd', 'e'].map((key) => (
                <Skeleton key={key} className="h-20 w-full rounded-xl" />
              ))}
            </div>
          )}

          {isError && (
            <p className="px-4 py-10 text-center text-sm text-rose-600">
              We could not load your notifications. Please try again.
            </p>
          )}

          {!isLoading && !isError && notifications.length === 0 && (
            <div className="flex flex-col items-center gap-2 px-4 py-16 text-center">
              <Bell className="h-10 w-10 text-slate-300" />
              <p className="text-sm font-medium text-slate-700">Nothing here yet</p>
              <p className="text-xs text-slate-500">
                {unreadOnly
                  ? 'You have read everything in this view.'
                  : 'New notifications will appear here.'}
              </p>
            </div>
          )}

          {!isLoading &&
            !isError &&
            notifications.map((notification) => (
              <NotificationItem
                key={notification.public_id}
                notification={notification}
                onOpen={handleOpen}
                onArchive={handleArchive}
              />
            ))}
        </CardContent>
      </Card>

      {pagination && pagination.total_pages > 1 && (
        <Pagination
          currentPage={pagination.current_page}
          totalPages={pagination.total_pages}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
