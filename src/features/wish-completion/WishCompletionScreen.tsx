import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppButton, AppCard, PremiumBadge, ScreenContainer } from '../../components';
import { colors, radius, spacing, typography } from '../../theme';
import { useAuth } from '../auth';
import { useWishData } from '../wishes';

export function WishCompletionScreen() {
  const router = useRouter();
  const { id: idParam } = useLocalSearchParams<{ id?: string | string[] }>();
  const id = Array.isArray(idParam) ? idParam[0] : idParam;
  const { user } = useAuth();
  const { completeWish, loading, wishes } = useWishData();
  const wish = wishes.find((item) => item.id === id);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const isRequester = wish?.sender.id === user?.id;
  const canConfirm = isRequester && wish?.status === 'awaitingConfirmation';

  const handleComplete = async () => {
    if (!wish) return;
    setSubmitting(true);
    setErrorMessage('');
    try {
      await completeWish(wish.id);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '완료 상태를 변경하지 못했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScreenContainer
      edges={['top', 'bottom', 'left', 'right']}
      scroll
      contentContainerStyle={styles.container}
    >
      <View style={styles.header}>
        <Pressable
          accessibilityLabel="이전 화면으로 돌아가기"
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
          소원 완료 확인
        </Text>
      </View>

      {!wish && loading ? (
        <MessageCard message="소원 정보를 불러오고 있어요." />
      ) : !wish ? (
        <MessageCard message="확인할 소원 정보를 찾을 수 없습니다." />
      ) : !isRequester ? (
        <MessageCard message="소원권을 사용한 사람만 완료 여부를 확인할 수 있어요." />
      ) : wish.status === 'completed' ? (
        <AppCard
          accessible
          accessibilityLabel={`완료된 소원이에요. 소원 내용 ${wish.content}. 실행 날짜 ${formatDate(wish.scheduledFor)}.`}
          elevated
          style={styles.completedCard}
        >
          <View
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={styles.completedIcon}
          >
            <Ionicons color={colors.primary} name="checkmark-circle" size={42} />
          </View>
          <Text style={styles.completedTitle}>완료된 소원이에요.</Text>
          <Text style={styles.completedWish}>{wish.content}</Text>
          <Text style={styles.date}>실행 날짜 {formatDate(wish.scheduledFor)}</Text>
        </AppCard>
      ) : canConfirm ? (
        <>
          <Text accessibilityRole="header" style={styles.question}>
            상대방이 오늘 소원을 들어주었나요?
          </Text>

          <AppCard
            accessible
            accessibilityLabel={`${wish.ticketType === 'premium' ? 'Premium 소원권. ' : ''}소원 내용 ${wish.content}. 실행 날짜 ${formatDate(wish.scheduledFor)}.`}
            elevated
            style={styles.wishCard}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.cardLabel}>확인할 소원</Text>
              {wish.ticketType === 'premium' ? <PremiumBadge /> : null}
            </View>
            <Text style={styles.wishContent}>{wish.content}</Text>
            <View style={styles.dateRow}>
              <Ionicons
                accessibilityElementsHidden
                color={colors.textSecondary}
                importantForAccessibility="no-hide-descendants"
                name="calendar-outline"
                size={18}
              />
              <Text style={styles.date}>실행 날짜 {formatDate(wish.scheduledFor)}</Text>
            </View>
          </AppCard>

          <View accessibilityLabel="소원 완료 여부 선택" style={styles.actions}>
            <AppButton
              accessibilityHint="소원 상태를 완료로 변경합니다."
              accessibilityLabel="들어줬어요"
              loading={submitting}
              onPress={handleComplete}
            >
              들어줬어요
            </AppButton>
            <AppButton
              accessibilityHint="완료 대기 상태를 그대로 유지합니다."
              accessibilityLabel="아직이에요"
              disabled={submitting}
              onPress={() => router.back()}
              variant="secondary"
            >
              아직이에요
            </AppButton>
          </View>
          {errorMessage ? <Text accessibilityLiveRegion="polite" style={styles.error}>{errorMessage}</Text> : null}
        </>
      ) : (
        <MessageCard message="현재 완료 여부를 확인할 수 있는 상태가 아닙니다." />
      )}
    </ScreenContainer>
  );
}

function MessageCard({ message }: { message: string }) {
  return (
    <AppCard accessible accessibilityLabel={message} style={styles.messageCard}>
      <Text style={styles.messageText}>{message}</Text>
    </AppCard>
  );
}

function formatDate(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  }).format(new Date(year, month - 1, day, 12));
}

const styles = StyleSheet.create({
  container: { gap: spacing.xl, paddingTop: spacing.sm, paddingBottom: spacing.xxl },
  header: { minHeight: 39, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  backButton: { width: 32, height: 39, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.6 },
  title: { ...typography.title1, color: colors.textPrimary },
  question: { ...typography.title2, color: colors.textPrimary },
  wishCard: { gap: spacing.lg, padding: spacing.lg },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardLabel: { ...typography.bodyMedium, color: colors.primary },
  wishContent: { ...typography.title3, color: colors.textPrimary },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  date: { ...typography.body, color: colors.textSecondary },
  actions: { gap: spacing.sm },
  completedCard: { alignItems: 'center', gap: spacing.sm, padding: spacing.xl },
  completedIcon: {
    width: 56,
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedTitle: { ...typography.title2, color: colors.textPrimary },
  completedWish: { ...typography.bodyMedium, color: colors.textPrimary, textAlign: 'center' },
  messageCard: { padding: spacing.lg },
  messageText: { ...typography.bodyMedium, color: colors.textSecondary },
  error: { ...typography.caption, color: colors.danger },
});
