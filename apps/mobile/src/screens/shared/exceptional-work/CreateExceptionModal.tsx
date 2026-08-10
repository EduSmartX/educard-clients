import { extractApiError } from '@educard/shared';
import { useMutation } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  X,
  Calendar,
  Briefcase,
  PartyPopper,
  Check,
  Plus,
} from 'lucide-react-native';
import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Switch,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';

import { useClasses } from '@/features/classes';
import { useToast } from '@/lib/toast-context';

import { DatePickerModal } from './DatePickerModal';
import { createCalendarException } from './exceptional-work-api';
import { modalStyles } from './exceptional-work-styles';
import { KeyboardAwareScrollView } from '@/lib/keyboard-aware-scroll-view';

type ClassOption = { public_id: string; display_name?: string; name?: string };

function ClassSelectionGrid({
  classes,
  selectedClasses,
  onToggle,
}: Readonly<{
  classes: ClassOption[];
  selectedClasses: string[];
  onToggle: (classId: string) => void;
}>) {
  return (
    <View style={modalStyles.field}>
      <Text style={modalStyles.fieldLabel}>Select Classes *</Text>
      <View style={modalStyles.classesGrid}>
        {classes.length === 0 ? (
          <Text style={modalStyles.noClassesText}>No classes available</Text>
        ) : (
          classes.map(cls => (
            <TouchableOpacity
              key={cls.public_id}
              style={[
                modalStyles.classChip,
                selectedClasses.includes(cls.public_id) &&
                  modalStyles.classChipSelected,
              ]}
              onPress={() => onToggle(cls.public_id)}
            >
              <Text
                style={[
                  modalStyles.classChipText,
                  selectedClasses.includes(cls.public_id) &&
                    modalStyles.classChipTextSelected,
                ]}
              >
                {cls.display_name || cls.name}
              </Text>
              {selectedClasses.includes(cls.public_id) && (
                <Check size={14} color="#0d9488" />
              )}
            </TouchableOpacity>
          ))
        )}
      </View>
    </View>
  );
}

