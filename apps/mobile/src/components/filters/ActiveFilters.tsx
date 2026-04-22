/**
 * Active Filters Display Component
 * Shows active filters as dismissible chips
 */

import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { X } from 'lucide-react-native';

interface ActiveFilter {
  key: string;
  label: string;
  value: any;
}

interface ActiveFiltersProps {
  filters: ActiveFilter[];
  onRemove: (key: string) => void;
  onClearAll: () => void;
}

export function ActiveFilters({ filters, onRemove, onClearAll }: ActiveFiltersProps) {
  if (filters.length === 0) return null;

  return (
    <Animated.View entering={FadeInDown.delay(100)} style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {filters.map((filter) => (
          <View key={filter.key} style={styles.chip}>
            <Text style={styles.chipText}>{filter.label}</Text>
            <TouchableOpacity onPress={() => onRemove(filter.key)}>
              <X size={14} color="#6366f1" />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
      <TouchableOpacity onPress={onClearAll} style={styles.clearAllBtn}>
        <Text style={styles.clearAllText}>Clear all</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    marginRight: 8,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6366f1',
  },
  clearAllBtn: {
    paddingHorizontal: 8,
  },
  clearAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ef4444',
  },
});
