/**
 * Homework Detail Screen
 * Displays full homework details with actions.
 */

import {
  Colors,
  getRoleGradient,
  HOMEWORK_PRIORITY_COLORS,
  getStatusLabel,
  HOMEWORK_UI,
} from '@educard/shared';
import {
  useNavigation,
  useRoute,
  type RouteProp,
} from '@react-navigation/native';
import {
  ChevronLeft,
  Edit,
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
import { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { useHomeworkDetail } from '@/features/homework';
import { useAuthStore } from '@/lib/auth-store';
import { LinearGradient } from '@/lib/linear-gradient';
import type {
  SharedStackNavigation,
  SharedStackParamList,
} from '@/navigation/types';
import { headerStyles, layoutStyles } from '@/styles';
import { isAdminRole } from '@/utils/role-utils';

import { styles } from './homework-detail-styles';

const adminGradient = getRoleGradient('admin');

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
  return `${Number.parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export default function HomeworkDetailScreen() {
  const navigation = useNavigation<SharedStackNavigation>();
  const route = useRoute<RouteProp<SharedStackParamList, 'HomeworkDetail'>>();
  const { id } = route.params;
  const { user } = useAuthStore();
  const isAdmin = useMemo(() => isAdminRole(user?.role), [user?.role]);

  const handleBack = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  }, [navigation]);

  const { data: homework, isLoading, error } = useHomeworkDetail(id ?? '');

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
    if (isTeacher) return true;
    return false;
  }, [homework, user, isAdmin, isTeacher]);

  const canViewSubmissions = useMemo(() => {
    if (!homework || !user) return false;
    if (isAdmin) return true;
    if (homework.assigned_by_public_id === user.public_id) return true;
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

  const handleOpenLink = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch {
      // silently fail
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
        <TouchableOpacity style={styles.goBackBtn} onPress={handleBack}>
          <Text style={styles.goBackBtnText}>{HOMEWORK_UI.GO_BACK}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const priorityColor = HOMEWORK_PRIORITY_COLORS[homework.priority];
  const stats = homework.submission_stats;
  const statusBg = getStatusBgColor(homework.status);
  const statusColor = getStatusTextColor(homework.status);

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
            <TouchableOpacity style={headerStyles.backBtn} onPress={handleBack}>
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
                    navigation.navigate('HomeworkEdit', {
                      id: homework.public_id,
                    })
                  }
                >
                  <Edit size={18} color="#fff" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Status & Priority */}
        <Animated.View
          entering={FadeInDown.delay(100)}
          style={styles.statusRow}
        >
          <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>
              {getStatusLabel(homework.status)}
            </Text>
          </View>
          <View
            style={[styles.priorityBadge, { backgroundColor: priorityColor }]}
          >
            <Text style={styles.priorityText}>
              {homework.priority.toUpperCase()}
            </Text>
          </View>
          {!!homework.is_overdue && (
            <View style={styles.overdueBadge}>
              <AlertCircle size={14} color="#fff" />
              <Text style={styles.overdueText}>Overdue</Text>
            </View>
          )}
        </Animated.View>

        {/* Stats Cards */}
        <Animated.View
          entering={FadeInDown.delay(150)}
          style={styles.statsGrid}
        >
          <View style={styles.statCard}>
            <Users size={20} color={Colors.gray[400]} />
            <Text style={styles.statNumber}>{stats.total_students}</Text>
            <Text style={styles.statLabel}>{HOMEWORK_UI.TOTAL_STUDENTS}</Text>
          </View>
          <View style={styles.statCard}>
            <FileText size={20} color="#3b82f6" />
            <Text style={[styles.statNumber, styles.statNumberBlue]}>
              {stats.submitted}
            </Text>
            <Text style={styles.statLabel}>{HOMEWORK_UI.SUBMITTED}</Text>
          </View>
          <View style={styles.statCard}>
            <CheckCircle size={20} color="#10b981" />
            <Text style={[styles.statNumber, styles.statNumberGreen]}>
              {stats.reviewed}
            </Text>
            <Text style={styles.statLabel}>{HOMEWORK_UI.REVIEWED}</Text>
          </View>
          <View style={styles.statCard}>
            <Clock size={20} color="#f59e0b" />
            <Text style={[styles.statNumber, styles.statNumberAmber]}>
              {stats.pending}
            </Text>
            <Text style={styles.statLabel}>{HOMEWORK_UI.PENDING}</Text>
          </View>
        </Animated.View>

        {/* View Submissions Button */}
        {canViewSubmissions && (
          <Animated.View entering={FadeInDown.delay(200)}>
            <TouchableOpacity
              style={styles.viewSubmissionsBtn}
              onPress={() =>
                navigation.navigate('HomeworkSubmissions', {
                  homework_id: homework.public_id,
                })
              }
            >
              <FileText size={20} color="#fff" />
              <Text style={styles.viewSubmissionsBtnText}>
                View Submissions
              </Text>
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
                <Text style={styles.dateValue}>
                  {formatDate(homework.assigned_date)}
                </Text>
              </View>
            </View>
            <View style={styles.dateItem}>
              <Clock
                size={16}
                color={homework.is_overdue ? '#ef4444' : Colors.gray[400]}
              />
              <View>
                <Text style={styles.dateLabel}>Due Date</Text>
                <Text
                  style={[
                    styles.dateValue,
                    homework.is_overdue && styles.dateValueOverdue,
                  ]}
                >
                  {formatDateTime(homework.due_datetime)}
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Description */}
        {!!homework.description && (
          <Animated.View
            entering={FadeInDown.delay(300)}
            style={styles.section}
          >
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.descriptionText}>{homework.description}</Text>
          </Animated.View>
        )}

        {/* Instructions */}
        {!!homework.instructions && (
          <Animated.View
            entering={FadeInDown.delay(350)}
            style={styles.section}
          >
            <Text style={styles.sectionTitle}>Instructions</Text>
            <Text style={styles.descriptionText}>{homework.instructions}</Text>
          </Animated.View>
        )}

        {/* Reference Link */}
        {!!homework.reference_link && (
          <Animated.View
            entering={FadeInDown.delay(400)}
            style={styles.section}
          >
            <Text style={styles.sectionTitle}>Reference</Text>
            <TouchableOpacity
              style={styles.linkCard}
              onPress={() => void handleOpenLink(homework.reference_link)}
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
          <Animated.View
            entering={FadeInDown.delay(450)}
            style={styles.section}
          >
            <Text style={styles.sectionTitle}>
              {HOMEWORK_UI.ATTACHMENTS} ({homework.attachments.length})
            </Text>
            {homework.attachments.map(attachment => (
              <TouchableOpacity
                key={attachment.public_id}
                style={styles.attachmentCard}
                onPress={() => void handleOpenLink(attachment.url)}
              >
                <Paperclip size={16} color={Colors.gray[400]} />
                <View style={styles.attachmentInfo}>
                  <Text style={styles.attachmentName} numberOfLines={1}>
                    {attachment.file_name}
                  </Text>
                  <Text style={styles.attachmentSize}>
                    {formatFileSize(attachment.file_size)}
                  </Text>
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
            <Text style={styles.assignedByName}>
              {homework.assigned_by_name}
            </Text>
          </View>
        </Animated.View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}
