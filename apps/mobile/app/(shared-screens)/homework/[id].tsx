/**
 * Homework Detail Screen
 * Displays full homework details with actions
 *
 * Permissions:
 * - View: Admin, Class Teacher, Subject Teacher
 * - Edit/Delete: Admin, Subject Teacher (backend validates actual permissions)
 * - View Submissions: Admin, Assigned teacher, Subject teacher
 */

import {
  Colors,
  getRoleGradient,
  HOMEWORK_PRIORITY_COLORS,
  getStatusLabel,
  getSubmissionStatusLabel,
  HOMEWORK_UI,
} from '@educard/shared';
import type { HomeworkDetail } from '@educard/shared';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ChevronLeft,
  Edit,
  Trash2,
  Calendar,
  Clock,
  Users,
  FileText,
  Link,
  Paperclip,
  CheckCircle,
  AlertCircle,
  ExternalLink,
} from 'lucide-react-native';
import { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { ConfirmDialog } from '@/components/common';
import { useHomeworkDetail, useDeleteHomework } from '@/features/homework';
import { useAuthStore } from '@/lib/auth-store';
import { headerStyles, layoutStyles } from '@/styles';
import { isAdminRole } from '@/utils/role-utils';

const adminGradient = getRoleGradient('admin');

export default function HomeworkDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();
  const isAdmin = useMemo(() => isAdminRole(user?.role), [user?.role]);

  const [deleteTarget, setDeleteTarget] = useState<HomeworkDetail | null>(null);

  const { data: homework, isLoading, error } = useHomeworkDetail(id ?? '');
  const deleteMutation = useDeleteHomework();

  // Check if current user is a teacher (can potentially edit)
  const isTeacher = useMemo(() => {
    if (!user?.role) return false;
    return ['teacher', 'employee'].includes(user.role.toLowerCase());
  }, [user]);

  const canEdit = useMemo(() => {
    if (!homework || !user) {
      return false;
    }
    if (isAdmin) return true;
    if (homework.assigned_by_public_id === user.public_id) return true;
    // Allow any teacher to try editing - backend will validate permissions
    if (isTeacher) return true;
    return false;
  }, [homework, user, isAdmin, isTeacher]);

  const canViewSubmissions = useMemo(() => {
    if (!homework || !user) return false;
    if (isAdmin) return true;
    if (homework.assigned_by_public_id === user.public_id) return true;
    // Allow any teacher to view submissions - backend will validate
    if (isTeacher) return true;
    return false;
  }, [homework, user, isAdmin, isTeacher]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatDateTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleDelete = () => {
    if (!homework) return;
    setDeleteTarget(homework);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.public_id, {
      onSuccess: () => {
        setDeleteTarget(null);
        router.back();
      },
      onError: () => {
        setDeleteTarget(null);
        Alert.alert('Error', 'Failed to delete homework');
      },
    });
  };

  const handleOpenLink = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('Error', 'Could not open link');
    }
  };

  if (isLoading) {
    return (
      <View style={[layoutStyles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={Colors.primary[500]} />
      </View>
    );
  }

  if (error || !homework) {
    return (
      <View style={[layoutStyles.container, styles.centerContent]}>
        <AlertCircle size={48} color={Colors.gray[300]} />
        <Text style={styles.errorText}>Homework not found</Text>
        <TouchableOpacity style={styles.goBackBtn} onPress={() => router.back()}>
          <Text style={styles.goBackBtnText}>{HOMEWORK_UI.GO_BACK}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const priorityColor = HOMEWORK_PRIORITY_COLORS[homework.priority];
  const stats = homework.submission_stats;

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
              <Text style={headerStyles.title} numberOfLines={1}>
                {homework.title}
              </Text>
              <Text style={headerStyles.subtitle}>
                {homework.class_name} • {homework.subject_name}
              </Text>
            </View>
            {canEdit && (
              <View style={styles.headerActions}>
                <TouchableOpacity
                  style={styles.headerBtn}
                  onPress={() =>
                    router.push(`/(shared-screens)/homework/edit?id=${homework.public_id}`)
                  }
                >
                  <Edit size={18} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.headerBtn} onPress={handleDelete}>
                  <Trash2 size={18} color="#fff" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Status & Priority */}
        <Animated.View entering={FadeInDown.delay(100)} style={styles.statusRow}>
          <View
            style={[styles.statusBadge, { backgroundColor: getStatusBgColor(homework.status) }]}
          >
            <Text style={[styles.statusText, { color: getStatusTextColor(homework.status) }]}>
              {getStatusLabel(homework.status)}
            </Text>
          </View>
          <View style={[styles.priorityBadge, { backgroundColor: priorityColor }]}>
            <Text style={styles.priorityText}>{homework.priority.toUpperCase()}</Text>
          </View>
          {homework.is_overdue && (
            <View style={styles.overdueBadge}>
              <AlertCircle size={14} color="#fff" />
              <Text style={styles.overdueText}>Overdue</Text>
            </View>
          )}
        </Animated.View>

        {/* Stats Cards */}
        <Animated.View entering={FadeInDown.delay(150)} style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Users size={20} color={Colors.gray[400]} />
            <Text style={styles.statNumber}>{stats.total_students}</Text>
            <Text style={styles.statLabel}>{HOMEWORK_UI.TOTAL_STUDENTS}</Text>
          </View>
          <View style={styles.statCard}>
            <FileText size={20} color="#3b82f6" />
            <Text style={[styles.statNumber, { color: '#3b82f6' }]}>{stats.submitted}</Text>
            <Text style={styles.statLabel}>{HOMEWORK_UI.SUBMITTED}</Text>
          </View>
          <View style={styles.statCard}>
            <CheckCircle size={20} color="#10b981" />
            <Text style={[styles.statNumber, { color: '#10b981' }]}>{stats.reviewed}</Text>
            <Text style={styles.statLabel}>{HOMEWORK_UI.REVIEWED}</Text>
          </View>
          <View style={styles.statCard}>
            <Clock size={20} color="#f59e0b" />
            <Text style={[styles.statNumber, { color: '#f59e0b' }]}>{stats.pending}</Text>
            <Text style={styles.statLabel}>{HOMEWORK_UI.PENDING}</Text>
          </View>
        </Animated.View>

        {/* View Submissions Button */}
        {canViewSubmissions && (
          <Animated.View entering={FadeInDown.delay(200)}>
            <TouchableOpacity
              style={styles.viewSubmissionsBtn}
              onPress={() =>
                router.push(
                  `/(shared-screens)/homework/submissions?homework_id=${homework.public_id}`
                )
              }
            >
              <FileText size={20} color="#fff" />
              <Text style={styles.viewSubmissionsBtnText}>View Submissions</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Dates */}
        <Animated.View entering={FadeInDown.delay(250)} style={styles.section}>
          <Text style={styles.sectionTitle}>Schedule</Text>
          <View style={styles.dateRow}>
            <View style={styles.dateItem}>
              <Calendar size={16} color={Colors.gray[400]} />
              <View>
                <Text style={styles.dateLabel}>Assigned Date</Text>
                <Text style={styles.dateValue}>{formatDate(homework.assigned_date)}</Text>
              </View>
            </View>
            <View style={styles.dateItem}>
              <Clock size={16} color={homework.is_overdue ? '#ef4444' : Colors.gray[400]} />
              <View>
                <Text style={styles.dateLabel}>Due Date</Text>
                <Text style={[styles.dateValue, homework.is_overdue && { color: '#ef4444' }]}>
                  {formatDateTime(homework.due_datetime)}
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Description */}
        {homework.description && (
          <Animated.View entering={FadeInDown.delay(300)} style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.descriptionText}>{homework.description}</Text>
          </Animated.View>
        )}

        {/* Instructions */}
        {homework.instructions && (
          <Animated.View entering={FadeInDown.delay(350)} style={styles.section}>
            <Text style={styles.sectionTitle}>Instructions</Text>
            <Text style={styles.descriptionText}>{homework.instructions}</Text>
          </Animated.View>
        )}

        {/* Reference Link */}
        {homework.reference_link && (
          <Animated.View entering={FadeInDown.delay(400)} style={styles.section}>
            <Text style={styles.sectionTitle}>Reference</Text>
            <TouchableOpacity
              style={styles.linkCard}
              onPress={() => handleOpenLink(homework.reference_link)}
            >
              <Link size={16} color={Colors.primary[500]} />
              <Text style={styles.linkText} numberOfLines={1}>
                {homework.reference_link}
              </Text>
              <ExternalLink size={14} color={Colors.gray[400]} />
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Attachments */}
        {homework.attachments && homework.attachments.length > 0 && (
          <Animated.View entering={FadeInDown.delay(450)} style={styles.section}>
            <Text style={styles.sectionTitle}>
              {HOMEWORK_UI.ATTACHMENTS} ({homework.attachments.length})
            </Text>
            {homework.attachments.map((attachment) => (
              <TouchableOpacity
                key={attachment.public_id}
                style={styles.attachmentCard}
                onPress={() => handleOpenLink(attachment.url)}
              >
                <Paperclip size={16} color={Colors.gray[400]} />
                <View style={styles.attachmentInfo}>
                  <Text style={styles.attachmentName} numberOfLines={1}>
                    {attachment.file_name}
                  </Text>
                  <Text style={styles.attachmentSize}>{formatFileSize(attachment.file_size)}</Text>
                </View>
                <ExternalLink size={14} color={Colors.gray[400]} />
              </TouchableOpacity>
            ))}
          </Animated.View>
        )}

        {/* Assigned By */}
        <Animated.View entering={FadeInDown.delay(500)} style={styles.section}>
          <Text style={styles.sectionTitle}>Assigned By</Text>
          <View style={styles.assignedByCard}>
            <View style={styles.assignedByAvatar}>
              <Text style={styles.assignedByInitial}>
                {homework.assigned_by_name.charAt(0).toUpperCase()}
              </Text>
            </View>
            <Text style={styles.assignedByName}>{homework.assigned_by_name}</Text>
          </View>
        </Animated.View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Edit FAB */}
      {canEdit && (
        <TouchableOpacity
          style={styles.editFab}
          onPress={() => router.push(`/(shared-screens)/homework/edit?id=${homework.public_id}`)}
        >
          <Edit size={22} color="#fff" />
        </TouchableOpacity>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        visible={!!deleteTarget}
        title="Delete Homework"
        message={`Are you sure you want to delete "${deleteTarget?.title}"? This action cannot be undone.`}
        confirmText="Delete"
        confirmVariant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
        isLoading={deleteMutation.isPending}
      />
    </View>
  );
}

function getStatusBgColor(status: string): string {
  switch (status) {
    case 'published':
      return '#dcfce7';
    case 'draft':
      return '#fef3c7';
    case 'archived':
      return '#f3f4f6';
    default:
      return '#f3f4f6';
  }
}

function getStatusTextColor(status: string): string {
  switch (status) {
    case 'published':
      return '#166534';
    case 'draft':
      return '#92400e';
    case 'archived':
      return '#374151';
    default:
      return '#374151';
  }
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

const styles = StyleSheet.create({
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 15,
    color: Colors.gray[400],
    marginTop: 12,
  },
  goBackBtn: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: Colors.primary[500],
  },
  goBackBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  statusRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  priorityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  overdueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#ef4444',
  },
  overdueText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.gray[800],
    marginTop: 8,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.gray[500],
    marginTop: 2,
    textAlign: 'center',
  },
  viewSubmissionsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary[500],
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 16,
  },
  viewSubmissionsBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.gray[800],
    marginBottom: 10,
  },
  dateRow: {
    flexDirection: 'row',
    gap: 16,
  },
  dateItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 10,
  },
  dateLabel: {
    fontSize: 11,
    color: Colors.gray[400],
  },
  dateValue: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.gray[700],
  },
  descriptionText: {
    fontSize: 14,
    color: Colors.gray[600],
    lineHeight: 22,
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 10,
  },
  linkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 10,
  },
  linkText: {
    flex: 1,
    fontSize: 13,
    color: Colors.primary[500],
  },
  attachmentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 10,
    marginBottom: 8,
  },
  attachmentInfo: {
    flex: 1,
  },
  attachmentName: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.gray[700],
  },
  attachmentSize: {
    fontSize: 11,
    color: Colors.gray[400],
    marginTop: 2,
  },
  assignedByCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 10,
  },
  assignedByAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  assignedByInitial: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary[600],
  },
  assignedByName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.gray[700],
  },
  editFab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
});
