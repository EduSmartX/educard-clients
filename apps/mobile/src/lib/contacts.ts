/**
 * contacts - device contacts access for the "pick a number" feature on phone fields.
 * Requests READ_CONTACTS (Android) / Contacts permission (iOS), then flattens the
 * address book to one selectable row per phone number.
 */

import { PermissionsAndroid, Platform } from 'react-native';
import Contacts from 'react-native-contacts';

export interface ContactPhone {
  id: string;
  name: string;
  number: string;
  normalized: string;
}

/** Thrown by loadContactPhones when the user denies contacts access. */
export const CONTACTS_PERMISSION_DENIED = 'CONTACTS_PERMISSION_DENIED';

/** Reduce a raw phone string to digits, keeping the last 10 (local mobile number). */
export function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  return digits.length > 10 ? digits.slice(-10) : digits;
}

async function ensureContactsPermission(): Promise<boolean> {
  if (Platform.OS === 'android') {
    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
      {
        title: 'Contacts permission',
        message:
          'EduCard needs access to your contacts so you can pick a phone number.',
        buttonPositive: 'Allow',
        buttonNegative: 'Deny',
      },
    );
    return result === PermissionsAndroid.RESULTS.GRANTED;
  }

  const status = await Contacts.requestPermission();
  return status === 'authorized' || status === 'limited';
}

/** Ask for permission, read device contacts, and flatten to one row per phone number. */
export async function loadContactPhones(): Promise<ContactPhone[]> {
  const granted = await ensureContactsPermission();
  if (!granted) {
    throw new Error(CONTACTS_PERMISSION_DENIED);
  }

  const contacts = await Contacts.getAll();
  const rows: ContactPhone[] = [];

  contacts.forEach(contact => {
    const name =
      [contact.givenName, contact.familyName]
        .filter(Boolean)
        .join(' ')
        .trim() ||
      contact.displayName ||
      'Unknown';

    contact.phoneNumbers.forEach((phone, index) => {
      const number = (phone.number ?? '').trim();
      if (!number) {
        return;
      }
      rows.push({
        id: `${contact.recordID}-${index}`,
        name,
        number,
        normalized: normalizePhone(number),
      });
    });
  });

  rows.sort((a, b) => a.name.localeCompare(b.name));
  return rows;
}
