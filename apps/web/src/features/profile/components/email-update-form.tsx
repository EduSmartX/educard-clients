/**
 * Email Update Form
 * Update email with OTP verification
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Mail, Send } from 'lucide-react';
import { z } from 'zod';
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
import { CommonUiText, FormPlaceholders } from '@/constants';
import { useUserProfile } from '../hooks/queries';
import { useSendOTP, useUpdateEmail } from '../hooks/mutations';

const emailSchema = z.object({
  new_email: z.string().email('Invalid email address'),
  otp: z.string().min(6, 'OTP must be 6 digits').max(6),
});

type EmailFormValues = z.infer<typeof emailSchema>;

export function EmailUpdateForm() {
  const { data: profile } = useUserProfile();
  const sendOTPMutation = useSendOTP();
  const updateEmailMutation = useUpdateEmail();
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const form = useForm<EmailFormValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      new_email: '',
      otp: '',
    },
  });

  const handleSendOTP = () => {
    const email = form.getValues('new_email');
    if (!email || !z.string().email().safeParse(email).success) {
      form.setError('new_email', { message: 'Please enter a valid email address' });
      return;
    }

    sendOTPMutation.mutate(
      { email, purpose: 'EMAIL_VERIFICATION' },
      {
        onSuccess: (data) => {
          setOtpSent(true);
          const expiresIn = data.data?.expires_in_minutes || 5;
          setCountdown(expiresIn * 60);

          const timer = setInterval(() => {
            setCountdown((prev) => {
              if (prev <= 1) {
                clearInterval(timer);
                return 0;
              }
              return prev - 1;
            });
          }, 1000);
        },
      }
    );
  };

  const onSubmit = (values: EmailFormValues) => {
    updateEmailMutation.mutate(values, {
      onSuccess: () => {
        form.reset();
        setOtpSent(false);
        setCountdown(0);
      },
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-medium">Update Email Address</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
          <p className="text-sm text-blue-900">
            <strong>Current Email:</strong> {profile?.email || 'Not set'}
          </p>
          <p className="mt-1 text-xs text-blue-700">
            Email address is verified: {profile?.is_email_verified ? 'Yes' : 'No'}
          </p>
          <p className="mt-2 text-xs text-blue-700">
            An OTP will be sent to your new email for verification
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="new_email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    New Email Address <span className="text-red-500">*</span>
                  </FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input
                        type="email"
                        placeholder={FormPlaceholders.EMAIL_EXAMPLE}
                        {...field}
                        disabled={otpSent}
                      />
                    </FormControl>
                    <Button
                      type="button"
                      onClick={handleSendOTP}
                      disabled={otpSent || sendOTPMutation.isPending}
                    >
                      {sendOTPMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          {CommonUiText.SEND_OTP}
                        </>
                      )}
                    </Button>
                  </div>
                  <FormDescription>
                    {otpSent ? (
                      <span className="text-green-600">
                        OTP sent! Expires in {formatTime(countdown)}
                      </span>
                    ) : (
                      'Click the button to send OTP to this email'
                    )}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {otpSent && (
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
                    <FormDescription>Enter the OTP sent to your new email</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
                disabled={updateEmailMutation.isPending}
              >
                {CommonUiText.RESET}
              </Button>
              <Button type="submit" variant="brand" disabled={!otpSent || updateEmailMutation.isPending}>
                {updateEmailMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Mail className="mr-2 h-4 w-4" />
                {CommonUiText.UPDATE_EMAIL}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
