import { AlertTriangle, Mail, Phone, X, ChevronRight } from 'lucide-react-native';
import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

import { USER_ROLES } from '@/constants';
import type { User } from '@/types/user';

interface VerificationBannerProps {
  readonly user: User;
  readonly onVerifyEmail?: () => void;
  readonly onVerifyPhone?: () => void;
}

interface PendingVerification {
  type: 'email' | 'phone';
  label: string;
  value: string;
  action: 'add' | 'verify';
}

function maskValue(value: string, type: 'email' | 'phone'): string {
  if (type === 'email') {
    const [local, domain] = value.split('@');
    if (!domain) {
      return value;
    }
    const maskedLocal = local.length > 2 ? `${local[0]}***${local.slice(-1)}` : `${local[0]}***`;
    return `${maskedLocal}@${domain}`;
  }
  if (value.length > 4) {
    return `***${value.slice(-4)}`;
  }
  return value;
}

function getPendingVerifications(user: User): PendingVerification[] {
  const pending: PendingVerification[] = [];

  if (!user.email) {
    pending.push({ type: 'email', label: 'Email', value: '', action: 'add' });
  } else if (!user.is_email_verified) {
    pending.push({ type: 'email', label: 'Email', value: user.email, action: 'verify' });
  }

  if (!user.phone) {
    pending.push({ type: 'phone', label: 'Phone', value: '', action: 'add' });
  } else if (!user.is_mobile_verified) {
    pending.push({ type: 'phone', label: 'Phone', value: user.phone, action: 'verify' });
  }

  if (user.role === USER_ROLES.STUDENT) {
    if (!user.guardian_email) {
      pending.push({ type: 'email', label: 'Guardian Email', value: '', action: 'add' });
    } else if (!user.guardian_email_verified) {
      pending.push({
        type: 'email',
        label: 'Guardian Email',
        value: user.guardian_email,
        action: 'verify',
      });
    }

    if (!user.guardian_phone) {
      pending.push({ type: 'phone', label: 'Guardian Phone', value: '', action: 'add' });
    } else if (!user.guardian_phone_verified) {
      pending.push({
        type: 'phone',
        label: 'Guardian Phone',
        value: user.guardian_phone,
        action: 'verify',
      });
    }
  }

  return pending;
}

export function VerificationBanner({
  user,
  onVerifyEmail,
  onVerifyPhone,
}: VerificationBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const pendingVerifications = getPendingVerifications(user);

  if (dismissed || pendingVerifications.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.dismissBtn} onPress={() => setDismissed(true)}>
        <X size={16} color="#b45309" />
      </TouchableOpacity>

      <View style={styles.headerRow}>
        <View style={styles.alertIconWrap}>
          <AlertTriangle size={18} color="#d97706" />
        </View>
        <View style={styles.headerTextWrap}>
          <Text style={styles.title}>Verification Required</Text>
          <Text style={styles.subtitle}>Please verify contact details to receive alerts.</Text>
        </View>
      </View>

      <View style={styles.chipsWrap}>
        {pendingVerifications.map((item, index) => {
          const key = `${item.type}-${item.label}-${index}`;
          const Icon = item.type === 'email' ? Mail : Phone;
          return (
            <TouchableOpacity
              key={key}
              style={styles.chip}
              onPress={() => {
                if (item.type === 'email') {
                  onVerifyEmail?.();
                } else {
                  onVerifyPhone?.();
                }
              }}
              activeOpacity={0.8}
            >
              <Icon size={14} color="#b45309" />
              <Text style={styles.chipText} numberOfLines={1}>
                {item.action === 'add'
                  ? `Add ${item.label}`
                  : `${item.label}: ${maskValue(item.value, item.type)}`}
              </Text>
              <ChevronRight size={14} color="#b45309" />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 4,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#fde68a',
    backgroundColor: '#fffbeb',
    padding: 12,
  },
  dismissBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 2,
    padding: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
    paddingRight: 24,
  },
  alertIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  headerTextWrap: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#92400e',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
    color: '#b45309',
  },
  chipsWrap: {
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#fcd34d',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 6,
  },
  chipText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#92400e',
  },
});
