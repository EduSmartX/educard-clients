import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AttendanceUiText } from '@/constants';

interface AttendanceComingSoonCardProps {
  title: string;
}

export function AttendanceComingSoonCard({ title }: AttendanceComingSoonCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{AttendanceUiText.COMING_SOON}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">{AttendanceUiText.FEATURE_IN_PROGRESS}</p>
      </CardContent>
    </Card>
  );
}
