import { Colors } from '@educard/shared';
import { X, Save } from 'lucide-react-native';
import { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
} from 'react-native';

import { FormDropdown } from '@/components/forms';
import {
  useCreateLeaveBalance,
  useUpdateLeaveBalance,
  type LeaveBalance,
  type LeaveAllocationForUser,
} from '@/features/leave';

interface LeaveBalanceFormModalProps {
  visible: boolean;
  mode: 'add' | 'edit';
  balance?: LeaveBalance | null;
  availableAllocations: LeaveAllocationForUser[];
  userId?: string;
  onClose: (success?: boolean) => void;
}

export function LeaveBalanceFormModal({
  visible,
  mode,
  balance,
  availableAllocations,
  userId,
  onClose,
}: LeaveBalanceFormModalProps) {
  const [allocationId, setAllocationId] = useState('');
  const [totalAllocated, setTotalAllocated] = useState('');
  const [carriedForward, setCarriedForward] = useState('');

  const createMutation = useCreateLeaveBalance({
    onSuccess: () => onClose(true),
  });
  const updateMutation = useUpdateLeaveBalance({
    onSuccess: () => onClose(true),
  });
  const isSaving = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (!visible) return;
    if (mode === 'edit' && balance) {
      setAllocationId(balance.leave_allocation.public_id);
      setTotalAllocated(String(balance.total_allocated));
      setCarriedForward(String(balance.carried_forward));
    } else {
      setAllocationId('');
      setTotalAllocated('');
      setCarriedForward('');
    }
  }, [visible, mode, balance]);

  const allocationOptions = useMemo(() => {
    if (mode === 'edit' && balance) {
      return [
        {
          value: balance.leave_allocation.public_id,
          label:
            balance.leave_allocation.display_name ||
            balance.leave_allocation.leave_type_name,
        },
      ];
    }
    return availableAllocations.map(a => ({
      value: a.public_id,
      label: a.display_name || a.leave_type_name,
    }));
  }, [mode, balance, availableAllocations]);

  const handleAllocationChange = (value: string) => {
    setAllocationId(value);
    const picked = availableAllocations.find(a => a.public_id === value);
    if (picked) {
      setTotalAllocated(String(Number(picked.total_days)));
      setCarriedForward(String(Number(picked.max_carry_forward_days)));
    }
  };

  const handleSubmit = () => {
    const total = Number(totalAllocated);
    const carry = Number(carriedForward) || 0;
    if (!allocationId || Number.isNaN(total) || total <= 0) return;

    if (mode === 'edit' && balance) {
      updateMutation.mutate({
        public_id: balance.public_id,
        total_allocated: total,
        carried_forward: carry,
      });
    } else if (userId) {
      createMutation.mutate({
        leave_allocation: allocationId,
        total_allocated: total,
        user: userId,
      });
    }
  };

  const noAllocations = mode === 'add' && availableAllocations.length === 0;
  const canSubmit = !!allocationId && Number(totalAllocated) > 0 && !isSaving;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => onClose()}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>
              {mode === 'edit' ? 'Edit Leave Balance' : 'Add Leave Balance'}
            </Text>
            <TouchableOpacity
              onPress={() => onClose()}
              hitSlop={styles.hitSlop}
            >
              <X size={22} color={Colors.gray[500]} />
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={styles.body}
            keyboardShouldPersistTaps="handled"
          >
            {noAllocations ? (
              <View style={styles.warnBox}>
                <Text style={styles.warnText}>
                  No available leave allocation policies. All policies have been
                  assigned.
                </Text>
              </View>
            ) : (
              <>
                <FormDropdown
                  label="Leave Allocation Policy"
                  placeholder="Select allocation policy"
                  options={allocationOptions}
                  value={allocationId}
                  onChange={handleAllocationChange}
                  required
                  disabled={mode === 'edit'}
                />
                {mode === 'edit' && (
                  <View style={styles.infoBox}>
                    <Text style={styles.infoText}>
                      Leave allocation cannot be changed after creation.
                    </Text>
                  </View>
                )}

                <Text style={styles.fieldLabel}>Total Days Allocated *</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="decimal-pad"
                  placeholder="0"
                  placeholderTextColor={Colors.gray[400]}
                  value={totalAllocated}
                  onChangeText={setTotalAllocated}
                />

                <Text style={styles.fieldLabel}>
                  Maximum Carry Forward Days
                </Text>
                <TextInput
                  style={styles.input}
                  keyboardType="decimal-pad"
                  placeholder="0"
                  placeholderTextColor={Colors.gray[400]}
                  value={carriedForward}
                  onChangeText={setCarriedForward}
                />
              </>
            )}
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => onClose()}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveBtn, !canSubmit && styles.saveDisabled]}
              disabled={!canSubmit}
              onPress={handleSubmit}
            >
              <Save size={16} color="#ffffff" />
              <Text style={styles.saveText}>
                {isSaving ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    maxHeight: '85%',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[100],
  },
  hitSlop: {
    top: 8,
    bottom: 8,
    left: 8,
    right: 8,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.gray[900],
  },
  body: {
    padding: 20,
  },
  warnBox: {
    backgroundColor: Colors.warning[50],
    borderWidth: 1,
    borderColor: Colors.warning[200],
    borderRadius: 12,
    padding: 14,
  },
  warnText: {
    fontSize: 13,
    color: Colors.warning[700],
  },
  infoBox: {
    backgroundColor: Colors.warning[50],
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  infoText: {
    fontSize: 12,
    color: Colors.warning[700],
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.gray[700],
    marginBottom: 6,
    marginTop: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.gray[300],
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.gray[900],
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.gray[100],
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.gray[300],
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.gray[600],
  },
  saveBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: Colors.primary[600],
  },
  saveDisabled: {
    opacity: 0.5,
  },
  saveText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
});
