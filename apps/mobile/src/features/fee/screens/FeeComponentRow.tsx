import { COMPONENT_TYPE_OPTIONS } from '@educard/shared';
import { Trash2 } from 'lucide-react-native';
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { FormDropdown } from '@/components/forms/FormDropdown';
import { FormInput } from '@/components/forms/FormInput';

import type { ComponentRow } from './fee-structure-form-utils';
import { styles } from './fee-structure-form-styles';

interface FeeComponentRowProps {
  comp: ComponentRow;
  index: number;
  canRemove: boolean;
  onUpdate: (key: string, field: keyof ComponentRow, value: string) => void;
  onRemove: (key: string) => void;
}

export function FeeComponentRow({
  comp,
  index,
  canRemove,
  onUpdate,
  onRemove,
}: FeeComponentRowProps) {
  return (
    <Animated.View
      entering={FadeInDown.delay(index * 50)}
      style={styles.componentRow}
    >
      <View style={styles.compIndex}>
        <Text style={styles.compIndexText}>{index + 1}</Text>
      </View>
      <View style={styles.compFields}>
        <FormInput
          label="Component Name"
          value={comp.name}
          onChangeText={v => onUpdate(comp.key, 'name', v)}
          placeholder="e.g. Tuition Fee"
        />
        <View style={styles.compRow}>
          <View style={styles.flex1}>
            <FormInput
              label="Amount (₹)"
              value={comp.amount}
              onChangeText={v => onUpdate(comp.key, 'amount', v)}
              placeholder="0.00"
              keyboardType="decimal-pad"
            />
          </View>
          <View style={styles.flex1}>
            <FormDropdown
              label="Type"
              options={[...COMPONENT_TYPE_OPTIONS]}
              value={comp.component_type}
              onChange={v => onUpdate(comp.key, 'component_type', v)}
            />
          </View>
        </View>
      </View>
      {canRemove && (
        <TouchableOpacity
          style={styles.removeCompBtn}
          onPress={() => onRemove(comp.key)}
        >
          <Trash2 size={16} color="#dc2626" />
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}
