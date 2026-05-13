/**
 * Employee Classes Screen
 * Show teacher's assigned classes with student counts and quick actions
 */

import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { BookOpen, Users, GraduationCap, ClipboardCheck, Building2 } from 'lucide-react-native';
import { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { apiClient } from '@/api/client';
import { Screen } from '@/components/layout';
import { colors } from '@/constants/colors';

interface EligibleClass {
  public_id: string;
  name: string;
  section?: string;
  display_name: string;
  total_students: number;
  student_count?: number;
  grade_level?: string;
  class_teacher?: {
    first_name: string;
    last_name: string;
  };
}

const getEligibleClasses = async (): Promise<EligibleClass[]> => {
  const response = await apiClient.get('/classes/employee/eligible/');
  return response.data.data || response.data;
};

function ClassCard({
  classData,
  onMarkAttendance,
}: {
  classData: EligibleClass;
  onMarkAttendance: () => void;
}) {
  const studentCount = classData.total_students || classData.student_count || 0;

  return (
    <View style={styles.classCard}>
      <View style={styles.classCardHeader}>
        <View style={styles.classIcon}>
          <Building2 size={22} color="#3b82f6" />
        </View>
        <View style={styles.classInfo}>
          <Text style={styles.className}>{classData.display_name}</Text>
          {classData.grade_level && (
            <Text style={styles.classGrade}>Grade {classData.grade_level}</Text>
          )}
        </View>
      </View>

      <View style={styles.classStats}>
        <View style={styles.statItem}>
          <GraduationCap size={16} color="#6b7280" />
          <Text style={styles.statText}>{studentCount} Students</Text>
        </View>
        {classData.class_teacher && (
          <View style={styles.statItem}>
            <Users size={16} color="#6b7280" />
            <Text style={styles.statText}>
              {classData.class_teacher.first_name} {classData.class_teacher.last_name}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.classActions}>
        <TouchableOpacity style={styles.actionButton} onPress={onMarkAttendance}>
          <ClipboardCheck size={16} color="#3b82f6" />
          <Text style={styles.actionButtonText}>Mark Attendance</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function EmployeeClassesScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  const {
    data: classes,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['employee-eligible-classes'],
    queryFn: getEligibleClasses,
  });

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleMarkAttendance = (classId: string) => {
    router.push({
      pathname: '/(shared-screens)/attendance/mark',
      params: { classId },
    } as Parameters<typeof router.push>[0]);
  };

  const totalStudents =
    classes?.reduce((acc, c) => acc + (c.total_students || c.student_count || 0), 0) || 0;

  return (
    <Screen scrollable={false}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void handleRefresh()} />
        }
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <LinearGradient
          colors={[colors.secondary[600], colors.secondary[700], colors.secondary[800]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <View style={styles.headerIcon}>
              <BookOpen size={24} color="white" />
            </View>
            <Text style={styles.headerTitle}>My Classes</Text>
            <Text style={styles.headerSubtitle}>
              {classes?.length || 0} classes • {totalStudents} students
            </Text>
          </View>
        </LinearGradient>

        <View style={styles.content}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary[600]} />
              <Text style={styles.loadingText}>Loading classes...</Text>
            </View>
          ) : !classes || classes.length === 0 ? (
            <View style={styles.emptyState}>
              <BookOpen size={48} color="#d1d5db" />
              <Text style={styles.emptyTitle}>No Classes Assigned</Text>
              <Text style={styles.emptyText}>
                You don't have any classes assigned yet. Contact your administrator.
              </Text>
            </View>
          ) : (
            classes.map((cls, index) => (
              <Animated.View
                key={cls.public_id}
                entering={FadeInDown.delay(index * 100).springify()}
              >
                <ClassCard
                  classData={cls}
                  onMarkAttendance={() => handleMarkAttendance(cls.public_id)}
                />
              </Animated.View>
            ))
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingBottom: 100 },
  header: {
    paddingTop: 50,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: { alignItems: 'center' },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  headerTitle: { color: 'white', fontSize: 22, fontWeight: '700' },
  headerSubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginTop: 4 },
  content: { padding: 16 },
  loadingContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  loadingText: { color: '#6b7280', marginTop: 12, fontSize: 14 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#374151', marginTop: 16 },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 32,
  },
  classCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  classCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 14 },
  classIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  classInfo: { flex: 1 },
  className: { fontSize: 16, fontWeight: '600', color: '#1f2937' },
  classGrade: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  classStats: {
    flexDirection: 'row',
    gap: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    marginBottom: 14,
  },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statText: { fontSize: 13, color: '#6b7280' },
  classActions: { flexDirection: 'row', gap: 10 },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#eff6ff',
    borderRadius: 10,
    paddingVertical: 12,
  },
  actionButtonText: { fontSize: 14, fontWeight: '600', color: '#3b82f6' },
});
