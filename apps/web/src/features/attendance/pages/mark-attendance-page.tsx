import { MarkAttendanceForm } from '../components/mark-attendance-form';
import { PageHeader } from '@/components/common';
import { AttendanceUiText } from '@/constants';

export function MarkAttendancePage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <PageHeader
        title={AttendanceUiText.MARK_ATTENDANCE}
        description="Mark student attendance for a class"
      />

      <MarkAttendanceForm />
    </div>
  );
}
