/**
 * OTP API endpoints for organization registration
 */

import apiClient from './client';

export interface OtpEmailConfig {
  email: string;
  category: 'admin' | 'organization';
  purpose: string;
}

export interface SendOtpResponse {
  all_success: boolean;
  results: {
    email: string;
    success: boolean;
    message: string;
  }[];
}

export interface VerifyOtpResponse {
  success: boolean;
  message: string;
}

export interface SendPhoneOtpResponse {
  success: boolean;
  message: string;
  data?: {
    phone: string;
    expires_in_minutes: number;
    remaining_attempts: number;
  };
}

export interface VerifyPhoneOtpResponse {
  success: boolean;
  message: string;
  data?: {
    phone: string;
    is_verified: boolean;
  };
}

/**
 * Send OTP to multiple emails for organization registration
 */
export async function sendOtps(
  emails: OtpEmailConfig[],
): Promise<SendOtpResponse> {
  const response = await apiClient.post<SendOtpResponse>(
    '/organizations/otp/send/',
    emails,
  );
  return response.data;
}

/**
 * Verify OTP for a given email
 */
export async function verifyOtp(
  email: string,
  otpCode: string,
  purpose: string = 'organization_registration',
): Promise<VerifyOtpResponse> {
  const response = await apiClient.post<VerifyOtpResponse>(
    '/organizations/otp/verify/',
    {
      email,
      otp_code: otpCode,
      purpose,
    },
  );
  return response.data;
}

/**
 * Resend OTP to an email
 */
export async function resendOtp(
  email: string,
  category: 'admin' | 'organization',
  purpose: string = 'organization_registration',
): Promise<{ success: boolean; message: string }> {
  const response = await sendOtps([{ email, category, purpose }]);
  const result = response.results[0];
  return {
    success: result.success,
    message: result.message,
  };
}

/**
 * Send OTP to a phone number for organization registration
 */
export async function sendPhoneOtp(
  phone: string,
  purpose: string = 'organization_registration',
): Promise<SendPhoneOtpResponse> {
  const response = await apiClient.post<SendPhoneOtpResponse>(
    '/organizations/otp/send-phone/',
    { phone, purpose },
  );
  return response.data;
}

/**
 * Verify phone OTP for organization registration
 */
export async function verifyPhoneOtp(
  phone: string,
  otpCode: string,
  purpose: string = 'organization_registration',
): Promise<VerifyPhoneOtpResponse> {
  const response = await apiClient.post<VerifyPhoneOtpResponse>(
    '/organizations/otp/verify-phone/',
    { phone, otp_code: otpCode, purpose },
  );
  return response.data;
}

export const otpApi = {
  sendOtps,
  verifyOtp,
  resendOtp,
  sendPhoneOtp,
  verifyPhoneOtp,
};
