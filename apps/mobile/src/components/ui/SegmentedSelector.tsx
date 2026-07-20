import { Colors } from '@educard/shared';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export interface SegmentOption<T extends string = string> {
  value: T;
  label: string;
}

interface SegmentedSelectorProps<T extends string = string> {
  readonly label?: string;
  readonly options: readonly SegmentOption<T>[] | readonly T[];
  readonly value: T;
  readonly onChange: (value: T) => void;
}

export function SegmentedSelector<T extends string = string>({
  label,
  options,
  value,
  onChange,
}: SegmentedSelectorProps<T>) {
  const normalizedOptions: SegmentOption<T>[] = options.map((opt) =>
    typeof opt === 'string'
      ? { value: opt, label: opt.charAt(0).toUpperCase() + opt.slice(1) }
      : opt
  );

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.row}>
        {normalizedOptions.map((opt) => {
          const isActive = value === opt.value;
          return (
            <TouchableOpacity
              key={opt.value}
              onPress={() => onChange(opt.value)}
              style={[styles.option, isActive && styles.optionActive]}
            >
              <Text style={[styles.optionText, isActive && styles.optionTextActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: Colors.gray[700], marginBottom: 8 },
  row: { flexDirection: 'row', gap: 8 },
  option: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.gray[200],
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  optionActive: {
    borderColor: Colors.primary[500],
    backgroundColor: Colors.primary[50],
  },
  optionText: { fontSize: 14, fontWeight: '600', color: Colors.gray[600] },
  optionTextActive: { color: Colors.primary[600] },
});
