import { useState } from 'react';
import { getParsedLocalStorageItem } from '@/lib/utils/storage';

export interface User {
  public_id: string;
  username: string;
  email: string;
  phone?: string;
  role: string;
  full_name: string;
  profile_image?: string;
  is_email_verified?: boolean;
  is_mobile_verified?: boolean;
  guardian_name?: string;
  guardian_phone?: string;
  guardian_email?: string;
  guardian_email_verified?: boolean;
  guardian_phone_verified?: boolean;
}

export interface Organization {
  public_id: string;
  name: string;
  organization_type: string;
  email: string;
  phone: string;
  website_url?: string;
  board_affiliation?: string;
  logo?: string;
  is_active: boolean;
  is_verified: boolean;
  is_approved: boolean;
}

export function useAuth() {
  const getUserFromStorage = () => getParsedLocalStorageItem<User>('user');

  const getOrganizationFromStorage = () => getParsedLocalStorageItem<Organization>('organization');

  const [user] = useState<User | null>(getUserFromStorage);
  const [organization] = useState<Organization | null>(getOrganizationFromStorage);

  return { user, organization };
}
