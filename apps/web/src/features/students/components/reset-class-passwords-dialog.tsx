/**
 * Reset Class Passwords Dialog
 */

import { useState } from 'react';
import { KeyRound, Eye, EyeOff, Loader2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useCriticalOperation } from '@/providers/critical-operation-provider';
import { useManagedClasses } from '../hooks/use-managed-classes';
import { resetClassPasswords } from '../api/students-api';

async function extractErrorMessage(error: unknown, fallback: string): Promise<string> {
  const maybeBlob = (error as { response?: { data?: unknown } })?.response?.data;
  if (maybeBlob instanceof Blob && maybeBlob.type.includes('json')) {
    try {
      const text = await maybeBlob.text();
      const parsed = JSON.parse(text) as { message?: string };
      if (parsed.message) {
        return parsed.message;
      }
    } catch {
      // Fall through to generic message below.
    }
  }
  return error instanceof Error ? error.message : fallback;
}

interface ResetClassPasswordsDialogProps {
  /** Trigger button variant */
  triggerVariant?: 'default' | 'outline' | 'ghost';
  triggerDisabled?: boolean;
}

export function ResetClassPasswordsDialog({
  triggerVariant = 'outline',
  triggerDisabled = false,
}: Readonly<ResetClassPasswordsDialogProps>) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [classId, setClassId] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { data: managedClasses = [] } = useManagedClasses();
  const { beginCriticalOperation, endCriticalOperation } = useCriticalOperation();

  const classOptions = managedClasses.map((cls) => ({
    value: cls.public_id,
    label: `${cls.class_master?.name ?? ''} - ${cls.name}`,
  }));

  const resetForm = () => {
    setClassId('');
    setNewPassword('');
    setConfirmPassword('');
    setShowNewPassword(false);
    setShowConfirmPassword(false);
  };

  const isFormValid =
    classId.length > 0 && newPassword.length > 0 && newPassword === confirmPassword;

  const handleSubmit = async () => {
    if (!classId) {
      toast.error('Please select a class.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    beginCriticalOperation({
      title: 'Resetting class passwords',
      description: 'Please keep this page open until the credential file finishes downloading.',
    });

    try {
      const { blob, filename } = await resetClassPasswords(classId, {
        new_password: newPassword,
        confirm_password: confirmPassword,
      });

      // Trigger browser download
      const url = globalThis.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      globalThis.URL.revokeObjectURL(url);

      toast.success('Passwords reset. Credentials file downloaded.');
      setOpen(false);
      resetForm();
    } catch (error) {
      const message = await extractErrorMessage(
        error,
        'Failed to reset passwords. Please try again.'
      );
      toast.error(message);
    } finally {
      setIsSubmitting(false);
      endCriticalOperation();
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) {
          resetForm();
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant={triggerVariant} className="gap-2" disabled={triggerDisabled}>
          <KeyRound className="h-4 w-4" />
          Reset Passwords
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Reset Class Passwords</DialogTitle>
          <DialogDescription>
            Set a new password for active students in the selected class who haven't set their own
            password yet, then download an Excel file with their login credentials to share.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Class Select */}
          <div className="space-y-2">
            <Label>
              Class <span className="text-red-500">*</span>
            </Label>
            <Select value={classId} onValueChange={setClassId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a class" />
              </SelectTrigger>
              <SelectContent>
                {classOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-muted-foreground text-xs">
              As a class teacher, only the class(es) you manage are listed here. Admins see all
              classes.
            </p>
          </div>

          {/* New Password */}
          <div className="space-y-2">
            <Label>
              New Password <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Input
                type={showNewPassword ? 'text' : 'password'}
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute top-0 right-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <Label>
              Confirm Password <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Input
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute top-0 right-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            {confirmPassword.length > 0 && newPassword !== confirmPassword && (
              <p className="text-xs text-red-500">Passwords do not match.</p>
            )}
          </div>

          <Alert variant="warning">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              This immediately sets the password for active students in this class who haven't set
              their own password yet, and still requires them to change it on next login. Students
              who already set their own password are not affected. The downloaded file contains
              plaintext passwords — share it securely.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !isFormValid} className="gap-2">
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <KeyRound className="h-4 w-4" />
            )}
            {isSubmitting ? 'Resetting...' : 'Reset & Download'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
