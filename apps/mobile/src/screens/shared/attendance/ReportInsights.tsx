import {
  ChevronDown,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Calendar,
  Clock,
  AlertTriangle,
  Award,
  Lightbulb,
  UserX,
  ThumbsUp,
} from 'lucide-react-native';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';

import type { StudentRecord } from '@/features/attendance/api/dashboard-api';
import {
  getHealthColor,
  getHealthLabel,
  getAvatarBgColor,
  getAvatarTextColor,
  getPercentageStyle,
  type AttendanceInsights,
} from '@/features/attendance/utils/attendance-insights';

import { styles } from './styles';

function getHealthIcon(health: string) {
  const color = getHealthColor(health).icon;
  switch (health) {
    case 'excellent':
      return <Award size={28} color={color} />;
    case 'good':
      return <ThumbsUp size={28} color={color} />;
    case 'concern':
      return <AlertTriangle size={28} color={color} />;
    default:
      return <XCircle size={28} color={color} />;
  }
}

interface ReportInsightsProps {
  insights: AttendanceInsights;
  displayStudents: StudentRecord[];
  loadedStudentsCount: number;
  totalStudentsCount: number;
  hasMorePages: boolean;
  isLoadingMore: boolean;
  onLoadMore: () => void;
}

export function ReportInsights({
  insights,
  displayStudents,
  loadedStudentsCount,
  totalStudentsCount,
  hasMorePages,
  isLoadingMore,
  onLoadMore,
}: ReportInsightsProps) {
  const health = getHealthColor(insights.classHealth);

  return (
    <>
      {/* Class Health Overview */}
      <View style={[styles.healthCard, { backgroundColor: health.bg }]}>
        <View style={styles.healthHeader}>
          <View style={styles.healthLeft}>
            {getHealthIcon(insights.classHealth)}
            <View>
              <Text style={[styles.healthTitle, { color: health.text }]}>
                {getHealthLabel(insights.classHealth)}
              </Text>
              <Text style={styles.healthSubtitle}>
                {insights.totalStudents} student
                {insights.totalStudents !== 1 ? 's' : ''} •{' '}
                {insights.totalWorkingDays} working day
                {insights.totalWorkingDays !== 1 ? 's' : ''}
              </Text>
            </View>
          </View>
          <View style={styles.healthPercentage}>
            <Text
              style={[styles.healthPercentageValue, { color: health.text }]}
            >
              {insights.overallPercentage}%
            </Text>
          </View>
        </View>
      </View>

      {/* Quick Insights Grid */}
      <View style={styles.insightsGrid}>
        <View style={[styles.insightBox, styles.insightBoxGreen]}>
          <View style={styles.insightHeader}>
            <CheckCircle2 size={16} color="#16a34a" />
            <Text style={[styles.insightValue, styles.insightValueGreen]}>
              {insights.excellentStudents.length}
            </Text>
          </View>
          <Text style={styles.insightLabel}>≥95% Attendance</Text>
        </View>
        <View style={[styles.insightBox, styles.insightBoxBlue]}>
          <View style={styles.insightHeader}>
            <TrendingUp size={16} color="#2563eb" />
            <Text style={[styles.insightValue, styles.insightValueBlue]}>
              {insights.goodStudents.length}
            </Text>
          </View>
          <Text style={styles.insightLabel}>85-94% Attendance</Text>
        </View>
        <View style={[styles.insightBox, styles.insightBoxAmber]}>
          <View style={styles.insightHeader}>
            <AlertTriangle size={16} color="#d97706" />
            <Text style={[styles.insightValue, styles.insightValueAmber]}>
              {insights.atRiskStudents.length}
            </Text>
          </View>
          <Text style={styles.insightLabel}>75-84% At Risk</Text>
        </View>
        <View style={[styles.insightBox, styles.insightBoxRed]}>
          <View style={styles.insightHeader}>
            <XCircle size={16} color="#dc2626" />
            <Text style={[styles.insightValue, styles.insightValueRed]}>
              {insights.criticalStudents.length}
            </Text>
          </View>
          <Text style={styles.insightLabel}>&lt;75% Critical</Text>
        </View>
      </View>

      {/* Actionable Insights */}
      <View style={styles.actionSection}>
        <View style={styles.actionHeader}>
          <Lightbulb size={18} color="#f59e0b" />
          <Text style={styles.actionTitle}>Action Items</Text>
        </View>

        {insights.perfectAttendance.length > 0 && (
          <View style={styles.actionCard}>
            <View style={[styles.actionIcon, styles.actionIconGreen]}>
              <Award size={20} color="#16a34a" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionCardTitle}>
                🎉 Recognize Perfect Attendance
              </Text>
              <Text style={styles.actionCardDesc}>
                {insights.perfectAttendance.length} student
                {insights.perfectAttendance.length > 1 ? 's have' : ' has'} 100%
                attendance this month
              </Text>
              <View style={styles.actionNames}>
                {insights.perfectAttendance.slice(0, 3).map(s => (
                  <View key={s.student_id} style={styles.nameBadge}>
                    <Text style={styles.nameBadgeText}>
                      {s.student_name.split(' ')[0]}
                    </Text>
                  </View>
                ))}
                {insights.perfectAttendance.length > 3 && (
                  <Text style={styles.moreText}>
                    +{insights.perfectAttendance.length - 3} more
                  </Text>
                )}
              </View>
            </View>
          </View>
        )}

        {insights.criticalStudents.length > 0 && (
          <View style={[styles.actionCard, styles.actionCardBorderRed]}>
            <View style={[styles.actionIcon, styles.actionIconRed]}>
              <UserX size={20} color="#dc2626" />
            </View>
            <View style={styles.actionContent}>
              <Text style={[styles.actionCardTitle, styles.actionCardTitleRed]}>
                ⚠️ Contact Parents Immediately
              </Text>
              <Text style={styles.actionCardDesc}>
                {insights.criticalStudents.length} student
                {insights.criticalStudents.length > 1 ? 's are' : ' is'} below
                75% - intervention needed
              </Text>
              <View style={styles.criticalList}>
                {insights.criticalStudents.slice(0, 3).map(s => (
                  <View key={s.student_id} style={styles.criticalItem}>
                    <Text style={styles.criticalName}>{s.student_name}</Text>
                    <View
                      style={[styles.criticalBadge, styles.criticalBadgeBg]}
                    >
                      <Text style={styles.criticalPercent}>
                        {s.percentage}%
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {insights.highAbsentees.length > 0 && (
          <View style={[styles.actionCard, styles.actionCardBorderAmber]}>
            <View style={[styles.actionIcon, styles.actionIconAmber]}>
              <Calendar size={20} color="#d97706" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionCardTitle}>
                📋 Review High Absentees
              </Text>
              <Text style={styles.actionCardDesc}>
                Students with 3+ absences this month need follow-up
              </Text>
              <View style={styles.absenteeList}>
                {insights.highAbsentees.map(s => (
                  <View key={s.student_id} style={styles.absenteeItem}>
                    <Text style={styles.absenteeName} numberOfLines={1}>
                      {s.student_name}
                    </Text>
                    <View style={styles.absenteeStats}>
                      <XCircle size={12} color="#dc2626" />
                      <Text style={styles.absenteeCount}>{s.absent} days</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {insights.frequentHalfDays.length > 0 && (
          <View style={[styles.actionCard, styles.actionCardBorderTeal]}>
            <View style={[styles.actionIcon, styles.actionIconTeal]}>
              <Clock size={20} color="#0d9488" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionCardTitle}>
                ⏰ Check Late/Early Leaving Patterns
              </Text>
              <Text style={styles.actionCardDesc}>
                {insights.frequentHalfDays.length} student
                {insights.frequentHalfDays.length > 1 ? 's have' : ' has'}{' '}
                multiple half-days
              </Text>
              <View style={styles.halfDayList}>
                {insights.frequentHalfDays.map(s => (
                  <View key={s.student_id} style={styles.halfDayItem}>
                    <Text style={styles.halfDayName} numberOfLines={1}>
                      {s.student_name}
                    </Text>
                    <View style={styles.halfDayBadge}>
                      <Clock size={10} color="#d97706" />
                      <Text style={styles.halfDayCount}>{s.half_day}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {insights.criticalStudents.length === 0 &&
          insights.highAbsentees.length === 0 && (
            <View style={[styles.actionCard, styles.actionCardBorderGreen]}>
              <View style={[styles.actionIcon, styles.actionIconGreen]}>
                <ThumbsUp size={20} color="#16a34a" />
              </View>
              <View style={styles.actionContent}>
                <Text style={styles.actionCardTitle}>✅ Great Job!</Text>
                <Text style={styles.actionCardDesc}>
                  No critical attendance issues found. Keep up the good work!
                </Text>
              </View>
            </View>
          )}
      </View>

      {/* Class Averages Summary */}
      <View style={styles.averagesCard}>
        <Text style={styles.averagesTitle}>Class Averages</Text>
        <View style={styles.averagesRow}>
          <View style={styles.averageItem}>
            <Text style={styles.averageValue}>{insights.avgAbsent}</Text>
            <Text style={styles.averageLabel}>Avg. Absences</Text>
          </View>
          <View style={styles.averageDivider} />
          <View style={styles.averageItem}>
            <Text style={styles.averageValue}>{insights.avgHalfDay}</Text>
            <Text style={styles.averageLabel}>Avg. Half Days</Text>
          </View>
          <View style={styles.averageDivider} />
          <View style={styles.averageItem}>
            <Text style={[styles.averageValue, styles.averageValueTeal]}>
              {insights.overallPercentage}%
            </Text>
            <Text style={styles.averageLabel}>Attendance Rate</Text>
          </View>
        </View>
      </View>

      {/* Student-wise Breakdown */}
      {displayStudents && displayStudents.length > 0 && (
        <View style={styles.studentListCard}>
          <View style={styles.studentListHeader}>
            <View>
              <Text style={styles.studentListTitle}>Student Performance</Text>
              <Text style={styles.studentListSubtitle}>
                Sorted by attendance %
              </Text>
            </View>
            <View style={styles.paginationInfo}>
              <Text style={styles.paginationText}>
                {loadedStudentsCount} of {totalStudentsCount}
              </Text>
            </View>
          </View>
          {[...displayStudents]
            .sort((a, b) => a.percentage - b.percentage)
            .map((student, index) => {
              const avatarBg = getAvatarBgColor(student.percentage);
              const avatarText = getAvatarTextColor(student.percentage);
              const isLast = index === displayStudents.length - 1;
              return (
                <View
                  key={student.student_id}
                  style={[
                    styles.studentRow,
                    !isLast && styles.studentRowBorder,
                  ]}
                >
                  <View style={styles.studentInfo}>
                    <View
                      style={[
                        styles.studentAvatar,
                        { backgroundColor: avatarBg },
                      ]}
                    >
                      <Text
                        style={[
                          styles.studentAvatarText,
                          { color: avatarText },
                        ]}
                      >
                        {student.student_name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.flex1}>
                      <Text style={styles.studentName} numberOfLines={1}>
                        {student.student_name}
                      </Text>
                      <View style={styles.studentMiniStats}>
                        <Text style={styles.miniStatText}>
                          P:{student.present}
                        </Text>
                        <Text style={styles.miniStatText}>
                          A:{student.absent}
                        </Text>
                        <Text style={styles.miniStatText}>
                          H:{student.half_day}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View
                    style={[
                      styles.studentPercentageLarge,
                      getPercentageStyle(student.percentage, styles),
                    ]}
                  >
                    <Text style={styles.studentPercentageTextLarge}>
                      {student.percentage}%
                    </Text>
                  </View>
                </View>
              );
            })}

          {hasMorePages && (
            <TouchableOpacity
              style={styles.loadMoreButton}
              onPress={onLoadMore}
              disabled={isLoadingMore}
              activeOpacity={0.7}
            >
              {isLoadingMore ? (
                <ActivityIndicator size="small" color="#0d9488" />
              ) : (
                <>
                  <Text style={styles.loadMoreText}>
                    Load More ({totalStudentsCount - loadedStudentsCount}{' '}
                    remaining)
                  </Text>
                  <ChevronDown size={18} color="#0d9488" />
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      )}
    </>
  );
}
