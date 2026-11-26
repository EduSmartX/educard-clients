/**
 * A student's ID card for review: both sides as they will print, the design used, and any
 * details the design prints that are still empty for this student. The card is rendered
 * by the server from the student's profile, so fixing the profile fixes the card.
 */
import { CheckCircle2, IdCard } from 'lucide-react';
import type { StudentCard } from '@educard/shared';
import { InfoPoints } from '@/components/common';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { COMPANY_NAME } from '@/constants/app-config';
import { cn } from '@/lib/utils';
import { CardPreview } from './card-preview';

interface StudentCardReviewPanelProps {
  card: StudentCard | undefined;
  isLoading: boolean;
  isError: boolean;
  className?: string;
}

export function StudentCardReviewPanel({
  card,
  isLoading,
  isError,
  className,
}: StudentCardReviewPanelProps) {
  const portrait = card?.orientation === 'portrait';
  const sides = card?.available
    ? [
        { label: 'Front', path: card.front_preview_url },
        ...(card.back_preview_url ? [{ label: 'Back', path: card.back_preview_url }] : []),
      ]
    : [];
  const missing = card?.missing_fields ?? [];

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <IdCard className="h-5 w-5" aria-hidden />
          ID card preview
        </CardTitle>
        {card?.available && card.design_name && (
          <p className="text-muted-foreground text-xs">Design: {card.design_name}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading && <Skeleton className="aspect-[85.6/54] w-full rounded-lg" />}

        {!isLoading && isError && (
          <p className="text-muted-foreground text-sm">
            This card could not be loaded. Only the school admin and the class teacher can see a
            student’s ID card.
          </p>
        )}

        {!isLoading && !isError && !card?.available && (
          <p className="text-muted-foreground text-sm">
            No ID card design is approved for this class yet. Choose or send one under Store setup,
            and {COMPANY_NAME} will approve it.
          </p>
        )}

        {!isLoading &&
          !isError &&
          card?.available &&
          sides.map((side) => (
            <div key={side.label} className="space-y-1.5">
              <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                {side.label}
              </p>
              <div
                className={cn('bg-muted/50 flex justify-center rounded-lg p-3', portrait && 'py-4')}
              >
                <CardPreview
                  path={side.path}
                  orientation={card.orientation}
                  alt={`ID card ${side.label.toLowerCase()}`}
                  className={portrait ? 'w-full max-w-[220px]' : undefined}
                />
              </div>
            </div>
          ))}

        {!isLoading && !isError && card?.available && (
          <>
            {/* Missing details are listed above the student's details (MissingCardFields). */}
            {missing.length === 0 && (
              <div className="flex gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                <p>Every detail this design prints is filled in.</p>
              </div>
            )}
            <InfoPoints
              tone="muted"
              items={[
                'Check the spelling, photo and class.',
                'The card is filled in from the student’s profile: correct the profile to correct the card.',
              ]}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}
