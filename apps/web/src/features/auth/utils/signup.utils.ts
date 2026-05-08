import { ADDRESS_TYPE } from '@/constants';
import type { CompleteSignupData, Step1Data, Step3Data } from './signup.schemas';

export const SIGNUP_STEP_TITLES = [
  'Email Verification',
  'Verify OTP Codes',
  'Organization Details',
  'Administrator Setup',
] as const;

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
    },
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
