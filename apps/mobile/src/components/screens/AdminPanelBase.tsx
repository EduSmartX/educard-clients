/**
 * AdminPanelBase - Shared layout for Admin Panel screens (admin & employee tabs)
 * Renders a header with Shield icon + a grid of action cards.
 */

import { getRoleGradient } from '@educard/shared';
import { useNavigation } from '@react-navigation/native';
import { Shield, type LucideIcon } from 'lucide-react-native';
import { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { getMediaUrl } from '@/constants/config';
import { useMyProfilePhoto } from '@/hooks';
import { useResponsive } from '@/hooks/useResponsive';
import { useAuthStore } from '@/lib/auth-store';
import { LinearGradient } from '@/lib/linear-gradient';
import { navigateToScreen, type MenuTarget } from '@/navigation/nav-targets';
import type { AdminTabNavigation } from '@/navigation/types';

export interface AdminPanelItem {
  id: string;
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  gradient: readonly [string, string];
  screen: MenuTarget;
}

export interface AdminPanelBaseProps {
  subtitle: string;
  items: AdminPanelItem[];
  settingsScreen: MenuTarget;
}

export function AdminPanelBase({
  subtitle,
  items,
  settingsScreen,
}: AdminPanelBaseProps) {
  const navigation = useNavigation<AdminTabNavigation>();
  const { gridColumns } = useResponsive();
  const { user } = useAuthStore();
  const { data: profilePhoto } = useMyProfilePhoto();
  const [imgError, setImgError] = useState(false);
  const colWidth = gridColumns === 4 ? '25%' : '33.33%';

  const handleNavigate = (screen: MenuTarget) => {
    navigateToScreen(navigation, screen);
  };

  const goToSettings = useCallback(() => {
    navigateToScreen(navigation, settingsScreen);
  }, [navigation, settingsScreen]);

  const profileImageUrl =
    getMediaUrl(profilePhoto?.thumbnail_url) ?? getMediaUrl(profilePhoto?.url);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={getRoleGradient('admin')}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <View style={styles.headerIcon}>
              <Shield size={24} color="#fff" />
            </View>
            <View>
              <Text style={styles.greeting}>Admin Panel</Text>
              <Text style={styles.subtitle}>{subtitle}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.profileBtn}
            onPress={goToSettings}
            activeOpacity={0.8}
          >
            {profileImageUrl && !imgError ? (
              <Image
                source={{ uri: profileImageUrl }}
                style={styles.profileImage}
                resizeMode="cover"
                onError={() => setImgError(true)}
              />
            ) : (
              <View style={styles.profileFallback}>
                <Text style={styles.profileFallbackText}>
                  {(user?.full_name ?? 'A').charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.grid}>
          {items.map((item, index) => {
            const ItemIcon = item.icon;
            return (
              <Animated.View
                key={item.id}
                entering={FadeInDown.delay(index * 60)
                  .duration(400)
                  .springify()}
                style={[styles.cardWrapper, { width: colWidth }]}
              >
                <TouchableOpacity
                  style={styles.card}
                  onPress={() => handleNavigate(item.screen)}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={item.gradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.iconContainer}
                  >
                    <ItemIcon size={26} color="#fff" strokeWidth={1.8} />
                  </LinearGradient>
                  <Text style={styles.cardTitle} numberOfLines={2}>
                    {item.title}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
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
    backgroundColor: '#f1f5f9',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  cardWrapper: {
    padding: 6,
  },
  card: {
    minHeight: 140,
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    color: '#1f2937',
    textAlign: 'center',
  },
  profileBtn: {
    width: 44,
    height: 44,
    borderRadius: 15,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImage: {
    width: 44,
    height: 44,
    borderRadius: 15,
  },
  profileFallback: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileFallbackText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
});
