import { StyleSheet, Text } from 'react-native';

import { AppCard } from '../../../components';
import { colors, spacing, typography } from '../../../theme';
import type { CoupleMemberSummary } from '../types';

export interface WishBalanceCardProps {
  member: CoupleMemberSummary;
}

export function WishBalanceCard({ member }: WishBalanceCardProps) {
  const total = member.tickets.standard + member.tickets.premium;

  return (
    <AppCard
      accessible
      accessibilityLabel={`${member.displayLabel}, 보유한 소원권 ${total}장`}
      style={styles.card}
    >
      <Text style={styles.label}>{member.displayLabel}</Text>
      <Text style={styles.count}>{total}장</Text>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minHeight: 126,
  },
  label: {
    ...typography.body,
    color: colors.textPrimary,
  },
  count: {
    ...typography.display,
    color: colors.textPrimary,
    marginTop: spacing.cardGap,
  },
});
