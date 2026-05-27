/**
 * Exam Sessions Screen
 */
/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any, @typescript-eslint/no-misused-promises */

import { getRoleGradient } from '@educard/shared';
import { EXAM_SESSION_TYPE_LABELS, type ExamSession } from '@educard/shared';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  BookOpen,
  Plus,
  Pencil,
  Trash2,
} from 'lucide-react-native';
import { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { useExamSessions, useDeleteExamSession } from '@/features/exams';
import { headerStyles, layoutStyles } from '@/styles';

const adminGradient = getRoleGradient('admin');

const SESSION_TYPE_COLORS: Record<string, { bg: string; text: string; icon: string }> = {
  unit_test: { bg: '#eff6ff', text: '#2563eb', icon: '#3b82f6' },
  quarterly: { bg: '#f0fdf4', text: '#16a34a', icon: '#22c55e' },
  half_yearly: { bg: '#fef3c7', text: '#d97706', icon: '#f59e0b' },
  annual: { bg: '#fae8ff', text: '#9333ea', icon: '#a855f7' },
  custom: { bg: '#f1f5f9', text: '#475569', icon: '#64748b' },
};

function formatDate(d: string | null): string {
  if (!d) return '—';
  const date = new Date(d);
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function ExamSessionsScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  const { data, isLoading, refetch } = useExamSessions({ page_size: 50 });
  const deleteSession = useDeleteExamSession();
  const sessions: ExamSession[] = data?.data ?? [];

  const onRefresh = () => {
    setRefreshing(true);
    void refetch().finally(() => setRefreshing(false));
  };

  const handleDelete = (session: ExamSession) => {
    Alert.alert(
      'Delete Session',
      `Are you sure you want to delete "${session.name}"? This will also delete all exams and marks in this session.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteSession.mutate(session.public_id),
        },
      ]
    );
  };

  const renderSession = ({ item, index }: { item: ExamSession; index: number }) => {
    const typeColor = SESSION_TYPE_COLORS[item.session_type] || SESSION_TYPE_COLORS.custom;

    return (
      <Animated.View
        entering={FadeInDown.delay(index * 60)
          .springify()
          .damping(18)}
      >
        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.7}
          onPress={() =>
            router.push(
              `/(shared-screens)/exams/dashboard?sessionId=${item.public_id}&sessionName=${encodeURIComponent(item.name)}` as any
            )
          }
        >
          <View style={styles.cardHeader}>
            <View style={[styles.typeBadge, { backgroundColor: typeColor.bg }]}>
              <Text style={[styles.typeText, { color: typeColor.text }]}>
                {EXAM_SESSION_TYPE_LABELS[item.session_type] || item.session_type}
              </Text>
            </View>
            <View style={styles.examCountBadge}>
              <BookOpen size={12} color="#7c3aed" />
              <Text style={styles.examCountText}>{item.exam_count} exams</Text>
            </View>
          </View>

          <Text style={styles.sessionName}>{item.name}</Text>
          {item.description ? (
            <Text style={styles.sessionDesc} numberOfLines={2}>
              {item.description}
            </Text>
          ) : null}

          <View style={styles.cardFooter}>
            <View style={styles.dateRow}>
              <Calendar size={13} color="#94a3b8" />
              <Text style={styles.dateText}>
                {formatDate(item.start_date)} – {formatDate(item.end_date)}
              </Text>
            </View>
            <Text style={styles.yearText}>{item.academic_year}</Text>
          </View>

          <View style={styles.chevron}>
            <TouchableOpacity
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              onPress={(e) => {
                e.stopPropagation?.();
                handleDelete(item);
              }}
              style={styles.deleteBtn}
            >
              <Trash2 size={14} color="#ef4444" />
            </TouchableOpacity>
            <TouchableOpacity
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              onPress={(e) => {
                e.stopPropagation?.();
                router.push(
                  `/(shared-screens)/exams/edit-session?sessionId=${item.public_id}` as any
                );
              }}
              style={styles.editBtn}
            >
              <Pencil size={14} color="#7c3aed" />
            </TouchableOpacity>
            <ChevronRight size={18} color="#cbd5e1" />
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

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
              <Text style={headerStyles.title}>Exam Sessions</Text>
              <Text style={headerStyles.subtitle}>{sessions.length} sessions</Text>
            </View>
            <TouchableOpacity
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                backgroundColor: 'rgba(255,255,255,0.2)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onPress={() => router.push('/(shared-screens)/exams/create-session')}
            >
              <Plus size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      {isLoading && !refreshing && (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#7c3aed" />
          <Text style={styles.loadingText}>Loading sessions...</Text>
        </View>
      )}
      {!(isLoading && !refreshing) && sessions.length === 0 && (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>📝</Text>
          <Text style={styles.emptyTitle}>No Exam Sessions</Text>
          <Text style={styles.emptySubtitle}>Tap + to create your first exam session</Text>
        </View>
      )}
      {!(isLoading && !refreshing) && sessions.length > 0 && (
        <FlatList
          data={sessions}
          renderItem={renderSession}
          keyExtractor={(item) => item.public_id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#7c3aed']} />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { padding: 16, paddingBottom: 40 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  typeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  typeText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  examCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f5f3ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  examCountText: { fontSize: 12, fontWeight: '600', color: '#7c3aed' },
  sessionName: { fontSize: 17, fontWeight: '700', color: '#1e293b', marginBottom: 4 },
  sessionDesc: { fontSize: 13, color: '#64748b', marginBottom: 10, lineHeight: 18 },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dateText: { fontSize: 12, color: '#94a3b8' },
  yearText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7c3aed',
    backgroundColor: '#f5f3ff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  chevron: {
    position: 'absolute',
    right: 16,
    top: '50%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editBtn: { padding: 6, borderRadius: 8, backgroundColor: '#f3f0ff' },
  deleteBtn: { padding: 6, borderRadius: 8, backgroundColor: '#fef2f2' },

  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { fontSize: 14, color: '#64748b', marginTop: 12 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#334155' },
  emptySubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    paddingHorizontal: 32,
    marginTop: 6,
  },
});
