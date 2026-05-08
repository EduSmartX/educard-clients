/**
 * StudentAvatar Component
 * Reusable avatar component for displaying student photos
 * Used across: Marks entry, Attendance marking, etc.
 * 
 * Features:
 * - LRU cache for images (memory efficient)
 * - Gender-based avatar fallback (same as Student List)
 * - Automatic cache invalidation on updates
 * - Consistent font with the rest of the app (Inter)
 */

import { useEffect, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getCachedImageUrl } from '@/lib/utils/image-cache';
import { getMediaUrl } from '@/lib/utils/media-utils';
import avatarMale from '@/assets/avatars/avatar-male.svg';
import avatarFemale from '@/assets/avatars/avatar-female.svg';
import avatarDefault from '@/assets/avatars/avatar-default.svg';

interface StudentAvatarProps {
  name: string;
  photoUrl?: string | null;
  gender?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-12 w-12',
  xl: 'h-16 w-16',
};

const textSizeClasses = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
  xl: 'text-lg',
};

function getGenderAvatar(gender?: string | null): string {
  switch (gender?.toLowerCase()) {
    case 'male':
    case 'm':
      return avatarMale;
    case 'female':
    case 'f':
      return avatarFemale;
    default:
      return avatarDefault;
  }
}

export function StudentAvatar({ name, photoUrl, gender, size = 'md', className = '' }: StudentAvatarProps) {
  const [cachedUrl, setCachedUrl] = useState<string | null>(null);

  // Resolve URL (handles relative paths from backend)
  const resolvedUrl = getMediaUrl(photoUrl);
  const fallbackAvatar = getGenderAvatar(gender);

  // Generate initials from name
  const getInitials = (fullName: string): string => {
    const nameParts = fullName.trim().split(' ');
    if (nameParts.length >= 2) {
      return `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase();
    }
    return fullName.slice(0, 2).toUpperCase();
  };

  // Load and cache image
  useEffect(() => {
    let isMounted = true;

    async function loadImage() {
      if (!resolvedUrl) {
        setCachedUrl(null);
        return;
      }

      try {
        const url = await getCachedImageUrl(resolvedUrl);
        if (isMounted) {
          setCachedUrl(url);
        }
      } catch {
        if (isMounted) {
          setCachedUrl(resolvedUrl); // Fallback to original URL
        }
      }
    }

    loadImage();

    return () => {
      isMounted = false;
    };
  }, [resolvedUrl]);

  // Use cached URL if available, otherwise resolved URL
  const displayUrl = cachedUrl || resolvedUrl;

  return (
    <Avatar className={`${sizeClasses[size]} ${className}`}>
      {displayUrl ? (
        <AvatarImage 
          src={displayUrl} 
          alt={name}
          className="object-cover"
        />
      ) : (
        <AvatarImage 
          src={fallbackAvatar} 
          alt={`${gender || 'default'} avatar`}
          className="object-contain p-1"
        />
      )}
      <AvatarFallback className={`bg-brand-100 text-brand-700 font-semibold font-sans ${textSizeClasses[size]}`}>
        {getInitials(name)}
      </AvatarFallback>
    </Avatar>
  );
}
