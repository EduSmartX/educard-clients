/**
 * Building blocks of the store order screen: numbered steps, radio cards, a picker
 * button and a quantity stepper.
 */
import {
  CheckCircle2,
  ChevronDown,
  Minus,
  Plus,
  type LucideIcon,
} from 'lucide-react-native';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export const ORDER_COLOURS = {
  accent: '#0284c7',
  accentSoft: '#e0f2fe',
  accentText: '#075985',
  success: '#047857',
  successSoft: '#d1fae5',
  warning: '#92400e',
  warningSoft: '#fef3c7',
  border: '#e5e7eb',
  muted: '#6b7280',
  text: '#111827',
};

interface OrderStepProps {
  step: number;
  title: string;
  description?: string;
  complete?: boolean;
  children: React.ReactNode;
}

export function OrderStep({
  step,
  title,
  description,
  complete,
  children,
}: OrderStepProps) {
  return (
    <View style={styles.step}>
      <View style={styles.stepHeader}>
        <View
          style={[styles.stepNumber, complete && styles.stepNumberComplete]}
        >
          {complete ? (
            <CheckCircle2 size={16} color={ORDER_COLOURS.success} />
          ) : (
            <Text style={styles.stepNumberText}>{step}</Text>
          )}
        </View>
        <View style={styles.flex}>
          <Text style={styles.stepTitle}>{title}</Text>
          {description ? (
            <Text style={styles.stepDescription}>{description}</Text>
          ) : null}
        </View>
      </View>
      <View style={styles.stepBody}>{children}</View>
    </View>
  );
}

interface ChoiceCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  selected: boolean;
  onSelect: () => void;
}

export function ChoiceCard({
  icon: Icon,
  title,
  description,
  selected,
  onSelect,
}: ChoiceCardProps) {
  return (
    <TouchableOpacity
      style={[styles.choice, selected && styles.choiceSelected]}
      onPress={onSelect}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      activeOpacity={0.8}
    >
      <View style={[styles.choiceIcon, selected && styles.choiceIconSelected]}>
        <Icon size={18} color={selected ? '#fff' : ORDER_COLOURS.muted} />
      </View>
      <View style={styles.flex}>
        <Text style={styles.choiceTitle}>{title}</Text>
        <Text style={styles.stepDescription}>{description}</Text>
      </View>
    </TouchableOpacity>
  );
}

interface PickerButtonProps {
  label: string;
  placeholder: string;
  onPress: () => void;
  disabled?: boolean;
}

/** Looks like a dropdown; opens a selection sheet. */
export function PickerButton({
  label,
  placeholder,
  onPress,
  disabled,
}: PickerButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.picker, disabled && styles.disabled]}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
    >
      <Text
        style={[styles.pickerText, !label && styles.pickerPlaceholder]}
        numberOfLines={1}
      >
        {label || placeholder}
      </Text>
      <ChevronDown size={18} color={ORDER_COLOURS.muted} />
    </TouchableOpacity>
  );
}

export function QuantityStepper({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <View style={styles.stepper}>
      <TouchableOpacity
        style={styles.stepperButton}
        onPress={() => onChange(Math.max(1, value - 1))}
        accessibilityLabel="Decrease quantity"
      >
        <Minus size={16} color={ORDER_COLOURS.text} />
      </TouchableOpacity>
      <TextInput
        style={styles.stepperInput}
        keyboardType="numeric"
        value={String(value)}
        onChangeText={text => onChange(Math.max(1, Number(text) || 1))}
        accessibilityLabel="Quantity"
      />
      <TouchableOpacity
        style={styles.stepperButton}
        onPress={() => onChange(value + 1)}
        accessibilityLabel="Increase quantity"
      >
        <Plus size={16} color={ORDER_COLOURS.text} />
      </TouchableOpacity>
    </View>
  );
}

export function Notice({
  tone,
  children,
}: {
  tone: 'success' | 'warning';
  children: React.ReactNode;
}) {
  const success = tone === 'success';
  return (
    <View
      style={[
        styles.notice,
        {
          backgroundColor: success
            ? ORDER_COLOURS.successSoft
            : ORDER_COLOURS.warningSoft,
        },
      ]}
    >
      <Text
        style={[
          styles.noticeText,
          { color: success ? ORDER_COLOURS.success : ORDER_COLOURS.warning },
        ]}
      >
        {children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  disabled: { opacity: 0.5 },
  step: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: ORDER_COLOURS.border,
    marginBottom: 14,
    overflow: 'hidden',
  },
  stepHeader: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  stepNumber: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: ORDER_COLOURS.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberComplete: { backgroundColor: ORDER_COLOURS.successSoft },
  stepNumberText: {
    fontSize: 13,
    fontWeight: '700',
    color: ORDER_COLOURS.accentText,
  },
  stepTitle: { fontSize: 15, fontWeight: '700', color: ORDER_COLOURS.text },
  stepDescription: { fontSize: 12, color: ORDER_COLOURS.muted, marginTop: 2 },
  stepBody: { padding: 14, gap: 12 },
  choice: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: ORDER_COLOURS.border,
    borderRadius: 10,
    padding: 12,
  },
  choiceSelected: {
    borderColor: ORDER_COLOURS.accent,
    backgroundColor: '#f0f9ff',
  },
  choiceIcon: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  choiceIconSelected: { backgroundColor: ORDER_COLOURS.accent },
  choiceTitle: { fontSize: 14, fontWeight: '600', color: ORDER_COLOURS.text },
  picker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  pickerText: {
    flex: 1,
    fontSize: 14,
    color: ORDER_COLOURS.text,
    marginRight: 8,
  },
  pickerPlaceholder: { color: '#9ca3af' },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
  },
  stepperButton: { paddingHorizontal: 12, paddingVertical: 9 },
  stepperInput: {
    minWidth: 56,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '600',
    color: ORDER_COLOURS.text,
    paddingVertical: 6,
  },
  notice: { borderRadius: 8, paddingHorizontal: 12, paddingVertical: 9 },
  noticeText: { fontSize: 13 },
});
