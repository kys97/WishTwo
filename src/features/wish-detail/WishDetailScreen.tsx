import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppCard, PremiumBadge, ScreenContainer } from '../../components';
import { colors, radius, spacing, typography } from '../../theme';
import { wishStatusLabels, type ReceivedWish } from '../../types/wish';
import { useWishData } from '../wishes';

export function WishDetailScreen() {
  const router = useRouter();
  const { id: idParam } = useLocalSearchParams<{ id?: string | string[] }>();
  const id = Array.isArray(idParam) ? idParam[0] : idParam;
  const { loading, wishes } = useWishData();
  const wish = wishes.find((item) => item.id === id);

  return (
    <ScreenContainer
      edges={['top', 'bottom', 'left', 'right']}
      scroll
      contentContainerStyle={styles.container}
    >
      <View style={styles.header}>
        <Pressable
          accessibilityLabel="홈 화면으로 돌아가기"
          accessibilityRole="button"
          hitSlop={spacing.sm}
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
        >
          <Ionicons
            accessibilityElementsHidden
            color={colors.textPrimary}
            importantForAccessibility="no-hide-descendants"
            name="arrow-back"
            size={24}
          />
        </Pressable>
        <Text accessibilityRole="header" style={styles.title}>
          소원 상세
        </Text>
      </View>

      {wish ? (
        <AppCard
          accessible
          accessibilityLabel={buildAccessibilityLabel(wish)}
          elevated
          style={styles.detailCard}
        >
          <View style={styles.cardHeader}>
            <View
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
              style={styles.iconContainer}
            >
              <Ionicons color={colors.primary} name="mail-open" size={28} />
            </View>
            <View style={styles.headerCopy}>
              <Text style={styles.eyebrow}>상대가 소원을 요청했습니다.</Text>
              <Text style={styles.sender}>{wish.sender.name}님이 보낸 소원</Text>
            </View>
            {wish.ticketType === 'premium' ? <PremiumBadge /> : null}
          </View>

          <View style={styles.divider} />

          <DetailRow label="보낸 사람" value={wish.sender.name} />
          <DetailRow
            label="소원권 종류"
            value={wish.ticketType === 'premium' ? 'Premium 소원권' : '일반 소원권'}
          />

          <View style={styles.wishSection}>
            <Text style={styles.label}>소원 내용</Text>
            <Text style={styles.wishContent}>{wish.content}</Text>
          </View>

          <DetailRow label="보낸 날짜" value={formatDateTime(wish.sentAt)} />
          <DetailRow label="실행 예정 날짜" value={formatDate(wish.scheduledFor)} />
          <View style={styles.detailRow}>
            <Text style={styles.label}>현재 상태</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>{wishStatusLabels[wish.status]}</Text>
            </View>
          </View>
        </AppCard>
      ) : loading ? (
        <AppCard accessible accessibilityLabel="소원 정보를 불러오고 있습니다.">
          <Text style={styles.emptyText}>소원 정보를 불러오고 있어요.</Text>
        </AppCard>
      ) : (
        <AppCard accessible accessibilityLabel="소원 정보를 찾을 수 없습니다.">
          <Text style={styles.emptyText}>소원 정보를 찾을 수 없습니다.</Text>
        </AppCard>
      )}
    </ScreenContainer>
  );
}

interface DetailRowProps {
  label: string;
  value: string;
}

function DetailRow({ label, value }: DetailRowProps) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

function parseLocalDate(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day, 12);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  }).format(parseLocalDate(value));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(value));
}

function buildAccessibilityLabel(wish: ReceivedWish) {
  const ticketLabel = wish.ticketType === 'premium' ? 'Premium 소원권' : '일반 소원권';
  return `${wish.sender.name}님이 보낸 ${ticketLabel}. 소원 내용, ${wish.content}. 보낸 날짜 ${formatDateTime(wish.sentAt)}. 실행 예정 날짜 ${formatDate(wish.scheduledFor)}. 현재 상태 ${wishStatusLabels[wish.status]}.`;
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  header: {
    minHeight: 39,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  backButton: {
    width: 32,
    height: 39,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.6 },
  title: { ...typography.title1, color: colors.textPrimary },
  detailCard: { gap: spacing.lg, padding: spacing.lg },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCopy: { flex: 1, gap: spacing.xxs },
  eyebrow: { ...typography.caption, color: colors.primary },
  sender: { ...typography.title3, color: colors.textPrimary },
  divider: { height: 1, backgroundColor: colors.border },
  detailRow: { gap: spacing.xs },
  label: { ...typography.caption, color: colors.textSecondary },
  value: { ...typography.bodyMedium, color: colors.textPrimary },
  wishSection: {
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
  },
  wishContent: { ...typography.title3, color: colors.textPrimary },
  statusBadge: {
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
  },
  statusText: { ...typography.bodyMedium, color: colors.primary },
  emptyText: { ...typography.bodyMedium, color: colors.textSecondary },
});
