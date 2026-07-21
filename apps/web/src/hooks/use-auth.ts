import { useEffect, useState } from 'react';
import { AUTH_STORAGE_EVENT, getParsedLocalStorageItem } from '@/lib/utils/storage';

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
  class_name?: string;
  roll_number?: string;
  guardian_name?: string;
  guardian_phone?: string;
  guardian_email?: string;
  guardian_email_verified?: boolean;
  guardian_phone_verified?: boolean;
  force_password_reset?: boolean;
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
  const [user, setUser] = useState<User | null>(() => getParsedLocalStorageItem<User>('user'));
  const [organization, setOrganization] = useState<Organization | null>(() =>
    getParsedLocalStorageItem<Organization>('organization')
  );

  useEffect(() => {
    const sync = () => {
      setUser(getParsedLocalStorageItem<User>('user'));
      setOrganization(getParsedLocalStorageItem<Organization>('organization'));
    };
    window.addEventListener(AUTH_STORAGE_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(AUTH_STORAGE_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  return { user, organization };
}
