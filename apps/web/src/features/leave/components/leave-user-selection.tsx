import { User, Users } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Combobox } from '@/components/ui/combobox';
import { cn } from '@/lib/utils';
import { FormPlaceholders } from '@/constants';
import type { ClassData } from '../utils/leave-data-parsers';

interface UserOption {
  label: string;
  value: string;
  description?: string;
}

interface ClassOption {
  label: string;
  value: string;
}

function getPlaceholder(userRole: string, selectedClass: string): string {
  if (userRole === 'staff') {
    return 'Select a staff member';
  }
  if (selectedClass) {
    return 'Select a student';
  }
  return 'First select a class';
}

interface LeaveUserSelectionProps {
  isAdmin: boolean;
  teacherContext: { is_supervisor: boolean; is_class_teacher: boolean } | undefined;
  userRole: 'staff' | 'student';
  setUserRole: (role: 'staff' | 'student') => void;
  selectedUser: string;
  setSelectedUser: (value: string) => void;
  selectedClass: string;
  setSelectedClass: (value: string) => void;
  classes: ClassData[];
  isLoadingClasses: boolean;
  userOptions: UserOption[];
  userSelectDisabled: boolean;
}

export function LeaveUserSelection({
  isAdmin,
  teacherContext,
  userRole,
  setUserRole,
  selectedUser,
  setSelectedUser,
  selectedClass,
  setSelectedClass,
  classes,
  isLoadingClasses,
  userOptions,
  userSelectDisabled,
}: Readonly<LeaveUserSelectionProps>) {
  const classOptions: ClassOption[] = classes.map((cls) => ({
    label: `${cls.class_master.name} (${cls.name})`,
    value: cls.public_id,
  }));

  return (
    <>
      <div className="flex gap-2">
        <Button
          variant={userRole === 'staff' ? 'default' : 'outline'}
          onClick={() => setUserRole('staff')}
          className={cn(
            'flex-1',
            userRole === 'staff' && 'bg-blue-600 text-white shadow-md hover:bg-blue-700'
          )}
          disabled={!isAdmin && teacherContext && !teacherContext.is_supervisor}
        >
          <Users className="mr-2 h-4 w-4" />
          Staff
        </Button>
        <Button
          variant={userRole === 'student' ? 'default' : 'outline'}
          onClick={() => setUserRole('student')}
          className={cn(
            'flex-1',
            userRole === 'student' && 'bg-green-600 text-white shadow-md hover:bg-green-700'
          )}
          disabled={!isAdmin && teacherContext && !teacherContext.is_class_teacher}
        >
          <User className="mr-2 h-4 w-4" />
          Students
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Select User</CardTitle>
          <CardDescription>
            {userRole === 'staff'
              ? 'Choose a staff member to manage their leave balances'
              : 'Choose a student to manage their leave balances'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {userRole === 'student' && (
            <div className="space-y-2">
              <Label>Select Class</Label>
              <Combobox
                value={selectedClass}
                onValueChange={(value) => {
                  setSelectedClass(value);
                  setSelectedUser('');
                }}
                options={classOptions}
                placeholder={FormPlaceholders.SELECT_CLASS}
                emptyText="No classes found"
                searchPlaceholder={FormPlaceholders.SEARCH_CLASSES}
                disabled={isLoadingClasses}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>Select User</Label>
            <Combobox
              value={selectedUser}
              onValueChange={setSelectedUser}
              options={userOptions}
              placeholder={getPlaceholder(userRole, selectedClass)}
              emptyText={userRole === 'staff' ? 'No staff members found' : 'No students found'}
              searchPlaceholder={userRole === 'staff' ? 'Search staff...' : 'Search students...'}
              disabled={userSelectDisabled}
            />
          </div>
        </CardContent>
      </Card>
    </>
  );
}
