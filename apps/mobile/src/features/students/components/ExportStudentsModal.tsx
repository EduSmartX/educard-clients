/**
 * ExportStudentsModal - Export students data with filters
 * Downloads Excel file and optionally sends via email
 */

import { Colors, GENDER_OPTIONS_WITH_ALL, API_CONFIG } from '@educard/shared';
import { LinearGradient } from 'expo-linear-gradient';
import { Download, Mail, X, FileSpreadsheet } from 'lucide-react-native';
import { useState, useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  Switch,
  Pressable,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useClasses } from '@/features/classes/hooks/use-classes';

import { exportStudentsData, type ExportStudentsPayload } from '../api/students-api';

interface ExportStudentsModalProps {
  readonly visible: boolean;
  readonly onClose: () => void;
}

export function ExportStudentsModal({ visible, onClose }: ExportStudentsModalProps) {
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
  const [gender, setGender] = useState<string>('');
  const [searchFilter, setSearchFilter] = useState('');
  const [sendEmail, setSendEmail] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  // Fetch classes for selection
  const { data: classesData } = useClasses({ page_size: API_CONFIG.DROPDOWN_PAGE_SIZE });
  const classes = useMemo(() => classesData?.classes ?? [], [classesData?.classes]);

  const classOptions = useMemo(
    () =>
      classes.map((c) => ({
        value: c.public_id,
        label: `${c.class_master?.name ?? ''} - ${c.name}`.trim(),
      })),
    [classes]
  );

  const resetForm = () => {
    setSelectedClassIds([]);
    setGender('');
    setSearchFilter('');
    setSendEmail(false);
    setEmailInput('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const toggleClass = (classId: string) => {
    setSelectedClassIds((prev) =>
      prev.includes(classId) ? prev.filter((id) => id !== classId) : [...prev, classId]
    );
  };

  const handleExport = async () => {
    if (sendEmail && !emailInput.trim()) {
      Alert.alert('Validation', 'Please enter email addresses for email delivery.');
      return;
    }

    setIsExporting(true);
    try {
      const payload: ExportStudentsPayload = {};

      if (selectedClassIds.length > 0) {
        payload.class_ids = selectedClassIds;
      }
      if (gender) {
        payload.gender = gender;
      }
      if (searchFilter.trim()) {
        payload.search = searchFilter.trim();
      }
      if (sendEmail && emailInput.trim()) {
        payload.send_email = true;
        payload.emails = emailInput
          .split(',')
          .map((e) => e.trim())
          .filter((e) => e.length > 0);
      }

      const result = await exportStudentsData(payload);

      if (result.success) {
        const emailMsg = sendEmail ? ' and email sent' : '';
        Alert.alert('Success', `Export downloaded${emailMsg} successfully!`);
        handleClose();
      } else {
        Alert.alert('Error', result.message || 'Export failed. Please try again.');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Export failed. Please try again.';
      Alert.alert('Error', message);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <Pressable style={styles.overlay} onPress={handleClose}>
        <Pressable style={styles.container} onPress={() => {}}>
          <Animated.View entering={FadeInDown.duration(300)} style={styles.content}>
            {/* Header */}
            <LinearGradient colors={[Colors.accent[600], Colors.accent[500]]} style={styles.header}>
              <View style={styles.headerContent}>
                <View style={styles.headerLeft}>
                  <FileSpreadsheet size={24} color={Colors.text.inverse} />
                  <Text style={styles.headerTitle}>Export Students</Text>
                </View>
                <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
                  <X size={20} color={Colors.text.inverse} />
                </TouchableOpacity>
              </View>
              <Text style={styles.headerSubtitle}>
                Download student data as Excel with optional email delivery
              </Text>
            </LinearGradient>

            <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
              {/* Class Selection */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>📚 Filter by Class (optional)</Text>
                <View style={styles.chipContainer}>
                  {classOptions.map((opt) => {
                    const isSelected = selectedClassIds.includes(opt.value);
                    return (
                      <TouchableOpacity
                        key={opt.value}
                        style={[styles.chip, isSelected && styles.chipSelected]}
                        onPress={() => toggleClass(opt.value)}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                  {classOptions.length === 0 && (
                    <Text style={styles.emptyText}>No classes available</Text>
                  )}
                </View>
                {selectedClassIds.length > 0 && (
                  <Text style={styles.selectionCount}>
                    {selectedClassIds.length} class{selectedClassIds.length > 1 ? 'es' : ''}{' '}
                    selected
                  </Text>
                )}
              </View>

              {/* Gender Selection */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>👤 Filter by Gender (optional)</Text>
                <View style={styles.chipContainer}>
                  {GENDER_OPTIONS_WITH_ALL.map((opt) => {
                    const isSelected = gender === opt.value;
                    return (
                      <TouchableOpacity
                        key={opt.value}
                        style={[styles.chip, isSelected && styles.chipSelected]}
                        onPress={() => setGender(opt.value)}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Search Filter */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>🔍 Search (optional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Filter by name, email, roll no..."
                  placeholderTextColor={Colors.gray[400]}
                  value={searchFilter}
                  onChangeText={setSearchFilter}
                />
              </View>

              {/* Email Toggle */}
              <View style={styles.section}>
                <View style={styles.switchRow}>
                  <View style={styles.switchLabel}>
                    <Mail size={18} color={Colors.primary[600]} />
                    <Text style={styles.switchText}>Send via Email</Text>
                  </View>
                  <Switch
                    value={sendEmail}
                    onValueChange={setSendEmail}
                    trackColor={{ false: Colors.gray[200], true: Colors.primary[200] }}
                    thumbColor={sendEmail ? Colors.primary[600] : Colors.gray[400]}
                  />
                </View>
                {sendEmail && (
                  <View style={styles.emailInputContainer}>
                    <TextInput
                      style={styles.input}
                      placeholder="admin@school.com, teacher@school.com"
                      placeholderTextColor={Colors.gray[400]}
                      value={emailInput}
                      onChangeText={setEmailInput}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      multiline
                    />
                    <Text style={styles.helpText}>
                      Enter emails of admins or teachers in your organization. Separate with commas.
                    </Text>
                  </View>
                )}
              </View>
            </ScrollView>

            {/* Footer Actions */}
            <View style={styles.footer}>
              <TouchableOpacity
                style={[styles.exportBtn, isExporting && styles.exportBtnDisabled]}
                onPress={() => {
                  void handleExport();
                }}
                disabled={isExporting || (sendEmail && !emailInput.trim())}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={
                    isExporting
                      ? [Colors.gray[400], Colors.gray[500]]
                      : [Colors.accent[600], Colors.accent[500]]
                  }
                  style={styles.exportBtnGradient}
                >
                  {isExporting ? (
                    <ActivityIndicator color={Colors.text.inverse} size="small" />
                  ) : sendEmail ? (
                    <Mail size={20} color={Colors.text.inverse} />
                  ) : (
                    <Download size={20} color={Colors.text.inverse} />
                  )}
                  <Text style={styles.exportBtnText}>
                    {isExporting
                      ? 'Exporting...'
                      : sendEmail
                        ? 'Download & Email'
                        : 'Download Excel'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    maxHeight: '85%',
  },
  content: {
    backgroundColor: Colors.background.primary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  header: {
    paddingTop: 20,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text.inverse,
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  closeBtn: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  body: {
    paddingHorizontal: 20,
    paddingTop: 16,
    maxHeight: 400,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.gray[700],
    marginBottom: 10,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.gray[100],
    borderWidth: 1,
    borderColor: Colors.gray[200],
  },
  chipSelected: {
    backgroundColor: Colors.violet[100],
    borderColor: Colors.violet[600],
  },
  chipText: {
    fontSize: 13,
    color: Colors.gray[600],
    fontWeight: '500',
  },
  chipTextSelected: {
    color: Colors.violet[600],
    fontWeight: '600',
  },
  selectionCount: {
    fontSize: 12,
    color: Colors.primary[600],
    marginTop: 8,
    fontWeight: '500',
  },
  emptyText: {
    fontSize: 13,
    color: Colors.gray[400],
    fontStyle: 'italic',
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.gray[200],
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: Colors.gray[800],
    backgroundColor: Colors.gray[50],
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  switchLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  switchText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.gray[700],
  },
  emailInputContainer: {
    marginTop: 12,
  },
  helpText: {
    fontSize: 12,
    color: Colors.gray[400],
    marginTop: 6,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.gray[100],
  },
  exportBtn: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  exportBtnDisabled: {
    opacity: 0.6,
  },
  exportBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  exportBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text.inverse,
  },
});
