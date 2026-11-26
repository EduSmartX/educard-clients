/**
 * A rendered ID card side, exactly as it will print. The PNG comes from an
 * auth-protected API path, so it is fetched as a blob rather than linked directly.
 */
import { IdCard } from 'lucide-react';
import type { CardOrientation } from '@educard/shared';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useCardPreview } from '../hooks/use-store';

interface CardPreviewProps {
  /** Server preview path, e.g. "/api/store/id-card-designs/<id>/preview/?side=front". */
  path: string | undefined;
  /** Render with this student's real details instead of sample data. */
  student?: string;
  orientation?: CardOrientation;
  alt: string;
  className?: string;
}

export function CardPreview({
  path,
  student,
  orientation = 'landscape',
  alt,
  className,
}: CardPreviewProps) {
  const { url, isLoading, isError } = useCardPreview(path, student);
  const shape = orientation === 'portrait' ? 'aspect-[54/85.6] w-28' : 'aspect-[85.6/54] w-full';

  if (!path || isError) {
    return (
      <div
        className={cn(
          'bg-muted text-muted-foreground flex items-center justify-center rounded-lg',
          shape,
          className
        )}
      >
        <IdCard className="h-8 w-8" aria-hidden />
      </div>
    );
  }
  if (isLoading || !url) {
    return <Skeleton className={cn('rounded-lg', shape, className)} />;
  }
  return (
    <img
      src={url}
      alt={alt}
      className={cn('rounded-lg border object-contain shadow-sm', shape, className)}
    />
  );
}
