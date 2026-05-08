/**
 * User Avatar Component
 * Displays profile photo thumbnail with gender-based fallback avatars.
 * Click to smoothly zoom the circular avatar into a larger circle (motion effect).
 * Uses getMediaUrl() to resolve backend paths to full URLs.
 * Uses LRU cache for efficient image loading.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getMediaUrl } from '@/lib/utils/media-utils';
import { getCachedImageUrl } from '@/lib/utils/image-cache';
import avatarMale from '@/assets/avatars/avatar-male.svg';
import avatarFemale from '@/assets/avatars/avatar-female.svg';
import avatarDefault from '@/assets/avatars/avatar-default.svg';
import { cn } from '@/lib/utils';

interface UserAvatarProps {
  /** Thumbnail URL from backend (relative or absolute) */
  thumbnailUrl?: string | null;
  /** Gender for fallback avatar: "male", "female", or other */
  gender?: string | null;
  /** Full name — first letter used as text fallback */
  name?: string;
  /** Size class override (default: h-9 w-9) */
  className?: string;
  /** Disable click-to-enlarge (default: false) */
  disablePopup?: boolean;
}

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

/** Expanded size of the zoomed circle in pixels */
const EXPANDED_SIZE = 200;

export function UserAvatar({
  thumbnailUrl,
  gender,
  name,
  className,
  disablePopup = false,
}: UserAvatarProps) {
  const [expanded, setExpanded] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [cachedUrl, setCachedUrl] = useState<string | null>(null);
  const avatarRef = useRef<HTMLSpanElement>(null);

  const resolvedUrl = getMediaUrl(thumbnailUrl);
  const fallbackAvatar = getGenderAvatar(gender);
  const initial = name?.charAt(0)?.toUpperCase() || '?';
  const hasPhoto = !!resolvedUrl;

  // Load and cache image with LRU
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
          setCachedUrl(resolvedUrl); // Fallback to original
        }
      }
    }

    loadImage();

    return () => {
      isMounted = false;
    };
  }, [resolvedUrl]);

  const open = useCallback(() => {
    if (!avatarRef.current) {
      return;
    }
    setRect(avatarRef.current.getBoundingClientRect());
    setExpanded(true);
    // Trigger CSS transition on next frame
    requestAnimationFrame(() => setAnimating(true));
  }, []);

  const close = useCallback(() => {
    setAnimating(false);
    // Wait for the shrink transition to finish before unmounting
    setTimeout(() => setExpanded(false), 300);
  }, []);

  // Close on Escape key
  useEffect(() => {
    if (!expanded) {
      return;
    }
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        close();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [expanded, close]);

  // Use cached URL if available, otherwise resolved or fallback
  const displayUrl = cachedUrl || resolvedUrl;

  return (
    <>
      <Avatar
        ref={avatarRef}
        className={cn('h-9 w-9', hasPhoto && !disablePopup && 'cursor-pointer', className)}
        onClick={(e) => {
          if (hasPhoto && !disablePopup) {
            e.stopPropagation();
            open();
          }
        }}
      >
        {displayUrl ? (
          <AvatarImage src={displayUrl} alt={name || 'User'} className="object-cover" />
        ) : (
          <AvatarImage src={fallbackAvatar} alt={`${gender || 'default'} avatar`} />
        )}
        <AvatarFallback className="text-xs font-semibold">{initial}</AvatarFallback>
      </Avatar>

      {expanded &&
        rect &&
        createPortal(
          <>
            {/* Transparent backdrop — click to close */}
            <div className="fixed inset-0 z-[9998]" onClick={close} />
            {/* Expanding circle — stays in place, just grows */}
            <div
              onClick={close}
              className="fixed z-[9999] cursor-pointer overflow-hidden rounded-full shadow-xl ring-4 ring-white/80"
              style={{
                top: animating
                  ? `${rect.top - (EXPANDED_SIZE - rect.height) / 2}px`
                  : `${rect.top}px`,
                left: animating
                  ? `${rect.left - (EXPANDED_SIZE - rect.width) / 2}px`
                  : `${rect.left}px`,
                width: animating ? `${EXPANDED_SIZE}px` : `${rect.width}px`,
                height: animating ? `${EXPANDED_SIZE}px` : `${rect.height}px`,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              <img
                src={displayUrl || ''}
                alt={name || 'Profile photo'}
                className="h-full w-full object-cover"
              />
            </div>
          </>,
          document.body
        )}
    </>
  );
}