interface CreateExceptionModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateExceptionModal({
  visible,
  onClose,
  onSuccess,
}: CreateExceptionModalProps) {
  const { showToast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [overrideType, setOverrideType] = useState<
    'FORCE_WORKING' | 'FORCE_HOLIDAY'
  >('FORCE_WORKING');
  const [reason, setReason] = useState('');
  const [isAllClasses, setIsAllClasses] = useState(true);
  const [isAllTeachers, setIsAllTeachers] = useState(true);
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);

  const { data: classesData } = useClasses({ is_active: true });
  const classes = classesData?.classes || [];

  const createMutation = useMutation({
    mutationFn: createCalendarException,
    onSuccess: () => {
      showToast({
        type: 'success',
        title: 'Success',
        message: 'Exception created successfully',
      });
      resetForm();
      onSuccess();
      onClose();
    },
    onError: (error: unknown) => {
      showToast({
        type: 'error',
        title: 'Error',
        message: extractApiError(error, 'Failed to create exception'),
      });
    },
  });

  const resetForm = () => {
    setSelectedDate(null);
    setOverrideType('FORCE_WORKING');
    setReason('');
    setIsAllClasses(true);
    setIsAllTeachers(true);
    setSelectedClasses([]);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = () => {
    if (!selectedDate) {
      Alert.alert('Error', 'Please select a date');
      return;
    }
    if (!reason.trim()) {
      Alert.alert('Error', 'Please enter a reason');
      return;
    }
    if (!isAllClasses && selectedClasses.length === 0) {
      Alert.alert('Error', 'Please select at least one class');
      return;
    }
    createMutation.mutate({
      date: format(selectedDate, 'yyyy-MM-dd'),
      override_type: overrideType,
      reason: reason.trim(),
      is_applicable_to_all_classes: isAllClasses,
      is_applicable_to_all_teachers: isAllTeachers,
      classes: isAllClasses ? [] : selectedClasses,
    });
  };

  const toggleClassSelection = (classId: string) => {
    setSelectedClasses(prev =>
      prev.includes(classId)
        ? prev.filter(id => id !== classId)
        : [...prev, classId],
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={modalStyles.overlay}>
        <View style={modalStyles.container}>
          <View style={modalStyles.header}>
            <Text style={modalStyles.title}>Add Exception</Text>
            <TouchableOpacity onPress={handleClose}>
              <X size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <KeyboardAwareScrollView
            style={modalStyles.body}
            showsVerticalScrollIndicator={false}
          >
            <View style={modalStyles.field}>
              <Text style={modalStyles.fieldLabel}>Date *</Text>
              <TouchableOpacity
                style={modalStyles.dateButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Calendar size={18} color="#6b7280" />
                <Text
                  style={[
                    modalStyles.dateButtonText,
                    !selectedDate && modalStyles.dateButtonPlaceholder,
                  ]}
                >
                  {selectedDate
                    ? format(selectedDate, 'EEEE, dd MMMM yyyy')
                    : 'Select date'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={modalStyles.field}>
              <Text style={modalStyles.fieldLabel}>Exception Type *</Text>
              <View style={modalStyles.typeSelector}>
                <TouchableOpacity
                  style={[
                    modalStyles.typeOption,
                    overrideType === 'FORCE_WORKING' &&
                      modalStyles.typeOptionSelectedWorking,
                  ]}
                  onPress={() => setOverrideType('FORCE_WORKING')}
                >
                  <Briefcase
                    size={18}
                    color={
                      overrideType === 'FORCE_WORKING' ? '#0d9488' : '#9ca3af'
                    }
                  />
                  <Text
                    style={[
                      modalStyles.typeOptionText,
                      overrideType === 'FORCE_WORKING' &&
                        modalStyles.typeOptionTextWorking,
                    ]}
                  >
                    Force Working Day
                  </Text>
                  {overrideType === 'FORCE_WORKING' && (
                    <Check size={16} color="#0d9488" />
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    modalStyles.typeOption,
                    overrideType === 'FORCE_HOLIDAY' &&
                      modalStyles.typeOptionSelectedHoliday,
                  ]}
                  onPress={() => setOverrideType('FORCE_HOLIDAY')}
                >
                  <PartyPopper
                    size={18}
                    color={
                      overrideType === 'FORCE_HOLIDAY' ? '#dc2626' : '#9ca3af'
                    }
                  />
                  <Text
                    style={[
                      modalStyles.typeOptionText,
                      overrideType === 'FORCE_HOLIDAY' &&
                        modalStyles.typeOptionTextHoliday,
                    ]}
                  >
                    Force Holiday
                  </Text>
                  {overrideType === 'FORCE_HOLIDAY' && (
                    <Check size={16} color="#dc2626" />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <View style={modalStyles.field}>
              <Text style={modalStyles.fieldLabel}>Reason *</Text>
              <TextInput
                style={modalStyles.textInput}
                placeholder="Enter reason for this exception"
                placeholderTextColor="#9ca3af"
                value={reason}
                onChangeText={setReason}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            <View style={modalStyles.field}>
              <View style={modalStyles.switchRow}>
                <Text style={modalStyles.fieldLabel}>Apply to All Classes</Text>
                <Switch
                  value={isAllClasses}
                  onValueChange={setIsAllClasses}
                  trackColor={{ false: '#e5e7eb', true: '#99f6e4' }}
                  thumbColor={isAllClasses ? '#0d9488' : '#9ca3af'}
                />
              </View>
              <Text style={modalStyles.switchHint}>
                {isAllClasses
                  ? 'This exception will apply to all classes in the organization.'
                  : 'Select specific classes this exception applies to.'}
              </Text>
            </View>

            <View style={modalStyles.field}>
              <View style={modalStyles.switchRow}>
                <Text style={modalStyles.fieldLabel}>
                  Apply to All Teachers
                </Text>
                <Switch
                  value={isAllTeachers}
                  onValueChange={setIsAllTeachers}
                  trackColor={{ false: '#e5e7eb', true: '#99f6e4' }}
                  thumbColor={isAllTeachers ? '#0d9488' : '#9ca3af'}
                />
              </View>
              <Text style={modalStyles.switchHint}>
                {isAllTeachers
                  ? 'This exception will apply to all teachers/staff in the organization.'
                  : 'This exception will not apply to teachers/staff attendance.'}
              </Text>
            </View>

            {!isAllClasses && (
              <ClassSelectionGrid
                classes={classes}
                selectedClasses={selectedClasses}
                onToggle={toggleClassSelection}
              />
            )}
          </KeyboardAwareScrollView>

          <View style={modalStyles.actions}>
            <TouchableOpacity
              style={modalStyles.cancelActionButton}
              onPress={handleClose}
            >
              <Text style={modalStyles.cancelActionText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                modalStyles.submitButton,
                overrideType === 'FORCE_WORKING'
                  ? modalStyles.submitButtonWorking
                  : modalStyles.submitButtonHoliday,
                createMutation.isPending && modalStyles.dimmed,
              ]}
              onPress={handleSubmit}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <Plus size={18} color="white" />
                  <Text style={modalStyles.submitButtonText}>
                    Create Exception
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <DatePickerModal
        visible={showDatePicker}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        onClose={() => setShowDatePicker(false)}
      />
    </Modal>
  );
}
