/**
 * TimesheetMonthHeader - teal header with month navigation + Calendar/Weekly tabs.
 * Extracted from my-submissions to keep the screen under the 500-line limit.
 */

import { addMonths, format } from 'date-fns';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react-native';
import { View, Text, TouchableOpacity } from 'react-native';

import { styles } from './my-timesheet-styles';

interface TimesheetMonthHeaderProps {
  currentDate: Date;
  activeTab: 'calendar' | 'weeks';
  onBack: () => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
  onSelectTab: (tab: 'calendar' | 'weeks') => void;
}

export function TimesheetMonthHeader({
  currentDate,
  activeTab,
  onBack,
  onPrevMonth,
  onNextMonth,
  onToday,
  onSelectTab,
}: TimesheetMonthHeaderProps) {
  const nextDisabled = addMonths(currentDate, 1) > new Date();
  const calBg = activeTab === 'calendar' ? 'white' : 'transparent';
  const calColor =
    activeTab === 'calendar' ? '#0d9488' : 'rgba(255,255,255,0.8)';
  const weekBg = activeTab === 'weeks' ? 'white' : 'transparent';
  const weekColor = activeTab === 'weeks' ? '#0d9488' : 'rgba(255,255,255,0.8)';

  return (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <ChevronLeft size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Timesheet</Text>
      </View>
      <View style={styles.monthNav}>
        <TouchableOpacity onPress={onPrevMonth} style={styles.navBtn}>
          <ChevronLeft size={20} color="white" />
        </TouchableOpacity>
        <TouchableOpacity onPress={onToday} style={styles.monthLabelBtn}>
          <CalendarDays size={16} color="white" style={styles.monthIcon} />
          <Text style={styles.monthText}>
            {format(currentDate, 'MMMM yyyy')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onNextMonth}
          disabled={nextDisabled}
          style={styles.navBtn}
        >
          <ChevronRight
            size={20}
            color={nextDisabled ? 'rgba(255,255,255,0.4)' : 'white'}
          />
        </TouchableOpacity>
      </View>

      {/* Tab Switcher */}
      <View style={styles.tabSwitcher}>
        <TouchableOpacity
          onPress={() => onSelectTab('calendar')}
          style={[styles.tabBtn, { backgroundColor: calBg }]}
        >
          <Text style={[styles.tabText, { color: calColor }]}>Calendar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => onSelectTab('weeks')}
          style={[styles.tabBtn, { backgroundColor: weekBg }]}
        >
          <Text style={[styles.tabText, { color: weekColor }]}>
            Submit Weekly
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
