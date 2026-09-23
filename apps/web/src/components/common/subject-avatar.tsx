/**
 * SubjectAvatar Component
 * Reusable circular subject badge used wherever a subject is shown.
 *
 * Renders the subject illustration (resolved by master code or name) when one
 * exists, otherwise falls back to a themed gradient badge with a Lucide icon.
 * Reuse across student/parent/teacher/admin by passing the subject name and/or code.
 */

import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { getSubjectTheme } from '@/lib/subject-theme';
import { getSubjectImageUrl } from '@/lib/subject-image';

export type SubjectAvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface SubjectAvatarProps {
  /** Subject display name, e.g. "Mathematics". Used for image + fallback resolution. */
  name?: string | null;
  /** Subject master code, e.g. "MATH". Preferred over name when provided. */
  code?: string | null;
  size?: SubjectAvatarSize;
  className?: string;
  /** Show an enlarged image preview on hover (only when an illustration exists). */
  preview?: boolean;
}

const sizeClasses: Record<SubjectAvatarSize, string> = {
  xs: 'h-9 w-9',
  sm: 'h-10 w-10',
  md: 'h-12 w-12',
  lg: 'h-14 w-14',
  xl: 'h-16 w-16',
};

const iconSizeClasses: Record<SubjectAvatarSize, string> = {
  xs: 'h-4 w-4',
  sm: 'h-5 w-5',
  md: 'h-6 w-6',
  lg: 'h-7 w-7',
  xl: 'h-8 w-8',
};

export function SubjectAvatar({
  name,
  code,
  size = 'md',
  className,
  preview = true,
}: Readonly<SubjectAvatarProps>) {
  const imageUrl = getSubjectImageUrl(name, code);

  if (imageUrl) {
    const badge = (
      <div
        className={cn(
          'shrink-0 overflow-hidden rounded-full bg-white ring-1 ring-black/5',
          preview && 'cursor-zoom-in transition-transform hover:scale-105',
          sizeClasses[size],
          className
        )}
      >
        <img
          src={imageUrl}
          alt={name ?? 'Subject'}
          loading="lazy"
          className="h-full w-full object-cover"
        />
      </div>
    );

    if (!preview) {
      return badge;
    }

    return (
      <TooltipProvider delayDuration={150}>
        <Tooltip>
          <TooltipTrigger asChild>{badge}</TooltipTrigger>
          <TooltipContent
            side="top"
            className="border border-gray-200 bg-white p-3 text-gray-900 shadow-xl"
          >
            <div className="flex flex-col items-center gap-2">
              <img
                src={imageUrl}
                alt={name ?? 'Subject'}
                className="h-44 w-44 rounded-2xl object-contain"
              />
              {name ? <span className="text-sm font-semibold">{name}</span> : null}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  const theme = getSubjectTheme(name);
  const Icon = theme.icon;

  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br shadow-sm',
        theme.color,
        sizeClasses[size],
        className
      )}
    >
      <Icon className={cn(iconSizeClasses[size], 'text-white')} />
    </div>
  );
}
