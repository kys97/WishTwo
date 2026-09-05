import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppCard } from '../../../components';
import { colors, spacing, typography } from '../../../theme';
import type { ReceivedWish } from '../../../types/wish';

export interface CurrentWishRequestCardProps {
  request: ReceivedWish | null;
  onPress?: () => void;
}

export function CurrentWishRequestCard({ request, onPress }: CurrentWishRequestCardProps) {
  if (!request) {
    return (
      <AppCard
        accessible
        accessibilityLabel="현재 요청된 소원이 없습니다."
        padded={false}
        style={styles.emptyCard}
      >
        <View
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={styles.iconContainer}
        >
          <Ionicons color={colors.primary} name="mail-outline" size={26} />
        </View>
        <View style={styles.emptyCopy}>
          <Text style={styles.status}>현재 요청된 소원이 없어요</Text>
          <Text style={styles.description}>새 요청이 오면 가장 가까운 일정만 보여드려요.</Text>
        </View>
      </AppCard>
    );
  }

  const scheduledDate = formatScheduledDate(request.scheduledFor);
  const ticketLabel = request.ticketType === 'premium' ? 'Premium 소원권' : '일반 소원권';

  return (
    <Pressable
      accessibilityHint="소원 상세 화면으로 이동합니다."
      accessibilityLabel={`상대가 소원을 요청했습니다. 실행 예정 날짜 ${scheduledDate}, ${request.content}, ${ticketLabel}`}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => pressed && styles.pressed}
    >
      <AppCard accessible={false} padded={false} style={styles.requestCard}>
        <View style={styles.statusRow}>
          <View
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={styles.iconContainer}
          >
            <Ionicons color={colors.primary} name="mail" size={26} />
          </View>
          <Text style={styles.status}>상대가 소원을 요청했습니다.</Text>
        </View>
        <Text style={styles.date}>실행 예정 {scheduledDate}</Text>
        <Text style={styles.wish}>{request.content}</Text>
        <Text style={styles.meta}>상세 보기</Text>
      </AppCard>
    </Pressable>
  );
}

function formatScheduledDate(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  return new Intl.DateTimeFormat('ko-KR', { month: 'long', day: 'numeric' }).format(
    new Date(year, month - 1, day, 12),
  );
}

const styles = StyleSheet.create({
  requestCard: {
    minHeight: 168,
    padding: spacing.cardContent,
  },
  emptyCard: {
    minHeight: 122,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  iconContainer: {
    width: 26,
    height: 27,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  status: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
    flexShrink: 1,
  },
  description: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  date: {
    ...typography.body,
    color: colors.textPrimary,
    marginTop: spacing.sm,
  },
  wish: {
    ...typography.title3,
    color: colors.textPrimary,
    marginTop: spacing.xxs,
  },
  meta: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  pressed: {
    opacity: 0.8,
  },
});
