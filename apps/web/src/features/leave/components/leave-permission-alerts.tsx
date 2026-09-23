import { Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface TeacherContext {
  can_manage_balances: boolean;
  is_supervisor: boolean;
  is_class_teacher: boolean;
  subordinate_count: number;
  student_count: number;
  class_teacher_for: unknown[];
}

export function LeavePermissionAlerts({
  isAdmin,
  isLoadingContext,
  teacherContext,
}: Readonly<{
  isAdmin: boolean;
  isLoadingContext: boolean;
  teacherContext: TeacherContext | undefined;
}>) {
  if (isAdmin || isLoadingContext || !teacherContext) {
    return null;
  }

  if (!teacherContext.can_manage_balances) {
    return (
      <Alert className="border-blue-200 bg-blue-50">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-900">
          <div className="space-y-2">
            <p className="font-medium">No access to manage leave balances</p>
            <p className="text-sm">You can manage leave balances when you:</p>
            <ul className="ml-2 list-inside list-disc space-y-1 text-sm">
              <li>Are assigned as a supervisor for staff members, or</li>
              <li>Are designated as a class teacher for one or more classes</li>
            </ul>
            <p className="mt-2 text-sm">
              Please contact your administrator if you believe you should have access to this
              feature.
            </p>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert className="border-green-200 bg-green-50">
      <Info className="h-4 w-4 text-green-600" />
      <AlertDescription className="text-green-900">
        <div className="space-y-1">
          <p className="font-medium">Your Management Permissions:</p>
          <ul className="space-y-0.5 text-sm">
            {!!teacherContext.is_supervisor && (
              <li>
                ✓ You can manage leave balances for {teacherContext.subordinate_count} staff
                member(s)
              </li>
            )}
            {!!teacherContext.is_class_teacher && (
              <li>
                ✓ You can manage leave balances for {teacherContext.student_count} student(s) across{' '}
                {teacherContext.class_teacher_for.length} class(es)
              </li>
            )}
          </ul>
        </div>
      </AlertDescription>
    </Alert>
  );
}
