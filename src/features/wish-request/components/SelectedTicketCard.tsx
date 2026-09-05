import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { AppCard, PremiumBadge } from '../../../components';
import { colors, spacing, typography } from '../../../theme';
import type { OwnedWishTicket } from '../../wishes';

export interface SelectedTicketCardProps {
  ticket: OwnedWishTicket;
}

export function SelectedTicketCard({ ticket }: SelectedTicketCardProps) {
  const isPremium = ticket.type === 'premium';
  const title = isPremium ? 'Premium 소원권' : '일반 소원권';

  return (
    <AppCard
      accessible
      accessibilityLabel={`선택한 소원권, ${title}`}
      style={isPremium && styles.premiumCard}
    >
      <View style={styles.row}>
        <View
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={styles.icon}
        >
          <Ionicons
            color={isPremium ? colors.premium : colors.textSecondary}
            name={isPremium ? 'diamond-outline' : 'ticket-outline'}
            size={28}
          />
        </View>
        <View style={styles.copy}>
          <Text style={styles.label}>사용할 소원권</Text>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{title}</Text>
            {isPremium ? <PremiumBadge /> : null}
          </View>
        </View>
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  premiumCard: {
    backgroundColor: colors.premiumBackground,
    borderColor: colors.premium,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  icon: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    gap: spacing.xxs,
  },
  label: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  title: {
    ...typography.headline,
    color: colors.textPrimary,
  },
});
