/**
 * SMS Announcements Page
 * Compose and review SMS-only announcements.
 */

import { MessageSquare } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { PageHeader } from '@/components/common';
import { getErrorMessage } from '@/lib/utils/error-handler';

import { useRetryAnnouncement } from '../hooks';
import { AnnouncementComposeCard } from '../components/announcement-compose-card';
import { AnnouncementsListCard } from '../components/announcements-list-card';
import { ANNOUNCEMENT_DELIVERY_METHODS } from '../types';

export default function AnnouncementsSmsPage() {
  const navigate = useNavigate();
  const retryMutation = useRetryAnnouncement();
  const [retryingId, setRetryingId] = useState<string | null>(null);

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
        title="SMS Announcements"
        description="Send SMS announcements to students, teachers, parents or specific classes."
        icon={MessageSquare}
      />

      <AnnouncementComposeCard
        fixedMethod={ANNOUNCEMENT_DELIVERY_METHODS.SMS}
        title="Compose SMS"
        description="Fill in the event details used to build the SMS message."
      />

      <AnnouncementsListCard
        title="Sent SMS announcements"
        description="The most recent SMS announcements for your school."
        deliveryMethod={ANNOUNCEMENT_DELIVERY_METHODS.SMS}
        onView={(publicId) => navigate(`/announcements/${publicId}`)}
        onRetry={handleRetry}
        isRetrying={retryMutation.isPending}
        retryingId={retryingId}
      />
    </div>
  );
}
