/**
 * Sync Profiles Form
 * Parent-initiated, OTP-verified linking of every active student account
 * that shares this student's login email (unlocks email-based profile switching).
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Send, Users } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { CommonUiText, FormPlaceholders } from '@/constants';
import { useUserProfile } from '../hooks/queries';
import { useRequestProfileSyncOtp, useVerifyProfileSync } from '../hooks/mutations';
import { syncProfilesSchema, type SyncProfilesFormData } from '../schemas/profile-schemas';
import { formatCountdown } from '../utils/format-countdown';

export function SyncProfilesForm() {
  const { data: profile } = useUserProfile();
  const requestOtpMutation = useRequestProfileSyncOtp();
  const verifyMutation = useVerifyProfileSync();
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const form = useForm<SyncProfilesFormData>({
    resolver: zodResolver(syncProfilesSchema),
    defaultValues: {
      otp: '',
      set_new_password: false,
      new_password: '',
      confirm_password: '',
    },
  });

  const setNewPassword = form.watch('set_new_password');

  const startCountdownTimer = (minutes: number) => {
    setCountdown(minutes * 60);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSendOTP = () => {
    requestOtpMutation.mutate(undefined, {
      onSuccess: (data) => {
        setOtpSent(true);
        startCountdownTimer(data.expires_in_minutes || 10);
      },
    });
  };

  const onSubmit = (values: SyncProfilesFormData) => {
    verifyMutation.mutate(
      {
        otp: values.otp,
        ...(values.set_new_password
          ? { new_password: values.new_password, confirm_password: values.confirm_password }
          : {}),
      },
      {
        onSuccess: (data) => {
          const count = data.linked_profiles_count;
          const profileWord = count === 1 ? 'profile' : 'profiles';
          toast.success(
            count > 0
              ? `Profiles synced! ${count} other student ${profileWord} linked to this email.`
              : data.message
          );
          form.reset();
          setOtpSent(false);
          setCountdown(0);
        },
      }
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-medium">Sync Student Profiles</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
          <p className="text-sm text-blue-900">
            <strong>Login Email:</strong> {profile?.email || 'Not set'}
          </p>
          <p className="mt-2 text-xs text-blue-700">
            If more than one student account shares this email address, verifying it here links all
            of them together - letting you switch between profiles without re-entering a password,
            using just this email going forward.
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="text-sm font-medium">Send verification code</p>
                <p className="text-muted-foreground text-xs">
                  {otpSent ? (
                    <span className="text-green-600">
                      Code sent! Expires in {formatCountdown(countdown)}
                    </span>
                  ) : (
                    'A code will be sent to your login email'
                  )}
                </p>
              </div>
              <Button
                type="button"
                onClick={handleSendOTP}
                disabled={otpSent || requestOtpMutation.isPending}
              >
                {requestOtpMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    {CommonUiText.SEND_OTP}
                  </>
                )}
              </Button>
            </div>

            {otpSent && (
              <>
                <FormField
                  control={form.control}
                  name="otp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        OTP Code <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          placeholder={FormPlaceholders.ENTER_OTP_6_DIGIT}
                          maxLength={6}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>Enter the code sent to your login email</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="set_new_password"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel>Set a new shared password</FormLabel>
                        <FormDescription>
                          Optionally set one password to use for every linked profile
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {setNewPassword && (
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="new_password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            New Password <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder={FormPlaceholders.ENTER_NEW_PASSWORD}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="confirm_password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Confirm New Password <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder={FormPlaceholders.REENTER_NEW_PASSWORD}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </>
            )}

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="brandOutline"
                onClick={() => {
                  form.reset();
                  setOtpSent(false);
                  setCountdown(0);
                }}
                disabled={verifyMutation.isPending}
              >
                {CommonUiText.RESET}
              </Button>
              <Button type="submit" variant="brand" disabled={!otpSent || verifyMutation.isPending}>
                {!!verifyMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Users className="mr-2 h-4 w-4" />
                Sync Profiles
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
