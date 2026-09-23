import { FEEDBACK_MAX_RATING, FEEDBACK_RATING_LABELS } from '@educard/shared';
import { Star } from 'lucide-react-native';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface StarRatingProps {
  value: number;
  onChange?: (rating: number) => void;
  size?: number;
  readOnly?: boolean;
  showLabel?: boolean;
}

const STARS = Array.from({ length: FEEDBACK_MAX_RATING }, (_, i) => i + 1);

export function StarRating({
  value,
  onChange,
  size = 40,
  readOnly = false,
  showLabel = true,
}: StarRatingProps) {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {STARS.map(star => {
          const filled = star <= value;
          return (
            <TouchableOpacity
              key={star}
              disabled={readOnly}
              activeOpacity={0.7}
              accessibilityRole="radio"
              accessibilityState={{ selected: star === value }}
              accessibilityLabel={`${star} star${star > 1 ? 's' : ''}`}
              onPress={() => onChange?.(star)}
              style={styles.star}
            >
              <Star
                size={size}
                strokeWidth={1.5}
                color={filled ? '#f59e0b' : '#cbd5e1'}
                fill={filled ? '#fbbf24' : 'transparent'}
              />
            </TouchableOpacity>
          );
        })}
      </View>

      {showLabel && (
        <Text style={styles.label}>
          {value ? FEEDBACK_RATING_LABELS[value] : 'Tap a star to rate'}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: 8 },
  row: { flexDirection: 'row', gap: 6 },
  star: { padding: 2 },
  label: { fontSize: 14, fontWeight: '600', color: '#475569' },
});
