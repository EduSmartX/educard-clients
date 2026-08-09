/**
 * Student Profile — read-only personal, academic and guardian details.
 * Students cannot edit their own record; changes are made by the school.
 */

import { getRoleGradient } from '@educard/shared';
import { useNavigation } from '@react-navigation/native';
import {
  ChevronLeft,
  GraduationCap,
  Info,
  MapPin,
  ShieldCheck,
  User,
} from 'lucide-react-native';
import { useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
} from 'react-native';

import { useProfileImageUrl, useUserProfile } from '@/hooks';
import { useAuthStore } from '@/lib/auth-store';
import { LinearGradient } from '@/lib/linear-gradient';
import { headerStyles, layoutStyles } from '@/styles';

const adminGradient = getRoleGradient('admin');

function formatValue(value?: string | null): string {
  if (!value) return '—';
  const trimmed = String(value).trim();
  return trimmed.length > 0 ? trimmed : '—';
}

function titleCase(value?: string | null): string {
  if (!value) return '—';
  return value
    .split(/[\s_]+/)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.row}>
      <Text style={s.rowLabel}>{label}</Text>
      <Text style={s.rowValue}>{value}</Text>
    </View>
  );
}

function Section({
  title,
  icon: Icon,
  tint,
  children,
}: {
  title: string;
  icon: typeof User;
  tint: string;
  children: React.ReactNode;
}) {
  return (
    <View style={s.card}>
      <View style={s.cardHeader}>
        <View style={[s.cardIcon, { backgroundColor: `${tint}1a` }]}>
          <Icon size={16} color={tint} />
        </View>
        <Text style={s.cardTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

export default function StudentProfileScreen() {
  const navigation = useNavigation();
  const { user } = useAuthStore();
  const { data: profile, isLoading } = useUserProfile();
  const { profileImageUrl } = useProfileImageUrl();

  const handleBack = useCallback(() => {
    if (navigation.canGoBack()) navigation.goBack();
  }, [navigation]);

  const fullName = profile?.full_name || user?.full_name || 'Student';
  const address = profile?.address;
  const addressLine = [
    address?.street_address,
    address?.address_line_2,
    address?.city,
    address?.state,
    address?.zip_code,
    address?.country,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <View style={layoutStyles.container}>
      <LinearGradient colors={adminGradient} style={headerStyles.header}>
        <View style={headerStyles.content}>
          <View style={headerStyles.topRow}>
            <TouchableOpacity style={headerStyles.backBtn} onPress={handleBack}>
              <ChevronLeft size={24} color="#fff" />
            </TouchableOpacity>
            <View style={headerStyles.titleContainer}>
              <Text style={headerStyles.title}>My Profile</Text>
              <Text style={headerStyles.subtitle}>
                Personal and academic details
              </Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      {isLoading && !profile ? (
        <View style={s.loading}>
          <ActivityIndicator size="large" color="#059669" />
        </View>
      ) : (
        <ScrollView
          style={s.body}
          contentContainerStyle={s.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={s.identityCard}>
            {profileImageUrl ? (
              <Image source={{ uri: profileImageUrl }} style={s.avatar} />
            ) : (
              <View style={[s.avatar, s.avatarFallback]}>
                <Text style={s.avatarText}>
                  {fullName.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <Text style={s.identityName}>{fullName}</Text>
            {!!user?.class_name && (
              <View style={s.classChip}>
                <GraduationCap size={13} color="#4338ca" />
                <Text style={s.classChipText}>Class {user.class_name}</Text>
              </View>
            )}
            <Text style={s.readOnlyNote}>
              Contact the school office to update these details.
            </Text>
          </View>

          <Section
            title="Academic Information"
            icon={GraduationCap}
            tint="#4f46e5"
          >
            <InfoRow label="Class" value={formatValue(user?.class_name)} />
            <InfoRow
              label="Roll Number"
              value={formatValue(user?.roll_number)}
            />
            <InfoRow
              label="School"
              value={formatValue(user?.organization?.name)}
            />
            <InfoRow
              label="Role"
              value={titleCase(profile?.role ?? user?.role)}
            />
          </Section>

          <Section title="Personal Information" icon={Info} tint="#0ea5e9">
            <InfoRow
              label="First Name"
              value={formatValue(profile?.first_name)}
            />
            <InfoRow
              label="Last Name"
              value={formatValue(profile?.last_name)}
            />
            <InfoRow label="Gender" value={titleCase(profile?.gender)} />
            <InfoRow
              label="Date of Birth"
              value={formatValue(profile?.date_of_birth)}
            />
            <InfoRow
              label="Blood Group"
              value={formatValue(profile?.blood_group)}
            />
            <InfoRow label="Email" value={formatValue(profile?.email)} />
            <InfoRow label="Phone" value={formatValue(profile?.phone)} />
          </Section>

          {(!!user?.guardian_name || !!user?.guardian_phone) && (
            <Section
              title="Guardian Information"
              icon={ShieldCheck}
              tint="#059669"
            >
              <InfoRow label="Name" value={formatValue(user?.guardian_name)} />
              <InfoRow
                label="Phone"
                value={formatValue(user?.guardian_phone)}
              />
            </Section>
          )}

          <Section title="Address" icon={MapPin} tint="#f59e0b">
            <Text style={s.addressText}>
              {addressLine || 'No address on record.'}
            </Text>
          </Section>
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 16, paddingBottom: 40 },

  identityCard: {
    alignItems: 'center',
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    backgroundColor: '#fff',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  avatar: { width: 84, height: 84, borderRadius: 42 },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e0e7ff',
  },
  avatarText: { fontSize: 30, fontWeight: '800', color: '#4338ca' },
  identityName: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  classChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
    backgroundColor: '#e0e7ff',
  },
  classChipText: { fontSize: 12, fontWeight: '800', color: '#4338ca' },
  readOnlyNote: {
    marginTop: 10,
    fontSize: 11,
    color: '#94a3b8',
    textAlign: 'center',
  },

  card: {
    marginBottom: 14,
    borderRadius: 16,
    padding: 16,
    backgroundColor: '#fff',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  cardIcon: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: { fontSize: 14, fontWeight: '800', color: '#0f172a' },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  rowLabel: { fontSize: 12, color: '#64748b' },
  rowValue: {
    flex: 1,
    marginLeft: 16,
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
    textAlign: 'right',
  },
  addressText: { fontSize: 13, lineHeight: 20, color: '#334155' },
});
