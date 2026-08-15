/**
 * GreetingAvatar — the signed-in user's photo for dashboard greeting banners.
 * Clicking enlarges it to the full-size original rather than the thumbnail.
 */

import { UserAvatar } from './user-avatar';
import { useMyProfilePhoto } from '@/features/profile';
import { cn } from '@/lib/utils';

interface GreetingAvatarProps {
  name?: string;
  gender?: string | null;
  className?: string;
}

export function GreetingAvatar({ name, gender, className }: GreetingAvatarProps) {
  const { data: profilePhoto } = useMyProfilePhoto();

  return (
    <UserAvatar
      thumbnailUrl={profilePhoto?.thumbnail_url}
      fullUrl={profilePhoto?.url}
      gender={gender}
      name={name}
      className={cn(
        'h-14 w-14 shrink-0 border-2 border-white/70 shadow-lg ring-2 ring-white/25 sm:h-20 sm:w-20',
        className
      )}
    />
  );
}
