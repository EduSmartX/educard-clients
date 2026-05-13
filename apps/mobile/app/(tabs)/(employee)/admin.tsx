/**
 * Admin Screen - View approvals & requests (Employee/Teacher)
 * Shares same screens as admin with role-based access
 */

import { getRoleGradient } from '@educard/shared';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, type Href } from 'expo-router';
import {
  CheckSquare,
  Briefcase,
  FileText,
  CalendarCheck,
  LucideIcon,
  Shield,
} from 'lucide-react-native';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { HeaderProfileButton } from '@/components/common';

const { width: _width } = Dimensions.get('window');

interface AdminItem {
  id: string;
  title: string;
  icon: LucideIcon;
  gradient: readonly [string, string];
  route: Href;
}

// Routes point to shared-screens which have role-based permission checks
const adminItems: AdminItem[] = [
  {
    id: 'timesheet-approvals',
    title: 'Timesheet Approvals',
    icon: CheckSquare,
    gradient: ['#d97706', '#fbbf24'],
    route: '/(shared-screens)/timesheets/approvals',
  },
  {
    id: 'leave-approvals',
    title: 'Leave Approvals',
    icon: Briefcase,
    gradient: ['#16a34a', '#4ade80'],
    route: '/(shared-screens)/leave/approvals',
  },
  {
    id: 'leave-policies',
    title: 'Leave Policies',
    icon: FileText,
    gradient: ['#8b5cf6', '#c084fc'],
    route: '/(shared-screens)/leave/allocations',
  },
  {
    id: 'holidays',
    title: 'Holidays',
    icon: CalendarCheck,
    gradient: ['#dc2626', '#f87171'],
    route: '/(shared-screens)/holidays',
  },
];

export default function AdminScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* Header */}
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
              <Text style={styles.subtitle}>My requests & policies</Text>
            </View>
          </View>
          <HeaderProfileButton route="/(tabs)/(employee)/settings" />
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Admin Items Grid */}
        <View style={styles.grid}>
          {adminItems.map((item, index) => (
            <Animated.View
              key={item.id}
              entering={FadeInDown.delay(index * 60)
                .duration(400)
                .springify()}
              style={styles.cardWrapper}
            >
              <TouchableOpacity
                style={styles.card}
                onPress={() => router.push(item.route)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={item.gradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.iconContainer}
                >
                  <item.icon size={26} color="#fff" strokeWidth={1.8} />
                </LinearGradient>
                <Text style={styles.cardTitle}>{item.title}</Text>
              </TouchableOpacity>
            </Animated.View>
          ))}
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
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  greeting: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
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
    width: '50%',
    padding: 6,
  },
  card: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  iconContainer: {
    width: 54,
    height: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
});
