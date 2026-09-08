import { ROUTES } from '@/constants';
import type { UserNotification } from '@educard/shared';

/**
 * Map a notification to an in-app path.
 *
 * The notification only carries identifiers; the destination page still fetches
 * the resource through its own authorized endpoint, so a notification never
 * grants access to something the user cannot otherwise read.
 */
export function resolveNotificationPath(
  notification: UserNotification,
  role?: string
): string | null {
  const { resource_type, resource_public_id } = notification;
  if (!resource_public_id) {
    return null;
  }

  if (resource_type === 'announcement') {
    return role === 'student' || role === 'parent'
      ? `${ROUTES.STUDENT.ANNOUNCEMENTS}/${resource_public_id}`
      : `/announcements/${resource_public_id}`;
  }

  return null;
}
