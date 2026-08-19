/**
 * Email Announcements Page
 * Compose and review email-only announcements.
 */

import { useMemo, useState } from 'react';
import { Mail } from 'lucide-react';
import { toast } from 'sonner';

import { PageHeader } from '@/components/common';
import { getErrorMessage } from '@/lib/utils/error-handler';

import { useAnnouncements, useRetryAnnouncement } from '../hooks';
import { AnnouncementComposeCard } from '../components/announcement-compose-card';
import { AnnouncementsListCard } from '../components/announcements-list-card';
import { AnnouncementDetailDialog } from '../components/announcement-detail-dialog';
import { ANNOUNCEMENT_DELIVERY_METHODS } from '../types';

export default function AnnouncementsEmailPage() {
  const { data: announcements = [], isLoading } = useAnnouncements();
  const retryMutation = useRetryAnnouncement();
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);

  const emailAnnouncements = useMemo(
    () =>
      announcements.filter((item) => item.delivery_methods === ANNOUNCEMENT_DELIVERY_METHODS.EMAIL),
    [announcements]
  );

  const handleRetry = (publicId: string) => {
    setRetryingId(publicId);
    retryMutation.mutate(publicId, {
      onSuccess: () => toast.success('Failed announcement queued for retry'),
      onError: (error) => {
        toast.error(getErrorMessage(error, 'Failed to retry announcement'));
      },
      onSettled: () => setRetryingId(null),
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Email Announcements"
        description="Send rich email announcements to students, teachers, parents or specific classes."
        icon={Mail}
      />

      <AnnouncementComposeCard
        fixedMethod={ANNOUNCEMENT_DELIVERY_METHODS.EMAIL}
        title="Compose email"
        description="Write the subject, message and attachments for this email."
      />

      <AnnouncementsListCard
        title="Sent email announcements"
        description="The most recent email announcements for your school."
        items={emailAnnouncements}
        isLoading={isLoading}
        onView={setDetailId}
        onRetry={handleRetry}
        isRetrying={retryMutation.isPending}
        retryingId={retryingId}
      />

      <AnnouncementDetailDialog
        publicId={detailId}
        variant={ANNOUNCEMENT_DELIVERY_METHODS.EMAIL}
        onClose={() => setDetailId(null)}
      />
    </div>
  );
}
