import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isToday,
  isSameDay,
  addMonths,
  subMonths,
} from 'date-fns';
import { ChevronLeft, ChevronRight, X } from 'lucide-react-native';
import { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';

import { modalStyles } from './exceptional-work-styles';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

interface DatePickerModalProps {
  visible: boolean;
  selectedDate: Date | null;
  onSelectDate: (date: Date) => void;
  onClose: () => void;
}

export function DatePickerModal({
  visible,
  selectedDate,
  onSelectDate,
  onClose,
}: DatePickerModalProps) {
  const [viewDate, setViewDate] = useState(selectedDate || new Date());

  const monthStart = useMemo(() => startOfMonth(viewDate), [viewDate]);
  const monthEnd = useMemo(() => endOfMonth(viewDate), [viewDate]);
  const monthDays = useMemo(
    () => eachDayOfInterval({ start: monthStart, end: monthEnd }),
    [monthStart, monthEnd],
  );
  const leadingEmptyDays = useMemo(
    () => Array.from({ length: monthStart.getDay() }),
    [monthStart],
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={modalStyles.overlay}>
        <View style={modalStyles.datePickerContainer}>
          <View style={modalStyles.datePickerHeader}>
            <Text style={modalStyles.datePickerTitle}>Select Date</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <View style={modalStyles.monthNavigation}>
            <TouchableOpacity
              onPress={() => setViewDate(subMonths(viewDate, 1))}
              style={modalStyles.monthNavButton}
            >
              <ChevronLeft size={20} color="#374151" />
            </TouchableOpacity>
            <Text style={modalStyles.monthLabel}>
              {format(viewDate, 'MMMM yyyy')}
            </Text>
            <TouchableOpacity
              onPress={() => setViewDate(addMonths(viewDate, 1))}
              style={modalStyles.monthNavButton}
            >
              <ChevronRight size={20} color="#374151" />
            </TouchableOpacity>
          </View>

          <View style={modalStyles.weekdaysRow}>
            {WEEKDAYS.map((day, i) => (
              <View key={`${day}-${i}`} style={modalStyles.weekdayCell}>
                <Text
                  style={[
                    modalStyles.weekdayText,
                    i === 0 && modalStyles.weekdaySunday,
                  ]}
                >
                  {day}
                </Text>
              </View>
            ))}
          </View>

          <View style={modalStyles.daysGrid}>
            {leadingEmptyDays.map((_, i) => (
              <View
                key={`empty-${format(viewDate, 'yyyy-MM')}-${i}`}
                style={modalStyles.dayCell}
              />
            ))}
            {monthDays.map(date => {
              const isSelected = selectedDate && isSameDay(date, selectedDate);
              const isTodayDate = isToday(date);
              const dateKey = format(date, 'yyyy-MM-dd');
              return (
                <TouchableOpacity
                  key={`day-${dateKey}`}
                  style={[
                    modalStyles.dayCell,
                    isSelected && modalStyles.selectedDayCell,
                    isTodayDate && !isSelected && modalStyles.todayCell,
                  ]}
                  onPress={() => {
                    onSelectDate(date);
                    onClose();
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      modalStyles.dayText,
                      isSelected && modalStyles.selectedDayText,
                      isTodayDate && !isSelected && modalStyles.todayText,
                    ]}
                  >
                    {format(date, 'd')}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity style={modalStyles.cancelButton} onPress={onClose}>
            <Text style={modalStyles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
