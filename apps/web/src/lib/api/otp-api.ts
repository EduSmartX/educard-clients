import api from '../api';

export interface OtpEmailConfig {
  email: string;
  category: 'admin' | 'organization';
  purpose: string;
}

export interface SendOtpResponse {
  all_success: boolean;
  results: Array<{
    email: string;
    success: boolean;
    message: string;
  }>;
}

export interface VerifyOtpResponse {
  success: boolean;
  message: string;
}

/**
 * Send OTP to multiple emails
 */
export async function sendOtps(emails: OtpEmailConfig[]): Promise<SendOtpResponse> {
  const response = await api.post('/organizations/otp/send/', emails);
  return response.data;
}

/**
 * Verify OTP for a given email
 */
export async function verifyOtp(
  email: string,
  otpCode: string,
  purpose: string = 'organization_registration'
): Promise<VerifyOtpResponse> {
  const response = await api.post('/organizations/otp/verify/', {
    email,
    otp_code: otpCode,
    purpose,
  });
  return response.data;
}

/**
 * Resend OTP to an email
 */
export async function resendOtp(
  email: string,
  category: 'admin' | 'organization',
  purpose: string = 'organization_registration'
): Promise<{ success: boolean; message: string }> {
  const response = await sendOtps([{ email, category, purpose }]);
  const result = response.results[0];
  return {
    success: result.success,
    message: result.message,
  };
}
