import { ADDRESS_TYPE } from '@/constants';
import type { CompleteSignupData, Step1Data, Step3Data } from './signup.schemas';

export const SIGNUP_STEP_TITLES = [
  'Email Verification',
  'Verify OTP Codes',
  'Organization Details',
  'Administrator Setup',
] as const;

/** How long to wait before allowing another OTP send/resend for the same email(s). */
export const OTP_RESEND_COOLDOWN_SECONDS =
  Number(import.meta.env.VITE_OTP_RESEND_COOLDOWN_SECONDS) || 120; // default 2 minutes

/** Format seconds into MM:SS for the resend-cooldown countdown display. */
export function formatResendCountdown(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export interface OtpSentEmails {
  adminEmail?: string;
  orgEmail?: string;
}

/** Skip resending OTPs if emails are unchanged and still within the cooldown. */
export function shouldSkipOtpResend(params: {
  data: Step1Data;
  useSameEmail: boolean;
  lastSentEmails: OtpSentEmails | null;
  lastSentAt: number | null;
}): boolean {
  const { data, useSameEmail, lastSentEmails, lastSentAt } = params;
  if (!lastSentEmails || lastSentAt === null) {
    return false;
  }

  const resolvedOrgEmail = useSameEmail ? data.adminEmail : data.orgEmail;
  const emailsUnchanged =
    lastSentEmails.adminEmail === data.adminEmail && lastSentEmails.orgEmail === resolvedOrgEmail;
  const withinCooldown = Date.now() - lastSentAt < OTP_RESEND_COOLDOWN_SECONDS * 1000;

  return emailsUnchanged && withinCooldown;
}

export function buildOtpSendRequests(useSameEmail: boolean, data: Step1Data) {
  if (useSameEmail) {
    return [
      {
        email: data.adminEmail,
        category: 'admin' as const,
        purpose: 'organization_registration',
      },
    ];
  }

  return [
    {
      email: data.adminEmail,
      category: 'admin' as const,
      purpose: 'organization_registration',
    },
    {
      email: data.orgEmail,
      category: 'organization' as const,
      purpose: 'organization_registration',
    },
  ];
}

export function getOtpSendSuccessMessage(useSameEmail: boolean, data: Step1Data): string {
  return useSameEmail
    ? `Verification code sent to ${data.adminEmail}`
    : `Verification codes sent to ${data.adminEmail} and ${data.orgEmail}`;
}

export function getOtpVerifyBlockingMessage(useSameEmail: boolean): string {
  return useSameEmail
    ? 'Please verify the email address before continuing'
    : 'Please verify both email addresses before continuing';
}

export function normalizeStep3DataForSave(includeAddress: boolean, data: Step3Data): Step3Data {
  if (includeAddress) {
    return data;
  }

  return {
    ...data,
    streetAddress: '',
    addressLine2: '',
    city: '',
    state: '',
    zipCode: '',
  };
}

export function buildOrganizationRegistrationPayload(completeData: CompleteSignupData) {
  return {
    organization_info: {
      name: completeData.orgName,
      type: completeData.orgType,
      email: completeData.orgEmail,
      phone_number: completeData.orgPhone,
      website_url: completeData.orgWebsite,
      board_affiliation: completeData.boardAffiliation,
    },
    admin_info: {
      first_name: completeData.firstName,
      last_name: completeData.lastName,
      email: completeData.adminEmail,
      phone_number: completeData.phoneNumber || '',
      gender: completeData.gender || '',
      password: completeData.password,
      password2: completeData.confirmPassword,
      notification_opt_in: completeData.notificationOptIn,
      can_teach_subject: completeData.canTeachSubject,
    },
    ...(completeData.canTeachSubject
      ? {
          teacher_info: {
            employee_id: completeData.employeeId?.trim() || '',
          },
        }
      : {}),
    ...(completeData.streetAddress &&
    completeData.city &&
    completeData.state &&
    completeData.zipCode
      ? {
          address_info: {
            address_type: ADDRESS_TYPE.ORGANIZATION,
            street_address: completeData.streetAddress,
            address_line_2: completeData.addressLine2 || '',
            city: completeData.city,
            state: completeData.state,
            zip_code: completeData.zipCode,
            country: completeData.country || 'India',
          },
        }
      : {}),
  };
}
