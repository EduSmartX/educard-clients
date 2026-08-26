/**
 * Set Temporary Password Dialog
 * Used when a student has no verified email/phone and cannot use the OTP reset flow.
 */

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ErrorMessages, SuccessMessages } from '@/constants';
import { getErrorMessage } from '@/lib/utils/error-handler';
import { setStudentTemporaryPassword, fetchDefaultStudentPassword } from '../api/students-api';
import type { StudentListItem } from '../types';

interface SetTemporaryPasswordDialogProps {
  student: StudentListItem | null;
  onOpenChange: (open: boolean) => void;
}

export function SetTemporaryPasswordDialog({
  student,
  onOpenChange,
}: Readonly<SetTemporaryPasswordDialogProps>) {
  const open = !!student;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { data: defaultPassword } = useQuery({
    queryKey: ['default-student-password'],
    queryFn: fetchDefaultStudentPassword,
    enabled: open,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (!open) {
      setNewPassword('');
      setConfirmPassword('');
      setShowNewPassword(false);
      setShowConfirmPassword(false);
      return;
    }
    if (defaultPassword) {
      setNewPassword((prev) => prev || defaultPassword);
      setConfirmPassword((prev) => prev || defaultPassword);
    }
  }, [open, defaultPassword]);

  const isFormValid = newPassword.length > 0 && newPassword === confirmPassword;

  const handleSubmit = async () => {
    if (!student || !isFormValid) {
      return;
    }

    setIsSubmitting(true);
    try {
      await setStudentTemporaryPassword(student.class_id, student.public_id, {
        new_password: newPassword,
        confirm_password: confirmPassword,
      });
      toast.success(SuccessMessages.STUDENT.TEMP_PASSWORD_SET);
      onOpenChange(false);
    } catch (error) {
      toast.error(getErrorMessage(error, ErrorMessages.STUDENT.SET_TEMP_PASSWORD_FAILED));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Set Temporary Password</DialogTitle>
          <DialogDescription>
            Set a temporary password for {student?.full_name}. Use this when the student has no
            verified email or mobile number to receive a reset OTP.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="temp-password">
              New Password <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Input
                id="temp-password"
                type={showNewPassword ? 'text' : 'password'}
                placeholder="Enter temporary password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute top-0 right-0 h-full px-3"
                onClick={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="temp-password-confirm">
              Confirm Password <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Input
                id="temp-password-confirm"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Re-enter temporary password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute top-0 right-0 h-full px-3"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            {confirmPassword.length > 0 && newPassword !== confirmPassword && (
              <p className="text-xs text-red-500">Passwords do not match.</p>
            )}
          </div>

          <Alert>
            <AlertDescription className="text-xs">
              The student must change this password at next login. Share it securely.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!isFormValid || isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Set Password
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
