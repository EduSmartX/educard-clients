/**
 * TimesheetSummary - attendance summary card + monthly details grid.
 * Extracted from my-submissions to keep the screen under the 500-line limit.
 */

import { View, Text } from 'react-native';

import { styles } from './my-timesheet-styles';

export interface TimesheetReport {
  totalWorkingDays: number;
  present: number;
  absent: number;
  halfDays: number;
  leave: number;
  holiday: number;
}

export function TimesheetSummary({
  report,
  attendancePercentage,
}: {
  report: TimesheetReport;
  attendancePercentage: number;
}) {
  return (
    <View style={styles.summaryCard}>
      <Text style={styles.sectionLabel}>Attendance Summary</Text>
      <Text style={styles.summaryPct}>{attendancePercentage}% present</Text>
      <View style={styles.progressBar}>
        {report.present > 0 && (
          <View style={[styles.segGreen, { flex: report.present }]} />
        )}
        {report.absent > 0 && (
          <View style={[styles.segRed, { flex: report.absent }]} />
        )}
        {report.leave > 0 && (
          <View style={[styles.segOrange, { flex: report.leave }]} />
        )}
        {report.holiday > 0 && (
          <View style={[styles.segPurple, { flex: report.holiday }]} />
        )}
      </View>
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.dotGreen]} />
          <Text style={styles.legendText}>Present {report.present}</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.dotRed]} />
          <Text style={styles.legendText}>Absent {report.absent}</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.dotOrange]} />
          <Text style={styles.legendText}>Leave {report.leave}</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.dotPurple]} />
          <Text style={styles.legendText}>Holiday {report.holiday}</Text>
        </View>
      </View>
    </View>
  );
}

export function MonthlyDetails({ report }: { report: TimesheetReport }) {
  const detailItems = [
    {
      label: 'Working Days',
      value: report.totalWorkingDays,
      bg: '#f3f4f6',
      text: '#1f2937',
    },
    { label: 'Present', value: report.present, bg: '#dcfce7', text: '#166534' },
    { label: 'Absent', value: report.absent, bg: '#fee2e2', text: '#991b1b' },
    {
      label: 'Half Days',
      value: report.halfDays,
      bg: '#fef3c7',
      text: '#92400e',
    },
    { label: 'Leave', value: report.leave, bg: '#ffedd5', text: '#9a3412' },
    {
      label: 'Holidays',
      value: report.holiday,
      bg: '#f3e8ff',
      text: '#7c3aed',
    },
  ];

  return (
    <View style={styles.detailsCard}>
      <Text style={styles.weeksHeading}>Monthly Details</Text>
      <View style={styles.detailsGrid}>
        {detailItems.map(item => (
          <View key={item.label} style={styles.detailItem}>
            <View style={[styles.detailBox, { backgroundColor: item.bg }]}>
              <Text style={styles.detailLabel}>{item.label}</Text>
              <Text style={[styles.detailValue, { color: item.text }]}>
                {item.value}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}
