import Ionicons from '@expo/vector-icons/Ionicons';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppCard } from '../../../components';
import { colors, radius, spacing, typography } from '../../../theme';
import type { MemoryRecord } from '../types';

interface MemoryRecordCardProps {
  memory: MemoryRecord;
  onPress: (memory: MemoryRecord) => void;
}

export function MemoryRecordCard({ memory, onPress }: MemoryRecordCardProps) {
  return (
    <Pressable
      accessibilityHint="추억 상세 화면으로 이동합니다."
      accessibilityLabel={`${formatDate(memory.date)}, ${memory.title}. 사진 설명 ${memory.photoDescription}. ${memory.summary}`}
      accessibilityRole="button"
      onPress={() => onPress(memory)}
      style={({ pressed }) => pressed && styles.pressed}
    >
      <AppCard accessible={false} padded={false} style={styles.card}>
        <Image
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          resizeMode="cover"
          source={{ uri: memory.photoUrl }}
          style={styles.photo}
        />
        <View style={styles.copy}>
          <View style={styles.dateRow}>
            <Ionicons
              accessibilityElementsHidden
              color={colors.textSecondary}
              importantForAccessibility="no-hide-descendants"
              name="calendar-outline"
              size={16}
            />
            <Text style={styles.date}>{formatDate(memory.date)}</Text>
          </View>
          <Text numberOfLines={1} style={styles.title}>
            {memory.title}
          </Text>
          <Text numberOfLines={2} style={styles.summary}>
            {memory.summary}
          </Text>
        </View>
      </AppCard>
    </Pressable>
  );
}

function formatDate(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(year, month - 1, day, 12));
}

const styles = StyleSheet.create({
  card: { overflow: 'hidden' },
  photo: { width: '100%', aspectRatio: 16 / 9, backgroundColor: colors.surfaceMuted },
  copy: { gap: spacing.xs, padding: spacing.md },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  date: { ...typography.caption, color: colors.textSecondary },
  title: { ...typography.title3, color: colors.textPrimary },
  summary: { ...typography.body, color: colors.textSecondary },
  pressed: { opacity: 0.8, borderRadius: radius.card },
});
