/**
 * Exams List Screen — Shows exams for a given session
 */

import { getRoleGradient } from '@educard/shared';
import {
  EXAM_STATUS_LABELS,
  EXAM_STATUS_COLORS,
  type Exam,
} from '@educard/shared';
import {
  useNavigation,
  useRoute,
  type RouteProp,
} from '@react-navigation/native';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  Plus,
} from 'lucide-react-native';
import { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useExams } from '@/features/exams';
import { LinearGradient } from '@/lib/linear-gradient';
import type {
  SharedStackNavigation,
  SharedStackParamList,
} from '@/navigation/types';

const adminGradient = getRoleGradient('admin');

function formatDate(d: string | null): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  });
}

function formatTime(t: string | null): string {
  if (!t) return '';
  const [h, m] = t.split(':');
  const hour = Number.parseInt(h, 10);
  return `${hour % 12 || 12}:${m} ${hour >= 12 ? 'PM' : 'AM'}`;
}

export default function ExamsListScreen() {
  const navigation = useNavigation<SharedStackNavigation>();
  const route = useRoute<RouteProp<SharedStackParamList, 'ExamsList'>>();
  const { sessionId, sessionName } = route.params;
  const [refreshing, setRefreshing] = useState(false);

  const handleBack = useCallback(() => {
    if (navigation.canGoBack()) navigation.goBack();
  }, [navigation]);

  const { data, isLoading, refetch } = useExams({
    session: sessionId,
    page_size: 100,
  });

  const exams = data?.data ?? [];

  const onRefresh = () => {
    setRefreshing(true);
    void refetch().finally(() => setRefreshing(false));
  };

  const renderExamCard = useCallback(
    ({ item, index }: { item: Exam; index: number }) => {
      const statusColors = EXAM_STATUS_COLORS[item.status] || {
        bg: '#f1f5f9',
        text: '#64748b',
      };
      const statusLabel = EXAM_STATUS_LABELS[item.status] || item.status;

      return (
        <Animated.View entering={FadeInDown.delay(index * 50).springify()}>
          <TouchableOpacity
            style={styles.examCard}
            onPress={() =>
              navigation.navigate('ExamMarks', {
                examId: item.public_id,
                examName: item.subject_name,
                sessionId,
                sessionName,
              })
            }
            activeOpacity={0.7}
          >
            <View style={styles.examHeader}>
              <View style={styles.examInfo}>
                <Text style={styles.examName}>{item.subject_name}</Text>
                <Text style={styles.examSubject}>
                  {item.session_name} • {item.class_name}
                </Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: statusColors.bg },
                ]}
              >
                <Text style={[styles.statusText, { color: statusColors.text }]}>
                  {statusLabel}
                </Text>
              </View>
            </View>

            <View style={styles.examDetails}>
              <View style={styles.detailItem}>
                <Calendar size={14} color="#64748b" />
                <Text style={styles.detailText}>{formatDate(item.date)}</Text>
              </View>
              {!!item.start_time && (
                <View style={styles.detailItem}>
                  <Clock size={14} color="#64748b" />
                  <Text style={styles.detailText}>
                    {formatTime(item.start_time)} - {formatTime(item.end_time)}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.examFooter}>
              <Text style={styles.marksText}>
                Max: {item.max_marks} | Pass: {item.passing_marks}
              </Text>
              <ChevronRight size={18} color="#94a3b8" />
            </View>
          </TouchableOpacity>
        </Animated.View>
      );
    },
    [navigation, sessionId, sessionName],
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={adminGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
            <ChevronLeft size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Exams</Text>
            <Text style={styles.headerSubtitle}>
              {sessionName || 'Session'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => navigation.navigate('ExamCreate', { sessionId })}
          >
            <Plus size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#059669" />
        </View>
      ) : (
        <FlatList
          data={exams}
          keyExtractor={item => item.public_id}
          renderItem={renderExamCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No Exams Found</Text>
              <Text style={styles.emptyText}>
                Create an exam to get started
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { paddingTop: 60, paddingBottom: 24, paddingHorizontal: 20 },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: { flex: 1, marginLeft: 16 },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#fff' },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: 16, paddingBottom: 100 },
  examCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  examHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  examInfo: { flex: 1 },
  examName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  examSubject: { fontSize: 13, color: '#64748b' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 12, fontWeight: '600' },
  examDetails: { flexDirection: 'row', gap: 16, marginBottom: 12 },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  detailText: { fontSize: 13, color: '#64748b' },
  examFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  marksText: { fontSize: 13, color: '#64748b', fontWeight: '500' },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  emptyText: { fontSize: 14, color: '#64748b' },
});
