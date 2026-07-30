import { Colors } from '@educard/shared';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { GraduationCap, LogIn, Check } from 'lucide-react-native';
import { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';

import { getLinkedProfiles, type ProfileSummary } from '@/api/auth';
import { getErrorMessage } from '@/api/client';
import { Screen, Header } from '@/components/layout';
import { useAuthStore } from '@/lib/auth-store';
import { useToast } from '@/lib/toast-context';
import type { SharedStackNavigation } from '@/navigation/types';

export default function SwitchProfileScreen() {
  const navigation = useNavigation<SharedStackNavigation>();
  const switchProfile = useAuthStore(s => s.switchProfile);
  const { showToast } = useToast();
  const [switchingId, setSwitchingId] = useState<string | null>(null);

  const {
    data: profiles = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['linked-profiles'],
    queryFn: getLinkedProfiles,
  });

  const handleSwitch = useCallback(
    async (profile: ProfileSummary) => {
      if (profile.is_current) {
        return;
      }
      setSwitchingId(profile.public_id);
      try {
        await switchProfile(profile.public_id);
        showToast({
          type: 'success',
          title: `Switched to ${profile.full_name}`,
        });
        // Return to the tab root; cleared query cache makes screens refetch for the new profile.
        navigation.popToTop();
      } catch (error) {
        showToast({
          type: 'error',
          title: 'Switch failed',
          message: getErrorMessage(error, 'Unable to switch profile.'),
        });
        setSwitchingId(null);
      }
    },
    [switchProfile, showToast, navigation],
  );

  return (
    <Screen>
      <Header title="Switch Profile" />

      <View style={styles.body}>
        <Text style={styles.intro}>
          Choose another linked student profile to switch to. No password
          required.
        </Text>

        {isLoading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator color={Colors.primary[600]} />
          </View>
        ) : isError ? (
          <View style={styles.centerBox}>
            <Text style={styles.errorText}>
              Unable to load linked profiles.
            </Text>
          </View>
        ) : profiles.length === 0 ? (
          <View style={styles.centerBox}>
            <Text style={styles.emptyText}>No linked profiles found.</Text>
          </View>
        ) : (
          profiles.map(profile => {
            const isSwitching = switchingId === profile.public_id;
            return (
              <TouchableOpacity
                key={profile.public_id}
                style={styles.row}
                disabled={switchingId !== null || profile.is_current}
                onPress={() => handleSwitch(profile)}
              >
                <View style={styles.rowLeft}>
                  <View style={styles.avatar}>
                    <GraduationCap size={20} color={Colors.primary[600]} />
                  </View>
                  <View style={styles.info}>
                    <Text style={styles.name}>{profile.full_name}</Text>
                    <Text style={styles.meta}>
                      {profile.class_name}
                      {profile.roll_number
                        ? ` \u00b7 Roll No. ${profile.roll_number}`
                        : ''}
                    </Text>
                  </View>
                </View>

                {profile.is_current ? (
                  <View style={styles.currentBadge}>
                    <Check size={14} color={Colors.success[700]} />
                    <Text style={styles.currentText}>Current</Text>
                  </View>
                ) : (
                  <View style={styles.switchBtn}>
                    {isSwitching ? (
                      <Text style={styles.switchText}>Switching...</Text>
                    ) : (
                      <>
                        <LogIn size={16} color={Colors.primary[600]} />
                        <Text style={styles.switchText}>Switch</Text>
                      </>
                    )}
                  </View>
                )}
              </TouchableOpacity>
            );
          })
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: {
    padding: 16,
  },
  intro: {
    fontSize: 13,
    color: Colors.gray[500],
    marginBottom: 16,
    lineHeight: 18,
  },
  centerBox: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 14,
    color: Colors.danger[600],
  },
  emptyText: {
    fontSize: 14,
    color: Colors.gray[400],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: Colors.gray[200],
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.gray[900],
  },
  meta: {
    fontSize: 12,
    color: Colors.gray[500],
    marginTop: 2,
  },
  currentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.success[50],
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  currentText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.success[700],
  },
  switchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
  },
  switchText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary[600],
  },
});
