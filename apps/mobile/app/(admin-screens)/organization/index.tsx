/**
 * Organization Settings Screen
 * View organization information (name, type, contact, address)
 */

import { Colors, getRoleGradient } from '@educard/shared';
import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  ChevronLeft,
  Building2,
  Mail,
  Phone,
  Globe,
  MapPin,
  Hash,
  GraduationCap,
} from 'lucide-react-native';
import { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { apiClient } from '@/api/client';
import { useAuthStore } from '@/lib/auth-store';
import {
  headerStyles,
  layoutStyles,
  bodyStyles,
  cardStyles,
  sectionTitleStyles,
  dividerStyles,
  noteStyles,
  emptyStyles,
} from '@/styles';

const adminGradient = getRoleGradient('admin');

interface OrgAddress {
  street_address?: string;
  address_line_2?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country?: string;
  full_address?: string;
}

interface OrgData {
  public_id: string;
  name: string;
  organization_type: string;
  email: string;
  phone: string;
  registration_number?: string;
  corporate_identification_number?: string;
  tax_id?: string;
  website_url?: string;
  board_affiliation?: string;
  address?: OrgAddress;
  administrative?: {
    full_name: string;
    email: string;
  };
  is_active: boolean;
  created_at: string;
}

function useOrganization(publicId?: string) {
  return useQuery({
    queryKey: ['organization', publicId],
    queryFn: async () => {
      const res = await apiClient.get(`/organizations/${publicId}/`);
      return res.data.data as OrgData;
    },
    enabled: !!publicId,
    staleTime: 5 * 60 * 1000,
  });
}

const ORG_TYPE_LABELS: Record<string, string> = {
  school: 'School',
  college: 'College',
  university: 'University',
  coaching: 'Coaching Center',
  training: 'Training Institute',
};

export default function OrganizationSettingsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const orgId = user?.organization?.id;
  const { data: org, isLoading, refetch } = useOrganization(orgId);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const address = org?.address;
  const fullAddress =
    address?.full_address ||
    [
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
        <Animated.View
          entering={FadeIn.delay(100)}
          style={headerStyles.circle1}
          pointerEvents="none"
        />
        <Animated.View
          entering={FadeIn.delay(200)}
          style={headerStyles.circle2}
          pointerEvents="none"
        />
        <View style={headerStyles.content}>
          <View style={headerStyles.topRow}>
            <TouchableOpacity style={headerStyles.backBtn} onPress={() => router.back()}>
              <ChevronLeft size={24} color="#fff" />
            </TouchableOpacity>
            <View style={headerStyles.titleContainer}>
              <Text style={headerStyles.title}>Organization</Text>
              <Text style={headerStyles.subtitle}>Organization details</Text>
            </View>
            <View style={{ width: 40 }} />
          </View>
        </View>
      </LinearGradient>

      {isLoading && !refreshing ? (
        <View style={emptyStyles.container}>
          <ActivityIndicator size="large" color="#7c3aed" />
        </View>
      ) : (
        <ScrollView
          style={bodyStyles.scroll}
          contentContainerStyle={bodyStyles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#7c3aed']} />
          }
        >
          {/* Org Header Card */}
          <Animated.View entering={FadeInDown.delay(100).springify()}>
            <View style={s.headerCard}>
              <View style={s.orgIconCircle}>
                <Building2 size={28} color="#7c3aed" />
              </View>
              <Text style={s.orgName}>{org?.name || user?.organization?.name || '—'}</Text>
              <Text style={s.orgType}>
                {ORG_TYPE_LABELS[org?.organization_type || ''] ||
                  org?.organization_type ||
                  'Organization'}
              </Text>
            </View>
          </Animated.View>

          {/* Contact Info */}
          <Animated.View entering={FadeInDown.delay(200).springify()}>
            <Text style={sectionTitleStyles.label}>CONTACT INFORMATION</Text>
            <View style={cardStyles.cardSection}>
              <InfoRow
                icon={<Mail size={16} color="#2563eb" />}
                label="Email"
                value={org?.email || '—'}
              />
              <View style={dividerStyles.spaced} />
              <InfoRow
                icon={<Phone size={16} color="#059669" />}
                label="Phone"
                value={org?.phone || '—'}
              />
              {org?.website_url && (
                <>
                  <View style={dividerStyles.spaced} />
                  <InfoRow
                    icon={<Globe size={16} color="#7c3aed" />}
                    label="Website"
                    value={org.website_url}
                  />
                </>
              )}
            </View>
          </Animated.View>

          {/* Registration Details */}
          <Animated.View entering={FadeInDown.delay(300).springify()}>
            <Text style={sectionTitleStyles.label}>REGISTRATION DETAILS</Text>
            <View style={cardStyles.cardSection}>
              {org?.registration_number && (
                <>
                  <InfoRow
                    icon={<Hash size={16} color="#f59e0b" />}
                    label="Registration Number"
                    value={org.registration_number}
                  />
                  <View style={dividerStyles.spaced} />
                </>
              )}
              {org?.board_affiliation && (
                <>
                  <InfoRow
                    icon={<GraduationCap size={16} color="#0284c7" />}
                    label="Board Affiliation"
                    value={org.board_affiliation}
                  />
                  <View style={dividerStyles.spaced} />
                </>
              )}
              {org?.tax_id && (
                <InfoRow
                  icon={<Hash size={16} color="#64748b" />}
                  label="Tax ID"
                  value={org.tax_id}
                />
              )}
              {!org?.registration_number && !org?.board_affiliation && !org?.tax_id && (
                <Text style={s.emptyDetail}>No registration details available</Text>
              )}
            </View>
          </Animated.View>

          {/* Address */}
          <Animated.View entering={FadeInDown.delay(400).springify()}>
            <Text style={sectionTitleStyles.label}>ADDRESS</Text>
            <View style={cardStyles.cardSection}>
              {fullAddress ? (
                <InfoRow
                  icon={<MapPin size={16} color="#dc2626" />}
                  label="Address"
                  value={fullAddress}
                />
              ) : (
                <Text style={s.emptyDetail}>No address available</Text>
              )}
            </View>
          </Animated.View>

          {/* Admin Info */}
          {org?.administrative && (
            <Animated.View entering={FadeInDown.delay(500).springify()}>
              <Text style={sectionTitleStyles.label}>ADMINISTRATOR</Text>
              <View style={cardStyles.cardSection}>
                <InfoRow
                  icon={<Building2 size={16} color="#7c3aed" />}
                  label="Name"
                  value={org.administrative.full_name}
                />
                <View style={dividerStyles.spaced} />
                <InfoRow
                  icon={<Mail size={16} color="#64748b" />}
                  label="Email"
                  value={org.administrative.email}
                />
              </View>
            </Animated.View>
          )}

          <View style={noteStyles.info}>
            <Text style={noteStyles.infoText}>
              To update organization details, please use the web dashboard.
            </Text>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <View style={s.infoRow}>
      <View style={s.infoIconCircle}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Text style={s.infoLabel}>{label}</Text>
        <Text style={s.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  headerCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  orgIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#f5f3ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  orgName: { fontSize: 22, fontWeight: '800', color: '#1e293b', textAlign: 'center' },
  orgType: {
    fontSize: 14,
    color: '#7c3aed',
    fontWeight: '600',
    marginTop: 4,
    textTransform: 'capitalize',
  },

  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  infoIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  infoLabel: { fontSize: 12, color: '#94a3b8', marginBottom: 2 },
  infoValue: { fontSize: 15, fontWeight: '500', color: '#1e293b', lineHeight: 20 },

  emptyDetail: { fontSize: 14, color: '#94a3b8', textAlign: 'center', paddingVertical: 8 },
});
