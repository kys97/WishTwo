import { StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback } from 'react';

import { ScreenContainer } from '../../components';
import { colors, spacing, typography } from '../../theme';
import { CurrentWishRequestCard } from './components/CurrentWishRequestCard';
import { WishBalanceCard } from './components/WishBalanceCard';
import { useAuth } from '../auth';
import { useWishData } from '../wishes';
import type { CoupleMemberSummary } from './types';

export function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { balances, errorMessage, loading, refresh, wishes } = useWishData();
  useFocusEffect(useCallback(() => {
    const timeout = setTimeout(() => void refresh(), 0);
    return () => clearTimeout(timeout);
  }, [refresh]));
  const currentRequest = wishes
    .filter((wish) => wish.recipientId === user?.id && wish.status !== 'completed')
    .sort((a, b) => a.scheduledFor.localeCompare(b.scheduledFor))[0] ?? null;
  const myBalance = balances.find((item) => item.userId === user?.id);
  const partnerBalance = balances.find((item) => item.userId === user?.partner?.id);
  const members: CoupleMemberSummary[] = user?.partner
    ? [
        { id: 'me', displayLabel: '나', name: user.name, tickets: { standard: myBalance?.normal ?? 0, premium: myBalance?.premium ?? 0 } },
        { id: 'partner', displayLabel: '상대방', name: user.partner.name, tickets: { standard: partnerBalance?.normal ?? 0, premium: partnerBalance?.premium ?? 0 } },
      ]
    : [];

  return (
    <ScreenContainer
      edges={['top', 'left', 'right']}
      scroll
      contentContainerStyle={styles.container}
    >
      <Text accessibilityRole="header" style={styles.title}>
        우리 소원권
      </Text>

      <View accessibilityRole="summary" style={styles.balanceSection}>
        <Text style={styles.sectionTitle}>서로 보유한 소원권</Text>
        <View style={styles.balanceRow}>
          {members.map((member) => (
            <WishBalanceCard key={member.id} member={member} />
          ))}
        </View>
      </View>

      <View accessibilityRole="summary" style={styles.requestSection}>
        <Text style={styles.sectionTitle}>현재 요청된 소원</Text>
        <CurrentWishRequestCard
          onPress={
            currentRequest
              ? () =>
                  router.push({
                    pathname: '/wish-detail/[id]',
                    params: { id: currentRequest.id },
                  })
              : undefined
          }
          request={currentRequest}
        />
      </View>
      {loading ? <Text style={styles.message}>소원 정보를 불러오고 있어요.</Text> : null}
      {errorMessage ? <Text accessibilityLiveRegion="polite" style={styles.message}>{errorMessage}</Text> : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  title: {
    ...typography.display,
    color: colors.textPrimary,
  },
  balanceSection: {
    marginTop: spacing.xxl,
    gap: spacing.sm,
  },
  requestSection: {
    marginTop: spacing.section,
    gap: spacing.sm,
  },
  sectionTitle: {
    ...typography.headline,
    color: colors.textPrimary,
  },
  balanceRow: {
    flexDirection: 'row',
    gap: spacing.cardGap,
  },
  message: { ...typography.body, color: colors.textSecondary, marginTop: spacing.sm },
});
