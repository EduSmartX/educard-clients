import { Colors } from '@educard/shared';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { GraduationCap, LogIn, ArrowLeft } from 'lucide-react-native';
import { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ScrollView,
} from 'react-native';

import type { ProfileSummary } from '@/api/auth';
import { getErrorMessage } from '@/api/client';
import { LinearGradient } from '@/lib/linear-gradient';
import { useAuthStore } from '@/lib/auth-store';
import type { AuthStackParamList } from '@/navigation/types';

export default function ProfileSelectScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const route = useRoute<RouteProp<AuthStackParamList, 'ProfileSelect'>>();
  const { selectionToken, profiles } = route.params;
  const selectProfile = useAuthStore(s => s.selectProfile);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleSelect = useCallback(
    async (profile: ProfileSummary) => {
      setLoadingId(profile.public_id);
      try {
        // On success the auth store flips isAuthenticated and RootNavigator shows Main.
        await selectProfile(selectionToken, profile.public_id);
      } catch (error) {
        const message = getErrorMessage(
          error,
          'Unable to select this profile. Please try again.',
        );
        Alert.alert('Selection Failed', message);
        setLoadingId(null);
      }
    },
    [selectProfile, selectionToken],
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#6366f1', '#8b5cf6', '#a855f7']}
        style={styles.gradientBg}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft size={22} color="#ffffff" />
        </TouchableOpacity>

        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <GraduationCap size={36} color="#ffffff" />
          </View>
          <Text style={styles.title}>Select a Profile</Text>
          <Text style={styles.subtitle}>
            Multiple students share this login. Choose which profile to continue
            with.
          </Text>
        </View>

        <View style={styles.card}>
          {profiles.map(profile => {
            const isLoading = loadingId === profile.public_id;
            return (
              <TouchableOpacity
                key={profile.public_id}
                style={styles.profileRow}
                disabled={loadingId !== null}
                onPress={() => handleSelect(profile)}
              >
                <View style={styles.profileLeft}>
                  <View style={styles.avatar}>
                    <GraduationCap size={22} color={Colors.primary[600]} />
                  </View>
                  <View style={styles.profileInfo}>
                    <Text style={styles.profileName}>{profile.full_name}</Text>
                    <Text style={styles.profileMeta}>
                      {profile.class_name}
                      {profile.roll_number
                        ? ` \u00b7 Roll No. ${profile.roll_number}`
                        : ''}
                    </Text>
                  </View>
                </View>
                <View style={styles.continueBtn}>
                  {isLoading ? (
                    <Text style={styles.continueText}>Continuing...</Text>
                  ) : (
                    <>
                      <LogIn size={16} color={Colors.primary[600]} />
                      <Text style={styles.continueText}>Continue</Text>
                    </>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#6366f1',
  },
  gradientBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 320,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 60,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 28,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 12,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 6,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 2,
    borderColor: Colors.gray[200],
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  profileLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.gray[900],
  },
  profileMeta: {
    fontSize: 12,
    color: Colors.gray[500],
    marginTop: 2,
  },
  continueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
  },
  continueText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary[600],
  },
});
