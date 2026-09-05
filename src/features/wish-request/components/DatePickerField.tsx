import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { AppCard } from '../../../components';
import { colors, radius, spacing, typography } from '../../../theme';

export interface DatePickerFieldProps {
  value: Date | null;
  onChange: (date: Date) => void;
  label?: string;
  minimumDate?: Date;
}

export function DatePickerField({
  value,
  onChange,
  label = '실행 예정 날짜',
  minimumDate,
}: DatePickerFieldProps) {
  const displayDate = value ? formatDate(value) : '날짜를 선택해 주세요';

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <AppCard accessibilityLabel={`${label}, ${displayDate}`}>
        <View style={styles.row}>
          <Ionicons
            accessibilityElementsHidden
            color={colors.primary}
            importantForAccessibility="no-hide-descendants"
            name="calendar-outline"
            size={20}
          />
          <Text style={[styles.value, !value && styles.placeholder]}>{displayDate}</Text>
          <input
            aria-label={`${label} 선택`}
            min={minimumDate ? toLocalIsoDate(minimumDate) : undefined}
            onInput={(event) => {
              if (!event.currentTarget.value) return;
              onChange(fromLocalIsoDate(event.currentTarget.value));
            }}
            style={webInputStyle}
            type="date"
            value={value ? toLocalIsoDate(value) : ''}
          />
        </View>
      </AppCard>
    </View>
  );
}

function toLocalIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function fromLocalIsoDate(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day, 12);
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  }).format(date);
}

const webInputStyle = {
  border: 0,
  borderRadius: radius.sm,
  color: colors.textPrimary,
  backgroundColor: colors.surfaceMuted,
  fontSize: 16,
  padding: spacing.sm,
} as const;

const styles = StyleSheet.create({
  field: { gap: spacing.sm },
  label: { ...typography.headline, color: colors.textPrimary },
  row: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  value: { ...typography.bodyMedium, flex: 1, color: colors.textPrimary },
  placeholder: { color: colors.textMuted },
});
