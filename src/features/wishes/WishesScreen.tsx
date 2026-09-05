import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ScreenContainer } from '../../components';
import { colors, spacing, typography } from '../../theme';
import { EmptyWishTickets } from './components/EmptyWishTickets';
import { OwnedWishTicketCard } from './components/OwnedWishTicketCard';
import { WishTicketSummary } from './components/WishTicketSummary';
import { useWishData } from './WishDataProvider';
import type { OwnedWishTicket } from './types';

export function WishesScreen() {
  const router = useRouter();
  const { errorMessage, loading, ownedTickets, refresh } = useWishData();
  useFocusEffect(useCallback(() => {
    const timeout = setTimeout(() => void refresh(), 0);
    return () => clearTimeout(timeout);
  }, [refresh]));
  const visibleTickets = ownedTickets.filter((ticket) => ticket.owned);
  const normalCount = ownedTickets.find((ticket) => ticket.type === 'normal')?.quantity ?? 0;
  const premiumCount = ownedTickets.find((ticket) => ticket.type === 'premium')?.quantity ?? 0;

  const handleUseTicket = (ticket: OwnedWishTicket) => {
    router.push({
      pathname: '/wish-request',
      params: {
        ticketId: ticket.id,
        ticketType: ticket.type,
      },
    });
  };

  return (
    <ScreenContainer
      edges={['top', 'left', 'right']}
      scroll
      contentContainerStyle={styles.container}
    >
      <Text accessibilityRole="header" style={styles.title}>
        내 소원권
      </Text>

      <View accessibilityRole="summary" style={styles.summarySection}>
        <Text style={styles.sectionTitle}>보유 소원권</Text>
        <WishTicketSummary normalCount={normalCount} premiumCount={premiumCount} />
      </View>

      <View accessibilityRole="summary" style={styles.listSection}>
        <Text style={styles.sectionTitle}>소원권 목록</Text>
        {errorMessage ? <Text accessibilityLiveRegion="polite" style={styles.message}>{errorMessage}</Text> : null}
        {loading && visibleTickets.length === 0 ? (
          <Text style={styles.message}>소원권을 불러오고 있어요.</Text>
        ) : visibleTickets.length > 0 ? (
          <View style={styles.list}>
            {visibleTickets.map((ticket) => (
              <OwnedWishTicketCard key={ticket.id} onUse={handleUseTicket} ticket={ticket} />
            ))}
          </View>
        ) : (
          <EmptyWishTickets />
        )}
      </View>
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
  summarySection: {
    marginTop: spacing.xxl,
    gap: spacing.sm,
  },
  listSection: {
    marginTop: spacing.section,
    gap: spacing.sm,
  },
  sectionTitle: {
    ...typography.headline,
    color: colors.textPrimary,
  },
  list: {
    gap: spacing.sm,
  },
  message: { ...typography.body, color: colors.textSecondary },
});
