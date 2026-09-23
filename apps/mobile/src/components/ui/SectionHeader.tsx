/**
 * SectionHeader
 * Title (optional icon) with an optional right-aligned action link.
 */

import { ChevronRight, type LucideIcon } from 'lucide-react-native';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

import { colors } from '@/constants/colors';

export interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  actionLabel?: string;
  onAction?: () => void;
}

export function SectionHeader({
  title,
  subtitle,
  icon: Icon,
  actionLabel,
  onAction,
}: SectionHeaderProps) {
  return (
    <View style={styles.row}>
      <View style={styles.left}>
        {Icon && (
          <View style={styles.iconWrap}>
            <Icon size={16} color={colors.primary[600]} strokeWidth={2.5} />
          </View>
        )}
        <View style={styles.textCol}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
      </View>
      {actionLabel && onAction ? (
        <TouchableOpacity style={styles.action} onPress={onAction} activeOpacity={0.7}>
          <Text style={styles.actionText}>{actionLabel}</Text>
          <ChevronRight size={16} color={colors.primary[600]} strokeWidth={2.5} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  left: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  textCol: { flex: 1 },
  title: { fontSize: 17, fontWeight: '700', color: colors.text.primary },
  subtitle: { fontSize: 12, color: colors.text.secondary, marginTop: 1 },
  action: { flexDirection: 'row', alignItems: 'center' },
  actionText: { fontSize: 13, fontWeight: '600', color: colors.primary[600] },
});

export default SectionHeader;
