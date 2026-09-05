import { StyleSheet, Text, View } from 'react-native';

import { AppCard, PremiumBadge } from '../../../components';
import { colors, spacing, typography } from '../../../theme';

export interface WishTicketSummaryProps {
  normalCount: number;
  premiumCount: number;
}

export function WishTicketSummary({ normalCount, premiumCount }: WishTicketSummaryProps) {
  return (
    <AppCard
      accessible
      accessibilityLabel={`보유 소원권, 일반 ${normalCount}장, Premium ${premiumCount}장`}
      style={styles.card}
    >
      <View style={styles.item}>
        <Text style={styles.label}>일반 소원권</Text>
        <Text style={styles.count}>{normalCount}장</Text>
      </View>
      <View style={styles.divider} />
      <View style={styles.item}>
        <PremiumBadge />
        <Text style={styles.count}>{premiumCount}장</Text>
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 126,
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  item: {
    flex: 1,
    justifyContent: 'space-between',
  },
  divider: {
    width: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.md,
  },
  label: {
    ...typography.body,
    color: colors.textPrimary,
  },
  count: {
    ...typography.title1,
    color: colors.textPrimary,
  },
});
