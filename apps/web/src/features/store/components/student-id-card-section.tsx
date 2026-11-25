/**
 * The student's ID card as it will print, rendered live from the school's approved design and
 * this student's own details. Only the school admin and the student's class teacher can load
 * it; for anyone else (or while no design is approved) the section stays out of the way.
 */
import { IdCard } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { COMPANY_NAME } from '@/constants/app-config';
import { CardSidesCarousel } from './card-sides-carousel';
import { useStudentCard } from '../hooks/use-store';

export function StudentIdCardSection({ studentId }: { studentId: string }) {
  const { data, isLoading, isError } = useStudentCard(studentId);
  const card = data?.data;

  if (isError) {
    return null;
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <IdCard className="h-5 w-5" aria-hidden />
          ID card preview
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-48 w-full max-w-md" />
        ) : card?.available && card.front_preview_url ? (
          <div className="max-w-md space-y-2">
            <CardSidesCarousel
              frontPath={card.front_preview_url}
              backPath={card.back_preview_url}
              orientation={card.orientation}
              alt="ID card"
            />
            <p className="text-muted-foreground text-xs">
              Design: {card.design_name}. Filled in from this student’s profile, so fix the profile
              (name, photo, class, …) to change the card.
            </p>
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">
            No ID card design is approved for this student’s class yet. Choose or send one under
            Store setup, and {COMPANY_NAME} will approve it.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
