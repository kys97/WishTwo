import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppCard } from '../../../components';
import { colors, spacing, typography } from '../../../theme';
import type { DatePickerFieldProps } from './DatePickerField';

export function DatePickerField({
  value,
  onChange,
  label = '실행 예정 날짜',
  minimumDate,
}: DatePickerFieldProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pickerValue = value ?? minimumDate ?? new Date();
  const displayDate = value ? formatDate(value) : '날짜를 선택해 주세요';

  const handleChange = (event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') setIsOpen(false);
    if (event.type === 'set' && date) onChange(date);
  };

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <AppCard accessibilityLabel={`${label}, ${displayDate}`}>
        <Pressable
          accessibilityHint="날짜 선택기를 엽니다."
          accessibilityLabel={`${label} 선택, 현재 ${displayDate}`}
          accessibilityRole="button"
          onPress={() => setIsOpen(true)}
          style={({ pressed }) => [styles.trigger, pressed && styles.pressed]}
        >
          <Ionicons
            accessibilityElementsHidden
            color={colors.primary}
            importantForAccessibility="no-hide-descendants"
            name="calendar-outline"
            size={20}
          />
          <Text style={[styles.value, !value && styles.placeholder]}>{displayDate}</Text>
          <Ionicons
            accessibilityElementsHidden
            color={colors.textMuted}
            importantForAccessibility="no-hide-descendants"
            name="chevron-down"
            size={18}
          />
        </Pressable>
        {isOpen ? (
          <DateTimePicker
            display="default"
            minimumDate={minimumDate}
            mode="date"
            onChange={handleChange}
            value={pickerValue}
          />
        ) : null}
      </AppCard>
    </View>
  );
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  }).format(date);
}

const styles = StyleSheet.create({
  field: { gap: spacing.sm },
  label: { ...typography.headline, color: colors.textPrimary },
  trigger: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  pressed: { opacity: 0.8 },
  value: { ...typography.bodyMedium, flex: 1, color: colors.textPrimary },
  placeholder: { color: colors.textMuted },
});
