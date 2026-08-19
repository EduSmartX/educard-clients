/**
 * Exceptional Work Policy Screen - Manage calendar exceptions
 */

import { getRoleGradient, getRoleThemeColors } from '@educard/shared';
import { useNavigation } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import {
  ChevronLeft,
  AlertTriangle,
  Trash2,
  Briefcase,
  PartyPopper,
  Plus,
} from 'lucide-react-native';
import { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';

import {
  FAB as FloatingActionButton,
  ConfirmDialog,
} from '@/components/common';
import { LinearGradient } from '@/lib/linear-gradient';
import { useAuthStore } from '@/lib/auth-store';
import { useToast } from '@/lib/toast-context';
import type { SharedStackNavigation } from '@/navigation/types';
import { isAdminRole, isTeacherRole } from '@/utils/role-utils';
import { useTeacherManagementContext } from '@/features/leave';

import { CreateExceptionModal } from './CreateExceptionModal';
import {
  getCalendarExceptions,
  deleteCalendarException,
  type CalendarException,
} from './exceptional-work-api';
import { styles } from './exceptional-work-styles';

const adminGradient = getRoleGradient('admin');
const adminTheme = getRoleThemeColors('admin');

function ExceptionCard({
  exception,
  onDelete,
  canManage = true,
}: {
  exception: CalendarException;
  onDelete: () => void;
  canManage?: boolean;
}) {
  const isForceWorking = exception.override_type === 'FORCE_WORKING';
  const formattedDate = format(parseISO(exception.date), 'EEEE, dd MMMM yyyy');

  return (
    <View
      style={[
        styles.exceptionCard,
        isForceWorking ? styles.forceWorkingCard : styles.forceHolidayCard,
      ]}
    >
      <View style={styles.exceptionCardHeader}>
        <View
          style={[
            styles.exceptionIcon,
            isForceWorking ? styles.forceWorkingIcon : styles.forceHolidayIcon,
          ]}
        >
          {isForceWorking ? (
            <Briefcase size={18} color="#0d9488" />
          ) : (
            <PartyPopper size={18} color="#dc2626" />
          )}
        </View>
        <View style={styles.exceptionInfo}>
          <Text style={styles.exceptionDate}>{formattedDate}</Text>
          <View
            style={[
              styles.exceptionTypeBadge,
              isForceWorking
                ? styles.forceWorkingBadge
                : styles.forceHolidayBadge,
            ]}
          >
            <Text
              style={[
                styles.exceptionTypeText,
                isForceWorking
                  ? styles.forceWorkingText
                  : styles.forceHolidayText,
              ]}
            >
              {isForceWorking ? 'Force Working Day' : 'Force Holiday'}
            </Text>
          </View>
        </View>
        {canManage && (
          <TouchableOpacity onPress={onDelete} style={styles.deleteButton}>
            <Trash2 size={18} color="#dc2626" />
          </TouchableOpacity>
        )}
      </View>
      {!!exception.reason && (
        <View style={styles.exceptionReason}>
          <Text style={styles.exceptionReasonLabel}>Reason:</Text>
          <Text style={styles.exceptionReasonText}>{exception.reason}</Text>
        </View>
      )}
      <View style={styles.exceptionMeta}>
        <Text style={styles.exceptionMetaText}>
          {exception.is_applicable_to_all_classes
            ? 'Applies to all classes'
            : `${exception.classes?.length || 0} class(es)`}
        </Text>
        <Text style={styles.exceptionMetaText}>
          Created: {format(parseISO(exception.created_at), 'dd MMM yyyy')}
        </Text>
      </View>
    </View>
  );
}

export default function ExceptionalWorkScreen() {
  const navigation = useNavigation<SharedStackNavigation>();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CalendarException | null>(
    null,
  );

  const { user } = useAuthStore();
  const isAdmin = useMemo(() => isAdminRole(user?.role), [user?.role]);
  const isTeacher = useMemo(() => isTeacherRole(user?.role), [user?.role]);
  const { data: teacherContext } = useTeacherManagementContext(isTeacher);

  // Teachers can only manage exceptions for classes they are the class teacher of
  const isClassTeacher =
    isTeacher && (teacherContext?.class_teacher_for?.length ?? 0) > 0;
  const canManage = isAdmin || isClassTeacher;
  const canManageException = useCallback(
    (exception: CalendarException) =>
      isAdmin ||
      (isClassTeacher && exception.created_by_public_id === user?.public_id),
    [isAdmin, isClassTeacher, user?.public_id],
  );

  const handleBack = useCallback(() => {
    if (navigation.canGoBack()) navigation.goBack();
  }, [navigation]);

  const {
    data: exceptions,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['calendar-exceptions'],
    queryFn: getCalendarExceptions,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCalendarException,
    onSuccess: () => {
      showToast({
        type: 'success',
        title: 'Deleted',
        message: 'Exception deleted successfully',
      });
      setDeleteTarget(null);
      void refetch();
    },
    onError: () => {
      showToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to delete exception',
      });
      setDeleteTarget(null);
    },
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const forceWorkingDays =
    exceptions?.filter(e => e.override_type === 'FORCE_WORKING') || [];
  const forceHolidays =
    exceptions?.filter(e => e.override_type === 'FORCE_HOLIDAY') || [];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={adminGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <ChevronLeft size={24} color="white" />
            </TouchableOpacity>
            <View>
              <Text style={styles.headerTitle}>Exceptional Work Policy</Text>
              <Text style={styles.headerSubtitle}>
                {canManage
                  ? 'Manage calendar exceptions'
                  : 'View calendar exceptions'}
              </Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void handleRefresh()}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.infoCard}>
          <AlertTriangle size={20} color={adminTheme.accent} />
          <View style={styles.infoText}>
            <Text style={styles.infoBullet}>
              • Force Working: Override a holiday or weekend to make it a
              working day.
            </Text>
            <Text style={styles.infoBullet}>
              • Force Holiday: Override a working day to make it a holiday.
            </Text>
          </View>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={adminTheme.accent} />
            <Text style={styles.loadingText}>Loading exceptions...</Text>
          </View>
        ) : (
          <>
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionHeaderLeft}>
                  <Briefcase size={18} color="#0d9488" />
                  <Text style={styles.sectionTitle}>Force Working Days</Text>
                </View>
                <View style={styles.sectionCount}>
                  <Text style={styles.sectionCountText}>
                    {forceWorkingDays.length}
                  </Text>
                </View>
              </View>
              {forceWorkingDays.length === 0 ? (
                <View style={styles.emptySection}>
                  <Text style={styles.emptySectionText}>
                    No force working days
                  </Text>
                </View>
              ) : (
                forceWorkingDays.map(exception => (
                  <ExceptionCard
                    key={exception.public_id}
                    exception={exception}
                    onDelete={() => setDeleteTarget(exception)}
                    canManage={canManageException(exception)}
                  />
                ))
              )}
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionHeaderLeft}>
                  <PartyPopper size={18} color="#dc2626" />
                  <Text style={styles.sectionTitle}>Force Holidays</Text>
                </View>
                <View style={styles.sectionCount}>
                  <Text style={styles.sectionCountText}>
                    {forceHolidays.length}
                  </Text>
                </View>
              </View>
              {forceHolidays.length === 0 ? (
                <View style={styles.emptySection}>
                  <Text style={styles.emptySectionText}>No force holidays</Text>
                </View>
              ) : (
                forceHolidays.map(exception => (
                  <ExceptionCard
                    key={exception.public_id}
                    exception={exception}
                    onDelete={() => setDeleteTarget(exception)}
                    canManage={canManageException(exception)}
                  />
                ))
              )}
            </View>
          </>
        )}
      </ScrollView>

      {canManage && (
        <FloatingActionButton
          onPress={() => setShowCreateModal(true)}
          icon={Plus}
          color={adminTheme.accent}
        />
      )}

      <CreateExceptionModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        classScopedOnly={!isAdmin}
        onSuccess={() =>
          void queryClient.invalidateQueries({
            queryKey: ['calendar-exceptions'],
          })
        }
      />

      <ConfirmDialog
        visible={!!deleteTarget}
        title="Delete Exception"
        message={
          deleteTarget
            ? `Are you sure you want to delete the exception for ${format(parseISO(deleteTarget.date), 'dd MMM yyyy')}?`
            : ''
        }
        confirmText="Delete"
        onConfirm={() => {
          if (deleteTarget) deleteMutation.mutate(deleteTarget.public_id);
        }}
        onCancel={() => setDeleteTarget(null)}
        confirmVariant="danger"
        isLoading={deleteMutation.isPending}
      />
    </View>
  );
}
