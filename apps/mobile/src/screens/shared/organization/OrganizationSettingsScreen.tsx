import { Colors, getRoleGradient } from '@educard/shared';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { Building2, ChevronLeft, MapPin } from 'lucide-react-native';
import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';

import { getOrganizationProfile } from '@/api/organization';
import { LinearGradient } from '@/lib/linear-gradient';
import { cardStyles, headerStyles, layoutStyles } from '@/styles/common';

import { OrganizationInfoForm } from './OrganizationInfoForm';
import { OrganizationAddressForm } from './OrganizationAddressForm';

const adminGradient = getRoleGradient('admin');

type Tab = 'info' | 'address';

export default function OrganizationSettingsScreen() {
  const navigation = useNavigation();
  const [tab, setTab] = useState<Tab>('info');

  const {
    data: organization,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['organization', 'profile'],
    queryFn: getOrganizationProfile,
  });

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  return (
    <View style={layoutStyles.container}>
      <LinearGradient colors={adminGradient} style={headerStyles.header}>
        <View style={headerStyles.circle1} pointerEvents="none" />
        <View style={headerStyles.circle2} pointerEvents="none" />
        <View style={headerStyles.content}>
          <View style={headerStyles.topRow}>
            <TouchableOpacity
              style={headerStyles.backBtn}
              onPress={handleBack}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <ChevronLeft size={24} color="#fff" />
            </TouchableOpacity>
            <View style={headerStyles.titleContainer}>
              <Text style={headerStyles.title}>Organization</Text>
              <Text style={headerStyles.subtitle}>
                Manage organization details
              </Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      {isLoading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator color={Colors.primary[600]} />
        </View>
      ) : isError || !organization ? (
        <View style={styles.centerBox}>
          <Text style={styles.errorText}>
            Unable to load organization details.
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.tabs}>
            <TouchableOpacity
              style={[styles.tab, tab === 'info' && styles.tabActive]}
              onPress={() => setTab('info')}
            >
              <Building2
                size={16}
                color={tab === 'info' ? Colors.primary[600] : Colors.gray[500]}
              />
              <Text
                style={[styles.tabText, tab === 'info' && styles.tabTextActive]}
              >
                Info
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, tab === 'address' && styles.tabActive]}
              onPress={() => setTab('address')}
            >
              <MapPin
                size={16}
                color={
                  tab === 'address' ? Colors.primary[600] : Colors.gray[500]
                }
              />
              <Text
                style={[
                  styles.tabText,
                  tab === 'address' && styles.tabTextActive,
                ]}
              >
                Address
              </Text>
            </TouchableOpacity>
          </View>

          <View style={cardStyles.cardLarge}>
            {tab === 'info' ? (
              <OrganizationInfoForm organization={organization} />
            ) : (
              <OrganizationAddressForm organization={organization} />
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: 16,
    paddingBottom: 40,
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 14,
    color: Colors.danger[600],
    textAlign: 'center',
  },
  tabs: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.gray[200],
    backgroundColor: '#ffffff',
  },
  tabActive: {
    borderColor: Colors.primary[400],
    backgroundColor: Colors.primary[50],
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.gray[500],
  },
  tabTextActive: {
    color: Colors.primary[600],
  },
});
